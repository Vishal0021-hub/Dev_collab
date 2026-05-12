const axios  = require("axios");
const Task   = require("../models/Task");
const Board  = require("../models/Board");
const User   = require("../models/User");
const Project    = require("../models/Project");
const Workspace  = require("../models/workspace");
const Comment    = require("../models/Message");   // re-use Message for task comments if exists
const { logActivity } = require("../utils/activityLogger");
const { getIO }       = require("../socket");
const { decrypt }     = require("../utils/encryption");

const emitToWs = (workspaceId, event, payload) => {
  try { getIO().to(`ws:${workspaceId}`).emit(event, payload); } catch {}
};

/* ── GitHub API helper ──────────────────────────────────────── */
const GH_HEADERS = (token) => ({
  Authorization: `Bearer ${token}`,
  "User-Agent":  "DevSpace",
  Accept:        "application/vnd.github+json",
});

/* ── Slugify for branch names ───────────────────────────────── */
function slugify(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
}

/* ── Resolve workspaceId from task ──────────────────────────── */
async function getWorkspaceForTask(task) {
  const board = await Board.findById(task.board).populate("project");
  if (!board?.project) return null;
  return {
    workspaceId: board.project.workspace?.toString(),
    board,
  };
}

/* ── Auto-branch creation (Item 3) ─────────────────────────── */
async function tryCreateBranch(task, req, workspaceId) {
  try {
    const user = await User.findById(req.user._id).select("github");
    if (!user?.github?.accessToken) return;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace?.github?.repoOwner) return;

    const token  = decrypt(user.github.accessToken, user.github.tokenIv);
    const owner  = workspace.github.repoOwner;
    const repo   = workspace.github.repoName;
    const base   = workspace.github.defaultBranch || "main";
    const branchName = `feature/task-${task._id.toString().slice(-6)}-${slugify(task.title)}`;

    // Get base branch SHA
    const refRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${base}`,
      { headers: GH_HEADERS(token) }
    );
    const headSha = refRes.data.object.sha;

    // Create branch
    await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/git/refs`,
      { ref: `refs/heads/${branchName}`, sha: headSha },
      { headers: GH_HEADERS(token) }
    );

    const branchUrl = `https://github.com/${owner}/${repo}/tree/${branchName}`;

    task.github = task.github || {};
    task.github.branch          = branchName;
    task.github.branchUrl       = branchUrl;
    task.github.branchCreatedAt = new Date();
    await task.save();

    await logActivity(
      workspaceId,
      req.user._id,
      "github_branch_created",
      { branch: branchName },
      { entityType: "task", entityId: task._id }
    );

    emitToWs(workspaceId, "github:sync", {
      taskId:    task._id.toString(),
      github:    task.github,
    });

    console.log(`[GitHub] Branch created: ${branchName}`);
  } catch (err) {
    // Non-fatal — just warn
    console.warn("[GitHub] Branch creation failed (non-fatal):", err.response?.data?.message || err.message);
  }
}

/* ── Auto-PR creation (Item 5) ─────────────────────────────── */
async function tryOpenPR(task, req, workspaceId) {
  try {
    const user = await User.findById(req.user._id).select("github");
    if (!user?.github?.accessToken) return;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace?.github?.repoOwner) return;

    const token  = decrypt(user.github.accessToken, user.github.tokenIv);
    const owner  = workspace.github.repoOwner;
    const repo   = workspace.github.repoName;
    const base   = workspace.github.defaultBranch || "main";

    const prRes = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/pulls`,
      {
        title: task.title,
        body:  `## ${task.title}\n\n${task.description || ""}\n\n---\n*Auto-created by DevSpace*`,
        head:  task.github.branch,
        base,
      },
      { headers: GH_HEADERS(token) }
    );

    const pr = prRes.data;
    task.github.pr = {
      number:   pr.number,
      title:    pr.title,
      url:      pr.html_url,
      state:    "open",
      openedAt: new Date(),
    };
    await task.save();

    await logActivity(
      workspaceId,
      req.user._id,
      "github_pr_opened",
      { prNumber: pr.number, prUrl: pr.html_url },
      { entityType: "task", entityId: task._id }
    );

    emitToWs(workspaceId, "github:sync", {
      taskId: task._id.toString(),
      github: task.github,
    });

    console.log(`[GitHub] PR opened: #${pr.number}`);
  } catch (err) {
    console.warn("[GitHub] PR creation failed (non-fatal):", err.response?.data?.message || err.message);
  }
}

/* ═══════════════════════════════════════════════════════════════
   TASK CRUD
   ═══════════════════════════════════════════════════════════════ */

// Create Task
exports.createTask = async (req, res) => {
  try {
    console.log("Create Task Request:", req.body);
    const { title, description, boardId, priority, dueDate } = req.body;

    const board = await Board.findById(boardId).populate("project");

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    const task = await Task.create({
      title,
      description,
      board: boardId,
      priority,
      dueDate,
      createdBy: req.user._id,
    });

    // Log Activity
    const workspaceId = board.project?.workspace?._id || board.project?.workspace || board.project?._id;

    if (workspaceId) {
      await logActivity(workspaceId, req.user._id, "task_created", {
        taskTitle: title,
        projectName: board.project?.name || "Project",
      }, { entityType: "task", entityId: task._id });

      emitToWs(workspaceId, "task:created", { task: task.toObject(), boardId });
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Tasks by Board
exports.getTasks = async (req, res) => {
  try {
    const boardId = req.params.boardId;
    const tasks = await Task.find({ board: boardId }).populate("assignedTo", "name email avatar");
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Task
exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    Object.assign(task, updates);
    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Move Task to another Board
exports.moveTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { boardId } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const oldBoard = await Board.findById(task.board);
    const newBoard = await Board.findById(boardId).populate("project");

    task.board = boardId;
    await task.save();

    await logActivity(newBoard.project.workspace, req.user._id, "task_moved", {
      taskTitle: task.title,
      fromBoard: oldBoard.name,
      toBoard:   newBoard.name,
    }, { entityType: "task", entityId: task._id });

    emitToWs(newBoard.project.workspace, "task:moved", {
      taskId,
      fromBoardId: oldBoard._id.toString(),
      toBoardId:   boardId,
      task:        task.toObject(),
    });

    res.json({ message: "Task moved successfully", task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Task
exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId).populate({ path: "board", populate: { path: "project" } });
    if (!task) return res.status(404).json({ message: "Task not found" });

    const workspaceId = task.board.project.workspace;
    const taskTitle   = task.title;

    await Task.findByIdAndDelete(taskId);

    await logActivity(workspaceId, req.user._id, "task_deleted", { taskTitle },
      { entityType: "task", entityId: taskId });

    emitToWs(workspaceId, "task:deleted", { taskId });

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign Task
exports.assignTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const board = await Board.findById(task.board).populate("project");
    if (!board) return res.status(404).json({ message: "Board not found" });

    if (userId) {
      const workspace = req.workspace;
      const isMemberOfWs = workspace.members.some(m => m.userId.toString() === userId.toString());
      if (!isMemberOfWs) {
        return res.status(400).json({ message: "Assignee must be a workspace member" });
      }
    }

    task.assignedTo = userId || null;
    await task.save();

    if (userId) {
      const assignedUser = await User.findById(userId);
      await logActivity(board.project.workspace, req.user._id, "task_assigned", {
        taskTitle: task.title,
        assignedToName: assignedUser?.name || "",
      }, { entityType: "task", entityId: task._id });
    }

    const populated = await Task.findById(taskId).populate("assignedTo", "name email avatar");

    emitToWs(board.project.workspace, "task:assigned", {
      taskId,
      task: populated.toObject(),
    });

    res.json({ message: "Task assigned", task: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── Update Task Status — PATCH /api/tasks/:taskId/status ───── */
exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const validStatuses = ["todo", "inprogress", "review", "done"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const oldStatus = task.status;
    task.status = status;
    await task.save();

    const { workspaceId } = await getWorkspaceForTask(task) || {};

    if (workspaceId) {
      await logActivity(workspaceId, req.user._id, "task_status_changed", {
        taskTitle: task.title,
        oldStatus,
        newStatus: status,
      }, { entityType: "task", entityId: task._id });

      emitToWs(workspaceId, "task:statusChanged", {
        taskId,
        boardId: task.board.toString(),
        status,
        oldStatus,
      });

      /* ── Item 3: Auto-create branch on inprogress ── */
      if (status === "inprogress" && !task.github?.branch) {
        setImmediate(() => tryCreateBranch(task, req, workspaceId));
      }

      /* ── Item 5: Auto-open PR on done ── */
      if (status === "done" && task.github?.branch && !task.github?.pr?.number) {
        setImmediate(() => tryOpenPR(task, req, workspaceId));
      }
    }

    res.json({ message: "Task status updated", task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
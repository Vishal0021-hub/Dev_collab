const Task  = require("../models/Task");
const Board = require("../models/Board");
const User  = require("../models/User");
const { logActivity } = require("../utils/activityLogger");
const { getIO } = require("../socket");

const emitToWs = (workspaceId, event, payload) => {
  try { getIO().to(`ws:${workspaceId}`).emit(event, payload); } catch {}
};

// Create Task
exports.createTask = async (req, res) => {
  try {
    console.log("Create Task Request:", req.body);
    const { title, description, boardId, priority, dueDate } = req.body;

    const board = await Board.findById(boardId).populate('project');

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    const task = await Task.create({
      title,
      description,
      board: boardId,
      priority,
      dueDate,
      createdBy: req.user._id
    });

    // Log Activity
    const workspaceId = board.project?.workspace?._id || board.project?.workspace || board.project?._id;

    if (workspaceId) {
      await logActivity(workspaceId, req.user._id, "task_created", {
        taskTitle: title,
        projectName: board.project?.name || "Project"
      }, { entityType: "task", entityId: task._id });

      // Real-time
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
    const newBoard = await Board.findById(boardId).populate('project');

    task.board = boardId;
    await task.save();

    await logActivity(newBoard.project.workspace, req.user._id, "task_moved", {
      taskTitle: task.title,
      fromBoard: oldBoard.name,
      toBoard:   newBoard.name
    }, { entityType: "task", entityId: task._id });

    // Real-time
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
    const task = await Task.findById(taskId).populate({ path: 'board', populate: { path: 'project' } });
    if (!task) return res.status(404).json({ message: "Task not found" });

    const workspaceId = task.board.project.workspace;
    const taskTitle = task.title;

    await Task.findByIdAndDelete(taskId);

    await logActivity(workspaceId, req.user._id, "task_deleted", { taskTitle },
      { entityType: "task", entityId: taskId });

    // Real-time
    emitToWs(workspaceId, "task:deleted", { taskId });

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign Task — validates assignee is a workspace member
exports.assignTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const board = await Board.findById(task.board).populate('project');
    if (!board) return res.status(404).json({ message: "Board not found" });

    // Validate assignee is a workspace member (req.workspace set by isMember/isAdmin middleware)
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
        assignedToName: assignedUser?.name || ""
      }, { entityType: "task", entityId: task._id });
    }

    const populated = await Task.findById(taskId).populate("assignedTo", "name email avatar");

    // Real-time
    emitToWs(board.project.workspace, "task:assigned", {
      taskId,
      task: populated.toObject(),
    });

    res.json({ message: "Task assigned", task: populated });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Task Status — PATCH /api/tasks/:taskId/status
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

    const board = await Board.findById(task.board).populate('project');

    if (board?.project?.workspace) {
      await logActivity(board.project.workspace, req.user._id, "task_status_changed", {
        taskTitle: task.title,
        oldStatus,
        newStatus: status
      }, { entityType: "task", entityId: task._id });

      // Real-time
      emitToWs(board.project.workspace, "task:statusChanged", {
        taskId,
        boardId: task.board.toString(),
        status,
        oldStatus,
      });
    }

    res.json({ message: "Task status updated", task });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
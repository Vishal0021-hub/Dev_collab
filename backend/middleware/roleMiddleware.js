const mongoose = require("mongoose");
const Workspace = require("../models/workspace");
const Project = require("../models/Project");
const Board = require("../models/Board");
const Task = require("../models/Task");

/**
 * Middleware to authorize users based on their role in a workspace.
 * @param {string[]} allowedRoles - List of roles that are allowed to perform the action.
 */
const authorize = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      let workspaceId = req.params.workspaceId || req.body.workspaceId;

      // If workspaceId is not in params or body, try to find it from Project, Board, or Task
      if (!workspaceId) {
        if (req.params.projectId) {
          const projectId = req.params.projectId;
          if (mongoose.isValidObjectId(projectId)) {
            const project = await Project.findById(projectId);
            if (project) workspaceId = project.workspace;
          }
        } else if (req.params.taskId || req.body.taskId) {
          const taskId = req.params.taskId || req.body.taskId;
          if (mongoose.isValidObjectId(taskId)) {
            const task = await Task.findById(taskId).populate({
              path: 'board',
              populate: {
                path: 'project'
              }
            });
            if (task && task.board && task.board.project) {
              workspaceId = task.board.project.workspace;
            }
          }
        } else if (req.body.boardId || req.params.boardId) {
          const boardId = req.body.boardId || req.params.boardId;
          if (mongoose.isValidObjectId(boardId)) {
            const board = await Board.findById(boardId).populate('project');
            if (board && board.project) workspaceId = board.project.workspace;
          }
        }
      }

      if (!workspaceId) {
        return res.status(400).json({ message: "Workspace ID not found for authorization" });
      }

      const workspace = await Workspace.findById(workspaceId);

      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }

      const member = workspace.members.find((m) => {
        const userId = m?.userId;
        if (!userId) return false;
        return String(userId) === String(req.user._id);
      });

      if (!member || !allowedRoles.includes(member.role)) {
        return res.status(403).json({ message: "Not authorized for this action" });
      }

      req.workspace = workspace; // Attach workspace to request for convenience
      req.userRole = member.role; // Attach role to request

      next();
    } catch (error) {
      console.error("isMember middleware error", error);
      res.status(500).json({ message: error.message });
    }
  };
};

const isOwner = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId || req.body.workspaceId);
    if (!workspace) return res.status(404).json({ message: "Workspace not found" });

    const member = workspace.members.find((m) => {
      const userId = m?.userId;
      if (!userId) return false;
      return String(userId) === String(req.user._id);
    });
    if (!member || member.role !== "owner") {
      return res.status(403).json({ message: "Only workspace owner can perform this action" });
    }

    req.workspace = workspace;
    req.userRole = member.role;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    let workspaceId = req.params.workspaceId || req.body.workspaceId;

    // If workspaceId is not in params or body, try to find it from Project, Board, or Task
    if (!workspaceId) {
      if (req.params.projectId || req.body.projectId) {
        const projectId = req.params.projectId || req.body.projectId;
        if (mongoose.isValidObjectId(projectId)) {
          const project = await Project.findById(projectId);
          if (project) workspaceId = project.workspace;
        }
      } else if (req.params.boardId || req.body.boardId) {
        const boardId = req.params.boardId || req.body.boardId;
        if (mongoose.isValidObjectId(boardId)) {
          const board = await Board.findById(boardId);
          if (board && mongoose.isValidObjectId(board.project)) {
            const project = await Project.findById(board.project);
            if (project) workspaceId = project.workspace;
          }
        }
      } else if (req.params.taskId || req.body.taskId) {
        const taskId = req.params.taskId || req.body.taskId;
        if (mongoose.isValidObjectId(taskId)) {
          const task = await Task.findById(taskId);
          if (task && mongoose.isValidObjectId(task.board)) {
            const board = await Board.findById(task.board);
            if (board && mongoose.isValidObjectId(board.project)) {
              const project = await Project.findById(board.project);
              if (project) workspaceId = project.workspace;
            }
          }
        }
      }
    }

    if (!workspaceId) return res.status(400).json({ message: "Workspace not found" });

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ message: "Workspace not found" });

    const member = workspace.members.find((m) => {
      const userId = m?.userId;
      if (!userId) return false;
      return String(userId) === String(req.user._id);
    });

    if (!member || !["owner", "admin"].includes(member.role)) {
      console.error("isAdmin middleware: admin access denied", {
        workspaceId,
        userId: req.user?._id,
        member: member ? { userId: String(member.userId), role: member.role } : null
      });
      return res.status(403).json({ message: "Admin access required" });
    }

    req.workspace = workspace;
    req.userRole = member.role;
    next();
  } catch (error) {
    console.error("isAdmin error", error);
    res.status(500).json({ message: error.message });
  }
};

const isMember = async (req, res, next) => {
  try {
    let workspaceId = req.params.workspaceId || req.body.workspaceId;

    // If workspaceId is not in params or body, try to find it from Project, Board, or Task
    if (!workspaceId) {
      if (req.params.projectId || req.body.projectId) {
        const projectId = req.params.projectId || req.body.projectId;
        if (mongoose.isValidObjectId(projectId)) {
          const project = await Project.findById(projectId);
          if (project) workspaceId = project.workspace;
        }
      } else if (req.params.boardId || req.body.boardId) {
        const boardId = req.params.boardId || req.body.boardId;
        if (mongoose.isValidObjectId(boardId)) {
          const board = await Board.findById(boardId);
          if (board && mongoose.isValidObjectId(board.project)) {
            const project = await Project.findById(board.project);
            if (project) workspaceId = project.workspace;
          }
        }
      } else if (req.params.taskId || req.body.taskId) {
        const taskId = req.params.taskId || req.body.taskId;
        if (mongoose.isValidObjectId(taskId)) {
          const task = await Task.findById(taskId);
          if (task && mongoose.isValidObjectId(task.board)) {
            const board = await Board.findById(task.board);
            if (board && mongoose.isValidObjectId(board.project)) {
              const project = await Project.findById(board.project);
              if (project) workspaceId = project.workspace;
            }
          }
        }
      }
    }

    if (!workspaceId) return res.status(400).json({ message: "Workspace not found" });

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ message: "Workspace not found" });

    const member = workspace.members.find((m) => {
      const userId = m?.userId;
      if (!userId) return false;
      return String(userId) === String(req.user._id);
    });

    if (!member) {
      console.error("isMember middleware: user not found in workspace members", {
        workspaceId,
        userId: req.user?._id,
        members: workspace.members.map((m) => ({ userId: String(m.userId), role: m.role }))
      });
      return res.status(403).json({ message: "Workspace membership required" });
    }

    req.workspace = workspace;
    req.userRole = member.role;
    next();
  } catch (error) {
    console.error("isMember error", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { authorize, isOwner, isAdmin, isMember };

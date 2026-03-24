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
          const project = await Project.findById(req.params.projectId);
          if (project) workspaceId = project.workspace;
        } else if (req.params.taskId || req.body.taskId) {
          const taskId = req.params.taskId || req.body.taskId;
          const task = await Task.findById(taskId).populate({
            path: 'board',
            populate: {
              path: 'project'
            }
          });
          if (task && task.board && task.board.project) {
            workspaceId = task.board.project.workspace;
          }
        } else if (req.params.boardId) {
           const board = await Board.findById(req.params.boardId).populate('project');
           if (board && board.project) workspaceId = board.project.workspace;
        }
      }

      if (!workspaceId) {
        return res.status(400).json({ message: "Workspace ID not found for authorization" });
      }

      const workspace = await Workspace.findById(workspaceId);

      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }

      const member = workspace.members.find(
        (m) => m.user.toString() === req.user._id.toString()
      );

      if (!member || !allowedRoles.includes(member.role)) {
        return res.status(403).json({ message: "Not authorized for this action" });
      }

      req.workspace = workspace; // Attach workspace to request for convenience
      req.userRole = member.role; // Attach role to request

      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};

module.exports = { authorize };

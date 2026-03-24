const Task = require("../models/Task");
const Board = require("../models/Board");
const User = require("../models/User");
const { logActivity } = require("../utils/activityLogger");

// Create Task
exports.createTask = async (req, res) => {
  try {

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
      dueDate
    });

    // Log Activity - Ensure we have the workspace ID
    const workspaceId = board.project?.workspace || board.project?._id; 
    await logActivity(workspaceId, req.user._id, "task_created", {
      taskTitle: title,
      projectName: board.project?.name || "Project"
    });

    res.status(201).json(task);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Tasks by Board
exports.getTasks = async (req, res) => {
  try {

    const { boardId } = req.params;

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

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // update fields
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

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const oldBoard = await Board.findById(task.board);
    const newBoard = await Board.findById(boardId).populate('project');

    task.board = boardId;
    await task.save();

    await logActivity(newBoard.project.workspace, req.user._id, "task_moved", {
        taskTitle: task.title,
        fromBoard: oldBoard.name,
        toBoard: newBoard.name
    });

    res.json({
      message: "Task moved successfully",
      task
    });

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

    await logActivity(workspaceId, req.user._id, "task_deleted", {
        taskTitle
    });

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.assignTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body;

    const task = await Task.findById(taskId);

    task.assignedTo = userId || null;
    await task.save();

    if (userId) {
        const assignedUser = await User.findById(userId);
        const board = await Board.findById(task.board).populate('project');
        await logActivity(board.project.workspace, req.user._id, "task_assigned", {
            taskTitle: task.title,
            assignedToName: assignedUser.name
        });
    }

    res.json({ message: "Task assigned", task });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const Task = require("../models/Task");
const Board = require("../models/Board");

// Create Task
exports.createTask = async (req, res) => {
  try {

    const { title, description, boardId } = req.body;

    const board = await Board.findById(boardId);

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    const task = await Task.create({
      title,
      description,
      board: boardId
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

    const tasks = await Task.find({ board: boardId });

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

    task.board = boardId;

    await task.save();

    res.json({
      message: "Task moved successfully",
      task
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
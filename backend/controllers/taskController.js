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
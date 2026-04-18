const Board = require("../models/Board");
const Project = require("../models/Project");

// Create Board
exports.createBoard = async (req, res) => {
  try {

    const { name, projectId } = req.body;

    // check project exists
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const board = await Board.create({
      name,
      project: projectId
    });

    res.status(201).json(board);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Boards of a Project (or all if not specified)
exports.getBoards = async (req, res) => {
  try {
    const { projectId } = req.params;

    const query = projectId ? { project: projectId } : {};
    const boards = await Board.find(query).sort("order");

    res.json(boards);
  } catch (error) {
    console.error("getBoards error", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete Board
exports.deleteBoard = async (req, res) => {
  try {
    const { boardId } = req.params;

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    // Delete all tasks in this board
    const Task = require("../models/Task");
    await Task.deleteMany({ board: boardId });

    await Board.findByIdAndDelete(boardId);

    res.json({ message: "Board and its tasks deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
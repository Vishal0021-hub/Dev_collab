const express = require("express");
const router = express.Router();

const {
  createProject,
  getProjects
} = require("../controllers/projectController");

const { protect } = require("../middelware/authmiddleware");

// Create project
router.post("/", protect, createProject);

// Get projects by workspace
router.get("/:workspaceId", protect, getProjects);

module.exports = router;
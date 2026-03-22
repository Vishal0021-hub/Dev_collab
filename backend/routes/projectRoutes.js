const express = require("express");
const router = express.Router();

const {
  createProject,
  getProjects,
  getProjectById
} = require("../controllers/projectController");

const { protect } = require("../middelware/authmiddleware");

// Create project
router.post("/", protect, createProject);

// Get single project details
router.get("/details/:projectId", protect, getProjectById);

// Get projects by workspace
router.get("/:workspaceId", protect, getProjects);

module.exports = router;
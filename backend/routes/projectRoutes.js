const express = require("express");
const router = express.Router();

const {
  createProject,
  getProjects,
  getProjectById
} = require("../controllers/projectController");

const { protect } = require("../middleware/authmiddleware");
const { isAdmin, isMember } = require("../middleware/roleMiddleware");

// Create project - Only Owner and Admin
router.post("/", protect, isAdmin, createProject);

// Get single project details - Any member can view
router.get("/details/:projectId", protect, isMember, getProjectById);

// Get projects by workspace - Any member can view
router.get("/:workspaceId", protect, isMember, getProjects);

module.exports = router;
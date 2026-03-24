const express = require("express");
const router = express.Router();

const {
  createProject,
  getProjects,
  getProjectById
} = require("../controllers/projectController");

const { protect } = require("../middleware/authmiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// Create project - Only Owner and Admin
router.post("/", protect, authorize(["owner", "admin"]), createProject);

// Get single project details - Any member can view
router.get("/details/:projectId", protect, authorize(["owner", "admin", "member"]), getProjectById);

// Get projects by workspace - Any member can view
router.get("/:workspaceId", protect, authorize(["owner", "admin", "member"]), getProjects);

module.exports = router;
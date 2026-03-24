const express = require("express");
const router = express.Router();
const { getActivities } = require("../controllers/activityController");
const { protect } = require("../middleware/authmiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// Get activities for a workspace
router.get("/:workspaceId", protect, authorize(["owner", "admin", "member"]), getActivities);

module.exports = router;

const express = require("express");
const router = express.Router();
const { getActivities } = require("../controllers/activityController");
const { protect } = require("../middleware/authmiddleware");
const { isMember } = require("../middleware/roleMiddleware");

// Get activities for a workspace
router.get("/:workspaceId", protect, isMember, getActivities);

module.exports = router;

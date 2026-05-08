const express = require("express");
const router  = express.Router();

const { protect }   = require("../middleware/authmiddleware");
const { isMember }  = require("../middleware/roleMiddleware");
const { getAnalytics } = require("../controllers/analyticsController");

/**
 * GET /api/analytics/workspace/:workspaceId?range=7d|30d|90d
 * Any workspace member can view analytics (isMember guard).
 */
router.get("/workspace/:workspaceId", protect, isMember, getAnalytics);

module.exports = router;

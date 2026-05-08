const express = require("express");
const router  = express.Router();

const { protect }    = require("../middleware/authmiddleware");
const { authorize }  = require("../middleware/roleMiddleware");

// ── Placeholder — full implementation coming in Batch 3 ──────────
// GET /api/analytics/workspace/:workspaceId?range=7d|30d|90d
router.get(
  "/workspace/:workspaceId",
  protect,
  authorize(["owner", "admin"]),
  (_req, res) => {
    res.status(503).json({ message: "Analytics engine not yet implemented — coming in Phase 3 Batch 3" });
  }
);

module.exports = router;

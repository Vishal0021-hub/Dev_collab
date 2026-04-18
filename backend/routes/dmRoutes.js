const express = require("express");
const router = express.Router();

const { getDMs, sendDM } = require("../controllers/dmController");
const { protect } = require("../middleware/authmiddleware");

// Direct message thread with a specific user
router.get("/:recipientId", protect, getDMs);      // GET  /api/dm/:recipientId?workspaceId=xxx
router.post("/:recipientId", protect, sendDM);     // POST /api/dm/:recipientId

module.exports = router;

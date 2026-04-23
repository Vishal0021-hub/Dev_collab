const express = require("express");
const router = express.Router();

const {
  getChannels,
  createChannel,
  deleteChannel,
  getMessages,
  sendMessage
} = require("../controllers/channelController");

const { protect } = require("../middleware/authmiddleware");
const { isMember, isAdmin } = require("../middleware/roleMiddleware");

// Channel CRUD — workspaceId passed as query param for GET / body for POST
router.get("/", protect, getChannels);                                  // GET /api/channels?workspaceId=xxx
router.post("/", protect, isMember, createChannel);                      // POST /api/channels
router.delete("/:channelId", protect, isMember, deleteChannel);          // DELETE /api/channels/:channelId

// Messages inside a channel
router.get("/:channelId/messages", protect, getMessages);      // GET  /api/channels/:channelId/messages
router.post("/:channelId/messages", protect, sendMessage);     // POST /api/channels/:channelId/messages

module.exports = router;

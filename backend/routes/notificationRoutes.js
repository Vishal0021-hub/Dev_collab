const express = require("express");
const router = express.Router();

const {
  getNotifications,
  markRead,
  markAllRead
} = require("../controllers/notificationController");

const { protect } = require("../middleware/authmiddleware");

router.get("/", protect, getNotifications);                  // GET  /api/notifications
router.patch("/read-all", protect, markAllRead);             // PATCH /api/notifications/read-all
router.patch("/:id/read", protect, markRead);                // PATCH /api/notifications/:id/read

module.exports = router;

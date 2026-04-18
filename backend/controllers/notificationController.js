const Notification = require("../models/Notification");

// GET /api/notifications — get current user's notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("sender", "name avatar")
      .populate("workspace", "name")
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false
    });

    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/notifications/:id/read — mark a single notification as read
exports.markRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) return res.status(404).json({ message: "Notification not found" });

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ message: "Marked as read", notification });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/notifications/read-all — mark all as read
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true, readAt: new Date() } }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

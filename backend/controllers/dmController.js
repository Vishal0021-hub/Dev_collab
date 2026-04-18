const DirectMessage = require("../models/DirectMessage");
const User = require("../models/User");

// GET /api/dm/:recipientId?workspaceId=xxx  — fetch conversation
exports.getDMs = async (req, res) => {
  try {
    const { recipientId } = req.params;
    const { workspaceId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    if (!workspaceId) return res.status(400).json({ message: "workspaceId is required" });

    const query = {
      workspace: workspaceId,
      $or: [
        { sender: req.user._id, recipient: recipientId },
        { sender: recipientId, recipient: req.user._id }
      ]
    };

    const messages = await DirectMessage.find(query)
      .populate("sender", "name avatar email")
      .populate("recipient", "name avatar email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/dm/:recipientId  — send a DM
exports.sendDM = async (req, res) => {
  try {
    const { recipientId } = req.params;
    const { content, workspaceId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content cannot be empty" });
    }
    if (!workspaceId) return res.status(400).json({ message: "workspaceId is required" });

    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ message: "Recipient not found" });

    const message = await DirectMessage.create({
      content: content.trim(),
      sender: req.user._id,
      recipient: recipientId,
      workspace: workspaceId
    });

    await message.populate("sender", "name avatar email");
    await message.populate("recipient", "name avatar email");

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

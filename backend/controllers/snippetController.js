const CodeSnippet = require("../models/CodeSnippet");
const Message     = require("../models/Message");
const Channel     = require("../models/Channel");
const Task        = require("../models/Task");

// ── POST /api/snippets ──────────────────────────────────────────
// Create a snippet linked to a task
exports.createSnippet = async (req, res) => {
  try {
    const { taskId, title, language, code } = req.body;

    if (!taskId || !title || !code) {
      return res.status(400).json({ message: "taskId, title, and code are required" });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const snippet = await CodeSnippet.create({
      taskId,
      createdBy: req.user._id,
      title: title.trim(),
      language: language || "javascript",
      code,
    });

    await snippet.populate("createdBy", "name avatar");

    res.status(201).json(snippet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/snippets/task/:taskId ──────────────────────────────
// Get all snippets for a task
exports.getSnippetsByTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const snippets = await CodeSnippet.find({ taskId })
      .populate("createdBy", "name avatar")
      .populate("channelId", "name")
      .sort({ createdAt: -1 });

    res.json(snippets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/snippets/:id/share ────────────────────────────────
// Share a snippet to a channel — creates a Message with type "snippet"
exports.shareSnippet = async (req, res) => {
  try {
    const { id } = req.params;
    const { channelId } = req.body;

    if (!channelId) {
      return res.status(400).json({ message: "channelId is required" });
    }

    const snippet = await CodeSnippet.findById(id).populate("createdBy", "name");
    if (!snippet) return res.status(404).json({ message: "Snippet not found" });

    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ message: "Channel not found" });

    // Build a readable message preview
    const previewLines = snippet.code.split("\n").slice(0, 5).join("\n");
    const content = `📎 **${snippet.title}** (${snippet.language})\n\`\`\`${snippet.language}\n${previewLines}${snippet.code.split("\n").length > 5 ? "\n..." : ""}\n\`\`\``;

    // Create the message in the channel
    const message = await Message.create({
      content,
      channel:     channelId,
      sender:      req.user._id,
      workspace:   channel.workspace,
      messageType: "snippet",
      snippetId:   snippet._id,
    });

    await message.populate("sender", "name avatar email");
    await message.populate("snippetId");

    // Mark snippet as shared
    snippet.sharedToChannel  = true;
    snippet.channelId        = channelId;
    snippet.sharedMessageId  = message._id;
    await snippet.save();

    res.status(201).json({
      message: "Snippet shared to channel",
      channelMessage: message,
      snippet,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── DELETE /api/snippets/:id ────────────────────────────────────
exports.deleteSnippet = async (req, res) => {
  try {
    const snippet = await CodeSnippet.findById(req.params.id);
    if (!snippet) return res.status(404).json({ message: "Snippet not found" });

    // Only creator can delete
    if (snippet.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the creator can delete this snippet" });
    }

    await CodeSnippet.findByIdAndDelete(req.params.id);
    res.json({ message: "Snippet deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

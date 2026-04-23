const Task      = require("../models/Task");
const Board     = require("../models/Board");
const Project   = require("../models/Project");
const Channel   = require("../models/Channel");
const Message   = require("../models/Message");
const Workspace = require("../models/Workspace");
const mongoose  = require("mongoose");

// ── Helper: regex search (case-insensitive) ───────────────────
const rg = (q) => ({ $regex: q.trim(), $options: "i" });

// GET /api/search?q=&workspaceId=&type=tasks|messages|members
exports.globalSearch = async (req, res) => {
  try {
    const { q, workspaceId, type } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: "Query must be at least 2 characters" });
    }
    if (!workspaceId) {
      return res.status(400).json({ message: "workspaceId is required" });
    }
    // Validate ObjectId to prevent Mongoose CastError
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({ message: "Invalid workspaceId" });
    }

    const results = { tasks: [], messages: [], members: [] };

    // ── Tasks ────────────────────────────────────────────────
    if (!type || type === "tasks") {
      // Find all board IDs that belong to projects in this workspace
      const projects = await Project.find({ workspace: workspaceId }).select("_id");
      const projectIds = projects.map(p => p._id);
      const boards = await Board.find({ project: { $in: projectIds } }).select("_id name");
      const boardIds = boards.map(b => b._id);

      const boardMap = {};
      boards.forEach(b => { boardMap[b._id.toString()] = b.name; });

      const tasks = await Task.find({
        board: { $in: boardIds },
        $or: [{ title: rg(q) }, { description: rg(q) }]
      })
        .populate("assignedTo", "name avatar")
        .select("title description status priority board dueDate")
        .limit(10);

      results.tasks = tasks.map(t => ({
        ...t.toObject(),
        boardName: boardMap[t.board?.toString()] || "",
      }));
    }

    // ── Messages ─────────────────────────────────────────────
    if (!type || type === "messages") {
      const channels = await Channel.find({ workspace: workspaceId }).select("_id name");
      const channelIds = channels.map(c => c._id);

      const channelMap = {};
      channels.forEach(c => { channelMap[c._id.toString()] = c.name; });

      const messages = await Message.find({
        channel: { $in: channelIds },
        content: rg(q),
      })
        .populate("sender", "name avatar")
        .select("content channel sender createdAt")
        .sort({ createdAt: -1 })
        .limit(8);

      results.messages = messages.map(m => ({
        ...m.toObject(),
        channelName: channelMap[m.channel?.toString()] || "",
      }));
    }

    // ── Members ──────────────────────────────────────────────
    if (!type || type === "members") {
      const workspace = await Workspace.findById(workspaceId)
        .populate("members.userId", "name email avatar");

      results.members = (workspace?.members || [])
        .filter(m => {
          const u = m.userId;
          if (!u) return false;
          return (
            u.name?.toLowerCase().includes(q.toLowerCase()) ||
            u.email?.toLowerCase().includes(q.toLowerCase())
          );
        })
        .slice(0, 6)
        .map(m => ({
          _id:    m.userId._id,
          name:   m.userId.name,
          email:  m.userId.email,
          avatar: m.userId.avatar,
          role:   m.role,
        }));
    }

    res.json(results);
  } catch (err) {
    console.error("[Search]", err.message);
    res.status(500).json({ message: err.message });
  }
};

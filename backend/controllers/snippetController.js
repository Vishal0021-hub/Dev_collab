const CodeSnippet = require("../models/CodeSnippet");
const Message     = require("../models/Message");
const Channel     = require("../models/Channel");
const Task        = require("../models/Task");
const Board       = require("../models/Board");
const Project     = require("../models/Project");

/* ── Helper: derive workspaceId from a taskId ─────────────────── */
async function getWorkspaceIdFromTask(taskId) {
  const task = await Task.findById(taskId);
  if (!task) return null;
  const board = await Board.findById(task.board);
  if (!board) return null;
  const project = await Project.findById(board.project);
  return project?.workspace || null;
}

/* ═══════════════════════════════════════════════════════════════
   POST /api/snippets
   Create a new snippet for a task.
   workspaceId is derived automatically from taskId so the client
   doesn't have to pass it (but can override via body).
   ═══════════════════════════════════════════════════════════════ */
exports.createSnippet = async (req, res) => {
  try {
    const { taskId, title, language, code, workspaceId: wIdOverride } = req.body;

    if (!taskId) {
      return res.status(400).json({ message: "taskId is required" });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Resolve workspaceId
    const workspaceId = wIdOverride || await getWorkspaceIdFromTask(taskId);
    if (!workspaceId) {
      return res.status(400).json({ message: "Could not resolve workspaceId from task" });
    }

    const snippet = await CodeSnippet.create({
      taskId,
      workspaceId,
      createdBy: req.user._id,
      title:    (title || "Untitled snippet").trim(),
      language: language || "javascript",
      code:     code || "",
      version:  1,
    });

    await snippet.populate("createdBy", "name avatar");

    res.status(201).json(snippet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════════
   GET /api/snippets/task/:taskId
   List all snippets for a task (newest first).
   ═══════════════════════════════════════════════════════════════ */
exports.getSnippetsByTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const snippets = await CodeSnippet.find({ taskId })
      .populate("createdBy", "name avatar")
      .populate("sharedToChannelId", "name")
      .populate("channelId", "name")            // back-compat
      .sort({ createdAt: -1 })
      .select("-snapshots");                    // omit snapshots from list view (use /history)

    res.json(snippets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════════
   GET /api/snippets/:id
   Get a single snippet (full, including latest code).
   ═══════════════════════════════════════════════════════════════ */
exports.getSnippet = async (req, res) => {
  try {
    const snippet = await CodeSnippet.findById(req.params.id)
      .populate("createdBy", "name avatar")
      .populate("sharedToChannelId", "name")
      .select("-snapshots");

    if (!snippet) return res.status(404).json({ message: "Snippet not found" });

    res.json(snippet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════════
   PATCH /api/snippets/:id
   Update code + title, increment version, push snapshot.
   Emits snippet:saved via Socket.IO after saving.
   ═══════════════════════════════════════════════════════════════ */
exports.updateSnippet = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, title, language } = req.body;

    const snippet = await CodeSnippet.findById(id);
    if (!snippet) return res.status(404).json({ message: "Snippet not found" });

    // Build the snapshot from the current state BEFORE overwriting
    const currentSnapshot = {
      code:    snippet.code,
      version: snippet.version,
      savedBy: req.user._id,
      savedAt: new Date(),
    };

    // Enforce max-10 snapshots — drop the oldest
    if (snippet.snapshots.length >= 10) {
      snippet.snapshots.shift();
    }
    snippet.snapshots.push(currentSnapshot);

    // Apply updates
    if (code      !== undefined) snippet.code     = code;
    if (title     !== undefined) snippet.title    = title.trim();
    if (language  !== undefined) snippet.language = language;

    snippet.version   += 1;
    snippet.updatedAt  = new Date();

    await snippet.save();

    // ── Emit snippet:saved via Socket.IO ──────────────────────
    try {
      const io = req.app.get("io");
      if (io) {
        io.to(`snippet:${id}`).emit("snippet:saved", {
          snippetId:   id,
          version:     snippet.version,
          savedBy:     req.user._id.toString(),
          savedByName: req.user.name,
        });
      }
    } catch (socketErr) {
      // Non-fatal — socket may not be initialized in tests
      console.warn("[snippet:saved] Socket emit failed:", socketErr.message);
    }

    // Return lightweight response (omit large snapshot array)
    res.json({
      _id:      snippet._id,
      title:    snippet.title,
      language: snippet.language,
      code:     snippet.code,
      version:  snippet.version,
      updatedAt: snippet.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════════
   GET /api/snippets/:id/history
   Return the snapshots array (version history).
   ═══════════════════════════════════════════════════════════════ */
exports.getHistory = async (req, res) => {
  try {
    const snippet = await CodeSnippet.findById(req.params.id)
      .populate("snapshots.savedBy", "name avatar")
      .select("snapshots version title");

    if (!snippet) return res.status(404).json({ message: "Snippet not found" });

    // Return newest-first
    const history = [...snippet.snapshots].reverse();
    res.json({ currentVersion: snippet.version, history });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════════
   POST /api/snippets/:id/restore/:version
   Copy snapshot code to main code field, increment version.
   ═══════════════════════════════════════════════════════════════ */
exports.restoreSnapshot = async (req, res) => {
  try {
    const { id, version } = req.params;
    const targetVersion   = parseInt(version, 10);

    if (isNaN(targetVersion)) {
      return res.status(400).json({ message: "version must be a number" });
    }

    const snippet = await CodeSnippet.findById(id);
    if (!snippet) return res.status(404).json({ message: "Snippet not found" });

    const snap = snippet.snapshots.find(s => s.version === targetVersion);
    if (!snap) {
      return res.status(404).json({
        message: `Snapshot for version ${targetVersion} not found`,
        availableVersions: snippet.snapshots.map(s => s.version),
      });
    }

    // Save current state as a snapshot before overwriting
    if (snippet.snapshots.length >= 10) snippet.snapshots.shift();
    snippet.snapshots.push({
      code:    snippet.code,
      version: snippet.version,
      savedBy: req.user._id,
      savedAt: new Date(),
    });

    snippet.code     = snap.code;
    snippet.version += 1;

    await snippet.save();

    // Notify snippet room of the restore
    try {
      const io = req.app.get("io");
      if (io) {
        io.to(`snippet:${id}`).emit("snippet:saved", {
          snippetId:   id,
          version:     snippet.version,
          savedBy:     req.user._id.toString(),
          savedByName: req.user.name,
          restoredFrom: targetVersion,
        });
      }
    } catch { /* non-fatal */ }

    res.json({
      message:         `Restored from version ${targetVersion}`,
      currentVersion:  snippet.version,
      code:            snippet.code,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════════
   POST /api/snippets/:id/share
   Share a snippet to a channel — creates a Message with
   messageType "snippet" and posts a formatted code preview.
   ═══════════════════════════════════════════════════════════════ */
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

    // Build readable preview (first 5 lines)
    const previewLines = snippet.code.split("\n").slice(0, 5).join("\n");
    const hasMore      = snippet.code.split("\n").length > 5;
    const content = `📎 **${snippet.title}** (${snippet.language})\n\`\`\`${snippet.language}\n${previewLines}${hasMore ? "\n…" : ""}\n\`\`\``;

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
    snippet.sharedToChannel   = true;
    snippet.sharedToChannelId = channelId;
    snippet.channelId         = channelId;    // back-compat
    snippet.sharedMessageId   = message._id;
    await snippet.save();

    // Emit to channel room via Socket.IO
    try {
      const io = req.app.get("io");
      if (io) {
        io.to(`ch:${channelId}`).emit("channel:newMessage", { message });
      }
    } catch { /* non-fatal */ }

    res.status(201).json({
      message:        "Snippet shared to channel",
      channelMessage: message,
      snippet,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════════
   DELETE /api/snippets/:id
   Creator OR workspace admin/owner can delete.
   ═══════════════════════════════════════════════════════════════ */
exports.deleteSnippet = async (req, res) => {
  try {
    const snippet = await CodeSnippet.findById(req.params.id);
    if (!snippet) return res.status(404).json({ message: "Snippet not found" });

    const isCreator = snippet.createdBy.toString() === req.user._id.toString();
    const isAdmin   = req.userRole && ["owner", "admin"].includes(req.userRole);

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: "Only the creator or an admin can delete this snippet" });
    }

    await CodeSnippet.findByIdAndDelete(req.params.id);
    res.json({ message: "Snippet deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const express = require("express");
const router  = express.Router();

const {
  createSnippet,
  getSnippetsByTask,
  getSnippet,
  updateSnippet,
  getHistory,
  restoreSnapshot,
  shareSnippet,
  deleteSnippet,
} = require("../controllers/snippetController");

const { protect } = require("../middleware/authmiddleware");

/* ──────────────────────────────────────────────────────────────
   NOTE ON ORDERING:
   Static paths (/task/:taskId) must be registered BEFORE dynamic
   paths (/:id) to avoid Express treating "task" as an :id value.
   ────────────────────────────────────────────────────────────── */

// POST /api/snippets — create snippet (taskId in body, workspaceId auto-derived)
router.post("/", protect, createSnippet);

// GET /api/snippets/task/:taskId — list all snippets for a task
router.get("/task/:taskId", protect, getSnippetsByTask);

// GET /api/snippets/:id — get single snippet
router.get("/:id", protect, getSnippet);

// PATCH /api/snippets/:id — update code + title, increment version, push snapshot
router.patch("/:id", protect, updateSnippet);

// GET /api/snippets/:id/history — return snapshots array (version history)
router.get("/:id/history", protect, getHistory);

// POST /api/snippets/:id/restore/:version — restore a specific snapshot version
router.post("/:id/restore/:version", protect, restoreSnapshot);

// POST /api/snippets/:id/share — share to a channel
router.post("/:id/share", protect, shareSnippet);

// DELETE /api/snippets/:id — creator or admin only
router.delete("/:id", protect, deleteSnippet);

module.exports = router;

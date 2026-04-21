const express = require("express");
const router  = express.Router();

const {
  createSnippet,
  getSnippetsByTask,
  shareSnippet,
  deleteSnippet,
} = require("../controllers/snippetController");

const { protect } = require("../middleware/authmiddleware");

// POST /api/snippets — create snippet (taskId in body)
router.post("/", protect, createSnippet);

// GET /api/snippets/task/:taskId — all snippets for a task
router.get("/task/:taskId", protect, getSnippetsByTask);

// POST /api/snippets/:id/share — share to channel
router.post("/:id/share", protect, shareSnippet);

// DELETE /api/snippets/:id
router.delete("/:id", protect, deleteSnippet);

module.exports = router;

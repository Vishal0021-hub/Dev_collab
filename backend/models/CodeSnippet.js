const mongoose = require("mongoose");

/* ── Collaborator sub-doc ─────────────────────────────────────── */
const collaboratorSchema = new mongoose.Schema(
  {
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    color:      { type: String, default: "#818cf8" },   // cursor colour assigned by socket
    cursorLine: { type: Number, default: 0 },
    lastSeen:   { type: Date,   default: Date.now },
  },
  { _id: false }
);

/* ── Snapshot sub-doc ─────────────────────────────────────────── */
const snapshotSchema = new mongoose.Schema(
  {
    code:    { type: String, required: true },
    version: { type: Number, required: true },
    savedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    savedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

/* ── Main schema ──────────────────────────────────────────────── */
const codeSnippetSchema = new mongoose.Schema(
  {
    taskId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Task",
      required: true,
    },
    workspaceId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Workspace",
      required: true,
    },
    createdBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    title: {
      type:    String,
      default: "Untitled snippet",
      trim:    true,
    },
    language: {
      type:    String,
      enum:    [
        "javascript", "typescript", "python", "go",
        "rust", "html", "css", "json", "bash",
        "java", "cpp", "c", "sql", "yaml", "markdown", "plaintext",
      ],
      default: "javascript",
    },
    code: {
      type:      String,
      default:   "",
      maxlength: 15000,
    },

    /* ── Versioning ─────────────────────────────────────────── */
    version: {
      type:    Number,
      default: 1,
    },
    /**
     * Snapshots — max 10 kept.
     * Enforcement: controller pops the oldest before pushing.
     */
    snapshots: {
      type:    [snapshotSchema],
      default: [],
    },

    /* ── Real-time collaborators ────────────────────────────── */
    collaborators: {
      type:    [collaboratorSchema],
      default: [],
    },

    /* ── Sharing ────────────────────────────────────────────── */
    sharedToChannel:  { type: Boolean, default: false },
    sharedToChannelId: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "Channel",
      default: null,
    },
    // Kept for back-compat with existing documents that used channelId
    channelId: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "Channel",
      default: null,
    },
    sharedMessageId: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "Message",
      default: null,
    },
  },
  { timestamps: true }
);

/* ── Text index for global search ─────────────────────────────── */
codeSnippetSchema.index({ title: "text", code: "text" });

/* ── Workspace + task compound index for fast listing ─────────── */
codeSnippetSchema.index({ workspaceId: 1, taskId: 1, createdAt: -1 });

module.exports =
  mongoose.models.CodeSnippet ||
  mongoose.model("CodeSnippet", codeSnippetSchema);

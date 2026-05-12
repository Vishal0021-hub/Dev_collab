const mongoose = require("mongoose");

const commitSchema = new mongoose.Schema(
  {
    sha:       { type: String },
    shortSha:  { type: String },
    message:   { type: String },
    author: {
      name:      { type: String },
      avatarUrl: { type: String },
    },
    url:         { type: String },
    committedAt: { type: Date },
  },
  { _id: false }
);

const prSchema = new mongoose.Schema(
  {
    number:   { type: Number },
    title:    { type: String },
    url:      { type: String },
    state:    { type: String, enum: ["open", "closed", "merged"] },
    openedAt: { type: Date },
  },
  { _id: false }
);

const githubSchema = new mongoose.Schema(
  {
    branch:          { type: String },
    branchUrl:       { type: String },
    branchCreatedAt: { type: Date },
    pr:              { type: prSchema, default: null },
    commits:         { type: [commitSchema], default: [] },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },

    description: String,

    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board"
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },

    status: {
      type: String,
      enum: ["todo", "inprogress", "review", "done"],
      default: "todo"
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    dueDate: {
      type: Date,
      default: null
    },

    attachments: [
      {
        url:        { type: String, required: true },
        publicId:   { type: String, required: true },
        filename:   { type: String, required: true },
        mimetype:   { type: String, required: true },
        size:       { type: Number, required: true },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        uploadedAt: { type: Date, default: Date.now },
      }
    ],

    /* ── GitHub integration ─────────────────────────────────── */
    github: { type: githubSchema, default: () => ({}) },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Task || mongoose.model("Task", taskSchema);
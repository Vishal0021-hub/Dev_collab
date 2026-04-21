const mongoose = require("mongoose");

const codeSnippetSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    language: {
      type: String,
      required: true,
      enum: ["javascript", "typescript", "python", "go", "rust", "html", "css", "json", "bash", "java", "cpp", "c", "sql", "yaml", "markdown", "plaintext"],
      default: "javascript",
    },
    code: {
      type: String,
      required: true,
    },
    // Whether this snippet has been shared to a channel
    sharedToChannel: {
      type: Boolean,
      default: false,
    },
    // The channel it was shared to (if any)
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      default: null,
    },
    // The message created when it was shared
    sharedMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  { timestamps: true }
);

// Text index for search
codeSnippetSchema.index({ title: "text", code: "text" });

module.exports = mongoose.model("CodeSnippet", codeSnippetSchema);

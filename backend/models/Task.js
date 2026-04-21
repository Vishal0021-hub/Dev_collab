const mongoose = require("mongoose");

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

    createdBy:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"User",
      default:null,
    },
    dueDate: {
      type: Date,
      default: null
    },

    attachments: [
      {
        url:        { type: String, required: true },
        publicId:   { type: String, required: true }, // Cloudinary public_id (for deletion)
        filename:   { type: String, required: true },
        mimetype:   { type: String, required: true },
        size:       { type: Number, required: true }, // bytes
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        uploadedAt: { type: Date, default: Date.now },
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
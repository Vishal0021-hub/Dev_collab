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
      ref: "User"
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },

    status: {
      type: String,
      default: "todo"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
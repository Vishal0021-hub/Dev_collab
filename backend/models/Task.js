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
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
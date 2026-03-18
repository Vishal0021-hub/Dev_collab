const mongoose = require("mongoose");

const boardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project"
    },

    order: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Board", boardSchema);
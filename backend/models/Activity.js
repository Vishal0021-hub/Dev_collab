const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: [
        "task_created",
        "task_moved",
        "task_assigned",
        "member_invited",
        "role_changed",
        "project_created",
        "task_deleted"
      ],
      required: true
    },
    details: {
      taskTitle: String,
      projectName: String,
      invitedEmail: String,
      oldRole: String,
      newRole: String,
      fromBoard: String,
      toBoard: String,
      assignedToName: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Activity", activitySchema);

const Activity = require("../models/Activity");

const logActivity = async (workspaceId, userId, type, details = {}) => {
  try {
    await Activity.create({
      workspace: workspaceId,
      user: userId,
      type,
      details
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};

module.exports = { logActivity };

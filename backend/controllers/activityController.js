const Activity = require("../models/Activity");

exports.getActivities = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    // Get last 20 activities for the workspace
    const activities = await Activity.find({ workspace: workspaceId })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 })
      .limit(30);

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

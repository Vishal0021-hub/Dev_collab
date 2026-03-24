const Workspace = require("../models/workspace");
const User= require("../models/User");


exports.createWorkspace = async (req, res) => {
  try {

    const { name } = req.body;

    const workspace = await Workspace.create({
      name,
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: "owner"
        }
      ]
    });

    res.status(201).json(workspace);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({ "members.user": req.user._id });
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.inviteToWorkspace = async (req, res) => {
  try {
    const { email } = req.body;
    const { workspaceId } = req.params;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const workspace = await Workspace.findById(workspaceId);

    workspace.members.push({
      user: user._id,
      role: "member",
    });

    await workspace.save();

    res.json({ message: "User invited", workspace });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

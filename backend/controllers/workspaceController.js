const Workspace = require("../models/workspace");
const User= require("../models/User");
const { logActivity } = require("../utils/activityLogger");


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

    // find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // check if requester has permission (Owner or Admin)
    const requester = workspace.members.find(m => m.user.toString() === req.user._id.toString());
    if (!requester || (requester.role !== "owner" && requester.role !== "admin")) {
        return res.status(403).json({ message: "Only owners and admins can invite members" });
    }

    // check if user is already a member
    const isMember = workspace.members.some(
      (member) => member.user.toString() === user._id.toString()
    );

    if (isMember) {
      return res.status(400).json({ message: "User is already a member" });
    }

    workspace.members.push({
      user: user._id,
      role: "member",
    });

    await workspace.save();

    await logActivity(workspaceId, req.user._id, "member_invited", {
        invitedEmail: email
    });

    res.json({ message: "User invited", workspace });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getWorkspaceMembers = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const workspace = await Workspace.findById(workspaceId).populate("members.user", "name email avatar");
    
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    res.json(workspace.members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.changeRole = async (req, res) => {
  try {
    const { workspaceId, userId } = req.params;
    const { role } = req.body;

    const workspace = await Workspace.findById(workspaceId);

    const member = workspace.members.find(
      (m) => m.user.toString() === userId
    );

    const oldRole = member.role;
    member.role = role;

    await workspace.save();

    await logActivity(workspaceId, req.user._id, "role_changed", {
        oldRole,
        newRole: role,
        assignedToName: member.user.name || member.user.toString()
    });

    res.json({ message: "Role updated", workspace });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
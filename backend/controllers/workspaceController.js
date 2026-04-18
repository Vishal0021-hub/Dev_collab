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
          userId: req.user._id,
          role: "owner",
          joinedAt: Date.now()
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
    const workspaces = await Workspace.find({ "members.userId": req.user._id });
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const jwt = require("jsonwebtoken");
const { sendInviteEmail } = require("../utils/emailService");

exports.inviteToWorkspace = async (req, res) => {
  try {
    const { email, role } = req.body;
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Check if requester has permission (Owner or Admin)
    const requester = workspace.members.find(m => m.userId.toString() === req.user._id.toString());
    if (!requester || !["owner", "admin"].includes(requester.role)) {
      return res.status(403).json({ message: "Only owners and admins can invite members" });
    }

    // Check if user is already a member
    const isMember = workspace.members.some(m => m.userId.toString() === req.user._id.toString());
    if (isMember) {
      return res.status(400).json({ message: "User is already a member" });
    }

    const inviteRole = role || "member";

    // Generate JWT invite token
    const token = jwt.sign(
      { workspaceId, email, role: inviteRole, type: "workspace_invite" },
      process.env.INVITE_SECRET || "invite_secret",
      { expiresIn: "7d" }
    );

    // Send invitation email
    const inviter = await User.findById(req.user._id);
    const emailResult = await sendInviteEmail(email, workspace.name, inviter.name, inviteRole, token);

    res.json({ message: "Invite sent", emailSent: !!emailResult });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.joinWorkspace = async (req, res) => {
  try {
    const { token } = req.params;

    // Verify token
    const decoded = jwt.verify(token, process.env.INVITE_SECRET || "invite_secret");

    if (decoded.type !== "workspace_invite") {
      return res.status(400).json({ message: "Invalid invite token" });
    }

    if (decoded.email !== req.user.email) {
      return res.status(403).json({ message: "This invite is for a different email address" });
    }

    const workspace = await Workspace.findById(decoded.workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Check if user is already a member
    const isMember = workspace.members.some(m => m.userId.toString() === req.user._id.toString());
    if (isMember) {
      return res.status(400).json({ message: "You are already a member of this workspace" });
    }

    // Add user to workspace
    workspace.members.push({
      userId: req.user._id,
      role: decoded.role,
      joinedAt: Date.now()
    });

    await workspace.save();

    // Log activity
    await logActivity(decoded.workspaceId, req.user._id, "member_joined", {
      role: decoded.role
    });

    res.json({ message: "Successfully joined workspace", workspace });

  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Invite link has expired" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(400).json({ message: "Invalid invite link" });
    }
    res.status(500).json({ message: err.message });
  }
};

exports.getWorkspaceMembers = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const workspace = await Workspace.findById(workspaceId).populate("members.userId", "name email avatar");
    
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

    const workspace = await Workspace.findById(workspaceId).populate("members.userId");

    const member = workspace.members.find(
      (m) => m.userId._id.toString() === userId
    );

    const oldRole = member.role;
    member.role = role;

    await workspace.save();

    await logActivity(workspaceId, req.user._id, "role_changed", {
        oldRole,
        newRole: role,
        assignedToName: member.userId.name || member.userId.toString()
    });

    res.json({ message: "Role updated", workspace });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
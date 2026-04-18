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

exports.getDashboard = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const Activity = require("../models/Activity");
    const Task = require("../models/Task");
    const Board = require("../models/Board");
    const Project = require("../models/Project");
    const Channel = require("../models/Channel");

    const workspace = await Workspace.findById(workspaceId).populate(
      "members.userId",
      "name email avatar"
    );
    if (!workspace) return res.status(404).json({ message: "Workspace not found" });

    // Get all projects → boards → tasks in this workspace
    const projects = await Project.find({ workspace: workspaceId });
    const projectIds = projects.map(p => p._id);

    const boards = await Board.find({ project: { $in: projectIds } });
    const boardIds = boards.map(b => b._id);

    const allTasks = await Task.find({ board: { $in: boardIds } });

    // Task counts by status
    const taskCounts = {
      todo:       allTasks.filter(t => t.status === "todo").length,
      inprogress: allTasks.filter(t => t.status === "inprogress").length,
      review:     allTasks.filter(t => t.status === "review").length,
      done:       allTasks.filter(t => t.status === "done").length,
      total:      allTasks.length
    };

    // Recent 10 activities
    const recentActivity = await Activity.find({ workspace: workspaceId })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 })
      .limit(10);

    // Member list with roles
    const members = workspace.members.map(m => ({
      _id:      m.userId?._id,
      name:     m.userId?.name,
      email:    m.userId?.email,
      avatar:   m.userId?.avatar,
      role:     m.role,
      joinedAt: m.joinedAt
    }));

    // Channel list
    const channels = await Channel.find({ workspace: workspaceId })
      .select("name isPrivate description createdAt")
      .sort({ createdAt: 1 });

    res.json({ taskCounts, recentActivity, members, channels });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
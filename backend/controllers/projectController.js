const Project = require("../models/Project");
const Workspace = require("../models/workspace");
const { logActivity } = require("../utils/activityLogger");

// Create Project
exports.createProject = async (req, res) => {
  try {

    const { name, workspaceId } = req.body;

    // check workspace exists
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // check user is member
    const isMember = workspace.members.some(
      (member) => member.userId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const project = await Project.create({
      name,
      workspace: workspaceId,
      createdBy: req.user._id
    });

    await logActivity(workspaceId, req.user._id, "project_created", {
        projectName: name
    });

    res.status(201).json(project);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Projects of a Workspace
exports.getProjects = async (req, res) => {
  try {

    const { workspaceId } = req.params;

    const projects = await Project.find({ workspace: workspaceId });

    res.json(projects);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single project details
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
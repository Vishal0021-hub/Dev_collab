const Task       = require("../models/Task");
const { cloudinary } = require("../utils/uploadConfig");

// ── POST /api/tasks/:taskId/attachments ─────────────────────────
// Multer middleware runs before this — file is already on Cloudinary
exports.uploadAttachment = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const attachment = {
      url:        req.file.path,           // Cloudinary secure URL
      publicId:   req.file.filename,       // Cloudinary public_id
      filename:   req.file.originalname,
      mimetype:   req.file.mimetype,
      size:       req.file.size,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
    };

    task.attachments.push(attachment);
    await task.save();

    await task.populate("attachments.uploadedBy", "name avatar");

    res.status(201).json({
      message: "File uploaded successfully",
      attachment: task.attachments[task.attachments.length - 1],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/tasks/:taskId/attachments ──────────────────────────
exports.getAttachments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId)
      .populate("attachments.uploadedBy", "name avatar")
      .select("attachments");

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json(task.attachments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── DELETE /api/tasks/:taskId/attachments?publicId=xxx ─────────
// publicId is passed as a query param (Cloudinary IDs contain slashes
// which break Express path-to-regexp v8 route parameters)
exports.deleteAttachment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const publicId = req.query.publicId ? decodeURIComponent(req.query.publicId) : null;

    if (!publicId) {
      return res.status(400).json({ message: "publicId query param is required" });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const attachment = task.attachments.find(a => a.publicId === publicId);
    if (!attachment) return res.status(404).json({ message: "Attachment not found" });

    // Only the uploader, admin, or owner can delete
    const isUploader = attachment.uploadedBy?.toString() === req.user._id.toString();
    if (!isUploader && !["owner", "admin"].includes(req.userRole)) {
      return res.status(403).json({ message: "You don't have permission to delete this attachment" });
    }

    // Determine resource_type based on mimetype
    const resourceType = attachment.mimetype.startsWith("image/") ? "image" : "raw";

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (cloudErr) {
      console.error("[Cloudinary] Delete failed:", cloudErr.message);
      // Continue — remove from DB even if Cloudinary delete fails
    }

    // Remove from task's attachments array
    task.attachments = task.attachments.filter(a => a.publicId !== publicId);
    await task.save();

    res.json({ message: "Attachment deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

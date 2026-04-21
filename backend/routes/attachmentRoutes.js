const express = require("express");
const router  = express.Router();

const {
  uploadAttachment,
  getAttachments,
  deleteAttachment,
} = require("../controllers/attachmentController");

const { protect } = require("../middleware/authmiddleware");
const { isMember } = require("../middleware/roleMiddleware");
const { upload } = require("../utils/uploadConfig");

// Multer error handler — catches file filter / size errors gracefully
const handleUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// GET /api/tasks/:taskId/attachments
router.get("/:taskId/attachments", protect, isMember, getAttachments);

// POST /api/tasks/:taskId/attachments — upload a file
router.post("/:taskId/attachments", protect, isMember, handleUpload, uploadAttachment);

// DELETE /api/tasks/:taskId/attachments/:publicId
// publicId can contain slashes (e.g. devspace/attachments/123.jpg)
// We accept it as a query param instead to avoid routing conflicts
router.delete("/:taskId/attachments", protect, isMember, deleteAttachment);

module.exports = router;

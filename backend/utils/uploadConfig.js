const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage — files go into devspace/attachments folder
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith("image/");
    return {
      folder:         "devspace/attachments",
      resource_type:  isImage ? "image" : "raw",   // raw = PDFs, binaries
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "pdf"],
      transformation: isImage ? [{ quality: "auto", fetch_format: "auto" }] : undefined,
      // Use original filename (sanitised) as the public_id
      public_id: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
    };
  },
});

// File filter — images + PDFs only
const fileFilter = (_req, file, cb) => {
  const allowed = [
    "image/jpeg", "image/jpg", "image/png",
    "image/gif",  "image/webp",
    "application/pdf",
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only images (jpg, png, gif, webp) and PDF files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

module.exports = { upload, cloudinary };

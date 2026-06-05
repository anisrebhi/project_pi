/**
 * @file utils/multerConfig.js
 * @description Multer configuration for profile image uploads
 *              Handles file filtering, size limits, and naming strategy
 */

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ─── Ensure Upload Directory Exists ──────────────────────────────────────────

const uploadDir = process.env.UPLOAD_PATH || "src/uploads/profiles";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ─── Storage Engine ───────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Format: userId-timestamp.extension  → e.g. 64f1a2b3-1706000000000.jpg
    const userId = req.user?._id || "unknown";
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${userId}-${timestamp}${ext}`);
  },
});

// ─── File Filter ──────────────────────────────────────────────────────────────

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(
      new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed."),
      false
    );
  }
};

// ─── Multer Instance ──────────────────────────────────────────────────────────

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 1, // Only one file at a time
  },
});

/**
 * Delete a file from the upload directory (used when updating profile image)
 * @param {string} filePath - Relative or absolute path to the file
 */
const deleteFile = (filePath) => {
  if (!filePath) return;
  const fullPath = path.resolve(filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

module.exports = { upload, deleteFile };

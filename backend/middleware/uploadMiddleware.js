const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Ensure directories exist
const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

// ─── Generic storage factory ──────────────────────────────────────────────────
const makeStorage = (subdir) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, '..', 'uploads', subdir);
    ensureDir(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext    = path.extname(file.originalname).toLowerCase();
    cb(null, `${subdir.slice(0, -1)}-${unique}${ext}`);
  },
});

const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPEG, PNG, WEBP and GIF images are allowed'), false);
};

// ─── Event cover images (up to 5) ────────────────────────────────────────────
const upload = multer({ storage: makeStorage('events'), fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadEventImages = upload.array('images', 5);

// ─── Gallery photos (up to 20 per batch) ─────────────────────────────────────
const uploadGallery = multer({
  storage: makeStorage('gallery'),
  fileFilter: imageFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
}).array('photos', 20);

module.exports = { uploadEventImages, uploadGallery };

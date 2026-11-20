const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { ApiError } = require("../utils/helpers");

const UPLOAD_ROOT = path.join(__dirname, "..", "..", "uploads");

const makeStorage = (folder) => {
  const dir = path.join(UPLOAD_ROOT, folder);
  fs.mkdirSync(dir, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const base = path
        .basename(file.originalname, ext)
        .replace(/[^a-z0-9]+/gi, "-")
        .slice(0, 40);
      cb(null, `${Date.now()}-${base}${ext}`);
    },
  });
};

const imageFilter = (req, file, cb) => {
  if (/image\/(jpe?g|png|webp)/.test(file.mimetype)) return cb(null, true);
  cb(new ApiError(400, "Only JPG, PNG or WEBP images are allowed"));
};

const materialFilter = (req, file, cb) => {
  const allowed = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".zip", ".txt", ".png", ".jpg", ".jpeg"];
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) return cb(null, true);
  cb(new ApiError(400, "This file type is not allowed"));
};

const uploadProfile = multer({
  storage: makeStorage("profiles"),
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

const uploadMaterial = multer({
  storage: makeStorage("materials"),
  fileFilter: materialFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const removeFile = (relativePath) => {
  if (!relativePath) return;
  const full = path.join(UPLOAD_ROOT, relativePath.replace(/^\/?uploads\//, ""));
  fs.unlink(full, () => {}); // ignore if already gone
};

module.exports = { uploadProfile, uploadMaterial, removeFile };

const Material = require("../models/Material");
const Subject = require("../models/Subject");
const { removeFile } = require("../middleware/upload");
const { asyncHandler, ApiError, escapeRegex } = require("../utils/helpers");

// GET /api/materials?subject=&type=&search=&mine=true
const getMaterials = asyncHandler(async (req, res) => {
  const { subject, type, search, branch, semester } = req.query;
  const filter = {};

  if (req.role === "student") {
    filter.branch = req.user.branch;
    filter.semester = req.user.semester;
  } else {
    if (branch) filter.branch = branch;
    if (semester) filter.semester = Number(semester);
  }
  if (req.role === "faculty" && req.query.mine === "true") filter.uploadedBy = req.user._id;
  if (subject) filter.subject = subject;
  if (type) filter.type = type;
  if (search) filter.title = new RegExp(escapeRegex(search.trim()), "i");

  const data = await Material.find(filter)
    .populate("subject", "name code")
    .populate("branch", "code")
    .populate("uploadedBy", "firstName lastName")
    .sort("-createdAt");

  res.json({ success: true, data });
});

// POST /api/materials  (multipart: file + title, subject, type, description)
const uploadMaterial = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Please attach a file");

  const discard = (msg) => {
    removeFile(`/uploads/materials/${req.file.filename}`);
    throw new ApiError(400, msg);
  };

  if (!req.body.title || !req.body.title.trim()) discard("Title is required");
  const subject = await Subject.findById(req.body.subject).catch(() => null);
  if (!subject) discard("Please select a valid subject");
  if (req.role === "faculty" && String(subject.faculty) !== String(req.user._id)) {
    discard("You can upload material only for subjects assigned to you");
  }

  const material = await Material.create({
    title: req.body.title,
    description: req.body.description,
    type: req.body.type || "Notes",
    subject: subject._id,
    branch: subject.branch,
    semester: subject.semester,
    file: `/uploads/materials/${req.file.filename}`,
    originalName: req.file.originalname,
    fileSize: req.file.size,
    uploadedBy: req.user._id,
  });

  await material.populate([
    { path: "subject", select: "name code" },
    { path: "branch", select: "code" },
  ]);
  res.status(201).json({ success: true, message: "Material uploaded", data: material });
});

// DELETE /api/materials/:id
const deleteMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);
  if (!material) throw new ApiError(404, "Material not found");

  if (req.role === "faculty" && String(material.uploadedBy) !== String(req.user._id)) {
    throw new ApiError(403, "You can only delete material uploaded by you");
  }

  removeFile(material.file);
  await material.deleteOne();
  res.json({ success: true, message: "Material deleted" });
});

module.exports = { getMaterials, uploadMaterial, deleteMaterial };

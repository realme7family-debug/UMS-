const Subject = require("../models/Subject");
const Marks = require("../models/Marks");
const Material = require("../models/Material");
const { asyncHandler, ApiError, pick } = require("../utils/helpers");

const FIELDS = ["name", "code", "branch", "semester", "credits", "type", "faculty"];

// GET /api/subjects?branch=&semester=&mine=true
const getSubjects = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.role === "student") {
    // a student only ever needs the subjects of their own class
    filter.branch = req.user.branch;
    filter.semester = req.user.semester;
  } else {
    if (req.query.branch) filter.branch = req.query.branch;
    if (req.query.semester) filter.semester = Number(req.query.semester);
    if (req.role === "faculty" && req.query.mine === "true") filter.faculty = req.user._id;
  }

  const data = await Subject.find(filter)
    .populate("branch", "name code")
    .populate("faculty", "firstName lastName employeeId")
    .sort({ semester: 1, code: 1 });

  res.json({ success: true, data });
});

// POST /api/subjects
const createSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.create(pick(req.body, FIELDS));
  await subject.populate([
    { path: "branch", select: "name code" },
    { path: "faculty", select: "firstName lastName employeeId" },
  ]);
  res.status(201).json({ success: true, message: "Subject added", data: subject });
});

// PUT /api/subjects/:id
const updateSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) throw new ApiError(404, "Subject not found");

  Object.assign(subject, pick(req.body, FIELDS));
  if (req.body.faculty === "") subject.faculty = null; // un-assign
  await subject.save();
  await subject.populate([
    { path: "branch", select: "name code" },
    { path: "faculty", select: "firstName lastName employeeId" },
  ]);

  res.json({ success: true, message: "Subject updated", data: subject });
});

// DELETE /api/subjects/:id
const deleteSubject = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const [marks, materials] = await Promise.all([Marks.countDocuments({ subject: id }), Material.countDocuments({ subject: id })]);

  if (marks || materials) {
    throw new ApiError(400, "Marks or study material already exist for this subject, it can't be deleted.");
  }

  const deleted = await Subject.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, "Subject not found");
  res.json({ success: true, message: "Subject deleted" });
});

module.exports = { getSubjects, createSubject, updateSubject, deleteSubject };

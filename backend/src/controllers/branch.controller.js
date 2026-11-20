const Branch = require("../models/Branch");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const Faculty = require("../models/Faculty");
const { asyncHandler, ApiError, pick } = require("../utils/helpers");

const FIELDS = ["name", "code", "totalSemesters", "hod", "description"];

// GET /api/branches
const getBranches = asyncHandler(async (req, res) => {
  const branches = await Branch.find().populate("hod", "firstName lastName employeeId").sort("code").lean();

  // attach quick counts for the admin table
  const [studentCounts, subjectCounts] = await Promise.all([
    Student.aggregate([{ $group: { _id: "$branch", n: { $sum: 1 } } }]),
    Subject.aggregate([{ $group: { _id: "$branch", n: { $sum: 1 } } }]),
  ]);
  const toMap = (rows) => Object.fromEntries(rows.map((r) => [String(r._id), r.n]));
  const sMap = toMap(studentCounts);
  const subMap = toMap(subjectCounts);

  const data = branches.map((b) => ({
    ...b,
    studentCount: sMap[String(b._id)] || 0,
    subjectCount: subMap[String(b._id)] || 0,
  }));

  res.json({ success: true, data });
});

// POST /api/branches
const createBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.create(pick(req.body, FIELDS));
  res.status(201).json({ success: true, message: "Branch created", data: branch });
});

// PUT /api/branches/:id
const updateBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findById(req.params.id);
  if (!branch) throw new ApiError(404, "Branch not found");

  Object.assign(branch, pick(req.body, FIELDS));
  if (req.body.hod === "") branch.hod = null;
  await branch.save();

  res.json({ success: true, message: "Branch updated", data: branch });
});

// DELETE /api/branches/:id
const deleteBranch = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const [students, subjects, faculty] = await Promise.all([
    Student.countDocuments({ branch: id }),
    Subject.countDocuments({ branch: id }),
    Faculty.countDocuments({ department: id }),
  ]);

  if (students || subjects || faculty) {
    throw new ApiError(
      400,
      `Branch is in use (${students} students, ${faculty} faculty, ${subjects} subjects). Move or remove them first.`
    );
  }

  const deleted = await Branch.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, "Branch not found");
  res.json({ success: true, message: "Branch deleted" });
});

module.exports = { getBranches, createBranch, updateBranch, deleteBranch };

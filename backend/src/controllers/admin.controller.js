const Admin = require("../models/Admin");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const Branch = require("../models/Branch");
const Subject = require("../models/Subject");
const Notice = require("../models/Notice");
const Exam = require("../models/Exam");
const { modelByRole } = require("../middleware/auth");
const { asyncHandler, ApiError, pick } = require("../utils/helpers");

// GET /api/admin/dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const [students, faculty, branches, subjects, notices, upcomingExams, perBranch, recentStudents] = await Promise.all([
    Student.countDocuments({ status: "active" }),
    Faculty.countDocuments({ status: "active" }),
    Branch.countDocuments(),
    Subject.countDocuments(),
    Notice.countDocuments(),
    Exam.find({ startDate: { $gte: new Date() } })
      .sort("startDate")
      .limit(5)
      .populate("branch", "code"),
    Student.aggregate([
      { $group: { _id: "$branch", count: { $sum: 1 } } },
      { $lookup: { from: "branches", localField: "_id", foreignField: "_id", as: "branch" } },
      { $unwind: "$branch" },
      { $project: { _id: 0, code: "$branch.code", name: "$branch.name", count: 1 } },
      { $sort: { count: -1 } },
    ]),
    Student.find().sort("-createdAt").limit(5).populate("branch", "code"),
  ]);

  res.json({
    success: true,
    stats: { students, faculty, branches, subjects, notices },
    perBranch,
    upcomingExams,
    recentStudents,
  });
});

// GET /api/admin/admins
const listAdmins = asyncHandler(async (req, res) => {
  const admins = await Admin.find().sort("createdAt");
  res.json({ success: true, data: admins });
});

// POST /api/admin/admins
const createAdmin = asyncHandler(async (req, res) => {
  const data = pick(req.body, ["employeeId", "name", "email", "phone", "designation", "password"]);
  if (!data.password) throw new ApiError(400, "Password is required for a new admin");

  const admin = await Admin.create(data);
  res.status(201).json({ success: true, message: "Admin account created", data: admin });
});

// PUT /api/admin/admins/:id
const updateAdmin = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) throw new ApiError(404, "Admin not found");

  Object.assign(admin, pick(req.body, ["name", "email", "phone", "designation", "status"]));
  await admin.save();
  res.json({ success: true, message: "Admin updated", data: admin });
});

// DELETE /api/admin/admins/:id
const deleteAdmin = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) throw new ApiError(400, "You cannot delete your own account");

  const admin = await Admin.findById(req.params.id);
  if (!admin) throw new ApiError(404, "Admin not found");
  if (admin.isSuperAdmin) throw new ApiError(400, "The super admin account cannot be removed");

  await admin.deleteOne();
  res.json({ success: true, message: "Admin removed" });
});

// POST /api/admin/reset-password  { role, id, newPassword }
const resetUserPassword = asyncHandler(async (req, res) => {
  const { role, id, newPassword } = req.body;
  const Model = modelByRole[role];

  if (!Model) throw new ApiError(400, "Invalid role");
  if (!newPassword || newPassword.length < 6) throw new ApiError(400, "Password must be at least 6 characters");

  const user = await Model.findById(id);
  if (!user) throw new ApiError(404, "User not found");

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: "Password has been reset" });
});

module.exports = { getDashboard, listAdmins, createAdmin, updateAdmin, deleteAdmin, resetUserPassword };

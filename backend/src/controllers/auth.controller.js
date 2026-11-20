const { modelByRole } = require("../middleware/auth");
const { removeFile } = require("../middleware/upload");
const { asyncHandler, ApiError, signToken, pick } = require("../utils/helpers");

// which field (besides email) each role can log in with
const idField = { admin: "employeeId", faculty: "employeeId", student: "enrollmentNo" };

const populateUser = (role, query) => {
  if (role === "student") return query.populate("branch", "name code");
  if (role === "faculty") return query.populate("department", "name code");
  return query;
};

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { role, loginId, password } = req.body;

  if (!role || !loginId || !password) throw new ApiError(400, "Role, login ID and password are required");

  const Model = modelByRole[role];
  if (!Model) throw new ApiError(400, "Invalid role selected");

  const value = String(loginId).trim();
  const user = await Model.findOne({
    $or: [{ email: value.toLowerCase() }, { [idField[role]]: value.toUpperCase() }],
  }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, "Invalid credentials");
  }
  if (user.status === "inactive") throw new ApiError(403, "Your account has been deactivated. Contact the admin office.");

  const fresh = await populateUser(role, Model.findById(user._id));

  res.json({
    success: true,
    token: signToken(user, role),
    role,
    user: fresh,
  });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const Model = modelByRole[req.role];
  const user = await populateUser(req.role, Model.findById(req.user._id));
  res.json({ success: true, role: req.role, user });
});

// PUT /api/auth/profile  (multipart, optional field "profileImage")
const updateProfile = asyncHandler(async (req, res) => {
  const Model = modelByRole[req.role];
  const user = await Model.findById(req.user._id);

  // users can only touch their contact details; academic data is admin-controlled
  const editable = req.role === "admin" ? ["name", "phone"] : ["phone", "address"];
  Object.assign(user, pick(req.body, editable));

  if (req.file) {
    removeFile(user.profileImage);
    user.profileImage = `/uploads/profiles/${req.file.filename}`;
  }

  await user.save();
  const updated = await populateUser(req.role, Model.findById(user._id));
  res.json({ success: true, message: "Profile updated", user: updated });
});

// PUT /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) throw new ApiError(400, "Both current and new password are required");
  if (newPassword.length < 6) throw new ApiError(400, "New password must be at least 6 characters");
  if (currentPassword === newPassword) throw new ApiError(400, "New password must be different from the current one");

  const Model = modelByRole[req.role];
  const user = await Model.findById(req.user._id).select("+password");

  if (!(await user.matchPassword(currentPassword))) throw new ApiError(400, "Current password is incorrect");

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: "Password changed successfully" });
});

module.exports = { login, getMe, updateProfile, changePassword };

const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Faculty = require("../models/Faculty");
const Student = require("../models/Student");
const { asyncHandler, ApiError } = require("../utils/helpers");

const modelByRole = { admin: Admin, faculty: Faculty, student: Student };

// verifies the Bearer token and attaches the logged in user to req.user
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;

  if (!token) throw new ApiError(401, "Not authorised, please login");

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, "Session expired, please login again");
  }

  const Model = modelByRole[decoded.role];
  if (!Model) throw new ApiError(401, "Invalid token");

  const user = await Model.findById(decoded.id).select("-password");
  if (!user) throw new ApiError(401, "Account no longer exists");
  if (user.status === "inactive") throw new ApiError(403, "Your account has been deactivated");

  req.user = user;
  req.role = decoded.role;
  next();
});

// usage: allowRoles("admin", "faculty")
const allowRoles =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.role)) {
      return next(new ApiError(403, "You do not have permission for this action"));
    }
    next();
  };

module.exports = { protect, allowRoles, modelByRole };

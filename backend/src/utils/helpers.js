const jwt = require("jsonwebtoken");

// wraps async route handlers so we don't need try/catch everywhere
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

const signToken = (user, role) =>
  jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });

// keep only the keys that are allowed to be updated
const pick = (obj, keys) =>
  keys.reduce((acc, key) => {
    if (obj[key] !== undefined && obj[key] !== "") acc[key] = obj[key];
    return acc;
  }, {});

const escapeRegex = (text = "") => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = { asyncHandler, ApiError, signToken, pick, escapeRegex };

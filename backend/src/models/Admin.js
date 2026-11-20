const mongoose = require("mongoose");
const withPassword = require("./plugins/withPassword");

const adminSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    designation: { type: String, default: "Administrator" },
    profileImage: { type: String, default: "" },
    isSuperAdmin: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

adminSchema.plugin(withPassword);

module.exports = mongoose.model("Admin", adminSchema);

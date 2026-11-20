const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Branch name is required"], trim: true },
    code: { type: String, required: [true, "Branch code is required"], unique: true, uppercase: true, trim: true },
    totalSemesters: { type: Number, default: 8, min: 1, max: 10 },
    hod: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", default: null },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Branch", branchSchema);

const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Subject name is required"], trim: true },
    code: { type: String, required: [true, "Subject code is required"], unique: true, uppercase: true, trim: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    semester: { type: Number, required: true, min: 1, max: 10 },
    credits: { type: Number, default: 4, min: 0, max: 10 },
    type: { type: String, enum: ["Theory", "Lab", "Elective"], default: "Theory" },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", default: null },
  },
  { timestamps: true }
);

subjectSchema.index({ branch: 1, semester: 1 });

module.exports = mongoose.model("Subject", subjectSchema);

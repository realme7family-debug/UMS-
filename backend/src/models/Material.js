const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Title is required"], trim: true },
    description: { type: String, trim: true },
    type: { type: String, enum: ["Notes", "Assignment", "Syllabus", "Question Paper", "Other"], default: "Notes" },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    semester: { type: Number, required: true },
    file: { type: String, required: true }, // /uploads/materials/xyz.pdf
    originalName: String,
    fileSize: Number,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Material", materialSchema);

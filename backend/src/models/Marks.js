const mongoose = require("mongoose");

const marksSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    marksObtained: { type: Number, required: true, min: 0 },
    isAbsent: { type: Boolean, default: false },
    remarks: { type: String, trim: true },
    enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
  },
  { timestamps: true }
);

// one entry per student, per subject, per exam
marksSchema.index({ student: 1, subject: 1, exam: 1 }, { unique: true });

module.exports = mongoose.model("Marks", marksSchema);

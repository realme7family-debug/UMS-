const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Exam name is required"], trim: true },
    type: { type: String, enum: ["MST", "End Semester", "Practical", "Assignment", "Quiz"], default: "MST" },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    semester: { type: Number, required: true, min: 1, max: 10 },
    startDate: { type: Date, required: true },
    endDate: Date,
    maxMarks: { type: Number, required: true, min: 1 },
    passingMarks: { type: Number, default: 0 },
    resultPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exam", examSchema);

const mongoose = require("mongoose");
const withPassword = require("./plugins/withPassword");

const studentSchema = new mongoose.Schema(
  {
    enrollmentNo: { type: String, required: [true, "Enrollment number is required"], unique: true, uppercase: true, trim: true },
    firstName: { type: String, required: [true, "First name is required"], trim: true },
    lastName: { type: String, trim: true, default: "" },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], default: "Male" },
    dob: Date,
    bloodGroup: { type: String, trim: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: [true, "Branch is required"] },
    semester: { type: Number, required: true, min: 1, max: 10 },
    section: { type: String, uppercase: true, trim: true, default: "A" },
    admissionYear: { type: Number, default: () => new Date().getFullYear() },
    guardianName: { type: String, trim: true },
    guardianPhone: { type: String, trim: true },
    address: { type: String, trim: true },
    profileImage: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

studentSchema.index({ branch: 1, semester: 1 });

studentSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

studentSchema.plugin(withPassword);

module.exports = mongoose.model("Student", studentSchema);

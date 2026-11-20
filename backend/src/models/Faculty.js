const mongoose = require("mongoose");
const withPassword = require("./plugins/withPassword");

const facultySchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    firstName: { type: String, required: [true, "First name is required"], trim: true },
    lastName: { type: String, trim: true, default: "" },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], default: "Male" },
    dob: Date,
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    designation: {
      type: String,
      enum: ["Professor", "Associate Professor", "Assistant Professor", "Lecturer", "Lab Instructor"],
      default: "Assistant Professor",
    },
    qualification: { type: String, trim: true },
    experience: { type: Number, default: 0 }, // in years
    joiningDate: { type: Date, default: Date.now },
    address: { type: String, trim: true },
    profileImage: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

facultySchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

facultySchema.plugin(withPassword);

module.exports = mongoose.model("Faculty", facultySchema);

require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Student = require("../models/Student");
const Branch = require("../models/Branch");
const Subject = require("../models/Subject");
const Exam = require("../models/Exam");
const Marks = require("../models/Marks");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB for Akshit registration...");

  const cse = await Branch.findOne({ code: "CSE" });
  if (!cse) throw new Error("CSE branch not found");

  // Remove if already exists
  await Student.deleteMany({ enrollmentNo: "24BCS10974" });
  await Student.deleteMany({ email: "akshit@ums.edu" });

  const akshit = await Student.create({
    enrollmentNo: "24BCS10974",
    firstName: "Akshit",
    lastName: "",
    email: "akshit@ums.edu",
    phone: "9876543299",
    gender: "Male",
    dob: new Date(2004, 5, 15),
    bloodGroup: "O+",
    branch: cse._id,
    semester: 5,
    section: "A",
    admissionYear: 2024,
    guardianName: "Rajesh Kumar",
    guardianPhone: "9876500099",
    address: "Chandigarh University, Mohali",
    password: "karamlove",
    status: "active",
  });
  console.log("Created student:", akshit.enrollmentNo, akshit.firstName);

  // Find or create an exam with resultPublished: true
  let exam = await Exam.findOne({ branch: cse._id, semester: 5, resultPublished: true });
  if (!exam) {
    exam = await Exam.create({
      name: "Mid-Semester Examination (MST-1)",
      type: "MST",
      branch: cse._id,
      semester: 5,
      startDate: new Date(2026, 8, 14),
      endDate: new Date(2026, 8, 19),
      maxMarks: 20,
      passingMarks: 8,
      resultPublished: true,
    });
    console.log("Created exam:", exam.name);
  }

  // Find 5 subjects for CSE Sem 5
  const subjects = await Subject.find({ branch: cse._id, semester: 5 }).limit(5);
  console.log(`Found ${subjects.length} subjects for CSE Sem 5`);

  // Target exactly 83%:
  // With 5 subjects: 17 + 17 + 16 + 17 + 16 = 83 out of 100 (83.0%)
  const scores = [17, 17, 16, 17, 16];

  await Marks.deleteMany({ student: akshit._id });

  for (let i = 0; i < subjects.length; i++) {
    const sub = subjects[i];
    const score = scores[i % scores.length];
    await Marks.create({
      student: akshit._id,
      subject: sub._id,
      exam: exam._id,
      marksObtained: score,
      isAbsent: false,
      remarks: "Very Good Performance",
      enteredBy: sub.faculty || null,
    });
  }

  console.log(`Created marks for Akshit: ${subjects.length} subjects, total 83%, running score!`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Error creating Akshit:", err);
  process.exit(1);
});

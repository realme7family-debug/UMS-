const Student = require("../models/Student");
const Marks = require("../models/Marks");
const { removeFile } = require("../middleware/upload");
const { asyncHandler, ApiError, pick, escapeRegex } = require("../utils/helpers");

const FIELDS = [
  "enrollmentNo",
  "firstName",
  "lastName",
  "email",
  "phone",
  "gender",
  "dob",
  "bloodGroup",
  "branch",
  "semester",
  "section",
  "admissionYear",
  "guardianName",
  "guardianPhone",
  "address",
  "status",
];

// GET /api/students?search=&branch=&semester=&section=&page=&limit=
const getStudents = asyncHandler(async (req, res) => {
  const { search, branch, semester, section, status } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);

  const filter = {};
  if (branch) filter.branch = branch;
  if (semester) filter.semester = Number(semester);
  if (section) filter.section = section.toUpperCase();
  if (status) filter.status = status;
  if (search) {
    const rx = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ firstName: rx }, { lastName: rx }, { enrollmentNo: rx }, { email: rx }, { phone: rx }];
  }

  const [data, total] = await Promise.all([
    Student.find(filter)
      .populate("branch", "name code")
      .sort({ enrollmentNo: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Student.countDocuments(filter),
  ]);

  res.json({ success: true, data, total, page, pages: Math.ceil(total / limit) || 1 });
});

// GET /api/students/:id
const getStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).populate("branch", "name code");
  if (!student) throw new ApiError(404, "Student not found");
  res.json({ success: true, data: student });
});

// POST /api/students
const createStudent = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);

  // default password is the enrollment number, student is asked to change it after first login
  data.password = req.body.password || String(req.body.enrollmentNo || "").toLowerCase();
  if (req.file) data.profileImage = `/uploads/profiles/${req.file.filename}`;

  const student = await Student.create(data);
  await student.populate("branch", "name code");

  res.status(201).json({ success: true, message: "Student added successfully", data: student });
});

// PUT /api/students/:id
const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError(404, "Student not found");

  Object.assign(student, pick(req.body, FIELDS));
  if (req.file) {
    removeFile(student.profileImage);
    student.profileImage = `/uploads/profiles/${req.file.filename}`;
  }

  await student.save();
  await student.populate("branch", "name code");
  res.json({ success: true, message: "Student details updated", data: student });
});

// DELETE /api/students/:id
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError(404, "Student not found");

  await Marks.deleteMany({ student: student._id });
  removeFile(student.profileImage);
  await student.deleteOne();

  res.json({ success: true, message: "Student record deleted" });
});

module.exports = { getStudents, getStudent, createStudent, updateStudent, deleteStudent };

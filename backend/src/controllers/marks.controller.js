const mongoose = require("mongoose");
const Marks = require("../models/Marks");
const Exam = require("../models/Exam");
const Subject = require("../models/Subject");
const Student = require("../models/Student");
const { asyncHandler, ApiError } = require("../utils/helpers");

// faculty can only deal with marks of subjects assigned to them
const assertCanEnter = (req, subject) => {
  if (req.role === "admin") return;
  if (!subject.faculty || String(subject.faculty) !== String(req.user._id)) {
    throw new ApiError(403, "This subject is not assigned to you");
  }
};

const loadExamAndSubject = async (examId, subjectId) => {
  if (!mongoose.isValidObjectId(examId) || !mongoose.isValidObjectId(subjectId)) {
    throw new ApiError(400, "Please select a valid exam and subject");
  }
  const [exam, subject] = await Promise.all([Exam.findById(examId), Subject.findById(subjectId)]);
  if (!exam) throw new ApiError(404, "Exam not found");
  if (!subject) throw new ApiError(404, "Subject not found");

  if (String(exam.branch) !== String(subject.branch) || exam.semester !== subject.semester) {
    throw new ApiError(400, "This subject does not belong to the selected exam's class");
  }
  return { exam, subject };
};

// GET /api/marks/sheet?exam=&subject=&section=
// returns every student of the class along with marks already saved (if any)
const getMarksSheet = asyncHandler(async (req, res) => {
  const { exam, subject } = await loadExamAndSubject(req.query.exam, req.query.subject);
  assertCanEnter(req, subject);

  const studentFilter = { branch: exam.branch, semester: exam.semester, status: "active" };
  if (req.query.section) studentFilter.section = req.query.section.toUpperCase();

  const [students, existing] = await Promise.all([
    Student.find(studentFilter).select("enrollmentNo firstName lastName section").sort("enrollmentNo"),
    Marks.find({ exam: exam._id, subject: subject._id }),
  ]);

  const byStudent = Object.fromEntries(existing.map((m) => [String(m.student), m]));

  const rows = students.map((s) => {
    const m = byStudent[String(s._id)];
    return {
      student: s,
      marksObtained: m ? m.marksObtained : null,
      isAbsent: m ? m.isAbsent : false,
      remarks: m ? m.remarks : "",
    };
  });

  res.json({ success: true, exam, subject, rows });
});

// POST /api/marks/bulk  { exam, subject, entries: [{ student, marksObtained, isAbsent, remarks }] }
const saveMarks = asyncHandler(async (req, res) => {
  const { entries = [] } = req.body;
  const { exam, subject } = await loadExamAndSubject(req.body.exam, req.body.subject);
  assertCanEnter(req, subject);

  if (!Array.isArray(entries) || entries.length === 0) throw new ApiError(400, "Nothing to save");

  const ops = [];
  for (const e of entries) {
    // skip blank rows so partially filled sheets can be saved
    if (!e.isAbsent && (e.marksObtained === null || e.marksObtained === "" || e.marksObtained === undefined)) continue;

    const value = e.isAbsent ? 0 : Number(e.marksObtained);
    if (Number.isNaN(value) || value < 0 || value > exam.maxMarks) {
      throw new ApiError(400, `Marks must be between 0 and ${exam.maxMarks}`);
    }

    const fields = { marksObtained: value, isAbsent: !!e.isAbsent, remarks: e.remarks || "" };
    if (req.role === "faculty") fields.enteredBy = req.user._id;

    ops.push({
      updateOne: {
        filter: { student: e.student, subject: subject._id, exam: exam._id },
        update: { $set: fields },
        upsert: true,
      },
    });
  }

  if (ops.length === 0) throw new ApiError(400, "Enter marks for at least one student");

  await Marks.bulkWrite(ops);
  res.json({ success: true, message: `Marks saved for ${ops.length} student(s)` });
});

// GET /api/marks/my  (student) - only exams whose result is published
const getMyMarks = asyncHandler(async (req, res) => {
  const marks = await Marks.find({ student: req.user._id })
    .populate({ path: "exam", select: "name type maxMarks passingMarks startDate resultPublished semester" })
    .populate("subject", "name code credits")
    .lean();

  const visible = marks.filter((m) => m.exam && m.exam.resultPublished);

  // group by exam so the UI can render one card per exam
  const grouped = {};
  visible.forEach((m) => {
    const key = String(m.exam._id);
    if (!grouped[key]) grouped[key] = { exam: m.exam, subjects: [] };
    grouped[key].subjects.push({
      subject: m.subject,
      marksObtained: m.marksObtained,
      isAbsent: m.isAbsent,
      remarks: m.remarks,
    });
  });

  const data = Object.values(grouped).sort((a, b) => new Date(b.exam.startDate) - new Date(a.exam.startDate));
  res.json({ success: true, data });
});

module.exports = { getMarksSheet, saveMarks, getMyMarks };

const Exam = require("../models/Exam");
const Marks = require("../models/Marks");
const { asyncHandler, ApiError, pick } = require("../utils/helpers");

const FIELDS = ["name", "type", "branch", "semester", "startDate", "endDate", "maxMarks", "passingMarks", "resultPublished"];

// GET /api/exams?branch=&semester=
const getExams = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.role === "student") {
    filter.branch = req.user.branch;
    filter.semester = req.user.semester;
  } else {
    if (req.query.branch) filter.branch = req.query.branch;
    if (req.query.semester) filter.semester = Number(req.query.semester);
  }

  const data = await Exam.find(filter).populate("branch", "name code").sort("-startDate");
  res.json({ success: true, data });
});

// POST /api/exams
const createExam = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  if (data.passingMarks && Number(data.passingMarks) > Number(data.maxMarks)) {
    throw new ApiError(400, "Passing marks can't be more than maximum marks");
  }

  const exam = await Exam.create(data);
  await exam.populate("branch", "name code");
  res.status(201).json({ success: true, message: "Exam scheduled", data: exam });
});

// PUT /api/exams/:id
const updateExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) throw new ApiError(404, "Exam not found");

  Object.assign(exam, pick(req.body, FIELDS));
  if (typeof req.body.resultPublished === "boolean") exam.resultPublished = req.body.resultPublished;
  await exam.save();
  await exam.populate("branch", "name code");

  res.json({ success: true, message: "Exam updated", data: exam });
});

// DELETE /api/exams/:id
const deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) throw new ApiError(404, "Exam not found");

  const removed = await Marks.deleteMany({ exam: exam._id });
  await exam.deleteOne();
  res.json({ success: true, message: `Exam deleted along with ${removed.deletedCount} marks entries` });
});

module.exports = { getExams, createExam, updateExam, deleteExam };

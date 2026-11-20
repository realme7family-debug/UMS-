const Timetable = require("../models/Timetable");
const Subject = require("../models/Subject");
const Student = require("../models/Student");
const { asyncHandler, ApiError } = require("../utils/helpers");

const TIME_RX = /^([01]\d|2[0-3]):[0-5]\d$/;

const populateSlots = (query) =>
  query
    .populate("branch", "name code")
    .populate("slots.subject", "name code type")
    .populate("slots.faculty", "firstName lastName");

// GET /api/timetable?branch=&semester=&section=
const getTimetable = asyncHandler(async (req, res) => {
  let { branch, semester, section } = req.query;

  if (req.role === "student") {
    branch = req.user.branch;
    semester = req.user.semester;
    section = req.user.section;
  }

  if (!branch || !semester) throw new ApiError(400, "Branch and semester are required");

  const timetable = await populateSlots(
    Timetable.findOne({ branch, semester: Number(semester), section: (section || "A").toUpperCase() })
  );

  res.json({ success: true, data: timetable });
});

// PUT /api/timetable   { branch, semester, section, slots: [...] }
const saveTimetable = asyncHandler(async (req, res) => {
  const { branch, semester, section = "A", slots = [] } = req.body;
  if (!branch || !semester) throw new ApiError(400, "Branch and semester are required");

  // validate each slot and make sure subjects belong to this class
  const subjects = await Subject.find({ branch, semester: Number(semester) }).select("_id faculty");
  const allowed = Object.fromEntries(subjects.map((s) => [String(s._id), s]));

  const clean = slots.map((s, i) => {
    if (!s.day || !s.subject) throw new ApiError(400, `Row ${i + 1}: day and subject are required`);
    if (!TIME_RX.test(s.startTime) || !TIME_RX.test(s.endTime)) {
      throw new ApiError(400, `Row ${i + 1}: time must be in HH:MM format`);
    }
    if (s.startTime >= s.endTime) throw new ApiError(400, `Row ${i + 1}: end time must be after start time`);

    const subject = allowed[String(s.subject)];
    if (!subject) throw new ApiError(400, `Row ${i + 1}: subject is not part of this semester`);

    return {
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
      subject: s.subject,
      faculty: s.faculty || subject.faculty || undefined,
      room: s.room,
    };
  });

  // simple clash check: same day and overlapping time
  for (let i = 0; i < clean.length; i++) {
    for (let j = i + 1; j < clean.length; j++) {
      const a = clean[i];
      const b = clean[j];
      if (a.day === b.day && a.startTime < b.endTime && b.startTime < a.endTime) {
        throw new ApiError(400, `Clash on ${a.day}: ${a.startTime}-${a.endTime} overlaps with ${b.startTime}-${b.endTime}`);
      }
    }
  }

  const timetable = await populateSlots(
    Timetable.findOneAndUpdate(
      { branch, semester: Number(semester), section: section.toUpperCase() },
      {
        slots: clean,
        updatedBy: req.user._id,
        updatedByModel: req.role === "admin" ? "Admin" : "Faculty",
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    )
  );

  res.json({ success: true, message: "Timetable saved", data: timetable });
});

// GET /api/timetable/classes (Returns all active classes with enrolled students count & timetable status)
const getClasses = asyncHandler(async (req, res) => {
  const classes = await Student.aggregate([
    { $group: { _id: { branch: "$branch", semester: "$semester", section: "$section" }, studentCount: { $sum: 1 } } },
    { $lookup: { from: "branches", localField: "_id.branch", foreignField: "_id", as: "branch" } },
    { $unwind: "$branch" },
    {
      $project: {
        _id: 0,
        branchId: "$branch._id",
        branchCode: "$branch.code",
        branchName: "$branch.name",
        semester: "$_id.semester",
        section: "$_id.section",
        studentCount: 1,
      },
    },
    { $sort: { branchCode: 1, semester: 1, section: 1 } },
  ]);

  const timetables = await Timetable.find().select("branch semester section slots updatedAt");
  const ttMap = new Map();
  for (const t of timetables) {
    ttMap.set(`${t.branch}_${t.semester}_${t.section}`, t);
  }

  const enriched = classes.map((c) => {
    const key = `${c.branchId}_${c.semester}_${c.section}`;
    const t = ttMap.get(key);
    return {
      ...c,
      hasTimetable: !!t && t.slots?.length > 0,
      slotsCount: t?.slots?.length || 0,
      updatedAt: t?.updatedAt || null,
    };
  });

  res.json({ success: true, data: enriched });
});

module.exports = { getTimetable, saveTimetable, getClasses };

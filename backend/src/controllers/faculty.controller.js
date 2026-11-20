const Faculty = require("../models/Faculty");
const Subject = require("../models/Subject");
const Branch = require("../models/Branch");
const Material = require("../models/Material");
const Marks = require("../models/Marks");
const Timetable = require("../models/Timetable");
const { removeFile } = require("../middleware/upload");
const { asyncHandler, ApiError, pick, escapeRegex } = require("../utils/helpers");

const FIELDS = [
  "employeeId",
  "firstName",
  "lastName",
  "email",
  "phone",
  "gender",
  "dob",
  "department",
  "designation",
  "qualification",
  "experience",
  "joiningDate",
  "address",
  "status",
];

// GET /api/faculty?search=&department=
const getFaculty = asyncHandler(async (req, res) => {
  const { search, department, status } = req.query;
  const filter = {};
  if (department) filter.department = department;
  if (status) filter.status = status;
  if (search) {
    const rx = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ firstName: rx }, { lastName: rx }, { employeeId: rx }, { email: rx }];
  }

  const data = await Faculty.find(filter).populate("department", "name code").sort("employeeId");
  res.json({ success: true, data, total: data.length });
});

// GET /api/faculty/:id
const getFacultyById = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findById(req.params.id).populate("department", "name code");
  if (!faculty) throw new ApiError(404, "Faculty member not found");

  const subjects = await Subject.find({ faculty: faculty._id }).populate("branch", "code");
  res.json({ success: true, data: faculty, subjects });
});

// POST /api/faculty
const createFaculty = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  data.password = req.body.password || String(req.body.employeeId || "").toLowerCase();
  if (req.file) data.profileImage = `/uploads/profiles/${req.file.filename}`;

  const faculty = await Faculty.create(data);
  await faculty.populate("department", "name code");
  res.status(201).json({ success: true, message: "Faculty member added", data: faculty });
});

// PUT /api/faculty/:id
const updateFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findById(req.params.id);
  if (!faculty) throw new ApiError(404, "Faculty member not found");

  Object.assign(faculty, pick(req.body, FIELDS));
  if (req.file) {
    removeFile(faculty.profileImage);
    faculty.profileImage = `/uploads/profiles/${req.file.filename}`;
  }
  await faculty.save();
  await faculty.populate("department", "name code");
  res.json({ success: true, message: "Faculty details updated", data: faculty });
});

// DELETE /api/faculty/:id
const deleteFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findById(req.params.id);
  if (!faculty) throw new ApiError(404, "Faculty member not found");

  const materialCount = await Material.countDocuments({ uploadedBy: faculty._id });
  if (materialCount > 0) {
    throw new ApiError(400, `This faculty has ${materialCount} uploaded material(s). Mark the account inactive instead.`);
  }

  // free up anything that pointed to this faculty
  await Promise.all([
    Subject.updateMany({ faculty: faculty._id }, { $set: { faculty: null } }),
    Branch.updateMany({ hod: faculty._id }, { $set: { hod: null } }),
    Marks.updateMany({ enteredBy: faculty._id }, { $unset: { enteredBy: "" } }),
    Timetable.updateMany({}, { $unset: { "slots.$[s].faculty": "" } }, { arrayFilters: [{ "s.faculty": faculty._id }] }),
  ]);

  removeFile(faculty.profileImage);
  await faculty.deleteOne();
  res.json({ success: true, message: "Faculty member removed" });
});

// GET /api/faculty/me/overview  (logged in faculty)
const getMyOverview = asyncHandler(async (req, res) => {
  const [subjects, materials, timetables] = await Promise.all([
    Subject.find({ faculty: req.user._id }).populate("branch", "name code").sort("semester"),
    Material.countDocuments({ uploadedBy: req.user._id }),
    Timetable.find({ "slots.faculty": req.user._id })
      .populate("branch", "code")
      .populate("slots.subject", "name code"),
  ]);

  // flatten only the slots taught by this faculty
  const classes = [];
  timetables.forEach((tt) => {
    tt.slots
      .filter((s) => String(s.faculty) === String(req.user._id))
      .forEach((s) =>
        classes.push({
          day: s.day,
          startTime: s.startTime,
          endTime: s.endTime,
          room: s.room,
          subject: s.subject,
          branch: tt.branch,
          semester: tt.semester,
          section: tt.section,
        })
      );
  });
  classes.sort((a, b) => a.startTime.localeCompare(b.startTime));

  res.json({ success: true, subjects, materialCount: materials, classes });
});

module.exports = { getFaculty, getFacultyById, createFaculty, updateFaculty, deleteFaculty, getMyOverview };

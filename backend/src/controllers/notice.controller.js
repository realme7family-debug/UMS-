const Notice = require("../models/Notice");
const { asyncHandler, ApiError, pick } = require("../utils/helpers");

// GET /api/notices?limit=
const getNotices = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  let filter = {};

  if (req.role === "student") {
    filter = {
      audience: { $in: ["all", "student"] },
      $or: [{ branch: null }, { branch: req.user.branch }],
    };
  } else if (req.role === "faculty") {
    filter = {
      $or: [{ audience: { $in: ["all", "faculty"] } }, { postedBy: req.user._id }],
    };
  }

  const data = await Notice.find(filter)
    .populate("branch", "code")
    .populate("postedBy", "name firstName lastName")
    .sort({ important: -1, createdAt: -1 })
    .limit(limit);

  res.json({ success: true, data });
});

// GET /api/notices/public  (home page, no login needed)
const getPublicNotices = asyncHandler(async (req, res) => {
  const data = await Notice.find({ audience: "all" }).select("title description important createdAt").sort("-createdAt").limit(6);
  res.json({ success: true, data });
});

// POST /api/notices
const createNotice = asyncHandler(async (req, res) => {
  const data = pick(req.body, ["title", "description", "audience", "branch", "link", "important"]);

  // faculty notices are always meant for students
  if (req.role === "faculty") data.audience = "student";

  data.postedBy = req.user._id;
  data.postedByModel = req.role === "admin" ? "Admin" : "Faculty";

  const notice = await Notice.create(data);
  await notice.populate("branch", "code");
  res.status(201).json({ success: true, message: "Notice published", data: notice });
});

const findOwnNotice = async (req) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) throw new ApiError(404, "Notice not found");
  if (req.role === "faculty" && String(notice.postedBy) !== String(req.user._id)) {
    throw new ApiError(403, "You can only modify notices posted by you");
  }
  return notice;
};

// PUT /api/notices/:id
const updateNotice = asyncHandler(async (req, res) => {
  const notice = await findOwnNotice(req);
  Object.assign(notice, pick(req.body, ["title", "description", "audience", "link", "important"]));
  if (req.role === "faculty") notice.audience = "student";
  notice.branch = req.body.branch || null;
  await notice.save();
  await notice.populate("branch", "code");
  res.json({ success: true, message: "Notice updated", data: notice });
});

// DELETE /api/notices/:id
const deleteNotice = asyncHandler(async (req, res) => {
  const notice = await findOwnNotice(req);
  await notice.deleteOne();
  res.json({ success: true, message: "Notice deleted" });
});

module.exports = { getPublicNotices, getNotices, createNotice, updateNotice, deleteNotice };

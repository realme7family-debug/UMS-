const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Title is required"], trim: true, maxlength: 150 },
    description: { type: String, required: [true, "Description is required"] },
    audience: { type: String, enum: ["all", "student", "faculty"], default: "all" },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null }, // null = every branch
    link: { type: String, trim: true },
    important: { type: Boolean, default: false },
    postedBy: { type: mongoose.Schema.Types.ObjectId, refPath: "postedByModel" },
    postedByModel: { type: String, enum: ["Admin", "Faculty"] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notice", noticeSchema);

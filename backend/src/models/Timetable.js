const mongoose = require("mongoose");

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const slotSchema = new mongoose.Schema({
  day: { type: String, enum: DAYS, required: true },
  startTime: { type: String, required: true }, // "09:30"
  endTime: { type: String, required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
  room: { type: String, trim: true },
});

const timetableSchema = new mongoose.Schema(
  {
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    semester: { type: Number, required: true },
    section: { type: String, uppercase: true, default: "A" },
    slots: [slotSchema],
    updatedBy: { type: mongoose.Schema.Types.ObjectId, refPath: "updatedByModel" },
    updatedByModel: { type: String, enum: ["Admin", "Faculty"] },
  },
  { timestamps: true }
);

timetableSchema.index({ branch: 1, semester: 1, section: 1 }, { unique: true });

module.exports = mongoose.model("Timetable", timetableSchema);
module.exports.DAYS = DAYS;

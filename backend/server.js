require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const connectDB = require("./src/config/db");
const { notFound, errorHandler } = require("./src/middleware/error");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

// uploaded files (profile photos, study material)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date() }));

app.use("/api/auth", require("./src/routes/auth.routes"));
app.use("/api/admin", require("./src/routes/admin.routes"));
app.use("/api/students", require("./src/routes/student.routes"));
app.use("/api/faculty", require("./src/routes/faculty.routes"));
app.use("/api/branches", require("./src/routes/branch.routes"));
app.use("/api/subjects", require("./src/routes/subject.routes"));
app.use("/api/exams", require("./src/routes/exam.routes"));
app.use("/api/marks", require("./src/routes/marks.routes"));
app.use("/api/timetable", require("./src/routes/timetable.routes"));
app.use("/api/notices", require("./src/routes/notice.routes"));
app.use("/api/materials", require("./src/routes/material.routes"));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`UMS API running on http://localhost:${PORT}`));
});

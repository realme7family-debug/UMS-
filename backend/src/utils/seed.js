/**
 * Fills the database with demo data so every module can be tried out
 * right after setup.
 *
 *   npm run seed
 *
 * WARNING: this clears the existing UMS collections first.
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const Admin = require("../models/Admin");
const Faculty = require("../models/Faculty");
const Student = require("../models/Student");
const Branch = require("../models/Branch");
const Subject = require("../models/Subject");
const Exam = require("../models/Exam");
const Marks = require("../models/Marks");
const Timetable = require("../models/Timetable");
const Notice = require("../models/Notice");
const Material = require("../models/Material");

// small deterministic random so marks look the same on every seed
let seed = 42;
const rand = () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};
const between = (min, max) => Math.round(min + rand() * (max - min));

// writes a tiny one-page PDF so the study material section has real downloadable files
function writeSamplePdf(fileName, lines) {
  const dir = path.join(__dirname, "..", "..", "uploads", "materials");
  fs.mkdirSync(dir, { recursive: true });

  const esc = (t) => t.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const text = lines.map((l, i) => `BT /F1 ${i === 0 ? 16 : 11} Tf 60 ${760 - i * 22} Td (${esc(l)}) Tj ET`).join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefAt = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => (pdf += `${String(o).padStart(10, "0")} 00000 n \n`));
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;

  fs.writeFileSync(path.join(dir, fileName), pdf);
  return { file: `/uploads/materials/${fileName}`, fileSize: Buffer.byteLength(pdf) };
}

async function run(skipConnect = false) {
  if (!skipConnect && mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }
  console.log("Connected, clearing old data...");

  await Promise.all(
    [Admin, Faculty, Student, Branch, Subject, Exam, Marks, Timetable, Notice, Material].map((M) => M.deleteMany({}))
  );

  /* ---------- admin ---------- */
  const admin = await Admin.create({
    employeeId: "ADM001",
    name: "Rajiv Bansal",
    email: "admin@ums.edu",
    phone: "9876500001",
    designation: "Registrar Office",
    password: "admin123",
    isSuperAdmin: true,
  });

  /* ---------- branches ---------- */
  const [cse, ece, me, ce] = await Branch.insertMany([
    { name: "Computer Science & Engineering", code: "CSE", totalSemesters: 8 },
    { name: "Electronics & Communication Engineering", code: "ECE", totalSemesters: 8 },
    { name: "Mechanical Engineering", code: "ME", totalSemesters: 8 },
    { name: "Civil Engineering", code: "CE", totalSemesters: 8 },
  ]);

  /* ---------- faculty (Faculty.create so passwords get hashed) ---------- */
  const facultyData = [
    ["E10231", "Ramesh", "Sharma", "Male", cse, "Professor", "Ph.D. (CSE), IIT Roorkee", 19],
    ["E10764", "Priya", "Malhotra", "Female", cse, "Assistant Professor", "M.Tech (CSE)", 7],
    ["E11052", "Arjun", "Mehta", "Male", cse, "Assistant Professor", "M.Tech (AI & ML)", 4],
    ["E10498", "Neha", "Gupta", "Female", cse, "Associate Professor", "Ph.D. (Software Engg.)", 11],
    ["E10377", "Harpreet", "Kaur", "Female", ece, "Associate Professor", "Ph.D. (VLSI)", 12],
    ["E10912", "Vikram", "Thakur", "Male", me, "Assistant Professor", "M.E. (Thermal)", 6],
  ];

  const faculty = [];
  for (const [employeeId, firstName, lastName, gender, dept, designation, qualification, experience] of facultyData) {
    faculty.push(
      await Faculty.create({
        employeeId,
        firstName,
        lastName,
        gender,
        designation,
        qualification,
        experience,
        department: dept._id,
        email: `${firstName}.${lastName}@ums.edu`.toLowerCase(),
        phone: `98140${between(10000, 99999)}`,
        joiningDate: new Date(2026 - experience, 6, 15),
        password: "faculty123",
      })
    );
  }
  const [ramesh, priya, arjun, neha, harpreet, vikram] = faculty;

  cse.hod = ramesh._id;
  ece.hod = harpreet._id;
  await Promise.all([cse.save(), ece.save()]);

  /* ---------- subjects ---------- */
  const subjects = await Subject.insertMany([
    { name: "Design and Analysis of Algorithms", code: "23CST-301", branch: cse._id, semester: 5, credits: 4, faculty: ramesh._id },
    { name: "Computer Networks", code: "23CST-302", branch: cse._id, semester: 5, credits: 4, faculty: priya._id },
    { name: "Machine Learning", code: "23CST-303", branch: cse._id, semester: 5, credits: 3, faculty: arjun._id },
    { name: "Software Engineering", code: "23CST-304", branch: cse._id, semester: 5, credits: 3, faculty: neha._id },
    { name: "Full Stack Development Lab", code: "23CSP-305", branch: cse._id, semester: 5, credits: 2, type: "Lab", faculty: priya._id },
    { name: "Data Structures", code: "24CST-201", branch: cse._id, semester: 3, credits: 4, faculty: neha._id },
    { name: "Digital Electronics", code: "24CST-202", branch: cse._id, semester: 3, credits: 3, faculty: arjun._id },
    { name: "Digital Signal Processing", code: "23ECT-301", branch: ece._id, semester: 5, credits: 4, faculty: harpreet._id },
    { name: "Microprocessors & Interfacing", code: "23ECT-302", branch: ece._id, semester: 5, credits: 4, faculty: harpreet._id },
    { name: "Engineering Thermodynamics", code: "24MET-201", branch: me._id, semester: 3, credits: 4, faculty: vikram._id },
    { name: "Strength of Materials", code: "24MET-202", branch: me._id, semester: 3, credits: 4, faculty: vikram._id },
  ]);
  const cseSem5 = subjects.slice(0, 5);
  const [daa, cn, ml, se, fsd] = cseSem5;

  /* ---------- students ---------- */
  const names = [
    ["Aman", "Verma", "Male"],
    ["Simran", "Kaur", "Female"],
    ["Rohit", "Yadav", "Male"],
    ["Ananya", "Mishra", "Female"],
    ["Karan", "Chauhan", "Male"],
    ["Ishita", "Arora", "Female"],
    ["Mohit", "Saini", "Male"],
    ["Pooja", "Rana", "Female"],
    ["Harsh", "Pandey", "Male"],
    ["Tanya", "Bhatia", "Female"],
    ["Yash", "Tiwari", "Male"],
    ["Riya", "Sood", "Female"],
    ["Abhishek", "Rawat", "Male"],
    ["Muskan", "Jindal", "Female"],
  ];
  const bloodGroups = ["B+", "O+", "A+", "AB+", "O-", "B-"];
  const guardians = ["Suresh", "Mahesh", "Rakesh", "Dinesh", "Naresh", "Rajesh", "Mukesh"];

  const studentDocs = [];
  let roll = 101;
  for (const [i, [firstName, lastName, gender]] of names.entries()) {
    const enrollmentNo = `24BCS10${roll++}`;
    studentDocs.push(
      await Student.create({
        enrollmentNo,
        firstName,
        lastName,
        gender,
        email: `${enrollmentNo.toLowerCase()}@cuchd.in`,
        phone: `7${between(100000000, 999999999)}`,
        dob: new Date(2005, between(0, 11), between(1, 28)),
        bloodGroup: bloodGroups[i % bloodGroups.length],
        branch: cse._id,
        semester: 5,
        section: i < 8 ? "A" : "B",
        admissionYear: 2024,
        guardianName: `${guardians[i % guardians.length]} ${lastName}`,
        guardianPhone: `94170${between(10000, 99999)}`,
        address: ["Mohali, Punjab", "Kharar, Punjab", "Ambala, Haryana", "Ludhiana, Punjab", "Shimla, H.P."][i % 5],
        password: "student123",
      })
    );
  }

  // a few students in other branches so filters have something to show
  const others = [
    ["24BEC10211", "Gurpreet", "Singh", "Male", ece, 5],
    ["24BEC10214", "Nidhi", "Sharma", "Female", ece, 5],
    ["25BME10305", "Rahul", "Negi", "Male", me, 3],
    ["25BME10318", "Sakshi", "Dhiman", "Female", me, 3],
    ["25BCE10402", "Deepak", "Kumar", "Male", ce, 3],
  ];
  for (const [enrollmentNo, firstName, lastName, gender, branch, semester] of others) {
    await Student.create({
      enrollmentNo,
      firstName,
      lastName,
      gender,
      branch: branch._id,
      semester,
      email: `${enrollmentNo.toLowerCase()}@cuchd.in`,
      phone: `8${between(100000000, 999999999)}`,
      admissionYear: Number(`20${enrollmentNo.slice(0, 2)}`),
      password: "student123",
    });
  }

  /* ---------- exams & marks ---------- */
  const [mst1, mst2] = await Exam.insertMany([
    { name: "MST-1", type: "MST", branch: cse._id, semester: 5, startDate: new Date(2026, 8, 14), endDate: new Date(2026, 8, 19), maxMarks: 20, passingMarks: 8, resultPublished: true },
    { name: "MST-2", type: "MST", branch: cse._id, semester: 5, startDate: new Date(2026, 9, 26), endDate: new Date(2026, 9, 31), maxMarks: 20, passingMarks: 8, resultPublished: true },
    { name: "End Semester Examination", type: "End Semester", branch: cse._id, semester: 5, startDate: new Date(2026, 11, 8), endDate: new Date(2026, 11, 22), maxMarks: 60, passingMarks: 24 },
    { name: "MST-1", type: "MST", branch: ece._id, semester: 5, startDate: new Date(2026, 8, 15), maxMarks: 20, passingMarks: 8 },
  ]);

  const marks = [];
  for (const exam of [mst1, mst2]) {
    for (const s of studentDocs) {
      for (const sub of [daa, cn, ml, se]) {
        const absent = rand() < 0.02;
        marks.push({
          student: s._id,
          subject: sub._id,
          exam: exam._id,
          marksObtained: absent ? 0 : between(7, 20),
          isAbsent: absent,
          enteredBy: sub.faculty,
        });
      }
    }
  }
  await Marks.insertMany(marks);

  /* ---------- timetable (CSE sem 5, section A) ---------- */
  const periods = [
    ["09:30", "10:20"],
    ["10:20", "11:10"],
    ["11:20", "12:10"],
    ["12:10", "13:00"],
  ];
  const plan = {
    Monday: [daa, cn, ml, se],
    Tuesday: [cn, daa, se, ml],
    Wednesday: [ml, se, daa, cn],
    Thursday: [se, ml, cn, daa],
    Friday: [daa, cn, ml, se],
  };
  const slots = [];
  Object.entries(plan).forEach(([day, subs]) => {
    subs.forEach((sub, i) =>
      slots.push({ day, startTime: periods[i][0], endTime: periods[i][1], subject: sub._id, faculty: sub.faculty, room: "B1-204" })
    );
  });
  // lab after lunch twice a week
  ["Tuesday", "Thursday"].forEach((day) =>
    slots.push({ day, startTime: "13:50", endTime: "15:30", subject: fsd._id, faculty: fsd.faculty, room: "Lab D3-112" })
  );
  await Timetable.create({
    branch: cse._id,
    semester: 5,
    section: "A",
    slots,
    updatedBy: admin._id,
    updatedByModel: "Admin",
  });

  /* ---------- notices ---------- */
  const day = (d) => new Date(Date.now() - d * 86400000);
  await Notice.insertMany([
    {
      title: "End Semester Examination schedule released",
      description:
        "The date sheet for the End Semester Examination (December 2026) has been released. Students are advised to check their roll numbers and report any clash to the examination cell before 28 November.",
      audience: "all",
      important: true,
      postedBy: admin._id,
      postedByModel: "Admin",
      createdAt: day(1),
    },
    {
      title: "Fee payment deadline - Even semester",
      description: "Last date to deposit the even semester fee without late fine is 15 December 2026. Pay through the student portal or at the accounts block, Room 104.",
      audience: "student",
      postedBy: admin._id,
      postedByModel: "Admin",
      createdAt: day(3),
    },
    {
      title: "Faculty meeting on result moderation",
      description: "All faculty members are requested to attend the result moderation meeting on Monday at 3:00 PM in the Seminar Hall, Block B2.",
      audience: "faculty",
      postedBy: admin._id,
      postedByModel: "Admin",
      createdAt: day(4),
    },
    {
      title: "DAA assignment 3 submission",
      description: "Assignment 3 (Dynamic Programming) must be submitted by Friday. Late submissions will not be accepted.",
      audience: "student",
      branch: cse._id,
      postedBy: ramesh._id,
      postedByModel: "Faculty",
      createdAt: day(2),
    },
    {
      title: "Hackathon registrations open",
      description: "Registrations for the inter-department hackathon are open till 30 November. Teams of 2-4 members can register through the technical club.",
      audience: "all",
      link: "https://example.com/hackathon",
      postedBy: admin._id,
      postedByModel: "Admin",
      createdAt: day(6),
    },
  ]);

  /* ---------- study material ---------- */
  const mat = [
    [daa, ramesh, "Unit 1 - Asymptotic Notations", "Notes", "daa-unit1-notes.pdf"],
    [daa, ramesh, "Assignment 3 - Dynamic Programming", "Assignment", "daa-assignment3.pdf"],
    [cn, priya, "OSI and TCP/IP Model - Lecture Slides", "Notes", "cn-osi-tcpip.pdf"],
    [ml, arjun, "ML Syllabus 2026-27", "Syllabus", "ml-syllabus.pdf"],
    [se, neha, "MST-1 Question Paper 2025", "Question Paper", "se-mst1-2025.pdf"],
  ];
  for (const [sub, by, title, type, fileName] of mat) {
    const { file, fileSize } = writeSamplePdf(fileName, [title, `${sub.code} - ${sub.name}`, `Uploaded by ${by.firstName} ${by.lastName}`, "Sample document generated by the seed script."]);
    await Material.create({
      title,
      type,
      subject: sub._id,
      branch: sub.branch,
      semester: sub.semester,
      file,
      fileSize,
      originalName: fileName,
      uploadedBy: by._id,
    });
  }

  console.log("\nDemo data inserted.\n");
  console.log("  Admin    ->  admin@ums.edu        / admin123");
  console.log("  Faculty  ->  E10231 (or email)    / faculty123");
  console.log("  Student  ->  24BCS10101 (or email)/ student123\n");

  if (!skipConnect) {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = run;

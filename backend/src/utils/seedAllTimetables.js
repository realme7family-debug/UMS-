require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const mongoose = require("mongoose");
const Branch = require("../models/Branch");
const Subject = require("../models/Subject");
const Faculty = require("../models/Faculty");
const Timetable = require("../models/Timetable");
const Admin = require("../models/Admin");

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = [
  { start: "09:30", end: "10:20" },
  { start: "10:25", end: "11:15" },
  { start: "11:20", end: "12:10" },
  { start: "01:00", end: "01:50" },
  { start: "01:55", end: "02:45" },
  { start: "02:50", end: "03:40" },
];

const SUBJECTS_PER_BRANCH_SEM = {
  CSE: {
    1: [
      { name: "Calculus and Linear Algebra", code: "24MAT-101", credits: 4, type: "Theory" },
      { name: "Engineering Physics", code: "24PHY-102", credits: 4, type: "Theory" },
      { name: "Programming for Problem Solving", code: "24CST-103", credits: 4, type: "Theory" },
      { name: "Basic Electrical Engineering", code: "24EET-104", credits: 3, type: "Theory" },
      { name: "Programming in C Lab", code: "24CSP-105", credits: 2, type: "Lab" },
    ],
    2: [
      { name: "Advanced Calculus & Complex Analysis", code: "24MAT-151", credits: 4, type: "Theory" },
      { name: "Engineering Chemistry", code: "24CHY-152", credits: 4, type: "Theory" },
      { name: "Object Oriented Programming (C++)", code: "24CST-153", credits: 4, type: "Theory" },
      { name: "Basic Electronics Engineering", code: "24ECT-154", credits: 3, type: "Theory" },
      { name: "OOP Lab", code: "24CSP-155", credits: 2, type: "Lab" },
    ],
    3: [
      { name: "Data Structures & Algorithms", code: "24CST-201", credits: 4, type: "Theory" },
      { name: "Digital Electronics", code: "24CST-202", credits: 4, type: "Theory" },
      { name: "Computer Organization & Architecture", code: "24CST-203", credits: 4, type: "Theory" },
      { name: "Discrete Mathematical Structures", code: "24MAT-204", credits: 4, type: "Theory" },
      { name: "Data Structures Lab", code: "24CSP-205", credits: 2, type: "Lab" },
    ],
    4: [
      { name: "Operating Systems", code: "24CST-251", credits: 4, type: "Theory" },
      { name: "Database Management Systems", code: "24CST-252", credits: 4, type: "Theory" },
      { name: "Theory of Computation", code: "24CST-253", credits: 4, type: "Theory" },
      { name: "Java Programming", code: "24CST-254", credits: 3, type: "Theory" },
      { name: "DBMS Lab", code: "24CSP-255", credits: 2, type: "Lab" },
    ],
    5: [
      { name: "Design and Analysis of Algorithms", code: "23CST-301", credits: 4, type: "Theory" },
      { name: "Computer Networks", code: "23CST-302", credits: 4, type: "Theory" },
      { name: "Machine Learning", code: "23CST-303", credits: 4, type: "Theory" },
      { name: "Software Engineering", code: "23CST-304", credits: 3, type: "Theory" },
      { name: "Full Stack Development Lab", code: "23CSP-305", credits: 2, type: "Lab" },
    ],
    6: [
      { name: "Compiler Design", code: "23CST-351", credits: 4, type: "Theory" },
      { name: "Cloud Computing & DevOps", code: "23CST-352", credits: 4, type: "Theory" },
      { name: "Information & Cyber Security", code: "23CST-353", credits: 3, type: "Theory" },
      { name: "Artificial Intelligence", code: "23CST-354", credits: 4, type: "Theory" },
      { name: "Cloud & DevOps Lab", code: "23CSP-355", credits: 2, type: "Lab" },
    ],
    7: [
      { name: "Big Data Analytics", code: "22CST-401", credits: 4, type: "Theory" },
      { name: "Deep Learning & Neural Networks", code: "22CST-402", credits: 4, type: "Theory" },
      { name: "Blockchain Technologies", code: "22CST-403", credits: 3, type: "Theory" },
      { name: "Capstone Project Phase-I", code: "22CSP-404", credits: 4, type: "Lab" },
    ],
    8: [
      { name: "High Performance Computing", code: "22CST-451", credits: 4, type: "Theory" },
      { name: "Natural Language Processing", code: "22CST-452", credits: 4, type: "Theory" },
      { name: "Major Project & Internship", code: "22CSP-453", credits: 10, type: "Lab" },
    ],
  },
  ECE: {
    1: [
      { name: "Calculus and Linear Algebra", code: "24MAT-101E", credits: 4, type: "Theory" },
      { name: "Engineering Physics", code: "24PHY-102E", credits: 4, type: "Theory" },
      { name: "Basic Electrical Engineering", code: "24EET-103E", credits: 4, type: "Theory" },
      { name: "Electrical Circuit Analysis Lab", code: "24EEP-104E", credits: 2, type: "Lab" },
    ],
    2: [
      { name: "Ordinary Differential Equations", code: "24MAT-151E", credits: 4, type: "Theory" },
      { name: "Semiconductor Physics", code: "24PHY-152E", credits: 4, type: "Theory" },
      { name: "Basic Electronics Engineering", code: "24ECT-153E", credits: 4, type: "Theory" },
      { name: "Electronics Devices Lab", code: "24ECP-154E", credits: 2, type: "Lab" },
    ],
    3: [
      { name: "Electronic Devices & Circuits", code: "24ECT-201", credits: 4, type: "Theory" },
      { name: "Digital Logic Design", code: "24ECT-202", credits: 4, type: "Theory" },
      { name: "Signals and Systems", code: "24ECT-203", credits: 4, type: "Theory" },
      { name: "Network Theory", code: "24ECT-204", credits: 3, type: "Theory" },
      { name: "Analog Circuits Lab", code: "24ECP-205", credits: 2, type: "Lab" },
    ],
    4: [
      { name: "Analog Communication", code: "24ECT-251", credits: 4, type: "Theory" },
      { name: "Electromagnetic Waves & Fields", code: "24ECT-252", credits: 4, type: "Theory" },
      { name: "Linear Integrated Circuits", code: "24ECT-253", credits: 4, type: "Theory" },
      { name: "Microcontroller 8051", code: "24ECT-254", credits: 3, type: "Theory" },
      { name: "Communication Lab", code: "24ECP-255", credits: 2, type: "Lab" },
    ],
    5: [
      { name: "Digital Signal Processing", code: "23ECT-301", credits: 4, type: "Theory" },
      { name: "Microprocessors & Interfacing", code: "23ECT-302", credits: 4, type: "Theory" },
      { name: "Digital Communication", code: "23ECT-303", credits: 4, type: "Theory" },
      { name: "Control Systems", code: "23ECT-304", credits: 3, type: "Theory" },
      { name: "DSP & Microprocessor Lab", code: "23ECP-305", credits: 2, type: "Lab" },
    ],
    6: [
      { name: "VLSI Design & Technology", code: "23ECT-351", credits: 4, type: "Theory" },
      { name: "Antennas & Wave Propagation", code: "23ECT-352", credits: 4, type: "Theory" },
      { name: "Microwave Engineering", code: "23ECT-353", credits: 3, type: "Theory" },
      { name: "VLSI CAD Lab", code: "23ECP-354", credits: 2, type: "Lab" },
    ],
    7: [
      { name: "Wireless & Mobile Communication", code: "22ECT-401", credits: 4, type: "Theory" },
      { name: "Embedded Systems & IoT", code: "22ECT-402", credits: 4, type: "Theory" },
      { name: "Optical Fiber Communication", code: "22ECT-403", credits: 3, type: "Theory" },
      { name: "Embedded IoT Lab", code: "22ECP-404", credits: 2, type: "Lab" },
    ],
    8: [
      { name: "Satellite Communication", code: "22ECT-451", credits: 4, type: "Theory" },
      { name: "Radar and Navigational Aids", code: "22ECT-452", credits: 3, type: "Theory" },
      { name: "Major Project / Internship", code: "22ECP-453", credits: 10, type: "Lab" },
    ],
  },
  ME: {
    1: [
      { name: "Engineering Mathematics-I", code: "24MAT-101M", credits: 4, type: "Theory" },
      { name: "Engineering Physics", code: "24PHY-102M", credits: 4, type: "Theory" },
      { name: "Basic Mechanical Engineering", code: "24MET-103", credits: 3, type: "Theory" },
      { name: "Workshop Practice Lab", code: "24MEP-104", credits: 2, type: "Lab" },
    ],
    2: [
      { name: "Engineering Mathematics-II", code: "24MAT-151M", credits: 4, type: "Theory" },
      { name: "Engineering Chemistry", code: "24CHY-152M", credits: 4, type: "Theory" },
      { name: "Engineering Graphics & Design", code: "24MET-153", credits: 4, type: "Theory" },
      { name: "CAD Lab", code: "24MEP-154", credits: 2, type: "Lab" },
    ],
    3: [
      { name: "Engineering Thermodynamics", code: "24MET-201", credits: 4, type: "Theory" },
      { name: "Strength of Materials", code: "24MET-202", credits: 4, type: "Theory" },
      { name: "Materials Science & Metallurgy", code: "24MET-203", credits: 3, type: "Theory" },
      { name: "Fluid Mechanics & Machines", code: "24MET-204", credits: 4, type: "Theory" },
      { name: "Material Testing Lab", code: "24MEP-205", credits: 2, type: "Lab" },
    ],
    4: [
      { name: "Kinematics of Machinery", code: "24MET-251", credits: 4, type: "Theory" },
      { name: "Manufacturing Processes", code: "24MET-252", credits: 4, type: "Theory" },
      { name: "Applied Thermodynamics", code: "24MET-253", credits: 4, type: "Theory" },
      { name: "Manufacturing Practice Lab", code: "24MEP-254", credits: 2, type: "Lab" },
    ],
    5: [
      { name: "Heat & Mass Transfer", code: "23MET-301", credits: 4, type: "Theory" },
      { name: "Design of Machine Elements", code: "23MET-302", credits: 4, type: "Theory" },
      { name: "Dynamics of Machines", code: "23MET-303", credits: 4, type: "Theory" },
      { name: "Heat Transfer Lab", code: "23MEP-304", credits: 2, type: "Lab" },
    ],
    6: [
      { name: "IC Engines and Gas Turbines", code: "23MET-351", credits: 4, type: "Theory" },
      { name: "Metrology and Quality Control", code: "23MET-352", credits: 3, type: "Theory" },
      { name: "Refrigeration & Air Conditioning", code: "23MET-353", credits: 4, type: "Theory" },
      { name: "Thermal Engineering Lab", code: "23MEP-354", credits: 2, type: "Lab" },
    ],
    7: [
      { name: "Computer Aided Design & Manufacturing", code: "22MET-401", credits: 4, type: "Theory" },
      { name: "Automobile Engineering", code: "22MET-402", credits: 4, type: "Theory" },
      { name: "Operations Research", code: "22MET-403", credits: 3, type: "Theory" },
      { name: "CAD/CAM Lab", code: "22MEP-404", credits: 2, type: "Lab" },
    ],
    8: [
      { name: "Robotics and Automation", code: "22MET-451", credits: 4, type: "Theory" },
      { name: "Power Plant Engineering", code: "22MET-452", credits: 4, type: "Theory" },
      { name: "Major Project", code: "22MEP-453", credits: 10, type: "Lab" },
    ],
  },
  CE: {
    1: [
      { name: "Engineering Mathematics-I", code: "24MAT-101C", credits: 4, type: "Theory" },
      { name: "Engineering Mechanics", code: "24CET-102", credits: 4, type: "Theory" },
      { name: "Basic Civil Engineering", code: "24CET-103", credits: 3, type: "Theory" },
      { name: "Civil Engineering Workshop", code: "24CEP-104", credits: 2, type: "Lab" },
    ],
    2: [
      { name: "Engineering Mathematics-II", code: "24MAT-151C", credits: 4, type: "Theory" },
      { name: "Engineering Chemistry", code: "24CHY-152C", credits: 4, type: "Theory" },
      { name: "Building Materials & Construction", code: "24CET-153", credits: 4, type: "Theory" },
      { name: "Materials Testing Lab", code: "24CEP-154", credits: 2, type: "Lab" },
    ],
    3: [
      { name: "Surveying & Geomatics", code: "24CET-201", credits: 4, type: "Theory" },
      { name: "Mechanics of Solids", code: "24CET-202", credits: 4, type: "Theory" },
      { name: "Fluid Mechanics", code: "24CET-203", credits: 4, type: "Theory" },
      { name: "Surveying Practice Lab", code: "24CEP-204", credits: 2, type: "Lab" },
    ],
    4: [
      { name: "Structural Analysis-I", code: "24CET-251", credits: 4, type: "Theory" },
      { name: "Concrete Technology", code: "24CET-252", credits: 4, type: "Theory" },
      { name: "Hydraulics & Hydraulic Machines", code: "24CET-253", credits: 4, type: "Theory" },
      { name: "Concrete Lab", code: "24CEP-254", credits: 2, type: "Lab" },
    ],
    5: [
      { name: "Design of Concrete Structures", code: "23CET-301", credits: 4, type: "Theory" },
      { name: "Geotechnical Engineering", code: "23CET-302", credits: 4, type: "Theory" },
      { name: "Transportation Engineering", code: "23CET-303", credits: 4, type: "Theory" },
      { name: "Soil Mechanics Lab", code: "23CEP-304", credits: 2, type: "Lab" },
    ],
    6: [
      { name: "Design of Steel Structures", code: "23CET-351", credits: 4, type: "Theory" },
      { name: "Environmental Engineering-I", code: "23CET-352", credits: 4, type: "Theory" },
      { name: "Hydrology & Water Resources", code: "23CET-353", credits: 3, type: "Theory" },
      { name: "Environmental Lab", code: "23CEP-354", credits: 2, type: "Lab" },
    ],
    7: [
      { name: "Earthquake Resistant Design", code: "22CET-401", credits: 4, type: "Theory" },
      { name: "Estimation, Costing & Valuation", code: "22CET-402", credits: 3, type: "Theory" },
      { name: "Foundation Engineering", code: "22CET-403", credits: 4, type: "Theory" },
      { name: "Structural Design Project", code: "22CEP-404", credits: 3, type: "Lab" },
    ],
    8: [
      { name: "Construction Project Management", code: "22CET-451", credits: 4, type: "Theory" },
      { name: "Bridge Engineering", code: "22CET-452", credits: 4, type: "Theory" },
      { name: "Major Project Work", code: "22CEP-453", credits: 10, type: "Lab" },
    ],
  },
};

const ROOM_NUMBERS = ["LT-101", "LT-102", "LT-103", "LT-201", "LT-202", "CS-LAB-1", "CS-LAB-2", "EC-LAB", "MECH-HALL", "CIVIL-SEM"];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB for Timetable & Subject initialization...");

  const admin = await Admin.findOne({ email: "admin@ums.edu" });
  const adminId = admin ? admin._id : new mongoose.Types.ObjectId();

  const branches = await Branch.find();
  const allFaculty = await Faculty.find();

  console.log(`Found ${branches.length} branches and ${allFaculty.length} faculty members.`);

  let totalSubjects = 0;
  let totalTimetables = 0;

  for (const b of branches) {
    const branchCode = b.code;
    const branchFaculty = allFaculty.filter(f => String(f.department) === String(b._id));
    const facultyPool = branchFaculty.length > 0 ? branchFaculty : allFaculty;

    const semMap = SUBJECTS_PER_BRANCH_SEM[branchCode] || {};

    for (let sem = 1; sem <= 8; sem++) {
      const subjectDefs = semMap[sem] || [
        { name: `${branchCode} Core Subject ${sem}-1`, code: `${branchCode}T-${sem}01`, credits: 4, type: "Theory" },
        { name: `${branchCode} Core Subject ${sem}-2`, code: `${branchCode}T-${sem}02`, credits: 4, type: "Theory" },
        { name: `${branchCode} Core Subject ${sem}-3`, code: `${branchCode}T-${sem}03`, credits: 3, type: "Theory" },
        { name: `${branchCode} Practical Lab ${sem}`, code: `${branchCode}P-${sem}04`, credits: 2, type: "Lab" },
      ];

      const createdSubjects = [];
      for (let sIdx = 0; sIdx < subjectDefs.length; sIdx++) {
        const sDef = subjectDefs[sIdx];
        const assignedFac = facultyPool[sIdx % facultyPool.length];
        
        let sub = await Subject.findOne({ code: sDef.code });
        if (!sub) {
          sub = await Subject.create({
            name: sDef.name,
            code: sDef.code,
            branch: b._id,
            semester: sem,
            credits: sDef.credits,
            type: sDef.type,
            faculty: assignedFac ? assignedFac._id : null,
          });
        } else {
          sub.branch = b._id;
          sub.semester = sem;
          if (assignedFac && !sub.faculty) sub.faculty = assignedFac._id;
          await sub.save();
        }
        createdSubjects.push(sub);
        totalSubjects++;
      }

      // Generate timetable for Sections A, B, C
      const sections = ["A", "B", "C"];
      for (const sec of sections) {
        const slots = [];
        // Monday through Friday
        DAYS.forEach((day, dIdx) => {
          // 4-5 periods per day
          const dayPeriods = PERIODS.slice(0, 4 + (dIdx % 2));
          dayPeriods.forEach((period, pIdx) => {
            const sub = createdSubjects[(dIdx + pIdx) % createdSubjects.length];
            const room = ROOM_NUMBERS[(dIdx * 2 + pIdx) % ROOM_NUMBERS.length];
            slots.push({
              day,
              startTime: period.start,
              endTime: period.end,
              subject: sub._id,
              faculty: sub.faculty || facultyPool[pIdx % facultyPool.length]?._id,
              room,
            });
          });
        });

        await Timetable.findOneAndUpdate(
          { branch: b._id, semester: sem, section: sec },
          {
            branch: b._id,
            semester: sem,
            section: sec,
            slots,
            updatedBy: adminId,
            updatedByModel: "Admin",
          },
          { upsert: true, new: true }
        );
        totalTimetables++;
      }
    }
  }

  console.log(`Successfully generated and verified ${totalSubjects} subjects across all branches and semesters!`);
  console.log(`Successfully generated ${totalTimetables} complete weekly class timetables!`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error("Timetable seed error:", err);
  process.exit(1);
});

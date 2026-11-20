require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Admin = require("../models/Admin");
const Faculty = require("../models/Faculty");
const Student = require("../models/Student");
const Branch = require("../models/Branch");
const Subject = require("../models/Subject");
const Exam = require("../models/Exam");
const Marks = require("../models/Marks");

const FIRST_NAMES_MALE = [
  "Aarav", "Aditya", "Akash", "Alok", "Aman", "Amit", "Anand", "Aniket", "Ankur", "Anshul",
  "Arjun", "Ashish", "Ayush", "Bhavya", "Chetan", "Deepak", "Dev", "Dhruv", "Divyansh", "Gaurav",
  "Harsh", "Hemant", "Himanshu", "Ishaan", "Jatin", "Karan", "Kartik", "Kunal", "Lakshay", "Manish",
  "Mayank", "Mohit", "Naveen", "Nikhil", "Nitin", "Pankaj", "Pranav", "Prateek", "Priyansh", "Rahul",
  "Raj", "Rajesh", "Rajat", "Rakesh", "Ramesh", "Rishabh", "Rohan", "Rohit", "Sachin", "Sahil",
  "Samar", "Sameer", "Sanjay", "Sarthak", "Saurabh", "Shivam", "Shubham", "Siddharth", "Sourabh", "Sparsh",
  "Sumit", "Sunil", "Suraj", "Suresh", "Tanmay", "Tarun", "Udit", "Utkarsh", "Varun", "Vikas",
  "Vikram", "Vinay", "Vipin", "Vishal", "Vivek", "Yash", "Yogesh", "Abhinav", "Abhishek", "Ashwani"
];

const FIRST_NAMES_FEMALE = [
  "Aakanksha", "Aanchal", "Aarti", "Aditi", "Aishwarya", "Akanksha", "Alka", "Amrita", "Anamika", "Ananya",
  "Anjali", "Ankita", "Anshika", "Anushka", "Archana", "Arohi", "Avani", "Bhavna", "Chhavi", "Deepika",
  "Dimple", "Disha", "Divya", "Garima", "Gauri", "Gunjan", "Harleen", "Harpreet", "Ishita", "Jaya",
  "Jyoti", "Kanika", "Karishma", "Kashish", "Kavita", "Khushi", "Kirti", "Komal", "Kritika", "Mahima",
  "Mansi", "Meenakshi", "Megha", "Monika", "Muskan", "Nandini", "Navya", "Neha", "Nidhi", "Nikita",
  "Nisha", "Palak", "Pallavi", "Parul", "Payal", "Pooja", "Prachi", "Prerna", "Preeti", "Priya",
  "Priyanka", "Radhika", "Rani", "Rashmi", "Rashi", "Reet", "Renu", "Richa", "Riddhi", "Ritu",
  "Riya", "Ruchi", "Sakshi", "Saloni", "Samiksha", "Sandhya", "Sanya", "Sapna", "Shalini", "Shivani",
  "Shreya", "Shruti", "Shweta", "Simran", "Sneha", "Sonam", "Srishti", "Suman", "Sunita", "Surabhi",
  "Swati", "Tanisha", "Tanu", "Tanvi", "Tanya", "Urvi", "Vaishali", "Vandana", "Varsha", "Vidhi"
];

const LAST_NAMES = [
  "Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Malhotra", "Mehta", "Kaur", "Thakur",
  "Bansal", "Joshi", "Aggarwal", "Bhatia", "Saxena", "Mishra", "Dubey", "Tiwari", "Pandey", "Yadav",
  "Rao", "Reddy", "Nair", "Pillai", "Iyer", "Chawla", "Ahuja", "Sethi", "Kapoor", "Khanna",
  "Bhardwaj", "Chaudhary", "Chopra", "Deshmukh", "Garg", "Goel", "Goyal", "Grover", "Gulati", "Jain",
  "Jindal", "Mahajan", "Mathur", "Mittals", "Nagpal", "Narang", "Rawat", "Saini", "Shukla", "Soni"
];

const BLOOD_GROUPS = ["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"];
const CITIES = ["Chandigarh", "Mohali", "Panchkula", "Delhi", "Gurugram", "Noida", "Jaipur", "Ludhiana", "Amritsar", "Jalandhar", "Dehradun", "Lucknow", "Patna", "Indore", "Bhopal"];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function populate() {
  console.log("Connecting to MongoDB:", process.env.MONGO_URI);
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected successfully!");

  // 1. Setup Admin as "Nikhil Singh"
  console.log("\n--- Configuring Admin: Nikhil Singh ---");
  await Admin.deleteMany({});
  const admin = await Admin.create({
    employeeId: "ADM001",
    name: "Nikhil Singh",
    email: "admin@ums.edu",
    phone: "9876500001",
    designation: "Head Administrator & Registrar",
    password: "admin123",
    isSuperAdmin: true,
    status: "active",
  });
  console.log("Admin registered:", admin.name, `(${admin.email})`);

  // 2. Fetch Branches
  const branches = await Branch.find();
  if (branches.length === 0) {
    console.error("No branches found! Run npm run seed first.");
    process.exit(1);
  }
  const cseBranch = branches.find((b) => b.code === "CSE") || branches[0];
  const eceBranch = branches.find((b) => b.code === "ECE") || branches[1] || branches[0];
  const meBranch = branches.find((b) => b.code === "ME") || branches[2] || branches[0];
  const ceBranch = branches.find((b) => b.code === "CE") || branches[3] || branches[0];

  // 3. Populate EXACTLY 60 Faculty Members
  console.log("\n--- Populating EXACTLY 60 Faculty Members ---");
  await Faculty.deleteMany({});
  const hashedFacultyPass = await bcrypt.hash("faculty123", 10);

  const facultyDocs = [];
  const designations = [
    { title: "Professor", qual: "Ph.D., Post-Doc", exp: [15, 25] },
    { title: "Associate Professor", qual: "Ph.D.", exp: [8, 15] },
    { title: "Assistant Professor", qual: "M.Tech / Ph.D. Pursuing", exp: [3, 8] },
    { title: "Lecturer", qual: "M.Tech", exp: [2, 6] },
    { title: "Lab Instructor", qual: "B.Tech / MCA", exp: [2, 5] },
  ];

  for (let i = 1; i <= 60; i++) {
    const isMale = i % 2 !== 0;
    const firstName = isMale ? pick(FIRST_NAMES_MALE) : pick(FIRST_NAMES_FEMALE);
    const lastName = pick(LAST_NAMES);
    const empId = `E100${String(i).padStart(3, "0")}`;
    const email = `faculty${String(i).padStart(2, "0")}@ums.edu`;

    const dept = i <= 24 ? cseBranch._id : i <= 40 ? eceBranch._id : i <= 50 ? meBranch._id : ceBranch._id;
    const desigObj = i % 10 === 1 ? designations[0] : i % 5 === 0 ? designations[1] : designations[2];
    const exp = randInt(desigObj.exp[0], desigObj.exp[1]);
    const joiningYear = 2026 - Math.min(exp, 12);

    facultyDocs.push({
      employeeId: empId,
      firstName,
      lastName,
      email,
      phone: `98${randInt(10000000, 99999999)}`,
      gender: isMale ? "Male" : "Female",
      dob: new Date(1975 + randInt(0, 18), randInt(0, 11), randInt(1, 28)),
      department: dept,
      designation: desigObj.title,
      qualification: `${desigObj.qual}`,
      experience: exp,
      joiningDate: new Date(joiningYear, randInt(0, 11), randInt(1, 28)),
      address: `${randInt(10, 999)}, Sector ${randInt(1, 70)}, ${pick(CITIES)}`,
      status: "active",
      password: hashedFacultyPass,
    });
  }

  // Dr. Ramesh Sharma as E10231
  facultyDocs[0].employeeId = "E10231";
  facultyDocs[0].firstName = "Ramesh";
  facultyDocs[0].lastName = "Sharma";
  facultyDocs[0].email = "ramesh.sharma@ums.edu";
  facultyDocs[0].department = cseBranch._id;
  facultyDocs[0].designation = "Professor";

  const insertedFaculty = await Faculty.insertMany(facultyDocs);
  console.log(`Inserted EXACTLY ${insertedFaculty.length} faculty members.`);

  // 4. Populate EXACTLY 260 Students
  console.log("\n--- Populating EXACTLY 260 Students ---");
  await Student.deleteMany({});
  const hashedStudentPass = await bcrypt.hash("student123", 10);
  const hashedNikhilPass = await bcrypt.hash("Nikhil@28", 10);
  const hashedAkshitPass = await bcrypt.hash("karamlove", 10);

  const studentDocs = [];
  const TOTAL_STUDENTS = 260;

  // Student 1: 24BCS10101 (Aarav Sharma - demo)
  studentDocs.push({
    enrollmentNo: "24BCS10101",
    firstName: "Aarav",
    lastName: "Sharma",
    email: "aarav.sharma@ums.edu",
    phone: "919876543211",
    gender: "Male",
    dob: new Date(2004, 2, 10),
    bloodGroup: "O+",
    branch: cseBranch._id,
    semester: 5,
    section: "A",
    admissionYear: 2024,
    guardianName: "Rajesh Sharma",
    guardianPhone: "9876500010",
    address: "Chandigarh",
    status: "active",
    password: hashedStudentPass,
  });

  // Student 2: 24BCS10116 (Nikhil Singh)
  studentDocs.push({
    enrollmentNo: "24BCS10116",
    firstName: "Nikhil",
    lastName: "Singh",
    email: "nikhil.singh@ums.edu",
    phone: "9876543210",
    gender: "Male",
    dob: new Date(2004, 7, 28),
    bloodGroup: "B+",
    branch: cseBranch._id,
    semester: 5,
    section: "A",
    admissionYear: 2024,
    guardianName: "Rajesh Singh",
    guardianPhone: "9876500002",
    address: "Chandigarh University Campus, Mohali, Punjab",
    status: "active",
    password: hashedNikhilPass,
  });

  // Student 3: 24BCS10974 (Akshit with 83% marks)
  studentDocs.push({
    enrollmentNo: "24BCS10974",
    firstName: "Akshit",
    lastName: "",
    email: "akshit@ums.edu",
    phone: "9876543299",
    gender: "Male",
    dob: new Date(2004, 5, 15),
    bloodGroup: "O+",
    branch: cseBranch._id,
    semester: 5,
    section: "A",
    admissionYear: 2024,
    guardianName: "Rajesh Kumar",
    guardianPhone: "9876500099",
    address: "Chandigarh University, Mohali",
    status: "active",
    password: hashedAkshitPass,
  });

  // Students 4 to 260 (257 students)
  const remaining = TOTAL_STUDENTS - studentDocs.length;
  for (let s = 1; s <= remaining; s++) {
    const isMale = s % 2 !== 0;
    const firstName = isMale ? pick(FIRST_NAMES_MALE) : pick(FIRST_NAMES_FEMALE);
    const lastName = pick(LAST_NAMES);

    // Distribute across branches: CSE (45%), ECE (22%), ME (18%), CE (15%)
    const b = s <= 115 ? cseBranch : s <= 170 ? eceBranch : s <= 215 ? meBranch : ceBranch;
    const prefix = b.code === "CSE" ? "24BCS" : b.code === "ECE" ? "24ECE" : b.code === "ME" ? "24BME" : "24BCE";
    const rollNo = `${prefix}${String(10120 + s)}`;
    const sem = ((s - 1) % 8) + 1;
    const sec = ["A", "B", "C"][s % 3];

    studentDocs.push({
      enrollmentNo: rollNo,
      firstName,
      lastName,
      email: `student${s + 3}@ums.edu`,
      phone: `91${randInt(10000000, 99999999)}`,
      gender: isMale ? "Male" : "Female",
      dob: new Date(2003 + randInt(0, 3), randInt(0, 11), randInt(1, 28)),
      bloodGroup: pick(BLOOD_GROUPS),
      branch: b._id,
      semester: sem,
      section: sec,
      admissionYear: 2024 - Math.floor((sem - 1) / 2),
      guardianName: `${pick(FIRST_NAMES_MALE)} ${lastName}`,
      guardianPhone: `98${randInt(10000000, 99999999)}`,
      address: `House #${randInt(1, 450)}, ${pick(CITIES)}`,
      status: "active",
      password: hashedStudentPass,
    });
  }

  const insertedStudents = await Student.insertMany(studentDocs);
  console.log(`Inserted EXACTLY ${insertedStudents.length} students.`);

  // 5. Create 83% Marks for Akshit
  const akshitDoc = insertedStudents.find((s) => s.enrollmentNo === "24BCS10974");
  let exam = await Exam.findOne({ branch: cseBranch._id, semester: 5, resultPublished: true });
  if (!exam) {
    exam = await Exam.create({
      name: "Mid-Semester Examination (MST-1)",
      type: "MST",
      branch: cseBranch._id,
      semester: 5,
      startDate: new Date(2026, 8, 14),
      endDate: new Date(2026, 8, 19),
      maxMarks: 20,
      passingMarks: 8,
      resultPublished: true,
    });
  }

  const subjects = await Subject.find({ branch: cseBranch._id, semester: 5 }).limit(5);
  await Marks.deleteMany({ student: akshitDoc._id });
  const akshitScores = [17, 17, 16, 17, 16]; // 83 / 100 = 83%
  for (let i = 0; i < subjects.length; i++) {
    await Marks.create({
      student: akshitDoc._id,
      subject: subjects[i]._id,
      exam: exam._id,
      marksObtained: akshitScores[i % akshitScores.length],
      isAbsent: false,
      remarks: "Very Good Performance",
      enteredBy: subjects[i].faculty || null,
    });
  }
  console.log("Configured 83% marks for Akshit (24BCS10974).");

  console.log("\n=== SUMMARY ===");
  console.log(`Total Students: ${insertedStudents.length} (Requested: 260)`);
  console.log(`Total Faculty: ${insertedFaculty.length} (Requested: 60)`);
  console.log(`Admin Name: ${admin.name} (admin@ums.edu)`);
  console.log("Akshit (24BCS10974 / karamlove): 83% marks confirmed!");

  await mongoose.disconnect();
}

populate().catch((err) => {
  console.error("Error populating exact counts:", err);
  process.exit(1);
});

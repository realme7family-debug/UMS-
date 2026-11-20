require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Admin = require("../models/Admin");
const Faculty = require("../models/Faculty");
const Student = require("../models/Student");
const Branch = require("../models/Branch");
const Subject = require("../models/Subject");

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
  const hashedAdminPass = await bcrypt.hash("admin123", 10);
  
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
  const cseBranch = branches.find(b => b.code === "CSE") || branches[0];
  const eceBranch = branches.find(b => b.code === "ECE") || branches[1] || branches[0];
  const meBranch = branches.find(b => b.code === "ME") || branches[2] || branches[0];
  const ceBranch = branches.find(b => b.code === "CE") || branches[3] || branches[0];

  // 3. Populate 80 Faculty Members
  console.log("\n--- Populating 80 Faculty Members ---");
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

  for (let i = 1; i <= 80; i++) {
    const isMale = i % 2 !== 0;
    const firstName = isMale ? pick(FIRST_NAMES_MALE) : pick(FIRST_NAMES_FEMALE);
    const lastName = pick(LAST_NAMES);
    const empId = `E100${String(i).padStart(3, "0")}`;
    const email = `faculty${String(i).padStart(2, "0")}@ums.edu`;
    
    // Distribute among branches
    const dept = i <= 35 ? cseBranch._id : i <= 55 ? eceBranch._id : i <= 70 ? meBranch._id : ceBranch._id;
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
      password: hashedFacultyPass, // already hashed
    });
  }

  // Keep Dr. Ramesh Sharma as E10231 for compatibility with demo logins
  facultyDocs[0].employeeId = "E10231";
  facultyDocs[0].firstName = "Ramesh";
  facultyDocs[0].lastName = "Sharma";
  facultyDocs[0].email = "ramesh.sharma@ums.edu";
  facultyDocs[0].department = cseBranch._id;
  facultyDocs[0].designation = "Professor";

  const insertedFaculty = await Faculty.insertMany(facultyDocs);
  console.log(`Inserted ${insertedFaculty.length} faculty members.`);

  // 4. Populate 260 Students
  console.log("\n--- Populating 260 Students ---");
  await Student.deleteMany({});
  const hashedStudentPass = await bcrypt.hash("student123", 10);

  const studentDocs = [];
  const branchList = [
    { branch: cseBranch, prefix: "24BCS", count: 120 },
    { branch: eceBranch, prefix: "24ECE", count: 55 },
    { branch: meBranch, prefix: "24BME", count: 45 },
    { branch: ceBranch, prefix: "24BCE", count: 40 },
  ];

  let studentCounter = 1;
  for (const bInfo of branchList) {
    for (let j = 1; j <= bInfo.count; j++) {
      const isMale = studentCounter % 2 !== 0;
      const firstName = isMale ? pick(FIRST_NAMES_MALE) : pick(FIRST_NAMES_FEMALE);
      const lastName = pick(LAST_NAMES);
      const rollNumber = `${bInfo.prefix}${String(10000 + j).slice(-4)}`;
      const sem = ((j - 1) % 8) + 1;
      const sec = ["A", "B", "C"][j % 3];
      const city = pick(CITIES);
      const guardianLast = lastName;
      const guardianFirst = pick(FIRST_NAMES_MALE);

      studentDocs.push({
        enrollmentNo: rollNumber,
        firstName,
        lastName,
        email: `student${studentCounter}@ums.edu`,
        phone: `91${randInt(10000000, 99999999)}`,
        gender: isMale ? "Male" : "Female",
        dob: new Date(2003 + randInt(0, 3), randInt(0, 11), randInt(1, 28)),
        bloodGroup: pick(BLOOD_GROUPS),
        branch: bInfo.branch._id,
        semester: sem,
        section: sec,
        admissionYear: 2024 - Math.floor((sem - 1) / 2),
        guardianName: `${guardianFirst} ${guardianLast}`,
        guardianPhone: `98${randInt(10000000, 99999999)}`,
        address: `House #${randInt(1, 450)}, ${city}`,
        status: "active",
        password: hashedStudentPass,
      });
      studentCounter++;
    }
  }

  // Ensure 24BCS10101 exists for demo login
  studentDocs[0].enrollmentNo = "24BCS10101";
  studentDocs[0].firstName = "Aarav";
  studentDocs[0].lastName = "Sharma";
  studentDocs[0].email = "aarav.sharma@ums.edu";
  studentDocs[0].branch = cseBranch._id;
  studentDocs[0].semester = 5;
  studentDocs[0].section = "A";

  const insertedStudents = await Student.insertMany(studentDocs);
  console.log(`Inserted ${insertedStudents.length} students.`);

  // 5. Assign some faculty to subjects
  const subjects = await Subject.find();
  if (subjects.length > 0) {
    for (let k = 0; k < subjects.length; k++) {
      const fac = insertedFaculty[k % insertedFaculty.length];
      await Subject.updateOne({ _id: subjects[k]._id }, { $set: { faculty: fac._id } });
    }
    console.log(`Updated subject faculty assignments for ${subjects.length} subjects.`);
  }

  console.log("\n=== SUMMARY ===");
  console.log("Admin Name: Nikhil Singh (admin@ums.edu / admin123)");
  console.log(`Total Students: ${insertedStudents.length}`);
  console.log(`Total Faculty: ${insertedFaculty.length}`);
  console.log("Populated database with 260 students, 80 faculty, and Admin Nikhil Singh successfully!\n");

  await mongoose.disconnect();
}

populate().catch(err => {
  console.error("Population error:", err);
  process.exit(1);
});

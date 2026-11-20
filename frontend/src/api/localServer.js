/**
 * Local data mode.
 *
 * Implements the same REST endpoints as the Express backend, but keeps the data
 * in the browser (localStorage). It is plugged into axios as an adapter, so every
 * page works exactly the same in both modes.
 *
 *   VITE_DATA_MODE=local  -> this file is used
 *   VITE_DATA_MODE=api    -> requests go to the Node/Express server (default)
 */

const STORAGE_KEY = "ums_local_db_v1";
const TOKEN_TTL = 24 * 60 * 60 * 1000;

/* ------------------------------------------------------------------ */
/* storage                                                             */
/* ------------------------------------------------------------------ */

let memory = null;

const newId = () =>
  Array.from({ length: 24 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
const now = () => new Date().toISOString();
const clone = (v) => JSON.parse(JSON.stringify(v));

function load() {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) memory = JSON.parse(raw);
  } catch {
    /* storage blocked - keep data in memory only */
  }
  if (!memory) {
    memory = seedData();
    save();
  }
  return memory;
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {
    /* quota exceeded or storage blocked */
  }
}

export function resetLocalData() {
  memory = seedData();
  save();
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const fail = (status, message) => {
  throw new HttpError(status, message);
};

const pick = (obj, keys) =>
  keys.reduce((acc, k) => {
    if (obj[k] !== undefined && obj[k] !== "") acc[k] = obj[k];
    return acc;
  }, {});

const NUMERIC = ["semester", "credits", "maxMarks", "passingMarks", "experience", "admissionYear", "totalSemesters", "marksObtained"];
const normalise = (obj) => {
  const out = { ...obj };
  NUMERIC.forEach((k) => {
    if (out[k] !== undefined && out[k] !== "" && out[k] !== null) out[k] = Number(out[k]);
  });
  ["important", "resultPublished", "isAbsent"].forEach((k) => {
    if (typeof out[k] === "string") out[k] = out[k] === "true";
  });
  return out;
};

const rx = (text) => new RegExp(String(text).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
const byId = (list, id) => list.find((x) => x._id === id);
const strip = ({ password, ...rest }) => rest; // never send passwords out

const requireFields = (obj, fields) => {
  for (const [key, label] of fields) {
    if (obj[key] === undefined || obj[key] === "" || obj[key] === null) fail(400, `${label} is required`);
  }
};

const unique = (list, field, value, label, exceptId) => {
  if (!value) return;
  const v = String(value).toLowerCase();
  if (list.some((x) => x._id !== exceptId && String(x[field] || "").toLowerCase() === v)) {
    fail(409, `${label} "${value}" already exists`);
  }
};

const readFile = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

async function parseBody(data) {
  if (!data) return { body: {}, files: {} };
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    const body = {};
    const files = {};
    for (const [k, v] of data.entries()) {
      if (typeof v === "object" && v && "size" in v && "type" in v) files[k] = v;
      else body[k] = v;
    }
    return { body, files };
  }
  if (typeof data === "string") {
    try {
      return { body: JSON.parse(data), files: {} };
    } catch {
      return { body: {}, files: {} };
    }
  }
  return { body: data, files: {} };
}

/* ------------------------------------------------------------------ */
/* auth                                                                */
/* ------------------------------------------------------------------ */

const COLLECTION = { admin: "admins", faculty: "faculty", student: "students" };

const makeToken = (user, role) => btoa(JSON.stringify({ id: user._id, role, exp: Date.now() + TOKEN_TTL }));

function currentUser(db, headers) {
  const header = (typeof headers?.get === "function" && headers.get("Authorization")) || headers?.Authorization || headers?.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) fail(401, "Not authorised, please login");

  let payload;
  try {
    payload = JSON.parse(atob(token));
  } catch {
    fail(401, "Invalid token");
  }
  if (!payload.exp || payload.exp < Date.now()) fail(401, "Session expired, please login again");

  const user = byId(db[COLLECTION[payload.role]] || [], payload.id);
  if (!user) fail(401, "Account no longer exists");
  if (user.status === "inactive") fail(403, "Your account has been deactivated");
  return { user, role: payload.role };
}

/* ------------------------------------------------------------------ */
/* populate helpers (same shapes the Mongo backend returns)            */
/* ------------------------------------------------------------------ */

const branchRef = (db, id, full = true) => {
  const b = byId(db.branches, id);
  return b ? (full ? { _id: b._id, name: b.name, code: b.code } : { _id: b._id, code: b.code }) : null;
};
const facultyRef = (db, id) => {
  const f = byId(db.faculty, id);
  return f ? { _id: f._id, firstName: f.firstName, lastName: f.lastName, employeeId: f.employeeId } : null;
};
const subjectRef = (db, id, fields = ["name", "code"]) => {
  const s = byId(db.subjects, id);
  return s ? { _id: s._id, ...Object.fromEntries(fields.map((f) => [f, s[f]])) } : null;
};

const outStudent = (db, s) => ({ ...strip(s), branch: branchRef(db, s.branch) });
const outFaculty = (db, f) => ({ ...strip(f), department: branchRef(db, f.department) });
const outUser = (db, role, u) => (role === "student" ? outStudent(db, u) : role === "faculty" ? outFaculty(db, u) : strip(u));

const outSubject = (db, s) => ({ ...s, branch: branchRef(db, s.branch), faculty: s.faculty ? facultyRef(db, s.faculty) : null });
const outExam = (db, e) => ({ ...e, branch: branchRef(db, e.branch) });
const outNotice = (db, n) => {
  const poster = n.postedByModel === "Admin" ? byId(db.admins, n.postedBy) : byId(db.faculty, n.postedBy);
  return {
    ...n,
    branch: n.branch ? branchRef(db, n.branch, false) : null,
    postedBy: poster ? { _id: poster._id, name: poster.name, firstName: poster.firstName, lastName: poster.lastName } : null,
  };
};
const outMaterial = (db, m) => {
  const f = byId(db.faculty, m.uploadedBy);
  return {
    ...m,
    subject: subjectRef(db, m.subject),
    branch: branchRef(db, m.branch, false),
    uploadedBy: f ? { _id: f._id, firstName: f.firstName, lastName: f.lastName } : null,
  };
};
const outTimetable = (db, t) =>
  t && {
    ...t,
    branch: branchRef(db, t.branch),
    slots: t.slots.map((s) => {
      const f = s.faculty ? byId(db.faculty, s.faculty) : null;
      return {
        ...s,
        subject: subjectRef(db, s.subject, ["name", "code", "type"]),
        faculty: f ? { _id: f._id, firstName: f.firstName, lastName: f.lastName } : null,
      };
    }),
  };

/* ------------------------------------------------------------------ */
/* routes                                                              */
/* ------------------------------------------------------------------ */

const routes = [];
const route = (method, path, handler, { auth = true } = {}) => {
  const keys = [];
  const pattern = new RegExp("^" + path.replace(/:(\w+)/g, (_, k) => (keys.push(k), "([^/]+)")) + "$");
  routes.push({ method, pattern, keys, handler, auth });
};
const allow = (ctx, ...roles) => {
  if (!roles.includes(ctx.role)) fail(403, "You do not have permission for this action");
};

const STUDENT_FIELDS = ["enrollmentNo", "firstName", "lastName", "email", "phone", "gender", "dob", "bloodGroup", "branch", "semester", "section", "admissionYear", "guardianName", "guardianPhone", "address", "status"];
const FACULTY_FIELDS = ["employeeId", "firstName", "lastName", "email", "phone", "gender", "dob", "department", "designation", "qualification", "experience", "joiningDate", "address", "status"];

/* ---------- auth ---------- */

route(
  "post",
  "/auth/login",
  ({ db, body }) => {
    const { role, loginId, password } = body;
    if (!role || !loginId || !password) fail(400, "Role, login ID and password are required");
    const list = db[COLLECTION[role]];
    if (!list) fail(400, "Invalid role selected");

    const value = String(loginId).trim().toLowerCase();
    const idField = role === "student" ? "enrollmentNo" : "employeeId";
    const user = list.find((u) => u.email.toLowerCase() === value || String(u[idField]).toLowerCase() === value);

    if (!user || user.password !== password) fail(401, "Invalid credentials");
    if (user.status === "inactive") fail(403, "Your account has been deactivated. Contact the admin office.");

    return { success: true, token: makeToken(user, role), role, user: outUser(db, role, user) };
  },
  { auth: false }
);

route("get", "/auth/me", ({ db, ctx }) => ({ success: true, role: ctx.role, user: outUser(db, ctx.role, ctx.user) }));

route("put", "/auth/profile", async ({ db, ctx, body, files }) => {
  const editable = ctx.role === "admin" ? ["name", "phone"] : ["phone", "address"];
  Object.assign(ctx.user, pick(body, editable));
  if (files.profileImage) {
    if (files.profileImage.size > 2 * 1024 * 1024) fail(400, "Image must be smaller than 2 MB");
    ctx.user.profileImage = await readFile(files.profileImage);
  }
  ctx.user.updatedAt = now();
  return { success: true, message: "Profile updated", user: outUser(db, ctx.role, ctx.user) };
});

route("put", "/auth/change-password", ({ ctx, body }) => {
  const { currentPassword, newPassword } = body;
  if (!currentPassword || !newPassword) fail(400, "Both current and new password are required");
  if (newPassword.length < 6) fail(400, "New password must be at least 6 characters");
  if (currentPassword === newPassword) fail(400, "New password must be different from the current one");
  if (ctx.user.password !== currentPassword) fail(400, "Current password is incorrect");
  ctx.user.password = newPassword;
  return { success: true, message: "Password changed successfully" };
});

/* ---------- admin ---------- */

route("get", "/admin/dashboard", ({ db, ctx }) => {
  allow(ctx, "admin");
  const counts = {};
  db.students.forEach((s) => (counts[s.branch] = (counts[s.branch] || 0) + 1));
  const perBranch = Object.entries(counts)
    .map(([id, count]) => ({ ...branchRef(db, id), count }))
    .filter((b) => b.code)
    .map(({ code, name, count }) => ({ code, name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    success: true,
    stats: {
      students: db.students.filter((s) => s.status === "active").length,
      faculty: db.faculty.filter((f) => f.status === "active").length,
      branches: db.branches.length,
      subjects: db.subjects.length,
      notices: db.notices.length,
    },
    perBranch,
    upcomingExams: db.exams
      .filter((e) => new Date(e.startDate) >= new Date())
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 5)
      .map((e) => ({ ...e, branch: branchRef(db, e.branch, false) })),
    recentStudents: [...db.students]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5)
      .map((s) => ({ ...strip(s), branch: branchRef(db, s.branch, false) })),
  };
});

route("get", "/admin/admins", ({ db, ctx }) => {
  allow(ctx, "admin");
  return { success: true, data: db.admins.map(strip) };
});

route("post", "/admin/admins", ({ db, ctx, body }) => {
  allow(ctx, "admin");
  const data = pick(body, ["employeeId", "name", "email", "phone", "designation", "password"]);
  requireFields(data, [["employeeId", "Employee ID"], ["name", "Name"], ["email", "Email"], ["password", "Password"]]);
  if (data.password.length < 6) fail(400, "Password must be at least 6 characters");
  unique(db.admins, "email", data.email, "email");
  unique(db.admins, "employeeId", data.employeeId, "employeeId");
  const admin = { _id: newId(), designation: "Administrator", profileImage: "", isSuperAdmin: false, status: "active", ...data, employeeId: data.employeeId.toUpperCase(), email: data.email.toLowerCase(), createdAt: now(), updatedAt: now() };
  db.admins.push(admin);
  return { success: true, message: "Admin account created", data: strip(admin) };
});

route("put", "/admin/admins/:id", ({ db, ctx, body, params }) => {
  allow(ctx, "admin");
  const admin = byId(db.admins, params.id) || fail(404, "Admin not found");
  Object.assign(admin, pick(body, ["name", "email", "phone", "designation", "status"]), { updatedAt: now() });
  return { success: true, message: "Admin updated", data: strip(admin) };
});

route("delete", "/admin/admins/:id", ({ db, ctx, params }) => {
  allow(ctx, "admin");
  if (params.id === ctx.user._id) fail(400, "You cannot delete your own account");
  const admin = byId(db.admins, params.id) || fail(404, "Admin not found");
  if (admin.isSuperAdmin) fail(400, "The super admin account cannot be removed");
  db.admins = db.admins.filter((a) => a._id !== params.id);
  return { success: true, message: "Admin removed" };
});

route("post", "/admin/reset-password", ({ db, ctx, body }) => {
  allow(ctx, "admin");
  const list = db[COLLECTION[body.role]] || fail(400, "Invalid role");
  if (!body.newPassword || body.newPassword.length < 6) fail(400, "Password must be at least 6 characters");
  const user = byId(list, body.id) || fail(404, "User not found");
  user.password = body.newPassword;
  return { success: true, message: "Password has been reset" };
});

/* ---------- students ---------- */

route("get", "/students", ({ db, ctx, query }) => {
  allow(ctx, "admin", "faculty");
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(query.limit, 10) || 10, 100);

  let list = db.students.filter(
    (s) =>
      (!query.branch || s.branch === query.branch) &&
      (!query.semester || s.semester === Number(query.semester)) &&
      (!query.section || s.section === String(query.section).toUpperCase()) &&
      (!query.status || s.status === query.status)
  );
  if (query.search) {
    const r = rx(query.search);
    list = list.filter((s) => [s.firstName, s.lastName, `${s.firstName} ${s.lastName}`, s.enrollmentNo, s.email, s.phone].some((v) => r.test(v || "")));
  }
  list.sort((a, b) => a.enrollmentNo.localeCompare(b.enrollmentNo));

  return {
    success: true,
    data: list.slice((page - 1) * limit, page * limit).map((s) => outStudent(db, s)),
    total: list.length,
    page,
    pages: Math.ceil(list.length / limit) || 1,
  };
});

route("get", "/students/:id", ({ db, ctx, params }) => {
  allow(ctx, "admin", "faculty");
  return { success: true, data: outStudent(db, byId(db.students, params.id) || fail(404, "Student not found")) };
});

route("post", "/students", async ({ db, ctx, body, files }) => {
  allow(ctx, "admin");
  const data = normalise(pick(body, STUDENT_FIELDS));
  requireFields(data, [["enrollmentNo", "Enrollment number"], ["firstName", "First name"], ["email", "Email"], ["branch", "Branch"], ["semester", "Semester"]]);
  data.enrollmentNo = data.enrollmentNo.toUpperCase();
  data.email = data.email.toLowerCase();
  unique(db.students, "enrollmentNo", data.enrollmentNo, "enrollmentNo");
  unique(db.students, "email", data.email, "email");

  const password = body.password || data.enrollmentNo.toLowerCase();
  if (password.length < 6) fail(400, "Password must be at least 6 characters");

  const student = {
    _id: newId(),
    lastName: "",
    gender: "Male",
    admissionYear: new Date().getFullYear(),
    status: "active",
    profileImage: files.profileImage ? await readFile(files.profileImage) : "",
    ...data,
    section: (data.section || "A").toUpperCase(),
    password,
    createdAt: now(),
    updatedAt: now(),
  };
  db.students.push(student);
  return { success: true, message: "Student added successfully", data: outStudent(db, student) };
});

route("put", "/students/:id", async ({ db, ctx, body, files, params }) => {
  allow(ctx, "admin");
  const student = byId(db.students, params.id) || fail(404, "Student not found");
  const data = normalise(pick(body, STUDENT_FIELDS));
  if (data.enrollmentNo) data.enrollmentNo = data.enrollmentNo.toUpperCase();
  if (data.email) data.email = data.email.toLowerCase();
  unique(db.students, "enrollmentNo", data.enrollmentNo, "enrollmentNo", student._id);
  unique(db.students, "email", data.email, "email", student._id);

  Object.assign(student, data, { updatedAt: now() });
  if (files.profileImage) student.profileImage = await readFile(files.profileImage);
  return { success: true, message: "Student details updated", data: outStudent(db, student) };
});

route("delete", "/students/:id", ({ db, ctx, params }) => {
  allow(ctx, "admin");
  byId(db.students, params.id) || fail(404, "Student not found");
  db.marks = db.marks.filter((m) => m.student !== params.id);
  db.students = db.students.filter((s) => s._id !== params.id);
  return { success: true, message: "Student record deleted" };
});

/* ---------- faculty ---------- */

route("get", "/faculty/me/overview", ({ db, ctx }) => {
  allow(ctx, "faculty");
  const me = ctx.user._id;
  const classes = [];
  db.timetables.forEach((tt) =>
    tt.slots
      .filter((s) => s.faculty === me)
      .forEach((s) =>
        classes.push({
          day: s.day,
          startTime: s.startTime,
          endTime: s.endTime,
          room: s.room,
          subject: subjectRef(db, s.subject),
          branch: branchRef(db, tt.branch, false),
          semester: tt.semester,
          section: tt.section,
        })
      )
  );
  classes.sort((a, b) => a.startTime.localeCompare(b.startTime));

  return {
    success: true,
    subjects: db.subjects
      .filter((s) => s.faculty === me)
      .sort((a, b) => a.semester - b.semester)
      .map((s) => ({ ...s, branch: branchRef(db, s.branch) })),
    materialCount: db.materials.filter((m) => m.uploadedBy === me).length,
    classes,
  };
});

route("get", "/faculty", ({ db, ctx, query }) => {
  allow(ctx, "admin");
  let list = db.faculty.filter((f) => (!query.department || f.department === query.department) && (!query.status || f.status === query.status));
  if (query.search) {
    const r = rx(query.search);
    list = list.filter((f) => [f.firstName, f.lastName, `${f.firstName} ${f.lastName}`, f.employeeId, f.email].some((v) => r.test(v || "")));
  }
  list.sort((a, b) => a.employeeId.localeCompare(b.employeeId));
  return { success: true, data: list.map((f) => outFaculty(db, f)), total: list.length };
});

route("get", "/faculty/:id", ({ db, ctx, params }) => {
  allow(ctx, "admin");
  const f = byId(db.faculty, params.id) || fail(404, "Faculty member not found");
  return {
    success: true,
    data: outFaculty(db, f),
    subjects: db.subjects.filter((s) => s.faculty === f._id).map((s) => ({ ...s, branch: branchRef(db, s.branch, false) })),
  };
});

route("post", "/faculty", async ({ db, ctx, body, files }) => {
  allow(ctx, "admin");
  const data = normalise(pick(body, FACULTY_FIELDS));
  requireFields(data, [["employeeId", "Employee ID"], ["firstName", "First name"], ["email", "Email"], ["department", "Department"]]);
  data.employeeId = data.employeeId.toUpperCase();
  data.email = data.email.toLowerCase();
  unique(db.faculty, "employeeId", data.employeeId, "employeeId");
  unique(db.faculty, "email", data.email, "email");

  const password = body.password || data.employeeId.toLowerCase();
  if (password.length < 6) fail(400, "Password must be at least 6 characters");

  const faculty = {
    _id: newId(),
    lastName: "",
    gender: "Male",
    designation: "Assistant Professor",
    experience: 0,
    joiningDate: now(),
    status: "active",
    profileImage: files.profileImage ? await readFile(files.profileImage) : "",
    ...data,
    password,
    createdAt: now(),
    updatedAt: now(),
  };
  db.faculty.push(faculty);
  return { success: true, message: "Faculty member added", data: outFaculty(db, faculty) };
});

route("put", "/faculty/:id", async ({ db, ctx, body, files, params }) => {
  allow(ctx, "admin");
  const f = byId(db.faculty, params.id) || fail(404, "Faculty member not found");
  const data = normalise(pick(body, FACULTY_FIELDS));
  if (data.employeeId) data.employeeId = data.employeeId.toUpperCase();
  if (data.email) data.email = data.email.toLowerCase();
  unique(db.faculty, "employeeId", data.employeeId, "employeeId", f._id);
  unique(db.faculty, "email", data.email, "email", f._id);
  Object.assign(f, data, { updatedAt: now() });
  if (files.profileImage) f.profileImage = await readFile(files.profileImage);
  return { success: true, message: "Faculty details updated", data: outFaculty(db, f) };
});

route("delete", "/faculty/:id", ({ db, ctx, params }) => {
  allow(ctx, "admin");
  byId(db.faculty, params.id) || fail(404, "Faculty member not found");
  const uploaded = db.materials.filter((m) => m.uploadedBy === params.id).length;
  if (uploaded) fail(400, `This faculty has ${uploaded} uploaded material(s). Mark the account inactive instead.`);

  db.subjects.forEach((s) => s.faculty === params.id && (s.faculty = null));
  db.branches.forEach((b) => b.hod === params.id && (b.hod = null));
  db.timetables.forEach((t) => t.slots.forEach((s) => s.faculty === params.id && (s.faculty = null)));
  db.faculty = db.faculty.filter((f) => f._id !== params.id);
  return { success: true, message: "Faculty member removed" };
});

/* ---------- branches ---------- */

route("get", "/branches", ({ db }) => ({
  success: true,
  data: [...db.branches]
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((b) => ({
      ...b,
      hod: b.hod ? facultyRef(db, b.hod) : null,
      studentCount: db.students.filter((s) => s.branch === b._id).length,
      subjectCount: db.subjects.filter((s) => s.branch === b._id).length,
    })),
}));

route("post", "/branches", ({ db, ctx, body }) => {
  allow(ctx, "admin");
  const data = normalise(pick(body, ["name", "code", "totalSemesters", "hod", "description"]));
  requireFields(data, [["name", "Branch name"], ["code", "Branch code"]]);
  data.code = data.code.toUpperCase();
  unique(db.branches, "code", data.code, "code");
  const branch = { _id: newId(), totalSemesters: 8, hod: null, description: "", ...data, createdAt: now(), updatedAt: now() };
  db.branches.push(branch);
  return { success: true, message: "Branch created", data: branch };
});

route("put", "/branches/:id", ({ db, ctx, body, params }) => {
  allow(ctx, "admin");
  const b = byId(db.branches, params.id) || fail(404, "Branch not found");
  const data = normalise(pick(body, ["name", "code", "totalSemesters", "hod", "description"]));
  if (data.code) data.code = data.code.toUpperCase();
  unique(db.branches, "code", data.code, "code", b._id);
  Object.assign(b, data, { updatedAt: now() });
  if (body.hod === "") b.hod = null;
  return { success: true, message: "Branch updated", data: b };
});

route("delete", "/branches/:id", ({ db, ctx, params }) => {
  allow(ctx, "admin");
  byId(db.branches, params.id) || fail(404, "Branch not found");
  const students = db.students.filter((s) => s.branch === params.id).length;
  const faculty = db.faculty.filter((f) => f.department === params.id).length;
  const subjects = db.subjects.filter((s) => s.branch === params.id).length;
  if (students || faculty || subjects) {
    fail(400, `Branch is in use (${students} students, ${faculty} faculty, ${subjects} subjects). Move or remove them first.`);
  }
  db.branches = db.branches.filter((b) => b._id !== params.id);
  return { success: true, message: "Branch deleted" };
});

/* ---------- subjects ---------- */

route("get", "/subjects", ({ db, ctx, query }) => {
  let list = db.subjects;
  if (ctx.role === "student") {
    list = list.filter((s) => s.branch === ctx.user.branch && s.semester === ctx.user.semester);
  } else {
    list = list.filter((s) => (!query.branch || s.branch === query.branch) && (!query.semester || s.semester === Number(query.semester)));
    if (ctx.role === "faculty" && query.mine === "true") list = list.filter((s) => s.faculty === ctx.user._id);
  }
  return {
    success: true,
    data: [...list].sort((a, b) => a.semester - b.semester || a.code.localeCompare(b.code)).map((s) => outSubject(db, s)),
  };
});

route("post", "/subjects", ({ db, ctx, body }) => {
  allow(ctx, "admin");
  const data = normalise(pick(body, ["name", "code", "branch", "semester", "credits", "type", "faculty"]));
  requireFields(data, [["name", "Subject name"], ["code", "Subject code"], ["branch", "Branch"], ["semester", "Semester"]]);
  data.code = data.code.toUpperCase();
  unique(db.subjects, "code", data.code, "code");
  const subject = { _id: newId(), credits: 4, type: "Theory", faculty: null, ...data, createdAt: now(), updatedAt: now() };
  db.subjects.push(subject);
  return { success: true, message: "Subject added", data: outSubject(db, subject) };
});

route("put", "/subjects/:id", ({ db, ctx, body, params }) => {
  allow(ctx, "admin");
  const s = byId(db.subjects, params.id) || fail(404, "Subject not found");
  const data = normalise(pick(body, ["name", "code", "branch", "semester", "credits", "type", "faculty"]));
  if (data.code) data.code = data.code.toUpperCase();
  unique(db.subjects, "code", data.code, "code", s._id);
  Object.assign(s, data, { updatedAt: now() });
  if (body.faculty === "") s.faculty = null;
  return { success: true, message: "Subject updated", data: outSubject(db, s) };
});

route("delete", "/subjects/:id", ({ db, ctx, params }) => {
  allow(ctx, "admin");
  byId(db.subjects, params.id) || fail(404, "Subject not found");
  if (db.marks.some((m) => m.subject === params.id) || db.materials.some((m) => m.subject === params.id)) {
    fail(400, "Marks or study material already exist for this subject, it can't be deleted.");
  }
  db.subjects = db.subjects.filter((s) => s._id !== params.id);
  return { success: true, message: "Subject deleted" };
});

/* ---------- exams ---------- */

route("get", "/exams", ({ db, ctx, query }) => {
  let list = db.exams;
  if (ctx.role === "student") list = list.filter((e) => e.branch === ctx.user.branch && e.semester === ctx.user.semester);
  else list = list.filter((e) => (!query.branch || e.branch === query.branch) && (!query.semester || e.semester === Number(query.semester)));
  return { success: true, data: [...list].sort((a, b) => new Date(b.startDate) - new Date(a.startDate)).map((e) => outExam(db, e)) };
});

const EXAM_FIELDS = ["name", "type", "branch", "semester", "startDate", "endDate", "maxMarks", "passingMarks", "resultPublished"];

route("post", "/exams", ({ db, ctx, body }) => {
  allow(ctx, "admin");
  const data = normalise(pick(body, EXAM_FIELDS));
  requireFields(data, [["name", "Exam name"], ["branch", "Branch"], ["semester", "Semester"], ["startDate", "Start date"], ["maxMarks", "Maximum marks"]]);
  if (data.passingMarks > data.maxMarks) fail(400, "Passing marks can't be more than maximum marks");
  const exam = { _id: newId(), type: "MST", passingMarks: 0, resultPublished: false, ...data, createdAt: now(), updatedAt: now() };
  db.exams.push(exam);
  return { success: true, message: "Exam scheduled", data: outExam(db, exam) };
});

route("put", "/exams/:id", ({ db, ctx, body, params }) => {
  allow(ctx, "admin");
  const exam = byId(db.exams, params.id) || fail(404, "Exam not found");
  Object.assign(exam, normalise(pick(body, EXAM_FIELDS)), { updatedAt: now() });
  return { success: true, message: "Exam updated", data: outExam(db, exam) };
});

route("delete", "/exams/:id", ({ db, ctx, params }) => {
  allow(ctx, "admin");
  byId(db.exams, params.id) || fail(404, "Exam not found");
  const before = db.marks.length;
  db.marks = db.marks.filter((m) => m.exam !== params.id);
  db.exams = db.exams.filter((e) => e._id !== params.id);
  return { success: true, message: `Exam deleted along with ${before - db.marks.length} marks entries` };
});

/* ---------- marks ---------- */

function examAndSubject(db, ctx, examId, subjectId) {
  const exam = byId(db.exams, examId);
  const subject = byId(db.subjects, subjectId);
  if (!exam || !subject) fail(400, "Please select a valid exam and subject");
  if (exam.branch !== subject.branch || exam.semester !== subject.semester) fail(400, "This subject does not belong to the selected exam's class");
  if (ctx.role === "faculty" && subject.faculty !== ctx.user._id) fail(403, "This subject is not assigned to you");
  return { exam, subject };
}

route("get", "/marks/sheet", ({ db, ctx, query }) => {
  allow(ctx, "admin", "faculty");
  const { exam, subject } = examAndSubject(db, ctx, query.exam, query.subject);
  const students = db.students
    .filter((s) => s.branch === exam.branch && s.semester === exam.semester && s.status === "active" && (!query.section || s.section === String(query.section).toUpperCase()))
    .sort((a, b) => a.enrollmentNo.localeCompare(b.enrollmentNo));

  const rows = students.map((s) => {
    const m = db.marks.find((x) => x.exam === exam._id && x.subject === subject._id && x.student === s._id);
    return {
      student: { _id: s._id, enrollmentNo: s.enrollmentNo, firstName: s.firstName, lastName: s.lastName, section: s.section },
      marksObtained: m ? m.marksObtained : null,
      isAbsent: m ? m.isAbsent : false,
      remarks: m ? m.remarks : "",
    };
  });
  return { success: true, exam, subject, rows };
});

route("post", "/marks/bulk", ({ db, ctx, body }) => {
  allow(ctx, "admin", "faculty");
  const { exam, subject } = examAndSubject(db, ctx, body.exam, body.subject);
  const entries = Array.isArray(body.entries) ? body.entries : [];
  if (!entries.length) fail(400, "Nothing to save");

  const valid = [];
  for (const e of entries) {
    if (!e.isAbsent && (e.marksObtained === null || e.marksObtained === "" || e.marksObtained === undefined)) continue;
    const value = e.isAbsent ? 0 : Number(e.marksObtained);
    if (Number.isNaN(value) || value < 0 || value > exam.maxMarks) fail(400, `Marks must be between 0 and ${exam.maxMarks}`);
    valid.push({ student: e.student, value, isAbsent: !!e.isAbsent, remarks: e.remarks || "" });
  }
  if (!valid.length) fail(400, "Enter marks for at least one student");

  valid.forEach((v) => {
    let m = db.marks.find((x) => x.exam === exam._id && x.subject === subject._id && x.student === v.student);
    if (!m) {
      m = { _id: newId(), exam: exam._id, subject: subject._id, student: v.student, createdAt: now() };
      db.marks.push(m);
    }
    Object.assign(m, { marksObtained: v.value, isAbsent: v.isAbsent, remarks: v.remarks, updatedAt: now() });
    if (ctx.role === "faculty") m.enteredBy = ctx.user._id;
  });
  return { success: true, message: `Marks saved for ${valid.length} student(s)` };
});

route("get", "/marks/my", ({ db, ctx }) => {
  allow(ctx, "student");
  const grouped = {};
  db.marks
    .filter((m) => m.student === ctx.user._id)
    .forEach((m) => {
      const exam = byId(db.exams, m.exam);
      if (!exam || !exam.resultPublished) return;
      if (!grouped[exam._id]) {
        grouped[exam._id] = {
          exam: pick(exam, ["_id", "name", "type", "maxMarks", "passingMarks", "startDate", "resultPublished", "semester"]),
          subjects: [],
        };
      }
      grouped[exam._id].subjects.push({
        subject: subjectRef(db, m.subject, ["name", "code", "credits"]),
        marksObtained: m.marksObtained,
        isAbsent: m.isAbsent,
        remarks: m.remarks,
      });
    });
  Object.values(grouped).forEach((g) => g.subjects.sort((a, b) => a.subject.code.localeCompare(b.subject.code)));
  return { success: true, data: Object.values(grouped).sort((a, b) => new Date(b.exam.startDate) - new Date(a.exam.startDate)) };
});

/* ---------- timetable ---------- */

route("get", "/timetable", ({ db, ctx, query }) => {
  let { branch, semester, section } = query;
  if (ctx.role === "student") ({ branch, semester, section } = ctx.user);
  if (!branch || !semester) fail(400, "Branch and semester are required");
  const tt = db.timetables.find((t) => t.branch === branch && t.semester === Number(semester) && t.section === String(section || "A").toUpperCase());
  return { success: true, data: tt ? outTimetable(db, tt) : null };
});

route("put", "/timetable", ({ db, ctx, body }) => {
  allow(ctx, "admin", "faculty");
  const { branch, semester, section = "A", slots = [] } = body;
  if (!branch || !semester) fail(400, "Branch and semester are required");

  const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
  const clean = slots.map((s, i) => {
    if (!s.day || !s.subject) fail(400, `Row ${i + 1}: day and subject are required`);
    if (!TIME.test(s.startTime) || !TIME.test(s.endTime)) fail(400, `Row ${i + 1}: time must be in HH:MM format`);
    if (s.startTime >= s.endTime) fail(400, `Row ${i + 1}: end time must be after start time`);
    const subject = db.subjects.find((x) => x._id === s.subject && x.branch === branch && x.semester === Number(semester));
    if (!subject) fail(400, `Row ${i + 1}: subject is not part of this semester`);
    return { _id: newId(), day: s.day, startTime: s.startTime, endTime: s.endTime, subject: s.subject, faculty: s.faculty || subject.faculty || null, room: s.room || "" };
  });

  for (let i = 0; i < clean.length; i++) {
    for (let j = i + 1; j < clean.length; j++) {
      const a = clean[i];
      const b = clean[j];
      if (a.day === b.day && a.startTime < b.endTime && b.startTime < a.endTime) {
        fail(400, `Clash on ${a.day}: ${a.startTime}-${a.endTime} overlaps with ${b.startTime}-${b.endTime}`);
      }
    }
  }

  const key = (t) => t.branch === branch && t.semester === Number(semester) && t.section === section.toUpperCase();
  let tt = db.timetables.find(key);
  if (!tt) {
    tt = { _id: newId(), branch, semester: Number(semester), section: section.toUpperCase(), createdAt: now() };
    db.timetables.push(tt);
  }
  Object.assign(tt, { slots: clean, updatedBy: ctx.user._id, updatedByModel: ctx.role === "admin" ? "Admin" : "Faculty", updatedAt: now() });
  return { success: true, message: "Timetable saved", data: outTimetable(db, tt) };
});

/* ---------- notices ---------- */

const sortNotices = (a, b) => Number(b.important) - Number(a.important) || b.createdAt.localeCompare(a.createdAt);

route(
  "get",
  "/notices/public",
  ({ db }) => ({
    success: true,
    data: db.notices.filter((n) => n.audience === "all").sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6).map((n) => outNotice(db, n)),
  }),
  { auth: false }
);

route("get", "/notices", ({ db, ctx, query }) => {
  const limit = Math.min(parseInt(query.limit, 10) || 50, 200);
  let list = db.notices;
  if (ctx.role === "student") list = list.filter((n) => ["all", "student"].includes(n.audience) && (!n.branch || n.branch === ctx.user.branch));
  if (ctx.role === "faculty") list = list.filter((n) => ["all", "faculty"].includes(n.audience) || n.postedBy === ctx.user._id);
  return { success: true, data: [...list].sort(sortNotices).slice(0, limit).map((n) => outNotice(db, n)) };
});

route("post", "/notices", ({ db, ctx, body }) => {
  allow(ctx, "admin", "faculty");
  const data = normalise(pick(body, ["title", "description", "audience", "branch", "link", "important"]));
  requireFields(data, [["title", "Title"], ["description", "Description"]]);
  const notice = {
    _id: newId(),
    audience: "all",
    branch: null,
    link: "",
    important: false,
    ...data,
    ...(ctx.role === "faculty" && { audience: "student" }),
    postedBy: ctx.user._id,
    postedByModel: ctx.role === "admin" ? "Admin" : "Faculty",
    createdAt: now(),
    updatedAt: now(),
  };
  db.notices.push(notice);
  return { success: true, message: "Notice published", data: outNotice(db, notice) };
});

const ownNotice = (db, ctx, id) => {
  const n = byId(db.notices, id) || fail(404, "Notice not found");
  if (ctx.role === "faculty" && n.postedBy !== ctx.user._id) fail(403, "You can only modify notices posted by you");
  return n;
};

route("put", "/notices/:id", ({ db, ctx, body, params }) => {
  allow(ctx, "admin", "faculty");
  const n = ownNotice(db, ctx, params.id);
  Object.assign(n, normalise(pick(body, ["title", "description", "audience", "link", "important"])), { updatedAt: now() });
  if (ctx.role === "faculty") n.audience = "student";
  n.branch = body.branch || null;
  return { success: true, message: "Notice updated", data: outNotice(db, n) };
});

route("delete", "/notices/:id", ({ db, ctx, params }) => {
  allow(ctx, "admin", "faculty");
  ownNotice(db, ctx, params.id);
  db.notices = db.notices.filter((n) => n._id !== params.id);
  return { success: true, message: "Notice deleted" };
});

/* ---------- materials ---------- */

route("get", "/materials", ({ db, ctx, query }) => {
  let list = db.materials;
  if (ctx.role === "student") list = list.filter((m) => m.branch === ctx.user.branch && m.semester === ctx.user.semester);
  else list = list.filter((m) => (!query.branch || m.branch === query.branch) && (!query.semester || m.semester === Number(query.semester)));
  if (ctx.role === "faculty" && query.mine === "true") list = list.filter((m) => m.uploadedBy === ctx.user._id);
  if (query.subject) list = list.filter((m) => m.subject === query.subject);
  if (query.type) list = list.filter((m) => m.type === query.type);
  if (query.search) list = list.filter((m) => rx(query.search).test(m.title));
  return { success: true, data: [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((m) => outMaterial(db, m)) };
});

route("post", "/materials", async ({ db, ctx, body, files }) => {
  allow(ctx, "faculty");
  const file = files.file || fail(400, "Please attach a file");
  if (file.size > 10 * 1024 * 1024) fail(400, "File is too large (max 10 MB)");
  if (!body.title || !body.title.trim()) fail(400, "Title is required");
  const subject = byId(db.subjects, body.subject) || fail(400, "Please select a valid subject");
  if (subject.faculty !== ctx.user._id) fail(400, "You can upload material only for subjects assigned to you");

  const material = {
    _id: newId(),
    title: body.title.trim(),
    description: body.description || "",
    type: body.type || "Notes",
    subject: subject._id,
    branch: subject.branch,
    semester: subject.semester,
    file: await readFile(file),
    originalName: file.name,
    fileSize: file.size,
    uploadedBy: ctx.user._id,
    createdAt: now(),
    updatedAt: now(),
  };
  db.materials.push(material);
  return { success: true, message: "Material uploaded", data: outMaterial(db, material) };
});

route("delete", "/materials/:id", ({ db, ctx, params }) => {
  allow(ctx, "faculty", "admin");
  const m = byId(db.materials, params.id) || fail(404, "Material not found");
  if (ctx.role === "faculty" && m.uploadedBy !== ctx.user._id) fail(403, "You can only delete material uploaded by you");
  db.materials = db.materials.filter((x) => x._id !== params.id);
  return { success: true, message: "Material deleted" };
});

route("get", "/health", () => ({ status: "ok", mode: "local", time: now() }), { auth: false });

/* ------------------------------------------------------------------ */
/* axios adapter                                                       */
/* ------------------------------------------------------------------ */

const parseQuery = (url, params = {}) => {
  const query = {};
  const qs = url.split("?")[1];
  if (qs) new URLSearchParams(qs).forEach((v, k) => (query[k] = v));
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") query[k] = String(v);
  });
  return query;
};

export default async function localAdapter(config) {
  const method = (config.method || "get").toLowerCase();
  const path = (config.url || "").replace(/^https?:\/\/[^/]+/, "").replace(/^\/api/, "").split("?")[0];
  const respond = (status, data) => ({ data, status, statusText: String(status), headers: {}, config, request: {} });

  // small delay so loading states behave like a real network call
  await new Promise((r) => setTimeout(r, 120));

  try {
    const db = load();
    const match = routes.find((r) => r.method === method && r.pattern.test(path));
    if (!match) fail(404, `Route not found - ${path}`);

    const values = path.match(match.pattern).slice(1);
    const params = Object.fromEntries(match.keys.map((k, i) => [k, decodeURIComponent(values[i])]));
    const { body, files } = await parseBody(config.data);
    const ctx = match.auth ? currentUser(db, config.headers) : null;

    const result = await match.handler({ db, ctx, body, files, params, query: parseQuery(config.url || "", config.params) });
    save();
    return respond(method === "post" && /^\/(students|faculty|branches|subjects|exams|notices|materials|admin\/admins)$/.test(path) ? 201 : 200, clone(result));
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    const error = new Error(err.message);
    error.config = config;
    error.response = respond(status, { success: false, message: err.message || "Something went wrong" });
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/* starting data (same records as backend/src/utils/seed.js)           */
/* ------------------------------------------------------------------ */

function samplePdf(lines) {
  const esc = (t) => t.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const text = lines.map((l, i) => `BT /F1 ${i === 0 ? 16 : 11} Tf 60 ${760 - i * 22} Td (${esc(l)}) Tj ET`).join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => (pdf += `${String(o).padStart(10, "0")} 00000 n \n`));
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return { file: `data:application/pdf;base64,${btoa(pdf)}`, fileSize: pdf.length };
}

function seedData() {
  let seed = 42;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280), seed / 233280);
  const between = (min, max) => Math.round(min + rand() * (max - min));
  const daysAgo = (d, minutes = 0) => new Date(Date.now() - d * 86400000 - minutes * 60000).toISOString();
  const stamp = (d = 30, m = 0) => ({ createdAt: daysAgo(d, m), updatedAt: daysAgo(d, m) });

  const db = { admins: [], faculty: [], students: [], branches: [], subjects: [], exams: [], marks: [], timetables: [], notices: [], materials: [] };

  const admin = { _id: newId(), employeeId: "ADM001", name: "Rajiv Bansal", email: "admin@ums.edu", phone: "9876500001", designation: "Registrar Office", password: "admin123", isSuperAdmin: true, profileImage: "", status: "active", ...stamp(200) };
  db.admins.push(admin);

  const branch = (name, code) => ({ _id: newId(), name, code, totalSemesters: 8, hod: null, description: "", ...stamp(200) });
  const [cse, ece, me, ce] = [
    branch("Computer Science & Engineering", "CSE"),
    branch("Electronics & Communication Engineering", "ECE"),
    branch("Mechanical Engineering", "ME"),
    branch("Civil Engineering", "CE"),
  ];
  db.branches.push(cse, ece, me, ce);

  const facultyRows = [
    ["E10231", "Ramesh", "Sharma", "Male", cse, "Professor", "Ph.D. (CSE), IIT Roorkee", 19],
    ["E10764", "Priya", "Malhotra", "Female", cse, "Assistant Professor", "M.Tech (CSE)", 7],
    ["E11052", "Arjun", "Mehta", "Male", cse, "Assistant Professor", "M.Tech (AI & ML)", 4],
    ["E10498", "Neha", "Gupta", "Female", cse, "Associate Professor", "Ph.D. (Software Engg.)", 11],
    ["E10377", "Harpreet", "Kaur", "Female", ece, "Associate Professor", "Ph.D. (VLSI)", 12],
    ["E10912", "Vikram", "Thakur", "Male", me, "Assistant Professor", "M.E. (Thermal)", 6],
  ];
  const fac = facultyRows.map(([employeeId, firstName, lastName, gender, dept, designation, qualification, experience]) => ({
    _id: newId(),
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
    joiningDate: new Date(2026 - experience, 6, 15).toISOString(),
    address: "Mohali, Punjab",
    password: "faculty123",
    profileImage: "",
    status: "active",
    ...stamp(180),
  }));
  db.faculty.push(...fac);
  const [ramesh, priya, arjun, neha, harpreet, vikram] = fac;
  cse.hod = ramesh._id;
  ece.hod = harpreet._id;

  const subject = (name, code, b, semester, credits, f, type = "Theory") => ({ _id: newId(), name, code, branch: b._id, semester, credits, type, faculty: f._id, ...stamp(150) });
  const subs = [
    subject("Design and Analysis of Algorithms", "23CST-301", cse, 5, 4, ramesh),
    subject("Computer Networks", "23CST-302", cse, 5, 4, priya),
    subject("Machine Learning", "23CST-303", cse, 5, 3, arjun),
    subject("Software Engineering", "23CST-304", cse, 5, 3, neha),
    subject("Full Stack Development Lab", "23CSP-305", cse, 5, 2, priya, "Lab"),
    subject("Data Structures", "24CST-201", cse, 3, 4, neha),
    subject("Digital Electronics", "24CST-202", cse, 3, 3, arjun),
    subject("Digital Signal Processing", "23ECT-301", ece, 5, 4, harpreet),
    subject("Microprocessors & Interfacing", "23ECT-302", ece, 5, 4, harpreet),
    subject("Engineering Thermodynamics", "24MET-201", me, 3, 4, vikram),
    subject("Strength of Materials", "24MET-202", me, 3, 4, vikram),
  ];
  db.subjects.push(...subs);
  const [daa, cn, ml, se, fsd] = subs;

  const names = [
    ["Aman", "Verma", "Male"], ["Simran", "Kaur", "Female"], ["Rohit", "Yadav", "Male"], ["Ananya", "Mishra", "Female"],
    ["Karan", "Chauhan", "Male"], ["Ishita", "Arora", "Female"], ["Mohit", "Saini", "Male"], ["Pooja", "Rana", "Female"],
    ["Harsh", "Pandey", "Male"], ["Tanya", "Bhatia", "Female"], ["Yash", "Tiwari", "Male"], ["Riya", "Sood", "Female"],
    ["Abhishek", "Rawat", "Male"], ["Muskan", "Jindal", "Female"],
  ];
  const bloodGroups = ["B+", "O+", "A+", "AB+", "O-", "B-"];
  const guardians = ["Suresh", "Mahesh", "Rakesh", "Dinesh", "Naresh", "Rajesh", "Mukesh"];
  const towns = ["Mohali, Punjab", "Kharar, Punjab", "Ambala, Haryana", "Ludhiana, Punjab", "Shimla, H.P."];

  const cseStudents = names.map(([firstName, lastName, gender], i) => {
    const enrollmentNo = `24BCS10${101 + i}`;
    return {
      _id: newId(),
      enrollmentNo,
      firstName,
      lastName,
      gender,
      email: `${enrollmentNo.toLowerCase()}@cuchd.in`,
      phone: `7${between(100000000, 999999999)}`,
      dob: new Date(2005, between(0, 11), between(1, 28)).toISOString(),
      bloodGroup: bloodGroups[i % bloodGroups.length],
      branch: cse._id,
      semester: 5,
      section: i < 8 ? "A" : "B",
      admissionYear: 2024,
      guardianName: `${guardians[i % guardians.length]} ${lastName}`,
      guardianPhone: `94170${between(10000, 99999)}`,
      address: towns[i % towns.length],
      password: "student123",
      profileImage: "",
      status: "active",
      ...stamp(5, (names.length - i) * 7),
    };
  });
  db.students.push(...cseStudents);

  [
    ["24BEC10211", "Gurpreet", "Singh", "Male", ece, 5],
    ["24BEC10214", "Nidhi", "Sharma", "Female", ece, 5],
    ["25BME10305", "Rahul", "Negi", "Male", me, 3],
    ["25BME10318", "Sakshi", "Dhiman", "Female", me, 3],
    ["25BCE10402", "Deepak", "Kumar", "Male", ce, 3],
  ].forEach(([enrollmentNo, firstName, lastName, gender, b, semester], i) =>
    db.students.push({
      _id: newId(),
      enrollmentNo,
      firstName,
      lastName,
      gender,
      branch: b._id,
      semester,
      section: "A",
      email: `${enrollmentNo.toLowerCase()}@cuchd.in`,
      phone: `8${between(100000000, 999999999)}`,
      admissionYear: Number(`20${enrollmentNo.slice(0, 2)}`),
      password: "student123",
      profileImage: "",
      status: "active",
      ...stamp(20, i * 11),
    })
  );

  const exam = (name, type, b, semester, start, end, maxMarks, passingMarks, resultPublished = false) => ({
    _id: newId(), name, type, branch: b._id, semester, startDate: start.toISOString(), endDate: end ? end.toISOString() : null, maxMarks, passingMarks, resultPublished, ...stamp(90),
  });
  const mst1 = exam("MST-1", "MST", cse, 5, new Date(2026, 8, 14), new Date(2026, 8, 19), 20, 8, true);
  const mst2 = exam("MST-2", "MST", cse, 5, new Date(2026, 9, 26), new Date(2026, 9, 31), 20, 8, true);
  db.exams.push(
    mst1,
    mst2,
    exam("End Semester Examination", "End Semester", cse, 5, new Date(2026, 11, 8), new Date(2026, 11, 22), 60, 24),
    exam("MST-1", "MST", ece, 5, new Date(2026, 8, 15), null, 20, 8)
  );

  [mst1, mst2].forEach((e) =>
    cseStudents.forEach((s) =>
      [daa, cn, ml, se].forEach((sub) => {
        const absent = rand() < 0.02;
        db.marks.push({ _id: newId(), student: s._id, subject: sub._id, exam: e._id, marksObtained: absent ? 0 : between(7, 20), isAbsent: absent, remarks: "", enteredBy: sub.faculty, ...stamp(15) });
      })
    )
  );

  const periods = [["09:30", "10:20"], ["10:20", "11:10"], ["11:20", "12:10"], ["12:10", "13:00"]];
  const plan = { Monday: [daa, cn, ml, se], Tuesday: [cn, daa, se, ml], Wednesday: [ml, se, daa, cn], Thursday: [se, ml, cn, daa], Friday: [daa, cn, ml, se] };
  const slots = [];
  Object.entries(plan).forEach(([day, list]) =>
    list.forEach((sub, i) => slots.push({ _id: newId(), day, startTime: periods[i][0], endTime: periods[i][1], subject: sub._id, faculty: sub.faculty, room: "B1-204" }))
  );
  ["Tuesday", "Thursday"].forEach((day) => slots.push({ _id: newId(), day, startTime: "13:50", endTime: "15:30", subject: fsd._id, faculty: fsd.faculty, room: "Lab D3-112" }));
  db.timetables.push({ _id: newId(), branch: cse._id, semester: 5, section: "A", slots, updatedBy: admin._id, updatedByModel: "Admin", ...stamp(10) });

  const notice = (title, description, audience, by, model, d, extra = {}) => ({
    _id: newId(), title, description, audience, branch: null, link: "", important: false, postedBy: by._id, postedByModel: model, ...stamp(d), ...extra,
  });
  db.notices.push(
    notice("End Semester Examination schedule released", "The date sheet for the End Semester Examination (December 2026) has been released. Students are advised to check their roll numbers and report any clash to the examination cell before 28 November.", "all", admin, "Admin", 1, { important: true }),
    notice("Fee payment deadline - Even semester", "Last date to deposit the even semester fee without late fine is 15 December 2026. Pay through the student portal or at the accounts block, Room 104.", "student", admin, "Admin", 3),
    notice("Faculty meeting on result moderation", "All faculty members are requested to attend the result moderation meeting on Monday at 3:00 PM in the Seminar Hall, Block B2.", "faculty", admin, "Admin", 4),
    notice("DAA assignment 3 submission", "Assignment 3 (Dynamic Programming) must be submitted by Friday. Late submissions will not be accepted.", "student", ramesh, "Faculty", 2, { branch: cse._id }),
    notice("Hackathon registrations open", "Registrations for the inter-department hackathon are open till 30 November. Teams of 2-4 members can register through the technical club.", "all", admin, "Admin", 6)
  );

  [
    [daa, ramesh, "Unit 1 - Asymptotic Notations", "Notes", "daa-unit1-notes.pdf", 9],
    [daa, ramesh, "Assignment 3 - Dynamic Programming", "Assignment", "daa-assignment3.pdf", 2],
    [cn, priya, "OSI and TCP/IP Model - Lecture Slides", "Notes", "cn-osi-tcpip.pdf", 7],
    [ml, arjun, "ML Syllabus 2026-27", "Syllabus", "ml-syllabus.pdf", 40],
    [se, neha, "MST-1 Question Paper 2025", "Question Paper", "se-mst1-2025.pdf", 12],
  ].forEach(([sub, by, title, type, originalName, d]) => {
    const { file, fileSize } = samplePdf([title, `${sub.code}  ${sub.name}`, `${by.firstName} ${by.lastName}, Department of CSE`]);
    db.materials.push({ _id: newId(), title, description: "", type, subject: sub._id, branch: sub.branch, semester: sub.semester, file, fileSize, originalName, uploadedBy: by._id, ...stamp(d) });
  });

  return db;
}

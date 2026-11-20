import {
  LayoutDashboard,
  Users,
  SquareUser,
  Building2,
  BookOpen,
  ClipboardList,
  CalendarDays,
  Megaphone,
  Settings,
  FileText,
  Search,
  PenLine,
  CircleUser,
  KeyRound,
  Award,
} from "lucide-react";

const account = (base) => [
  { to: `${base}/profile`, label: "My Profile", icon: CircleUser, tone: "pink", desc: "Your details and photo" },
  { to: `${base}/change-password`, label: "Change Password", icon: KeyRound, tone: "slate", desc: "Keep your account safe" },
];

export const navigation = {
  admin: [
    {
      section: "Overview",
      items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true, tone: "indigo" }],
    },
    {
      section: "People",
      items: [
        { to: "/admin/students", label: "Students", icon: Users, tone: "blue", desc: "Add, edit and search students" },
        { to: "/admin/faculty", label: "Faculty", icon: SquareUser, tone: "violet", desc: "Teaching staff records" },
      ],
    },
    {
      section: "Academics",
      items: [
        { to: "/admin/branches", label: "Branches", icon: Building2, tone: "amber", desc: "Departments and HODs" },
        { to: "/admin/subjects", label: "Subjects", icon: BookOpen, tone: "emerald", desc: "Courses and faculty assignment" },
        { to: "/admin/exams", label: "Examinations", icon: ClipboardList, tone: "rose", desc: "Schedule exams, publish results" },
        { to: "/admin/timetable", label: "Timetable", icon: CalendarDays, tone: "indigo", desc: "Weekly class schedule" },
        { to: "/admin/notices", label: "Notices", icon: Megaphone, tone: "orange", desc: "Announcements for everyone" },
      ],
    },
    {
      section: "Account",
      items: [{ to: "/admin/settings", label: "System Settings", icon: Settings, tone: "slate", desc: "Admins and passwords" }, ...account("/admin")],
    },
  ],

  faculty: [
    {
      section: "Overview",
      items: [{ to: "/faculty", label: "Dashboard", icon: LayoutDashboard, end: true, tone: "indigo" }],
    },
    {
      section: "Teaching",
      items: [
        { to: "/faculty/students", label: "Search Students", icon: Search, tone: "blue", desc: "Find any student quickly" },
        { to: "/faculty/marks", label: "Manage Marks", icon: PenLine, tone: "cyan", desc: "Enter exam marks" },
        { to: "/faculty/timetable", label: "Manage Timetable", icon: CalendarDays, tone: "indigo", desc: "Plan weekly periods" },
        { to: "/faculty/materials", label: "Upload Materials", icon: FileText, tone: "teal", desc: "Share notes and files" },
        { to: "/faculty/notices", label: "Notices", icon: Megaphone, tone: "orange", desc: "Read and post notices" },
      ],
    },
    { section: "Account", items: account("/faculty") },
  ],

  student: [
    {
      section: "Overview",
      items: [{ to: "/student", label: "Dashboard", icon: LayoutDashboard, end: true, tone: "indigo" }],
    },
    {
      section: "Academics",
      items: [
        { to: "/student/timetable", label: "My Timetable", icon: CalendarDays, tone: "indigo", desc: "Weekly class schedule" },
        { to: "/student/marks", label: "My Marks", icon: Award, tone: "cyan", desc: "Exam-wise results" },
        { to: "/student/materials", label: "Study Materials", icon: FileText, tone: "teal", desc: "Download notes and papers" },
        { to: "/student/notices", label: "Notices", icon: Megaphone, tone: "orange", desc: "Latest announcements" },
      ],
    },
    { section: "Account", items: account("/student") },
  ],
};

export const roleLabel = { admin: "Administrator", faculty: "Faculty", student: "Student" };

// every nav item except the dashboard, used for the "quick access" tiles
export const moduleLinks = (role) =>
  navigation[role].flatMap((g) => g.items).filter((i) => !i.end);

export const findNavItem = (role, pathname) =>
  navigation[role]?.flatMap((g) => g.items).find((i) => i.to === pathname.replace(/\/$/, ""));

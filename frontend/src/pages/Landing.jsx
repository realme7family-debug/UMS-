import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardList,
  CircleUser,
  FileText,
  GraduationCap,
  KeyRound,
  Megaphone,
  PenLine,
  Search,
  Settings,
  SquareUser,
  UserCog,
  Users,
  Download,
  LifeBuoy,
} from "lucide-react";
import api from "../api/client";
import { tone } from "../components/ui/tones";
import { formatDate, timeAgo } from "../utils/format";

const LOGINS = [
  { role: "student", title: "Student Login", text: "Enrollment no. or email", icon: GraduationCap, tone: "blue" },
  { role: "faculty", title: "Faculty Login", text: "Employee ID or email", icon: SquareUser, tone: "violet" },
  { role: "admin", title: "Admin Login", text: "Administration office", icon: UserCog, tone: "rose" },
];

const SERVICES = [
  {
    title: "Students",
    icon: GraduationCap,
    tone: "blue",
    items: [
      [CircleUser, "View profile"],
      [Award, "View marks & results"],
      [CalendarDays, "View timetable"],
      [Download, "Download study material"],
      [Megaphone, "View notices"],
    ],
  },
  {
    title: "Faculty",
    icon: SquareUser,
    tone: "violet",
    items: [
      [Search, "Search students"],
      [PenLine, "Enter & update marks"],
      [CalendarDays, "Manage timetable"],
      [FileText, "Upload study material"],
      [Megaphone, "Post & view notices"],
    ],
  },
  {
    title: "Administration",
    icon: UserCog,
    tone: "rose",
    items: [
      [Users, "Manage students & faculty"],
      [Building2, "Manage branches"],
      [BookOpen, "Manage subjects"],
      [ClipboardList, "Examinations & results"],
      [Settings, "System settings"],
    ],
  },
];

// plain #anchors would clash with hash based routing, so scroll manually
const scrollToSection = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

export default function Landing() {
  const [notices, setNotices] = useState(null);

  useEffect(() => {
    api
      .get("/notices/public")
      .then(({ data }) => setNotices(data.data))
      .catch(() => setNotices([]));
  }, []);

  return (
    <div className="min-h-screen bg-page text-ink">
      {/* header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
              <GraduationCap size={20} />
            </div>
            <div className="leading-tight">
              <p className="font-extrabold tracking-tight">UMS Portal</p>
              <p className="text-[11px] font-medium text-slate-500">University Management System</p>
            </div>
          </Link>
          <nav className="hidden gap-7 text-sm font-semibold text-slate-600 md:flex">
            <button type="button" onClick={() => scrollToSection("notices")} className="hover:text-brand-600">
              Notices
            </button>
            <button type="button" onClick={() => scrollToSection("services")} className="hover:text-brand-600">
              Services
            </button>
            <button type="button" onClick={() => scrollToSection("help")} className="hover:text-brand-600">
              Help
            </button>
          </nav>
          <Link to="/login" className="btn-primary">
            Login <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* hero with role logins */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-blue-500/25 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "26px 26px" }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div>
            <p className="text-sm font-semibold text-brand-300">{formatDate(new Date(), { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
              University <span className="text-brand-400">Management</span> System
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-300">
              Student, faculty and administration portal for academics, examinations, timetable, notices and study material.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="btn-primary px-6 py-3 text-base">
                Login to portal <ArrowRight size={18} />
              </Link>
              <button type="button" onClick={() => scrollToSection("notices")} className="btn border border-white/20 px-6 py-3 text-base text-white hover:bg-white/10">
              Latest notices
            </button>
            </div>
          </div>

          <div className="space-y-3">
            {LOGINS.map(({ role, title, text, icon: Icon, tone: t }) => (
              <Link
                key={role}
                to={`/login?role=${role}`}
                className="group flex items-center gap-4 rounded-2xl bg-white p-4 text-ink shadow-xl shadow-black/20 transition hover:-translate-y-0.5"
              >
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${tone(t).tile}`}>
                  <Icon size={22} />
                </div>
                <div className="flex-1">
                  <p className="font-bold">{title}</p>
                  <p className="text-sm text-slate-500">{text}</p>
                </div>
                <ArrowRight size={18} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* notices */}
      <section id="notices" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Latest notices</h2>
            <p className="mt-1 text-sm text-slate-500">Announcements from the administration office</p>
          </div>
          <Link to="/login" className="text-sm font-semibold text-brand-600 hover:underline">
            All notices
          </Link>
        </div>

        {notices === null ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="card h-32 animate-pulse bg-slate-50" />
            ))}
          </div>
        ) : notices.length === 0 ? (
          <div className="card p-8 text-center text-sm text-slate-500">No notices at the moment.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {notices.map((n) => (
              <article key={n._id} className={`card flex gap-4 p-5 ${n.important ? "border-l-4 border-l-brand-600" : ""}`}>
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${n.important ? tone("rose").tile : tone("orange").tile}`}>
                  <Megaphone size={20} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{n.title}</h3>
                    {n.important && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700">Important</span>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{n.description}</p>
                  <p className="mt-2 text-xs font-medium text-slate-400">{timeAgo(n.createdAt)}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* services */}
      <section id="services" className="scroll-mt-20 border-y border-slate-200/70 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <h2 className="text-2xl font-extrabold tracking-tight">Portal services</h2>
          <p className="mt-1 text-sm text-slate-500">Available after login, according to your role</p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {SERVICES.map(({ title, icon: Icon, tone: t, items }) => (
              <div key={title} className="rounded-2xl border border-slate-200/70 p-6">
                <div className="flex items-center gap-3">
                  <div className={`grid h-11 w-11 place-items-center rounded-xl ${tone(t).tile}`}>
                    <Icon size={20} />
                  </div>
                  <h3 className="text-lg font-extrabold">{title}</h3>
                </div>
                <ul className="mt-5 space-y-1">
                  {items.map(([ItemIcon, label]) => (
                    <li key={label}>
                      <Link to="/login" className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        <ItemIcon size={16} className="text-slate-400" />
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* help */}
      <section id="help" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-14">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card flex gap-4 p-6">
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone("amber").tile}`}>
              <KeyRound size={20} />
            </div>
            <div>
              <p className="font-bold">Forgot password?</p>
              <p className="mt-1 text-sm text-slate-500">Visit the administration office. The admin can reset your password.</p>
            </div>
          </div>
          <div className="card flex gap-4 p-6">
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone("emerald").tile}`}>
              <CircleUser size={20} />
            </div>
            <div>
              <p className="font-bold">First login</p>
              <p className="mt-1 text-sm text-slate-500">Your first password is your enrollment number / employee ID in lowercase.</p>
            </div>
          </div>
          <div className="card flex gap-4 p-6">
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone("cyan").tile}`}>
              <LifeBuoy size={20} />
            </div>
            <div>
              <p className="font-bold">Wrong details?</p>
              <p className="mt-1 text-sm text-slate-500">Academic records are updated only by the administration office.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-navy-900 text-slate-400">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-sm sm:flex-row">
          <div className="flex items-center gap-2 text-white">
            <GraduationCap size={18} />
            <span className="font-bold">UMS Portal</span>
          </div>
          <p>© {new Date().getFullYear()} University Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

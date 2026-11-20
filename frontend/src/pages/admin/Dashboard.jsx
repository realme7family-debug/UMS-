import { Link } from "react-router-dom";
import { Users, SquareUser, Building2, BookOpen, Megaphone, CalendarClock, Plus } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import StatCard from "../../components/ui/StatCard";
import Spinner from "../../components/ui/Spinner";
import Avatar from "../../components/ui/Avatar";
import EmptyState from "../../components/ui/EmptyState";
import HeroBanner from "../../components/ui/HeroBanner";
import QuickAccess from "../../components/ui/QuickAccess";
import { formatDate, fullName } from "../../utils/format";
import { useAuth } from "../../context/AuthContext";

const BAR_COLORS = ["bg-blue-500", "bg-violet-500", "bg-amber-500", "bg-emerald-500", "bg-rose-500", "bg-cyan-500"];

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data, loading } = useFetch("/admin/dashboard", {}, { select: (d) => d });

  if (loading || !data) return <Spinner />;

  const { stats, perBranch, upcomingExams, recentStudents } = data;
  const maxCount = Math.max(1, ...perBranch.map((b) => b.count));
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <HeroBanner
        eyebrow={greeting}
        title={user.name}
        subtitle="Manage students, faculty, academics and notices of the whole university from one place."
        chips={["Administrator", user.employeeId]}
        action={
          <Link to="/admin/students" className="btn bg-white text-navy-900 hover:bg-slate-100">
            <Plus size={16} /> Add student
          </Link>
        }
      />

      <div className="mb-7 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Students" value={stats.students} icon={Users} tone="blue" note="Active enrolments" />
        <StatCard label="Faculty" value={stats.faculty} icon={SquareUser} tone="violet" note="Teaching staff" />
        <StatCard label="Branches" value={stats.branches} icon={Building2} tone="amber" note="Departments" />
        <StatCard label="Subjects" value={stats.subjects} icon={BookOpen} tone="emerald" note="All semesters" />
        <StatCard label="Notices" value={stats.notices} icon={Megaphone} tone="orange" note="Published" />
      </div>

      <QuickAccess role="admin" title="Manage modules" />

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card p-6 lg:col-span-3">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="section-title">Students per branch</h2>
            <Link to="/admin/branches" className="text-sm font-semibold text-brand-600 hover:underline">
              Branches
            </Link>
          </div>
          {perBranch.length === 0 ? (
            <EmptyState title="No students yet" />
          ) : (
            <ul className="space-y-4">
              {perBranch.map((b, i) => (
                <li key={b.code}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-semibold">
                      {b.code} <span className="font-normal text-slate-500">· {b.name}</span>
                    </span>
                    <span className="font-bold tabular-nums">{b.count}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100">
                    <div className={`h-2.5 rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`} style={{ width: `${(b.count / maxCount) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="section-title">Upcoming exams</h2>
            <Link to="/admin/exams" className="text-sm font-semibold text-brand-600 hover:underline">
              Manage
            </Link>
          </div>
          {upcomingExams.length === 0 ? (
            <EmptyState icon={CalendarClock} title="No exams scheduled" />
          ) : (
            <ul className="space-y-3">
              {upcomingExams.map((e) => (
                <li key={e._id} className="flex items-center gap-4 rounded-xl bg-slate-50 p-3">
                  <div className="w-14 rounded-xl bg-rose-600 py-1.5 text-center leading-tight text-white">
                    <p className="text-[10px] font-bold uppercase">{formatDate(e.startDate, { month: "short" })}</p>
                    <p className="text-lg font-extrabold">{new Date(e.startDate).getDate()}</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-bold">{e.name}</p>
                    <p className="text-slate-500">
                      {e.branch?.code} · Semester {e.semester} · {e.maxMarks} marks
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="section-title">Recently added students</h2>
          <Link to="/admin/students" className="text-sm font-semibold text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Enrollment No.</th>
                <th>Branch</th>
                <th>Semester</th>
                <th>Added on</th>
              </tr>
            </thead>
            <tbody>
              {recentStudents.map((s) => (
                <tr key={s._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar src={s.profileImage} name={fullName(s)} size="sm" />
                      <span className="font-semibold">{fullName(s)}</span>
                    </div>
                  </td>
                  <td className="font-mono text-xs">{s.enrollmentNo}</td>
                  <td>{s.branch?.code}</td>
                  <td>{s.semester}</td>
                  <td className="text-slate-500">{formatDate(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

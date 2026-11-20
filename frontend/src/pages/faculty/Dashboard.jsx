import { Link } from "react-router-dom";
import { BookOpen, CalendarDays, FileText, PenLine, Clock } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import { useAuth } from "../../context/AuthContext";
import StatCard from "../../components/ui/StatCard";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Badge from "../../components/ui/Badge";
import Avatar from "../../components/ui/Avatar";
import HeroBanner from "../../components/ui/HeroBanner";
import QuickAccess from "../../components/ui/QuickAccess";
import { fullName, timeAgo, to12h, todayName } from "../../utils/format";

export default function FacultyDashboard() {
  const { user } = useAuth();
  const { data, loading } = useFetch("/faculty/me/overview", {}, { select: (d) => d });
  const { data: notices } = useFetch("/notices", { limit: 4 }, { initial: [] });

  if (loading || !data) return <Spinner />;

  const today = todayName();
  const todays = data.classes.filter((c) => c.day === today);

  return (
    <>
      <HeroBanner
        eyebrow="Welcome back"
        title={fullName(user)}
        subtitle={`${user.designation} · ${user.department?.name}`}
        chips={[user.employeeId, `${todays.length} class${todays.length === 1 ? "" : "es"} today`]}
        side={<Avatar src={user.profileImage} name={fullName(user)} size="lg" />}
        action={
          <Link to="/faculty/marks" className="btn bg-white text-navy-900 hover:bg-slate-100">
            <PenLine size={16} /> Enter marks
          </Link>
        }
      />

      <div className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="My subjects" value={data.subjects.length} icon={BookOpen} tone="emerald" note="Assigned this session" />
        <StatCard label="Classes today" value={todays.length} icon={Clock} tone="rose" note={today} />
        <StatCard label="Weekly periods" value={data.classes.length} icon={CalendarDays} tone="indigo" note="Across all sections" />
        <StatCard label="Materials shared" value={data.materialCount} icon={FileText} tone="teal" note="Files uploaded" />
      </div>

      <QuickAccess role="faculty" title="What would you like to do?" />

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card p-6 lg:col-span-3">
          <h2 className="section-title mb-5">Today's classes</h2>
          {todays.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No classes today" text="A free day — good time to finish evaluation." />
          ) : (
            <ul className="space-y-3">
              {todays.map((c, i) => (
                <li key={i} className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="w-24 shrink-0">
                    <p className="font-bold">{to12h(c.startTime)}</p>
                    <p className="text-xs text-slate-500">to {to12h(c.endTime)}</p>
                  </div>
                  <div className="h-10 w-1 rounded-full bg-indigo-500" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{c.subject?.name}</p>
                    <p className="text-sm text-slate-500">
                      {c.branch?.code} · Sem {c.semester} · Section {c.section}
                    </p>
                  </div>
                  <Badge tone="blue">{c.room}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="section-title">Latest notices</h2>
            <Link to="/faculty/notices" className="text-sm font-semibold text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          {notices.length === 0 ? (
            <EmptyState title="No notices" />
          ) : (
            <ul className="space-y-3">
              {notices.map((n) => (
                <li key={n._id} className="flex gap-3">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.important ? "bg-brand-500" : "bg-slate-300"}`} />
                  <div>
                    <p className="text-sm font-semibold leading-snug">{n.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{timeAgo(n.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card mt-6 overflow-hidden">
        <h2 className="section-title px-6 py-5">Subjects assigned to me</h2>
        {data.subjects.length === 0 ? (
          <EmptyState icon={BookOpen} title="No subjects assigned" text="The admin office assigns subjects to faculty." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Subject</th>
                  <th>Class</th>
                  <th>Credits</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {data.subjects.map((s) => (
                  <tr key={s._id}>
                    <td className="font-mono text-xs">{s.code}</td>
                    <td className="font-semibold">{s.name}</td>
                    <td>
                      {s.branch?.code} · Sem {s.semester}
                    </td>
                    <td>{s.credits}</td>
                    <td>
                      <Badge tone={s.type === "Lab" ? "blue" : "gray"}>{s.type}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

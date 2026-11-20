import { Link } from "react-router-dom";
import { CalendarDays, Award, Megaphone, BookOpen, FileText } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import Spinner from "../../components/ui/Spinner";
import StatCard from "../../components/ui/StatCard";
import HeroBanner from "../../components/ui/HeroBanner";
import QuickAccess from "../../components/ui/QuickAccess";
import { fullName, ordinal, timeAgo, to12h, todayName } from "../../utils/format";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data: timetable, loading: ttLoading } = useFetch("/timetable");
  const { data: notices } = useFetch("/notices", { limit: 5 }, { initial: [] });
  const { data: results } = useFetch("/marks/my", {}, { initial: [] });
  const { data: materials } = useFetch("/materials", {}, { initial: [] });

  const today = todayName();
  const todays = (timetable?.slots || []).filter((s) => s.day === today).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const subjectCount = new Set((timetable?.slots || []).map((s) => s.subject?._id)).size;

  const latest = results[0];
  const latestPct = latest
    ? Math.round((latest.subjects.reduce((sum, s) => sum + s.marksObtained, 0) / (latest.subjects.length * latest.exam.maxMarks)) * 100)
    : null;

  return (
    <>
      <HeroBanner
        eyebrow="Welcome back"
        title={fullName(user)}
        subtitle={user.branch?.name}
        chips={[user.enrollmentNo, `${ordinal(user.semester)} Semester`, `Section ${user.section}`]}
        side={<Avatar src={user.profileImage} name={fullName(user)} size="lg" />}
        action={
          <Link to="/student/profile" className="btn bg-white text-navy-900 hover:bg-slate-100">
            View profile
          </Link>
        }
      />

      <div className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Classes today" value={todays.length} icon={CalendarDays} tone="indigo" note={today} />
        <StatCard label="Subjects" value={subjectCount} icon={BookOpen} tone="emerald" note="This semester" />
        <StatCard label="Latest result" value={latestPct !== null ? `${latestPct}%` : "–"} icon={Award} tone="cyan" note={latest?.exam.name || "Not declared"} />
        <StatCard label="Study materials" value={materials.length} icon={FileText} tone="teal" note="Shared by faculty" />
      </div>

      <QuickAccess role="student" />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="section-title">Today's classes · {today}</h2>
            <Link to="/student/timetable" className="text-sm font-semibold text-brand-600 hover:underline">
              Full timetable
            </Link>
          </div>
          {ttLoading ? (
            <Spinner className="py-8" />
          ) : todays.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No classes scheduled today" />
          ) : (
            <ul className="space-y-3">
              {todays.map((s) => (
                <li key={s._id} className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="w-24 shrink-0">
                    <p className="font-bold tabular-nums">{to12h(s.startTime)}</p>
                    <p className="text-xs text-slate-500">to {to12h(s.endTime)}</p>
                  </div>
                  <div className={`h-10 w-1 rounded-full ${s.subject?.type === "Lab" ? "bg-cyan-500" : "bg-indigo-500"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{s.subject?.name}</p>
                    <p className="text-sm text-slate-500">{s.faculty ? fullName(s.faculty) : "Faculty TBA"}</p>
                  </div>
                  <Badge tone="blue">{s.room}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <h2 className="section-title mb-5">Latest result</h2>
          {!latest ? (
            <EmptyState icon={Award} title="No results yet" text="Results appear once the examination cell publishes them." />
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div
                  className="grid h-24 w-24 place-items-center rounded-full"
                  style={{ background: `conic-gradient(#e11d48 ${latestPct * 3.6}deg, #f1f5f9 0deg)` }}
                >
                  <div className="grid h-[76px] w-[76px] place-items-center rounded-full bg-white text-xl font-extrabold">{latestPct}%</div>
                </div>
                <div>
                  <p className="font-bold">{latest.exam.name}</p>
                  <p className="text-sm text-slate-500">{latest.subjects.length} subjects</p>
                </div>
              </div>
              <ul className="mt-5 space-y-2.5">
                {latest.subjects.map((s) => (
                  <li key={s.subject._id} className="flex justify-between text-sm">
                    <span className="truncate pr-2 text-slate-600">{s.subject.name}</span>
                    <span className="font-bold tabular-nums">{s.isAbsent ? "AB" : `${s.marksObtained}/${latest.exam.maxMarks}`}</span>
                  </li>
                ))}
              </ul>
              <Link to="/student/marks" className="btn-outline btn-sm mt-5 w-full">
                See all results
              </Link>
            </>
          )}
        </section>
      </div>

      <section className="card mt-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title">Notice board</h2>
          <Link to="/student/notices" className="text-sm font-semibold text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        {notices.length === 0 ? (
          <EmptyState icon={Megaphone} title="No notices" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {notices.map((n) => (
              <li key={n._id} className="flex items-start justify-between gap-4 py-3.5">
                <div className="flex gap-3">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.important ? "bg-brand-500" : "bg-slate-300"}`} />
                  <div>
                    <p className="text-sm font-semibold">{n.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{n.description}</p>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

import { CalendarDays, Printer } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import TimetableGrid from "../../components/TimetableGrid";
import { formatDate, fullName } from "../../utils/format";

export default function StudentTimetable() {
  const { user } = useAuth();
  const { data: timetable, loading } = useFetch("/timetable");

  // unique subject list for the legend below the grid
  const subjects = [...new Map((timetable?.slots || []).map((s) => [s.subject?._id, s])).values()];

  return (
    <>
      <PageHeader
        title="Weekly timetable"
        description={`${user.branch?.code} · Semester ${user.semester} · Section ${user.section}`}
        actions={
          timetable?.slots?.length > 0 && (
            <button className="btn-outline" onClick={() => window.print()}>
              <Printer size={16} /> Print
            </button>
          )
        }
      />

      {loading ? (
        <Spinner />
      ) : !timetable || timetable.slots.length === 0 ? (
        <div className="card">
          <EmptyState icon={CalendarDays} title="Timetable not published yet" text="Your class timetable will appear here once your department uploads it." />
        </div>
      ) : (
        <>
          <section className="card p-5">
            <TimetableGrid slots={timetable.slots} />
            <p className="mt-3 text-xs text-slate-400">Last updated on {formatDate(timetable.updatedAt)}</p>
          </section>

          <section className="card mt-6">
            <h2 className="px-5 py-4 font-semibold">Subjects this semester</h2>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Subject</th>
                    <th>Type</th>
                    <th>Faculty</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s) => (
                    <tr key={s.subject?._id}>
                      <td className="font-mono text-xs">{s.subject?.code}</td>
                      <td className="font-medium">{s.subject?.name}</td>
                      <td>{s.subject?.type}</td>
                      <td>{s.faculty ? fullName(s.faculty) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}

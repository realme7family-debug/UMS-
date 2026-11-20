import { Award } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import PageHeader from "../../components/ui/PageHeader";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Badge from "../../components/ui/Badge";
import { formatDate } from "../../utils/format";

function ExamCard({ exam, subjects }) {
  const total = subjects.reduce((sum, s) => sum + s.marksObtained, 0);
  const max = subjects.length * exam.maxMarks;
  const pct = max ? ((total / max) * 100).toFixed(1) : 0;
  const failed = subjects.filter((s) => s.isAbsent || s.marksObtained < exam.passingMarks).length;

  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="font-semibold">{exam.name}</h2>
          <p className="text-sm text-slate-500">
            {exam.type} · held on {formatDate(exam.startDate)} · max {exam.maxMarks} per subject
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
            <p className="font-semibold tabular-nums">
              {total} / {max}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-500">Percentage</p>
            <p className="font-semibold tabular-nums">{pct}%</p>
          </div>
          {failed ? <Badge tone="red">{failed} below pass</Badge> : <Badge tone="green">Cleared</Badge>}
        </div>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Subject</th>
              <th className="w-1/3">Score</th>
              <th className="text-right">Marks</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s) => {
              const ratio = s.marksObtained / exam.maxMarks;
              const below = s.isAbsent || s.marksObtained < exam.passingMarks;
              return (
                <tr key={s.subject._id}>
                  <td className="font-mono text-xs">{s.subject.code}</td>
                  <td>{s.subject.name}</td>
                  <td>
                    <div className="h-1.5 w-full rounded-full bg-slate-100">
                      <div className={`h-1.5 rounded-full ${below ? "bg-red-500" : "bg-brand-600"}`} style={{ width: `${ratio * 100}%` }} />
                    </div>
                  </td>
                  <td className={`text-right font-medium tabular-nums ${below ? "text-red-600" : ""}`}>
                    {s.isAbsent ? "Absent" : `${s.marksObtained} / ${exam.maxMarks}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function StudentMarks() {
  const { data: results, loading } = useFetch("/marks/my", {}, { initial: [] });

  return (
    <>
      <PageHeader title="Marks & results" description="Only results published by the examination cell are shown here." />
      {loading ? (
        <Spinner />
      ) : results.length === 0 ? (
        <div className="card">
          <EmptyState icon={Award} title="No published results" text="Check back after your exam results are declared." />
        </div>
      ) : (
        <div className="space-y-6">
          {results.map((r) => (
            <ExamCard key={r.exam._id} exam={r.exam} subjects={r.subjects} />
          ))}
        </div>
      )}
    </>
  );
}

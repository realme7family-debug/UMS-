import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ClipboardCheck, Save } from "lucide-react";
import api, { errorMessage } from "../../api/client";
import useFetch from "../../hooks/useFetch";
import PageHeader from "../../components/ui/PageHeader";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Badge from "../../components/ui/Badge";
import { Select } from "../../components/ui/Field";
import { formatDate, fullName } from "../../utils/format";

export default function MarksEntry() {
  const { data: subjects, loading: loadingSubjects } = useFetch("/subjects", { mine: "true" }, { initial: [] });
  const [subjectId, setSubjectId] = useState("");
  const [examId, setExamId] = useState("");
  const [section, setSection] = useState("");

  const subject = subjects.find((s) => s._id === subjectId);
  const { data: exams } = useFetch(
    subject ? "/exams" : null,
    { branch: subject?.branch?._id, semester: subject?.semester },
    { initial: [] }
  );

  const [sheet, setSheet] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!subjectId || !examId) {
      setSheet(null);
      return;
    }
    setLoading(true);
    api
      .get("/marks/sheet", { params: { exam: examId, subject: subjectId, section } })
      .then(({ data }) => {
        setSheet(data);
        setRows(
          data.rows.map((r) => ({
            student: r.student,
            marks: r.marksObtained ?? "",
            isAbsent: r.isAbsent,
          }))
        );
        setDirty(false);
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [subjectId, examId, section]);

  const max = sheet?.exam.maxMarks;

  const update = (id, patch) => {
    setRows((rs) => rs.map((r) => (r.student._id === id ? { ...r, ...patch } : r)));
    setDirty(true);
  };

  const summary = useMemo(() => {
    const filled = rows.filter((r) => !r.isAbsent && r.marks !== "");
    const values = filled.map((r) => Number(r.marks));
    const pass = sheet?.exam.passingMarks || 0;
    return {
      entered: filled.length + rows.filter((r) => r.isAbsent).length,
      avg: values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : "–",
      high: values.length ? Math.max(...values) : "–",
      below: values.filter((v) => v < pass).length,
    };
  }, [rows, sheet]);

  const invalid = rows.some((r) => r.marks !== "" && (Number(r.marks) < 0 || Number(r.marks) > max));

  const save = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/marks/bulk", {
        exam: examId,
        subject: subjectId,
        entries: rows.map((r) => ({ student: r.student._id, marksObtained: r.marks, isAbsent: r.isAbsent })),
      });
      toast.success(data.message);
      setDirty(false);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  // Enter key jumps to the next student's input, like a spreadsheet
  const onKeyDown = (e, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById(`mark-${index + 1}`)?.focus();
    }
  };

  return (
    <>
      <PageHeader title="Marks entry" description="Enter or update marks for the subjects assigned to you." />

      <div className="card mb-6 grid gap-4 p-4 md:grid-cols-[1.4fr_1fr_140px]">
        <Select
          label="Subject"
          value={subjectId}
          onChange={(e) => {
            setSubjectId(e.target.value);
            setExamId("");
          }}
          placeholder={loadingSubjects ? "Loading..." : "Select subject"}
          options={subjects.map((s) => ({ value: s._id, label: `${s.code} — ${s.name} (${s.branch?.code} Sem ${s.semester})` }))}
        />
        <Select
          label="Exam"
          value={examId}
          onChange={(e) => setExamId(e.target.value)}
          disabled={!subject}
          placeholder="Select exam"
          options={exams.map((e) => ({ value: e._id, label: `${e.name} · ${formatDate(e.startDate, { day: "numeric", month: "short" })}` }))}
        />
        <Select label="Section" value={section} onChange={(e) => setSection(e.target.value)} placeholder="All" options={["A", "B", "C", "D"]} />
      </div>

      {!subjects.length && !loadingSubjects ? (
        <div className="card">
          <EmptyState icon={ClipboardCheck} title="No subjects assigned" text="Ask the admin office to assign subjects to you." />
        </div>
      ) : !sheet && !loading ? (
        <div className="card">
          <EmptyState icon={ClipboardCheck} title="Select a subject and exam" text="The class list will load here." />
        </div>
      ) : loading ? (
        <Spinner label="Loading class list..." />
      ) : (
        <section className="card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
            <div className="text-sm">
              <p className="font-semibold">
                {sheet.exam.name} · {sheet.subject.code}
              </p>
              <p className="text-slate-500">
                Max {max} · Pass {sheet.exam.passingMarks} · {rows.length} students{" "}
                {sheet.exam.resultPublished && (
                  <span className="ml-1">
                    <Badge tone="green">Result published</Badge>
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-5 text-sm">
              <span>
                <span className="text-slate-500">Entered</span> <b className="tabular-nums">{summary.entered}/{rows.length}</b>
              </span>
              <span>
                <span className="text-slate-500">Avg</span> <b className="tabular-nums">{summary.avg}</b>
              </span>
              <span>
                <span className="text-slate-500">Highest</span> <b className="tabular-nums">{summary.high}</b>
              </span>
              <span>
                <span className="text-slate-500">Below pass</span> <b className="tabular-nums text-red-600">{summary.below}</b>
              </span>
              <button className="btn-primary btn-sm" onClick={save} disabled={busy || invalid || !dirty}>
                <Save size={14} /> {busy ? "Saving..." : "Save marks"}
              </button>
            </div>
          </div>

          {rows.length === 0 ? (
            <EmptyState title="No students in this class" />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-12">#</th>
                    <th>Enrollment No.</th>
                    <th>Name</th>
                    <th>Sec</th>
                    <th className="w-40">Marks / {max}</th>
                    <th className="w-24">Absent</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const bad = r.marks !== "" && (Number(r.marks) < 0 || Number(r.marks) > max);
                    const low = !bad && r.marks !== "" && Number(r.marks) < sheet.exam.passingMarks;
                    return (
                      <tr key={r.student._id} className={r.isAbsent ? "bg-slate-50 text-slate-400" : ""}>
                        <td className="text-slate-400">{i + 1}</td>
                        <td className="font-mono text-xs">{r.student.enrollmentNo}</td>
                        <td>{fullName(r.student)}</td>
                        <td>{r.student.section}</td>
                        <td className="py-2">
                          <input
                            id={`mark-${i}`}
                            type="number"
                            step="0.5"
                            min="0"
                            max={max}
                            disabled={r.isAbsent}
                            value={r.isAbsent ? "" : r.marks}
                            onChange={(e) => update(r.student._id, { marks: e.target.value })}
                            onKeyDown={(e) => onKeyDown(e, i)}
                            className={`input w-24 py-1.5 tabular-nums ${bad ? "border-red-400 ring-2 ring-red-100" : low ? "text-red-600" : ""}`}
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-brand-700"
                            checked={r.isAbsent}
                            onChange={(e) => update(r.student._id, { isAbsent: e.target.checked, marks: "" })}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {invalid && <p className="px-5 py-3 text-sm text-red-600">Some marks are outside 0 – {max}. Fix them before saving.</p>}
        </section>
      )}
    </>
  );
}

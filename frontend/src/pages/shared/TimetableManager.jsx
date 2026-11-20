import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CalendarDays, Plus, Save, Trash2, Users, CheckCircle2, Copy, Sparkles, Filter } from "lucide-react";
import api, { errorMessage } from "../../api/client";
import useBranches, { semesterOptions } from "../../hooks/useBranches";
import PageHeader from "../../components/ui/PageHeader";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import TimetableGrid from "../../components/TimetableGrid";
import { DAYS, formatDate } from "../../utils/format";

const newRow = (day = "Monday") => ({
  key: Math.random().toString(36).slice(2),
  day,
  startTime: "09:30",
  endTime: "10:20",
  subject: "",
  room: "LT-101",
});

export default function TimetableManager() {
  const { options: branchOptions } = useBranches();
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [section, setSection] = useState("A");

  const [classesList, setClassesList] = useState([]);
  const [classFilter, setClassFilter] = useState("ALL");
  const [subjects, setSubjects] = useState([]);
  const [rows, setRows] = useState([]);
  const [saved, setSaved] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copyBusy, setCopyBusy] = useState(false);

  // Auto-default to first branch and sem 5 when branches load
  useEffect(() => {
    if (branchOptions.length > 0 && !branch) {
      setBranch(branchOptions[0].value);
      setSemester("5");
      setSection("A");
    }
  }, [branchOptions, branch]);

  // Load all classes directory
  useEffect(() => {
    api
      .get("/timetable/classes")
      .then((res) => setClassesList(res.data.data || []))
      .catch(() => {});
  }, []);

  const ready = branch && semester;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([
      api.get("/subjects", { params: { branch, semester } }),
      api.get("/timetable", { params: { branch, semester, section } }),
    ])
      .then(([subRes, ttRes]) => {
        if (cancelled) return;
        setSubjects(subRes.data.data || []);
        const tt = ttRes.data.data;
        setSaved(tt);
        setRows(
          (tt?.slots || [])
            .slice()
            .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.startTime.localeCompare(b.startTime))
            .map((s) => ({
              key: s._id || Math.random().toString(36).slice(2),
              day: s.day,
              startTime: s.startTime,
              endTime: s.endTime,
              subject: s.subject?._id || "",
              room: s.room || "",
            }))
        );
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [branch, semester, section, ready]);

  const update = (key, field, value) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, [field]: value } : r)));

  const addRow = () =>
    setRows((rs) => {
      const last = rs[rs.length - 1];
      if (!last) return [newRow()];
      const [h, m] = last.endTime.split(":").map(Number);
      const end = new Date(0, 0, 0, h, m + 50);
      return [
        ...rs,
        {
          ...newRow(last.day),
          startTime: last.endTime,
          endTime: `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`,
          room: last.room || "LT-101",
        },
      ];
    });

  const save = async () => {
    if (rows.length === 0) {
      toast.error("Please add at least one period before saving");
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.put("/timetable", {
        branch,
        semester,
        section,
        slots: rows.map(({ key, ...r }) => r),
      });
      setSaved(data.data);
      toast.success(data.message || "Timetable saved successfully!");

      // Refresh classes list
      api.get("/timetable/classes").then((res) => setClassesList(res.data.data || []));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const copyToOtherSections = async (targetSec) => {
    if (rows.length === 0) {
      toast.error("No periods to copy");
      return;
    }
    setCopyBusy(true);
    try {
      const { data } = await api.put("/timetable", {
        branch,
        semester,
        section: targetSec,
        slots: rows.map(({ key, ...r }) => r),
      });
      toast.success(`Copied timetable to Section ${targetSec}!`);
      api.get("/timetable/classes").then((res) => setClassesList(res.data.data || []));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setCopyBusy(false);
    }
  };

  const filteredClasses = classesList.filter((c) => {
    if (classFilter === "ALL") return true;
    return c.branchCode === classFilter;
  });

  const currentClassInfo = classesList.find(
    (c) => c.branchId === branch && Number(c.semester) === Number(semester) && c.section === section
  );

  return (
    <>
      <PageHeader
        title="Timetable Management"
        description="View, build, and edit weekly class schedules for every branch, semester, and section across the university."
      />

      {/* Class Directory & Quick Switcher */}
      <section className="card mb-6 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
              <CalendarDays size={18} className="text-brand-600" />
              All Student Classes & Timetables
            </h2>
            <p className="text-xs text-slate-500">
              Click any class below to instantly view, edit, or customize its weekly timetable.
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
            <Filter size={13} className="ml-1 text-slate-400" />
            {["ALL", "CSE", "ECE", "ME", "CE"].map((code) => (
              <button
                key={code}
                onClick={() => setClassFilter(code)}
                className={`rounded-lg px-2.5 py-1 transition ${
                  classFilter === code ? "bg-white text-brand-600 shadow-sm" : "hover:text-slate-900"
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {classesList.length === 0 ? (
          <Spinner />
        ) : (
          <div className="grid max-h-60 grid-cols-2 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {filteredClasses.map((c) => {
              const isSelected =
                c.branchId === branch && Number(c.semester) === Number(semester) && c.section === section;
              return (
                <button
                  key={`${c.branchId}-${c.semester}-${c.section}`}
                  onClick={() => {
                    setBranch(c.branchId);
                    setSemester(String(c.semester));
                    setSection(c.section);
                  }}
                  className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition ${
                    isSelected
                      ? "border-brand-500 bg-brand-50/80 shadow-sm ring-2 ring-brand-400"
                      : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {c.branchCode} · Sem {c.semester}
                    </span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                      Sec {c.section}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
                    <Users size={12} className="text-slate-400" />
                    <span>{c.studentCount} students</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[10px]">
                    <CheckCircle2 size={11} className="text-emerald-500" />
                    <span className="font-medium text-emerald-700">{c.slotsCount} periods</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Class Selector Dropdowns */}
      <div className="card mb-6 grid gap-3 p-4 sm:grid-cols-[1fr_180px_140px]">
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-600">Select Branch</label>
          <select className="input" value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="">Select branch</option>
            {branchOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-600">Semester</label>
          <select className="input" value={semester} onChange={(e) => setSemester(e.target.value)}>
            <option value="">Select semester</option>
            {semesterOptions().map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-600">Section</label>
          <select className="input" value={section} onChange={(e) => setSection(e.target.value)}>
            {["A", "B", "C", "D"].map((s) => (
              <option key={s} value={s}>
                Section {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!ready ? (
        <div className="card">
          <EmptyState
            icon={CalendarDays}
            title="Choose a class"
            text="Select branch and semester to view or edit its timetable."
          />
        </div>
      ) : loading ? (
        <Spinner />
      ) : subjects.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No subjects for this semester"
            text="Subjects have to be added by the admin before a timetable can be created."
          />
        </div>
      ) : (
        <>
          {/* Timetable Editor Section */}
          <section className="card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    Timetable Editor: {branchOptions.find((b) => b.value === branch)?.label || "Branch"} · Semester{" "}
                    {semester} (Section {section})
                  </h2>
                  {currentClassInfo && (
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                      {currentClassInfo.studentCount} Students Enrolled
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {saved ? `Last updated ${formatDate(saved.updatedAt)}` : "No timetable saved yet for this class"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button className="btn-outline btn-sm" onClick={addRow}>
                  <Plus size={14} /> Add period
                </button>
                <button className="btn-primary btn-sm" onClick={save} disabled={busy}>
                  <Save size={14} /> {busy ? "Saving..." : "Save timetable"}
                </button>

                {/* Quick copy buttons */}
                {section === "A" && (
                  <div className="ml-2 flex items-center gap-1 border-l border-slate-200 pl-3">
                    <span className="text-xs font-semibold text-slate-500">Apply to:</span>
                    <button
                      className="btn-outline btn-sm text-xs"
                      onClick={() => copyToOtherSections("B")}
                      disabled={copyBusy}
                    >
                      <Copy size={12} /> Sec B
                    </button>
                    <button
                      className="btn-outline btn-sm text-xs"
                      onClick={() => copyToOtherSections("C")}
                      disabled={copyBusy}
                    >
                      <Copy size={12} /> Sec C
                    </button>
                  </div>
                )}
              </div>
            </div>

            {rows.length === 0 ? (
              <EmptyState title="No periods added" text='Click "Add period" to start.' />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="w-32">Day</th>
                      <th className="w-28">Start</th>
                      <th className="w-28">End</th>
                      <th>Subject</th>
                      <th className="w-36">Room</th>
                      <th className="w-12 text-right" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.key}>
                        <td className="py-2">
                          <select
                            className="input py-1.5 text-xs font-semibold"
                            value={r.day}
                            onChange={(e) => update(r.key, "day", e.target.value)}
                          >
                            {DAYS.map((d) => (
                              <option key={d}>{d}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2">
                          <input
                            type="time"
                            className="input py-1.5 text-xs"
                            value={r.startTime}
                            onChange={(e) => update(r.key, "startTime", e.target.value)}
                          >
                          </input>
                        </td>
                        <td className="py-2">
                          <input
                            type="time"
                            className="input py-1.5 text-xs"
                            value={r.endTime}
                            onChange={(e) => update(r.key, "endTime", e.target.value)}
                          >
                          </input>
                        </td>
                        <td className="min-w-[220px] py-2">
                          <select
                            className="input py-1.5 text-xs"
                            value={r.subject}
                            onChange={(e) => update(r.key, "subject", e.target.value)}
                          >
                            <option value="">Select subject</option>
                            {subjects.map((s) => (
                              <option key={s._id} value={s._id}>
                                {s.code} — {s.name} ({s.type})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2">
                          <input
                            className="input w-32 py-1.5 text-xs"
                            value={r.room}
                            onChange={(e) => update(r.key, "room", e.target.value)}
                            placeholder="LT-101"
                          />
                        </td>
                        <td className="py-2 text-right">
                          <button
                            className="icon-btn hover:text-red-600"
                            title="Delete period"
                            onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Saved Visual Timetable Grid */}
          {saved?.slots?.length > 0 && (
            <section className="card mt-6 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
                    <Sparkles size={16} className="text-amber-500" />
                    Weekly Schedule View ({branchOptions.find((b) => b.value === branch)?.label || "Branch"} · Sem{" "}
                    {semester} - Sec {section})
                  </h2>
                  <p className="text-xs text-slate-500">Live calendar grid as seen by enrolled students and faculty.</p>
                </div>
              </div>
              <TimetableGrid slots={saved.slots} />
            </section>
          )}
        </>
      )}
    </>
  );
}

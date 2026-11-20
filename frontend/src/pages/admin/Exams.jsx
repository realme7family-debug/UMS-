import { useState } from "react";
import toast from "react-hot-toast";
import { ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
import api, { errorMessage } from "../../api/client";
import useFetch from "../../hooks/useFetch";
import useBranches, { semesterOptions } from "../../hooks/useBranches";
import PageHeader from "../../components/ui/PageHeader";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { Input, Select } from "../../components/ui/Field";
import { formatDate, toInputDate } from "../../utils/format";

const TYPES = ["MST", "End Semester", "Practical", "Assignment", "Quiz"];
const EMPTY = { name: "", type: "MST", branch: "", semester: "1", startDate: "", endDate: "", maxMarks: "20", passingMarks: "8" };

const statusOf = (e) => {
  const now = new Date();
  if (e.resultPublished) return ["Result out", "green"];
  if (new Date(e.startDate) > now) return ["Upcoming", "blue"];
  if (!e.endDate || new Date(e.endDate) >= now) return ["Ongoing", "amber"];
  return ["Evaluation", "gray"];
};

export default function Exams() {
  const { options: branchOptions } = useBranches();
  const [branch, setBranch] = useState("");
  const { data: exams, loading, reload, setData } = useFetch("/exams", { branch }, { initial: [] });

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const open = (ex) => {
    setEditing(ex || {});
    setForm(
      ex
        ? {
            name: ex.name,
            type: ex.type,
            branch: ex.branch?._id || "",
            semester: String(ex.semester),
            startDate: toInputDate(ex.startDate),
            endDate: toInputDate(ex.endDate),
            maxMarks: String(ex.maxMarks),
            passingMarks: String(ex.passingMarks ?? ""),
          }
        : { ...EMPTY, branch }
    );
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = editing._id ? await api.put(`/exams/${editing._id}`, form) : await api.post("/exams", form);
      toast.success(data.message);
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async (ex) => {
    try {
      const { data } = await api.put(`/exams/${ex._id}`, { resultPublished: !ex.resultPublished });
      setData((list) => list.map((x) => (x._id === ex._id ? data.data : x)));
      toast.success(data.data.resultPublished ? "Result published to students" : "Result hidden from students");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const { data } = await api.delete(`/exams/${deleting._id}`);
      toast.success(data.message);
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Examinations"
        description="Schedule exams and control when results become visible to students."
        actions={
          <button className="btn-primary" onClick={() => open(null)}>
            <Plus size={16} /> Schedule exam
          </button>
        }
      />

      <div className="card">
        <div className="border-b border-slate-200 p-4">
          <select className="input w-auto min-w-[240px]" value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="">All branches</option>
            {branchOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {loading && exams.length === 0 ? (
          <Spinner />
        ) : exams.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No exams scheduled" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Class</th>
                  <th>Dates</th>
                  <th>Marks</th>
                  <th>Status</th>
                  <th>Result</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((ex) => {
                  const [label, tone] = statusOf(ex);
                  return (
                    <tr key={ex._id}>
                      <td>
                        <p className="font-medium">{ex.name}</p>
                        <p className="text-xs text-slate-500">{ex.type}</p>
                      </td>
                      <td>
                        {ex.branch?.code} · Sem {ex.semester}
                      </td>
                      <td className="whitespace-nowrap text-slate-600">
                        {formatDate(ex.startDate)}
                        {ex.endDate && ` – ${formatDate(ex.endDate)}`}
                      </td>
                      <td className="whitespace-nowrap">
                        {ex.maxMarks} <span className="text-xs text-slate-500">(pass {ex.passingMarks})</span>
                      </td>
                      <td>
                        <Badge tone={tone}>{label}</Badge>
                      </td>
                      <td>
                        <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-brand-700"
                            checked={ex.resultPublished}
                            onChange={() => togglePublish(ex)}
                          />
                          {ex.resultPublished ? "Published" : "Hidden"}
                        </label>
                      </td>
                      <td>
                        <div className="flex justify-end gap-0.5">
                          <button className="icon-btn" onClick={() => open(ex)} title="Edit">
                            <Pencil size={16} />
                          </button>
                          <button className="icon-btn hover:text-red-600" onClick={() => setDeleting(ex)} title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?._id ? "Edit exam" : "Schedule exam"}>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Input label="Exam name" required value={form.name} onChange={set("name")} placeholder="MST-1" />
          <Select label="Type" value={form.type} onChange={set("type")} options={TYPES} />
          <Select label="Branch" required value={form.branch} onChange={set("branch")} options={branchOptions} placeholder="Select branch" />
          <Select label="Semester" required value={form.semester} onChange={set("semester")} options={semesterOptions()} />
          <Input label="Start date" type="date" required value={form.startDate} onChange={set("startDate")} />
          <Input label="End date" type="date" min={form.startDate} value={form.endDate} onChange={set("endDate")} />
          <Input label="Maximum marks" type="number" min="1" required value={form.maxMarks} onChange={set("maxMarks")} />
          <Input label="Passing marks" type="number" min="0" value={form.passingMarks} onChange={set("passingMarks")} />
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className="btn-outline" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button className="btn-primary" disabled={busy}>
              {busy ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        busy={busy}
        title="Delete exam?"
        message={deleting && `"${deleting.name}" and every mark entered for it will be deleted.`}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

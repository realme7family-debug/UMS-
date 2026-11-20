import { useState } from "react";
import toast from "react-hot-toast";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
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
import { fullName } from "../../utils/format";

const EMPTY = { name: "", code: "", branch: "", semester: "1", credits: "4", type: "Theory", faculty: "" };

export default function Subjects() {
  const { options: branchOptions } = useBranches();
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const { data: subjects, loading, reload } = useFetch("/subjects", { branch, semester }, { initial: [] });
  const { data: faculty } = useFetch("/faculty", { status: "active" }, { initial: [] });

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const open = (s) => {
    setEditing(s || {});
    setForm(
      s
        ? {
            name: s.name,
            code: s.code,
            branch: s.branch?._id || "",
            semester: String(s.semester),
            credits: String(s.credits),
            type: s.type,
            faculty: s.faculty?._id || "",
          }
        : { ...EMPTY, branch, semester: semester || "1" }
    );
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = editing._id ? await api.put(`/subjects/${editing._id}`, form) : await api.post("/subjects", form);
      toast.success(data.message);
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/subjects/${deleting._id}`);
      toast.success("Subject deleted");
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  // show faculty of the selected branch first
  const facultyOptions = [...faculty]
    .sort((a, b) => (b.department?._id === form.branch) - (a.department?._id === form.branch))
    .map((f) => ({ value: f._id, label: `${fullName(f)} · ${f.department?.code}` }));

  return (
    <>
      <PageHeader
        title="Subjects"
        description="Course catalogue for every branch and semester, with assigned faculty."
        actions={
          <button className="btn-primary" onClick={() => open(null)}>
            <Plus size={16} /> Add subject
          </button>
        }
      />

      <div className="card">
        <div className="flex flex-wrap gap-3 border-b border-slate-200 p-4">
          <select className="input w-auto min-w-[220px]" value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="">All branches</option>
            {branchOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select className="input w-auto" value={semester} onChange={(e) => setSemester(e.target.value)}>
            <option value="">All semesters</option>
            {semesterOptions().map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {loading && subjects.length === 0 ? (
          <Spinner />
        ) : subjects.length === 0 ? (
          <EmptyState icon={BookOpen} title="No subjects found" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Subject</th>
                  <th>Branch</th>
                  <th>Sem</th>
                  <th>Credits</th>
                  <th>Type</th>
                  <th>Faculty</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s._id}>
                    <td className="font-mono text-xs">{s.code}</td>
                    <td className="font-medium">{s.name}</td>
                    <td>{s.branch?.code}</td>
                    <td>{s.semester}</td>
                    <td>{s.credits}</td>
                    <td>
                      <Badge tone={s.type === "Lab" ? "blue" : s.type === "Elective" ? "amber" : "gray"}>{s.type}</Badge>
                    </td>
                    <td className={s.faculty ? "" : "text-slate-400"}>{s.faculty ? fullName(s.faculty) : "Not assigned"}</td>
                    <td>
                      <div className="flex justify-end gap-0.5">
                        <button className="icon-btn" onClick={() => open(s)} title="Edit">
                          <Pencil size={16} />
                        </button>
                        <button className="icon-btn hover:text-red-600" onClick={() => setDeleting(s)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?._id ? "Edit subject" : "Add subject"}>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Input label="Subject code" required value={form.code} onChange={set("code")} placeholder="23CST-301" />
          <Input label="Subject name" required value={form.name} onChange={set("name")} />
          <Select label="Branch" required value={form.branch} onChange={set("branch")} options={branchOptions} placeholder="Select branch" />
          <Select label="Semester" required value={form.semester} onChange={set("semester")} options={semesterOptions()} />
          <Input label="Credits" type="number" min="0" max="10" value={form.credits} onChange={set("credits")} />
          <Select label="Type" value={form.type} onChange={set("type")} options={["Theory", "Lab", "Elective"]} />
          <Select
            label="Assigned faculty"
            className="sm:col-span-2"
            value={form.faculty}
            onChange={set("faculty")}
            options={facultyOptions}
            placeholder="Not assigned"
          />
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className="btn-outline" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button className="btn-primary" disabled={busy}>
              {busy ? "Saving..." : "Save subject"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        busy={busy}
        title="Delete subject?"
        message={deleting && `${deleting.code} — ${deleting.name} will be removed.`}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

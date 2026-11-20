import { useState } from "react";
import toast from "react-hot-toast";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import api, { errorMessage } from "../../api/client";
import useFetch from "../../hooks/useFetch";
import { clearBranchCache } from "../../hooks/useBranches";
import PageHeader from "../../components/ui/PageHeader";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { Input, Select, Textarea } from "../../components/ui/Field";
import { fullName } from "../../utils/format";

const EMPTY = { name: "", code: "", totalSemesters: "8", hod: "", description: "" };

export default function Branches() {
  const { data: branches, loading, reload } = useFetch("/branches", {}, { initial: [] });
  const { data: faculty } = useFetch("/faculty", {}, { initial: [] });

  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null); // null = closed, {} = new
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const open = (b) => {
    setEditing(b || {});
    setForm(
      b
        ? { name: b.name, code: b.code, totalSemesters: String(b.totalSemesters), hod: b.hod?._id || "", description: b.description || "" }
        : EMPTY
    );
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const afterChange = () => {
    clearBranchCache();
    reload();
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = editing._id ? await api.put(`/branches/${editing._id}`, form) : await api.post("/branches", form);
      toast.success(data.message);
      setEditing(null);
      afterChange();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/branches/${deleting._id}`);
      toast.success("Branch deleted");
      setDeleting(null);
      afterChange();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  // HOD must belong to the same department
  const hodOptions = faculty
    .filter((f) => !editing?._id || f.department?._id === editing._id)
    .map((f) => ({ value: f._id, label: `${fullName(f)} (${f.employeeId})` }));

  return (
    <>
      <PageHeader
        title="Branches"
        description="Departments / programmes offered by the university."
        actions={
          <button className="btn-primary" onClick={() => open(null)}>
            <Plus size={16} /> Add branch
          </button>
        }
      />

      {loading && branches.length === 0 ? (
        <Spinner />
      ) : branches.length === 0 ? (
        <div className="card">
          <EmptyState icon={Building2} title="No branches yet" text="Create the first branch to start adding students and subjects." />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {branches.map((b) => (
            <div key={b._id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded bg-brand-50 px-2 py-0.5 font-mono text-xs font-semibold text-brand-700">{b.code}</span>
                  <h3 className="mt-2 font-semibold leading-snug">{b.name}</h3>
                </div>
                <div className="flex">
                  <button className="icon-btn" onClick={() => open(b)} title="Edit">
                    <Pencil size={15} />
                  </button>
                  <button className="icon-btn hover:text-red-600" onClick={() => setDeleting(b)} title="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              {b.description && <p className="mt-2 text-sm text-slate-500">{b.description}</p>}
              <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Students</dt>
                  <dd className="font-semibold">{b.studentCount}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Subjects</dt>
                  <dd className="font-semibold">{b.subjectCount}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Semesters</dt>
                  <dd className="font-semibold">{b.totalSemesters}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-slate-500">
                HOD: <span className="text-slate-700">{b.hod ? fullName(b.hod) : "Not assigned"}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?._id ? "Edit branch" : "New branch"} size="sm">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Input label="Code" required value={form.code} onChange={set("code")} placeholder="CSE" />
            <Input label="Name" className="col-span-2" required value={form.name} onChange={set("name")} />
          </div>
          <Input label="Total semesters" type="number" min="1" max="10" value={form.totalSemesters} onChange={set("totalSemesters")} />
          {editing?._id && <Select label="Head of department" value={form.hod} onChange={set("hod")} options={hodOptions} placeholder="Not assigned" />}
          <Textarea label="Description" rows={2} value={form.description} onChange={set("description")} />
          <div className="flex justify-end gap-2">
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
        title="Delete branch?"
        message={deleting && `${deleting.code} — ${deleting.name} will be deleted. This only works if no students, faculty or subjects are linked to it.`}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

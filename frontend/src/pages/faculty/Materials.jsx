import { useState } from "react";
import toast from "react-hot-toast";
import { FileText, Upload } from "lucide-react";
import api, { errorMessage } from "../../api/client";
import useFetch from "../../hooks/useFetch";
import PageHeader from "../../components/ui/PageHeader";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import MaterialList from "../../components/MaterialList";
import { Field, Input, Select, Textarea } from "../../components/ui/Field";

const TYPES = ["Notes", "Assignment", "Syllabus", "Question Paper", "Other"];
const EMPTY = { title: "", subject: "", type: "Notes", description: "" };

export default function FacultyMaterials() {
  const { data: subjects } = useFetch("/subjects", { mine: "true" }, { initial: [] });
  const [subjectFilter, setSubjectFilter] = useState("");
  const { data: items, loading, reload } = useFetch("/materials", { mine: "true", subject: subjectFilter }, { initial: [] });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const subjectOptions = subjects.map((s) => ({ value: s._id, label: `${s.code} — ${s.name} (${s.branch?.code} Sem ${s.semester})` }));

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please choose a file");
    if (file.size > 10 * 1024 * 1024) return toast.error("File must be smaller than 10 MB");

    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.append(k, v));
    body.append("file", file);

    setBusy(true);
    try {
      await api.post("/materials", body, {
        onUploadProgress: (p) => p.total && setProgress(Math.round((p.loaded / p.total) * 100)),
      });
      toast.success("Material uploaded");
      setOpen(false);
      setForm(EMPTY);
      setFile(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/materials/${deleting._id}`);
      toast.success("Material deleted");
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
        title="Study material"
        description="Share notes, assignments and question papers with your students."
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)} disabled={!subjects.length}>
            <Upload size={16} /> Upload material
          </button>
        }
      />

      <div className="card">
        <div className="border-b border-slate-200 p-4">
          <select className="input w-auto min-w-[280px]" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
            <option value="">All my subjects</option>
            {subjectOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {loading && items.length === 0 ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState icon={FileText} title="Nothing uploaded yet" text="Files you upload are visible to students of that subject's class." />
        ) : (
          <MaterialList items={items} onDelete={setDeleting} showUploader={false} />
        )}
      </div>

      <Modal open={open} onClose={() => !busy && setOpen(false)} title="Upload study material">
        <form onSubmit={upload} className="space-y-4">
          <Input label="Title" required value={form.title} onChange={set("title")} placeholder="Unit 2 - Greedy Algorithms" />
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <Select label="Subject" required value={form.subject} onChange={set("subject")} options={subjectOptions} placeholder="Select subject" />
            <Select label="Type" value={form.type} onChange={set("type")} options={TYPES} />
          </div>
          <Textarea label="Description" rows={2} value={form.description} onChange={set("description")} />
          <Field label="File" required hint="PDF, Word, PowerPoint, Excel, ZIP or image · max 10 MB">
            <input
              type="file"
              className="input py-1.5"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
          </Field>
          {busy && progress > 0 && (
            <div className="h-1.5 rounded bg-slate-100">
              <div className="h-1.5 rounded bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </button>
            <button className="btn-primary" disabled={busy}>
              {busy ? `Uploading ${progress}%` : "Upload"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        busy={busy}
        title="Delete material?"
        message={deleting && `"${deleting.title}" will be removed and students will no longer be able to download it.`}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

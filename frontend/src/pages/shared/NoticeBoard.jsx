import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ExternalLink, Megaphone, Pencil, Plus, Search, Trash2 } from "lucide-react";
import api, { errorMessage } from "../../api/client";
import useFetch from "../../hooks/useFetch";
import useBranches from "../../hooks/useBranches";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { Input, Select, Textarea } from "../../components/ui/Field";
import { formatDate, fullName, timeAgo } from "../../utils/format";

const EMPTY = { title: "", description: "", audience: "all", branch: "", link: "", important: false };
const audienceLabel = { all: "Everyone", student: "Students", faculty: "Faculty" };

export default function NoticeBoard() {
  const { user, role } = useAuth();
  const canPost = role === "admin" || role === "faculty";
  const { options: branchOptions } = useBranches();
  const { data: notices, loading, reload } = useFetch("/notices", {}, { initial: [] });

  const [query, setQuery] = useState("");
  const [onlyImportant, setOnlyImportant] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notices.filter(
      (n) => (!onlyImportant || n.important) && (!q || n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q))
    );
  }, [notices, query, onlyImportant]);

  const canEdit = (n) => role === "admin" || (role === "faculty" && n.postedBy?._id === user._id);

  const open = (n) => {
    setEditing(n || {});
    setForm(
      n
        ? { title: n.title, description: n.description, audience: n.audience, branch: n.branch?._id || "", link: n.link || "", important: n.important }
        : { ...EMPTY, audience: role === "faculty" ? "student" : "all" }
    );
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = editing._id ? await api.put(`/notices/${editing._id}`, form) : await api.post("/notices", form);
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
      await api.delete(`/notices/${deleting._id}`);
      toast.success("Notice deleted");
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
        title="Notices"
        description={canPost ? "Announcements published on the portal." : "Latest announcements from the university and your faculty."}
        actions={
          canPost && (
            <button className="btn-primary" onClick={() => open(null)}>
              <Plus size={16} /> New notice
            </button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search notices" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" className="h-4 w-4 accent-brand-700" checked={onlyImportant} onChange={(e) => setOnlyImportant(e.target.checked)} />
          Important only
        </label>
      </div>

      {loading && notices.length === 0 ? (
        <Spinner />
      ) : visible.length === 0 ? (
        <div className="card">
          <EmptyState icon={Megaphone} title="No notices" text={query ? "Nothing matches your search." : "New announcements will show up here."} />
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((n) => (
            <article key={n._id} className={`card p-5 ${n.important ? "border-l-4 border-l-brand-600" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    {n.important && <Badge tone="brand">Important</Badge>}
                    {canPost && <Badge>{audienceLabel[n.audience]}</Badge>}
                    {n.branch && <Badge tone="blue">{n.branch.code}</Badge>}
                  </div>
                  <h3 className="font-semibold">{n.title}</h3>
                </div>
                {canEdit(n) && (
                  <div className="flex shrink-0">
                    <button className="icon-btn" onClick={() => open(n)} title="Edit">
                      <Pencil size={15} />
                    </button>
                    <button className="icon-btn hover:text-red-600" onClick={() => setDeleting(n)} title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{n.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span title={formatDate(n.createdAt)}>{timeAgo(n.createdAt)}</span>
                {n.postedBy && <span>by {fullName(n.postedBy)}</span>}
                {n.link && (
                  <a href={n.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline">
                    Open link <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?._id ? "Edit notice" : "Publish notice"}>
        <form onSubmit={submit} className="space-y-4">
          <Input label="Title" required maxLength={150} value={form.title} onChange={set("title")} />
          <Textarea label="Description" required rows={5} value={form.description} onChange={set("description")} />
          <div className="grid gap-4 sm:grid-cols-2">
            {role === "admin" ? (
              <Select
                label="Audience"
                value={form.audience}
                onChange={set("audience")}
                options={[
                  { value: "all", label: "Everyone" },
                  { value: "student", label: "Students only" },
                  { value: "faculty", label: "Faculty only" },
                ]}
              />
            ) : (
              <Input label="Audience" value="Students" disabled />
            )}
            <Select label="Branch" value={form.branch} onChange={set("branch")} options={branchOptions} placeholder="All branches" />
          </div>
          <Input label="Link (optional)" type="url" value={form.link} onChange={set("link")} placeholder="https://" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-brand-700" checked={form.important} onChange={set("important")} />
            Mark as important (pinned to the top)
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button className="btn-primary" disabled={busy}>
              {busy ? "Saving..." : editing?._id ? "Save changes" : "Publish"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        busy={busy}
        title="Delete notice?"
        message={deleting && `"${deleting.title}" will be removed for everyone.`}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

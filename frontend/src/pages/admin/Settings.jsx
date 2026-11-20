import { useState } from "react";
import toast from "react-hot-toast";
import { ShieldCheck, Trash2, UserPlus } from "lucide-react";
import api, { errorMessage } from "../../api/client";
import useFetch from "../../hooks/useFetch";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Spinner from "../../components/ui/Spinner";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { Input } from "../../components/ui/Field";
import { formatDate } from "../../utils/format";

const EMPTY = { employeeId: "", name: "", email: "", phone: "", designation: "", password: "" };

export default function Settings() {
  const { user } = useAuth();
  const { data: admins, loading, reload, setData } = useFetch("/admin/admins", {}, { initial: [] });
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/admin/admins", form);
      toast.success("Admin account created");
      setAdding(false);
      setForm(EMPTY);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async (a) => {
    try {
      const { data } = await api.put(`/admin/admins/${a._id}`, { status: a.status === "active" ? "inactive" : "active" });
      setData((list) => list.map((x) => (x._id === a._id ? data.data : x)));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/admins/${deleting._id}`);
      toast.success("Admin removed");
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
      <PageHeader title="System settings" description="Manage who has administrative access to the portal." />

      <section className="card">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold">Administrators</h2>
            <p className="text-sm text-slate-500">Admins can create and modify every record in the system.</p>
          </div>
          <button className="btn-primary" onClick={() => setAdding(true)}>
            <UserPlus size={16} /> Add admin
          </button>
        </div>

        {loading ? (
          <Spinner />
        ) : (
          <ul className="divide-y divide-slate-100">
            {admins.map((a) => (
              <li key={a._id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                <Avatar src={a.profileImage} name={a.name} />
                <div className="min-w-[200px] flex-1">
                  <p className="font-medium">
                    {a.name} {a._id === user._id && <span className="text-xs font-normal text-slate-500">(you)</span>}
                  </p>
                  <p className="text-sm text-slate-500">
                    {a.email} · {a.employeeId}
                  </p>
                </div>
                <div className="text-sm text-slate-500">{a.designation}</div>
                <div className="text-xs text-slate-400">since {formatDate(a.createdAt)}</div>
                {a.isSuperAdmin ? (
                  <Badge tone="brand">
                    <ShieldCheck size={12} className="mr-1" /> Super admin
                  </Badge>
                ) : (
                  <div className="flex items-center gap-2">
                    <button className="btn-outline btn-sm" onClick={() => toggleStatus(a)} disabled={a._id === user._id}>
                      {a.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                    <button className="icon-btn hover:text-red-600" onClick={() => setDeleting(a)} disabled={a._id === user._id}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add administrator" size="sm">
        <form onSubmit={create} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Employee ID" required value={form.employeeId} onChange={set("employeeId")} placeholder="ADM002" />
            <Input label="Phone" value={form.phone} onChange={set("phone")} />
          </div>
          <Input label="Full name" required value={form.name} onChange={set("name")} />
          <Input label="Email" type="email" required value={form.email} onChange={set("email")} />
          <Input label="Designation" value={form.designation} onChange={set("designation")} placeholder="Examination Cell" />
          <Input label="Password" required minLength={6} value={form.password} onChange={set("password")} />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button className="btn-primary" disabled={busy}>
              {busy ? "Creating..." : "Create admin"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        busy={busy}
        title="Remove admin?"
        message={deleting && `${deleting.name} will lose access to the admin panel.`}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

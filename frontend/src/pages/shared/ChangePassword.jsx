import { useState } from "react";
import toast from "react-hot-toast";
import api, { errorMessage } from "../../api/client";
import PageHeader from "../../components/ui/PageHeader";
import { Input } from "../../components/ui/Field";

const strength = (p) => {
  let score = 0;
  if (p.length >= 8) score++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  return score;
};
const LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong"];
const COLORS = ["bg-red-500", "bg-red-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-600"];

export default function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const score = strength(form.newPassword);

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) return toast.error("New password and confirmation do not match");

    setBusy(true);
    try {
      const { data } = await api.put("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success(data.message);
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Change password" description="Use a password you don't use on other websites." />
      <form onSubmit={submit} className="card max-w-lg space-y-4 p-6">
        <Input label="Current password" type="password" required value={form.currentPassword} onChange={set("currentPassword")} autoComplete="current-password" />
        <div>
          <Input label="New password" type="password" required minLength={6} value={form.newPassword} onChange={set("newPassword")} autoComplete="new-password" />
          {form.newPassword && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={`h-1 flex-1 rounded ${i < score ? COLORS[score] : "bg-slate-200"}`} />
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-500">{LABELS[score]}</p>
            </div>
          )}
        </div>
        <Input label="Confirm new password" type="password" required value={form.confirm} onChange={set("confirm")} autoComplete="new-password" />
        <button className="btn-primary" disabled={busy}>
          {busy ? "Updating..." : "Update password"}
        </button>
      </form>
    </>
  );
}

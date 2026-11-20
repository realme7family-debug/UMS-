import { useState } from "react";
import toast from "react-hot-toast";
import api, { errorMessage } from "../api/client";
import Modal from "./ui/Modal";
import { Input } from "./ui/Field";

export default function ResetPasswordModal({ target, role, onClose }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/admin/reset-password", { role, id: target._id, newPassword: password });
      toast.success("Password reset. Share the new password with the user.");
      setPassword("");
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={!!target} onClose={onClose} title="Reset password" subtitle={target?.name} size="sm">
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="New password"
          type="text"
          minLength={6}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="At least 6 characters. The user can change it after logging in."
        />
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={busy}>
            {busy ? "Saving..." : "Reset password"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { KeyRound, Pencil, Plus, Search, Trash2, SquareUser } from "lucide-react";
import api, { errorMessage } from "../../api/client";
import useFetch from "../../hooks/useFetch";
import useDebounce from "../../hooks/useDebounce";
import useBranches from "../../hooks/useBranches";
import PageHeader from "../../components/ui/PageHeader";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ResetPasswordModal from "../../components/ResetPasswordModal";
import { Field, Input, Select, Textarea } from "../../components/ui/Field";
import { formatDate, fullName, toInputDate } from "../../utils/format";

const DESIGNATIONS = ["Professor", "Associate Professor", "Assistant Professor", "Lecturer", "Lab Instructor"];

const EMPTY = {
  employeeId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  gender: "Male",
  dob: "",
  department: "",
  designation: "Assistant Professor",
  qualification: "",
  experience: "0",
  joiningDate: toInputDate(new Date()),
  address: "",
  status: "active",
  password: "",
};

function FacultyForm({ open, faculty, onClose, onSaved }) {
  const { options: branchOptions } = useBranches();
  const [form, setForm] = useState(EMPTY);
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPhoto(null);
    setForm(
      faculty
        ? {
            ...EMPTY,
            ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, faculty[k] ?? ""])),
            department: faculty.department?._id || "",
            experience: String(faculty.experience ?? 0),
            dob: toInputDate(faculty.dob),
            joiningDate: toInputDate(faculty.joiningDate),
            password: "",
          }
        : EMPTY
    );
  }, [open, faculty]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => v !== "" && body.append(k, v));
    if (photo) body.append("profileImage", photo);

    try {
      const { data } = faculty ? await api.put(`/faculty/${faculty._id}`, body) : await api.post("/faculty", body);
      toast.success(data.message);
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title={faculty ? "Edit faculty member" : "Add faculty member"}>
      <form onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Employee ID" required value={form.employeeId} onChange={set("employeeId")} placeholder="E10231" />
          <Input label="First name" required value={form.firstName} onChange={set("firstName")} />
          <Input label="Last name" value={form.lastName} onChange={set("lastName")} />
          <Input label="Email" type="email" required value={form.email} onChange={set("email")} />
          <Input label="Phone" value={form.phone} onChange={set("phone")} maxLength={10} />
          <Select label="Gender" value={form.gender} onChange={set("gender")} options={["Male", "Female", "Other"]} />
          <Select label="Department" required value={form.department} onChange={set("department")} options={branchOptions} placeholder="Select" />
          <Select label="Designation" value={form.designation} onChange={set("designation")} options={DESIGNATIONS} />
          <Input label="Qualification" value={form.qualification} onChange={set("qualification")} placeholder="M.Tech (CSE)" />
          <Input label="Experience (years)" type="number" min="0" value={form.experience} onChange={set("experience")} />
          <Input label="Date of birth" type="date" value={form.dob} onChange={set("dob")} />
          <Input label="Joining date" type="date" value={form.joiningDate} onChange={set("joiningDate")} />
          <Textarea label="Address" className="sm:col-span-3" rows={2} value={form.address} onChange={set("address")} />
          <Field label="Photo" hint="JPG / PNG, max 2 MB">
            <input type="file" accept="image/*" className="input py-1.5" onChange={(e) => setPhoto(e.target.files[0])} />
          </Field>
          <Select label="Status" value={form.status} onChange={set("status")} options={["active", "inactive"]} />
          {!faculty && (
            <Input label="Password" value={form.password} onChange={set("password")} placeholder="Default: employee ID" />
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={busy}>
            {busy ? "Saving..." : faculty ? "Save changes" : "Add faculty"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function FacultyPage() {
  const { options: branchOptions } = useBranches();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const q = useDebounce(search);
  const { data: rows, loading, reload } = useFetch("/faculty", { search: q, department }, { initial: [] });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [resetting, setResetting] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/faculty/${deleting._id}`);
      toast.success("Faculty member removed");
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
        title="Faculty"
        description="Teaching staff across all departments."
        actions={
          <button
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={16} /> Add faculty
          </button>
        }
      />

      <div className="card">
        <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_260px]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search by name, employee ID or email" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input" value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">All departments</option>
            {branchOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {loading && rows.length === 0 ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState icon={SquareUser} title="No faculty found" />
        ) : (
          <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((f) => (
              <div key={f._id} className="rounded-2xl border border-slate-100 p-5 transition hover:shadow-soft">
                <div className="flex items-center gap-3.5">
                  <Avatar src={f.profileImage} name={fullName(f)} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{fullName(f)}</p>
                    <p className="text-sm text-slate-500">{f.designation}</p>
                  </div>
                  <Badge tone="blue">{f.department?.code}</Badge>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">Employee ID</dt>
                    <dd className="font-mono text-xs font-semibold">{f.employeeId}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Joined</dt>
                    <dd className="font-semibold">{formatDate(f.joiningDate, { month: "short", year: "numeric" })}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-slate-500">Qualification</dt>
                    <dd className="font-semibold">{f.qualification || "—"}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <Badge tone={f.status === "active" ? "green" : "red"}>{f.status}</Badge>
                  <div className="flex gap-0.5">
                    <button
                      className="icon-btn"
                      title="Edit"
                      onClick={() => {
                        setEditing(f);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil size={16} />
                    </button>
                    <button className="icon-btn" title="Reset password" onClick={() => setResetting(f)}>
                      <KeyRound size={16} />
                    </button>
                    <button className="icon-btn hover:text-red-600" title="Delete" onClick={() => setDeleting(f)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FacultyForm
        open={formOpen}
        faculty={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          reload();
        }}
      />
      <ResetPasswordModal
        role="faculty"
        target={resetting && { _id: resetting._id, name: `${fullName(resetting)} (${resetting.employeeId})` }}
        onClose={() => setResetting(null)}
      />
      <ConfirmDialog
        open={!!deleting}
        busy={busy}
        title="Remove faculty member?"
        message={deleting && `${fullName(deleting)} will be removed and unassigned from their subjects.`}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api, { errorMessage } from "../../api/client";
import Modal from "../../components/ui/Modal";
import { Input, Select, Textarea, Field } from "../../components/ui/Field";
import useBranches, { semesterOptions } from "../../hooks/useBranches";
import { toInputDate } from "../../utils/format";

const EMPTY = {
  enrollmentNo: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  gender: "Male",
  dob: "",
  bloodGroup: "",
  branch: "",
  semester: "1",
  section: "A",
  admissionYear: String(new Date().getFullYear()),
  guardianName: "",
  guardianPhone: "",
  address: "",
  status: "active",
  password: "",
};

export default function StudentForm({ open, student, onClose, onSaved }) {
  const { options: branchOptions } = useBranches();
  const [form, setForm] = useState(EMPTY);
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const isEdit = !!student;

  useEffect(() => {
    if (!open) return;
    setPhoto(null);
    if (student) {
      setForm({
        ...EMPTY,
        ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, student[k] ?? ""])),
        branch: student.branch?._id || student.branch || "",
        semester: String(student.semester),
        admissionYear: String(student.admissionYear || ""),
        dob: toInputDate(student.dob),
        password: "",
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, student]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);

    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v !== "" && v !== null) body.append(k, v);
    });
    if (photo) body.append("profileImage", photo);

    try {
      const { data } = isEdit ? await api.put(`/students/${student._id}`, body) : await api.post("/students", body);
      toast.success(data.message);
      onSaved(data.data);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? "Edit student" : "Add new student"}
      subtitle={isEdit ? `${student.enrollmentNo}` : "Fields marked * are required"}
    >
      <form onSubmit={submit}>
        <p className="mb-3 text-sm font-semibold text-slate-700">Academic details</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Enrollment No." required value={form.enrollmentNo} onChange={set("enrollmentNo")} placeholder="24BCS10101" />
          <Select label="Branch" required value={form.branch} onChange={set("branch")} options={branchOptions} placeholder="Select branch" />
          <Select label="Semester" required value={form.semester} onChange={set("semester")} options={semesterOptions()} />
          <Input label="Section" value={form.section} onChange={set("section")} maxLength={2} />
          <Input label="Admission year" type="number" value={form.admissionYear} onChange={set("admissionYear")} />
          <Select label="Status" value={form.status} onChange={set("status")} options={["active", "inactive"]} />
        </div>

        <p className="mb-3 mt-6 text-sm font-semibold text-slate-700">Personal details</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="First name" required value={form.firstName} onChange={set("firstName")} />
          <Input label="Last name" value={form.lastName} onChange={set("lastName")} />
          <Select label="Gender" value={form.gender} onChange={set("gender")} options={["Male", "Female", "Other"]} />
          <Input label="Email" type="email" required value={form.email} onChange={set("email")} />
          <Input label="Phone" value={form.phone} onChange={set("phone")} maxLength={10} />
          <Input label="Date of birth" type="date" value={form.dob} onChange={set("dob")} />
          <Select
            label="Blood group"
            value={form.bloodGroup}
            onChange={set("bloodGroup")}
            placeholder="—"
            options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]}
          />
          <Input label="Guardian name" value={form.guardianName} onChange={set("guardianName")} />
          <Input label="Guardian phone" value={form.guardianPhone} onChange={set("guardianPhone")} maxLength={10} />
          <Textarea label="Address" className="sm:col-span-3" value={form.address} onChange={set("address")} rows={2} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Photo" hint="JPG / PNG, max 2 MB">
            <input type="file" accept="image/*" className="input py-1.5" onChange={(e) => setPhoto(e.target.files[0])} />
          </Field>
          {!isEdit && (
            <Input
              label="Password"
              value={form.password}
              onChange={set("password")}
              placeholder="Leave blank to use enrollment no."
              hint="Default: enrollment number in lowercase"
            />
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={busy}>
            {busy ? "Saving..." : isEdit ? "Save changes" : "Add student"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

import Modal from "./ui/Modal";
import Avatar from "./ui/Avatar";
import Badge from "./ui/Badge";
import { formatDate, fullName } from "../utils/format";

const Row = ({ label, value }) => (
  <div>
    <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
    <dd className="mt-0.5 text-sm">{value || "—"}</dd>
  </div>
);

export default function StudentDetailsModal({ student, onClose }) {
  if (!student) return null;
  return (
    <Modal open onClose={onClose} title="Student details" size="md">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
        <Avatar src={student.profileImage} name={fullName(student)} size="lg" />
        <div>
          <p className="text-lg font-semibold">{fullName(student)}</p>
          <p className="font-mono text-sm text-slate-500">{student.enrollmentNo}</p>
          <div className="mt-1.5 flex gap-2">
            <Badge tone="brand">
              {student.branch?.code} · Sem {student.semester} · Sec {student.section}
            </Badge>
            <Badge tone={student.status === "active" ? "green" : "red"}>{student.status}</Badge>
          </div>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 pt-4 sm:grid-cols-3">
        <Row label="Email" value={student.email} />
        <Row label="Phone" value={student.phone} />
        <Row label="Gender" value={student.gender} />
        <Row label="Date of birth" value={student.dob && formatDate(student.dob)} />
        <Row label="Blood group" value={student.bloodGroup} />
        <Row label="Admission year" value={student.admissionYear} />
        <Row label="Guardian" value={student.guardianName} />
        <Row label="Guardian phone" value={student.guardianPhone} />
        <Row label="Branch" value={student.branch?.name} />
        <div className="col-span-2 sm:col-span-3">
          <Row label="Address" value={student.address} />
        </div>
      </dl>
    </Modal>
  );
}

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Eye, KeyRound, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import api, { errorMessage } from "../../api/client";
import useFetch from "../../hooks/useFetch";
import useDebounce from "../../hooks/useDebounce";
import useBranches, { semesterOptions } from "../../hooks/useBranches";
import PageHeader from "../../components/ui/PageHeader";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Pagination from "../../components/ui/Pagination";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import StudentDetailsModal from "../../components/StudentDetailsModal";
import ResetPasswordModal from "../../components/ResetPasswordModal";
import StudentForm from "./StudentForm";
import { fullName } from "../../utils/format";

export default function Students() {
  const { options: branchOptions } = useBranches();
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounce(search);

  useEffect(() => setPage(1), [q, branch, semester]);

  const { data, loading, reload } = useFetch("/students", { search: q, branch, semester, page, limit: 10 }, { select: (d) => d });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [resetting, setResetting] = useState(null);
  const [busy, setBusy] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (s) => {
    setEditing(s);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/students/${deleting._id}`);
      toast.success("Student deleted");
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const rows = data?.data || [];

  return (
    <>
      <PageHeader
        title="Students"
        description="Add, update and look up student records."
        actions={
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add student
          </button>
        }
      />

      <div className="card">
        <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_220px_160px]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search by name, enrollment no., email or phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input" value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="">All branches</option>
            {branchOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select className="input" value={semester} onChange={(e) => setSemester(e.target.value)}>
            <option value="">All semesters</option>
            {semesterOptions().map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {loading && !data ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState icon={Users} title="No students found" text="Try changing the filters or add a new student." />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Enrollment No.</th>
                    <th>Branch</th>
                    <th>Sem / Sec</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={loading ? "opacity-50" : ""}>
                  {rows.map((s) => (
                    <tr key={s._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar src={s.profileImage} name={fullName(s)} size="sm" />
                          <div>
                            <p className="font-medium">{fullName(s)}</p>
                            <p className="text-xs text-slate-500">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-xs">{s.enrollmentNo}</td>
                      <td>{s.branch?.code}</td>
                      <td>
                        {s.semester} / {s.section}
                      </td>
                      <td className="text-slate-600">{s.phone || "—"}</td>
                      <td>
                        <Badge tone={s.status === "active" ? "green" : "red"}>{s.status}</Badge>
                      </td>
                      <td>
                        <div className="flex justify-end gap-0.5">
                          <button className="icon-btn" title="View" onClick={() => setViewing(s)}>
                            <Eye size={16} />
                          </button>
                          <button className="icon-btn" title="Edit" onClick={() => openEdit(s)}>
                            <Pencil size={16} />
                          </button>
                          <button className="icon-btn" title="Reset password" onClick={() => setResetting(s)}>
                            <KeyRound size={16} />
                          </button>
                          <button className="icon-btn hover:text-red-600" title="Delete" onClick={() => setDeleting(s)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} />
          </>
        )}
      </div>

      <StudentForm
        open={formOpen}
        student={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          reload();
        }}
      />
      <StudentDetailsModal student={viewing} onClose={() => setViewing(null)} />
      <ResetPasswordModal
        role="student"
        target={resetting && { _id: resetting._id, name: `${fullName(resetting)} (${resetting.enrollmentNo})` }}
        onClose={() => setResetting(null)}
      />
      <ConfirmDialog
        open={!!deleting}
        busy={busy}
        title="Delete student?"
        message={deleting && `${fullName(deleting)} (${deleting.enrollmentNo}) and all their marks will be permanently removed.`}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

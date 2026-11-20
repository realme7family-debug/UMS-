import { useEffect, useState } from "react";
import { Search, Users } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import useDebounce from "../../hooks/useDebounce";
import useBranches, { semesterOptions } from "../../hooks/useBranches";
import PageHeader from "../../components/ui/PageHeader";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Avatar from "../../components/ui/Avatar";
import Pagination from "../../components/ui/Pagination";
import StudentDetailsModal from "../../components/StudentDetailsModal";
import { fullName } from "../../utils/format";

export default function StudentSearch() {
  const { options: branchOptions } = useBranches();
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [section, setSection] = useState("");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const q = useDebounce(search);

  useEffect(() => setPage(1), [q, branch, semester, section]);

  const hasFilter = q || branch || semester;
  const { data, loading } = useFetch(
    hasFilter ? "/students" : null,
    { search: q, branch, semester, section, page, limit: 15, status: "active" },
    { select: (d) => d }
  );
  const rows = data?.data || [];

  return (
    <>
      <PageHeader title="Search students" description="Look up any student by name, enrollment number or class." />

      <div className="card">
        <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_220px_160px_120px]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Name, enrollment no. or email" value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
          </div>
          <select className="input" value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="">Any branch</option>
            {branchOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select className="input" value={semester} onChange={(e) => setSemester(e.target.value)}>
            <option value="">Any semester</option>
            {semesterOptions().map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select className="input" value={section} onChange={(e) => setSection(e.target.value)}>
            <option value="">Any sec.</option>
            {["A", "B", "C", "D"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        {!hasFilter ? (
          <EmptyState icon={Search} title="Start typing to search" text="Or pick a branch / semester to list a whole class." />
        ) : loading && !data ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState icon={Users} title="No matching students" />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Enrollment No.</th>
                    <th>Class</th>
                    <th>Phone</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s._id} className="cursor-pointer" onClick={() => setViewing(s)}>
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
                      <td>
                        {s.branch?.code} · Sem {s.semester} · {s.section}
                      </td>
                      <td className="text-slate-600">{s.phone || "—"}</td>
                      <td className="text-right text-xs text-brand-700">View</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} />
          </>
        )}
      </div>

      <StudentDetailsModal student={viewing} onClose={() => setViewing(null)} />
    </>
  );
}

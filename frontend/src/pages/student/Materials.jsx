import { useState } from "react";
import { FileText, Search } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import useDebounce from "../../hooks/useDebounce";
import PageHeader from "../../components/ui/PageHeader";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import MaterialList from "../../components/MaterialList";

const TYPES = ["Notes", "Assignment", "Syllabus", "Question Paper", "Other"];

export default function StudentMaterials() {
  const { data: subjects } = useFetch("/subjects", {}, { initial: [] });
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const q = useDebounce(search);
  const { data: items, loading } = useFetch("/materials", { subject, type, search: q }, { initial: [] });

  return (
    <>
      <PageHeader title="Study material" description="Notes, assignments and papers shared by your faculty." />

      <div className="card">
        <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_260px_180px]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search by title" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option>
            {TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        {loading && items.length === 0 ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState icon={FileText} title="No material found" text="Your faculty hasn't shared anything matching these filters yet." />
        ) : (
          <MaterialList items={items} />
        )}
      </div>
    </>
  );
}

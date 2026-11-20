import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, pages, total, onChange }) {
  if (!pages || pages <= 1) return total ? <p className="px-4 py-3 text-xs text-slate-500">{total} record(s)</p> : null;
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <span className="text-xs text-slate-500">
        Page {page} of {pages} · {total} records
      </span>
      <div className="flex gap-1">
        <button className="btn-outline btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft size={14} /> Prev
        </button>
        <button className="btn-outline btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

import { Download, FileText, FileSpreadsheet, FileArchive, FileImage, Trash2 } from "lucide-react";
import Badge from "./ui/Badge";
import { fileUrl, formatBytes, formatDate, fullName } from "../utils/format";

const iconFor = (name = "") => {
  const ext = name.split(".").pop().toLowerCase();
  if (["xls", "xlsx", "csv"].includes(ext)) return FileSpreadsheet;
  if (["zip", "rar"].includes(ext)) return FileArchive;
  if (["png", "jpg", "jpeg"].includes(ext)) return FileImage;
  return FileText;
};

const typeTone = { Notes: "gray", Assignment: "amber", Syllabus: "blue", "Question Paper": "brand", Other: "gray" };

export default function MaterialList({ items, onDelete, showUploader = true }) {
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((m) => {
        const Icon = iconFor(m.originalName || m.file);
        return (
          <li key={m._id} className="flex items-center gap-4 px-5 py-3.5">
            <div className="rounded-md bg-slate-100 p-2.5 text-slate-500">
              <Icon size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{m.title}</p>
                <Badge tone={typeTone[m.type]}>{m.type}</Badge>
              </div>
              <p className="truncate text-sm text-slate-500">
                {m.subject?.code} · {m.subject?.name}
                {showUploader && m.uploadedBy && ` · ${fullName(m.uploadedBy)}`}
              </p>
              {m.description && <p className="mt-0.5 text-sm text-slate-600">{m.description}</p>}
            </div>
            <div className="hidden text-right text-xs text-slate-500 sm:block">
              <p>{formatDate(m.createdAt)}</p>
              <p>{formatBytes(m.fileSize)}</p>
            </div>
            <a href={fileUrl(m.file)} target="_blank" rel="noreferrer" download={m.originalName || true} className="btn-outline btn-sm">
              <Download size={14} /> <span className="hidden sm:inline">Download</span>
            </a>
            {onDelete && (
              <button className="icon-btn hover:text-red-600" onClick={() => onDelete(m)} title="Delete">
                <Trash2 size={16} />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

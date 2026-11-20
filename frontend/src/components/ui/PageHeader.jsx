import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { findNavItem } from "../layout/navigation";
import { tone } from "./tones";

// picks the icon + colour of the current module from the sidebar config
export default function PageHeader({ title, description, actions }) {
  const { role } = useAuth();
  const { pathname } = useLocation();
  const item = findNavItem(role, pathname);
  const Icon = item?.icon;

  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tone(item.tone).tile}`}>
            <Icon size={22} />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

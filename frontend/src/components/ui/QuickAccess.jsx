import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { moduleLinks } from "../layout/navigation";
import { tone } from "./tones";

// grid of colourful module shortcuts shown on dashboards
export default function QuickAccess({ role, title = "Quick access" }) {
  const items = moduleLinks(role);
  return (
    <section className="mb-7">
      <h2 className="section-title mb-4">{title}</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {items.map(({ to, label, desc, icon: Icon, tone: t }) => (
          <Link
            key={to}
            to={to}
            className="card group flex items-start gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone(t).tile}`}>
              <Icon size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center justify-between font-bold">
                {label}
                <ArrowUpRight size={16} className="text-slate-300 transition group-hover:text-brand-600" />
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

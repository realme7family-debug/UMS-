import { tone as getTone } from "./tones";

export default function StatCard({ label, value, icon: Icon, note, tone = "blue" }) {
  const t = getTone(tone);
  return (
    <div className="card relative overflow-hidden p-5">
      <div className={`absolute -bottom-6 -right-6 h-16 w-16 rounded-full opacity-[0.07] ${t.solid}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight">{value ?? "–"}</p>
        </div>
        {Icon && (
          <div className={`grid h-11 w-11 place-items-center rounded-xl ${t.tile}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      {note && <p className="mt-2 text-xs font-medium text-slate-400">{note}</p>}
    </div>
  );
}

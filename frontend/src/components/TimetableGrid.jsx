import { DAYS, fullName, to12h, todayName } from "../utils/format";

// each subject gets its own colour so the week is easy to scan
const COLORS = [
  "bg-blue-50 border-blue-500 text-blue-900",
  "bg-violet-50 border-violet-500 text-violet-900",
  "bg-emerald-50 border-emerald-500 text-emerald-900",
  "bg-amber-50 border-amber-500 text-amber-900",
  "bg-cyan-50 border-cyan-500 text-cyan-900",
  "bg-rose-50 border-rose-500 text-rose-900",
  "bg-indigo-50 border-indigo-500 text-indigo-900",
];

/**
 * Renders the weekly timetable as a day x period grid.
 * `slots` = populated slot objects from the API.
 */
export default function TimetableGrid({ slots = [] }) {
  const periods = [...new Map(slots.map((s) => [`${s.startTime}-${s.endTime}`, s])).keys()].sort();
  const days = DAYS.filter((d) => d !== "Saturday" || slots.some((s) => s.day === "Saturday"));
  const today = todayName();

  const subjectIds = [...new Set(slots.map((s) => String(s.subject?._id)))].sort();
  const colorOf = (s) => COLORS[subjectIds.indexOf(String(s.subject?._id)) % COLORS.length];
  const cell = (day, period) => slots.find((s) => s.day === day && `${s.startTime}-${s.endTime}` === period);

  if (slots.length === 0) return null;

  return (
    <div className="table-wrap">
      <table className="w-full min-w-[820px] border-separate border-spacing-1.5 text-sm">
        <thead>
          <tr>
            <th className="w-20 px-2 py-1.5 text-left text-xs font-semibold text-slate-500">Day</th>
            {periods.map((p) => {
              const [start, end] = p.split("-");
              return (
                <th key={p} className="px-2 py-1.5 text-xs font-semibold text-slate-600">
                  {to12h(start)}
                  <span className="block text-[11px] font-medium text-slate-400">to {to12h(end)}</span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day}>
              <td className={`px-2 font-bold ${day === today ? "text-brand-600" : ""}`}>
                {day.slice(0, 3)}
                {day === today && <span className="block text-[10px] font-extrabold uppercase">today</span>}
              </td>
              {periods.map((p) => {
                const s = cell(day, p);
                return (
                  <td key={p} className="h-[88px] align-top">
                    {s ? (
                      <div className={`h-full rounded-xl border-l-4 px-3 py-2 ${colorOf(s)}`}>
                        <p className="text-xs font-bold">{s.subject?.code}</p>
                        <p className="line-clamp-2 text-xs leading-snug">{s.subject?.name}</p>
                        <p className="mt-1 text-[11px] opacity-75">
                          {s.room}
                          {s.faculty && ` · ${fullName(s.faculty)}`}
                        </p>
                      </div>
                    ) : (
                      <div className="grid h-full place-items-center rounded-xl border-2 border-dashed border-slate-200 text-xs text-slate-300">
                        Free
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

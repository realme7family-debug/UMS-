// big coloured welcome strip at the top of every dashboard
export default function HeroBanner({ eyebrow, title, subtitle, chips = [], action, side }) {
  return (
    <section className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-700 to-[#2b3a8c] p-7 text-white sm:p-9">
      <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
      />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          {side}
          <div>
            {eyebrow && <p className="text-sm font-semibold text-brand-300">{eyebrow}</p>}
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-[34px]">{title}</h1>
            {subtitle && <p className="mt-2 max-w-xl text-slate-300">{subtitle}</p>}
            {chips.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {chips.map((c) => (
                  <span key={c} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/15">
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {action}
      </div>
    </section>
  );
}

// colour per module, written out in full so Tailwind can see the class names
export const tones = {
  blue: { tile: "bg-blue-50 text-blue-600", solid: "bg-blue-600", ring: "ring-blue-100" },
  violet: { tile: "bg-violet-50 text-violet-600", solid: "bg-violet-600", ring: "ring-violet-100" },
  amber: { tile: "bg-amber-50 text-amber-600", solid: "bg-amber-500", ring: "ring-amber-100" },
  emerald: { tile: "bg-emerald-50 text-emerald-600", solid: "bg-emerald-600", ring: "ring-emerald-100" },
  rose: { tile: "bg-rose-50 text-rose-600", solid: "bg-rose-600", ring: "ring-rose-100" },
  cyan: { tile: "bg-cyan-50 text-cyan-600", solid: "bg-cyan-600", ring: "ring-cyan-100" },
  indigo: { tile: "bg-indigo-50 text-indigo-600", solid: "bg-indigo-600", ring: "ring-indigo-100" },
  orange: { tile: "bg-orange-50 text-orange-600", solid: "bg-orange-500", ring: "ring-orange-100" },
  teal: { tile: "bg-teal-50 text-teal-600", solid: "bg-teal-600", ring: "ring-teal-100" },
  pink: { tile: "bg-pink-50 text-pink-600", solid: "bg-pink-600", ring: "ring-pink-100" },
  slate: { tile: "bg-slate-100 text-slate-600", solid: "bg-slate-700", ring: "ring-slate-200" },
};

export const tone = (name) => tones[name] || tones.slate;

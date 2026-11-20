import { fileUrl, initials } from "../../utils/format";

const sizes = { sm: "h-9 w-9 text-xs", md: "h-10 w-10 text-sm", lg: "h-20 w-20 text-2xl", xl: "h-28 w-28 text-3xl" };

// same name always gets the same colour
const palette = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700",
];
const colorFor = (name = "") => palette[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % palette.length];

export default function Avatar({ src, name = "", size = "md" }) {
  if (src) {
    return <img src={fileUrl(src)} alt={name} className={`${sizes[size]} shrink-0 rounded-full object-cover ring-2 ring-white`} />;
  }
  return (
    <div className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-full font-bold ring-2 ring-white ${colorFor(name)}`}>
      {initials(name) || "?"}
    </div>
  );
}

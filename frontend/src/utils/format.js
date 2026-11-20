import { SERVER_URL } from "../api/client";

export const fullName = (p) => (p ? p.name || `${p.firstName || ""} ${p.lastName || ""}`.trim() : "");

export const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

export const fileUrl = (path) => (!path ? "" : /^(data:|blob:|https?:)/.test(path) ? path : `${SERVER_URL}${path}`);

export const formatDate = (d, opts = { day: "2-digit", month: "short", year: "numeric" }) =>
  d ? new Date(d).toLocaleDateString("en-IN", opts) : "—";

export const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

export const timeAgo = (d) => {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} day${diff < 172800 ? "" : "s"} ago`;
  return formatDate(d);
};

export const formatBytes = (n = 0) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

// 24h "13:50" -> "1:50 PM"
export const to12h = (t = "") => {
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h)) return t;
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
};

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const todayName = () => new Date().toLocaleDateString("en-US", { weekday: "long" });

export const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

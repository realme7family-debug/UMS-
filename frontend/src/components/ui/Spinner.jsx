export default function Spinner({ label = "Loading...", className = "py-16" }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 text-sm text-slate-500 ${className}`}>
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-700" />
      {label}
    </div>
  );
}

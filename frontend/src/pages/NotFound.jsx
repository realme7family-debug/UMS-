import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
      <p className="text-6xl font-semibold text-brand-700">404</p>
      <p className="text-lg font-medium">Page not found</p>
      <p className="text-sm text-slate-500">The page you are looking for doesn't exist or was moved.</p>
      <Link to="/" className="btn-primary mt-4">
        Go to dashboard
      </Link>
    </div>
  );
}

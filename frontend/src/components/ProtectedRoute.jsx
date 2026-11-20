import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Spinner from "./ui/Spinner";

export default function ProtectedRoute({ allow }) {
  const { user, role, loading } = useAuth();

  if (loading) return <Spinner label="Checking session..." className="h-screen" />;
  if (!user) return <Navigate to="/login" replace />;

  // logged in but trying to open another role's panel
  if (allow && !allow.includes(role)) return <Navigate to={`/${role}`} replace />;

  return <Outlet />;
}

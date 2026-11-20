import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Eye, EyeOff, GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../api/client";

const ROLES = [
  { key: "student", label: "Student", idLabel: "Enrollment No. or Email", placeholder: "e.g. 24BCS10101" },
  { key: "faculty", label: "Faculty", idLabel: "Employee ID or Email", placeholder: "e.g. E10231" },
  { key: "admin", label: "Admin", idLabel: "Employee ID or Email", placeholder: "e.g. admin@ums.edu" },
];

export default function Login() {
  const { user, role: currentRole, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [role, setRole] = useState(() => (["student", "faculty", "admin"].includes(params.get("role")) ? params.get("role") : "student"));
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);

  // keep the selected tab in sync with ?role= (links on the home page)
  const roleParam = params.get("role");
  useEffect(() => {
    if (["student", "faculty", "admin"].includes(roleParam)) setRole(roleParam);
  }, [roleParam]);

  useEffect(() => {
    if (params.get("expired")) toast.error("Your session expired, please login again.");
  }, [params]);

  if (user) return <Navigate to={`/${currentRole}`} replace />;

  const active = ROLES.find((r) => r.key === role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await login({ role, loginId, password });
      toast.success(`Welcome, ${data.user.firstName || data.user.name}`);
      navigate(`/${data.role}`, { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* left info panel */}
      <div className="relative hidden overflow-hidden bg-navy-900 text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-blue-500/25 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        />
        <div className="relative flex items-center gap-3">
          <div className="rounded-xl bg-brand-600 p-2">
            <GraduationCap size={26} />
          </div>
          <span className="text-xl font-extrabold">University Management System</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">One place for every <span className="text-brand-400">academic record.</span></h1>
          <p className="mt-4 text-slate-300">
            Students, faculty and the administration office work on the same data — profiles, subjects, timetables, marks,
            notices and study material.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-4 border-t border-white/15 pt-6 text-sm text-slate-300">
          <div>
            <p className="text-lg font-semibold text-white">Admin</p>
            <p>Manage people & academics</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-white">Faculty</p>
            <p>Marks, timetable, material</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-white">Student</p>
            <p>Results, notices, resources</p>
          </div>
        </div>
      </div>

      {/* form */}
      <div className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="rounded-xl bg-brand-600 p-1.5 text-white">
              <GraduationCap size={20} />
            </div>
            <span className="text-lg font-extrabold">UMS Portal</span>
          </div>

          <Link to="/" className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-600">
            <ArrowLeft size={16} /> Back to home
          </Link>
          <h2 className="text-3xl font-extrabold tracking-tight">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">Choose your role and use the credentials issued by the university.</p>

          <div className="mt-6 grid grid-cols-3 rounded-xl bg-slate-100 p-1 text-sm">
            {ROLES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRole(r.key)}
                className={`rounded-lg py-2 font-semibold transition ${
                  role === r.key ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-ink"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">{active.idLabel}</label>
              <input
                className="input"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder={active.placeholder}
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPwd((s) => !s)}
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button className="btn-primary w-full py-3" disabled={busy}>
              {busy ? "Signing in..." : `Sign in as ${active.label}`}
            </button>
          </form>

          <p className="mt-6 text-xs leading-relaxed text-slate-500">
            Forgot your password? Contact the administration office to get it reset. New accounts are created by the admin;
            your first password is your enrollment / employee ID in lowercase.
          </p>
        </div>
      </div>
    </div>
  );
}

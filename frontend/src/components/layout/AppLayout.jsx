import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Bell, GraduationCap, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { findNavItem, navigation, roleLabel } from "./navigation";
import Avatar from "../ui/Avatar";
import { fullName } from "../../utils/format";

function Sidebar({ role, user, onNavigate, onLogout }) {
  return (
    <div className="flex h-full flex-col bg-navy-900 text-slate-300">
      <div className="flex h-[72px] items-center gap-3 px-6">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/40">
          <GraduationCap size={22} />
        </div>
        <div className="leading-tight">
          <p className="text-[17px] font-extrabold tracking-tight text-white">UMS Portal</p>
          <p className="text-[11px] font-medium text-slate-400">{roleLabel[role]} Panel</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-4 pt-2">
        {navigation[role].map((group) => (
          <div key={group.section} className="mb-5">
            <p className="mb-2 px-3 text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500">{group.section}</p>
            {group.items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `group relative mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute -left-4 top-2 h-7 w-1 rounded-r-full bg-brand-500" />}
                    <Icon size={18} strokeWidth={2} className={isActive ? "text-brand-400" : ""} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="m-4 flex items-center gap-3 rounded-2xl bg-white/5 p-3">
        <Avatar src={user?.profileImage} name={fullName(user)} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{fullName(user)}</p>
          <p className="truncate text-xs text-slate-400">{user?.enrollmentNo || user?.employeeId}</p>
        </div>
        <button onClick={onLogout} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" title="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const { user, role, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const current = findNavItem(role, location.pathname);

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-[270px] shrink-0 lg:block print:!hidden">
        <Sidebar role={role} user={user} onLogout={handleLogout} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/50" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-[270px] shadow-2xl">
            <button className="absolute right-3 top-5 z-10 rounded-lg p-1.5 text-slate-300 hover:bg-white/10" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
            <Sidebar role={role} user={user} onNavigate={() => setOpen(false)} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur-md sm:px-8 print:hidden">
          <div className="flex items-center gap-3">
            <button className="icon-btn lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div>
              <p className="text-xs font-medium text-slate-400">
                {roleLabel[role]} / {current?.label || "Dashboard"}
              </p>
              <p className="text-sm font-bold text-ink">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="icon-btn relative" title="Notices" onClick={() => navigate(`/${role}/notices`)}>
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white" />
            </button>
            <button onClick={() => navigate(`/${role}/profile`)} className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-3 hover:bg-slate-100">
              <Avatar src={user?.profileImage} name={fullName(user)} size="sm" />
              <span className="hidden text-sm font-semibold sm:inline">{fullName(user)}</span>
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-7 sm:px-8">
          <Outlet />
        </main>

        <footer className="px-8 py-4 text-center text-xs text-slate-400 print:hidden">
          © {new Date().getFullYear()} University Management System
        </footer>
      </div>
    </div>
  );
}

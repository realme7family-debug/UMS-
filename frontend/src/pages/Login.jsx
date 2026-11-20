import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../api/client";

const ROLES = {
  student: {
    key: "student",
    label: "Student",
    idLabel: "Enrollment No. or Email",
    placeholder: "e.g. 24BCS10101",
    index: 0,
  },
  faculty: {
    key: "faculty",
    label: "Faculty",
    idLabel: "Employee ID or Email",
    placeholder: "e.g. E10231",
    index: 1,
  },
  admin: {
    key: "admin",
    label: "Admin",
    idLabel: "Employee ID or Email",
    placeholder: "e.g. admin@ums.edu",
    index: 2,
  },
};

const ROTATING_WORDS = ["marks", "timetable", "notices", "results", "study material"];

export default function Login() {
  const { user, role: currentRole, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [role, setRole] = useState(() =>
    ROLES[params.get("role")] ? params.get("role") : "student"
  );
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [successUser, setSuccessUser] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [shake, setShake] = useState(false);
  const [wordIdx, setWordIdx] = useState(0);

  // Splash screen state
  const [showSplash, setShowSplash] = useState(true);
  const [splashLeaving, setSplashLeaving] = useState(false);
  const [pageExiting, setPageExiting] = useState(false);

  const inputRef = useRef(null);

  // Sync role with ?role= url param
  useEffect(() => {
    const r = params.get("role");
    if (ROLES[r]) setRole(r);
  }, [params]);

  // Session expired notice
  useEffect(() => {
    if (params.get("expired")) {
      toast.error("Your session expired, please login again.");
    }
  }, [params]);

  // Splash screen timer
  useEffect(() => {
    const timer = setTimeout(() => {
      dismissSplash();
    }, 1600);
    return () => clearTimeout(timer);
  }, []);

  const dismissSplash = () => {
    setSplashLeaving(true);
    setTimeout(() => {
      setShowSplash(false);
      if (inputRef.current) inputRef.current.focus({ preventScroll: true });
    }, 750);
  };

  // Rotating words timer
  useEffect(() => {
    const interval = setInterval(() => {
      setWordIdx((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  if (user && !successUser) {
    return <Navigate to={`/${currentRole}`} replace />;
  }

  const activeRole = ROLES[role] || ROLES.student;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy || successUser) return;

    if (!loginId.trim() || !password) {
      setErrorMsg("Fill in both fields to continue.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setErrorMsg("");
    setBusy(true);

    try {
      const data = await login({ role, loginId: loginId.trim(), password });
      const name = data.user?.firstName || data.user?.name || "User";
      setSuccessUser(name);
      setBusy(false);

      setTimeout(() => {
        setPageExiting(true);
        setTimeout(() => {
          navigate(`/${data.role}`, { replace: true });
        }, 420);
      }, 650);
    } catch (err) {
      setBusy(false);
      const msg = errorMessage(err);
      setErrorMsg(msg === "Failed to fetch" ? "Cannot reach the server. Please try again." : msg);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="login-wrapper">
      <style>{`
        .login-wrapper {
          --navy: #0b1534;
          --navy-2: #1e2a5a;
          --brand: #e11d48;
          --brand-dark: #be123c;
          --brand-soft: #fff1f2;
          --ink: #0f172a;
          --muted: #64748b;
          --line: #e2e8f0;
          --field: #f8fafc;
          --ease: cubic-bezier(.22, 1, .36, 1);
          font-family: "Plus Jakarta Sans", system-ui, "Segoe UI", sans-serif;
          color: var(--ink);
          background: var(--navy);
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* ---------------- intro splash ---------------- */
        .login-splash {
          position: fixed; inset: 0; z-index: 100;
          display: grid; place-items: center;
          background: var(--navy);
          transition: transform .8s var(--ease), border-radius .8s var(--ease);
        }
        .login-splash.leave {
          transform: translateY(-100%);
          border-radius: 0 0 50% 50% / 0 0 12% 12%;
        }
        .splash-inner { display: flex; flex-direction: column; align-items: center; text-align: center; }
        .splash-logo {
          width: 84px; height: 84px; border-radius: 24px;
          background: var(--brand); color: #fff;
          display: grid; place-items: center;
          box-shadow: 0 20px 50px -10px rgba(225, 29, 72, .6);
          animation: pop .7s var(--ease) both;
        }
        .splash-logo svg { width: 44px; height: 44px; }
        .splash-ring {
          position: absolute; width: 84px; height: 84px; border-radius: 24px;
          border: 2px solid rgba(225, 29, 72, .6);
          animation: ring 1.4s .3s ease-out both;
        }
        .splash-title { margin-top: 26px; overflow: hidden; }
        .splash-title span {
          display: block; color: #fff; font-size: 30px; font-weight: 800; letter-spacing: -.02em;
          animation: rise .7s .2s var(--ease) forwards;
        }
        .splash-sub {
          margin-top: 6px; color: #94a3b8; font-size: 14px; font-weight: 500;
          animation: fade .6s .4s ease forwards;
        }
        .splash-bar { margin-top: 26px; width: 160px; height: 3px; border-radius: 9px; background: rgba(255, 255, 255, .1); overflow: hidden; }
        .splash-bar i { display: block; height: 100%; width: 0; background: var(--brand); border-radius: 9px; animation: load 1.1s .3s var(--ease) forwards; }

        @keyframes pop { from { transform: scale(.4) rotate(-12deg); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes ring { from { transform: scale(1); opacity: 1; } to { transform: scale(2.2); opacity: 0; } }
        @keyframes rise { from { transform: translateY(110%); } to { transform: none; } }
        @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes load { to { width: 100%; } }

        /* ---------------- layout ---------------- */
        .login-page { min-height: 100vh; display: grid; grid-template-columns: 1.1fr 1fr; }
        .login-page.exit { animation: pageOut .45s ease forwards; }
        @keyframes pageOut { to { opacity: 0; transform: scale(.985); } }

        .login-side {
          position: relative; overflow: hidden;
          color: #fff; background: var(--navy);
          padding: 48px 56px; display: flex; flex-direction: column; justify-content: space-between;
        }
        .orb { position: absolute; border-radius: 50%; filter: blur(70px); pointer-events: none; }
        .orb.a { width: 420px; height: 420px; left: -140px; top: 18%; background: rgba(225, 29, 72, .35); animation: drift 14s ease-in-out infinite alternate; }
        .orb.b { width: 380px; height: 380px; right: -120px; bottom: -80px; background: rgba(59, 130, 246, .28); animation: drift 18s ease-in-out infinite alternate-reverse; }
        .dots { position: absolute; inset: 0; opacity: .07; background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 24px 24px; pointer-events: none; }
        @keyframes drift { to { transform: translate(60px, -40px) scale(1.1); } }

        .login-brand { position: relative; display: flex; align-items: center; gap: 12px; text-decoration: none; color: inherit; }
        .login-brand .mark { width: 44px; height: 44px; border-radius: 14px; background: var(--brand); display: grid; place-items: center; box-shadow: 0 10px 24px -6px rgba(225, 29, 72, .6); }
        .login-brand .mark svg { width: 24px; height: 24px; }
        .login-brand b { display: block; font-size: 18px; font-weight: 800; }
        .login-brand small { font-size: 12px; color: #94a3b8; font-weight: 500; }

        .login-hero { position: relative; max-width: 480px; }
        .login-hero h1 { font-size: clamp(34px, 3.6vw, 46px); line-height: 1.1; font-weight: 800; letter-spacing: -.025em; }
        .login-hero h1 .rot { display: inline-block; color: #fb7185; position: relative; }
        .login-hero h1 .rot span { display: inline-block; animation: wordPop .4s var(--ease) both; }
        @keyframes wordPop { from { transform: translateY(35%); opacity: 0; filter: blur(4px); } to { transform: none; opacity: 1; filter: none; } }
        .login-hero p { margin-top: 16px; color: #cbd5e1; font-size: 16px; line-height: 1.6; }

        .login-roles { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; border-top: 1px solid rgba(255, 255, 255, .14); padding-top: 22px; }
        .login-roles div { font-size: 13px; color: #94a3b8; line-height: 1.45; }
        .login-roles b { display: block; color: #fff; font-size: 15px; margin-bottom: 2px; }

        .login-main { background: #fff; display: flex; align-items: center; justify-content: center; padding: 40px 24px; }
        .login-card { width: 100%; max-width: 400px; }
        .login-card.shake { animation: cardShake .45s ease; }
        @keyframes cardShake { 20%, 60% { transform: translateX(-8px); } 40%, 80% { transform: translateX(8px); } }

        .login-card h2 { font-size: 30px; font-weight: 800; letter-spacing: -.02em; }
        .login-card .lead { margin-top: 6px; color: var(--muted); font-size: 14.5px; }

        .login-tabs { position: relative; margin-top: 26px; display: grid; grid-template-columns: repeat(3, 1fr); background: #f1f5f9; border-radius: 14px; padding: 4px; }
        .login-tabs .pill { position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc((100% - 8px) / 3); border-radius: 10px; background: #fff; box-shadow: 0 1px 3px rgba(15, 23, 42, .12); transition: transform .4s var(--ease); }
        .login-tabs button { position: relative; z-index: 1; border: 0; background: none; padding: 10px 0; border-radius: 10px; font-weight: 600; font-size: 14px; color: var(--muted); cursor: pointer; transition: color .3s; display: flex; align-items: center; justify-content: center; gap: 7px; }
        .login-tabs button svg { width: 16px; height: 16px; }
        .login-tabs button.on { color: var(--brand); font-weight: 700; }

        .login-field { margin-top: 18px; }
        .login-field label { display: block; font-size: 12.5px; font-weight: 600; color: #475569; margin-bottom: 7px; }
        .input-box { position: relative; }
        .input-box .ic { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #94a3b8; transition: color .2s; }
        .input-box input {
          width: 100%; height: 50px; border: 1.5px solid var(--line); border-radius: 14px; background: var(--field);
          padding: 0 46px 0 44px; font-size: 15px; outline: none; transition: border-color .2s, box-shadow .2s, background .2s;
        }
        .input-box input::placeholder { color: #94a3b8; }
        .input-box input:focus { border-color: #fb7185; background: #fff; box-shadow: 0 0 0 4px var(--brand-soft); }
        .input-box:focus-within .ic { color: var(--brand); }
        .eye-btn { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; border: 0; background: none; border-radius: 10px; display: grid; place-items: center; color: #94a3b8; cursor: pointer; }
        .eye-btn:hover { background: #f1f5f9; color: var(--ink); }
        .eye-btn svg { width: 18px; height: 18px; }

        .login-error {
          display: flex; align-items: center; gap: 10px; margin-top: 16px; padding: 11px 14px; border-radius: 12px;
          background: #fef2f2; color: #b91c1c; font-size: 13.5px; font-weight: 500;
          animation: errUp .3s var(--ease);
        }
        @keyframes errUp { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        .login-error svg { width: 18px; height: 18px; flex-shrink: 0; }

        .login-submit {
          position: relative; overflow: hidden; margin-top: 22px; width: 100%; height: 52px; border: 0; border-radius: 14px;
          background: var(--brand); color: #fff; font-weight: 700; font-size: 15px; cursor: pointer;
          box-shadow: 0 10px 24px -8px rgba(225, 29, 72, .6); transition: background .2s, transform .15s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .login-submit:hover:not(:disabled) { background: var(--brand-dark); }
        .login-submit:active:not(:disabled) { transform: scale(.985); }
        .login-submit:disabled { opacity: 0.85; cursor: default; }
        .login-submit svg { width: 18px; height: 18px; transition: transform .25s; }
        .login-submit:hover:not(:disabled) svg { transform: translateX(3px); }
        .login-submit::after {
          content: ""; position: absolute; top: 0; left: -60%; width: 40%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .25), transparent); transform: skewX(-20deg);
        }
        .login-submit:hover::after { animation: btnShine .8s ease; }
        @keyframes btnShine { to { left: 130%; } }
        .login-spin { width: 20px; height: 20px; border-radius: 50%; border: 2.5px solid rgba(255, 255, 255, .35); border-top-color: #fff; animation: btnRot .7s linear infinite; }
        @keyframes btnRot { to { transform: rotate(360deg); } }
        .login-submit.done { background: #059669; box-shadow: 0 10px 24px -8px rgba(5, 150, 105, .6); }

        .login-foot { margin-top: 22px; font-size: 12.5px; color: var(--muted); line-height: 1.6; }
        .login-copy { margin-top: 30px; font-size: 12px; color: #94a3b8; }
        .back-link { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 18px; text-decoration: none; transition: color .2s; }
        .back-link:hover { color: var(--brand); }

        @media (max-width: 900px) {
          .login-page { grid-template-columns: 1fr; }
          .login-side { padding: 28px 24px 30px; min-height: auto; gap: 26px; }
          .login-hero h1 { font-size: 30px; }
          .login-hero p, .login-roles { display: none; }
          .login-main { border-radius: 26px 26px 0 0; margin-top: -18px; position: relative; padding: 34px 22px 40px; align-items: flex-start; }
        }
      `}</style>

      {/* intro splash */}
      {showSplash && (
        <div
          className={`login-splash ${splashLeaving ? "leave" : ""}`}
          onClick={dismissSplash}
          role="button"
          tabIndex={0}
        >
          <div className="splash-inner">
            <div style={{ position: "relative", display: "grid", placeItems: "center" }}>
              <div className="splash-ring"></div>
              <div className="splash-logo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z" />
                  <path d="M22 10v6M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
                </svg>
              </div>
            </div>
            <div className="splash-title">
              <span>UMS Portal</span>
            </div>
            <div className="splash-sub">University Management System</div>
            <div className="splash-bar">
              <i></i>
            </div>
          </div>
        </div>
      )}

      {/* page layout */}
      <div className={`login-page ${pageExiting ? "exit" : ""}`}>
        {/* left side */}
        <aside className="login-side">
          <div className="orb a"></div>
          <div className="orb b"></div>
          <div className="dots"></div>

          <Link to="/" className="login-brand">
            <div className="mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z" />
                <path d="M22 10v6M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
              </svg>
            </div>
            <div>
              <b>UMS Portal</b>
              <small>University Management System</small>
            </div>
          </Link>

          <div className="login-hero">
            <h1>
              Your <span className="rot"><span key={wordIdx}>{ROTATING_WORDS[wordIdx]}</span></span>
              <br />
              one login away.
            </h1>
            <p>
              Students, faculty and the administration office work on the same records — profiles, subjects, timetables,
              marks, notices and study material.
            </p>
          </div>

          <div className="login-roles">
            <div>
              <b>Admin</b>Manage people &amp; academics
            </div>
            <div>
              <b>Faculty</b>Marks, timetable, material
            </div>
            <div>
              <b>Student</b>Results, notices, resources
            </div>
          </div>
        </aside>

        {/* right side form */}
        <main className="login-main">
          <form className={`login-card ${shake ? "shake" : ""}`} onSubmit={handleSubmit} noValidate>
            <div>
              <h2>Sign in</h2>
              <p className="lead">Choose your role and use the credentials issued by the university.</p>
            </div>

            {/* role switcher tabs */}
            <div className="login-tabs" role="tablist">
              <span
                className="pill"
                style={{ transform: `translateX(${activeRole.index * 100}%)` }}
              ></span>
              {Object.values(ROLES).map((r) => (
                <button
                  key={r.key}
                  type="button"
                  role="tab"
                  onClick={() => {
                    setRole(r.key);
                    setErrorMsg("");
                  }}
                  className={role === r.key ? "on" : ""}
                >
                  {r.key === "student" && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z" />
                      <path d="M22 10v6M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
                    </svg>
                  )}
                  {r.key === "faculty" && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="12" cy="10" r="3" />
                      <path d="M7 21v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
                    </svg>
                  )}
                  {r.key === "admin" && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                    </svg>
                  )}
                  {r.label}
                </button>
              ))}
            </div>

            {/* login ID field */}
            <div className="login-field">
              <label htmlFor="loginId">{activeRole.idLabel}</label>
              <div className="input-box">
                <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="5" />
                  <path d="M20 21a8 8 0 0 0-16 0" />
                </svg>
                <input
                  ref={inputRef}
                  id="loginId"
                  name="loginId"
                  autoComplete="username"
                  placeholder={activeRole.placeholder}
                  value={loginId}
                  onChange={(e) => {
                    setLoginId(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                />
              </div>
            </div>

            {/* password field */}
            <div className="login-field" style={{ marginTop: 14 }}>
              <label htmlFor="password">Password</label>
              <div className="input-box">
                <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="password"
                  name="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPwd((s) => !s)}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* error alert */}
            {errorMsg && (
              <div className="login-error" role="alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* submit button */}
            <button
              className={`login-submit ${successUser ? "done" : ""}`}
              type="submit"
              disabled={busy}
            >
              {busy ? (
                <>
                  <span className="login-spin"></span>
                  <span>Signing in...</span>
                </>
              ) : successUser ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Welcome, {successUser}</span>
                </>
              ) : (
                <>
                  <span>Sign in as {activeRole.label}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>

            <p className="login-foot">
              Forgot your password? Contact the administration office to get it reset. Your first password is your enrollment
              / employee ID in lowercase.
            </p>
            <p className="login-copy">
              © {new Date().getFullYear()} University Management System
            </p>
          </form>
        </main>
      </div>
    </div>
  );
}

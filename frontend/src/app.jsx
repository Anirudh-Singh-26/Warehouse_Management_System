import React, { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpRight,
  BadgeIndianRupee,
  Boxes,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  Command,
  FileBarChart2,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Truck,
  Users,
  X,
  RefreshCw,
  CircleHelp,
  Download,
  KeyRound,
  UserRound,
} from "./icons.js";
import { api } from "./lib/api.js";
import AppLayout from "./layouts/AppLayout.jsx";
import {
  navigation as nav,
  pageTitles as titles,
} from "./config/navigation.js";
import Dashboard from "./pages/Dashboard.jsx";
import AuditLogDetailsPage from "./pages/AuditLogDetailsPage.jsx";
import ResourceDetailsPage from "./pages/ResourceDetailsPage.jsx";
import ResourcePage from "./pages/ResourcePage.jsx";
import Profile from "./pages/Profile.jsx";
import UsersManagement from "./pages/UsersManagement.jsx";
import Reports from "./pages/Reports.jsx";
import WorkerPortal from "./pages/WorkerPortal.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import "./styles/index.css";
import "./styles.css";
import "./styles/record-details.css";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null),
    [authChecking, setAuthChecking] = useState(true),
    [sidebarOpen, setSidebarOpen] = useState(false),
    [search, setSearch] = useState(""),
    [refreshKey, setRefreshKey] = useState(0),
    [toast, setToast] = useState("");
  const [loginEmail, setLoginEmail] = useState(""),
    [loginPassword, setLoginPassword] = useState(""),
    [loginBusy, setLoginBusy] = useState(false),
    [loginError, setLoginError] = useState("");

  const routeSegment =
    location.pathname.split("/").filter(Boolean)[0] || "dashboard";
  const knownPages = nav.flatMap((group) => group.items.map((item) => item.id));
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const page = routeSegment === "login"
    ? "dashboard"
    : routeSegment === "records" && pathSegments[1]
      ? pathSegments[1]
      : routeSegment;
  const setPage = (nextPage) => {
    setSidebarOpen(false);
    setSearch("");
    navigate(`/${nextPage}`);
  };

  useEffect(() => {
    api("/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setAuthChecking(false));
  }, []);

  useEffect(() => {
    console.log("[App] URL changed", {
      pathname: location.pathname,
      routeSegment,
      page,
      userRole: user?.role,
      authChecking,
    });
  }, [location.pathname, routeSegment, page, user?.role, authChecking]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  async function login(e, demoEmail = null) {
    e?.preventDefault();

    setLoginBusy(true);
    setLoginError("");

    const email = demoEmail || loginEmail;
    const password = demoEmail
      ? import.meta.env.VITE_DEMO_LOGIN_PASSWORD
      : loginPassword;

    if (demoEmail && !password) {
      setLoginError(
        "Demo password is missing. Configure VITE_DEMO_LOGIN_PASSWORD in frontend/.env",
      );
      setLoginBusy(false);
      return;
    }

    try {
      const d = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      setUser(d.user);
      const requested = location.pathname.split("/").filter(Boolean)[0];
      const requestedItem = nav
        .flatMap((group) => group.items)
        .find((item) => item.id === requested);
      const canOpenRequested =
        requestedItem?.roles?.includes(d.user.role) ||
        (requested === "dashboard" && d.user.role === "WORKER");
      if (!requested || requested === "login" || !canOpenRequested) {
        navigate("/dashboard", { replace: true });
      }
      setToast(`Signed in as ${d.user.name || d.user.role}.`);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginBusy(false);
    }
  }
  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {}
    setUser(null);
    navigate("/login", { replace: true });
  }

  function renderPage(routePage) {
    
if (user.role === "WORKER" && routePage === "dashboard") {
  return <Navigate to="/worker-attendance" replace />;
}

if (user.role === "WORKER" && routePage.startsWith("worker-")) {
  return (
    <WorkerPortal
      user={user}
      notify={setToast}
      refreshKey={refreshKey}
      activeSection={routePage.replace("worker-", "")}
    />
  );
}


    if (routePage === "dashboard") {
      return (
        <Dashboard onNavigate={setPage} user={user} refreshKey={refreshKey} />
      );
    }

    if (routePage === "reports") {
      return <Reports key={refreshKey} />;
    }

    if (routePage === "users" && isAdmin) {
      return <UsersManagement key={refreshKey} notify={setToast} />;
    }

    if (routePage === "profile") {
      return <Profile key={refreshKey} user={user} notify={setToast} />;
    }

    return (
      <ResourcePage
        key={`${routePage}-${refreshKey}`}
        page={routePage}
        search={search}
        setSearch={setSearch}
        notify={setToast}
        user={user}
      />
    );
  }

  if (authChecking)
    return (
      <div className="loading-screen">
        <div className="brand-mark">
          <Boxes size={23} />
        </div>
        <p>Opening warehouse workspace…</p>
      </div>
    );
  if (!user)
    return (
      <div className="login-screen">
        <div className="login-art">
          <div className="art-grid" />
          <div className="login-brand">
            <div className="brand-mark">
              <Boxes size={23} />
            </div>
            <span>
              FIXL<span className="brand-light"> / WAREHOUSE</span>
            </span>
          </div>
          <div className="art-copy">
            <span className="eyebrow">OPERATIONS CONTROL CENTER</span>
            <h1>
              One warehouse.
              <br />
              Total visibility.
            </h1>
            <p>
              Inventory, dispatch, workforce and reporting in one clear
              workspace.
            </p>
            <div className="art-stats">
              <div>
                <strong>01</strong>
                <span>Warehouse</span>
              </div>
              <div>
                <strong>360°</strong>
                <span>Operations view</span>
              </div>
              <div>
                <strong>Live</strong>
                <span>Stock visibility</span>
              </div>
            </div>
          </div>
          <div className="art-footer">
            FIXL SOLUTIONS <span>•</span> WAREHOUSE OPERATIONS
          </div>
        </div>
        <div className="login-panel">
          <div className="login-form-wrap">
            <div className="mobile-brand">
              <div className="brand-mark">
                <Boxes size={21} />
              </div>
              <b>FIXL / WAREHOUSE</b>
            </div>
            <span className="eyebrow">WELCOME BACK</span>
            <h2>Sign in to continue</h2>
            <p className="muted">Use your warehouse account credentials.</p>
            <form onSubmit={login} className="login-form">
              <label>
                Email address
                <input
                  autoComplete="username"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </label>
              <label>
                Password
                <input
                  autoComplete="current-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </label>
              {loginError && <div className="form-error">{loginError}</div>}
              <button className="primary-btn full-btn" disabled={loginBusy}>
                {loginBusy ? "Signing in…" : "Sign in securely"}{" "}
                <ArrowUpRight size={17} />
              </button>
            </form>
            {import.meta.env.DEV && (
              <div className="demo-login">
                <p className="muted">Development quick login</p>

                <div className="demo-login-grid">
                  {[
                    ["Admin", "demo.admin@fixl.test"],
                    ["Inventory Manager", "demo.inventory@fixl.test"],
                    ["Receiving Staff", "demo.receiving@fixl.test"],
                    ["Dispatch Staff", "demo.dispatch@fixl.test"],
                    ["Transport Coordinator", "demo.transport@fixl.test"],
                    ["HR Manager", "demo.hr@fixl.test"],
                    ["Finance Viewer", "demo.finance@fixl.test"],
                    ["Worker", "demo.worker@fixl.test"],
                  ].map(([label, email]) => (
                    <button
                      key={email}
                      type="button"
                      className="secondary-btn"
                      disabled={loginBusy}
                      onClick={() => login(null, email)}
                    >
                      {loginBusy ? "Signing in…" : `Login as ${label}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="secure-note">
              <ShieldCheck size={16} /> Protected by your company access
              permissions
            </div>
          </div>
          <div className="login-bottom">
            Need access? Contact your system administrator.
          </div>
        </div>
      </div>
    );
  const current =
    nav.flatMap((g) => g.items).find((i) => i.id === page) || nav[0].items[0];
  const isAdmin = user.role === "ADMIN";

  
return (
  <ProtectedRoute user={user} authChecking={authChecking}>
    <AppLayout
      user={user}
      page={page}
      current={current}
      isAdmin={isAdmin}
      nav={nav}
      titles={titles}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      setPage={setPage}
      setSearch={setSearch}
      logout={logout}
      setRefreshKey={setRefreshKey}
      setToast={setToast}
      toast={toast}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/login" element={<Navigate to="/dashboard" replace />} />

        <Route
          path="/dashboard"
          element={
            user.role === "WORKER" ? (
              <Navigate to="/worker-attendance" replace />
            ) : (
              <ProtectedRoute
                user={user}
                authChecking={authChecking}
                allowedRoles={
                  nav
                    .flatMap((group) => group.items)
                    .find((item) => item.id === "dashboard")?.roles
                }
              >
                {renderPage("dashboard")}
              </ProtectedRoute>
            )
          }
        />

        {nav.flatMap((group) =>
          group.items
            .filter((item) => item.id !== "dashboard")
            .map((item) => (
              <Route
                key={item.id}
                path={`/${item.id}`}
                element={
                  <ProtectedRoute
                    user={user}
                    authChecking={authChecking}
                    allowedRoles={item.roles}
                  >
                    {renderPage(item.id)}
                  </ProtectedRoute>
                }
              />
            )),
        )}

        {nav.flatMap((group) =>
          group.items
            .filter((item) => !["dashboard", "reports", "profile", "worker-attendance", "worker-tasks", "worker-account", "worker-history"].includes(item.id))
            .map((item) => (
              <Route
                key={`record-${item.id}`}
                path={`/records/${item.id}/:recordId`}
                element={
                  <ProtectedRoute
                    user={user}
                    authChecking={authChecking}
                    allowedRoles={item.roles}
                  >
                    <ResourceDetailsPage resource={item.id} notify={setToast} />
                  </ProtectedRoute>
                }
              />
            )),
        )}

        <Route
          path="/audit-logs/:recordId"
          element={
            <ProtectedRoute
              user={user}
              authChecking={authChecking}
              allowedRoles={["ADMIN"]}
            >
              <AuditLogDetailsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  </ProtectedRoute>
);

}

export default App;

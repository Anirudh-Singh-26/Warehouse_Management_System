import {
  Boxes,
  ChevronDown,
  CircleHelp,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  ShieldCheck,
  X,
  CheckCircle2,
} from "../icons.js";
import { singular } from "../lib/labels.js";
import AssistantChat from "../components/AssistantChat.jsx";
import { useLocation } from "react-router-dom";

export default function AppLayout({
  user,
  page,
  current,
  isAdmin,
  nav,
  titles,
  sidebarOpen,
  setSidebarOpen,
  setPage,
  setSearch,
  logout,
  setRefreshKey,
  toast,
  children,
}) {
  const { pathname } = useLocation();
  const isRecordDetailsRoute = pathname.startsWith("/records/") || pathname.startsWith("/audit-logs/");

  const createRoles = {
    products: ["ADMIN", "INVENTORY_MANAGER"],
    suppliers: ["ADMIN", "INVENTORY_MANAGER", "RECEIVING_STAFF"],
    shipments: ["ADMIN", "DISPATCH_STAFF", "TRANSPORT_COORDINATOR"],
    "transport-providers": ["ADMIN", "TRANSPORT_COORDINATOR"],
    vehicles: ["ADMIN", "TRANSPORT_COORDINATOR"],
    drivers: ["ADMIN", "TRANSPORT_COORDINATOR"],
    workers: ["ADMIN", "HR_MANAGER"],
    "staffing-agencies": ["ADMIN", "HR_MANAGER"],
    attendance: ["ADMIN", "HR_MANAGER"],
    tasks: ["ADMIN", "HR_MANAGER"],
    "bonus-records": ["ADMIN", "HR_MANAGER"],
  };

  const canCreate = createRoles[page]?.includes(user.role);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">
            <Boxes size={22} />
          </div>
          <div>
            <b>
              FIXL<span> / WAREHOUSE</span>
            </b>
            <small>OPERATIONS PLATFORM</small>
          </div>
          <button
            className="icon-btn mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="workspace-label">
          <span className="live-dot" /> SINGLE WAREHOUSE{" "}
          <ChevronDown size={14} />
        </div>

        <nav>
          {nav
            .map((group) => ({
              ...group,
              items: group.items.filter(
                (item) =>
                  (!item.adminOnly || isAdmin) &&
                  (!item.roles || item.roles.includes(user.role)),
              ),
            }))
            .filter((group) => group.items.length > 0)
            .map((group) => (
              <div className="nav-group" key={group.group}>
                <div className="nav-group-title">{group.group}</div>

                {group.items.map((item) => (
                  <button
                    key={item.id}
                    className={`nav-item ${page === item.id ? "active" : ""}`}
                    onClick={() => {
                      setPage(item.id);
                      setSidebarOpen(false);
                      setSearch("");
                    }}
                  >
                    <item.icon size={17} />
                    <span>{item.label}</span>

                    {item.id === "movements" && (
                      <span className="nav-tag">LOG</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <CircleHelp size={17} />
            </div>
            <div>
              <b>Need a hand?</b>
              <span>Contact your admin for access.</span>
            </div>
          </div>

          <div className="user-card">
            <div className="avatar">
              {(user.name || user.email || "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="user-meta">
              <b>{user.name || "Warehouse user"}</b>
              <span>{String(user.role || "USER").replaceAll("_", " ")}</span>
            </div>
            <button className="icon-btn" title="Sign out" onClick={logout}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button
            className="icon-btn menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="breadcrumb">
            Workspace <span>/</span> <b>{current.label}</b>
          </div>

          <div className="top-actions">
            <div className="system-status">
              <span className="live-dot" /> API workspace
            </div>
            <div className="top-avatar">
              {(user.name || "U").slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="content">
          {!isRecordDetailsRoute && (
            <div className="page-heading">
              <div>
                <div className="eyebrow">
                  FIXL SOLUTIONS <span className="eyebrow-sep">/</span>{" "}
                  OPERATIONS
                </div>

                <h1>{titles[page] || current.label}</h1>

                <p>
                  {user.role === "WORKER" && page.startsWith("worker-")
                    ? "Manage your attendance, assigned tasks and personal records."
                    : page === "dashboard"
                      ? "A live snapshot of warehouse activity and operational health."
                      : page === "reports"
                        ? "Review stock value, movement trends and operating cost estimates."
                        : `Manage and review ${current.label.toLowerCase()} records.`}
                </p>
              </div>

              {page !== "dashboard" &&
                page !== "reports" &&
                page !== "inventory" &&
                page !== "movements" &&
                page !== "profile" &&
                canCreate && (
                  <button
                    className="primary-btn"
                    onClick={() =>
                      window.dispatchEvent(new CustomEvent("open-create"))
                    }
                  >
                    <Plus size={17} /> Add {singular(page)}
                  </button>
                )}
            </div>
          )}

          {children}
        </main>

        <footer className="app-footer app-layout-footer">
          <span>
            FIXL WAREHOUSE <i>•</i> OPERATIONS PLATFORM
          </span>
          <span>
            Secure workspace <ShieldCheck size={13} />
          </span>
        </footer>
      </div>

      <AssistantChat />

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}

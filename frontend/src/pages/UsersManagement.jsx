import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "../icons.js";
import { api, unwrapList, dateText } from "../lib/api.js";
function UsersManagement({ notify }) {
  const navigate = useNavigate();
  const usersTableRef = useRef(null);
  const [showMoreColumns, setShowMoreColumns] = useState(false);
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [role, setRole] = useState(""),
    [showCreate, setShowCreate] = useState(false),
    [saving, setSaving] = useState(false),
    [form, setForm] = useState({
      name: "",
      email: "",
      password: "",
      role: "INVENTORY_MANAGER",
      status: "ACTIVE",
      employeeCode: "",
      phone: "",
      department: "",
      jobTitle: "",
      joinedAt: "",
    });
  const roles = [
    "ADMIN",
    "INVENTORY_MANAGER",
    "RECEIVING_STAFF",
    "DISPATCH_STAFF",
    "HR_MANAGER",
    "FINANCE_VIEWER",
    "TRANSPORT_COORDINATOR",
    "WORKER",
  ];
  
function toggleUsersTableColumns() {
  const table = usersTableRef.current;
  if (!table) return;

  const maxScrollLeft = table.scrollWidth - table.clientWidth;
  const isAtStart = table.scrollLeft <= 4;
  const shouldShowMore = isAtStart;

  table.scrollTo({
    left: shouldShowMore ? maxScrollLeft : 0,
    behavior: "smooth",
  });

  setShowMoreColumns(shouldShowMore);
}


  async function load() {
    setLoading(true);
    setError("");
    try {
      const q = new URLSearchParams();
      if (search.trim()) q.set("search", search.trim());
      if (status) q.set("status", status);
      if (role) q.set("role", role);
      q.set("limit", "100");
      const d = await api(`/users${q.size ? "?" + q : ""}`);
      setItems(unwrapList(d));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [search, status, role]);
  async function create(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form };
      if (payload.joinedAt)
        payload.joinedAt = new Date(payload.joinedAt).toISOString();
      else delete payload.joinedAt;
      await api("/users", { method: "POST", body: JSON.stringify(payload) });
      setShowCreate(false);
      setForm({
        name: "",
        email: "",
        password: "",
        role: "INVENTORY_MANAGER",
        status: "ACTIVE",
        employeeCode: "",
        phone: "",
        department: "",
        jobTitle: "",
        joinedAt: "",
      });
      notify("User account created");
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  async function toggle(user) {
    const next = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (
      !window.confirm(
        `${next === "INACTIVE" ? "Deactivate" : "Activate"} ${user.name}'s account?`,
      )
    )
      return;
    setError("");
    try {
      await api(`/users/${user.id || user._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      notify(`Account ${next.toLowerCase()}`);
      load();
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <>
      <div className="toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
          />
        </div>
        <div className="toolbar-right">
          <select
            className="filter-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">All roles</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button className="secondary-btn" onClick={load}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button
            className="primary-btn"
            onClick={() => {
              setError("");
              setShowCreate(true);
            }}
          >
            <Plus size={16} /> Create user
          </button>
        </div>
      </div>
      {error && (
        <div className="notice warning">
          <AlertTriangle size={17} />
          <div>
            <b>User management action failed</b>
            <span>{error}</span>
          </div>
          <button className="icon-btn" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}
      <div className="panel table-panel">
        <div className="table-panel-head">
          <div>
            <h3>System accounts</h3>
            <p>
              {loading
                ? "Loading accounts…"
                : `${items.length} account${items.length === 1 ? "" : "s"} shown`}
            </p>
          </div>
          <div className="users-table-head-actions">
            <span className="section-chip">
              <ShieldCheck size={14} /> ADMIN ONLY
            </span>
            <button
              type="button"
              className="secondary-btn users-more-columns-btn"
              onClick={toggleUsersTableColumns}
              aria-label={
                showMoreColumns
                  ? "Scroll back to first columns"
                  : "Scroll to more columns"
              }
              title={
                showMoreColumns ? "Show first columns" : "Show more columns"
              }
            >
              <ArrowLeftRight size={15} />
              {showMoreColumns ? "First columns" : "More columns"}
            </button>
          </div>
        </div>
        {loading ? (
          <div className="table-empty">
            <div className="spinner" />
            <b>Loading accounts</b>
          </div>
        ) : items.length === 0 ? (
          <div className="table-empty">
            <div className="empty-icon">
              <Users size={23} />
            </div>
            <b>No accounts found</b>
            <span>
              Create a separate login for each employee who needs access.
            </span>
            <button className="primary-btn" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Create first user
            </button>
          </div>
        ) : (
          <div
            className="table-scroll users-table-scroll"
            ref={usersTableRef}
          >
            <table>
              <thead>
                <tr>
                  {[
                    "Name",
                    "Employee code",
                    "Email",
                    "Department",
                    "Job title",
                    "Role",
                    "Status",
                    "Last login",
                    "Created",
                    "Actions",
                  ].map((k) => (
                    <th key={k}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id || u._id}>
                    <td>
                      <b>{u.name}</b>
                    </td>
                    <td>{u.employeeCode || "—"}</td>
                    <td>{u.email}</td>
                    <td>{u.department || "—"}</td>
                    <td>{u.jobTitle || "—"}</td>
                    <td>{String(u.role).replaceAll("_", " ")}</td>
                    <td>
                      <span
                        className={`status-pill ${u.status === "ACTIVE" ? "good" : "bad"}`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td>{dateText(u.lastLoginAt)}</td>
                    <td>{dateText(u.createdAt)}</td>
                    <td>
                      <div className="users-table-actions">
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() =>
                            navigate(
                              `/records/users/${encodeURIComponent(u.id || u._id)}`,
                            )
                          }
                        >
                          View
                        </button>
                        <button
                          className="secondary-btn"
                          onClick={() => toggle(u)}
                        >
                          {u.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-foot">
          <span>
            <ShieldCheck size={13} /> User changes are audited
          </span>
          <span>Passwords are stored as hashes</span>
        </div>
      </div>
      <div className="notice info">
        <CircleHelp size={17} />
        <div>
          <b>Least-privilege access</b>
          <span>
            Give each person only the role they need. Do not share the
            administrator login. Deactivating an account blocks future
            authenticated requests.
          </span>
        </div>
      </div>
      {showCreate && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowCreate(false);
          }}
        >
          <div className="modal">
            <div className="modal-head">
              <div>
                <span className="eyebrow">ADMINISTRATION</span>
                <h2>Create user account</h2>
                <p>Make a separate sign-in for a team member.</p>
              </div>
              <button className="icon-btn" onClick={() => setShowCreate(false)}>
                <X size={19} />
              </button>
            </div>
            <form onSubmit={create}>
              <div className="form-grid">
                <label>
                  Full name
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    minLength={2}
                    maxLength={120}
                    required
                  />
                </label>
                <label>
                  Email address
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                  />
                </label>
                <label className="wide-field">
                  Temporary password
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    minLength={10}
                    autoComplete="new-password"
                    required
                  />
                  <small>
                    At least 10 characters. Share it securely and have the user
                    change it when a password-change flow is available.
                  </small>
                </label>
                <label>
                  Employee code
                  <input
                    value={form.employeeCode}
                    onChange={(e) =>
                      setForm({ ...form, employeeCode: e.target.value })
                    }
                    maxLength={50}
                    placeholder="e.g. EMP-001"
                  />
                </label>
                <label>
                  Phone
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    maxLength={40}
                    autoComplete="tel"
                  />
                </label>
                <label>
                  Department
                  <input
                    value={form.department}
                    onChange={(e) =>
                      setForm({ ...form, department: e.target.value })
                    }
                    maxLength={100}
                    placeholder="e.g. Warehouse"
                  />
                </label>
                <label>
                  Job title
                  <input
                    value={form.jobTitle}
                    onChange={(e) =>
                      setForm({ ...form, jobTitle: e.target.value })
                    }
                    maxLength={120}
                    placeholder="e.g. Inventory Manager"
                  />
                </label>
                <label>
                  Joining date
                  <input
                    type="date"
                    value={form.joinedAt}
                    onChange={(e) =>
                      setForm({ ...form, joinedAt: e.target.value })
                    }
                  />
                </label>
                <label>
                  Role
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Status
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </label>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? "Creating…" : "Create account"}{" "}
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </form>
            <p className="modal-hint">
              <ShieldCheck size={14} /> Only administrators can create or change
              user accounts. Passwords are hashed on the server.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
export default UsersManagement;

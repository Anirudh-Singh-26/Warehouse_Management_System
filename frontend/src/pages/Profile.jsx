import React, { useState } from "react";
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
import { api } from "../lib/api.js";
function Profile({ user, notify }) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setError("");
    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (form.newPassword.length < 10) {
      setError("New password must be at least 10 characters.");
      return;
    }
    setSaving(true);
    try {
      await api("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      notify("Password changed successfully");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="profile-grid">
      <div className="panel profile-card">
        <div className="profile-avatar">
          <UserRound size={26} />
        </div>
        <span className="eyebrow">SIGNED-IN ACCOUNT</span>
        <h2>{user.name || "Warehouse user"}</h2>
        <p>{user.email}</p>
        <div className="profile-detail">
          <span>Role</span>
          <b>{String(user.role || "USER").replaceAll("_", " ")}</b>
        </div>
        <div className="profile-detail">
          <span>Account status</span>
          <b className="status-pill good">ACTIVE</b>
        </div>
        <div className="notice info">
          <ShieldCheck size={16} />
          <div>
            <b>Account security</b>
            <span>
              Never share your password. Admins should create individual
              accounts for every team member.
            </span>
          </div>
        </div>
      </div>
      <div className="panel profile-card">
        <div className="panel-head">
          <div>
            <h3>
              <KeyRound size={17} /> Change password
            </h3>
            <p>Use your current password to set a new one.</p>
          </div>
        </div>
        <form onSubmit={submit} className="profile-password-form">
          <label>
            Current password
            <input
              type="password"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={(e) =>
                setForm({ ...form, currentPassword: e.target.value })
              }
              required
            />
          </label>
          <label>
            New password
            <input
              type="password"
              autoComplete="new-password"
              minLength={10}
              value={form.newPassword}
              onChange={(e) =>
                setForm({ ...form, newPassword: e.target.value })
              }
              required
            />
            <small>Use at least 10 characters.</small>
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              autoComplete="new-password"
              minLength={10}
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              required
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-btn" disabled={saving}>
            {saving ? "Updating…" : "Update password"}{" "}
            <ArrowUpRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
export default Profile;

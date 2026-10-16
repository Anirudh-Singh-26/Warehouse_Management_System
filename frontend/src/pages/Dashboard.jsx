import React, { useEffect, useState } from "react";
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
import { api, money } from "../lib/api.js";
import StatCard from "../components/StatCard.jsx";
function Dashboard({ onNavigate, user, refreshKey }) {
  const [data, setData] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    api("/reports/dashboard")
      .then((result) => {
        setData(result);
        setError("");
      })
      .catch((e) => setError(e.message));
  }, [refreshKey]);
  const d = data || {};
  const counts = d.counts || d.summary || d;
  const low = counts.lowStockCount ?? d.lowStockCount ?? "—";
  const shipments = counts.shipments ?? d.shipmentsCount ?? "—";
  const stockValue =
    d.inventory?.stockCostValueEstimate ??
    d.inventoryValue ??
    d.totalInventoryValue ??
    d.stockCostValue;
  const lowStock = d.inventory?.lowStockProductCount ?? low;
  const shipmentsTotal = d.shipmentsByStatus
    ? Object.values(d.shipmentsByStatus).reduce((a, b) => a + Number(b || 0), 0)
    : shipments;
  const tasks =
    d.workforce?.openTasks ?? counts.openTasks ?? d.openTasks ?? "—";
  return (
    <>
      <div className="welcome-banner">
        <div className="welcome-copy">
          <span className="banner-label">
            <Activity size={14} /> LIVE OPERATIONS SNAPSHOT
          </span>
          <h2>Good operations start with a clear view.</h2>
          <p>
            Monitor the essentials, then jump straight into the work that needs
            attention.
          </p>
          <div className="banner-foot">
            <span>
              <span className="live-dot" /> Data from your warehouse API
            </span>
            <span className="banner-divider" /> Updated when opened
          </div>
        </div>
        <div className="banner-illustration">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="cube">
            <Boxes size={42} />
          </div>
          <div className="float-chip chip-a">
            <Package size={15} /> Inventory
          </div>
          <div className="float-chip chip-b">
            <Truck size={15} /> Dispatch
          </div>
        </div>
      </div>
      {["ADMIN", "INVENTORY_MANAGER", "FINANCE_VIEWER"].includes(user?.role) &&
        error && (
          <div className="notice warning">
            <AlertTriangle size={17} />
            <div>
              <b>Dashboard data unavailable</b>
              <span>
                {error}. Check that the backend is running and your role can
                access reports.
              </span>
            </div>
          </div>
        )}
      {["ADMIN", "INVENTORY_MANAGER", "FINANCE_VIEWER"].includes(
        user?.role,
      ) && (
        <>
          <div className="section-head">
            <div>
              <h3>Warehouse at a glance</h3>
              <p>Key figures from the reporting service</p>
            </div>
            <span className="section-chip">
              <span className="live-dot" /> API connected
            </span>
          </div>
          <div className="stats-grid">
            <StatCard
              label="Inventory value"
              value={stockValue != null ? money(stockValue) : "—"}
              sub="Estimated stock cost"
              icon={Boxes}
              tone="blue"
            />
            <StatCard
              label="Low stock items"
              value={lowStock}
              sub="Review reorder levels"
              icon={AlertTriangle}
              tone="amber"
            />
            <StatCard
              label="Shipments"
              value={shipmentsTotal}
              sub="Recorded shipments"
              icon={Truck}
              tone="violet"
            />
            <StatCard
              label="Open tasks"
              value={tasks}
              sub="Pending or in progress"
              icon={ClipboardList}
              tone="green"
            />
          </div>
        </>
      )}
      <div className="dashboard-lower">
        <div className="panel quick-panel">
          <div className="panel-head">
            <div>
              <h3>Quick actions</h3>
              <p>Go directly to a common workflow</p>
            </div>
            <Command size={18} />
          </div>

          <div className="quick-actions">
            {[
              {
                id: "products",
                label: "Product catalogue",
                description: "Add products and update pricing",
                icon: Package,
                tone: "blue",
                roles: [
                  "ADMIN",
                  "INVENTORY_MANAGER",
                  "RECEIVING_STAFF",
                  "DISPATCH_STAFF",
                ],
              },
              {
                id: "inventory",
                label: "Record stock inward",
                description: "Receive accepted or damaged goods",
                icon: ArrowDownToLine,
                tone: "green",
                roles: ["ADMIN", "INVENTORY_MANAGER", "RECEIVING_STAFF"],
              },
              {
                id: "shipments",
                label: "Manage shipments",
                description: "Track outbound dispatches",
                icon: Truck,
                tone: "violet",
                roles: ["ADMIN", "DISPATCH_STAFF", "TRANSPORT_COORDINATOR"],
              },
              {
                id: "workers",
                label: "Workforce directory",
                description: "Review staff and contractors",
                icon: Users,
                tone: "amber",
                roles: ["ADMIN", "HR_MANAGER"],
              },
            ]
              .filter((action) => action.roles.includes(user?.role))
              .map((action) => {
                const Icon = action.icon;

                return (
                  <button key={action.id} onClick={() => onNavigate(action.id)}>
                    <span className={`quick-icon ${action.tone}`}>
                      <Icon size={18} />
                    </span>
                    <span>
                      <b>{action.label}</b>
                      <small>{action.description}</small>
                    </span>
                    <ArrowUpRight size={16} />
                  </button>
                );
              })}
          </div>
        </div>
        <div className="panel health-panel">
          <div className="panel-head">
            <div>
              <h3>Workspace status</h3>
              <p>Application connectivity</p>
            </div>
            <ShieldCheck size={18} />
          </div>
          <div className="health-row">
            <span className="health-mark">
              <CheckCircle2 size={16} />
            </span>
            <div>
              <b>Frontend workspace</b>
              <small>Loaded successfully</small>
            </div>
            <span className="status-pill good">READY</span>
          </div>
          <div className="health-row">
            <span className="health-mark">
              <Activity size={16} />
            </span>
            <div>
              <b>Reporting endpoint</b>
              <small>
                {error
                  ? "Request needs attention"
                  : "Connected to reporting API"}
              </small>
            </div>
            <span className={`status-pill ${error ? "bad" : "good"}`}>
              {error ? "CHECK" : "ACTIVE"}
            </span>
          </div>
          <div className="health-note">
            <CircleHelp size={15} />
            <span>
              Figures depend on the records and permissions configured in your
              backend.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
export default Dashboard;

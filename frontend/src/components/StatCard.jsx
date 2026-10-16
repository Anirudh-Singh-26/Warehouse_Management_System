import React from "react";
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
function StatCard({ label, value, sub, icon: Icon, tone = "blue" }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={19} />
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value ?? "—"}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}
export default StatCard;

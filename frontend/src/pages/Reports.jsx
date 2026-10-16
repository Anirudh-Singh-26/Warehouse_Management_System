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
import { exportCSV } from "../lib/csv.js";
import { pretty, cellValue } from "../lib/formatters.jsx";
import StatCard from "../components/StatCard.jsx";
function Reports() {
  const [report, setReport] = useState("inventory-valuation"),
    [data, setData] = useState(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const tabs = [
    ["inventory-valuation", "Inventory valuation"],
    ["product-profitability", "Product profitability"],
    ["stock-movements", "Stock movements"],
    ["workforce-costs", "Workforce costs"],
    ["bonuses", "Bonuses"],
    ["expenses", "Operational expenses"],
  ];
  useEffect(() => {
    setLoading(true);
    setError("");
    api(`/reports/${report}`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [report]);
  const obj =
    data && typeof data === "object" && !Array.isArray(data) ? data : {};
  const arr = Array.isArray(data)
    ? data
    : report === "inventory-valuation"
      ? obj.products || []
      : report === "stock-movements"
        ? obj.recentMovements || []
        : report === "workforce-costs"
          ? obj.workers || []
          : report === "bonuses"
            ? obj.records || []
            : report === "expenses"
              ? obj.recentExpenses || []
              : Array.isArray(obj.items)
                ? obj.items
                : Array.isArray(obj.data)
                  ? obj.data
                  : [];
  const totals = obj.totals && typeof obj.totals === "object" ? obj.totals : {};
  const keys = arr.length
    ? Object.keys(arr[0])
        .filter((k) => !["_id", "__v", "createdBy", "updatedBy"].includes(k))
        .slice(0, 7)
    : [];
  return (
    <>
      <div className="report-tabs">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            className={report === id ? "selected" : ""}
            onClick={() => setReport(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {error && (
        <div className="notice warning">
          <AlertTriangle size={17} />
          <div>
            <b>Report unavailable</b>
            <span>
              {error}. Your account role may not have access to this report.
            </span>
          </div>
        </div>
      )}
      {loading ? (
        <div className="panel table-empty">
          <div className="spinner" />
          <b>Preparing report…</b>
        </div>
      ) : (
        <>
          <div className="report-summary-grid">
            {Object.entries({
              ...totals,
              ...obj.inventory,
              ...obj.workforce,
              ...obj.bonuses,
            })
              .filter(
                ([k, v]) =>
                  typeof v === "number" &&
                  /(total|count|value|cost|profit|amount|margin|approved|pending|quantity|records|workers)/i.test(
                    k,
                  ),
              )
              .slice(0, 4)
              .map(([k, v], i) => (
                <StatCard
                  key={k}
                  label={pretty(k)}
                  value={/value|cost|profit|amount/i.test(k) ? money(v) : v}
                  sub="From current report data"
                  icon={[FileBarChart2, Boxes, BadgeIndianRupee, Activity][i]}
                  tone={["blue", "green", "violet", "amber"][i]}
                />
              ))}
          </div>
          <div className="panel table-panel report-table">
            <div className="table-panel-head">
              <div>
                <h3>{tabs.find((t) => t[0] === report)?.[1]}</h3>
                <p>Management estimates based on currently recorded data</p>
              </div>
              <div className="toolbar-right">
                <button
                  className="secondary-btn"
                  onClick={() => exportCSV(arr, `${report}-report.csv`)}
                  disabled={!arr.length}
                >
                  <Download size={15} /> Export CSV
                </button>
                <span className="section-chip">
                  <FileBarChart2 size={14} /> REPORT
                </span>
              </div>
            </div>
            {arr.length && keys.length ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      {keys.map((k) => (
                        <th key={k}>{pretty(k)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {arr.map((row, i) => (
                      <tr key={row._id || i}>
                        {keys.map((k) => (
                          <td key={k}>{cellValue(row[k], k)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="report-placeholder">
                <div className="report-graphic">
                  <FileBarChart2 size={28} />
                </div>
                <h3>
                  {error
                    ? "Report could not be loaded"
                    : "Report data is ready when available"}
                </h3>
                <p>
                  {error
                    ? "Check your access and backend connection, then retry."
                    : "This panel reads directly from the selected reporting endpoint. Some endpoints return summary objects rather than tabular records."}
                </p>
                <button
                  className="secondary-btn"
                  onClick={() => setReport((r) => r)}
                >
                  <RefreshCw size={15} /> Retry report
                </button>
              </div>
            )}
            <div className="table-foot">
              <span>
                ESTIMATES ONLY <i>•</i> NOT AUDITED ACCOUNTS
              </span>
              <span>Based on current records</span>
            </div>
          </div>
          <div className="notice info">
            <CircleHelp size={17} />
            <div>
              <b>How to read these figures</b>
              <span>
                Margins and workforce costs are estimates. Results depend on the
                data recorded and the company-approved costing policy.
              </span>
            </div>
          </div>
        </>
      )}
    </>
  );
}
export default Reports;

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ShieldCheck, X } from "../icons.js";
import { api } from "../lib/api.js";
import { fields } from "../config/resources.js";
import { singular } from "../lib/labels.js";

const editableResources = new Set([
  "products", "suppliers", "transport-providers", "vehicles", "drivers", "workers",
]);
const editRoles = {
  products: ["ADMIN", "INVENTORY_MANAGER"],
  suppliers: ["ADMIN", "INVENTORY_MANAGER"],
  "transport-providers": ["ADMIN", "TRANSPORT_COORDINATOR"],
  vehicles: ["ADMIN", "TRANSPORT_COORDINATOR"],
  drivers: ["ADMIN", "TRANSPORT_COORDINATOR"],
  workers: ["ADMIN", "HR_MANAGER"],
};

const dateKeys = new Set([
  "insuranceExpiry", "permitExpiry", "fitnessExpiry", "lastServiceAt",
  "nextServiceDueAt", "licenseExpiry", "joinedAt", "contractEndAt",
]);
const wideKeys = new Set(["description", "address", "billingAddress", "notes"]);

function inputValue(record, key, type) {
  const value = record?.[key];
  if (value == null) return "";
  if (type === "datetime-local" || dateKeys.has(key)) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return type === "datetime-local"
      ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      : date.toISOString().slice(0, 10);
  }
  return String(value);
}

export function canEditResource(resource, role) {
  return editableResources.has(resource) && (editRoles[resource] || []).includes(role);
}

export default function EditRecordModal({ resource, record, onClose, onSaved, notify }) {
  const config = useMemo(() => fields[resource] || [], [resource]);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const initial = {};
    for (const [key, , type] of config) initial[key] = inputValue(record, key, type);
    setForm(initial);
    setError("");
  }, [record, config]);

  if (!record) return null;

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {};
    for (const [key, , type] of config) {
      const raw = form[key];
      if (type === "number") {
        if (raw !== "" && raw != null) payload[key] = Number(raw);
      } else if (dateKeys.has(key) || type === "datetime-local") {
        if (raw) payload[key] = new Date(raw).toISOString();
        else if (key !== "joinedAt") payload[key] = null;
      } else {
        payload[key] = raw ?? "";
      }
    }
    try {
      const id = record._id || record.id;
      if (!id) throw new Error("This record is missing its ID.");
      await api(`/${resource}/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      notify?.(`${singular(resource)} updated successfully.`);
      onSaved?.();
    } catch (err) {
      setError(err.message || "Unable to update this record.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => {
      if (e.target === e.currentTarget && !saving) onClose?.();
    }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-record-title">
        <div className="modal-head">
          <div>
            <span className="eyebrow">EDIT RECORD</span>
            <h2 id="edit-record-title">Edit {singular(resource)}</h2>
            <p>Update the permitted fields. Changes are recorded in the audit log.</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} disabled={saving} aria-label="Close edit form">
            <X size={19} />
          </button>
        </div>
        {error && <div className="notice warning" role="alert">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-grid">
            {config.map(([key, label, type, requiredOrOptions]) => (
              <label key={key} className={wideKeys.has(key) ? "wide-field" : ""}>
                {label}
                {type === "select" ? (
                  <select
                    value={form[key] ?? ""}
                    required={requiredOrOptions === true}
                    onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))}
                  >
                    {(Array.isArray(requiredOrOptions) ? requiredOrOptions : []).map((option) => (
                      <option key={option} value={option}>{option || "—"}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={["number", "email", "url", "date", "datetime-local"].includes(type) ? type : "text"}
                    min={type === "number" ? "0" : undefined}
                    max={key === "taxRatePercent" ? "100" : undefined}
                    step={type === "number" ? "any" : undefined}
                    required={requiredOrOptions === true}
                    value={form[key] ?? ""}
                    onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))}
                    placeholder={label}
                  />
                )}
              </label>
            ))}
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={saving}>
              {saving ? "Saving…" : `Save changes`} <ArrowUpRight size={16} />
            </button>
          </div>
        </form>
        <p className="modal-hint"><ShieldCheck size={14} /> The backend validates permissions and records before/after values.</p>
      </div>
    </div>
  );
}

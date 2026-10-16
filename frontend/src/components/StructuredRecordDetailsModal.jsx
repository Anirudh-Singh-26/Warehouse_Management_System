import React, { useEffect } from "react";
import { X, Eye } from "lucide-react";
import { pretty } from "../lib/formatters.jsx";

const HIDDEN_FIELDS = new Set([
  "password",
  "passwordHash",
  "token",
  "accessToken",
  "refreshToken",
  "__v",
]);

function isHidden(key) {
  return HIDDEN_FIELDS.has(key) || /password|secret|token/i.test(key);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function displayValue(value, key = "") {
  if (value === null || value === undefined || value === "") return "—";

  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (Array.isArray(value)) {
    return value.length
      ? value
          .map((item) =>
            isObject(item)
              ? Object.entries(item)
                  .filter(
                    ([k, v]) =>
                      !isHidden(k) && !k.startsWith("_") && v !== undefined,
                  )
                  .map(([k, v]) => `${pretty(k)}: ${displayValue(v, k)}`)
                  .join(" · ")
              : String(item ?? "—"),
          )
          .join("\n")
      : "—";
  }

  if (isObject(value)) return "[Details]";

  if (
    typeof value === "string" &&
    /date|createdAt|updatedAt|checkIn|checkOut|completedAt|approvedAt|occurredAt/i.test(
      key,
    ) &&
    !Number.isNaN(Date.parse(value))
  ) {
    return new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  if (
    typeof value === "string" &&
    value.includes("T") &&
    !Number.isNaN(Date.parse(value))
  ) {
    return new Date(value).toLocaleString("en-IN");
  }

  return String(value);
}

function visibleEntries(data) {
  return Object.entries(data || {}).filter(
    ([key, value]) =>
      !isHidden(key) && !key.startsWith("_") && value !== undefined,
  );
}

function Field({ name, value }) {
  return (
    <div className="structured-detail-field">
      <span className="structured-detail-label">{pretty(name)}</span>
      <div className="structured-detail-value"><FieldValue name={name} value={value} /></div>
    </div>
  );
}


function safeHttpUrl(value) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function FieldValue({ name, value }) {
  const href = safeHttpUrl(value);
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="structured-detail-link">
        Open link ↗
      </a>
    );
  }
  return <>{displayValue(value, name)}</>;
}

function TrackingTimeline({ events }) {
  if (!Array.isArray(events) || events.length === 0) return <span>—</span>;
  return (
    <div className="structured-tracking-timeline">
      {events.map((event, index) => (
        <div className="structured-tracking-event" key={`${event.status}-${event.occurredAt}-${index}`}>
          <span className="structured-tracking-dot" />
          <div>
            <b>{String(event.status || "Update").replaceAll("_", " ")}</b>
            <small>{event.occurredAt ? new Date(event.occurredAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Time not recorded"}</small>
            {event.location && <p>{event.location}</p>}
            {event.notes && <p>{event.notes}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function RecordContent({ record }) {
  const entries = visibleEntries(record);
  const scalarEntries = entries.filter(
    ([key, value]) => !isObject(value) && !Array.isArray(value) && key !== "trackingEvents",
  );
  const nestedEntries = entries.filter(
    ([key, value]) => isObject(value) || (Array.isArray(value) && key !== "trackingEvents"),
  );
  const trackingEvents = entries.find(([key]) => key === "trackingEvents")?.[1];

  return (
    <div className="structured-record-content">
      {scalarEntries.length > 0 && (
        <section className="structured-detail-section">
          <h3>Record information</h3>
          <div className="structured-detail-grid">
            {scalarEntries.map(([key, value]) => (
              <Field key={key} name={key} value={value} />
            ))}
          </div>
        </section>
      )}

      {nestedEntries.map(([key, value]) => (
        <section className="structured-detail-section" key={key}>
          <h3>{pretty(key)}</h3>
          {isObject(value) ? (
            <div className="structured-detail-grid">
              {visibleEntries(value).map(([nestedKey, nestedValue]) => (
                <div key={nestedKey}>
                  {isObject(nestedValue) ? (
                    <section className="structured-detail-section structured-detail-subsection">
                      <h3>{pretty(nestedKey)}</h3>
                      <div className="structured-detail-grid">
                        {visibleEntries(nestedValue).map(([innerKey, innerValue]) => (
                          <Field key={innerKey} name={innerKey} value={innerValue} />
                        ))}
                      </div>
                    </section>
                  ) : (
                    <Field name={nestedKey} value={nestedValue} />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Field name={key} value={value} />
          )}
        </section>
      ))}

      {Array.isArray(trackingEvents) && (
        <section className="structured-detail-section">
          <h3>Tracking history</h3>
          <TrackingTimeline events={trackingEvents} />
        </section>
      )}

      {entries.length === 0 && (
        <p className="structured-detail-empty">No record details are available.</p>
      )}
    </div>
  );
}

export default function StructuredRecordDetailsModal({
  open,
  title = "Record details",
  record,
  loading = false,
  error = "",
  onClose,
}) {
  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const heading =
    record?.name ||
    record?.title ||
    record?.sku ||
    record?.workerCode ||
    record?.taskCode ||
    record?.shipmentCode ||
    title;

  return (
    <div
      className="modal-backdrop structured-detail-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        className="structured-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="structured-detail-title"
      >
        <header className="structured-detail-header">
          <div className="structured-detail-heading">
            <span className="eyebrow">
              <Eye size={14} /> RECORD DETAILS
            </span>
            <h2 id="structured-detail-title">{heading}</h2>
            <p>{title}</p>
          </div>

          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close record details"
          >
            <X size={19} />
          </button>
        </header>

        <div className="structured-detail-body">
          {loading ? (
            <div className="table-empty">
              <div className="spinner" />
              <b>Loading details…</b>
              <span>Fetching the latest record from the backend.</span>
            </div>
          ) : error ? (
            <div className="notice warning">
              <div>
                <b>Could not load extended details</b>
                <span>{error}</span>
              </div>
            </div>
          ) : record ? (
            <RecordContent record={record} />
          ) : (
            <p className="muted">No record details are available.</p>
          )}
        </div>

        <footer className="structured-detail-footer">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}

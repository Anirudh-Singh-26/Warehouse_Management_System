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

function formatValue(value, key = "", depth = 0) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    if (!value.length) return "—";

    return (
      <div className="record-detail-list">
        {value.map((item, index) => (
          <div className="record-detail-array-item" key={index}>
            {item !== null && typeof item === "object" ? (
              <RecordFields data={item} depth={depth + 1} />
            ) : (
              String(item ?? "—")
            )}
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    return <RecordFields data={value} depth={depth + 1} />;
  }

  if (
    typeof value === "string" &&
    /date|createdAt|updatedAt|checkIn|checkOut|completedAt|approvedAt/i.test(
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

function RecordFields({ data, depth = 0 }) {
  if (!data || typeof data !== "object") {
    return <span>{String(data ?? "—")}</span>;
  }

  const entries = Object.entries(data).filter(
    ([key, value]) =>
      !isHidden(key) && !key.startsWith("_") && value !== undefined,
  );

  if (!entries.length) {
    return <span className="record-detail-value">—</span>;
  }

  const isNested = depth > 0;

  return (
    <div
      className={
        isNested
          ? "record-detail-grid record-detail-grid-nested"
          : "record-detail-grid record-detail-grid-root"
      }
    >
      {entries.map(([key, value]) => {
        const isObject = value !== null && typeof value === "object";

        return (
          <div
            className={[
              "record-detail-field",
              isNested && "record-detail-field-nested",
              isObject && "record-detail-field-object",
            ]
              .filter(Boolean)
              .join(" ")}
            key={key}
          >
            <span className="record-detail-label">{pretty(key)}</span>

            <div className="record-detail-value">
              {formatValue(value, key, depth)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function RecordDetailsModal({
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

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
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
      className="modal-backdrop record-details-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        className="modal record-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-details-title"
      >
        <header className="modal-head">
          <div>
            <span className="eyebrow">
              <Eye size={14} /> RECORD DETAILS
            </span>

            <h2 id="record-details-title">{heading}</h2>
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

        <div className="record-details-body">
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
            <RecordFields data={record} />
          ) : (
            <p className="muted">No record details are available.</p>
          )}
        </div>

        <footer className="modal-actions record-details-footer">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}

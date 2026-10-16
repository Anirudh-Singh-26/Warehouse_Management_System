import {
  ArrowLeft,
  CalendarClock,
  CircleAlert,
  FileText,
  RefreshCw,
  Pencil,
  UserRound,
  Package,
  Info,
  Clock3,
} from "lucide-react";

import { pretty } from "../lib/formatters.jsx";
import {
  dateText,
  isObject,
  labelValue,
  isHiddenRecordKey,
} from "../lib/recordDetails.js";

import ObjectFields from "./record-details/ObjectFields.jsx";
import Section from "./record-details/Section.jsx";
import ChangeComparison from "./record-details/ChangeComparison.jsx";

export default function RecordDetailsView({
  title = "Record details",
  subtitle = "Review the information associated with this record.",
  eyebrow = "RECORD DETAILS",
  record,
  loading = false,
  error = "",
  onBack,
  onRefresh,
  onEdit,
  backLabel = "Back",
  refreshLabel = "Refresh",
}) {
  const action = record?.action || record?.event || record?.status || "";
  const summary = record?.summary || record?.description || record?.notes || "";

  const occurredAt =
    record?.occurredAt || record?.createdAt || record?.timestamp;

  const actor =
    record?.actor || (isObject(record?.actorId) ? record.actorId : null);

  const metadata = isObject(record?.metadata) ? record.metadata : null;

  const hasComparison =
    metadata && ("before" in metadata || "after" in metadata);

  const excluded = new Set([
    "action",
    "event",
    "summary",
    "description",
    "notes",
    "actor",
    "actorId",
    "metadata",
    "occurredAt",
    "trackingEvents",
  ]);

  if (!actor) excluded.delete("actorId");



  const details = Object.fromEntries(
    Object.entries(record || {}).filter(([key, value]) => {
      const isProductRecord =
        record?.entityType === "product" || record?.sku != null;

      const showProductSystemField =
        isProductRecord && ["_id", "createdAt", "updatedAt"].includes(key);

      return (
        (!isHiddenRecordKey(key) || showProductSystemField) &&
        (!excluded.has(key) || showProductSystemField) &&
        value !== undefined &&
        key !== "entityType"
      );
    }),
  );

  const metadataRest = metadata
    ? Object.fromEntries(
        Object.entries(metadata).filter(
          ([key]) =>
            !["before", "after"].includes(key) && !isHiddenRecordKey(key),
        ),
      )
    : null;

  
const scalarDetails = Object.fromEntries(
  Object.entries(details).filter(
    ([, value]) => !isObject(value) || Array.isArray(value),
  ),
);

const displayDetails = { ...scalarDetails };

if (displayDetails.createdAt) {
  displayDetails.createdAt = dateText(displayDetails.createdAt);
}

if (displayDetails.updatedAt) {
  displayDetails.updatedAt = dateText(displayDetails.updatedAt);
}

const nestedDetails = Object.entries(details).filter(
  ([, value]) => isObject(value) && !Array.isArray(value),
);

const hasRecordDetails = Object.keys(scalarDetails).length > 0;
const hasMetadata = metadataRest && Object.keys(metadataRest).length > 0;

  const trackingEvents = Array.isArray(record?.trackingEvents)
    ? [...record.trackingEvents].sort(
        (a, b) => new Date(a.occurredAt || 0) - new Date(b.occurredAt || 0),
      )
    : [];

  return (
    <main className="record-details-page rdv-simple">
      <div className="rdv-detail-top">
        {onBack && (
          <button
            type="button"
            className="rdv-back-arrow rdv-back-button"
            onClick={onBack}
            aria-label={backLabel}
            title={backLabel}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>{backLabel}</span>
          </button>
        )}

        <header className="rdv-simple-heading">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </header>

        <div className="rdv-detail-actions">
          {onEdit && record && !loading && (
            <button
              type="button"
              className="secondary-btn rdv-edit-button"
              onClick={onEdit}
            >
              <Pencil size={16} aria-hidden="true" />
              <span>Edit</span>
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              className="secondary-btn rdv-edit-button rdv-refresh-button"
              onClick={onRefresh}
              aria-label={refreshLabel}
            >
              <RefreshCw size={16} aria-hidden="true" />
              <span>{refreshLabel}</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="rdv-simple-state" role="status">
          <RefreshCw className="rdv-spinning" size={20} aria-hidden="true" />
          <span>Loading record details…</span>
        </div>
      ) : error ? (
        <div className="rdv-simple-state rdv-simple-error" role="alert">
          <CircleAlert size={20} aria-hidden="true" />
          <div>
            <strong>Unable to load details</strong>
            <p>{error}</p>
          </div>
        </div>
      ) : !record ? (
        <div className="rdv-simple-state">
          <FileText size={20} aria-hidden="true" />
          <span>No record details were found.</span>
        </div>
      ) : (
        <>
          <section className="rdv-simple-summary">
            <div className="rdv-simple-summary-title">
              <FileText size={18} aria-hidden="true" />
              <div>
                <span>Record</span>
                <h2>{labelValue(action || title)}</h2>
                {summary && <p>{summary}</p>}
              </div>
            </div>

            <div className="rdv-simple-summary-meta">
              {record.entityType && (
                <div>
                  <span>Type</span>
                  <strong>{labelValue(record.entityType)}</strong>
                </div>
              )}

              {occurredAt && (
                <div>
                  <span>
                    <CalendarClock size={14} aria-hidden="true" />
                    Recorded
                  </span>
                  <strong>{dateText(occurredAt)}</strong>
                </div>
              )}
            </div>
          </section>

          <div className="rdv-simple-sections">
            {hasRecordDetails && (
              <Section
                title={
                  record.entityType
                    ? `${pretty(record.entityType)} information`
                    : "Record information"
                }
                icon={Info}
                className="rdv-simple-section"
              >
                <ObjectFields data={displayDetails} />
              </Section>
            )}

            {nestedDetails.map(([key, value]) => (
              <Section
                key={key}
                title={pretty(key)}
                icon={Package}
                className="rdv-simple-section"
              >
                <ObjectFields data={value} />
              </Section>
            ))}

            {actor && (
              <Section
                title="Performed by"
                icon={UserRound}
                className="rdv-simple-section"
              >
                <ObjectFields data={actor} />
              </Section>
            )}

            {hasComparison && (
              <Section
                title="Change comparison"
                icon={RefreshCw}
                className="rdv-simple-section"
              >
                <ChangeComparison
                  before={metadata.before}
                  after={metadata.after}
                />
              </Section>
            )}

            {hasMetadata && (
              <Section
                title="Additional metadata"
                icon={Package}
                className="rdv-simple-section"
              >
                <ObjectFields data={metadataRest} />
              </Section>
            )}

            {trackingEvents.length > 0 && (
              <Section
                title="Tracking history"
                icon={Clock3}
                className="rdv-simple-section"
              >
                <div className="rdv-simple-timeline">
                  {trackingEvents.map((event, index) => (
                    <div
                      className="rdv-simple-timeline-item"
                      key={`${event.status}-${event.occurredAt}-${index}`}
                    >
                      <span className="rdv-simple-timeline-dot" />

                      <div>
                        <strong>{labelValue(event.status)}</strong>
                        <time>
                          {event.occurredAt
                            ? dateText(event.occurredAt)
                            : "Time not recorded"}
                        </time>

                        {event.location && <p>{event.location}</p>}
                        {event.notes && <p>{event.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </>
      )}
    </main>
  );
}

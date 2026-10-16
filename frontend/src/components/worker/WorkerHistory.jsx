import React, { useState } from "react";
import RecordDetailsModal from "../RecordDetailsModal.jsx";
import { BadgeIndianRupee, Clock3, RefreshCw } from "../../icons.js";
import { dateText, money } from "../../lib/api.js";

function formatTime(value) {
  return value
    ? new Date(value).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      })
    : "—";
}

export default function WorkerHistory({
  history = [],
  bonuses = [],
  loading,
  onRefresh,
}) {

  const [selectedRecord, setSelectedRecord] = useState(null);
  return (
    <>
      <div className="worker-page">
        <div className="page-heading">
          <div>
            <h1>My history</h1>
            <p>Your personal attendance records and bonus history.</p>
          </div>

          <button
            className="secondary-btn"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw size={15} />
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <section className="panel worker-page-panel">
          <div className="panel-head">
            <div>
              <h3>
                <Clock3 size={18} /> Attendance history
              </h3>
              <p>Your recent attendance records</p>
            </div>
          </div>

          {history.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Hours</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record, index) => (
                    <tr key={record.id || `${record.date}-${index}`}>
                      <td>{dateText(`${record.date}T12:00:00`)}</td>
                      <td>
                        <span
                          className={`status-pill ${(record.status || "PRESENT").toLowerCase()}`}
                        >
                          {record.status || "PRESENT"}
                        </span>
                      </td>
                      <td>{formatTime(record.checkIn)}</td>
                      <td>{formatTime(record.checkOut)}</td>
                      <td>{record.hoursWorked ?? 0}</td>
                      <td>
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() =>
                            setSelectedRecord({
                              ...record,
                              recordType: "Attendance history",
                            })
                          }
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted worker-empty">
              No attendance history is available yet.
            </p>
          )}
        </section>

        <section className="panel worker-page-panel">
          <div className="panel-head">
            <div>
              <h3>
                <BadgeIndianRupee size={18} /> Bonus history
              </h3>
              <p>Personal bonus records and their approval status</p>
            </div>
          </div>

          {bonuses.length ? (
            <div className="worker-list">
              {bonuses.map((bonus) => (
                <article className="worker-list-item" key={bonus.id}>
                  <div className="worker-list-main">
                    <b>{money(bonus.amount)}</b>
                    <small>
                      {dateText(bonus.periodStart)} –{" "}
                      {dateText(bonus.periodEnd)}
                    </small>
                    {bonus.criteria && <p>{bonus.criteria}</p>}
                    {bonus.approvalNote && (
                      <p>Approval note: {bonus.approvalNote}</p>
                    )}
                  </div>

                  <span
                    className={`status-pill ${(bonus.approvalStatus || "PENDING").toLowerCase()}`}
                  >
                    {(bonus.approvalStatus || "PENDING").replaceAll("_", " ")}
                  </span>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() =>
                      setSelectedRecord({
                        ...bonus,
                        recordType: "Bonus history",
                      })
                    }
                  >
                    View details
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted worker-empty">
              No bonus records are available yet.
            </p>
          )}
        </section>
      </div>
      <RecordDetailsModal
        open={Boolean(selectedRecord)}
        title={selectedRecord?.recordType || "Personal history"}
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </>
  );
}

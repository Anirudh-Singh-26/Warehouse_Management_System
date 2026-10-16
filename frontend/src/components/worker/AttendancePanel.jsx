import React from "react";
import { CalendarCheck, Clock3, LogIn, LogOut } from "../../icons.js";

function formatTime(value) {
  return value
    ? new Date(value).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      })
    : "—";
}

export default function AttendancePanel({ data, busy, markAttendance }) {
  const attendance = data?.attendance;
  const state = data?.attendanceState;

  const status =
    state === "CHECKED_OUT"
      ? "SHIFT COMPLETE"
      : state === "CHECKED_IN"
        ? "ON SHIFT"
        : "NOT STARTED";

  return (
    <div className="worker-page">
      <div className="page-heading">
        <div>
          <h1>My attendance</h1>
          <p>Record and review your attendance for today's shift.</p>
        </div>
      </div>

      <section className="panel worker-attendance-panel">
        <div className="panel-head">
          <div>
            <h3>
              <CalendarCheck size={18} /> Today's attendance
            </h3>
            <p>
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
                timeZone: "Asia/Kolkata",
              })}
            </p>
          </div>
          <span className="section-chip">{status}</span>
        </div>

        <div className="worker-attendance-grid">
          <div>
            <small>Check-in</small>
            <strong>{formatTime(attendance?.checkIn)}</strong>
            <span>
              {data?.attendanceWindow?.checkInStart}–
              {data?.attendanceWindow?.checkInEnd} IST
            </span>
          </div>

          <div>
            <small>Check-out</small>
            <strong>{formatTime(attendance?.checkOut)}</strong>
            <span>
              {data?.attendanceWindow?.checkOutStart}–
              {data?.attendanceWindow?.checkOutEnd} IST
            </span>
          </div>

          <div className="worker-attendance-actions">
            <button
              className="primary-btn"
              disabled={
                !data?.canCheckIn ||
                Boolean(busy) ||
                Boolean(attendance?.checkIn)
              }
              onClick={() => markAttendance("check-in")}
            >
              <LogIn size={16} />
              {busy === "check-in" ? "Recording…" : "Mark check-in"}
            </button>

            <button
              className="secondary-btn"
              disabled={
                !data?.canCheckOut ||
                Boolean(busy) ||
                !attendance?.checkIn ||
                Boolean(attendance?.checkOut)
              }
              onClick={() => markAttendance("check-out")}
            >
              <LogOut size={16} />
              {busy === "check-out" ? "Recording…" : "Mark check-out"}
            </button>
          </div>
        </div>

        <div className="worker-hours-summary">
          <Clock3 size={18} />
          <div>
            <strong>
              {attendance?.hoursWorked != null
                ? `${attendance.hoursWorked} hours`
                : "Hours not finalized"}
            </strong>
            <p>
              Attendance times are recorded by the server. If you miss an
              allowed window, contact your manager for a correction.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

import React, { useCallback, useEffect, useState } from "react";
import { Activity, CalendarCheck, ShieldAlert } from "../icons.js";
import { api } from "../lib/api.js";

import AttendancePanel from "../components/worker/AttendancePanel.jsx";
import TaskList from "../components/worker/TaskList.jsx";
import WorkerHistory from "../components/worker/WorkerHistory.jsx";
import WorkerAccount from "../components/worker/WorkerAccount.jsx";

function WorkerPortal({
  user,
  notify,
  refreshKey,
  activeSection = "worker-attendance",
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setData(await api("/worker-portal/me"));
    } catch (e) {
      setError(e.message || "Unable to load your worker workspace.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function markAttendance(action) {
    setBusy(action);
    setError("");

    try {
      await api(`/worker-portal/attendance/${action}`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      notify(
        action === "check-in"
          ? "Check-in recorded successfully."
          : "Check-out recorded successfully.",
      );

      await load();
    } catch (e) {
      setError(e.message || "Unable to record attendance.");
    } finally {
      setBusy("");
    }
  }

  async function updateTask(task, status) {
    setBusy(task.id);
    setError("");

    try {
      await api(`/worker-portal/tasks/${task.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      notify(`Task updated to ${status.replaceAll("_", " ").toLowerCase()}.`);
      await load();
    } catch (e) {
      setError(e.message || "Unable to update task.");
    } finally {
      setBusy("");
    }
  }

  if (loading && !data) {
    return (
      <div className="worker-portal">
        <div className="panel worker-loading">
          <p>Loading your worker workspace…</p>
        </div>
      </div>
    );
  }

  if (!data && error) {
    return (
      <div className="worker-portal">
        <div className="notice warning">
          <ShieldAlert size={17} />
          <div>
            <b>Unable to load your workspace</b>
            <span>{error}</span>
          </div>
          <button className="secondary-btn" onClick={load} disabled={loading}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const worker = data?.worker;
  const tasks = data?.tasks || [];
  const bonuses = data?.bonuses || [];
  const history = data?.attendanceHistory || [];

  // Support both the new navigation IDs and the older section names.
  const sectionAliases = {
    attendance: "worker-attendance",
    tasks: "worker-tasks",
    history: "worker-history",
    account: "worker-account",
    profile: "worker-account",
  };

  const selectedSection =
    sectionAliases[activeSection] || activeSection || "worker-attendance";

  return (
    <div className="worker-portal">
      {error && (
        <div className="notice warning" role="alert">
          <ShieldAlert size={17} />
          <div>
            <b>Action needs attention</b>
            <span>{error}</span>
          </div>
        </div>
      )}

      <section className="welcome-banner worker-compact-banner">
        <div className="welcome-copy">
          <span className="banner-label">
            <Activity size={14} /> WORKER SELF-SERVICE
          </span>

          <h2>Hello, {worker?.name || user?.name || "Worker"}.</h2>
          <p>Your attendance, assigned tasks and personal history.</p>

          <div className="banner-foot">
            <span>
              <span className="live-dot" />
              {worker?.workerCode || "Worker account"}
            </span>
            <span className="banner-divider" />
            <span>{worker?.jobTitle || "Warehouse team"}</span>
          </div>
        </div>

        <div className="banner-illustration" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="cube">
            <CalendarCheck size={42} />
          </div>
        </div>
      </section>

      {selectedSection === "worker-attendance" && (
        <AttendancePanel
          data={data}
          busy={busy}
          markAttendance={markAttendance}
        />
      )}

      {selectedSection === "worker-tasks" && (
        <TaskList tasks={tasks} busy={busy} updateTask={updateTask} />
      )}

      {selectedSection === "worker-history" && (
        <WorkerHistory
          history={history}
          bonuses={bonuses}
          loading={loading}
          onRefresh={load}
        />
      )}

      {selectedSection === "worker-account" && (
        <WorkerAccount worker={worker} user={user} />
      )}

      {![
        "worker-attendance",
        "worker-tasks",
        "worker-history",
        "worker-account",
      ].includes(selectedSection) && (
        <div className="panel worker-empty-page">
          <h3>Page not found</h3>
          <p className="muted">
            Choose Attendance, My tasks, My history or My account from the
            sidebar.
          </p>
        </div>
      )}
    </div>
  );
}

export default WorkerPortal;

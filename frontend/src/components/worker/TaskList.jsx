import React, { useState } from "react";
import RecordDetailsModal from "../RecordDetailsModal.jsx";
import { ClipboardList } from "../../icons.js";
import { dateText } from "../../lib/api.js";

export default function TaskList({ tasks = [], busy, updateTask }) {

  const [selectedTask, setSelectedTask] = useState(null);

  return (
    <>
      <div className="worker-page">
        <div className="page-heading">
          <div>
            <h1>My tasks</h1>
            <p>Review your assigned work and update its progress.</p>
          </div>
        </div>

        <section className="panel worker-page-panel">
          <div className="panel-head">
            <div>
              <h3>
                <ClipboardList size={18} /> Assigned tasks
              </h3>
              <p>{tasks.length} task(s) assigned to your account</p>
            </div>
          </div>

          {tasks.length ? (
            <div className="worker-list">
              {tasks.map((task) => (
                <article className="worker-list-item" key={task.id}>
                  <div className="worker-list-main">
                    <b>{task.title}</b>
                    <small>
                      {task.taskCode} · {task.priority} priority
                      {task.dueDate ? ` · Due ${dateText(task.dueDate)}` : ""}
                    </small>
                    {task.description && <p>{task.description}</p>}
                  </div>

                  <div className="worker-task-action">
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => setSelectedTask(task)}
                    >
                      View details
                    </button>
                    <span
                      className={`status-pill ${task.status
                        .toLowerCase()
                        .replaceAll("_", "-")}`}
                    >
                      {task.status.replaceAll("_", " ")}
                    </span>

                    {task.status === "PENDING" && (
                      <button
                        className="secondary-btn"
                        disabled={Boolean(busy)}
                        onClick={() => updateTask(task, "IN_PROGRESS")}
                      >
                        Start task
                      </button>
                    )}

                    {task.status === "IN_PROGRESS" && (
                      <button
                        className="primary-btn"
                        disabled={Boolean(busy)}
                        onClick={() => updateTask(task, "COMPLETED")}
                      >
                        {busy === task.id ? "Updating…" : "Complete task"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted worker-empty">
              No tasks are assigned to you yet.
            </p>
          )}
        </section>
      </div>
      <RecordDetailsModal
        open={Boolean(selectedTask)}
        title="Task details"
        record={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </>
  );
}

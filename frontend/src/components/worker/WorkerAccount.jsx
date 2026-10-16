import React from "react";
import { UserRound } from "../../icons.js";

export default function WorkerAccount({ worker, user }) {
  const details = [
    ["Full name", worker?.name || user?.name || "—"],
    ["Worker ID", worker?.workerCode || "—"],
    ["Email", worker?.email || user?.email || "—"],
    ["Job title", worker?.jobTitle || "—"],
    ["Employment type", worker?.employmentType || "—"],
    ["Staffing agency", worker?.agencyName || "—"],
    ["Account status", worker?.status || "—"],
  ];

  return (
    <div className="worker-page">
      <div className="page-heading">
        <div>
          <h1>My account</h1>
          <p>View your worker profile information.</p>
        </div>
      </div>

      <section className="panel worker-page-panel">
        <div className="panel-head">
          <div>
            <h3>
              <UserRound size={18} /> Personal information
            </h3>
            <p>Contact HR if any of these details need correction.</p>
          </div>
        </div>

        <div className="worker-account-grid">
          {details.map(([label, value]) => (
            <div className="worker-account-field" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

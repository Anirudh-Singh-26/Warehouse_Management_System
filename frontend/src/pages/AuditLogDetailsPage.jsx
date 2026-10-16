import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import RecordDetailsView from "../components/RecordDetailsView.jsx";

export default function AuditLogDetailsPage() {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecord = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api(`/audit-logs/${recordId}`);
      setRecord(result?.data ?? result?.record ?? result);
    } catch (err) {
      setError(err.message || "Unable to load audit details.");
    } finally {
      setLoading(false);
    }
  }, [recordId]);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  return (
    <RecordDetailsView
      title="Audit history details"
      subtitle="Review the event, the person responsible, and the recorded changes."
      eyebrow="AUDIT HISTORY / RECORD DETAILS"
      record={record}
      loading={loading}
      error={error}
      onBack={() => navigate("/audit-logs")}
      onRefresh={loadRecord}
      backLabel="Back to Audit History"
    />
  );
}

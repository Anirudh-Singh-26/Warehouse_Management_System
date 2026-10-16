import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import RecordDetailsView from "../components/RecordDetailsView.jsx";
import { api, unwrapList } from "../lib/api.js";
import { resourcePath } from "../config/resources.js";
import { pageTitles } from "../config/navigation.js";
import { singular } from "../lib/labels.js";
import EditRecordModal, { canEditResource } from "../components/EditRecordModal.jsx";

const titleFor = (resource) => pageTitles[resource] || singular(resource);
const idOf = (record) => String(record?._id ?? record?.id ?? "");

export default function ResourceDetailsPage({ resource: resourceProp, notify }) {
  const params = useParams();
  const resource = resourceProp || params.resource;
  const recordId = params.recordId;
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    api("/auth/me").then((result) => setCurrentUser(result?.user || result?.data?.user || null)).catch(() => setCurrentUser(null));
  }, []);

  const loadRecord = useCallback(async () => {
    if (!resource || !recordId) {
      setError("The record URL is incomplete.");
      setRecord(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setRecord(null);
    const collectionPath = resourcePath(resource);

    try {
      // Prefer a dedicated API endpoint when the backend provides one.
      try {
        const result = await api(`${collectionPath}/${encodeURIComponent(recordId)}`);
        const candidate =
          result?.data?.product ??
          result?.data?.user ??
          result?.data?.record ??
          result?.product ??
          result?.data ??
          result?.record ??
          result?.user ??
          result;
        if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
          setRecord(candidate);
          return;
        }
      } catch (detailError) {
        // Inventory and movement APIs may only expose collection endpoints.
        // Fall back to the list and match the requested record by ID.
        if (![404, 405].includes(detailError.status)) throw detailError;
      }

      const listResult = await api(collectionPath);
      const match = unwrapList(listResult).find((item) => idOf(item) === String(recordId));
      if (!match) {
        throw new Error("This record could not be found. It may have been removed or you may not have access to it.");
      }
      setRecord(match);
    } catch (err) {
      setError(err.message || "Unable to load record details.");
    } finally {
      setLoading(false);
    }
  }, [resource, recordId]);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  return (
    <>
    <RecordDetailsView
      title={`${titleFor(resource)} details`}
      subtitle={`Review the complete information associated with this ${singular(resource)} record.`}
      eyebrow={`${titleFor(resource)} / RECORD DETAILS`}
      record={record}
      loading={loading}
      error={error}
      onBack={() => navigate(`/${resource}`, { replace: false })}
      onRefresh={loadRecord}
      onEdit={record && canEditResource(resource, currentUser?.role) ? () => setShowEdit(true) : undefined}
      backLabel={`Back to ${titleFor(resource)}`}
    />
    {showEdit && record && (
      <EditRecordModal
        resource={resource}
        record={record}
        onClose={() => setShowEdit(false)}
        notify={notify}
        onSaved={async () => {
          setShowEdit(false);
          await loadRecord();
        }}
      />
    )}
    </>
  );
}

import { CheckCircle2 } from "lucide-react";
import { pretty } from "../../lib/formatters.jsx";
import { isObject, isHiddenRecordKey } from "../../lib/recordDetails.js";
import Value from "./Value.jsx";

export default function ChangeComparison({ before, after }) {
  const beforeObj = isObject(before) ? before : {};
  const afterObj = isObject(after) ? after : {};
  const keys = [...new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)])]
    .filter((key) => !isHiddenRecordKey(key));

  if (!keys.length) {
    return (
      <div className="rdv-change-empty">
        <CheckCircle2 size={17} aria-hidden="true" />
        No field-level comparison was recorded.
      </div>
    );
  }

  return (
    <div className="rdv-comparison">
      <div className="rdv-comparison-head">
        <span>Field</span><span>Before</span><span>After</span>
      </div>
      {keys.map((key) => {
        const oldValue = beforeObj[key];
        const newValue = afterObj[key];
        const changed = JSON.stringify(oldValue ?? null) !== JSON.stringify(newValue ?? null);
        return (
          <div className={`rdv-comparison-row ${changed ? "is-changed" : ""}`} key={key}>
            <strong>{pretty(key)}</strong>
            <div><Value value={oldValue} field={key} /></div>
            <div><Value value={newValue} field={key} /></div>
          </div>
        );
      })}
    </div>
  );
}

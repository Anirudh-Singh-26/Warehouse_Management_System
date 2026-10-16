import { ExternalLink } from "lucide-react";
import { pretty } from "../../lib/formatters.jsx";
import {
  isObject,
  labelValue,
  safeHttpUrl,
  isHiddenRecordKey,
} from "../../lib/recordDetails.js";

function NestedObjectFields({ data }) {
  const entries = Object.entries(data || {}).filter(
    ([key, value]) => !isHiddenRecordKey(key) && value !== undefined,
  );

  if (!entries.length) {
    return <span className="rdv-muted">No details available</span>;
  }

  
return (
  <div className="rdv-nested-table-wrap">
    <table className="rdv-details-table rdv-nested-table">
      <tbody>
        {entries.map(([key, value]) => (
          <tr key={key}>
            <th scope="row">{pretty(key)}</th>
            <td>
              <Value value={value} field={key} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

}

export default function Value({ value, field = "" }) {
  if (value == null || value === "") {
    return <span className="rdv-muted">—</span>;
  }

  const href = safeHttpUrl(value);

  if (href) {
    return (
      <a
        className="rdv-link"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {/tracking|proofOfDelivery/i.test(field)
          ? "Open tracking / proof link"
          : "Open link"}
        <ExternalLink size={13} aria-hidden="true" />
      </a>
    );
  }

  if (Array.isArray(value)) {
    if (!value.length) {
      return <span className="rdv-muted">No entries recorded</span>;
    }

    return (
      <div className="rdv-array">
        {value.map((item, index) => (
          <div className="rdv-array-item" key={`${field}-${index}`}>
            {isObject(item) ? (
              <NestedObjectFields data={item} />
            ) : (
              <Value value={item} field={field} />
            )}
          </div>
        ))}
      </div>
    );
  }

  if (isObject(value)) {
    return <NestedObjectFields data={value} />;
  }

  return <span className="rdv-value-text">{labelValue(value, field)}</span>;
}

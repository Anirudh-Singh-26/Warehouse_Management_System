import { pretty } from "../../lib/formatters.jsx";
import { isHiddenRecordKey } from "../../lib/recordDetails.js";
import Value from "./Value.jsx";

export default function ObjectFields({ data }) {
  const entries = Object.entries(data || {}).filter(
    ([key, value]) => !isHiddenRecordKey(key) && value !== undefined,
  );

  if (!entries.length) {
    return <p className="rdv-table-empty">No details available.</p>;
  }

  return (
    <div className="rdv-table-wrap">
      <table className="rdv-details-table">
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

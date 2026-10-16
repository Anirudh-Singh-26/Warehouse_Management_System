import React from "react";
import { money, dateText } from "./api.js";

function pretty(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replaceAll("_", " ")
    .replace(/^./, (s) => s.toUpperCase());
}
function cellValue(value, key) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean")
    return (
      <span className={`status-pill ${value ? "good" : "neutral"}`}>
        {value ? "YES" : "NO"}
      </span>
    );
  if (
    key.toLowerCase().includes("status") ||
    ["priority", "approved", "eligible", "employmentType", "type"].includes(key)
  ) {
    const text = String(value).replaceAll("_", " ");
    const good = [
      "ACTIVE",
      "AVAILABLE",
      "DELIVERED",
      "COMPLETED",
      "PRESENT",
      "APPROVED",
      "TRUE",
    ].includes(String(value).toUpperCase());
    const bad = [
      "INACTIVE",
      "FAILED",
      "CANCELLED",
      "ABSENT",
      "REJECTED",
      "FALSE",
    ].includes(String(value).toUpperCase());
    return (
      <span
        className={`status-pill ${good ? "good" : bad ? "bad" : "neutral"}`}
      >
        {text}
      </span>
    );
  }
  if (typeof value === "object")
    return value.name || value.sku || value._id || JSON.stringify(value);
  if (/price|amount|rate|value|cost/i.test(key) && !Number.isNaN(Number(value)))
    return money(value);
  if (/At$|Date$|^date$|createdAt/i.test(key)) return dateText(value);
  if (String(value).length > 64) return `${String(value).slice(0, 61)}…`;
  return String(value);
}
export { pretty, cellValue };

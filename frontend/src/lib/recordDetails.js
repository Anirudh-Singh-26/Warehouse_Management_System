const HIDDEN = /password|secret|token|passwordHash|__v/i;

export function safeHttpUrl(value) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function dateText(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function labelValue(value, key = "") {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (
    typeof value === "string" &&
    /(date|at|expiry|due)$/i.test(key) &&
    !Number.isNaN(Date.parse(value))
  ) return dateText(value);
  if (typeof value === "string" && /^[A-Z][A-Z0-9_]{2,}$/.test(value)) {
    return value.replaceAll("_", " ");
  }
  return String(value);
}

export const isHiddenRecordKey = (key) =>
  HIDDEN.test(key) || (key.startsWith("_") && key !== "_id");

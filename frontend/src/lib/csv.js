function exportCSV(rows, filename) {
  if (!Array.isArray(rows) || rows.length === 0) return;
  const keys = [
    ...new Set(rows.flatMap((row) => Object.keys(row || {}))),
  ].filter((k) => !["_id", "__v", "passwordHash"].includes(k));
  const safe = (value) => {
    let v =
      value == null
        ? ""
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);
    if (/^[=+@\-\t\r]/.test(v)) v = "'" + v;
    return `"${v.replaceAll('"', '""')}"`;
  };
  const csv =
    "\uFEFF" +
    [
      keys.map(safe).join(","),
      ...rows.map((row) => keys.map((k) => safe(row?.[k])).join(",")),
    ].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
export { exportCSV };

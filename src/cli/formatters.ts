/**
 * Output formatters for CLI results
 */

export type OutputFormat = "json" | "csv" | "table";

/**
 * Extract the main array of items from any result shape.
 * Handles: stocks[], pairs[], cryptocurrencies[], etfs[], symbols[], fields[], or raw arrays.
 */
export function extractItems(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    for (const value of Object.values(data)) {
      if (Array.isArray(value)) return value;
    }
  }
  return [data];
}

function csvEscape(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatCSV(data: any): string {
  const items = extractItems(data);
  if (items.length === 0) return "";
  const headers = Object.keys(items[0]);
  const rows = items.map((item) =>
    headers.map((h) => csvEscape(item[h])).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

function formatTable(data: any): string {
  const items = extractItems(data);
  if (items.length === 0) return "(no results)";
  const headers = Object.keys(items[0]);
  const MAX_COL = 40;

  const widths = headers.map((h, i) =>
    Math.min(
      MAX_COL,
      Math.max(h.length, ...items.map((item) => String(item[h] ?? "").length))
    )
  );

  const pad = (str: string, width: number) => {
    if (str.length > width) return str.slice(0, width - 1) + "\u2026";
    return str.padEnd(width);
  };

  const headerLine = headers.map((h, i) => pad(h, widths[i])).join("  ");
  const sep = widths.map((w) => "-".repeat(w)).join("  ");
  const rows = items.map((item) =>
    headers.map((h, i) => pad(String(item[h] ?? ""), widths[i])).join("  ")
  );
  return [headerLine, sep, ...rows].join("\n");
}

function formatJSON(data: any): string {
  return JSON.stringify(data, null, 2);
}

export function formatOutput(data: any, format: OutputFormat = "json"): string {
  switch (format) {
    case "csv":
      return formatCSV(data);
    case "table":
      return formatTable(data);
    case "json":
    default:
      return formatJSON(data);
  }
}

export function formatMoney(amount: unknown, currency?: unknown): string {
  const n = Number(amount);
  if (amount === null || amount === undefined || amount === "" || !Number.isFinite(n)) return "—";
  const cur = typeof currency === "string" && currency ? currency : "BDT";
  const symbol = cur === "BDT" ? "৳" : `${cur} `;
  return `${symbol}${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function formatDate(value: unknown): string {
  if (!value) return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

export function formatDateTime(value: unknown): string {
  if (!value) return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dhaka",
  });
}

export function humanize(value: unknown): string {
  return String(value ?? "")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

/** Read `a.b` from a row where `a` may be an object or a one-element array (PostgREST embeds). */
export function pick(row: Record<string, any>, path: string): unknown { // eslint-disable-line @typescript-eslint/no-explicit-any
  return path.split(".").reduce<any>((acc, key) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (acc === null || acc === undefined) return undefined;
    const next = Array.isArray(acc) ? acc[0]?.[key] : acc[key];
    return next;
  }, row);
}

export type BadgeVariant = "purple" | "gold" | "gray" | "success" | "warning" | "danger";

export function statusVariant(value: unknown): BadgeVariant {
  switch (String(value)) {
    case "published":
    case "confirmed":
    case "paid":
    case "valid":
    case "completed":
    case "replied":
    case "available":
      return "success";
    case "pending":
    case "draft":
    case "new":
      return "warning";
    case "cancelled":
    case "failed":
    case "hidden":
    case "refunded":
      return "danger";
    case "archived":
    case "used":
    case "read":
      return "gray";
    default:
      return "purple";
  }
}

/** Escape user input for use inside a PostgREST `.or()` ilike filter. */
export function safeSearch(q: string): string {
  return q.replace(/[,()%*\\:"']/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export const PAGE_SIZE = 20;

export function pageParam(v: string | string[] | undefined): number {
  const n = parseInt(Array.isArray(v) ? v[0] : v ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 10000) : 1;
}

export function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

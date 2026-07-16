// Formatting helpers (client-safe) — en-US.
export function pctText(v?: number | null): string {
  if (v == null) return "—";
  return (v >= 0 ? "+" : "") + v.toFixed(1) + "%";
}
export function pctClass(v?: number | null): string {
  if (v == null) return "";
  return v >= 0 ? "pos" : "neg";
}
export function num(v?: number | null, dp = 2): string {
  if (v == null) return "—";
  return v.toLocaleString("en-US", { maximumFractionDigits: dp, minimumFractionDigits: dp });
}
export function numShort(v?: number | null): string {
  if (v == null) return "—";
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

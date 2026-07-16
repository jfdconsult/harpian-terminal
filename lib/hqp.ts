// HQP backend client (/v1) — for the Terminal's Market/Intelligence screens to
// consume the SAME real data as the Cockpit (RSS news, StockTwits social, Yahoo
// quotes). Only MARKET data enters here — never the method (CRS/formulas). Confidentiality
// preserved: the backend only exposes to the Terminal what's publicly available market data.
const HQP_URL = process.env.NEXT_PUBLIC_HQP_API_URL || "http://localhost:8080";

export async function hqpGet<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${HQP_URL}${path}`, {
    headers: { "X-User-Role": "assessor", "X-User-Name": "Terminal MFO" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

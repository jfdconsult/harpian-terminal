// ============================================================
// Market prices via the HQP Backend (single source: Yahoo Finance).
// Used only in Route Handlers (server). The browser doesn't talk here
// directly; Node fetches from HQP and passes it along. Swappable for
// FastTrack later.
// ============================================================

const HQP = process.env.NEXT_PUBLIC_HQP_API_URL || "http://localhost:8080";
const HQP_HEADERS = { "X-User-Role": "assessor", "X-User-Name": "Terminal MFO" };

function dateToEpoch(d: string): number {
  return Math.floor(new Date(d + "T12:00:00Z").getTime() / 1000);
}

export interface Series { t: number[]; close: number[]; }

interface HqpCandle { time: string; open: number; high: number; low: number; close: number; volume: number }
interface HqpChartResp { ticker: string; name: string; currency?: string; ok: boolean; candles: HqpCandle[] }

async function hqpChart(symbol: string, range: string, interval: string): Promise<HqpChartResp> {
  const url = `${HQP}/v1/market/chart/${encodeURIComponent(symbol)}?rng=${range}&interval=${interval}`;
  const r = await fetch(url, { headers: HQP_HEADERS, cache: "no-store" });
  if (!r.ok) throw new Error(`HQP chart ${symbol} HTTP ${r.status}`);
  return r.json();
}

export async function yahooChart(symbol: string, range = "1y", interval = "1d"): Promise<{ meta: Record<string, unknown>; series: Series }> {
  const j = await hqpChart(symbol, range, interval);
  if (!j.ok || !j.candles?.length) throw new Error(`HQP chart ${symbol} has no data`);
  const t: number[] = [];
  const close: number[] = [];
  for (const c of j.candles) {
    t.push(dateToEpoch(c.time));
    close.push(c.close);
  }
  return { meta: { shortName: j.name || symbol, currency: j.currency || "USD" }, series: { t, close } };
}

export interface OHLCSeries { t: number[]; o: number[]; h: number[]; l: number[]; c: number[]; v: number[] }

export async function yahooOHLC(symbol: string, range = "1y", interval = "1d"): Promise<{ meta: Record<string, unknown>; s: OHLCSeries }> {
  const j = await hqpChart(symbol, range, interval);
  if (!j.ok || !j.candles?.length) throw new Error(`HQP chart ${symbol} has no data`);
  const s: OHLCSeries = { t: [], o: [], h: [], l: [], c: [], v: [] };
  for (const c of j.candles) {
    s.t.push(dateToEpoch(c.time));
    s.o.push(c.open);
    s.h.push(c.high);
    s.l.push(c.low);
    s.c.push(c.close);
    s.v.push(c.volume);
  }
  return { meta: { shortName: j.name || symbol, currency: j.currency || "USD" }, s };
}

// ---------- Metrics (pure functions) ----------
const last = (a: number[]) => a[a.length - 1];
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / (a.length || 1);
function std(a: number[]) {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
}
export function dailyReturns(close: number[]) {
  const r: number[] = [];
  for (let i = 1; i < close.length; i++) r.push(close[i] / close[i - 1] - 1);
  return r;
}
export function pctFrom(close: number[], idx: number): number | null {
  if (idx < 0 || idx >= close.length) return null;
  return (last(close) / close[idx] - 1) * 100;
}
export function dayPct(close: number[]): number | null {
  if (close.length < 2) return null;
  return (last(close) / close[close.length - 2] - 1) * 100;
}
export function ytdIndex(t: number[]): number {
  if (!t.length) return 0;
  const yr = new Date(last(t) * 1000).getUTCFullYear();
  for (let i = 0; i < t.length; i++) if (new Date(t[i] * 1000).getUTCFullYear() === yr) return i;
  return 0;
}
export function idxDaysAgo(len: number, n: number) { return Math.max(0, len - 1 - n); }
export function sharpe(close: number[], rf = 0.035): number | null {
  const r = dailyReturns(close);
  const sd = std(r);
  if (!r.length || sd === 0) return null;
  return (mean(r) * 252 - rf) / (sd * Math.sqrt(252));
}
export function annualVolPct(close: number[]): number | null {
  const r = dailyReturns(close);
  if (r.length < 2) return null;
  return std(r) * Math.sqrt(252) * 100;
}
export function maxDrawdownPct(close: number[]): number | null {
  if (!close.length) return null;
  let peak = close[0], mdd = 0;
  for (const p of close) { if (p > peak) peak = p; const dd = p / peak - 1; if (dd < mdd) mdd = dd; }
  return mdd * 100;
}
// Sortino: like Sharpe, but only penalizes downside volatility (downside deviation).
export function sortino(close: number[], rf = 0.035): number | null {
  const r = dailyReturns(close);
  if (!r.length) return null;
  const downside = r.filter((x) => x < 0);
  if (!downside.length) return null;
  const dd = Math.sqrt(downside.reduce((s, x) => s + x * x, 0) / r.length) * Math.sqrt(252);
  if (dd === 0) return null;
  return (mean(r) * 252 - rf) / dd;
}
// Ulcer Index: root mean square of the drawdown — penalizes both depth AND duration of the decline.
export function ulcerIndex(close: number[]): number | null {
  if (!close.length) return null;
  let peak = close[0];
  let sumSq = 0;
  for (const p of close) { if (p > peak) peak = p; const dd = (p / peak - 1) * 100; sumSq += dd * dd; }
  return Math.sqrt(sumSq / close.length);
}
// Annualized CAGR from a base-100 series (or any NAV) and the number of elapsed years.
export function cagrPct(close: number[], years: number): number | null {
  if (close.length < 2 || years <= 0) return null;
  const total = last(close) / close[0];
  if (total <= 0) return null;
  return (Math.pow(total, 1 / years) - 1) * 100;
}
// Number of calendar years with a negative return, given t (timestamps) and close aligned.
export function negativeYears(t: number[], close: number[]): number {
  const byYear = new Map<number, { first: number; last: number }>();
  for (let i = 0; i < t.length; i++) {
    const y = new Date(t[i] * 1000).getUTCFullYear();
    const cur = byYear.get(y);
    if (!cur) byYear.set(y, { first: close[i], last: close[i] });
    else cur.last = close[i];
  }
  let n = 0;
  for (const { first, last: l } of byYear.values()) if (l < first) n++;
  return n;
}
export function rsi(close: number[], period = 14): number | null {
  if (close.length <= period) return null;
  let gain = 0, loss = 0;
  for (let i = close.length - period; i < close.length; i++) {
    const d = close[i] - close[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  if (loss === 0) return 100;
  const rs = gain / period / (loss / period);
  return 100 - 100 / (1 + rs);
}
export function w52(close: number[]) {
  if (!close.length) return { lo: 0, hi: 0 };
  let lo = close[0], hi = close[0];
  for (let i = 1; i < close.length; i++) { if (close[i] < lo) lo = close[i]; if (close[i] > hi) hi = close[i]; }
  return { lo, hi };
}
// Risk Number 1–99 — Nitrogen/HRIE methodology (95% downside over 6 months),
// the same as lib/risk-number.ts. It used to be vol×1.72 (calibrated to SPY≈27.6),
// inconsistent with the UI which says SPY≈70. Now a single method across the
// whole app: AGG≈29–31, SPY in the 60–70 range depending on the window.
export function riskNumber(close: number[]): number | null {
  const rets = dailyReturns(close);
  const neg = rets.filter((x) => x < 0);
  if (rets.length < 20) return null;
  const dd = neg.length ? Math.sqrt(neg.reduce((s, x) => s + x * x, 0) / rets.length) * Math.sqrt(252) : 0;
  const loss = 1.645 * dd * Math.sqrt(0.5);
  const anchors: [number, number][] = [[0.02, 22], [0.05, 32], [0.07, 42], [0.12, 62], [0.18, 82], [0.2742, 91]];
  if (loss <= 0) return 1;
  if (loss >= anchors[anchors.length - 1][0]) return 99;
  for (let i = 1; i < anchors.length; i++) {
    const [x1, y1] = anchors[i - 1], [x2, y2] = anchors[i];
    if (loss <= x2) return Math.round(y1 + (loss - x1) / (x2 - x1) * (y2 - y1));
  }
  return 99;
}

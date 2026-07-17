// CORE22+ backtest (1988-2026, base 100) + alignment of external benchmarks
// (^DJI, TLT) using the SAME methodology, for a 4-way comparison. The fund's
// official source is the CSV (Portfolio/SPX_buyhold from the AlphaDroid
// Summary.829); the DJI/TLT series are our own comparative series computed live
// from real Yahoo data, never fabricated.
import { readFileSync } from "fs";
import path from "path";
import { cacheGet, cacheSet } from "./cache";

export interface Core22Series { t: number[]; core: number[]; spx: number[] }

let CSV_CACHE: Core22Series | null = null;

export function loadCore22Nav(): Core22Series {
  if (CSV_CACHE) return CSV_CACHE;
  const raw = readFileSync(path.join(process.cwd(), "data", "core22_nav.csv"), "utf-8");
  const lines = raw.trim().split(/\r?\n/);
  lines.shift(); // header: Date,Portfolio,SPX_buyhold
  const t: number[] = [], core: number[] = [], spx: number[] = [];
  for (const ln of lines) {
    const [d, p, s] = ln.split(",");
    if (!d || !p) continue;
    t.push(Math.floor(new Date(d + "T00:00:00Z").getTime() / 1000));
    core.push(parseFloat(p));
    spx.push(parseFloat(s));
  }
  CSV_CACHE = { t, core, spx };
  return CSV_CACHE;
}

// ── Yahoo daily history ─────────────────────────────────────────────────
// Yahoo returns monthly candles when `range=max`, but daily when we send
// explicit period1/period2 (Unix seconds). Cached 7 days on disk — the
// history doesn't move, only the last candle extends day-to-day.

const YAHOO_TTL = 7 * 24 * 60 * 60 * 1000;

async function fetchYahooDaily(symbol: string, sinceYear: number): Promise<{ t: number[]; close: number[] } | null> {
  const period1 = Math.floor(new Date(`${sinceYear}-01-01T00:00:00Z`).getTime() / 1000);
  const period2 = Math.floor(Date.now() / 1000);
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?period1=${period1}&period2=${period2}&interval=1d`;
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Harpian/1.0)" },
      cache: "no-store",
    });
    if (!r.ok) return null;
    const j = (await r.json()) as {
      chart?: { result?: [{ timestamp?: number[]; indicators?: { quote?: [{ close?: (number | null)[] }] } }] };
    };
    const res = j.chart?.result?.[0];
    const ts = res?.timestamp || [];
    const closes = res?.indicators?.quote?.[0]?.close || [];
    const t: number[] = [], close: number[] = [];
    for (let i = 0; i < ts.length; i++) {
      const c = closes[i];
      if (c == null) continue;
      t.push(ts[i]);
      close.push(c);
    }
    if (!t.length) return null;
    return { t, close };
  } catch {
    return null;
  }
}

async function loadYahoo(symbol: string, cacheKey: string, sinceYear: number): Promise<{ t: number[]; close: number[] } | null> {
  const cached = cacheGet<{ t: number[]; close: number[] }>(cacheKey, YAHOO_TTL);
  if (cached && cached.t?.length) return cached;
  const fresh = await fetchYahooDaily(symbol, sinceYear);
  if (fresh) cacheSet(cacheKey, fresh);
  return fresh;
}

// Align an external Yahoo series to the CSV's timeline, base-100 at the
// first date where the external series HAS data. Days before the external
// series began are marked as `null` (frontend/route drops them or plots
// nothing there — never fabricates a value).
function alignAndRebase(t: number[], hist: { t: number[]; close: number[] } | null): (number | null)[] | null {
  if (!hist || !hist.t.length) return null;
  const ht = hist.t, hc = hist.close;
  // Find the first CSV date >= the external history's first date.
  const historyStart = ht[0];
  const out: (number | null)[] = [];
  let hi = 0;
  let base: number | null = null;
  for (const target of t) {
    if (target < historyStart) {
      out.push(null);
      continue;
    }
    while (hi + 1 < ht.length && ht[hi + 1] <= target) hi++;
    const raw = hc[Math.min(hi, hc.length - 1)];
    if (base == null) base = raw;
    out.push(base ? (raw / base) * 100 : null);
  }
  return out;
}

// Aligns the Dow Jones (^DJI) — full daily history back to 1988.
export async function alignedDji(t: number[]): Promise<(number | null)[] | null> {
  const hist = await loadYahoo("^DJI", "dji_hist_full", 1988);
  return alignAndRebase(t, hist);
}

// Aligns the long-duration Treasuries ETF (TLT, iShares 20+ Year) — the
// most-referenced Treasury proxy. Note: TLT started trading in 2002-08-01,
// so windows starting before that will show a null head, not fabricated data.
export async function alignedTsy(t: number[]): Promise<(number | null)[] | null> {
  const hist = await loadYahoo("TLT", "tlt_hist_full", 2002);
  return alignAndRebase(t, hist);
}

// Kept for backwards-compat: any other screen still calling this gets Nasdaq
// aligned the old way (via the same generic helper).
export async function alignedNasdaq(t: number[]): Promise<(number | null)[] | null> {
  const hist = await loadYahoo("^IXIC", "nasdaq_hist_ixic_v2", 1988);
  return alignAndRebase(t, hist);
}

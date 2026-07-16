// CORE22+ backtest (1990-2026, base 100) + alignment of the real Nasdaq (Yahoo) using the
// SAME methodology — for an always-3-way comparison (CORE22+ vs S&P vs Nasdaq).
// The fund's official source is the CSV only (Portfolio/SPX_buyhold); the Nasdaq is our
// own comparative series, computed live from real data, never fabricated.
import { readFileSync } from "fs";
import path from "path";
import { yahooChart } from "./yahoo";
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

const NASDAQ_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days — history doesn't change, only the latest point extends

// Aligns the Nasdaq's daily close (^IXIC, real, Yahoo) to the backtest CSV's dates,
// rebased to 100 on the first date. "Aligning" = find the Nasdaq candle on the same date
// (or the most recent prior one, for holidays/gaps) and use that price.
export async function alignedNasdaq(t: number[]): Promise<number[] | null> {
  const cached = cacheGet<{ t: number[]; close: number[] }>("nasdaq_hist_ixic", NASDAQ_TTL);
  let hist = cached;
  if (!hist) {
    try {
      const { series } = await yahooChart("^IXIC", "max", "1d");
      hist = { t: series.t, close: series.close };
      cacheSet("nasdaq_hist_ixic", hist);
    } catch {
      return null;
    }
  }
  if (!hist || !hist.t.length) return null;

  const ht = hist.t, hc = hist.close;
  const out: number[] = [];
  let hi = 0;
  for (const target of t) {
    while (hi + 1 < ht.length && ht[hi + 1] <= target) hi++;
    out.push(hc[Math.min(hi, hc.length - 1)]);
  }
  const base = out[0];
  if (!base) return null;
  return out.map((v) => (v / base) * 100);
}

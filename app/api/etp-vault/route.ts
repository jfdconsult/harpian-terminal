import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── VERIFIED OPACITY PROTOCOL (VOP) ─────────────────────────────────────────
// This route is the SERVER-SIDE FILTER for the client-facing "The Vault" tab.
// It applies four disclosure rules — no exception, no query-param override:
//
//   1) VAULT      → aggregates only (counts, %, avg holding). Never tickers.
//   2) SHOWCASE   → sample of 3 CLOSED positions, closed ≥ 4 weeks ago.
//                   Rotates weekly (Mon 06:00 BRT). No history endpoint.
//   3) WEATHER    → regime state + defense weight + streak. No factor decomposition.
//   4) DO_NOT_TOUCH → 5 worst-momentum SPX500 + 2 sector alerts. Not ranked
//                     against the ETP's actual universe.
//
// Mock data for now — replace by real ETP book feed later. The disclosure rules
// themselves must survive that replacement: the filter is the moat.

// -- deterministic weekly rotation index (no Math.random, no Date.now cliffs) --
function isoWeekIndex(d: Date): number {
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return tmp.getUTCFullYear() * 100 + week;
}

// -- next Monday 06:00 America/Sao_Paulo, expressed as ISO in UTC --
function nextRotationISO(now: Date): string {
  // BRT = UTC-3 fixed. 06:00 BRT = 09:00 UTC.
  const d = new Date(now);
  const day = d.getUTCDay(); // 0=Sun, 1=Mon
  const daysUntilMon = day === 1 && d.getUTCHours() < 9 ? 0 : (8 - day) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + daysUntilMon);
  d.setUTCHours(9, 0, 0, 0);
  return d.toISOString();
}

// ── MOCK BOOK — closed positions pool (would be real feed) ─────────────────
// Only positions closed ≥ 28 days ago are eligible for the Showcase.
const CLOSED_POOL = [
  { ticker: "AAPL",  sector: "Technology",         entry: "2026-02-12", exit: "2026-03-31", holdingDays: 47, momentumEntry: 84, retPct: 12.3, retVsSpx: 7.1,  thesis: "Cycle upgrade + services margin inflection — closed at target." },
  { ticker: "MSFT",  sector: "Technology",         entry: "2026-01-08", exit: "2026-03-11", holdingDays: 62, momentumEntry: 79, retPct: 8.6,  retVsSpx: 3.2,  thesis: "Azure AI revenue acceleration + operating leverage — closed on regime shift." },
  { ticker: "NVDA",  sector: "Semiconductors",     entry: "2026-02-25", exit: "2026-03-27", holdingDays: 31, momentumEntry: 91, retPct: 23.4, retVsSpx: 18.2, thesis: "Data-center refresh cycle + guide raise — closed on momentum exhaustion." },
  { ticker: "COST",  sector: "Consumer Staples",   entry: "2025-12-18", exit: "2026-02-14", holdingDays: 58, momentumEntry: 76, retPct: 6.1,  retVsSpx: 4.3,  thesis: "Membership renewal + traffic acceleration — closed on relative-strength decay." },
  { ticker: "META",  sector: "Communications",     entry: "2026-01-22", exit: "2026-03-19", holdingDays: 56, momentumEntry: 82, retPct: 14.7, retVsSpx: 9.5,  thesis: "AI ad-targeting monetization + cost discipline — closed at technical resistance." },
  { ticker: "AVGO",  sector: "Semiconductors",     entry: "2026-01-05", exit: "2026-02-28", holdingDays: 54, momentumEntry: 88, retPct: 19.2, retVsSpx: 14.0, thesis: "Custom-silicon backlog + VMware synergies — closed on sector rotation." },
  { ticker: "LLY",   sector: "Healthcare",         entry: "2025-11-30", exit: "2026-02-05", holdingDays: 67, momentumEntry: 81, retPct: 11.8, retVsSpx: 8.4,  thesis: "GLP-1 supply constraint easing + label expansion — closed on valuation stretch." },
  { ticker: "V",     sector: "Financial Services", entry: "2026-01-15", exit: "2026-03-06", holdingDays: 50, momentumEntry: 77, retPct: 5.4,  retVsSpx: 1.9,  thesis: "Cross-border volume recovery + resilient consumer — closed on defensive rotation." },
];

function pickShowcase(now: Date) {
  const cutoff = new Date(now.getTime() - 28 * 86400_000);
  const eligible = CLOSED_POOL.filter((p) => new Date(p.exit) <= cutoff);
  const wk = isoWeekIndex(now);
  // deterministic rotation: three consecutive positions from a weekly-shifted offset
  const start = wk % eligible.length;
  return [0, 1, 2].map((i) => eligible[(start + i) % eligible.length]);
}

// ── MOCK DO NOT TOUCH — 5 worst momentum in SPX500 (would be real ranker) ──
const DNT_POOL = [
  { ticker: "WBA",  name: "Walgreens Boots Alliance", sector: "Consumer Staples", momentum: 8,  tag: "structural downtrend" },
  { ticker: "PARA", name: "Paramount Global",         sector: "Communications",   momentum: 11, tag: "earnings deterioration" },
  { ticker: "MMM",  name: "3M Company",               sector: "Industrials",      momentum: 14, tag: "legal-liability overhang" },
  { ticker: "F",    name: "Ford Motor",               sector: "Consumer Cyclical",momentum: 16, tag: "EV margin compression" },
  { ticker: "INTC", name: "Intel Corporation",        sector: "Semiconductors",   momentum: 18, tag: "share loss + capex burden" },
  { ticker: "BA",   name: "Boeing",                   sector: "Industrials",      momentum: 21, tag: "operational execution risk" },
  { ticker: "CVS",  name: "CVS Health",               sector: "Healthcare",       momentum: 23, tag: "PBM pressure + guide cut" },
];

const DNT_SECTORS = [
  { sector: "Regional Banks", momentum: 19, tag: "duration risk + deposit flight" },
  { sector: "Homebuilders",   momentum: 22, tag: "rate-sensitivity + affordability wall" },
];

function pickDnt(now: Date) {
  const wk = isoWeekIndex(now);
  const start = wk % (DNT_POOL.length - 4);
  return {
    stocks: DNT_POOL.slice(start, start + 5),
    sectors: DNT_SECTORS,
  };
}

export async function GET() {
  const now = new Date();

  // 1. VAULT — aggregates only. Would come from the real book.
  const vault = {
    n_positions: 42,
    n_hedges: 3,
    gross_exposure_pct: 87,
    net_exposure_pct: 84,
    beta: 1.02,
    avg_holding_days: 34,
    monthly_turnover_pct: 18,
    hit_rate_90d_pct: 68,
    aum_alloc_pct: 87,
  };

  // 2. SHOWCASE — 3 rotating positions, 4-week embargo
  const showcase = pickShowcase(now);

  // 3. WEATHER — regime state without the mechanism
  //    (in production, pull from /api/snapshot instead of hardcoding)
  const weather = {
    regime: "NEUTRO" as const,
    regime_label: "Neutral",
    defense_pct: 18,
    streak_days: 34,
    last_change: { date: "2026-06-18", from: "BULL", to: "NEUTRO", magnitude_sigma: 0.4 },
  };

  // 4. DO NOT TOUCH — 5 SPX500 worst momentum + 2 sectors
  const dnt = pickDnt(now);

  const res = NextResponse.json({
    ok: true,
    as_of: now.toISOString(),
    next_rotation: nextRotationISO(now),
    protocol: {
      name: "Verified Opacity Protocol",
      version: "v1",
      showcase_embargo_days: 28,
      showcase_size: 3,
      dnt_universe: "SPX500",
      rotation_ritual: "Monday 06:00 BRT",
    },
    vault,
    showcase,
    weather,
    dnt,
  });
  // block browser/proxy caching — VOP integrity depends on the server being authoritative
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return res;
}

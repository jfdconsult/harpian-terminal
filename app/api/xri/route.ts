import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Output folder for the XRI engine (sibling repo harpian-xri, xri-daily routine). Configurable via env.
const XRI_DIR = process.env.HARPIAN_XRI_SNAPSHOT_DIR || "C:\\dev\\harpian-xri\\data\\snapshots";

// ── CONFIDENTIALITY ─────────────────────────────────────────────────────────
// Same principle as app/api/snapshot/route.ts: this handler runs on the SERVER
// and is a WHITELIST. The "what" (score, state, direction, where-it-comes-from,
// confidence, plain-language validation) reaches the client. The "how" — turbulence,
// absorption_ratio_score, dy_material_to_us, dy_global, slow_prior,
// fast_market_stress, contribution_by_pillar, exposure_quality, weights a..e,
// versions, overlay_recommendation, data_quality_flags — NEVER leaves this file.

// NOTE: these labels are a cross-file contract (compared by equality in
// components/screens/Xri.tsx, components/XriGauge.tsx, lib/jim-market-analysis.ts,
// lib/xri.ts) and are kept in Portuguese here intentionally — translating them
// would silently break state/direction matching in those files.
const STATE_LABEL: Record<string, string> = { CALM: "BAIXO", WATCH: "MODERADO", STRESS: "ELEVADO", CRISIS: "CRÍTICO" };
const DIRECTION_LABEL: Record<string, string> = { heating: "subindo", cooling: "caindo", stable: "estável" };
const COUNTRY_PT: Record<string, string> = {
  japan: "Japan", china: "China", taiwan: "Taiwan", korea: "South Korea",
  euro_area: "Euro Area", uk: "United Kingdom", canada: "Canada", mexico: "Mexico",
  india: "India", gulf_energy: "Gulf/Energy", apac_other: "Asia-Pacific",
  latam_other: "Latin America", us: "United States",
};

interface XriRawSnapshot {
  asof_date: string;
  score: number;
  state: string;
  direction: string;
  confidence: number;
  contribution_by_country?: Record<string, number>;
  // Per-channel decomposition (how much each contributed to today's score).
  // This is the "ingredient label" — it names where the risk comes from. It is NOT
  // the formula: the raw values (turbulence, absorption, slow_prior, weights) stay
  // off the whitelist. This says "comes from fragility," not "how it's computed."
  frequency_decomposition?: {
    slow_prior_contribution?: number;
    fast_market_contribution?: number;
    fragility_contribution?: number;
    event_contribution?: number;
  };
  // Material transmission to the US — only enough to say whether the channel is
  // open or closed (qualitative), never the raw Diebold-Yilmaz value.
  dy_material_to_us?: number;
}

// Ingredient rule: names the channel, hides the formula's proportion.
const CHANNEL_PT: Record<string, { label: string; explain: string }> = {
  fragility: { label: "Structural fragility", explain: "the system is wired in a way that transmits shock, even without a shock happening today" },
  slow_prior: { label: "Macro prior (slow)", explain: "structural macro conditions — the backdrop, not today's scare" },
  fast_market: { label: "Market stress (fast)", explain: "short-term jitters in FX, rates, credit and volatility" },
  event: { label: "Events (narrative)", explain: "specific news and events that passed the filter" },
};
interface XriRawValidation {
  reconstruction: { start: string; end: string };
  anchor_events: { summary: { events_covered: number; events_hit_alert: number } };
}

function readJson<T>(dir: string, filename: string): T {
  return JSON.parse(readFileSync(join(dir, filename), "utf-8")) as T;
}

export async function GET() {
  try {
    const snap = readJson<XriRawSnapshot>(XRI_DIR, "xri_snapshot_latest.json");

    const drivers = Object.entries(snap.contribution_by_country || {})
      .filter(([k]) => k !== "us")
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([k, v]) => ({ country: COUNTRY_PT[k] || k, pct: Math.round(v) }));

    let validation: { years: number; events_covered: number; events_hit: number } | null = null;
    try {
      const v = readJson<XriRawValidation>(XRI_DIR, "xri_validation_latest.json");
      const years = new Date(v.reconstruction.end).getFullYear() - new Date(v.reconstruction.start).getFullYear();
      validation = { years, events_covered: v.anchor_events.summary.events_covered, events_hit: v.anchor_events.summary.events_hit_alert };
    } catch { /* validation is optional — proceed without it */ }

    // Named channels (ingredients): each one's normalized share of today's
    // score. Rounded to an integer — no raw formula value.
    const fd = snap.frequency_decomposition || {};
    const raw: [string, number][] = [
      ["fragility", fd.fragility_contribution || 0],
      ["slow_prior", fd.slow_prior_contribution || 0],
      ["fast_market", fd.fast_market_contribution || 0],
      ["event", fd.event_contribution || 0],
    ];
    const total = raw.reduce((s, [, v]) => s + v, 0) || 1;
    const channels = raw
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => ({ key: k, label: CHANNEL_PT[k].label, explain: CHANNEL_PT[k].explain, share: Math.round((v / total) * 100) }));

    // Transmission to the US: qualitative (open/closed), never the raw DY value.
    const dy = snap.dy_material_to_us;
    const transmission = dy == null ? null : (dy >= 0.5 ? "aberto" : "fechado");

    return NextResponse.json({
      ok: true,
      as_of: snap.asof_date,
      score: Math.round(snap.score),
      state: STATE_LABEL[snap.state] || snap.state,
      direction: DIRECTION_LABEL[snap.direction] || "estável",
      confidence_pct: Math.round(100 * snap.confidence),
      drivers,
      channels,       // named ingredients + share
      transmission,   // "aberto" | "fechado" | null (open/closed)
      validation,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, offline: true, error: String(e) }, { status: 200 });
  }
}

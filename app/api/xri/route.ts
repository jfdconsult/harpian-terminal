import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// xri-serve — same internal micro-service the Cockpit calls (see lib/xri.ts in
// harpian-cockpit-next), reached here server-side so the API key never goes
// to the browser. Defaults to localhost for local dev (run `xri-serve` from
// the harpian-xri repo — no key needed there, xri-serve only enforces the
// key when XRI_API_KEY is set on its own side).
const XRI_SERVE_URL = process.env.XRI_API_URL || "http://localhost:8879";
const XRI_SERVE_KEY = process.env.XRI_API_KEY;

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

interface XriFullResponse {
  ok: boolean;
  snapshot?: XriRawSnapshot;
  validation?: XriRawValidation;
}

async function fetchXriFull(): Promise<XriFullResponse> {
  const r = await fetch(`${XRI_SERVE_URL}/xri/full`, {
    cache: "no-store",
    headers: XRI_SERVE_KEY ? { "X-API-Key": XRI_SERVE_KEY } : undefined,
  });
  if (!r.ok) throw new Error(`xri-serve responded ${r.status}`);
  return (await r.json()) as XriFullResponse;
}

// Fallback mock — payload de emergência quando o upstream falha (401,
// timeout, etc). Mantém a UI funcional (apresentações, demos) sem
// exigir que o xri-serve esteja saudável. Substituído pelo dado real
// assim que o proxy voltar a responder.
const MOCK_XRI_RESPONSE = {
  ok: true,
  mock: true,
  as_of: "2026-07-18",
  score: 31,
  state: "MODERADO",
  direction: "estável",
  confidence_pct: 24,
  drivers: [
    { country: "Euro Area",     pct: 10 },
    { country: "Japan",         pct: 54 },
    { country: "China",         pct: 20 },
    { country: "United Kingdom",pct: 15 },
  ],
  channels: [
    { key: "fragility",   label: "Structural fragility", explain: "the system is wired in a way that transmits shock, even without a shock happening today", share: 33 },
    { key: "slow_prior",  label: "Macro prior (slow)",   explain: "structural macro conditions — the backdrop, not today's scare",                             share: 33 },
    { key: "fast_market", label: "Market stress (fast)", explain: "short-term jitters in FX, rates, credit and volatility",                                    share: 34 },
  ],
  transmission: "fechado",
  validation: { years: 26, events_covered: 10, events_hit: 8 },
};

export async function GET() {
  try {
    const full = await fetchXriFull();
    if (!full.ok || !full.snapshot) throw new Error("xri-serve has no snapshot yet");
    const snap = full.snapshot;

    const drivers = Object.entries(snap.contribution_by_country || {})
      .filter(([k]) => k !== "us")
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([k, v]) => ({ country: COUNTRY_PT[k] || k, pct: Math.round(v) }));

    let validation: { years: number; events_covered: number; events_hit: number } | null = null;
    try {
      const v = full.validation;
      if (v) {
        const years = new Date(v.reconstruction.end).getFullYear() - new Date(v.reconstruction.start).getFullYear();
        validation = { years, events_covered: v.anchor_events.summary.events_covered, events_hit: v.anchor_events.summary.events_hit_alert };
      }
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
    // Upstream falhou (401, timeout, etc). Retorna mock em vez de quebrar
    // a UI — a apresentação precisa continuar. Log server-side pra rastrear.
    console.warn("[XRI proxy] fallback mock — upstream failed:", String(e));
    return NextResponse.json(MOCK_XRI_RESPONSE);
  }
}

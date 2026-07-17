"use client";
import { useEffect, useState } from "react";
import { GOV_API } from "@/lib/data";
import { publishScreenData } from "@/lib/jim-data";
import { buildDna, type DnaRaw, type Driver } from "@/lib/jim-market-analysis";
import BackToVisao from "../BackToVisao";
import type { ScreenId } from "@/lib/nav";

interface RawCotRow { market: string; spec_net_pct_oi?: number; spec_sentiment?: string }

const COT_SHORT: Record<string, string> = {
  GOLD: "gold", SILVER: "silver", BITCOIN: "bitcoin", "EURO FX": "euro",
  "VIX FUTURES": "VIX", "JAPANESE YEN": "yen", "CRUDE OIL": "crude oil",
};
function cotShortName(market: string): string {
  const raw = market.split(" - ")[0].trim();
  return COT_SHORT[raw] || raw.toLowerCase();
}

// ---------- Types ----------
export interface IntelLayer {
  key: string;
  label: string;
  question: string;
  icon: string;
  score: number;
  status: "live" | "partial" | "planned";
  source: string;
  color: string;
  indicators: { name: string; value: string; color?: string }[];
}

interface JimInsight {
  headline: string;
  headlineColor: string;
  positives: string[];
  negatives: string[];
  alerts: string[];
  summary: string;
}

// ---------- Helpers ----------
function scoreColor(s: number): string {
  if (s >= 80) return "#E74C3C";
  if (s >= 65) return "#E67E22";
  if (s >= 45) return "#C9A02C";
  if (s >= 25) return "#4A90D9";
  return "#2ECC71";
}

function scoreLabel(s: number): string {
  if (s >= 80) return "EXTREME";
  if (s >= 65) return "HIGH";
  if (s >= 45) return "NEUTRAL";
  if (s >= 25) return "LOW";
  return "EXTREME LOW";
}

export function regimeLabel(avg: number): { label: string; color: string; icon: string } {
  if (avg >= 70) return { label: "RISK-ON", color: "#2ECC71", icon: "ti-trending-up" };
  if (avg >= 55) return { label: "CAUTIOUS", color: "#C9A02C", icon: "ti-alert-triangle" };
  if (avg >= 40) return { label: "MIXED", color: "#E67E22", icon: "ti-arrows-split" };
  return { label: "RISK-OFF", color: "#E74C3C", icon: "ti-shield-off" };
}

function generateJimInsight(layers: IntelLayer[]): JimInsight {
  const byKey = Object.fromEntries(layers.map((l) => [l.key, l]));
  const positives: string[] = [];
  const negatives: string[] = [];
  const alerts: string[] = [];

  const vol = byKey["volatility"]?.score ?? 50;
  const breadth = byKey["breadth"]?.score ?? 50;
  const sent = byKey["sentiment"]?.score ?? 50;
  const macro = byKey["macro"]?.score ?? 50;
  const pos = byKey["positioning"]?.score ?? 50;
  const liq = byKey["liquidity"]?.score ?? 50;
  const opt = byKey["options"]?.score ?? 50;

  // Macro
  if (macro >= 70) positives.push("Strong macro environment: normal yield curve and tight credit spreads. Conditions favor risk assets.");
  else if (macro >= 55) positives.push("Neutral-to-positive macro: reasonable conditions for risk exposure.");
  else if (macro < 35) negatives.push("Adverse macro: yield curve and/or credit spreads signal caution.");

  // Volatility
  if (vol <= 25) {
    positives.push("Very low volatility (compressed VIX). Complacent market.");
    alerts.push("A compressed VIX historically precedes sudden volatility expansions. Asymmetric risk of cheap protection.");
  } else if (vol <= 40) {
    positives.push("Low-to-moderate volatility. Environment favorable for directional positions.");
  } else if (vol >= 75) {
    negatives.push("Elevated volatility — market under stress. Risk of sharp moves.");
    alerts.push("VIX above 25 — consider reducing position size or hedging with options.");
  }

  // Breadth
  if (breadth >= 65) positives.push(`Healthy breadth: ${breadth}% of assets above the 200-day MA. Rally with broad participation.`);
  else if (breadth >= 50) positives.push(`Acceptable breadth: ${breadth}% above the 200-day MA. Moderate participation.`);
  else if (breadth < 35) negatives.push(`Weak breadth: only ${breadth}% above the 200-day MA. Narrow market — few assets carrying the index.`);

  // Sentiment
  if (sent >= 80) {
    negatives.push("Euphoric sentiment (Fear & Greed above 80). Historically a peak zone.");
    alerts.push("Extreme euphoria tends to precede corrections. Caution with new positions.");
  } else if (sent <= 25) {
    positives.push("Extreme pessimism (Fear & Greed below 25). Historically a contrarian opportunity zone.");
  } else if (sent <= 40) {
    positives.push("Sentiment in fear territory — could be an opportunity if fundamentals hold up.");
  } else if (sent >= 65) {
    negatives.push("Elevated sentiment. Optimism may be overextended.");
  }

  // Positioning
  if (pos >= 80) {
    negatives.push("Speculative positioning at a bullish extreme. Reversal risk if the flow shifts.");
    alerts.push("Extreme COT Index — hedge funds excessively long.");
  } else if (pos <= 20) {
    positives.push("Positioning at a bearish extreme. Potential for a significant rally if sentiment shifts.");
  }

  // Liquidity
  if (liq >= 65) positives.push("Healthy liquidity — volume and flow are sustaining the market.");
  else if (liq < 35) negatives.push("Low liquidity — risk of gaps and poor execution during stress moves.");

  // Options
  if (opt >= 75) alerts.push("Elevated skew suggests demand for protection — institutions buying puts.");
  else if (opt <= 25) alerts.push("Low skew and complacency in options. Cheap protection available.");

  // Build headline
  let headline: string;
  let headlineColor: string;
  const avg = Math.round(layers.reduce((s, l) => s + l.score, 0) / layers.length);

  if (avg >= 70 && negatives.length === 0) {
    headline = "Favorable scenario for risk. Fundamentals, liquidity, and sentiment aligned.";
    headlineColor = "#2ECC71";
  } else if (avg >= 55 && negatives.length <= 1) {
    headline = "Moderately positive scenario. Most indicators support risk exposure.";
    headlineColor = "#4A90D9";
  } else if (avg >= 40) {
    headline = positives.length > negatives.length
      ? "Mixed scenario with a positive bias. Conflicting signals across layers."
      : "Mixed scenario with alerts. Balance between positive and negative signals.";
    headlineColor = "#C9A02C";
  } else {
    headline = "Cautious scenario. Multiple indicators suggest reducing risk.";
    headlineColor = "#E74C3C";
  }

  const summaryParts: string[] = [];
  if (positives.length > 0) summaryParts.push(`${positives.length} positive signal(s)`);
  if (negatives.length > 0) summaryParts.push(`${negatives.length} negative signal(s)`);
  if (alerts.length > 0) summaryParts.push(`${alerts.length} alert(s)`);
  const summary = `JIM identifies ${summaryParts.join(", ")} across ${layers.filter(l => l.status !== "planned").length} active layers.`;

  return { headline, headlineColor, positives, negatives, alerts, summary };
}

// ---------- API Integration ----------
function fmtNum(v: number | null | undefined, dec = 1): string {
  if (v == null) return "—";
  return v.toFixed(dec);
}

function volScore(vix: number | null): number {
  if (vix == null) return 50;
  if (vix >= 35) return 95;
  if (vix >= 25) return 75;
  if (vix >= 20) return 55;
  if (vix >= 15) return 35;
  return 15;
}

function fgToScore(fg: number | null): number {
  if (fg == null) return 50;
  return Math.round(fg);
}

function breadthToScore(pct200: number | null): number {
  if (pct200 == null) return 50;
  return Math.round(pct200);
}

function macroScore(yieldSignal: string | null, creditSignal: string | null): number {
  let s = 50;
  if (yieldSignal === "Normal") s += 15;
  if (yieldSignal === "Inverted") s -= 20;
  if (creditSignal === "Tight") s += 15;
  if (creditSignal === "Normal") s += 5;
  if (creditSignal === "Wide") s -= 10;
  if (creditSignal === "Stress") s -= 25;
  return Math.max(0, Math.min(100, s));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildLayersFromApi(api: any): IntelLayer[] {
  const layers: IntelLayer[] = [];
  const apiLayers = api?.layers || {};

  // gov-data returns positioning.data as a LIST of COT markets (one per
  // contract), not as an aggregated object. We aggregate it here: spec_net_pct_oi ranges
  // from -100 (everyone short) to +100 (everyone long); we normalize it to
  // 0—100 with 50 = neutral, keeping the screen's convention (high = stretched).
  const cotRows: RawCotRow[] = Array.isArray(apiLayers.positioning?.data) ? apiLayers.positioning.data : [];
  const avgSpec = cotRows.length
    ? cotRows.reduce((s, r) => s + (r.spec_net_pct_oi ?? 0), 0) / cotRows.length
    : null;
  const cotScore = avgSpec != null ? Math.round(Math.max(0, Math.min(100, (avgSpec + 100) / 2))) : 50;
  const extremeRows = cotRows.filter((r) => (r.spec_sentiment || "").startsWith("EXTREME"));
  const stretched = cotRows.length
    ? [...cotRows].sort((a, b) => Math.abs(b.spec_net_pct_oi ?? 0) - Math.abs(a.spec_net_pct_oi ?? 0))[0]
    : null;
  layers.push({
    key: "positioning", label: "Positioning", question: "Who is long?",
    icon: "ti-users-group", score: cotScore,
    status: cotRows.length ? "live" : "planned",
    source: "CFTC COT (Commitments of Traders)", color: "#4A90D9",
    indicators: [
      { name: "Avg spec net", value: avgSpec != null ? `${avgSpec > 0 ? "+" : ""}${fmtNum(avgSpec)}% OI` : "—", color: cotScore >= 70 ? "#E67E22" : cotScore <= 30 ? "#4A90D9" : undefined },
      { name: "At extreme", value: cotRows.length ? `${extremeRows.length} of ${cotRows.length}` : "—", color: extremeRows.length >= 2 ? "#E67E22" : undefined },
      { name: "Most stretched", value: stretched ? `${cotShortName(stretched.market)} ${fmtNum(stretched.spec_net_pct_oi ?? 0, 0)}%` : "—" },
      { name: "Status", value: cotRows.length ? "Live" : "Planned", color: cotRows.length ? "#2ECC71" : "#7d96b3" },
    ],
  });

  const cboe = apiLayers.volatility?.data;
  const vix = cboe?.vix;
  const vScore = volScore(vix?.current);
  layers.push({
    key: "volatility", label: "Volatility", question: "What's the fear level?",
    icon: "ti-bolt", score: vScore,
    status: apiLayers.volatility ? "live" : "planned",
    source: "CBOE + Yahoo", color: "#E74C3C",
    indicators: [
      { name: "VIX", value: vix?.current != null ? fmtNum(vix.current) : "—", color: (vix?.current ?? 20) < 18 ? "#2ECC71" : (vix?.current ?? 20) > 25 ? "#E74C3C" : undefined },
      { name: "VVIX", value: cboe?.vvix != null ? fmtNum(cboe.vvix) : "—" },
      { name: "IV Rank", value: vix?.iv_rank != null ? `${fmtNum(vix.iv_rank)}%` : "—" },
      { name: "Term Structure", value: vix?.term_structure || "—", color: vix?.term_structure === "Contango" ? "#2ECC71" : "#E74C3C" },
    ],
  });

  layers.push({
    key: "options", label: "Options", question: "Is the market hedged?",
    icon: "ti-chart-dots-3", score: cboe ? Math.round(50 + (cboe.skew ? (cboe.skew - 130) / 2 : 0)) : 50,
    status: cboe ? "partial" : "planned",
    source: "CBOE", color: "#9B59B6",
    indicators: [
      { name: "Put/Call Ratio", value: cboe?.put_call?.put_call_ratio != null ? fmtNum(cboe.put_call.put_call_ratio, 2) : "—" },
      { name: "IV Rank", value: vix?.iv_rank != null ? `${fmtNum(vix.iv_rank)}%` : "—" },
      { name: "Skew", value: cboe?.skew != null ? fmtNum(cboe.skew, 0) : "—" },
      { name: "Regime", value: cboe?.regime || "—" },
    ],
  });

  const finra = apiLayers.liquidity?.data;
  const darkPct = finra?.summary?.dark_pool_pct;
  layers.push({
    key: "liquidity", label: "Liquidity", question: "Who's putting money in?",
    icon: "ti-droplet-half-2", score: finra ? (darkPct != null ? Math.round(100 - darkPct) : 55) : 50,
    status: apiLayers.liquidity ? "partial" : "planned",
    source: "FINRA ATS", color: "#1ABC9C",
    indicators: [
      { name: "Dark Pool %", value: darkPct != null ? `${fmtNum(darkPct)}%` : "—" },
      { name: "Tracked Symbols", value: finra?.summary?.tracked_symbols != null ? `${finra.summary.tracked_symbols}` : "—" },
      { name: "Demo", value: finra?.is_demo ? "Yes" : "No", color: finra?.is_demo ? "#E67E22" : "#2ECC71" },
      { name: "Source", value: finra?.source ? "FINRA" : "—" },
    ],
  });

  const breadthData = apiLayers.breadth?.data;
  const bScore = breadthToScore(breadthData?.pct_above_200ma);
  layers.push({
    key: "breadth", label: "Breadth", question: "Is the whole market up, or just a few names?",
    icon: "ti-chart-histogram", score: bScore,
    status: apiLayers.breadth ? "live" : "planned",
    source: "Yahoo (calculated)", color: "#3498DB",
    indicators: [
      { name: "% > 200MA", value: breadthData?.pct_above_200ma != null ? `${fmtNum(breadthData.pct_above_200ma)}%` : "—" },
      { name: "% > 50MA", value: breadthData?.pct_above_50ma != null ? `${fmtNum(breadthData.pct_above_50ma)}%` : "—" },
      { name: "A/D Ratio", value: breadthData?.ad_ratio != null ? fmtNum(breadthData.ad_ratio, 2) : "—", color: (breadthData?.ad_ratio ?? 1) > 1 ? "#2ECC71" : "#E74C3C" },
      { name: "Signal", value: breadthData?.breadth_signal || "—", color: breadthData?.breadth_signal === "Strong" ? "#2ECC71" : breadthData?.breadth_signal === "Healthy" ? "#4A90D9" : "#E67E22" },
    ],
  });

  const sentData = apiLayers.sentiment?.data;
  const fgScore = fgToScore(sentData?.score);
  layers.push({
    key: "sentiment", label: "Sentiment", question: "What is the market feeling?",
    icon: "ti-mood-smile", score: fgScore,
    status: apiLayers.sentiment ? "partial" : "planned",
    source: "CNN Fear & Greed", color: "#E67E22",
    indicators: [
      { name: "Fear & Greed", value: sentData?.score != null ? `${fmtNum(sentData.score, 0)} ${sentData.rating || ""}` : "—", color: (sentData?.score ?? 50) >= 75 ? "#E74C3C" : (sentData?.score ?? 50) <= 25 ? "#2ECC71" : undefined },
      { name: "Previous week", value: sentData?.previous_close != null ? fmtNum(sentData.previous_close, 0) : "—" },
      { name: "1 week ago", value: sentData?.week_ago != null ? fmtNum(sentData.week_ago, 0) : "—" },
      { name: "1 year ago", value: sentData?.year_ago != null ? fmtNum(sentData.year_ago, 0) : "—" },
    ],
  });

  const fred = apiLayers.macro?.data;
  const mScore = macroScore(fred?.yield_curve_signal, fred?.credit_signal);
  layers.push({
    key: "macro", label: "Macro", question: "Does the environment favor risk?",
    icon: "ti-building-bank", score: mScore,
    status: apiLayers.macro ? "live" : "planned",
    source: "FRED", color: "#7B68EE",
    indicators: [
      { name: "Fed Funds", value: fred?.series?.fed_funds?.value != null ? `${fmtNum(fred.series.fed_funds.value, 2)}%` : "—" },
      { name: "Yield Curve", value: fred?.yield_curve_spread != null ? `${fred.yield_curve_spread > 0 ? "+" : ""}${fmtNum(fred.yield_curve_spread * 100, 0)}bp` : "—", color: fred?.yield_curve_signal === "Normal" ? "#2ECC71" : "#E74C3C" },
      { name: "Credit Spread", value: fred?.credit_spread != null ? `${fmtNum(fred.credit_spread, 2)}%` : "—" },
      { name: "Policy", value: fred?.policy_stance || "—" },
    ],
  });

  return layers;
}

// Layers not yet built. They do NOT enter buildLayersFromApi: they used to
// be pushed with `score: 50, status: "planned"` and that invented 50
// fed into the Conviction average — the number at the top of the screen was part
// real data, part placeholder. Now they show up only as a declared roadmap, with no
// number, and don't contaminate any calculation.
export const ROADMAP_LAYERS: { label: string; source: string; question: string }[] = [
  { label: "Momentum", source: "AlphaDroid · TPT · DEMA", question: "Is the trend strong?" },
  { label: "Mkt Structure", source: "Yahoo (calculated)", question: "How are assets correlated?" },
  { label: "Risk Engine", source: "StormGuard · Risk Number", question: "Is Harpian protected?" },
];

// ---------- Components ----------

function ScoreBar({ score, color, h = 6 }: { score: number; color: string; h?: number }) {
  return (
    <div style={{ flex: 1, height: h, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 3, transition: "width .4s", opacity: 0.8 }} />
    </div>
  );
}

function LayerCard({ layer }: { layer: IntelLayer }) {
  const sc = scoreColor(layer.score);
  const statusBadge = layer.status === "live"
    ? { label: "LIVE", bg: "rgba(46,204,113,.12)", color: "#2ECC71" }
    : layer.status === "partial"
    ? { label: "PARTIAL", bg: "rgba(230,126,34,.10)", color: "#E67E22" }
    : { label: "PLANNED", bg: "rgba(125,150,179,.08)", color: "#7d96b3" };

  return (
    <div className="card" style={{ padding: "14px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <i className={`ti ${layer.icon}`} style={{ fontSize: 20, color: layer.color }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--tx)" }}>{layer.label}</span>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4,
          background: statusBadge.bg, color: statusBadge.color, fontFamily: "var(--mono)",
        }}>
          {statusBadge.label}
        </span>
      </div>

      {/* Question */}
      <div style={{ fontSize: 12, color: "var(--tx3)", marginBottom: 10, fontStyle: "italic" }}>
        {layer.question}
      </div>

      {/* Score */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <span style={{ fontSize: 36, fontWeight: 800, fontFamily: "var(--mono)", color: sc, lineHeight: 1 }}>
          {layer.score}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: sc, fontFamily: "var(--mono)", fontWeight: 700 }}>{scoreLabel(layer.score)}</span>
            <span style={{ fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mono)" }}>0—100</span>
          </div>
          <ScoreBar score={layer.score} color={sc} h={7} />
        </div>
      </div>

      {/* Indicators grid — BIGGER fonts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", marginBottom: 8 }}>
        {layer.indicators.map((ind) => (
          <div key={ind.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--tx3)" }}>{ind.name}</span>
            <span style={{ fontSize: 14, fontFamily: "var(--mono)", fontWeight: 700, color: ind.color || "var(--tx)" }}>
              {ind.value}
            </span>
          </div>
        ))}
      </div>

      {/* Source */}
      <div style={{ fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mono)", borderTop: "1px solid var(--line)", paddingTop: 6 }}>
        {layer.source}
      </div>
    </div>
  );
}

// default size 280 = compact version (Dashboard card). From 340 onward the radar
// switches to "large" mode: full label + score at the tip, bigger fonts.
export function RadarSvg({ layers, size = 280 }: { layers: IntelLayer[]; size?: number }) {
  const n = layers.length;
  const big = size >= 340;
  const cx = size / 2, cy = size / 2;
  // Extra padding around the radar so the vertex labels (now bigger, 11px vs. old 8px)
  // don't clip the SVG viewport on the small dashboard widget.
  const maxR = cx - (big ? 58 : 34);
  const angleStep = (2 * Math.PI) / n;

  const gridLevels = [20, 40, 60, 80, 100];
  const points = layers.map((l, i) => {
    const a = -Math.PI / 2 + i * angleStep;
    const r = (l.score / 100) * maxR;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });

  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", margin: "0 auto", maxWidth: "100%" }}>
      {gridLevels.map((lv) => (
        <circle key={lv} cx={cx} cy={cy} r={(lv / 100) * maxR}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={lv === 100 ? 1.5 : 1} />
      ))}
      {layers.map((l, i) => {
        const a = -Math.PI / 2 + i * angleStep;
        const ex = cx + maxR * Math.cos(a);
        const ey = cy + maxR * Math.sin(a);
        const lx = cx + (maxR + (big ? 24 : 16)) * Math.cos(a);
        const ly = cy + (maxR + (big ? 24 : 16)) * Math.sin(a);
        return (
          <g key={l.key}>
            <line x1={cx} y1={cy} x2={ex} y2={ey} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
            <text x={lx} y={big ? ly - 5 : ly} textAnchor="middle" dominantBaseline="middle"
              fill={l.color} fontSize={big ? 12 : 11} fontFamily="var(--mono)" fontWeight={700}>
              {big ? l.label.toUpperCase() : l.label.substring(0, 6).toUpperCase()}
            </text>
            {big && (
              <text x={lx} y={ly + 8} textAnchor="middle" dominantBaseline="middle"
                fill={scoreColor(l.score)} fontSize={10} fontFamily="var(--mono)" fontWeight={700}>
                {l.score}
              </text>
            )}
          </g>
        );
      })}
      <polygon points={polygon} fill="rgba(201,160,44,.12)" stroke="var(--gold)" strokeWidth={big ? 2.5 : 2} strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={big ? 5 : 4} fill={scoreColor(layers[i].score)} stroke="var(--bg1)" strokeWidth={2} />
      ))}
    </svg>
  );
}

// ---------- JIM's deep reading (cross-layer interpretation) ----------
const TONE_COLOR: Record<string, string> = { pos: "#2ECC71", neg: "#E74C3C", neu: "#4A90D9" };
const TONE_ICON: Record<string, string> = { pos: "ti-circle-check", neg: "ti-alert-circle", neu: "ti-info-circle" };

function DeepDriverRow({ d }: { d: Driver }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 9, alignItems: "flex-start" }}>
      <i className={`ti ${TONE_ICON[d.tone]}`} style={{ fontSize: 13, color: TONE_COLOR[d.tone], marginTop: 2, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--tx)", marginBottom: 1 }}>{d.label}</div>
        <div style={{ fontSize: 12.5, color: "var(--tx2)", lineHeight: 1.6 }}>{d.detail}</div>
      </div>
    </div>
  );
}

// JIM's single panel — occupies the right third, from the top down to the end of the
// indicator cards. Combines the deep reading (cross-layer interpretation)
// with the positive/negative signals and alerts.
function JimPanel({ raw, insight, avgScore, regime }: {
  raw: DnaRaw | null;
  insight: JimInsight;
  avgScore: number;
  regime: { label: string; color: string };
}) {
  const block = buildDna(raw);
  return (
    <div className="card" style={{ padding: "14px 18px", borderColor: "rgba(201,160,44,.25)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: "linear-gradient(135deg, #C9A02C 0%, #E6B800 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <i className="ti ti-brain" style={{ fontSize: 16, color: "#0a1628" }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)", fontFamily: "var(--mono)", letterSpacing: ".05em" }}>
            JIM INTELLIGENCE
          </div>
          <div style={{ fontSize: 10, color: "var(--tx3)" }}>Deep reading · where the layers contradict each other</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--mono)", color: scoreColor(avgScore) }}>{avgScore}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
            background: `${regime.color}18`, color: regime.color, fontFamily: "var(--mono)",
          }}>{regime.label}</span>
        </div>
      </div>

      {/* Headline */}
      <div style={{
        fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: insight.headlineColor,
        padding: "8px 12px", marginBottom: 8, borderRadius: 6,
        background: `${insight.headlineColor}10`, borderLeft: `3px solid ${insight.headlineColor}`,
      }}>{insight.headline}</div>

      {/* Body: grows together with the indicators column — all the text stays
          readable by scrolling the page, with no scrollbar of its own. */}
      <div style={{ flex: 1 }}>
        {block && (
          <>
            <div style={{
              fontSize: 12.5, fontWeight: 600, lineHeight: 1.5, color: "var(--tx)",
              padding: "7px 11px", marginBottom: 10, borderRadius: 6,
              background: "rgba(123,104,238,.10)", borderLeft: "3px solid #7B68EE",
            }}>{block.leitura}</div>

            {block.porque.map((d, i) => <DeepDriverRow key={i} d={d} />)}

            <div style={{ marginTop: 8, paddingTop: 10, borderTop: "1px solid var(--line)", marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--tx3)", fontFamily: "var(--mono)", letterSpacing: ".06em", marginBottom: 4 }}>
                <i className="ti ti-trending-up" style={{ fontSize: 11, marginRight: 4 }} />TREND
              </div>
              <div style={{ fontSize: 12.5, color: "var(--tx2)", lineHeight: 1.6, marginBottom: 10 }}>{block.tendencia}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gold)", fontFamily: "var(--mono)", letterSpacing: ".06em", marginBottom: 4 }}>
                <i className="ti ti-target-arrow" style={{ fontSize: 11, marginRight: 4 }} />HOW TO READ IT
              </div>
              <div style={{ fontSize: 12.5, color: "var(--tx2)", lineHeight: 1.6 }}>{block.impacto}</div>
            </div>
          </>
        )}

        {insight.positives.length > 0 && (
          <div style={{ paddingTop: 10, borderTop: "1px solid var(--line)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#2ECC71", fontFamily: "var(--mono)", marginBottom: 4, letterSpacing: ".06em" }}>
              <i className="ti ti-circle-check" style={{ fontSize: 12, marginRight: 4 }} />POSITIVE SIGNALS
            </div>
            {insight.positives.map((p, i) => (
              <div key={i} style={{ fontSize: 12.5, color: "var(--tx2)", lineHeight: 1.6, paddingLeft: 10, marginBottom: 3 }}>• {p}</div>
            ))}
          </div>
        )}

        {insight.negatives.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#E74C3C", fontFamily: "var(--mono)", marginBottom: 4, letterSpacing: ".06em" }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 12, marginRight: 4 }} />NEGATIVE SIGNALS
            </div>
            {insight.negatives.map((n, i) => (
              <div key={i} style={{ fontSize: 12.5, color: "var(--tx2)", lineHeight: 1.6, paddingLeft: 10, marginBottom: 3 }}>• {n}</div>
            ))}
          </div>
        )}

        {insight.alerts.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#E67E22", fontFamily: "var(--mono)", marginBottom: 4, letterSpacing: ".06em" }}>
              <i className="ti ti-alert-triangle" style={{ fontSize: 12, marginRight: 4 }} />ALERTS
            </div>
            {insight.alerts.map((a, i) => (
              <div key={i} style={{ fontSize: 12.5, color: "#E67E22", lineHeight: 1.6, paddingLeft: 10, marginBottom: 3 }}>⚠ {a}</div>
            ))}
          </div>
        )}
      </div>

      <div style={{ fontSize: 10, color: "var(--tx3)", fontStyle: "italic", borderTop: "1px solid var(--line)", paddingTop: 8, marginTop: 8 }}>
        {insight.summary}
      </div>
    </div>
  );
}

// ---------- Main ----------
export default function MarketDna({ go }: { go?: (id: ScreenId, param?: string) => void }) {
  // Starts empty, not with fake layers: the initial state (and the error
  // fallback) used to be buildFallbackLayers() — 10 layers with a score of 50 — which made
  // the screen show "Conviction 50 · CAUTIOUS" while gov-data was offline.
  const [layers, setLayers] = useState<IntelLayer[]>([]);
  const [raw, setRaw] = useState<DnaRaw | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    fetch(`${GOV_API}/api/market-dna`)
      .then((r) => r.json())
      .then((data) => { setRaw(data); setLayers(buildLayersFromApi(data)); setLoading(false); })
      .catch(() => { setErr(true); setLoading(false); });
  }, []);

  const avgScore = layers.length ? Math.round(layers.reduce((s, l) => s + l.score, 0) / layers.length) : 0;
  const liveCount = layers.filter((l) => l.status === "live").length;
  const partialCount = layers.filter((l) => l.status === "partial").length;
  const regime = regimeLabel(avgScore);
  const jimInsight = generateJimInsight(layers);

  useEffect(() => {
    publishScreenData(
      "market-dna",
      "Market DNA: market intelligence layers with real data (CFTC COT, CBOE, FINRA, Yahoo, CNN F&G, FRED). Score 0-100 per dimension; the average only considers layers with real data.",
      layers.map((l) => ({ camada: l.label, score: l.score, status: l.status, source: l.source })),
      {
        briefing:
          `Market DNA: **${layers.length} layers with real data**. Conviction **${avgScore}** (${regime.label}). ` +
          `${liveCount} live, ${partialCount} partial. ` +
          `Headline: ${jimInsight.headline}`,
        suggestions: [
          "Which layer is weakest right now?",
          "Is the market in Risk-On or Risk-Off?",
          "What contrarian signals exist?",
        ],
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avgScore, regime.label, liveCount, partialCount]);

  return (
    <div className="screen">
      <div className="crumb">Market &rsaquo; <b>Market DNA</b><BackToVisao go={go} /></div>
      <div className="flex between wrap" style={{ alignItems: "flex-start" }}>
        <div>
          <div className="h1">Market DNA</div>
          <div className="sub">
            {layers.length || "—"} layers with real data &middot; Score 0&ndash;100 per dimension &middot; Quantitative synthesis for allocation decisions
            {loading && <span style={{ marginLeft: 8, color: "#C9A02C" }}> Loading data...</span>}
          </div>
        </div>
      </div>

      {/* gov-data down: say we don't know, instead of showing 50 */}
      {!loading && (err || !layers.length) && (
        <div className="placeholder" style={{ marginTop: 12 }}>
          <i className="ti ti-cloud-off" />
          <b style={{ display: "block", marginTop: 8 }}>Market DNA unavailable</b>
          <div className="muted" style={{ marginTop: 4 }}>
            gov-data offline &mdash; <span style={{ fontFamily: "var(--mono)" }}>api_server.py</span> (port 8877).
            I'd rather not show a Conviction score than show a number that didn't come from the sources.
          </div>
        </div>
      )}

      {!loading && !err && layers.length > 0 && (<>
      {/* Top summary strip */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", padding: "10px 0", marginBottom: 8, borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 32, fontWeight: 800, fontFamily: "var(--mono)", color: scoreColor(avgScore) }}>
            {avgScore}
          </span>
          <span style={{ fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mono)" }}>CONVICTION</span>
        </div>
        <span style={{
          fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 5,
          background: `${regime.color}18`, color: regime.color, fontFamily: "var(--mono)",
        }}>
          <i className={`ti ${regime.icon}`} style={{ fontSize: 14, marginRight: 5 }} />
          {regime.label}
        </span>
        <span style={{ width: 1, height: 22, background: "var(--line)" }} />
        <span style={{ fontSize: 12, fontFamily: "var(--mono)", color: "#2ECC71" }}>{liveCount} LIVE</span>
        <span style={{ fontSize: 12, fontFamily: "var(--mono)", color: "#E67E22" }}>{partialCount} PARTIAL</span>
        <span style={{ fontSize: 10, color: "var(--tx3)", marginLeft: "auto" }}>
          Conviction = average of the {layers.length} layers with real data
        </span>
      </div>

      {/* Three thirds: radar | score per layer | JIM. The first two thirds
          form the left column — charts at the top, and the indicator cards
          in 2 columns below. JIM occupies the entire right third and
          tracks the height of the indicators: scroll the page and it follows alongside. */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, alignItems: "stretch" }}>
        {/* Left two thirds */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Top: radar (1/3) + score per layer (1/3) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "stretch" }}>
            <div className="card" style={{ padding: 12, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--tx2)", marginBottom: 6, fontFamily: "var(--mono)", letterSpacing: ".06em" }}>
                INTELLIGENCE RADAR
              </div>
              <RadarSvg layers={layers} size={380} />
            </div>

            <div className="card" style={{ padding: "12px 16px", display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--tx2)", marginBottom: 10, fontFamily: "var(--mono)", letterSpacing: ".06em" }}>
                SCORE PER LAYER
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1, justifyContent: "center" }}>
                {[...layers].sort((a, b) => b.score - a.score).map((l) => (
                  <div key={l.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <i className={`ti ${l.icon}`} style={{ fontSize: 15, color: l.color, width: 20, textAlign: "center" }} />
                    <span style={{ fontSize: 13, color: "var(--tx)", width: 92, flexShrink: 0 }}>{l.label}</span>
                    <ScoreBar score={l.score} color={scoreColor(l.score)} h={7} />
                    <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--mono)", color: scoreColor(l.score), width: 30, textAlign: "right" }}>
                      {l.score}
                    </span>
                    <span style={{
                      fontSize: 9, fontFamily: "var(--mono)", padding: "2px 6px", borderRadius: 3, flexShrink: 0,
                      background: l.status === "live" ? "rgba(46,204,113,.12)" : l.status === "partial" ? "rgba(230,126,34,.10)" : "rgba(125,150,179,.08)",
                      color: l.status === "live" ? "#2ECC71" : l.status === "partial" ? "#E67E22" : "#7d96b3",
                    }}>
                      {l.status === "live" ? "LIVE" : l.status === "partial" ? "PART" : "PLAN"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Below: the indicators (the numbers) in 2 columns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {layers.map((l) => <LayerCard key={l.key} layer={l} />)}
          </div>
        </div>

        {/* Right third: JIM, from the top to the end of the indicators */}
        <JimPanel raw={raw} insight={jimInsight} avgScore={avgScore} regime={regime} />
      </div>

      {/* Declared roadmap — no number, doesn't count toward anything */}
      <div className="card" style={{ marginTop: 12, padding: "10px 14px", borderStyle: "dashed" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--tx3)", fontFamily: "var(--mono)", letterSpacing: ".06em", marginBottom: 6 }}>
          <i className="ti ti-tools" style={{ fontSize: 12, marginRight: 5 }} />UNDER CONSTRUCTION — NOT YET INCLUDED IN CONVICTION
        </div>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          {ROADMAP_LAYERS.map((r) => (
            <div key={r.label} style={{ fontSize: 11, color: "var(--tx3)" }}>
              <b style={{ color: "var(--tx2)" }}>{r.label}</b> — {r.question} <span style={{ fontFamily: "var(--mono)", fontSize: 9 }}>({r.source})</span>
            </div>
          ))}
        </div>
      </div>

      <div className="legend mt">
        <i><b style={{ background: "#2ECC71" }} />Live (real data)</i>
        <i><b style={{ background: "#E67E22" }} />Partial</i>
        <span className="muted" style={{ marginLeft: "auto" }}>Sources: CFTC COT &middot; CBOE &middot; FINRA &middot; Yahoo &middot; CNN F&amp;G &middot; FRED &middot; SEC</span>
      </div>
      </>)}
    </div>
  );
}

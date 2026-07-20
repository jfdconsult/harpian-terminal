"use client";
import { useEffect, useState } from "react";
import { GOV_API, fmtN, cotShortName } from "@/lib/data";
import { publishScreenData } from "@/lib/jim-data";

// ---------- Types ----------
interface CotMarket {
  market: string;
  date?: string;
  spec_sentiment: string;
  spec_net: number;
  spec_net_pct_oi?: number;
  comm_net: number;
  comm_net_pct_oi?: number;
  open_interest: number;
}

interface LegacyRow {
  market: string;
  date: string;
  spec_net: number;
  comm_net: number;
  open_interest: number;
  spec_long: number;
  spec_short: number;
  comm_long: number;
  comm_short: number;
}

interface CotIndexData {
  market: string;
  index: number;
  specNet: number;
  commNet: number;
  nonreptNet: number;
  oi: number;
  date: string;
  specPctOi: number;
  commPctOi: number;
  signal: string;
  weekChange: number;
}

// ---------- Helpers ----------
const ASSET_CLASS: Record<string, string> = {
  "S&P 500": "Equity", "E-Mini S&P": "Equity", "NASDAQ 100": "Equity",
  Gold: "Metal", Silver: "Metal", Copper: "Metal",
  "Crude Oil WTI": "Energy", "Natural Gas": "Energy",
  "US T-Bonds": "Rates", "10Y Treasury": "Rates", "2Y Treasury": "Rates",
  "Yen (JPY)": "FX", "Euro (EUR)": "FX",
  Bitcoin: "Crypto", VIX: "Volatility",
};

const CLASS_COLOR: Record<string, string> = {
  Equity: "#4A90D9", Metal: "#C9A02C", Energy: "#E67E22",
  Rates: "#7B68EE", FX: "#2ECC71", Crypto: "#F39C12", Volatility: "#E74C3C",
};

function cotIndex(current: number, low: number, high: number): number {
  if (high === low) return 50;
  return Math.round(((current - low) / (high - low)) * 100);
}

function cotSignal(idx: number): { label: string; color: string; bg: string; desc: string } {
  if (idx >= 80) return { label: "EXTREME HIGH", color: "#E74C3C", bg: "rgba(231,76,60,.12)", desc: "Speculator positioning at an extreme high — historically a contrarian signal (bearish)" };
  if (idx >= 65) return { label: "HIGH", color: "#E67E22", bg: "rgba(230,126,34,.10)", desc: "Speculators heavily long — reversal risk if momentum weakens" };
  if (idx >= 35) return { label: "NEUTRAL", color: "#7d96b3", bg: "rgba(125,150,179,.08)", desc: "Balanced positioning — no directional signal from COT" };
  if (idx >= 20) return { label: "LOW", color: "#4A90D9", bg: "rgba(74,144,217,.10)", desc: "Speculators reducing positions — watch for a contrarian opportunity (bullish)" };
  return { label: "EXTREME LOW", color: "#2ECC71", bg: "rgba(46,204,113,.12)", desc: "Speculator positioning at an extreme low — historically a contrarian signal (bullish)" };
}

function computeCotData(legacy: LegacyRow[]): CotIndexData[] {
  const byMarket = new Map<string, LegacyRow[]>();
  for (const r of legacy) {
    const arr = byMarket.get(r.market) || [];
    arr.push(r);
    byMarket.set(r.market, arr);
  }

  const result: CotIndexData[] = [];
  for (const [market, rows] of byMarket) {
    if (rows.length < 2) continue;
    const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date));
    const latest = sorted[0];
    const prev = sorted[1];
    const specNets = sorted.map((r) => r.spec_net);
    const low = Math.min(...specNets);
    const high = Math.max(...specNets);
    const idx = cotIndex(latest.spec_net, low, high);
    const nonreptNet = latest.open_interest - (latest.spec_long + latest.spec_short + latest.comm_long + latest.comm_short);
    const oi = latest.open_interest || 1;
    const sig = cotSignal(idx);

    result.push({
      market: cotShortName(market),
      index: idx,
      specNet: latest.spec_net,
      commNet: latest.comm_net,
      nonreptNet,
      oi: latest.open_interest,
      date: latest.date,
      specPctOi: Math.round((latest.spec_net / oi) * 1000) / 10,
      commPctOi: Math.round((latest.comm_net / oi) * 1000) / 10,
      signal: sig.label,
      weekChange: latest.spec_net - prev.spec_net,
    });
  }

  return result.sort((a, b) => b.index - a.index);
}

// No DEMO_DATA: this screen used to render 15 fabricated COT markets
// (S&P, gold, yen, VIX...) with a made-up index/signal whenever gov-data
// went down. CFTC data or nothing.

// ---------- Components ----------

function CotBar({ value }: { value: number }) {
  const sig = cotSignal(value);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mono)", width: 14 }}>0</span>
      <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, position: "relative" }}>
        <div style={{ width: `${value}%`, height: "100%", background: `${sig.color}50`, borderRadius: 4, transition: "width .3s" }} />
        <div style={{
          position: "absolute", left: `${value}%`, top: -2, width: 3, height: 12,
          background: sig.color, borderRadius: 2, transform: "translateX(-1px)",
          transition: "left .3s",
        }} />
      </div>
      <span style={{ fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mono)", width: 22, textAlign: "right" }}>100</span>
    </div>
  );
}

function NetBar({ label, value, pct, color }: { label: string; value: number; pct: number; color: string }) {
  const barW = Math.min(Math.abs(pct) * 2, 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, lineHeight: "20px" }}>
      <span style={{ color, width: 38, flexShrink: 0, fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600 }}>{label}</span>
      <span style={{ fontFamily: "var(--mono)", fontSize: 13, color, minWidth: 72, textAlign: "right", fontWeight: 600 }}>{value >= 0 ? "+" : ""}{fmtN(value)}</span>
      <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.04)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${barW}%`, height: "100%", background: color, borderRadius: 3, transition: "width .3s" }} />
      </div>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--tx2)", minWidth: 44, textAlign: "right" }}>{pct > 0 ? "+" : ""}{pct.toFixed(1)}%</span>
    </div>
  );
}

function MarketCard({ d }: { d: CotIndexData }) {
  const sig = cotSignal(d.index);
  const cls = ASSET_CLASS[d.market] || "Equity";
  const clsColor = CLASS_COLOR[cls] || "#7d96b3";
  const isExtreme = d.index >= 80 || d.index <= 20;

  return (
    <div className="card" style={{
      border: isExtreme ? `1px solid ${sig.color}40` : undefined,
      boxShadow: isExtreme ? `0 0 12px ${sig.color}15` : undefined,
      padding: "12px 14px",
      transition: "border-color .2s, box-shadow .2s",
    }}>
      {/* Header: name + class + signal */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--tx)" }}>{d.market}</span>
          <span style={{ fontSize: 9, fontFamily: "var(--mono)", padding: "2px 6px", borderRadius: 3, background: `${clsColor}20`, color: clsColor, letterSpacing: ".04em" }}>{cls.toUpperCase()}</span>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 4,
          background: sig.bg, color: sig.color, fontFamily: "var(--mono)", letterSpacing: ".04em",
        }}>
          {sig.label}
        </span>
      </div>

      {/* COT Index number + WoW */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 36, fontWeight: 800, fontFamily: "var(--mono)", color: sig.color, lineHeight: 1 }}>{d.index}</span>
          <span style={{ fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mono)", letterSpacing: ".06em" }}>COT INDEX</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, fontFamily: "var(--mono)", fontWeight: 700, color: d.weekChange >= 0 ? "var(--green)" : "var(--red)" }}>
            {d.weekChange >= 0 ? "▲" : "▼"} {d.weekChange >= 0 ? "+" : ""}{fmtN(d.weekChange)}
          </div>
          <div style={{ fontSize: 9, color: "var(--tx3)", fontFamily: "var(--mono)" }}>WoW SPEC NET</div>
        </div>
      </div>

      {/* Horizontal COT bar */}
      <CotBar value={d.index} />

      {/* Net positions by participant */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 10 }}>
        <NetBar label="SPEC" value={d.specNet} pct={d.specPctOi} color="#4A90D9" />
        <NetBar label="COMM" value={d.commNet} pct={d.commPctOi} color="#C9A02C" />
        <NetBar label="NONR" value={d.nonreptNet} pct={Math.round((d.nonreptNet / (d.oi || 1)) * 1000) / 10} color="#7d96b3" />
      </div>

      {/* Footer: OI + date */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 5, borderTop: "1px solid var(--line)" }}>
        <span style={{ fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mono)" }}>OI {fmtN(d.oi)}</span>
        <span style={{ fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mono)" }}>{d.date}</span>
      </div>

      {/* Extreme contrarian alert */}
      {isExtreme && (
        <div style={{ fontSize: 11, color: sig.color, marginTop: 6, lineHeight: 1.5, padding: "7px 10px", background: sig.bg, borderRadius: 6 }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 12, marginRight: 4 }} />
          {sig.desc}
        </div>
      )}
    </div>
  );
}

// ---------- Filters ----------
const CLASSES = ["All", "Equity", "Metal", "Energy", "Rates", "FX", "Crypto", "Volatility"];

// ---------- Main ----------
export default function CotSentiment() {
  const [data, setData] = useState<CotIndexData[]>([]);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [showEdu, setShowEdu] = useState(false);

  useEffect(() => {
    fetch(`${GOV_API}/api/cot/legacy?weeks=156`)
      .then((r) => r.json())
      .then((rows: LegacyRow[]) => {
        setData(computeCotData(rows));
        setOffline(false);
        setLoading(false);
      })
      .catch(() => {
        setData([]);
        setOffline(true);
        setLoading(false);
      });
  }, []);

  const filtered = filter === "All" ? data : data.filter((d) => (ASSET_CLASS[d.market] || "") === filter);

  const extremes = data.filter((d) => d.index >= 80 || d.index <= 20);
  const avgIdx = data.length ? Math.round(data.reduce((s, d) => s + d.index, 0) / data.length) : 50;

  // Publishes COT positioning to JIM (extremes = contrarian signals).
  useEffect(() => {
    if (data.length === 0) return;
    const extremosTxt = extremes
      .map((d) => `${d.market} ${d.index} (${d.index >= 80 ? "bearish" : "bullish"})`)
      .join(", ");
    publishScreenData(
      "cot-sentiment",
      "COT Intelligence (CFTC): COT Index 0-100 per market. >80 = extreme high (contrarian bearish signal); <20 = extreme low (contrarian bullish signal). Groups: Large Specs (smart money), Commercials (hedgers), Nonreportable (retail). 3-business-day lag.",
      data.map((d) => ({
        mercado: d.market, cotIndex: d.index, sinal: d.signal,
        specNet: d.specNet, commNet: d.commNet, oi: d.oi, variacaoSemana: d.weekChange, data: d.date,
      })),
      {
        briefing:
          `You're looking at COT for ${data.length} markets (average index **${avgIdx}**). ` +
          (extremes.length
            ? `**${extremes.length} at an extreme** (contrarian signal): ${extremosTxt}.`
            : "No market at an extreme right now."),
        suggestions: [
          extremes.length ? "Which markets are at an extreme and what does it mean?" : "Is any market close to an extreme?",
          "Where is the smart money positioned?",
          "How do I use COT in a decision?",
        ],
      }
    );
  }, [data, extremes, avgIdx]);

  return (
    <div className="screen">
      <div className="flex between wrap" style={{ alignItems: "flex-start", gap: 10 }}>
        <div className="flex" style={{ alignItems: "baseline", gap: 14, flexWrap: "wrap", flex: 1 }}>
          <div className="h1" style={{ margin: 0 }}>COT Intelligence</div>
          <div className="sub" style={{ margin: 0 }}>
            CFTC Commitments of Traders · normalized COT Index (3y) · positioning as leading indicator.
            {offline && <span style={{ color: "var(--orange)", marginLeft: 8 }}> — gov-data offline (8877)</span>}
          </div>
        </div>
        <button
          className="btn ghost" style={{ fontSize: 11, padding: "6px 12px" }}
          onClick={() => setShowEdu(!showEdu)}
        >
          <i className={`ti ${showEdu ? "ti-chevron-up" : "ti-book"}`} />
          {showEdu ? "Close" : "What is COT?"}
        </button>
      </div>

      {showEdu && (
        <div className="card" style={{ marginTop: 10, borderColor: "rgba(201,160,44,.2)" }}>
          <h3 style={{ margin: "0 0 8px" }}><i className="ti ti-school" />Commitment of Traders — Quick Guide</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontSize: 12, lineHeight: 1.7, color: "var(--tx2)" }}>
            <div>
              <div style={{ fontWeight: 600, color: "var(--tx)", marginBottom: 4 }}>The 3 groups</div>
              <div><span style={{ color: "#C9A02C" }}>Commercials (Hedgers)</span> — Producers and consumers who use futures to hedge their actual business activity. Typically on the opposite side of the market.</div>
              <div style={{ marginTop: 6 }}><span style={{ color: "#4A90D9" }}>Large Speculators</span> — Funds, CTAs and institutions trading for profit. Considered the &ldquo;smart money&rdquo; in trends, but crowded at the extremes.</div>
              <div style={{ marginTop: 6 }}><span style={{ color: "#7d96b3" }}>Nonreportable</span> — Small traders. Historically on the wrong side at turning points.</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "var(--tx)", marginBottom: 4 }}>COT Index (0-100)</div>
              <div>Normalizes speculator net positioning within a 3-year range. Formula: <span style={{ fontFamily: "var(--mono)", fontSize: 10 }}>(Net - Min) / (Max - Min) × 100</span></div>
              <div style={{ marginTop: 6 }}><span style={{ color: "#E74C3C" }}>Above 80</span> — Extreme high. Historically a <b>contrarian</b> signal: correction risk.</div>
              <div style={{ marginTop: 3 }}><span style={{ color: "#2ECC71" }}>Below 20</span> — Extreme low. Historically a <b>contrarian</b> signal: buying opportunity.</div>
              <div style={{ marginTop: 6, fontSize: 11, color: "var(--tx3)" }}>
                <i className="ti ti-alert-circle" style={{ fontSize: 12, marginRight: 3 }} />
                COT has a 3-business-day lag, doesn&apos;t show an entry price, and is NOT a standalone trigger. Use it as a conviction adjuster alongside trend, momentum and volatility.
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="muted" style={{ padding: 30, textAlign: "center" }}>Loading CFTC data…</div>
      )}

      {!loading && (offline || !data.length) && (
        <div className="placeholder" style={{ marginTop: 12 }}>
          <i className="ti ti-cloud-off" />
          <b style={{ display: "block", marginTop: 8 }}>COT unavailable</b>
          <div className="muted" style={{ marginTop: 4 }}>
            gov-data offline — <span style={{ fontFamily: "var(--mono)" }}>api_server.py</span> (port 8877).
            I&apos;d rather show nothing than show positioning that didn&apos;t come from the CFTC.
          </div>
        </div>
      )}

      {!loading && !offline && data.length > 0 && (<>
      {/* Compact summary + extremes — single strip */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "8px 0", marginBottom: 6, borderBottom: "1px solid var(--line)" }}>
        <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--tx3)" }}>
          Average index <b style={{ color: cotSignal(avgIdx).color, fontSize: 13 }}>{avgIdx}</b>
        </span>
        <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--tx3)" }}>
          {data.length} markets
        </span>
        <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: extremes.length ? "var(--orange)" : "var(--tx3)" }}>
          {extremes.length} extreme{extremes.length !== 1 ? "s" : ""}
        </span>
        <span style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--tx3)" }}>
          CFTC {data[0]?.date || "—"}
        </span>
        {extremes.length > 0 && (
          <>
            <span style={{ width: 1, height: 16, background: "var(--line)" }} />
            {extremes.map((d) => {
              const sig = cotSignal(d.index);
              return (
                <span key={d.market} style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 4, fontFamily: "var(--mono)",
                  background: sig.bg, color: sig.color,
                }}>
                  {d.market} {d.index} {d.index >= 80 ? "↑" : "↓"}
                </span>
              );
            })}
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex" style={{ gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {CLASSES.map((c) => (
          <button key={c} onClick={() => setFilter(c)} style={{
            fontSize: 10, padding: "4px 10px", borderRadius: 6, cursor: "pointer",
            fontFamily: "var(--mono)", letterSpacing: ".04em",
            border: `1px solid ${filter === c ? "rgba(201,160,44,.4)" : "var(--line2)"}`,
            background: filter === c ? "rgba(201,160,44,.15)" : "transparent",
            color: filter === c ? "var(--gold)" : "var(--tx3)",
          }}>
            {c === "All" ? `ALL (${data.length})` : `${c.toUpperCase()} (${data.filter((d) => (ASSET_CLASS[d.market] || "") === c).length})`}
          </button>
        ))}
      </div>

      {/* Grid of cards — 3 columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {filtered.map((d) => <MarketCard key={d.market} d={d} />)}
      </div>

      <div className="legend mt">
        <i><b style={{ background: "#4A90D9" }} />Speculators (Large Specs)</i>
        <i><b style={{ background: "#C9A02C" }} />Commercials (Hedgers)</i>
        <i><b style={{ background: "#7d96b3" }} />Nonreportable</i>
        <span className="muted" style={{ marginLeft: "auto" }}>CFTC Commitments of Traders · Harpian analysis · public data · leading indicator</span>
      </div>
      </>)}
    </div>
  );
}

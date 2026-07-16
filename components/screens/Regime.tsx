"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { fetchSnapshot, type RegimeState } from "@/lib/snapshot";
import { fetchNews, IMPACT_COLOR, type NewsHeadline } from "@/lib/feeds";
import { GOV_API } from "@/lib/data";
import { pctText, pctClass, numShort, num } from "@/lib/format";
import { publishScreenData } from "@/lib/jim-data";
import { buildAri, type DnaRaw } from "@/lib/jim-market-analysis";
import { fetchCalendar, type CalendarResp } from "@/lib/calendar";
import BackToVisao from "../BackToVisao";
import JimBlock from "../JimBlock";
import type { ScreenId } from "@/lib/nav";
import type { Studies } from "./AssetChart";
import type { CandlesResp, AssetResp } from "@/lib/types";

const AssetChart = dynamic(() => import("./AssetChart"), { ssr: false });

// gov-data returns `layers` as an OBJECT ({volatility, sentiment, breadth,
// macro, positioning...}), not as a list. This screen read it as a list, so
// the DNA panel kept falling back to "offline" even with the feed running.

const REGIME_LABEL: Record<string, string> = { BULL: "RISK-ON", CAUTELA: "CAUTION", NEUTRO: "NEUTRAL", BEAR: "RISK-OFF" };
const REGIME_COLOR: Record<string, string> = { BULL: "#2ECC71", CAUTELA: "#F39C12", NEUTRO: "#4A90D9", BEAR: "#E74C3C" };
const REGIME_DESC: Record<string, string> = {
  BULL: "Favorable environment — full exposure, defense on standby",
  CAUTELA: "Signs of deterioration — reducing risk, defense activating",
  NEUTRO: "No dominant trend — moderate exposure, close monitoring",
  BEAR: "Adverse environment — defense active, reduced exposure",
};

const RANGES = [{ k: "3mo", l: "3M" }, { k: "6mo", l: "6M" }, { k: "1y", l: "1Y" }, { k: "2y", l: "2Y" }, { k: "5y", l: "5Y" }];
const INDS: { key: keyof Studies; label: string }[] = [
  { key: "ema", label: "EMA" }, { key: "bb", label: "Bollinger" }, { key: "vol", label: "Volume" },
  { key: "rsi", label: "RSI" }, { key: "momD", label: "Momentum D" }, { key: "momJ", label: "Momentum J" },
];

// Calendar: real data via /api/calendar (Investing.com). It used to be a
// fixed array whose dates had already passed — and JIM's narrative would
// state CALENDAR[0] as the "next relevant event", always wrong.

interface DnaScore { label: string; score: number; color: string; detail: string }

function buildDnaScores(dna: DnaRaw | null): DnaScore[] {
  const L = dna?.layers;
  if (!L) return [];
  const scores: DnaScore[] = [];

  const vol = L.volatility?.data;
  const vix = vol?.vix?.current;
  if (vix != null) {
    const s = vix < 15 ? 85 : vix < 20 ? 70 : vix < 25 ? 50 : vix < 30 ? 30 : 15;
    scores.push({ label: "Volatility", score: s, color: s > 60 ? "#2ECC71" : s > 40 ? "#F39C12" : "#E74C3C", detail: `VIX ${vix.toFixed(1)} (${vol?.regime || "N/A"})` });
  }
  const fg = L.sentiment?.data?.score;
  if (fg != null) {
    scores.push({ label: "Sentiment", score: Math.round(fg), color: fg > 60 ? "#2ECC71" : fg > 40 ? "#F39C12" : "#E74C3C", detail: `Fear & Greed ${fg.toFixed(0)} (${L.sentiment?.data?.rating || "—"})` });
  }
  const breadth = L.breadth?.data?.pct_above_200ma;
  if (breadth != null) {
    scores.push({ label: "Breadth", score: Math.round(breadth), color: breadth > 60 ? "#2ECC71" : breadth > 40 ? "#F39C12" : "#E74C3C", detail: `${breadth.toFixed(0)}% above MA200` });
  }
  const curve = L.macro?.data?.yield_curve_spread;
  if (curve != null) {
    const s = curve > 0.5 ? 80 : curve > 0 ? 65 : curve > -0.5 ? 35 : 15;
    scores.push({ label: "Macro & Rates", score: s, color: s > 60 ? "#2ECC71" : s > 40 ? "#F39C12" : "#E74C3C", detail: `Curve ${curve > 0 ? "+" : ""}${(curve * 100).toFixed(0)}bps · credit ${L.macro?.data?.credit_signal || "—"}` });
  }
  const cot = L.positioning?.data;
  if (cot?.length) {
    const ext = cot.filter((r) => (r.spec_sentiment || "").startsWith("EXTREME")).length;
    const s = Math.round(100 - (ext / cot.length) * 100);
    scores.push({ label: "Positioning", score: s, color: s > 60 ? "#2ECC71" : s > 40 ? "#F39C12" : "#E74C3C", detail: `${ext} of ${cot.length} markets at extreme` });
  }
  return scores;
}

function generateJimMarketAnalysis(regime: RegimeState, asset: AssetResp | null, dna: DnaRaw | null, news: NewsHeadline[], cal: CalendarResp | null): string {
  const parts: string[] = [];

  const regLabel = REGIME_LABEL[regime];
  parts.push(`The market regime is **${regLabel}**. ${REGIME_DESC[regime]}.`);

  if (asset) {
    parts.push(`The S&P 500 trades at ${numShort(asset.price)} (${pctText(asset.dayPct)} today, ${pctText(asset.ytdPct)} year-to-date). RSI at ${num(asset.rsi, 0)} — ${(asset.rsi ?? 50) > 70 ? "overbought, caution warranted" : (asset.rsi ?? 50) < 30 ? "oversold, possible reversal" : "neutral zone"}.`);
    if (asset.maxDD) parts.push(`Maximum drawdown of ${pctText(asset.maxDD)} over the last 12 months, Sharpe ${num(asset.sharpe, 2)}.`);
  }

  const L = dna?.layers;
  if (L) {
    const vix = L.volatility?.data?.vix?.current;
    const fg = L.sentiment?.data?.score;
    const breadth = L.breadth?.data?.pct_above_200ma;
    if (vix != null) parts.push(`VIX at ${vix.toFixed(1)} — ${vix < 20 ? "low volatility, favorable environment for risk" : vix < 30 ? "moderate volatility, monitor" : "high volatility, heightened caution"}.`);
    if (fg != null) parts.push(`Fear & Greed Index at ${fg.toFixed(0)} — ${fg > 75 ? "extreme greed: historically precedes corrections" : fg > 55 ? "moderate optimism" : fg > 40 ? "neutral sentiment" : fg > 25 ? "fear: possible contrarian opportunity" : "extreme fear: historically precedes recoveries"}.`);
    if (breadth != null) parts.push(`Breadth: ${breadth.toFixed(0)}% of the S&P 500 above the MA200 — ${breadth > 70 ? "broad participation, healthy rally" : breadth > 50 ? "reasonable participation" : "narrow participation, concentration risk"}.`);
  }

  if (news.length > 0) {
    const topNews = news.filter(n => n.impact === "Market Moving" || n.impact === "High").slice(0, 2);
    if (topNews.length) {
      parts.push(`Today's highlights: "${topNews[0].headline.slice(0, 80)}".`);
    }
  }

  const calNext = (cal?.events || []).find((e) => e.importance === 3) || (cal?.events || [])[0];
  if (calNext) {
    parts.push(`Next relevant event: **${calNext.event}** on ${calNext.date} (${calNext.time})${calNext.forecast ? `, forecast ${calNext.forecast}` : ""}.`);
  }

  return parts.join(" ");
}

export default function Regime({ go }: { go?: (id: ScreenId, param?: string) => void }) {
  const [regime, setRegime] = useState<RegimeState>("BULL");
  const [asOf, setAsOf] = useState("");
  const [range, setRange] = useState("1y");
  const [studies, setStudies] = useState<Studies>({ ema: true, bb: false, vol: true, rsi: false, momD: true, momJ: false });
  const [cd, setCd] = useState<CandlesResp | null>(null);
  const [asset, setAsset] = useState<AssetResp | null>(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartErr, setChartErr] = useState(false);
  const [dna, setDna] = useState<DnaRaw | null>(null);
  const [news, setNews] = useState<NewsHeadline[]>([]);
  const [cal, setCal] = useState<CalendarResp | null>(null);

  useEffect(() => {
    fetchSnapshot().then((s) => { if (s.ok && s.regime) { setRegime(s.regime.state); setAsOf(s.as_of || ""); } });
    fetch(`${GOV_API}/api/market-dna`).then(r => r.json()).then((d: DnaRaw) => setDna(d)).catch(() => {});
    fetchNews().then(d => setNews(d.headlines || [])).catch(() => {});
    fetchCalendar().then(setCal).catch(() => setCal({ ok: false, events: [] }));
  }, []);

  useEffect(() => {
    fetch(`/api/asset?symbol=${encodeURIComponent("^GSPC")}`).then(r => r.json()).then(j => { if (!j.error) setAsset(j); }).catch(() => {});
  }, []);

  useEffect(() => {
    setChartLoading(true); setChartErr(false);
    fetch(`/api/candles?symbol=${encodeURIComponent("^GSPC")}&range=${range}&interval=1d`)
      .then(r => r.json())
      .then((j: CandlesResp) => { if (j.error) setChartErr(true); else setCd(j); setChartLoading(false); })
      .catch(() => { setChartErr(true); setChartLoading(false); });
  }, [range]);

  const toggle = (k: keyof Studies) => setStudies(s => ({ ...s, [k]: !s[k] }));
  const dnaScores = buildDnaScores(dna);
  const jimText = generateJimMarketAnalysis(regime, asset, dna, news, cal);
  // Detail on "why the regime is like this" — lives here, not in the summary.
  const ariBlock = buildAri(regime, asset, dna);
  const topNews = news.filter(n => n.impact === "Market Moving" || n.impact === "High").slice(0, 5);
  const regColor = REGIME_COLOR[regime];

  useEffect(() => {
    publishScreenData("regime",
      "Consolidated Market screen: S&P 500 chart, regime, market DNA, economic calendar, news, and JIM analysis.",
      { regime: REGIME_LABEL[regime], sp500: asset?.price, dayPct: asset?.dayPct, rsi: asset?.rsi, dnaScores: dnaScores.length },
      {
        briefing: jimText,
        suggestions: ["What is the market DNA signaling?", "What could change the regime?", "Which economic events are relevant this week?"],
      }
    );
  }, [regime, asset, dnaScores.length]);

  return (
    <div className="screen">
      <div className="crumb">Market › <b>ARI · American Regime Index</b><BackToVisao go={go} /></div>

      {/* Header */}
      <div className="flex between" style={{ alignItems: "center", marginBottom: 8 }}>
        <div className="flex" style={{ alignItems: "baseline", gap: 14 }}>
          <div className="flex" style={{ alignItems: "baseline", gap: 8 }}>
            <div className="h1" style={{ margin: 0 }}>Market</div>
            <span className="tag b" style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 11 }} title="American Regime Index — domestic counterpart to XRI (External Risk)">ARI</span>
          </div>
          <span className="muted" style={{ fontSize: 10 }}>S&P 500 + regime + intelligence{asOf && <> · {asOf}</>}</span>
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px",
          borderRadius: 6, border: `1px solid ${regColor}40`, background: `${regColor}15`,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: regColor, boxShadow: `0 0 6px ${regColor}60` }} />
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: regColor }}>{REGIME_LABEL[regime]}</span>
        </div>
      </div>

      {/* Top strip: 4 metric cards + JIM, same height */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "stretch" }}>
        <div className="card" style={{ padding: "10px 14px", minWidth: 0 }}>
          <div className="muted" style={{ fontSize: 10 }}>S&P 500</div>
          <div className="big" style={{ fontSize: 22 }}>{numShort(asset?.price)}</div>
          <div className={`muted ${pctClass(asset?.dayPct)}`} style={{ fontSize: 11 }}>{asset ? pctText(asset.dayPct) + " today" : "…"}</div>
        </div>
        <div className="card" style={{ padding: "10px 14px", minWidth: 0 }}>
          <div className="muted" style={{ fontSize: 10 }}>YTD</div>
          <div className={`big ${asset && (asset.ytdPct ?? 0) >= 0 ? "g" : "r"}`} style={{ fontSize: 22 }}>{pctText(asset?.ytdPct)}</div>
        </div>
        <div className="card" style={{ padding: "10px 14px", minWidth: 0 }}>
          <div className="muted" style={{ fontSize: 10 }}>RSI (14)</div>
          <div className="big" style={{ fontSize: 22, color: (asset?.rsi ?? 50) > 70 ? "var(--red)" : (asset?.rsi ?? 50) < 30 ? "var(--green)" : "var(--tx)" }}>{asset?.rsi != null ? num(asset.rsi, 0) : "…"}</div>
          <div className="muted" style={{ fontSize: 10 }}>{(asset?.rsi ?? 50) > 70 ? "overbought" : (asset?.rsi ?? 50) < 30 ? "oversold" : "neutral"}</div>
        </div>
        <div className="card" style={{ padding: "10px 14px", minWidth: 0 }}>
          <div className="muted" style={{ fontSize: 10 }}>Max DD · Sharpe</div>
          <div className="big r" style={{ fontSize: 22 }}>{pctText(asset?.maxDD)}</div>
          <div className="muted" style={{ fontSize: 10 }}>Sharpe {num(asset?.sharpe, 2)}</div>
        </div>

        {/* JIM ao lado dos cards, mesma altura */}
        <div style={{
          flex: 1, minWidth: 0,
          background: "var(--panel)",
          border: "1px solid var(--line2)",
          borderRadius: 8, padding: "10px 14px", position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--gold), rgba(201,160,44,0.2), var(--gold))" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, var(--gold), #B8860B)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 10px rgba(201,160,44,0.25)",
            }}>
              <i className="ti ti-brain" style={{ fontSize: 14, color: "#0C1930" }} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--tx)" }}>JIM — Market Analysis</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: "var(--tx)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" as const }}>{jimText}</div>
        </div>
      </div>

      {/* Layout: chart + side panel (DNA + Calendar + News) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 8 }}>
        {/* S&P 500 chart */}
        <div className="card" style={{ padding: "8px 10px" }}>
          <div className="flex between wrap" style={{ gap: 4, marginBottom: 4 }}>
            <div className="seg" style={{ margin: 0 }}>{RANGES.map(r => <span key={r.k} className={range === r.k ? "on" : ""} onClick={() => setRange(r.k)}>{r.l}</span>)}</div>
            <div className="flex wrap" style={{ gap: 3 }}>
              {INDS.map(ind => (
                <button key={ind.key} onClick={() => toggle(ind.key)}
                  style={{ fontFamily: "var(--mono)", fontSize: 9, padding: "2px 6px", borderRadius: 4, cursor: "pointer",
                    border: `1px solid ${studies[ind.key] ? "rgba(201,160,44,.4)" : "var(--line2)"}`,
                    background: studies[ind.key] ? "rgba(201,160,44,.15)" : "transparent",
                    color: studies[ind.key] ? "var(--gold)" : "var(--tx3)" }}>
                  {ind.label}
                </button>
              ))}
            </div>
          </div>
          {chartErr ? (
            <div className="placeholder"><i className="ti ti-cloud-off" /><b>Error loading S&P 500</b></div>
          ) : chartLoading || !cd ? (
            <div className="muted" style={{ padding: 40, textAlign: "center" }}>Loading…</div>
          ) : (
            <AssetChart candles={cd.candles} volume={cd.volume} studies={studies} />
          )}
          <div className="legend" style={{ marginTop: 2 }}>
            <i><b style={{ background: "#4A90D9" }} />EMA</i>
            <span className="muted" style={{ marginLeft: "auto", fontSize: 9 }}>S&P 500 · Yahoo Finance</span>
          </div>
        </div>

        {/* Side panel: DNA + Calendar + News */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Market DNA */}
          <div className="card" style={{ padding: "8px 12px" }}>
            <h3 style={{ cursor: "pointer", marginBottom: 4, fontSize: 11 }} onClick={() => go?.("market-dna")}>
              <i className="ti ti-dna" />Market DNA<i className="ti ti-arrow-right" style={{ fontSize: 10, marginLeft: "auto", opacity: 0.4 }} />
            </h3>
            {dnaScores.length > 0 ? dnaScores.map((s, i) => (
              <div key={i} style={{ marginBottom: 5 }}>
                <div className="flex between" style={{ marginBottom: 2 }}>
                  <span style={{ fontSize: 10, color: "var(--tx2)" }}>{s.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: s.color }}>{s.score}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{ width: `${s.score}%`, height: "100%", borderRadius: 2, background: s.color, transition: "width 0.5s" }} />
                </div>
              </div>
            )) : (
              <div className="muted" style={{ fontSize: 10, padding: "4px 0" }}>
                Gov-data offline — <span style={{ fontFamily: "var(--mono)" }}>api_server.py</span> (8877)
              </div>
            )}
          </div>

          {/* Economic Calendar — real data (/api/calendar) */}
          <div className="card" style={{ padding: "8px 12px" }}>
            <h3 style={{ marginBottom: 4, fontSize: 11 }}><i className="ti ti-calendar-event" />Calendar</h3>
            {cal === null ? (
              <div className="muted" style={{ fontSize: 10, padding: "4px 0" }}>Loading…</div>
            ) : !cal.ok || !cal.events.length ? (
              <div className="muted" style={{ fontSize: 10, padding: "4px 0" }}>Calendar unavailable right now.</div>
            ) : (
              cal.events.slice(0, 5).map((ev, i) => (
                <div key={i} className="flex between" style={{ marginBottom: 3, alignItems: "baseline", gap: 6 }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: 10.5, color: "var(--tx)" }}>{ev.event}</span>
                    {ev.importance === 3 && <span style={{ fontSize: 7, color: "#E74C3C", fontWeight: 700, marginLeft: 4, textTransform: "uppercase" }}>high</span>}
                  </div>
                  <span style={{ fontSize: 9.5, color: "var(--gold)", fontFamily: "var(--mono)", whiteSpace: "nowrap" }}>{ev.date} {ev.time}</span>
                </div>
              ))
            )}
          </div>

          {/* News */}
          <div className="card" style={{ padding: "8px 12px", flex: 1 }}>
            <h3 style={{ cursor: "pointer", marginBottom: 4, fontSize: 11 }} onClick={() => go?.("news-broadcast")}>
              <i className="ti ti-broadcast" />News<i className="ti ti-arrow-right" style={{ fontSize: 10, marginLeft: "auto", opacity: 0.4 }} />
            </h3>
            {topNews.length > 0 ? topNews.slice(0, 4).map((n, i) => (
              <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" style={{
                display: "block", fontSize: 12, color: "var(--tx2)", marginBottom: 6, lineHeight: 1.4,
                textDecoration: "none", borderLeft: `2px solid ${IMPACT_COLOR[n.impact] || "var(--line2)"}`, paddingLeft: 8,
              }}>
                {n.headline.slice(0, 80)}{n.headline.length > 80 ? "…" : ""}
                <span style={{ fontSize: 10, color: "var(--tx3)", marginLeft: 4 }}>{n.source}</span>
              </a>
            )) : (
              <div className="muted" style={{ fontSize: 10, padding: "4px 0" }}>Backend offline (8080)</div>
            )}
          </div>
        </div>
      </div>

      {/* Detail: why the ARI is in this regime. Lives here, not in the summary. */}
      <div style={{ marginTop: 8 }}>
        <JimBlock block={ariBlock} />
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { publishScreenData } from "@/lib/jim-data";
import type { GrowthSeries } from "./GrowthChart";
import type { DefensePeriod } from "./JourneyChart";

const JourneyChart = dynamic(() => import("./JourneyChart"), { ssr: false });

const PERIODS = [
  { k: "ytd", l: "YTD" },
  { k: "1y", l: "1Y" },
  { k: "5y", l: "5Y" },
  { k: "2016", l: "10Y" },
  { k: "2006", l: "20Y" },
  { k: "2000", l: "Since 2000" },
];

type Pt = { time: number; value: number };

interface Resp {
  years: number;
  core: Pt[];
  spx: Pt[];
  dji: Pt[] | null;
  tsy: Pt[] | null;
  coreReturn: number;
  spxReturn: number;
  djiReturn: number | null;
  tsyReturn: number | null;
  coreCagr: number;
  spxCagr: number;
  djiCagr: number | null;
  tsyCagr: number | null;
  tsyNote: string | null;
  error?: boolean;
}

function fmtPct(v: number | null): string {
  if (v == null) return "—";
  const sign = v > 0 ? "+" : "";
  const abs = Math.abs(v);
  if (abs >= 1000) return `${sign}${(v / 1000).toFixed(1)}k%`;
  return `${sign}${v.toFixed(1)}%`;
}

function fmtMult(a: number, b: number): string {
  if (b === 0) return "—";
  return `${(a / b).toFixed(2)}x`;
}

// Cumulative-return curve of CORE22+ vs S&P 500 vs Dow Jones vs long-duration
// Treasuries (TLT). All lines start at 100 on the window's first date. Defense
// shows up as gentler valleys during 2008/2020/2022; the fund's edge is the
// height of the curve at the end, not the shape of individual dips.
export default function RiskJourney() {
  const [period, setPeriod] = useState("5y");
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [defense, setDefense] = useState<DefensePeriod[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/core-growth?period=${period}`)
      .then((r) => r.json())
      .then((j: Resp) => { setData(j.error ? null : j); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  // Fixed historical periods — fetch once
  useEffect(() => {
    fetch("/api/etp-defense-periods")
      .then((r) => r.json())
      .then((j: { ok: boolean; periods: DefensePeriod[] }) => { if (j.ok) setDefense(j.periods); })
      .catch(() => {});
  }, []);

  const series: (GrowthSeries & { defenseAware?: boolean })[] = [];
  if (data?.core) series.push({ name: "CORE22+", color: "#C9A02C", data: data.core, defenseAware: true });
  if (data?.spx) series.push({ name: "S&P 500", color: "#E74C3C", data: data.spx });
  if (data?.dji && data.dji.length) series.push({ name: "Dow Jones", color: "#4A90D9", data: data.dji });
  if (data?.tsy && data.tsy.length) series.push({ name: "Treasuries (TLT)", color: "#16A085", data: data.tsy });

  useEffect(() => {
    if (!data || data.error) return;
    const periodLabel = PERIODS.find((p) => p.k === period)?.l || period;
    publishScreenData(
      "fundo",
      "Risk & Journey tab: cumulative return curve of CORE22+ vs S&P 500 vs Dow Jones vs long-duration Treasuries (TLT), base 100. The wider gap = the fund's edge.",
      {
        period: periodLabel, years: data.years,
        coreReturn: data.coreReturn, spxReturn: data.spxReturn,
        djiReturn: data.djiReturn, tsyReturn: data.tsyReturn,
        coreCagr: data.coreCagr, spxCagr: data.spxCagr,
        djiCagr: data.djiCagr, tsyCagr: data.tsyCagr,
      },
      {
        briefing:
          `Cumulative return (${periodLabel}, ${data.years}y): CORE22+ ${fmtPct(data.coreReturn)} (CAGR ${fmtPct(data.coreCagr)}) ` +
          `vs S&P 500 ${fmtPct(data.spxReturn)} (CAGR ${fmtPct(data.spxCagr)})` +
          (data.djiReturn != null ? ` vs Dow ${fmtPct(data.djiReturn)} (CAGR ${fmtPct(data.djiCagr)})` : "") +
          (data.tsyReturn != null ? ` vs Treasuries (TLT) ${fmtPct(data.tsyReturn)} (CAGR ${fmtPct(data.tsyCagr)}).` : "."),
        suggestions: [
          "How much of the edge comes from defense in 2008 / 2020?",
          "How does the compounded return translate into ending capital?",
          "What's the CAGR gap vs. the S&P 500?",
        ],
      }
    );
  }, [data, period]);

  return (
    <div className="card">
      <div className="flex between wrap mb" style={{ gap: 10 }}>
        <h3 style={{ margin: 0 }}><i className="ti ti-trending-up" />The journey, visualized · cumulative return (base 100)</h3>
        <div className="seg" style={{ margin: 0 }}>
          {PERIODS.map((p) => <span key={p.k} className={period === p.k ? "on" : ""} onClick={() => setPeriod(p.k)}>{p.l}</span>)}
        </div>
      </div>
      <div className="muted mb" style={{ lineHeight: 1.6 }}>
        Everyone starts at 100. The line that ends highest is the one that compounded the most. Defense shows up as a shallower valley in crises — 2008, 2020, 2022 — not as fewer wiggles. Log scale so the S&amp;P and Dow remain readable next to CORE22+.
        {data?.tsyNote && <span className="muted" style={{ display: "block", fontSize: 11, marginTop: 4 }}>Note: {data.tsyNote}</span>}
      </div>
      {loading ? (
        <div className="muted" style={{ padding: 70, textAlign: "center" }}>Loading curve…</div>
      ) : series.length ? (
        <JourneyChart series={series} defensePeriods={defense} height={380} />
      ) : (
        <div className="placeholder"><i className="ti ti-cloud-off" /><b>Curve unavailable</b></div>
      )}

      {data && (
        <div className="grid g3" style={{ gap: 12, marginTop: 14 }}>
          <div className="kpi kpi-compact" style={{ borderLeft: "3px solid #C9A02C" }}>
            <div className="l">CORE22+ · ending capital of $100</div>
            <div className="v" style={{ color: "#C9A02C" }}>${(100 * (1 + data.coreReturn / 100)).toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
            <div className="s">Total return {fmtPct(data.coreReturn)} · CAGR {fmtPct(data.coreCagr)} over {data.years}y</div>
          </div>
          <div className="kpi kpi-compact" style={{ borderLeft: "3px solid #E74C3C" }}>
            <div className="l">S&P 500 · ending capital of $100</div>
            <div className="v" style={{ color: "#E74C3C" }}>${(100 * (1 + data.spxReturn / 100)).toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
            <div className="s">Total return {fmtPct(data.spxReturn)} · CAGR {fmtPct(data.spxCagr)}</div>
          </div>
          <div className="kpi kpi-compact" style={{ borderLeft: "3px solid var(--gold)" }}>
            <div className="l">Edge · CORE22+ vs S&P 500</div>
            <div className="v" style={{ color: "var(--gold)" }}>{fmtMult(100 * (1 + data.coreReturn / 100), 100 * (1 + data.spxReturn / 100))}</div>
            <div className="s">{fmtPct(data.coreCagr - data.spxCagr)} annualized · compounded over {data.years}y</div>
          </div>
        </div>
      )}

      <div className="legend" style={{ marginTop: 12 }}>
        <i><b style={{ background: "#C9A02C" }} />CORE22+ {data ? `(${fmtPct(data.coreReturn)})` : ""}</i>
        <i><b style={{ background: "#F39C12" }} />CORE22+ · Defense armed</i>
        <i><b style={{ background: "#E74C3C" }} />S&P 500 {data ? `(${fmtPct(data.spxReturn)})` : ""}</i>
        {data?.djiReturn != null && <i><b style={{ background: "#4A90D9" }} />Dow Jones ({fmtPct(data.djiReturn)})</i>}
        {data?.tsyReturn != null && <i><b style={{ background: "#16A085" }} />Treasuries · TLT ({fmtPct(data.tsyReturn)})</i>}
        <span className="muted" style={{ marginLeft: "auto" }}>CORE22+/S&amp;P: official backtest · Dow (^DJI) & TLT: our comparison (Yahoo, real data) · base 100 · log scale</span>
      </div>
    </div>
  );
}

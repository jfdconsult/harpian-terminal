"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { publishScreenData } from "@/lib/jim-data";
import type { DDSeries } from "./DrawdownChart";

const DrawdownChart = dynamic(() => import("./DrawdownChart"), { ssr: false });

const PERIODS = [
  { k: "ytd", l: "YTD" },
  { k: "1y", l: "1Y" },
  { k: "5y", l: "5Y" },
  { k: "2016", l: "10Y" },
  { k: "2006", l: "20Y" },
  { k: "2000", l: "Since 2000" },
];

interface Resp {
  core: { time: number; value: number }[];
  spx: { time: number; value: number }[];
  nasdaq: { time: number; value: number }[] | null;
  maxCore: number;
  maxSpx: number;
  maxNasdaq: number | null;
  error?: boolean;
}

// Underwater curve of the CORE22+ vs S&P backtest (same series, base 100, 1990-2026).
export default function RiskJourney() {
  const [period, setPeriod] = useState("5y");
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/core-drawdown?period=${period}`)
      .then((r) => r.json())
      .then((j: Resp) => { setData(j.error ? null : j); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const series: DDSeries[] = [];
  if (data?.core) series.push({ name: "CORE22+", color: "#C9A02C", data: data.core, fill: true });
  if (data?.spx) series.push({ name: "S&P 500", color: "#E74C3C", data: data.spx, fill: false });
  if (data?.nasdaq) series.push({ name: "Nasdaq", color: "#7B68EE", data: data.nasdaq, fill: false });

  // Publishes the drawdown curve (risk journey) for the selected period to JIM.
  useEffect(() => {
    if (!data || data.error) return;
    const periodLabel = PERIODS.find((p) => p.k === period)?.l || period;
    publishScreenData(
      "fundo",
      "Risk & Journey tab of the fund: underwater curve (drawdown vs. prior peak) of CORE22+ vs S&P 500 vs Nasdaq, backtest + real data, base 100.",
      { periodo: periodLabel, drawdownMaximoCore: data.maxCore, drawdownMaximoSpx: data.maxSpx, drawdownMaximoNasdaq: data.maxNasdaq },
      {
        briefing:
          `You're looking at the drawdown curve (${periodLabel}): CORE22+ with a max of ${data.maxCore}% vs S&P 500 ${data.maxSpx}%` +
          (data.maxNasdaq != null ? ` vs Nasdaq ${data.maxNasdaq}%.` : "."),
        suggestions: [
          "What does this drawdown curve mean?",
          "How long does it take to recover from a drop like this?",
          "Why does Nasdaq fall more than the S&P?",
        ],
      }
    );
  }, [data, period]);

  return (
    <div className="card">
      <div className="flex between wrap mb" style={{ gap: 10 }}>
        <h3 style={{ margin: 0 }}><i className="ti ti-wave-sine" />The journey, visualized · underwater curve (drawdown vs. prior peak)</h3>
        <div className="seg" style={{ margin: 0 }}>
          {PERIODS.map((p) => <span key={p.k} className={period === p.k ? "on" : ""} onClick={() => setPeriod(p.k)}>{p.l}</span>)}
        </div>
      </div>
      <div className="muted mb" style={{ lineHeight: 1.6 }}>
        Maximum drawdown is a snapshot, not a movie: it shows how much capital fell, but not how long it stayed below the peak. Hover to see the drawdown of CORE22+, the S&amp;P 500, and the Nasdaq at each point.
      </div>
      {loading ? (
        <div className="muted" style={{ padding: 70, textAlign: "center" }}>Loading curve…</div>
      ) : series.length ? (
        <DrawdownChart series={series} />
      ) : (
        <div className="placeholder"><i className="ti ti-cloud-off" /><b>Curve unavailable</b></div>
      )}
      <div className="legend" style={{ marginTop: 10 }}>
        <i><b style={{ background: "#C9A02C" }} />CORE22+ {data ? `(max ${data.maxCore}%)` : ""}</i>
        <i><b style={{ background: "#E74C3C" }} />S&P 500 {data ? `(max ${data.maxSpx}%)` : ""}</i>
        {data?.maxNasdaq != null && <i><b style={{ background: "#7B68EE" }} />Nasdaq (max {data.maxNasdaq}%)</i>}
        <span className="muted" style={{ marginLeft: "auto" }}>CORE22+/S&amp;P: official backtest · Nasdaq: our comparison (Yahoo, real data) · base 100</span>
      </div>
    </div>
  );
}

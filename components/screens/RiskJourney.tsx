"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { DDSeries } from "./DrawdownChart";

const DrawdownChart = dynamic(() => import("./DrawdownChart"), { ssr: false });

const PERIODS = [
  { k: "ytd", l: "YTD" },
  { k: "1y", l: "1A" },
  { k: "5y", l: "5A" },
  { k: "2016", l: "10A" },
  { k: "2006", l: "20A" },
  { k: "2000", l: "Desde 2000" },
];

interface DDResp { dd: { time: number; value: number }[]; maxDD: number; error?: boolean }

// coreSeries: curva de drawdown do CORE22+ (backtest). Quando ausente, mostra só o S&P.
export default function RiskJourney({ coreByPeriod }: { coreByPeriod?: Record<string, { time: number; value: number }[]> }) {
  const [period, setPeriod] = useState("5y");
  const [spx, setSpx] = useState<DDResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/drawdown?symbol=^GSPC&period=${period}`)
      .then((r) => r.json())
      .then((j: DDResp) => { setSpx(j.error ? null : j); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const series: DDSeries[] = [];
  const core = coreByPeriod?.[period];
  if (core) series.push({ name: "CORE22+", color: "#C9A02C", data: core, fill: true });
  if (spx?.dd) series.push({ name: "S&P 500", color: "#E74C3C", data: spx.dd, fill: !core });

  return (
    <div className="card">
      <div className="flex between wrap mb" style={{ gap: 10 }}>
        <h3 style={{ margin: 0 }}><i className="ti ti-wave-sine" />A jornada, visualizada · curva submersa (drawdown vs. topo anterior)</h3>
        <div className="seg" style={{ margin: 0 }}>
          {PERIODS.map((p) => <span key={p.k} className={period === p.k ? "on" : ""} onClick={() => setPeriod(p.k)}>{p.l}</span>)}
        </div>
      </div>
      <div className="muted mb" style={{ lineHeight: 1.6 }}>
        O drawdown máximo é uma foto, não um filme: mostra o quanto o capital caiu, mas não por quanto tempo ficou abaixo do topo. Passe o mouse para ver o drawdown em cada ponto.
      </div>
      {loading ? (
        <div className="muted" style={{ padding: 70, textAlign: "center" }}>Carregando curva do Yahoo…</div>
      ) : series.length ? (
        <DrawdownChart series={series} />
      ) : (
        <div className="placeholder"><i className="ti ti-cloud-off" /><b>Curva indisponível</b></div>
      )}
      <div className="legend" style={{ marginTop: 10 }}>
        {core && <i><b style={{ background: "#C9A02C" }} />CORE22+</i>}
        <i><b style={{ background: "#E74C3C" }} />S&P 500</i>
        <span className="muted" style={{ marginLeft: "auto" }}>
          {spx ? `S&P 500 max DD no período: ${spx.maxDD}%` : ""} · S&P ao vivo (Yahoo){!core ? " · curva CORE22+ em integração" : ""}
        </span>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { publishScreenData } from "@/lib/jim-data";
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

interface Resp {
  core: { time: number; value: number }[];
  spx: { time: number; value: number }[];
  maxCore: number;
  maxSpx: number;
  error?: boolean;
}

// Underwater curve do backtest CORE22+ vs S&P (mesma série, base 100, 1990–2026).
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

  // Publica pro JIM a curva de drawdown (jornada de risco) do período selecionado.
  useEffect(() => {
    if (!data || data.error) return;
    const periodLabel = PERIODS.find((p) => p.k === period)?.l || period;
    publishScreenData(
      "fundo",
      "Aba Risco & Jornada do fundo: curva submersa (drawdown vs. topo anterior) do CORE22+ vs S&P 500, backtest hipotético, base 100.",
      { periodo: periodLabel, drawdownMaximoCore: data.maxCore, drawdownMaximoSpx: data.maxSpx },
      {
        briefing:
          `Você está vendo a curva de drawdown (${periodLabel}): CORE22+ com máximo de ${data.maxCore}% vs S&P 500 com ${data.maxSpx}%.`,
        suggestions: [
          "O que essa curva de drawdown significa?",
          "Quanto tempo leva pra recuperar uma queda dessas?",
          "Como isso se compara a outros períodos?",
        ],
      }
    );
  }, [data, period]);

  return (
    <div className="card">
      <div className="flex between wrap mb" style={{ gap: 10 }}>
        <h3 style={{ margin: 0 }}><i className="ti ti-wave-sine" />A jornada, visualizada · curva submersa (drawdown vs. topo anterior)</h3>
        <div className="seg" style={{ margin: 0 }}>
          {PERIODS.map((p) => <span key={p.k} className={period === p.k ? "on" : ""} onClick={() => setPeriod(p.k)}>{p.l}</span>)}
        </div>
      </div>
      <div className="muted mb" style={{ lineHeight: 1.6 }}>
        O drawdown máximo é uma foto, não um filme: mostra o quanto o capital caiu, mas não por quanto tempo ficou abaixo do topo. Passe o mouse para ver o drawdown do CORE22+ e do S&P 500 em cada ponto.
      </div>
      {loading ? (
        <div className="muted" style={{ padding: 70, textAlign: "center" }}>Carregando curva…</div>
      ) : series.length ? (
        <DrawdownChart series={series} />
      ) : (
        <div className="placeholder"><i className="ti ti-cloud-off" /><b>Curva indisponível</b></div>
      )}
      <div className="legend" style={{ marginTop: 10 }}>
        <i><b style={{ background: "#C9A02C" }} />CORE22+ {data ? `(máx ${data.maxCore}%)` : ""}</i>
        <i><b style={{ background: "#E74C3C" }} />S&P 500 {data ? `(máx ${data.maxSpx}%)` : ""}</i>
        <span className="muted" style={{ marginLeft: "auto" }}>Backtest CORE22+ · base 100 · hipotético</span>
      </div>
    </div>
  );
}

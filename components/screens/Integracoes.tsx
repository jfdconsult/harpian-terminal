"use client";
import { useEffect } from "react";
import { publishScreenData } from "@/lib/jim-data";

const INTEGRATIONS = [
  { name: "Yahoo Finance", icon: "ti-chart-line", status: "conectado", note: "Cotações e histórico US · fonte atual" },
  { name: "FastTrack", icon: "ti-database", status: "planejado", note: "API v2 EOD US — substitui o Yahoo" },
  { name: "SEC EDGAR (13F)", icon: "ti-report-money", status: "conectado", note: "Holdings institucionais · pipeline gov-data" },
  { name: "CFTC (COT)", icon: "ti-flame", status: "conectado", note: "Posicionamento de futuros · semanal" },
  { name: "Lynk Capital Markets", icon: "ti-building-bank", status: "conectado", note: "Admin, liquidação e roteamento de ordens" },
  { name: "TradingView", icon: "ti-chart-candle", status: "a configurar", note: "Deep-link + template HARPIAN DSPT" },
];
const tag = (s: string) => (s === "conectado" ? "g" : s === "planejado" ? "b" : "o");

export default function Integracoes() {
  useEffect(() => {
    const pend = INTEGRATIONS.filter((i) => i.status !== "conectado");
    publishScreenData(
      "integracoes",
      "Integrações do Terminal: conexões de dados e sistemas (Yahoo Finance, FastTrack, SEC EDGAR, CFTC, Lynk, TradingView) com status.",
      INTEGRATIONS,
      {
        briefing:
          `Você está vendo ${INTEGRATIONS.length} integrações: ${INTEGRATIONS.length - pend.length} conectadas` +
          (pend.length ? `, ${pend.length} pendente(s): ${pend.map((i) => i.name).join(", ")}.` : "."),
        suggestions: [
          "O que muda quando a FastTrack entrar?",
          "Alguma integração está com problema?",
          "Como conecto o TradingView?",
        ],
      }
    );
  }, []);

  return (
    <div className="screen">
      <div className="crumb">Ajustes › <b>Integrações</b></div>
      <div className="h1">Integrações</div>
      <div className="sub">Conexões de dados e sistemas do Terminal.</div>

      <div className="grid g3">
        {INTEGRATIONS.map((it) => (
          <div className="card" key={it.name}>
            <h3><i className={`ti ${it.icon}`} />{it.name}</h3>
            <span className={`tag ${tag(it.status)}`}>{it.status}</span>
            <div className="muted mt" style={{ lineHeight: 1.5 }}>{it.note}</div>
          </div>
        ))}
      </div>
      <div className="muted mt" style={{ fontSize: 11 }}>Hoje os dados de mercado vêm do Yahoo Finance; a migração para a FastTrack é transparente para as telas.</div>
    </div>
  );
}

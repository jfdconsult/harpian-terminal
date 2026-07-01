"use client";
import { useState } from "react";
import { NB_HEADLINES, NB_SOURCE_COLOR, NB_SOURCE_LABEL, SR_IMPACT_COLOR } from "@/lib/data";

export default function NewsBroadcast() {
  const [source, setSource] = useState("all");
  const [topic, setTopic] = useState("all");

  const items = NB_HEADLINES.filter((h) => {
    if (source !== "all" && h.source !== source) return false;
    if (topic !== "all" && h.topic !== topic) return false;
    return true;
  });

  return (
    <div className="screen">
      <div className="crumb">Intelligence › <b>News Broadcast</b></div>
      <div className="h1">News Broadcast</div>
      <div className="sub">Feed consolidado de notícias com impacto de mercado · Atualização contínua.</div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "14px 0", alignItems: "center" }}>
        <span className="flabel">Fonte:</span>
        <select className="fsel" value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="all">Todas</option>
          <option value="bloomberg">Bloomberg</option>
          <option value="reuters">Reuters</option>
          <option value="ft">Financial Times</option>
          <option value="wsj">Wall Street Journal</option>
          <option value="cnbc">CNBC</option>
        </select>
        <select className="fsel" value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="all">Todos os tópicos</option>
          <option value="macro">Macro / Central Banks</option>
          <option value="equities">Equities</option>
          <option value="commodities">Commodities</option>
          <option value="fx">FX / Rates</option>
          <option value="crypto">Crypto</option>
          <option value="geopolitics">Geopolitics</option>
        </select>
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 9, color: "var(--tx3)" }}>
          {items.length} headline{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.length === 0 && (
          <div style={{ textAlign: "center", padding: 48, color: "var(--tx3)", fontSize: 11 }}>No headlines match filters</div>
        )}
        {items.map((h) => {
          const ic = SR_IMPACT_COLOR[h.impact] || "rgba(255,255,255,0.3)";
          const scol = NB_SOURCE_COLOR[h.source] || "#999";
          const slbl = NB_SOURCE_LABEL[h.source] || h.source.toUpperCase();
          return (
            <div key={h.id} style={{ background: "var(--bg2)", border: "1px solid var(--line)", borderLeft: `3px solid ${ic}`, borderRadius: 6, padding: "12px 15px", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, background: scol, color: "#fff", padding: "3px 7px", borderRadius: 3 }}>{slbl}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, color: ic }}>{h.impact.toUpperCase()}</span>
                <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 10, color: "var(--tx3)" }}>{h.ts}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--tx)", lineHeight: 1.45 }}>{h.headline}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {h.tags.map((t) => (
                  <span key={t} style={{ fontFamily: "var(--mono)", fontSize: 10, background: "rgba(201,160,44,0.08)", border: "1px solid rgba(201,160,44,0.15)", color: "var(--gold)", padding: "2px 6px", borderRadius: 3 }}>{t}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

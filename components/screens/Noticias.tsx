"use client";
import { NB_HEADLINES, NB_SOURCE_COLOR, NB_SOURCE_LABEL, SR_IMPACT_COLOR } from "@/lib/data";
import type { ScreenId } from "@/lib/nav";

export default function Noticias({ go }: { go: (id: ScreenId, param?: string) => void }) {
  // Notícias de maior impacto no fundo (Market Moving + High).
  const items = NB_HEADLINES.filter((h) => h.impact === "Market Moving" || h.impact === "High").slice(0, 8);

  return (
    <div className="screen">
      <div className="crumb">Mercado › <b>Notícias</b></div>
      <div className="flex between wrap">
        <div><div className="h1">Notícias que importam</div><div className="sub" style={{ margin: 0 }}>Filtradas pelo impacto no fundo.</div></div>
        <button className="btn ghost" onClick={() => go("news-broadcast")}><i className="ti ti-broadcast" />News Broadcast completo</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14 }}>
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
                {h.tags.map((t) => <span key={t} style={{ fontFamily: "var(--mono)", fontSize: 10, background: "rgba(201,160,44,0.08)", border: "1px solid rgba(201,160,44,0.15)", color: "var(--gold)", padding: "2px 6px", borderRadius: 3 }}>{t}</span>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { fetchNews, IMPACT_COLOR, type NewsHeadline } from "@/lib/feeds";
import { publishScreenData } from "@/lib/jim-data";

const TR = {
  title: { pt: "News Broadcast", en: "News Broadcast" },
  subtitle: { pt: "Feed consolidado ao vivo · RSS financeiro gratuito (CNBC · MarketWatch · Yahoo).", en: "Live consolidated feed · free financial RSS (CNBC · MarketWatch · Yahoo)." },
  source: { pt: "Fonte:", en: "Source:" },
  all: { pt: "Todas", en: "All" },
  allImpacts: { pt: "Todos os impactos", en: "All impacts" },
  refresh: { pt: "Atualizar", en: "Refresh" },
  headlines: { pt: "manchetes", en: "headlines" },
  sources: { pt: "fontes", en: "sources" },
  backendOffline: { pt: "Backend offline — inicie a API na porta 8080.", en: "Backend offline — start the API on port 8080." },
  noHeadlinesMatch: { pt: "Nenhuma manchete corresponde a estes filtros.", en: "No headlines match these filters." },
  briefingIntro: { pt: "Você está vendo", en: "You're looking at" },
  liveHeadlines: { pt: "manchetes ao vivo", en: "live headlines" },
  flaggedMarketMoving: { pt: "sinalizadas como **Market Moving**.", en: "flagged as **Market Moving**." },
  highlight: { pt: "Destaque", en: "Highlight" },
  screenDescription: { pt: "News Broadcast (RSS financeiro ao vivo: CNBC, MarketWatch, Yahoo). Cada manchete = título, fonte, impacto (Market Moving/High/Normal) e horário.", en: "News Broadcast (live financial RSS: CNBC, MarketWatch, Yahoo). Each headline = title, source, impact (Market Moving/High/Normal) and time." },
  q1: { pt: "Qual manchete está movendo o mercado hoje?", en: "Which headline is moving the market today?" },
  q2: { pt: "Algo aqui afeta os fundos da Harpian?", en: "Does anything here affect Harpian's funds?" },
  q3: { pt: "Resuma as manchetes de hoje para mim.", en: "Summarize today's headlines for me." },
} as const;

export default function NewsBroadcast() {
  const { lang } = useI18n();
  const t = (k: keyof typeof TR) => TR[k][lang];
  const [all, setAll] = useState<NewsHeadline[]>([]);
  const [colors, setColors] = useState<Record<string, string>>({});
  const [sourcesLive, setSourcesLive] = useState<string[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string>("");
  const [conn, setConn] = useState<"loading" | "ok" | "error">("loading");
  const [source, setSource] = useState("all");
  const [impact, setImpact] = useState("all");

  function load() {
    setConn("loading");
    fetchNews()
      .then((d) => {
        setAll(d.headlines);
        setColors(d.source_color || {});
        setSourcesLive(d.sources_live || []);
        setFetchedAt(d.fetched_at || "");
        setConn("ok");
      })
      .catch(() => setConn("error"));
  }
  useEffect(load, []);

  const items = useMemo(() => all.filter((h) => {
    if (source !== "all" && h.source !== source) return false;
    if (impact !== "all" && h.impact !== impact) return false;
    return true;
  }), [all, source, impact]);

  // Publishes the visible broadcast headlines to JIM.
  useEffect(() => {
    if (conn !== "ok") return;
    const moving = items.filter((h) => h.impact === "Market Moving").length;
    const top = items.find((h) => h.impact === "Market Moving") || items[0];
    publishScreenData(
      "news-broadcast",
      t("screenDescription"),
      items.slice(0, 40).map((h) => ({
        titulo: h.headline, fonte: h.source_label || h.source, impacto: h.impact, quando: h.ts,
      })),
      {
        briefing:
          `${t("briefingIntro")} ${items.length} ${t("liveHeadlines")}` +
          (moving ? `, ${moving} ${t("flaggedMarketMoving")}` : ".") +
          (top ? ` ${t("highlight")}: "${top.headline.slice(0, 90)}".` : ""),
        suggestions: [
          t("q1"),
          t("q2"),
          t("q3"),
        ],
      }
    );
  }, [items, conn, lang]);

  return (
    <div className="screen">
      <div className="flex" style={{ alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <div className="h1" style={{ margin: 0 }}>{t("title")}</div>
        <div className="sub" style={{ margin: 0 }}>{t("subtitle")}</div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "14px 0", alignItems: "center" }}>
        <span className="flabel">{t("source")}</span>
        <select className="fsel" value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="all">{t("all")}</option>
          <option value="cnbc">CNBC</option>
          <option value="marketwatch">MarketWatch</option>
          <option value="yahoo">Yahoo Finance</option>
        </select>
        <select className="fsel" value={impact} onChange={(e) => setImpact(e.target.value)}>
          <option value="all">{t("allImpacts")}</option>
          <option value="Market Moving">Market Moving</option>
          <option value="High">High</option>
          <option value="Normal">Normal</option>
        </select>
        <button className="btn ghost" style={{ fontSize: 11 }} onClick={load}><i className="ti ti-refresh" />{t("refresh")}</button>
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 9, color: "var(--tx3)" }}>
          {conn === "ok" ? `${items.length} ${t("headlines")} · ${sourcesLive.length} ${t("sources")}` : ""}{fetchedAt ? ` · ${fetchedAt.slice(11, 16)}Z` : ""}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, alignContent: "start" }}>
        {conn === "loading" && [0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 6 }} />)}
        {conn === "error" && <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 48, color: "var(--tx3)", fontSize: 12 }}>{t("backendOffline")}</div>}
        {conn === "ok" && items.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 48, color: "var(--tx3)", fontSize: 11 }}>{t("noHeadlinesMatch")}</div>
        )}
        {conn === "ok" && items.map((h) => {
          const ic = IMPACT_COLOR[h.impact] || "rgba(255,255,255,0.3)";
          const scol = colors[h.source] || "#999";
          return (
            <a key={h.id} href={h.url || "#"} target="_blank" rel="noopener noreferrer"
               style={{ background: "var(--bg2)", border: "1px solid var(--line)", borderLeft: `3px solid ${ic}`, borderRadius: 6, padding: "12px 15px", display: "flex", flexDirection: "column", gap: 6, textDecoration: "none", color: "inherit" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, background: scol, color: "#fff", padding: "3px 7px", borderRadius: 3 }}>{h.source_label}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, color: ic }}>{h.impact.toUpperCase()}</span>
                <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 10, color: "var(--tx3)" }}>{h.ts}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--tx)", lineHeight: 1.45 }}>{h.headline}</div>
              {h.tags.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {h.tags.map((t) => (
                    <span key={t} style={{ fontFamily: "var(--mono)", fontSize: 10, background: "rgba(201,160,44,0.08)", border: "1px solid rgba(201,160,44,0.15)", color: "var(--gold)", padding: "2px 6px", borderRadius: 3 }}>{t}</span>
                  ))}
                </div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}

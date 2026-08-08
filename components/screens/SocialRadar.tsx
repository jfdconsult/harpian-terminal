"use client";
import { useEffect, useMemo, useState } from "react";
import { fetchSocialTrending, IMPACT_COLOR, SENTIMENT_COLOR, type SocialPost } from "@/lib/feeds";
import { publishScreenData } from "@/lib/jim-data";
import { useI18n } from "@/lib/i18n";

const TR = {
  title: { pt: "Radar de Redes Sociais", en: "Social Media Radar" },
  subtitle: { pt: "StockTwits ao vivo · cashtags mais comentadas · sentimento declarado pelo autor.", en: "Live StockTwits · most-discussed cashtags · sentiment declared by the author." },
  filter: { pt: "Filtro:", en: "Filter:" },
  allReach: { pt: "Todo alcance", en: "All reach" },
  highReach: { pt: "Alto (20 mil+ seguidores)", en: "High (20k+ followers)" },
  mediumReach: { pt: "Médio (3 mil+)", en: "Medium (3k+)" },
  lowReach: { pt: "Baixo", en: "Low" },
  allSentiment: { pt: "Todo sentimento", en: "All sentiment" },
  bullish: { pt: "Comprado", en: "Bullish" },
  bearish: { pt: "Vendido", en: "Bearish" },
  neutral: { pt: "Neutro", en: "Neutral" },
  refresh: { pt: "Atualizar", en: "Refresh" },
  posts: { pt: "posts", en: "posts" },
  offlineNotice: { pt: "StockTwits está indisponível no momento — feed vazio (sem dados fabricados).", en: "StockTwits is currently unavailable — feed empty (no fabricated data)." },
  backendOffline: { pt: "Backend offline — inicie a API na porta 8080.", en: "Backend offline — start the API on port 8080." },
  noMatch: { pt: "Nenhum post corresponde a estes filtros.", en: "No posts match these filters." },
  backFeed: { pt: "← Feed", en: "← Feed" },
  intelligenceLayer: { pt: "CAMADA DE INTELIGÊNCIA", en: "INTELLIGENCE LAYER" },
  close: { pt: "Fechar", en: "Close" },
  source: { pt: "Fonte", en: "Source" },
  followers: { pt: "seguidores", en: "followers" },
  originalPost: { pt: "Post original", en: "Original post" },
  assetsMentioned: { pt: "Ativos mencionados", en: "Assets mentioned" },
  harpianRead: { pt: "Leitura Harpian", en: "Harpian Read" },
  sentimentAuthor: { pt: "Sentimento (autor)", en: "Sentiment (author)" },
  reach: { pt: "Alcance", en: "Reach" },
  verified: { pt: "Verificado", en: "Verified" },
  yes: { pt: "Sim", en: "Yes" },
  no: { pt: "Não", en: "No" },
  platform: { pt: "Plataforma", en: "Platform" },
  viewOriginal: { pt: "Ver post original ↗", en: "View original post ↗" },
} as const;

export default function SocialRadar() {
  const { lang } = useI18n();
  const t = (k: keyof typeof TR) => TR[k][lang];
  const [all, setAll] = useState<SocialPost[]>([]);
  const [conn, setConn] = useState<"loading" | "ok" | "error">("loading");
  const [offline, setOffline] = useState(false);
  const [impact, setImpact] = useState("all");
  const [sentiment, setSentiment] = useState("all");
  const [activeId, setActiveId] = useState<number | null>(null);

  function load() {
    setConn("loading");
    fetchSocialTrending()
      .then((d) => {
        setAll(d.posts || []);
        setOffline(!!d.offline);
        setConn("ok");
      })
      .catch(() => setConn("error"));
  }
  useEffect(load, []);

  const posts = useMemo(() => all.filter((p) => {
    if (impact !== "all" && p.impact !== impact) return false;
    if (sentiment !== "all" && p.sentiment !== sentiment) return false;
    return true;
  }), [all, impact, sentiment]);

  const active = activeId != null ? all.find((p) => p.id === activeId) ?? null : null;

  // Publishes the posts visible on the social radar to JIM.
  useEffect(() => {
    if (conn !== "ok") return;
    const bull = posts.filter((p) => p.sentiment === "Bullish").length;
    const bear = posts.filter((p) => p.sentiment === "Bearish").length;
    const cash: Record<string, number> = {};
    posts.forEach((p) => p.symbols.forEach((t) => { cash[t] = (cash[t] || 0) + 1; }));
    const hot = Object.entries(cash).sort((a, b) => b[1] - a[1])[0]?.[0];
    publishScreenData(
      "social-radar",
      "Social Radar (live StockTwits): most-discussed cashtags. Each post = author, declared sentiment (Bullish/Bearish/Neutral), reach (followers), tickers mentioned, and the text.",
      posts.slice(0, 40).map((p) => ({
        autor: p.author, handle: p.handle, sentimento: p.sentiment, alcance: p.impact,
        seguidores: p.followers, tickers: p.symbols, texto: p.body, quando: p.ts,
      })),
      {
        briefing:
          `You're looking at ${posts.length} StockTwits posts: **${bull} bullish** vs **${bear} bearish**.` +
          (hot ? ` Most-discussed asset right now: **$${hot}**.` : "") +
          ` Keep in mind: social sentiment is what retail declares, not a recommendation.`,
        suggestions: [
          hot ? `Why is everyone talking about $${hot}?` : "Which asset is trending on social media?",
          "Is overall sentiment bullish or bearish?",
          "Does this matter for an investment decision?",
        ],
      }
    );
  }, [posts, conn]);

  return (
    <div className="screen" style={{ display: "flex", flexDirection: "column" }}>
      <div className="flex" style={{ alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <div className="h1" style={{ margin: 0 }}>{t("title")}</div>
        <div className="sub" style={{ margin: 0 }}>{t("subtitle")}</div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "14px 0", alignItems: "center" }}>
        <span className="flabel" style={{ marginRight: 4 }}>{t("filter")}</span>
        <select className="fsel" value={impact} onChange={(e) => setImpact(e.target.value)}>
          <option value="all">{t("allReach")}</option>
          <option value="High">{t("highReach")}</option>
          <option value="Medium">{t("mediumReach")}</option>
          <option value="Low">{t("lowReach")}</option>
        </select>
        <select className="fsel" value={sentiment} onChange={(e) => setSentiment(e.target.value)}>
          <option value="all">{t("allSentiment")}</option>
          <option value="Bullish">{t("bullish")}</option>
          <option value="Bearish">{t("bearish")}</option>
          <option value="Neutral">{t("neutral")}</option>
        </select>
        <button className="btn ghost" style={{ fontSize: 11 }} onClick={load}><i className="ti ti-refresh" />{t("refresh")}</button>
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 9, color: "var(--tx3)" }}>
          {conn === "ok" ? `${posts.length} ${t("posts")}` : ""}
        </span>
      </div>

      {offline && (
        <div style={{ padding: "8px 12px", marginBottom: 8, fontSize: 11, color: "var(--orange)", background: "rgba(243,156,18,.08)", border: "1px solid rgba(243,156,18,.2)", borderRadius: 5 }}>
          {t("offlineNotice")}
        </div>
      )}

      <div className="sr-body">
        <div className={`sr-feed-col${active ? " has-panel" : ""}`}>
          <div style={{ display: "grid", gridTemplateColumns: active ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 8, alignContent: "start" }}>
            {conn === "loading" && [0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 6 }} />)}
            {conn === "error" && <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 48, color: "var(--tx3)", fontSize: 11 }}>{t("backendOffline")}</div>}
            {conn === "ok" && posts.length === 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 48, color: "var(--tx3)", fontSize: 11 }}>{t("noMatch")}</div>
            )}
            {conn === "ok" && posts.map((p) => (
              <SocialCard key={p.id} p={p} selected={activeId === p.id} onClick={() => setActiveId(p.id)} />
            ))}
          </div>
        </div>
        <div className={`sr-intel-panel${active ? " open" : ""}`}>
          {active && <IntelPanel p={active} onClose={() => setActiveId(null)} />}
        </div>
      </div>
    </div>
  );
}

function SocialCard({ p, selected, onClick }: { p: SocialPost; selected: boolean; onClick: () => void }) {
  const ic = IMPACT_COLOR[p.impact] || "rgba(255,255,255,0.3)";
  const sc = SENTIMENT_COLOR[p.sentiment] || "rgba(255,255,255,0.4)";
  const reach = Math.min(100, Math.round((p.followers / 50000) * 100));
  return (
    <div
      className={`sr-card${selected ? " selected" : ""}`}
      onClick={onClick}
      style={{ background: "var(--bg2)", border: "1px solid var(--line)", borderLeft: `3px solid ${ic}`, borderRadius: 6, padding: "13px 15px", display: "flex", flexDirection: "column", gap: 7 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, background: "#00A99D", color: "#000", padding: "3px 7px", borderRadius: 3, minWidth: 22, textAlign: "center" }}>ST</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--tx2)" }}>{p.author}</span>
        {p.verified && <i className="ti ti-rosette-discount-check" style={{ color: "var(--blue)", fontSize: 13 }} />}
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tx3)" }}>{p.handle}</span>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, color: ic }}>{p.impact.toUpperCase()}</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: sc }}>{p.sentiment}</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tx3)" }}>{p.ts}</span>
        </span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--tx)", lineHeight: 1.45 }}>{p.body}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {p.symbols.slice(0, 5).map((t) => (
          <span key={t} style={{ fontFamily: "var(--mono)", fontSize: 11, background: "rgba(201,160,44,0.08)", border: "1px solid rgba(201,160,44,0.15)", color: "var(--gold)", padding: "2px 7px", borderRadius: 3 }}>${t}</span>
        ))}
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tx3)" }}>REACH</span>
          <div style={{ width: 52, height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${reach}%`, height: "100%", background: "var(--gold)", borderRadius: 2, opacity: 0.8 }} />
          </div>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tx3)" }}>{(p.followers / 1000).toFixed(1)}k</span>
        </span>
      </div>
    </div>
  );
}

function IntelPanel({ p, onClose }: { p: SocialPost; onClose: () => void }) {
  const { lang } = useI18n();
  const t = (k: keyof typeof TR) => TR[k][lang];
  const ic = IMPACT_COLOR[p.impact] || "rgba(255,255,255,0.3)";
  const sc = SENTIMENT_COLOR[p.sentiment] || "rgba(255,255,255,0.4)";
  const sentimentLabel = p.sentiment === "Bullish" ? t("bullish") : p.sentiment === "Bearish" ? t("bearish") : p.sentiment === "Neutral" ? t("neutral") : p.sentiment;

  return (
    <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onClose} className="sr-action-secondary" style={{ width: "auto", padding: "5px 10px", fontSize: 9 }}>{t("backFeed")}</button>
        <span style={{ fontFamily: "var(--mono)", fontSize: 8, letterSpacing: ".10em", color: "var(--tx3)" }}>{t("intelligenceLayer")}</span>
        <button onClick={onClose} aria-label={t("close")} style={{ background: "none", border: "none", color: "var(--tx3)", fontSize: 16, cursor: "pointer", padding: "0 2px", lineHeight: 1 }}><i className="ti ti-x" /></button>
      </div>

      <div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: ".10em", textTransform: "uppercase", color: "var(--tx3)", marginBottom: 6 }}>{t("source")}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, background: "#00A99D", color: "#000", padding: "3px 8px", borderRadius: 3 }}>ST</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--tx)" }}>{p.author}</span>
          {p.verified && <i className="ti ti-rosette-discount-check" style={{ color: "var(--blue)", fontSize: 15 }} />}
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--tx3)", marginTop: 3 }}>{p.handle} · {(p.followers / 1000).toFixed(1)}k {t("followers")} · {p.ts}</div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: 5, padding: "10px 12px" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: ".10em", textTransform: "uppercase", color: "var(--tx3)", marginBottom: 6 }}>{t("originalPost")}</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--tx)", lineHeight: 1.5 }}>{p.body}</div>
      </div>

      {p.symbols.length > 0 && (
        <div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".10em", textTransform: "uppercase", color: "var(--tx3)", marginBottom: 6 }}>{t("assetsMentioned")}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {p.symbols.map((sym) => (
              <span key={sym} style={{ fontFamily: "var(--mono)", fontSize: 12, background: "rgba(201,160,44,0.08)", border: "1px solid rgba(201,160,44,0.15)", color: "var(--gold)", padding: "3px 9px", borderRadius: 3 }}>${sym}</span>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: "rgba(201,160,44,0.04)", border: "1px solid rgba(201,160,44,0.12)", borderRadius: 5, padding: "10px 12px" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".10em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 8 }}>{t("harpianRead")}</div>
        <div className="sr-calib-row"><span className="sr-calib-k">{t("sentimentAuthor")}</span><span className="sr-calib-v" style={{ color: sc }}>{sentimentLabel}</span></div>
        <div className="sr-calib-row"><span className="sr-calib-k">{t("reach")}</span><span className="sr-calib-v" style={{ color: ic }}>{p.impact} · {(p.followers / 1000).toFixed(1)}k</span></div>
        <div className="sr-calib-row"><span className="sr-calib-k">{t("verified")}</span><span className="sr-calib-v">{p.verified ? t("yes") : t("no")}</span></div>
        <div className="sr-calib-row"><span className="sr-calib-k">{t("platform")}</span><span className="sr-calib-v">StockTwits</span></div>
      </div>

      <a href={p.url} target="_blank" rel="noopener noreferrer" className="sr-action-secondary" style={{ textAlign: "center", textDecoration: "none", display: "block", padding: "8px" }}>
        {t("viewOriginal")}
      </a>
    </div>
  );
}

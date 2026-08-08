"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { fetchXri, XRI_STATE_COLOR, type XriView } from "@/lib/xri";
import { publishScreenData } from "@/lib/jim-data";
import { GOV_API } from "@/lib/data";
import { buildXri, type DnaRaw } from "@/lib/jim-market-analysis";
import XriGauge from "../XriGauge";
import BackToVisao from "../BackToVisao";
import JimBlock from "../JimBlock";
import type { ScreenId } from "@/lib/nav";

// ════════════════════════════════════════════════════════════════
// i18n — local dictionary for this screen. One entry per user-visible
// English string. en = current text (kept EXACTLY), pt = natural
// institutional Brazilian-Portuguese. Brand/product terms (XRI) and
// data-driven state codes (BAIXO/MODERADO/ELEVADO/CRÍTICO) are NOT
// translated as data, but their on-screen labels (CALM/MODERATE/...) are.
// ════════════════════════════════════════════════════════════════
const TR = {
  externalRisk: { pt: "Risco Externo", en: "External Risk" },
  whatsHappening: { pt: "O que está acontecendo lá fora — pronto para você discutir com seus clientes", en: "What's happening out there — ready for you to discuss with your clients" },
  loading: { pt: "Carregando…", en: "Loading…" },
  xriUnavailable: { pt: "XRI indisponível no momento", en: "XRI unavailable right now" },
  drivenMainlyBy: { pt: "Risco externo", en: "External risk" },
  todayDrivenMainlyBy1: { pt: "hoje, impulsionado principalmente por", en: "today, driven mainly by" },
  itsDirection: { pt: "Está", en: "It's" },
  informationLayer: { pt: "Camada informativa — hoje isso não altera automaticamente as carteiras dos seus clientes.", en: "Information layer — today it does not automatically change your clients' portfolios." },
  noSpecialPoint: { pt: "Nenhum ponto de atenção especial a mencionar hoje.", en: "No special point of attention to mention today." },
  worthKeepingRadar: { pt: "Vale manter no radar para conversas com clientes que acompanham de perto as notícias internacionais.", en: "Worth keeping on the radar for conversations with clients who follow international news closely." },
  mayBeWorthPreparing: { pt: "Pode valer a pena preparar uma resposta para clientes que perguntarem sobre a volatilidade internacional.", en: "May be worth preparing a response for clients who ask about international volatility." },
  confidenceInTodaysData: { pt: "Confiança nos dados de hoje", en: "Confidence in today's data" },
  whereRiskComingFrom: { pt: "DE ONDE VEM O RISCO DE HOJE", en: "WHERE TODAY'S RISK IS COMING FROM" },
  noRelevantConcentration: { pt: "Nenhuma concentração relevante em nenhum país hoje.", en: "No relevant concentration in any country today." },
  methodologyValidation: { pt: "METODOLOGIA E VALIDAÇÃO — por que confiar neste número", en: "METHODOLOGY AND VALIDATION — why trust this number" },
  weTestedXri1: { pt: "Testamos o XRI contra", en: "We tested the XRI against" },
  yearsOfMarketHistory: { pt: "anos de histórico de mercado", en: "years of market history" },
  includingCrisesSuchAs: { pt: ", incluindo crises como a Crise Financeira Global (2008), a crise da dívida soberana europeia (2011), a Covid-19 (2020) e a crise dos gilts do Reino Unido (2022).", en: ", including crises such as the Global Financial Crisis (2008), the European sovereign debt crisis (2011), Covid-19 (2020), and the UK gilts crisis (2022)." },
  inEventsOf: { pt: "Em", en: "In" },
  eventsCoveredMid: { pt: "de", en: "of" },
  eventsWord: { pt: "eventos", en: "events" },
  eventsCoveredEnd: { pt: "eventos cobertos pelo histórico, o índice já sinalizava risco elevado antes ou durante o evento.", en: "events covered by the historical record, the index was already signaling elevated risk before or during the event." },
  xriCombinesHardData: { pt: "O XRI combina dados concretos de mercado e macroeconômicos de mais de dez países/blocos e a exposição real de receita das empresas americanas — notícias só entram no cálculo após passar por um filtro de confirmação.", en: "The XRI combines hard market and macroeconomic data from more than ten countries/blocs and the real revenue exposure of US companies — news only enters the calculation after passing a confirmation filter." },
  todayXriFunctionsAs: { pt: "Hoje o XRI funciona como", en: "Today the XRI functions as" },
  strategicInformation: { pt: "informação estratégica", en: "strategic information" },
  doesNotAutomaticallyChange: { pt: "— não altera automaticamente as carteiras dos seus clientes.", en: "— it does not automatically change your clients' portfolios." },

  risingFewDays: { pt: "subindo nos últimos dias", en: "rising over the last few days" },
  fallingFewDays: { pt: "caindo nos últimos dias", en: "falling over the last few days" },
  stableLastWeek: { pt: "estável na última semana", en: "stable over the last week" },
  noCountryStandingOut: { pt: "nenhum país específico em destaque", en: "no specific country standing out" },
  noCountryStandingOut2: { pt: "nenhum país em destaque", en: "no country standing out" },

  calm: { pt: "CALMO", en: "CALM" },
  moderate: { pt: "MODERADO", en: "MODERATE" },
  elevated: { pt: "ELEVADO", en: "ELEVATED" },
  critical: { pt: "CRÍTICO", en: "CRITICAL" },
} as const;

type TrKey = keyof typeof TR;

function directionTxt(t: (k: TrKey) => string, direction?: string): string {
  const map: Record<string, string> = {
    subindo: t("risingFewDays"),
    caindo: t("fallingFewDays"),
    estável: t("stableLastWeek"),
  };
  return map[direction || "estável"] || t("stableLastWeek");
}

// `state` comes from the server as BAIXO/MODERADO/ELEVADO/CRÍTICO (see
// app/api/xri/route.ts) — kept as-is for comparisons; stateTxt() below is
// only for what's rendered on screen.
function stateTxt(t: (k: TrKey) => string, state?: string): string {
  const map: Record<string, string> = {
    BAIXO: t("calm"),
    MODERADO: t("moderate"),
    ELEVADO: t("elevated"),
    CRÍTICO: t("critical"),
  };
  return (state && map[state]) || state || "";
}

// Internal narrative sent to JIM's data feed (publishScreenData) — not
// directly rendered UI copy, so kept in English regardless of `lang`.
const EN_DIRECTION_TXT: Record<string, string> = {
  subindo: "rising over the last few days",
  caindo: "falling over the last few days",
  estável: "stable over the last week",
};
const EN_STATE_TXT: Record<string, string> = {
  BAIXO: "CALM",
  MODERADO: "MODERATE",
  ELEVADO: "ELEVATED",
  CRÍTICO: "CRITICAL",
};
function buildNarrative(v: XriView): string {
  const top = (v.drivers || []).slice(0, 2).map((d) => d.country);
  const driverTxt = top.length ? top.join(" and ") : "no specific country standing out";
  const dirTxt = EN_DIRECTION_TXT[v.direction || "estável"] || "stable over the last week";
  const stTxt = (v.state && EN_STATE_TXT[v.state]) || v.state;
  return `External risk **${stTxt}** today, driven mainly by ${driverTxt}. It's ${dirTxt}.`;
}

export default function Xri({ go }: { go?: (id: ScreenId, param?: string) => void }) {
  const { lang } = useI18n();
  const t = (k: TrKey) => TR[k][lang];
  const [v, setV] = useState<XriView>({ ok: false });
  const [dna, setDna] = useState<DnaRaw | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchXri().then((d) => { setV(d); setLoading(false); });
    // Public COT (CFTC) — lets JIM cross-reference the short yen against Japan's weight.
    fetch(`${GOV_API}/api/market-dna`).then(r => r.json()).then((d: DnaRaw) => setDna(d)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!v.ok) return;
    const narrative = buildNarrative(v).replace(/\*\*/g, "");
    publishScreenData("xri",
      "External Regime Index (XRI) screen: the temperature of what's happening outside the US and why it matters to clients.",
      { score: v.score, state: v.state, direction: v.direction, drivers: v.drivers },
      {
        briefing: narrative,
        suggestions: ["Why is risk at this level?", "Does this change my clients' portfolios?", "How was the XRI validated?"],
      }
    );
  }, [v]);

  const col = v.state ? XRI_STATE_COLOR[v.state] : "var(--tx2)";

  return (
    <div className="screen">
      <div className="crumb"><BackToVisao go={go} /></div>

      <div className="flex between" style={{ alignItems: "center", marginBottom: 8 }}>
        <div className="flex" style={{ alignItems: "baseline", gap: 14 }}>
          <div className="h1" style={{ margin: 0 }}>{t("externalRisk")}</div>
          <span className="muted" style={{ fontSize: 10 }}>
            {t("whatsHappening")}{v.as_of && <> · {v.as_of}</>}
          </span>
        </div>
        {v.ok && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px",
            borderRadius: 6, border: `1px solid ${col}40`, background: `${col}15`,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: col, boxShadow: `0 0 6px ${col}60` }} />
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: col }}>{stateTxt(t, v.state)}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="muted" style={{ padding: 40, textAlign: "center" }}>{t("loading")}</div>
      ) : !v.ok ? (
        <div className="placeholder"><i className="ti ti-cloud-off" /><b>{t("xriUnavailable")}</b></div>
      ) : (
        <>
          {/* Row 1: gauge + narrative + country breakdown (same height). Country
             breakdown was previously a separate card below, in a tiny font — moving
             it up to the same row makes the JIM analysis start higher on the page. */}
          <div className="card" style={{ marginBottom: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 260px", gap: 24, alignItems: "start" }}>
              <XriGauge score={v.score || 0} state={v.state || "MODERADO"} />
              <div>
                <div style={{ fontSize: 15, lineHeight: 1.6 }}>
                  {t("drivenMainlyBy")} <b style={{ color: col }}>{stateTxt(t, v.state)}</b> {t("todayDrivenMainlyBy1")}{" "}
                  <b>{(v.drivers || []).slice(0, 2).map((d) => d.country).join(" and ") || t("noCountryStandingOut2")}</b>.
                  {" "}{t("itsDirection")} {directionTxt(t, v.direction)}.
                </div>
                <div style={{ marginTop: 12, padding: "12px 14px", background: "rgba(125,150,179,.08)", borderRadius: 8, fontSize: 13, lineHeight: 1.7 }}>
                  <div>{t("informationLayer")}</div>
                  {v.state === "BAIXO" && <div>{t("noSpecialPoint")}</div>}
                  {v.state === "MODERADO" && <div>{t("worthKeepingRadar")}</div>}
                  {(v.state === "ELEVADO" || v.state === "CRÍTICO") && <div>{t("mayBeWorthPreparing")}</div>}
                  <div>{t("confidenceInTodaysData")}: <b>{v.confidence_pct}%</b>.</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: ".4px", color: "var(--gold)", marginBottom: 8, fontWeight: 700 }}>
                  <i className="ti ti-world" style={{ marginRight: 6 }} />{t("whereRiskComingFrom")}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
                  {(v.drivers || []).length ? v.drivers!.map((d) => (
                    <div key={d.country} style={{
                      display: "grid",
                      gridTemplateColumns: "16px 1fr auto",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid var(--line2)",
                      background: "rgba(125,150,179,.06)",
                      fontSize: 13,
                    }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: d.pct >= 40 ? "#E74C3C" : d.pct >= 20 ? "#F39C12" : "#2ECC71",
                        justifySelf: "center",
                      }} />
                      <span style={{ textAlign: "left" }}>{d.country}</span>
                      <b style={{ fontFamily: "var(--mono)", fontSize: 14, color: "var(--tx)", textAlign: "right" }}>{d.pct}%</b>
                    </div>
                  )) : <span className="muted" style={{ fontSize: 12 }}>{t("noRelevantConcentration")}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Detail: why the XRI is at this level. Lives here, not in the summary. */}
          <div style={{ marginBottom: 8 }}>
            <JimBlock block={buildXri(v, dna)} />
          </div>

          <div className="card">
            <details>
              <summary style={{ cursor: "pointer", fontSize: 12, color: "var(--gold)", letterSpacing: ".4px" }}>
                {t("methodologyValidation")}
              </summary>
              <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.8, color: "var(--tx2)" }}>
                {v.validation ? (
                  <>
                    <p>{t("weTestedXri1")} <b>{v.validation.years} {t("yearsOfMarketHistory")}</b>{t("includingCrisesSuchAs")}</p>
                    <p>{t("inEventsOf")} <b>{v.validation.events_hit} {t("eventsCoveredMid")} {v.validation.events_covered} {t("eventsWord")}</b> {t("eventsCoveredEnd")}</p>
                  </>
                ) : (
                  <p>{t("xriCombinesHardData")}</p>
                )}
                <p>{t("todayXriFunctionsAs")} <b>{t("strategicInformation")}</b> {t("doesNotAutomaticallyChange")}</p>
              </div>
            </details>
          </div>
        </>
      )}
    </div>
  );
}

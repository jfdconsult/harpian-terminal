"use client";
import { useEffect, useState } from "react";
import { GOV_API } from "@/lib/data";
import { publishScreenData } from "@/lib/jim-data";
import { buildDna, type DnaRaw, type Driver } from "@/lib/jim-market-analysis";
import BackToVisao from "../BackToVisao";
import type { ScreenId } from "@/lib/nav";
import { useI18n } from "@/lib/i18n";

const TR = {
  scoreExtreme: { pt: "EXTREMO", en: "EXTREME" },
  scoreHigh: { pt: "ALTO", en: "HIGH" },
  scoreNeutral: { pt: "NEUTRO", en: "NEUTRAL" },
  scoreLow: { pt: "BAIXO", en: "LOW" },
  scoreExtremeLow: { pt: "EXTREMO BAIXO", en: "EXTREME LOW" },
  regimeCautious: { pt: "CAUTELOSO", en: "CAUTIOUS" },
  regimeMixed: { pt: "MISTO", en: "MIXED" },
  insMacroStrong: { pt: "Ambiente macro forte: curva de juros normal e spreads de crédito apertados. Condições favorecem ativos de risco.", en: "Strong macro environment: normal yield curve and tight credit spreads. Conditions favor risk assets." },
  insMacroNeutralPos: { pt: "Macro neutro a positivo: condições razoáveis para exposição a risco.", en: "Neutral-to-positive macro: reasonable conditions for risk exposure." },
  insMacroAdverse: { pt: "Macro adverso: curva de juros e/ou spreads de crédito sinalizam cautela.", en: "Adverse macro: yield curve and/or credit spreads signal caution." },
  insVolVeryLow: { pt: "Volatilidade muito baixa (VIX comprimido). Mercado complacente.", en: "Very low volatility (compressed VIX). Complacent market." },
  insVolAlertCompressed: { pt: "Um VIX comprimido historicamente precede expansões súbitas de volatilidade. Risco assimétrico de proteção barata.", en: "A compressed VIX historically precedes sudden volatility expansions. Asymmetric risk of cheap protection." },
  insVolLowModerate: { pt: "Volatilidade baixa a moderada. Ambiente favorável para posições direcionais.", en: "Low-to-moderate volatility. Environment favorable for directional positions." },
  insVolElevated: { pt: "Volatilidade elevada — mercado sob estresse. Risco de movimentos bruscos.", en: "Elevated volatility — market under stress. Risk of sharp moves." },
  insVolAlertAbove25: { pt: "VIX acima de 25 — considere reduzir o tamanho da posição ou proteger com opções.", en: "VIX above 25 — consider reducing position size or hedging with options." },
  insBreadthHealthy: { pt: "Amplitude saudável: {pct}% dos ativos acima da média móvel de 200 dias. Alta com ampla participação.", en: "Healthy breadth: {pct}% of assets above the 200-day MA. Rally with broad participation." },
  insBreadthAcceptable: { pt: "Amplitude aceitável: {pct}% acima da média móvel de 200 dias. Participação moderada.", en: "Acceptable breadth: {pct}% above the 200-day MA. Moderate participation." },
  insBreadthWeak: { pt: "Amplitude fraca: apenas {pct}% acima da média móvel de 200 dias. Mercado estreito — poucos ativos carregando o índice.", en: "Weak breadth: only {pct}% above the 200-day MA. Narrow market — few assets carrying the index." },
  insSentEuphoric: { pt: "Sentimento eufórico (Fear & Greed acima de 80). Historicamente uma zona de topo.", en: "Euphoric sentiment (Fear & Greed above 80). Historically a peak zone." },
  insSentAlertEuphoria: { pt: "Euforia extrema tende a preceder correções. Cautela com novas posições.", en: "Extreme euphoria tends to precede corrections. Caution with new positions." },
  insSentExtremePessimism: { pt: "Pessimismo extremo (Fear & Greed abaixo de 25). Historicamente uma zona contrária de oportunidade.", en: "Extreme pessimism (Fear & Greed below 25). Historically a contrarian opportunity zone." },
  insSentFearTerritory: { pt: "Sentimento em território de medo — pode ser uma oportunidade se os fundamentos se sustentarem.", en: "Sentiment in fear territory — could be an opportunity if fundamentals hold up." },
  insSentElevated: { pt: "Sentimento elevado. O otimismo pode estar exagerado.", en: "Elevated sentiment. Optimism may be overextended." },
  insPosBullishExtreme: { pt: "Posicionamento especulativo em extremo altista. Risco de reversão se o fluxo mudar.", en: "Speculative positioning at a bullish extreme. Reversal risk if the flow shifts." },
  insPosAlertExtremeCot: { pt: "COT Index extremo — hedge funds excessivamente comprados.", en: "Extreme COT Index — hedge funds excessively long." },
  insPosBearishExtreme: { pt: "Posicionamento em extremo baixista. Potencial de forte alta se o sentimento mudar.", en: "Positioning at a bearish extreme. Potential for a significant rally if sentiment shifts." },
  insLiqHealthy: { pt: "Liquidez saudável — volume e fluxo estão sustentando o mercado.", en: "Healthy liquidity — volume and flow are sustaining the market." },
  insLiqLow: { pt: "Liquidez baixa — risco de gaps e execução ruim em momentos de estresse.", en: "Low liquidity — risk of gaps and poor execution during stress moves." },
  insOptSkewElevated: { pt: "Skew elevado sugere demanda por proteção — instituições comprando puts.", en: "Elevated skew suggests demand for protection — institutions buying puts." },
  insOptSkewLow: { pt: "Skew baixo e complacência em opções. Proteção barata disponível.", en: "Low skew and complacency in options. Cheap protection available." },
  headlineFavorable: { pt: "Cenário favorável ao risco. Fundamentos, liquidez e sentimento alinhados.", en: "Favorable scenario for risk. Fundamentals, liquidity, and sentiment aligned." },
  headlineModeratePositive: { pt: "Cenário moderadamente positivo. A maioria dos indicadores sustenta a exposição a risco.", en: "Moderately positive scenario. Most indicators support risk exposure." },
  headlineMixedPositive: { pt: "Cenário misto com viés positivo. Sinais conflitantes entre as camadas.", en: "Mixed scenario with a positive bias. Conflicting signals across layers." },
  headlineMixedAlerts: { pt: "Cenário misto com alertas. Equilíbrio entre sinais positivos e negativos.", en: "Mixed scenario with alerts. Balance between positive and negative signals." },
  headlineCautious: { pt: "Cenário cauteloso. Múltiplos indicadores sugerem reduzir risco.", en: "Cautious scenario. Multiple indicators suggest reducing risk." },
  summaryPositiveSignal: { pt: "{n} sinal(is) positivo(s)", en: "{n} positive signal(s)" },
  summaryNegativeSignal: { pt: "{n} sinal(is) negativo(s)", en: "{n} negative signal(s)" },
  summaryAlert: { pt: "{n} alerta(s)", en: "{n} alert(s)" },
  summaryFull: { pt: "JIM identifica {parts} em {n} camadas ativas.", en: "JIM identifies {parts} across {n} active layers." },
  labelPositioning: { pt: "Posicionamento", en: "Positioning" },
  qWhoLong: { pt: "Quem está comprado?", en: "Who is long?" },
  labelVolatility: { pt: "Volatilidade", en: "Volatility" },
  qFearLevel: { pt: "Qual o nível de medo?", en: "What's the fear level?" },
  labelOptions: { pt: "Opções", en: "Options" },
  qHedged: { pt: "O mercado está protegido?", en: "Is the market hedged?" },
  labelLiquidity: { pt: "Liquidez", en: "Liquidity" },
  qWhoInvesting: { pt: "Quem está colocando dinheiro?", en: "Who's putting money in?" },
  labelBreadth: { pt: "Amplitude", en: "Breadth" },
  qWholeMarket: { pt: "O mercado todo está subindo, ou só alguns nomes?", en: "Is the whole market up, or just a few names?" },
  labelSentiment: { pt: "Sentimento", en: "Sentiment" },
  qMarketFeeling: { pt: "O que o mercado está sentindo?", en: "What is the market feeling?" },
  labelMacro: { pt: "Macro", en: "Macro" },
  qEnvFavorsRisk: { pt: "O ambiente favorece o risco?", en: "Does the environment favor risk?" },
  avgSpecNet: { pt: "Spec net médio", en: "Avg spec net" },
  atExtreme: { pt: "Em extremo", en: "At extreme" },
  mostStretched: { pt: "Mais esticado", en: "Most stretched" },
  statusLabel: { pt: "Status", en: "Status" },
  live: { pt: "Ativo", en: "Live" },
  planned: { pt: "Planejado", en: "Planned" },
  vvix: { pt: "VVIX", en: "VVIX" },
  ivRank: { pt: "IV Rank", en: "IV Rank" },
  termStructure: { pt: "Estrutura a Termo", en: "Term Structure" },
  putCallRatio: { pt: "Razão Put/Call", en: "Put/Call Ratio" },
  skew: { pt: "Skew", en: "Skew" },
  regimeIndicator: { pt: "Regime", en: "Regime" },
  darkPoolPct: { pt: "% Dark Pool", en: "Dark Pool %" },
  trackedSymbols: { pt: "Símbolos monitorados", en: "Tracked Symbols" },
  demo: { pt: "Demo", en: "Demo" },
  yes: { pt: "Sim", en: "Yes" },
  no: { pt: "Não", en: "No" },
  source: { pt: "Fonte", en: "Source" },
  pctAbove200: { pt: "% > MM200", en: "% > 200MA" },
  pctAbove50: { pt: "% > MM50", en: "% > 50MA" },
  adRatio: { pt: "Razão A/D", en: "A/D Ratio" },
  signal: { pt: "Sinal", en: "Signal" },
  fearGreed: { pt: "Fear & Greed", en: "Fear & Greed" },
  previousWeek: { pt: "Semana anterior", en: "Previous week" },
  oneWeekAgo: { pt: "1 semana atrás", en: "1 week ago" },
  oneYearAgo: { pt: "1 ano atrás", en: "1 year ago" },
  fedFunds: { pt: "Fed Funds", en: "Fed Funds" },
  yieldCurve: { pt: "Curva de Juros", en: "Yield Curve" },
  creditSpread: { pt: "Spread de Crédito", en: "Credit Spread" },
  policy: { pt: "Política", en: "Policy" },
  roadmapMomentum: { pt: "Momentum", en: "Momentum" },
  qTrendStrong: { pt: "A tendência está forte?", en: "Is the trend strong?" },
  roadmapMktStructure: { pt: "Estrutura de Mercado", en: "Mkt Structure" },
  qHowCorrelated: { pt: "Como os ativos estão correlacionados?", en: "How are assets correlated?" },
  roadmapRiskEngine: { pt: "Motor de Risco", en: "Risk Engine" },
  qHarpianProtected: { pt: "A Harpian está protegida?", en: "Is Harpian protected?" },
  badgeLive: { pt: "ATIVO", en: "LIVE" },
  badgePartial: { pt: "PARCIAL", en: "PARTIAL" },
  badgePlanned: { pt: "PLANEJADO", en: "PLANNED" },
  scaleLabel: { pt: "0—100", en: "0—100" },
  jimIntelligence: { pt: "JIM INTELLIGENCE", en: "JIM INTELLIGENCE" },
  jimSubtitle: { pt: "Leitura profunda · onde as camadas se contradizem", en: "Deep reading · where the layers contradict each other" },
  trend: { pt: "TENDÊNCIA", en: "TREND" },
  howToReadIt: { pt: "COMO INTERPRETAR", en: "HOW TO READ IT" },
  positiveSignals: { pt: "SINAIS POSITIVOS", en: "POSITIVE SIGNALS" },
  negativeSignals: { pt: "SINAIS NEGATIVOS", en: "NEGATIVE SIGNALS" },
  alerts: { pt: "ALERTAS", en: "ALERTS" },
  headerTitle: { pt: "Market DNA", en: "Market DNA" },
  subLayers: { pt: "camadas com dados reais", en: "layers with real data" },
  subScore: { pt: "Score 0–100 por dimensão", en: "Score 0–100 per dimension" },
  subQuant: { pt: "Síntese quantitativa para decisões de alocação", en: "Quantitative synthesis for allocation decisions" },
  loadingData: { pt: "Carregando dados...", en: "Loading data..." },
  unavailableTitle: { pt: "Market DNA indisponível", en: "Market DNA unavailable" },
  unavailableBody: { pt: "gov-data offline — {api} (porta 8877). Prefiro não mostrar um score de Convicção a mostrar um número que não veio das fontes.", en: "gov-data offline — {api} (port 8877). I'd rather not show a Conviction score than show a number that didn't come from the sources." },
  intelligenceRadar: { pt: "RADAR DE INTELIGÊNCIA", en: "INTELLIGENCE RADAR" },
  scorePerLayer: { pt: "SCORE POR CAMADA", en: "SCORE PER LAYER" },
  conviction: { pt: "CONVICÇÃO", en: "CONVICTION" },
  liveCountLabel: { pt: "ATIVO", en: "LIVE" },
  partCountLabel: { pt: "PARC", en: "PART" },
  planAbbrev: { pt: "PLAN", en: "PLAN" },
  convictionTooltip: { pt: "Convicção = média das {n} camadas com dados reais", en: "Conviction = average of the {n} layers with real data" },
  avgOf: { pt: "média de {n}", en: "avg of {n}" },
  underConstruction: { pt: "EM CONSTRUÇÃO — AINDA NÃO INCLUÍDO NA CONVICÇÃO", en: "UNDER CONSTRUCTION — NOT YET INCLUDED IN CONVICTION" },
  legendLive: { pt: "Ativo (dados reais)", en: "Live (real data)" },
  legendPartial: { pt: "Parcial", en: "Partial" },
  sourcesLegend: { pt: "Fontes: CFTC COT · CBOE · FINRA · Yahoo · CNN F&G · FRED · SEC", en: "Sources: CFTC COT · CBOE · FINRA · Yahoo · CNN F&G · FRED · SEC" },
  jimScreenDesc: { pt: "Market DNA: camadas de inteligência de mercado com dados reais (CFTC COT, CBOE, FINRA, Yahoo, CNN F&G, FRED). Score 0-100 por dimensão; a média considera apenas camadas com dados reais.", en: "Market DNA: market intelligence layers with real data (CFTC COT, CBOE, FINRA, Yahoo, CNN F&G, FRED). Score 0-100 per dimension; the average only considers layers with real data." },
  jimBriefingLayers: { pt: "Market DNA: **{n} camadas com dados reais**. Convicção **{avg}** ({regime}).", en: "Market DNA: **{n} layers with real data**. Conviction **{avg}** ({regime})." },
  jimBriefingCounts: { pt: "{live} ativas, {partial} parciais.", en: "{live} live, {partial} partial." },
  jimBriefingHeadline: { pt: "Manchete: {headline}", en: "Headline: {headline}" },
  suggestWeakestLayer: { pt: "Qual camada está mais fraca agora?", en: "Which layer is weakest right now?" },
  suggestRiskOnOff: { pt: "O mercado está em Risk-On ou Risk-Off?", en: "Is the market in Risk-On or Risk-Off?" },
  suggestContrarian: { pt: "Que sinais contrários existem?", en: "What contrarian signals exist?" },
} as const;
type TKey = keyof typeof TR;

interface RawCotRow { market: string; spec_net_pct_oi?: number; spec_sentiment?: string }

const COT_SHORT: Record<string, string> = {
  GOLD: "gold", SILVER: "silver", BITCOIN: "bitcoin", "EURO FX": "euro",
  "VIX FUTURES": "VIX", "JAPANESE YEN": "yen", "CRUDE OIL": "crude oil",
};
function cotShortName(market: string): string {
  const raw = market.split(" - ")[0].trim();
  return COT_SHORT[raw] || raw.toLowerCase();
}

// ---------- Types ----------
export interface IntelLayer {
  key: string;
  label: string;
  question: string;
  icon: string;
  score: number;
  status: "live" | "partial" | "planned";
  source: string;
  color: string;
  indicators: { name: string; value: string; color?: string }[];
}

interface JimInsight {
  headline: string;
  headlineColor: string;
  positives: string[];
  negatives: string[];
  alerts: string[];
  summary: string;
}

// ---------- Helpers ----------
function scoreColor(s: number): string {
  if (s >= 80) return "#E74C3C";
  if (s >= 65) return "#E67E22";
  if (s >= 45) return "#C9A02C";
  if (s >= 25) return "#4A90D9";
  return "#2ECC71";
}

function scoreLabel(s: number, t: (k: TKey) => string): string {
  if (s >= 80) return t("scoreExtreme");
  if (s >= 65) return t("scoreHigh");
  if (s >= 45) return t("scoreNeutral");
  if (s >= 25) return t("scoreLow");
  return t("scoreExtremeLow");
}

export function regimeLabel(avg: number, t?: (k: TKey) => string): { label: string; color: string; icon: string } {
  const tr = t || ((k: TKey) => TR[k].en);
  if (avg >= 70) return { label: "RISK-ON", color: "#2ECC71", icon: "ti-trending-up" };
  if (avg >= 55) return { label: tr("regimeCautious"), color: "#C9A02C", icon: "ti-alert-triangle" };
  if (avg >= 40) return { label: tr("regimeMixed"), color: "#E67E22", icon: "ti-arrows-split" };
  return { label: "RISK-OFF", color: "#E74C3C", icon: "ti-shield-off" };
}

function generateJimInsight(layers: IntelLayer[], t: (k: TKey) => string): JimInsight {
  const byKey = Object.fromEntries(layers.map((l) => [l.key, l]));
  const positives: string[] = [];
  const negatives: string[] = [];
  const alerts: string[] = [];

  const vol = byKey["volatility"]?.score ?? 50;
  const breadth = byKey["breadth"]?.score ?? 50;
  const sent = byKey["sentiment"]?.score ?? 50;
  const macro = byKey["macro"]?.score ?? 50;
  const pos = byKey["positioning"]?.score ?? 50;
  const liq = byKey["liquidity"]?.score ?? 50;
  const opt = byKey["options"]?.score ?? 50;

  // Macro
  if (macro >= 70) positives.push(t("insMacroStrong"));
  else if (macro >= 55) positives.push(t("insMacroNeutralPos"));
  else if (macro < 35) negatives.push(t("insMacroAdverse"));

  // Volatility
  if (vol <= 25) {
    positives.push(t("insVolVeryLow"));
    alerts.push(t("insVolAlertCompressed"));
  } else if (vol <= 40) {
    positives.push(t("insVolLowModerate"));
  } else if (vol >= 75) {
    negatives.push(t("insVolElevated"));
    alerts.push(t("insVolAlertAbove25"));
  }

  // Breadth
  if (breadth >= 65) positives.push(t("insBreadthHealthy").replace("{pct}", String(breadth)));
  else if (breadth >= 50) positives.push(t("insBreadthAcceptable").replace("{pct}", String(breadth)));
  else if (breadth < 35) negatives.push(t("insBreadthWeak").replace("{pct}", String(breadth)));

  // Sentiment
  if (sent >= 80) {
    negatives.push(t("insSentEuphoric"));
    alerts.push(t("insSentAlertEuphoria"));
  } else if (sent <= 25) {
    positives.push(t("insSentExtremePessimism"));
  } else if (sent <= 40) {
    positives.push(t("insSentFearTerritory"));
  } else if (sent >= 65) {
    negatives.push(t("insSentElevated"));
  }

  // Positioning
  if (pos >= 80) {
    negatives.push(t("insPosBullishExtreme"));
    alerts.push(t("insPosAlertExtremeCot"));
  } else if (pos <= 20) {
    positives.push(t("insPosBearishExtreme"));
  }

  // Liquidity
  if (liq >= 65) positives.push(t("insLiqHealthy"));
  else if (liq < 35) negatives.push(t("insLiqLow"));

  // Options
  if (opt >= 75) alerts.push(t("insOptSkewElevated"));
  else if (opt <= 25) alerts.push(t("insOptSkewLow"));

  // Build headline
  let headline: string;
  let headlineColor: string;
  const avg = Math.round(layers.reduce((s, l) => s + l.score, 0) / layers.length);

  if (avg >= 70 && negatives.length === 0) {
    headline = t("headlineFavorable");
    headlineColor = "#2ECC71";
  } else if (avg >= 55 && negatives.length <= 1) {
    headline = t("headlineModeratePositive");
    headlineColor = "#4A90D9";
  } else if (avg >= 40) {
    headline = positives.length > negatives.length
      ? t("headlineMixedPositive")
      : t("headlineMixedAlerts");
    headlineColor = "#C9A02C";
  } else {
    headline = t("headlineCautious");
    headlineColor = "#E74C3C";
  }

  const summaryParts: string[] = [];
  if (positives.length > 0) summaryParts.push(t("summaryPositiveSignal").replace("{n}", String(positives.length)));
  if (negatives.length > 0) summaryParts.push(t("summaryNegativeSignal").replace("{n}", String(negatives.length)));
  if (alerts.length > 0) summaryParts.push(t("summaryAlert").replace("{n}", String(alerts.length)));
  const summary = t("summaryFull").replace("{parts}", summaryParts.join(", ")).replace("{n}", String(layers.filter(l => l.status !== "planned").length));

  return { headline, headlineColor, positives, negatives, alerts, summary };
}

// ---------- API Integration ----------
function fmtNum(v: number | null | undefined, dec = 1): string {
  if (v == null) return "—";
  return v.toFixed(dec);
}

function volScore(vix: number | null): number {
  if (vix == null) return 50;
  if (vix >= 35) return 95;
  if (vix >= 25) return 75;
  if (vix >= 20) return 55;
  if (vix >= 15) return 35;
  return 15;
}

function fgToScore(fg: number | null): number {
  if (fg == null) return 50;
  return Math.round(fg);
}

function breadthToScore(pct200: number | null): number {
  if (pct200 == null) return 50;
  return Math.round(pct200);
}

function macroScore(yieldSignal: string | null, creditSignal: string | null): number {
  let s = 50;
  if (yieldSignal === "Normal") s += 15;
  if (yieldSignal === "Inverted") s -= 20;
  if (creditSignal === "Tight") s += 15;
  if (creditSignal === "Normal") s += 5;
  if (creditSignal === "Wide") s -= 10;
  if (creditSignal === "Stress") s -= 25;
  return Math.max(0, Math.min(100, s));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildLayersFromApi(api: any, t: (k: TKey) => string = (k) => TR[k].en): IntelLayer[] {
  const layers: IntelLayer[] = [];
  const apiLayers = api?.layers || {};

  // gov-data returns positioning.data as a LIST of COT markets (one per
  // contract), not as an aggregated object. We aggregate it here: spec_net_pct_oi ranges
  // from -100 (everyone short) to +100 (everyone long); we normalize it to
  // 0—100 with 50 = neutral, keeping the screen's convention (high = stretched).
  const cotRows: RawCotRow[] = Array.isArray(apiLayers.positioning?.data) ? apiLayers.positioning.data : [];
  const avgSpec = cotRows.length
    ? cotRows.reduce((s, r) => s + (r.spec_net_pct_oi ?? 0), 0) / cotRows.length
    : null;
  const cotScore = avgSpec != null ? Math.round(Math.max(0, Math.min(100, (avgSpec + 100) / 2))) : 50;
  const extremeRows = cotRows.filter((r) => (r.spec_sentiment || "").startsWith("EXTREME"));
  const stretched = cotRows.length
    ? [...cotRows].sort((a, b) => Math.abs(b.spec_net_pct_oi ?? 0) - Math.abs(a.spec_net_pct_oi ?? 0))[0]
    : null;
  layers.push({
    key: "positioning", label: t("labelPositioning"), question: t("qWhoLong"),
    icon: "ti-users-group", score: cotScore,
    status: cotRows.length ? "live" : "planned",
    source: "CFTC COT (Commitments of Traders)", color: "#4A90D9",
    indicators: [
      { name: t("avgSpecNet"), value: avgSpec != null ? `${avgSpec > 0 ? "+" : ""}${fmtNum(avgSpec)}% OI` : "—", color: cotScore >= 70 ? "#E67E22" : cotScore <= 30 ? "#4A90D9" : undefined },
      { name: t("atExtreme"), value: cotRows.length ? `${extremeRows.length} of ${cotRows.length}` : "—", color: extremeRows.length >= 2 ? "#E67E22" : undefined },
      { name: t("mostStretched"), value: stretched ? `${cotShortName(stretched.market)} ${fmtNum(stretched.spec_net_pct_oi ?? 0, 0)}%` : "—" },
      { name: t("statusLabel"), value: cotRows.length ? t("live") : t("planned"), color: cotRows.length ? "#2ECC71" : "#7d96b3" },
    ],
  });

  const cboe = apiLayers.volatility?.data;
  const vix = cboe?.vix;
  const vScore = volScore(vix?.current);
  layers.push({
    key: "volatility", label: t("labelVolatility"), question: t("qFearLevel"),
    icon: "ti-bolt", score: vScore,
    status: apiLayers.volatility ? "live" : "planned",
    source: "CBOE + Yahoo", color: "#E74C3C",
    indicators: [
      { name: "VIX", value: vix?.current != null ? fmtNum(vix.current) : "—", color: (vix?.current ?? 20) < 18 ? "#2ECC71" : (vix?.current ?? 20) > 25 ? "#E74C3C" : undefined },
      { name: t("vvix"), value: cboe?.vvix != null ? fmtNum(cboe.vvix) : "—" },
      { name: t("ivRank"), value: vix?.iv_rank != null ? `${fmtNum(vix.iv_rank)}%` : "—" },
      { name: t("termStructure"), value: vix?.term_structure || "—", color: vix?.term_structure === "Contango" ? "#2ECC71" : "#E74C3C" },
    ],
  });

  layers.push({
    key: "options", label: t("labelOptions"), question: t("qHedged"),
    icon: "ti-chart-dots-3", score: cboe ? Math.round(50 + (cboe.skew ? (cboe.skew - 130) / 2 : 0)) : 50,
    status: cboe ? "partial" : "planned",
    source: "CBOE", color: "#9B59B6",
    indicators: [
      { name: t("putCallRatio"), value: cboe?.put_call?.put_call_ratio != null ? fmtNum(cboe.put_call.put_call_ratio, 2) : "—" },
      { name: t("ivRank"), value: vix?.iv_rank != null ? `${fmtNum(vix.iv_rank)}%` : "—" },
      { name: t("skew"), value: cboe?.skew != null ? fmtNum(cboe.skew, 0) : "—" },
      { name: t("regimeIndicator"), value: cboe?.regime || "—" },
    ],
  });

  const finra = apiLayers.liquidity?.data;
  const darkPct = finra?.summary?.dark_pool_pct;
  layers.push({
    key: "liquidity", label: t("labelLiquidity"), question: t("qWhoInvesting"),
    icon: "ti-droplet-half-2", score: finra ? (darkPct != null ? Math.round(100 - darkPct) : 55) : 50,
    status: apiLayers.liquidity ? "partial" : "planned",
    source: "FINRA ATS", color: "#1ABC9C",
    indicators: [
      { name: t("darkPoolPct"), value: darkPct != null ? `${fmtNum(darkPct)}%` : "—" },
      { name: t("trackedSymbols"), value: finra?.summary?.tracked_symbols != null ? `${finra.summary.tracked_symbols}` : "—" },
      { name: t("demo"), value: finra?.is_demo ? t("yes") : t("no"), color: finra?.is_demo ? "#E67E22" : "#2ECC71" },
      { name: t("source"), value: finra?.source ? "FINRA" : "—" },
    ],
  });

  const breadthData = apiLayers.breadth?.data;
  const bScore = breadthToScore(breadthData?.pct_above_200ma);
  layers.push({
    key: "breadth", label: t("labelBreadth"), question: t("qWholeMarket"),
    icon: "ti-chart-histogram", score: bScore,
    status: apiLayers.breadth ? "live" : "planned",
    source: "Yahoo (calculated)", color: "#3498DB",
    indicators: [
      { name: t("pctAbove200"), value: breadthData?.pct_above_200ma != null ? `${fmtNum(breadthData.pct_above_200ma)}%` : "—" },
      { name: t("pctAbove50"), value: breadthData?.pct_above_50ma != null ? `${fmtNum(breadthData.pct_above_50ma)}%` : "—" },
      { name: t("adRatio"), value: breadthData?.ad_ratio != null ? fmtNum(breadthData.ad_ratio, 2) : "—", color: (breadthData?.ad_ratio ?? 1) > 1 ? "#2ECC71" : "#E74C3C" },
      { name: t("signal"), value: breadthData?.breadth_signal || "—", color: breadthData?.breadth_signal === "Strong" ? "#2ECC71" : breadthData?.breadth_signal === "Healthy" ? "#4A90D9" : "#E67E22" },
    ],
  });

  const sentData = apiLayers.sentiment?.data;
  const fgScore = fgToScore(sentData?.score);
  layers.push({
    key: "sentiment", label: t("labelSentiment"), question: t("qMarketFeeling"),
    icon: "ti-mood-smile", score: fgScore,
    status: apiLayers.sentiment ? "partial" : "planned",
    source: "CNN Fear & Greed", color: "#E67E22",
    indicators: [
      { name: t("fearGreed"), value: sentData?.score != null ? `${fmtNum(sentData.score, 0)} ${sentData.rating || ""}` : "—", color: (sentData?.score ?? 50) >= 75 ? "#E74C3C" : (sentData?.score ?? 50) <= 25 ? "#2ECC71" : undefined },
      { name: t("previousWeek"), value: sentData?.previous_close != null ? fmtNum(sentData.previous_close, 0) : "—" },
      { name: t("oneWeekAgo"), value: sentData?.week_ago != null ? fmtNum(sentData.week_ago, 0) : "—" },
      { name: t("oneYearAgo"), value: sentData?.year_ago != null ? fmtNum(sentData.year_ago, 0) : "—" },
    ],
  });

  const fred = apiLayers.macro?.data;
  const mScore = macroScore(fred?.yield_curve_signal, fred?.credit_signal);
  layers.push({
    key: "macro", label: t("labelMacro"), question: t("qEnvFavorsRisk"),
    icon: "ti-building-bank", score: mScore,
    status: apiLayers.macro ? "live" : "planned",
    source: "FRED", color: "#7B68EE",
    indicators: [
      { name: t("fedFunds"), value: fred?.series?.fed_funds?.value != null ? `${fmtNum(fred.series.fed_funds.value, 2)}%` : "—" },
      { name: t("yieldCurve"), value: fred?.yield_curve_spread != null ? `${fred.yield_curve_spread > 0 ? "+" : ""}${fmtNum(fred.yield_curve_spread * 100, 0)}bp` : "—", color: fred?.yield_curve_signal === "Normal" ? "#2ECC71" : "#E74C3C" },
      { name: t("creditSpread"), value: fred?.credit_spread != null ? `${fmtNum(fred.credit_spread, 2)}%` : "—" },
      { name: t("policy"), value: fred?.policy_stance || "—" },
    ],
  });

  return layers;
}

// Layers not yet built. They do NOT enter buildLayersFromApi: they used to
// be pushed with `score: 50, status: "planned"` and that invented 50
// fed into the Conviction average — the number at the top of the screen was part
// real data, part placeholder. Now they show up only as a declared roadmap, with no
// number, and don't contaminate any calculation.
export function getRoadmapLayers(t: (k: TKey) => string): { label: string; source: string; question: string }[] {
  return [
    { label: t("roadmapMomentum"), source: "AlphaDroid · TPT · DEMA", question: t("qTrendStrong") },
    { label: t("roadmapMktStructure"), source: "Yahoo (calculated)", question: t("qHowCorrelated") },
    { label: t("roadmapRiskEngine"), source: "StormGuard · Risk Number", question: t("qHarpianProtected") },
  ];
}

// ---------- Components ----------

function ScoreBar({ score, color, h = 6 }: { score: number; color: string; h?: number }) {
  return (
    <div style={{ flex: 1, height: h, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 3, transition: "width .4s", opacity: 0.8 }} />
    </div>
  );
}

function LayerCard({ layer }: { layer: IntelLayer }) {
  const { lang } = useI18n();
  const t = (k: TKey) => TR[k][lang];
  const sc = scoreColor(layer.score);
  const statusBadge = layer.status === "live"
    ? { label: t("badgeLive"), bg: "rgba(46,204,113,.12)", color: "#2ECC71" }
    : layer.status === "partial"
    ? { label: t("badgePartial"), bg: "rgba(230,126,34,.10)", color: "#E67E22" }
    : { label: t("badgePlanned"), bg: "rgba(125,150,179,.08)", color: "#7d96b3" };

  return (
    <div className="card" style={{ padding: "14px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <i className={`ti ${layer.icon}`} style={{ fontSize: 20, color: layer.color }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--tx)" }}>{layer.label}</span>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4,
          background: statusBadge.bg, color: statusBadge.color, fontFamily: "var(--mono)",
        }}>
          {statusBadge.label}
        </span>
      </div>

      {/* Question */}
      <div style={{ fontSize: 12, color: "var(--tx3)", marginBottom: 10, fontStyle: "italic" }}>
        {layer.question}
      </div>

      {/* Score */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <span style={{ fontSize: 36, fontWeight: 800, fontFamily: "var(--mono)", color: sc, lineHeight: 1 }}>
          {layer.score}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: sc, fontFamily: "var(--mono)", fontWeight: 700 }}>{scoreLabel(layer.score, t)}</span>
            <span style={{ fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mono)" }}>{t("scaleLabel")}</span>
          </div>
          <ScoreBar score={layer.score} color={sc} h={7} />
        </div>
      </div>

      {/* Indicators grid — BIGGER fonts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", marginBottom: 8 }}>
        {layer.indicators.map((ind) => (
          <div key={ind.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--tx3)" }}>{ind.name}</span>
            <span style={{ fontSize: 14, fontFamily: "var(--mono)", fontWeight: 700, color: ind.color || "var(--tx)" }}>
              {ind.value}
            </span>
          </div>
        ))}
      </div>

      {/* Source */}
      <div style={{ fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mono)", borderTop: "1px solid var(--line)", paddingTop: 6 }}>
        {layer.source}
      </div>
    </div>
  );
}

// default size 280 = compact version (Dashboard card). From 340 onward the radar
// switches to "large" mode: full label + score at the tip, bigger fonts.
export function RadarSvg({ layers, size = 280 }: { layers: IntelLayer[]; size?: number }) {
  const n = layers.length;
  const big = size >= 340;
  const cx = size / 2, cy = size / 2;
  // Extra padding around the radar so the vertex labels (now bigger, 11px vs. old 8px)
  // don't clip the SVG viewport on the small dashboard widget.
  const maxR = cx - (big ? 58 : 34);
  const angleStep = (2 * Math.PI) / n;

  const gridLevels = [20, 40, 60, 80, 100];
  const points = layers.map((l, i) => {
    const a = -Math.PI / 2 + i * angleStep;
    const r = (l.score / 100) * maxR;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });

  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", margin: "0 auto", maxWidth: "100%" }}>
      {gridLevels.map((lv) => (
        <circle key={lv} cx={cx} cy={cy} r={(lv / 100) * maxR}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={lv === 100 ? 1.5 : 1} />
      ))}
      {layers.map((l, i) => {
        const a = -Math.PI / 2 + i * angleStep;
        const ex = cx + maxR * Math.cos(a);
        const ey = cy + maxR * Math.sin(a);
        const lx = cx + (maxR + (big ? 24 : 16)) * Math.cos(a);
        const ly = cy + (maxR + (big ? 24 : 16)) * Math.sin(a);
        return (
          <g key={l.key}>
            <line x1={cx} y1={cy} x2={ex} y2={ey} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
            <text x={lx} y={big ? ly - 5 : ly} textAnchor="middle" dominantBaseline="middle"
              fill={l.color} fontSize={big ? 12 : 11} fontFamily="var(--mono)" fontWeight={700}>
              {big ? l.label.toUpperCase() : l.label.substring(0, 6).toUpperCase()}
            </text>
            {big && (
              <text x={lx} y={ly + 8} textAnchor="middle" dominantBaseline="middle"
                fill={scoreColor(l.score)} fontSize={10} fontFamily="var(--mono)" fontWeight={700}>
                {l.score}
              </text>
            )}
          </g>
        );
      })}
      <polygon points={polygon} fill="rgba(201,160,44,.12)" stroke="var(--gold)" strokeWidth={big ? 2.5 : 2} strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={big ? 5 : 4} fill={scoreColor(layers[i].score)} stroke="var(--bg1)" strokeWidth={2} />
      ))}
    </svg>
  );
}

// ---------- JIM's deep reading (cross-layer interpretation) ----------
const TONE_COLOR: Record<string, string> = { pos: "#2ECC71", neg: "#E74C3C", neu: "#4A90D9" };
const TONE_ICON: Record<string, string> = { pos: "ti-circle-check", neg: "ti-alert-circle", neu: "ti-info-circle" };

function DeepDriverRow({ d }: { d: Driver }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 9, alignItems: "flex-start" }}>
      <i className={`ti ${TONE_ICON[d.tone]}`} style={{ fontSize: 13, color: TONE_COLOR[d.tone], marginTop: 2, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--tx)", marginBottom: 1 }}>{d.label}</div>
        <div style={{ fontSize: 12.5, color: "var(--tx2)", lineHeight: 1.6 }}>{d.detail}</div>
      </div>
    </div>
  );
}

// JIM's single panel — occupies the right third, from the top down to the end of the
// indicator cards. Combines the deep reading (cross-layer interpretation)
// with the positive/negative signals and alerts.
function JimPanel({ raw, insight, avgScore, regime }: {
  raw: DnaRaw | null;
  insight: JimInsight;
  avgScore: number;
  regime: { label: string; color: string };
}) {
  const { lang } = useI18n();
  const t = (k: TKey) => TR[k][lang];
  const block = buildDna(raw);
  return (
    <div className="card" style={{ padding: "14px 18px", borderColor: "rgba(201,160,44,.25)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: "linear-gradient(135deg, #C9A02C 0%, #E6B800 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <i className="ti ti-brain" style={{ fontSize: 16, color: "#0a1628" }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)", fontFamily: "var(--mono)", letterSpacing: ".05em" }}>
            {t("jimIntelligence")}
          </div>
          <div style={{ fontSize: 10, color: "var(--tx3)" }}>{t("jimSubtitle")}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--mono)", color: scoreColor(avgScore) }}>{avgScore}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
            background: `${regime.color}18`, color: regime.color, fontFamily: "var(--mono)",
          }}>{regime.label}</span>
        </div>
      </div>

      {/* Headline */}
      <div style={{
        fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: insight.headlineColor,
        padding: "8px 12px", marginBottom: 8, borderRadius: 6,
        background: `${insight.headlineColor}10`, borderLeft: `3px solid ${insight.headlineColor}`,
      }}>{insight.headline}</div>

      {/* Body: grows together with the indicators column — all the text stays
          readable by scrolling the page, with no scrollbar of its own. */}
      <div style={{ flex: 1 }}>
        {block && (
          <>
            <div style={{
              fontSize: 12.5, fontWeight: 600, lineHeight: 1.5, color: "var(--tx)",
              padding: "7px 11px", marginBottom: 10, borderRadius: 6,
              background: "rgba(123,104,238,.10)", borderLeft: "3px solid #7B68EE",
            }}>{block.leitura}</div>

            {block.porque.map((d, i) => <DeepDriverRow key={i} d={d} />)}

            <div style={{ marginTop: 8, paddingTop: 10, borderTop: "1px solid var(--line)", marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--tx3)", fontFamily: "var(--mono)", letterSpacing: ".06em", marginBottom: 4 }}>
                <i className="ti ti-trending-up" style={{ fontSize: 11, marginRight: 4 }} />{t("trend")}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--tx2)", lineHeight: 1.6, marginBottom: 10 }}>{block.tendencia}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gold)", fontFamily: "var(--mono)", letterSpacing: ".06em", marginBottom: 4 }}>
                <i className="ti ti-target-arrow" style={{ fontSize: 11, marginRight: 4 }} />{t("howToReadIt")}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--tx2)", lineHeight: 1.6 }}>{block.impacto}</div>
            </div>
          </>
        )}

        {insight.positives.length > 0 && (
          <div style={{ paddingTop: 10, borderTop: "1px solid var(--line)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#2ECC71", fontFamily: "var(--mono)", marginBottom: 4, letterSpacing: ".06em" }}>
              <i className="ti ti-circle-check" style={{ fontSize: 12, marginRight: 4 }} />{t("positiveSignals")}
            </div>
            {insight.positives.map((p, i) => (
              <div key={i} style={{ fontSize: 12.5, color: "var(--tx2)", lineHeight: 1.6, paddingLeft: 10, marginBottom: 3 }}>• {p}</div>
            ))}
          </div>
        )}

        {insight.negatives.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#E74C3C", fontFamily: "var(--mono)", marginBottom: 4, letterSpacing: ".06em" }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 12, marginRight: 4 }} />{t("negativeSignals")}
            </div>
            {insight.negatives.map((n, i) => (
              <div key={i} style={{ fontSize: 12.5, color: "var(--tx2)", lineHeight: 1.6, paddingLeft: 10, marginBottom: 3 }}>• {n}</div>
            ))}
          </div>
        )}

        {insight.alerts.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#E67E22", fontFamily: "var(--mono)", marginBottom: 4, letterSpacing: ".06em" }}>
              <i className="ti ti-alert-triangle" style={{ fontSize: 12, marginRight: 4 }} />{t("alerts")}
            </div>
            {insight.alerts.map((a, i) => (
              <div key={i} style={{ fontSize: 12.5, color: "#E67E22", lineHeight: 1.6, paddingLeft: 10, marginBottom: 3 }}>⚠ {a}</div>
            ))}
          </div>
        )}
      </div>

      <div style={{ fontSize: 10, color: "var(--tx3)", fontStyle: "italic", borderTop: "1px solid var(--line)", paddingTop: 8, marginTop: 8 }}>
        {insight.summary}
      </div>
    </div>
  );
}

// ---------- Main ----------
export default function MarketDna({ go }: { go?: (id: ScreenId, param?: string) => void }) {
  const { lang } = useI18n();
  const t = (k: TKey) => TR[k][lang];
  // Starts empty, not with fake layers: the initial state (and the error
  // fallback) used to be buildFallbackLayers() — 10 layers with a score of 50 — which made
  // the screen show "Conviction 50 · CAUTIOUS" while gov-data was offline.
  const [layers, setLayers] = useState<IntelLayer[]>([]);
  const [raw, setRaw] = useState<DnaRaw | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    fetch(`${GOV_API}/api/market-dna`)
      .then((r) => r.json())
      .then((data) => { setRaw(data); setLayers(buildLayersFromApi(data, t)); setLoading(false); })
      .catch(() => { setErr(true); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const avgScore = layers.length ? Math.round(layers.reduce((s, l) => s + l.score, 0) / layers.length) : 0;
  const liveCount = layers.filter((l) => l.status === "live").length;
  const partialCount = layers.filter((l) => l.status === "partial").length;
  const regime = regimeLabel(avgScore, t);
  const jimInsight = generateJimInsight(layers, t);

  useEffect(() => {
    publishScreenData(
      "market-dna",
      t("jimScreenDesc"),
      layers.map((l) => ({ camada: l.label, score: l.score, status: l.status, source: l.source })),
      {
        briefing:
          t("jimBriefingLayers").replace("{n}", String(layers.length)).replace("{avg}", String(avgScore)).replace("{regime}", regime.label) + " " +
          t("jimBriefingCounts").replace("{live}", String(liveCount)).replace("{partial}", String(partialCount)) + " " +
          t("jimBriefingHeadline").replace("{headline}", jimInsight.headline),
        suggestions: [
          t("suggestWeakestLayer"),
          t("suggestRiskOnOff"),
          t("suggestContrarian"),
        ],
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avgScore, regime.label, liveCount, partialCount, lang]);

  return (
    <div className="screen">
      <div className="flex between wrap" style={{ alignItems: "flex-start", gap: 10 }}>
        <div className="flex" style={{ alignItems: "baseline", gap: 14, flexWrap: "wrap", flex: 1 }}>
          <div className="h1" style={{ margin: 0 }}>{t("headerTitle")}</div>
          <div className="sub" style={{ margin: 0 }}>
            {layers.length || "—"} {t("subLayers")} &middot; {t("subScore")} &middot; {t("subQuant")}
            {loading && <span style={{ marginLeft: 8, color: "#C9A02C" }}> {t("loadingData")}</span>}
          </div>
        </div>
        <BackToVisao go={go} />
      </div>

      {/* gov-data down: say we don't know, instead of showing 50 */}
      {!loading && (err || !layers.length) && (
        <div className="placeholder" style={{ marginTop: 12 }}>
          <i className="ti ti-cloud-off" />
          <b style={{ display: "block", marginTop: 8 }}>{t("unavailableTitle")}</b>
          <div className="muted" style={{ marginTop: 4 }}>
            {t("unavailableBody").split("{api}")[0]}<span style={{ fontFamily: "var(--mono)" }}>api_server.py</span>{t("unavailableBody").split("{api}")[1]}
          </div>
        </div>
      )}

      {!loading && !err && layers.length > 0 && (<>
      {/* Top summary strip moved INTO the "Score per Layer" card header (below)
          — reclaims a full row of vertical space at the top of the page. */}

      {/* Three thirds: radar | score per layer | JIM. The first two thirds
          form the left column — charts at the top, and the indicator cards
          in 2 columns below. JIM occupies the entire right third and
          tracks the height of the indicators: scroll the page and it follows alongside. */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, alignItems: "stretch" }}>
        {/* Left two thirds */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Top: radar (1/3) + score per layer (1/3) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "stretch" }}>
            <div className="card" style={{ padding: 12, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--tx2)", marginBottom: 6, fontFamily: "var(--mono)", letterSpacing: ".06em" }}>
                {t("intelligenceRadar")}
              </div>
              <RadarSvg layers={layers} size={380} />
            </div>

            <div className="card" style={{ padding: "12px 16px", display: "flex", flexDirection: "column" }}>
              {/* Rich header — absorbs the old top summary strip (conviction score,
                  regime pill, live/partial counters, formula note) so the top of the
                  page gains a full row of vertical space. */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid var(--line2)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--tx2)", fontFamily: "var(--mono)", letterSpacing: ".06em" }}>
                  {t("scorePerLayer")}
                </div>
                <span style={{ width: 1, height: 18, background: "var(--line)" }} />
                <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--mono)", color: scoreColor(avgScore), lineHeight: 1 }}>
                    {avgScore}
                  </span>
                  <span style={{ fontSize: 9.5, color: "var(--tx3)", fontFamily: "var(--mono)" }}>{t("conviction")}</span>
                </div>
                <span style={{
                  fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 4,
                  background: `${regime.color}18`, color: regime.color, fontFamily: "var(--mono)",
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}>
                  <i className={`ti ${regime.icon}`} style={{ fontSize: 11 }} />
                  {regime.label}
                </span>
                <span style={{ fontSize: 10.5, fontFamily: "var(--mono)", color: "#2ECC71" }}>{liveCount} {t("liveCountLabel")}</span>
                <span style={{ fontSize: 10.5, fontFamily: "var(--mono)", color: "#E67E22" }}>{partialCount} {t("partCountLabel")}</span>
                <span
                  title={t("convictionTooltip").replace("{n}", String(layers.length))}
                  style={{ fontSize: 9.5, color: "var(--tx3)", marginLeft: "auto", cursor: "help" }}
                >
                  {t("avgOf").replace("{n}", String(layers.length))}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1, justifyContent: "center" }}>
                {[...layers].sort((a, b) => b.score - a.score).map((l) => (
                  <div key={l.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <i className={`ti ${l.icon}`} style={{ fontSize: 15, color: l.color, width: 20, textAlign: "center" }} />
                    <span style={{ fontSize: 13, color: "var(--tx)", width: 92, flexShrink: 0 }}>{l.label}</span>
                    <ScoreBar score={l.score} color={scoreColor(l.score)} h={7} />
                    <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--mono)", color: scoreColor(l.score), width: 30, textAlign: "right" }}>
                      {l.score}
                    </span>
                    <span style={{
                      fontSize: 9, fontFamily: "var(--mono)", padding: "2px 6px", borderRadius: 3, flexShrink: 0,
                      background: l.status === "live" ? "rgba(46,204,113,.12)" : l.status === "partial" ? "rgba(230,126,34,.10)" : "rgba(125,150,179,.08)",
                      color: l.status === "live" ? "#2ECC71" : l.status === "partial" ? "#E67E22" : "#7d96b3",
                    }}>
                      {l.status === "live" ? t("liveCountLabel") : l.status === "partial" ? t("partCountLabel") : t("planAbbrev")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Below: the indicators (the numbers) in 2 columns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {layers.map((l) => <LayerCard key={l.key} layer={l} />)}
          </div>
        </div>

        {/* Right third: JIM, from the top to the end of the indicators */}
        <JimPanel raw={raw} insight={jimInsight} avgScore={avgScore} regime={regime} />
      </div>

      {/* Declared roadmap — no number, doesn't count toward anything */}
      <div className="card" style={{ marginTop: 12, padding: "10px 14px", borderStyle: "dashed" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--tx3)", fontFamily: "var(--mono)", letterSpacing: ".06em", marginBottom: 6 }}>
          <i className="ti ti-tools" style={{ fontSize: 12, marginRight: 5 }} />{t("underConstruction")}
        </div>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          {getRoadmapLayers(t).map((r) => (
            <div key={r.label} style={{ fontSize: 11, color: "var(--tx3)" }}>
              <b style={{ color: "var(--tx2)" }}>{r.label}</b> — {r.question} <span style={{ fontFamily: "var(--mono)", fontSize: 9 }}>({r.source})</span>
            </div>
          ))}
        </div>
      </div>

      <div className="legend mt">
        <i><b style={{ background: "#2ECC71" }} />{t("legendLive")}</i>
        <i><b style={{ background: "#E67E22" }} />{t("legendPartial")}</i>
        <span className="muted" style={{ marginLeft: "auto" }}>{t("sourcesLegend")}</span>
      </div>
      </>)}
    </div>
  );
}

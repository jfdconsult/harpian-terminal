"use client";
import { useState, useEffect, useMemo, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ScreenId } from "@/lib/nav";
import { GOV_API } from "@/lib/data";
import { fetchNews, fetchSocialTrending, IMPACT_COLOR, SENTIMENT_COLOR, type NewsHeadline, type SocialPost } from "@/lib/feeds";
import { RadarSvg, buildLayersFromApi, regimeLabel, type IntelLayer } from "./MarketDna";
import RegimeGauge from "../RegimeGauge";
import { fetchSnapshot, type RegimeState, type Snapshot } from "@/lib/snapshot";
import { fetchCalendar, type CalendarResp } from "@/lib/calendar";
import { type DnaRaw } from "@/lib/jim-market-analysis";
import { CLIENTS, EMPTY_CLIENT, brl } from "@/lib/clients";
import { allClients, findClient } from "@/lib/clientStore";
import { MARKET_GROUPS } from "@/lib/market";
import { pctText, pctClass, numShort } from "@/lib/format";
import { publishScreenData } from "@/lib/jim-data";
import { HPC22_RN, TOLERANCE } from "@/lib/riskLevels";
import { MiniRegua } from "./Risco";

// ════════════════════════════════════════════════════════════════
// i18n — local dictionary for this screen (CANONICAL reference pattern)
// One entry per user-visible English string. en = current text (kept
// EXACTLY), pt = natural institutional Brazilian-Portuguese. Brand/product
// terms (Harpian, JIM, XRI, ARI, Market DNA, VIX, Fear & Greed, S&P, COT,
// HPC22, HPC11, AUM, RN…) and data-driven regime STATE codes (RISK-ON,
// CAUTION, RISK-OFF, ARMED/DISARMED) are intentionally NOT translated.
// ════════════════════════════════════════════════════════════════
const TR = {
  // Painel header
  goodMorning: { pt: "Bom dia", en: "Good morning" },
  essentials: { pt: "O essencial do dia.", en: "The essentials of the day." },
  dragToReorganize: { pt: "Arraste para reorganizar, adicione módulos (Cotações e Carteira podem repetir, cada um com sua própria configuração — clique na engrenagem) ou remova-os.", en: "Drag to reorganize, add modules (Quotes and Portfolio can repeat, each with its own configuration — click the gear) or remove them." },
  everythingClickAway: { pt: "Todo o resto está a um clique nos menus do topo.", en: "Everything else is a click away in the top menus." },

  // JIM Morning Briefing — greetings & chrome
  welcome: { pt: "Bem-vindo", en: "Welcome" },
  goodAfternoon: { pt: "Boa tarde", en: "Good afternoon" },
  goodEvening: { pt: "Boa noite", en: "Good evening" },
  jimMorningBriefing: { pt: "JIM — Resumo Matinal", en: "JIM — Morning Briefing" },
  updated: { pt: "Atualizado", en: "Updated" },
  collapse: { pt: "Recolher", en: "Collapse" },
  expand: { pt: "Expandir", en: "Expand" },
  analyzingMarketData: { pt: "Analisando dados de mercado...", en: "Analyzing market data..." },
  consolidatingIntel: { pt: "Consolidando inteligência de mercado...", en: "Consolidating market intelligence..." },

  // Briefing — Portfolio section
  portfolio: { pt: "Carteira", en: "Portfolio" },
  aggressive: { pt: "Agressivo", en: "Aggressive" },
  today: { pt: "hoje", en: "today" },
  fullExposureNoHedge: { pt: "Exposição total — sem hedge ativo", en: "Full exposure — no active hedge" },
  investmentGradeRange: { pt: "Investment Grade — dentro da faixa", en: "Investment Grade — within range" },
  activity: { pt: "Atividade", en: "Activity" },
  noAdjustments: { pt: "Sem ajustes", en: "No adjustments" },
  lastRebalancing: { pt: "Último rebalanceamento em 1 Jul", en: "Last rebalancing on Jul 1" },

  // Briefing — Regime & Defense section
  regimeDefense: { pt: "Regime & Defesa", en: "Regime & Defense" },
  currentRegime: { pt: "Regime atual", en: "Current regime" },
  unavailable: { pt: "indisponível", en: "unavailable" },
  overnightFeedNotUpdated: { pt: "Feed overnight ainda não atualizado", en: "Overnight feed not yet updated" },
  defense: { pt: "Defesa", en: "Defense" },
  waitingOvernightSnapshot: { pt: "Aguardando snapshot overnight", en: "Waiting for overnight snapshot" },
  asOf: { pt: "Em", en: "As of" },
  source: { pt: "Fonte", en: "Source" },
  unknown: { pt: "desconhecido", en: "unknown" },
  noTimestampSnapshot: { pt: "Sem timestamp no snapshot", en: "No timestamp on snapshot" },

  // regimeView() — regime narrative + defense narrative
  sustainedTrendFavorable: { pt: "Tendência sustentada — ambiente favorável ao risco", en: "Sustained trend — favorable environment for risk" },
  disarmed: { pt: "Desarmada", en: "Disarmed" },
  fullRiskNoRotation: { pt: "Exposição total ao risco — sem rotação para proteção", en: "Full risk exposure — no rotation to protection" },
  adverseActiveInPlace: { pt: "Ambiente adverso — defesa ativa em vigor", en: "Adverse environment — active defense in place" },
  active: { pt: "Ativa", en: "Active" },
  defensiveReduced: { pt: "Rotação defensiva acionada — exposição reduzida", en: "Defensive rotation engaged — reduced exposure" },
  mixedSignalsRegime: { pt: "Sinais mistos — nem tendência nem estresse dominam", en: "Mixed signals — neither trend nor stress dominates" },
  monitoring: { pt: "Monitorando", en: "Monitoring" },
  noRotationWatching: { pt: "Sem rotação defensiva — observando direção", en: "No defensive rotation — watching for direction" },
  broadStressFullDefense: { pt: "Estresse amplo — mandato de defesa total", en: "Broad stress — full defense mandate" },
  defensiveMaxProtection: { pt: "Rotação defensiva acionada — proteção máxima", en: "Defensive rotation engaged — maximum protection" },

  // Briefing — Market DNA section
  lowVolFavorable: { pt: "Baixa volatilidade — ambiente favorável ao risco", en: "Low volatility — favorable environment for risk" },
  elevatedVolMonitor: { pt: "Volatilidade elevada — monitorar", en: "Elevated volatility — monitor" },
  breadthLabel: { pt: "Amplitude (>200MA)", en: "Breadth (>200MA)" },
  broadParticipation: { pt: "Participação ampla — alta saudável", en: "Broad participation — healthy rally" },
  narrowParticipation: { pt: "Participação estreita — risco de concentração", en: "Narrow participation — concentration risk" },
  greedyMarket: { pt: "Mercado ganancioso — atenção ao excesso", en: "Greedy market — watch for excess" },
  fearDominates: { pt: "Medo domina — oportunidade ou cautela?", en: "Fear dominates — opportunity or caution?" },
  neutralSentiment: { pt: "Sentimento neutro", en: "Neutral sentiment" },
  yieldCurve: { pt: "Curva de juros", en: "Yield Curve" },
  normalizedCurve: { pt: "Curva normalizada — sinal positivo para crescimento", en: "Normalized curve — positive signal for growth" },
  invertedCurve: { pt: "Curva invertida — alerta de recessão", en: "Inverted curve — recession watch" },
  positioningLabel: { pt: "Posicionamento (COT)", en: "Positioning (COT)" },
  outOf: { pt: "de", en: "of" },
  atExtreme: { pt: "em extremo", en: "at extreme" },
  speculatorStretched: { pt: "Especulador esticado — sinaliza vulnerabilidade, não timing", en: "Speculator stretched — flags vulnerability, not timing" },
  noPositioningExtremes: { pt: "Sem extremos de posicionamento significativos", en: "No significant positioning extremes" },

  // Briefing — Clients & Risk section
  clientsRisk: { pt: "Clientes & Risco", en: "Clients & Risk" },
  totalAum: { pt: "AUM Total", en: "Total AUM" },
  activeClients: { pt: "Clientes ativos", en: "Active clients" },
  outsideMandate: { pt: "Fora do mandato", en: "Outside mandate" },
  clientsPlural: { pt: "cliente(s)", en: "client(s)" },
  none: { pt: "Nenhum", en: "None" },
  attention: { pt: "Atenção", en: "Attention" },
  allWithinLimits: { pt: "Todos dentro dos limites", en: "All within limits" },

  // Briefing — Calendar section
  calendar: { pt: "Calendário", en: "Calendar" },
  loadingLc: { pt: "carregando…", en: "loading…" },
  fetchingReleases: { pt: "Buscando próximas divulgações.", en: "Fetching upcoming releases." },
  couldntFetchReleases: { pt: "Não consegui buscar as próximas divulgações agora — prefiro não mostrar uma data que não verifiquei.", en: "Couldn't fetch upcoming releases right now — I'd rather not show a date I haven't verified." },
  nextEvent: { pt: "Próximo evento", en: "Next event" },
  forecast: { pt: "projeção", en: "forecast" },
  previous: { pt: "anterior", en: "previous" },
  thisWeek: { pt: "Esta semana", en: "This week" },
  highImpactEvents: { pt: "evento(s) de alto impacto", en: "high-impact event(s)" },
  openAlertsFullList: { pt: "Abra Alertas para a lista completa.", en: "Open Alerts for the full list." },
  calendarAlerts: { pt: "Calendário & Alertas", en: "Calendar & Alerts" },

  // generateHeadline()
  regimeWord: { pt: "Regime", en: "Regime" },
  regimeUnavailable: { pt: "Regime indisponível", en: "Regime unavailable" },
  clientsOutsideRiskMandate: { pt: "cliente(s) fora do mandato de risco.", en: "client(s) outside the risk mandate." },
  complianceActionRequired: { pt: "ação de compliance necessária.", en: "compliance action required." },
  vixAt: { pt: "VIX em", en: "VIX at" },
  elevatedVolatility: { pt: "volatilidade elevada", en: "elevated volatility" },
  monitorClosely: { pt: "Monitore de perto.", en: "Monitor closely." },
  fearGreedAt: { pt: "Fear & Greed em", en: "Fear & Greed at" },
  extremeFear: { pt: "medo extremo", en: "extreme fear" },
  historicallyPrecededRecoveries: { pt: "Esses níveis historicamente precederam recuperações.", en: "These levels have historically preceded recoveries." },
  extremeGreed: { pt: "ganância extrema", en: "extreme greed" },
  excessiveOptimismCorrections: { pt: "Cautela — otimismo excessivo frequentemente precede correções.", en: "Caution — excessive optimism often precedes corrections." },
  adverseActiveReduced: { pt: "ambiente adverso, defesa ativa e exposição reduzida.", en: "adverse environment, active defense and reduced exposure." },
  allClientsWithinMandate: { pt: "Todos os clientes dentro do mandato.", en: "All clients within mandate." },
  adverseActiveDefense: { pt: "ambiente adverso, defesa ativa.", en: "adverse environment, active defense." },
  quietDay: { pt: "Dia tranquilo.", en: "Quiet day." },
  allWithinNoAction: { pt: "todos os clientes dentro do mandato. Nenhuma ação urgente necessária.", en: "all clients within mandate. No urgent action required." },

  // Cotacoes widget
  loading: { pt: "Carregando", en: "Loading" },
  seeAllQuotes: { pt: "Ver todas as cotações", en: "See all quotes" },

  // Carteira widget
  noClients: { pt: "Nenhum cliente cadastrado.", en: "No clients registered." },
  units: { pt: "unidades", en: "units" },
  openFullPortfolio: { pt: "Abrir carteira completa", en: "Open full portfolio" },

  // Risco cliente widget
  product: { pt: "Produto", en: "Product" },
  mandate: { pt: "Mandato", en: "Mandate" },
  tolerance: { pt: "Tolerância", en: "Tolerance" },
  within: { pt: "dentro", en: "within" },
  seeFullRuler: { pt: "Ver régua completa", en: "See full ruler" },

  // Todos-clientes ruler widget
  clientsWord: { pt: "clientes", en: "clients" },
  outsideMandateLc: { pt: "fora do mandato", en: "outside mandate" },
  allWithin: { pt: "todos dentro", en: "all within" },
  colClient: { pt: "Cliente", en: "Client" },
  colDistribution: { pt: "Distribuição", en: "Distribution" },
  colAlignment: { pt: "Alinhamento", en: "Alignment" },
  seeDetailByClient: { pt: "Ver detalhe por cliente", en: "See detail by client" },

  // Regime gauge widget — sub-labels
  fullExposureStandby: { pt: "exposição total · defesa em espera", en: "full exposure · defense on standby" },
  reducingRiskActivating: { pt: "reduzindo risco · defesa ativando", en: "reducing risk · defense activating" },
  moderateMonitoring: { pt: "exposição moderada · monitorando", en: "moderate exposure · monitoring" },
  activeDefenseReduced: { pt: "defesa ativa · exposição reduzida", en: "active defense · reduced exposure" },
  seeMarketOverview: { pt: "Ver panorama de mercado", en: "See Market Overview" },

  // Intel radar widget
  loadingRadar: { pt: "Carregando radar…", en: "Loading radar…" },
  radarUnavailable: { pt: "Radar indisponível.", en: "Radar unavailable." },
  conviction: { pt: "convicção", en: "conviction" },
  seeMarketDna: { pt: "Ver Market DNA", en: "See Market DNA" },

  // News widget
  loadingNews: { pt: "Carregando notícias…", en: "Loading news…" },
  noNews: { pt: "Nenhuma notícia no momento.", en: "No news at the moment." },
  seeNewsBroadcast: { pt: "Ver transmissão de notícias", en: "See News Broadcast" },

  // Social widget
  loadingSocial: { pt: "Carregando radar social…", en: "Loading social radar…" },
  noPosts: { pt: "Nenhum post no momento.", en: "No posts at the moment." },
  seeSocialRadar: { pt: "Ver radar social", en: "See Social Radar" },

  // Veredito widget
  internalAri: { pt: "INTERNO · ARI", en: "INTERNAL · ARI" },
  waiting: { pt: "aguardando…", en: "waiting…" },
  externalXri: { pt: "EXTERNO · XRI", en: "EXTERNAL · XRI" },
  scoreLc: { pt: "pontuação", en: "score" },
  defenseUpper: { pt: "DEFESA", en: "DEFENSE" },
  rotatingIn: { pt: "entrando em rotação", en: "rotating in" },
  fullExposureLc: { pt: "exposição total", en: "full exposure" },
  sustainedTrend: { pt: "tendência sustentada", en: "sustained trend" },
  activeDefenseSub: { pt: "defesa ativa", en: "active defense" },
  mixedSignals: { pt: "sinais mistos", en: "mixed signals" },
  broadStress: { pt: "estresse amplo", en: "broad stress" },

  // XRI widget
  loadingXri: { pt: "Carregando XRI…", en: "Loading XRI…" },
  direction: { pt: "Direção:", en: "Direction:" },
  conf: { pt: "Conf.", en: "Conf." },
  scoreUpper: { pt: "PONTUAÇÃO", en: "SCORE" },
  topDrivers: { pt: "PRINCIPAIS FATORES", en: "TOP DRIVERS" },
  seeXriDetail: { pt: "Ver detalhe do XRI", en: "See XRI detail" },

  // Vault preview widget
  kpiPositions: { pt: "POSIÇÕES", en: "POSITIONS" },
  kpiAumInv: { pt: "AUM INV.", en: "AUM INV." },
  kpiHit90d: { pt: "ACERTO 90d", en: "HIT 90d" },
  kpiAvgHold: { pt: "HOLD MÉD.", en: "AVG HOLD" },
  nextShowcaseRotation: { pt: "Próxima rotação Showcase", en: "Next Showcase rotation" },
  loadingVault: { pt: "Carregando Vault…", en: "Loading Vault…" },
  openTheVault: { pt: "Abrir The Vault", en: "Open The Vault" },

  // Catalog — fundos
  yourFunds: { pt: "Seus fundos", en: "Your funds" },
  openHpc22: { pt: "Abrir HPC22", en: "Open HPC22" },

  // Catalog — alocacao
  allocationByFund: { pt: "Alocação por fundo", en: "Allocation by fund" },
  cash: { pt: "Caixa", en: "Cash" },

  // Catalog — clientes
  clientsTitle: { pt: "Clientes", en: "Clients" },
  seeClients: { pt: "Ver clientes", en: "See clients" },

  // Catalog — alertas
  alertsTitle: { pt: "Alertas", en: "Alerts" },
  outsideTag: { pt: "fora", en: "outside" },
  watchTag: { pt: "observar", en: "watch" },
  mandateLc: { pt: "mandato", en: "mandate" },
  ptBelowMandate: { pt: "pt abaixo do mandato", en: "pt below mandate" },
  allWithinNothingFlag: { pt: "Todos os clientes dentro do mandato · nada a sinalizar agora.", en: "All clients within mandate · nothing to flag right now." },
  seeAlerts: { pt: "Ver alertas", en: "See alerts" },

  // Catalog — titles & config
  verdictTitle: { pt: "Veredito — ARI · XRI · Defesa", en: "Verdict — ARI · XRI · Defense" },
  vaultAggregate: { pt: "The Vault — agregado", en: "The Vault — aggregate" },
  xriExternalRegime: { pt: "XRI — Regime Externo", en: "XRI — External Regime" },
  marketRegimeGauge: { pt: "Regime de Mercado (medidor)", en: "Market Regime (gauge)" },
  intelligenceRadar: { pt: "Radar de Inteligência", en: "Intelligence Radar" },
  newsBroadcastTitle: { pt: "Transmissão de Notícias", en: "News Broadcast" },
  quotesTitle: { pt: "Cotações", en: "Quotes" },
  clientPortfolioTitle: { pt: "Carteira do cliente", en: "Client portfolio" },
  socialRadarTitle: { pt: "Radar Social", en: "Social Radar" },
  riskLevelsTitle: { pt: "Risco · 4 níveis por cliente", en: "Risk · 4 levels per client" },
  allClientsRuler: { pt: "Todos os clientes na régua", en: "All clients on the ruler" },
  classLabel: { pt: "Classe", en: "Class" },
  clientLabel: { pt: "Cliente", en: "Client" },
  riskWord: { pt: "Risco", en: "Risk" },

  // Painel — customize controls
  addModule: { pt: "Adicionar módulo", en: "Add module" },
  addAnother: { pt: "+ adicionar outro", en: "+ add another" },
  allModulesOnDashboard: { pt: "Todos os módulos já estão no painel.", en: "All modules are already on the dashboard." },
  restoreDefault: { pt: "Restaurar padrão", en: "Restore default" },
  done: { pt: "Concluído", en: "Done" },
  customizeDashboard: { pt: "Personalizar painel", en: "Customize dashboard" },
  customize: { pt: "Personalizar", en: "Customize" },
  modulesAvailableSuffix: { pt: "módulo(s) disponíveis para adicionar · Cotações e Carteira do cliente podem ser adicionados várias vezes, cada um com sua própria configuração.", en: "module(s) available to add · Quotes and Client portfolio can be added multiple times, each with its own configuration." },
  configureModule: { pt: "Configurar módulo", en: "Configure module" },

  // publishScreenData → JIM (user-visible briefing + suggestion chips)
  jimGoodMorningSummary: { pt: "Bom dia! Resumo de hoje:", en: "Good morning! Today's summary:" },
  jimRegimeRiskOnDefense: { pt: "Regime **RISK-ON** (defesa desarmada).", en: "Regime **RISK-ON** (defense disarmed)." },
  allWithinMandateLc: { pt: "todos dentro do mandato.", en: "all within mandate." },
  suggestFunds: { pt: "Como estão os fundos hoje?", en: "How are the funds doing today?" },
  suggestOutside: { pt: "Quais clientes estão fora do mandato?", en: "Which clients are outside the mandate?" },
  suggestAttention: { pt: "Algum cliente precisa de atenção?", en: "Does any client need attention?" },
  suggestWhyRiskOn: { pt: "Por que o regime está RISK-ON?", en: "Why is the regime RISK-ON?" },
} as const;

type TKey = keyof typeof TR;
type TFn = (k: TKey) => string;

// ════════════════════════════════════════════════════════════════
// JIM MORNING BRIEFING — proactive intelligence box
// ════════════════════════════════════════════════════════════════

// gov-data returns `layers` as an OBJECT ({volatility, sentiment, breadth,
// macro, positioning...}), not as a list. This file read it as a list, so
// the "Market DNA" section of the briefing NEVER appeared — `.length` was
// undefined and the whole block was silently skipped.

interface BriefingSection { title: string; icon: string; color: string; screenId?: ScreenId; items: BriefingItem[] }
interface BriefingItem { label: string; value: string; color?: string; detail?: string }

// Live regime → label + color + narrative for the Regime & Defense card.
// Kept confidentiality-safe: only names and directional labels, no CRS/thresholds.
// State code labels (RISK-ON, CAUTION…) come from data → not translated; the
// narrative details are user-visible descriptive text → translated via t.
function regimeView(t: TFn): Record<RegimeState, { label: string; color: string; detail: string; defenseLabel: string; defenseColor: string; defenseDetail: string }> {
  return {
    BULL:    { label: "RISK-ON",  color: "var(--green)", detail: t("sustainedTrendFavorable"),
               defenseLabel: t("disarmed"), defenseColor: "var(--tx2)", defenseDetail: t("fullRiskNoRotation") },
    CAUTELA: { label: "CAUTION",  color: "var(--gold)",  detail: t("adverseActiveInPlace"),
               defenseLabel: t("active"),   defenseColor: "var(--gold)", defenseDetail: t("defensiveReduced") },
    NEUTRO:  { label: "NEUTRAL",  color: "var(--tx2)",   detail: t("mixedSignalsRegime"),
               defenseLabel: t("monitoring"), defenseColor: "var(--tx2)", defenseDetail: t("noRotationWatching") },
    BEAR:    { label: "RISK-OFF", color: "var(--red)",   detail: t("broadStressFullDefense"),
               defenseLabel: t("active"),   defenseColor: "var(--red)",  defenseDetail: t("defensiveMaxProtection") },
  };
}

function generateBriefingSections(
  dna: DnaRaw | null,
  cal: CalendarResp | null,
  snap: Snapshot | null,
  t: TFn,
): BriefingSection[] {
  const sections: BriefingSection[] = [];

  // 1) PORTFOLIO STATUS
  sections.push({
    title: t("portfolio"), icon: "ti-coin", color: "var(--green)", screenId: "fundo" as ScreenId,
    items: [
      { label: `HPC22 ${t("aggressive")}`, value: `+2.31% ${t("today")}`, color: "var(--green)", detail: t("fullExposureNoHedge") },
      { label: t("activity"), value: t("noAdjustments"), detail: t("lastRebalancing") },
    ],
  });

  // 2) REGIME & DEFENSE — real values from /api/snapshot (overnight cloud)
  const regimeState = snap?.regime?.state ?? null;
  const view = regimeState ? regimeView(t)[regimeState] : null;
  const defenseLabelFromSnap = snap?.defense?.label?.trim();

  sections.push({
    title: t("regimeDefense"), icon: "ti-shield-check", color: view?.color ?? "var(--tx2)", screenId: "regime" as ScreenId,
    items: [
      view
        ? { label: t("currentRegime"), value: view.label, color: view.color, detail: view.detail }
        : { label: t("currentRegime"), value: t("unavailable"), color: "var(--tx2)", detail: t("overnightFeedNotUpdated") },
      view
        ? {
            label: t("defense"),
            value: defenseLabelFromSnap && regimeState !== "BULL" ? defenseLabelFromSnap : view.defenseLabel,
            color: view.defenseColor,
            detail: view.defenseDetail,
          }
        : { label: t("defense"), value: t("unavailable"), color: "var(--tx2)", detail: t("waitingOvernightSnapshot") },
      snap?.as_of
        ? { label: t("asOf"), value: snap.as_of, detail: `${t("source")}: ${snap.source_file ?? "overnight"}` }
        : { label: t("asOf"), value: t("unknown"), detail: t("noTimestampSnapshot") },
    ],
  });

  // 3) MARKET DNA (real data from gov-data — layers is an object, not a list)
  const L = dna?.layers;
  if (L) {
    const dnaItems: BriefingItem[] = [];

    const vol = L.volatility?.data;
    const vix = vol?.vix?.current;
    if (vix != null) dnaItems.push({
      label: "VIX", value: `${vix.toFixed(1)} (${vol?.regime || "Normal"})`,
      color: vix < 20 ? "var(--green)" : vix < 30 ? "var(--gold)" : "var(--red)",
      detail: vix < 20 ? t("lowVolFavorable") : t("elevatedVolMonitor"),
    });

    const fg = L.sentiment?.data?.score;
    if (fg != null) dnaItems.push({
      label: "Fear & Greed", value: `${fg.toFixed(0)} (${L.sentiment?.data?.rating || ""})`,
      color: fg > 60 ? "var(--green)" : fg > 40 ? "var(--gold)" : "var(--red)",
      detail: fg > 60 ? t("greedyMarket") : fg < 40 ? t("fearDominates") : t("neutralSentiment"),
    });

    const breadth = L.breadth?.data?.pct_above_200ma;
    if (breadth != null) dnaItems.push({
      label: t("breadthLabel"), value: `${breadth.toFixed(0)}%`,
      color: breadth > 60 ? "var(--green)" : breadth > 40 ? "var(--gold)" : "var(--red)",
      detail: breadth > 60 ? t("broadParticipation") : t("narrowParticipation"),
    });

    const curve = L.macro?.data?.yield_curve_spread;
    if (curve != null) dnaItems.push({
      label: t("yieldCurve"), value: `${curve > 0 ? "+" : ""}${(curve * 100).toFixed(0)}bps (${L.macro?.data?.yield_curve_signal || ""})`,
      color: curve > 0 ? "var(--green)" : "var(--red)",
      detail: curve > 0 ? t("normalizedCurve") : t("invertedCurve"),
    });

    const cot = L.positioning?.data;
    if (cot?.length) {
      const ext = cot.filter((r) => (r.spec_sentiment || "").startsWith("EXTREME")).length;
      dnaItems.push({
        label: t("positioningLabel"), value: `${ext} ${t("outOf")} ${cot.length} ${t("atExtreme")}`,
        color: ext >= 3 ? "var(--red)" : ext >= 1 ? "var(--gold)" : "var(--green)",
        detail: ext ? t("speculatorStretched") : t("noPositioningExtremes"),
      });
    }

    if (dnaItems.length) {
      sections.push({ title: "Market DNA", icon: "ti-dna", color: "var(--gold)", screenId: "market-dna" as ScreenId, items: dnaItems });
    }
  }

  // 4) CLIENTS & RISK
  const fora = CLIENTS.filter((c) => c.riskNumber > c.mandate);
  const aum = CLIENTS.reduce((s, c) => s + c.current, 0);
  sections.push({
    title: t("clientsRisk"), icon: "ti-users", color: fora.length ? "var(--red)" : "var(--green)", screenId: "risco" as ScreenId,
    items: [
      { label: t("totalAum"), value: brl(aum) },
      { label: t("activeClients"), value: `${CLIENTS.length}` },
      {
        label: t("outsideMandate"), value: fora.length ? `${fora.length} ${t("clientsPlural")}` : t("none"),
        color: fora.length ? "var(--red)" : "var(--green)",
        detail: fora.length ? `${t("attention")}: ${fora.map(c => c.name).join(", ")}` : t("allWithinLimits"),
      },
    ],
  });

  // 5) ECONOMIC CALENDAR — real data (/api/calendar → Investing.com).
  // Previously this was 3 fixed lines with already-past July dates shown
  // as the "next event". Now: if no data comes back, it says so.
  const calItems: BriefingItem[] = [];
  if (cal === null) {
    calItems.push({ label: t("calendar"), value: t("loadingLc"), detail: t("fetchingReleases") });
  } else if (!cal.ok || !cal.events.length) {
    calItems.push({ label: t("calendar"), value: t("unavailable"), color: "var(--tx3)", detail: t("couldntFetchReleases") });
  } else {
    const altos = cal.events.filter((e) => e.importance === 3);
    const prox = altos[0] || cal.events[0];
    calItems.push({
      label: t("nextEvent"), value: `${prox.event} — ${prox.date}`, color: "var(--gold)",
      detail: `${prox.time}${prox.forecast ? ` · ${t("forecast")} ${prox.forecast}` : ""}${prox.previous ? ` · ${t("previous")} ${prox.previous}` : ""}`,
    });
    for (const e of altos.slice(1, 3)) {
      calItems.push({
        label: e.date, value: e.event,
        detail: `${e.time}${e.forecast ? ` · ${t("forecast")} ${e.forecast}` : ""}${e.previous ? ` · ${t("previous")} ${e.previous}` : ""}`,
      });
    }
    if (altos.length > 3) {
      calItems.push({ label: t("thisWeek"), value: `+${altos.length - 3} ${t("highImpactEvents")}`, color: "var(--tx3)", detail: t("openAlertsFullList") });
    }
  }
  sections.push({
    title: t("calendarAlerts"), icon: "ti-calendar-event", color: "var(--gold)", screenId: "alertas" as ScreenId,
    items: calItems,
  });

  return sections;
}

// Regime comes from the real overnight snapshot — this function used to write
// "Regime RISK-ON" as fixed text on ALL paths, even when the engine was
// in RISK-OFF. It was the first sentence on the first screen.
const REGIME_TXT: Record<string, string> = {
  BULL: "RISK-ON", CAUTELA: "CAUTION", NEUTRO: "NEUTRAL", BEAR: "RISK-OFF",
};

function generateHeadline(dna: DnaRaw | null, regime: RegimeState | null, t: TFn): { text: string; color: string } {
  const reg = regime ? REGIME_TXT[regime] : null;
  const regFrase = reg ? `${t("regimeWord")} ${reg}` : t("regimeUnavailable");
  const defensivo = regime === "BEAR" || regime === "CAUTELA";

  const fora = CLIENTS.filter((c) => c.riskNumber > c.mandate).length;
  if (fora > 0) return {
    text: `${t("attention")}: ${fora} ${t("clientsOutsideRiskMandate")} ${regFrase} — ${t("complianceActionRequired")}`,
    color: "var(--red)",
  };

  const L = dna?.layers;
  if (L) {
    const vix = L.volatility?.data?.vix?.current;
    const fg = L.sentiment?.data?.score;

    if (vix != null && vix > 25) return {
      text: `${t("vixAt")} ${vix.toFixed(1)} — ${t("elevatedVolatility")}. ${regFrase}. ${t("monitorClosely")}`,
      color: "var(--gold)",
    };
    if (fg != null && fg < 30) return {
      text: `${t("fearGreedAt")} ${fg.toFixed(0)} (${t("extremeFear")}). ${t("historicallyPrecededRecoveries")} ${regFrase}.`,
      color: "var(--gold)",
    };
    if (fg != null && fg > 80) return {
      text: `${t("fearGreedAt")} ${fg.toFixed(0)} (${t("extremeGreed")}). ${t("excessiveOptimismCorrections")} ${regFrase}.`,
      color: "var(--gold)",
    };
    if (defensivo) return {
      text: `${regFrase} — ${t("adverseActiveReduced")} ${t("allClientsWithinMandate")}`,
      color: "var(--gold)",
    };
  }

  if (defensivo) return {
    text: `${regFrase} — ${t("adverseActiveDefense")} ${t("allClientsWithinMandate")}`,
    color: "var(--gold)",
  };
  return {
    text: `${t("quietDay")} ${regFrase}, ${t("allWithinNoAction")}`,
    color: reg ? "var(--green)" : "var(--tx3)",
  };
}

function JimMorningBriefing({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const { lang } = useI18n();
  const t = (k: TKey) => TR[k][lang];
  const [dna, setDna] = useState<DnaRaw | null>(null);
  const [cal, setCal] = useState<CalendarResp | null>(null);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    fetch(`${GOV_API}/api/market-dna`)
      .then(r => r.json())
      .then((d: DnaRaw) => { setDna(d); setLoading(false); })
      .catch(() => setLoading(false));
    fetchCalendar().then(setCal).catch(() => setCal({ ok: false, events: [] }));
    fetchSnapshot().then((s) => setSnap(s)).catch(() => setSnap({ ok: false, offline: true }));
  }, []);

  const regime = snap?.ok && snap.regime ? snap.regime.state : null;
  const sections = generateBriefingSections(dna, cal, snap, t);
  const headline = generateHeadline(dna, regime, t);

  // `now` só é preenchido no client, depois do mount — new Date() direto no
  // render diverge entre o timezone do server (SSR) e do browser, causando
  // hydration mismatch (React #418) sempre que a hora vira o dia em fusos
  // diferentes. Mesmo padrão do <Clock /> do Topbar.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); }, []);
  const hora = now ? now.getHours() : null;
  const saudacao = hora === null ? t("welcome") : hora < 12 ? t("goodMorning") : hora < 18 ? t("goodAfternoon") : t("goodEvening");
  const locale = lang === "pt" ? "pt-BR" : "en-US";
  const dataStr = now ? now.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "";

  return (
    <div style={{
      background: "var(--panel)",
      border: "1px solid var(--line2)",
      borderRadius: 14,
      padding: "24px 28px",
      marginBottom: 18,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Gold accent line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, var(--gold), rgba(201,160,44,0.3), var(--gold))" }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--gold), #B8860B)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 20px rgba(201,160,44,0.3)",
          }}>
            <i className="ti ti-brain" style={{ fontSize: 22, color: "#0C1930" }} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--tx)", letterSpacing: "0.5px" }}>
              {t("jimMorningBriefing")}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--tx3)" }}>
              {saudacao}, João{dataStr ? ` · ${dataStr}` : ""}{now ? ` · ${t("updated")} ${now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}` : ""}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn ghost" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => go("market-dna")}>
            <i className="ti ti-dna" style={{ marginRight: 4 }} />Market DNA
          </button>
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              background: "none", border: "1px solid var(--line2)", borderRadius: 6,
              padding: "4px 8px", cursor: "pointer", color: "var(--tx3)", fontSize: 12,
            }}
            title={expanded ? t("collapse") : t("expand")}
          >
            <i className={`ti ${expanded ? "ti-chevron-up" : "ti-chevron-down"}`} />
          </button>
        </div>
      </div>

      {/* Headline */}
      <div style={{
        background: "rgba(201,160,44,0.08)",
        border: "1px solid rgba(201,160,44,0.2)",
        borderRadius: 10, padding: "14px 18px", marginBottom: expanded ? 20 : 0,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <i className="ti ti-bulb" style={{ color: headline.color, fontSize: 18, marginTop: 1, flexShrink: 0 }} />
          <div style={{ fontSize: 14, color: "var(--tx)", lineHeight: 1.55 }}>
            {loading ? <span className="muted">{t("analyzingMarketData")}</span> : headline.text}
          </div>
        </div>
      </div>

      {/* Sections grid */}
      {expanded && !loading && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 14,
        }}>
          {sections.map((sec) => (
            <div key={sec.title} style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid var(--line2)",
              borderRadius: 10, padding: "14px 16px",
            }}>
              <div
                onClick={sec.screenId ? () => go(sec.screenId!) : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  fontSize: 11, fontWeight: 600, color: sec.color,
                  textTransform: "uppercase", letterSpacing: "1px",
                  marginBottom: 10, paddingBottom: 8,
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  cursor: sec.screenId ? "pointer" : "default",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => { if (sec.screenId) e.currentTarget.style.opacity = "0.7"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                <i className={`ti ${sec.icon}`} style={{ fontSize: 15 }} />
                {sec.title}
                {sec.screenId && <i className="ti ti-arrow-right" style={{ fontSize: 12, marginLeft: "auto", opacity: 0.5 }} />}
              </div>
              {sec.items.map((item, i) => (
                <div key={i} style={{ marginBottom: i < sec.items.length - 1 ? 8 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: 12.5, color: "var(--tx2)" }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: item.color || "var(--tx)" }}>{item.value}</span>
                  </div>
                  {item.detail && (
                    <div style={{ fontSize: 10.5, color: "var(--tx3)", marginTop: 2, lineHeight: 1.4 }}>{item.detail}</div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {expanded && loading && (
        <div style={{ textAlign: "center", padding: "20px 0", color: "var(--tx3)", fontSize: 13 }}>
          <i className="ti ti-loader" style={{ marginRight: 8, animation: "spin 1s linear infinite" }} />
          {t("consolidatingIntel")}
        </div>
      )}
    </div>
  );
}

// A module instance on the dashboard — the same catalog module (e.g. "cotacoes")
// can appear MULTIPLE times, each instance with its own config (asset class,
// or which client's portfolio to show). This is what lets you build
// "one Indices module, another Stocks module, another Vera's portfolio" side by side.
interface WidgetInstance { instanceId: string; catalogId: string; config?: Record<string, string> }

interface ConfigField { key: string; label: string; options: { value: string; label: string }[] }
interface WidgetDef {
  id: string;
  title: string;
  icon: string;
  allowMultiple?: boolean;
  configFields?: ConfigField[];
  titleFor?: (config?: Record<string, string>) => string;
  render?: (go: (id: ScreenId, param?: string) => void) => ReactNode;
  Component?: React.ComponentType<{ go: (id: ScreenId, param?: string) => void; config?: Record<string, string> }>;
}

interface Quote { symbol: string; price?: number; dayPct?: number | null; error?: boolean }

// ---- Quotes (configurable by class: Indices, Stocks, Commodities, Crypto, Forex...) ----
const QUOTE_CLASSES = Object.keys(MARKET_GROUPS);

function CotacoesWidgetBody({ go, config }: { go: (id: ScreenId, param?: string) => void; config?: Record<string, string> }) {
  const { lang } = useI18n();
  const t = (k: TKey) => TR[k][lang];
  const classe = config?.classe && MARKET_GROUPS[config.classe] ? config.classe : QUOTE_CLASSES[0];
  const symbols = (MARKET_GROUPS[classe] || []).slice(0, 5);
  const [rows, setRows] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbols.length) { setRows([]); setLoading(false); return; }
    setLoading(true);
    fetch(`/api/quotes?symbols=${encodeURIComponent(symbols.map((s) => s.symbol).join(","))}`)
      .then((r) => r.json())
      .then((d: Quote[]) => { setRows(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [classe]);

  const nameOf: Record<string, string> = symbols.reduce((m, s) => { m[s.symbol] = s.name; return m; }, {} as Record<string, string>);

  return (
    <>
      {loading ? (
        <div className="muted" style={{ padding: "10px 0" }}>{t("loading")} {classe.toLowerCase()}…</div>
      ) : (
        rows.map((q) => (
          <div className="kv" key={q.symbol}>
            <span>{nameOf[q.symbol] || q.symbol}</span>
            <span className={`v ${pctClass(q.dayPct)}`}>{q.error ? "—" : `${numShort(q.price)} ${pctText(q.dayPct)}`}</span>
          </div>
        ))
      )}
      <div className="mt"><button className="btn ghost" onClick={() => go("cotacoes")}><i className="ti ti-arrow-right" />{t("seeAllQuotes")}</button></div>
    </>
  );
}

// ---- Client portfolio (configurable by client) — the real detail: what they hold and what they're earning ----
function CarteiraWidgetBody({ go, config }: { go: (id: ScreenId, param?: string) => void; config?: Record<string, string> }) {
  const { lang } = useI18n();
  const t = (k: TKey) => TR[k][lang];
  const [clients, setClients] = useState(CLIENTS);
  useEffect(() => setClients(allClients()), []);
  const client = (config?.clientId && findClient(config.clientId)) || clients[0];
  const portfolio = client?.portfolios?.find((p) => p.positions.length > 0);
  const [live, setLive] = useState<Record<string, Quote>>({});

  useEffect(() => {
    if (!portfolio) { setLive({}); return; }
    const syms = portfolio.positions.map((p) => p.ticker).join(",");
    if (!syms) return;
    fetch(`/api/quotes?symbols=${encodeURIComponent(syms)}`)
      .then((r) => r.json())
      .then((d: Quote[]) => setLive(d.reduce((m, q) => { m[q.symbol] = q; return m; }, {} as Record<string, Quote>)))
      .catch(() => {});
  }, [portfolio]);

  if (!client) return <div className="muted">{t("noClients")}</div>;
  const ganhoPct = client.invested ? (client.current / client.invested - 1) * 100 : 0;

  return (
    <>
      <div className="flex between mb"><span style={{ fontWeight: 600, color: "var(--tx)" }}>{client.name}</span><span className={`v ${pctClass(ganhoPct)}`}>{pctText(ganhoPct)}</span></div>
      {portfolio ? (
        portfolio.positions.slice(0, 4).map((pos) => {
          const q = live[pos.ticker];
          const gainPct = q?.price ? ((q.price - pos.avgPrice) / pos.avgPrice) * 100 : null;
          return (
            <div className="kv" key={pos.ticker}>
              <span>{pos.ticker} <span className="muted">{pos.qty.toLocaleString(lang === "pt" ? "pt-BR" : "en-US")} {t("units")}</span></span>
              <span className={`v ${pctClass(gainPct)}`}>{gainPct != null ? pctText(gainPct) : "…"}</span>
            </div>
          );
        })
      ) : (
        client.alloc.slice(0, 4).map((a) => (
          <div className="kv" key={a.label}><span>{a.label}</span><span className="v">{a.pct}%</span></div>
        ))
      )}
      <div className="mt"><button className="btn ghost" onClick={() => go("cliente", client.id)}><i className="ti ti-arrow-right" />{t("openFullPortfolio")}</button></div>
    </>
  );
}

// ---- Client risk (configurable by client) — the 4-level ruler, compact version ----
function RiscoClienteWidgetBody({ go, config }: { go: (id: ScreenId, param?: string) => void; config?: Record<string, string> }) {
  const { lang } = useI18n();
  const t = (k: TKey) => TR[k][lang];
  const [clients, setClients] = useState(CLIENTS);
  useEffect(() => setClients(allClients()), []);
  const client = (config?.clientId && findClient(config.clientId)) || clients[0];
  if (!client) return <div className="muted">{t("noClients")}</div>;

  const tol = TOLERANCE[client.profile];
  const gap = client.riskNumber - client.mandate;
  const markers = [
    { v: HPC22_RN, color: "#C9A02C", id: "product", label: t("product").toLowerCase() },
    { v: client.mandate, color: "#4A90D9", id: "mandate", label: t("mandate").toLowerCase() },
    { v: tol, color: "#EAF0F7", id: "tolerance", label: t("tolerance").toLowerCase() },
    { v: client.riskNumber, color: gap > 0 ? "#E74C3C" : "#2ECC71", id: "portfolio", label: t("portfolio").toLowerCase() },
  ];

  return (
    <>
      <div className="flex between mb"><span style={{ fontWeight: 600, color: "var(--tx)" }}>{client.name}</span><span className={`v ${gap > 0 ? "neg" : "pos"}`}>{gap > 0 ? `▲ +${gap}` : `✓ ${t("within")}`}</span></div>
      <div style={{ position: "relative", height: 26, margin: "6px 4px 4px" }}>
        <div style={{ position: "absolute", top: 11, left: 0, right: 0, height: 6, borderRadius: 3, background: "linear-gradient(90deg,#2ECC71,#F39C12,#E74C3C)" }} />
        {markers.map((m) => (
          <div key={m.id} title={`${m.label} ${m.v}`} style={{ position: "absolute", top: 8, left: `${m.v}%`, transform: "translateX(-50%)", width: 3, height: 12, borderRadius: 2, background: m.color }} />
        ))}
      </div>
      <div className="legend" style={{ fontSize: 11.5, marginTop: 4, rowGap: 4 }}>
        <i><b style={{ background: "#C9A02C" }} />{t("product")} {HPC22_RN}</i>
        <i><b style={{ background: "#4A90D9" }} />{t("mandate")} {client.mandate}</i>
        <i><b style={{ background: "#EAF0F7" }} />{t("tolerance")} {tol}</i>
        <i><b style={{ background: gap > 0 ? "#E74C3C" : "#2ECC71" }} />{t("portfolio")} {client.riskNumber}</i>
      </div>
      <div className="mt"><button className="btn ghost" onClick={() => go("risco")}><i className="ti ti-arrow-right" />{t("seeFullRuler")}</button></div>
    </>
  );
}

// ---- All clients on the ruler — comparative overview, a single module (no config) ----
function TodosClientesReguaWidgetBody({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const { lang } = useI18n();
  const t = (k: TKey) => TR[k][lang];
  const [clients, setClients] = useState(CLIENTS);
  useEffect(() => setClients(allClients()), []);
  const fora = clients.filter((c) => c.riskNumber > c.mandate);

  return (
    <>
      <div className="flex between mb"><span className="muted">{clients.length} {t("clientsWord")}</span><span className={`tag ${fora.length ? "r" : "g"}`}>{fora.length ? `${fora.length} ${t("outsideMandateLc")}` : t("allWithin")}</span></div>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead><tr>
            <th>{t("colClient")}</th><th className="num">{t("portfolio")}</th><th className="num">{t("mandate")}</th><th>{t("colDistribution")}</th><th>{t("colAlignment")}</th>
          </tr></thead>
          <tbody>
            {clients.map((c) => {
              const aligned = c.riskNumber <= c.mandate;
              const tol = TOLERANCE[c.profile];
              return (
                <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => go("risco")}>
                  <td style={{ fontWeight: 600, color: "var(--tx)", fontSize: 12 }}>{c.name}</td>
                  <td className="num" style={{ color: aligned ? "var(--tx)" : "var(--red)", fontWeight: 600 }}>{c.riskNumber}</td>
                  <td className="num" style={{ color: "var(--tx2)" }}>{c.mandate}</td>
                  <td><MiniRegua portfolio={c.riskNumber} tolerance={tol} mandate={c.mandate} /></td>
                  <td>{aligned ? <span className="tag g">{t("within")}</span> : <span className="tag r">▲ +{c.riskNumber - c.mandate}</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt"><button className="btn ghost" onClick={() => go("risco")}><i className="ti ti-arrow-right" />{t("seeDetailByClient")}</button></div>
    </>
  );
}

// ---- Market Regime (180° gauge — how we read the market) ----
const REGIME_GAUGE_LABEL: Record<string, string> = { BULL: "RISK-ON", CAUTELA: "CAUTION", NEUTRO: "NEUTRAL", BEAR: "RISK-OFF" };
function regimeGaugeSub(t: TFn): Record<string, string> {
  return {
    BULL: t("fullExposureStandby"),
    CAUTELA: t("reducingRiskActivating"),
    NEUTRO: t("moderateMonitoring"),
    BEAR: t("activeDefenseReduced"),
  };
}
function RegimeGaugeWidgetBody({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const { lang } = useI18n();
  const t = (k: TKey) => TR[k][lang];
  const [regime, setRegime] = useState<RegimeState>("BULL");
  useEffect(() => {
    fetchSnapshot().then((s) => { if (s.ok && s.regime) setRegime(s.regime.state); }).catch(() => {});
  }, []);
  const label = REGIME_GAUGE_LABEL[regime] || "NEUTRO";
  return (
    <>
      <RegimeGauge state={label} sub={regimeGaugeSub(t)[regime]} />
      <div className="mt"><button className="btn ghost" onClick={() => go("regime")}><i className="ti ti-arrow-right" />{t("seeMarketOverview")}</button></div>
    </>
  );
}

// ---- Intelligence Radar (live Market DNA radar) ----
function IntelRadarWidgetBody({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const { lang } = useI18n();
  const t = (k: TKey) => TR[k][lang];
  const [layers, setLayers] = useState<IntelLayer[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${GOV_API}/api/market-dna`)
      .then((r) => r.json())
      .then((d) => { setLayers(buildLayersFromApi(d)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  if (loading) return <div className="muted" style={{ padding: "24px 0", textAlign: "center" }}>{t("loadingRadar")}</div>;
  if (!layers.length) return <div className="muted" style={{ padding: "12px 0" }}>{t("radarUnavailable")}</div>;
  const avg = Math.round(layers.reduce((s, l) => s + l.score, 0) / layers.length);
  const reg = regimeLabel(avg);
  return (
    <>
      <div className="flex between mb">
        <div><span className="big" style={{ fontSize: 26, color: reg.color }}>{avg}</span> <span className="muted" style={{ fontSize: 11 }}>{t("conviction")}</span></div>
        <span className="tag" style={{ background: "transparent", border: `1px solid ${reg.color}`, color: reg.color }}>{reg.label}</span>
      </div>
      <RadarSvg layers={layers} />
      <div className="mt"><button className="btn ghost" onClick={() => go("market-dna")}><i className="ti ti-arrow-right" />{t("seeMarketDna")}</button></div>
    </>
  );
}

// ---- News Broadcast (live headlines, filtered by impact) ----
function NewsWidgetBody({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const { lang } = useI18n();
  const t = (k: TKey) => TR[k][lang];
  const [items, setItems] = useState<NewsHeadline[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchNews()
      .then((d) => {
        const hi = (d.headlines || []).filter((h) => h.impact === "Market Moving" || h.impact === "High");
        setItems((hi.length ? hi : (d.headlines || [])).slice(0, 4));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  if (loading) return <div className="muted" style={{ padding: "10px 0" }}>{t("loadingNews")}</div>;
  if (!items.length) return <div className="muted" style={{ padding: "10px 0" }}>{t("noNews")}</div>;
  return (
    <>
      {items.map((h) => (
        <div className="kv" key={h.id} style={{ alignItems: "flex-start" }}>
          <span style={{ fontSize: 12.5, lineHeight: 1.35 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700, color: IMPACT_COLOR[h.impact] || "var(--tx3)", marginRight: 6 }}>{h.source_label}</span>
            {h.headline}
          </span>
        </div>
      ))}
      <div className="mt"><button className="btn ghost" onClick={() => go("news-broadcast")}><i className="ti ti-arrow-right" />{t("seeNewsBroadcast")}</button></div>
    </>
  );
}

// ---- Social Radar (live StockTwits) ----
function SocialWidgetBody({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const { lang } = useI18n();
  const t = (k: TKey) => TR[k][lang];
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchSocialTrending()
      .then((d) => { setPosts((d.posts || []).slice(0, 3)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  if (loading) return <div className="muted" style={{ padding: "10px 0" }}>{t("loadingSocial")}</div>;
  if (!posts.length) return <div className="muted" style={{ padding: "10px 0" }}>{t("noPosts")}</div>;
  return (
    <>
      {posts.map((p) => (
        <div className="kv" key={p.id}>
          <span style={{ fontSize: 13, color: "var(--tx2)" }}>{p.author}{p.symbols?.[0] ? <span className="muted"> ${p.symbols[0]}</span> : null}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: SENTIMENT_COLOR[p.sentiment] || "var(--tx3)" }}>{p.sentiment}</span>
        </div>
      ))}
      <div className="mt"><button className="btn ghost" onClick={() => go("social-radar")}><i className="ti ti-arrow-right" />{t("seeSocialRadar")}</button></div>
    </>
  );
}

// ---- VEREDITO — 3 tiles: internal regime (ARI) + external (XRI) + defense ----
// Merges the previous Regime & Defense card with the Market Regime gauge into
// one "daily verdict" strip. Fetches the same overnight snapshot + /api/xri.
interface XriMini { ok: boolean; state?: string; score?: number; streak_days?: number }
function regimeTile(t: TFn): Record<RegimeState, { label: string; color: string; sub: string }> {
  return {
    BULL:    { label: "RISK-ON",  color: "var(--green)", sub: t("sustainedTrend") },
    CAUTELA: { label: "CAUTION",  color: "var(--gold)",  sub: t("activeDefenseSub") },
    NEUTRO:  { label: "NEUTRAL",  color: "var(--tx2)",   sub: t("mixedSignals") },
    BEAR:    { label: "RISK-OFF", color: "var(--red)",   sub: t("broadStress") },
  };
}
function VereditoWidgetBody({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const { lang } = useI18n();
  const t = (k: TKey) => TR[k][lang];
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [xri, setXri] = useState<XriMini | null>(null);
  useEffect(() => {
    fetchSnapshot().then(setSnap).catch(() => setSnap({ ok: false, offline: true }));
    fetch("/api/xri").then((r) => r.json()).then(setXri).catch(() => setXri({ ok: false }));
  }, []);
  const ari = snap?.ok && snap.regime ? regimeTile(t)[snap.regime.state] : null;
  const xriColor = xri?.state === "BULL" ? "var(--green)"
    : xri?.state === "CAUTELA" ? "var(--gold)"
    : xri?.state === "BEAR" ? "var(--red)"
    : "var(--tx2)";
  const defenseArmed = snap?.regime?.state === "CAUTELA" || snap?.regime?.state === "BEAR";
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        <div style={{
          background: "var(--panel2)", borderRadius: 8, padding: "12px 10px", textAlign: "center",
          borderTop: `3px solid ${ari?.color || "var(--tx3)"}`,
        }}>
          <div style={{ fontSize: 9.5, color: "var(--tx3)", fontWeight: 700, letterSpacing: 1 }}>{t("internalAri")}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: ari?.color || "var(--tx2)", marginTop: 6 }}>{ari?.label || "—"}</div>
          <div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 3 }}>{ari?.sub || t("waiting")}</div>
        </div>
        <div style={{
          background: "var(--panel2)", borderRadius: 8, padding: "12px 10px", textAlign: "center",
          borderTop: `3px solid ${xriColor}`,
        }}>
          <div style={{ fontSize: 9.5, color: "var(--tx3)", fontWeight: 700, letterSpacing: 1 }}>{t("externalXri")}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: xriColor, marginTop: 6 }}>{xri?.state || "—"}</div>
          <div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 3 }}>
            {xri?.score != null ? `${t("scoreLc")} ${xri.score.toFixed(0)}` : t("waiting")}
          </div>
        </div>
        <div style={{
          background: "var(--panel2)", borderRadius: 8, padding: "12px 10px", textAlign: "center",
          borderTop: `3px solid ${defenseArmed ? "var(--gold)" : "var(--tx2)"}`,
        }}>
          <div style={{ fontSize: 9.5, color: "var(--tx3)", fontWeight: 700, letterSpacing: 1 }}>{t("defenseUpper")}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: defenseArmed ? "var(--gold)" : "var(--tx2)", marginTop: 6 }}>
            {defenseArmed ? "ARMED" : "DISARMED"}
          </div>
          <div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 3 }}>
            {snap?.defense?.label || (defenseArmed ? t("rotatingIn") : t("fullExposureLc"))}
          </div>
        </div>
      </div>
      <div className="mt"><button className="btn ghost" onClick={() => go("regime")}><i className="ti ti-arrow-right" />{t("seeMarketOverview")}</button></div>
    </>
  );
}

// ---- XRI — External Regime Index (standalone widget) ----
// Peer to the internal ARI (regime gauge). Compact view of the XRI engine
// (score 0–100, state, direction, top 2 country drivers). Full detail lives
// in the XRI tab under Market.
interface XriFull {
  ok: boolean; state?: string; score?: number; direction?: string;
  confidence_pct?: number;
  drivers?: { country: string; pct: number }[];
}
const XRI_STATE_COLOR: Record<string, string> = {
  BULL: "var(--green)", MODERADO: "var(--gold)", CAUTELA: "var(--gold)",
  BEAR: "var(--red)",  STRESS: "var(--red)",
};
function XriWidgetBody({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const { lang } = useI18n();
  const t = (k: TKey) => TR[k][lang];
  const [data, setData] = useState<XriFull | null>(null);
  useEffect(() => {
    fetch("/api/xri").then((r) => r.json()).then(setData).catch(() => setData({ ok: false }));
  }, []);
  if (!data?.ok) return <div className="muted" style={{ padding: "10px 0", fontSize: 12 }}>{t("loadingXri")}</div>;
  const color = XRI_STATE_COLOR[data.state || ""] || "var(--tx2)";
  const topDrivers = (data.drivers || []).slice(0, 2);
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          border: `3px solid ${color}`, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", flexShrink: 0,
          background: "var(--panel2)",
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{data.score}</div>
          <div style={{ fontSize: 8, color: "var(--tx3)", marginTop: 2, letterSpacing: 0.5 }}>{t("scoreUpper")}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color, letterSpacing: 0.5 }}>{data.state}</div>
          <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
            {t("direction")} <b style={{ color: "var(--tx2)" }}>{data.direction || "—"}</b>
            {data.confidence_pct != null && <> · {t("conf")} <b style={{ color: "var(--tx2)" }}>{data.confidence_pct}%</b></>}
          </div>
        </div>
      </div>
      {topDrivers.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--line2)" }}>
          <div style={{ fontSize: 9.5, color: "var(--tx3)", fontWeight: 700, letterSpacing: 0.8, marginBottom: 6 }}>{t("topDrivers")}</div>
          {topDrivers.map((d) => (
            <div key={d.country} className="kv" style={{ fontSize: 12 }}>
              <span>{d.country}</span>
              <span className="v" style={{ color: "var(--tx2)" }}>{d.pct}%</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt"><button className="btn ghost" onClick={() => go("xri")}><i className="ti ti-arrow-right" />{t("seeXriDetail")}</button></div>
    </>
  );
}

// ---- VAULT PREVIEW — aggregate KPIs of the ETP, VOP-compliant ----
// Same numbers surfaced in the fund's Vault tab, condensed to a dashboard card.
// The CTA lands on the fund page — Vault is already the default tab there.
interface VaultMini {
  ok: boolean;
  vault?: { n_positions: number; aum_alloc_pct: number; hit_rate_90d_pct: number; avg_holding_days: number };
  next_rotation?: string;
}
function VaultPreviewWidgetBody({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const { lang } = useI18n();
  const t = (k: TKey) => TR[k][lang];
  const [data, setData] = useState<VaultMini | null>(null);
  useEffect(() => {
    fetch("/api/etp-vault").then((r) => r.json()).then(setData).catch(() => setData({ ok: false }));
  }, []);
  const v = data?.ok ? data.vault : null;
  const nextFmt = data?.next_rotation
    ? new Date(data.next_rotation).toLocaleDateString(lang === "pt" ? "pt-BR" : "en-US", { day: "2-digit", month: "short" })
    : null;
  return (
    <>
      {v ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {[
              { l: t("kpiPositions"), v: String(v.n_positions), c: "var(--gold)" },
              { l: t("kpiAumInv"), v: v.aum_alloc_pct + "%", c: "var(--gold)" },
              { l: t("kpiHit90d"), v: v.hit_rate_90d_pct + "%", c: "var(--green)" },
              { l: t("kpiAvgHold"), v: v.avg_holding_days + "d", c: "var(--gold)" },
            ].map((k) => (
              <div key={k.l} style={{ background: "var(--panel2)", borderRadius: 6, padding: "8px 4px", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "var(--tx3)", fontWeight: 700, letterSpacing: 0.5 }}>{k.l}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: k.c, marginTop: 3 }}>{k.v}</div>
              </div>
            ))}
          </div>
          {nextFmt && (
            <div className="muted" style={{ fontSize: 10.5, marginTop: 8, textAlign: "right" }}>
              {t("nextShowcaseRotation")} · <b style={{ color: "var(--tx2)" }}>{nextFmt} · 06:00 BRT</b>
            </div>
          )}
        </>
      ) : (
        <div className="muted" style={{ padding: "10px 0", fontSize: 12 }}>{t("loadingVault")}</div>
      )}
      <div className="mt"><button className="btn ghost" onClick={() => go("fundo", "HPC22")}><i className="ti ti-arrow-right" />{t("openTheVault")}</button></div>
    </>
  );
}

function makeCatalog(t: TFn): Record<string, WidgetDef> {
  return {
  fundos: {
    id: "fundos", title: t("yourFunds"), icon: "ti-coin",
    render: (go) => {
      // Mock periodic performance — replace with /api/fund-perf endpoint later.
      // Same schema for both funds so the card stays uniform.
      const F = [
        { id: "HPC22", name: `HPC22 · ${t("aggressive")}`, d: 2.31, w: 4.20, m: 6.80, y: 24.30, vsSpxYtd: 13.10 },
      ];
      const cell = (v: number) => ({
        color: v >= 0 ? "var(--green)" : "var(--red)",
        text: (v >= 0 ? "+" : "") + v.toFixed(2) + "%",
      });
      return (
        <>
          {F.map((f, i) => (
            <div key={f.id} style={{
              padding: i === 0 ? "0 0 12px 0" : "12px 0 0 0",
              borderTop: i > 0 ? "1px solid var(--line2)" : undefined,
            }}>
              <div className="flex between mb" style={{ alignItems: "baseline" }}>
                <span style={{ fontWeight: 600, color: "var(--tx)", fontSize: 13 }}>{f.name}</span>
                <span className="big" style={{ fontSize: 20, color: cell(f.d).color }}>{cell(f.d).text}</span>
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 8, marginTop: 4,
              }}>
                {[
                  { l: "1D", v: f.d },
                  { l: "5D", v: f.w },
                  { l: "MTD", v: f.m },
                  { l: "YTD", v: f.y },
                ].map((p) => (
                  <div key={p.l} style={{
                    background: "var(--panel2)", borderRadius: 6, padding: "6px 4px",
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 9.5, color: "var(--tx3)", fontWeight: 600, letterSpacing: 0.5 }}>{p.l}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: cell(p.v).color, marginTop: 2 }}>{cell(p.v).text}</div>
                  </div>
                ))}
              </div>
              <div className="muted" style={{ fontSize: 10, marginTop: 6, textAlign: "right" }}>
                vs S&amp;P YTD ·{" "}
                <b style={{ color: f.vsSpxYtd >= 0 ? "var(--green)" : "var(--red)" }}>
                  {(f.vsSpxYtd >= 0 ? "+" : "") + f.vsSpxYtd.toFixed(1)}pp
                </b>
              </div>
            </div>
          ))}
          <div className="mt"><button className="btn ghost" onClick={() => go("fundo", "HPC22")}><i className="ti ti-arrow-right" />{t("openHpc22")}</button></div>
        </>
      );
    },
  },
  // Removed: 'etp' widget (Held in the ETP) — showed active tickers with weights,
  // which contradicts the Verified Opacity Protocol on the fund page. The Vault
  // Preview widget below is the VOP-compliant replacement.
  veredito: {
    id: "veredito", title: t("verdictTitle"), icon: "ti-checkbox",
    Component: VereditoWidgetBody,
  },
  "vault-preview": {
    id: "vault-preview", title: t("vaultAggregate"), icon: "ti-shield-lock",
    Component: VaultPreviewWidgetBody,
  },
  xri: {
    id: "xri", title: t("xriExternalRegime"), icon: "ti-world",
    Component: XriWidgetBody,
  },
  regime: {
    id: "regime", title: t("marketRegimeGauge"), icon: "ti-gauge",
    Component: RegimeGaugeWidgetBody,
  },
  "intel-radar": {
    id: "intel-radar", title: t("intelligenceRadar"), icon: "ti-chart-radar",
    Component: IntelRadarWidgetBody,
  },
  noticias: {
    id: "noticias", title: t("newsBroadcastTitle"), icon: "ti-broadcast",
    Component: NewsWidgetBody,
  },
  cotacoes: {
    id: "cotacoes", title: t("quotesTitle"), icon: "ti-table",
    allowMultiple: true,
    configFields: [{ key: "classe", label: t("classLabel"), options: QUOTE_CLASSES.map((c) => ({ value: c, label: c })) }],
    titleFor: (config) => `${t("quotesTitle")} · ${config?.classe || QUOTE_CLASSES[0]}`,
    Component: CotacoesWidgetBody,
  },
  carteira: {
    id: "carteira", title: t("clientPortfolioTitle"), icon: "ti-briefcase",
    allowMultiple: true,
    configFields: [{ key: "clientId", label: t("clientLabel"), options: CLIENTS.map((c) => ({ value: c.id, label: c.name })) }],
    titleFor: (config) => {
      const c = config?.clientId ? CLIENTS.find((x) => x.id === config.clientId) : null;
      return `${t("portfolio")} · ${c?.name || EMPTY_CLIENT.name}`;
    },
    Component: CarteiraWidgetBody,
  },
  alocacao: {
    id: "alocacao", title: t("allocationByFund"), icon: "ti-chart-donut",
    render: () => (
      <>
        <div className="kv"><span>HPC22 · {t("aggressive")}</span><span className="v">90%</span></div>
        <div className="kv"><span>{t("cash")}</span><span className="v">10%</span></div>
      </>
    ),
  },
  social: {
    id: "social", title: t("socialRadarTitle"), icon: "ti-radar-2",
    Component: SocialWidgetBody,
  },
  clientes: {
    id: "clientes", title: t("clientsTitle"), icon: "ti-users",
    render: (go) => {
      const aum = CLIENTS.reduce((s, c) => s + c.current, 0);
      const fora = CLIENTS.filter((c) => c.riskNumber > c.mandate).length;
      return (
        <>
          <div className="kv"><span>{t("totalAum")}</span><span className="v">{brl(aum)}</span></div>
          <div className="kv"><span>{t("clientsTitle")}</span><span className="v">{CLIENTS.length}</span></div>
          <div className="kv"><span>{t("outsideMandate")}</span><span className="v" style={{ color: fora ? "var(--red)" : "var(--green)" }}>{fora}</span></div>
          <div className="mt"><button className="btn ghost" onClick={() => go("clientes")}><i className="ti ti-arrow-right" />{t("seeClients")}</button></div>
        </>
      );
    },
  },
  alertas: {
    id: "alertas", title: t("alertsTitle"), icon: "ti-bell",
    render: (go) => {
      // Rules, worst-first, so the widget shows SOMETHING useful even when
      // no one is outside mandate (previous version rendered blank).
      const outside = CLIENTS.filter((c) => c.riskNumber > c.mandate);
      const nearMandate = CLIENTS
        .filter((c) => c.riskNumber <= c.mandate && c.mandate - c.riskNumber <= 8)
        .sort((a, b) => (a.mandate - a.riskNumber) - (b.mandate - b.riskNumber));
      const items: { key: string; tag: string; tone: "r" | "a" | "g"; text: string }[] = [];
      outside.slice(0, 3).forEach((c) => items.push({ key: `o-${c.id}`, tag: t("outsideTag"), tone: "r", text: `${c.name} · RN ${c.riskNumber} vs ${t("mandateLc")} ${c.mandate}` }));
      nearMandate.slice(0, 3 - items.length).forEach((c) => items.push({ key: `n-${c.id}`, tag: t("watchTag"), tone: "a", text: `${c.name} · RN ${c.riskNumber} · ${c.mandate - c.riskNumber} ${t("ptBelowMandate")} ${c.mandate}` }));
      return (
        <>
          {items.length ? items.map((it) => (
            <div className="kv" key={it.key}>
              <span style={{ fontSize: 12.5 }}><span className={`tag ${it.tone}`}>{it.tag}</span> {it.text}</span>
            </div>
          )) : (
            <div className="muted" style={{ padding: "10px 0", fontSize: 12.5 }}>{t("allWithinNothingFlag")}</div>
          )}
          <div className="mt"><button className="btn ghost" onClick={() => go("alertas")}><i className="ti ti-arrow-right" />{t("seeAlerts")}</button></div>
        </>
      );
    },
  },
  risco: {
    id: "risco", title: t("riskLevelsTitle"), icon: "ti-scale",
    allowMultiple: true,
    configFields: [{ key: "clientId", label: t("clientLabel"), options: CLIENTS.map((c) => ({ value: c.id, label: c.name })) }],
    titleFor: (config) => {
      const c = config?.clientId ? CLIENTS.find((x) => x.id === config.clientId) : null;
      return `${t("riskWord")} · ${c?.name || EMPTY_CLIENT.name}`;
    },
    Component: RiscoClienteWidgetBody,
  },
  "risco-todos": {
    id: "risco-todos", title: t("allClientsRuler"), icon: "ti-users-group",
    Component: TodosClientesReguaWidgetBody,
  },
  };
}

const uid = () => Math.random().toString(36).slice(2, 9);
// Inverted-pyramid default layout:
//  Row 1 (verdict + performance) — the daily comfort check
//  Row 2 (alerts + vault preview) — action items + bridge to The Vault
//  Row 3 (context: intel radar / news) — added by user on demand via Customize
const DEFAULT_INSTANCES: WidgetInstance[] = [
  { instanceId: "veredito",      catalogId: "veredito" },
  { instanceId: "fundos",        catalogId: "fundos" },
  { instanceId: "xri",           catalogId: "xri" },
  { instanceId: "alertas",       catalogId: "alertas" },
  { instanceId: "vault-preview", catalogId: "vault-preview" },
  { instanceId: "clientes",      catalogId: "clientes" },
];

const WIDGETS_KEY = "harpian_painel_widgets";
// Widget catalog IDs that were removed and must be stripped from any saved layout.
const REMOVED_CATALOG_IDS = new Set(["etp"]);
function loadWidgets(): WidgetInstance[] {
  if (typeof window === "undefined") return DEFAULT_INSTANCES;
  try {
    const raw = JSON.parse(localStorage.getItem(WIDGETS_KEY) || "null");
    if (!Array.isArray(raw) || !raw.length) return DEFAULT_INSTANCES;
    // Migration: strip removed widgets (e.g. old 'etp' Held-in-the-ETP that
    // violated VOP). If the resulting layout is empty, fall back to default.
    const cleaned = (raw as WidgetInstance[]).filter((w) => w && !REMOVED_CATALOG_IDS.has(w.catalogId));
    return cleaned.length ? cleaned : DEFAULT_INSTANCES;
  } catch {
    return DEFAULT_INSTANCES;
  }
}
function saveWidgets(w: WidgetInstance[]) {
  if (typeof window !== "undefined") localStorage.setItem(WIDGETS_KEY, JSON.stringify(w));
}

function SortableCard({
  instance, def, editing, onRemove, onConfigChange, children,
}: {
  instance: WidgetInstance; def: WidgetDef; editing: boolean;
  onRemove: () => void; onConfigChange: (config: Record<string, string>) => void; children: ReactNode;
}) {
  const { lang } = useI18n();
  const t = (k: TKey) => TR[k][lang];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: instance.instanceId, disabled: !editing });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 10 : undefined };
  const [configuring, setConfiguring] = useState(false);
  const title = def.titleFor ? def.titleFor(instance.config) : def.title;

  return (
    <div ref={setNodeRef} style={style} className="card calm">
      {editing && (
        <>
          <div className="drag-handle" {...attributes} {...listeners}><i className="ti ti-grip-vertical" /></div>
          <div className="rm-btn" onClick={onRemove}><i className="ti ti-x" /></div>
          {def.configFields && (
            <div className="rm-btn" style={{ right: 34 }} onClick={() => setConfiguring((v) => !v)} title={t("configureModule")}>
              <i className="ti ti-settings" />
            </div>
          )}
        </>
      )}
      <h3><i className={`ti ${def.icon}`} />{title}</h3>
      {configuring && def.configFields && (
        <div style={{ background: "var(--panel2)", border: "1px solid var(--line2)", borderRadius: 8, padding: 10, marginBottom: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {def.configFields.map((f) => (
            <label key={f.key} style={{ fontSize: 11 }}>
              {f.label}
              <select
                className="input" style={{ width: "100%", marginTop: 3 }}
                value={instance.config?.[f.key] || f.options[0]?.value}
                onChange={(e) => onConfigChange({ ...instance.config, [f.key]: e.target.value })}
              >
                {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}

export default function Painel({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const { lang } = useI18n();
  const t = (k: TKey) => TR[k][lang];
  const CATALOG = useMemo(() => makeCatalog(t), [lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const [widgets, setWidgets] = useState<WidgetInstance[]>(DEFAULT_INSTANCES);
  const [editing, setEditing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Loads the saved layout (modules + configs) as soon as it mounts on the client.
  useEffect(() => setWidgets(loadWidgets()), []);
  // Persists on every change — customization survives a refresh.
  useEffect(() => { saveWidgets(widgets); }, [widgets]);

  // Publishes the day's summary to JIM (the dashboard essentials).
  useEffect(() => {
    const aum = CLIENTS.reduce((s, c) => s + c.current, 0);
    const fora = CLIENTS.filter((c) => c.riskNumber > c.mandate).length;
    publishScreenData(
      "painel",
      "Manager dashboard: today's fund (HPC22 Aggressive), market regime, defense, and client summary (AUM, outside mandate). The dashboard is customizable: Quotes modules (by asset class) and Client portfolio modules can be added multiple times, each with a different configuration.",
      {
        HPC22_hoje: "+2.31%",
        regime: "RISK-ON", defesa: "disarmed · full exposure",
        clientes: CLIENTS.length, aumTotal: aum, foraDoMandato: fora,
      },
      {
        briefing:
          `${t("jimGoodMorningSummary")} **HPC22 +2.31%**. ${t("jimRegimeRiskOnDefense")} ` +
          `${CLIENTS.length} ${t("clientsWord")}, AUM ${brl(aum)}` + (fora ? `, **${fora} ${t("outsideMandateLc")}**.` : `, ${t("allWithinMandateLc")}`),
        suggestions: [
          t("suggestFunds"),
          fora ? t("suggestOutside") : t("suggestAttention"),
          t("suggestWhyRiskOn"),
        ],
      }
    );
  }, []);

  function addWidget(catalogId: string) {
    const def = CATALOG[catalogId];
    if (!def) return;
    if (!def.allowMultiple && widgets.some((w) => w.catalogId === catalogId)) { setShowAdd(false); return; }
    const config = def.configFields ? Object.fromEntries(def.configFields.map((f) => [f.key, f.options[0]?.value])) : undefined;
    setWidgets((cur) => [...cur, { instanceId: uid(), catalogId, config }]);
    setShowAdd(false);
  }
  function removeWidget(instanceId: string) {
    setWidgets((cur) => cur.filter((w) => w.instanceId !== instanceId));
  }
  function updateConfig(instanceId: string, config: Record<string, string>) {
    setWidgets((cur) => cur.map((w) => (w.instanceId === instanceId ? { ...w, config } : w)));
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setWidgets((w) => {
        const from = w.findIndex((x) => x.instanceId === active.id);
        const to = w.findIndex((x) => x.instanceId === over.id);
        return arrayMove(w, from, to);
      });
    }
  }
  // Single-instance modules (allowMultiple=false) disappear from the menu once
  // added; configurable ones (Quotes, Portfolio) stay always available — you can
  // add as many as you want, each in a different class/client.
  const available = Object.values(CATALOG).filter((w) => w.allowMultiple || !widgets.some((inst) => inst.catalogId === w.id));

  return (
    <div className={`screen${editing ? " editing" : ""}`}>
      <div className="flex between" style={{ alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
          <div className="h1" style={{ margin: 0 }}>{t("goodMorning")}, João</div>
          <div className="sub" style={{ margin: 0 }}>{t("essentials")} {editing ? t("dragToReorganize") : t("everythingClickAway")}</div>
        </div>
        <div className="flex" style={{ gap: 8, alignItems: "center" }}>
          {editing && (
            <>
              <div style={{ position: "relative" }}>
                <button className="btn ghost" style={{ padding: "6px 11px", fontSize: 12 }} onClick={() => setShowAdd((v) => !v)}>
                  <i className="ti ti-plus" />{t("addModule")}<i className="ti ti-chevron-down" style={{ fontSize: 12 }} />
                </button>
                {showAdd && (
                  <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: "var(--panel)", border: "1px solid var(--line2)", borderRadius: 10, boxShadow: "0 18px 50px rgba(0,0,0,.55)", padding: 6, minWidth: 230, zIndex: 60, maxHeight: 340, overflowY: "auto" }}>
                    {available.length === 0
                      ? <div className="muted" style={{ padding: 10, fontSize: 12 }}>{t("allModulesOnDashboard")}</div>
                      : available.map((w) => (
                        <div key={w.id} className="dd-item" onClick={() => addWidget(w.id)}>
                          <i className={`ti ${w.icon}`} />{w.title}{w.allowMultiple && <span className="muted" style={{ marginLeft: "auto", fontSize: 10 }}>{t("addAnother")}</span>}
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <button className="btn ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => setWidgets(DEFAULT_INSTANCES)} title={t("restoreDefault")}><i className="ti ti-rotate" /></button>
            </>
          )}
          <button
            onClick={() => { setEditing((v) => !v); setShowAdd(false); }}
            title={editing ? t("done") : t("customizeDashboard")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
              fontSize: 12, padding: "6px 11px", borderRadius: 7, fontFamily: "var(--sans)",
              border: `1px solid ${editing ? "var(--gold)" : "var(--line2)"}`,
              background: editing ? "rgba(201,160,44,.15)" : "transparent",
              color: editing ? "var(--gold)" : "var(--tx3)",
            }}>
            <i className={`ti ${editing ? "ti-check" : "ti-layout-grid-add"}`} />{editing ? t("done") : t("customize")}
          </button>
        </div>
      </div>

      <JimMorningBriefing go={go} />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={widgets.map((w) => w.instanceId)} strategy={rectSortingStrategy}>
          <div className="grid g3">
            {widgets.map((instance) => {
              const def = CATALOG[instance.catalogId];
              if (!def) return null;
              return (
                <SortableCard
                  key={instance.instanceId} instance={instance} def={def} editing={editing}
                  onRemove={() => removeWidget(instance.instanceId)}
                  onConfigChange={(config) => updateConfig(instance.instanceId, config)}
                >
                  {def.Component ? <def.Component go={go} config={instance.config} /> : def.render?.(go)}
                </SortableCard>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {editing && available.length > 0 && (
        <div className="muted mt" style={{ fontSize: 11 }}>{available.length} {t("modulesAvailableSuffix")}</div>
      )}
    </div>
  );
}

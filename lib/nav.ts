// ============================================================
// HARPIAN ETP TERMINAL — Navigation (menu structure)
// ============================================================
import type { Lang } from "@/lib/i18n";

export type ScreenId =
  | "painel"
  | "fundo"
  | "cotacoes"
  | "calendar"
  | "mercado-visao"
  | "risco"
  | "clientes"
  | "cliente"
  | "ordem"
  | "carteira"
  | "cliente-risco"
  | "portfolio-detalhe"
  | "portfolio-builder"
  | "regime"
  | "xri"
  | "acoes"
  | "noticias"
  | "importar"
  | "alertas"
  | "integracoes"
  | "marca"
  | "config"
  | "api"
  | "institutional"
  | "cot-sentiment"
  | "cot-legacy"
  | "social-radar"
  | "news-broadcast"
  | "insider-orders"
  | "market-dna"
  | "screener"
  | "snowflake"
  | "filings-search"
  | "tutorial";

export interface MenuItem {
  id: ScreenId;
  labelKey: string;
  icon: string;
  tag?: string;
  param?: string;
}
export interface MenuColumn {
  labelKey?: string;
  items: MenuItem[];
}
export interface Menu {
  key: string;
  labelKey: string;
  icon: string;
  direct?: ScreenId;
  wide?: boolean;
  columns?: MenuColumn[];
}

// Resolved (post-lang) shapes consumed by Topbar and other UI.
export interface ResolvedMenuItem extends Omit<MenuItem, "labelKey"> {
  label: string;
}
export interface ResolvedMenuColumn extends Omit<MenuColumn, "labelKey" | "items"> {
  label?: string;
  items: ResolvedMenuItem[];
}
export interface ResolvedMenu extends Omit<Menu, "labelKey" | "columns"> {
  label: string;
  columns?: ResolvedMenuColumn[];
}

// Bilingual label dictionary. Keys are internal-only, never rendered directly.
const NAV_TR: Record<string, Record<Lang, string>> = {
  "menu.painel": { pt: "Painel", en: "Dashboard" },
  "menu.fundos": { pt: "Fundos", en: "Funds" },
  "menu.clientes": { pt: "Clientes", en: "Clients" },
  "menu.mercado": { pt: "Mercado", en: "Market" },
  "menu.inteligencia": { pt: "Inteligência", en: "Intelligence" },
  "menu.risco": { pt: "Risco", en: "Risk" },
  "menu.configuracoes": { pt: "Configurações", en: "Settings" },
  "menu.tutorial": { pt: "Tutorial", en: "Tutorial" },

  "col.escolha_fundo": { pt: "Escolha o fundo", en: "Choose the fund" },
  "col.o_que_fazer": { pt: "O que fazer", en: "What to do" },

  "item.hpc22": { pt: "HPC22 · Agressivo", en: "HPC22 · Aggressive" },
  "item.hpc11": { pt: "HPC11 · I.G.", en: "HPC11 · I.G." },
  "item.lynk_core22": { pt: "Lynk Core22 HPC", en: "Lynk Core22 HPC" },
  "item.white_label": { pt: "White-label", en: "White-label" },
  "item.visao_geral": { pt: "Visão geral", en: "Overview" },
  "item.desempenho": { pt: "Desempenho", en: "Performance" },
  "item.composicao": { pt: "Composição", en: "Composition" },
  "item.defesa_risco": { pt: "Defesa e risco", en: "Defense & risk" },
  "item.portfolio_builder": { pt: "Construção de portfólio", en: "Portfolio builder" },
  "item.enviar_ordem": { pt: "Enviar ordem (Lynk)", en: "Send order (Lynk)" },

  "item.lista_clientes": { pt: "Lista de clientes", en: "Client list" },
  "item.carteira_cliente": { pt: "Carteira do cliente", en: "Client portfolio" },
  "item.importar_conectar": { pt: "Importar / conectar", en: "Import / connect" },
  "item.alertas": { pt: "Alertas", en: "Alerts" },
  "item.ordens": { pt: "Ordens", en: "Orders" },

  "item.visao_mercado": { pt: "Visão de Mercado", en: "Market Overview" },
  "item.ari": { pt: "American Regime Index (ARI)", en: "American Regime Index (ARI)" },
  "item.xri": { pt: "External Regime Index (XRI)", en: "External Regime Index (XRI)" },
  "item.market_dna": { pt: "Market DNA", en: "Market DNA" },
  "item.snowflake": { pt: "Snowflake", en: "Snowflake" },
  "item.calendario": { pt: "Calendário", en: "Calendar" },
  "item.cotacoes": { pt: "Cotações", en: "Quotes" },
  "item.screener": { pt: "Screener", en: "Screener" },

  "item.social_radar": { pt: "Social Radar", en: "Social Radar" },
  "item.news_broadcast": { pt: "News Broadcast", en: "News Broadcast" },
  "item.insider_orders": { pt: "Insider Orders", en: "Insider Orders" },
  "item.posicoes_13f": { pt: "Posições 13F", en: "13F Holdings" },
  "item.cot_intelligence": { pt: "COT Intelligence", en: "COT Intelligence" },
  "item.cot_explorer": { pt: "COT Data Explorer", en: "COT Data Explorer" },
  "item.filings_search": { pt: "Filings Search", en: "Filings Search" },

  "item.comparacao_niveis": { pt: "Comparação · 4 níveis", en: "Comparison · 4 levels" },
  "item.risco_carteira": { pt: "Risco da carteira", en: "Portfolio risk" },
  "item.risco_cliente": { pt: "Risco do cliente", en: "Client risk" },

  "item.integracoes": { pt: "Integrações", en: "Integrations" },
  "item.api_integracao": { pt: "API & Integração", en: "API & Integration" },
  "item.marca": { pt: "Marca (white-label)", en: "Brand (white-label)" },
  "item.configuracoes": { pt: "Configurações", en: "Settings" },
};

function tr(key: string, lang: Lang): string {
  return NAV_TR[key]?.[lang] ?? key;
}

export const MENUS: Menu[] = [
  { key: "painel", labelKey: "menu.painel", icon: "ti-home", direct: "painel" },
  {
    key: "fundos",
    labelKey: "menu.fundos",
    icon: "ti-coin",
    wide: true,
    columns: [
      {
        labelKey: "col.escolha_fundo",
        items: [
          { id: "fundo", labelKey: "item.hpc22", icon: "ti-coin", param: "HPC22" },
          { id: "fundo", labelKey: "item.hpc11", icon: "ti-coin", param: "HPC11" },
          { id: "fundo", labelKey: "item.lynk_core22", icon: "ti-coin", param: "LCORE22", tag: "new" },
          { id: "fundo", labelKey: "item.white_label", icon: "ti-tag", param: "HPC22" },
        ],
      },
      {
        labelKey: "col.o_que_fazer",
        items: [
          { id: "fundo", labelKey: "item.visao_geral", icon: "ti-eye" },
          { id: "fundo", labelKey: "item.desempenho", icon: "ti-chart-line" },
          { id: "fundo", labelKey: "item.composicao", icon: "ti-chart-pie" },
          { id: "fundo", labelKey: "item.defesa_risco", icon: "ti-shield" },
          { id: "portfolio-builder", labelKey: "item.portfolio_builder", icon: "ti-adjustments-horizontal", tag: "new" },
          { id: "ordem", labelKey: "item.enviar_ordem", icon: "ti-send", tag: "new" },
        ],
      },
    ],
  },
  {
    key: "clientes",
    labelKey: "menu.clientes",
    icon: "ti-users",
    columns: [
      {
        items: [
          { id: "clientes", labelKey: "item.lista_clientes", icon: "ti-list" },
          { id: "carteira", labelKey: "item.carteira_cliente", icon: "ti-wallet" },
          { id: "importar", labelKey: "item.importar_conectar", icon: "ti-upload" },
          { id: "alertas", labelKey: "item.alertas", icon: "ti-bell" },
          { id: "ordem", labelKey: "item.ordens", icon: "ti-send", tag: "Lynk" },
        ],
      },
    ],
  },
  {
    key: "mercado",
    labelKey: "menu.mercado",
    icon: "ti-chart-candle",
    columns: [
      {
        items: [
          { id: "mercado-visao", labelKey: "item.visao_mercado", icon: "ti-layout-dashboard", tag: "new" },
          { id: "regime", labelKey: "item.ari", icon: "ti-world" },
          { id: "xri", labelKey: "item.xri", icon: "ti-world-exclamation" },
          { id: "market-dna", labelKey: "item.market_dna", icon: "ti-dna-2" },
          { id: "snowflake", labelKey: "item.snowflake", icon: "ti-snowflake" },
          { id: "calendar", labelKey: "item.calendario", icon: "ti-calendar-event", tag: "new" },
          { id: "cotacoes", labelKey: "item.cotacoes", icon: "ti-table" },
          { id: "screener", labelKey: "item.screener", icon: "ti-filter" },
        ],
      },
    ],
  },
  {
    key: "inteligencia",
    labelKey: "menu.inteligencia",
    icon: "ti-building",
    columns: [
      {
        items: [
          { id: "social-radar", labelKey: "item.social_radar", icon: "ti-radar-2", tag: "new" },
          { id: "news-broadcast", labelKey: "item.news_broadcast", icon: "ti-broadcast", tag: "new" },
          { id: "insider-orders", labelKey: "item.insider_orders", icon: "ti-gavel", tag: "new" },
          { id: "institutional", labelKey: "item.posicoes_13f", icon: "ti-report-money", tag: "SEC" },
          { id: "cot-sentiment", labelKey: "item.cot_intelligence", icon: "ti-flame", tag: "CFTC" },
          { id: "cot-legacy", labelKey: "item.cot_explorer", icon: "ti-chart-bar" },
          { id: "filings-search", labelKey: "item.filings_search", icon: "ti-file-search", tag: "SEC" },
        ],
      },
    ],
  },
  {
    key: "risco",
    labelKey: "menu.risco",
    icon: "ti-shield-half",
    columns: [
      {
        items: [
          { id: "risco", labelKey: "item.comparacao_niveis", icon: "ti-scale", tag: "new" },
          { id: "carteira", labelKey: "item.risco_carteira", icon: "ti-wallet" },
          { id: "cliente-risco", labelKey: "item.risco_cliente", icon: "ti-user-heart" },
        ],
      },
    ],
  },
  {
    key: "configuracoes",
    labelKey: "menu.configuracoes",
    icon: "ti-settings",
    columns: [
      {
        items: [
          { id: "integracoes", labelKey: "item.integracoes", icon: "ti-plug" },
          { id: "api", labelKey: "item.api_integracao", icon: "ti-code", tag: "dev" },
          { id: "marca", labelKey: "item.marca", icon: "ti-palette", tag: "new" },
          { id: "config", labelKey: "item.configuracoes", icon: "ti-adjustments" },
        ],
      },
    ],
  },
  { key: "tutorial", labelKey: "menu.tutorial", icon: "ti-help-circle", direct: "tutorial" },
];

/** Resolves MENUS to concrete labels for the given language. Consumers (e.g. Topbar) call
 * this with the current `lang` from useI18n() instead of reading MENUS labels directly. */
export function getMenus(lang: Lang): ResolvedMenu[] {
  return MENUS.map((m) => ({
    ...m,
    label: tr(m.labelKey, lang),
    columns: m.columns?.map((col) => ({
      ...col,
      label: col.labelKey ? tr(col.labelKey, lang) : undefined,
      items: col.items.map((it) => ({ ...it, label: tr(it.labelKey, lang) })),
    })),
  }));
}

// Screen → top-menu mapping, keyed by the same `key` used in MENUS above (not by label),
// so getScreenToMenu() and getMenus() always resolve to matching text for a given lang.
// Used by Topbar to highlight the active menu in gold so the header doesn't need to
// repeat the section name in a breadcrumb below.
// Some screens live under multiple menus (e.g. `carteira` in Clients + Risk);
// this table encodes the PRIMARY home for each screen.
const SCREEN_TO_MENU_KEY: Record<ScreenId, string> = {
  painel: "painel",
  fundo: "fundos",
  ordem: "fundos",
  clientes: "clientes",
  cliente: "clientes",
  carteira: "clientes",
  importar: "clientes",
  alertas: "clientes",
  "portfolio-detalhe": "clientes",
  "portfolio-builder": "fundos",
  "mercado-visao": "mercado",
  regime: "mercado",
  xri: "mercado",
  "market-dna": "mercado",
  snowflake: "mercado",
  calendar: "mercado",
  cotacoes: "mercado",
  screener: "mercado",
  acoes: "mercado",
  noticias: "inteligencia",
  "social-radar": "inteligencia",
  "news-broadcast": "inteligencia",
  "insider-orders": "inteligencia",
  institutional: "inteligencia",
  "cot-sentiment": "inteligencia",
  "cot-legacy": "inteligencia",
  "filings-search": "inteligencia",
  risco: "risco",
  "cliente-risco": "risco",
  integracoes: "configuracoes",
  api: "configuracoes",
  marca: "configuracoes",
  config: "configuracoes",
  tutorial: "tutorial",
};

const MENU_KEY_TO_LABEL_KEY: Record<string, string> = Object.fromEntries(
  MENUS.map((m) => [m.key, m.labelKey])
);

/** Resolves SCREEN_TO_MENU to the concrete menu label for `lang`, guaranteed to match a
 * label produced by getMenus(lang) for the same lang since both derive from the same
 * menu `key` → `labelKey` → NAV_TR chain. */
export function getScreenToMenu(lang: Lang): Record<ScreenId, string> {
  return Object.fromEntries(
    Object.entries(SCREEN_TO_MENU_KEY).map(([screen, menuKey]) => [
      screen,
      tr(MENU_KEY_TO_LABEL_KEY[menuKey] ?? "menu.painel", lang),
    ])
  ) as Record<ScreenId, string>;
}

export function activeMenuFor(screen: ScreenId, lang: Lang = "pt"): string {
  return getScreenToMenu(lang)[screen] || tr("menu.painel", lang);
}

/** O texto veio do endereco (#tela): so aceita se for uma tela que existe. */
export function isScreenId(v: string): v is ScreenId {
  return Object.prototype.hasOwnProperty.call(SCREEN_TO_MENU_KEY, v);
}

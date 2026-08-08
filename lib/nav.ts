// ============================================================
// HARPIAN ETP TERMINAL — Navigation (menu structure)
// ============================================================
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
  label: string;
  icon: string;
  tag?: string;
  param?: string;
}
export interface MenuColumn {
  label?: string;
  items: MenuItem[];
}
export interface Menu {
  label: string;
  icon: string;
  direct?: ScreenId;
  wide?: boolean;
  columns?: MenuColumn[];
}

export const MENUS: Menu[] = [
  { label: "Painel", icon: "ti-home", direct: "painel" },
  {
    label: "Fundos",
    icon: "ti-coin",
    wide: true,
    columns: [
      {
        label: "Escolha o fundo",
        items: [
          { id: "fundo", label: "HPC22 · Agressivo", icon: "ti-coin", param: "HPC22" },
          { id: "fundo", label: "HPC11 · I.G.", icon: "ti-coin", param: "HPC11" },
          { id: "fundo", label: "Lynk Core22 HPC", icon: "ti-coin", param: "LCORE22", tag: "new" },
          { id: "fundo", label: "White-label", icon: "ti-tag", param: "HPC22" },
        ],
      },
      {
        label: "O que fazer",
        items: [
          { id: "fundo", label: "Visão geral", icon: "ti-eye" },
          { id: "fundo", label: "Desempenho", icon: "ti-chart-line" },
          { id: "fundo", label: "Composição", icon: "ti-chart-pie" },
          { id: "fundo", label: "Defesa e risco", icon: "ti-shield" },
          { id: "portfolio-builder", label: "Construção de portfólio", icon: "ti-adjustments-horizontal", tag: "new" },
          { id: "ordem", label: "Enviar ordem (Lynk)", icon: "ti-send", tag: "new" },
        ],
      },
    ],
  },
  {
    label: "Clientes",
    icon: "ti-users",
    columns: [
      {
        items: [
          { id: "clientes", label: "Lista de clientes", icon: "ti-list" },
          { id: "carteira", label: "Carteira do cliente", icon: "ti-wallet" },
          { id: "importar", label: "Importar / conectar", icon: "ti-upload" },
          { id: "alertas", label: "Alertas", icon: "ti-bell" },
          { id: "ordem", label: "Ordens", icon: "ti-send", tag: "Lynk" },
        ],
      },
    ],
  },
  {
    label: "Mercado",
    icon: "ti-chart-candle",
    columns: [
      {
        items: [
          { id: "mercado-visao", label: "Visão de Mercado", icon: "ti-layout-dashboard", tag: "new" },
          { id: "regime", label: "American Regime Index (ARI)", icon: "ti-world" },
          { id: "xri", label: "External Regime Index (XRI)", icon: "ti-world-exclamation" },
          { id: "market-dna", label: "Market DNA", icon: "ti-dna-2" },
          { id: "snowflake", label: "Snowflake", icon: "ti-snowflake" },
          { id: "calendar", label: "Calendário", icon: "ti-calendar-event", tag: "new" },
          { id: "cotacoes", label: "Cotações", icon: "ti-table" },
          { id: "screener", label: "Screener", icon: "ti-filter" },
        ],
      },
    ],
  },
  {
    label: "Inteligência",
    icon: "ti-building",
    columns: [
      {
        items: [
          { id: "social-radar", label: "Social Radar", icon: "ti-radar-2", tag: "new" },
          { id: "news-broadcast", label: "News Broadcast", icon: "ti-broadcast", tag: "new" },
          { id: "insider-orders", label: "Insider Orders", icon: "ti-gavel", tag: "new" },
          { id: "institutional", label: "Posições 13F", icon: "ti-report-money", tag: "SEC" },
          { id: "cot-sentiment", label: "COT Intelligence", icon: "ti-flame", tag: "CFTC" },
          { id: "cot-legacy", label: "COT Data Explorer", icon: "ti-chart-bar" },
          { id: "filings-search", label: "Filings Search", icon: "ti-file-search", tag: "SEC" },
        ],
      },
    ],
  },
  {
    label: "Risco",
    icon: "ti-shield-half",
    columns: [
      {
        items: [
          { id: "risco", label: "Comparação · 4 níveis", icon: "ti-scale", tag: "new" },
          { id: "carteira", label: "Risco da carteira", icon: "ti-wallet" },
          { id: "cliente-risco", label: "Risco do cliente", icon: "ti-user-heart" },
        ],
      },
    ],
  },
  {
    label: "Configurações",
    icon: "ti-settings",
    columns: [
      {
        items: [
          { id: "integracoes", label: "Integrações", icon: "ti-plug" },
          { id: "api", label: "API & Integração", icon: "ti-code", tag: "dev" },
          { id: "marca", label: "Marca (white-label)", icon: "ti-palette", tag: "new" },
          { id: "config", label: "Configurações", icon: "ti-adjustments" },
        ],
      },
    ],
  },
  { label: "Tutorial", icon: "ti-help-circle", direct: "tutorial" },
];

// Screen → top-menu mapping. Used by Topbar to highlight the active menu in gold
// so the header doesn't need to repeat the section name in a breadcrumb below.
// Some screens live under multiple menus (e.g. `carteira` in Clients + Risk);
// this table encodes the PRIMARY home for each screen.
const SCREEN_TO_MENU: Record<ScreenId, string> = {
  painel: "Painel",
  fundo: "Fundos",
  ordem: "Fundos",
  clientes: "Clientes",
  cliente: "Clientes",
  carteira: "Clientes",
  importar: "Clientes",
  alertas: "Clientes",
  "portfolio-detalhe": "Clientes",
  "portfolio-builder": "Fundos",
  "mercado-visao": "Mercado",
  regime: "Mercado",
  xri: "Mercado",
  "market-dna": "Mercado",
  snowflake: "Mercado",
  calendar: "Mercado",
  cotacoes: "Mercado",
  screener: "Mercado",
  acoes: "Mercado",
  noticias: "Inteligência",
  "social-radar": "Inteligência",
  "news-broadcast": "Inteligência",
  "insider-orders": "Inteligência",
  institutional: "Inteligência",
  "cot-sentiment": "Inteligência",
  "cot-legacy": "Inteligência",
  "filings-search": "Inteligência",
  risco: "Risco",
  "cliente-risco": "Risco",
  integracoes: "Configurações",
  api: "Configurações",
  marca: "Configurações",
  config: "Configurações",
  tutorial: "Tutorial",
};

export function activeMenuFor(screen: ScreenId): string {
  return SCREEN_TO_MENU[screen] || "Painel";
}

/** O texto veio do endereco (#tela): so aceita se for uma tela que existe. */
export function isScreenId(v: string): v is ScreenId {
  return Object.prototype.hasOwnProperty.call(SCREEN_TO_MENU, v);
}

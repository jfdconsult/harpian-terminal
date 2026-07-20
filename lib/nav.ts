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
  { label: "Dashboard", icon: "ti-home", direct: "painel" },
  {
    label: "Funds",
    icon: "ti-coin",
    wide: true,
    columns: [
      {
        label: "Choose the fund",
        items: [
          { id: "fundo", label: "HPC22 · Aggressive", icon: "ti-coin", param: "HPC22" },
          { id: "fundo", label: "HPC11 · I.G.", icon: "ti-coin", param: "HPC11" },
          { id: "fundo", label: "Lynk Core22 HPC", icon: "ti-coin", param: "LCORE22", tag: "new" },
          { id: "fundo", label: "White-label", icon: "ti-tag", param: "HPC22" },
        ],
      },
      {
        label: "What to do",
        items: [
          { id: "fundo", label: "Overview", icon: "ti-eye" },
          { id: "fundo", label: "Performance", icon: "ti-chart-line" },
          { id: "fundo", label: "Composition", icon: "ti-chart-pie" },
          { id: "fundo", label: "Defense & risk", icon: "ti-shield" },
          { id: "ordem", label: "Send order (Lynk)", icon: "ti-send", tag: "new" },
        ],
      },
    ],
  },
  {
    label: "Clients",
    icon: "ti-users",
    columns: [
      {
        items: [
          { id: "clientes", label: "Client list", icon: "ti-list" },
          { id: "carteira", label: "Client portfolio", icon: "ti-wallet" },
          { id: "importar", label: "Import / connect", icon: "ti-upload" },
          { id: "alertas", label: "Alerts", icon: "ti-bell" },
          { id: "ordem", label: "Orders", icon: "ti-send", tag: "Lynk" },
        ],
      },
    ],
  },
  {
    label: "Market",
    icon: "ti-chart-candle",
    columns: [
      {
        items: [
          { id: "mercado-visao", label: "Market Overview", icon: "ti-layout-dashboard", tag: "new" },
          { id: "regime", label: "American Regime Index (ARI)", icon: "ti-world" },
          { id: "xri", label: "External Regime Index (XRI)", icon: "ti-world-exclamation" },
          { id: "market-dna", label: "Market DNA", icon: "ti-dna-2" },
          { id: "snowflake", label: "Snowflake", icon: "ti-snowflake" },
          { id: "calendar", label: "Calendar", icon: "ti-calendar-event", tag: "new" },
          { id: "cotacoes", label: "Quotes", icon: "ti-table" },
          { id: "screener", label: "Screener", icon: "ti-filter" },
        ],
      },
    ],
  },
  {
    label: "Intelligence",
    icon: "ti-building",
    columns: [
      {
        items: [
          { id: "social-radar", label: "Social Radar", icon: "ti-radar-2", tag: "new" },
          { id: "news-broadcast", label: "News Broadcast", icon: "ti-broadcast", tag: "new" },
          { id: "insider-orders", label: "Insider Orders", icon: "ti-gavel", tag: "new" },
          { id: "institutional", label: "13F Holdings", icon: "ti-report-money", tag: "SEC" },
          { id: "cot-sentiment", label: "COT Intelligence", icon: "ti-flame", tag: "CFTC" },
          { id: "cot-legacy", label: "COT Data Explorer", icon: "ti-chart-bar" },
          { id: "filings-search", label: "Filings Search", icon: "ti-file-search", tag: "SEC" },
        ],
      },
    ],
  },
  {
    label: "Risk",
    icon: "ti-shield-half",
    columns: [
      {
        items: [
          { id: "risco", label: "Comparison · 4 levels", icon: "ti-scale", tag: "new" },
          { id: "carteira", label: "Portfolio risk", icon: "ti-wallet" },
          { id: "cliente-risco", label: "Client risk", icon: "ti-user-heart" },
        ],
      },
    ],
  },
  {
    label: "Settings",
    icon: "ti-settings",
    columns: [
      {
        items: [
          { id: "integracoes", label: "Integrations", icon: "ti-plug" },
          { id: "api", label: "API & Integration", icon: "ti-code", tag: "dev" },
          { id: "marca", label: "Brand (white-label)", icon: "ti-palette", tag: "new" },
          { id: "config", label: "Settings", icon: "ti-adjustments" },
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
  painel: "Dashboard",
  fundo: "Funds",
  ordem: "Funds",
  clientes: "Clients",
  cliente: "Clients",
  carteira: "Clients",
  importar: "Clients",
  alertas: "Clients",
  "portfolio-detalhe": "Clients",
  "mercado-visao": "Market",
  regime: "Market",
  xri: "Market",
  "market-dna": "Market",
  snowflake: "Market",
  calendar: "Market",
  cotacoes: "Market",
  screener: "Market",
  acoes: "Market",
  noticias: "Intelligence",
  "social-radar": "Intelligence",
  "news-broadcast": "Intelligence",
  "insider-orders": "Intelligence",
  institutional: "Intelligence",
  "cot-sentiment": "Intelligence",
  "cot-legacy": "Intelligence",
  "filings-search": "Intelligence",
  risco: "Risk",
  "cliente-risco": "Risk",
  integracoes: "Settings",
  api: "Settings",
  marca: "Settings",
  config: "Settings",
  tutorial: "Tutorial",
};

export function activeMenuFor(screen: ScreenId): string {
  return SCREEN_TO_MENU[screen] || "Dashboard";
}

// ============================================================
// HARPIAN ETP TERMINAL — Navegação (estrutura de menus)
// ============================================================
export type ScreenId =
  | "painel"
  | "fundo"
  | "cotacoes"
  | "risco"
  | "clientes"
  | "cliente"
  | "ordem"
  | "carteira"
  | "regime"
  | "acoes"
  | "noticias"
  | "importar"
  | "alertas"
  | "integracoes"
  | "marca"
  | "config"
  | "institutional"
  | "cot-sentiment"
  | "cot-legacy"
  | "social-radar"
  | "news-broadcast"
  | "insider-orders"
  | "tutorial";

export interface MenuItem {
  id: ScreenId;
  label: string;
  icon: string;
  tag?: string;
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
          { id: "fundo", label: "HPC22 · Agressivo", icon: "ti-coin" },
          { id: "fundo", label: "HPC11 · I.G.", icon: "ti-coin" },
          { id: "fundo", label: "White-label", icon: "ti-tag" },
        ],
      },
      {
        label: "O que fazer",
        items: [
          { id: "fundo", label: "Visão", icon: "ti-eye" },
          { id: "fundo", label: "Performance", icon: "ti-chart-line" },
          { id: "fundo", label: "Composição", icon: "ti-chart-pie" },
          { id: "fundo", label: "Defesa & risco", icon: "ti-shield" },
          { id: "ordem", label: "Enviar ordem (Lynk)", icon: "ti-send", tag: "novo" },
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
    icon: "ti-radar",
    columns: [
      {
        items: [
          { id: "regime", label: "Sinais & regime", icon: "ti-activity" },
          { id: "cotacoes", label: "Cotações (FastTrack)", icon: "ti-table", tag: "novo" },
          { id: "acoes", label: "Ações & índices US", icon: "ti-chart-candle" },
          { id: "noticias", label: "Notícias", icon: "ti-news" },
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
          { id: "social-radar", label: "Social Radar", icon: "ti-radar-2", tag: "novo" },
          { id: "news-broadcast", label: "News Broadcast", icon: "ti-broadcast", tag: "novo" },
          { id: "insider-orders", label: "Insider Orders", icon: "ti-gavel", tag: "novo" },
          { id: "institutional", label: "13F Holdings", icon: "ti-report-money", tag: "SEC" },
          { id: "cot-sentiment", label: "COT Sentiment", icon: "ti-flame", tag: "CFTC" },
          { id: "cot-legacy", label: "COT Legacy", icon: "ti-chart-bar" },
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
          { id: "risco", label: "Comparação · 4 níveis", icon: "ti-scale", tag: "novo" },
          { id: "carteira", label: "Risco do portfólio", icon: "ti-wallet" },
          { id: "carteira", label: "Risco do cliente", icon: "ti-user-heart" },
        ],
      },
    ],
  },
  {
    label: "Ajustes",
    icon: "ti-settings",
    columns: [
      {
        items: [
          { id: "integracoes", label: "Integrações", icon: "ti-plug" },
          { id: "marca", label: "Marca (white-label)", icon: "ti-palette", tag: "novo" },
          { id: "config", label: "Configurações", icon: "ti-adjustments" },
        ],
      },
    ],
  },
  { label: "Tutorial", icon: "ti-help-circle", direct: "tutorial" },
];

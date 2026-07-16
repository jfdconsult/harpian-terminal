// Model portfolios of Harpian's PARTNERS (presentation). In the presentation
// terminal, the "clients" are the partners themselves with their own portfolios —
// real name/role data, real allocation by geography, and % in the ETP (HPC).
// Names and credentials come from the TEAM slide of the institutional deck.
// (This is the only "client" data in the terminal — everything else is live.)
import type { PortfolioItemDetail } from "./portfolioModels";
import { MODELS } from "./portfolioModels";
export type { PortfolioItemDetail };
export interface Alloc { label: string; pct: number; tone?: "g" | "r" | "gold" }
export interface ImportedPosition { ticker: string; qty: number; avgPrice: number }

// Personal/registration data — kept separate from the risk profile (its own tab in editing).
export interface PersonalData {
  cpfCnpj?: string;
  phone?: string;
  address?: string;
  responsavel?: string; // contact person at the family office/institution
}

// An account at a bank/broker/custodian — a client can have several.
export interface Account {
  id: string;
  bank: string;                 // bank/broker name
  type: "Conta corrente" | "Corretora" | "Custódia" | "Outro";
  agency?: string;
  accountNumber?: string;
  custodian?: string;           // custodian, if different from the bank
  notes?: string;
}

// A portfolio — a client can have several (one per bank/account, for example).
export interface Portfolio {
  id: string;
  name: string;                 // e.g.: "XP Portfolio", "Itaú Private Portfolio"
  accountId?: string;           // reference to Account.id
  positions: ImportedPosition[]; // liquid subset (Yahoo-quotable) — feeds the "live gain"
  items?: PortfolioItemDetail[]; // FULL product-by-product breakdown (Excel) — for the portfolio screen
  modelLabel?: string;           // label of the originating reference model (e.g.: "P1 — Conservative Brazil")
  baseValueUsd?: number;         // model base value (usually USD 100,000)
}

// Connection to the MFO's own management system (phase 2: real sync).
export interface ApiIntegration {
  id: string;
  system: string;                // system name (e.g.: Comdinheiro, internal system)
  baseUrl?: string;
  apiKey?: string;                // masked in the UI
  status: "conectado" | "a configurar" | "erro";
  lastSync?: string;
}

export interface Client {
  id: string;
  name: string;
  type: string;         // Family Office / Individual / Institutional
  profile: "Conservative" | "Moderate" | "Aggressive";
  since: string;        // start month/year
  invested: number;     // BRL
  current: number;      // BRL
  riskNumber: number;   // 0-100
  mandate: number;      // contractual ceiling
  harpianPct: number;   // % allocated to HPC
  alloc: Alloc[];
  note?: string;
  email?: string;
  importedPositions?: ImportedPosition[]; // imported spreadsheet (Import/connect) — legacy, single portfolio
  personalData?: PersonalData;
  accounts?: Account[];
  portfolios?: Portfolio[];
  integrations?: ApiIntegration[];
}

export const CLIENTS: Client[] = [
  // ── João Daniel — Managing Partner / Founder / CIO ──
  // Brazil and USA, 35% in the ETP (HPC). MBA Pittsburgh · floor trader.
  {
    id: "joao-daniel", name: "João Daniel", type: "Partner · Founder / CIO", profile: "Aggressive",
    since: "01/2022", invested: 4_200_000, current: 5_600_000, riskNumber: 58, mandate: 65, harpianPct: 35,
    alloc: [
      { label: "US Stocks", pct: 32 },
      { label: "HPC22 · ETP (Harpian)", pct: 35, tone: "gold" },
      { label: "BR Stocks", pct: 22 },
      { label: "BR Fixed Income", pct: 11 },
    ],
    note: "CIO's model portfolio: Brazil + USA with 35% in the ETP — the largest Harpian allocation among the partners. The defense layer protects the risk core.",
    personalData: { responsavel: "João Daniel — Founder/CIO" },
    accounts: [
      { id: "jd-btg", bank: "BTG Pactual", type: "Corretora", accountNumber: "BTG-JD-0001" },
      { id: "jd-ibkr", bank: "Interactive Brokers", type: "Corretora", accountNumber: "IBKR-JD-USA" },
    ],
    portfolios: [
      {
        id: "jd-br", name: "BR Portfolio · Brazil", accountId: "jd-btg",
        modelLabel: MODELS.P4.label, baseValueUsd: 100000, items: MODELS.P4.items,
        positions: [
          { ticker: "BOVA11.SA", qty: 6000, avgPrice: 130 },
          { ticker: "ITUB4.SA", qty: 20000, avgPrice: 30 },
          { ticker: "PETR4.SA", qty: 10000, avgPrice: 32 },
        ],
      },
      {
        id: "jd-us", name: "US Portfolio · Abroad + ETP", accountId: "jd-ibkr",
        modelLabel: MODELS.P5.label, baseValueUsd: 100000, items: MODELS.P5.items,
        positions: [
          { ticker: "SPY", qty: 2000, avgPrice: 500 },
          { ticker: "QQQ", qty: 800, avgPrice: 480 },
          { ticker: "AAPL", qty: 1500, avgPrice: 200 },
        ],
      },
    ],
  },
  // ── Diogo Scelza — Portfolio Manager ──
  // Only USA, 25% in HPC. Wachovia/Wells Fargo · Bolton · 18+ years · $50M+ AUM.
  {
    id: "diogo", name: "Diogo Scelza", type: "Partner · Portfolio Manager", profile: "Aggressive",
    since: "01/2022", invested: 6_000_000, current: 7_900_000, riskNumber: 66, mandate: 70, harpianPct: 25,
    alloc: [
      { label: "US Stocks", pct: 50 },
      { label: "HPC22 (Harpian)", pct: 25, tone: "gold" },
      { label: "US ETFs", pct: 18 },
      { label: "US Fixed Income", pct: 7 },
    ],
    note: "Portfolio Manager's model portfolio: 100% abroad (USA), 25% in HPC. High-conviction profile with the Harpian defense at its core.",
    personalData: { responsavel: "Diogo Scelza — Portfolio Manager" },
    accounts: [{ id: "ds-ibkr", bank: "Interactive Brokers", type: "Corretora", accountNumber: "IBKR-DS-USA" }],
    portfolios: [
      {
        id: "ds-us", name: "IBKR Portfolio · Abroad Only (USA)", accountId: "ds-ibkr",
        modelLabel: MODELS.P5.label, baseValueUsd: 100000, items: MODELS.P5.items,
        positions: [
          { ticker: "AAPL", qty: 2500, avgPrice: 200 },
          { ticker: "MSFT", qty: 1500, avgPrice: 380 },
          { ticker: "NVDA", qty: 800, avgPrice: 150 },
          { ticker: "SPY", qty: 2000, avgPrice: 500 },
        ],
      },
    ],
  },
  // ── Johnny Zighelboim — Quant Data Architecture ──
  // Only USA, 30% in HPC. Morgan Stanley · Bolton · MSM · 31+ years wealth mgmt.
  {
    id: "johnny", name: "Johnny Zighelboim", type: "Partner · Quant Data Architecture", profile: "Aggressive",
    since: "01/2022", invested: 8_500_000, current: 11_200_000, riskNumber: 62, mandate: 70, harpianPct: 30,
    alloc: [
      { label: "US Stocks", pct: 44 },
      { label: "HPC22 (Harpian)", pct: 30, tone: "gold" },
      { label: "US ETFs", pct: 20 },
      { label: "US Fixed Income", pct: 6 },
    ],
    note: "Quant architecture's model portfolio: 100% abroad (USA), 30% in HPC. 31 years of wealth management with the Harpian systematic layer.",
    personalData: { responsavel: "Johnny Zighelboim — Quant Data Architecture" },
    accounts: [{ id: "jz-ms", bank: "Morgan Stanley", type: "Corretora", accountNumber: "MS-JZ-USA" }],
    portfolios: [
      {
        id: "jz-us", name: "Morgan Stanley Portfolio · USA", accountId: "jz-ms",
        modelLabel: MODELS.P5.label, baseValueUsd: 100000, items: MODELS.P5.items,
        positions: [
          { ticker: "SPY", qty: 4000, avgPrice: 500 },
          { ticker: "MSFT", qty: 2000, avgPrice: 380 },
          { ticker: "GOOGL", qty: 1500, avgPrice: 300 },
          { ticker: "AGG", qty: 3000, avgPrice: 98 },
        ],
      },
    ],
  },
  // ── João Pedro Murad Panizzutti — CTO ──
  // Europe and USA. Carlyle · Millennium · Sage · Data Science.
  {
    id: "joao-pedro", name: "João Pedro Panizzutti", type: "Partner · CTO", profile: "Moderate",
    since: "01/2022", invested: 3_800_000, current: 4_700_000, riskNumber: 55, mandate: 62, harpianPct: 20,
    alloc: [
      { label: "US Stocks", pct: 40 },
      { label: "Europe Stocks", pct: 25 },
      { label: "HPC22 (Harpian)", pct: 20, tone: "gold" },
      { label: "Global Fixed Income", pct: 15 },
    ],
    note: "CTO's model portfolio: Europe + USA, 20% in HPC. Developed-market geographic diversification with the Harpian defense.",
    personalData: { responsavel: "João Pedro Panizzutti — CTO" },
    accounts: [{ id: "jp-ibkr", bank: "Interactive Brokers", type: "Corretora", accountNumber: "IBKR-JP-EU-US" }],
    portfolios: [
      {
        id: "jp-eu-us", name: "IBKR Portfolio · Europe + USA", accountId: "jp-ibkr",
        modelLabel: MODELS.P2.label, baseValueUsd: 100000, items: MODELS.P2.items,
        positions: [
          { ticker: "SPY", qty: 2500, avgPrice: 500 },
          { ticker: "VGK", qty: 5000, avgPrice: 62 },
          { ticker: "IEV", qty: 3000, avgPrice: 55 },
          { ticker: "AGG", qty: 2000, avgPrice: 98 },
        ],
      },
    ],
  },
];

export const clientById = (id: string) => CLIENTS.find((c) => c.id === id) || CLIENTS[0];
export const brl = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

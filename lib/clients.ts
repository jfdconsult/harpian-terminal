// Client roster — starts empty. Populated only when a real client/MFO signs up
// (see lib/clientStore.ts addClient) and uploads their portfolio. No demo/mock
// clients ship in this file.
import type { PortfolioItemDetail } from "./portfolioModels";
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

export const CLIENTS: Client[] = [];

// Placeholder shown wherever a client screen renders with no client selected/
// created yet — prompts the upload instead of crashing on an empty roster.
export const EMPTY_CLIENT: Client = {
  id: "", name: "—", type: "—", profile: "Moderate",
  since: "—", invested: 0, current: 0, riskNumber: 0, mandate: 0, harpianPct: 0,
  alloc: [],
  note: "Suba aqui seu portfólio — comece por você mesmo a analisar seu risco x retorno.",
};

export const clientById = (id: string) => CLIENTS.find((c) => c.id === id) || EMPTY_CLIENT;
export const brl = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

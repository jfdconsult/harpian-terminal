"use client";
// Client store with local persistence (localStorage). Merges the seed (lib/clients.ts)
// with the clients added by the manager — survives a refresh. Phase 2: swap for the
// MFO's management system API. Until then, this makes "add client" actually work.
import { CLIENTS, type Client, type Alloc, type ImportedPosition, type Portfolio } from "./clients";

const KEY = "harpian_clients_added";
const OVERRIDE_KEY = "harpian_client_overrides";

function loadAdded(): Client[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function saveAdded(list: Client[]) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(list));
}

// Partial per-client overrides (e.g. portfolio imported via spreadsheet) — applied
// on top of the seed/added clients, without needing to rewrite the whole client.
function loadOverrides(): Record<string, Partial<Client>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = JSON.parse(localStorage.getItem(OVERRIDE_KEY) || "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

function saveOverrides(o: Record<string, Partial<Client>>) {
  if (typeof window !== "undefined") localStorage.setItem(OVERRIDE_KEY, JSON.stringify(o));
}

/** All clients: seed + added, with overrides (e.g. import) applied. */
export function allClients(): Client[] {
  const overrides = loadOverrides();
  return [...CLIENTS, ...loadAdded()].map((c) => (overrides[c.id] ? { ...c, ...overrides[c.id] } : c));
}

/** Finds by id across the whole base (seed + added + overrides). */
export function findClient(id: string): Client {
  return allClients().find((c) => c.id === id) || CLIENTS[0];
}

/** Applies an imported spreadsheet (positions) to the client: recalculates the current
 * value as the sum of qty×average price, stores the raw positions, and — if the Risk
 * Number was computed (Nitrogen/HRIE methodology, via /api/risk-number) — writes it too.
 * Before, riskNumber stayed untouched on import; now it reflects the real portfolio.
 * Persists as an override — survives a refresh without duplicating the client. */
export function applyImportedPortfolio(clientId: string, positions: ImportedPosition[], riskNumber?: number): Client {
  const total = positions.reduce((s, p) => s + p.qty * p.avgPrice, 0);
  const overrides = loadOverrides();
  const patch: Partial<Client> = { current: total, importedPositions: positions };
  if (riskNumber != null && riskNumber >= 1 && riskNumber <= 99) patch.riskNumber = riskNumber;
  overrides[clientId] = { ...(overrides[clientId] || {}), ...patch };
  saveOverrides(overrides);
  return findClient(clientId);
}

/** Updates any client field (profile, personal data, accounts, portfolios,
 * API integrations) — merges as an override. Works for both seed clients
 * and ones added by the manager: same path as applyImportedPortfolio. */
export function updateClient(id: string, patch: Partial<Client>): Client {
  const overrides = loadOverrides();
  overrides[id] = { ...(overrides[id] || {}), ...patch };
  saveOverrides(overrides);
  return findClient(id);
}

/** Sums the value of all of the client's portfolios (qty × average price of each position). */
export function portfoliosTotal(portfolios: Portfolio[]): number {
  return portfolios.reduce((s, p) => s + p.positions.reduce((s2, x) => s2 + x.qty * x.avgPrice, 0), 0);
}

const RISK_DEFAULT: Record<Client["profile"], number> = { Conservative: 35, Moderate: 55, Aggressive: 70 };

export interface NewClientInput {
  name: string;
  type: string;
  profile: Client["profile"];
  invested: number;   // BRL
  mandate: number;    // teto contratual (0–100)
  email?: string;
}

function slug(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 24);
}

/** Creates a new client (persists) and returns it. Portfolio starts 100% outside
 * Harpian (migration opportunity) — the profile sets the initial Risk Number. */
export function addClient(data: NewClientInput): Client {
  const added = loadAdded();
  const id = `${slug(data.name) || "client"}-${Date.now().toString(36).slice(-4)}`;
  const alloc: Alloc[] = [
    { label: "BR fixed income", pct: 55 },
    { label: "BR equities", pct: 25 },
    { label: "Multi-strategy", pct: 20 },
    { label: "HPC (Harpian)", pct: 0, tone: "r" },
  ];
  const client: Client = {
    id,
    name: data.name,
    type: data.type,
    profile: data.profile,
    since: new Date().toLocaleDateString("en-US", { month: "2-digit", year: "numeric" }),
    invested: data.invested,
    current: data.invested,
    riskNumber: RISK_DEFAULT[data.profile],
    mandate: data.mandate,
    harpianPct: 0,
    alloc,
    note: "New client — portfolio still outside Harpian. Send the risk profile questionnaire and evaluate migration to the HPC.",
  };
  saveAdded([...added, client]);
  return client;
}

/** Removes an added client (does not touch the seed). */
export function removeClient(id: string) {
  saveAdded(loadAdded().filter((c) => c.id !== id));
}

/** Investor risk-profile questionnaire link to send to the client. */
export function questionnaireLink(id: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/questionario/${id}`;
}

"use client";
// Store de clientes com persistência local (localStorage). Junta o seed (lib/clients.ts)
// com os clientes adicionados pelo gestor — sobrevive ao refresh. Fase 2: trocar por API
// do sistema gerencial do MFO. Até lá, isto deixa "adicionar cliente" funcional de verdade.
import { CLIENTS, type Client, type Alloc } from "./clients";

const KEY = "harpian_clients_added";

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

/** Todos os clientes: seed + adicionados. */
export function allClients(): Client[] {
  return [...CLIENTS, ...loadAdded()];
}

/** Acha por id em toda a base (seed + adicionados). */
export function findClient(id: string): Client {
  return allClients().find((c) => c.id === id) || CLIENTS[0];
}

const RISK_DEFAULT: Record<Client["profile"], number> = { Conservador: 35, Moderado: 55, Agressivo: 70 };

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

/** Cria um cliente novo (persiste) e o devolve. Carteira nasce 100% fora da Harpian
 * (oportunidade de migração) — o perfil define o Número de Risco inicial. */
export function addClient(data: NewClientInput): Client {
  const added = loadAdded();
  const id = `${slug(data.name) || "cliente"}-${Date.now().toString(36).slice(-4)}`;
  const alloc: Alloc[] = [
    { label: "Renda fixa BR", pct: 55 },
    { label: "Ações BR", pct: 25 },
    { label: "Multimercado", pct: 20 },
    { label: "HPC (Harpian)", pct: 0, tone: "r" },
  ];
  const client: Client = {
    id,
    name: data.name,
    type: data.type,
    profile: data.profile,
    since: new Date().toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" }),
    invested: data.invested,
    current: data.invested,
    riskNumber: RISK_DEFAULT[data.profile],
    mandate: data.mandate,
    harpianPct: 0,
    alloc,
    note: "Cliente novo — carteira ainda fora da Harpian. Enviar o questionário de perfil e avaliar migração para o HPC.",
  };
  saveAdded([...added, client]);
  return client;
}

/** Remove um cliente adicionado (não mexe no seed). */
export function removeClient(id: string) {
  saveAdded(loadAdded().filter((c) => c.id !== id));
}

/** Link do questionário de perfil de investidor pra mandar pro cliente. */
export function questionnaireLink(id: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/questionario/${id}`;
}

// Constantes dos 4 níveis de risco (Número de Risco 0–100) — compartilhadas entre
// a tela Risco.tsx e o módulo de painel RiscoCliente, pra nunca divergir os números.
import type { Client } from "./clients";

export const HPC22_RN = 38; // Número de Risco do produto (motor interno)
export const HPC11_RN = 34;

// Tolerância e objetivo derivam do perfil do cliente (questionário).
export const TOLERANCE: Record<Client["profile"], number> = { Conservador: 40, Moderado: 62, Agressivo: 80 };
export const OBJETIVO: Record<Client["profile"], string> = {
  Conservador: "Preservação", Moderado: "Equilíbrio", Agressivo: "Crescimento",
};

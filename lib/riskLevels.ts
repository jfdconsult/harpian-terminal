// Constants for the 4 risk levels (Risk Number 0-100) — shared between the
// Risco.tsx screen and the RiscoCliente panel module, so the numbers never diverge.
import type { Client } from "./clients";

export const HPC22_RN = 38; // Product Risk Number (internal engine)
export const HPC11_RN = 34;
export const LCORE22_RN = 36;

// Tolerance and objective are derived from the client's profile (questionnaire).
export const TOLERANCE: Record<Client["profile"], number> = { Conservative: 40, Moderate: 62, Aggressive: 80 };
export const OBJETIVO: Record<Client["profile"], string> = {
  Conservative: "Preservation", Moderate: "Balance", Aggressive: "Growth",
};

// Client for the client-safe XRI feed (GET /api/xri).
// The confidentiality filter happens on the server (app/api/xri/route.ts);
// only the result and posture arrive here — never turbulence/absorption/DY/weights.

export interface XriDriver {
  country: string;
  pct: number;
}
export interface XriChannel {
  key: string;
  label: string;   // ingredient name (e.g.: "Structural fragility")
  explain: string; // 1 sentence describing it, no formula
  share: number;   // % of today's score
}
export interface XriValidation {
  years: number;
  events_covered: number;
  events_hit: number;
}
export interface XriView {
  ok: boolean;
  offline?: boolean;
  as_of?: string;
  score?: number;
  state?: string;
  direction?: string;
  confidence_pct?: number;
  drivers?: XriDriver[];
  channels?: XriChannel[];              // named ingredients (not the formula)
  transmission?: "aberto" | "fechado" | null;
  validation?: XriValidation | null;
}

export const XRI_STATE_COLOR: Record<string, string> = {
  BAIXO: "#2ECC71",
  MODERADO: "#F39C12",
  ELEVADO: "#E67E22",
  CRÍTICO: "#E74C3C",
};

export async function fetchXri(): Promise<XriView> {
  try {
    const r = await fetch("/api/xri", { cache: "no-store" });
    return (await r.json()) as XriView;
  } catch {
    return { ok: false, offline: true };
  }
}

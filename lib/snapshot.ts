// Cliente do feed cliente-safe do overnight (GET /api/snapshot).
// O filtro de confidencialidade acontece no servidor (app/api/snapshot/route.ts);
// aqui só chega o "quê". Nunca há CRS/temperatura/fórmula neste tipo.

export type RegimeState = "BULL" | "CAUTELA" | "BEAR" | "NEUTRO";

export interface Holding {
  ticker: string;
  weight_pct: number;
  name: string;
}

export interface ProfileView {
  pct_acoes: number;
  pct_etfs: number;
  n_holdings: number;
  top_holdings: Holding[];
}

export interface Snapshot {
  ok: boolean;
  offline?: boolean;
  as_of?: string;
  generated_at?: string;
  source_file?: string;
  regime?: { state: RegimeState };
  defense?: { label: string; holdings: Holding[] };
  profiles?: Partial<Record<"CONSERVATIVE" | "BALANCE" | "ADVANCE", ProfileView>>;
}

export const PROFILE_LABEL: Record<string, string> = {
  CONSERVATIVE: "Conservador",
  BALANCE: "Balanceado",
  ADVANCE: "Avançado",
};

export async function fetchSnapshot(): Promise<Snapshot> {
  try {
    const r = await fetch("/api/snapshot", { cache: "no-store" });
    return (await r.json()) as Snapshot;
  } catch (e) {
    return { ok: false, offline: true };
  }
}

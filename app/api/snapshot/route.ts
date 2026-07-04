import { NextResponse } from "next/server";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Pasta de saída do overnight_run.py (sistema HC-US IG). Configurável por env.
const SNAP_DIR =
  process.env.HARPIAN_SNAPSHOT_DIR ||
  "C:\\dev\\HARPIAN\\01_HOMOLOGADO\\_SISTEMA_HC-US_IG\\overnight\\output";

// ── CONFIDENCIALIDADE ──────────────────────────────────────────────────────
// Este handler roda no SERVIDOR. Ele é o filtro: só o "quê" (regime, postura,
// posições, perfis) chega ao navegador do cliente MFO. O "como" — CRS, thresholds,
// temperaturas dos pilares, breadth, cross-corr, fórmulas dos motores, lane_rocs,
// step_attack_fraction, w_hc — NUNCA sai daqui. É whitelist, não blacklist.

type Holding = { ticker: string; weight_pct: number; name: string };

// regime interno → estado cliente-safe (rótulo, jamais o mecanismo)
function mapRegime(raw: string): "BULL" | "CAUTELA" | "BEAR" | "NEUTRO" {
  const s = (raw || "").toUpperCase();
  if (s.startsWith("RISK-ON")) return "BULL";
  if (s.startsWith("RISK-OFF")) return "BEAR";
  if (s.startsWith("WARNING")) return "CAUTELA";
  return "NEUTRO";
}

function latestSnapshot(): { file: string; data: Record<string, unknown> } {
  const files = readdirSync(SNAP_DIR).filter(
    (f) => f.startsWith("snapshot_") && f.endsWith(".json")
  );
  if (!files.length) throw new Error("nenhum snapshot na pasta de saída");
  files.sort(); // snapshot_YYYYMMDD_HHMM → ordem lexicográfica = cronológica
  const file = files[files.length - 1];
  const data = JSON.parse(readFileSync(join(SNAP_DIR, file), "utf-8"));
  return { file, data };
}

// GET /api/snapshot → visão cliente-safe do último snapshot do overnight
export async function GET() {
  try {
    const { file, data } = latestSnapshot();

    // dicionário ticker→nome, montado a partir do que já vem no snapshot
    const nameOf: Record<string, string> = {};
    const motorA = (data.motor_a || {}) as { ranking?: { ticker: string; name: string }[] };
    for (const r of motorA.ranking || []) nameOf[r.ticker] = r.name;
    const motorB = (data.motor_b || {}) as { sleeves?: Record<string, { picks?: { ticker: string; name: string }[] }> };
    for (const sleeve of Object.values(motorB.sleeves || {}))
      for (const p of sleeve.picks || []) nameOf[p.ticker] = p.name;

    const named = (h: { ticker: string; weight_pct: number }): Holding => ({
      ticker: h.ticker,
      weight_pct: h.weight_pct,
      name: nameOf[h.ticker] || "",
    });

    // Perfis: só o split ações/ETFs, nº de posições e top holdings (sem sinais/scores)
    const rawProfiles = (data.profiles || {}) as Record<
      string,
      { w_motor_a: number; w_motor_b: number; n_holdings: number; top_holdings?: { ticker: string; weight_pct: number }[] }
    >;
    const profiles: Record<string, unknown> = {};
    for (const key of ["CONSERVATIVE", "BALANCE", "ADVANCE"]) {
      const p = rawProfiles[key];
      if (!p) continue;
      profiles[key] = {
        pct_acoes: Math.round((p.w_motor_a || 0) * 100),
        pct_etfs: Math.round((p.w_motor_b || 0) * 100),
        n_holdings: p.n_holdings,
        top_holdings: (p.top_holdings || []).slice(0, 12).map(named),
      };
    }

    const pilarD = (data.pilar_d || {}) as { winner_label?: string; holdings?: { ticker: string; weight_pct: number }[] };

    return NextResponse.json({
      as_of: data.as_of,
      generated_at: data.generated_at,
      source_file: file,
      regime: { state: mapRegime(String(data.regime && (data.regime as Record<string, unknown>).regime)) },
      defense: {
        // rótulo humano, sem o código interno da lane (ex.: "D2 HEALTH + STAPLES" → "HEALTH + STAPLES")
        label: (pilarD.winner_label || "").replace(/^D\d+\s+/, ""),
        holdings: (pilarD.holdings || []).map(named),
      },
      profiles,
      ok: true,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, offline: true, error: String(e) }, { status: 200 });
  }
}

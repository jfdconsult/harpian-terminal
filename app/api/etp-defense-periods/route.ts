import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Historical defense periods for CORE22+ (mock) ────────────────────────────
// Períodos em que o sistema esteve com a camada de defesa ARMADA. Historical +
// fixo (não muda com quem consulta). Datas em ISO YYYY-MM-DD.
//
// Ganchos futuros: quando o backtest oficial exportar as datas reais de switch,
// trocar este array por leitura de arquivo/DB. A shape do payload permanece.

interface DefensePeriod {
  start: string;
  end: string;
  label: string;
  severity: "major" | "moderate" | "minor";
}

const DEFENSE_PERIODS: DefensePeriod[] = [
  // ── Major crises ─────────────────────────────────────────────
  { start: "2000-04-01", end: "2002-10-10", label: "Dot-com bust",         severity: "major" },
  { start: "2007-11-01", end: "2009-06-01", label: "Global Financial Crisis", severity: "major" },
  { start: "2020-02-24", end: "2020-05-15", label: "COVID crash",          severity: "major" },
  { start: "2022-01-10", end: "2022-10-20", label: "2022 bear market",     severity: "major" },

  // ── Moderate defense windows ─────────────────────────────────
  { start: "2011-08-01", end: "2011-11-30", label: "Eurozone debt / US downgrade", severity: "moderate" },
  { start: "2015-08-15", end: "2016-02-15", label: "China devaluation / oil crash", severity: "moderate" },
  { start: "2018-10-01", end: "2019-01-05", label: "Q4/18 selloff",        severity: "moderate" },

  // ── Minor tactical defenses ──────────────────────────────────
  { start: "2010-05-06", end: "2010-07-05", label: "Flash crash / EU concerns", severity: "minor" },
  { start: "2023-08-01", end: "2023-10-27", label: "Rate-scare pullback", severity: "minor" },
];

export async function GET() {
  const res = NextResponse.json({
    ok: true,
    protocol: {
      note: "Periods when CORE22+ had its defense layer ARMED (reduced equity exposure + defensive rotation into GLD/Treasuries/Staples). Historical, fixed — same across all users.",
    },
    periods: DEFENSE_PERIODS,
  });
  res.headers.set("Cache-Control", "public, max-age=3600");
  return res;
}

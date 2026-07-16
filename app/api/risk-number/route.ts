import { NextRequest, NextResponse } from "next/server";
import { yahooChart, dailyReturns } from "@/lib/yahoo";
import { downsideDeviation, portfolioRiskNumber } from "@/lib/risk-number";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// RISK NUMBER for an imported portfolio — Nitrogen/HRIE methodology.
// ------------------------------------------------------------
// POST body: { positions: [{ ticker, marketValue }] }  (weight = mv / Σ mv)
//   or { positions: [{ ticker, weight }] } with already-normalized weights.
//
// For each ticker: fetches 3 years of history (same hqp/Yahoo path as the
// rest of the app), computes the annual downside deviation, and maps it
// through the model. Portfolio: conservative weighted average. Tickers
// without history go into "coverage" so the advisor knows how much of the
// portfolio wasn't evaluated.
// ============================================================

interface InPos { ticker: string; marketValue?: number; weight?: number }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const positions: InPos[] = Array.isArray(body.positions) ? body.positions : [];
    if (!positions.length) {
      return NextResponse.json({ ok: false, error: "no positions" }, { status: 400 });
    }

    // weights: use weight if provided; otherwise derive from marketValue
    const totalMV = positions.reduce((s, p) => s + (p.marketValue || 0), 0);
    const weighted = positions.map((p) => ({
      ticker: (p.ticker || "").toUpperCase().trim(),
      weight: p.weight != null ? p.weight : totalMV > 0 ? (p.marketValue || 0) / totalMV : 1 / positions.length,
    })).filter((p) => p.ticker);

    // history + downside per ticker (3 years daily)
    const withDownside = await Promise.all(
      weighted.map(async (p) => {
        try {
          const { series } = await yahooChart(p.ticker, "3y", "1d");
          const closes = (series.close || []).filter((c: number | null): c is number => c != null);
          const rets = dailyReturns(closes);
          const dd = downsideDeviation(rets);
          return { ticker: p.ticker, weight: p.weight, downsideAnnual: dd };
        } catch {
          return { ticker: p.ticker, weight: p.weight, downsideAnnual: null };
        }
      }),
    );

    const port = portfolioRiskNumber(withDownside);
    if (!port) {
      return NextResponse.json({ ok: false, error: "no ticker with sufficient history" }, { status: 200 });
    }

    const missing = withDownside.filter((p) => p.downsideAnnual == null).map((p) => p.ticker);

    return NextResponse.json({
      ok: true,
      riskNumber: port.riskNumber,
      loss95_6m_pct: +port.loss95_6m_pct.toFixed(1),
      coverage_pct: Math.round(port.coverage * 100),
      missing,
      positions: port.positions.map((p) => ({
        ticker: p.ticker,
        weight_pct: Math.round(p.weight * 100),
        riskNumber: p.riskNumber,
      })).sort((a, b) => b.riskNumber - a.riskNumber),
      method: port.method,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}

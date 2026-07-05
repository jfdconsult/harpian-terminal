import { NextRequest, NextResponse } from "next/server";
import { loadCore22Nav } from "@/lib/core22";
import { CLIENTS } from "@/lib/clients";
import { findClient } from "@/lib/clientStore";

export const dynamic = "force-dynamic";

const SINCE_YEAR: Record<string, number> = { "2016": 2016, "2006": 2006, "2000": 2000 };
const RF_ANNUAL = 0.018; // taxa livre de risco usada como piso do "seu dólar" (mesma referência da apresentação)

// Retorno USD ponderado do cliente (soma de todos os portfólios com detalhamento real).
function clientBlendedReturn(clientId: string): number | null {
  const client = CLIENTS.find((c) => c.id === clientId) || findClient(clientId);
  if (!client?.portfolios?.length) return null;
  let sumVal = 0, sumRet = 0;
  for (const p of client.portfolios) {
    for (const it of p.items || []) {
      if (it.retornoUsdPct == null) continue;
      sumVal += it.valorUsd;
      sumRet += it.retornoUsdPct * it.valorUsd;
    }
  }
  return sumVal > 0 ? sumRet / sumVal : null;
}

// GET /api/portfolio-growth?clientId=vera&period=5y
// 3 séries em dólar, base $10.000: Cliente (blend real+riskfree calibrado ao retorno dele),
// S&P 500 (real, backtest) e CORE22+/HPC22 (real, backtest). Nunca fabrica — quando o cliente
// não tem retorno estimado (sem portfólio detalhado), devolve só S&P e CORE22+.
export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period") || "5y";
  const clientId = req.nextUrl.searchParams.get("clientId") || "";
  try {
    const { t, core, spx } = loadCore22Nav();
    const lastTs = t[t.length - 1];
    let startIdx = 0;
    if (period === "ytd") {
      const yr = new Date(lastTs * 1000).getUTCFullYear();
      startIdx = t.findIndex((ts) => new Date(ts * 1000).getUTCFullYear() === yr);
    } else if (period === "1y") {
      startIdx = t.findIndex((ts) => ts >= lastTs - 365 * 86400);
    } else if (period === "5y") {
      startIdx = t.findIndex((ts) => ts >= lastTs - 5 * 365 * 86400);
    } else {
      const yr = SINCE_YEAR[period] || 2010;
      startIdx = t.findIndex((ts) => new Date(ts * 1000).getUTCFullYear() >= yr);
    }
    if (startIdx < 0) startIdx = 0;

    const years = (lastTs - t[startIdx]) / (365.25 * 86400);
    const rebase = (arr: number[]) => {
      const base = arr[startIdx] || 1;
      return arr.slice(startIdx).map((v) => (v / base) * 10000);
    };
    const spxSeries = rebase(spx);
    const coreSeries = rebase(core);
    const tSeries = t.slice(startIdx);

    const spyTotalReturn = spxSeries[spxSeries.length - 1] / 10000 - 1;
    const spyAnnual = years > 0 ? Math.pow(1 + spyTotalReturn, 1 / years) - 1 : 0;

    const clientReturn = clientId ? clientBlendedReturn(clientId) : null;
    let clientSeries: number[] | null = null;
    let eqFrac: number | null = null;
    if (clientReturn != null) {
      eqFrac = Math.max(0, Math.min(1, (clientReturn - RF_ANNUAL) / ((spyAnnual || 0.001) - RF_ANNUAL)));
      clientSeries = tSeries.map((ts, i) => {
        const yrsElapsed = (ts - tSeries[0]) / (365.25 * 86400);
        const rf = 10000 * Math.pow(1 + RF_ANNUAL, yrsElapsed);
        return (1 - eqFrac!) * rf + eqFrac! * spxSeries[i];
      });
    }

    const seriesOf = (arr: number[]) => tSeries.map((ts, i) => ({ time: ts, value: +arr[i].toFixed(0) }));
    // Retorno/drawdown em pontos percentuais (ex.: 162.5, não 1.625) — mesma convenção do
    // /api/fund-benchmarks, que o front (helper pct()) já espera.
    const totalRet = (arr: number[]) => (arr[arr.length - 1] / 10000 - 1) * 100;
    const maxDD = (arr: number[]) => {
      let peak = arr[0], mdd = 0;
      for (const v of arr) { if (v > peak) peak = v; const d = v / peak - 1; if (d < mdd) mdd = d; }
      return mdd * 100;
    };

    return NextResponse.json({
      ok: true,
      period, years: +years.toFixed(1),
      spx: seriesOf(spxSeries), core: seriesOf(coreSeries),
      client: clientSeries ? seriesOf(clientSeries) : null,
      meta: {
        spxReturn: totalRet(spxSeries), coreReturn: totalRet(coreSeries),
        clientReturn: clientSeries ? totalRet(clientSeries) : null,
        spxMaxDD: maxDD(spxSeries), coreMaxDD: maxDD(coreSeries),
        clientMaxDD: clientSeries ? maxDD(clientSeries) : null,
        clientAnnualReturnEst: clientReturn, eqFrac,
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

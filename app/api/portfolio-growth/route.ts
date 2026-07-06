import { NextRequest, NextResponse } from "next/server";
import { loadCore22Nav } from "@/lib/core22";
import { CLIENTS } from "@/lib/clients";
import { findClient } from "@/lib/clientStore";

export const dynamic = "force-dynamic";

const SINCE_YEAR: Record<string, number> = { "2016": 2016, "2006": 2006, "2000": 2000 };
const RF_ANNUAL = 0.018; // taxa livre de risco usada como piso do "seu dólar" (mesma referência da apresentação)

// "MM/YYYY" (formato do campo Client.since) -> unix seconds do dia 1 daquele mês.
function parseSince(since?: string): number | null {
  if (!since) return null;
  const m = since.match(/^(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  return Math.floor(Date.UTC(parseInt(m[2], 10), parseInt(m[1], 10) - 1, 1) / 1000);
}

// Retorno USD ponderado do cliente (só produtos com retorno cadastrado) + cobertura real
// (quanto do valor total do portfólio está de fato coberto por esse retorno, vs produtos
// sem retorno cadastrado ainda) — pra deixar claro que a linha é dado real, não 100% estimado.
function clientBlendedReturn(clientId: string): { ret: number; coveragePct: number } | null {
  const client = CLIENTS.find((c) => c.id === clientId) || findClient(clientId);
  if (!client?.portfolios?.length) return null;
  let sumVal = 0, sumRet = 0, totalVal = 0;
  for (const p of client.portfolios) {
    for (const it of p.items || []) {
      totalVal += it.valorUsd;
      if (it.retornoUsdPct == null) continue;
      sumVal += it.valorUsd;
      sumRet += it.retornoUsdPct * it.valorUsd;
    }
  }
  if (sumVal <= 0) return null;
  return { ret: sumRet / sumVal, coveragePct: totalVal > 0 ? (sumVal / totalVal) * 100 : 0 };
}

// GET /api/portfolio-growth?clientId=vera&period=5y|1y|ytd|2016|2006|2000
// 3 séries em dólar, base $10.000: Cliente (real: só existe a partir da data de entrada
// dele — Client.since — antes disso é "sem investimento" e a linha some/fica cinza no
// front), S&P 500 (real, backtest) e CORE22+/HPC22 (real, backtest). Nunca fabrica —
// quando o cliente não tem retorno estimado (sem portfólio detalhado), devolve só S&P/CORE22+.
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

    const tSeries = t.slice(startIdx);
    const rebaseFrom = (arr: number[], idx: number) => {
      const base = arr[idx] || 1;
      return arr.slice(idx).map((v) => (v / base) * 10000);
    };
    const spxSeries = rebaseFrom(spx, startIdx);
    const coreSeries = rebaseFrom(core, startIdx);

    const seriesOf = (ts: number[], arr: number[]) => ts.map((tm, i) => ({ time: tm, value: +arr[i].toFixed(0) }));
    // Retorno/drawdown em pontos percentuais (ex.: 162.5, não 1.625) — mesma convenção do
    // /api/fund-benchmarks, que o front (helper pct()) já espera.
    const totalRet = (arr: number[]) => (arr[arr.length - 1] / arr[0] - 1) * 100;
    const maxDD = (arr: number[]) => {
      let peak = arr[0], mdd = 0;
      for (const v of arr) { if (v > peak) peak = v; const d = v / peak - 1; if (d < mdd) mdd = d; }
      return mdd * 100;
    };

    const client = clientId ? (CLIENTS.find((c) => c.id === clientId) || findClient(clientId)) : null;
    const blended = clientId ? clientBlendedReturn(clientId) : null;

    let clientBefore: { time: number; value: number }[] | null = null;
    let clientAfter: { time: number; value: number }[] | null = null;
    let investedSince: string | null = null;
    let coveragePct: number | null = null;
    let eqFrac: number | null = null;

    if (blended && client) {
      investedSince = client.since || null;
      coveragePct = blended.coveragePct;
      const investedTs = parseSince(client.since);
      let investedIdxFull = investedTs != null ? t.findIndex((ts) => ts >= investedTs) : 0;
      if (investedIdxFull < 0) investedIdxFull = t.length - 1;

      const investedIdxInWindow = investedIdxFull - startIdx;

      // Caminho real (verde) sempre calibrado a partir da DATA REAL de entrada do cliente
      // (não do início arbitrário do período escolhido) — preserva o formato real das
      // crises vividas desde que ele investe de verdade.
      const greenBaseIdx = Math.max(investedIdxFull, 0);
      const spxSinceEntry = rebaseFrom(spx, greenBaseIdx);
      const tSinceEntry = t.slice(greenBaseIdx);
      const spyTotalReturnSinceEntry = spxSinceEntry[spxSinceEntry.length - 1] / 10000 - 1;
      const yearsSinceEntry = (lastTs - t[greenBaseIdx]) / (365.25 * 86400);
      const spyAnnualSinceEntry = yearsSinceEntry > 0 ? Math.pow(1 + spyTotalReturnSinceEntry, 1 / yearsSinceEntry) - 1 : 0;
      eqFrac = Math.max(0, Math.min(1, (blended.ret - RF_ANNUAL) / ((spyAnnualSinceEntry || 0.001) - RF_ANNUAL)));
      const fullGreenPath = tSinceEntry.map((ts, i) => {
        const yrsElapsed = (ts - tSinceEntry[0]) / (365.25 * 86400);
        const rf = 10000 * Math.pow(1 + RF_ANNUAL, yrsElapsed);
        return (1 - eqFrac!) * rf + eqFrac! * spxSinceEntry[i];
      });

      if (investedIdxInWindow > 0 && investedIdxInWindow < tSeries.length) {
        // Cliente entrou DENTRO da janela exibida: cinza (sem investimento) antes, verde depois.
        clientBefore = tSeries.slice(0, investedIdxInWindow + 1).map((tm) => ({ time: tm, value: 10000 }));
        clientAfter = fullGreenPath.slice(0, tSeries.length - investedIdxInWindow).map((v, i) => ({ time: tSeries[investedIdxInWindow + i], value: +v.toFixed(0) }));
      } else if (investedIdxInWindow <= 0) {
        // Cliente já estava investido antes do início da janela: sem cinza, só o trecho
        // do caminho verde que cai dentro da janela exibida.
        const offset = startIdx - greenBaseIdx;
        clientAfter = fullGreenPath.slice(offset).map((v, i) => ({ time: tSeries[i], value: +v.toFixed(0) }));
      } else {
        // Entrada cai depois do fim da janela (não deveria ocorrer, since sempre no passado).
        clientBefore = tSeries.map((tm) => ({ time: tm, value: 10000 }));
      }
    }

    return NextResponse.json({
      ok: true,
      period, years: +((lastTs - t[startIdx]) / (365.25 * 86400)).toFixed(1),
      spx: seriesOf(tSeries, spxSeries), core: seriesOf(tSeries, coreSeries),
      clientBefore, clientAfter,
      meta: {
        spxReturn: totalRet(spxSeries), coreReturn: totalRet(coreSeries),
        clientReturn: clientAfter && clientAfter.length ? totalRet(clientAfter.map((p) => p.value)) : null,
        spxMaxDD: maxDD(spxSeries), coreMaxDD: maxDD(coreSeries),
        clientMaxDD: clientAfter && clientAfter.length ? maxDD(clientAfter.map((p) => p.value)) : null,
        clientAnnualReturnEst: blended?.ret ?? null, eqFrac,
        investedSince, coveragePct,
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

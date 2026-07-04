import { NextResponse } from "next/server";
import { loadCore22Nav, alignedNasdaq } from "@/lib/core22";
import { ulcerIndex, sortino, sharpe, maxDrawdownPct, cagrPct, negativeYears } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

interface Metrics {
  cagrPct: number | null;
  maxDrawdownPct: number | null;
  ulcerIndex: number | null;
  sharpe: number | null;
  sortino: number | null;
  negativeYears: number;
}

function fullPeriodMetrics(t: number[], close: number[]): Metrics {
  const years = (t[t.length - 1] - t[0]) / (365.25 * 86400);
  return {
    cagrPct: cagrPct(close, years),
    maxDrawdownPct: maxDrawdownPct(close),
    ulcerIndex: ulcerIndex(close),
    sharpe: sharpe(close),
    sortino: sortino(close),
    negativeYears: negativeYears(t, close),
  };
}

interface CrisisWindow { key: string; label: string; start: string; end: string }
const CRISES: CrisisWindow[] = [
  { key: "dotcom", label: "Bolha ponto-com (pico 2000)", start: "2000-01-01", end: "2003-12-31" },
  { key: "gfc", label: "Crise financeira (pico 2007)", start: "2007-01-01", end: "2009-12-31" },
  { key: "covid", label: "COVID (fev. 2020)", start: "2020-01-01", end: "2020-06-30" },
  { key: "bear2022", label: "Bear market 2022", start: "2022-01-01", end: "2022-12-31" },
];

interface CrisisResult { declinePct: number | null; recoveryMonths: number | null }

function findWindow(t: number[], startISO: string, endISO: string): [number, number] {
  const startTs = Math.floor(new Date(startISO + "T00:00:00Z").getTime() / 1000);
  const endTs = Math.floor(new Date(endISO + "T00:00:00Z").getTime() / 1000);
  const ws = t.findIndex((ts) => ts >= startTs);
  let we = t.length - 1;
  for (let i = t.length - 1; i >= 0; i--) if (t[i] <= endTs) { we = i; break; }
  return [ws, we];
}

// Ancorado no pico do S&P (referência de "quando o mercado topou"): todas as séries
// (CORE22+, S&P, Nasdaq) medem sua própria queda/recuperação A PARTIR DA MESMA DATA —
// senão uma estratégia que diverge do mercado (é o ponto de ter alpha) acharia seu
// próprio pico/vale idiossincrático, incomparável ao "durante esta crise" pretendido.
function crisisMetrics(t: number[], close: number[], anchorIdx: number, windowEndIdx: number): CrisisResult {
  if (anchorIdx < 0 || windowEndIdx <= anchorIdx) return { declinePct: null, recoveryMonths: null };
  const peak = close[anchorIdx];
  let troughIdx = anchorIdx;
  for (let i = anchorIdx; i <= windowEndIdx; i++) if (close[i] < close[troughIdx]) troughIdx = i;
  if (troughIdx === anchorIdx) return { declinePct: null, recoveryMonths: null };

  const trough = close[troughIdx];
  const declinePct = (trough / peak - 1) * 100;

  let recoveryMonths: number | null = null;
  for (let i = troughIdx; i < close.length; i++) {
    if (close[i] >= peak) {
      recoveryMonths = (t[i] - t[troughIdx]) / (30.44 * 86400);
      break;
    }
  }
  return { declinePct: +declinePct.toFixed(1), recoveryMonths: recoveryMonths != null ? +recoveryMonths.toFixed(1) : null };
}

export async function GET() {
  try {
    const { t, core, spx } = loadCore22Nav();
    const nasdaq = await alignedNasdaq(t);

    const full = {
      core: fullPeriodMetrics(t, core),
      spx: fullPeriodMetrics(t, spx),
      nasdaq: nasdaq ? fullPeriodMetrics(t, nasdaq) : null,
    };

    const crises = CRISES.map((c) => {
      const [ws, we] = findWindow(t, c.start, c.end);
      // pico do S&P dentro da janela = a data-âncora de "quando o mercado topou"
      let anchorIdx = ws;
      if (ws >= 0 && we > ws) for (let i = ws; i <= we; i++) if (spx[i] > spx[anchorIdx]) anchorIdx = i;
      return {
        key: c.key,
        label: c.label,
        core: crisisMetrics(t, core, anchorIdx, we),
        spx: crisisMetrics(t, spx, anchorIdx, we),
        nasdaq: nasdaq ? crisisMetrics(t, nasdaq, anchorIdx, we) : null,
      };
    });

    return NextResponse.json({
      ok: true,
      asOf: new Date(t[t.length - 1] * 1000).toISOString().slice(0, 10),
      years: +((t[t.length - 1] - t[0]) / (365.25 * 86400)).toFixed(1),
      full,
      crises,
      nasdaqAvailable: !!nasdaq,
      note: "CORE22+ e S&P do backtest oficial (factsheet). Nasdaq calculado por nós com dado real do Yahoo (^IXIC), mesma metodologia — comparativo, não factsheet auditado.",
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

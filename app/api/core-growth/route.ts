import { NextRequest, NextResponse } from "next/server";
import { loadCore22Nav, alignedDji, alignedTsy } from "@/lib/core22";

export const dynamic = "force-dynamic";

const SINCE_YEAR: Record<string, number> = { "2016": 2016, "2006": 2006, "2000": 2000 };

// GET /api/core-growth?period=5y → cumulative growth (base 100) for CORE22+,
// S&P 500, Dow Jones (^DJI) and long-duration Treasuries (TLT). Same series
// as /api/core-drawdown but shown as "how did $100 grow?" instead of "how far
// below the peak?". Nasdaq was removed at the fund's request in favor of the
// broader Dow + a rates proxy.
export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period") || "5y";
  try {
    const { t, core, spx } = loadCore22Nav();
    const [djiFull, tsyFull] = await Promise.all([alignedDji(t), alignedTsy(t)]);

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
      const yr = SINCE_YEAR[period] || 2000;
      startIdx = t.findIndex((ts) => new Date(ts * 1000).getUTCFullYear() >= yr);
    }
    if (startIdx < 0) startIdx = 0;

    // Rebase everything to 100 at the first date of the window with data for
    // that series. External series (DJI/TLT) may start later than CORE/SPX
    // (e.g. TLT: 2002-08); in that case they rebase from THEIR first available
    // date within the window and only emit points from there on.
    function rebaseAligned(arr: number[]): { time: number; value: number }[] {
      const base = arr[startIdx] || 1;
      const out: { time: number; value: number }[] = [];
      for (let i = startIdx; i < arr.length; i++) {
        out.push({ time: t[i], value: +((arr[i] / base) * 100).toFixed(4) });
      }
      return out;
    }

    function rebaseExternal(arr: (number | null)[]): { time: number; value: number }[] {
      const out: { time: number; value: number }[] = [];
      let base: number | null = null;
      for (let i = startIdx; i < arr.length; i++) {
        const v = arr[i];
        if (v == null) continue;
        if (base == null) base = v;
        out.push({ time: t[i], value: +((v / base) * 100).toFixed(4) });
      }
      return out;
    }

    const coreG = rebaseAligned(core);
    const spxG = rebaseAligned(spx);
    const djiG = djiFull ? rebaseExternal(djiFull) : null;
    const tsyG = tsyFull ? rebaseExternal(tsyFull) : null;

    const yrs = Math.max((t[t.length - 1] - t[startIdx]) / (365.25 * 86400), 0.01);
    function stats(series: { value: number }[] | null) {
      if (!series || series.length < 2) return { totalReturn: null, cagr: null, years: null as number | null };
      const totalReturn = +((series[series.length - 1].value / series[0].value - 1) * 100).toFixed(1);
      const cagr = +(((series[series.length - 1].value / series[0].value) ** (1 / yrs) - 1) * 100).toFixed(1);
      return { totalReturn, cagr, years: +yrs.toFixed(2) };
    }

    const sCore = stats(coreG);
    const sSpx = stats(spxG);
    const sDji = stats(djiG);
    const sTsy = stats(tsyG);

    return NextResponse.json({
      period,
      years: +yrs.toFixed(2),
      core: coreG,
      spx: spxG,
      dji: djiG,
      tsy: tsyG,
      coreReturn: sCore.totalReturn,
      spxReturn: sSpx.totalReturn,
      djiReturn: sDji.totalReturn,
      tsyReturn: sTsy.totalReturn,
      coreCagr: sCore.cagr,
      spxCagr: sSpx.cagr,
      djiCagr: sDji.cagr,
      tsyCagr: sTsy.cagr,
      tsyNote: tsyG && tsyG.length && tsyG[0].time > t[startIdx] + 30 * 86400
        ? `TLT starts on ${new Date(tsyG[0].time * 1000).toISOString().slice(0, 10)} (ETF inception 2002-08).`
        : null,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

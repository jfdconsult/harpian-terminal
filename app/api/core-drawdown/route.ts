import { NextRequest, NextResponse } from "next/server";
import { loadCore22Nav, alignedNasdaq } from "@/lib/core22";

export const dynamic = "force-dynamic";

const SINCE_YEAR: Record<string, number> = { "2016": 2016, "2006": 2006, "2000": 2000 };

// GET /api/core-drawdown?period=5y → underwater do CORE22+, S&P e Nasdaq (backtest + Yahoo real)
export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period") || "5y";
  try {
    const { t, core, spx } = loadCore22Nav();
    const nasdaqFull = await alignedNasdaq(t); // null se Yahoo indisponível — segue só com core/spx

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

    const underwater = (arr: number[]) => {
      let peak = arr[startIdx] || 1;
      const out: { time: number; value: number }[] = [];
      for (let i = startIdx; i < arr.length; i++) {
        if (arr[i] > peak) peak = arr[i];
        out.push({ time: t[i], value: +((arr[i] / peak - 1) * 100).toFixed(2) });
      }
      return out;
    };
    const coreDD = underwater(core);
    const spxDD = underwater(spx);
    const nasdaqDD = nasdaqFull ? underwater(nasdaqFull) : null;
    const maxCore = coreDD.length ? Math.min(...coreDD.map((d) => d.value)) : 0;
    const maxSpx = spxDD.length ? Math.min(...spxDD.map((d) => d.value)) : 0;
    const maxNasdaq = nasdaqDD && nasdaqDD.length ? Math.min(...nasdaqDD.map((d) => d.value)) : null;

    return NextResponse.json({
      period, core: coreDD, spx: spxDD, nasdaq: nasdaqDD,
      maxCore: +maxCore.toFixed(1), maxSpx: +maxSpx.toFixed(1),
      maxNasdaq: maxNasdaq != null ? +maxNasdaq.toFixed(1) : null,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

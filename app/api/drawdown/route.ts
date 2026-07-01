import { NextRequest, NextResponse } from "next/server";
import { yahooChart } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

// Períodos pedidos: YTD, 1A, 5A, 10A(2016), 20A(2006), desde 2000.
const PERIODS: Record<string, { range: string; interval: string; since?: number }> = {
  ytd: { range: "ytd", interval: "1d" },
  "1y": { range: "1y", interval: "1d" },
  "5y": { range: "5y", interval: "1wk" },
  "2016": { range: "10y", interval: "1wk" },
  "2006": { range: "max", interval: "1wk", since: 2006 },
  "2000": { range: "max", interval: "1mo", since: 2000 },
};

// GET /api/drawdown?symbol=^GSPC&period=5y → underwater curve (dd% <= 0) + maxDD
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const symbol = (sp.get("symbol") || "^GSPC").toUpperCase();
  const period = sp.get("period") || "5y";
  const cfg = PERIODS[period] || PERIODS["5y"];
  try {
    const { series } = await yahooChart(symbol, cfg.range, cfg.interval);
    let t = series.t, c = series.close;
    if (cfg.since) {
      const idx = t.findIndex((ts) => new Date(ts * 1000).getUTCFullYear() >= cfg.since!);
      if (idx > 0) { t = t.slice(idx); c = c.slice(idx); }
    }
    let peak = c[0] || 1;
    const dd: { time: number; value: number }[] = [];
    for (let i = 0; i < c.length; i++) {
      if (c[i] > peak) peak = c[i];
      dd.push({ time: t[i], value: +((c[i] / peak - 1) * 100).toFixed(2) });
    }
    const maxDD = dd.length ? Math.min(...dd.map((d) => d.value)) : 0;
    return NextResponse.json({ symbol, period, dd, maxDD: +maxDD.toFixed(1) });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

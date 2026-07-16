import { NextRequest, NextResponse } from "next/server";
import { yahooChart, dayPct, pctFrom, ytdIndex, sharpe, maxDrawdownPct, rsi, w52 } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

const toDate = (ts: number) => new Date(ts * 1000).toISOString().slice(0, 10);

// GET /api/asset?symbol=NVDA&bench=^GSPC → full metrics + normalized series (base 100)
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const symbol = (sp.get("symbol") || "NVDA").toUpperCase();
  const bench = sp.get("bench") || "^GSPC";
  try {
    const [a, b] = await Promise.all([
      yahooChart(symbol, "1y", "1d"),
      yahooChart(bench, "1y", "1d"),
    ]);
    const c = a.series.close, t = a.series.t;
    const base = c[0], bbase = b.series.close[0];
    const points = t.map((ts, i) => ({ time: toDate(ts), value: +((c[i] / base) * 100).toFixed(2) }));
    const benchPoints = b.series.t.map((ts, i) => ({ time: toDate(ts), value: +((b.series.close[i] / bbase) * 100).toFixed(2) }));
    return NextResponse.json({
      symbol,
      name: (a.meta.shortName as string) || (a.meta.longName as string) || symbol,
      price: c[c.length - 1],
      dayPct: dayPct(c),
      ytdPct: pctFrom(c, ytdIndex(t)),
      yPct: pctFrom(c, 0),
      sharpe: sharpe(c),
      maxDD: maxDrawdownPct(c),
      rsi: rsi(c),
      w52: w52(c),
      points,
      benchPoints,
      benchName: (b.meta.shortName as string) || bench,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

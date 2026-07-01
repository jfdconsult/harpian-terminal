import { NextRequest, NextResponse } from "next/server";
import { yahooChart, dayPct, pctFrom, ytdIndex, idxDaysAgo, sharpe, riskNumber } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

// GET /api/quotes?symbols=^GSPC,NVDA,...  → snapshot + janelas por símbolo
export async function GET(req: NextRequest) {
  const symbols = (req.nextUrl.searchParams.get("symbols") || "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  if (!symbols.length) return NextResponse.json([]);

  const out = await Promise.all(
    symbols.map(async (s) => {
      try {
        const { series, meta } = await yahooChart(s, "1y", "1d");
        const c = series.close, t = series.t;
        return {
          symbol: s,
          name: (meta.shortName as string) || (meta.longName as string) || s,
          price: c[c.length - 1],
          dayPct: dayPct(c),
          mPct: pctFrom(c, idxDaysAgo(c.length, 21)),
          ytdPct: pctFrom(c, ytdIndex(t)),
          yPct: pctFrom(c, 0),
          sharpe: sharpe(c),
          riskNumber: riskNumber(c),
        };
      } catch {
        return { symbol: s, error: true };
      }
    })
  );
  return NextResponse.json(out);
}

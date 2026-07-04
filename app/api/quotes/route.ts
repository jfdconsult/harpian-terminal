import { NextRequest, NextResponse } from "next/server";
import { yahooChart, dayPct, pctFrom, ytdIndex, idxDaysAgo, sharpe, riskNumber } from "@/lib/yahoo";
import { cacheGet, cacheSet } from "@/lib/cache";

export const dynamic = "force-dynamic";

const TTL = 8 * 60 * 60 * 1000; // 8h cache

interface QuoteResult {
  symbol: string;
  name?: string;
  price?: number;
  dayPct?: number | null;
  mPct?: number | null;
  ytdPct?: number | null;
  yPct?: number | null;
  sharpe?: number | null;
  riskNumber?: number | null;
  error?: boolean;
}

async function fetchQuote(s: string): Promise<QuoteResult> {
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
}

// GET /api/quotes?symbols=^GSPC,NVDA,...
export async function GET(req: NextRequest) {
  const symbols = (req.nextUrl.searchParams.get("symbols") || "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  if (!symbols.length) return NextResponse.json([]);

  const cacheKey = "quotes_" + symbols.sort().join("_").replace(/[^a-zA-Z0-9_]/g, "");

  const cached = cacheGet<QuoteResult[]>(cacheKey, TTL);
  if (cached) return NextResponse.json(cached);

  const out = await Promise.all(symbols.map(fetchQuote));
  cacheSet(cacheKey, out);
  return NextResponse.json(out);
}

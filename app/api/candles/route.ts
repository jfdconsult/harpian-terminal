import { NextRequest, NextResponse } from "next/server";
import { yahooOHLC } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

// GET /api/candles?symbol=NVDA&range=1y&interval=1d → OHLC + volume p/ candlestick
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const symbol = (sp.get("symbol") || "NVDA").toUpperCase();
  const range = sp.get("range") || "1y";
  const interval = sp.get("interval") || "1d";
  try {
    const { s, meta } = await yahooOHLC(symbol, range, interval);
    const candles = s.t.map((t, i) => ({ time: t, open: s.o[i], high: s.h[i], low: s.l[i], close: s.c[i] }));
    const volume = s.t.map((t, i) => ({ time: t, value: s.v[i], up: s.c[i] >= s.o[i] }));
    return NextResponse.json({
      symbol,
      name: (meta.shortName as string) || (meta.longName as string) || symbol,
      currency: (meta.currency as string) || "USD",
      candles,
      volume,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

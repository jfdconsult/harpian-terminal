import { NextRequest, NextResponse } from "next/server";
import { yahooOHLC } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

// GET /api/candles?symbol=NVDA&range=1y&interval=1d&compare=SPY
// → OHLC + volume + (opcional) linha de comparação rebaseada ao nível do ativo.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const symbol = (sp.get("symbol") || "NVDA").toUpperCase();
  const range = sp.get("range") || "1y";
  const interval = sp.get("interval") || "1d";
  const compare = (sp.get("compare") || "").toUpperCase();
  try {
    const [a, b] = await Promise.all([
      yahooOHLC(symbol, range, interval),
      compare ? yahooOHLC(compare, range, interval).catch(() => null) : Promise.resolve(null),
    ]);
    const s = a.s;
    const candles = s.t.map((t, i) => ({ time: t, open: s.o[i], high: s.h[i], low: s.l[i], close: s.c[i] }));
    const volume = s.t.map((t, i) => ({ time: t, value: s.v[i], up: s.c[i] >= s.o[i] }));

    let compareLine: { time: number; value: number }[] | null = null;
    let compareName: string | null = null;
    if (b && b.s.t.length) {
      const bmap = new Map<number, number>();
      b.s.t.forEach((t, i) => bmap.set(t, b.s.c[i]));
      const base = bmap.get(s.t[0]) ?? b.s.c[0];
      const factor = base ? s.c[0] / base : 1;
      compareLine = [];
      for (let i = 0; i < s.t.length; i++) {
        const bc = bmap.get(s.t[i]);
        if (bc != null) compareLine.push({ time: s.t[i], value: +(bc * factor).toFixed(2) });
      }
      compareName = (b.meta.shortName as string) || compare;
    }

    return NextResponse.json({
      symbol,
      name: (a.meta.shortName as string) || (a.meta.longName as string) || symbol,
      currency: (a.meta.currency as string) || "USD",
      candles,
      volume,
      compareLine,
      compareName,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

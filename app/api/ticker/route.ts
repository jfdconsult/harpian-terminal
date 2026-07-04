import { NextResponse } from "next/server";
import { yahooChart, dayPct } from "@/lib/yahoo";
import { cacheGet, cacheSet } from "@/lib/cache";

export const dynamic = "force-dynamic";

const TTL = 8 * 60 * 60 * 1000; // 8 hours → ~3 refreshes/day

interface TickerItem { lbl: string; v: string; dir: "up" | "dn" | "nu" | "wa" | "go" }
interface TickerGroup { div: string; items: TickerItem[] }

const SYMBOLS: { div: string; items: { lbl: string; sym: string; prefix?: string; suffix?: string; isYield?: boolean }[] }[] = [
  {
    div: "INDICES",
    items: [
      { lbl: "S&P 500", sym: "^GSPC" },
      { lbl: "NASDAQ", sym: "^IXIC" },
      { lbl: "DOW", sym: "^DJI" },
      { lbl: "IBOV", sym: "^BVSP" },
      { lbl: "FTSE", sym: "^FTSE" },
      { lbl: "DAX", sym: "^GDAXI" },
      { lbl: "NIKKEI", sym: "^N225" },
      { lbl: "VIX", sym: "^VIX" },
      { lbl: "10Y UST", sym: "^TNX", suffix: "%", isYield: true },
      { lbl: "2Y UST", sym: "^IRX", suffix: "%", isYield: true },
    ],
  },
  {
    div: "COMMODITIES",
    items: [
      { lbl: "GOLD", sym: "GC=F", prefix: "$" },
      { lbl: "SILVER", sym: "SI=F", prefix: "$" },
      { lbl: "WTI OIL", sym: "CL=F", prefix: "$" },
      { lbl: "BRENT", sym: "BZ=F", prefix: "$" },
      { lbl: "NAT GAS", sym: "NG=F", prefix: "$" },
      { lbl: "COPPER", sym: "HG=F", prefix: "$" },
      { lbl: "USD/BRL", sym: "BRL=X" },
      { lbl: "EUR/USD", sym: "EURUSD=X" },
      { lbl: "BTC", sym: "BTC-USD", prefix: "$" },
    ],
  },
  {
    div: "STOCKS",
    items: [
      { lbl: "NVDA", sym: "NVDA", prefix: "$" },
      { lbl: "MSFT", sym: "MSFT", prefix: "$" },
      { lbl: "AAPL", sym: "AAPL", prefix: "$" },
      { lbl: "META", sym: "META", prefix: "$" },
      { lbl: "GOOGL", sym: "GOOGL", prefix: "$" },
      { lbl: "AMZN", sym: "AMZN", prefix: "$" },
      { lbl: "TSLA", sym: "TSLA", prefix: "$" },
      { lbl: "JPM", sym: "JPM", prefix: "$" },
      { lbl: "XOM", sym: "XOM", prefix: "$" },
      { lbl: "SPY", sym: "SPY", prefix: "$" },
      { lbl: "QQQ", sym: "QQQ", prefix: "$" },
      { lbl: "GLD", sym: "GLD", prefix: "$" },
      { lbl: "TLT", sym: "TLT", prefix: "$" },
      { lbl: "IWM", sym: "IWM", prefix: "$" },
    ],
  },
];

function fmtPrice(v: number, prefix?: string, suffix?: string): string {
  const s = v >= 1000
    ? v.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : v.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  return (prefix || "") + s + (suffix || "");
}

function dir(pct: number | null, isYield?: boolean): "up" | "dn" | "wa" {
  if (pct == null) return "wa";
  if (isYield) return pct > 0 ? "dn" : "up"; // yield up = bad for bonds
  return pct >= 0 ? "up" : "dn";
}

async function fetchAll(): Promise<TickerGroup[]> {
  const groups: TickerGroup[] = [];

  for (const g of SYMBOLS) {
    const items: TickerItem[] = [];
    const results = await Promise.allSettled(
      g.items.map(async (it) => {
        const { series } = await yahooChart(it.sym, "5d", "1d");
        const c = series.close;
        const price = c[c.length - 1];
        const pct = dayPct(c);
        const pctStr = pct != null ? (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%" : "";
        const d = dir(pct, it.isYield);
        return {
          lbl: it.lbl,
          v: `${fmtPrice(price, it.prefix, it.suffix)} ${pctStr}`,
          dir: d,
        } as TickerItem;
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled") items.push(r.value);
    }
    if (items.length) groups.push({ div: g.div, items });
  }

  // Harpian funds (static for now)
  groups.push({
    div: "HARPIAN",
    items: [
      { lbl: "HPC11", v: "+7.5% YTD", dir: "up" },
      { lbl: "HPC22", v: "+24.3% YTD", dir: "up" },
    ],
  });

  return groups;
}

export async function GET() {
  const cached = cacheGet<TickerGroup[]>("ticker", TTL);
  if (cached) {
    const age = Math.round((Date.now() - (Date.now() - TTL + 1)) / 60000);
    return NextResponse.json({ data: cached, cached: true });
  }

  try {
    const data = await fetchAll();
    cacheSet("ticker", data);
    return NextResponse.json({ data, cached: false });
  } catch (e) {
    // If fetch fails but we have stale cache, use it
    const stale = cacheGet<TickerGroup[]>("ticker", TTL * 10);
    if (stale) return NextResponse.json({ data: stale, cached: true, stale: true });
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { yahooChart, dayPct } from "@/lib/yahoo";
import { cacheGet, cacheSet } from "@/lib/cache";
import { hqpGet } from "@/lib/hqp";

export const dynamic = "force-dynamic";

const TTL = 8 * 60 * 60 * 1000; // 8 hours → ~3 refreshes/day

interface TickerItem { lbl: string; v: string; dir: "up" | "dn" | "nu" | "wa" | "go"; symbol?: string; href?: string }
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
    div: "FX",
    items: [
      { lbl: "USD/BRL", sym: "BRL=X" },
      { lbl: "EUR/USD", sym: "EURUSD=X" },
      { lbl: "EUR/BRL", sym: "EURBRL=X" },
    ],
  },
  {
    div: "CRYPTO",
    items: [
      { lbl: "BTC", sym: "BTC-USD", prefix: "$" },
      { lbl: "ETH", sym: "ETH-USD", prefix: "$" },
      { lbl: "SOL", sym: "SOL-USD", prefix: "$" },
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
    ],
  },
  {
    div: "US STOCKS",
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
  {
    // Top 20 largest/most liquid Ibovespa constituents.
    div: "BRAZIL STOCKS",
    items: [
      { lbl: "PETR4", sym: "PETR4.SA" },
      { lbl: "VALE3", sym: "VALE3.SA" },
      { lbl: "ITUB4", sym: "ITUB4.SA" },
      { lbl: "BBDC4", sym: "BBDC4.SA" },
      { lbl: "BBAS3", sym: "BBAS3.SA" },
      { lbl: "ABEV3", sym: "ABEV3.SA" },
      { lbl: "B3SA3", sym: "B3SA3.SA" },
      { lbl: "WEGE3", sym: "WEGE3.SA" },
      { lbl: "RENT3", sym: "RENT3.SA" },
      { lbl: "SUZB3", sym: "SUZB3.SA" },
      { lbl: "JBSS3", sym: "JBSS3.SA" },
      { lbl: "ITSA4", sym: "ITSA4.SA" },
      { lbl: "EQTL3", sym: "EQTL3.SA" },
      { lbl: "RADL3", sym: "RADL3.SA" },
      { lbl: "PRIO3", sym: "PRIO3.SA" },
      { lbl: "GGBR4", sym: "GGBR4.SA" },
      { lbl: "VIVT3", sym: "VIVT3.SA" },
      { lbl: "RAIL3", sym: "RAIL3.SA" },
      { lbl: "ELET3", sym: "ELET3.SA" },
      { lbl: "CSAN3", sym: "CSAN3.SA" },
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

async function quoteItem(it: { lbl: string; sym: string; prefix?: string; suffix?: string; isYield?: boolean }): Promise<TickerItem> {
  const { series } = await yahooChart(it.sym, "5d", "1d");
  const c = series.close;
  const price = c[c.length - 1];
  const pct = dayPct(c);
  const pctStr = pct != null ? (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%" : "";
  return {
    lbl: it.lbl,
    v: `${fmtPrice(price, it.prefix, it.suffix)} ${pctStr}`,
    dir: dir(pct, it.isYield),
    symbol: it.sym,
  };
}

async function fetchAll(origin: string): Promise<TickerGroup[]> {
  const groups: TickerGroup[] = [];

  for (const g of SYMBOLS) {
    const results = await Promise.allSettled(g.items.map(quoteItem));
    const items: TickerItem[] = [];
    for (const r of results) if (r.status === "fulfilled") items.push(r.value);
    if (items.length) groups.push({ div: g.div, items });
  }

  // Your positions — real top holdings of the fund (client-safe read from the overnight
  // job, never the engine/signal). Live quote from Yahoo layered on top.
  try {
    const snap = await fetch(`${origin}/api/snapshot`, { cache: "no-store" }).then((r) => r.json());
    const profile = snap?.profiles?.ADVANCE || snap?.profiles?.BALANCE || snap?.profiles?.CONSERVATIVE;
    const holdings: { ticker: string }[] = (profile?.top_holdings || []).slice(0, 8);
    if (holdings.length) {
      const results = await Promise.allSettled(
        holdings.map((h) => quoteItem({ lbl: h.ticker, sym: h.ticker, prefix: "$" }))
      );
      const items: TickerItem[] = [];
      for (const r of results) if (r.status === "fulfilled") items.push(r.value);
      if (items.length) groups.push({ div: "YOUR POSITIONS", items });
    }
  } catch { /* overnight job offline — continue without this row */ }

  // Harpian funds (static for now)
  groups.push({
    div: "HARPIAN",
    items: [
      { lbl: "HPC11", v: "+7.5% YTD", dir: "up" },
      { lbl: "HPC22", v: "+24.3% YTD", dir: "up" },
    ],
  });

  // Real news (financial RSS via HQP backend) — each item links to the original story.
  try {
    const news = await hqpGet<{ headlines: { headline: string; source_label: string; url: string }[] }>("/v1/news");
    const items: TickerItem[] = (news.headlines || []).slice(0, 8).map((h) => ({
      lbl: h.headline.length > 64 ? h.headline.slice(0, 61) + "…" : h.headline,
      v: h.source_label,
      dir: "go",
      href: h.url,
    }));
    if (items.length) groups.push({ div: "NEWS", items });
  } catch { /* news backend offline — continue without this row */ }

  return groups;
}

export async function GET(req: NextRequest) {
  const cached = cacheGet<TickerGroup[]>("ticker", TTL);
  if (cached) {
    return NextResponse.json({ data: cached, cached: true });
  }

  try {
    const origin = new URL(req.url).origin;
    const data = await fetchAll(origin);
    cacheSet("ticker", data);
    return NextResponse.json({ data, cached: false });
  } catch (e) {
    // If fetch fails but we have stale cache, use it
    const stale = cacheGet<TickerGroup[]>("ticker", TTL * 10);
    if (stale) return NextResponse.json({ data: stale, cached: true, stale: true });
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

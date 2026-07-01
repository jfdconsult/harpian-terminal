import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// Série de NAV do backtest CORE22+ (Portfolio) e S&P (SPX_buyhold), base 100, 1990–2026.
let CACHE: { t: number[]; core: number[]; spx: number[] } | null = null;
function load() {
  if (CACHE) return CACHE;
  const raw = readFileSync(path.join(process.cwd(), "data", "core22_nav.csv"), "utf-8");
  const lines = raw.trim().split(/\r?\n/);
  lines.shift(); // header: Date,Portfolio,SPX_buyhold
  const t: number[] = [], core: number[] = [], spx: number[] = [];
  for (const ln of lines) {
    const [d, p, s] = ln.split(",");
    if (!d || !p) continue;
    t.push(Math.floor(new Date(d + "T00:00:00Z").getTime() / 1000));
    core.push(parseFloat(p));
    spx.push(parseFloat(s));
  }
  CACHE = { t, core, spx };
  return CACHE;
}

const SINCE_YEAR: Record<string, number> = { "2016": 2016, "2006": 2006, "2000": 2000 };

// GET /api/core-drawdown?period=5y → underwater do CORE22+ e do S&P (backtest)
export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period") || "5y";
  try {
    const { t, core, spx } = load();
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
    const maxCore = coreDD.length ? Math.min(...coreDD.map((d) => d.value)) : 0;
    const maxSpx = spxDD.length ? Math.min(...spxDD.map((d) => d.value)) : 0;
    return NextResponse.json({ period, core: coreDD, spx: spxDD, maxCore: +maxCore.toFixed(1), maxSpx: +maxSpx.toFixed(1) });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// INTEGRATION HEALTH — real verification, not a typed-in badge
// ------------------------------------------------------------
// The Integrations screen used to show "connected" via hand-written constants.
// Worse: Lynk showed up as "connected — order routing" while the Orders
// screen itself says sending is simulated and there is no real integration.
//
// Here each source is actually checked. Possible statuses:
//   ok        — responded
//   offline   — didn't respond / error
//   simulado  — the screen exists but there's no real integration behind it (declared)
//   planejado — not yet built (declared)
// ============================================================

const GOV = process.env.NEXT_PUBLIC_GOV_API_URL || "http://localhost:8877";
const HQP = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const XRI = process.env.NEXT_PUBLIC_XRI_API_URL || "http://localhost:8879";

export type IntegrationStatus = "ok" | "offline" | "simulado" | "planejado";

export interface IntegrationHealth {
  id: string;
  name: string;
  icon: string;
  status: IntegrationStatus;
  note: string;
  latency_ms?: number;
  detail?: string;
}

async function ping(url: string, opts?: RequestInit): Promise<{ ok: boolean; ms: number; detail?: string }> {
  const t0 = Date.now();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(url, { ...opts, signal: ctrl.signal, cache: "no-store" });
    clearTimeout(timer);
    return { ok: r.ok, ms: Date.now() - t0, detail: r.ok ? undefined : `HTTP ${r.status}` };
  } catch (e) {
    return { ok: false, ms: Date.now() - t0, detail: String(e).slice(0, 80) };
  }
}

export async function GET() {
  const [yahoo, edgar, cftc, cboe, fred, xri, hqp, cal] = await Promise.all([
    ping("https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?range=1d&interval=1d"),
    ping(`${GOV}/api/insider`),
    ping(`${GOV}/api/cot/legacy?weeks=1`),
    ping(`${GOV}/api/cboe/volatility`),
    ping(`${GOV}/api/fred/macro`),
    ping(`${XRI}/xri/full`),
    ping(`${HQP}/v1/protection/indicators`),
    ping("https://www.investing.com/economic-calendar/Service/getCalendarFilteredData", {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0",
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": "https://www.investing.com/economic-calendar/",
      },
      body: "country%5B%5D=5&timeZone=8&currentTab=thisWeek&limit_from=0",
    }),
  ]);

  const st = (p: { ok: boolean }): IntegrationStatus => (p.ok ? "ok" : "offline");

  const integrations: IntegrationHealth[] = [
    { id: "yahoo", name: "Yahoo Finance", icon: "ti-chart-line", status: st(yahoo), latency_ms: yahoo.ms, detail: yahoo.detail,
      note: "Quotes, candles and US history — current price source." },
    { id: "edgar", name: "SEC EDGAR", icon: "ti-report-money", status: st(edgar), latency_ms: edgar.ms, detail: edgar.detail,
      note: "Form 4 (insider) and institutional 13F, via the gov-data pipeline." },
    { id: "cftc", name: "CFTC (COT)", icon: "ti-flame", status: st(cftc), latency_ms: cftc.ms, detail: cftc.detail,
      note: "Commitments of Traders — weekly futures positioning." },
    { id: "cboe", name: "CBOE", icon: "ti-bolt", status: st(cboe), latency_ms: cboe.ms, detail: cboe.detail,
      note: "VIX, VVIX, skew and volatility term structure." },
    { id: "fred", name: "FRED (St. Louis Fed)", icon: "ti-building-bank", status: st(fred), latency_ms: fred.ms, detail: fred.detail,
      note: "Rates, 2s10s curve, credit spread, CPI and unemployment." },
    { id: "calendar", name: "Economic calendar", icon: "ti-calendar-event", status: st(cal), latency_ms: cal.ms, detail: cal.detail,
      note: "Investing.com — upcoming releases with forecast and prior." },
    { id: "xri", name: "XRI Engine", icon: "ti-world-exclamation", status: st(xri), latency_ms: xri.ms, detail: xri.detail,
      note: "External Regime Index — in-house engine (harpian-xri)." },
    { id: "hqp", name: "HC-US Engine (ARI)", icon: "ti-shield", status: st(hqp), latency_ms: hqp.ms, detail: hqp.detail,
      note: "American Regime Index, defense and pillars — overnight-validated." },
    { id: "lynk", name: "Lynk Capital Markets", icon: "ti-building-bank", status: "simulado",
      note: "Admin, settlement and order routing. Sending on the Orders screen is SIMULATED — there's no real integration yet." },
    { id: "fasttrack", name: "FastTrack", icon: "ti-database", status: "planejado",
      note: "API v2 EOD US — will replace Yahoo as the price source." },
    { id: "tradingview", name: "TradingView", icon: "ti-chart-candle", status: "planejado",
      note: "Deep-link + HARPIAN DSPT template." },
  ];

  return NextResponse.json({ checked_at: new Date().toISOString(), integrations });
}

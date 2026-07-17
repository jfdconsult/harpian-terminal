import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Proxies to hqp-api's /v1/calendar/earnings/* — Nasdaq's public earnings
// data via the shared backend, with caching there.
const HQP_API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_HQP_API_URL || "http://localhost:8080";

// GET /api/earnings?days=14&tickers=AAPL,MSFT
//   Next scheduled earnings per ticker over the next N days.
// GET /api/earnings?days=14         (no tickers)
//   Everyone scheduled in the window (used by the Cockpit universe view).
// GET /api/earnings?mode=recent&days=14&tickers=AAPL,MSFT
//   Most-recent PAST reports for the tickers over the last N days.
// GET /api/earnings?mode=last&tickers=AAPL,MSFT
//   Last reported quarter per ticker (EPS reported, consensus, surprise%).
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const mode = (p.get("mode") || "upcoming").toLowerCase();
  const tickers = (p.get("tickers") || "").trim();

  try {
    if (mode === "last") {
      if (!tickers) return NextResponse.json({ ok: false, error: "tickers is required for mode=last", results: [] }, { status: 200 });
      const r = await fetch(`${HQP_API}/v1/calendar/earnings/last?tickers=${encodeURIComponent(tickers)}`, { cache: "no-store" });
      return NextResponse.json(await r.json());
    }

    const days = Math.max(1, Math.min(45, Number(p.get("days") || 14)));

    if (mode === "recent") {
      const url = tickers
        ? `${HQP_API}/v1/calendar/earnings/recent?days=${days}&tickers=${encodeURIComponent(tickers)}`
        : `${HQP_API}/v1/calendar/earnings/recent?days=${days}`;
      const r = await fetch(url, { cache: "no-store" });
      return NextResponse.json(await r.json());
    }

    // upcoming (default)
    const url = tickers
      ? `${HQP_API}/v1/calendar/earnings/upcoming?days=${days}&tickers=${encodeURIComponent(tickers)}`
      : `${HQP_API}/v1/calendar/earnings/upcoming?days=${days}`;
    const r = await fetch(url, { cache: "no-store" });
    return NextResponse.json(await r.json());
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), upcoming: [] }, { status: 200 });
  }
}

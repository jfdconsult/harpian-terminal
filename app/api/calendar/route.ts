import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Proxies to hqp-api's /v1/calendar/economic — Nasdaq's public JSON,
// cached on the backend. Replaces the old Investing.com scrape that
// started returning 403 (Cloudflare fingerprinting) in mid-2026.
const HQP_API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_HQP_API_URL || "http://localhost:8080";

interface HqpEconEvent {
  date: string;
  time_et: string | null;
  country: string | null;
  event: string | null;
  actual: string | null;
  consensus: string | null;
  previous: string | null;
  description: string | null;
  source_url: string | null;
}

// A tight allow-list — only what the desk actually cares about. Anything
// else gets dropped in high-impact filtering.
const HIGH_IMPACT_KEYWORDS = [
  "cpi", "consumer price", "nonfarm", "payroll", "fomc",
  "fed funds", "gdp", "ppi", "retail sales", "core pce", "pce price",
  "unemployment", "ism", "adp", "jobless claims", "michigan sentiment",
  "housing starts", "durable goods", "personal income", "personal spending",
];

function isHighImpact(country: string | null, event: string | null): boolean {
  const c = (country || "").toLowerCase();
  const n = (event || "").toLowerCase();
  if (!c.includes("united states") && c !== "us") return false;
  return HIGH_IMPACT_KEYWORDS.some((k) => n.includes(k));
}

const MES_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function decorate(events: HqpEconEvent[]) {
  return events.map((e) => {
    const [y, m, d] = e.date.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return {
      datetime: `${e.date}T${(e.time_et || "00:00").padStart(5, "0")}:00`,
      date: `${MES_SHORT[dt.getUTCMonth()]} ${String(dt.getUTCDate()).padStart(2, "0")}`,
      date_iso: e.date,
      time: e.time_et ? `${e.time_et} ET` : "",
      event: e.event || "",
      country: e.country || "",
      importance: (isHighImpact(e.country, e.event) ? 3 : 1) as 1 | 2 | 3,
      actual: e.actual,
      forecast: e.consensus,
      previous: e.previous,
      source_url: e.source_url,
    };
  });
}

// GET /api/calendar?days=7                 → upcoming next N days
// GET /api/calendar?mode=latest&days=14    → past N days, only rows with `actual`
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const mode = (p.get("mode") || "upcoming").toLowerCase();
  const days = Math.max(1, Math.min(45, Number(p.get("days") || 7)));
  const highOnly = p.get("high") !== "0"; // default: high-impact only
  const country = (p.get("country") || "").trim().toUpperCase();

  try {
    let raw: HqpEconEvent[] = [];
    if (mode === "latest") {
      const r = await fetch(`${HQP_API}/v1/calendar/economic/latest?days=${days}`, { cache: "no-store" });
      const d = await r.json();
      raw = d.ok ? d.events || [] : [];
    } else {
      // Iterate day-by-day upcoming (backend caches each day)
      const isos: string[] = [];
      const today = new Date();
      for (let i = 0; i < days; i++) {
        const dd = new Date(today);
        dd.setUTCDate(today.getUTCDate() + i);
        isos.push(dd.toISOString().slice(0, 10));
      }
      const daily = await Promise.all(
        isos.map((iso) =>
          fetch(`${HQP_API}/v1/calendar/economic?date=${iso}`, { cache: "no-store" })
            .then((r) => r.json())
            .then((d) => (d.ok ? (d.events as HqpEconEvent[]) || [] : []))
            .catch(() => [])
        )
      );
      raw = daily.flat();
    }

    let events = decorate(raw);
    if (highOnly) events = events.filter((e) => e.importance === 3);
    if (country) {
      const needle = country === "US" ? "united states" : country.toLowerCase();
      events = events.filter((e) => (e.country || "").toLowerCase().includes(needle));
    }

    return NextResponse.json({
      ok: true,
      mode,
      days,
      country: country || null,
      high_only: highOnly,
      n: events.length,
      events,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), events: [] }, { status: 200 });
  }
}

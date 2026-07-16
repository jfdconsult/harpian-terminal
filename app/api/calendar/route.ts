import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// ECONOMIC CALENDAR — real data (Investing.com)
// ------------------------------------------------------------
// Before, the calendar was a fixed array in Painel and ARI, with July
// dates that had already passed still being shown as the "next event".
//
// Source: Investing.com's calendar AJAX endpoint, which returns the
// upcoming weeks with name, date/time, importance, forecast, and previous.
// Runs on the SERVER (the browser couldn't do it due to CORS) and has a
// 1h in-memory cache — the calendar changes little and there's no point
// hitting Investing on every screen load.
//
// If the source goes down or changes format, this route returns ok:false
// and the screen shows "unavailable". Never falls back to a fabricated
// calendar.
// ============================================================

const URL_INVESTING = "https://www.investing.com/economic-calendar/Service/getCalendarFilteredData";
const COUNTRY_US = "5"; // US id on Investing
const TTL_MS = 60 * 60 * 1000; // 1h

export interface CalendarEvent {
  datetime: string;      // ISO
  date: string;          // "23/Jul"
  time: string;          // "08:30 ET"
  event: string;
  importance: 1 | 2 | 3; // 3 = high (3 bulls on Investing)
  forecast: string | null;
  previous: string | null;
  actual: string | null;
}

let cache: { at: number; events: CalendarEvent[] } | null = null;

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

const MES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

async function fetchWeek(tab: "thisWeek" | "nextWeek"): Promise<CalendarEvent[]> {
  const body = new URLSearchParams();
  body.append("country[]", COUNTRY_US);
  body.append("timeZone", "8"); // ET
  body.append("timeFilter", "timeRemain");
  body.append("currentTab", tab);
  body.append("limit_from", "0");

  const r = await fetch(URL_INVESTING, {
    method: "POST",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      "X-Requested-With": "XMLHttpRequest",
      "Content-Type": "application/x-www-form-urlencoded",
      "Referer": "https://www.investing.com/economic-calendar/",
    },
    body: body.toString(),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Investing HTTP ${r.status}`);

  const json = (await r.json()) as { data?: string };
  const html = json.data || "";

  const rows = html.match(/<tr id="eventRowId_\d+"[\s\S]*?<\/tr>/g) || [];
  const out: CalendarEvent[] = [];

  for (const row of rows) {
    const dtM = row.match(/data-event-datetime="([^"]+)"/);
    if (!dtM) continue;
    // "2026/07/23 08:30:00" → ISO
    const iso = dtM[1].replace(/\//g, "-").replace(" ", "T");
    const d = new Date(iso);
    if (isNaN(d.getTime())) continue;

    const importance = Math.min(3, Math.max(1, (row.match(/grayFullBullishIcon/g) || []).length)) as 1 | 2 | 3;

    const tds = row.match(/<td[^>]*>[\s\S]*?<\/td>/g) || [];
    const v = tds.map(stripTags);
    // [0]=time [1]=currency [2]=importance [3]=event [4]=actual [5]=forecast [6]=previous
    const name = v[3] || "";
    if (!name) continue;

    out.push({
      datetime: iso,
      date: `${String(d.getDate()).padStart(2, "0")}/${MES[d.getMonth()]}`,
      time: `${v[0] || "--:--"} ET`,
      event: name,
      importance,
      actual: v[4] || null,
      forecast: v[5] || null,
      previous: v[6] || null,
    });
  }
  return out;
}

export async function GET() {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return NextResponse.json({ ok: true, cached: true, events: cache.events });
  }

  try {
    // This week + next: guarantees there's always a "next event" even
    // on a Friday night.
    const [wk1, wk2] = await Promise.all([fetchWeek("thisWeek"), fetchWeek("nextWeek")]);

    const now = Date.now();
    const events = [...wk1, ...wk2]
      .filter((e) => new Date(e.datetime).getTime() >= now) // only what's still upcoming
      .sort((a, b) => a.datetime.localeCompare(b.datetime));

    if (!events.length) throw new Error("no future events returned");

    cache = { at: Date.now(), events };
    return NextResponse.json({ ok: true, cached: false, events });
  } catch (e) {
    // Source down / changed layout: return the old cache if it exists,
    // otherwise assume we don't know. Never fabricates data.
    if (cache) {
      return NextResponse.json({ ok: true, stale: true, events: cache.events });
    }
    return NextResponse.json({ ok: false, error: String(e), events: [] }, { status: 200 });
  }
}

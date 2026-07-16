// Client for the real economic calendar (GET /api/calendar → Investing.com).
// The route runs on the server and caches for 1h. Only typing + fetch here.
// Never a hardcoded calendar: if the source goes down, `ok` comes back false
// and the screen shows "unavailable" instead of a made-up date.

export interface CalendarEvent {
  datetime: string;
  date: string;          // "Jul 16"
  time: string;          // "08:30 ET"
  event: string;
  importance: 1 | 2 | 3; // 3 = high
  forecast: string | null;
  previous: string | null;
  actual: string | null;
}

export interface CalendarResp {
  ok: boolean;
  cached?: boolean;
  stale?: boolean;
  events: CalendarEvent[];
  error?: string;
}

export async function fetchCalendar(): Promise<CalendarResp> {
  try {
    const r = await fetch("/api/calendar", { cache: "no-store" });
    return (await r.json()) as CalendarResp;
  } catch {
    return { ok: false, events: [] };
  }
}

/** Only what moves markets (3 bulls on Investing). */
export function highImpact(events: CalendarEvent[]): CalendarEvent[] {
  return events.filter((e) => e.importance === 3);
}

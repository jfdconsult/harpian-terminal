"use client";
import { useEffect, useMemo, useState } from "react";
import { getFavorites, syncFromServer } from "@/lib/favorites";
import { publishScreenData } from "@/lib/jim-data";
import BackToVisao from "../BackToVisao";
import type { ScreenId } from "@/lib/nav";

interface EconEvent {
  datetime: string;
  date: string;
  date_iso: string;
  time: string;
  event: string;
  country: string;
  importance: 1 | 2 | 3;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
  source_url: string | null;
}

interface EarnRow {
  date: string;
  time: string | null;
  symbol: string;
  name: string | null;
  market_cap: string | null;
  fiscal_quarter_ending: string | null;
  eps_forecast: string | null;
  num_estimates: string | null;
  last_year_report_date: string | null;
  last_year_eps: string | null;
  // Merged in from Yahoo (backend /v1/calendar/earnings blends both sources):
  eps_reported: string | number | null;
  surprise_pct: string | number | null;
  source_url: string | null;
}

function fmtSurprise(v: string | number | null): { text: string; color: string } {
  if (v == null || v === "") return { text: "—", color: "var(--tx3)" };
  const n = typeof v === "number" ? v : Number(String(v).replace(/[+%]/g, ""));
  if (Number.isNaN(n)) return { text: String(v), color: "var(--tx3)" };
  const sign = n > 0 ? "+" : "";
  const color = n > 0 ? "var(--green)" : n < 0 ? "var(--red)" : "var(--tx3)";
  return { text: `${sign}${n.toFixed(2)}%`, color };
}

type Tab = "economic" | "earnings";
type When = "upcoming" | "latest";

const TIME_LABEL: Record<string, string> = {
  "time-pre-market": "Pre-market",
  "time-after-hours": "After hours",
  "time-not-supplied": "TBD",
};

function fmtTime(t: string | null): string {
  return !t ? "—" : TIME_LABEL[t] || t;
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// Row-level click handler that opens the Nasdaq source in a new tab.
function openSource(url: string | null) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

const rowLink = (url: string | null): React.CSSProperties => ({
  cursor: url ? "pointer" : "default",
});

export default function Calendar({ go }: { go?: (id: ScreenId, param?: string) => void }) {
  const [tab, setTab] = useState<Tab>("economic");
  const [when, setWhen] = useState<When>("upcoming");
  const [days, setDays] = useState<number>(7);

  // Economic
  const [econ, setEcon] = useState<EconEvent[]>([]);
  const [econLoading, setEconLoading] = useState(true);
  const [econError, setEconError] = useState<string | null>(null);

  // Earnings (favorites only in Terminal)
  const [favorites, setFavorites] = useState<string[]>([]);
  const [earn, setEarn] = useState<EarnRow[]>([]);
  const [earnLoading, setEarnLoading] = useState(true);
  const [earnError, setEarnError] = useState<string | null>(null);

  useEffect(() => {
    setFavorites(getFavorites());
    syncFromServer().then(setFavorites);
  }, []);

  // Load economic — always high-impact, US only
  useEffect(() => {
    if (tab !== "economic") return;
    setEconLoading(true);
    setEconError(null);
    fetch(`/api/calendar?mode=${when}&days=${days}&country=US`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) throw new Error(d.error || "calendar unavailable");
        setEcon(d.events || []);
      })
      .catch((e) => setEconError(String(e)))
      .finally(() => setEconLoading(false));
  }, [tab, when, days]);

  // Load earnings for favorites
  useEffect(() => {
    if (tab !== "earnings") return;
    setEarnLoading(true);
    setEarnError(null);
    if (favorites.length === 0) {
      setEarn([]);
      setEarnLoading(false);
      return;
    }
    const window = Math.max(days, 30);
    const url =
      when === "upcoming"
        ? `/api/earnings?days=${window}&tickers=${encodeURIComponent(favorites.join(","))}`
        : `/api/earnings?mode=recent&days=${window}&tickers=${encodeURIComponent(favorites.join(","))}`;
    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) throw new Error(d.error || "earnings unavailable");
        setEarn(when === "upcoming" ? d.upcoming || [] : d.recent || []);
      })
      .catch((e) => setEarnError(String(e)))
      .finally(() => setEarnLoading(false));
  }, [tab, when, favorites, days]);

  // Publish current-view data to JIM
  useEffect(() => {
    const label = when === "upcoming" ? "Upcoming" : "Latest";
    const summary =
      tab === "economic"
        ? `Economic calendar · ${label} · ${econ.length} high-impact US events (${days} days).`
        : `Earnings calendar · ${label} · ${earn.length} report(s) for favorites (${favorites.length} tickers).`;
    publishScreenData(
      "calendar",
      summary,
      tab === "economic" ? econ.slice(0, 25) : earn.slice(0, 25),
      {
        briefing: summary,
        suggestions: [
          "What's the highest-impact event this week?",
          "How did the last CPI print land vs. consensus?",
          "Any of my favorites reporting in the next 5 days?",
        ],
      }
    );
  }, [tab, when, econ, earn, favorites.length, days]);

  return (
    <div className="screen">
      <div className="crumb">Market › <b>Calendar</b><BackToVisao go={go} /></div>

      <div className="flex between wrap" style={{ alignItems: "baseline", marginBottom: 10 }}>
        <div>
          <div className="h1">Calendar</div>
          <div className="sub" style={{ margin: 0 }}>
            High-impact US macro + earnings for your favorites. Click any row to open Nasdaq for the full write-up.
          </div>
        </div>
        <div className="flex" style={{ gap: 10, alignItems: "center" }}>
          <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            When
            <select className="input" value={when} onChange={(e) => setWhen(e.target.value as When)}>
              <option value="upcoming">Upcoming</option>
              <option value="latest">Latest</option>
            </select>
          </label>
          <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            Window
            <select className="input" value={days} onChange={(e) => setDays(Number(e.target.value))}>
              <option value={3}>{when === "upcoming" ? "Next 3 days" : "Last 3 days"}</option>
              <option value={7}>{when === "upcoming" ? "Next 7 days" : "Last 7 days"}</option>
              <option value={14}>{when === "upcoming" ? "Next 14 days" : "Last 14 days"}</option>
              <option value={30}>{when === "upcoming" ? "Next 30 days" : "Last 30 days"}</option>
            </select>
          </label>
        </div>
      </div>

      <div className="flex" style={{ gap: 6, marginBottom: 12 }}>
        <button className={`btn ${tab === "economic" ? "" : "ghost"}`} onClick={() => setTab("economic")}>
          <i className="ti ti-calendar-event" /> Economic
        </button>
        <button className={`btn ${tab === "earnings" ? "" : "ghost"}`} onClick={() => setTab("earnings")}>
          <i className="ti ti-report-money" /> Earnings · {favorites.length} favorites
        </button>
      </div>

      {tab === "economic" && (
        <div className="card">
          <div className="flex between" style={{ marginBottom: 10 }}>
            <div className="muted" style={{ fontSize: 12 }}>
              {when === "upcoming"
                ? "Upcoming CPI · NFP · FOMC · GDP · PCE · Retail Sales · Jobless Claims · ISM · ADP"
                : "Most recent US releases already published (with the actual print)"}
            </div>
            <div className="muted" style={{ fontSize: 11 }}>{econ.length} events</div>
          </div>
          {econLoading ? (
            <div className="muted" style={{ padding: 24, textAlign: "center" }}>Loading…</div>
          ) : econError ? (
            <div className="placeholder"><i className="ti ti-cloud-off" /><b>Calendar unavailable</b><div className="muted mt">{econError}</div></div>
          ) : econ.length === 0 ? (
            <div className="placeholder"><i className="ti ti-calendar-off" /><b>No high-impact US events in this window</b><div className="muted mt">Try widening it.</div></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Event</th>
                  <th className="num">Consensus</th>
                  <th className="num">Previous</th>
                  <th className="num">Actual</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {econ.map((e, i) => (
                  <tr key={`${e.datetime}-${i}`} onClick={() => openSource(e.source_url)} style={rowLink(e.source_url)} title={e.source_url ? "Open on Nasdaq" : undefined}>
                    <td>{e.date}</td>
                    <td>{e.time || "—"}</td>
                    <td style={{ color: "var(--tx)" }}>{e.event}</td>
                    <td className="num">{e.forecast || "—"}</td>
                    <td className="num" style={{ color: "var(--tx3)" }}>{e.previous || "—"}</td>
                    <td className="num" style={{ color: e.actual ? "var(--green)" : "var(--tx3)" }}>{e.actual || "—"}</td>
                    <td style={{ color: "var(--tx3)" }}>{e.source_url && <i className="ti ti-external-link" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "earnings" && (
        <div className="card">
          {favorites.length === 0 ? (
            <div className="placeholder">
              <i className="ti ti-star-off" />
              <b>No favorites yet</b>
              <div className="muted mt">Star a ticker on any Market screen (Quotes, Chart, Screener) to see its earnings date here.</div>
            </div>
          ) : earnLoading ? (
            <div className="muted" style={{ padding: 24, textAlign: "center" }}>Loading…</div>
          ) : earnError ? (
            <div className="placeholder"><i className="ti ti-cloud-off" /><b>Earnings feed unavailable</b><div className="muted mt">{earnError}</div></div>
          ) : earn.length === 0 ? (
            <div className="placeholder">
              <i className="ti ti-calendar-check" />
              <b>{when === "upcoming" ? `No earnings scheduled for your favorites in the next ${Math.max(days, 30)} days` : `No earnings reported by your favorites in the last ${Math.max(days, 30)} days`}</b>
              <div className="muted mt">Nasdaq publishes the earnings calendar ~45 days ahead.</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Ticker</th>
                  <th>Company</th>
                  <th className="num">EPS consensus</th>
                  {when === "latest" ? (
                    <>
                      <th className="num">EPS reported</th>
                      <th className="num">Surprise</th>
                    </>
                  ) : (
                    <>
                      <th>Fiscal quarter</th>
                      <th className="num">Last year EPS</th>
                    </>
                  )}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {earn.map((r) => {
                  const surp = fmtSurprise(r.surprise_pct);
                  return (
                    <tr key={`${r.date}-${r.symbol}`} onClick={() => openSource(r.source_url)} style={rowLink(r.source_url)} title={r.source_url ? `Open ${r.symbol}` : undefined}>
                      <td style={{ color: "var(--gold)", fontWeight: 600 }}>{fmtDate(r.date)}</td>
                      <td>{fmtTime(r.time)}</td>
                      <td style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>{r.symbol}</td>
                      <td style={{ color: "var(--tx2)" }}>{r.name || "—"}</td>
                      <td className="num">{r.eps_forecast || "—"}</td>
                      {when === "latest" ? (
                        <>
                          <td className="num" style={{ color: r.eps_reported != null ? "var(--tx)" : "var(--tx3)" }}>{r.eps_reported ?? "—"}</td>
                          <td className="num" style={{ color: surp.color, fontWeight: 600 }}>{surp.text}</td>
                        </>
                      ) : (
                        <>
                          <td>{r.fiscal_quarter_ending || "—"}</td>
                          <td className="num" style={{ color: "var(--tx3)" }}>{r.last_year_eps || "—"}</td>
                        </>
                      )}
                      <td style={{ color: "var(--tx3)" }}>{r.source_url && <i className="ti ti-external-link" />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

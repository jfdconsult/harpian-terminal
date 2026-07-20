"use client";
import { useEffect, useState } from "react";
import { GOV_API, fmtN, cotShortName } from "@/lib/data";
import { publishScreenData } from "@/lib/jim-data";

interface CotRow {
  date?: string;
  market?: string;
  spec_long: number;
  spec_short: number;
  spec_net?: number;
  comm_long: number;
  comm_short: number;
  comm_net?: number;
  open_interest: number;
  spec_net_pct_oi?: number;
  comm_net_pct_oi?: number;
}

const WEEKS_OPTIONS = [
  { k: 4, l: "4 weeks" },
  { k: 12, l: "12 weeks" },
  { k: 26, l: "6 months" },
  { k: 52, l: "1 year" },
];

// No DEMO_ROWS: previously, with gov-data down, this screen rendered 6
// fabricated COT rows (S&P, gold, 10Y) as if they were CFTC data. CFTC data
// or nothing — never fabricated data dressed up as official.

export default function CotLegacy() {
  const [data, setData] = useState<CotRow[]>([]);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [weeks, setWeeks] = useState(12);
  const [marketFilter, setMarketFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`${GOV_API}/api/cot/legacy?weeks=${weeks}`)
      .then((r) => r.json())
      .then((d: CotRow[]) => { setData(d); setOffline(false); setLoading(false); })
      .catch(() => { setData([]); setOffline(true); setLoading(false); });
  }, [weeks]);

  const markets = [...new Set(data.map((r) => r.market || ""))].filter(Boolean).sort();
  const filtered = marketFilter ? data.filter((r) => r.market === marketFilter) : data;

  // Publishes the raw CFTC data for the selected window to JIM.
  useEffect(() => {
    if (filtered.length === 0) return;
    publishScreenData(
      "cot-legacy",
      `Raw CFTC Legacy data (window: ${weeks} weeks${marketFilter ? `, market ${cotShortName(marketFilter)}` : ", all markets"}). Each row = date, market, Spec Net, Comm Net (and % of Open Interest), longs/shorts by group, and Open Interest.`,
      filtered.slice(0, 60).map((x) => ({
        data: x.date, mercado: cotShortName(x.market || ""),
        specNet: x.spec_net ?? (x.spec_long - x.spec_short),
        commNet: x.comm_net ?? (x.comm_long - x.comm_short),
        openInterest: x.open_interest,
      })),
      {
        briefing:
          `You're looking at raw CFTC data for ${markets.length} markets (${filtered.length} records, ${weeks}-week window). ` +
          `Spec Net = speculators' net position; Comm Net = hedgers'.`,
        suggestions: [
          "Which market moved the most this week?",
          "How do I read Spec Net vs Comm Net?",
          "What does the open interest indicate here?",
        ],
      }
    );
  }, [filtered, weeks, marketFilter, markets.length]);

  return (
    <div className="screen">
      <div className="flex between wrap" style={{ alignItems: "flex-start", gap: 10 }}>
        <div className="flex" style={{ alignItems: "baseline", gap: 14, flexWrap: "wrap", flex: 1 }}>
          <div className="h1" style={{ margin: 0 }}>COT Data Explorer</div>
          <div className="sub" style={{ margin: 0 }}>
            Raw CFTC · Long/Short positions by group · Net and % of Open Interest.
            {offline && <span style={{ color: "var(--orange)", marginLeft: 8 }}> — gov-data offline (8877)</span>}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex wrap mt" style={{ gap: 10, marginBottom: 10, alignItems: "center" }}>
        <div className="flex" style={{ gap: 6, alignItems: "center" }}>
          <span className="flabel">Period:</span>
          <div className="seg" style={{ margin: 0 }}>
            {WEEKS_OPTIONS.map((w) => (
              <span key={w.k} className={weeks === w.k ? "on" : ""} onClick={() => setWeeks(w.k)}>{w.l}</span>
            ))}
          </div>
        </div>
        <div className="flex" style={{ gap: 6, alignItems: "center" }}>
          <span className="flabel">Market:</span>
          <select className="fsel" value={marketFilter} onChange={(e) => setMarketFilter(e.target.value)} style={{ fontSize: 12, padding: "6px 10px", minWidth: 180 }}>
            <option value="">All markets ({markets.length})</option>
            {markets.map((m) => <option key={m} value={m}>{cotShortName(m)}</option>)}
          </select>
        </div>
        <span className="muted" style={{ fontSize: 10, marginLeft: "auto" }}>{filtered.length} records</span>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="muted" style={{ padding: 30, textAlign: "center" }}>Loading CFTC data…</div>
        ) : offline || !filtered.length ? (
          <div className="placeholder">
            <i className="ti ti-cloud-off" />
            <b style={{ display: "block", marginTop: 8 }}>
              {offline ? "Could not fetch CFTC data" : "No records in the current filter"}
            </b>
            <div className="muted" style={{ marginTop: 4 }}>
              {offline
                ? <>gov-data offline — <span style={{ fontFamily: "var(--mono)" }}>api_server.py</span> (port 8877). I'd rather show nothing than show data that didn't come from the CFTC.</>
                : "Try another market or period."}
            </div>
          </div>
        ) : (
        <div style={{ maxHeight: 600, overflow: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Market</th>
                <th className="num" style={{ color: "#4A90D9" }}>Spec Net</th>
                <th className="num" style={{ color: "#4A90D9", fontSize: 10 }}>% OI</th>
                <th className="num" style={{ color: "#C9A02C" }}>Comm Net</th>
                <th className="num" style={{ color: "#C9A02C", fontSize: 10 }}>% OI</th>
                <th className="num">Spec Long</th>
                <th className="num">Spec Short</th>
                <th className="num">Comm Long</th>
                <th className="num">Comm Short</th>
                <th className="num">Open Interest</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((x, i) => {
                const specNet = x.spec_net ?? (x.spec_long - x.spec_short);
                const commNet = x.comm_net ?? (x.comm_long - x.comm_short);
                const oi = x.open_interest || 1;
                const specPct = x.spec_net_pct_oi ?? Math.round((specNet / oi) * 1000) / 10;
                const commPct = x.comm_net_pct_oi ?? Math.round((commNet / oi) * 1000) / 10;

                return (
                  <tr key={i}>
                    <td style={{ color: "var(--tx3)", fontFamily: "var(--mono)", fontSize: 11 }}>{x.date || "—"}</td>
                    <td style={{ color: "var(--tx)", fontWeight: 600, fontSize: 12 }}>{cotShortName(x.market || "")}</td>
                    <td className="num" style={{ color: specNet >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600 }}>{specNet >= 0 ? "+" : ""}{fmtN(specNet)}</td>
                    <td className="num" style={{ color: specNet >= 0 ? "var(--green)" : "var(--red)", fontSize: 10 }}>{specPct >= 0 ? "+" : ""}{specPct.toFixed(1)}%</td>
                    <td className="num" style={{ color: commNet >= 0 ? "#C9A02C" : "#E67E22", fontWeight: 600 }}>{commNet >= 0 ? "+" : ""}{fmtN(commNet)}</td>
                    <td className="num" style={{ color: commNet >= 0 ? "#C9A02C" : "#E67E22", fontSize: 10 }}>{commPct >= 0 ? "+" : ""}{commPct.toFixed(1)}%</td>
                    <td className="num" style={{ color: "var(--tx2)" }}>{fmtN(x.spec_long)}</td>
                    <td className="num" style={{ color: "var(--tx2)" }}>{fmtN(x.spec_short)}</td>
                    <td className="num" style={{ color: "var(--tx2)" }}>{fmtN(x.comm_long)}</td>
                    <td className="num" style={{ color: "var(--tx2)" }}>{fmtN(x.comm_short)}</td>
                    <td className="num" style={{ color: "var(--tx2)" }}>{fmtN(x.open_interest)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>

      <div className="legend mt">
        <i><b style={{ background: "#4A90D9" }} />Speculators (Non-Commercial)</i>
        <i><b style={{ background: "#C9A02C" }} />Commercials (Commercial)</i>
        <span className="muted" style={{ marginLeft: "auto" }}>CFTC Legacy Futures · public data</span>
      </div>
    </div>
  );
}

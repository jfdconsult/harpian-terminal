"use client";
import { useEffect, useState } from "react";
import { GOV_API, fmtUSD, fmtPct } from "@/lib/data";
import { publishScreenData } from "@/lib/jim-data";
import BackToVisao from "../BackToVisao";
import type { ScreenId } from "@/lib/nav";

interface ScreenerRow {
  symbol: string;
  name?: string;
  price?: number;
  change_pct?: number;
  market_cap?: number;
  pe?: number;
  roe?: number;
  profit_margin?: number;
  revenue_growth?: number;
  debt_equity?: number;
  sector?: string;
}
interface ScreenerResponse { rows: ScreenerRow[]; n: number; universe_size?: number; collected_at?: string; source?: string; }

export default function Screener({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const [rows, setRows] = useState<ScreenerRow[]>([]);
  const [meta, setMeta] = useState<ScreenerResponse | null>(null);
  const [offline, setOffline] = useState(false);
  const [minPe, setMinPe] = useState("");
  const [maxPe, setMaxPe] = useState("");
  const [minRoe, setMinRoe] = useState("");
  const [sector, setSector] = useState("");

  const load = () => {
    const params = new URLSearchParams();
    if (minPe) params.set("min_pe", minPe);
    if (maxPe) params.set("max_pe", maxPe);
    if (minRoe) params.set("min_roe", minRoe);
    if (sector) params.set("sector", sector);
    fetch(`${GOV_API}/api/screener?${params}`)
      .then((r) => r.json())
      .then((d: ScreenerResponse) => { setRows(d.rows || []); setMeta(d); setOffline(false); })
      .catch(() => setOffline(true));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sectors = Array.from(new Set(rows.map((r) => r.sector).filter(Boolean))) as string[];

  useEffect(() => {
    if (!rows.length) return;
    publishScreenData(
      "screener",
      `US fundamentals screener (Yahoo Finance) — ${rows.length} tickers from the curated universe (${meta?.universe_size || "?"} total). Columns: price, %chg, market cap, P/E, ROE, net margin, revenue growth, debt/equity.`,
      { rows: rows.slice(0, 40) },
      {
        briefing: `US screener with ${rows.length} tickers visible. Source: ${meta?.source || "Yahoo Finance"}.`,
        suggestions: ["Which tickers have P/E below 15 and ROE above 20%?", "Which sector is cheapest right now?"],
      }
    );
  }, [rows, meta]);

  return (
    <div className="screen">
      <div className="crumb">Market › <b>Screener</b><BackToVisao go={go} /></div>
      <div className="h1">Screener</div>
      <div className="sub">Finviz / StockAnalysis.com equivalent · Fundamentals for the curated universe of liquid US tickers (Yahoo Finance).</div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "14px 0", flexWrap: "wrap" }}>
        <span className="flabel">P/E min:</span>
        <input className="fsel" style={{ width: 70, fontSize: 12, padding: "6px 8px" }} value={minPe} onChange={(e) => setMinPe(e.target.value)} />
        <span className="flabel">P/E max:</span>
        <input className="fsel" style={{ width: 70, fontSize: 12, padding: "6px 8px" }} value={maxPe} onChange={(e) => setMaxPe(e.target.value)} />
        <span className="flabel">ROE min:</span>
        <input className="fsel" style={{ width: 70, fontSize: 12, padding: "6px 8px" }} placeholder="0.15" value={minRoe} onChange={(e) => setMinRoe(e.target.value)} />
        <span className="flabel">Sector:</span>
        <select className="fsel" style={{ fontSize: 12, padding: "6px 10px" }} value={sector} onChange={(e) => setSector(e.target.value)}>
          <option value="">All</option>
          {sectors.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
        <button className="btn ghost" style={{ padding: "6px 14px", fontSize: 11 }} onClick={load}>Apply</button>
        <span style={{ fontSize: 11, color: "var(--tx3)", marginLeft: "auto" }}>{meta?.collected_at ? `Updated: ${meta.collected_at}` : ""}</span>
      </div>

      {offline ? (
        <div className="placeholder">gov-data API offline. Run <b>python api_server.py</b> (port 8877) and <b>python loaders/us_screener.py</b> to see the real data.</div>
      ) : (
        <div className="card">
          <h3>{rows.length} tickers{meta?.universe_size ? ` of ${meta.universe_size}` : ""}</h3>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Ticker</th><th>Name</th><th className="num">Price</th><th className="num">%Chg</th>
                  <th className="num">Market Cap</th><th className="num">P/E</th><th className="num">ROE</th>
                  <th className="num">Margin</th><th className="num">Rev. Growth</th><th className="num">D/E</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.symbol} style={{ cursor: "pointer" }} onClick={() => go("snowflake", r.symbol)}>
                    <td style={{ fontWeight: 700, color: "var(--gold)" }}>{r.symbol}</td>
                    <td style={{ color: "var(--tx2)" }}>{r.name || "—"}</td>
                    <td className="num">{r.price != null ? "$" + r.price.toFixed(2) : "—"}</td>
                    <td className={"num " + (r.change_pct != null ? (r.change_pct >= 0 ? "pos" : "neg") : "")}>
                      {r.change_pct != null ? r.change_pct.toFixed(2) + "%" : "—"}
                    </td>
                    <td className="num">{r.market_cap != null ? fmtUSD(r.market_cap) : "—"}</td>
                    <td className="num">{r.pe != null ? r.pe.toFixed(1) : "—"}</td>
                    <td className="num">{fmtPct(r.roe)}</td>
                    <td className="num">{fmtPct(r.profit_margin)}</td>
                    <td className="num">{fmtPct(r.revenue_growth)}</td>
                    <td className="num">{r.debt_equity != null ? r.debt_equity.toFixed(0) + "%" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

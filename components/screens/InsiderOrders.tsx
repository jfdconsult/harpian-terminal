"use client";
import { useState, useEffect } from "react";
import { GOV_API, fmtN, fmtUSD } from "@/lib/data";
import { publishScreenData } from "@/lib/jim-data";
import BackToVisao from "../BackToVisao";
import type { ScreenId } from "@/lib/nav";

// REAL SEC Form 4, via gov-data /api/insider (api_server.py :8877).
// This screen used to render a fixed array (IO_DATA) with MADE-UP
// transactions attributed to real executives, with no warning that it
// was an example. If the API goes down, this screen shows an error —
// never fabricated data.

interface InsiderOrder {
  issuer: string;
  ticker: string;
  owner: string;
  role: string;
  accession: string;
  date: string;
  side: "BUY" | "SELL";
  shares: number;
  price: number;
  value_usd: number;
}
interface InsiderResp {
  orders: InsiderOrder[];
  n: number;
  total: number;
  collected_at?: string;
  source?: string;
}

// Link to the original filing on EDGAR: the manager can audit every row.
function edgarUrl(accession: string): string {
  const clean = accession.replace(/-/g, "");
  return `https://www.sec.gov/Archives/edgar/data/${clean}/${accession}-index.htm`;
}

export default function InsiderOrders({ go }: { go?: (id: ScreenId, param?: string) => void }) {
  const [side, setSide] = useState("all");
  const [role, setRole] = useState("all");
  const [data, setData] = useState<InsiderResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    setLoading(true);
    setErr(false);
    fetch(`${GOV_API}/api/insider`)
      .then((r) => r.json())
      .then((d: InsiderResp) => { setData(d); setLoading(false); })
      .catch(() => { setErr(true); setLoading(false); });
  }, []);

  const all = data?.orders || [];
  const roles = Array.from(new Set(all.map((x) => x.role))).sort();
  const items = all.filter((x) => {
    if (side !== "all" && x.side !== side) return false;
    if (role !== "all" && x.role !== role) return false;
    return true;
  });

  useEffect(() => {
    if (!items.length) return;
    const buys = items.filter((x) => x.side === "BUY").length;
    const sells = items.length - buys;
    const topBuy = items.find((x) => x.side === "BUY");
    publishScreenData(
      "insider-orders",
      "Insider & Executive Orders (SEC Form 4, real data from EDGAR via gov-data): insider buys and sells. Each row = date, insider, role, company, ticker, side (BUY/SELL), number of shares, price, and value in USD, with the accession of the original filing.",
      items.map((x) => ({
        date: x.date, insider: x.owner, role: x.role, company: x.issuer,
        ticker: x.ticker, side: x.side, shares: x.shares, price: x.price,
        valueUSD: x.value_usd, accession: x.accession,
      })),
      {
        briefing:
          `You're looking at ${items.length} insider filing(s) (SEC Form 4, real data): **${buys} buy(s)** and **${sells} sell(s)**. ` +
          `An insider buy is usually a signal — nobody buys their own stock by accident. A sell is more ambiguous: it can be just personal diversification or a scheduled 10b5-1 plan.`,
        suggestions: [
          "What were the insider buys?",
          topBuy ? `What does the buy in ${topBuy.ticker} signal?` : "Is an insider buy a bullish signal?",
          "Any executive selling heavily?",
        ],
      }
    );
  }, [items]);

  return (
    <div className="screen">
      <div className="flex between wrap" style={{ alignItems: "flex-start", gap: 10 }}>
        <div className="flex" style={{ alignItems: "baseline", gap: 14, flexWrap: "wrap", flex: 1 }}>
          <div className="h1" style={{ margin: 0 }}>Insider &amp; Executive Orders</div>
          <div className="sub" style={{ margin: 0 }}>
            SEC Form 4 · buys/sells by officers, executives, and 10%+ shareholders — straight from EDGAR. Click a row for the filing.
          </div>
        </div>
        <BackToVisao go={go} />
        {data?.collected_at && (
          <div className="eodlabel"><i className="ti ti-clock" />
            {data.source || "SEC EDGAR"} · collected {new Date(data.collected_at).toLocaleString("en-US")}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "14px 0", alignItems: "center" }}>
        <span className="flabel">Side:</span>
        <select className="fsel" value={side} onChange={(e) => setSide(e.target.value)}>
          <option value="all">All</option>
          <option value="BUY">Buys</option>
          <option value="SELL">Sells</option>
        </select>
        <select className="fsel" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="all">All roles</option>
          {roles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 9, color: "var(--tx3)" }}>
          {items.length} of {data?.total ?? all.length} filing{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="card">
        {loading ? (
          <div className="muted" style={{ padding: 30, textAlign: "center" }}>Loading filings from EDGAR…</div>
        ) : err ? (
          <div className="placeholder">
            <i className="ti ti-cloud-off" />
            <b style={{ display: "block", marginTop: 8 }}>Could not fetch the filings</b>
            <div className="muted" style={{ marginTop: 4 }}>
              gov-data offline — <span style={{ fontFamily: "var(--mono)" }}>api_server.py</span> (port 8877).
              Better to show nothing than to show data that didn't come from the SEC.
            </div>
          </div>
        ) : !items.length ? (
          <div className="placeholder">
            <i className="ti ti-file-off" />
            <b style={{ display: "block", marginTop: 8 }}>No filings match the current filter</b>
            <div className="muted" style={{ marginTop: 4 }}>No matching Form 4 in the collected period.</div>
          </div>
        ) : (
          <div style={{ maxHeight: 600, overflow: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Insider</th><th>Role</th><th>Company</th><th>Ticker</th>
                  <th style={{ textAlign: "center" }}>Side</th>
                  <th className="num">Shares</th><th className="num">Price</th><th className="num">Value (USD)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((x, i) => {
                  const tc = x.side === "BUY" ? "var(--green)" : "var(--red)";
                  return (
                    <tr key={`${x.accession}-${i}`} style={{ cursor: "pointer" }}
                      title={`Abrir filing ${x.accession} na SEC EDGAR`}
                      onClick={() => window.open(edgarUrl(x.accession), "_blank", "noopener,noreferrer")}>
                      <td style={{ color: "var(--tx3)" }}>{x.date}</td>
                      <td style={{ fontWeight: 600, color: "var(--tx)" }}>{x.owner}</td>
                      <td style={{ color: "var(--tx2)" }}>{x.role}</td>
                      <td style={{ color: "var(--tx2)" }}>{x.issuer}</td>
                      <td style={{ fontWeight: 600, color: "var(--gold)" }}>{x.ticker}</td>
                      <td style={{ textAlign: "center", fontWeight: 700, color: tc }}>{x.side === "BUY" ? "Buy" : "Sell"}</td>
                      <td className="num" style={{ color: "var(--tx2)" }}>{fmtN(x.shares)}</td>
                      <td className="num" style={{ color: "var(--tx2)" }}>{x.price != null ? "$" + x.price.toFixed(2) : "—"}</td>
                      <td className="num" style={{ color: tc, fontWeight: 600 }}>{fmtUSD(x.value_usd)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="muted mt">
          Source: SEC EDGAR (Form 4), collected by gov-data. Each row is a publicly auditable filing —
          click to open the original document on the SEC.
        </div>
      </div>
    </div>
  );
}

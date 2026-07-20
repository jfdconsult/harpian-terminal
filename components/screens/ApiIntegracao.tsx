"use client";
import { useState } from "react";

interface Endpoint { m: string; path: string; desc: string }
interface Collection { name: string; base: string; tag: string; note: string; endpoints: Endpoint[] }

const COLLECTIONS: Collection[] = [
  {
    name: "Gov Data · SEC 13F + CFTC COT", base: "http://localhost:8877", tag: "connected",
    note: "Institutional holdings (Form 13F) and futures positioning (COT). gov-data pipeline.",
    endpoints: [
      { m: "GET", path: "/api/funds", desc: "Lists watchlist funds with available periods" },
      { m: "GET", path: "/api/fund/{SHORT}", desc: "Full holdings for a fund (e.g. BRIDGEWATER)" },
      { m: "GET", path: "/api/fund/{SHORT}/top/{N}", desc: "Fund's top N positions" },
      { m: "GET", path: "/api/cot/sentiment", desc: "Sentiment by market (speculator vs. commercial)" },
      { m: "GET", path: "/api/cot/legacy", desc: "COT Legacy — long/short by category" },
    ],
  },
  {
    name: "Market · Yahoo Finance (current source)", base: "(this terminal · /api)", tag: "connected",
    note: "Quotes, metrics and candles served server-side. Swappable for FastTrack without changing the contract.",
    endpoints: [
      { m: "GET", path: "/api/quotes?symbols=^GSPC,NVDA", desc: "Multi-symbol snapshot: price, windows, Sharpe, risk" },
      { m: "GET", path: "/api/asset?symbol=NVDA", desc: "Metrics + base-100 series for an asset vs. S&P" },
      { m: "GET", path: "/api/candles?symbol=NVDA&range=1y&interval=1d", desc: "OHLC + volume for candlestick" },
    ],
  },
];

const EXAMPLES: Record<string, string> = {
  curl: `curl "http://localhost:8877/api/cot/sentiment"

curl "http://localhost:8950/api/candles?symbol=NVDA&range=6mo&interval=1d"`,
  js: `const r = await fetch(
  "/api/candles?symbol=NVDA&range=6mo&interval=1d"
);
const { candles } = await r.json();
// candles: [{ time, open, high, low, close }, ...]`,
  python: `import requests
r = requests.get("http://localhost:8877/api/fund/BRIDGEWATER")
print(r.json()["num_holdings"])`,
};

export default function ApiIntegracao() {
  const [tab, setTab] = useState<"curl" | "js" | "python">("curl");
  const [copied, setCopied] = useState(false);

  const copy = (t: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(t).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
    }
  };

  return (
    <div className="screen">
      <div className="flex" style={{ alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <div className="h1" style={{ margin: 0 }}>API &amp; Integration</div>
        <div className="sub" style={{ margin: 0 }}>REST endpoints to integrate the Terminal&apos;s data into MFO systems, spreadsheets, or in-house apps.</div>
      </div>

      <div className="grid g4 mb">
        <div className="card" style={{ textAlign: "center", padding: 14 }}><div className="big" style={{ fontSize: 22, color: "var(--gold)" }}>REST</div><div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 4, textTransform: "uppercase", letterSpacing: ".5px" }}>Architecture</div></div>
        <div className="card" style={{ textAlign: "center", padding: 14 }}><div className="big" style={{ fontSize: 22, color: "var(--gold)" }}>JSON</div><div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 4, textTransform: "uppercase", letterSpacing: ".5px" }}>Format</div></div>
        <div className="card" style={{ textAlign: "center", padding: 14 }}><div className="big" style={{ fontSize: 22, color: "var(--gold)" }}>8</div><div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 4, textTransform: "uppercase", letterSpacing: ".5px" }}>Endpoints</div></div>
        <div className="card" style={{ textAlign: "center", padding: 14 }}><div className="big" style={{ fontSize: 22, color: "var(--orange)" }}>API Key</div><div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 4, textTransform: "uppercase", letterSpacing: ".5px" }}>Auth (phase 2)</div></div>
      </div>

      {COLLECTIONS.map((col) => (
        <div className="card mb" key={col.name}>
          <div className="flex between mb">
            <h3 style={{ margin: 0 }}><i className="ti ti-plug-connected" />{col.name}</h3>
            <span className="tag g">{col.tag}</span>
          </div>
          <div className="kv"><span className="muted">Base URL</span><span className="v" style={{ color: "var(--gold)" }}>{col.base}</span></div>
          <div className="muted" style={{ margin: "6px 0 12px", fontSize: 12, lineHeight: 1.5 }}>{col.note}</div>
          <table>
            <thead><tr><th style={{ width: 60 }}>Method</th><th>Endpoint</th><th>Description</th></tr></thead>
            <tbody>
              {col.endpoints.map((e) => (
                <tr key={e.path}>
                  <td><span className="tag b">{e.m}</span></td>
                  <td style={{ color: "var(--tx)", fontFamily: "var(--mono)", fontSize: 11.5 }}>{e.path}</td>
                  <td style={{ color: "var(--tx2)" }}>{e.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="card mb">
        <div className="flex between mb">
          <h3 style={{ margin: 0 }}><i className="ti ti-code" />Usage example</h3>
          <button className="btn ghost" onClick={() => copy(EXAMPLES[tab])}>
            <i className={`ti ${copied ? "ti-check" : "ti-copy"}`} />{copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="seg" style={{ marginBottom: 12 }}>
          <span className={tab === "curl" ? "on" : ""} onClick={() => setTab("curl")}>cURL</span>
          <span className={tab === "js" ? "on" : ""} onClick={() => setTab("js")}>JavaScript</span>
          <span className={tab === "python" ? "on" : ""} onClick={() => setTab("python")}>Python</span>
        </div>
        <pre style={{ background: "#05090F", border: "1px solid var(--line2)", borderRadius: 8, padding: "14px 16px", overflowX: "auto", fontFamily: "var(--mono)", fontSize: 12, color: "var(--tx2)", lineHeight: 1.6, margin: 0 }}>{EXAMPLES[tab]}</pre>
      </div>

      <div className="card" style={{ background: "transparent", borderStyle: "dashed" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <i className="ti ti-shield-lock" style={{ color: "var(--gold)", fontSize: 15, flexShrink: 0, marginTop: 2 }} />
          <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.6 }}>
            <b style={{ color: "var(--tx2)" }}>Authentication roadmap:</b> today the endpoints run locally without a key. Phase 2 brings per-client API keys, rate limiting, and webhooks — so MFOs can consume Terminal data securely in production.
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { GOV_API, fmtN } from "@/lib/data";

interface CotMarket {
  market: string;
  spec_sentiment: string;
  spec_net: number;
  spec_net_pct_oi?: number;
  comm_net: number;
  open_interest: number;
}

const COLORS: Record<string, string> = {
  EXTREME_LONG: "#27ae60",
  BULLISH: "#2ecc71",
  NEUTRAL: "#7a8baa",
  BEARISH: "#e67e22",
  EXTREME_SHORT: "#e74c3c",
};

export default function CotSentiment() {
  const [data, setData] = useState<CotMarket[]>([]);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    fetch(`${GOV_API}/api/cot/sentiment`)
      .then((r) => r.json())
      .then((d: CotMarket[]) => { setData(d); setOffline(false); })
      .catch(() => setOffline(true));
  }, []);

  return (
    <div className="screen">
      <div className="crumb">Intelligence › <b>COT Sentiment</b></div>
      <div className="h1">Futures Sentiment</div>
      <div className="sub">CFTC Commitments of Traders · Posicionamento especulador vs comercial.</div>

      {offline ? (
        <div className="placeholder">API gov-data offline. Rode <b>python api_server.py</b> (porta 8877).</div>
      ) : (
        <div className="grid g3" style={{ marginTop: 14 }}>
          {data.map((m, i) => (
            <div className="card" key={i}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--tx)", marginBottom: 6 }}>{m.market}</div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 3, background: COLORS[m.spec_sentiment] || "#7a8baa", color: "#fff" }}>{m.spec_sentiment}</span>
              <div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 6 }}>Spec Net: {fmtN(m.spec_net)} ({(m.spec_net_pct_oi || 0).toFixed(1)}% OI)</div>
              <div style={{ fontSize: 10, color: "var(--tx3)" }}>Comm Net: {fmtN(m.comm_net)} | OI: {fmtN(m.open_interest)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

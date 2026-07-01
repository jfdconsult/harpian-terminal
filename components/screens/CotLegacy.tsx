"use client";
import { useEffect, useState } from "react";
import { GOV_API, fmtN } from "@/lib/data";

interface CotRow {
  date?: string;
  market?: string;
  spec_long: number;
  spec_short: number;
  comm_long: number;
  comm_short: number;
  open_interest: number;
}

export default function CotLegacy() {
  const [data, setData] = useState<CotRow[]>([]);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    fetch(`${GOV_API}/api/cot/legacy?weeks=4`)
      .then((r) => r.json())
      .then((d: CotRow[]) => { setData(d); setOffline(false); })
      .catch(() => setOffline(true));
  }, []);

  return (
    <div className="screen">
      <div className="crumb">Intelligence › <b>COT Legacy</b></div>
      <div className="h1">COT Legacy</div>
      <div className="sub">Commercial vs Non-Commercial · Últimas 4 semanas.</div>

      {offline ? (
        <div className="placeholder">API gov-data offline. Rode <b>python api_server.py</b> (porta 8877).</div>
      ) : (
        <div className="card" style={{ marginTop: 14 }}>
          <div style={{ maxHeight: 500, overflow: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Market</th><th className="num">Spec Long</th><th className="num">Spec Short</th>
                  <th className="num">Comm Long</th><th className="num">Comm Short</th><th className="num">Open Interest</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 60).map((x, i) => (
                  <tr key={i}>
                    <td style={{ color: "var(--tx3)" }}>{x.date || "—"}</td>
                    <td style={{ color: "var(--tx)", fontWeight: 600 }}>{(x.market || "").substring(0, 35)}</td>
                    <td className="num pos">{fmtN(x.spec_long)}</td>
                    <td className="num neg">{fmtN(x.spec_short)}</td>
                    <td className="num pos">{fmtN(x.comm_long)}</td>
                    <td className="num neg">{fmtN(x.comm_short)}</td>
                    <td className="num" style={{ color: "var(--tx2)" }}>{fmtN(x.open_interest)}</td>
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

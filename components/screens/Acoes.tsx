"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ASSET_LIST } from "@/lib/market";
import { pctText, pctClass, num, numShort } from "@/lib/format";

const AssetChart = dynamic(() => import("./AssetChart"), { ssr: false });

interface AssetData {
  symbol: string; name: string; price: number;
  dayPct: number | null; ytdPct: number | null; yPct: number | null;
  sharpe: number | null; maxDD: number | null; rsi: number | null;
  w52: { lo: number; hi: number };
  points: { time: string; value: number }[];
  benchPoints: { time: string; value: number }[];
  benchName: string;
}

export default function Acoes() {
  const [symbol, setSymbol] = useState("NVDA");
  const [d, setD] = useState<AssetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    setLoading(true); setErr(false);
    fetch(`/api/asset?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((j) => { if (j.error) { setErr(true); } else { setD(j); } setLoading(false); })
      .catch(() => { setErr(true); setLoading(false); });
  }, [symbol]);

  return (
    <div className="screen">
      <div className="crumb">Mercado › <b>Ações &amp; índices US</b></div>
      <div className="flex between wrap">
        <div>
          <div className="h1">{d?.name || "—"}</div>
          <div className="sub" style={{ margin: 0 }}>{symbol.replace("^", "")} · US</div>
        </div>
        <div className="flex" style={{ gap: 10, alignItems: "center" }}>
          <select className="fsel" style={{ fontSize: 13, padding: "8px 12px" }} value={symbol} onChange={(e) => setSymbol(e.target.value)}>
            {ASSET_LIST.map((a) => <option key={a.symbol} value={a.symbol}>{a.name} ({a.symbol.replace("^", "")})</option>)}
          </select>
          <span className="eodlabel"><i className="ti ti-clock" />Yahoo · EOD</span>
        </div>
      </div>

      {err ? (
        <div className="placeholder mt"><i className="ti ti-cloud-off" /><b>Não foi possível buscar {symbol} no Yahoo</b></div>
      ) : (
        <>
          <div className="grid g4 mt mb">
            <div className="card"><div className="muted">Último</div><div className="big">{loading ? "…" : numShort(d?.price)}</div><div className={`muted ${pctClass(d?.dayPct)}`}>{loading ? "" : pctText(d?.dayPct) + " hoje"}</div></div>
            <div className="card"><div className="muted">YTD</div><div className={`big ${d && d.ytdPct != null && d.ytdPct >= 0 ? "g" : "r"}`}>{loading ? "…" : pctText(d?.ytdPct)}</div></div>
            <div className="card"><div className="muted">1 ano</div><div className={`big ${d && d.yPct != null && d.yPct >= 0 ? "g" : "r"}`}>{loading ? "…" : pctText(d?.yPct)}</div></div>
            <div className="card"><div className="muted">Sharpe (1A)</div><div className="big">{loading ? "…" : num(d?.sharpe, 2)}</div><div className="muted">rf 3,5%</div></div>
          </div>

          <div className="grid g3">
            <div className="card" style={{ gridColumn: "span 2" }}>
              <h3><i className="ti ti-chart-line" />Retorno total · base 100 (1 ano)</h3>
              {loading || !d ? (
                <div className="muted" style={{ padding: 60, textAlign: "center" }}>Carregando série do Yahoo…</div>
              ) : (
                <>
                  <AssetChart points={d.points} benchPoints={d.benchPoints} />
                  <div className="legend">
                    <i><b style={{ background: "#2ECC71" }} />{symbol.replace("^", "")}</i>
                    <i><b style={{ background: "#4A90D9" }} />S&amp;P 500</i>
                    <span className="muted" style={{ marginLeft: "auto" }}>Yahoo Finance · diário</span>
                  </div>
                </>
              )}
            </div>
            <div className="card">
              <h3><i className="ti ti-ruler-2" />Risco &amp; métricas</h3>
              <div className="kv"><span>Sharpe</span><span className="v">{num(d?.sharpe, 2)}</span></div>
              <div className="kv"><span>Max drawdown</span><span className="v" style={{ color: "var(--red)" }}>{pctText(d?.maxDD)}</span></div>
              <div className="kv"><span>RSI (14)</span><span className="v">{d?.rsi != null ? Math.round(d.rsi) : "—"}</span></div>
              <div className="kv"><span>52 semanas</span><span className="v">{d ? `${numShort(d.w52.lo)} – ${numShort(d.w52.hi)}` : "—"}</span></div>
              <div className="muted mt" style={{ fontSize: 11 }}>Métricas calculadas sobre 1 ano de dados do Yahoo Finance. Fundamentos (SEC EDGAR) entram à parte.</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

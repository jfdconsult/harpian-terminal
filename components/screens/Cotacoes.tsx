"use client";
import { useEffect, useState } from "react";
import { MARKET_GROUPS } from "@/lib/market";
import { pctText, pctClass, numShort, num } from "@/lib/format";

interface Quote {
  symbol: string; name?: string; price?: number;
  dayPct?: number | null; mPct?: number | null; ytdPct?: number | null; yPct?: number | null;
  sharpe?: number | null; error?: boolean;
}

export default function Cotacoes() {
  const groups = Object.keys(MARKET_GROUPS);
  const [tab, setTab] = useState(groups[0]);
  const [rows, setRows] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    setLoading(true); setErr(false);
    const syms = MARKET_GROUPS[tab].map((s) => s.symbol).join(",");
    fetch(`/api/quotes?symbols=${encodeURIComponent(syms)}`)
      .then((r) => r.json())
      .then((d: Quote[]) => { setRows(d); setLoading(false); })
      .catch(() => { setErr(true); setLoading(false); });
  }, [tab]);

  const nameOf = (sym: string) => MARKET_GROUPS[tab].find((s) => s.symbol === sym)?.name || sym;

  return (
    <div className="screen">
      <div className="crumb">Mercado › <b>Cotações</b></div>
      <div className="flex between wrap">
        <div><div className="h1">Cotações</div><div className="sub">Bolsa americana e índices — dados ao vivo do Yahoo Finance.</div></div>
        <div className="eodlabel"><i className="ti ti-clock" />Yahoo Finance · fechamento (EOD)</div>
      </div>
      <div className="seg">
        {groups.map((g) => <span key={g} className={tab === g ? "on" : ""} onClick={() => setTab(g)}>{g}</span>)}
      </div>
      <div className="card">
        {loading ? (
          <div className="muted" style={{ padding: 24, textAlign: "center" }}>Carregando cotações do Yahoo…</div>
        ) : err ? (
          <div className="placeholder"><i className="ti ti-cloud-off" /><b>Não foi possível buscar do Yahoo Finance</b></div>
        ) : (
          <table>
            <thead><tr>
              <th>Ticker</th><th>Nome</th><th className="num">Último</th><th className="num">Dia</th>
              <th className="num">1M</th><th className="num">YTD</th><th className="num">1A</th><th className="num">Sharpe</th>
            </tr></thead>
            <tbody>
              {rows.map((q) => (
                <tr key={q.symbol}>
                  <td style={{ color: "var(--gold)", fontWeight: 600 }}>{q.symbol.replace("^", "")}</td>
                  <td style={{ color: "var(--tx)" }}>{nameOf(q.symbol)}</td>
                  {q.error ? (
                    <td className="muted" colSpan={6}>indisponível</td>
                  ) : (
                    <>
                      <td className="num">{numShort(q.price)}</td>
                      <td className={`num ${pctClass(q.dayPct)}`}>{pctText(q.dayPct)}</td>
                      <td className={`num ${pctClass(q.mPct)}`}>{pctText(q.mPct)}</td>
                      <td className={`num ${pctClass(q.ytdPct)}`}>{pctText(q.ytdPct)}</td>
                      <td className={`num ${pctClass(q.yPct)}`}>{pctText(q.yPct)}</td>
                      <td className="num" style={{ color: "var(--tx2)" }}>{q.sharpe != null ? num(q.sharpe, 2) : "—"}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="muted mt">Retorno total (ajustado por dividendos) via Yahoo Finance. Sharpe calculado sobre 1 ano, rf 3,5%. Migração para FastTrack planejada.</div>
      </div>
    </div>
  );
}

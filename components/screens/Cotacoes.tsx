"use client";
import { useEffect, useMemo, useState } from "react";
import { MARKET_GROUPS } from "@/lib/market";
import { getFavorites, toggleFavorite } from "@/lib/favorites";
import { pctText, pctClass, numShort, num } from "@/lib/format";
import type { ScreenId } from "@/lib/nav";

interface Quote {
  symbol: string; name?: string; price?: number;
  dayPct?: number | null; mPct?: number | null; ytdPct?: number | null; yPct?: number | null;
  sharpe?: number | null; error?: boolean;
}

const FAV = "★ Favoritos";
// mapa símbolo → nome, de TODAS as classes (pra montar a aba de favoritos)
const NAME_OF: Record<string, string> = Object.values(MARKET_GROUPS).flat().reduce((m, s) => {
  m[s.symbol] = s.name; return m;
}, {} as Record<string, string>);

export default function Cotacoes({ go }: { go?: (id: ScreenId, param?: string) => void }) {
  const groups = Object.keys(MARKET_GROUPS);
  const [tab, setTab] = useState(FAV);
  const [favs, setFavs] = useState<string[]>([]);
  const [rows, setRows] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => { setFavs(getFavorites()); }, []);

  // símbolos da aba ativa
  const symbols = useMemo(() => tab === FAV ? favs : MARKET_GROUPS[tab].map((s) => s.symbol), [tab, favs]);

  useEffect(() => {
    if (symbols.length === 0) { setRows([]); setLoading(false); setErr(false); return; }
    setLoading(true); setErr(false);
    fetch(`/api/quotes?symbols=${encodeURIComponent(symbols.join(","))}`)
      .then((r) => r.json())
      .then((d: Quote[]) => { setRows(d); setLoading(false); })
      .catch(() => { setErr(true); setLoading(false); });
  }, [symbols]);

  function star(sym: string, e: React.MouseEvent) {
    e.stopPropagation();
    setFavs(toggleFavorite(sym));
  }

  return (
    <div className="screen">
      <div className="crumb">Mercado › <b>Cotações{tab === FAV ? " · Favoritos" : ` · ${tab}`}</b></div>
      <div className="flex between wrap">
        <div><div className="h1">Cotações</div><div className="sub">Ações, índices, ETFs, setores, commodities, cripto e câmbio — ao vivo do Yahoo. Clique num ativo para o gráfico · ★ marca favorito.</div></div>
        <div className="eodlabel"><i className="ti ti-clock" />Yahoo Finance · fechamento (EOD)</div>
      </div>
      <div className="seg" style={{ flexWrap: "wrap" }}>
        <span className={tab === FAV ? "on" : ""} onClick={() => setTab(FAV)} style={{ color: tab === FAV ? undefined : "var(--gold)" }}>{FAV}{favs.length ? ` (${favs.length})` : ""}</span>
        {groups.map((g) => <span key={g} className={tab === g ? "on" : ""} onClick={() => setTab(g)}>{g}</span>)}
      </div>
      <div className="card">
        {tab === FAV && favs.length === 0 ? (
          <div className="placeholder" style={{ padding: 40, textAlign: "center" }}>
            <i className="ti ti-star" style={{ fontSize: 30, color: "var(--gold)", opacity: .6 }} />
            <b style={{ display: "block", marginTop: 8 }}>Sua lista de favoritos está vazia</b>
            <div className="muted" style={{ marginTop: 4 }}>Abra qualquer classe (Ações, Cripto, Forex…) e clique na ★ pra montar sua lista.</div>
          </div>
        ) : loading ? (
          <div className="muted" style={{ padding: 24, textAlign: "center" }}>Carregando cotações do Yahoo…</div>
        ) : err ? (
          <div className="placeholder"><i className="ti ti-cloud-off" /><b>Não foi possível buscar do Yahoo Finance</b></div>
        ) : (
          <table>
            <thead><tr>
              <th style={{ width: 30 }}></th><th>Ticker</th><th>Nome</th><th className="num">Último</th><th className="num">Dia</th>
              <th className="num">1M</th><th className="num">YTD</th><th className="num">1A</th><th className="num">Sharpe</th><th style={{ width: 24 }}></th>
            </tr></thead>
            <tbody>
              {rows.map((q) => {
                const fav = favs.includes(q.symbol);
                return (
                  <tr key={q.symbol} style={{ cursor: go ? "pointer" : "default" }} onClick={() => go?.("acoes", q.symbol)}>
                    <td style={{ textAlign: "center" }} onClick={(e) => star(q.symbol, e)}>
                      <i className={`ti ${fav ? "ti-star-filled" : "ti-star"}`} style={{ fontSize: 15, color: fav ? "var(--gold)" : "var(--tx3)", cursor: "pointer" }} title={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"} />
                    </td>
                    <td style={{ color: "var(--gold)", fontWeight: 600 }}>{q.symbol.replace("^", "").replace("=X", "").replace("=F", "")}</td>
                    <td style={{ color: "var(--tx)" }}>{NAME_OF[q.symbol] || q.symbol}</td>
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
                    <td style={{ textAlign: "right", color: "var(--tx3)" }}>{go && <i className="ti ti-chart-candle" style={{ fontSize: 14 }} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div className="muted mt">Retorno total (ajustado por dividendos) via Yahoo Finance. Sharpe sobre 1 ano, rf 3,5%. Clique na linha abre o gráfico DSPT/TradingView.</div>
      </div>
    </div>
  );
}

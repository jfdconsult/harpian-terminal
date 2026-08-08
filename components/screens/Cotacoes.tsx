"use client";
import { useEffect, useMemo, useState } from "react";
import { MARKET_GROUPS } from "@/lib/market";
import { getFavorites, toggleFavorite } from "@/lib/favorites";
import { pctText, pctClass, numShort, num } from "@/lib/format";
import { publishScreenData } from "@/lib/jim-data";
import BackToVisao from "../BackToVisao";
import type { ScreenId } from "@/lib/nav";
import { useI18n } from "@/lib/i18n";

const TR = {
  h1: { pt: "Cotações", en: "Quotes" },
  sub: { pt: "Ações, índices, ETFs, setores, commodities, cripto e câmbio — ao vivo via Yahoo. Clique em um ativo para ver o gráfico · ★ marca um favorito.", en: "Stocks, indices, ETFs, sectors, commodities, crypto, and FX — live from Yahoo. Click an asset for the chart · ★ marks a favorite." },
  eodLabel: { pt: "Yahoo Finance · fechamento (EOD)", en: "Yahoo Finance · close (EOD)" },
  favEmptyTitle: { pt: "Sua lista de favoritos está vazia", en: "Your favorites list is empty" },
  favEmptyDesc: { pt: "Abra qualquer classe (Ações, Cripto, Câmbio…) e clique na ★ para montar sua lista.", en: "Open any class (Stocks, Crypto, Forex…) and click the ★ to build your list." },
  loading: { pt: "Carregando cotações do Yahoo…", en: "Loading quotes from Yahoo…" },
  errTitle: { pt: "Não foi possível buscar dados do Yahoo Finance", en: "Could not fetch from Yahoo Finance" },
  colTicker: { pt: "Ticker", en: "Ticker" },
  colName: { pt: "Nome", en: "Name" },
  colLast: { pt: "Último", en: "Last" },
  colDay: { pt: "Dia", en: "Day" },
  col1M: { pt: "1M", en: "1M" },
  colYTD: { pt: "YTD", en: "YTD" },
  col1A: { pt: "1A", en: "1A" },
  colSharpe: { pt: "Sharpe", en: "Sharpe" },
  removeFav: { pt: "Remover dos favoritos", en: "Remove from favorites" },
  addFav: { pt: "Adicionar aos favoritos", en: "Add to favorites" },
  unavailable: { pt: "indisponível", en: "unavailable" },
  footnote: { pt: "Retorno total (ajustado por dividendos) via Yahoo Finance. Sharpe em 1 ano, rf de 3,5%. Clique em uma linha para abrir o gráfico DSPT/TradingView.", en: "Total return (dividend-adjusted) via Yahoo Finance. Sharpe over 1 year, 3.5% rf. Click a row to open the DSPT/TradingView chart." },
  favTab: { pt: "★ Favoritos", en: "★ Favorites" },
} as const;

interface Quote {
  symbol: string; name?: string; price?: number;
  dayPct?: number | null; mPct?: number | null; ytdPct?: number | null; yPct?: number | null;
  sharpe?: number | null; error?: boolean;
}

const FAV = "★ Favorites";
// symbol → name map, across ALL asset classes (to build the favorites tab)
const NAME_OF: Record<string, string> = Object.values(MARKET_GROUPS).flat().reduce((m, s) => {
  m[s.symbol] = s.name; return m;
}, {} as Record<string, string>);

export default function Cotacoes({ go }: { go?: (id: ScreenId, param?: string) => void }) {
  const { lang } = useI18n();
  const t = (k: keyof typeof TR) => TR[k][lang];
  const groups = Object.keys(MARKET_GROUPS);
  const [tab, setTab] = useState(FAV);
  const [favs, setFavs] = useState<string[]>([]);
  const [rows, setRows] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => { setFavs(getFavorites()); }, []);

  // symbols for the active tab
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

  // Publishes the quotes for the open tab/class to JIM.
  useEffect(() => {
    if (loading || err || rows.length === 0) return;
    const valid = rows.filter((q) => !q.error && q.dayPct != null);
    const sorted = [...valid].sort((a, b) => (b.dayPct || 0) - (a.dayPct || 0));
    const up = sorted[0], down = sorted[sorted.length - 1];
    const cls = tab === FAV ? "Favorites" : tab;
    publishScreenData(
      "cotacoes",
      `Quotes (Yahoo, EOD close) for class "${cls}". Each row = ticker, name, last price, Day/1-month/YTD/1-year change, and Sharpe (1 year, 3.5% rf).`,
      rows.filter((q) => !q.error).map((q) => ({
        ticker: q.symbol, nome: NAME_OF[q.symbol] || q.symbol, ultimo: q.price,
        diaPct: q.dayPct, mesPct: q.mPct, ytdPct: q.ytdPct, anoPct: q.yPct, sharpe: q.sharpe,
      })),
      {
        briefing:
          `You're viewing ${valid.length} assets in class **${cls}** (live, Yahoo).` +
          (up ? ` Biggest gainer today: **${up.symbol.replace("^", "")}** (${pctText(up.dayPct)}).` : "") +
          (down && down !== up ? ` Biggest loser: **${down.symbol.replace("^", "")}** (${pctText(down.dayPct)}).` : ""),
        suggestions: [
          "What are today's top gainers and losers?",
          "Which asset here has the best momentum?",
          "Is any asset in this list risky?",
        ],
      }
    );
  }, [rows, tab, loading, err]);

  return (
    <div className="screen">
      <div className="crumb"><BackToVisao go={go} /></div>
      <div className="flex between wrap">
        <div><div className="h1">{t("h1")}</div><div className="sub">{t("sub")}</div></div>
        <div className="eodlabel"><i className="ti ti-clock" />{t("eodLabel")}</div>
      </div>
      <div className="seg" style={{ flexWrap: "wrap" }}>
        <span className={tab === FAV ? "on" : ""} onClick={() => setTab(FAV)} style={{ color: tab === FAV ? undefined : "var(--gold)" }}>{t("favTab")}{favs.length ? ` (${favs.length})` : ""}</span>
        {groups.map((g) => <span key={g} className={tab === g ? "on" : ""} onClick={() => setTab(g)}>{g}</span>)}
      </div>
      <div className="card">
        {tab === FAV && favs.length === 0 ? (
          <div className="placeholder" style={{ padding: 40, textAlign: "center" }}>
            <i className="ti ti-star" style={{ fontSize: 30, color: "var(--gold)", opacity: .6 }} />
            <b style={{ display: "block", marginTop: 8 }}>{t("favEmptyTitle")}</b>
            <div className="muted" style={{ marginTop: 4 }}>{t("favEmptyDesc")}</div>
          </div>
        ) : loading ? (
          <div className="muted" style={{ padding: 24, textAlign: "center" }}>{t("loading")}</div>
        ) : err ? (
          <div className="placeholder"><i className="ti ti-cloud-off" /><b>{t("errTitle")}</b></div>
        ) : (
          <table>
            <thead><tr>
              <th style={{ width: 30 }}></th><th>{t("colTicker")}</th><th>{t("colName")}</th><th className="num">{t("colLast")}</th><th className="num">{t("colDay")}</th>
              <th className="num">{t("col1M")}</th><th className="num">{t("colYTD")}</th><th className="num">{t("col1A")}</th><th className="num">{t("colSharpe")}</th><th style={{ width: 24 }}></th>
            </tr></thead>
            <tbody>
              {rows.map((q) => {
                const fav = favs.includes(q.symbol);
                return (
                  <tr key={q.symbol} style={{ cursor: go ? "pointer" : "default" }} onClick={() => go?.("acoes", q.symbol)}>
                    <td style={{ textAlign: "center" }} onClick={(e) => star(q.symbol, e)}>
                      {fav ? (
                        <span style={{ fontSize: 14, color: "var(--gold)", cursor: "pointer" }} title={t("removeFav")}>★</span>
                      ) : (
                        <i className="ti ti-star" style={{ fontSize: 15, color: "var(--tx3)", cursor: "pointer" }} title={t("addFav")} />
                      )}
                    </td>
                    <td style={{ color: "var(--gold)", fontWeight: 600 }}>{q.symbol.replace("^", "").replace("=X", "").replace("=F", "")}</td>
                    <td style={{ color: "var(--tx)" }}>{NAME_OF[q.symbol] || q.symbol}</td>
                    {q.error ? (
                      <td className="muted" colSpan={6}>{t("unavailable")}</td>
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
        <div className="muted mt">{t("footnote")}</div>
      </div>
    </div>
  );
}

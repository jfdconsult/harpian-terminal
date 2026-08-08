"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ASSET_GROUPS, tvSymbol } from "@/lib/market";
import { pctText, pctClass, num, numShort } from "@/lib/format";
import { publishScreenData } from "@/lib/jim-data";
import { useI18n } from "@/lib/i18n";
import type { Studies } from "./AssetChart";
import type { CandlesResp, AssetResp } from "@/lib/types";

const AssetChart = dynamic(() => import("./AssetChart"), { ssr: false });
const TradingViewWidget = dynamic(() => import("./TradingViewWidget"), { ssr: false });

const TR = {
  daily: { pt: "Diário", en: "Daily" },
  weekly: { pt: "Semanal", en: "Weekly" },
  bollinger: { pt: "Bollinger", en: "Bollinger" },
  volume: { pt: "Volume", en: "Volume" },
  momentumD: { pt: "Momentum D", en: "Momentum D" },
  momentumJ: { pt: "Momentum J", en: "Momentum J" },
  noComparison: { pt: "— sem comparação", en: "— no comparison" },
  technology: { pt: "Tecnologia (XLK)", en: "Technology (XLK)" },
  crypto: { pt: "Cripto (Bitcoin)", en: "Crypto (Bitcoin)" },
  yahooData: { pt: "Dados Yahoo Finance", en: "Yahoo Finance data" },
  last: { pt: "Último", en: "Last" },
  today: { pt: "hoje", en: "today" },
  ytd: { pt: "No ano", en: "YTD" },
  oneYear: { pt: "1 ano", en: "1 year" },
  maxDrawdown: { pt: "Drawdown máximo", en: "Max drawdown" },
  period: { pt: "Período:", en: "Period:" },
  harpianChart: { pt: "Gráfico Harpian", en: "Harpian Chart" },
  tradingView: { pt: "TradingView", en: "TradingView" },
  fullDSPT: { pt: "DSPT Completo", en: "Full DSPT" },
  openDSPTTitle: { pt: "Abrir no TradingView com o template HARPIAN DSPT", en: "Open in TradingView with the HARPIAN DSPT template" },
  indicators: { pt: "Indicadores:", en: "Indicators:" },
  compareWith: { pt: "Comparar com:", en: "Compare with:" },
  couldNotFetch: { pt: "Não foi possível obter", en: "Could not fetch" },
  fromYahoo: { pt: "do Yahoo", en: "from Yahoo" },
  loadingCandles: { pt: "Carregando candles do Yahoo…", en: "Loading candles from Yahoo…" },
  vs: { pt: "vs", en: "vs" },
  candlesLegend: { pt: "Candles · Yahoo Finance · indicadores proprietários", en: "Candles · Yahoo Finance · proprietary indicators" },
  tvLegend: { pt: "TradingView · estudos nativos (RSI/MACD) · DSPT completo via deep link", en: "TradingView · native studies (RSI/MACD) · full DSPT via deep link" },
} as const;

function makeRanges(t: (k: keyof typeof TR) => string) {
  return [{ k: "3mo", l: "3M" }, { k: "6mo", l: "6M" }, { k: "1y", l: "1Y" }, { k: "2y", l: "2Y" }, { k: "5y", l: "5Y" }];
}
function makeIntervals(t: (k: keyof typeof TR) => string) {
  return [{ k: "1d", l: t("daily") }, { k: "1wk", l: t("weekly") }];
}
function makeInds(t: (k: keyof typeof TR) => string): { key: keyof Studies; label: string }[] {
  return [
    { key: "ema", label: "EMA" }, { key: "bb", label: t("bollinger") }, { key: "vol", label: t("volume") },
    { key: "rsi", label: "RSI" }, { key: "momD", label: t("momentumD") }, { key: "momJ", label: t("momentumJ") },
  ];
}
function makeCompare(t: (k: keyof typeof TR) => string) {
  return [
    { k: "", l: t("noComparison") },
    { k: "SPY", l: "S&P 500" },
    { k: "QQQ", l: "Nasdaq 100" },
    { k: "XLK", l: t("technology") },
    { k: "BITO", l: t("crypto") },
  ];
}

export default function Acoes({ symbol: initial }: { symbol?: string }) {
  const { lang } = useI18n();
  const t = (k: keyof typeof TR) => TR[k][lang];
  const RANGES = useMemo(() => makeRanges(t), [lang]);
  const INTERVALS = useMemo(() => makeIntervals(t), [lang]);
  const INDS = useMemo(() => makeInds(t), [lang]);
  const COMPARE = useMemo(() => makeCompare(t), [lang]);
  const [symbol, setSymbol] = useState(initial || "NVDA");
  const [range, setRange] = useState("1y");
  const [interval, setInterval] = useState("1d");
  const [mode, setMode] = useState<"harpian" | "tv">("harpian");
  const [compare, setCompare] = useState("");
  const [studies, setStudies] = useState<Studies>({ ema: true, bb: false, vol: true, rsi: false, momD: true, momJ: true });
  const [cd, setCd] = useState<CandlesResp | null>(null);
  const [asset, setAsset] = useState<AssetResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    fetch(`/api/asset?symbol=${encodeURIComponent(symbol)}`).then((r) => r.json()).then((j) => { if (!j.error) setAsset(j); }).catch(() => {});
  }, [symbol]);

  useEffect(() => {
    setLoading(true); setErr(false);
    fetch(`/api/candles?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${interval}${compare ? `&compare=${encodeURIComponent(compare)}` : ""}`)
      .then((r) => r.json())
      .then((j: CandlesResp) => { if (j.error) setErr(true); else setCd(j); setLoading(false); })
      .catch(() => { setErr(true); setLoading(false); });
  }, [symbol, range, interval, compare]);

  const toggle = (k: keyof Studies) => setStudies((s) => ({ ...s, [k]: !s[k] }));
  const name = asset?.name || cd?.name || symbol;
  const tvSym = tvSymbol(symbol);
  const tick = symbol.replace("^", "");

  // Publishes the asset shown on the chart to JIM, with real momentum/risk data.
  useEffect(() => {
    if (!asset) return;
    const briefing =
      `You're looking at **${name} (${tick})**, at ${numShort(asset.price)} (${pctText(asset.dayPct)} today). ` +
      `Year to date: ${pctText(asset.ytdPct)}; 12 months: ${pctText(asset.yPct)}. ` +
      `Risk: max drawdown ${pctText(asset.maxDD)}, Sharpe ${num(asset.sharpe, 2)}` +
      (asset.rsi != null ? `, RSI ${num(asset.rsi, 0)}` : "") + ".";
    publishScreenData(
      "acoes",
      `Chart for ${name} (${tick}) — Yahoo Finance data. Asset metrics: price, day/YTD/1-year change, Sharpe, max drawdown, RSI, and 52-week range.`,
      {
        ativo: name, ticker: tick, preco: asset.price, diaPct: asset.dayPct,
        ytdPct: asset.ytdPct, anoPct: asset.yPct, sharpe: asset.sharpe,
        maxDrawdownPct: asset.maxDD, rsi: asset.rsi, faixa52sem: asset.w52,
      },
      {
        briefing,
        suggestions: [
          `How's the momentum for ${tick}?`,
          `What's the risk on ${tick} right now?`,
          `Is ${tick} expensive or cheap relative to its history?`,
        ],
      }
    );
  }, [asset, name, tick]);

  return (
    <div className="screen">
      <div className="flex between wrap">
        <div><div className="h1">{name}</div><div className="sub" style={{ margin: 0 }}>{symbol.replace("^", "")} · {t("yahooData")}</div></div>
        <div className="flex" style={{ gap: 10, alignItems: "center" }}>
          <select className="fsel" style={{ fontSize: 13, padding: "8px 12px" }} value={symbol} onChange={(e) => setSymbol(e.target.value)}>
            {ASSET_GROUPS.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.items.map((a) => <option key={a.symbol} value={a.symbol}>{a.name} ({a.symbol.replace("^", "").replace("=F", "")})</option>)}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid g4 mt mb">
        <div className="card"><div className="muted">{t("last")}</div><div className="big">{numShort(asset?.price)}</div><div className={`muted ${pctClass(asset?.dayPct)}`}>{asset ? pctText(asset.dayPct) + " " + t("today") : ""}</div></div>
        <div className="card"><div className="muted">{t("ytd")}</div><div className={`big ${asset && asset.ytdPct != null && asset.ytdPct >= 0 ? "g" : "r"}`}>{pctText(asset?.ytdPct)}</div></div>
        <div className="card"><div className="muted">{t("oneYear")}</div><div className={`big ${asset && asset.yPct != null && asset.yPct >= 0 ? "g" : "r"}`}>{pctText(asset?.yPct)}</div></div>
        <div className="card"><div className="muted">{t("maxDrawdown")}</div><div className="big r">{pctText(asset?.maxDD)}</div><div className="muted">Sharpe {num(asset?.sharpe, 2)}</div></div>
      </div>

      {/* Chart toolbar */}
      <div className="card">
        <div className="flex between wrap mb" style={{ gap: 10 }}>
          <div className="flex" style={{ gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span className="flabel" style={{ marginRight: 2 }}>{t("period")}</span>
            <div className="seg" style={{ margin: 0 }}>{RANGES.map((r) => <span key={r.k} className={range === r.k ? "on" : ""} onClick={() => setRange(r.k)}>{r.l}</span>)}</div>
            <div className="seg" style={{ margin: 0 }}>{INTERVALS.map((iv) => <span key={iv.k} className={interval === iv.k ? "on" : ""} onClick={() => setInterval(iv.k)}>{iv.l}</span>)}</div>
          </div>
          <div className="flex" style={{ gap: 8, alignItems: "center" }}>
            <div className="seg" style={{ margin: 0 }}>
              <span className={mode === "harpian" ? "on" : ""} onClick={() => setMode("harpian")}>{t("harpianChart")}</span>
              <span className={mode === "tv" ? "on" : ""} onClick={() => setMode("tv")}>{t("tradingView")}</span>
            </div>
            <a className="btn ghost" href={`https://br.tradingview.com/chart/nNpCdTJZ/?symbol=${encodeURIComponent(tvSym)}`} target="_blank" rel="noopener noreferrer" title={t("openDSPTTitle")}>
              <i className="ti ti-external-link" />{t("fullDSPT")}
            </a>
          </div>
        </div>

        {mode === "harpian" && (
          <div className="flex between wrap mb" style={{ gap: 10 }}>
            <div className="flex wrap" style={{ gap: 6, alignItems: "center" }}>
              <span className="flabel" style={{ marginRight: 2 }}>{t("indicators")}</span>
              {INDS.map((ind) => (
                <button key={ind.key} onClick={() => toggle(ind.key)}
                  style={{ fontFamily: "var(--mono)", fontSize: 10.5, padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                    border: `1px solid ${studies[ind.key] ? "rgba(201,160,44,.4)" : "var(--line2)"}`,
                    background: studies[ind.key] ? "rgba(201,160,44,.15)" : "transparent",
                    color: studies[ind.key] ? "var(--gold)" : "var(--tx3)" }}>
                  {ind.label}
                </button>
              ))}
            </div>
            <div className="flex" style={{ gap: 6, alignItems: "center" }}>
              <span className="flabel">{t("compareWith")}</span>
              <select className="fsel" value={compare} onChange={(e) => setCompare(e.target.value)}>
                {COMPARE.map((c) => <option key={c.k} value={c.k}>{c.l}</option>)}
              </select>
            </div>
          </div>
        )}

        {mode === "tv" ? (
          <TradingViewWidget tvSym={tvSym} />
        ) : err ? (
          <div className="placeholder"><i className="ti ti-cloud-off" /><b>{t("couldNotFetch")} {symbol} {t("fromYahoo")}</b></div>
        ) : loading || !cd ? (
          <div className="muted" style={{ padding: 80, textAlign: "center" }}>{t("loadingCandles")}</div>
        ) : (
          <AssetChart candles={cd.candles} volume={cd.volume} studies={studies} compareLine={cd.compareLine} />
        )}

        <div className="legend" style={{ marginTop: 10 }}>
          {mode === "harpian" ? (
            <>
              <i><b style={{ background: "#4A90D9" }} />EMA</i>
              {cd?.compareName && <i><b style={{ background: "#C77DFF" }} />{t("vs")} {cd.compareName}</i>}
              <span className="muted" style={{ marginLeft: "auto" }}>{t("candlesLegend")}</span>
            </>
          ) : (
            <span className="muted" style={{ marginLeft: "auto" }}>{t("tvLegend")}</span>
          )}
        </div>
      </div>
    </div>
  );
}

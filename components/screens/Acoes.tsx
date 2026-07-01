"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ASSET_GROUPS, tvSymbol } from "@/lib/market";
import { pctText, pctClass, num, numShort } from "@/lib/format";
import type { Studies } from "./AssetChart";

const AssetChart = dynamic(() => import("./AssetChart"), { ssr: false });
const TradingViewWidget = dynamic(() => import("./TradingViewWidget"), { ssr: false });

interface Candle { time: number; open: number; high: number; low: number; close: number }
interface CandlesResp { symbol: string; name: string; candles: Candle[]; volume: { time: number; value: number; up: boolean }[]; compareLine?: { time: number; value: number }[] | null; compareName?: string | null; error?: boolean }
interface AssetResp { name: string; price: number; dayPct: number | null; ytdPct: number | null; yPct: number | null; sharpe: number | null; maxDD: number | null; rsi: number | null; w52: { lo: number; hi: number } }

const RANGES = [{ k: "3mo", l: "3M" }, { k: "6mo", l: "6M" }, { k: "1y", l: "1A" }, { k: "2y", l: "2A" }, { k: "5y", l: "5A" }];
const INTERVALS = [{ k: "1d", l: "Diário" }, { k: "1wk", l: "Semanal" }];
const INDS: { key: keyof Studies; label: string }[] = [
  { key: "ema", label: "EMA" }, { key: "dema", label: "DEMA" }, { key: "tema", label: "TEMA" },
  { key: "sma", label: "SMA 50" }, { key: "bb", label: "Bollinger" }, { key: "vol", label: "Volume" },
  { key: "rsi", label: "RSI" }, { key: "mom", label: "Momento" },
];
const COMPARE = [
  { k: "", l: "— sem comparação" },
  { k: "SPY", l: "S&P 500" },
  { k: "QQQ", l: "Nasdaq 100" },
  { k: "XLK", l: "Tecnologia (XLK)" },
  { k: "BITO", l: "Cripto (Bitcoin)" },
];

export default function Acoes() {
  const [symbol, setSymbol] = useState("NVDA");
  const [range, setRange] = useState("1y");
  const [interval, setInterval] = useState("1d");
  const [mode, setMode] = useState<"harpian" | "tv">("harpian");
  const [compare, setCompare] = useState("");
  const [studies, setStudies] = useState<Studies>({ ema: true, dema: true, tema: false, sma: false, bb: false, vol: true, rsi: false, mom: true });
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

  return (
    <div className="screen">
      <div className="crumb">Mercado › <b>Ações, ETFs &amp; Commodities</b></div>
      <div className="flex between wrap">
        <div><div className="h1">{name}</div><div className="sub" style={{ margin: 0 }}>{symbol.replace("^", "")} · dados Yahoo Finance</div></div>
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

      {/* Cards de métricas */}
      <div className="grid g4 mt mb">
        <div className="card"><div className="muted">Último</div><div className="big">{numShort(asset?.price)}</div><div className={`muted ${pctClass(asset?.dayPct)}`}>{asset ? pctText(asset.dayPct) + " hoje" : ""}</div></div>
        <div className="card"><div className="muted">YTD</div><div className={`big ${asset && asset.ytdPct != null && asset.ytdPct >= 0 ? "g" : "r"}`}>{pctText(asset?.ytdPct)}</div></div>
        <div className="card"><div className="muted">1 ano</div><div className={`big ${asset && asset.yPct != null && asset.yPct >= 0 ? "g" : "r"}`}>{pctText(asset?.yPct)}</div></div>
        <div className="card"><div className="muted">Max drawdown</div><div className="big r">{pctText(asset?.maxDD)}</div><div className="muted">Sharpe {num(asset?.sharpe, 2)}</div></div>
      </div>

      {/* Toolbar do gráfico */}
      <div className="card">
        <div className="flex between wrap mb" style={{ gap: 10 }}>
          <div className="flex" style={{ gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span className="flabel" style={{ marginRight: 2 }}>Período:</span>
            <div className="seg" style={{ margin: 0 }}>{RANGES.map((r) => <span key={r.k} className={range === r.k ? "on" : ""} onClick={() => setRange(r.k)}>{r.l}</span>)}</div>
            <div className="seg" style={{ margin: 0 }}>{INTERVALS.map((iv) => <span key={iv.k} className={interval === iv.k ? "on" : ""} onClick={() => setInterval(iv.k)}>{iv.l}</span>)}</div>
          </div>
          <div className="flex" style={{ gap: 8, alignItems: "center" }}>
            <div className="seg" style={{ margin: 0 }}>
              <span className={mode === "harpian" ? "on" : ""} onClick={() => setMode("harpian")}>Gráfico Harpian</span>
              <span className={mode === "tv" ? "on" : ""} onClick={() => setMode("tv")}>TradingView</span>
            </div>
            <a className="btn ghost" href={`https://br.tradingview.com/chart/nNpCdTJZ/?symbol=${encodeURIComponent(tvSym)}`} target="_blank" rel="noopener noreferrer" title="Abrir no TradingView com o template HARPIAN DSPT">
              <i className="ti ti-external-link" />DSPT completo
            </a>
          </div>
        </div>

        {mode === "harpian" && (
          <div className="flex between wrap mb" style={{ gap: 10 }}>
            <div className="flex wrap" style={{ gap: 6, alignItems: "center" }}>
              <span className="flabel" style={{ marginRight: 2 }}>Indicadores:</span>
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
              <span className="flabel">Comparar com:</span>
              <select className="fsel" value={compare} onChange={(e) => setCompare(e.target.value)}>
                {COMPARE.map((c) => <option key={c.k} value={c.k}>{c.l}</option>)}
              </select>
            </div>
          </div>
        )}

        {mode === "tv" ? (
          <TradingViewWidget tvSym={tvSym} />
        ) : err ? (
          <div className="placeholder"><i className="ti ti-cloud-off" /><b>Não foi possível buscar {symbol} no Yahoo</b></div>
        ) : loading || !cd ? (
          <div className="muted" style={{ padding: 80, textAlign: "center" }}>Carregando candles do Yahoo…</div>
        ) : (
          <AssetChart candles={cd.candles} volume={cd.volume} studies={studies} compareLine={cd.compareLine} />
        )}

        <div className="legend" style={{ marginTop: 10 }}>
          {mode === "harpian" ? (
            <>
              <i><b style={{ background: "#4A90D9" }} />EMA</i>
              <i><b style={{ background: "#C9A02C" }} />DEMA</i>
              <i><b style={{ background: "#2ECC71" }} />TEMA</i>
              {cd?.compareName && <i><b style={{ background: "#C77DFF" }} />vs {cd.compareName}</i>}
              <span className="muted" style={{ marginLeft: "auto" }}>Candles · Yahoo Finance · indicadores DSPT locais</span>
            </>
          ) : (
            <span className="muted" style={{ marginLeft: "auto" }}>TradingView · estudos nativos (RSI/MACD) · DSPT completo no deep-link</span>
          )}
        </div>
      </div>
    </div>
  );
}

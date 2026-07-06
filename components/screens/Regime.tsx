"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { fetchSnapshot, type RegimeState } from "@/lib/snapshot";
import { fetchNews, IMPACT_COLOR, type NewsHeadline } from "@/lib/feeds";
import { GOV_API } from "@/lib/data";
import { pctText, pctClass, numShort, num } from "@/lib/format";
import { publishScreenData } from "@/lib/jim-data";
import type { ScreenId } from "@/lib/nav";
import type { Studies } from "./AssetChart";

const AssetChart = dynamic(() => import("./AssetChart"), { ssr: false });

interface Candle { time: number; open: number; high: number; low: number; close: number }
interface CandlesResp { symbol: string; name: string; candles: Candle[]; volume: { time: number; value: number; up: boolean }[]; error?: boolean }
interface AssetResp { name: string; price: number; dayPct: number | null; ytdPct: number | null; yPct: number | null; sharpe: number | null; maxDD: number | null; rsi: number | null; w52: { lo: number; hi: number } }

interface DnaLayer { name: string; status: string; data?: Record<string, unknown> }
interface DnaResponse { layers: DnaLayer[]; timestamp: string }

const REGIME_LABEL: Record<string, string> = { BULL: "RISK-ON", CAUTELA: "CAUTELA", NEUTRO: "NEUTRO", BEAR: "RISK-OFF" };
const REGIME_COLOR: Record<string, string> = { BULL: "#2ECC71", CAUTELA: "#F39C12", NEUTRO: "#4A90D9", BEAR: "#E74C3C" };
const REGIME_DESC: Record<string, string> = {
  BULL: "Ambiente favorável — exposição plena, defesa em prontidão",
  CAUTELA: "Sinais de deterioração — reduzindo risco, defesa ativando",
  NEUTRO: "Sem tendência dominante — exposição moderada, monitoramento próximo",
  BEAR: "Ambiente adverso — defesa ativa, exposição reduzida",
};

const RANGES = [{ k: "3mo", l: "3M" }, { k: "6mo", l: "6M" }, { k: "1y", l: "1A" }, { k: "2y", l: "2A" }, { k: "5y", l: "5A" }];
const INDS: { key: keyof Studies; label: string }[] = [
  { key: "ema", label: "EMA" }, { key: "bb", label: "Bollinger" }, { key: "vol", label: "Volume" },
  { key: "rsi", label: "RSI" }, { key: "momD", label: "Momento D" }, { key: "momJ", label: "Momento J" },
];

const CALENDAR = [
  { event: "FOMC Minutes", date: "09/jul", time: "14:00 ET", impact: "high" as const },
  { event: "CPI (Inflação)", date: "11/jul", time: "08:30 ET", impact: "high" as const },
  { event: "PPI (Preços ao Produtor)", date: "12/jul", time: "08:30 ET", impact: "medium" as const },
  { event: "Initial Jobless Claims", date: "10/jul", time: "08:30 ET", impact: "medium" as const },
  { event: "Consumer Sentiment (UMich)", date: "12/jul", time: "10:00 ET", impact: "medium" as const },
];

interface DnaScore { label: string; score: number; color: string; detail: string }

function buildDnaScores(dna: DnaResponse | null): DnaScore[] {
  if (!dna?.layers?.length) return [];
  const scores: DnaScore[] = [];
  for (const layer of dna.layers) {
    if (!layer.data) continue;
    const d = layer.data;
    if (layer.name === "Volatility & Options") {
      const vix = d.vix_last as number | undefined;
      const regime = d.vol_regime as string | undefined;
      if (vix) {
        const s = vix < 15 ? 85 : vix < 20 ? 70 : vix < 25 ? 50 : vix < 30 ? 30 : 15;
        scores.push({ label: "Volatilidade", score: s, color: s > 60 ? "#2ECC71" : s > 40 ? "#F39C12" : "#E74C3C", detail: `VIX ${vix.toFixed(1)} (${regime || "N/A"})` });
      }
    }
    if (layer.name === "Sentiment & Breadth") {
      const fg = d.fear_greed_score as number | undefined;
      const breadth = d.pct_above_200ma as number | undefined;
      if (fg) scores.push({ label: "Sentimento", score: fg, color: fg > 60 ? "#2ECC71" : fg > 40 ? "#F39C12" : "#E74C3C", detail: `Fear & Greed ${fg.toFixed(0)}` });
      if (breadth) scores.push({ label: "Breadth", score: breadth, color: breadth > 60 ? "#2ECC71" : breadth > 40 ? "#F39C12" : "#E74C3C", detail: `${breadth.toFixed(0)}% acima da MA200` });
    }
    if (layer.name === "Macro & Rates") {
      const curve = d.yield_curve_spread as number | undefined;
      if (curve != null) {
        const s = curve > 0.5 ? 80 : curve > 0 ? 65 : curve > -0.5 ? 35 : 15;
        scores.push({ label: "Macro & Juros", score: s, color: s > 60 ? "#2ECC71" : s > 40 ? "#F39C12" : "#E74C3C", detail: `Curva ${curve > 0 ? "+" : ""}${(curve * 100).toFixed(0)}bps` });
      }
    }
    if (layer.name === "Positioning (COT/13F)") {
      scores.push({ label: "Posicionamento", score: 62, color: "#2ECC71", detail: "COT + 13F institucional" });
    }
    if (layer.name === "Liquidity (Dark Pool)") {
      const tracked = d.tracked_symbols as number | undefined;
      if (tracked) scores.push({ label: "Liquidez", score: 58, color: "#F39C12", detail: `${tracked} ativos dark pool` });
    }
  }
  return scores;
}

function generateJimMarketAnalysis(regime: RegimeState, asset: AssetResp | null, dna: DnaResponse | null, news: NewsHeadline[]): string {
  const parts: string[] = [];

  const regLabel = REGIME_LABEL[regime];
  parts.push(`O regime de mercado está em **${regLabel}**. ${REGIME_DESC[regime]}.`);

  if (asset) {
    const dir = (asset.dayPct ?? 0) >= 0 ? "alta" : "queda";
    parts.push(`O S&P 500 opera a ${numShort(asset.price)} (${pctText(asset.dayPct)} hoje, ${pctText(asset.ytdPct)} no ano). RSI em ${num(asset.rsi, 0)} — ${(asset.rsi ?? 50) > 70 ? "sobrecomprado, atenção" : (asset.rsi ?? 50) < 30 ? "sobrevendido, possível reversão" : "zona neutra"}.`);
    if (asset.maxDD) parts.push(`Drawdown máximo de ${pctText(asset.maxDD)} nos últimos 12 meses, Sharpe ${num(asset.sharpe, 2)}.`);
  }

  if (dna?.layers?.length) {
    const volLayer = dna.layers.find(l => l.name === "Volatility & Options");
    const vix = volLayer?.data?.vix_last as number | undefined;
    const sentLayer = dna.layers.find(l => l.name === "Sentiment & Breadth");
    const fg = sentLayer?.data?.fear_greed_score as number | undefined;
    const breadth = sentLayer?.data?.pct_above_200ma as number | undefined;

    if (vix) parts.push(`VIX em ${vix.toFixed(1)} — ${vix < 20 ? "volatilidade baixa, ambiente favorável para risco" : vix < 30 ? "volatilidade moderada, monitorar" : "volatilidade alta, cautela redobrada"}.`);
    if (fg) parts.push(`Fear & Greed Index em ${fg.toFixed(0)} — ${fg > 75 ? "ganância extrema: historicamente precede correções" : fg > 55 ? "otimismo moderado" : fg > 40 ? "sentimento neutro" : fg > 25 ? "medo: possível oportunidade contrária" : "medo extremo: historicamente precede recuperações"}.`);
    if (breadth) parts.push(`Breadth: ${breadth.toFixed(0)}% do S&P 500 acima da MA200 — ${breadth > 70 ? "participação ampla, rally saudável" : breadth > 50 ? "participação razoável" : "participação estreita, risco de concentração"}.`);
  }

  if (news.length > 0) {
    const topNews = news.filter(n => n.impact === "Market Moving" || n.impact === "High").slice(0, 2);
    if (topNews.length) {
      parts.push(`Destaques de hoje: "${topNews[0].headline.slice(0, 80)}".`);
    }
  }

  const calNext = CALENDAR[0];
  parts.push(`Próximo evento relevante: **${calNext.event}** em ${calNext.date} (${calNext.time}).`);

  return parts.join(" ");
}

export default function Regime({ go }: { go?: (id: ScreenId, param?: string) => void }) {
  const [regime, setRegime] = useState<RegimeState>("BULL");
  const [asOf, setAsOf] = useState("");
  const [range, setRange] = useState("1y");
  const [studies, setStudies] = useState<Studies>({ ema: true, bb: false, vol: true, rsi: false, momD: true, momJ: false });
  const [cd, setCd] = useState<CandlesResp | null>(null);
  const [asset, setAsset] = useState<AssetResp | null>(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartErr, setChartErr] = useState(false);
  const [dna, setDna] = useState<DnaResponse | null>(null);
  const [news, setNews] = useState<NewsHeadline[]>([]);

  useEffect(() => {
    fetchSnapshot().then((s) => { if (s.ok && s.regime) { setRegime(s.regime.state); setAsOf(s.as_of || ""); } });
    fetch(`${GOV_API}/api/market-dna`).then(r => r.json()).then((d: DnaResponse) => setDna(d)).catch(() => {});
    fetchNews().then(d => setNews(d.headlines || [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/asset?symbol=${encodeURIComponent("^GSPC")}`).then(r => r.json()).then(j => { if (!j.error) setAsset(j); }).catch(() => {});
  }, []);

  useEffect(() => {
    setChartLoading(true); setChartErr(false);
    fetch(`/api/candles?symbol=${encodeURIComponent("^GSPC")}&range=${range}&interval=1d`)
      .then(r => r.json())
      .then((j: CandlesResp) => { if (j.error) setChartErr(true); else setCd(j); setChartLoading(false); })
      .catch(() => { setChartErr(true); setChartLoading(false); });
  }, [range]);

  const toggle = (k: keyof Studies) => setStudies(s => ({ ...s, [k]: !s[k] }));
  const dnaScores = buildDnaScores(dna);
  const jimText = generateJimMarketAnalysis(regime, asset, dna, news);
  const topNews = news.filter(n => n.impact === "Market Moving" || n.impact === "High").slice(0, 5);
  const regColor = REGIME_COLOR[regime];

  useEffect(() => {
    publishScreenData("regime",
      "Tela consolidada de Mercado: gráfico S&P 500, regime, DNA do mercado, calendário econômico, notícias e análise JIM.",
      { regime: REGIME_LABEL[regime], sp500: asset?.price, dayPct: asset?.dayPct, rsi: asset?.rsi, dnaScores: dnaScores.length },
      {
        briefing: jimText,
        suggestions: ["O que o DNA do mercado está sinalizando?", "O que pode mudar o regime?", "Quais eventos econômicos são relevantes essa semana?"],
      }
    );
  }, [regime, asset, dnaScores.length]);

  return (
    <div className="screen" style={{ overflow: "hidden" }}>
      <div className="crumb">Mercado › <b>Visão de Mercado</b></div>

      {/* Header */}
      <div className="flex between" style={{ alignItems: "center", marginBottom: 8 }}>
        <div className="flex" style={{ alignItems: "baseline", gap: 14 }}>
          <div className="h1" style={{ margin: 0 }}>Mercado</div>
          <span className="muted" style={{ fontSize: 10 }}>S&P 500 + regime + inteligência{asOf && <> · {asOf}</>}</span>
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px",
          borderRadius: 6, border: `1px solid ${regColor}40`, background: `${regColor}15`,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: regColor, boxShadow: `0 0 6px ${regColor}60` }} />
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: regColor }}>{REGIME_LABEL[regime]}</span>
        </div>
      </div>

      {/* Faixa topo: 4 cards de métricas + JIM, mesma altura */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "stretch" }}>
        <div className="card" style={{ padding: "10px 14px", minWidth: 0 }}>
          <div className="muted" style={{ fontSize: 10 }}>S&P 500</div>
          <div className="big" style={{ fontSize: 22 }}>{numShort(asset?.price)}</div>
          <div className={`muted ${pctClass(asset?.dayPct)}`} style={{ fontSize: 11 }}>{asset ? pctText(asset.dayPct) + " hoje" : "…"}</div>
        </div>
        <div className="card" style={{ padding: "10px 14px", minWidth: 0 }}>
          <div className="muted" style={{ fontSize: 10 }}>YTD</div>
          <div className={`big ${asset && (asset.ytdPct ?? 0) >= 0 ? "g" : "r"}`} style={{ fontSize: 22 }}>{pctText(asset?.ytdPct)}</div>
        </div>
        <div className="card" style={{ padding: "10px 14px", minWidth: 0 }}>
          <div className="muted" style={{ fontSize: 10 }}>RSI (14)</div>
          <div className="big" style={{ fontSize: 22, color: (asset?.rsi ?? 50) > 70 ? "var(--red)" : (asset?.rsi ?? 50) < 30 ? "var(--green)" : "var(--tx)" }}>{asset?.rsi != null ? num(asset.rsi, 0) : "…"}</div>
          <div className="muted" style={{ fontSize: 10 }}>{(asset?.rsi ?? 50) > 70 ? "sobrecomprado" : (asset?.rsi ?? 50) < 30 ? "sobrevendido" : "neutro"}</div>
        </div>
        <div className="card" style={{ padding: "10px 14px", minWidth: 0 }}>
          <div className="muted" style={{ fontSize: 10 }}>Max DD · Sharpe</div>
          <div className="big r" style={{ fontSize: 22 }}>{pctText(asset?.maxDD)}</div>
          <div className="muted" style={{ fontSize: 10 }}>Sharpe {num(asset?.sharpe, 2)}</div>
        </div>

        {/* JIM ao lado dos cards, mesma altura */}
        <div style={{
          flex: 1, minWidth: 0,
          background: "linear-gradient(135deg, rgba(12,25,48,0.95), rgba(8,18,38,0.98))",
          border: "1px solid rgba(201,160,44,0.3)",
          borderRadius: 8, padding: "10px 14px", position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--gold), rgba(201,160,44,0.2), var(--gold))" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, var(--gold), #B8860B)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 10px rgba(201,160,44,0.25)",
            }}>
              <i className="ti ti-brain" style={{ fontSize: 14, color: "#0C1930" }} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)" }}>JIM — Análise de Mercado</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: "var(--tx)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" as const }}>{jimText}</div>
        </div>
      </div>

      {/* Layout: gráfico + painel lateral (DNA + Calendário + Notícias) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 8 }}>
        {/* Gráfico S&P 500 */}
        <div className="card" style={{ padding: "8px 10px" }}>
          <div className="flex between wrap" style={{ gap: 4, marginBottom: 4 }}>
            <div className="seg" style={{ margin: 0 }}>{RANGES.map(r => <span key={r.k} className={range === r.k ? "on" : ""} onClick={() => setRange(r.k)}>{r.l}</span>)}</div>
            <div className="flex wrap" style={{ gap: 3 }}>
              {INDS.map(ind => (
                <button key={ind.key} onClick={() => toggle(ind.key)}
                  style={{ fontFamily: "var(--mono)", fontSize: 9, padding: "2px 6px", borderRadius: 4, cursor: "pointer",
                    border: `1px solid ${studies[ind.key] ? "rgba(201,160,44,.4)" : "var(--line2)"}`,
                    background: studies[ind.key] ? "rgba(201,160,44,.15)" : "transparent",
                    color: studies[ind.key] ? "var(--gold)" : "var(--tx3)" }}>
                  {ind.label}
                </button>
              ))}
            </div>
          </div>
          {chartErr ? (
            <div className="placeholder"><i className="ti ti-cloud-off" /><b>Erro ao carregar S&P 500</b></div>
          ) : chartLoading || !cd ? (
            <div className="muted" style={{ padding: 40, textAlign: "center" }}>Carregando…</div>
          ) : (
            <AssetChart candles={cd.candles} volume={cd.volume} studies={studies} />
          )}
          <div className="legend" style={{ marginTop: 2 }}>
            <i><b style={{ background: "#4A90D9" }} />EMA</i>
            <span className="muted" style={{ marginLeft: "auto", fontSize: 9 }}>S&P 500 · Yahoo Finance</span>
          </div>
        </div>

        {/* Painel lateral: DNA + Calendário + Notícias */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* DNA do Mercado */}
          <div className="card" style={{ padding: "8px 12px" }}>
            <h3 style={{ cursor: "pointer", marginBottom: 4, fontSize: 11 }} onClick={() => go?.("market-dna")}>
              <i className="ti ti-dna" />DNA do Mercado<i className="ti ti-arrow-right" style={{ fontSize: 10, marginLeft: "auto", opacity: 0.4 }} />
            </h3>
            {dnaScores.length > 0 ? dnaScores.map((s, i) => (
              <div key={i} style={{ marginBottom: 5 }}>
                <div className="flex between" style={{ marginBottom: 2 }}>
                  <span style={{ fontSize: 10, color: "var(--tx2)" }}>{s.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: s.color }}>{s.score}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{ width: `${s.score}%`, height: "100%", borderRadius: 2, background: s.color, transition: "width 0.5s" }} />
                </div>
              </div>
            )) : (
              <div className="muted" style={{ fontSize: 10, padding: "4px 0" }}>
                Gov-data offline — <span style={{ fontFamily: "var(--mono)" }}>api_server.py</span> (8877)
              </div>
            )}
          </div>

          {/* Calendário Econômico */}
          <div className="card" style={{ padding: "8px 12px" }}>
            <h3 style={{ marginBottom: 4, fontSize: 11 }}><i className="ti ti-calendar-event" />Calendário</h3>
            {CALENDAR.slice(0, 4).map((ev, i) => (
              <div key={i} className="flex between" style={{ marginBottom: 3, alignItems: "baseline" }}>
                <div>
                  <span style={{ fontSize: 10.5, color: "var(--tx)" }}>{ev.event}</span>
                  {ev.impact === "high" && <span style={{ fontSize: 7, color: "#E74C3C", fontWeight: 700, marginLeft: 4, textTransform: "uppercase" }}>alto</span>}
                </div>
                <span style={{ fontSize: 9.5, color: "var(--gold)", fontFamily: "var(--mono)", whiteSpace: "nowrap" }}>{ev.date} {ev.time}</span>
              </div>
            ))}
          </div>

          {/* Notícias */}
          <div className="card" style={{ padding: "8px 12px", flex: 1 }}>
            <h3 style={{ cursor: "pointer", marginBottom: 4, fontSize: 11 }} onClick={() => go?.("news-broadcast")}>
              <i className="ti ti-broadcast" />Notícias<i className="ti ti-arrow-right" style={{ fontSize: 10, marginLeft: "auto", opacity: 0.4 }} />
            </h3>
            {topNews.length > 0 ? topNews.slice(0, 4).map((n, i) => (
              <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" style={{
                display: "block", fontSize: 12, color: "var(--tx2)", marginBottom: 6, lineHeight: 1.4,
                textDecoration: "none", borderLeft: `2px solid ${IMPACT_COLOR[n.impact] || "var(--line2)"}`, paddingLeft: 8,
              }}>
                {n.headline.slice(0, 80)}{n.headline.length > 80 ? "…" : ""}
                <span style={{ fontSize: 10, color: "var(--tx3)", marginLeft: 4 }}>{n.source}</span>
              </a>
            )) : (
              <div className="muted" style={{ fontSize: 10, padding: "4px 0" }}>Backend offline (8080)</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

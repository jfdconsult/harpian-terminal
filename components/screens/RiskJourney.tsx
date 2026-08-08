"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useI18n } from "@/lib/i18n";
import { publishScreenData } from "@/lib/jim-data";
import type { GrowthSeries } from "./GrowthChart";
import type { DefensePeriod } from "./JourneyChart";

const JourneyChart = dynamic(() => import("./JourneyChart"), { ssr: false });

// ════════════════════════════════════════════════════════════════
// i18n — local dictionary for this screen (see Painel.tsx for the
// canonical pattern). One entry per user-visible English string.
// en = current text (kept EXACTLY), pt = natural institutional
// Brazilian-Portuguese. Brand/product terms (CORE22+, S&P 500,
// Dow Jones, Treasuries/TLT, Yahoo) are NOT translated.
// ════════════════════════════════════════════════════════════════
const TR = {
  sinceLabel: { pt: "Desde 2000", en: "Since 2000" },
  theJourneyVisualized: { pt: "A trajetória, visualizada · retorno acumulado (base 100)", en: "The journey, visualized · cumulative return (base 100)" },
  everyoneStarts: {
    pt: "Todos começam em 100. A linha que termina mais alta é a que mais capitalizou. A defesa aparece como um vale mais raso nas crises — 2008, 2020, 2022 — não como menos oscilações. Escala logarítmica para que o S&P e o Dow permaneçam legíveis ao lado do CORE22+.",
    en: "Everyone starts at 100. The line that ends highest is the one that compounded the most. Defense shows up as a shallower valley in crises — 2008, 2020, 2022 — not as fewer wiggles. Log scale so the S&P and Dow remain readable next to CORE22+.",
  },
  note: { pt: "Nota", en: "Note" },
  loadingCurve: { pt: "Carregando curva…", en: "Loading curve…" },
  curveUnavailable: { pt: "Curva indisponível", en: "Curve unavailable" },
  core22EndingCapital: { pt: "CORE22+ · capital final de $100", en: "CORE22+ · ending capital of $100" },
  totalReturnCagrOver: { pt: "Retorno total", en: "Total return" },
  cagrOver: { pt: "CAGR", en: "CAGR" },
  overSuffix: { pt: "em", en: "over" },
  spxEndingCapital: { pt: "S&P 500 · capital final de $100", en: "S&P 500 · ending capital of $100" },
  edgeVsSpx: { pt: "Vantagem · CORE22+ vs S&P 500", en: "Edge · CORE22+ vs S&P 500" },
  annualizedCompounded: { pt: "anualizado · capitalizado em", en: "annualized · compounded over" },
  defenseArmed: { pt: "CORE22+ · Defesa acionada", en: "CORE22+ · Defense armed" },
  officialVsComparison: { pt: "CORE22+/S&P: backtest oficial · Dow (^DJI) & TLT: nossa comparação (Yahoo, dados reais) · base 100 · escala logarítmica", en: "CORE22+/S&P: official backtest · Dow (^DJI) & TLT: our comparison (Yahoo, real data) · base 100 · log scale" },
} as const;

type TKey = keyof typeof TR;

const PERIODS: { k: string; l?: string; lKey?: TKey }[] = [
  { k: "ytd", l: "YTD" },
  { k: "1y", l: "1Y" },
  { k: "5y", l: "5Y" },
  { k: "2016", l: "10Y" },
  { k: "2006", l: "20Y" },
  { k: "2000", lKey: "sinceLabel" },
];

type Pt = { time: number; value: number };

interface Resp {
  years: number;
  core: Pt[];
  spx: Pt[];
  dji: Pt[] | null;
  tsy: Pt[] | null;
  coreReturn: number;
  spxReturn: number;
  djiReturn: number | null;
  tsyReturn: number | null;
  coreCagr: number;
  spxCagr: number;
  djiCagr: number | null;
  tsyCagr: number | null;
  tsyNote: string | null;
  error?: boolean;
}

function fmtPct(v: number | null): string {
  if (v == null) return "—";
  const sign = v > 0 ? "+" : "";
  const abs = Math.abs(v);
  if (abs >= 1000) return `${sign}${(v / 1000).toFixed(1)}k%`;
  return `${sign}${v.toFixed(1)}%`;
}

function fmtMult(a: number, b: number): string {
  if (b === 0) return "—";
  return `${(a / b).toFixed(2)}x`;
}

// Cumulative-return curve of CORE22+ vs S&P 500 vs Dow Jones vs long-duration
// Treasuries (TLT). All lines start at 100 on the window's first date. Defense
// shows up as gentler valleys during 2008/2020/2022; the fund's edge is the
// height of the curve at the end, not the shape of individual dips.
export default function RiskJourney() {
  const { lang } = useI18n();
  const t = (k: TKey) => TR[k][lang];
  const [period, setPeriod] = useState("5y");
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [defense, setDefense] = useState<DefensePeriod[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/core-growth?period=${period}`)
      .then((r) => r.json())
      .then((j: Resp) => { setData(j.error ? null : j); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  // Fixed historical periods — fetch once
  useEffect(() => {
    fetch("/api/etp-defense-periods")
      .then((r) => r.json())
      .then((j: { ok: boolean; periods: DefensePeriod[] }) => { if (j.ok) setDefense(j.periods); })
      .catch(() => {});
  }, []);

  const series: (GrowthSeries & { defenseAware?: boolean })[] = [];
  if (data?.core) series.push({ name: "CORE22+", color: "#C9A02C", data: data.core, defenseAware: true });
  if (data?.spx) series.push({ name: "S&P 500", color: "#E74C3C", data: data.spx });
  if (data?.dji && data.dji.length) series.push({ name: "Dow Jones", color: "#4A90D9", data: data.dji });
  if (data?.tsy && data.tsy.length) series.push({ name: "Treasuries (TLT)", color: "#16A085", data: data.tsy });

  useEffect(() => {
    if (!data || data.error) return;
    const pDef = PERIODS.find((p) => p.k === period);
    const periodLabel = (pDef?.lKey ? t(pDef.lKey) : pDef?.l) || period;
    publishScreenData(
      "fundo",
      "Risk & Journey tab: cumulative return curve of CORE22+ vs S&P 500 vs Dow Jones vs long-duration Treasuries (TLT), base 100. The wider gap = the fund's edge.",
      {
        period: periodLabel, years: data.years,
        coreReturn: data.coreReturn, spxReturn: data.spxReturn,
        djiReturn: data.djiReturn, tsyReturn: data.tsyReturn,
        coreCagr: data.coreCagr, spxCagr: data.spxCagr,
        djiCagr: data.djiCagr, tsyCagr: data.tsyCagr,
      },
      {
        briefing:
          `Cumulative return (${periodLabel}, ${data.years}y): CORE22+ ${fmtPct(data.coreReturn)} (CAGR ${fmtPct(data.coreCagr)}) ` +
          `vs S&P 500 ${fmtPct(data.spxReturn)} (CAGR ${fmtPct(data.spxCagr)})` +
          (data.djiReturn != null ? ` vs Dow ${fmtPct(data.djiReturn)} (CAGR ${fmtPct(data.djiCagr)})` : "") +
          (data.tsyReturn != null ? ` vs Treasuries (TLT) ${fmtPct(data.tsyReturn)} (CAGR ${fmtPct(data.tsyCagr)}).` : "."),
        suggestions: [
          "How much of the edge comes from defense in 2008 / 2020?",
          "How does the compounded return translate into ending capital?",
          "What's the CAGR gap vs. the S&P 500?",
        ],
      }
    );
  }, [data, period]);

  return (
    <div className="card">
      <div className="flex between wrap mb" style={{ gap: 10 }}>
        <h3 style={{ margin: 0 }}><i className="ti ti-trending-up" />{t("theJourneyVisualized")}</h3>
        <div className="seg" style={{ margin: 0 }}>
          {PERIODS.map((p) => <span key={p.k} className={period === p.k ? "on" : ""} onClick={() => setPeriod(p.k)}>{p.lKey ? t(p.lKey) : p.l}</span>)}
        </div>
      </div>
      <div className="muted mb" style={{ lineHeight: 1.6 }}>
        {t("everyoneStarts")}
        {data?.tsyNote && <span className="muted" style={{ display: "block", fontSize: 11, marginTop: 4 }}>{t("note")}: {data.tsyNote}</span>}
      </div>
      {loading ? (
        <div className="muted" style={{ padding: 70, textAlign: "center" }}>{t("loadingCurve")}</div>
      ) : series.length ? (
        <JourneyChart series={series} defensePeriods={defense} height={380} />
      ) : (
        <div className="placeholder"><i className="ti ti-cloud-off" /><b>{t("curveUnavailable")}</b></div>
      )}

      {data && (
        <div className="grid g3" style={{ gap: 12, marginTop: 14 }}>
          <div className="kpi kpi-compact" style={{ borderLeft: "3px solid #C9A02C" }}>
            <div className="l">{t("core22EndingCapital")}</div>
            <div className="v" style={{ color: "#C9A02C" }}>${(100 * (1 + data.coreReturn / 100)).toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
            <div className="s">{t("totalReturnCagrOver")} {fmtPct(data.coreReturn)} · {t("cagrOver")} {fmtPct(data.coreCagr)} {t("overSuffix")} {data.years}y</div>
          </div>
          <div className="kpi kpi-compact" style={{ borderLeft: "3px solid #E74C3C" }}>
            <div className="l">{t("spxEndingCapital")}</div>
            <div className="v" style={{ color: "#E74C3C" }}>${(100 * (1 + data.spxReturn / 100)).toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
            <div className="s">{t("totalReturnCagrOver")} {fmtPct(data.spxReturn)} · {t("cagrOver")} {fmtPct(data.spxCagr)}</div>
          </div>
          <div className="kpi kpi-compact" style={{ borderLeft: "3px solid var(--gold)" }}>
            <div className="l">{t("edgeVsSpx")}</div>
            <div className="v" style={{ color: "var(--gold)" }}>{fmtMult(100 * (1 + data.coreReturn / 100), 100 * (1 + data.spxReturn / 100))}</div>
            <div className="s">{fmtPct(data.coreCagr - data.spxCagr)} {t("annualizedCompounded")} {data.years}y</div>
          </div>
        </div>
      )}

      <div className="legend" style={{ marginTop: 12 }}>
        <i><b style={{ background: "#C9A02C" }} />CORE22+ {data ? `(${fmtPct(data.coreReturn)})` : ""}</i>
        <i><b style={{ background: "#F39C12" }} />{t("defenseArmed")}</i>
        <i><b style={{ background: "#E74C3C" }} />S&P 500 {data ? `(${fmtPct(data.spxReturn)})` : ""}</i>
        {data?.djiReturn != null && <i><b style={{ background: "#4A90D9" }} />Dow Jones ({fmtPct(data.djiReturn)})</i>}
        {data?.tsyReturn != null && <i><b style={{ background: "#16A085" }} />Treasuries · TLT ({fmtPct(data.tsyReturn)})</i>}
        <span className="muted" style={{ marginLeft: "auto" }}>{t("officialVsComparison")}</span>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { GOV_API, fmtN, cotShortName } from "@/lib/data";
import { publishScreenData } from "@/lib/jim-data";

const TR = {
  weeks4: { pt: "4 semanas", en: "4 weeks" },
  weeks12: { pt: "12 semanas", en: "12 weeks" },
  months6: { pt: "6 meses", en: "6 months" },
  year1: { pt: "1 ano", en: "1 year" },
  title: { pt: "Explorador de Dados COT", en: "COT Data Explorer" },
  subtitle: { pt: "CFTC bruto · Posições Long/Short por grupo · Líquido e % do Open Interest.", en: "Raw CFTC · Long/Short positions by group · Net and % of Open Interest." },
  govDataOffline: { pt: "— gov-data offline (8877)", en: "— gov-data offline (8877)" },
  period: { pt: "Período:", en: "Period:" },
  market: { pt: "Mercado:", en: "Market:" },
  allMarkets: { pt: "Todos os mercados", en: "All markets" },
  records: { pt: "registros", en: "records" },
  loadingCftc: { pt: "Carregando dados da CFTC…", en: "Loading CFTC data…" },
  couldNotFetch: { pt: "Não foi possível obter dados da CFTC", en: "Could not fetch CFTC data" },
  noRecordsFilter: { pt: "Nenhum registro no filtro atual", en: "No records in the current filter" },
  offlineExplain: { pt: "gov-data offline — ", en: "gov-data offline — " },
  offlineExplain2: { pt: " (porta 8877). Prefiro não mostrar nada a mostrar dados que não vieram da CFTC.", en: " (port 8877). I'd rather show nothing than show data that didn't come from the CFTC." },
  tryAnother: { pt: "Tente outro mercado ou período.", en: "Try another market or period." },
  date: { pt: "Data", en: "Date" },
  marketCol: { pt: "Mercado", en: "Market" },
  specNet: { pt: "Spec Net", en: "Spec Net" },
  pctOi: { pt: "% OI", en: "% OI" },
  commNet: { pt: "Comm Net", en: "Comm Net" },
  specLong: { pt: "Spec Long", en: "Spec Long" },
  specShort: { pt: "Spec Short", en: "Spec Short" },
  commLong: { pt: "Comm Long", en: "Comm Long" },
  commShort: { pt: "Comm Short", en: "Comm Short" },
  openInterest: { pt: "Open Interest", en: "Open Interest" },
  speculators: { pt: "Especuladores (Não-Comercial)", en: "Speculators (Non-Commercial)" },
  commercials: { pt: "Comerciais (Commercial)", en: "Commercials (Commercial)" },
  cftcLegacy: { pt: "CFTC Legacy Futures · dado público", en: "CFTC Legacy Futures · public data" },
} as const;

interface CotRow {
  date?: string;
  market?: string;
  spec_long: number;
  spec_short: number;
  spec_net?: number;
  comm_long: number;
  comm_short: number;
  comm_net?: number;
  open_interest: number;
  spec_net_pct_oi?: number;
  comm_net_pct_oi?: number;
}

const weeksOptions = (t: (k: keyof typeof TR) => string) => [
  { k: 4, l: t("weeks4") },
  { k: 12, l: t("weeks12") },
  { k: 26, l: t("months6") },
  { k: 52, l: t("year1") },
];

// No DEMO_ROWS: previously, with gov-data down, this screen rendered 6
// fabricated COT rows (S&P, gold, 10Y) as if they were CFTC data. CFTC data
// or nothing — never fabricated data dressed up as official.

export default function CotLegacy() {
  const { lang } = useI18n();
  const t = (k: keyof typeof TR) => TR[k][lang];
  const WEEKS_OPTIONS = weeksOptions(t);
  const [data, setData] = useState<CotRow[]>([]);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [weeks, setWeeks] = useState(12);
  const [marketFilter, setMarketFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`${GOV_API}/api/cot/legacy?weeks=${weeks}`)
      .then((r) => r.json())
      .then((d: CotRow[]) => { setData(d); setOffline(false); setLoading(false); })
      .catch(() => { setData([]); setOffline(true); setLoading(false); });
  }, [weeks]);

  const markets = [...new Set(data.map((r) => r.market || ""))].filter(Boolean).sort();
  const filtered = marketFilter ? data.filter((r) => r.market === marketFilter) : data;

  // Publishes the raw CFTC data for the selected window to JIM.
  useEffect(() => {
    if (filtered.length === 0) return;
    publishScreenData(
      "cot-legacy",
      `Raw CFTC Legacy data (window: ${weeks} weeks${marketFilter ? `, market ${cotShortName(marketFilter)}` : ", all markets"}). Each row = date, market, Spec Net, Comm Net (and % of Open Interest), longs/shorts by group, and Open Interest.`,
      filtered.slice(0, 60).map((x) => ({
        data: x.date, mercado: cotShortName(x.market || ""),
        specNet: x.spec_net ?? (x.spec_long - x.spec_short),
        commNet: x.comm_net ?? (x.comm_long - x.comm_short),
        openInterest: x.open_interest,
      })),
      {
        briefing:
          `You're looking at raw CFTC data for ${markets.length} markets (${filtered.length} records, ${weeks}-week window). ` +
          `Spec Net = speculators' net position; Comm Net = hedgers'.`,
        suggestions: [
          "Which market moved the most this week?",
          "How do I read Spec Net vs Comm Net?",
          "What does the open interest indicate here?",
        ],
      }
    );
  }, [filtered, weeks, marketFilter, markets.length]);

  return (
    <div className="screen">
      <div className="flex between wrap" style={{ alignItems: "flex-start", gap: 10 }}>
        <div className="flex" style={{ alignItems: "baseline", gap: 14, flexWrap: "wrap", flex: 1 }}>
          <div className="h1" style={{ margin: 0 }}>{t("title")}</div>
          <div className="sub" style={{ margin: 0 }}>
            {t("subtitle")}
            {offline && <span style={{ color: "var(--orange)", marginLeft: 8 }}> {t("govDataOffline")}</span>}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex wrap mt" style={{ gap: 10, marginBottom: 10, alignItems: "center" }}>
        <div className="flex" style={{ gap: 6, alignItems: "center" }}>
          <span className="flabel">{t("period")}</span>
          <div className="seg" style={{ margin: 0 }}>
            {WEEKS_OPTIONS.map((w) => (
              <span key={w.k} className={weeks === w.k ? "on" : ""} onClick={() => setWeeks(w.k)}>{w.l}</span>
            ))}
          </div>
        </div>
        <div className="flex" style={{ gap: 6, alignItems: "center" }}>
          <span className="flabel">{t("market")}</span>
          <select className="fsel" value={marketFilter} onChange={(e) => setMarketFilter(e.target.value)} style={{ fontSize: 12, padding: "6px 10px", minWidth: 180 }}>
            <option value="">{t("allMarkets")} ({markets.length})</option>
            {markets.map((m) => <option key={m} value={m}>{cotShortName(m)}</option>)}
          </select>
        </div>
        <span className="muted" style={{ fontSize: 10, marginLeft: "auto" }}>{filtered.length} {t("records")}</span>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="muted" style={{ padding: 30, textAlign: "center" }}>{t("loadingCftc")}</div>
        ) : offline || !filtered.length ? (
          <div className="placeholder">
            <i className="ti ti-cloud-off" />
            <b style={{ display: "block", marginTop: 8 }}>
              {offline ? t("couldNotFetch") : t("noRecordsFilter")}
            </b>
            <div className="muted" style={{ marginTop: 4 }}>
              {offline
                ? <>{t("offlineExplain")}<span style={{ fontFamily: "var(--mono)" }}>api_server.py</span>{t("offlineExplain2")}</>
                : t("tryAnother")}
            </div>
          </div>
        ) : (
        <div style={{ maxHeight: 600, overflow: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>{t("date")}</th>
                <th>{t("marketCol")}</th>
                <th className="num" style={{ color: "#4A90D9" }}>{t("specNet")}</th>
                <th className="num" style={{ color: "#4A90D9", fontSize: 10 }}>{t("pctOi")}</th>
                <th className="num" style={{ color: "#C9A02C" }}>{t("commNet")}</th>
                <th className="num" style={{ color: "#C9A02C", fontSize: 10 }}>{t("pctOi")}</th>
                <th className="num">{t("specLong")}</th>
                <th className="num">{t("specShort")}</th>
                <th className="num">{t("commLong")}</th>
                <th className="num">{t("commShort")}</th>
                <th className="num">{t("openInterest")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((x, i) => {
                const specNet = x.spec_net ?? (x.spec_long - x.spec_short);
                const commNet = x.comm_net ?? (x.comm_long - x.comm_short);
                const oi = x.open_interest || 1;
                const specPct = x.spec_net_pct_oi ?? Math.round((specNet / oi) * 1000) / 10;
                const commPct = x.comm_net_pct_oi ?? Math.round((commNet / oi) * 1000) / 10;

                return (
                  <tr key={i}>
                    <td style={{ color: "var(--tx3)", fontFamily: "var(--mono)", fontSize: 11 }}>{x.date || "—"}</td>
                    <td style={{ color: "var(--tx)", fontWeight: 600, fontSize: 12 }}>{cotShortName(x.market || "")}</td>
                    <td className="num" style={{ color: specNet >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600 }}>{specNet >= 0 ? "+" : ""}{fmtN(specNet)}</td>
                    <td className="num" style={{ color: specNet >= 0 ? "var(--green)" : "var(--red)", fontSize: 10 }}>{specPct >= 0 ? "+" : ""}{specPct.toFixed(1)}%</td>
                    <td className="num" style={{ color: commNet >= 0 ? "#C9A02C" : "#E67E22", fontWeight: 600 }}>{commNet >= 0 ? "+" : ""}{fmtN(commNet)}</td>
                    <td className="num" style={{ color: commNet >= 0 ? "#C9A02C" : "#E67E22", fontSize: 10 }}>{commPct >= 0 ? "+" : ""}{commPct.toFixed(1)}%</td>
                    <td className="num" style={{ color: "var(--tx2)" }}>{fmtN(x.spec_long)}</td>
                    <td className="num" style={{ color: "var(--tx2)" }}>{fmtN(x.spec_short)}</td>
                    <td className="num" style={{ color: "var(--tx2)" }}>{fmtN(x.comm_long)}</td>
                    <td className="num" style={{ color: "var(--tx2)" }}>{fmtN(x.comm_short)}</td>
                    <td className="num" style={{ color: "var(--tx2)" }}>{fmtN(x.open_interest)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>

      <div className="legend mt">
        <i><b style={{ background: "#4A90D9" }} />{t("speculators")}</i>
        <i><b style={{ background: "#C9A02C" }} />{t("commercials")}</i>
        <span className="muted" style={{ marginLeft: "auto" }}>{t("cftcLegacy")}</span>
      </div>
    </div>
  );
}

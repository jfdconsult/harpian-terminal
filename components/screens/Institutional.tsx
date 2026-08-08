"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { GOV_API, fmtN, fmtUSD } from "@/lib/data";
import { publishScreenData } from "@/lib/jim-data";

interface Fund { short: string; name: string; style: string; cik?: string; }
interface Holding { issuer: string; title_of_class: string; cusip: string; value_x1000_usd: number; shares: number; put_call?: string; share_type?: string; }
interface FundData { num_holdings?: number; filing_date?: string; period?: string; all_holdings?: Holding[]; }

// ════════════════════════════════════════════════════════════════
// i18n — local dictionary for this screen. One entry per user-visible
// English string. en = current text (kept EXACTLY), pt = natural
// institutional Brazilian-Portuguese. Brand/product terms and codes
// (13F, CUSIP, AUM, Put/Call values) are intentionally NOT translated.
// ════════════════════════════════════════════════════════════════
const TR = {
  title: { pt: "Posições Institucionais", en: "Institutional Holdings" },
  subtitle: { pt: "SEC Form 13F · O que os maiores hedge funds estão comprando e vendendo.", en: "SEC Form 13F · What the largest hedge funds are buying and selling." },
  fundLabel: { pt: "Fundo:", en: "Fund:" },
  apiOffline: { pt: "API offline — execute: python api_server.py", en: "API offline — run: python api_server.py" },
  offlinePlaceholderPrefix: { pt: "API gov-data offline. Execute ", en: "gov-data API offline. Run " },
  offlinePlaceholderSuffix: { pt: " (porta 8877) para ver os dados reais.", en: " (port 8877) to see the real data." },
  totalAum13f: { pt: "AUM Total (13F)", en: "Total AUM (13F)" },
  holdings: { pt: "Posições", en: "Holdings" },
  filingDate: { pt: "Data do Filing", en: "Filing Date" },
  period: { pt: "Período", en: "Period" },
  top10Holdings: { pt: "Top 10 Posições", en: "Top 10 Holdings" },
  issuer: { pt: "Emissor", en: "Issuer" },
  className: { pt: "Classe", en: "Class" },
  valueUsd: { pt: "Valor (USD)", en: "Value (USD)" },
  shares: { pt: "Ações", en: "Shares" },
  allHoldings: { pt: "Todas as Posições", en: "All Holdings" },
  value: { pt: "Valor", en: "Value" },
  type: { pt: "Tipo", en: "Type" },
} as const;

export default function Institutional() {
  const { lang } = useI18n();
  const t = (k: keyof typeof TR) => TR[k][lang];
  const [funds, setFunds] = useState<Fund[]>([]);
  const [selected, setSelected] = useState("");
  const [data, setData] = useState<FundData | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    fetch(`${GOV_API}/api/funds`)
      .then((r) => r.json())
      .then((d: Fund[]) => { setFunds(d); if (d.length) setSelected(d[0].short); })
      .catch(() => setOffline(true));
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetch(`${GOV_API}/api/fund/${selected}`)
      .then((r) => r.json())
      .then((d: FundData) => { setData(d); setOffline(false); })
      .catch(() => setOffline(true));
  }, [selected]);

  const holdings = data?.all_holdings || [];
  const totalVal = holdings.reduce((s, x) => s + (x.value_x1000_usd || 0), 0) * 1000;
  const fund = funds.find((f) => f.short === selected);

  // Publishes the selected fund and its visible 13F positions to JIM.
  useEffect(() => {
    if (!fund) return;
    const top = holdings[0];
    publishScreenData(
      "institutional",
      `13F Holdings for fund "${fund.name}" (${fund.style}). Filing ${data?.filing_date || "—"}, period ${data?.period || "—"}. Total 13F AUM $${totalVal}. Each row = issuer, class, CUSIP, value in USD (value_x1000_usd × 1000), share count, and Put/Call.`,
      {
        fundo: fund.name, estilo: fund.style, filing_date: data?.filing_date, period: data?.period,
        holdings: holdings.slice(0, 40).map((x) => ({
          issuer: x.issuer, classe: x.title_of_class, valueUSD: x.value_x1000_usd * 1000,
          shares: x.shares, putCall: x.put_call || null,
        })),
      },
      {
        briefing:
          `You're viewing the 13F positions of **${fund.name}** (${fund.style}): ${holdings.length} holdings, ` +
          `AUM ${fmtUSD(totalVal)}` + (top ? `. Largest position: **${top.issuer}**.` : ".") +
          ` Keep in mind: 13F has up to a 45-day lag.`,
        suggestions: [
          `What's ${fund.short}'s biggest bet?`,
          "What's new for this fund this quarter?",
          "Is there any concerning sector concentration?",
        ],
      }
    );
  }, [fund, data, holdings, totalVal]);
  const stats = [
    { v: fmtUSD(totalVal), l: t("totalAum13f") },
    { v: fmtN(data?.num_holdings || holdings.length), l: t("holdings") },
    { v: data?.filing_date || "—", l: t("filingDate") },
    { v: data?.period || "—", l: t("period") },
  ];

  return (
    <div className="screen">
      <div className="flex" style={{ alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <div className="h1" style={{ margin: 0 }}>{t("title")}</div>
        <div className="sub" style={{ margin: 0 }}>{t("subtitle")}</div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "14px 0", flexWrap: "wrap" }}>
        <span className="flabel">{t("fundLabel")}</span>
        <select className="fsel" style={{ fontSize: 12, padding: "6px 10px", minWidth: 240 }} value={selected} onChange={(e) => setSelected(e.target.value)}>
          {offline && <option>{t("apiOffline")}</option>}
          {funds.map((f) => (<option key={f.short} value={f.short}>{f.name} ({f.style})</option>))}
        </select>
        <span style={{ fontSize: 11, color: "var(--tx3)", marginLeft: "auto" }}>{fund ? `${fund.style}${fund.cik ? " · CIK " + fund.cik : ""}` : ""}</span>
      </div>

      {offline ? (
        <div className="placeholder">{t("offlinePlaceholderPrefix")}<b>python api_server.py</b>{t("offlinePlaceholderSuffix")}</div>
      ) : (
        <>
          <div className="grid g4" style={{ marginBottom: 14 }}>
            {stats.map((s, i) => (
              <div className="card" key={i} style={{ textAlign: "center", padding: 14 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "var(--gold)" }}>{s.v}</div>
                <div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 4, textTransform: "uppercase", letterSpacing: ".5px" }}>{s.l}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <h3>{t("top10Holdings")}</h3>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>#</th><th>{t("issuer")}</th><th>{t("className")}</th><th>CUSIP</th><th className="num">{t("valueUsd")}</th><th className="num">{t("shares")}</th><th style={{ textAlign: "center" }}>P/C</th></tr></thead>
                <tbody>
                  {holdings.slice(0, 10).map((x, i) => (
                    <tr key={i}>
                      <td style={{ color: "var(--tx3)" }}>{i + 1}</td>
                      <td style={{ fontWeight: 600, color: "var(--tx)" }}>{x.issuer}</td>
                      <td style={{ color: "var(--tx2)" }}>{x.title_of_class}</td>
                      <td style={{ color: "var(--tx3)", fontSize: 10 }}>{x.cusip}</td>
                      <td className="num pos" style={{ fontWeight: 600 }}>{fmtUSD(x.value_x1000_usd * 1000)}</td>
                      <td className="num" style={{ color: "var(--tx2)" }}>{fmtN(x.shares)}</td>
                      <td style={{ textAlign: "center", color: x.put_call === "Put" ? "var(--red)" : x.put_call === "Call" ? "var(--green)" : "var(--tx3)" }}>{x.put_call || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3>{t("allHoldings")} ({holdings.length})</h3>
            <div style={{ maxHeight: 400, overflowY: "auto", overflowX: "auto" }}>
              <table>
                <thead><tr><th>#</th><th>{t("issuer")}</th><th>{t("className")}</th><th>CUSIP</th><th className="num">{t("value")}</th><th className="num">{t("shares")}</th><th style={{ textAlign: "center" }}>{t("type")}</th></tr></thead>
                <tbody>
                  {holdings.map((x, i) => (
                    <tr key={i}>
                      <td style={{ color: "var(--tx3)" }}>{i + 1}</td>
                      <td style={{ color: "var(--tx)" }}>{x.issuer}</td>
                      <td style={{ color: "var(--tx2)" }}>{x.title_of_class}</td>
                      <td style={{ color: "var(--tx3)", fontSize: 10 }}>{x.cusip}</td>
                      <td className="num pos">{fmtUSD(x.value_x1000_usd * 1000)}</td>
                      <td className="num" style={{ color: "var(--tx2)" }}>{fmtN(x.shares)}</td>
                      <td style={{ textAlign: "center", color: "var(--tx3)" }}>{x.put_call || x.share_type || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

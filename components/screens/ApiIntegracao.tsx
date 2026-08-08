"use client";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

interface Endpoint { m: string; path: string; descKey: keyof typeof TR }
interface Collection { nameKey: keyof typeof TR; base: string; tag: string; noteKey: keyof typeof TR; endpoints: Endpoint[] }

const TR = {
  colGovDataName: { pt: "Gov Data · SEC 13F + CFTC COT", en: "Gov Data · SEC 13F + CFTC COT" },
  colGovDataNote: { pt: "Participações institucionais (Form 13F) e posicionamento em futuros (COT). Pipeline gov-data.", en: "Institutional holdings (Form 13F) and futures positioning (COT). gov-data pipeline." },
  descFunds: { pt: "Lista fundos monitorados com os períodos disponíveis", en: "Lists watchlist funds with available periods" },
  descFundShort: { pt: "Posições completas de um fundo (ex.: BRIDGEWATER)", en: "Full holdings for a fund (e.g. BRIDGEWATER)" },
  descFundTop: { pt: "As N maiores posições do fundo", en: "Fund's top N positions" },
  descCotSentiment: { pt: "Sentimento por mercado (especulador vs. comercial)", en: "Sentiment by market (speculator vs. commercial)" },
  descCotLegacy: { pt: "COT Legacy — comprado/vendido por categoria", en: "COT Legacy — long/short by category" },
  colMarketName: { pt: "Mercado · Yahoo Finance (fonte atual)", en: "Market · Yahoo Finance (current source)" },
  colMarketNote: { pt: "Cotações, métricas e candles servidos no lado do servidor. Substituível pela FastTrack sem alterar o contrato.", en: "Quotes, metrics and candles served server-side. Swappable for FastTrack without changing the contract." },
  descQuotes: { pt: "Snapshot multi-símbolo: preço, janelas, Sharpe, risco", en: "Multi-symbol snapshot: price, windows, Sharpe, risk" },
  descAsset: { pt: "Métricas + série base-100 de um ativo vs. S&P", en: "Metrics + base-100 series for an asset vs. S&P" },
  descCandles: { pt: "OHLC + volume para candlestick", en: "OHLC + volume for candlestick" },
  pageTitle: { pt: "API e Integração", en: "API & Integration" },
  pageSub: { pt: "Endpoints REST para integrar os dados do Terminal a sistemas de MFO, planilhas ou aplicações internas.", en: "REST endpoints to integrate the Terminal's data into MFO systems, spreadsheets, or in-house apps." },
  statArchitecture: { pt: "Arquitetura", en: "Architecture" },
  statFormat: { pt: "Formato", en: "Format" },
  statEndpoints: { pt: "Endpoints", en: "Endpoints" },
  statAuth: { pt: "Autenticação (fase 2)", en: "Auth (phase 2)" },
  tagConnected: { pt: "conectado", en: "connected" },
  baseUrl: { pt: "URL base", en: "Base URL" },
  thMethod: { pt: "Método", en: "Method" },
  thEndpoint: { pt: "Endpoint", en: "Endpoint" },
  thDescription: { pt: "Descrição", en: "Description" },
  usageExample: { pt: "Exemplo de uso", en: "Usage example" },
  copied: { pt: "Copiado", en: "Copied" },
  copy: { pt: "Copiar", en: "Copy" },
  authRoadmapLabel: { pt: "Roteiro de autenticação:", en: "Authentication roadmap:" },
  authRoadmapText: { pt: " hoje os endpoints rodam localmente sem chave. A fase 2 traz chaves de API por cliente, limitação de taxa e webhooks — para que MFOs consumam os dados do Terminal com segurança em produção.", en: " today the endpoints run locally without a key. Phase 2 brings per-client API keys, rate limiting, and webhooks — so MFOs can consume Terminal data securely in production." },
} as const;

const COLLECTIONS: Collection[] = [
  {
    nameKey: "colGovDataName", base: "http://localhost:8877", tag: "connected",
    noteKey: "colGovDataNote",
    endpoints: [
      { m: "GET", path: "/api/funds", descKey: "descFunds" },
      { m: "GET", path: "/api/fund/{SHORT}", descKey: "descFundShort" },
      { m: "GET", path: "/api/fund/{SHORT}/top/{N}", descKey: "descFundTop" },
      { m: "GET", path: "/api/cot/sentiment", descKey: "descCotSentiment" },
      { m: "GET", path: "/api/cot/legacy", descKey: "descCotLegacy" },
    ],
  },
  {
    nameKey: "colMarketName", base: "(this terminal · /api)", tag: "connected",
    noteKey: "colMarketNote",
    endpoints: [
      { m: "GET", path: "/api/quotes?symbols=^GSPC,NVDA", descKey: "descQuotes" },
      { m: "GET", path: "/api/asset?symbol=NVDA", descKey: "descAsset" },
      { m: "GET", path: "/api/candles?symbol=NVDA&range=1y&interval=1d", descKey: "descCandles" },
    ],
  },
];

const EXAMPLES: Record<string, string> = {
  curl: `curl "http://localhost:8877/api/cot/sentiment"

curl "http://localhost:8950/api/candles?symbol=NVDA&range=6mo&interval=1d"`,
  js: `const r = await fetch(
  "/api/candles?symbol=NVDA&range=6mo&interval=1d"
);
const { candles } = await r.json();
// candles: [{ time, open, high, low, close }, ...]`,
  python: `import requests
r = requests.get("http://localhost:8877/api/fund/BRIDGEWATER")
print(r.json()["num_holdings"])`,
};

export default function ApiIntegracao() {
  const { lang } = useI18n();
  const t = (k: keyof typeof TR) => TR[k][lang];
  const [tab, setTab] = useState<"curl" | "js" | "python">("curl");
  const [copied, setCopied] = useState(false);

  const copy = (t: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(t).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
    }
  };

  return (
    <div className="screen">
      <div className="flex" style={{ alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <div className="h1" style={{ margin: 0 }}>{t("pageTitle")}</div>
        <div className="sub" style={{ margin: 0 }}>{t("pageSub")}</div>
      </div>

      <div className="grid g4 mb">
        <div className="card" style={{ textAlign: "center", padding: 14 }}><div className="big" style={{ fontSize: 22, color: "var(--gold)" }}>REST</div><div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 4, textTransform: "uppercase", letterSpacing: ".5px" }}>{t("statArchitecture")}</div></div>
        <div className="card" style={{ textAlign: "center", padding: 14 }}><div className="big" style={{ fontSize: 22, color: "var(--gold)" }}>JSON</div><div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 4, textTransform: "uppercase", letterSpacing: ".5px" }}>{t("statFormat")}</div></div>
        <div className="card" style={{ textAlign: "center", padding: 14 }}><div className="big" style={{ fontSize: 22, color: "var(--gold)" }}>8</div><div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 4, textTransform: "uppercase", letterSpacing: ".5px" }}>{t("statEndpoints")}</div></div>
        <div className="card" style={{ textAlign: "center", padding: 14 }}><div className="big" style={{ fontSize: 22, color: "var(--orange)" }}>API Key</div><div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 4, textTransform: "uppercase", letterSpacing: ".5px" }}>{t("statAuth")}</div></div>
      </div>

      {COLLECTIONS.map((col) => (
        <div className="card mb" key={col.nameKey}>
          <div className="flex between mb">
            <h3 style={{ margin: 0 }}><i className="ti ti-plug-connected" />{t(col.nameKey)}</h3>
            <span className="tag g">{t("tagConnected")}</span>
          </div>
          <div className="kv"><span className="muted">{t("baseUrl")}</span><span className="v" style={{ color: "var(--gold)" }}>{col.base}</span></div>
          <div className="muted" style={{ margin: "6px 0 12px", fontSize: 12, lineHeight: 1.5 }}>{t(col.noteKey)}</div>
          <table>
            <thead><tr><th style={{ width: 60 }}>{t("thMethod")}</th><th>{t("thEndpoint")}</th><th>{t("thDescription")}</th></tr></thead>
            <tbody>
              {col.endpoints.map((e) => (
                <tr key={e.path}>
                  <td><span className="tag b">{e.m}</span></td>
                  <td style={{ color: "var(--tx)", fontFamily: "var(--mono)", fontSize: 11.5 }}>{e.path}</td>
                  <td style={{ color: "var(--tx2)" }}>{t(e.descKey)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="card mb">
        <div className="flex between mb">
          <h3 style={{ margin: 0 }}><i className="ti ti-code" />{t("usageExample")}</h3>
          <button className="btn ghost" onClick={() => copy(EXAMPLES[tab])}>
            <i className={`ti ${copied ? "ti-check" : "ti-copy"}`} />{copied ? t("copied") : t("copy")}
          </button>
        </div>
        <div className="seg" style={{ marginBottom: 12 }}>
          <span className={tab === "curl" ? "on" : ""} onClick={() => setTab("curl")}>cURL</span>
          <span className={tab === "js" ? "on" : ""} onClick={() => setTab("js")}>JavaScript</span>
          <span className={tab === "python" ? "on" : ""} onClick={() => setTab("python")}>Python</span>
        </div>
        <pre style={{ background: "#05090F", border: "1px solid var(--line2)", borderRadius: 8, padding: "14px 16px", overflowX: "auto", fontFamily: "var(--mono)", fontSize: 12, color: "var(--tx2)", lineHeight: 1.6, margin: 0 }}>{EXAMPLES[tab]}</pre>
      </div>

      <div className="card" style={{ background: "transparent", borderStyle: "dashed" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <i className="ti ti-shield-lock" style={{ color: "var(--gold)", fontSize: 15, flexShrink: 0, marginTop: 2 }} />
          <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.6 }}>
            <b style={{ color: "var(--tx2)" }}>{t("authRoadmapLabel")}</b>{t("authRoadmapText")}
          </div>
        </div>
      </div>
    </div>
  );
}

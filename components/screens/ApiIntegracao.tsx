"use client";
import { useState } from "react";

interface Endpoint { m: string; path: string; desc: string }
interface Collection { name: string; base: string; tag: string; note: string; endpoints: Endpoint[] }

const COLLECTIONS: Collection[] = [
  {
    name: "Gov Data · SEC 13F + CFTC COT", base: "http://localhost:8877", tag: "conectado",
    note: "Holdings institucionais (Form 13F) e posicionamento de futuros (COT). Pipeline gov-data.",
    endpoints: [
      { m: "GET", path: "/api/funds", desc: "Lista os fundos da watchlist com períodos disponíveis" },
      { m: "GET", path: "/api/fund/{SHORT}", desc: "Holdings completos de um fundo (ex: BRIDGEWATER)" },
      { m: "GET", path: "/api/fund/{SHORT}/top/{N}", desc: "Top N posições do fundo" },
      { m: "GET", path: "/api/cot/sentiment", desc: "Sentiment por mercado (especulador vs comercial)" },
      { m: "GET", path: "/api/cot/legacy", desc: "COT Legacy — long/short por categoria" },
    ],
  },
  {
    name: "Mercado · Yahoo Finance (fonte atual)", base: "(este terminal · /api)", tag: "conectado",
    note: "Cotações, métricas e candles servidos server-side. Trocável por FastTrack sem mudar o contrato.",
    endpoints: [
      { m: "GET", path: "/api/quotes?symbols=^GSPC,NVDA", desc: "Snapshot multi-símbolo: preço, janelas, Sharpe, risco" },
      { m: "GET", path: "/api/asset?symbol=NVDA", desc: "Métricas + série base 100 de um ativo vs S&P" },
      { m: "GET", path: "/api/candles?symbol=NVDA&range=1y&interval=1d", desc: "OHLC + volume para candlestick" },
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
  const [tab, setTab] = useState<"curl" | "js" | "python">("curl");
  const [copied, setCopied] = useState(false);

  const copy = (t: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(t).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
    }
  };

  return (
    <div className="screen">
      <div className="crumb">Ajustes › <b>API &amp; Integração</b></div>
      <div className="h1">API &amp; Integração</div>
      <div className="sub">Endpoints REST para integrar os dados do Terminal a sistemas do MFO, planilhas ou apps próprios.</div>

      <div className="grid g4 mb">
        <div className="card" style={{ textAlign: "center", padding: 14 }}><div className="big" style={{ fontSize: 22, color: "var(--gold)" }}>REST</div><div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 4, textTransform: "uppercase", letterSpacing: ".5px" }}>Arquitetura</div></div>
        <div className="card" style={{ textAlign: "center", padding: 14 }}><div className="big" style={{ fontSize: 22, color: "var(--gold)" }}>JSON</div><div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 4, textTransform: "uppercase", letterSpacing: ".5px" }}>Formato</div></div>
        <div className="card" style={{ textAlign: "center", padding: 14 }}><div className="big" style={{ fontSize: 22, color: "var(--gold)" }}>8</div><div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 4, textTransform: "uppercase", letterSpacing: ".5px" }}>Endpoints</div></div>
        <div className="card" style={{ textAlign: "center", padding: 14 }}><div className="big" style={{ fontSize: 22, color: "var(--orange)" }}>API Key</div><div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 4, textTransform: "uppercase", letterSpacing: ".5px" }}>Auth (fase 2)</div></div>
      </div>

      {COLLECTIONS.map((col) => (
        <div className="card mb" key={col.name}>
          <div className="flex between mb">
            <h3 style={{ margin: 0 }}><i className="ti ti-plug-connected" />{col.name}</h3>
            <span className="tag g">{col.tag}</span>
          </div>
          <div className="kv"><span className="muted">Base URL</span><span className="v" style={{ color: "var(--gold)" }}>{col.base}</span></div>
          <div className="muted" style={{ margin: "6px 0 12px", fontSize: 12, lineHeight: 1.5 }}>{col.note}</div>
          <table>
            <thead><tr><th style={{ width: 60 }}>Método</th><th>Endpoint</th><th>Descrição</th></tr></thead>
            <tbody>
              {col.endpoints.map((e) => (
                <tr key={e.path}>
                  <td><span className="tag b">{e.m}</span></td>
                  <td style={{ color: "var(--tx)", fontFamily: "var(--mono)", fontSize: 11.5 }}>{e.path}</td>
                  <td style={{ color: "var(--tx2)" }}>{e.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="card mb">
        <div className="flex between mb">
          <h3 style={{ margin: 0 }}><i className="ti ti-code" />Exemplo de uso</h3>
          <button className="btn ghost" onClick={() => copy(EXAMPLES[tab])}>
            <i className={`ti ${copied ? "ti-check" : "ti-copy"}`} />{copied ? "Copiado" : "Copiar"}
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
            <b style={{ color: "var(--tx2)" }}>Roadmap de autenticação:</b> hoje os endpoints rodam localmente sem chave. Na fase 2 entram API keys por cliente, rate limiting e webhooks — para MFOs consumirem dados do Terminal de forma segura em produção.
          </div>
        </div>
      </div>
    </div>
  );
}

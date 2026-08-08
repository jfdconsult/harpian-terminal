"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { CLIENTS } from "@/lib/clients";
import { allClients } from "@/lib/clientStore";
import { publishScreenData } from "@/lib/jim-data";

// ════════════════════════════════════════════════════════════════
// i18n — local dictionary for this screen. One entry per user-visible
// English string. en = current text (kept EXACTLY), pt = natural
// institutional Brazilian-Portuguese. Brand/product terms (Lynk, ETP,
// HPC22, HPC11, DvP, Euroclear/Clearstream, BNY Mellon, IBKR, ISIN,
// NAV, USD) and data-driven status codes (Settled, Routing, Awaiting
// DvP) are intentionally NOT translated.
// ════════════════════════════════════════════════════════════════
const TR = {
  ordersViaLynk: { pt: "Ordens · via Lynk", en: "Orders · via Lynk" },
  headerSub: { pt: "Pendentes, histórico e envio — subscrição/resgate de ETP via Lynk.", en: "Pending, history, and submission — ETP subscription/redemption via Lynk." },
  backToHistory: { pt: "Voltar ao histórico", en: "Back to history" },
  newOrder: { pt: "Nova ordem", en: "New order" },
  pendingOrders: { pt: "Ordens pendentes", en: "Pending orders" },
  totalOrders: { pt: "Total de ordens", en: "Total orders" },
  totalCash: { pt: "Caixa total", en: "Total cash" },
  products: { pt: "Produtos", en: "Products" },
  ref: { pt: "Ref", en: "Ref" },
  product: { pt: "Produto", en: "Product" },
  client: { pt: "Cliente", en: "Client" },
  type: { pt: "Tipo", en: "Type" },
  cash: { pt: "Caixa", en: "Cash" },
  status: { pt: "Status", en: "Status" },
  tradeHistory: { pt: "Histórico de negociações", en: "Trade history" },
  totalTrades: { pt: "Total de negociações", en: "Total trades" },
  settled: { pt: "Liquidadas", en: "Settled" },
  date: { pt: "Data", en: "Date" },
  orderSubmitted: { pt: "Ordem enviada (simulação)", en: "Order submitted (simulation)" },
  reference: { pt: "Referência", en: "Reference" },
  subscription: { pt: "Subscrição", en: "Subscription" },
  redemption: { pt: "Resgate", en: "Redemption" },
  simulationNote: { pt: "Neste protótipo o envio é simulado — não há integração real com a Lynk. No sistema final, a ordem segue para roteamento e liquidação DvP via Euroclear/Clearstream, com custódia no BNY Mellon.", en: "In this prototype the submission is simulated — there's no real integration with Lynk. In the final system, the order goes to routing and DvP settlement via Euroclear/Clearstream, with custody at BNY Mellon." },
  productHeader: { pt: "Produto", en: "Product" },
  fundEtp: { pt: "Fundo (ETP)", en: "Fund (ETP)" },
  isin: { pt: "ISIN", en: "ISIN" },
  currency: { pt: "Moeda", en: "Currency" },
  navYesterday: { pt: "NAV (ontem)", en: "NAV (yesterday)" },
  pricing: { pt: "Precificação", en: "Pricing" },
  dailyNavForward: { pt: "NAV diário · forward", en: "Daily NAV · forward" },
  settlement: { pt: "Liquidação", en: "Settlement" },
  custody: { pt: "Custódia", en: "Custody" },
  mandateExecution: { pt: "Execução do mandato", en: "Mandate execution" },
  productRisk: { pt: "Risco do produto", en: "Product risk" },
  riskNo: { pt: "Risk No.", en: "Risk No." },
  order: { pt: "Ordem", en: "Order" },
  valueUsd: { pt: "Valor (US$)", en: "Value (US$)" },
  faceNotes: { pt: "Notas de face (≈)", en: "Face notes (≈)" },
  validOrder: { pt: "Ordem válida", en: "Valid order" },
  minimumOf: { pt: "Mínimo de", en: "Minimum of" },
  valueMustBeMultipleOf: { pt: "O valor deve ser múltiplo de", en: "Value must be a multiple of" },
  submitOrder: { pt: "Enviar ordem", en: "Submit order" },
} as const;

const FUNDS = [
  { id: "HPC22", isin: "XS3386635109", nav: 22.10, rn: 38 },
  { id: "HPC11", isin: "—", nav: 20.40, rn: 34 },
];
const MIN = 50000, MULT = 5000;
const usd = (n: number) => "US$ " + n.toLocaleString("en-US");

const PENDING = [
  { ref: "ORD-2041", produto: "HPC22", cliente: "Aurora Capital MFO", tipo: "Subscription", caixa: 500000, status: "Routing" },
  { ref: "ORD-2043", produto: "HPC11", cliente: "Instituto MarAzul", tipo: "Subscription", caixa: 250000, status: "Awaiting DvP" },
];
const TRADES = [
  { ref: "TRD-1988", produto: "HPC22", cliente: "Ricardo Menezes", data: "2026-06-18", tipo: "Subscription", caixa: 150000, status: "Settled" },
  { ref: "TRD-1975", produto: "HPC22", cliente: "Aurora Capital MFO", data: "2026-06-11", tipo: "Subscription", caixa: 1000000, status: "Settled" },
  { ref: "TRD-1969", produto: "HPC11", cliente: "Helena Prado", data: "2026-06-04", tipo: "Subscription", caixa: 90000, status: "Settled" },
  { ref: "TRD-1950", produto: "HPC22", cliente: "Silveira Family Office", data: "2026-05-27", tipo: "Redemption", caixa: 300000, status: "Settled" },
];

function statusTag(s: string) {
  if (s === "Settled") return "g";
  if (s.includes("Awaiting")) return "o";
  return "b";
}

export default function Ordem({ preselect }: { preselect?: string }) {
  const { lang } = useI18n();
  const t = (k: keyof typeof TR) => TR[k][lang];
  const presetFund = FUNDS.find((f) => f.id === preselect);
  const presetClient = CLIENTS.find((c) => c.id === preselect);
  const [view, setView] = useState<"hist" | "nova">(presetFund || presetClient ? "nova" : "hist");
  const [side, setSide] = useState<"sub" | "res">("sub");
  const [fundId, setFundId] = useState(presetFund?.id || "HPC22");
  const [clientId, setClientId] = useState(presetClient?.id || CLIENTS[0].id);
  const [value, setValue] = useState(250000);
  const [sent, setSent] = useState<null | { ref: string }>(null);
  const [clients, setClients] = useState(CLIENTS);   // includes new clients (localStorage) on the client side
  useEffect(() => { setClients(allClients()); }, []);

  const fund = FUNDS.find((f) => f.id === fundId) ?? FUNDS[0];
  const notes = fund.nav > 0 ? Math.floor(value / fund.nav) : 0;
  const errors: string[] = [];
  if (value < MIN) errors.push(`${t("minimumOf")} ${usd(MIN)}.`);
  if (value % MULT !== 0) errors.push(`${t("valueMustBeMultipleOf")} ${usd(MULT)}.`);
  const ok = errors.length === 0;

  const pendCash = PENDING.reduce((s, o) => s + o.caixa, 0);
  const trdCash = TRADES.reduce((s, o) => s + o.caixa, 0);

  // Publishes to JIM the pending orders and the trade history.
  useEffect(() => {
    publishScreenData(
      "ordem",
      "ETP orders via Lynk (subscription/redemption). Pending orders and trade history — each row = ref, product, client, type, cash, and status.",
      {
        pending: PENDING.map((o) => ({ ref: o.ref, product: o.produto, client: o.cliente, type: o.tipo, cash: o.caixa, status: o.status })),
        history: TRADES.map((o) => ({ ref: o.ref, product: o.produto, client: o.cliente, date: o.data, type: o.tipo, cash: o.caixa, status: o.status })),
        pendingCash: pendCash, historyCash: trdCash,
      },
      {
        briefing:
          `You have **${PENDING.length} pending orders** (${usd(pendCash)} in cash) and ${TRADES.length} trades in the history. ` +
          `Minimum per order ${usd(MIN)}, multiples of ${usd(MULT)}.`,
        suggestions: [
          "Which orders are pending?",
          "How does settlement (DvP) work?",
          "What's the minimum and the multiples for an order?",
        ],
      }
    );
  }, [pendCash, trdCash]);

  function send() {
    // Simulation — there's no real integration with Lynk in this prototype.
    setSent({ ref: "ORD-" + (2044 + Math.floor(value % 50)) });
  }

  return (
    <div className="screen">
      <div className="flex between mb" style={{ gap: 10 }}>
        <div className="flex" style={{ alignItems: "baseline", gap: 14, flexWrap: "wrap", flex: 1 }}>
          <div className="h1" style={{ margin: 0 }}>{t("ordersViaLynk")}</div>
          <div className="sub" style={{ margin: 0 }}>{t("headerSub")}</div>
        </div>
        <div className="flex" style={{ gap: 8 }}>
          {view === "nova"
            ? <button className="btn ghost" onClick={() => { setView("hist"); setSent(null); }}><i className="ti ti-arrow-left" />{t("backToHistory")}</button>
            : <button className="btn" onClick={() => setView("nova")}><i className="ti ti-plus" />{t("newOrder")}</button>}
        </div>
      </div>

      {view === "hist" ? (
        <>
          <div className="card mb">
            <div className="flex between mb"><h3 style={{ margin: 0 }}><i className="ti ti-clock-pause" />{t("pendingOrders")}</h3><span className="tag o">{PENDING.length}</span></div>
            <div className="grid g3 mb">
              <div className="card"><div className="muted">{t("totalOrders")}</div><div className="big" style={{ fontSize: 21 }}>{PENDING.length}</div></div>
              <div className="card"><div className="muted">{t("totalCash")}</div><div className="big g" style={{ fontSize: 21 }}>{usd(pendCash)}</div></div>
              <div className="card"><div className="muted">{t("products")}</div><div className="big" style={{ fontSize: 21 }}>{new Set(PENDING.map((p) => p.produto)).size}</div></div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>{t("ref")}</th><th>{t("product")}</th><th>{t("client")}</th><th>{t("type")}</th><th className="num">{t("cash")}</th><th>{t("status")}</th></tr></thead>
                <tbody>{PENDING.map((o) => (
                  <tr key={o.ref}><td style={{ color: "var(--gold)" }}>{o.ref}</td><td style={{ color: "var(--tx)", fontWeight: 600 }}>{o.produto}</td><td style={{ color: "var(--tx2)" }}>{o.cliente}</td><td style={{ color: "var(--tx2)" }}>{o.tipo}</td><td className="num">{usd(o.caixa)}</td><td><span className={`tag ${statusTag(o.status)}`}>{o.status}</span></td></tr>
                ))}</tbody>
              </table>
            </div>
          </div>
          <div className="card">
            <div className="flex between mb"><h3 style={{ margin: 0 }}><i className="ti ti-history" />{t("tradeHistory")}</h3></div>
            <div className="grid g3 mb">
              <div className="card"><div className="muted">{t("totalTrades")}</div><div className="big" style={{ fontSize: 21 }}>{TRADES.length}</div></div>
              <div className="card"><div className="muted">{t("totalCash")}</div><div className="big g" style={{ fontSize: 21 }}>{usd(trdCash)}</div></div>
              <div className="card"><div className="muted">{t("settled")}</div><div className="big" style={{ fontSize: 21 }}>{TRADES.filter((tr) => tr.status === "Settled").length}</div></div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>{t("ref")}</th><th>{t("product")}</th><th>{t("client")}</th><th>{t("date")}</th><th>{t("type")}</th><th className="num">{t("cash")}</th><th>{t("status")}</th></tr></thead>
                <tbody>{TRADES.map((o) => (
                  <tr key={o.ref}><td style={{ color: "var(--gold)" }}>{o.ref}</td><td style={{ color: "var(--tx)", fontWeight: 600 }}>{o.produto}</td><td style={{ color: "var(--tx2)" }}>{o.cliente}</td><td style={{ color: "var(--tx3)" }}>{o.data}</td><td style={{ color: "var(--tx2)" }}>{o.tipo}</td><td className="num">{usd(o.caixa)}</td><td><span className={`tag ${statusTag(o.status)}`}>{o.status}</span></td></tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </>
      ) : sent ? (
        <div className="card" style={{ textAlign: "center", padding: 40, borderColor: "rgba(46,204,113,.3)" }}>
          <i className="ti ti-circle-check" style={{ fontSize: 44, color: "var(--green)" }} />
          <div className="h1" style={{ marginTop: 10 }}>{t("orderSubmitted")}</div>
          <div className="sub">{t("reference")} {sent.ref} · {fund.id} · {side === "sub" ? t("subscription") : t("redemption")} · {usd(value)}</div>
          <div className="muted" style={{ maxWidth: 520, margin: "0 auto 16px", lineHeight: 1.6 }}>
            {t("simulationNote")}
          </div>
          <button className="btn ghost" onClick={() => { setView("hist"); setSent(null); }}><i className="ti ti-arrow-left" />{t("backToHistory")}</button>
        </div>
      ) : (
        <>
          <div className="grid g2">
            <div className="card">
              <h3><i className="ti ti-package" />{t("productHeader")}</h3>
              <label className="muted" style={{ display: "block", fontSize: 11, marginBottom: 4 }}>{t("fundEtp")}</label>
              <select className="wl-input" style={{ width: "100%" }} value={fundId} onChange={(e) => setFundId(e.target.value)}>
                {FUNDS.map((f) => <option key={f.id} value={f.id}>{f.id}</option>)}
              </select>
              <div className="kv mt"><span className="muted">{t("isin")}</span><span className="v">{fund.isin}</span></div>
              <div className="kv"><span className="muted">{t("currency")}</span><span className="v">USD</span></div>
              <div className="kv"><span className="muted">{t("navYesterday")}</span><span className="v">US$ {fund.nav.toFixed(2)}</span></div>
              <div className="kv"><span className="muted">{t("pricing")}</span><span className="v" style={{ color: "var(--gold)" }}>{t("dailyNavForward")}</span></div>
              <div className="kv"><span className="muted">{t("settlement")}</span><span className="v">Euroclear/Clearstream</span></div>
              <div className="kv"><span className="muted">{t("custody")}</span><span className="v">BNY Mellon</span></div>
              <div className="kv"><span className="muted">{t("mandateExecution")}</span><span className="v">Interactive Brokers (IBKR)</span></div>
              <div className="kv"><span className="muted">{t("productRisk")}</span><span className="v">{t("riskNo")} {fund.rn}</span></div>
            </div>
            <div className="card">
              <h3><i className="ti ti-pencil" />{t("order")}</h3>
              <div className="seg" style={{ marginBottom: 12 }}>
                <span className={side === "sub" ? "on" : ""} onClick={() => setSide("sub")}>{t("subscription")}</span>
                <span className={side === "res" ? "on" : ""} onClick={() => setSide("res")}>{t("redemption")}</span>
              </div>
              <label className="muted" style={{ display: "block", fontSize: 11, marginBottom: 4 }}>{t("client")}</label>
              <select className="wl-input" style={{ width: "100%" }} value={clientId} onChange={(e) => setClientId(e.target.value)}>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <label className="muted" style={{ display: "block", fontSize: 11, margin: "10px 0 4px" }}>{t("valueUsd")}</label>
              <input className="wl-input" style={{ width: "100%" }} type="number" step={MULT} value={value} onChange={(e) => setValue(+e.target.value)} />
              <div className="kv mt"><span className="muted">{t("faceNotes")}</span><span className="v">{notes.toLocaleString(lang === "pt" ? "pt-BR" : "en-US")}</span></div>
            </div>
          </div>

          <div className="card mt" style={{ borderColor: ok ? "rgba(46,204,113,.25)" : "rgba(231,76,60,.3)" }}>
            {ok ? (
              <div className="flex" style={{ gap: 8 }}><i className="ti ti-circle-check" style={{ color: "var(--green)" }} /><span style={{ color: "var(--tx2)" }}>{t("validOrder")}: {fund.id} · {side === "sub" ? t("subscription") : t("redemption")} · {usd(value)} · {clients.find((c) => c.id === clientId)?.name}</span></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {errors.map((e, i) => <div className="flex" key={i} style={{ gap: 8 }}><i className="ti ti-alert-circle" style={{ color: "var(--red)" }} /><span style={{ color: "var(--red)" }}>{e}</span></div>)}
              </div>
            )}
          </div>

          <div className="flex mt" style={{ gap: 8 }}>
            <button className="btn" disabled={!ok} style={{ opacity: ok ? 1 : 0.45, cursor: ok ? "pointer" : "not-allowed" }} onClick={send}><i className="ti ti-send" />{t("submitOrder")}</button>
          </div>
        </>
      )}
    </div>
  );
}

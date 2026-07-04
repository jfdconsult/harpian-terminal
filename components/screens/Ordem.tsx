"use client";
import { useEffect, useState } from "react";
import { CLIENTS } from "@/lib/clients";
import { allClients } from "@/lib/clientStore";
import { publishScreenData } from "@/lib/jim-data";

const FUNDS = [
  { id: "HPC22", isin: "XS3386635109", nav: 22.10, rn: 38 },
  { id: "HPC11", isin: "—", nav: 20.40, rn: 34 },
];
const MIN = 50000, MULT = 5000;
const usd = (n: number) => "US$ " + n.toLocaleString("pt-BR");

const PENDING = [
  { ref: "ORD-2041", produto: "HPC22", cliente: "Aurora Capital MFO", tipo: "Subscrição", caixa: 500000, status: "Em roteamento" },
  { ref: "ORD-2043", produto: "HPC11", cliente: "Instituto MarAzul", tipo: "Subscrição", caixa: 250000, status: "Aguardando DvP" },
];
const TRADES = [
  { ref: "TRD-1988", produto: "HPC22", cliente: "Ricardo Menezes", data: "2026-06-18", tipo: "Subscrição", caixa: 150000, status: "Liquidada" },
  { ref: "TRD-1975", produto: "HPC22", cliente: "Aurora Capital MFO", data: "2026-06-11", tipo: "Subscrição", caixa: 1000000, status: "Liquidada" },
  { ref: "TRD-1969", produto: "HPC11", cliente: "Helena Prado", data: "2026-06-04", tipo: "Subscrição", caixa: 90000, status: "Liquidada" },
  { ref: "TRD-1950", produto: "HPC22", cliente: "Silveira Family Office", data: "2026-05-27", tipo: "Resgate", caixa: 300000, status: "Liquidada" },
];

function statusTag(s: string) {
  if (s === "Liquidada") return "g";
  if (s.includes("Aguardando")) return "o";
  return "b";
}

export default function Ordem({ preselect }: { preselect?: string }) {
  const presetFund = FUNDS.find((f) => f.id === preselect);
  const presetClient = CLIENTS.find((c) => c.id === preselect);
  const [view, setView] = useState<"hist" | "nova">(presetFund || presetClient ? "nova" : "hist");
  const [side, setSide] = useState<"sub" | "res">("sub");
  const [fundId, setFundId] = useState(presetFund?.id || "HPC22");
  const [clientId, setClientId] = useState(presetClient?.id || CLIENTS[0].id);
  const [value, setValue] = useState(250000);
  const [sent, setSent] = useState<null | { ref: string }>(null);
  const [clients, setClients] = useState(CLIENTS);   // inclui clientes novos (localStorage) no client-side
  useEffect(() => { setClients(allClients()); }, []);

  const fund = FUNDS.find((f) => f.id === fundId)!;
  const notes = fund.nav > 0 ? Math.floor(value / fund.nav) : 0;
  const errors: string[] = [];
  if (value < MIN) errors.push(`Mínimo de ${usd(MIN)}.`);
  if (value % MULT !== 0) errors.push(`Valor deve ser múltiplo de ${usd(MULT)}.`);
  const ok = errors.length === 0;

  const pendCash = PENDING.reduce((s, o) => s + o.caixa, 0);
  const trdCash = TRADES.reduce((s, o) => s + o.caixa, 0);

  // Publica pro JIM as ordens pendentes e o histórico de trades.
  useEffect(() => {
    publishScreenData(
      "ordem",
      "Ordens do ETP via Lynk (subscrição/resgate). Ordens pendentes e histórico de trades — cada linha = ref, produto, cliente, tipo, caixa e status.",
      {
        pendentes: PENDING.map((o) => ({ ref: o.ref, produto: o.produto, cliente: o.cliente, tipo: o.tipo, caixa: o.caixa, status: o.status })),
        historico: TRADES.map((o) => ({ ref: o.ref, produto: o.produto, cliente: o.cliente, data: o.data, tipo: o.tipo, caixa: o.caixa, status: o.status })),
        caixaPendente: pendCash, caixaHistorico: trdCash,
      },
      {
        briefing:
          `Você tem **${PENDING.length} ordens pendentes** (${usd(pendCash)} em caixa) e ${TRADES.length} trades no histórico. ` +
          `Mínimo por ordem ${usd(MIN)}, múltiplos de ${usd(MULT)}.`,
        suggestions: [
          "Quais ordens estão pendentes?",
          "Como funciona a liquidação (DvP)?",
          "Qual o mínimo e os múltiplos de uma ordem?",
        ],
      }
    );
  }, [pendCash, trdCash]);

  function send() {
    // Simulação — não há integração real com a Lynk neste protótipo.
    setSent({ ref: "ORD-" + (2044 + Math.floor(value % 50)) });
  }

  return (
    <div className="screen">
      <div className="crumb">Ordens › <b>via Lynk</b></div>
      <div className="flex between mb">
        <div><div className="h1">Ordens</div><div className="sub" style={{ margin: 0 }}>Pendentes, histórico e envio — subscrição/resgate do ETP via Lynk.</div></div>
        <div className="flex" style={{ gap: 8 }}>
          {view === "nova"
            ? <button className="btn ghost" onClick={() => { setView("hist"); setSent(null); }}><i className="ti ti-arrow-left" />Voltar ao histórico</button>
            : <button className="btn" onClick={() => setView("nova")}><i className="ti ti-plus" />Nova ordem</button>}
        </div>
      </div>

      {view === "hist" ? (
        <>
          <div className="card mb">
            <div className="flex between mb"><h3 style={{ margin: 0 }}><i className="ti ti-clock-pause" />Ordens pendentes</h3><span className="tag o">{PENDING.length}</span></div>
            <div className="grid g3 mb">
              <div className="card"><div className="muted">Total de ordens</div><div className="big" style={{ fontSize: 21 }}>{PENDING.length}</div></div>
              <div className="card"><div className="muted">Total em caixa</div><div className="big g" style={{ fontSize: 21 }}>{usd(pendCash)}</div></div>
              <div className="card"><div className="muted">Produtos</div><div className="big" style={{ fontSize: 21 }}>{new Set(PENDING.map((p) => p.produto)).size}</div></div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>Ref</th><th>Produto</th><th>Cliente</th><th>Tipo</th><th className="num">Caixa</th><th>Status</th></tr></thead>
                <tbody>{PENDING.map((o) => (
                  <tr key={o.ref}><td style={{ color: "var(--gold)" }}>{o.ref}</td><td style={{ color: "var(--tx)", fontWeight: 600 }}>{o.produto}</td><td style={{ color: "var(--tx2)" }}>{o.cliente}</td><td style={{ color: "var(--tx2)" }}>{o.tipo}</td><td className="num">{usd(o.caixa)}</td><td><span className={`tag ${statusTag(o.status)}`}>{o.status}</span></td></tr>
                ))}</tbody>
              </table>
            </div>
          </div>
          <div className="card">
            <div className="flex between mb"><h3 style={{ margin: 0 }}><i className="ti ti-history" />Histórico de trades</h3></div>
            <div className="grid g3 mb">
              <div className="card"><div className="muted">Total de trades</div><div className="big" style={{ fontSize: 21 }}>{TRADES.length}</div></div>
              <div className="card"><div className="muted">Total em caixa</div><div className="big g" style={{ fontSize: 21 }}>{usd(trdCash)}</div></div>
              <div className="card"><div className="muted">Liquidadas</div><div className="big" style={{ fontSize: 21 }}>{TRADES.filter((t) => t.status === "Liquidada").length}</div></div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr><th>Ref</th><th>Produto</th><th>Cliente</th><th>Data</th><th>Tipo</th><th className="num">Caixa</th><th>Status</th></tr></thead>
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
          <div className="h1" style={{ marginTop: 10 }}>Ordem enviada (simulação)</div>
          <div className="sub">Referência {sent.ref} · {fund.id} · {side === "sub" ? "Subscrição" : "Resgate"} · {usd(value)}</div>
          <div className="muted" style={{ maxWidth: 520, margin: "0 auto 16px", lineHeight: 1.6 }}>
            Neste protótipo o envio é simulado — não há integração real com a Lynk. No sistema final, a ordem segue para roteamento e liquidação DvP via Euroclear/Clearstream · BNY Mellon.
          </div>
          <button className="btn ghost" onClick={() => { setView("hist"); setSent(null); }}><i className="ti ti-arrow-left" />Voltar ao histórico</button>
        </div>
      ) : (
        <>
          <div className="grid g2">
            <div className="card">
              <h3><i className="ti ti-package" />Produto</h3>
              <label className="muted" style={{ display: "block", fontSize: 11, marginBottom: 4 }}>Fundo (ETP)</label>
              <select className="wl-input" style={{ width: "100%" }} value={fundId} onChange={(e) => setFundId(e.target.value)}>
                {FUNDS.map((f) => <option key={f.id} value={f.id}>{f.id}</option>)}
              </select>
              <div className="kv mt"><span className="muted">ISIN</span><span className="v">{fund.isin}</span></div>
              <div className="kv"><span className="muted">Moeda</span><span className="v">USD</span></div>
              <div className="kv"><span className="muted">NAV (ontem)</span><span className="v">US$ {fund.nav.toFixed(2)}</span></div>
              <div className="kv"><span className="muted">Pricing</span><span className="v" style={{ color: "var(--gold)" }}>NAV diário · forward</span></div>
              <div className="kv"><span className="muted">Liquidação</span><span className="v">Euroclear/Clearstream · BNY Mellon</span></div>
              <div className="kv"><span className="muted">Risco do produto</span><span className="v">Risk Nº {fund.rn}</span></div>
            </div>
            <div className="card">
              <h3><i className="ti ti-pencil" />Ordem</h3>
              <div className="seg" style={{ marginBottom: 12 }}>
                <span className={side === "sub" ? "on" : ""} onClick={() => setSide("sub")}>Subscrição</span>
                <span className={side === "res" ? "on" : ""} onClick={() => setSide("res")}>Resgate</span>
              </div>
              <label className="muted" style={{ display: "block", fontSize: 11, marginBottom: 4 }}>Cliente</label>
              <select className="wl-input" style={{ width: "100%" }} value={clientId} onChange={(e) => setClientId(e.target.value)}>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <label className="muted" style={{ display: "block", fontSize: 11, margin: "10px 0 4px" }}>Valor (US$)</label>
              <input className="wl-input" style={{ width: "100%" }} type="number" step={MULT} value={value} onChange={(e) => setValue(+e.target.value)} />
              <div className="kv mt"><span className="muted">Notas nominais (≈)</span><span className="v">{notes.toLocaleString("pt-BR")}</span></div>
            </div>
          </div>

          <div className="card mt" style={{ borderColor: ok ? "rgba(46,204,113,.25)" : "rgba(231,76,60,.3)" }}>
            {ok ? (
              <div className="flex" style={{ gap: 8 }}><i className="ti ti-circle-check" style={{ color: "var(--green)" }} /><span style={{ color: "var(--tx2)" }}>Ordem válida: {fund.id} · {side === "sub" ? "Subscrição" : "Resgate"} · {usd(value)} · {clients.find((c) => c.id === clientId)?.name}</span></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {errors.map((e, i) => <div className="flex" key={i} style={{ gap: 8 }}><i className="ti ti-alert-circle" style={{ color: "var(--red)" }} /><span style={{ color: "var(--red)" }}>{e}</span></div>)}
              </div>
            )}
          </div>

          <div className="flex mt" style={{ gap: 8 }}>
            <button className="btn" disabled={!ok} style={{ opacity: ok ? 1 : 0.45, cursor: ok ? "pointer" : "not-allowed" }} onClick={send}><i className="ti ti-send" />Enviar ordem</button>
          </div>
        </>
      )}
    </div>
  );
}

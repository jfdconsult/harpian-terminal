"use client";
import { useState, useEffect } from "react";
import { FUNDS, FUND_LIST, type Fund, type KV } from "@/lib/funds";
import { publishScreenData } from "@/lib/jim-data";
import type { ScreenId } from "@/lib/nav";
import RiskJourney from "./RiskJourney";
import ComposicaoAoVivo from "./ComposicaoAoVivo";

type Tab = "visao" | "comp" | "perf" | "risco" | "defesa" | "econ" | "comprar";
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "visao", label: "Visão", icon: "ti-eye" },
  { id: "comp", label: "Composição ao vivo", icon: "ti-layout-grid" },
  { id: "perf", label: "Performance", icon: "ti-chart-line" },
  { id: "risco", label: "Risco & Jornada", icon: "ti-activity" },
  { id: "defesa", label: "Defesa em crises", icon: "ti-shield" },
  { id: "econ", label: "Economia & Arquitetura", icon: "ti-building-bank" },
  { id: "comprar", label: "Como comprar", icon: "ti-send" },
];

function KVGrid({ rows }: { rows: KV[] }) {
  return (
    <div className="grid g2" style={{ gap: 0 }}>
      {rows.map((r, i) => (
        <div className="kv" key={i} style={{ paddingRight: 14 }}>
          <span className="muted">{r.k}</span>
          <span className="v">{r.v}</span>
        </div>
      ))}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="placeholder"><i className="ti ti-file-dots" /><b>{label}</b><div className="muted mt">Estrutura pronta — será preenchida com o factsheet oficial.</div></div>;
}

export default function Fundo({ fundId, onSelectFund, go }: { fundId: string; onSelectFund: (id: string) => void; go: (id: ScreenId) => void }) {
  const [tab, setTab] = useState<Tab>("visao");
  const fund: Fund = FUNDS[fundId] || FUNDS.HPC22;

  // Publica pro JIM o fundo aberto (resultado e postura — NUNCA o método).
  useEffect(() => {
    const destaques = fund.highlights.map((h) => `${h.label}: ${h.value}`).join("; ");
    publishScreenData(
      "fundo",
      `Ficha do fundo ${fund.ticker} — ${fund.name}. Estratégia: ${fund.strategy}. Status: ${fund.status}. ` +
        `Mostra performance (bruto/líquido vs S&P), risco/jornada, defesa em crises e economia. ` +
        `IMPORTANTE: é a visão do CLIENTE — só resultado e postura, nunca sinais/fórmulas/método.`,
      {
        ticker: fund.ticker, nome: fund.name, estrategia: fund.strategy, status: fund.status,
        destaques: fund.highlights.map((h) => ({ label: h.label, valor: h.value, sub: h.sub })),
        performance: fund.performance.map((p) => ({ metrica: p.metric, bruto: p.gross, liquido: p.net, spx: p.spx })),
      },
      {
        briefing:
          `Você está no fundo **${fund.ticker} — ${fund.name}** (${fund.strategy}, ${fund.status}). ${destaques}.`,
        suggestions: [
          `Como está a performance do ${fund.ticker}?`,
          `Como o ${fund.ticker} se defende em crises?`,
          `Pra quem esse fundo faz sentido?`,
        ],
      }
    );
  }, [fund]);

  return (
    <div className="screen">
      <div className="crumb">Fundos › <b>{fund.ticker}</b></div>

      {/* Header do fundo */}
      <div className="fhhead">
        <div>
          <div className="tk">{fund.ticker}</div>
          <div className="nm">{fund.name}</div>
        </div>
        <div className="fhstat">
          <div className="l">Estratégia</div>
          <div className="v">{fund.strategy}</div>
        </div>
        <div className="fhstat">
          <div className="l">Status</div>
          <div className="v" style={{ color: fund.status === "Homologado" ? "var(--green)" : "var(--orange)" }}>{fund.status}</div>
        </div>
        <div className="fhstat">
          <div className="l">ISIN</div>
          <div className="v" style={{ fontSize: 14 }}>{fund.isin}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <select className="fsel" style={{ fontSize: 13, padding: "8px 12px" }} value={fundId} onChange={(e) => onSelectFund(e.target.value)}>
            {FUND_LIST.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}
          </select>
          <button className="btn" onClick={() => go("ordem")}><i className="ti ti-send" />Enviar ordem</button>
        </div>
      </div>

      {!fund.official && (
        <div className="pills mb"><span className="pill o"><span className="pd" />Dados oficiais aguardando factsheet — estrutura espelhada do HPC22</span></div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {TABS.map((t) => (
          <div key={t.id} className={`tab${tab === t.id ? " on" : ""}`} onClick={() => setTab(t.id)}>
            <i className={`ti ${t.icon}`} />{t.label}
          </div>
        ))}
      </div>

      {/* ===== VISÃO ===== */}
      {tab === "visao" && (
        <>
          <div className="card calm mb" style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <i className="ti ti-quote" style={{ fontSize: 26, color: "var(--gold)" }} />
            <div style={{ fontSize: 16, color: "var(--tx)", fontWeight: 500, flex: 1, minWidth: 260 }}>{fund.tagline}</div>
          </div>

          <div className="grid g4 mb">
            {fund.highlights.map((hi, i) => (
              <div className="card" key={i} style={{ textAlign: "center", padding: 18 }}>
                <div className="big" style={{ fontSize: 30, color: hi.tone === "g" ? "var(--green)" : hi.tone === "r" ? "var(--red)" : "var(--gold)" }}>{hi.value}</div>
                <div style={{ fontSize: 11, color: "var(--tx2)", marginTop: 6, fontWeight: 600 }}>{hi.label}</div>
                {hi.sub && <div className="muted" style={{ fontSize: 10.5, marginTop: 3 }}>{hi.sub}</div>}
              </div>
            ))}
          </div>

          <div className="grid g2">
            <div className="card">
              <h3><i className="ti ti-list-details" />Dados do produto</h3>
              <KVGrid rows={fund.productData.map((r) => r)} />
            </div>
            <div className="card">
              <h3><i className="ti ti-award" />Governança & selos</h3>
              <div className="pills">
                {fund.seals.map((s) => (<span className="pill" key={s}><i className="ti ti-circle-check" style={{ color: "var(--gold)", fontSize: 13 }} />{s}</span>))}
              </div>
              <div className="muted mt" style={{ lineHeight: 1.6 }}>Harpian atua exclusivamente como gestora: não recebe recursos, não executa ordens e não custodia ativos. A liquidação ocorre entre corretora/custodiante e a estrutura Lynk/BNYM.</div>
            </div>
          </div>
        </>
      )}

      {/* ===== COMPOSIÇÃO AO VIVO ===== */}
      {tab === "comp" && <ComposicaoAoVivo />}

      {/* ===== PERFORMANCE ===== */}
      {tab === "perf" && (
        <div className="card">
          <h3><i className="ti ti-chart-line" />Performance · bruto vs líquido de taxas</h3>
          <table>
            <thead><tr><th>Métrica</th><th className="num">Bruto</th><th className="num">Líquido</th><th className="num">S&P 500 TR</th></tr></thead>
            <tbody>
              {fund.performance.map((r, i) => (
                <tr key={i}>
                  <td style={{ color: "var(--tx)" }}>{r.metric}</td>
                  <td className="num" style={{ color: "var(--tx2)" }}>{r.gross}</td>
                  <td className="num" style={{ color: "var(--gold)", fontWeight: 600 }}>{r.net}</td>
                  <td className="num" style={{ color: "var(--tx3)" }}>{r.spx}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="muted mt" style={{ lineHeight: 1.6 }}>{fund.perfNote}</div>
        </div>
      )}

      {/* ===== RISCO & JORNADA ===== */}
      {tab === "risco" && (
        fund.journeyRisk.length === 0 ? <Empty label="Análise de risco do HPC11" /> : (
          <>
            <div className="grid g2 mb">
              <div className="card">
                <h3><i className="ti ti-clock" />Dimensão 1 · risco da jornada</h3>
                <div className="muted mb">Quedas ≥ 5% (1990–2025)</div>
                <table>
                  <thead><tr><th>Métrica</th><th className="num">CORE22+</th><th className="num">S&P 500</th></tr></thead>
                  <tbody>
                    {fund.journeyRisk.map((r, i) => (
                      <tr key={i}><td style={{ color: "var(--tx)" }}>{r.metric}</td><td className="num" style={{ color: "var(--gold)", fontWeight: 600 }}>{r.core}</td><td className="num" style={{ color: "var(--tx3)" }}>{r.spx}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card">
                <h3><i className="ti ti-target" />Dimensão 2 · risco do ponto de entrada</h3>
                <div className="muted mb">Comprando no pico anual</div>
                <table>
                  <thead><tr><th>Horizonte</th><th className="num">CORE+ %pos</th><th className="num">CORE+ pior</th><th className="num">S&P %pos</th><th className="num">S&P pior</th></tr></thead>
                  <tbody>
                    {fund.endpointRisk.map((r, i) => (
                      <tr key={i}><td style={{ color: "var(--tx)" }}>{r.horizon}</td><td className="num pos">{r.corePos}</td><td className="num pos">{r.coreWorst}</td><td className="num" style={{ color: "var(--tx3)" }}>{r.spxPos}</td><td className="num neg">{r.spxWorst}</td></tr>
                    ))}
                  </tbody>
                </table>
                <div className="muted mt" style={{ lineHeight: 1.6 }}>{fund.endpointNote}</div>
              </div>
            </div>
            <RiskJourney />
          </>
        )
      )}

      {/* ===== DEFESA ===== */}
      {tab === "defesa" && (
        fund.crisisDefense.length === 0 ? <Empty label="Defesa em crises do HPC11" /> : (
          <div className="card">
            <h3><i className="ti ti-shield-half" />Defesa em crises · drawdown e tempo de recuperação</h3>
            <table>
              <thead><tr><th>Crise</th><th className="num">S&P queda</th><th className="num">S&P recup.</th><th className="num">CORE queda</th><th className="num">CORE recup.</th></tr></thead>
              <tbody>
                {fund.crisisDefense.map((r, i) => (
                  <tr key={i}>
                    <td style={{ color: "var(--tx)" }}>{r.crisis}</td>
                    <td className="num neg">{r.spxDecline}</td>
                    <td className="num" style={{ color: "var(--tx3)" }}>{r.spxRec}</td>
                    <td className="num" style={{ color: "var(--gold)", fontWeight: 600 }}>{r.coreDecline}</td>
                    <td className="num" style={{ color: "var(--tx2)" }}>{r.coreRec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="muted mt" style={{ lineHeight: 1.6 }}>{fund.crisisNote}</div>
          </div>
        )
      )}

      {/* ===== ECONOMIA & ARQUITETURA ===== */}
      {tab === "econ" && (
        <div className="grid g2">
          <div className="card">
            <h3><i className="ti ti-coin" />Economia do ETP</h3>
            <KVGrid rows={fund.economics} />
          </div>
          <div className="card">
            <h3><i className="ti ti-building-bank" />Arquitetura institucional</h3>
            <KVGrid rows={fund.architecture} />
          </div>
          <div className="card">
            <h3><i className="ti ti-id" />Dados para compra</h3>
            <KVGrid rows={fund.purchaseData} />
          </div>
          <div className="card">
            <h3><i className="ti ti-address-book" />Contatos operacionais</h3>
            <KVGrid rows={fund.contacts} />
          </div>
        </div>
      )}

      {/* ===== COMO COMPRAR ===== */}
      {tab === "comprar" && (
        <>
          <div className="card mb">
            <h3><i className="ti ti-route" />Ordem de compra · passo a passo para MFO / broker</h3>
            <div className="grid g4" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
              {fund.purchaseSteps.map((s) => (
                <div key={s.n} style={{ background: "var(--panel2)", border: "1px solid var(--line2)", borderRadius: 10, padding: 14 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--gold)", color: "#1a1205", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>{s.n}</div>
                  <div style={{ fontWeight: 600, color: "var(--tx)", fontSize: 13, marginBottom: 4 }}>{s.title}</div>
                  <div className="muted" style={{ lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600, color: "var(--tx)", fontSize: 15 }}>Pronto para alocar em {fund.ticker}?</div>
              <div className="muted mt">Gere a ordem semiautomática pela integração Lynk.</div>
            </div>
            <button className="btn" onClick={() => go("ordem")}><i className="ti ti-send" />Enviar ordem (Lynk)</button>
          </div>
        </>
      )}

      {/* Disclaimer sempre visível */}
      <div className="card mt" style={{ background: "transparent", borderStyle: "dashed" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <i className="ti ti-alert-triangle" style={{ color: "var(--orange)", fontSize: 15, flexShrink: 0, marginTop: 2 }} />
          <div className="muted" style={{ fontSize: 10.5, lineHeight: 1.6 }}>{fund.disclaimer}</div>
        </div>
      </div>
    </div>
  );
}

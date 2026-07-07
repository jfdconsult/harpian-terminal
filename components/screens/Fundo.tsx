"use client";
import { useState, useEffect } from "react";
import { FUNDS, FUND_LIST, type Fund, type KV } from "@/lib/funds";
import { CLIENTS } from "@/lib/clients";
import { allClients } from "@/lib/clientStore";
import { publishScreenData } from "@/lib/jim-data";
import type { ScreenId } from "@/lib/nav";
import RiskJourney from "./RiskJourney";
import ComposicaoAoVivo from "./ComposicaoAoVivo";
import GrowthChart, { type GrowthSeries } from "./GrowthChart";

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

interface Metrics { cagrPct: number | null; maxDrawdownPct: number | null; ulcerIndex: number | null; sharpe: number | null; sortino: number | null; negativeYears: number }
interface CrisisResult { declinePct: number | null; recoveryMonths: number | null }
interface CrisisRow2 { key: string; label: string; core: CrisisResult; spx: CrisisResult; nasdaq: CrisisResult | null }
interface Benchmarks {
  ok: boolean; asOf: string; years: number;
  full: { core: Metrics; spx: Metrics; nasdaq: Metrics | null };
  crises: CrisisRow2[];
  nasdaqAvailable: boolean;
  note: string;
}

const pct = (v: number | null) => v == null ? "—" : (v >= 0 ? "+" : "") + v.toFixed(1).replace(".", ",") + "%";
const num2 = (v: number | null) => v == null ? "—" : v.toFixed(2).replace(".", ",");
const mo = (v: number | null) => v == null ? "—" : v.toFixed(1).replace(".", ",") + " m";

// Sempre comparativo: CORE22+ é o backtest oficial (factsheet); S&P idem. O Nasdaq
// é calculado por nós ao vivo (Yahoo, mesma metodologia) — nunca fabricado, e nunca
// misturado nas colunas oficiais: vem sempre num bloco à parte, rotulado.
function BenchmarkPerf({ b }: { b: Benchmarks }) {
  const rows: { label: string; core: string; spx: string; nasdaq: string }[] = [
    { label: "CAGR", core: pct(b.full.core.cagrPct), spx: pct(b.full.spx.cagrPct), nasdaq: pct(b.full.nasdaq?.cagrPct ?? null) },
    { label: "Max. drawdown", core: pct(b.full.core.maxDrawdownPct), spx: pct(b.full.spx.maxDrawdownPct), nasdaq: pct(b.full.nasdaq?.maxDrawdownPct ?? null) },
    { label: "Ulcer Index", core: num2(b.full.core.ulcerIndex), spx: num2(b.full.spx.ulcerIndex), nasdaq: num2(b.full.nasdaq?.ulcerIndex ?? null) },
    { label: "Sharpe (rf 3,5%)", core: num2(b.full.core.sharpe), spx: num2(b.full.spx.sharpe), nasdaq: num2(b.full.nasdaq?.sharpe ?? null) },
    { label: "Sortino (rf 3,5%)", core: num2(b.full.core.sortino), spx: num2(b.full.spx.sortino), nasdaq: num2(b.full.nasdaq?.sortino ?? null) },
    { label: "Anos negativos", core: String(b.full.core.negativeYears), spx: String(b.full.spx.negativeYears), nasdaq: b.full.nasdaq ? String(b.full.nasdaq.negativeYears) : "—" },
  ];
  return (
    <div className="card mt">
      <h3><i className="ti ti-chart-bar" />Comparativo — CORE22+ vs S&amp;P 500 vs Nasdaq</h3>
      <table>
        <thead><tr><th>Métrica</th><th className="num">CORE22+</th><th className="num">S&amp;P 500</th><th className="num">Nasdaq</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ color: "var(--tx)" }}>{r.label}</td>
              <td className="num" style={{ color: "var(--gold)", fontWeight: 600 }}>{r.core}</td>
              <td className="num" style={{ color: "var(--tx3)" }}>{r.spx}</td>
              <td className="num" style={{ color: "#9b8cf0" }}>{r.nasdaq}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="muted mt" style={{ lineHeight: 1.6 }}>
        Janela: {b.years} anos (até {b.asOf}). CORE22+ e S&amp;P: backtest oficial do factsheet. Nasdaq (^IXIC): calculado por nós com dado real do Yahoo, mesma metodologia — comparativo, não factsheet auditado.
      </div>
    </div>
  );
}

function BenchmarkCrises({ b }: { b: Benchmarks }) {
  return (
    <div className="card mt">
      <h3><i className="ti ti-shield-half" />Comparativo em crises — CORE22+ vs S&amp;P 500 vs Nasdaq</h3>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead><tr>
            <th>Crise</th>
            <th className="num">CORE queda</th><th className="num">CORE recup.</th>
            <th className="num">S&amp;P queda</th><th className="num">S&amp;P recup.</th>
            <th className="num">Nasdaq queda</th><th className="num">Nasdaq recup.</th>
          </tr></thead>
          <tbody>
            {b.crises.map((c) => (
              <tr key={c.key}>
                <td style={{ color: "var(--tx)" }}>{c.label}</td>
                <td className="num" style={{ color: "var(--gold)", fontWeight: 600 }}>{pct(c.core.declinePct)}</td>
                <td className="num" style={{ color: "var(--tx2)" }}>{mo(c.core.recoveryMonths)}</td>
                <td className="num neg">{pct(c.spx.declinePct)}</td>
                <td className="num" style={{ color: "var(--tx3)" }}>{mo(c.spx.recoveryMonths)}</td>
                <td className="num" style={{ color: "#E74C3C" }}>{pct(c.nasdaq?.declinePct ?? null)}</td>
                <td className="num" style={{ color: "#9b8cf0" }}>{mo(c.nasdaq?.recoveryMonths ?? null)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="muted mt" style={{ lineHeight: 1.6 }}>
        Queda/recuperação ancoradas no pico do S&amp;P 500 (data em que o mercado topou) — mede como cada série se comportou a partir do MESMO ponto de partida. CORE22+/S&amp;P do backtest oficial; Nasdaq calculado por nós (Yahoo, dado real).
      </div>
    </div>
  );
}

const GROWTH_PERIODS = [
  { k: "ytd", l: "YTD" }, { k: "1y", l: "1A" }, { k: "5y", l: "5A" },
  { k: "2016", l: "10A" }, { k: "2006", l: "20A" }, { k: "2000", l: "Completo" },
];

const CLIENT_GRAY = "#8FA0BD"; // sem investimento ainda (antes da data real de entrada)
const CLIENT_GREEN = "#2ECC71"; // investido de verdade (var(--green) — hex fixo, o chart não resolve CSS var)

interface GrowthResp {
  ok: boolean; years: number;
  spx: { time: number; value: number }[]; core: { time: number; value: number }[];
  clientBefore: { time: number; value: number }[] | null; clientAfter: { time: number; value: number }[] | null;
  meta: {
    spxReturn: number; coreReturn: number; clientReturn: number | null; spxMaxDD: number; coreMaxDD: number; clientMaxDD: number | null;
    clientAnnualReturnEst: number | null; investedSince: string | null; coveragePct: number | null;
  };
}

// "A Consequência" do Terminal — acompanha em dólar o portfólio do cliente escolhido vs
// S&P 500 vs o ETP (CORE22+), igual a peça final da apresentação, mas com dado real ao
// vivo (nosso backtest + Yahoo) em vez dos arrays fixos da apresentação.
function PortfolioGrowthCard() {
  const [clients, setClients] = useState(CLIENTS);
  useEffect(() => setClients(allClients()), []);
  const withPortfolio = clients.filter((c) => c.portfolios?.some((p) => (p.items?.length || 0) > 0));
  const [clientId, setClientId] = useState(withPortfolio[0]?.id || "");
  const [period, setPeriod] = useState("2016");
  const [data, setData] = useState<GrowthResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = clientId ? `&clientId=${encodeURIComponent(clientId)}` : "";
    fetch(`/api/portfolio-growth?period=${period}${qs}`)
      .then((r) => r.json())
      .then((j: GrowthResp) => { setData(j.ok ? j : null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [clientId, period]);

  const client = clients.find((c) => c.id === clientId);
  const clientColor = data?.clientAfter?.length ? CLIENT_GREEN : CLIENT_GRAY;
  const series: GrowthSeries[] = [];
  if (data?.clientBefore?.length) series.push({ name: client?.name || "Cliente", color: CLIENT_GRAY, data: data.clientBefore, dashed: true });
  if (data?.clientAfter?.length) series.push({ name: client?.name || "Cliente", color: CLIENT_GREEN, data: data.clientAfter });
  if (data?.spx) series.push({ name: "S&P 500", color: "#E74C3C", data: data.spx });
  if (data?.core) series.push({ name: "CORE22+ (ETP)", color: "#C9A02C", data: data.core });

  return (
    <div className="card mt">
      <div className="flex between wrap mb" style={{ gap: 10 }}>
        <h3 style={{ margin: 0 }}><i className="ti ti-chart-histogram" />A consequência — seu dólar vs S&amp;P 500 vs CORE22+</h3>
        <div className="flex wrap" style={{ gap: 10, alignItems: "center" }}>
          <select className="fsel" style={{ fontSize: 12, padding: "6px 10px", minWidth: 180 }} value={clientId} onChange={(e) => setClientId(e.target.value)}>
            {withPortfolio.length === 0 && <option value="">nenhum cliente com portfólio</option>}
            {withPortfolio.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="seg" style={{ margin: 0 }}>{GROWTH_PERIODS.map((p) => <span key={p.k} className={period === p.k ? "on" : ""} onClick={() => setPeriod(p.k)}>{p.l}</span>)}</div>
        </div>
      </div>
      <div className="muted mb" style={{ lineHeight: 1.6 }}>
        $10.000 aplicados na data real de entrada do cliente ({data?.meta.investedSince || client?.since || "—"}), cobrindo {data?.meta.coveragePct != null ? `${data.meta.coveragePct.toFixed(0)}%` : "—"} do portfólio dele com dado real cadastrado. Antes da entrada a linha fica <b style={{ color: CLIENT_GRAY }}>cinza</b> (sem investimento); a partir da entrada vira <b style={{ color: CLIENT_GREEN }}>verde</b> (investido de verdade).
      </div>

      {data?.meta && (
        <div className="grid g3 mb">
          <div className="card" style={{ padding: 12 }}>
            <div className="muted" style={{ fontSize: 10 }}>{client?.name || "Cliente"} (dólar)</div>
            <div className="big" style={{ fontSize: 19, color: clientColor }}>{data.meta.clientReturn != null ? pct(data.meta.clientReturn) : "—"}</div>
            <div className="muted" style={{ fontSize: 10 }}>MaxDD {data.meta.clientMaxDD != null ? pct(data.meta.clientMaxDD) : "—"}</div>
          </div>
          <div className="card" style={{ padding: 12 }}>
            <div className="muted" style={{ fontSize: 10 }}>S&amp;P 500</div>
            <div className="big" style={{ fontSize: 19, color: "#E74C3C" }}>{pct(data.meta.spxReturn)}</div>
            <div className="muted" style={{ fontSize: 10 }}>MaxDD {pct(data.meta.spxMaxDD)}</div>
          </div>
          <div className="card" style={{ padding: 12, borderColor: "rgba(201,160,44,.3)" }}>
            <div className="muted" style={{ fontSize: 10 }}>CORE22+ (ETP)</div>
            <div className="big" style={{ fontSize: 19, color: "var(--gold)" }}>{pct(data.meta.coreReturn)}</div>
            <div className="muted" style={{ fontSize: 10 }}>MaxDD {pct(data.meta.coreMaxDD)}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="muted" style={{ padding: 70, textAlign: "center" }}>Carregando…</div>
      ) : series.length ? (
        <GrowthChart series={series} />
      ) : (
        <div className="placeholder"><i className="ti ti-cloud-off" /><b>Sem dado suficiente</b></div>
      )}
      <div className="legend" style={{ marginTop: 10 }}>
        <i><b style={{ background: CLIENT_GRAY }} />{client?.name || "Cliente"} (sem investimento)</i>
        <i><b style={{ background: CLIENT_GREEN }} />{client?.name || "Cliente"} (investido, real)</i>
        <i><b style={{ background: "#E74C3C" }} />S&amp;P 500 (real)</i>
        <i><b style={{ background: "#C9A02C" }} />CORE22+ (backtest oficial)</i>
        <span className="muted" style={{ marginLeft: "auto" }}>Escala logarítmica · base $10.000</span>
      </div>
    </div>
  );
}

export default function Fundo({ fundId, onSelectFund, go }: { fundId: string; onSelectFund: (id: string) => void; go: (id: ScreenId) => void }) {
  const [tab, setTab] = useState<Tab>("visao");
  const fund: Fund = FUNDS[fundId] || FUNDS.HPC22;
  const [bench, setBench] = useState<Benchmarks | null>(null);

  // Comparativo sempre-3-vias (CAGR/drawdown/Sortino/crises vs S&P e Nasdaq) — só faz
  // sentido pro fundo que tem o backtest real por trás (CORE22+ = HPC22).
  useEffect(() => {
    if (fund.journeyRisk.length === 0) { setBench(null); return; }
    fetch("/api/fund-benchmarks").then((r) => r.json()).then((j) => { if (j.ok) setBench(j); }).catch(() => {});
  }, [fund]);

  // Publica pro JIM o fundo aberto (resultado e postura — NUNCA o método).
  // Roda de novo a cada troca de aba, exceto "comp"/"risco" — essas têm sub-componente
  // próprio (ComposicaoAoVivo/RiskJourney) que já publica o contexto mais específico
  // daquela aba; se este effect rodasse ali também, sobrescreveria o snapshot mais rico.
  useEffect(() => {
    if (tab === "comp" || tab === "risco") return;
    const destaques = fund.highlights.map((h) => `${h.label}: ${h.value}`).join("; ");
    const nasdaqLine = bench?.full.nasdaq
      ? ` Comparativo com Nasdaq (calculado, dado real): CAGR ${pct(bench.full.nasdaq.cagrPct)}, max drawdown ${pct(bench.full.nasdaq.maxDrawdownPct)}, Sortino ${num2(bench.full.nasdaq.sortino)}.`
      : "";
    publishScreenData(
      "fundo",
      `Ficha do fundo ${fund.ticker} — ${fund.name}. Estratégia: ${fund.strategy}. Status: ${fund.status}. ` +
        `Mostra performance (bruto/líquido vs S&P e vs Nasdaq), risco/jornada, defesa em crises e economia. ` +
        `IMPORTANTE: é a visão do CLIENTE — só resultado e postura, nunca sinais/fórmulas/método.`,
      {
        ticker: fund.ticker, nome: fund.name, estrategia: fund.strategy, status: fund.status,
        destaques: fund.highlights.map((h) => ({ label: h.label, valor: h.value, sub: h.sub })),
        performance: fund.performance.map((p) => ({ metrica: p.metric, bruto: p.gross, liquido: p.net, spx: p.spx })),
        comparativoNasdaq: bench?.full.nasdaq || null,
        crisesComparativo: bench?.crises || null,
      },
      {
        briefing:
          `Você está no fundo **${fund.ticker} — ${fund.name}** (${fund.strategy}, ${fund.status}). ${destaques}.${nasdaqLine}`,
        suggestions: [
          `Como o ${fund.ticker} se compara ao Nasdaq?`,
          `Como o ${fund.ticker} se defende em crises?`,
          `Pra quem esse fundo faz sentido?`,
        ],
      }
    );
  }, [fund, bench, tab]);

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
            {fund.highlights.map((hi, i) => {
              // Anexa o Nasdaq (calculado, real) ao lado do S&P que já vem do factsheet —
              // "sempre comparativo": nunca um número sozinho, sempre com os 2 benchmarks.
              let nasdaqSub: string | null = null;
              if (bench?.full.nasdaq) {
                if (hi.label.startsWith("CAGR")) nasdaqSub = `Nasdaq: ${pct(bench.full.nasdaq.cagrPct)}`;
                else if (hi.label.startsWith("Max. drawdown")) nasdaqSub = `Nasdaq: ${pct(bench.full.nasdaq.maxDrawdownPct)}`;
                else if (hi.label.startsWith("Sortino")) nasdaqSub = `Nasdaq: ${num2(bench.full.nasdaq.sortino)}`;
              }
              return (
                <div className="card" key={i} style={{ textAlign: "center", padding: 18 }}>
                  <div className="big" style={{ fontSize: 30, color: hi.tone === "g" ? "var(--green)" : hi.tone === "r" ? "var(--red)" : "var(--gold)" }}>{hi.value}</div>
                  <div style={{ fontSize: 11, color: "var(--tx2)", marginTop: 6, fontWeight: 600 }}>{hi.label}</div>
                  {hi.sub && <div className="muted" style={{ fontSize: 10.5, marginTop: 3 }}>{hi.sub}</div>}
                  {nasdaqSub && <div className="muted" style={{ fontSize: 10.5, color: "#9b8cf0" }}>{nasdaqSub}</div>}
                </div>
              );
            })}
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
          {bench && <BenchmarkPerf b={bench} />}
          {bench && <PortfolioGrowthCard />}
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
            {bench && <BenchmarkCrises b={bench} />}
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
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <h3><i className="ti ti-engine" />Arquitetura de motores</h3>
            <KVGrid rows={fund.engineArchitecture} />
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

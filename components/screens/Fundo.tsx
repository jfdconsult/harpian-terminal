"use client";
import { useState, useEffect } from "react";
import { FUNDS, FUND_LIST, type Fund, type KV } from "@/lib/funds";
import { CLIENTS } from "@/lib/clients";
import { allClients } from "@/lib/clientStore";
import { publishScreenData } from "@/lib/jim-data";
import type { ScreenId } from "@/lib/nav";
import RiskJourney from "./RiskJourney";
import ComposicaoSnapshot5W from "./ComposicaoSnapshot5W";
import TheVault from "./TheVault";
import GrowthChart, { type GrowthSeries } from "./GrowthChart";

type Tab = "visao" | "vault" | "perf" | "risco" | "defesa" | "comp" | "econ" | "comprar";
// Nova ordem (VOP-first): The Vault vira o default. "Live Composition" saiu do slot 2
// e virou "Composition · 5w snapshot" no final, com delay de 35 dias.
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "visao", label: "Overview", icon: "ti-eye" },
  { id: "vault", label: "The Vault", icon: "ti-shield-lock" },
  { id: "perf", label: "Performance", icon: "ti-chart-line" },
  { id: "risco", label: "Risk & Journey", icon: "ti-activity" },
  { id: "defesa", label: "Crisis Defense", icon: "ti-shield" },
  { id: "comp", label: "Composition · 5w", icon: "ti-layout-grid" },
  { id: "econ", label: "Economics & Architecture", icon: "ti-building-bank" },
  { id: "comprar", label: "How to Buy", icon: "ti-send" },
];

// fund.status stays "Homologado"/"Laboratório" (matched by lib/funds.ts comparisons);
// STATUS_TXT below only controls what's rendered on screen.
const STATUS_TXT: Record<string, string> = {
  Homologado: "Validated",
  "Laboratório": "Lab",
};

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
  return <div className="placeholder"><i className="ti ti-file-dots" /><b>{label}</b><div className="muted mt">Structure ready — will be populated with the official factsheet.</div></div>;
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

// Next Monday 06:00 BRT (09:00 UTC), formatted pt-BR — mirrors the server's
// rotation schedule for the Vault tab chip. Client-side compute (deterministic).
function nextMondayBrtLabel(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntilMon = day === 1 && now.getUTCHours() < 9 ? 0 : (8 - day) % 7 || 7;
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() + daysUntilMon);
  d.setUTCHours(9, 0, 0, 0);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) + " 06:00 BRT";
}

const pct = (v: number | null) => v == null ? "—" : (v >= 0 ? "+" : "") + v.toFixed(1) + "%";
const num2 = (v: number | null) => v == null ? "—" : v.toFixed(2);
const mo = (v: number | null) => v == null ? "—" : v.toFixed(1) + " m";

// Always comparative: CORE22+ is the official (factsheet) backtest; same for S&P. Nasdaq
// is calculated by us live (Yahoo, same methodology) — never fabricated, and never
// mixed into the official columns: it always comes in a separate, labeled block.
function BenchmarkPerf({ b }: { b: Benchmarks }) {
  const rows: { label: string; core: string; spx: string; nasdaq: string }[] = [
    { label: "CAGR", core: pct(b.full.core.cagrPct), spx: pct(b.full.spx.cagrPct), nasdaq: pct(b.full.nasdaq?.cagrPct ?? null) },
    { label: "Max. Drawdown", core: pct(b.full.core.maxDrawdownPct), spx: pct(b.full.spx.maxDrawdownPct), nasdaq: pct(b.full.nasdaq?.maxDrawdownPct ?? null) },
    { label: "Ulcer Index", core: num2(b.full.core.ulcerIndex), spx: num2(b.full.spx.ulcerIndex), nasdaq: num2(b.full.nasdaq?.ulcerIndex ?? null) },
    { label: "Sharpe (rf 3.5%)", core: num2(b.full.core.sharpe), spx: num2(b.full.spx.sharpe), nasdaq: num2(b.full.nasdaq?.sharpe ?? null) },
    { label: "Sortino (rf 3.5%)", core: num2(b.full.core.sortino), spx: num2(b.full.spx.sortino), nasdaq: num2(b.full.nasdaq?.sortino ?? null) },
    { label: "Negative years", core: String(b.full.core.negativeYears), spx: String(b.full.spx.negativeYears), nasdaq: b.full.nasdaq ? String(b.full.nasdaq.negativeYears) : "—" },
  ];
  return (
    <div className="card mt">
      <h3><i className="ti ti-chart-bar" />Comparison — CORE22+ vs S&amp;P 500 vs Nasdaq</h3>
      <table>
        <thead><tr><th>Metric</th><th className="num">CORE22+</th><th className="num">S&amp;P 500</th><th className="num">Nasdaq</th></tr></thead>
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
        Window: {b.years} years (through {b.asOf}). CORE22+ and S&amp;P: official factsheet backtest. Nasdaq (^IXIC): calculated by us using real Yahoo data, same methodology — for comparison, not an audited factsheet.
      </div>
    </div>
  );
}

function BenchmarkCrises({ b }: { b: Benchmarks }) {
  return (
    <div className="card mt">
      <h3><i className="ti ti-shield-half" />Crisis comparison — CORE22+ vs S&amp;P 500 vs Nasdaq</h3>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead><tr>
            <th>Crisis</th>
            <th className="num">CORE decline</th><th className="num">CORE recov.</th>
            <th className="num">S&amp;P decline</th><th className="num">S&amp;P recov.</th>
            <th className="num">Nasdaq decline</th><th className="num">Nasdaq recov.</th>
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
        Decline/recovery anchored to the S&amp;P 500 peak (the date the market topped) — measures how each series behaved from the SAME starting point. CORE22+/S&amp;P from the official backtest; Nasdaq calculated by us (Yahoo, real data).
      </div>
    </div>
  );
}

const GROWTH_PERIODS = [
  { k: "ytd", l: "YTD" }, { k: "1y", l: "1Y" }, { k: "5y", l: "5Y" },
  { k: "2016", l: "10Y" }, { k: "2006", l: "20Y" }, { k: "2000", l: "Full" },
];

const CLIENT_GRAY = "#8FA0BD"; // not invested yet (before actual entry date)
const CLIENT_GREEN = "#2ECC71"; // actually invested (var(--green) — fixed hex, the chart doesn't resolve CSS vars)

interface GrowthResp {
  ok: boolean; years: number;
  spx: { time: number; value: number }[]; core: { time: number; value: number }[];
  clientBefore: { time: number; value: number }[] | null; clientAfter: { time: number; value: number }[] | null;
  meta: {
    spxReturn: number; coreReturn: number; clientReturn: number | null; spxMaxDD: number; coreMaxDD: number; clientMaxDD: number | null;
    clientAnnualReturnEst: number | null; investedSince: string | null; coveragePct: number | null;
  };
}

// The Terminal's "Consequence" — tracks the selected client's portfolio in dollars vs
// S&P 500 vs the ETP (CORE22+), same as the deck's final slide, but with real live
// data (our backtest + Yahoo) instead of the deck's fixed arrays.
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
  if (data?.clientBefore?.length) series.push({ name: client?.name || "Client", color: CLIENT_GRAY, data: data.clientBefore, dashed: true });
  if (data?.clientAfter?.length) series.push({ name: client?.name || "Client", color: CLIENT_GREEN, data: data.clientAfter });
  if (data?.spx) series.push({ name: "S&P 500", color: "#E74C3C", data: data.spx });
  if (data?.core) series.push({ name: "CORE22+ (ETP)", color: "#C9A02C", data: data.core });

  return (
    <div className="card mt">
      <div className="flex between wrap mb" style={{ gap: 10 }}>
        <h3 style={{ margin: 0 }}><i className="ti ti-chart-histogram" />The consequence — your dollar vs S&amp;P 500 vs CORE22+</h3>
        <div className="flex wrap" style={{ gap: 10, alignItems: "center" }}>
          <select className="fsel" style={{ fontSize: 12, padding: "6px 10px", minWidth: 180 }} value={clientId} onChange={(e) => setClientId(e.target.value)}>
            {withPortfolio.length === 0 && <option value="">no client with a portfolio</option>}
            {withPortfolio.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="seg" style={{ margin: 0 }}>{GROWTH_PERIODS.map((p) => <span key={p.k} className={period === p.k ? "on" : ""} onClick={() => setPeriod(p.k)}>{p.l}</span>)}</div>
        </div>
      </div>
      <div className="muted mb" style={{ lineHeight: 1.6 }}>
        $10,000 invested on the client's actual entry date ({data?.meta.investedSince || client?.since || "—"}), covering {data?.meta.coveragePct != null ? `${data.meta.coveragePct.toFixed(0)}%` : "—"} of their portfolio with real registered data. Before entry the line is <b style={{ color: CLIENT_GRAY }}>gray</b> (not invested); from entry onward it turns <b style={{ color: CLIENT_GREEN }}>green</b> (actually invested).
      </div>

      {data?.meta && (
        <div className="grid g3 mb">
          <div className="card" style={{ padding: 12 }}>
            <div className="muted" style={{ fontSize: 10 }}>{client?.name || "Client"} (dollar)</div>
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
        <div className="muted" style={{ padding: 70, textAlign: "center" }}>Loading…</div>
      ) : series.length ? (
        <GrowthChart series={series} />
      ) : (
        <div className="placeholder"><i className="ti ti-cloud-off" /><b>Insufficient data</b></div>
      )}
      <div className="legend" style={{ marginTop: 10 }}>
        <i><b style={{ background: CLIENT_GRAY }} />{client?.name || "Client"} (not invested)</i>
        <i><b style={{ background: CLIENT_GREEN }} />{client?.name || "Client"} (invested, real)</i>
        <i><b style={{ background: "#E74C3C" }} />S&amp;P 500 (real)</i>
        <i><b style={{ background: "#C9A02C" }} />CORE22+ (official backtest)</i>
        <span className="muted" style={{ marginLeft: "auto" }}>Log scale · base $10,000</span>
      </div>
    </div>
  );
}

export default function Fundo({ fundId, onSelectFund, go }: { fundId: string; onSelectFund: (id: string) => void; go: (id: ScreenId) => void }) {
  const [tab, setTab] = useState<Tab>("vault");
  const fund: Fund = FUNDS[fundId] || FUNDS.HPC22;
  const [bench, setBench] = useState<Benchmarks | null>(null);

  // Always-3-way comparison (CAGR/drawdown/Sortino/crises vs S&P and Nasdaq) — only
  // makes sense for the fund that has a real backtest behind it (CORE22+ = HPC22).
  useEffect(() => {
    if (fund.journeyRisk.length === 0) { setBench(null); return; }
    fetch("/api/fund-benchmarks").then((r) => r.json()).then((j) => { if (j.ok) setBench(j); }).catch(() => {});
  }, [fund]);

  // Publishes the open fund to JIM (result and posture — NEVER the method).
  // Re-runs on every tab switch, except "comp"/"risco" — those have their own
  // sub-component (ComposicaoAoVivo/RiskJourney) that already publishes the more specific
  // context for that tab; if this effect also ran there, it would overwrite the richer snapshot.
  useEffect(() => {
    if (tab === "comp" || tab === "risco" || tab === "vault") return;
    const destaques = fund.highlights.map((h) => `${h.label}: ${h.value}`).join("; ");
    const nasdaqLine = bench?.full.nasdaq
      ? ` Comparison with Nasdaq (calculated, real data): CAGR ${pct(bench.full.nasdaq.cagrPct)}, max drawdown ${pct(bench.full.nasdaq.maxDrawdownPct)}, Sortino ${num2(bench.full.nasdaq.sortino)}.`
      : "";
    publishScreenData(
      "fundo",
      `Fund sheet for ${fund.ticker} — ${fund.name}. Strategy: ${fund.strategy}. Status: ${fund.status}. ` +
        `Shows performance (gross/net vs S&P and vs Nasdaq), risk/journey, crisis defense, and economics. ` +
        `IMPORTANT: this is the CLIENT view — only result and posture, never signals/formulas/method.`,
      {
        ticker: fund.ticker, nome: fund.name, estrategia: fund.strategy, status: fund.status,
        destaques: fund.highlights.map((h) => ({ label: h.label, valor: h.value, sub: h.sub })),
        performance: fund.performance.map((p) => ({ metrica: p.metric, bruto: p.gross, liquido: p.net, spx: p.spx })),
        comparativoNasdaq: bench?.full.nasdaq || null,
        crisesComparativo: bench?.crises || null,
      },
      {
        briefing:
          `You're viewing the fund **${fund.ticker} — ${fund.name}** (${fund.strategy}, ${fund.status}). ${destaques}.${nasdaqLine}`,
        suggestions: [
          `How does ${fund.ticker} compare to the Nasdaq?`,
          `How does ${fund.ticker} defend during crises?`,
          `Who is this fund suited for?`,
        ],
      }
    );
  }, [fund, bench, tab]);

  return (
    <div className="screen">
      {/* Fund header */}
      <div className="fhhead">
        <div>
          <div className="tk">{fund.ticker}</div>
          <div className="nm">{fund.name}</div>
        </div>
        <div className="fhstat">
          <div className="l">Strategy</div>
          <div className="v">{fund.strategy}</div>
        </div>
        <div className="fhstat">
          <div className="l">Status</div>
          <div className="v" style={{ color: fund.status === "Homologado" ? "var(--green)" : "var(--orange)" }}>{STATUS_TXT[fund.status] || fund.status}</div>
        </div>
        <div className="fhstat">
          <div className="l">ISIN</div>
          <div className="v" style={{ fontSize: 14 }}>{fund.isin}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <select className="fsel" style={{ fontSize: 13, padding: "8px 12px" }} value={fundId} onChange={(e) => onSelectFund(e.target.value)}>
            {FUND_LIST.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}
          </select>
          <button className="btn" onClick={() => go("ordem")}><i className="ti ti-send" />Submit Order</button>
        </div>
      </div>

      {!fund.official && (
        <div className="pills mb"><span className="pill o"><span className="pd" />Official data pending factsheet — structure mirrored from HPC22</span></div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <div key={t.id} className={`tab${tab === t.id ? " on" : ""}`} onClick={() => setTab(t.id)}>
            <i className={`ti ${t.icon}`} />{t.label}
          </div>
        ))}
        {tab === "vault" && (
          <div style={{
            marginLeft: "auto",
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 12px", borderRadius: 999,
            background: "var(--panel2)", border: "1px solid var(--line2)",
            fontSize: 11, color: "var(--tx3)",
          }}>
            <i className="ti ti-refresh" style={{ color: "var(--gold)", fontSize: 12 }} />
            Next rotation · <b style={{ color: "var(--tx)" }}>{nextMondayBrtLabel()}</b>
          </div>
        )}
      </div>

      {/* ===== OVERVIEW ===== */}
      {tab === "visao" && (
        <>
          <div className="card calm mb" style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <i className="ti ti-quote" style={{ fontSize: 26, color: "var(--gold)" }} />
            <div style={{ fontSize: 16, color: "var(--tx)", fontWeight: 500, flex: 1, minWidth: 260 }}>{fund.tagline}</div>
          </div>

          <div className="grid g4 mb">
            {fund.highlights.map((hi, i) => {
              // Attaches Nasdaq (calculated, real) alongside the S&P that already comes from the factsheet —
              // "always comparative": never a number alone, always with both benchmarks.
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
              <h3><i className="ti ti-list-details" />Product data</h3>
              <KVGrid rows={fund.productData} />
            </div>
            <div className="card">
              <h3><i className="ti ti-award" />Governance & Seals</h3>
              <div className="pills">
                {fund.seals.map((s) => (<span className="pill" key={s}><i className="ti ti-circle-check" style={{ color: "var(--gold)", fontSize: 13 }} />{s}</span>))}
              </div>
              <div className="muted mt" style={{ lineHeight: 1.6 }}>Harpian acts exclusively as manager: it does not receive funds, does not execute orders, and does not custody assets. Settlement occurs between the broker/custodian and the Lynk/BNYM structure.</div>
            </div>
          </div>
        </>
      )}

      {/* ===== COMPOSITION SNAPSHOT · 5-WEEK DELAY ===== */}
      {tab === "comp" && <ComposicaoSnapshot5W />}

      {/* ===== THE VAULT (Verified Opacity Protocol) ===== */}
      {tab === "vault" && <TheVault />}

      {/* ===== PERFORMANCE ===== */}
      {tab === "perf" && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, alignItems: "start" }}>
          {/* LEFT · 2/3 — dollar-growth chart (client vs S&P vs CORE22+) */}
          <div style={{ minWidth: 0 }}>
            {bench ? <PortfolioGrowthCard /> : (
              <div className="card"><div className="placeholder"><i className="ti ti-chart-line" /><b>Loading growth chart…</b></div></div>
            )}
          </div>
          {/* RIGHT · 1/3 — perf table + benchmark stacked */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
            <div className="card">
              <h3><i className="ti ti-chart-line" />Performance · gross vs net</h3>
              <table>
                <thead><tr><th>Metric</th><th className="num">Gross</th><th className="num">Net</th><th className="num">S&P TR</th></tr></thead>
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
              <div className="muted mt" style={{ lineHeight: 1.6, fontSize: 11 }}>{fund.perfNote}</div>
            </div>
            {bench && <BenchmarkPerf b={bench} />}
          </div>
        </div>
      )}

      {/* ===== RISK & JOURNEY ===== */}
      {tab === "risco" && (
        fund.journeyRisk.length === 0 ? <Empty label="Risk analysis for HPC11" /> : (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, alignItems: "start" }}>
            {/* LEFT · 2/3 — journey chart with defense overlay */}
            <div style={{ minWidth: 0 }}>
              <RiskJourney />
            </div>
            {/* RIGHT · 1/3 — two tables stacked (Dimension 1 & 2) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
              <div className="card">
                <h3><i className="ti ti-clock" />Dimension 1 · journey risk</h3>
                <div className="muted mb">Declines ≥ 5% (1990–2025)</div>
                <table>
                  <thead><tr><th>Metric</th><th className="num">CORE22+</th><th className="num">S&P 500</th></tr></thead>
                  <tbody>
                    {fund.journeyRisk.map((r, i) => (
                      <tr key={i}><td style={{ color: "var(--tx)" }}>{r.metric}</td><td className="num" style={{ color: "var(--gold)", fontWeight: 600 }}>{r.core}</td><td className="num" style={{ color: "var(--tx3)" }}>{r.spx}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card">
                <h3><i className="ti ti-target" />Dimension 2 · entry-point risk</h3>
                <div className="muted mb">Buying at the annual peak</div>
                <table>
                  <thead><tr><th>Horizon</th><th className="num">CORE+ %pos</th><th className="num">CORE+ worst</th><th className="num">S&P %pos</th><th className="num">S&P worst</th></tr></thead>
                  <tbody>
                    {fund.endpointRisk.map((r, i) => (
                      <tr key={i}><td style={{ color: "var(--tx)" }}>{r.horizon}</td><td className="num pos">{r.corePos}</td><td className="num pos">{r.coreWorst}</td><td className="num" style={{ color: "var(--tx3)" }}>{r.spxPos}</td><td className="num neg">{r.spxWorst}</td></tr>
                    ))}
                  </tbody>
                </table>
                <div className="muted mt" style={{ lineHeight: 1.6 }}>{fund.endpointNote}</div>
              </div>
            </div>
          </div>
        )
      )}

      {/* ===== CRISIS DEFENSE ===== */}
      {tab === "defesa" && (
        fund.crisisDefense.length === 0 ? <Empty label="Crisis defense for HPC11" /> : (
          <div className="card">
            <h3><i className="ti ti-shield-half" />Crisis defense · drawdown and recovery time</h3>
            <table>
              <thead><tr><th>Crisis</th><th className="num">S&P decline</th><th className="num">S&P recov.</th><th className="num">CORE decline</th><th className="num">CORE recov.</th></tr></thead>
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

      {/* ===== ECONOMICS & ARCHITECTURE ===== */}
      {tab === "econ" && (
        <div className="grid g2">
          <div className="card">
            <h3><i className="ti ti-coin" />ETP economics</h3>
            <KVGrid rows={fund.economics} />
          </div>
          <div className="card">
            <h3><i className="ti ti-building-bank" />Institutional architecture</h3>
            <KVGrid rows={fund.architecture} />
          </div>
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <h3><i className="ti ti-engine" />Engine architecture</h3>
            <KVGrid rows={fund.engineArchitecture} />
          </div>
          <div className="card">
            <h3><i className="ti ti-id" />Purchase data</h3>
            <KVGrid rows={fund.purchaseData} />
          </div>
          <div className="card">
            <h3><i className="ti ti-address-book" />Operational contacts</h3>
            <KVGrid rows={fund.contacts} />
          </div>
        </div>
      )}

      {/* ===== HOW TO BUY ===== */}
      {tab === "comprar" && (
        <>
          <div className="card mb">
            <h3><i className="ti ti-route" />Buy order · step by step for MFO / broker</h3>
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
              <div style={{ fontWeight: 600, color: "var(--tx)", fontSize: 15 }}>Ready to allocate to {fund.ticker}?</div>
              <div className="muted mt">Generate the semi-automated order through the Lynk integration.</div>
            </div>
            <button className="btn" onClick={() => go("ordem")}><i className="ti ti-send" />Submit Order (Lynk)</button>
          </div>
        </>
      )}

      {/* Disclaimer always visible */}
      <div className="card mt" style={{ background: "transparent", borderStyle: "dashed" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <i className="ti ti-alert-triangle" style={{ color: "var(--orange)", fontSize: 15, flexShrink: 0, marginTop: 2 }} />
          <div className="muted" style={{ fontSize: 10.5, lineHeight: 1.6 }}>{fund.disclaimer}</div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect, type ReactNode } from "react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ScreenId } from "@/lib/nav";
import { SR_POSTS, GOV_API } from "@/lib/data";
import { CLIENTS, brl } from "@/lib/clients";
import { allClients, findClient } from "@/lib/clientStore";
import { MARKET_GROUPS } from "@/lib/market";
import { pctText, pctClass, numShort } from "@/lib/format";
import { publishScreenData } from "@/lib/jim-data";
import { HPC22_RN, TOLERANCE } from "@/lib/riskLevels";
import { MiniRegua } from "./Risco";

// ════════════════════════════════════════════════════════════════
// JIM MORNING BRIEFING — proactive intelligence box
// ════════════════════════════════════════════════════════════════

interface DnaLayer { name: string; status: string; data?: Record<string, unknown> }
interface DnaResponse { layers: DnaLayer[]; timestamp: string }

interface BriefingSection { title: string; icon: string; color: string; screenId?: ScreenId; items: BriefingItem[] }
interface BriefingItem { label: string; value: string; color?: string; detail?: string }

function generateBriefingSections(dna: DnaResponse | null): BriefingSection[] {
  const sections: BriefingSection[] = [];

  // 1) PORTFOLIO STATUS
  sections.push({
    title: "Portfólio", icon: "ti-coin", color: "var(--green)", screenId: "fundo" as ScreenId,
    items: [
      { label: "HPC22 Agressivo", value: "+2,31% hoje", color: "var(--green)", detail: "Exposição plena — sem hedge ativo" },
      { label: "HPC11 I.G.", value: "+1,44% hoje", color: "var(--green)", detail: "Investment Grade — dentro da banda" },
      { label: "Movimentação", value: "Sem ajustes", detail: "Última rebalanceamento em 01/jul" },
    ],
  });

  // 2) REGIME & DEFENSE
  sections.push({
    title: "Regime & Defesa", icon: "ti-shield-check", color: "var(--green)", screenId: "regime" as ScreenId,
    items: [
      { label: "Regime atual", value: "RISK-ON", color: "var(--green)", detail: "StormGuard positivo — tendência sustentada" },
      { label: "Defesa", value: "Desarmada", color: "var(--tx2)", detail: "Exposição plena a risco — sem rotação para proteção" },
      { label: "Mudança recente?", value: "Não", detail: "Regime estável há 14 dias consecutivos" },
    ],
  });

  // 3) MARKET DNA (from API)
  if (dna && dna.layers?.length) {
    const dnaItems: BriefingItem[] = [];
    for (const layer of dna.layers) {
      if (!layer.data) continue;
      const d = layer.data;
      if (layer.name === "Volatility & Options") {
        const vix = d.vix_last as number | undefined;
        const regime = d.vol_regime as string | undefined;
        if (vix) dnaItems.push({
          label: "VIX", value: `${vix.toFixed(1)} (${regime || "Normal"})`,
          color: vix < 20 ? "var(--green)" : vix < 30 ? "var(--gold)" : "var(--red)",
          detail: vix < 20 ? "Volatilidade baixa — ambiente favorável para risco" : "Volatilidade elevada — monitorar"
        });
      }
      if (layer.name === "Sentiment & Breadth") {
        const fg = d.fear_greed_score as number | undefined;
        const fgRating = d.fear_greed_rating as string | undefined;
        const breadth = d.pct_above_200ma as number | undefined;
        if (fg) dnaItems.push({
          label: "Fear & Greed", value: `${fg.toFixed(0)} (${fgRating || ""})`,
          color: fg > 60 ? "var(--green)" : fg > 40 ? "var(--gold)" : "var(--red)",
          detail: fg > 60 ? "Mercado ganancioso — atenção a excessos" : fg < 40 ? "Medo predomina — oportunidade ou cautela?" : "Sentimento neutro"
        });
        if (breadth) dnaItems.push({
          label: "Breadth (>200MA)", value: `${breadth.toFixed(0)}%`,
          color: breadth > 60 ? "var(--green)" : breadth > 40 ? "var(--gold)" : "var(--red)",
          detail: breadth > 60 ? "Participação ampla — rally saudável" : "Participação estreita — risco de concentração"
        });
      }
      if (layer.name === "Macro & Rates") {
        const curve = d.yield_curve_spread as number | undefined;
        const curveStatus = d.yield_curve_status as string | undefined;
        if (curve != null) dnaItems.push({
          label: "Curva de Juros", value: `${curve > 0 ? "+" : ""}${(curve * 100).toFixed(0)}bps (${curveStatus || ""})`,
          color: curve > 0 ? "var(--green)" : "var(--red)",
          detail: curve > 0 ? "Curva normalizada — sinal positivo para crescimento" : "Curva invertida — atenção recessiva"
        });
      }
      if (layer.name === "Liquidity (Dark Pool)") {
        const tracked = d.tracked_symbols as number | undefined;
        if (tracked) dnaItems.push({
          label: "Dark Pool", value: `${tracked} ativos monitorados`,
          color: "var(--tx2)", detail: "Volume fora de bolsa — monitoramento institucional"
        });
      }
    }
    if (dnaItems.length) {
      sections.push({ title: "DNA do Mercado", icon: "ti-dna", color: "var(--gold)", screenId: "market-dna" as ScreenId, items: dnaItems });
    }
  }

  // 4) CLIENTS & RISK
  const fora = CLIENTS.filter((c) => c.riskNumber > c.mandate);
  const aum = CLIENTS.reduce((s, c) => s + c.current, 0);
  sections.push({
    title: "Clientes & Risco", icon: "ti-users", color: fora.length ? "var(--red)" : "var(--green)", screenId: "risco" as ScreenId,
    items: [
      { label: "AUM Total", value: brl(aum) },
      { label: "Clientes ativos", value: `${CLIENTS.length}` },
      {
        label: "Fora do mandato", value: fora.length ? `${fora.length} cliente(s)` : "Nenhum",
        color: fora.length ? "var(--red)" : "var(--green)",
        detail: fora.length ? `Atenção: ${fora.map(c => c.name).join(", ")}` : "Todos dentro dos limites",
      },
    ],
  });

  // 5) ECONOMIC CALENDAR & ALERTS
  sections.push({
    title: "Calendário & Alertas", icon: "ti-calendar-event", color: "var(--gold)", screenId: "alertas" as ScreenId,
    items: [
      { label: "Próximo evento", value: "FOMC Minutes — 09/jul", color: "var(--gold)", detail: "Ata do Federal Reserve — pode impactar expectativas de juros" },
      { label: "Payroll", value: "Divulgado 04/jul: 206K", detail: "Acima do consenso (190K) — mercado de trabalho resiliente" },
      { label: "CPI (inflação)", value: "11/jul 09:30 ET", color: "var(--gold)", detail: "Dado mais relevante da semana para política monetária" },
    ],
  });

  return sections;
}

function generateHeadline(dna: DnaResponse | null): { text: string; color: string } {
  const fora = CLIENTS.filter((c) => c.riskNumber > c.mandate).length;
  if (fora > 0) return {
    text: `Atenção: ${fora} cliente(s) fora do mandato de risco. Regime RISK-ON, portfólios positivos, mas ação necessária na conformidade.`,
    color: "var(--red)"
  };

  if (dna?.layers?.length) {
    const volLayer = dna.layers.find(l => l.name === "Volatility & Options");
    const vix = volLayer?.data?.vix_last as number | undefined;
    const sentLayer = dna.layers.find(l => l.name === "Sentiment & Breadth");
    const fg = sentLayer?.data?.fear_greed_score as number | undefined;

    if (vix && vix > 25) return {
      text: `VIX em ${vix.toFixed(1)} — volatilidade elevada. Regime RISK-ON sustentado, mas monitore de perto. Portfólios positivos.`,
      color: "var(--gold)"
    };
    if (fg && fg < 30) return {
      text: `Fear & Greed em ${fg.toFixed(0)} (medo extremo). Historicamente, esses níveis precedem recuperações. Regime RISK-ON intacto.`,
      color: "var(--gold)"
    };
    if (fg && fg > 80) return {
      text: `Fear & Greed em ${fg.toFixed(0)} (ganância extrema). Cautela — excessos de otimismo frequentemente antecedem correções.`,
      color: "var(--gold)"
    };
  }

  return {
    text: "Dia tranquilo. Regime RISK-ON estável, portfólios positivos, todos os clientes dentro do mandato. Nenhuma ação urgente necessária.",
    color: "var(--green)"
  };
}

function JimMorningBriefing({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const [dna, setDna] = useState<DnaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    fetch(`${GOV_API}/api/market-dna`)
      .then(r => r.json())
      .then((d: DnaResponse) => { setDna(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const sections = generateBriefingSections(dna);
  const headline = generateHeadline(dna);
  const now = new Date();
  const hora = now.getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const dataStr = now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{
      background: "var(--panel)",
      border: "1px solid var(--line2)",
      borderRadius: 14,
      padding: "24px 28px",
      marginBottom: 18,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Gold accent line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, var(--gold), rgba(201,160,44,0.3), var(--gold))" }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--gold), #B8860B)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 20px rgba(201,160,44,0.3)",
          }}>
            <i className="ti ti-brain" style={{ fontSize: 22, color: "#0C1930" }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--tx)", letterSpacing: "0.5px" }}>
              JIM — Morning Briefing
            </div>
            <div style={{ fontSize: 11.5, color: "var(--tx3)", marginTop: 2 }}>
              {saudacao}, João · {dataStr} · Atualizado {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn ghost" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => go("market-dna")}>
            <i className="ti ti-dna" style={{ marginRight: 4 }} />Market DNA
          </button>
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              background: "none", border: "1px solid var(--line2)", borderRadius: 6,
              padding: "4px 8px", cursor: "pointer", color: "var(--tx3)", fontSize: 12,
            }}
            title={expanded ? "Recolher" : "Expandir"}
          >
            <i className={`ti ${expanded ? "ti-chevron-up" : "ti-chevron-down"}`} />
          </button>
        </div>
      </div>

      {/* Headline */}
      <div style={{
        background: "rgba(201,160,44,0.08)",
        border: "1px solid rgba(201,160,44,0.2)",
        borderRadius: 10, padding: "14px 18px", marginBottom: expanded ? 20 : 0,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <i className="ti ti-bulb" style={{ color: headline.color, fontSize: 18, marginTop: 1, flexShrink: 0 }} />
          <div style={{ fontSize: 14, color: "var(--tx)", lineHeight: 1.55 }}>
            {loading ? <span className="muted">Analisando dados do mercado...</span> : headline.text}
          </div>
        </div>
      </div>

      {/* Sections grid */}
      {expanded && !loading && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 14,
        }}>
          {sections.map((sec) => (
            <div key={sec.title} style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid var(--line2)",
              borderRadius: 10, padding: "14px 16px",
            }}>
              <div
                onClick={sec.screenId ? () => go(sec.screenId!) : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  fontSize: 11, fontWeight: 600, color: sec.color,
                  textTransform: "uppercase", letterSpacing: "1px",
                  marginBottom: 10, paddingBottom: 8,
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  cursor: sec.screenId ? "pointer" : "default",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => { if (sec.screenId) e.currentTarget.style.opacity = "0.7"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                <i className={`ti ${sec.icon}`} style={{ fontSize: 15 }} />
                {sec.title}
                {sec.screenId && <i className="ti ti-arrow-right" style={{ fontSize: 12, marginLeft: "auto", opacity: 0.5 }} />}
              </div>
              {sec.items.map((item, i) => (
                <div key={i} style={{ marginBottom: i < sec.items.length - 1 ? 8 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: 12.5, color: "var(--tx2)" }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: item.color || "var(--tx)" }}>{item.value}</span>
                  </div>
                  {item.detail && (
                    <div style={{ fontSize: 10.5, color: "var(--tx3)", marginTop: 2, lineHeight: 1.4 }}>{item.detail}</div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {expanded && loading && (
        <div style={{ textAlign: "center", padding: "20px 0", color: "var(--tx3)", fontSize: 13 }}>
          <i className="ti ti-loader" style={{ marginRight: 8, animation: "spin 1s linear infinite" }} />
          Consolidando inteligência de mercado...
        </div>
      )}
    </div>
  );
}

// Uma instância de módulo no painel — o mesmo módulo do catálogo (ex.: "cotacoes")
// pode aparecer VÁRIAS vezes, cada instância com sua própria config (classe de
// ativo, ou o cliente de quem mostrar a carteira). Isso é o que permite montar
// "um módulo de Índices, outro de Ações, outro da carteira da Vera" lado a lado.
interface WidgetInstance { instanceId: string; catalogId: string; config?: Record<string, string> }

interface ConfigField { key: string; label: string; options: { value: string; label: string }[] }
interface WidgetDef {
  id: string;
  title: string;
  icon: string;
  allowMultiple?: boolean;
  configFields?: ConfigField[];
  titleFor?: (config?: Record<string, string>) => string;
  render?: (go: (id: ScreenId, param?: string) => void) => ReactNode;
  Component?: React.ComponentType<{ go: (id: ScreenId, param?: string) => void; config?: Record<string, string> }>;
}

interface Quote { symbol: string; price?: number; dayPct?: number | null; error?: boolean }

// ---- Cotações (configurável por classe: Índices, Ações, Commodities, Cripto, Forex...) ----
const QUOTE_CLASSES = Object.keys(MARKET_GROUPS);

function CotacoesWidgetBody({ go, config }: { go: (id: ScreenId, param?: string) => void; config?: Record<string, string> }) {
  const classe = config?.classe && MARKET_GROUPS[config.classe] ? config.classe : QUOTE_CLASSES[0];
  const symbols = (MARKET_GROUPS[classe] || []).slice(0, 5);
  const [rows, setRows] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbols.length) { setRows([]); setLoading(false); return; }
    setLoading(true);
    fetch(`/api/quotes?symbols=${encodeURIComponent(symbols.map((s) => s.symbol).join(","))}`)
      .then((r) => r.json())
      .then((d: Quote[]) => { setRows(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [classe]);

  const nameOf: Record<string, string> = symbols.reduce((m, s) => { m[s.symbol] = s.name; return m; }, {} as Record<string, string>);

  return (
    <>
      {loading ? (
        <div className="muted" style={{ padding: "10px 0" }}>Carregando {classe.toLowerCase()}…</div>
      ) : (
        rows.map((q) => (
          <div className="kv" key={q.symbol}>
            <span>{nameOf[q.symbol] || q.symbol}</span>
            <span className={`v ${pctClass(q.dayPct)}`}>{q.error ? "—" : `${numShort(q.price)} ${pctText(q.dayPct)}`}</span>
          </div>
        ))
      )}
      <div className="mt"><button className="btn ghost" onClick={() => go("cotacoes")}><i className="ti ti-arrow-right" />Ver todas as cotações</button></div>
    </>
  );
}

// ---- Carteira do cliente (configurável por cliente) — o detalhamento real: o que ele tem e o que está ganhando ----
function CarteiraWidgetBody({ go, config }: { go: (id: ScreenId, param?: string) => void; config?: Record<string, string> }) {
  const [clients, setClients] = useState(CLIENTS);
  useEffect(() => setClients(allClients()), []);
  const client = (config?.clientId && findClient(config.clientId)) || clients[0];
  const portfolio = client?.portfolios?.find((p) => p.positions.length > 0);
  const [live, setLive] = useState<Record<string, Quote>>({});

  useEffect(() => {
    if (!portfolio) { setLive({}); return; }
    const syms = portfolio.positions.map((p) => p.ticker).join(",");
    if (!syms) return;
    fetch(`/api/quotes?symbols=${encodeURIComponent(syms)}`)
      .then((r) => r.json())
      .then((d: Quote[]) => setLive(d.reduce((m, q) => { m[q.symbol] = q; return m; }, {} as Record<string, Quote>)))
      .catch(() => {});
  }, [portfolio]);

  if (!client) return <div className="muted">Nenhum cliente cadastrado.</div>;
  const ganhoPct = (client.current / client.invested - 1) * 100;

  return (
    <>
      <div className="flex between mb"><span style={{ fontWeight: 600, color: "var(--tx)" }}>{client.name}</span><span className={`v ${pctClass(ganhoPct)}`}>{pctText(ganhoPct)}</span></div>
      {portfolio ? (
        portfolio.positions.slice(0, 4).map((pos) => {
          const q = live[pos.ticker];
          const gainPct = q?.price ? ((q.price - pos.avgPrice) / pos.avgPrice) * 100 : null;
          return (
            <div className="kv" key={pos.ticker}>
              <span>{pos.ticker} <span className="muted">{pos.qty.toLocaleString("pt-BR")} un.</span></span>
              <span className={`v ${pctClass(gainPct)}`}>{gainPct != null ? pctText(gainPct) : "…"}</span>
            </div>
          );
        })
      ) : (
        client.alloc.slice(0, 4).map((a) => (
          <div className="kv" key={a.label}><span>{a.label}</span><span className="v">{a.pct}%</span></div>
        ))
      )}
      <div className="mt"><button className="btn ghost" onClick={() => go("cliente", client.id)}><i className="ti ti-arrow-right" />Abrir carteira completa</button></div>
    </>
  );
}

// ---- Risco por cliente (configurável por cliente) — a régua de 4 níveis, versão compacta ----
function RiscoClienteWidgetBody({ go, config }: { go: (id: ScreenId, param?: string) => void; config?: Record<string, string> }) {
  const [clients, setClients] = useState(CLIENTS);
  useEffect(() => setClients(allClients()), []);
  const client = (config?.clientId && findClient(config.clientId)) || clients[0];
  if (!client) return <div className="muted">Nenhum cliente cadastrado.</div>;

  const tol = TOLERANCE[client.profile];
  const gap = client.riskNumber - client.mandate;
  const markers = [
    { v: HPC22_RN, color: "#C9A02C", label: "produto" },
    { v: client.mandate, color: "#4A90D9", label: "mandato" },
    { v: tol, color: "#EAF0F7", label: "tolerância" },
    { v: client.riskNumber, color: gap > 0 ? "#E74C3C" : "#2ECC71", label: "portfólio" },
  ];

  return (
    <>
      <div className="flex between mb"><span style={{ fontWeight: 600, color: "var(--tx)" }}>{client.name}</span><span className={`v ${gap > 0 ? "neg" : "pos"}`}>{gap > 0 ? `▲ +${gap}` : "✓ dentro"}</span></div>
      <div style={{ position: "relative", height: 26, margin: "6px 4px 4px" }}>
        <div style={{ position: "absolute", top: 11, left: 0, right: 0, height: 6, borderRadius: 3, background: "linear-gradient(90deg,#2ECC71,#F39C12,#E74C3C)" }} />
        {markers.map((m) => (
          <div key={m.label} title={`${m.label} ${m.v}`} style={{ position: "absolute", top: 8, left: `${m.v}%`, transform: "translateX(-50%)", width: 3, height: 12, borderRadius: 2, background: m.color }} />
        ))}
      </div>
      <div className="legend" style={{ fontSize: 9.5, marginTop: 2 }}>
        <i><b style={{ background: "#C9A02C" }} />Produto {HPC22_RN}</i>
        <i><b style={{ background: "#4A90D9" }} />Mandato {client.mandate}</i>
        <i><b style={{ background: "#EAF0F7" }} />Tolerância {tol}</i>
        <i><b style={{ background: gap > 0 ? "#E74C3C" : "#2ECC71" }} />Portfólio {client.riskNumber}</i>
      </div>
      <div className="mt"><button className="btn ghost" onClick={() => go("risco")}><i className="ti ti-arrow-right" />Ver régua completa</button></div>
    </>
  );
}

// ---- Todos os clientes na régua — panorama comparativo, um módulo só (sem config) ----
function TodosClientesReguaWidgetBody({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const [clients, setClients] = useState(CLIENTS);
  useEffect(() => setClients(allClients()), []);
  const fora = clients.filter((c) => c.riskNumber > c.mandate);

  return (
    <>
      <div className="flex between mb"><span className="muted">{clients.length} clientes</span><span className={`tag ${fora.length ? "r" : "g"}`}>{fora.length ? `${fora.length} fora do mandato` : "todos dentro"}</span></div>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead><tr>
            <th>Cliente</th><th className="num">Portfólio</th><th className="num">Mandato</th><th>Distribuição</th><th>Alinhamento</th>
          </tr></thead>
          <tbody>
            {clients.map((c) => {
              const aligned = c.riskNumber <= c.mandate;
              const t = TOLERANCE[c.profile];
              return (
                <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => go("risco")}>
                  <td style={{ fontWeight: 600, color: "var(--tx)", fontSize: 12 }}>{c.name}</td>
                  <td className="num" style={{ color: aligned ? "var(--tx)" : "var(--red)", fontWeight: 600 }}>{c.riskNumber}</td>
                  <td className="num" style={{ color: "var(--tx2)" }}>{c.mandate}</td>
                  <td><MiniRegua portfolio={c.riskNumber} tolerance={t} mandate={c.mandate} /></td>
                  <td>{aligned ? <span className="tag g">dentro</span> : <span className="tag r">▲ +{c.riskNumber - c.mandate}</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt"><button className="btn ghost" onClick={() => go("risco")}><i className="ti ti-arrow-right" />Ver detalhe por cliente</button></div>
    </>
  );
}

const CATALOG: Record<string, WidgetDef> = {
  fundos: {
    id: "fundos", title: "Seus fundos hoje", icon: "ti-coin",
    render: (go) => (
      <>
        <div className="flex between mb"><span>HPC22 · Agressivo</span><span className="big g" style={{ fontSize: 24 }}>+2,31%</span></div>
        <div className="flex between"><span>HPC11 · I.G.</span><span className="big g" style={{ fontSize: 24 }}>+1,44%</span></div>
        <div className="mt"><button className="btn ghost" onClick={() => go("fundo", "HPC22")}><i className="ti ti-arrow-right" />Abrir HPC22</button></div>
      </>
    ),
  },
  etp: {
    id: "etp", title: "Comprados no ETP", icon: "ti-basket",
    render: () => (
      <>
        {[["NVDA", "+2,4%"], ["AVGO", "+1,9%"], ["XOM", "+1,1%"], ["JPM", "−0,4%"]].map(([t, c]) => (
          <div className="kv" key={t}><span>{t} <span className="muted">5,0%</span></span><span className="v" style={{ color: c.startsWith("−") ? "var(--red)" : "var(--green)" }}>{c}</span></div>
        ))}
        <div className="muted mt">+16 posições · ver composição ›</div>
      </>
    ),
  },
  regime: {
    id: "regime", title: "Regime & Defesa", icon: "ti-activity",
    render: (go) => (
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <div className="big g" style={{ fontSize: 30 }}>RISK-ON</div>
        <div className="muted mt">defesa desarmada · exposição plena</div>
        <div style={{ height: 8, borderRadius: 4, background: "#08182c", marginTop: 12, overflow: "hidden" }}>
          <div style={{ width: "96%", height: "100%", background: "linear-gradient(90deg,var(--gold),var(--green))" }} />
        </div>
        <div className="mt"><button className="btn ghost" onClick={() => go("regime")}><i className="ti ti-arrow-right" />Ver regime</button></div>
      </div>
    ),
  },
  noticias: {
    id: "noticias", title: "Notícias", icon: "ti-news",
    render: (go) => (
      <>
        {["Fed mantém juros; sinaliza dependência de dados", "Goldman eleva alvo do S&P 500 para 5.600", "Ouro renova máxima acima de US$ 2.400"].map((h, i) => (
          <div className="kv" key={i}><span style={{ fontSize: 12.5 }}>{h}</span></div>
        ))}
        <div className="mt"><button className="btn ghost" onClick={() => go("news-broadcast")}><i className="ti ti-arrow-right" />Ver News Broadcast</button></div>
      </>
    ),
  },
  cotacoes: {
    id: "cotacoes", title: "Cotações", icon: "ti-table",
    allowMultiple: true,
    configFields: [{ key: "classe", label: "Classe", options: QUOTE_CLASSES.map((c) => ({ value: c, label: c })) }],
    titleFor: (config) => `Cotações · ${config?.classe || QUOTE_CLASSES[0]}`,
    Component: CotacoesWidgetBody,
  },
  carteira: {
    id: "carteira", title: "Carteira do cliente", icon: "ti-briefcase",
    allowMultiple: true,
    configFields: [{ key: "clientId", label: "Cliente", options: CLIENTS.map((c) => ({ value: c.id, label: c.name })) }],
    titleFor: (config) => {
      const c = config?.clientId ? CLIENTS.find((x) => x.id === config.clientId) : null;
      return `Carteira · ${c?.name || CLIENTS[0].name}`;
    },
    Component: CarteiraWidgetBody,
  },
  alocacao: {
    id: "alocacao", title: "Alocação por fundo", icon: "ti-chart-donut",
    render: () => (
      <>
        <div className="kv"><span>HPC22 · Agressivo</span><span className="v">62%</span></div>
        <div className="kv"><span>HPC11 · I.G.</span><span className="v">28%</span></div>
        <div className="kv"><span>Caixa</span><span className="v">10%</span></div>
      </>
    ),
  },
  social: {
    id: "social", title: "Social Radar", icon: "ti-radar-2",
    render: (go) => (
      <>
        {SR_POSTS.slice(0, 3).map((p) => (
          <div className="kv" key={p.id}><span style={{ fontSize: 12.5, color: "var(--tx2)" }}>{p.account}</span><span className="muted" style={{ fontSize: 10 }}>{p.impact}</span></div>
        ))}
        <div className="mt"><button className="btn ghost" onClick={() => go("social-radar")}><i className="ti ti-arrow-right" />Ver Social Radar</button></div>
      </>
    ),
  },
  clientes: {
    id: "clientes", title: "Clientes", icon: "ti-users",
    render: (go) => {
      const aum = CLIENTS.reduce((s, c) => s + c.current, 0);
      const fora = CLIENTS.filter((c) => c.riskNumber > c.mandate).length;
      return (
        <>
          <div className="kv"><span>AUM total</span><span className="v">{brl(aum)}</span></div>
          <div className="kv"><span>Clientes</span><span className="v">{CLIENTS.length}</span></div>
          <div className="kv"><span>Fora do mandato</span><span className="v" style={{ color: fora ? "var(--red)" : "var(--green)" }}>{fora}</span></div>
          <div className="mt"><button className="btn ghost" onClick={() => go("clientes")}><i className="ti ti-arrow-right" />Ver clientes</button></div>
        </>
      );
    },
  },
  alertas: {
    id: "alertas", title: "Alertas", icon: "ti-bell",
    render: (go) => {
      const fora = CLIENTS.filter((c) => c.riskNumber > c.mandate);
      return (
        <>
          {fora.slice(0, 3).map((c) => (<div className="kv" key={c.id}><span style={{ fontSize: 12.5 }}><span className="tag r">risco</span> {c.name}</span></div>))}
          <div className="mt"><button className="btn ghost" onClick={() => go("alertas")}><i className="ti ti-arrow-right" />Ver alertas</button></div>
        </>
      );
    },
  },
  risco: {
    id: "risco", title: "Risco · 4 níveis por cliente", icon: "ti-scale",
    allowMultiple: true,
    configFields: [{ key: "clientId", label: "Cliente", options: CLIENTS.map((c) => ({ value: c.id, label: c.name })) }],
    titleFor: (config) => {
      const c = config?.clientId ? CLIENTS.find((x) => x.id === config.clientId) : null;
      return `Risco · ${c?.name || CLIENTS[0].name}`;
    },
    Component: RiscoClienteWidgetBody,
  },
  "risco-todos": {
    id: "risco-todos", title: "Todos os clientes na régua", icon: "ti-users-group",
    Component: TodosClientesReguaWidgetBody,
  },
};

const uid = () => Math.random().toString(36).slice(2, 9);
const DEFAULT_INSTANCES: WidgetInstance[] = [
  { instanceId: "fundos", catalogId: "fundos" },
  { instanceId: "etp", catalogId: "etp" },
  { instanceId: "regime", catalogId: "regime" },
];

const WIDGETS_KEY = "harpian_painel_widgets";
function loadWidgets(): WidgetInstance[] {
  if (typeof window === "undefined") return DEFAULT_INSTANCES;
  try {
    const raw = JSON.parse(localStorage.getItem(WIDGETS_KEY) || "null");
    return Array.isArray(raw) && raw.length ? raw : DEFAULT_INSTANCES;
  } catch {
    return DEFAULT_INSTANCES;
  }
}
function saveWidgets(w: WidgetInstance[]) {
  if (typeof window !== "undefined") localStorage.setItem(WIDGETS_KEY, JSON.stringify(w));
}

function SortableCard({
  instance, def, editing, onRemove, onConfigChange, children,
}: {
  instance: WidgetInstance; def: WidgetDef; editing: boolean;
  onRemove: () => void; onConfigChange: (config: Record<string, string>) => void; children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: instance.instanceId, disabled: !editing });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 10 : undefined };
  const [configuring, setConfiguring] = useState(false);
  const title = def.titleFor ? def.titleFor(instance.config) : def.title;

  return (
    <div ref={setNodeRef} style={style} className="card calm">
      {editing && (
        <>
          <div className="drag-handle" {...attributes} {...listeners}><i className="ti ti-grip-vertical" /></div>
          <div className="rm-btn" onClick={onRemove}><i className="ti ti-x" /></div>
          {def.configFields && (
            <div className="rm-btn" style={{ right: 34 }} onClick={() => setConfiguring((v) => !v)} title="Configurar módulo">
              <i className="ti ti-settings" />
            </div>
          )}
        </>
      )}
      <h3><i className={`ti ${def.icon}`} />{title}</h3>
      {configuring && def.configFields && (
        <div style={{ background: "var(--panel2)", border: "1px solid var(--line2)", borderRadius: 8, padding: 10, marginBottom: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {def.configFields.map((f) => (
            <label key={f.key} style={{ fontSize: 11 }}>
              {f.label}
              <select
                className="input" style={{ width: "100%", marginTop: 3 }}
                value={instance.config?.[f.key] || f.options[0]?.value}
                onChange={(e) => onConfigChange({ ...instance.config, [f.key]: e.target.value })}
              >
                {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}

export default function Painel({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const [widgets, setWidgets] = useState<WidgetInstance[]>(DEFAULT_INSTANCES);
  const [editing, setEditing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Carrega o layout salvo (módulos + configs) assim que monta no cliente.
  useEffect(() => setWidgets(loadWidgets()), []);
  // Persiste a cada mudança — personalização sobrevive ao refresh.
  useEffect(() => { saveWidgets(widgets); }, [widgets]);

  // Publica pro JIM o resumo do dia (o essencial do painel).
  useEffect(() => {
    const aum = CLIENTS.reduce((s, c) => s + c.current, 0);
    const fora = CLIENTS.filter((c) => c.riskNumber > c.mandate).length;
    publishScreenData(
      "painel",
      "Painel do gestor: fundos do dia (HPC22 Agressivo, HPC11 I.G.), regime de mercado, defesa, e resumo de clientes (AUM, fora do mandato). Painel é personalizável: módulos de Cotações (por classe de ativo) e Carteira do cliente podem ser adicionados várias vezes, cada um configurado diferente.",
      {
        HPC22_hoje: "+2,31%", HPC11_hoje: "+1,44%",
        regime: "RISK-ON", defesa: "desarmada · exposição plena",
        clientes: CLIENTS.length, aumTotal: aum, foraDoMandato: fora,
      },
      {
        briefing:
          `Bom dia! Resumo de hoje: **HPC22 +2,31%**, **HPC11 +1,44%**. Regime **RISK-ON** (defesa desarmada). ` +
          `${CLIENTS.length} clientes, AUM ${brl(aum)}` + (fora ? `, **${fora} fora do mandato**.` : ", todos dentro do mandato."),
        suggestions: [
          "Como estão os fundos hoje?",
          fora ? "Quais clientes estão fora do mandato?" : "Algum cliente exige atenção?",
          "Por que o regime está RISK-ON?",
        ],
      }
    );
  }, []);

  function addWidget(catalogId: string) {
    const def = CATALOG[catalogId];
    if (!def) return;
    if (!def.allowMultiple && widgets.some((w) => w.catalogId === catalogId)) { setShowAdd(false); return; }
    const config = def.configFields ? Object.fromEntries(def.configFields.map((f) => [f.key, f.options[0]?.value])) : undefined;
    setWidgets((cur) => [...cur, { instanceId: uid(), catalogId, config }]);
    setShowAdd(false);
  }
  function removeWidget(instanceId: string) {
    setWidgets((cur) => cur.filter((w) => w.instanceId !== instanceId));
  }
  function updateConfig(instanceId: string, config: Record<string, string>) {
    setWidgets((cur) => cur.map((w) => (w.instanceId === instanceId ? { ...w, config } : w)));
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setWidgets((w) => {
        const from = w.findIndex((x) => x.instanceId === active.id);
        const to = w.findIndex((x) => x.instanceId === over.id);
        return arrayMove(w, from, to);
      });
    }
  }
  // Módulos únicos (allowMultiple=false) já adicionados somem do menu; os
  // configuráveis (Cotações, Carteira) ficam sempre disponíveis — dá pra
  // adicionar quantos quiser, cada um numa classe/cliente diferente.
  const available = Object.values(CATALOG).filter((w) => w.allowMultiple || !widgets.some((inst) => inst.catalogId === w.id));

  return (
    <div className={`screen${editing ? " editing" : ""}`}>
      <div className="crumb"><b>Painel</b></div>
      <div className="flex between" style={{ alignItems: "flex-start" }}>
        <div><div className="h1">Bom dia, João</div><div className="sub">O essencial do dia. {editing ? "Arraste para reorganizar, adicione módulos (Cotações e Carteira podem repetir, cada um com sua própria configuração — clique na engrenagem) ou remova." : "Tudo o mais está a um clique nos menus do topo."}</div></div>
        <div className="flex" style={{ gap: 8, alignItems: "center" }}>
          {editing && (
            <>
              <div style={{ position: "relative" }}>
                <button className="btn ghost" style={{ padding: "6px 11px", fontSize: 12 }} onClick={() => setShowAdd((v) => !v)}>
                  <i className="ti ti-plus" />Adicionar módulo<i className="ti ti-chevron-down" style={{ fontSize: 12 }} />
                </button>
                {showAdd && (
                  <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: "var(--panel)", border: "1px solid var(--line2)", borderRadius: 10, boxShadow: "0 18px 50px rgba(0,0,0,.55)", padding: 6, minWidth: 230, zIndex: 60, maxHeight: 340, overflowY: "auto" }}>
                    {available.length === 0
                      ? <div className="muted" style={{ padding: 10, fontSize: 12 }}>Todos os módulos já estão no painel.</div>
                      : available.map((w) => (
                        <div key={w.id} className="dd-item" onClick={() => addWidget(w.id)}>
                          <i className={`ti ${w.icon}`} />{w.title}{w.allowMultiple && <span className="muted" style={{ marginLeft: "auto", fontSize: 10 }}>+ adicionar outro</span>}
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <button className="btn ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => setWidgets(DEFAULT_INSTANCES)} title="Restaurar padrão"><i className="ti ti-rotate" /></button>
            </>
          )}
          <button
            onClick={() => { setEditing((v) => !v); setShowAdd(false); }}
            title={editing ? "Concluir" : "Personalizar painel"}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
              fontSize: 12, padding: "6px 11px", borderRadius: 7, fontFamily: "var(--sans)",
              border: `1px solid ${editing ? "var(--gold)" : "var(--line2)"}`,
              background: editing ? "rgba(201,160,44,.15)" : "transparent",
              color: editing ? "var(--gold)" : "var(--tx3)",
            }}>
            <i className={`ti ${editing ? "ti-check" : "ti-layout-grid-add"}`} />{editing ? "Concluir" : "Personalizar"}
          </button>
        </div>
      </div>

      <JimMorningBriefing go={go} />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={widgets.map((w) => w.instanceId)} strategy={rectSortingStrategy}>
          <div className="grid g3">
            {widgets.map((instance) => {
              const def = CATALOG[instance.catalogId];
              if (!def) return null;
              return (
                <SortableCard
                  key={instance.instanceId} instance={instance} def={def} editing={editing}
                  onRemove={() => removeWidget(instance.instanceId)}
                  onConfigChange={(config) => updateConfig(instance.instanceId, config)}
                >
                  {def.Component ? <def.Component go={go} config={instance.config} /> : def.render?.(go)}
                </SortableCard>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {editing && available.length > 0 && (
        <div className="muted mt" style={{ fontSize: 11 }}>{available.length} módulo(s) disponíveis para adicionar · Cotações e Carteira do cliente podem ser adicionados várias vezes, cada um com sua própria configuração.</div>
      )}
    </div>
  );
}

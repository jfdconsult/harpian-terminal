"use client";
import { useState, useEffect, type ReactNode } from "react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ScreenId } from "@/lib/nav";
import { GOV_API } from "@/lib/data";
import { fetchNews, fetchSocialTrending, IMPACT_COLOR, SENTIMENT_COLOR, type NewsHeadline, type SocialPost } from "@/lib/feeds";
import { RadarSvg, buildLayersFromApi, regimeLabel, type IntelLayer } from "./MarketDna";
import RegimeGauge from "../RegimeGauge";
import { fetchSnapshot, type RegimeState } from "@/lib/snapshot";
import { fetchCalendar, type CalendarResp } from "@/lib/calendar";
import { type DnaRaw } from "@/lib/jim-market-analysis";
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

// gov-data returns `layers` as an OBJECT ({volatility, sentiment, breadth,
// macro, positioning...}), not as a list. This file read it as a list, so
// the "Market DNA" section of the briefing NEVER appeared — `.length` was
// undefined and the whole block was silently skipped.

interface BriefingSection { title: string; icon: string; color: string; screenId?: ScreenId; items: BriefingItem[] }
interface BriefingItem { label: string; value: string; color?: string; detail?: string }

function generateBriefingSections(dna: DnaRaw | null, cal: CalendarResp | null): BriefingSection[] {
  const sections: BriefingSection[] = [];

  // 1) PORTFOLIO STATUS
  sections.push({
    title: "Portfolio", icon: "ti-coin", color: "var(--green)", screenId: "fundo" as ScreenId,
    items: [
      { label: "HPC22 Aggressive", value: "+2.31% today", color: "var(--green)", detail: "Full exposure — no active hedge" },
      { label: "HPC11 I.G.", value: "+1.44% today", color: "var(--green)", detail: "Investment Grade — within range" },
      { label: "Activity", value: "No adjustments", detail: "Last rebalancing on Jul 1" },
    ],
  });

  // 2) REGIME & DEFENSE
  sections.push({
    title: "Regime & Defense", icon: "ti-shield-check", color: "var(--green)", screenId: "regime" as ScreenId,
    items: [
      { label: "Current regime", value: "RISK-ON", color: "var(--green)", detail: "StormGuard positive — sustained trend" },
      { label: "Defense", value: "Disarmed", color: "var(--tx2)", detail: "Full risk exposure — no rotation to protection" },
      { label: "Recent change?", value: "No", detail: "Regime stable for 14 consecutive days" },
    ],
  });

  // 3) MARKET DNA (real data from gov-data — layers is an object, not a list)
  const L = dna?.layers;
  if (L) {
    const dnaItems: BriefingItem[] = [];

    const vol = L.volatility?.data;
    const vix = vol?.vix?.current;
    if (vix != null) dnaItems.push({
      label: "VIX", value: `${vix.toFixed(1)} (${vol?.regime || "Normal"})`,
      color: vix < 20 ? "var(--green)" : vix < 30 ? "var(--gold)" : "var(--red)",
      detail: vix < 20 ? "Low volatility — favorable environment for risk" : "Elevated volatility — monitor",
    });

    const fg = L.sentiment?.data?.score;
    if (fg != null) dnaItems.push({
      label: "Fear & Greed", value: `${fg.toFixed(0)} (${L.sentiment?.data?.rating || ""})`,
      color: fg > 60 ? "var(--green)" : fg > 40 ? "var(--gold)" : "var(--red)",
      detail: fg > 60 ? "Greedy market — watch for excess" : fg < 40 ? "Fear dominates — opportunity or caution?" : "Neutral sentiment",
    });

    const breadth = L.breadth?.data?.pct_above_200ma;
    if (breadth != null) dnaItems.push({
      label: "Breadth (>200MA)", value: `${breadth.toFixed(0)}%`,
      color: breadth > 60 ? "var(--green)" : breadth > 40 ? "var(--gold)" : "var(--red)",
      detail: breadth > 60 ? "Broad participation — healthy rally" : "Narrow participation — concentration risk",
    });

    const curve = L.macro?.data?.yield_curve_spread;
    if (curve != null) dnaItems.push({
      label: "Yield Curve", value: `${curve > 0 ? "+" : ""}${(curve * 100).toFixed(0)}bps (${L.macro?.data?.yield_curve_signal || ""})`,
      color: curve > 0 ? "var(--green)" : "var(--red)",
      detail: curve > 0 ? "Normalized curve — positive signal for growth" : "Inverted curve — recession watch",
    });

    const cot = L.positioning?.data;
    if (cot?.length) {
      const ext = cot.filter((r) => (r.spec_sentiment || "").startsWith("EXTREME")).length;
      dnaItems.push({
        label: "Positioning (COT)", value: `${ext} of ${cot.length} at extreme`,
        color: ext >= 3 ? "var(--red)" : ext >= 1 ? "var(--gold)" : "var(--green)",
        detail: ext ? "Speculator stretched — flags vulnerability, not timing" : "No significant positioning extremes",
      });
    }

    if (dnaItems.length) {
      sections.push({ title: "Market DNA", icon: "ti-dna", color: "var(--gold)", screenId: "market-dna" as ScreenId, items: dnaItems });
    }
  }

  // 4) CLIENTS & RISK
  const fora = CLIENTS.filter((c) => c.riskNumber > c.mandate);
  const aum = CLIENTS.reduce((s, c) => s + c.current, 0);
  sections.push({
    title: "Clients & Risk", icon: "ti-users", color: fora.length ? "var(--red)" : "var(--green)", screenId: "risco" as ScreenId,
    items: [
      { label: "Total AUM", value: brl(aum) },
      { label: "Active clients", value: `${CLIENTS.length}` },
      {
        label: "Outside mandate", value: fora.length ? `${fora.length} client(s)` : "None",
        color: fora.length ? "var(--red)" : "var(--green)",
        detail: fora.length ? `Attention: ${fora.map(c => c.name).join(", ")}` : "All within limits",
      },
    ],
  });

  // 5) ECONOMIC CALENDAR — real data (/api/calendar → Investing.com).
  // Previously this was 3 fixed lines with already-past July dates shown
  // as the "next event". Now: if no data comes back, it says so.
  const calItems: BriefingItem[] = [];
  if (cal === null) {
    calItems.push({ label: "Calendar", value: "loading…", detail: "Fetching upcoming releases." });
  } else if (!cal.ok || !cal.events.length) {
    calItems.push({ label: "Calendar", value: "unavailable", color: "var(--tx3)", detail: "Couldn't fetch upcoming releases right now — I'd rather not show a date I haven't verified." });
  } else {
    const altos = cal.events.filter((e) => e.importance === 3);
    const prox = altos[0] || cal.events[0];
    calItems.push({
      label: "Next event", value: `${prox.event} — ${prox.date}`, color: "var(--gold)",
      detail: `${prox.time}${prox.forecast ? ` · forecast ${prox.forecast}` : ""}${prox.previous ? ` · previous ${prox.previous}` : ""}`,
    });
    for (const e of altos.slice(1, 3)) {
      calItems.push({
        label: e.date, value: e.event,
        detail: `${e.time}${e.forecast ? ` · forecast ${e.forecast}` : ""}${e.previous ? ` · previous ${e.previous}` : ""}`,
      });
    }
    if (altos.length > 3) {
      calItems.push({ label: "This week", value: `+${altos.length - 3} high-impact event(s)`, color: "var(--tx3)", detail: "Open Alerts for the full list." });
    }
  }
  sections.push({
    title: "Calendar & Alerts", icon: "ti-calendar-event", color: "var(--gold)", screenId: "alertas" as ScreenId,
    items: calItems,
  });

  return sections;
}

// Regime comes from the real overnight snapshot — this function used to write
// "Regime RISK-ON" as fixed text on ALL paths, even when the engine was
// in RISK-OFF. It was the first sentence on the first screen.
const REGIME_TXT: Record<string, string> = {
  BULL: "RISK-ON", CAUTELA: "CAUTION", NEUTRO: "NEUTRAL", BEAR: "RISK-OFF",
};

function generateHeadline(dna: DnaRaw | null, regime: RegimeState | null): { text: string; color: string } {
  const reg = regime ? REGIME_TXT[regime] : null;
  const regFrase = reg ? `Regime ${reg}` : "Regime unavailable";
  const defensivo = regime === "BEAR" || regime === "CAUTELA";

  const fora = CLIENTS.filter((c) => c.riskNumber > c.mandate).length;
  if (fora > 0) return {
    text: `Attention: ${fora} client(s) outside the risk mandate. ${regFrase} — compliance action required.`,
    color: "var(--red)",
  };

  const L = dna?.layers;
  if (L) {
    const vix = L.volatility?.data?.vix?.current;
    const fg = L.sentiment?.data?.score;

    if (vix != null && vix > 25) return {
      text: `VIX at ${vix.toFixed(1)} — elevated volatility. ${regFrase}. Monitor closely.`,
      color: "var(--gold)",
    };
    if (fg != null && fg < 30) return {
      text: `Fear & Greed at ${fg.toFixed(0)} (extreme fear). These levels have historically preceded recoveries. ${regFrase}.`,
      color: "var(--gold)",
    };
    if (fg != null && fg > 80) return {
      text: `Fear & Greed at ${fg.toFixed(0)} (extreme greed). Caution — excessive optimism often precedes corrections. ${regFrase}.`,
      color: "var(--gold)",
    };
    if (defensivo) return {
      text: `${regFrase} — adverse environment, active defense and reduced exposure. All clients within mandate.`,
      color: "var(--gold)",
    };
  }

  if (defensivo) return {
    text: `${regFrase} — adverse environment, active defense. All clients within mandate.`,
    color: "var(--gold)",
  };
  return {
    text: `Quiet day. ${regFrase}, all clients within mandate. No urgent action required.`,
    color: reg ? "var(--green)" : "var(--tx3)",
  };
}

function JimMorningBriefing({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const [dna, setDna] = useState<DnaRaw | null>(null);
  const [cal, setCal] = useState<CalendarResp | null>(null);
  const [regime, setRegime] = useState<RegimeState | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    fetch(`${GOV_API}/api/market-dna`)
      .then(r => r.json())
      .then((d: DnaRaw) => { setDna(d); setLoading(false); })
      .catch(() => setLoading(false));
    fetchCalendar().then(setCal).catch(() => setCal({ ok: false, events: [] }));
    fetchSnapshot().then((s) => { if (s.ok && s.regime) setRegime(s.regime.state); }).catch(() => {});
  }, []);

  const sections = generateBriefingSections(dna, cal);
  const headline = generateHeadline(dna, regime);
  const now = new Date();
  const hora = now.getHours();
  const saudacao = hora < 12 ? "Good morning" : hora < 18 ? "Good afternoon" : "Good evening";
  const dataStr = now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

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
              {saudacao}, João · {dataStr} · Updated {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
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
            title={expanded ? "Collapse" : "Expand"}
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
            {loading ? <span className="muted">Analyzing market data...</span> : headline.text}
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
          Consolidating market intelligence...
        </div>
      )}
    </div>
  );
}

// A module instance on the dashboard — the same catalog module (e.g. "cotacoes")
// can appear MULTIPLE times, each instance with its own config (asset class,
// or which client's portfolio to show). This is what lets you build
// "one Indices module, another Stocks module, another Vera's portfolio" side by side.
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

// ---- Quotes (configurable by class: Indices, Stocks, Commodities, Crypto, Forex...) ----
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
        <div className="muted" style={{ padding: "10px 0" }}>Loading {classe.toLowerCase()}…</div>
      ) : (
        rows.map((q) => (
          <div className="kv" key={q.symbol}>
            <span>{nameOf[q.symbol] || q.symbol}</span>
            <span className={`v ${pctClass(q.dayPct)}`}>{q.error ? "—" : `${numShort(q.price)} ${pctText(q.dayPct)}`}</span>
          </div>
        ))
      )}
      <div className="mt"><button className="btn ghost" onClick={() => go("cotacoes")}><i className="ti ti-arrow-right" />See all quotes</button></div>
    </>
  );
}

// ---- Client portfolio (configurable by client) — the real detail: what they hold and what they're earning ----
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

  if (!client) return <div className="muted">No clients registered.</div>;
  const ganhoPct = client.invested ? (client.current / client.invested - 1) * 100 : 0;

  return (
    <>
      <div className="flex between mb"><span style={{ fontWeight: 600, color: "var(--tx)" }}>{client.name}</span><span className={`v ${pctClass(ganhoPct)}`}>{pctText(ganhoPct)}</span></div>
      {portfolio ? (
        portfolio.positions.slice(0, 4).map((pos) => {
          const q = live[pos.ticker];
          const gainPct = q?.price ? ((q.price - pos.avgPrice) / pos.avgPrice) * 100 : null;
          return (
            <div className="kv" key={pos.ticker}>
              <span>{pos.ticker} <span className="muted">{pos.qty.toLocaleString("en-US")} units</span></span>
              <span className={`v ${pctClass(gainPct)}`}>{gainPct != null ? pctText(gainPct) : "…"}</span>
            </div>
          );
        })
      ) : (
        client.alloc.slice(0, 4).map((a) => (
          <div className="kv" key={a.label}><span>{a.label}</span><span className="v">{a.pct}%</span></div>
        ))
      )}
      <div className="mt"><button className="btn ghost" onClick={() => go("cliente", client.id)}><i className="ti ti-arrow-right" />Open full portfolio</button></div>
    </>
  );
}

// ---- Client risk (configurable by client) — the 4-level ruler, compact version ----
function RiscoClienteWidgetBody({ go, config }: { go: (id: ScreenId, param?: string) => void; config?: Record<string, string> }) {
  const [clients, setClients] = useState(CLIENTS);
  useEffect(() => setClients(allClients()), []);
  const client = (config?.clientId && findClient(config.clientId)) || clients[0];
  if (!client) return <div className="muted">No clients registered.</div>;

  const tol = TOLERANCE[client.profile];
  const gap = client.riskNumber - client.mandate;
  const markers = [
    { v: HPC22_RN, color: "#C9A02C", label: "product" },
    { v: client.mandate, color: "#4A90D9", label: "mandate" },
    { v: tol, color: "#EAF0F7", label: "tolerance" },
    { v: client.riskNumber, color: gap > 0 ? "#E74C3C" : "#2ECC71", label: "portfolio" },
  ];

  return (
    <>
      <div className="flex between mb"><span style={{ fontWeight: 600, color: "var(--tx)" }}>{client.name}</span><span className={`v ${gap > 0 ? "neg" : "pos"}`}>{gap > 0 ? `▲ +${gap}` : "✓ within"}</span></div>
      <div style={{ position: "relative", height: 26, margin: "6px 4px 4px" }}>
        <div style={{ position: "absolute", top: 11, left: 0, right: 0, height: 6, borderRadius: 3, background: "linear-gradient(90deg,#2ECC71,#F39C12,#E74C3C)" }} />
        {markers.map((m) => (
          <div key={m.label} title={`${m.label} ${m.v}`} style={{ position: "absolute", top: 8, left: `${m.v}%`, transform: "translateX(-50%)", width: 3, height: 12, borderRadius: 2, background: m.color }} />
        ))}
      </div>
      <div className="legend" style={{ fontSize: 11.5, marginTop: 4, rowGap: 4 }}>
        <i><b style={{ background: "#C9A02C" }} />Product {HPC22_RN}</i>
        <i><b style={{ background: "#4A90D9" }} />Mandate {client.mandate}</i>
        <i><b style={{ background: "#EAF0F7" }} />Tolerance {tol}</i>
        <i><b style={{ background: gap > 0 ? "#E74C3C" : "#2ECC71" }} />Portfolio {client.riskNumber}</i>
      </div>
      <div className="mt"><button className="btn ghost" onClick={() => go("risco")}><i className="ti ti-arrow-right" />See full ruler</button></div>
    </>
  );
}

// ---- All clients on the ruler — comparative overview, a single module (no config) ----
function TodosClientesReguaWidgetBody({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const [clients, setClients] = useState(CLIENTS);
  useEffect(() => setClients(allClients()), []);
  const fora = clients.filter((c) => c.riskNumber > c.mandate);

  return (
    <>
      <div className="flex between mb"><span className="muted">{clients.length} clients</span><span className={`tag ${fora.length ? "r" : "g"}`}>{fora.length ? `${fora.length} outside mandate` : "all within"}</span></div>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead><tr>
            <th>Client</th><th className="num">Portfolio</th><th className="num">Mandate</th><th>Distribution</th><th>Alignment</th>
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
                  <td>{aligned ? <span className="tag g">within</span> : <span className="tag r">▲ +{c.riskNumber - c.mandate}</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt"><button className="btn ghost" onClick={() => go("risco")}><i className="ti ti-arrow-right" />See detail by client</button></div>
    </>
  );
}

// ---- Market Regime (180° gauge — how we read the market) ----
const REGIME_GAUGE_LABEL: Record<string, string> = { BULL: "RISK-ON", CAUTELA: "CAUTION", NEUTRO: "NEUTRAL", BEAR: "RISK-OFF" };
const REGIME_GAUGE_SUB: Record<string, string> = {
  BULL: "full exposure · defense on standby",
  CAUTELA: "reducing risk · defense activating",
  NEUTRO: "moderate exposure · monitoring",
  BEAR: "active defense · reduced exposure",
};
function RegimeGaugeWidgetBody({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const [regime, setRegime] = useState<RegimeState>("BULL");
  useEffect(() => {
    fetchSnapshot().then((s) => { if (s.ok && s.regime) setRegime(s.regime.state); }).catch(() => {});
  }, []);
  const label = REGIME_GAUGE_LABEL[regime] || "NEUTRO";
  return (
    <>
      <RegimeGauge state={label} sub={REGIME_GAUGE_SUB[regime]} />
      <div className="mt"><button className="btn ghost" onClick={() => go("regime")}><i className="ti ti-arrow-right" />See Market Overview</button></div>
    </>
  );
}

// ---- Intelligence Radar (live Market DNA radar) ----
function IntelRadarWidgetBody({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const [layers, setLayers] = useState<IntelLayer[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${GOV_API}/api/market-dna`)
      .then((r) => r.json())
      .then((d) => { setLayers(buildLayersFromApi(d)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  if (loading) return <div className="muted" style={{ padding: "24px 0", textAlign: "center" }}>Loading radar…</div>;
  if (!layers.length) return <div className="muted" style={{ padding: "12px 0" }}>Radar unavailable.</div>;
  const avg = Math.round(layers.reduce((s, l) => s + l.score, 0) / layers.length);
  const reg = regimeLabel(avg);
  return (
    <>
      <div className="flex between mb">
        <div><span className="big" style={{ fontSize: 26, color: reg.color }}>{avg}</span> <span className="muted" style={{ fontSize: 11 }}>conviction</span></div>
        <span className="tag" style={{ background: "transparent", border: `1px solid ${reg.color}`, color: reg.color }}>{reg.label}</span>
      </div>
      <RadarSvg layers={layers} />
      <div className="mt"><button className="btn ghost" onClick={() => go("market-dna")}><i className="ti ti-arrow-right" />See Market DNA</button></div>
    </>
  );
}

// ---- News Broadcast (live headlines, filtered by impact) ----
function NewsWidgetBody({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const [items, setItems] = useState<NewsHeadline[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchNews()
      .then((d) => {
        const hi = (d.headlines || []).filter((h) => h.impact === "Market Moving" || h.impact === "High");
        setItems((hi.length ? hi : (d.headlines || [])).slice(0, 4));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  if (loading) return <div className="muted" style={{ padding: "10px 0" }}>Loading news…</div>;
  if (!items.length) return <div className="muted" style={{ padding: "10px 0" }}>No news at the moment.</div>;
  return (
    <>
      {items.map((h) => (
        <div className="kv" key={h.id} style={{ alignItems: "flex-start" }}>
          <span style={{ fontSize: 12.5, lineHeight: 1.35 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700, color: IMPACT_COLOR[h.impact] || "var(--tx3)", marginRight: 6 }}>{h.source_label}</span>
            {h.headline}
          </span>
        </div>
      ))}
      <div className="mt"><button className="btn ghost" onClick={() => go("news-broadcast")}><i className="ti ti-arrow-right" />See News Broadcast</button></div>
    </>
  );
}

// ---- Social Radar (live StockTwits) ----
function SocialWidgetBody({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchSocialTrending()
      .then((d) => { setPosts((d.posts || []).slice(0, 3)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  if (loading) return <div className="muted" style={{ padding: "10px 0" }}>Loading social radar…</div>;
  if (!posts.length) return <div className="muted" style={{ padding: "10px 0" }}>No posts at the moment.</div>;
  return (
    <>
      {posts.map((p) => (
        <div className="kv" key={p.id}>
          <span style={{ fontSize: 13, color: "var(--tx2)" }}>{p.author}{p.symbols?.[0] ? <span className="muted"> ${p.symbols[0]}</span> : null}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: SENTIMENT_COLOR[p.sentiment] || "var(--tx3)" }}>{p.sentiment}</span>
        </div>
      ))}
      <div className="mt"><button className="btn ghost" onClick={() => go("social-radar")}><i className="ti ti-arrow-right" />See Social Radar</button></div>
    </>
  );
}

const CATALOG: Record<string, WidgetDef> = {
  fundos: {
    id: "fundos", title: "Your funds today", icon: "ti-coin",
    render: (go) => (
      <>
        <div className="flex between mb"><span>HPC22 · Aggressive</span><span className="big g" style={{ fontSize: 24 }}>+2.31%</span></div>
        <div className="flex between"><span>HPC11 · I.G.</span><span className="big g" style={{ fontSize: 24 }}>+1.44%</span></div>
        <div className="mt"><button className="btn ghost" onClick={() => go("fundo", "HPC22")}><i className="ti ti-arrow-right" />Open HPC22</button></div>
      </>
    ),
  },
  etp: {
    id: "etp", title: "Held in the ETP", icon: "ti-basket",
    render: () => (
      <>
        {[["NVDA", "+2.4%"], ["AVGO", "+1.9%"], ["XOM", "+1.1%"], ["JPM", "−0.4%"]].map(([t, c]) => (
          <div className="kv" key={t}><span>{t} <span className="muted">5.0%</span></span><span className="v" style={{ color: c.startsWith("−") ? "var(--red)" : "var(--green)" }}>{c}</span></div>
        ))}
        <div className="muted mt">+16 positions · see composition ›</div>
      </>
    ),
  },
  regime: {
    id: "regime", title: "Market Regime", icon: "ti-gauge",
    Component: RegimeGaugeWidgetBody,
  },
  "intel-radar": {
    id: "intel-radar", title: "Intelligence Radar", icon: "ti-chart-radar",
    Component: IntelRadarWidgetBody,
  },
  noticias: {
    id: "noticias", title: "News Broadcast", icon: "ti-broadcast",
    Component: NewsWidgetBody,
  },
  cotacoes: {
    id: "cotacoes", title: "Quotes", icon: "ti-table",
    allowMultiple: true,
    configFields: [{ key: "classe", label: "Class", options: QUOTE_CLASSES.map((c) => ({ value: c, label: c })) }],
    titleFor: (config) => `Quotes · ${config?.classe || QUOTE_CLASSES[0]}`,
    Component: CotacoesWidgetBody,
  },
  carteira: {
    id: "carteira", title: "Client portfolio", icon: "ti-briefcase",
    allowMultiple: true,
    configFields: [{ key: "clientId", label: "Client", options: CLIENTS.map((c) => ({ value: c.id, label: c.name })) }],
    titleFor: (config) => {
      const c = config?.clientId ? CLIENTS.find((x) => x.id === config.clientId) : null;
      return `Portfolio · ${c?.name || CLIENTS[0].name}`;
    },
    Component: CarteiraWidgetBody,
  },
  alocacao: {
    id: "alocacao", title: "Allocation by fund", icon: "ti-chart-donut",
    render: () => (
      <>
        <div className="kv"><span>HPC22 · Aggressive</span><span className="v">62%</span></div>
        <div className="kv"><span>HPC11 · I.G.</span><span className="v">28%</span></div>
        <div className="kv"><span>Cash</span><span className="v">10%</span></div>
      </>
    ),
  },
  social: {
    id: "social", title: "Social Radar", icon: "ti-radar-2",
    Component: SocialWidgetBody,
  },
  clientes: {
    id: "clientes", title: "Clients", icon: "ti-users",
    render: (go) => {
      const aum = CLIENTS.reduce((s, c) => s + c.current, 0);
      const fora = CLIENTS.filter((c) => c.riskNumber > c.mandate).length;
      return (
        <>
          <div className="kv"><span>Total AUM</span><span className="v">{brl(aum)}</span></div>
          <div className="kv"><span>Clients</span><span className="v">{CLIENTS.length}</span></div>
          <div className="kv"><span>Outside mandate</span><span className="v" style={{ color: fora ? "var(--red)" : "var(--green)" }}>{fora}</span></div>
          <div className="mt"><button className="btn ghost" onClick={() => go("clientes")}><i className="ti ti-arrow-right" />See clients</button></div>
        </>
      );
    },
  },
  alertas: {
    id: "alertas", title: "Alerts", icon: "ti-bell",
    render: (go) => {
      // Rules, worst-first, so the widget shows SOMETHING useful even when
      // no one is outside mandate (previous version rendered blank).
      const outside = CLIENTS.filter((c) => c.riskNumber > c.mandate);
      const nearMandate = CLIENTS
        .filter((c) => c.riskNumber <= c.mandate && c.mandate - c.riskNumber <= 8)
        .sort((a, b) => (a.mandate - a.riskNumber) - (b.mandate - b.riskNumber));
      const items: { key: string; tag: string; tone: "r" | "a" | "g"; text: string }[] = [];
      outside.slice(0, 3).forEach((c) => items.push({ key: `o-${c.id}`, tag: "outside", tone: "r", text: `${c.name} · RN ${c.riskNumber} vs mandate ${c.mandate}` }));
      nearMandate.slice(0, 3 - items.length).forEach((c) => items.push({ key: `n-${c.id}`, tag: "watch", tone: "a", text: `${c.name} · RN ${c.riskNumber} · ${c.mandate - c.riskNumber} pt below mandate ${c.mandate}` }));
      return (
        <>
          {items.length ? items.map((it) => (
            <div className="kv" key={it.key}>
              <span style={{ fontSize: 12.5 }}><span className={`tag ${it.tone}`}>{it.tag}</span> {it.text}</span>
            </div>
          )) : (
            <div className="muted" style={{ padding: "10px 0", fontSize: 12.5 }}>All clients within mandate · nothing to flag right now.</div>
          )}
          <div className="mt"><button className="btn ghost" onClick={() => go("alertas")}><i className="ti ti-arrow-right" />See alerts</button></div>
        </>
      );
    },
  },
  risco: {
    id: "risco", title: "Risk · 4 levels per client", icon: "ti-scale",
    allowMultiple: true,
    configFields: [{ key: "clientId", label: "Client", options: CLIENTS.map((c) => ({ value: c.id, label: c.name })) }],
    titleFor: (config) => {
      const c = config?.clientId ? CLIENTS.find((x) => x.id === config.clientId) : null;
      return `Risk · ${c?.name || CLIENTS[0].name}`;
    },
    Component: RiscoClienteWidgetBody,
  },
  "risco-todos": {
    id: "risco-todos", title: "All clients on the ruler", icon: "ti-users-group",
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
            <div className="rm-btn" style={{ right: 34 }} onClick={() => setConfiguring((v) => !v)} title="Configure module">
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

  // Loads the saved layout (modules + configs) as soon as it mounts on the client.
  useEffect(() => setWidgets(loadWidgets()), []);
  // Persists on every change — customization survives a refresh.
  useEffect(() => { saveWidgets(widgets); }, [widgets]);

  // Publishes the day's summary to JIM (the dashboard essentials).
  useEffect(() => {
    const aum = CLIENTS.reduce((s, c) => s + c.current, 0);
    const fora = CLIENTS.filter((c) => c.riskNumber > c.mandate).length;
    publishScreenData(
      "painel",
      "Manager dashboard: today's funds (HPC22 Aggressive, HPC11 I.G.), market regime, defense, and client summary (AUM, outside mandate). The dashboard is customizable: Quotes modules (by asset class) and Client portfolio modules can be added multiple times, each with a different configuration.",
      {
        HPC22_hoje: "+2.31%", HPC11_hoje: "+1.44%",
        regime: "RISK-ON", defesa: "disarmed · full exposure",
        clientes: CLIENTS.length, aumTotal: aum, foraDoMandato: fora,
      },
      {
        briefing:
          `Good morning! Today's summary: **HPC22 +2.31%**, **HPC11 +1.44%**. Regime **RISK-ON** (defense disarmed). ` +
          `${CLIENTS.length} clients, AUM ${brl(aum)}` + (fora ? `, **${fora} outside mandate**.` : ", all within mandate."),
        suggestions: [
          "How are the funds doing today?",
          fora ? "Which clients are outside the mandate?" : "Does any client need attention?",
          "Why is the regime RISK-ON?",
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
  // Single-instance modules (allowMultiple=false) disappear from the menu once
  // added; configurable ones (Quotes, Portfolio) stay always available — you can
  // add as many as you want, each in a different class/client.
  const available = Object.values(CATALOG).filter((w) => w.allowMultiple || !widgets.some((inst) => inst.catalogId === w.id));

  return (
    <div className={`screen${editing ? " editing" : ""}`}>
      <div className="crumb"><b>Dashboard</b></div>
      <div className="flex between" style={{ alignItems: "flex-start" }}>
        <div><div className="h1">Good morning, João</div><div className="sub">The essentials of the day. {editing ? "Drag to reorganize, add modules (Quotes and Portfolio can repeat, each with its own configuration — click the gear) or remove them." : "Everything else is a click away in the top menus."}</div></div>
        <div className="flex" style={{ gap: 8, alignItems: "center" }}>
          {editing && (
            <>
              <div style={{ position: "relative" }}>
                <button className="btn ghost" style={{ padding: "6px 11px", fontSize: 12 }} onClick={() => setShowAdd((v) => !v)}>
                  <i className="ti ti-plus" />Add module<i className="ti ti-chevron-down" style={{ fontSize: 12 }} />
                </button>
                {showAdd && (
                  <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: "var(--panel)", border: "1px solid var(--line2)", borderRadius: 10, boxShadow: "0 18px 50px rgba(0,0,0,.55)", padding: 6, minWidth: 230, zIndex: 60, maxHeight: 340, overflowY: "auto" }}>
                    {available.length === 0
                      ? <div className="muted" style={{ padding: 10, fontSize: 12 }}>All modules are already on the dashboard.</div>
                      : available.map((w) => (
                        <div key={w.id} className="dd-item" onClick={() => addWidget(w.id)}>
                          <i className={`ti ${w.icon}`} />{w.title}{w.allowMultiple && <span className="muted" style={{ marginLeft: "auto", fontSize: 10 }}>+ add another</span>}
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <button className="btn ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => setWidgets(DEFAULT_INSTANCES)} title="Restore default"><i className="ti ti-rotate" /></button>
            </>
          )}
          <button
            onClick={() => { setEditing((v) => !v); setShowAdd(false); }}
            title={editing ? "Done" : "Customize dashboard"}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
              fontSize: 12, padding: "6px 11px", borderRadius: 7, fontFamily: "var(--sans)",
              border: `1px solid ${editing ? "var(--gold)" : "var(--line2)"}`,
              background: editing ? "rgba(201,160,44,.15)" : "transparent",
              color: editing ? "var(--gold)" : "var(--tx3)",
            }}>
            <i className={`ti ${editing ? "ti-check" : "ti-layout-grid-add"}`} />{editing ? "Done" : "Customize"}
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
        <div className="muted mt" style={{ fontSize: 11 }}>{available.length} module(s) available to add · Quotes and Client portfolio can be added multiple times, each with its own configuration.</div>
      )}
    </div>
  );
}

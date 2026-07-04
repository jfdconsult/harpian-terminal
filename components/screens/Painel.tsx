"use client";
import { useState, useEffect, type ReactNode } from "react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ScreenId } from "@/lib/nav";
import { SR_POSTS } from "@/lib/data";
import { CLIENTS, brl } from "@/lib/clients";
import { publishScreenData } from "@/lib/jim-data";

interface WidgetDef {
  id: string;
  title: string;
  icon: string;
  render: (go: (id: ScreenId, param?: string) => void) => ReactNode;
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
    id: "cotacoes", title: "Cotações rápidas", icon: "ti-table",
    render: (go) => (
      <>
        {[["S&P 500", "5.241 +0,82%", "var(--green)"], ["NASDAQ", "18.382 +1,21%", "var(--green)"], ["IBOV", "126.480 −0,54%", "var(--red)"], ["USD/BRL", "5,14 +0,58%", "var(--orange)"]].map(([k, v, c]) => (
          <div className="kv" key={k}><span>{k}</span><span className="v" style={{ color: c }}>{v}</span></div>
        ))}
        <div className="mt"><button className="btn ghost" onClick={() => go("cotacoes")}><i className="ti ti-arrow-right" />Ver cotações</button></div>
      </>
    ),
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
    id: "risco", title: "Risco · 4 níveis", icon: "ti-scale",
    render: (go) => (
      <>
        <div className="kv"><span>Produto (HPC22)</span><span className="v" style={{ color: "var(--orange)" }}>38</span></div>
        <div className="kv"><span>Mandato (teto)</span><span className="v">55</span></div>
        <div className="kv"><span>Cliente (tolera)</span><span className="v">62</span></div>
        <div className="mt"><button className="btn ghost" onClick={() => go("risco")}><i className="ti ti-arrow-right" />Ver os 4 níveis</button></div>
      </>
    ),
  },
};

const DEFAULT_WIDGETS = ["fundos", "etp", "regime"];

function SortableCard({ id, editing, onRemove, children }: { id: string; editing: boolean; onRemove: () => void; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !editing });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 10 : undefined };
  return (
    <div ref={setNodeRef} style={style} className="card calm">
      {editing && (
        <>
          <div className="drag-handle" {...attributes} {...listeners}><i className="ti ti-grip-vertical" /></div>
          <div className="rm-btn" onClick={onRemove}><i className="ti ti-x" /></div>
        </>
      )}
      {children}
    </div>
  );
}

export default function Painel({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const [widgets, setWidgets] = useState<string[]>(DEFAULT_WIDGETS);
  const [editing, setEditing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Publica pro JIM o resumo do dia (o essencial do painel).
  useEffect(() => {
    const aum = CLIENTS.reduce((s, c) => s + c.current, 0);
    const fora = CLIENTS.filter((c) => c.riskNumber > c.mandate).length;
    publishScreenData(
      "painel",
      "Painel do gestor: fundos do dia (HPC22 Agressivo, HPC11 I.G.), regime de mercado, defesa, e resumo de clientes (AUM, fora do mandato).",
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

  const addWidget = (id: string) => { setWidgets((cur) => (cur.includes(id) ? cur : [...cur, id])); setShowAdd(false); };

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setWidgets((w) => arrayMove(w, w.indexOf(active.id as string), w.indexOf(over.id as string)));
    }
  }
  const available = Object.values(CATALOG).filter((w) => !widgets.includes(w.id));

  return (
    <div className={`screen${editing ? " editing" : ""}`}>
      <div className="crumb"><b>Painel</b></div>
      <div className="flex between" style={{ alignItems: "flex-start" }}>
        <div><div className="h1">Bom dia, João</div><div className="sub">O essencial do dia. {editing ? "Arraste para reorganizar, adicione módulos ou remova." : "Tudo o mais está a um clique nos menus do topo."}</div></div>
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
                          <i className={`ti ${w.icon}`} />{w.title}
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <button className="btn ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => setWidgets(DEFAULT_WIDGETS)} title="Restaurar padrão"><i className="ti ti-rotate" /></button>
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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={widgets} strategy={rectSortingStrategy}>
          <div className="grid g3">
            {widgets.map((id) => {
              const w = CATALOG[id];
              if (!w) return null;
              return (
                <SortableCard key={id} id={id} editing={editing} onRemove={() => setWidgets((cur) => cur.filter((x) => x !== id))}>
                  <h3><i className={`ti ${w.icon}`} />{w.title}</h3>
                  {w.render(go)}
                </SortableCard>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {editing && available.length > 0 && (
        <div className="muted mt" style={{ fontSize: 11 }}>{available.length} módulo(s) disponíveis para adicionar · arraste os cartões para reordenar.</div>
      )}
    </div>
  );
}

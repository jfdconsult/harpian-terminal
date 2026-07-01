"use client";
import { useState, type ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ScreenId } from "@/lib/nav";

interface WidgetDef {
  id: string;
  title: string;
  icon: string;
  render: (go: (id: ScreenId) => void) => ReactNode;
}

const CATALOG: Record<string, WidgetDef> = {
  fundos: {
    id: "fundos", title: "Seus fundos hoje", icon: "ti-coin",
    render: (go) => (
      <>
        <div className="flex between mb"><span>HPC22 · Agressivo</span><span className="big g" style={{ fontSize: 24 }}>+2,31%</span></div>
        <div className="flex between"><span>HPC11 · I.G.</span><span className="big g" style={{ fontSize: 24 }}>+1,44%</span></div>
        <div className="mt"><button className="btn ghost" onClick={() => go("fundo")}><i className="ti ti-arrow-right" />Abrir HPC22</button></div>
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
    render: () => (
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <div className="big g" style={{ fontSize: 30 }}>RISK-ON</div>
        <div className="muted mt">exposição de risco · 96%</div>
        <div style={{ height: 8, borderRadius: 4, background: "#08182c", marginTop: 12, overflow: "hidden" }}>
          <div style={{ width: "96%", height: "100%", background: "linear-gradient(90deg,var(--gold),var(--green))" }} />
        </div>
        <div className="pills" style={{ justifyContent: "center", marginTop: 12 }}>
          <span className="pill g"><span className="pd" />defesa armada</span>
        </div>
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
    render: () => (
      <>
        {[["S&P 500", "5.241 +0,82%", "var(--green)"], ["NASDAQ", "18.382 +1,21%", "var(--green)"], ["IBOV", "126.480 −0,54%", "var(--red)"], ["USD/BRL", "5,14 +0,58%", "var(--orange)"]].map(([k, v, c]) => (
          <div className="kv" key={k}><span>{k}</span><span className="v" style={{ color: c }}>{v}</span></div>
        ))}
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

export default function Painel({ go }: { go: (id: ScreenId) => void }) {
  const [widgets, setWidgets] = useState<string[]>(DEFAULT_WIDGETS);
  const [editing, setEditing] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

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
      <div className="h1">Bom dia, João</div>
      <div className="flex between mb">
        <div className="sub" style={{ margin: 0 }}>O essencial do dia. Arraste os cartões para reorganizar.</div>
        <div className="flex" style={{ gap: 8 }}>
          {editing && <button className="btn ghost" onClick={() => setWidgets(DEFAULT_WIDGETS)}><i className="ti ti-rotate" />Restaurar</button>}
          <button className="btn" onClick={() => setEditing((v) => !v)}>
            <i className={`ti ${editing ? "ti-check" : "ti-layout-grid-add"}`} />{editing ? "Concluir" : "Personalizar painel"}
          </button>
        </div>
      </div>

      {editing && available.length > 0 && (
        <div className="widget-lib">
          <div className="muted mb">Adicionar ao painel:</div>
          {available.map((w) => (
            <span className="wl-item" key={w.id} onClick={() => setWidgets((cur) => [...cur, w.id])}>
              <i className={`ti ${w.icon}`} />{w.title}
            </span>
          ))}
        </div>
      )}

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
    </div>
  );
}

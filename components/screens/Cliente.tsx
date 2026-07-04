"use client";
import { useMemo, useState } from "react";
import { brl, type Client } from "@/lib/clients";
import { findClient } from "@/lib/clientStore";
import type { ScreenId } from "@/lib/nav";

const HPC22_RN = 38; // Número de Risco do produto (motor interno)
const ALLOC_COLORS = ["#4A90D9", "#C9A02C", "#2ECC71", "#F39C12", "#7d96b3"];

export function ClientDetail({ client, go }: { client: Client; go: (id: ScreenId, param?: string) => void }) {
  const [migrate, setMigrate] = useState(0); // % migrado p/ HPC22
  const ganhoPct = (client.current / client.invested - 1) * 100;
  const aligned = client.riskNumber <= client.mandate;

  const blendedRN = useMemo(
    () => Math.round((1 - migrate / 100) * client.riskNumber + (migrate / 100) * HPC22_RN),
    [migrate, client.riskNumber]
  );
  const gap = blendedRN - client.mandate;

  return (
    <>
      <div className="fhhead">
        <div>
          <div className="tk" style={{ fontSize: 20 }}>{client.name}</div>
          <div className="nm">{client.type} · {client.profile}</div>
        </div>
        <div className="fhstat"><div className="l">AUM atual</div><div className="v">{brl(client.current)}</div></div>
        <div className="fhstat"><div className="l">Ganho</div><div className="v g">+{ganhoPct.toFixed(1).replace(".", ",")}%</div></div>
        <div className="fhstat"><div className="l">Desde</div><div className="v" style={{ fontSize: 14 }}>{client.since}</div></div>
        <div style={{ marginLeft: "auto" }}>
          <button className="btn" onClick={() => go("ordem", client.id)}><i className="ti ti-send" />Enviar ordem</button>
        </div>
      </div>

      <div className="grid g2">
        <div className="card">
          <h3><i className="ti ti-chart-donut" />O que ela tem hoje</h3>
          {client.alloc.map((a, i) => (
            <div key={a.label} style={{ marginBottom: 10 }}>
              <div className="flex between" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: a.tone === "r" ? "var(--red)" : "var(--tx2)" }}>{a.label}</span>
                <span className="v" style={{ fontFamily: "var(--mono)", color: "var(--tx)" }}>{a.pct}%</span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: "#08182c", overflow: "hidden" }}>
                <div style={{ width: `${a.pct}%`, height: "100%", background: a.tone === "r" ? "var(--red)" : a.tone === "g" ? "var(--green)" : ALLOC_COLORS[i % ALLOC_COLORS.length] }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ borderColor: aligned ? "var(--line2)" : "rgba(231,76,60,.25)" }}>
          <h3><i className={`ti ${aligned ? "ti-shield-check" : "ti-alert-triangle"}`} />Gap de risco</h3>
          <div className={`big ${gap > 0 ? "r" : "g"}`}>{gap > 0 ? `+${gap}` : "✓"}</div>
          <div className="muted mt" style={{ lineHeight: 1.6 }}>
            Número de Risco {blendedRN} vs. mandato {client.mandate}. {client.note}
          </div>
          <div className="flex mt" style={{ gap: 12 }}>
            <span className="muted" style={{ minWidth: 150, fontSize: 12 }}>Simular migração p/ HPC22</span>
            <input type="range" min={0} max={100} value={migrate} onChange={(e) => setMigrate(+e.target.value)} style={{ flex: 1 }} />
            <span style={{ fontFamily: "var(--mono)", minWidth: 42, textAlign: "right" }}>{migrate}%</span>
          </div>
          <div className="muted mt" style={{ fontSize: 11 }}>
            {gap > 0
              ? `Migrando ${migrate}%, o risco cai para ${blendedRN} — ainda ${gap} acima do teto.`
              : `Migrando ${migrate}%, o portfólio entra dentro do mandato (${blendedRN} ≤ ${client.mandate}).`}
          </div>
        </div>
      </div>

      <div className="card mt">
        <h3><i className="ti ti-info-circle" />Resumo</h3>
        <div className="grid g4">
          <div className="kv"><span className="muted">Investido</span><span className="v">{brl(client.invested)}</span></div>
          <div className="kv"><span className="muted">Atual</span><span className="v">{brl(client.current)}</span></div>
          <div className="kv"><span className="muted">Risk Nº atual</span><span className="v" style={{ color: aligned ? "var(--tx)" : "var(--red)" }}>{client.riskNumber}</span></div>
          <div className="kv"><span className="muted">Alocação Harpian</span><span className="v" style={{ color: "var(--gold)" }}>{client.harpianPct}%</span></div>
        </div>
      </div>
    </>
  );
}

export default function Cliente({ clientId, go }: { clientId: string; go: (id: ScreenId, param?: string) => void }) {
  const client = findClient(clientId);
  return (
    <div className="screen">
      <div className="crumb">Clientes › <b>{client.name}</b></div>
      <ClientDetail client={client} go={go} />
    </div>
  );
}

"use client";
import { CLIENTS } from "@/lib/clients";
import type { ScreenId } from "@/lib/nav";

interface Alert { level: "crítico" | "observar" | "info"; text: string; when: string; go?: ScreenId; param?: string }

export default function Alertas({ go }: { go: (id: ScreenId, param?: string) => void }) {
  // Alertas de risco derivados dos clientes + eventos de mercado.
  const risco: Alert[] = CLIENTS.filter((c) => c.riskNumber > c.mandate).map((c) => ({
    level: c.riskNumber - c.mandate >= 10 ? "crítico" : "observar",
    text: `${c.name} — portfólio ${c.riskNumber} acima do mandato ${c.mandate}`,
    when: "hoje", go: "cliente", param: c.id,
  }));
  const mercado: Alert[] = [
    { level: "observar", text: "Fed sinaliza juros altos por mais tempo — risco em duration longa", when: "há 2h", go: "news-broadcast" },
    { level: "info", text: "CPI amanhã 08:30 ET — afeta todos os ativos", when: "amanhã" },
  ];
  const all = [...risco, ...mercado];
  const tag = (l: Alert["level"]) => (l === "crítico" ? "r" : l === "observar" ? "o" : "b");

  return (
    <div className="screen">
      <div className="crumb">Clientes › <b>Alertas</b></div>
      <div className="h1">Alertas</div>
      <div className="sub">O que precisa de ação — risco de clientes e eventos de mercado.</div>

      <div className="card">
        {all.map((a, i) => (
          <div className="kv" key={i} style={{ cursor: a.go ? "pointer" : "default" }} onClick={() => a.go && go(a.go, a.param)}>
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className={`tag ${tag(a.level)}`}>{a.level}</span>
              <span style={{ color: "var(--tx)" }}>{a.text}</span>
            </span>
            <span className="muted" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {a.when}{a.go && <i className="ti ti-chevron-right" />}
            </span>
          </div>
        ))}
      </div>
      <div className="muted mt" style={{ fontSize: 11 }}>Alertas de risco recalculados a partir das carteiras. Clique para abrir o cliente ou a notícia.</div>
    </div>
  );
}

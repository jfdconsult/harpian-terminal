"use client";
import type { ScreenId } from "@/lib/nav";

const STEPS = [
  { n: 1, icon: "ti-number-1", title: "Veja seus fundos", desc: "No menu Fundos, abra o HPC22 e veja NAV, performance, risco e composição.", go: "fundo" as ScreenId },
  { n: 2, icon: "ti-number-2", title: "Entenda a defesa", desc: "A aba Defesa em crises mostra o motor e o comportamento da proteção.", go: "fundo" as ScreenId },
  { n: 3, icon: "ti-number-3", title: "Leia o risco do cliente", desc: "No menu Risco, compare cliente, mandato e portfólio na mesma régua.", go: "risco" as ScreenId },
  { n: 4, icon: "ti-number-4", title: "Acompanhe o mercado", desc: "Em Mercado e Intelligence: cotações ao vivo, radar social e posicionamento institucional.", go: "cotacoes" as ScreenId },
];

export default function Tutorial({ go }: { go: (id: ScreenId, param?: string) => void }) {
  return (
    <div className="screen">
      <div className="crumb"><b>Tutorial</b></div>
      <div className="h1">Como usar o terminal em 4 passos</div>
      <div className="sub">Leva 2 minutos. Você pode voltar aqui quando quiser.</div>

      <div className="grid g4">
        {STEPS.map((s) => (
          <div className="card" key={s.n} style={{ cursor: "pointer" }} onClick={() => go(s.go)}>
            <h3><i className={`ti ${s.icon}`} />{s.title}</h3>
            <div className="muted" style={{ lineHeight: 1.6 }}>{s.desc}</div>
            <div className="mt"><span className="muted" style={{ fontSize: 11, color: "var(--gold)" }}>abrir ›</span></div>
          </div>
        ))}
      </div>

      <div className="card mt" style={{ borderColor: "rgba(201,160,44,.3)" }}>
        <h3><i className="ti ti-layout-grid-add" />Personalize tudo (como o Bloomberg)</h3>
        <div className="muted" style={{ lineHeight: 1.6 }}>
          Cada painel tem um layout <b style={{ color: "var(--tx)" }}>padrão</b>, mas você <b style={{ color: "var(--tx)" }}>adiciona, remove e arrasta</b> os cartões — comece pelo Painel. Clique em &ldquo;Personalizar painel&rdquo;, tire o que não usa, traga o que importa. É assim que o terminal vira a sua ferramenta de trabalho.
        </div>
      </div>

      <div className="card mt" style={{ display: "flex", alignItems: "center", gap: 14, borderColor: "rgba(201,160,44,.3)" }}>
        <i className="ti ti-sparkles" style={{ fontSize: 22, color: "var(--gold)" }} />
        <div style={{ flex: 1 }}><b style={{ fontSize: 13 }}>Precisa de ajuda?</b> <span className="muted" style={{ fontSize: 13 }}>Pergunte ao Jim AI a qualquer momento, ou veja o glossário dos termos.</span></div>
        <button className="btn ghost">Glossário</button>
      </div>
    </div>
  );
}

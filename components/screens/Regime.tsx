"use client";
import { useEffect, useState } from "react";
import { fetchSnapshot, type RegimeState } from "@/lib/snapshot";
import { publishScreenData } from "@/lib/jim-data";

// Ordem: Risk-Off → Cautela → Neutro → Risk-On (defensivo à esquerda, exposto à direita).
const STATES = [
  { key: "BEAR", label: "Risk-Off", color: "#E74C3C" },
  { key: "CAUTELA", label: "Cautela", color: "#F39C12" },
  { key: "NEUTRO", label: "Neutro", color: "#4A90D9" },
  { key: "BULL", label: "Risk-On", color: "#2ECC71" },
];

// Leitura de alto nível (cliente-safe: o QUE significa, não COMO é detectado).
const MEANING: Record<string, string> = {
  BULL: "Ambiente favorável ao risco. Os fundos operam com exposição plena a ações; a camada de defesa fica em prontidão, pronta para reduzir risco se o regime virar.",
  NEUTRO: "Sem tendência dominante. Exposição moderada e monitoramento próximo — a postura pode mudar rápido nos dois sentidos.",
  CAUTELA: "Sinais de deterioração. Os fundos começam a reduzir risco e a reforçar a proteção.",
  BEAR: "Ambiente adverso. Defesa ativa: mais caixa e ativos defensivos, com exposição a ações reduzida.",
};

// Subtítulo (postura) por regime — resultado, sem revelar o motor.
const SUBLINE: Record<string, string> = {
  BULL: "defesa em prontidão · exposição plena",
  NEUTRO: "exposição moderada · defesa em prontidão",
  CAUTELA: "reduzindo risco · defesa ativando",
  BEAR: "defesa ativa · exposição reduzida",
};

// Pills por regime.
const PILLS: Record<string, { txt: string; tone: string }[]> = {
  BULL: [{ txt: "Exposição plena", tone: "g" }, { txt: "Defesa em prontidão", tone: "g" }],
  NEUTRO: [{ txt: "Exposição moderada", tone: "b" }, { txt: "Defesa em prontidão", tone: "b" }],
  CAUTELA: [{ txt: "Reduzindo risco", tone: "o" }, { txt: "Defesa ativando", tone: "o" }],
  BEAR: [{ txt: "Exposição reduzida", tone: "r" }, { txt: "Defesa ativa", tone: "r" }],
};

// Postura por regime — resultado (o que o fundo faz), sem revelar o motor.
const POSTURE = [
  { r: "Risk-On", eq: "Plena", def: "Em prontidão", tone: "g" },
  { r: "Neutro", eq: "Moderada", def: "Em prontidão", tone: "b" },
  { r: "Cautela", eq: "Reduzida", def: "Ativando", tone: "o" },
  { r: "Risk-Off", eq: "Baixa", def: "Ativa", tone: "r" },
];

export default function Regime() {
  const [state, setState] = useState<RegimeState | null>(null);
  const [asOf, setAsOf] = useState<string>("");
  const [conn, setConn] = useState<"loading" | "ok" | "offline">("loading");

  useEffect(() => {
    let live = true;
    fetchSnapshot().then((s) => {
      if (!live) return;
      if (s.ok && s.regime) {
        setState(s.regime.state);
        setAsOf(s.as_of || "");
        setConn("ok");
      } else {
        setConn("offline");
      }
    });
    return () => { live = false; };
  }, []);

  const CURRENT = state || "BULL";
  const cur = STATES.find((s) => s.key === CURRENT)!;
  const rowKey = CURRENT === "BULL" ? "Risk-On" : CURRENT === "BEAR" ? "Risk-Off" : CURRENT === "CAUTELA" ? "Cautela" : "Neutro";

  // Publica pro JIM o regime e a POSTURA (nunca o método de detecção).
  useEffect(() => {
    publishScreenData(
      "regime",
      "Regime de mercado que orienta a defesa dos fundos. Mostra o RESULTADO (regime e postura), nunca os sinais internos que o definem — o método de detecção é proprietário.",
      {
        regimeAtual: cur.label, postura: SUBLINE[CURRENT],
        oQueSignifica: MEANING[CURRENT], leituraDe: asOf || null,
      },
      {
        briefing:
          `O regime de mercado agora é **${cur.label.toUpperCase()}** — ${SUBLINE[CURRENT]}. ${MEANING[CURRENT]}`,
        suggestions: [
          "O que esse regime muda na minha carteira?",
          "A defesa dos fundos está ativa agora?",
          "O que faria o regime virar?",
        ],
      }
    );
  }, [CURRENT, cur, asOf]);

  return (
    <div className="screen">
      <div className="crumb">Mercado › <b>Regime de mercado</b></div>
      <div className="h1">Regime de mercado</div>
      <div className="sub">
        A leitura de regime que orienta a postura de defesa dos fundos. (O método de detecção é proprietário.)
        {conn === "ok" && asOf && <span style={{ marginLeft: 8, fontFamily: "var(--mono)", fontSize: 11, color: "var(--tx3)" }}>· leitura de {asOf}</span>}
      </div>

      {conn === "offline" && (
        <div className="pills mb"><span className="pill o"><span className="pd" />Leitura ao vivo indisponível — exibindo estrutura. Rode o overnight para atualizar.</span></div>
      )}

      <div className="grid g2 mb">
        <div className="card">
          <h3><i className="ti ti-gauge" />Regime atual</h3>
          <div style={{ textAlign: "center", padding: "6px 0 2px" }}>
            <div className="big" style={{ fontSize: 30, color: cur.color }}>{conn === "loading" ? "…" : cur.label.toUpperCase()}</div>
            <div className="muted mt">{SUBLINE[CURRENT]}</div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
            {STATES.map((s) => {
              const on = s.key === CURRENT;
              return (
                <div key={s.key} style={{ flex: 1, textAlign: "center", padding: "8px 4px", borderRadius: 8, border: `1px solid ${on ? s.color : "var(--line2)"}`, background: on ? `${s.color}1f` : "transparent" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, margin: "0 auto 6px", opacity: on ? 1 : 0.4 }} />
                  <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: on ? s.color : "var(--tx3)", fontWeight: on ? 700 : 400 }}>{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3><i className="ti ti-info-circle" />O que isso significa para a sua carteira</h3>
          <div style={{ fontSize: 14, color: "var(--tx)", lineHeight: 1.6 }}>{MEANING[CURRENT]}</div>
          <div className="pills mt">
            {PILLS[CURRENT].map((p, i) => (
              <span key={i} className={`pill ${p.tone}`}><span className="pd" />{p.txt}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3><i className="ti ti-shield-half" />Postura dos fundos por regime</h3>
        <table>
          <thead><tr><th>Regime</th><th>Exposição a ações</th><th>Camada de defesa</th></tr></thead>
          <tbody>
            {POSTURE.map((p) => {
              const on = p.r === rowKey;
              return (
                <tr key={p.r} style={{ background: on ? "rgba(212,175,55,.07)" : undefined }}>
                  <td><span className={`tag ${p.tone}`}>{p.r}</span>{on && <span style={{ marginLeft: 8, fontSize: 10, fontFamily: "var(--mono)", color: "var(--gold)" }}>◀ atual</span>}</td>
                  <td style={{ color: "var(--tx)" }}>{p.eq}</td>
                  <td style={{ color: "var(--tx2)" }}>{p.def}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="muted mt" style={{ fontSize: 11 }}>Mostra a postura que cada regime dispara nos fundos — não os sinais internos que definem o regime.</div>
      </div>
    </div>
  );
}

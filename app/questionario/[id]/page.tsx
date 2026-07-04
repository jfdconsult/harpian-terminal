"use client";
import { useState } from "react";

// Questionário de perfil de investidor (suitability) — o cliente abre pelo link que o gestor
// envia. Calcula o perfil (Conservador/Moderado/Agressivo) a partir das respostas. Fase 2:
// gravar o resultado de volta na ficha do cliente via API do MFO. Hoje mostra o resultado
// ao cliente (funcional) — o gestor confirma no Terminal.
const PERGUNTAS = [
  { q: "Qual o principal objetivo deste investimento?", opts: [
    { t: "Preservar o capital, com o mínimo de oscilação", v: 1 },
    { t: "Crescer de forma equilibrada, aceitando alguma oscilação", v: 2 },
    { t: "Maximizar o retorno, aceitando oscilações fortes", v: 3 },
  ] },
  { q: "Em quanto tempo pretende usar este dinheiro?", opts: [
    { t: "Menos de 2 anos", v: 1 },
    { t: "Entre 2 e 5 anos", v: 2 },
    { t: "Mais de 5 anos", v: 3 },
  ] },
  { q: "Se a carteira caísse 20% em um mês, o que faria?", opts: [
    { t: "Resgataria tudo para evitar mais perdas", v: 1 },
    { t: "Manteria e esperaria a recuperação", v: 2 },
    { t: "Aportaria mais, aproveitando os preços baixos", v: 3 },
  ] },
  { q: "Qual sua experiência com investimentos de risco?", opts: [
    { t: "Pouca — prefiro renda fixa e produtos simples", v: 1 },
    { t: "Média — já invisto em ações e fundos", v: 2 },
    { t: "Alta — invisto em ações, cripto, derivativos", v: 3 },
  ] },
  { q: "Que parte do seu patrimônio este valor representa?", opts: [
    { t: "A maior parte — é o meu colchão", v: 1 },
    { t: "Uma parte relevante", v: 2 },
    { t: "Uma parte pequena, posso arriscar", v: 3 },
  ] },
];

function perfil(score: number): { nome: string; cor: string; desc: string } {
  const media = score / PERGUNTAS.length;
  if (media <= 1.6) return { nome: "Conservador", cor: "#2ECC71", desc: "Prioriza a preservação do capital. Carteira com forte camada de defesa e baixa oscilação." };
  if (media <= 2.4) return { nome: "Moderado", cor: "#C9A02C", desc: "Busca equilíbrio entre crescimento e proteção. Aceita oscilação controlada." };
  return { nome: "Agressivo", cor: "#E67E22", desc: "Busca o máximo retorno e tolera oscilações fortes em troca de crescimento." };
}

export default function Questionario() {
  const [respostas, setRespostas] = useState<Record<number, number>>({});
  const [enviado, setEnviado] = useState(false);

  const completo = Object.keys(respostas).length === PERGUNTAS.length;
  const score = Object.values(respostas).reduce((s, v) => s + v, 0);
  const p = perfil(score);

  return (
    <div style={{ minHeight: "100vh", background: "#0a1628", color: "#e8eef5", display: "flex", justifyContent: "center", padding: "40px 20px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ width: 620, maxWidth: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: "#c9a84c", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>H</div>
          <div style={{ fontWeight: 700, letterSpacing: ".5px" }}>HARPIAN</div>
        </div>
        <h1 style={{ fontSize: 26, margin: "10px 0 4px" }}>Questionário de perfil de investidor</h1>
        <p style={{ color: "#8ba0b8", fontSize: 14, marginTop: 0 }}>Cinco perguntas para entendermos seu perfil e recomendar a carteira certa. Leva 2 minutos.</p>

        {!enviado ? (
          <>
            {PERGUNTAS.map((pg, i) => (
              <div key={i} style={{ background: "#0f1e33", border: "1px solid #1e3350", borderRadius: 10, padding: 18, marginTop: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>{i + 1}. {pg.q}</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {pg.opts.map((o, j) => {
                    const sel = respostas[i] === o.v;
                    return (
                      <button key={j} onClick={() => setRespostas({ ...respostas, [i]: o.v })}
                        style={{ textAlign: "left", padding: "11px 14px", borderRadius: 8, cursor: "pointer", fontSize: 14,
                          border: `1px solid ${sel ? "#c9a84c" : "#1e3350"}`, background: sel ? "rgba(201,168,76,.12)" : "transparent", color: sel ? "#f0d998" : "#cfe0f0" }}>
                        {o.t}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <button disabled={!completo} onClick={() => setEnviado(true)}
              style={{ width: "100%", marginTop: 20, padding: 14, borderRadius: 9, border: "none", fontSize: 15, fontWeight: 700,
                cursor: completo ? "pointer" : "not-allowed", background: completo ? "#c9a84c" : "#2a3a52", color: completo ? "#000" : "#5a6b82" }}>
              {completo ? "Ver meu perfil" : `Responda as ${PERGUNTAS.length} perguntas`}
            </button>
          </>
        ) : (
          <div style={{ background: "#0f1e33", border: `1px solid ${p.cor}`, borderRadius: 12, padding: 28, marginTop: 20, textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#8ba0b8", letterSpacing: "1px", textTransform: "uppercase" }}>Seu perfil</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: p.cor, margin: "8px 0" }}>{p.nome}</div>
            <p style={{ color: "#cfe0f0", fontSize: 15, lineHeight: 1.6 }}>{p.desc}</p>
            <p style={{ color: "#8ba0b8", fontSize: 13, marginTop: 16 }}>Recebemos suas respostas. Seu gestor Harpian vai usar este perfil para calibrar a carteira e o mandato. Obrigado!</p>
          </div>
        )}
      </div>
    </div>
  );
}

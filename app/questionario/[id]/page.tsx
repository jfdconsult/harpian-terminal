"use client";
import { useState } from "react";
import { useParams } from "next/navigation";

// Investor risk profile questionnaire (suitability) — the client opens it via the link the
// manager sends. Calculates the profile (Conservative/Moderate/Aggressive) from the answers
// and saves it via /api/questionnaire (see lib/questionnaire-store.ts) so the advisor can see
// it in the Terminal's "Client risk" screen without the client having to report it verbally.
const PERGUNTAS = [
  { q: "What is the main objective of this investment?", opts: [
    { t: "Preserve capital, with minimal fluctuation", v: 1 },
    { t: "Grow steadily, accepting some fluctuation", v: 2 },
    { t: "Maximize return, accepting strong fluctuation", v: 3 },
  ] },
  { q: "When do you plan to use this money?", opts: [
    { t: "Less than 2 years", v: 1 },
    { t: "Between 2 and 5 years", v: 2 },
    { t: "More than 5 years", v: 3 },
  ] },
  { q: "If the portfolio dropped 20% in a month, what would you do?", opts: [
    { t: "Redeem everything to avoid further losses", v: 1 },
    { t: "Hold and wait for recovery", v: 2 },
    { t: "Add more, taking advantage of the lower prices", v: 3 },
  ] },
  { q: "What is your experience with risk investments?", opts: [
    { t: "Little — I prefer fixed income and simple products", v: 1 },
    { t: "Moderate — I already invest in stocks and funds", v: 2 },
    { t: "High — I invest in stocks, crypto, derivatives", v: 3 },
  ] },
  { q: "What share of your total wealth does this amount represent?", opts: [
    { t: "Most of it — it's my safety cushion", v: 1 },
    { t: "A significant share", v: 2 },
    { t: "A small share, I can take on risk", v: 3 },
  ] },
];

function perfil(score: number): { nome: string; cor: string; desc: string } {
  const media = score / PERGUNTAS.length;
  if (media <= 1.6) return { nome: "Conservative", cor: "#2ECC71", desc: "Prioritizes capital preservation. Portfolio with a strong defensive layer and low fluctuation." };
  if (media <= 2.4) return { nome: "Moderate", cor: "#C9A02C", desc: "Seeks a balance between growth and protection. Accepts controlled fluctuation." };
  return { nome: "Aggressive", cor: "#E67E22", desc: "Seeks maximum return and tolerates strong fluctuation in exchange for growth." };
}

export default function Questionario() {
  const params = useParams();
  const clientId = String(params?.id || "");
  const [respostas, setRespostas] = useState<Record<number, number>>({});
  const [enviado, setEnviado] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const completo = Object.keys(respostas).length === PERGUNTAS.length;
  const score = Object.values(respostas).reduce((s, v) => s + v, 0);
  const p = perfil(score);

  function handleSubmit() {
    setEnviado(true);
    setSalvando(true);
    const answers = PERGUNTAS.map((_, i) => respostas[i]);
    fetch("/api/questionnaire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, answers }),
    })
      .catch(() => {})
      .finally(() => setSalvando(false));
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a1628", color: "#e8eef5", display: "flex", justifyContent: "center", padding: "40px 20px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ width: 620, maxWidth: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: "#c9a84c", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>H</div>
          <div style={{ fontWeight: 700, letterSpacing: ".5px" }}>HARPIAN</div>
        </div>
        <h1 style={{ fontSize: 26, margin: "10px 0 4px" }}>Investor risk profile questionnaire</h1>
        <p style={{ color: "#8ba0b8", fontSize: 14, marginTop: 0 }}>Five questions so we can understand your profile and recommend the right portfolio. Takes 2 minutes.</p>

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
            <button disabled={!completo} onClick={handleSubmit}
              style={{ width: "100%", marginTop: 20, padding: 14, borderRadius: 9, border: "none", fontSize: 15, fontWeight: 700,
                cursor: completo ? "pointer" : "not-allowed", background: completo ? "#c9a84c" : "#2a3a52", color: completo ? "#000" : "#5a6b82" }}>
              {completo ? "See my profile" : `Answer the ${PERGUNTAS.length} questions`}
            </button>
          </>
        ) : (
          <div style={{ background: "#0f1e33", border: `1px solid ${p.cor}`, borderRadius: 12, padding: 28, marginTop: 20, textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#8ba0b8", letterSpacing: "1px", textTransform: "uppercase" }}>Your profile</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: p.cor, margin: "8px 0" }}>{p.nome}</div>
            <p style={{ color: "#cfe0f0", fontSize: 15, lineHeight: 1.6 }}>{p.desc}</p>
            <p style={{ color: "#8ba0b8", fontSize: 13, marginTop: 16 }}>We received your answers. Your Harpian manager will use this profile to calibrate the portfolio and mandate. Thank you!</p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

const STATES = [
  { key: "BULL", label: "Risk-On", color: "#2ECC71" },
  { key: "NEUTRO", label: "Neutro", color: "#4A90D9" },
  { key: "CAUTELA", label: "Cautela", color: "#F39C12" },
  { key: "BEAR", label: "Risk-Off", color: "#E74C3C" },
];
const CURRENT = "BULL";

// Sinais e distância ao gatilho de defesa (%: quanto falta para armar/desarmar).
const SIGNALS = [
  { name: "Momentum 126d", value: "+12,4%", dist: 74, tone: "g" },
  { name: "Slope MA200", value: "+5,1%", dist: 61, tone: "g" },
  { name: "VIX", value: "16,4", dist: 38, tone: "o" },
  { name: "Breadth (% > MA50)", value: "62%", dist: 58, tone: "g" },
  { name: "Crédito HY OAS", value: "3,1%", dist: 44, tone: "o" },
];

const TRANSITIONS = [
  { date: "2026-05-02", from: "Cautela", to: "Risk-On", note: "defesa desarmada — momentum e breadth reagiram" },
  { date: "2026-03-10", from: "Risk-On", to: "Cautela", note: "VIX e crédito sinalizaram estresse" },
  { date: "2025-11-21", from: "Neutro", to: "Risk-On", note: "slope MA200 virou positivo" },
];

export default function Regime() {
  return (
    <div className="screen">
      <div className="crumb">Mercado › <b>Sinais &amp; regime</b></div>
      <div className="h1">Sinais &amp; regime</div>
      <div className="sub">Nosso motor proprietário de detecção de regime — o diferencial que o Bloomberg não tem.</div>

      <div className="grid g2 mb">
        <div className="card">
          <h3><i className="ti ti-gauge" />Regime de mercado · 4 estados</h3>
          <div style={{ textAlign: "center", padding: "6px 0 2px" }}>
            <div className="big g" style={{ fontSize: 30 }}>RISK-ON</div>
            <div className="muted mt">CRS 0,489 · defesa desarmada</div>
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
          <h3><i className="ti ti-temperature" />Sinais · distância ao gatilho</h3>
          {SIGNALS.map((sig) => (
            <div key={sig.name} style={{ marginBottom: 11 }}>
              <div className="flex between" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 12.5, color: "var(--tx2)" }}>{sig.name}</span>
                <span className="v" style={{ fontFamily: "var(--mono)", fontSize: 12, color: sig.tone === "g" ? "var(--green)" : "var(--orange)" }}>{sig.value}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "#08182c", overflow: "hidden" }}>
                <div style={{ width: `${sig.dist}%`, height: "100%", background: sig.tone === "g" ? "var(--green)" : "var(--orange)", opacity: 0.85 }} />
              </div>
            </div>
          ))}
          <div className="muted mt" style={{ fontSize: 11 }}>Barra = folga até o gatilho de defesa. Cheia = longe do gatilho (mercado saudável).</div>
        </div>
      </div>

      <div className="grid g2">
        <div className="card">
          <h3><i className="ti ti-thermometer" />Temperatura de mercado</h3>
          <div className="pills">
            <span className="pill g"><span className="pd" />Setor momentum</span>
            <span className="pill g"><span className="pd" />RPM momentum</span>
            <span className="pill o"><span className="pd" />Social radar</span>
          </div>
          <div className="muted mt" style={{ lineHeight: 1.6 }}>Termômetro ambiental (HSA v7) combina momentum de setores, RPM e o Social Radar num só leitor de ambiente.</div>
        </div>
        <div className="card">
          <h3><i className="ti ti-arrows-exchange" />Transições de regime</h3>
          {TRANSITIONS.map((t, i) => (
            <div key={i} className="kv" style={{ alignItems: "flex-start" }}>
              <span style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "var(--tx)", fontSize: 13 }}>{t.from} → <b style={{ color: "var(--gold)" }}>{t.to}</b></span>
                <span className="muted" style={{ fontSize: 11 }}>{t.note}</span>
              </span>
              <span className="muted" style={{ fontFamily: "var(--mono)", fontSize: 11, whiteSpace: "nowrap" }}>{t.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

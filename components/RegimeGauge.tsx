// ============================================================
// REGIME GAUGE (180°) — same one as the Cockpit, client-safe.
// Shows HOW we see the market: 4 zones + needle pointing at the
// current regime. Theme-aware (needle/text adapt to the theme).
// Terminal taxonomy: RISK-OFF · CAUTELA · NEUTRO · RISK-ON.
// Backend/engine keys stay in Portuguese (CAUTELA/NEUTRO) since they
// must match the regime state strings returned by the server — only
// the rendered labels are translated via DISPLAY_LABEL below.
// ============================================================
// STATE_MAP aceita AMBAS taxonomias:
//   - Backend keys (PT): CAUTELA / NEUTRO / BULL / BEAR (RegimeState do lib/snapshot)
//   - Display labels (EN): CAUTION / NEUTRAL / RISK-ON / RISK-OFF
// Antes eram só as EN mais CAUTELA/NEUTRO em PT, o que fazia CAUTION/NEUTRAL
// caírem no fallback NEUTRO — ponteiro na zona errada + cor azul.
const STATE_MAP: Record<string, [number, string]> = {
  // Zona 1 — vermelha (RISK-OFF)
  "RISK-OFF": [0.13, "#E74C3C"],
  BEAR:      [0.13, "#E74C3C"],
  // Zona 2 — laranja (CAUTION)
  CAUTELA:   [0.38, "#F39C12"],
  CAUTION:   [0.38, "#F39C12"],
  // Zona 3 — azul (NEUTRAL)
  NEUTRO:    [0.62, "#4A90D9"],
  NEUTRAL:   [0.62, "#4A90D9"],
  // Zona 4 — verde (RISK-ON)
  "RISK-ON": [0.88, "#2ECC71"],
  BULL:      [0.88, "#2ECC71"],
};

const DISPLAY_LABEL: Record<string, string> = {
  "RISK-OFF": "RISK-OFF",
  BEAR: "RISK-OFF",
  CAUTELA: "CAUTION",
  CAUTION: "CAUTION",
  NEUTRO: "NEUTRAL",
  NEUTRAL: "NEUTRAL",
  "RISK-ON": "RISK-ON",
  BULL: "RISK-ON",
};

export default function RegimeGauge({ state, sub }: { state: string; sub?: string }) {
  const key = (state || "").toUpperCase();
  const [frac, col] = STATE_MAP[key] || STATE_MAP["NEUTRO"];
  const label = DISPLAY_LABEL[key] || state;
  const ang = ((180 - frac * 180) * Math.PI) / 180;
  const L = 118;
  const nx = 200 + L * Math.cos(ang);
  const ny = 200 - L * Math.sin(ang);

  return (
    <svg viewBox="-20 0 440 232" width="100%" style={{ display: "block", maxHeight: 200 }}>
      <path d="M40,200 A160,160 0 0,1 86.9,86.9" fill="none" stroke="#E74C3C" strokeWidth={24} strokeLinecap="round" opacity={0.9} />
      <path d="M86.9,86.9 A160,160 0 0,1 200,40" fill="none" stroke="#F39C12" strokeWidth={24} opacity={0.9} />
      <path d="M200,40 A160,160 0 0,1 313.1,86.9" fill="none" stroke="#4A90D9" strokeWidth={24} opacity={0.9} />
      <path d="M313.1,86.9 A160,160 0 0,1 360,200" fill="none" stroke="#2ECC71" strokeWidth={24} strokeLinecap="round" opacity={0.9} />
      {/* labels radially centered on the middle of each arc (matching its color's phase) */}
      <text x={12} y={122} fill="#E74C3C" fontSize={11} fontWeight={700} textAnchor="middle">RISK-OFF</text>
      <text x={124} y={22} fill="#F39C12" fontSize={11} fontWeight={700} textAnchor="middle">CAUTION</text>
      <text x={276} y={22} fill="#4A90D9" fontSize={11} fontWeight={700} textAnchor="middle">NEUTRAL</text>
      <text x={388} y={122} fill="#2ECC71" fontSize={11} fontWeight={700} textAnchor="middle">RISK-ON</text>
      <line x1={200} y1={200} x2={nx.toFixed(1)} y2={ny.toFixed(1)} stroke="var(--tx)" strokeWidth={4} strokeLinecap="round" />
      <circle cx={200} cy={200} r={9} fill="var(--tx)" />
      <circle cx={200} cy={200} r={4} fill="var(--bg)" />
      <text x={200} y={150} fill={col} fontSize={27} fontWeight={800} textAnchor="middle">{label}</text>
      {sub && <text x={200} y={174} fill="var(--tx2)" fontSize={11} textAnchor="middle">{sub}</text>}
    </svg>
  );
}

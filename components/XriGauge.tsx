// ============================================================
// XRI GAUGE (180°) — sibling of RegimeGauge, client-safe.
// 4 zones: BAIXO/MODERADO/ELEVADO/CRÍTICO (CALM/WATCH/STRESS/CRISIS).
// Convention: calm/positive on the RIGHT, critical/negative on the LEFT
// (same direction used in the Cockpit — thresholds at 30/55/75, not 25/50/75
// like the domestic RegimeGauge, which is why the arcs are parameterized).
// Theme-aware (needle/text adapt to the theme).
// ============================================================
const ZONES: { label: string; color: string; upTo: number }[] = [
  { label: "BAIXO", color: "#2ECC71", upTo: 30 },
  { label: "MODERADO", color: "#F39C12", upTo: 55 },
  { label: "ELEVADO", color: "#E67E22", upTo: 75 },
  { label: "CRÍTICO", color: "#E74C3C", upTo: 100 },
];

// `label` above stays in Portuguese since it's matched against the `state`
// string returned by the server (app/api/xri/route.ts). Only the rendered
// captions are translated, via DISPLAY below.
const DISPLAY: Record<string, string> = {
  BAIXO: "CALM",
  MODERADO: "WATCH",
  ELEVADO: "STRESS",
  CRÍTICO: "CRISIS",
};

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
}
function arcPath(cx: number, cy: number, r: number, a0: number, a1: number, sweep: 0 | 1): string {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 0,${sweep} ${x1.toFixed(1)},${y1.toFixed(1)}`;
}
const ang = (s: number) => s * 1.8; // 0(right) → 180(left)

export default function XriGauge({ score, state }: { score: number; state: string }) {
  const col = ZONES.find((z) => z.label === state)?.color || "var(--tx2)";
  const na = ang(Math.max(0, Math.min(100, score)));
  const [nx, ny] = polar(200, 200, 118, na);
  let prev = 0;

  return (
    <svg viewBox="-20 0 440 232" width="100%" style={{ display: "block", maxHeight: 200 }}>
      {ZONES.map((z) => {
        const d = arcPath(200, 200, 160, ang(prev), ang(z.upTo), 0);
        prev = z.upTo;
        return (
          <path key={z.label} d={d} fill="none" stroke={z.color} strokeWidth={24}
            strokeLinecap={z.upTo === 30 || z.upTo === 100 ? "round" : undefined} opacity={0.9} />
        );
      })}
      <text x={352} y={222} fill="#2ECC71" fontSize={11} fontWeight={700} textAnchor="middle">{DISPLAY.BAIXO}</text>
      <text x={282} y={52} fill="#F39C12" fontSize={10} fontWeight={700} textAnchor="middle">{DISPLAY.MODERADO}</text>
      <text x={108} y={58} fill="#E67E22" fontSize={10} fontWeight={700} textAnchor="middle">{DISPLAY.ELEVADO}</text>
      <text x={48} y={222} fill="#E74C3C" fontSize={10} fontWeight={700} textAnchor="middle">{DISPLAY.CRÍTICO}</text>
      <line x1={200} y1={200} x2={nx.toFixed(1)} y2={ny.toFixed(1)} stroke="var(--tx)" strokeWidth={4} strokeLinecap="round" />
      <circle cx={200} cy={200} r={9} fill="var(--tx)" />
      <circle cx={200} cy={200} r={4} fill="var(--bg)" />
      <text x={200} y={150} fill={col} fontSize={34} fontWeight={800} textAnchor="middle">{Math.round(score)}</text>
    </svg>
  );
}

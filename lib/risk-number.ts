// ============================================================
// RISK NUMBER — Nitrogen/Riskalyze methodology (faithful to Harpian's HRIE)
// ------------------------------------------------------------
// Source: 05.05 - Risk Number MFO (HARPIAN OWN ENGINE / HRIE v1.1) and the
// captured Nitrogen benchmark. Scale 1–99, closed form (no Monte Carlo).
//
// Formula (HRIE v1.1 — RN as a pure observable):
//   annual_downside_dev = RMS of NEGATIVE daily returns × √252   (MAR = 0)
//   Downside_95_6m      = 1.645 × annual_downside_dev × √0.5     (95%, 6 months)
//   RN                  = piecewise linear interpolation on the anchor table
//
// The anchors are identical to the ones captured from Nitrogen (SPY≈70, AGG≈29, 60/40≈52),
// so the number means the same thing the market uses. Portfolio: weighted
// average of the downsides by weight — a conservative version (assumes correlation 1,
// does not discount diversification). The covariance matrix (HRIE §12) is left for v2.
// ============================================================

// downside (annual fraction, e.g. 0.12) → RN (1–99). Nitrogen-validated anchors.
const RN_ANCHORS: [number, number][] = [
  [0.02, 22], [0.05, 32], [0.07, 42], [0.12, 62], [0.18, 82], [0.2742, 91],
];

const Z_95 = 1.645;
const SIX_MONTH = Math.sqrt(0.5); // √0.5 — scales 1 year → 6 months

/** Annualized downside deviation (MAR=0): RMS of negative daily returns × √252. */
export function downsideDeviation(dailyReturns: number[]): number | null {
  if (dailyReturns.length < 20) return null; // too small a sample = no honest number
  const neg = dailyReturns.filter((x) => x < 0);
  if (!neg.length) return 0;
  const rms = Math.sqrt(neg.reduce((s, x) => s + x * x, 0) / dailyReturns.length);
  return rms * Math.sqrt(252);
}

/** 95% downside over 6 months (fraction, e.g. 0.16) from the annual downside. */
export function downside95_6m(downsideAnnual: number): number {
  return Z_95 * downsideAnnual * SIX_MONTH;
}

/** Maps the 95%/6m loss (fraction) → Risk Number 1–99 (piecewise interpolation). */
export function riskNumberFromDownside95(loss: number): number {
  if (loss <= 0) return 1;
  const lastAnchor = RN_ANCHORS[RN_ANCHORS.length - 1];
  // ABOVE the last anchor → cap at 99. Note `>` and not `>=`: at the anchor's
  // exact point (0.2742) the RN is 91, not 99 — the cap only applies to larger losses.
  if (loss > lastAnchor[0]) return 99;
  for (let i = 1; i < RN_ANCHORS.length; i++) {
    const [x1, y1] = RN_ANCHORS[i - 1];
    const [x2, y2] = RN_ANCHORS[i];
    if (loss <= x2) {
      const t = (loss - x1) / (x2 - x1);
      return Math.round(y1 + t * (y2 - y1));
    }
  }
  return lastAnchor[1];
}

/** Shortcut: series of daily returns → RN 1–99. */
export function riskNumberFromReturns(dailyReturns: number[]): number | null {
  const dd = downsideDeviation(dailyReturns);
  if (dd == null) return null;
  return riskNumberFromDownside95(downside95_6m(dd));
}

export interface PositionRisk {
  ticker: string;
  weight: number;         // 0–1
  downsideAnnual: number; // fraction
  riskNumber: number;     // 1–99 for the standalone asset
}

export interface PortfolioRisk {
  riskNumber: number;         // 1–99 for the portfolio
  loss95_6m_pct: number;      // estimated 95%/6m loss, in %
  positions: PositionRisk[];
  coverage: number;           // fraction of weight with history (0–1)
  method: string;
}

/**
 * Portfolio RN: weighted average of the downsides by weight (conservative, without
 * a correlation discount). Receives each position with downsideAnnual already computed.
 * Renormalizes the weights by what has history (coverage reports how much was left out).
 */
export function portfolioRiskNumber(
  positions: { ticker: string; weight: number; downsideAnnual: number | null }[],
): PortfolioRisk | null {
  const withData = positions.filter((p) => p.downsideAnnual != null && p.weight > 0);
  if (!withData.length) return null;

  const covered = withData.reduce((s, p) => s + p.weight, 0);
  const totalWeight = positions.reduce((s, p) => s + Math.max(0, p.weight), 0) || 1;
  if (covered <= 0) return null;

  // portfolio downside = average of the downsides, renormalized by the covered weight
  const portDownside = withData.reduce((s, p) => s + p.weight * (p.downsideAnnual as number), 0) / covered;
  const loss = downside95_6m(portDownside);
  const rn = riskNumberFromDownside95(loss);

  const perPos: PositionRisk[] = withData.map((p) => ({
    ticker: p.ticker,
    weight: p.weight / totalWeight,
    downsideAnnual: p.downsideAnnual as number,
    riskNumber: riskNumberFromDownside95(downside95_6m(p.downsideAnnual as number)),
  }));

  return {
    riskNumber: rn,
    loss95_6m_pct: loss * 100,
    positions: perPos,
    coverage: covered / totalWeight,
    method: "Nitrogen/HRIE · 95% downside over 6 months · conservative correlation (=1)",
  };
}

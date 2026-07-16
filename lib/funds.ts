// ============================================================
// HARPIAN ETP TERMINAL — Fund (ETP) data
// HPC22 source: Institutional Factsheet v4 CORE22+ (June 2026), official.
// HPC11: mirrored structure, awaiting official factsheet.
// ============================================================

export interface PerfRow { metric: string; gross: string; net: string; spx: string; }
export interface KV { k: string; v: string; }
export interface JourneyRow { metric: string; core: string; spx: string; }
export interface EndpointRow { horizon: string; corePos: string; coreWorst: string; spxPos: string; spxWorst: string; }
export interface CrisisRow { crisis: string; spxDecline: string; spxRec: string; coreDecline: string; coreRec: string; }
export interface Step { n: number; title: string; desc: string; }
export interface Highlight { label: string; value: string; sub?: string; tone?: "g" | "r" | "gold" }

export interface Fund {
  id: string;
  ticker: string;
  name: string;
  strategy: string;
  assetClass: string;
  tagline: string;
  status: "Homologado" | "Laboratório";
  official: boolean;
  isin: string;
  seals: string[];
  highlights: Highlight[];
  productData: KV[];
  performance: PerfRow[];
  perfNote: string;
  journeyRisk: JourneyRow[];
  endpointRisk: EndpointRow[];
  endpointNote: string;
  crisisDefense: CrisisRow[];
  crisisNote: string;
  economics: KV[];
  architecture: KV[];
  engineArchitecture: KV[];
  purchaseSteps: Step[];
  purchaseData: KV[];
  contacts: KV[];
  disclaimer: string;
}

const HPC22: Fund = {
  id: "HPC22",
  ticker: "HPC22",
  name: "HPC22 · CORE22+",
  strategy: "Adaptive Equity Momentum",
  assetClass: "Listed institutional ETP",
  tagline: "Risk is measured. Capital is preserved. Return is built through method.",
  status: "Laboratório",
  official: true,
  isin: "XS3386635109",
  seals: ["Deloitte", "BNY Mellon", "Interactive Brokers", "Bloomberg", "Vienna Stock Exchange", "Lynk Capital Markets"],
  highlights: [
    { label: "CAGR 36yr (net)", value: "28,3%", sub: "S&P 500 TR: 10,75%", tone: "g" },
    { label: "Max. drawdown (net)", value: "−29,0%", sub: "S&P 500: −55,3%", tone: "gold" },
    { label: "Sortino (rf 3,5%)", value: "6,73", sub: "S&P 500: 2,83", tone: "g" },
    { label: "Ulcer Index", value: "6,79", sub: "2,1× lower than the S&P", tone: "gold" },
  ],
  productData: [
    { k: "Product / Strategy", v: "HPC22 · CORE22+" },
    { k: "Class", v: "Adaptive Equity Momentum" },
    { k: "Universe", v: "S&P 500 · 2 stocks/sector" },
    { k: "Regime", v: "Binary BULL / BEAR" },
    { k: "Defense", v: "Defensive ETFs" },
    { k: "Rebalancing", v: "Monthly, systematic" },
    { k: "Minimum", v: "USD 50k (multiples of USD 5k)" },
    { k: "Eligibility", v: "Non-US tax residents" },
  ],
  performance: [
    { metric: "CAGR (36yr)", gross: "37,3%", net: "28,3%", spx: "10,75%" },
    { metric: "Max. drawdown", gross: "−26,0%", net: "−29,0%", spx: "−55,3%" },
    { metric: "Ulcer Index", gross: "6,79", net: "6,79", spx: "13,93" },
    { metric: "Sharpe (rf 3,5%)", gross: "1,06", net: "0,93", spx: "0,55" },
    { metric: "Sortino (rf 3,5%)", gross: "12,30", net: "6,73", spx: "2,83" },
    { metric: "Negative years", gross: "1", net: "3", spx: "8" },
  ],
  perfNote: "Modeled fees: 2,00% p.a. management and 20% performance over a 5% p.a. hurdle, with high-water mark. Hypothetical results; indices do not incur fees.",
  journeyRisk: [
    { metric: "Number of events (drawdowns ≥5%)", core: "111", spx: "42" },
    { metric: "Recovery — median", core: "1,6 months", spx: "2,7 months" },
    { metric: "Recovery — average", core: "2,6 months", spx: "6,7 months" },
    { metric: "% recovered within ≤6 months", core: "89%", spx: "83%" },
    { metric: "Worst time underwater", core: "21,1 months", spx: "74,8 months" },
    { metric: "Worst drawdown", core: "−28,3%", spx: "−55,3%" },
  ],
  endpointRisk: [
    { horizon: "3-year horizon", corePos: "100%", coreWorst: "+5,1%", spxPos: "76%", spxWorst: "−14,6%" },
    { horizon: "5-year horizon", corePos: "100%", coreWorst: "+20,6%", spxPos: "81%", spxWorst: "−2,7%" },
  ],
  endpointNote: "In the backtest, no 3- or 5-year window starting at an annual peak ended negative for CORE22+. The thesis is not to eliminate volatility, but to reduce the probability of the investor abandoning the plan at the worst point of the cycle.",
  crisisDefense: [
    { crisis: "Dot-com bubble (2000 peak)", spxDecline: "−47,4%", spxRec: "74,8 months", coreDecline: "−18,6%", coreRec: "21,1 months" },
    { crisis: "Financial crisis (2007 peak)", spxDecline: "−55,3%", spxRec: "54,6 months", coreDecline: "−13,8% / −22,6%", coreRec: "7,5 / 6,9 months" },
    { crisis: "COVID (Feb. 2020)", spxDecline: "−33,8%", spxRec: "5,8 months", coreDecline: "−17,2%", coreRec: "2,2 months" },
    { crisis: "Bear market 2022", spxDecline: "−24,5%", spxRec: "23,6 months", coreDecline: "−28,3%", coreRec: "14,2 months" },
  ],
  crisisNote: "Transparency about weaknesses is part of the method: in 2022 CORE22+ fell more than the S&P, but recovered in about 60% of the time.",
  economics: [
    { k: "Management fee", v: "2,00% p.a." },
    { k: "Performance fee", v: "20%" },
    { k: "Hurdle", v: "5% p.a." },
    { k: "High-water mark", v: "Yes" },
    { k: "Minimum investment", v: "USD 50.000" },
    { k: "Multiples", v: "USD 5.000" },
    { k: "Tax efficiency", v: "No Brazilian semi-annual come-cotas tax" },
  ],
  architecture: [
    { k: "Segregated custody", v: "BNY Mellon" },
    { k: "Mandate execution", v: "Interactive Brokers" },
    { k: "External audit", v: "Deloitte" },
    { k: "Daily NAV", v: "Bloomberg" },
    { k: "Listing", v: "Vienna Stock Exchange" },
    { k: "Admin. and settlement", v: "Lynk Capital Markets" },
    { k: "Distribution", v: "Wisen (global, ex-US)" },
  ],
  engineArchitecture: [
    { k: "Attack engine", v: "HC-US 3.1 CORE22+ — proprietary multi-factor momentum model across the S&P 500 universe" },
    { k: "Attack selection", v: "Institutional-grade signal ranking with sector-level calibration, recalibrated on a rolling basis" },
    { k: "Defense engine", v: "HSA v6 — proprietary multi-layer protection system (shared across all Harpian portfolios)" },
    { k: "Layer 1 (defense)", v: "Structural fragility score — proprietary composite blending trend, shock, and acceleration signals" },
    { k: "Layer 2 (defense)", v: "Systemic correlation gate — dynamically tightens exposure as cross-asset correlation rises" },
    { k: "Layer 3 (defense)", v: "Adaptive re-entry monitor — gradual, confirmation-based re-entry after a defensive posture" },
    { k: "Regime", v: "StormGuard-Armor — proprietary binary regime classifier (Bull / Bear)" },
    { k: "Balancing", v: "Regime-driven allocation switching (shared engine) — full offense in Bull, full defense in Bear" },
    { k: "Rebalancing", v: "Monthly, fully systematic" },
  ],
  purchaseSteps: [
    { n: 1, title: "Lynk Markets account", desc: "The MFO, manager, or family office must have an active Lynk Markets account. Onboarding: lynkmarkets.com." },
    { n: 2, title: "Define product and amount", desc: "Product: HPC22 · ISIN XS3386635109. Minimum USD 50k, in multiples of USD 5k." },
    { n: 3, title: "Order submission", desc: "Order via LynkPort, email, Bloomberg, or trading desk. BUY: amount, currency, broker/custodian; Harpian supports routing." },
    { n: 4, title: "Operational instruction", desc: "Settlement date, custodian, Lynk settlement." },
    { n: 5, title: "Confirmation and DvP", desc: "Lynk confirms. Settlement via DvP Euroclear/Clearstream. Investor receives Notes/ETP." },
  ],
  purchaseData: [
    { k: "ISIN", v: "XS3386635109" },
    { k: "Issuer FI", v: "BNYM · EC 21625" },
    { k: "Euroclear", v: "21625" },
    { k: "Agent ID", v: "00093034" },
    { k: "DTC / MPID", v: "0901 / BKCM" },
    { k: "BIC", v: "IRTVUS3N" },
    { k: "Institutional ID", v: "00095441" },
  ],
  contacts: [
    { k: "Lynk Operations", v: "lynk.ops@lynkmarkets.com" },
    { k: "Trading desk", v: "lynk.trading@lynkmarkets.com" },
    { k: "Lynk Website", v: "lynkmarkets.com" },
    { k: "Phone", v: "+1 929 900 5965" },
    { k: "Harpian", v: "contato@harpian.com" },
  ],
  disclaimer: "Hypothetical / modeled performance. Results are based on a backtest of the CORE22+ strategy using 1990–2025 data and do not represent real client accounts. Hypothetical results have inherent limitations: they are prepared retrospectively, do not involve real financial risk, and do not reflect decisions made under actual market conditions. Past performance does not guarantee future returns. Comparisons with the S&P 500 Total Return are illustrative. Harpian does not receive funds, does not execute orders, and does not act as custodian. Confidential document — does not constitute an offer or recommendation.",
};

const HPC11: Fund = {
  id: "HPC11",
  ticker: "HPC11",
  name: "HPC11 · HC-US I.G.",
  strategy: "Investment Grade · conservative profile",
  assetClass: "Listed institutional ETP",
  tagline: "Risk is measured. Capital is preserved. Return is built through method.",
  status: "Homologado",
  official: false,
  isin: "—",
  seals: ["Deloitte", "BNY Mellon", "Interactive Brokers", "Bloomberg", "Vienna Stock Exchange", "Lynk Capital Markets"],
  highlights: [
    { label: "CAGR (net)", value: "—", sub: "awaiting factsheet", tone: "gold" },
    { label: "Max. drawdown", value: "—", sub: "conservative profile", tone: "gold" },
    { label: "Sortino", value: "—", sub: "awaiting factsheet", tone: "gold" },
    { label: "Rating", value: "I.G.", sub: "Investment Grade", tone: "g" },
  ],
  productData: [
    { k: "Product / Strategy", v: "HPC11 · HC-US I.G." },
    { k: "Class", v: "Investment Grade (conservative)" },
    { k: "Universe", v: "S&P 500 · I.G." },
    { k: "Regime", v: "Binary BULL / BEAR" },
    { k: "Defense", v: "Defensive ETFs + cushion" },
    { k: "Rebalancing", v: "Monthly, systematic" },
    { k: "Minimum", v: "USD 50k (multiples of USD 5k)" },
    { k: "Eligibility", v: "Non-US tax residents" },
  ],
  performance: [
    { metric: "CAGR (36yr)", gross: "—", net: "—", spx: "10,75%" },
    { metric: "Max. drawdown", gross: "—", net: "—", spx: "−55,3%" },
    { metric: "Ulcer Index", gross: "—", net: "—", spx: "13,93" },
    { metric: "Sharpe (rf 3,5%)", gross: "—", net: "—", spx: "0,55" },
    { metric: "Sortino (rf 3,5%)", gross: "—", net: "—", spx: "2,83" },
    { metric: "Negative years", gross: "—", net: "—", spx: "8" },
  ],
  perfNote: "Official HPC11 data awaiting institutional factsheet. Structure mirrored from HPC22.",
  journeyRisk: [],
  endpointRisk: [],
  endpointNote: "",
  crisisDefense: [],
  crisisNote: "",
  economics: [
    { k: "Management fee", v: "2,00% p.a." },
    { k: "Performance fee", v: "20%" },
    { k: "Hurdle", v: "5% p.a." },
    { k: "High-water mark", v: "Yes" },
    { k: "Minimum investment", v: "USD 50.000" },
    { k: "Multiples", v: "USD 5.000" },
  ],
  architecture: [
    { k: "Segregated custody", v: "BNY Mellon" },
    { k: "Mandate execution", v: "Interactive Brokers" },
    { k: "External audit", v: "Deloitte" },
    { k: "Daily NAV", v: "Bloomberg" },
    { k: "Listing", v: "Vienna Stock Exchange" },
    { k: "Admin. and settlement", v: "Lynk Capital Markets" },
  ],
  engineArchitecture: [
    { k: "Attack engine", v: "HC-US I.G. — proprietary multi-factor momentum model, restricted to the Investment Grade universe" },
    { k: "Attack selection", v: "Institutional-grade signal ranking with sector-level calibration, recalibrated on a rolling basis" },
    { k: "Defense engine", v: "HSA v6 — proprietary multi-layer protection system (shared across all Harpian portfolios)" },
    { k: "Layer 1 (defense)", v: "Structural fragility score — proprietary composite blending trend, shock, and acceleration signals" },
    { k: "Layer 2 (defense)", v: "Systemic correlation gate — dynamically tightens exposure as cross-asset correlation rises" },
    { k: "Layer 3 (defense)", v: "Adaptive re-entry monitor — gradual, confirmation-based re-entry after a defensive posture" },
    { k: "Regime", v: "StormGuard-Armor — proprietary binary regime classifier (Bull / Bear)" },
    { k: "Balancing", v: "Regime-driven allocation switching (shared engine) — full offense in Bull, full defense in Bear" },
    { k: "Special defense", v: "Additional conservative-profile defensive overlay" },
    { k: "Rebalancing", v: "Monthly, fully systematic" },
  ],
  purchaseSteps: [
    { n: 1, title: "Lynk Markets account", desc: "Active Lynk Markets account. Onboarding: lynkmarkets.com." },
    { n: 2, title: "Define product and amount", desc: "Product: HPC11. Minimum USD 50k, in multiples of USD 5k." },
    { n: 3, title: "Order submission", desc: "Order via LynkPort, email, Bloomberg, or trading desk." },
    { n: 4, title: "Operational instruction", desc: "Settlement date, custodian, Lynk settlement." },
    { n: 5, title: "Confirmation and DvP", desc: "Lynk confirms. Settlement via DvP Euroclear/Clearstream." },
  ],
  purchaseData: [
    { k: "ISIN", v: "pending" },
  ],
  contacts: [
    { k: "Lynk Operations", v: "lynk.ops@lynkmarkets.com" },
    { k: "Trading desk", v: "lynk.trading@lynkmarkets.com" },
    { k: "Harpian", v: "contato@harpian.com" },
  ],
  disclaimer: "Hypothetical / modeled performance. Official HPC11 data awaiting institutional factsheet. Past performance does not guarantee future returns. Harpian does not receive funds, does not execute orders, and does not act as custodian. Confidential document — does not constitute an offer or recommendation.",
};

const LCORE22: Fund = {
  id: "LCORE22",
  ticker: "LCORE22",
  name: "Lynk Core22 HPC",
  strategy: "Core22 MAX · Sector Momentum Rotation (AlphaDroid replica)",
  assetClass: "Listed institutional ETP",
  tagline: "22 sector-momentum sleeves, 12 stocks each, top-1 selection with StormGuard-Armor regime gate. Exact replica of the AlphaDroid CORE22+ MAX architecture.",
  status: "Laboratório",
  official: false,
  isin: "—",
  seals: ["Deloitte", "BNY Mellon", "Interactive Brokers", "Bloomberg", "Vienna Stock Exchange", "Lynk Capital Markets"],
  highlights: [
    { label: "CAGR 37yr (gross)", value: "37,6%", sub: "S&P 500 TR: 11,6%", tone: "g" },
    { label: "Max. drawdown (gross)", value: "−26,0%", sub: "S&P 500: −55,3%", tone: "gold" },
    { label: "Sharpe (rf 3,5%)", value: "1,07", sub: "S&P 500: 0,55", tone: "g" },
    { label: "Upside / Downside Capture", value: "148% / 39%", sub: "Asymmetric capture", tone: "g" },
  ],
  productData: [
    { k: "Product / Strategy", v: "Lynk Core22 HPC · Core22 MAX" },
    { k: "Class", v: "Sector Momentum Rotation (AlphaDroid replica)" },
    { k: "Engine", v: "22 sleeves × 12 stocks = 264 stocks monitored" },
    { k: "Selection", v: "Top-1 momentum per sleeve (DEMA/EMA smoothed ROC)" },
    { k: "Sectors", v: "11 GICS (Tech, Comm, ConsDisc, ConsStap, Fin, Health, Ind, Mat, RE, Energy, Util) + Bonds + BigTech" },
    { k: "Regime", v: "StormGuard-Armor (BULL ≥ 0 / BEAR < 0)" },
    { k: "Defense", v: "Nuclear Defensive: bonds 58%, health 21%, energy 20%" },
    { k: "Rebalancing", v: "Monthly, systematic, Tau calibrated per sector" },
    { k: "Minimum", v: "USD 50k (multiples of USD 5k)" },
    { k: "Eligibility", v: "Non-US tax residents" },
  ],
  performance: [
    { metric: "CAGR (37.7yr)", gross: "37,6%", net: "28,3%", spx: "11,6%" },
    { metric: "Max. drawdown", gross: "−26,0%", net: "−29,0%", spx: "−55,3%" },
    { metric: "Std. deviation", gross: "32,4%", net: "32,4%", spx: "—" },
    { metric: "Sharpe (rf 3,5%)", gross: "1,07", net: "0,93", spx: "0,55" },
    { metric: "Sortino (rf 3,5%)", gross: "12,30", net: "6,73", spx: "2,83" },
    { metric: "Negative years", gross: "1", net: "3", spx: "8" },
  ],
  perfNote: "Exact replica of the AlphaDroid CORE22+ MAX architecture (portfolio 829). Modeled fees: 2% p.a. management + 20% performance over a 5% p.a. hurdle with high-water mark. Backtest 1988–2026.",
  journeyRisk: [
    { metric: "Number of events (drawdowns ≥5%)", core: "111", spx: "42" },
    { metric: "Recovery — median", core: "1,6 months", spx: "2,7 months" },
    { metric: "Recovery — average", core: "2,6 months", spx: "6,7 months" },
    { metric: "% recovered within ≤6 months", core: "89%", spx: "83%" },
    { metric: "Worst time underwater", core: "21,1 months", spx: "74,8 months" },
    { metric: "Worst drawdown", core: "−26,0%", spx: "−55,3%" },
  ],
  endpointRisk: [
    { horizon: "3-year horizon", corePos: "100%", coreWorst: "+5,1%", spxPos: "76%", spxWorst: "−14,6%" },
    { horizon: "5-year horizon", corePos: "100%", coreWorst: "+20,6%", spxPos: "81%", spxWorst: "−2,7%" },
  ],
  endpointNote: "No 3- or 5-year window starting at an annual peak ended negative for CORE22+ MAX. StormGuard-Armor acts as a binary gate (~23% bear, 77% bull), capturing 148% of the upside and only 39% of the downside.",
  crisisDefense: [
    { crisis: "Dot-com bubble (2000 peak)", spxDecline: "−47,4%", spxRec: "74,8 months", coreDecline: "−18,6%", coreRec: "21,1 months" },
    { crisis: "Financial crisis (2007 peak)", spxDecline: "−55,3%", spxRec: "54,6 months", coreDecline: "−13,8% / −22,6%", coreRec: "7,5 / 6,9 months" },
    { crisis: "COVID (Feb. 2020)", spxDecline: "−33,8%", spxRec: "5,8 months", coreDecline: "−17,2%", coreRec: "2,2 months" },
    { crisis: "Bear market 2022", spxDecline: "−24,5%", spxRec: "23,6 months", coreDecline: "−26,0%", coreRec: "14,2 months" },
  ],
  crisisNote: "In 2022, CORE22+ MAX fell slightly more than the S&P, but recovered in ~60% of the time. StormGuard detected every bear market since 1988 (56 episodes).",
  economics: [
    { k: "Management fee", v: "2,00% p.a." },
    { k: "Performance fee", v: "20%" },
    { k: "Hurdle", v: "5% p.a." },
    { k: "High-water mark", v: "Yes" },
    { k: "Minimum investment", v: "USD 50.000" },
    { k: "Multiples", v: "USD 5.000" },
    { k: "Tax efficiency", v: "No Brazilian semi-annual come-cotas tax" },
  ],
  architecture: [
    { k: "Segregated custody", v: "BNY Mellon" },
    { k: "Mandate execution", v: "Interactive Brokers" },
    { k: "External audit", v: "Deloitte" },
    { k: "Daily NAV", v: "Bloomberg" },
    { k: "Listing", v: "Vienna Stock Exchange" },
    { k: "Admin. and settlement", v: "Lynk Capital Markets" },
    { k: "Distribution", v: "Wisen (global, ex-US)" },
  ],
  engineArchitecture: [
    { k: "Attack engine", v: "AlphaDroid CORE22+ MAX — proprietary institutional replica of Harpian's flagship momentum engine" },
    { k: "Attack selection", v: "Institutional-grade signal ranking, sector-calibrated, top-ranked name selected per sleeve" },
    { k: "Attack universe", v: "22 sector sleeves spanning the full GICS map, plus Bonds and Big Tech" },
    { k: "Sector calibration", v: "Independently calibrated per sector to match each sector's own volatility regime" },
    { k: "Defense engine", v: "HSA v6 — proprietary multi-layer protection system (shared across all Harpian portfolios)" },
    { k: "Layer 1 (defense)", v: "Structural fragility score — proprietary composite blending trend, shock, and acceleration signals" },
    { k: "Layer 2 (defense)", v: "Systemic correlation gate — dynamically tightens exposure as cross-asset correlation rises" },
    { k: "Layer 3 (defense)", v: "Adaptive re-entry monitor — gradual, confirmation-based re-entry after a defensive posture" },
    { k: "Regime", v: "StormGuard-Armor — proprietary binary regime classifier, historically Bull ~3/4 of the time" },
    { k: "Defense activated", v: "Rotates into a diversified defensive mix (fixed income + defensive sectors) when triggered" },
    { k: "Balancing", v: "Regime-driven allocation switching (shared engine) — full offense in Bull, full defense in Bear" },
    { k: "Rebalancing", v: "Monthly, fully systematic, sector-calibrated" },
  ],
  purchaseSteps: [
    { n: 1, title: "Lynk Markets account", desc: "Active Lynk Markets account. Onboarding: lynkmarkets.com." },
    { n: 2, title: "Define product and amount", desc: "Product: Lynk Core22 HPC. Minimum USD 50k, in multiples of USD 5k." },
    { n: 3, title: "Order submission", desc: "Order via LynkPort, email, Bloomberg, or trading desk." },
    { n: 4, title: "Operational instruction", desc: "Settlement date, custodian, Lynk settlement." },
    { n: 5, title: "Confirmation and DvP", desc: "Lynk confirms. Settlement via DvP Euroclear/Clearstream." },
  ],
  purchaseData: [
    { k: "ISIN", v: "pending" },
  ],
  contacts: [
    { k: "Lynk Operations", v: "lynk.ops@lynkmarkets.com" },
    { k: "Trading desk", v: "lynk.trading@lynkmarkets.com" },
    { k: "Lynk Website", v: "lynkmarkets.com" },
    { k: "Phone", v: "+1 929 900 5965" },
    { k: "Harpian", v: "contato@harpian.com" },
  ],
  disclaimer: "Hypothetical / modeled performance. Exact replica of the AlphaDroid CORE22+ MAX architecture. Backtest 1988–2026. Hypothetical results have inherent limitations: they are prepared retrospectively, do not involve real financial risk, and do not reflect decisions made under actual market conditions. Past performance does not guarantee future returns. Harpian does not receive funds, does not execute orders, and does not act as custodian. Confidential document — does not constitute an offer or recommendation.",
};

export const FUNDS: Record<string, Fund> = { HPC22, HPC11, LCORE22 };
export const FUND_LIST = [HPC22, HPC11, LCORE22];

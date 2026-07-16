// ============================================================
// JIM — Market interpretation engine (Terminal)
// ------------------------------------------------------------
// What this module does: it takes the OUTPUT of the indices (ARI/XRI) and the
// OBSERVABLE indicators from Market DNA (VIX, skew, breadth, COT, curve,
// credit, Fear & Greed) and produces interpretation — why the regime is
// where it is, what's changing, who the aggressors are, and what to do.
//
// CONFIDENTIALITY: never exposes formula, weights, CRS, temperature, or
// internal pillars. The "how" stays in the Cockpit; here only the "what" and
// the "why" enter, backed by public data (CFTC, CBOE, FRED, CNN, Yahoo).
//
// Writing rule: every statement needs to be anchored to a number that came
// from the feed. No number, no sentence — JIM never "guesses."
// ============================================================

import type { XriView } from "./xri";
import type { RegimeState } from "./snapshot";
import type { AssetResp } from "./types";

// ── Actual shape of gov-data /api/market-dna (api_server.py, port 8877) ──
export interface CotRow {
  market: string;
  open_interest?: number;
  spec_net?: number;
  spec_net_pct_oi?: number;
  comm_net_pct_oi?: number;
  spec_sentiment?: string;
}
export interface VolData {
  vix?: {
    current?: number; change_5d?: number; change_21d?: number; sma_20?: number;
    high_52w?: number; low_52w?: number; iv_rank?: number; iv_percentile?: number;
    term_structure?: string;
  };
  vvix?: number;
  skew?: number;
  regime?: string;
}
export interface SentData {
  score?: number; rating?: string; previous_close?: number;
  week_ago?: number; month_ago?: number; year_ago?: number;
}
export interface BreadthData {
  sample_size?: number; pct_above_200ma?: number; pct_above_50ma?: number;
  advancing?: number; declining?: number; ad_ratio?: number; breadth_signal?: string;
}
export interface MacroData {
  series?: Record<string, { value?: number; date?: string }>;
  yield_curve_spread?: number; yield_curve_signal?: string;
  credit_spread?: number; credit_signal?: string; policy_stance?: string;
}
export interface DnaRaw {
  collected_at?: string;
  layers?: {
    positioning?: { status?: string; data?: CotRow[] };
    volatility?: { status?: string; data?: VolData };
    sentiment?: { status?: string; data?: SentData };
    breadth?: { status?: string; data?: BreadthData };
    macro?: { status?: string; data?: MacroData };
    liquidity?: { status?: string; data?: { summary?: { tracked_symbols?: number } } };
    insider?: { status?: string; data?: { n_orders?: number } };
  };
}

// ── Output ──
export type Tone = "pos" | "neg" | "neu";
export interface Driver { label: string; detail: string; tone: Tone }
export interface AnalysisBlock {
  key: string;
  title: string;
  badge: { label: string; color: string };
  /** 1 scannable line for the SUMMARY (Market Overview). Fact + number only. */
  resumo: string;
  /** From here down is DETAIL — lives on the indicator's own screen, not in the summary. */
  leitura: string;
  porque: Driver[];
  tendencia: string;
  impacto: string;
}
export interface MarketAnalysis {
  headline: string;
  headlineColor: string;
  /** What to DO. Under stress the manager doesn't process analysis — they process instruction. */
  acao: string;
  convergencia: string;
  blocks: AnalysisBlock[];
  atencao: string[];
}

// ── number formatting ──
const d1 = (v: number) => v.toFixed(1);
const d2 = (v: number) => v.toFixed(2);
const d0 = (v: number) => v.toFixed(0);

const REGIME_LABEL: Record<string, string> = { BULL: "RISK-ON", CAUTELA: "CAUTION", NEUTRO: "NEUTRAL", BEAR: "RISK-OFF" };
const REGIME_COLOR: Record<string, string> = { BULL: "#2ECC71", CAUTELA: "#F39C12", NEUTRO: "#4A90D9", BEAR: "#E74C3C" };
const XRI_COLOR: Record<string, string> = { BAIXO: "#2ECC71", MODERADO: "#F39C12", ELEVADO: "#E67E22", "CRÍTICO": "#E74C3C" };

const COT_PT: Record<string, string> = {
  GOLD: "gold", SILVER: "silver", BITCOIN: "bitcoin", "EURO FX": "euro",
  "VIX FUTURES": "VIX", "JAPANESE YEN": "yen", "CRUDE OIL": "crude oil",
};
function cotName(market: string): string {
  const raw = market.split(" - ")[0].trim();
  return COT_PT[raw] || raw.toLowerCase();
}

// ============================================================
// ARI — why the domestic regime is where it is
// ============================================================
export function buildAri(regime: RegimeState, asset: AssetResp | null, dna: DnaRaw | null): AnalysisBlock {
  const L = dna?.layers;
  const vix = L?.volatility?.data?.vix;
  const vol = L?.volatility?.data;
  const br = L?.breadth?.data;
  const se = L?.sentiment?.data;
  const ma = L?.macro?.data;
  const cot = L?.positioning?.data;

  const porque: Driver[] = [];
  const label = REGIME_LABEL[regime];
  const defensivo = regime === "BEAR" || regime === "CAUTELA";

  // 1. Breadth: the 200MA vs 50MA divergence is the signal nobody reads on the screen.
  if (br?.pct_above_200ma != null && br?.pct_above_50ma != null) {
    const gap = br.pct_above_200ma - br.pct_above_50ma;
    if (gap >= 8) {
      porque.push({
        label: "Participation narrowing from below",
        detail: `${d0(br.pct_above_200ma)}% of names are still above the 200-day average, but only ${d0(br.pct_above_50ma)}% are above the 50-day. The long-term trend is intact — it's the short term that's giving way. That's how a top starts: from the edges, not the index.`,
        tone: "neg",
      });
    } else if (gap <= -8) {
      porque.push({
        label: "Short term turning before the index",
        detail: `${d0(br.pct_above_50ma)}% above the 50-day average versus ${d0(br.pct_above_200ma)}% above the 200-day — more names turned in the short term than the long term. Recoveries usually show up in that order.`,
        tone: "pos",
      });
    } else {
      porque.push({
        label: "Coherent participation",
        detail: `${d0(br.pct_above_200ma)}% above the 200-day average and ${d0(br.pct_above_50ma)}% above the 50-day — no divergence between short and long term.`,
        tone: "neu",
      });
    }
    if (br.ad_ratio != null) {
      porque.push({
        label: "Advances vs declines",
        detail: `${br.advancing ?? "—"} names advancing against ${br.declining ?? "—"} declining (ratio ${d2(br.ad_ratio)}) across a sample of ${br.sample_size ?? "—"}. Breadth signal: ${br.breadth_signal || "—"}.`,
        tone: br.ad_ratio >= 1 ? "pos" : "neg",
      });
    }
  }

  // 2. Cheap volatility + expensive skew = the asymmetry VIX alone hides.
  if (vix?.current != null) {
    const ivr = vix.iv_rank;
    if (ivr != null && ivr < 25) {
      porque.push({
        label: "Volatility compressed",
        detail: `VIX at ${d1(vix.current)} with IV rank at ${d0(ivr)}% — near the 52-week low (${vix.low_52w != null ? d1(vix.low_52w) : "—"}). The market isn't charging a risk premium. Protection is historically cheap${defensivo ? " — and that matters more precisely when the regime has already turned defensive" : ""}.`,
        tone: defensivo ? "neg" : "pos",
      });
    } else if (vix.current >= 25) {
      porque.push({
        label: "Volatility elevated",
        detail: `VIX at ${d1(vix.current)} (IV rank ${ivr != null ? d0(ivr) + "%" : "—"}) — the market is already paying for protection. Sharp moves become more likely.`,
        tone: "neg",
      });
    }
    if (vol?.skew != null && vol.skew >= 140) {
      porque.push({
        label: "Skew expensive with VIX cheap",
        detail: `Skew at ${d1(vol.skew)}. In plain terms: insurance against a sharp drop is expensive precisely while day-to-day volatility is cheap. Someone large is buying tail protection without selling the index — it doesn't show up in price, it shows up here.`,
        tone: "neg",
      });
    }
    if (vol?.vvix != null && vol.vvix >= 90) {
      porque.push({
        label: "Volatility of volatility",
        detail: `VVIX at ${d1(vol.vvix)} — the VIX itself is trading nervously. Term structure at ${vix.term_structure || "—"}.`,
        tone: vol.vvix >= 100 ? "neg" : "neu",
      });
    }
  }

  // 3. Sentiment: the trajectory matters more than the level.
  if (se?.score != null) {
    const parts: string[] = [`Fear & Greed at ${d1(se.score)} (${se.rating || "—"})`];
    if (se.year_ago != null) {
      const delta = se.score - se.year_ago;
      parts.push(`versus ${d1(se.year_ago)} a year ago — ${delta < -15 ? `a drop of ${d0(Math.abs(delta))} points: the market rallied without the crowd believing in it` : delta > 15 ? `a rise of ${d0(delta)} points over 12 months` : "stable over the 12-month horizon"}`);
    }
    if (se.month_ago != null) {
      parts.push(`Over the month, it moved from ${d1(se.month_ago)} to ${d1(se.score)} — ${Math.abs(se.score - se.month_ago) < 3 ? "sideways" : se.score > se.month_ago ? "improving slowly" : "deteriorating"}`);
    }
    porque.push({
      label: "Sentiment without conviction",
      detail: parts.join(". ") + ".",
      tone: se.score < 45 ? "neg" : se.score > 70 ? "neg" : "neu",
    });
  }

  // 4. Macro: almost always the innocent party — and saying so is itself information.
  if (ma?.yield_curve_spread != null || ma?.credit_spread != null) {
    const bits: string[] = [];
    if (ma.yield_curve_spread != null) bits.push(`2s10s curve at ${ma.yield_curve_spread > 0 ? "+" : ""}${d0(ma.yield_curve_spread * 100)}bp (${ma.yield_curve_signal || "—"})`);
    if (ma.credit_spread != null) bits.push(`credit spread at ${d2(ma.credit_spread)}pp (${ma.credit_signal || "—"})`);
    if (ma.series?.fed_funds?.value != null) bits.push(`Fed funds at ${d2(ma.series.fed_funds.value)}%`);
    if (ma.series?.unemployment?.value != null) bits.push(`unemployment at ${d1(ma.series.unemployment.value)}%`);
    const saudavel = ma.yield_curve_signal === "Normal" && (ma.credit_signal === "Tight" || ma.credit_signal === "Normal");
    porque.push({
      label: saudavel ? "Macro isn't the aggressor" : "Macro pressuring",
      detail: bits.join(", ") + ". " + (saudavel
        ? "Tight credit and a normal curve mean the financing system isn't under stress — what's weighing on the regime isn't coming from the real economy, it's coming from the market."
        : "Adverse financing conditions — here macro is contributing to the defensive regime."),
      tone: saudavel ? "pos" : "neg",
    });
  }

  // 5. COT: a speculator short VIX is gasoline for any scare.
  const vixCot = cot?.find((r) => r.market.includes("VIX"));
  if (vixCot?.spec_net_pct_oi != null && vixCot.spec_net_pct_oi < -10) {
    porque.push({
      label: "Speculator short volatility",
      detail: `Net speculative positioning in VIX futures is at ${d1(vixCot.spec_net_pct_oi)}% of open interest (${vixCot.spec_sentiment}). The market is positioned for calm. If a scare hits, covering these positions amplifies the move instead of cushioning it.`,
      tone: "neg",
    });
  }
  const metals = (cot || []).filter((r) => (r.market.includes("GOLD") || r.market.includes("SILVER")) && r.spec_sentiment === "EXTREME_LONG");
  if (metals.length) {
    porque.push({
      label: "Money has already run to protection",
      detail: `Speculators are extremely long ${metals.map((m) => cotName(m.market)).join(" and ")} (${metals.map((m) => d1(m.spec_net_pct_oi ?? 0) + "% of OI").join(", ")}). It's not optimism on metal — it's a hedge. Confirms the defensive bias through a path independent of the index.`,
      tone: "neg",
    });
  }

  // 6. Price vs. regime: the most counter-intuitive divergence on the screen.
  if (asset?.price != null && asset.rsi != null) {
    if (asset.rsi > 65 && defensivo) {
      porque.push({
        label: "Price strong, regime defensive",
        detail: `S&P 500 at ${asset.price.toLocaleString("en-US", { maximumFractionDigits: 0 })} with RSI at ${d0(asset.rsi)} and ${asset.ytdPct != null ? d1(asset.ytdPct) + "% YTD" : "—"}. The index isn't falling — the regime turned before price did. That's exactly its purpose: price is the last to know.`,
        tone: "neg",
      });
    } else if (asset.rsi < 35) {
      porque.push({
        label: "Momentum oversold",
        detail: `RSI at ${d0(asset.rsi)} — a condition historically associated with a short-term bounce, not a definitive bottom.`,
        tone: "pos",
      });
    }
  }

  // Trend
  const tend: string[] = [];
  if (vix?.change_21d != null) tend.push(`VIX ${vix.change_21d < 0 ? "fell" : "rose"} ${d1(Math.abs(vix.change_21d))} point${Math.abs(vix.change_21d) >= 2 ? "s" : ""} over 21 days`);
  if (vix?.change_5d != null) tend.push(`${d1(Math.abs(vix.change_5d))} ${vix.change_5d < 0 ? "down" : "up"} in the last week alone`);
  if (vix?.current != null && vix.sma_20 != null) tend.push(`today ${vix.current < vix.sma_20 ? "below" : "above"} its own 20-day average (${d1(vix.sma_20)})`);
  const tendencia = tend.length
    ? tend.join(", ") + `. ${defensivo ? "Falling volatility with a defensive regime is the most deceptive combination: it looks like calm, but the regime is reading what the VIX hasn't priced in yet." : "Move consistent with the current regime."}`
    : "Not enough volatility series to measure a trend right now.";

  // Impact
  const impacto = defensivo
    ? `Posture: reduced exposure and active defense. The ${label} regime isn't a forecast of a decline — it's recognition that the risk/reward has deteriorated. With protection cheap (IV rank ${vix?.iv_rank != null ? d0(vix.iv_rank) + "%" : "low"}), defense costs little now; wait for the VIX to rise and it's already expensive.`
    : `Posture: full exposure with defense on standby. The ${label} regime supports risk, but ${vix?.iv_rank != null && vix.iv_rank < 25 ? "with IV rank low it's worth carrying protection while it's cheap" : "defense remains armed"}.`;

  const agressores = porque.filter((d) => d.tone === "neg");
  const resumo = agressores.length
    ? `${agressores.length} aggressor${agressores.length > 1 ? "s" : ""} · ${agressores.slice(0, 2).map((a) => a.label.toLowerCase()).join(" · ")}`
    : "No relevant aggressors — indicators support risk.";

  return {
    key: "ari",
    title: "ARI · American Regime Index",
    badge: { label, color: REGIME_COLOR[regime] },
    resumo,
    leitura: defensivo
      ? `Domestic regime at ${label} — adverse environment, reduced exposure, active defense.`
      : `Domestic regime at ${label} — favorable environment, sustained exposure.`,
    porque,
    tendencia,
    impacto,
  };
}

// ============================================================
// XRI — why external risk is where it is
// ============================================================
export function buildXri(xri: XriView, dna: DnaRaw | null): AnalysisBlock {
  const porque: Driver[] = [];
  const drivers = xri.drivers || [];
  const top = drivers[0];
  const cot = dna?.layers?.positioning?.data;

  // DOMINANT INGREDIENT (ingredient rule): names WHERE the risk comes from —
  // structural fragility, macro, market stress, or event. This is the line the
  // client didn't have before: "the risk comes from structural fragility, not
  // panic." No formula.
  const channels = xri.channels || [];
  const domChannel = channels[0];
  if (domChannel) {
    const outros = channels.slice(1).filter((c) => c.share >= 10);
    porque.push({
      label: `Where it's coming from: ${domChannel.label.toLowerCase()} (${domChannel.share}%)`,
      detail: `Today's risk comes mainly from ${domChannel.label.toLowerCase()} — ${domChannel.explain}.` +
        (outros.length ? ` Also weighing in: ${outros.map((c) => `${c.label.toLowerCase()} (${c.share}%)`).join(", ")}.` : "") +
        (domChannel.key === "fragility" ? " This matters: it isn't the market in panic, it's the fragile structure — risk that doesn't show up in price until the day it shows up all at once." : ""),
      tone: domChannel.key === "fragility" || domChannel.key === "slow_prior" ? "neg" : "neu",
    });
  }
  if (xri.transmission) {
    porque.push({
      label: xri.transmission === "aberto" ? "Transmission channel to the US: open" : "Transmission channel to the US: closed",
      detail: xri.transmission === "aberto"
        ? "What happens abroad already has an open path to reach the American market — external risk turns into portfolio risk faster."
        : "The risk exists abroad, but there's no open channel here yet. That's what's holding the situation back — and the first thing to watch, because once that channel opens, the rest has already happened.",
      tone: xri.transmission === "aberto" ? "neg" : "pos",
    });
  }

  if (top) {
    porque.push({
      label: `${top.country} concentrates the pressure`,
      detail: `${top.country} accounts for ${top.pct}% of measured external risk${drivers[1] ? `, followed by ${drivers[1].country} (${drivers[1].pct}%)` : ""}. This isn't diffuse external risk — it's concentrated. That cuts both ways: easier to monitor, and easier to flip all at once.`,
      tone: top.pct >= 45 ? "neg" : "neu",
    });
  }
  if (drivers.length > 1) {
    porque.push({
      label: "Risk composition",
      detail: drivers.map((d) => `${d.country} ${d.pct}%`).join(" · ") + ". Each country enters by the size of US companies' exposure to it — not by the size of its GDP.",
      tone: "neu",
    });
  }

  // Cross-connection: Japan in the XRI + yen short in the COT = transmission channel.
  const yen = cot?.find((r) => r.market.includes("JAPANESE YEN"));
  const japanTop = drivers.find((d) => d.country === "Japão");
  if (yen?.spec_net_pct_oi != null && yen.spec_net_pct_oi < -20 && japanTop) {
    porque.push({
      label: "Transmission channel open in the yen",
      detail: `Japan is ${japanTop.pct}% of the external pressure, and speculators are extremely short the yen (${d1(yen.spec_net_pct_oi)}% of open interest, ${yen.spec_sentiment}). Together, these two things describe a crowded carry trade: if the yen tightens, the position unwinds and external risk turns into American risk within days — that was exactly the mechanism in August 2024.`,
      tone: "neg",
    });
  }

  if (xri.confidence_pct != null) {
    porque.push({
      label: "Confidence in the reading",
      detail: `${xri.confidence_pct}% — ${xri.confidence_pct >= 80 ? "complete data, firm reading" : xri.confidence_pct >= 60 ? "reasonable data, usable reading with a margin" : "incomplete data today, treat as indicative"}.`,
      tone: xri.confidence_pct >= 80 ? "pos" : "neu",
    });
  }

  const dirTxt = xri.direction === "subindo"
    ? "Rising — external risk has been building over the last few days, and that's what changes tomorrow's reading."
    : xri.direction === "caindo"
    ? "Falling — external pressure has been easing."
    : "Stable over the last week — neither escalating nor easing.";

  const state = xri.state || "—";
  const elevado = state === "ELEVADO" || state === "CRÍTICO";

  const resumo = domChannel
    ? `coming from ${domChannel.label.toLowerCase()} (${domChannel.share}%)${top ? ` · ${top.country} ${top.pct}%` : ""} · ${xri.direction}`
    : top
    ? `${top.country} concentrates ${top.pct}%${drivers[1] ? `, ${drivers[1].country} ${drivers[1].pct}%` : ""} · ${xri.direction}`
    : `No dominant country · ${xri.direction}`;

  return {
    key: "xri",
    title: "XRI · External Regime Index",
    badge: { label: state, color: XRI_COLOR[state] || "var(--tx2)" },
    resumo,
    leitura: `External risk ${state}${xri.score != null ? ` (score ${xri.score} of 100)` : ""}${domChannel ? `, coming mainly from ${domChannel.label.toLowerCase()}` : ""} — ${elevado ? "what's coming from abroad is already weighing on the portfolio" : state === "MODERADO" ? "present and monitored, but not yet what's driving the portfolio" : "the external environment isn't a relevant source of risk right now"}.`,
    porque,
    tendencia: dirTxt + (xri.validation ? ` Validation base: ${xri.validation.years} years reconstructed, ${xri.validation.events_hit} of ${xri.validation.events_covered} anchor events captured with prior warning.` : ""),
    impacto: elevado
      ? "The XRI doesn't issue a buy or sell order — it moves the exposure ceiling and tightens the bar for re-entry. At this level, it's limiting how much risk the portfolio can carry."
      : "At this level the XRI doesn't restrict exposure. It stands watch: its value is warning ahead of time, not reacting alongside.",
  };
}

// ============================================================
// DNA — what the layers say together (and where they contradict)
// ============================================================
export function buildDna(dna: DnaRaw | null): AnalysisBlock | null {
  const L = dna?.layers;
  if (!L) return null;
  const vol = L.volatility?.data;
  const vix = vol?.vix;
  const br = L.breadth?.data;
  const se = L.sentiment?.data;
  const ma = L.macro?.data;
  const cot = L.positioning?.data;
  const porque: Driver[] = [];

  // The central contradiction — this is exactly what a score average erases.
  if (vix?.current != null && se?.score != null) {
    const calmo = vix.current < 20;
    const medo = se.score < 45;
    if (calmo && medo) {
      porque.push({
        label: "Contradiction: price calm, people afraid",
        detail: `VIX at ${d1(vix.current)} says calm. Fear & Greed at ${d1(se.score)} (${se.rating}) says fear. When these two disagree, it isn't complacency — it's a lack of conviction. The market isn't confident, it's just stalled.`,
        tone: "neg",
      });
    } else if (calmo && se.score > 70) {
      porque.push({
        label: "Convergence: calm with greed",
        detail: `VIX at ${d1(vix.current)} and Fear & Greed at ${d1(se.score)} — both pointing the same way. Historically this is the zone where protection is cheapest and most needed at the same time.`,
        tone: "neg",
      });
    }
  }

  if (cot?.length) {
    const extremes = cot.filter((r) => (r.spec_sentiment || "").startsWith("EXTREME"));
    if (extremes.length) {
      porque.push({
        label: `Positioning at an extreme: ${extremes.length} of ${cot.length} markets`,
        detail: extremes.map((e) => `${cotName(e.market)} ${e.spec_sentiment === "EXTREME_LONG" ? "extremely long" : "extremely short"} (${d1(e.spec_net_pct_oi ?? 0)}% of OI)`).join("; ") + ". An extreme in positioning doesn't mark timing — it marks vulnerability: it's where a contrary move finds fewer people on the other side.",
        tone: "neg",
      });
    }
    const comm = cot.find((r) => r.comm_net_pct_oi != null && Math.abs(r.comm_net_pct_oi) > 50);
    if (comm) {
      porque.push({
        label: "Commercial on the other side",
        detail: `In ${cotName(comm.market)}, the commercial hedger is at ${d1(comm.comm_net_pct_oi ?? 0)}% of open interest — the opposite position from the speculator. The commercial holds the physical asset and tends to be right over the long run; the speculator, over the short run.`,
        tone: "neu",
      });
    }
  }

  if (ma?.series) {
    const s = ma.series;
    if (s.fed_funds?.value != null && s.treasury_2y?.value != null) {
      const diff = s.treasury_2y.value - s.fed_funds.value;
      if (Math.abs(diff) > 0.3) {
        porque.push({
          label: diff > 0 ? "Market pricing higher rates ahead" : "Market pricing a rate cut",
          detail: `Fed funds at ${d2(s.fed_funds.value)}% and the 2-year Treasury at ${d2(s.treasury_2y.value)}% — a gap of ${d2(Math.abs(diff))}pp. The 2-year note is the market's bet on where the Fed will be; it's ${diff > 0 ? "above" : "below"} today's rate. Fed's stated stance: ${ma.policy_stance || "—"}.`,
          tone: "neu",
        });
      }
    }
    if (s.treasury_10y?.value != null && s.cpi?.value != null) {
      porque.push({
        label: "Long rates and inflation",
        detail: `10-year Treasury at ${d2(s.treasury_10y.value)}%${s.unemployment?.value != null ? `, unemployment at ${d1(s.unemployment.value)}%` : ""}. This combination is what sustains a neutral-macro read — neither tightening nor easing.`,
        tone: "neu",
      });
    }
  }

  if (br?.pct_above_200ma != null) {
    porque.push({
      label: "Breadth in full",
      detail: `${d0(br.pct_above_200ma)}% above the 200-day average, ${br.pct_above_50ma != null ? d0(br.pct_above_50ma) + "% above the 50-day" : "—"}, advance/decline ratio ${br.ad_ratio != null ? d2(br.ad_ratio) : "—"} — signal ${br.breadth_signal || "—"} across a sample of ${br.sample_size ?? "—"} names. Small sample: use it for direction, not precision.`,
      tone: br.breadth_signal === "Strong" || br.breadth_signal === "Healthy" ? "pos" : "neg",
    });
  }

  const n = L.insider?.data?.n_orders;
  if (n != null) {
    porque.push({
      label: "Insiders",
      detail: `${n} insider orders recorded for the period. People inside the company trading their own stock is the most overlooked data point on the screen — it counts as confirmation, never as a trigger.`,
      tone: "neu",
    });
  }

  const stamp = dna?.collected_at ? new Date(dna.collected_at).toLocaleString("en-US") : null;

  const rBits: string[] = [];
  const nExt = (cot || []).filter((r) => (r.spec_sentiment || "").startsWith("EXTREME")).length;
  if (cot?.length) rBits.push(`${nExt} of ${cot.length} at an extreme`);
  if (vix?.current != null) rBits.push(`VIX ${d1(vix.current)}`);
  if (se?.score != null) rBits.push(`F&G ${d0(se.score)} (${se.rating || "—"})`);
  if (br?.pct_above_200ma != null) rBits.push(`${d0(br.pct_above_200ma)}% > MA200`);

  return {
    key: "dna",
    title: "Market DNA · what the layers say together",
    badge: { label: `${Object.keys(L).length} layers`, color: "#7B68EE" },
    resumo: rBits.join(" · ") || "Layers without enough data today.",
    leitura: "DNA's value isn't the average of the layers — it's where they disagree. The average is exactly what hides the signal.",
    porque,
    tendencia: [
      vix?.change_21d != null ? `Volatility ${vix.change_21d < 0 ? "easing" : "rising"} this month (${d1(vix.change_21d)} point)` : null,
      se?.month_ago != null && se.score != null ? `sentiment moving from ${d1(se.month_ago)} to ${d1(se.score)}` : null,
      ma?.credit_signal ? `credit remains ${ma.credit_signal}` : null,
    ].filter(Boolean).join(", ") + ".",
    impacto: `Read the contradictions, not the average. Where the layers agree, price has already adjusted; where they disagree, there's still asymmetry.${stamp ? ` Collected: ${stamp}.` : ""}`,
  };
}

// ============================================================
// ARI × XRI convergence — where the pressure is coming from
// ============================================================
function buildConvergencia(regime: RegimeState, xri: XriView): string {
  const domDefensivo = regime === "BEAR" || regime === "CAUTELA";
  const state = xri.state;
  const extDefensivo = state === "ELEVADO" || state === "CRÍTICO";
  const top = (xri.drivers || [])[0];
  const label = REGIME_LABEL[regime];

  if (domDefensivo && extDefensivo) {
    return `Pressure from BOTH sides. ARI at ${label} and XRI at ${state} at the same time — the American market and the external environment are weighing in together${top ? `, with ${top.country} leading the external side (${top.pct}%)` : ""}. This is the most defensive configuration possible, and the only one where XRI and ARI reinforce each other instead of offsetting. There's nowhere to diversify geographically here.`;
  }
  if (domDefensivo && !extDefensivo) {
    return `The pressure is DOMESTIC. ARI is at ${label}, but XRI is at ${state}${xri.score != null ? ` (${xri.score})` : ""} — meaning the external environment isn't today's aggressor${top ? `, even though ${top.country} concentrates ${top.pct}% of whatever risk exists abroad` : ""}. That changes what to do: the problem is inside the US, so swapping American exposure for international exposure doesn't solve it — it just relocates the risk. The defense here is reducing risk, not reallocating geography.`;
  }
  if (!domDefensivo && extDefensivo) {
    return `EXTERNAL risk not yet transmitted. ARI is at ${label} — the American market is still supporting risk — but XRI is already at ${state}${top ? `, driven by ${top.country} (${top.pct}%)` : ""}. This is the window where XRI earns its keep: the risk exists abroad and hasn't reached the price here yet. Historically this gap lasts weeks, not months. Either the external side eases, or ARI turns.`;
  }
  return `Both sides calm. ARI at ${label} and XRI at ${state}${xri.score != null ? ` (${xri.score})` : ""} — neither the domestic market nor the external environment is calling for defense. This is the configuration that supports full exposure, and also the one where protection costs the least. Time to carry risk with the insurance paid for, not to assume it will last.`;
}

// ============================================================
// Public
// ============================================================
export function buildMarketAnalysis(
  regime: RegimeState,
  asset: AssetResp | null,
  xri: XriView,
  dna: DnaRaw | null
): MarketAnalysis {
  const blocks: AnalysisBlock[] = [buildAri(regime, asset, dna)];
  if (xri.ok) blocks.push(buildXri(xri, dna));
  const dnaBlock = buildDna(dna);
  if (dnaBlock) blocks.push(dnaBlock);

  const domDefensivo = regime === "BEAR" || regime === "CAUTELA";
  const extDefensivo = xri.state === "ELEVADO" || xri.state === "CRÍTICO";

  let headline: string;
  let headlineColor: string;
  let acao: string;
  if (domDefensivo && extDefensivo) {
    headline = "Defense on both sides: domestic market and external environment pressuring together.";
    headlineColor = "#E74C3C";
    acao = "Reduce exposure. There's nowhere to diversify geographically.";
  } else if (domDefensivo) {
    headline = "Defense driven by domestic causes. The external environment isn't today's aggressor.";
    headlineColor = "#E67E22";
    acao = "Reduce risk — don't reallocate geography. The problem is inside the US.";
  } else if (extDefensivo) {
    headline = "Risk abroad hasn't reached the price here yet. A window to get ahead of it.";
    headlineColor = "#C9A02C";
    acao = "Hold exposure and tighten re-entry requirements. Watch the transmission channel.";
  } else {
    headline = "Environment supports risk, and protection is cheap.";
    headlineColor = "#2ECC71";
    acao = "Full exposure. Carry protection while the insurance is cheap.";
  }

  // Attention: cross-signals nobody sees looking at just one screen.
  const atencao: string[] = [];
  const L = dna?.layers;
  const vixData = L?.volatility?.data;
  const ivr = vixData?.vix?.iv_rank;
  if (ivr != null && ivr < 25 && domDefensivo) {
    atencao.push(`Cheap protection with a defensive regime: IV rank at ${d0(ivr)}% and ARI already at ${REGIME_LABEL[regime]}. This combination doesn't usually last — either the regime reverts, or volatility reprices. A hedge put on now costs a fraction of what it will after the first scare.`);
  }
  if (vixData?.skew != null && vixData.skew >= 140 && vixData.vix?.current != null && vixData.vix.current < 20) {
    atencao.push(`Skew at ${d1(vixData.skew)} with VIX at ${d1(vixData.vix.current)}: the market is cheap for normal risk and expensive for tail risk. Someone with deep pockets is paying for insurance against a sharp drop without exiting the index. This is the kind of signal that only shows up by crossing two layers.`);
  }
  const yen = L?.positioning?.data?.find((r) => r.market.includes("JAPANESE YEN"));
  const japan = (xri.drivers || []).find((d) => d.country === "Japão");
  if (yen?.spec_net_pct_oi != null && yen.spec_net_pct_oi < -20 && japan && japan.pct >= 30) {
    atencao.push(`Yen short at ${d1(yen.spec_net_pct_oi)}% of open interest while Japan accounts for ${japan.pct}% of the XRI. A crowded carry trade in the same country that concentrates the external risk — if the yen tightens, the unwind transmits risk to the American market within days. This is the channel to watch.`);
  }
  const br = L?.breadth?.data;
  if (br?.pct_above_200ma != null && br?.pct_above_50ma != null && br.pct_above_200ma - br.pct_above_50ma >= 8) {
    atencao.push(`Breadth eroding from below: ${d0(br.pct_above_200ma)}% above the 200-day average against ${d0(br.pct_above_50ma)}% above the 50-day. The index holds because the largest names hold — but the base is already giving way. Deterioration starts at the edges.`);
  }
  const stale = L?.macro?.data?.series?.financial_stress;
  if (stale?.date && new Date(stale.date).getFullYear() < new Date().getFullYear() - 1) {
    atencao.push(`Data quality: FRED's financial stress index is dated ${new Date(stale.date).toLocaleDateString("en-US")} — the series is stale at the source. I did not use this layer in the reading above.`);
  }

  return { headline, headlineColor, acao, convergencia: buildConvergencia(regime, xri), blocks, atencao };
}

/** Short version for the JIM drawer briefing (chips/greeting). */
export function analysisToBriefing(a: MarketAnalysis): string {
  return [a.headline, a.convergencia, a.atencao[0] || ""].filter(Boolean).join(" ");
}

"use client";
import { useState } from "react";
import type { ScreenId } from "@/lib/nav";

// ============================================================
// TUTORIAL — Interactive flowchart of the ETP Terminal
// Each top menu = a node in the flow. Click → why it matters +
// each screen and each box, with the data/information it brings.
// Client-safe: describes RESULT and POSTURE, never method/signals.
// ============================================================

// Box `w` (why it matters) is rendered as a distinct amber accent under the
// description — same tone as JD's newsletter. Absent on trivial boxes.
interface Box { t: string; d: string; w?: string }
interface Tela { nome: string; go?: ScreenId; param?: string; why: string; boxes: Box[] }
interface Node {
  key: string;
  label: string;
  icon: string;
  fase: string;
  cor: string;
  importa: string;
  startHere?: boolean;
  telas: Tela[];
}

// ── QUICK-START ────────────────────────────────────────────────────────
interface QuickStep { n: number; title: string; blurb: string; go: ScreenId; param?: string; icon: string }
const QUICK_START: QuickStep[] = [
  { n: 1, title: "Read JIM's morning briefing",   blurb: "Open Dashboard. JIM's headline tells you the regime, defense state, and if any client needs attention today.",           go: "painel",        icon: "ti-sun" },
  { n: 2, title: "Check the Verdict (ARI · XRI · Defense)", blurb: "Same page, 3 tiles. If both regimes agree and defense is disarmed, it's a calm day. Otherwise, dig in.",         go: "painel",        icon: "ti-checkbox" },
  { n: 3, title: "Open the fund → The Vault",      blurb: "Funds › HPC22 → tab \"The Vault\". This is what your clients see: how many positions, hit rate, 3 rotating closed trades.", go: "fundo", param: "HPC22", icon: "ti-shield-lock" },
  { n: 4, title: "Verify a client on the 4-level ruler", blurb: "Risk › Comparison. Every client on the same scale — you spot who is drifting above their mandate immediately.",   go: "risco",         icon: "ti-scale" },
  { n: 5, title: "Ask JIM anything",               blurb: "Jim AI button (top-right). It sees the exact screen you are on and answers in context — even the private data.",         go: "painel",        icon: "ti-sparkles" },
];

const NODES: Node[] = [
  {
    key: "painel", label: "Dashboard", icon: "ti-home", fase: "Day 1 · start here", cor: "var(--gold)", startHere: true,
    importa: "Your 30-second daily check-in. Open it first thing. JIM up top, verdict + funds + alerts below. Drag & drop the boxes to make it yours (like Bloomberg).",
    telas: [
      {
        nome: "Dashboard", go: "painel",
        why: "One page with everything you need to decide whether today is a normal day or one that needs action.",
        boxes: [
          { t: "JIM — Morning Briefing", d: "Greeting + headline of the day + collapsible sections: portfolio, regime, market DNA, clients & risk, calendar. Click any section header to open the full screen." },
          { t: "Verdict — ARI · XRI · Defense", d: "Three tiles: internal regime (ARI, our engine), external regime (XRI, the 26-country stress index), and whether Defense is armed. All three green = risk-on. Any amber/red = read carefully." },
          { t: "Your Funds", d: "HPC22 and HPC11 side by side, with 1D / 5D / MTD / YTD chips and delta vs S&P YTD. Click to open the fund page." },
          { t: "XRI — External Regime", d: "Score 0–100 + state (MODERADO/CAUTELA/BEAR), direction, confidence, and top 2 country drivers pushing the index." },
          { t: "Alerts", d: "Real-time flags: clients outside mandate, clients within 8 points of their mandate, high-impact market events (Fed, CPI…)." },
          { t: "The Vault — aggregate", d: "4 KPIs of the ETP right now: active positions, % of AUM invested, 90-day hit rate, average holding days. CTA opens the full Vault tab." },
          { t: "Clients", d: "Total AUM, active client count, number outside mandate." },
        ],
      },
    ],
  },
  {
    key: "mercado", label: "Market", icon: "ti-chart-candle", fase: "Read the scenario", cor: "var(--blue)", startHere: true,
    importa: "Before you open a client or a fund, understand the environment. Live prices, both regime indices (internal and external), the 10-layer market DNA, and the calendar.",
    telas: [
      {
        nome: "Market Overview (ARI)", go: "regime",
        why: "The S&P 500 read + internal regime + what shifts our risk posture. Start here on days that feel weird.",
        boxes: [
          {
            t: "5 header cards", d: "S&P 500 price + day change · YTD · RSI(14) · Max DD & Sharpe · Regime pill (ARI live).",
            w: "Price alone lies. Price + RSI + drawdown together tells you if you're buying strength or catching a falling knife. The Regime pill collapses 40+ signals into one word — that's the shortcut."
          },
          {
            t: "JIM — Market Analysis", d: "One paragraph consolidating regime, S&P, VIX, Fear & Greed, breadth and next event.",
            w: "JIM cross-reads 5 unrelated inputs. When they agree, conviction is high; when they diverge, that's usually where alpha hides — and that's what JIM will point out."
          },
          {
            t: "S&P 500 chart", d: "Candles with 3M–5Y toggle and indicator overlays (EMA, Bollinger, Volume, RSI, Momentum).",
            w: "You can't manage risk on a chart you can't see. Overlaying EMAs lets you spot regime shifts before CNBC calls them — the price crosses the EMA before the narrative catches up."
          },
          {
            t: "Market DNA summary", d: "Score bars per dimension: Volatility, Sentiment, Breadth, Macro, Positioning.",
            w: "One dimension is anecdote; five agreeing is a regime. This mini-view is your gut-check before diving into the full Market DNA screen."
          },
          {
            t: "Calendar + News (side rail)", d: "Upcoming high-impact events + market-moving headlines.",
            w: "Half the yearly moves happen on 10 dates. Knowing which 10 — and being positioned BEFORE, not after — is the whole game."
          },
        ],
      },
      {
        nome: "XRI — External Regime", go: "xri",
        why: "The 26-country external stress index. When it flips before ARI, the shock is coming from abroad — that's usually the first warning.",
        boxes: [
          {
            t: "Score + state + confidence", d: "0–100 score, state (MODERADO/CAUTELA/BEAR/BULL), direction (estável / deteriorando / melhorando), confidence % (how many countries agree).",
            w: "US markets don't move in a vacuum. A shock in Japan, China or the Eurozone can hit SPY 24–48h later. XRI is the early warning that beats the domestic news cycle."
          },
          {
            t: "Country drivers", d: "Top contributors to the current score (Japan, China, Euro Area…) with % contribution.",
            w: "Knowing WHERE the stress originates tells you which SECTOR to hedge. Japan-driven fear hits semis; China-driven hits consumer discretionary; Euro-driven hits luxury and banks."
          },
          {
            t: "Transmission channels", d: "Fragility (structural) vs Macro prior (slow) vs Market stress (fast) — where the risk is coming from mechanically.",
            w: "Fragility means the system will crack under stress even without stress today. Fast means FX/rates are already breaking. Same score, completely different playbook."
          },
        ],
      },
      {
        nome: "Market DNA", go: "market-dna",
        why: "The 10-layer institutional read. Each layer scored 0–100. The AVERAGE is Conviction; the SPREAD is where it gets interesting.",
        boxes: [
          {
            t: "Summary header (inside Score per Layer)", d: "Conviction score + regime pill (CAUTIOUS/HEALTHY/…) + live/partial counters. Formula shown on hover of the header.",
            w: "The average is what the crowd talks about. The disagreement is where alpha hides. LIVE vs PARTIAL tells you how much of the score is real-time data vs stale."
          },
          {
            t: "Intelligence Radar", d: "Polygon with the 7 layers' scores at once — you see shape, not just numbers.",
            w: "Numbers hide the shape. A polygon shows instantly if the market is uniformly good, uniformly bad, or lopsided — the lopsided case is usually the interesting one."
          },
          {
            t: "Score per Layer", d: "Bars sorted by score, each with LIVE/PART badge (data source status).",
            w: "If Positioning is 90 (extreme long) and Sentiment is 20 (extreme fear), someone is bluffing. That contradiction is the trade the mainstream misses."
          },
          {
            t: "Cards per layer", d: "Positioning, Volatility, Options, Liquidity, Breadth, Sentiment, Macro — each with 4 indicators (VIX, IV Rank, Yield Curve, Credit Spread…).",
            w: "Each score is built on 4 sub-indicators. Auditing them tells you if the score is fragile (1 indicator dominating) or robust (4 agreeing) — same 60 score means very different things."
          },
          {
            t: "JIM Intelligence panel", d: "Where the layers CONTRADICT each other — those disagreements hide the real signal.",
            w: "Any dashboard shows averages. JIM specifically highlights the CONTRADICTIONS — because that's the information no single number would surface."
          },
        ],
      },
      {
        nome: "Snowflake", go: "snowflake",
        why: "Multi-dimensional view of a single asset (value, future, past, health, dividend).",
        boxes: [
          {
            t: "Snowflake per asset", d: "5-point radar per company with the qualitative read on each axis.",
            w: "Companies aren't just their P/E ratio. A 5-dimension view forces you to see health + past + dividend + value + future together — one weak axis is a red flag no single ratio catches."
          },
        ],
      },
      {
        nome: "Calendar", go: "calendar",
        why: "Only high-impact economic events (Fed, CPI, NFP, ECB…). Ignores noise.",
        boxes: [
          {
            t: "Events feed", d: "Date, time, event, forecast, previous. Filter by country and impact.",
            w: "Fed, CPI and NFP explain more short-term vol than any earnings season. You want to be positioned BEFORE they hit — not chasing after."
          },
        ],
      },
      {
        nome: "Quotes", go: "cotacoes",
        why: "Live prices across all classes in one panel.",
        boxes: [
          {
            t: "Tabs by class", d: "Favorites + stocks, indices, ETFs, sectors, commodities, crypto, forex.",
            w: "Cross-asset context: if bonds and gold are up while stocks fall, that's risk-off. Only side-by-side class-tabs let you see it in one glance."
          },
          {
            t: "Quotes table", d: "Last price, Day / 1M / YTD / 1Y and 1-year Sharpe per asset. Click opens the chart.",
            w: "1-year Sharpe next to the price is your quick filter for 'is this cheap by luck or by process'. High price + low Sharpe = expensive lottery ticket."
          },
        ],
      },
      {
        nome: "Screener", go: "screener",
        why: "Filter the universe with your own criteria (momentum, valuation, sector…). Client-safe — the filters here are NOT the ones the ETP uses internally.",
        boxes: [
          {
            t: "Multi-filter", d: "Combine market cap, sector, momentum, valuation. Results in a sortable table.",
            w: "Every gestor needs a personal watchlist. The Screener is your microscope. The ETP's engine stays proprietary — this one is yours to explore, not to reverse-engineer ours."
          },
        ],
      },
    ],
  },
  {
    key: "intelligence", label: "Intelligence", icon: "ti-building", fase: "Institutional edge", cor: "var(--blue)",
    importa: "The differentiator vs a home broker: what the big players are doing (SEC 13F, insider Form 4, CFTC COT), retail sentiment (StockTwits), and the raw filings — all in one place.",
    telas: [
      {
        nome: "Social Radar", go: "social-radar",
        why: "Retail's declared sentiment, live, with the reach of who is speaking.",
        boxes: [
          {
            t: "Post feed (StockTwits)", d: "Author + verified badge, reach tier, sentiment (Bullish/Bearish/Neutral), cashtags.",
            w: "Retail is right at the turn and wrong at the tail. Volume of a name exploding on StockTwits with weak fundamentals = short-squeeze setup you can trade against."
          },
          {
            t: "Intelligence panel", d: "Click a post: assets mentioned + our read on sentiment reliability.",
            w: "Sentiment is direction; reach is amplitude. High reach + wrong sentiment = the contra-trade opportunity institutional desks live for."
          },
        ],
      },
      {
        nome: "News Broadcast", go: "news-broadcast",
        why: "Consolidated financial feed, filterable by source and impact.",
        boxes: [
          {
            t: "Headline grid", d: "Source, impact tag (Market Moving / High / Normal), time, title.",
            w: "You can't react to what you didn't see. Filtering by 'Market Moving' cuts through 95% of noise so you only spend attention where it counts."
          },
        ],
      },
      {
        nome: "Insider Orders", go: "insider-orders",
        why: "SEC Form 4 — when a director or officer buys/sells their own shares.",
        boxes: [
          {
            t: "Filings table", d: "Date, insider name + role, company, ticker, side (buy/sell), share count, $ value. Click for the original filing.",
            w: "Officers know their business better than any analyst. Clusters of insider BUYS have historically beaten SPX by 6–8% p.a. Insider sells are noisier (stock comp, diversification) — the BUY signal is stronger."
          },
        ],
      },
      {
        nome: "13F Holdings", go: "institutional",
        why: "SEC Form 13F — what the largest hedge funds hold every quarter.",
        boxes: [
          {
            t: "4 KPIs", d: "Total 13F AUM, holdings count, filing date, period.",
            w: "The SIZE of a fund tells you if their trades are informative or just moves in the water. A $100B fund adding 1% of a small-cap is a real conviction bet."
          },
          {
            t: "Top 10 + All holdings", d: "Issuer, class, CUSIP, $ value, share count, put/call.",
            w: "When Bridgewater or Berkshire adds a position, they had to justify it internally. Their portfolio is a leaked memo of their conviction — legally free to read, most gestores don't."
          },
        ],
      },
      {
        nome: "COT Intelligence", go: "cot-sentiment",
        why: "CFTC Commitments of Traders — big players' futures positioning, normalized (COT Index 0–100).",
        boxes: [
          {
            t: "Guide + extreme flags", d: "The 3 groups (Commercials · Large Specs · Nonreportable) and which markets are at extreme.",
            w: "Large Speculators at extreme long is a classic reversal signal. Commercials at extreme SHORT means producers are hedging heavy — same reversal, mirrored. When both point one way, the reversal is imminent."
          },
          {
            t: "Cards by market", d: "COT Index 0–100, weekly change, net position by group (% of OI), Open Interest, contrarian alert when extreme.",
            w: "Same principle across all major futures. When 3+ markets hit extreme simultaneously, that's a systemic warning — not a single-market anomaly."
          },
        ],
      },
      {
        nome: "COT Data Explorer", go: "cot-legacy",
        why: "Raw CFTC data — straight to the number, no interpretation.",
        boxes: [
          {
            t: "Raw table", d: "Date, market, Spec Net, Comm Net (and % of OI), longs/shorts by group, Open Interest, 4–52 week window.",
            w: "The normalized COT Index hides jumps in raw open interest. Explorer lets you drill for the exception the smooth score erases."
          },
        ],
      },
      {
        nome: "Filings Search", go: "filings-search",
        why: "SEC EDGAR full-text search across 10-K, 10-Q, 8-K since 2001.",
        boxes: [
          {
            t: "Keyword search", d: "Type a keyword, filter by form type / date / ticker. Results link to EDGAR.",
            w: "Companies bury the truth in the 10-K body, not the abstract. Searching 'material weakness' or 'going concern' surfaces warnings the earnings PR won't."
          },
        ],
      },
    ],
  },
  {
    key: "fundos", label: "Funds", icon: "ti-coin", fase: "The product", cor: "var(--green)", startHere: true,
    importa: "The heart of the sale — complete profile of each ETP. 8 tabs. The Vault (default) is the star: transparency without giving away the model.",
    telas: [
      {
        nome: "Fund · Overview", go: "fundo", param: "HPC22",
        why: "Product profile: what it is, what it delivers, governance seals.",
        boxes: [
          { t: "Header + Highlights", d: "Ticker, name, strategy, status, ISIN + 4 headline stats (CAGR, Max DD, Sortino…) with S&P and Nasdaq comparison." },
          { t: "Product data + Seals", d: "Key-value profile and governance seals (Harpian doesn't custody or execute — Lynk/BNYM does)." },
        ],
      },
      {
        nome: "The Vault (default tab)", go: "fundo", param: "HPC22",
        why: "Verified Opacity Protocol. The client sees enough to trust — not enough to replicate. This is what protects the edge while proving skin-in-the-game.",
        boxes: [
          { t: "The Vault (aggregate)", d: "5 KPIs: active longs, hedges, % AUM invested, portfolio beta, avg holding, 90-day hit rate. NEVER shows tickers of active positions." },
          { t: "The Showcase (3 closed positions)", d: "3 real trades the ETP closed, sampled from positions closed ≥ 28 days ago. Rotates every Monday 06:00 BRT. No archive." },
          { t: "Momentum Weather", d: "Regime state + defense % + streak days + last regime flip (from/to + magnitude). The trigger stack stays proprietary." },
          { t: "Do Not Touch", d: "5 worst SPX500 momentum + 2 fragile sectors we are actively avoiding this week. Publishing what we AVOID is safer than what we buy." },
        ],
      },
      {
        nome: "Fund · Performance", go: "fundo", param: "HPC22",
        why: "Proof of results, always benchmarked. Layout: chart 2/3 · tables 1/3.",
        boxes: [
          { t: "$10k over time (left, 2/3)", d: "Real portfolio growth vs S&P vs CORE22+, with return and MaxDD by period." },
          { t: "Gross vs net vs S&P (right, 1/3)", d: "Metric-by-metric table." },
          { t: "CORE22+ vs S&P vs Nasdaq (right)", d: "CAGR, Max DD, Ulcer, Sharpe, Sortino, negative years — all three benchmarks side by side." },
        ],
      },
      {
        nome: "Fund · Risk & Journey", go: "fundo", param: "HPC22",
        why: "The capital-preservation story. Layout: chart 2/3 · tables 1/3.",
        boxes: [
          { t: "Journey chart (left, 2/3)", d: "Cumulative return vs S&P vs Dow vs Treasuries. CORE22+ line turns AMBER during periods when Defense was armed (2008, 2020, 2022, etc.), with subtle backdrop bands. Hover shows the crisis name." },
          { t: "Dimension 1 · Journey risk (right)", d: "Declines ≥5%: CORE22+ vs S&P side by side." },
          { t: "Dimension 2 · Entry-point risk (right)", d: "Buying at the annual peak: % positive and worst case by horizon." },
        ],
      },
      {
        nome: "Fund · Crisis Defense", go: "fundo", param: "HPC22",
        why: "By crisis: drawdown and recovery time, S&P vs CORE, plus Nasdaq comparison.",
        boxes: [
          { t: "Crisis defense table", d: "Dot-com, GFC, COVID, 2022 bear, etc. — S&P decline & recovery vs CORE22+ decline & recovery." },
        ],
      },
      {
        nome: "Composition · 5w snapshot", go: "fundo", param: "HPC22",
        why: "The portfolio as it was 35 days ago. Full transparency (tickers + weights + defense) but with a rolling embargo — holding is ~34 days, so most positions here already turned.",
        boxes: [
          { t: "Delay banner", d: "Explicit callout: 'not live composition'. Shows exact snapshot date and the regime state at that moment." },
          { t: "3 profiles", d: "Conservative / Balanced / Advanced: stocks vs ETFs split, positions count, top holdings with weight %." },
          { t: "Defense layer (as it was)", d: "The defensive assets and weights active on that snapshot date. The trigger is still proprietary." },
        ],
      },
      {
        nome: "Fund · Economics & Architecture", go: "fundo", param: "HPC22",
        why: "The commercial and operational profile — fees, custody, settlement, contacts.",
        boxes: [
          { t: "ETP economics", d: "Management fee, performance fee, minimum, currency." },
          { t: "Institutional architecture", d: "Custody (BNY Mellon), settlement (Euroclear/Clearstream), issuer, calculation agent." },
          { t: "Engine architecture", d: "Which engine variant powers this fund (client-safe wording)." },
          { t: "Contacts", d: "Operational counterparts for onboarding and subscription." },
        ],
      },
      {
        nome: "Fund · How to Buy", go: "fundo", param: "HPC22",
        why: "5-step guide from analysis to submission via Lynk.",
        boxes: [
          { t: "5-step flow", d: "Instructions per step for the MFO / broker desk." },
          { t: "Submit order CTA", d: "Opens the Orders screen pre-loaded for this fund." },
        ],
      },
      {
        nome: "Submit order (Lynk)", go: "ordem",
        why: "Closes the cycle: subscription/redemption goes to Lynk.",
        boxes: [
          { t: "Product + Order", d: "Profile (ISIN, yesterday's NAV, BNYM custody, Euroclear/Clearstream settlement), side, client, amount, notes." },
          { t: "Validation", d: "Minimum $50k, multiples of $5k, confirmation dialog." },
          { t: "Custody × broker", d: "Cash at BNY Mellon (NY); accounts via Interactive Brokers (IBKR)." },
          { t: "Manual execution", d: "Every daily order is executed manually by the team after review in the cockpit. JIM interprets and supports — no order is automatic." },
        ],
      },
    ],
  },
  {
    key: "clientes", label: "Clients", icon: "ti-users", fase: "The people", cor: "var(--gold)",
    importa: "The MFO's client base: who they are, how much they have, what they hold, who's outside mandate. From onboarding CSV to detailed portfolio and alerts.",
    telas: [
      {
        nome: "Client list", go: "clientes",
        why: "Portfolio view of the whole office in one screen.",
        boxes: [
          { t: "4 KPIs", d: "Total AUM, client count, average Harpian allocation, how many outside mandate." },
          { t: "Clients table", d: "Name, type, profile, AUM, gain %, Risk Number, alignment (within / above mandate)." },
          { t: "Add client (top-right)", d: "Onboard a new client with the profile questionnaire." },
        ],
      },
      {
        nome: "Client portfolio", go: "carteira",
        why: "One client's detail: what they hold, the risk gap, and a migration simulator.",
        boxes: [
          { t: "What they hold today", d: "Allocation bars per asset class." },
          { t: "Risk gap", d: "Risk Number vs mandate + 'migrate % to HPC22' slider." },
          { t: "Portfolios per account", d: "Cards per portfolio (broker/account, value, positions count)." },
        ],
      },
      {
        nome: "Import / connect", go: "importar",
        why: "Bring an outside portfolio into the terminal.",
        boxes: [
          { t: "CSV upload + preview", d: "Drag in a spreadsheet (asset, quantity, avg price); review; apply to the client." },
        ],
      },
      {
        nome: "Alerts", go: "alertas",
        why: "What needs action today, without digging through every client.",
        boxes: [
          { t: "Alert feed", d: "Level (critical / watch / info), the alert, and when. Mixes client risk drifts + market events (Fed, CPI…)." },
        ],
      },
    ],
  },
  {
    key: "risco", label: "Risk", icon: "ti-shield-half", fase: "Suitability", cor: "var(--red)",
    importa: "Compliance flipped into a sales argument. Product · Mandate · Tolerance · Portfolio, all on the SAME 0-100 ruler. Shows the client whether they are (or aren't) inside what was agreed.",
    telas: [
      {
        nome: "Comparison · 4 levels", go: "risco",
        why: "4 risks side-by-side. Reference points: S&P 500 sits at ≈72, HPC22 ≈38, HPC11 ≈34 — both well below the market.",
        boxes: [
          {
            t: "4 level cards", d: "Product risk · Client tolerance · Mandate ceiling · Portfolio risk.",
            w: "The word 'risk' is meaningless without a scale. When you show S&P at 72, HPC22 at 38, and the client mandate at 40 — the conversation is over, the picture wins."
          },
          {
            t: "Client ruler", d: "Green→red bar with 4 markers + migration simulator to HPC22.",
            w: "A visual ruler beats a paragraph of jargon 10:1. Institutional clients want a picture that fits on a slide — this IS that slide."
          },
          {
            t: "All clients on the ruler", d: "Comparison table (portfolio vs mandate per client) + badge showing how many are outside.",
            w: "Portfolio-level view: who's drifting above their mandate, who's aligned. Compliance and sales in one screen — the compliance flag becomes the retention argument ('let's fix this')."
          },
        ],
      },
    ],
  },
  {
    key: "ajustes", label: "Settings", icon: "ti-settings", fase: "Support", cor: "var(--tx2)",
    importa: "Operations + branding: connections, API for your management system, white-label so the terminal wears your office's identity.",
    telas: [
      { nome: "Integrations",         go: "integracoes", why: "Live status of every data source and provider (custody, market data, Lynk).", boxes: [{ t: "Providers", d: "Each source is genuinely queried when the screen opens — status is measured, not declared." }] },
      { nome: "API & Integration",    go: "api",         why: "For the technical team to plug the Terminal's data into the MFO's management system.", boxes: [{ t: "Keys & endpoints", d: "REST endpoints, auth model, integration docs (phase 2)." }] },
      { nome: "Brand (white-label)",  go: "marca",       why: "Terminal wears your office's identity in end-client reports.", boxes: [{ t: "Brand kit", d: "Logo, primary color, accent, name shown to the end client." }] },
      { nome: "Settings",             go: "config",      why: "General preferences and display.", boxes: [{ t: "Preferences", d: "Theme (default / light / dark) and display settings." }] },
    ],
  },
];

export default function Tutorial({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const [sel, setSel] = useState("painel");
  const node = NODES.find((n) => n.key === sel)!;

  return (
    <div className="screen">
      <div className="flex" style={{ alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <div className="h1" style={{ margin: 0 }}>How to use the terminal — full map</div>
        <div className="sub" style={{ margin: 0 }}>Click each menu to see why it matters and what each box brings. Follows the natural flow of the day: scenario → product → client → execution.</div>
      </div>

      {/* ═══════════ QUICK START ═══════════ */}
      <div className="card mt" style={{
        borderColor: "rgba(201,160,44,.3)",
        background: "linear-gradient(90deg, rgba(201,160,44,.06), transparent 60%)",
        padding: "14px 18px",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-rocket" style={{ color: "var(--gold)" }} />
            Quick Start — 5 minutes, 5 clicks
          </h3>
          <span className="muted" style={{ fontSize: 12 }}>First time here? Follow the numbers.</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          {QUICK_START.map((s) => (
            <div key={s.n}
              onClick={() => go(s.go, s.param)}
              style={{
                background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 8,
                padding: "10px 12px", cursor: "pointer", position: "relative",
                transition: "border-color .12s, transform .12s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: "var(--gold)", color: "#1a1205", fontWeight: 700, fontSize: 12,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>{s.n}</div>
                <i className={`ti ${s.icon}`} style={{ fontSize: 15, color: "var(--gold)" }} />
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--tx)", lineHeight: 1.3 }}>{s.title}</div>
              </div>
              <div style={{ fontSize: 11, color: "var(--tx3)", lineHeight: 1.5 }}>{s.blurb}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18, marginTop: 16, alignItems: "start" }} className="tut-grid">
        {/* Flow (clickable connected nodes) */}
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 21, top: 20, bottom: 20, width: 2, background: "var(--line)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {NODES.map((n) => {
              const on = n.key === sel;
              return (
                <div key={n.key} onClick={() => setSel(n.key)}
                  style={{
                    position: "relative", display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                    background: on ? "var(--bg2)" : "transparent",
                    border: `1px solid ${on ? n.cor : "transparent"}`,
                    transition: "background .12s, border-color .12s",
                  }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10, flexShrink: 0, display: "grid", placeItems: "center",
                    background: "var(--panel)", border: `2px solid ${on ? n.cor : "var(--line2)"}`, zIndex: 1,
                  }}>
                    <i className={`ti ${n.icon}`} style={{ fontSize: 20, color: on ? n.cor : "var(--tx2)" }} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mono)", letterSpacing: .3 }}>{n.fase}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: on ? "var(--tx)" : "var(--tx2)" }}>{n.label}</div>
                      {n.startHere && (
                        <span title="Recommended starting point"
                          style={{
                            fontSize: 8.5, fontWeight: 700, padding: "2px 6px", borderRadius: 3,
                            background: "rgba(201,160,44,.18)", color: "var(--gold)",
                            fontFamily: "var(--mono)", letterSpacing: .4,
                          }}>START HERE</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail of the selected node */}
        <div>
          <div className="card" style={{ borderColor: node.cor, borderLeftWidth: 3 }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <i className={`ti ${node.icon}`} style={{ color: node.cor }} />{node.label}
              <span style={{ marginLeft: "auto", fontSize: 10, fontFamily: "var(--mono)", color: "var(--tx3)" }}>{node.fase}</span>
            </h3>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--tx2)" }}>
              <b style={{ color: "var(--gold)" }}>Why it matters: </b>{node.importa}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
            {node.telas.map((tela, ti) => (
              <div className="card" key={ti}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--tx)" }}>{tela.nome}</span>
                  {tela.go && (
                    <button className="btn ghost" style={{ marginLeft: "auto", fontSize: 11, padding: "3px 10px" }}
                      onClick={() => go(tela.go!, tela.param)}>open screen ›</button>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--tx2)", lineHeight: 1.5, marginBottom: 10 }}>{tela.why}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 8 }}>
                  {tela.boxes.map((b, bi) => (
                    <div key={bi} style={{ background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 6, padding: "9px 11px" }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: node.cor, marginBottom: 3 }}>{b.t}</div>
                      <div style={{ fontSize: 11.5, color: "var(--tx2)", lineHeight: 1.5 }}>{b.d}</div>
                      {b.w && (
                        <div style={{
                          marginTop: 8, paddingTop: 8,
                          borderTop: "1px dashed rgba(201,160,44,.35)",
                          fontSize: 11, color: "var(--gold)", lineHeight: 1.55,
                        }}>
                          <b style={{ fontWeight: 700, letterSpacing: 0.4, fontSize: 9.5, fontFamily: "var(--mono)", display: "block", marginBottom: 3, opacity: 0.85 }}>
                            → WHY IT MATTERS
                          </b>
                          <span style={{ fontStyle: "italic", color: "var(--tx)" }}>{b.w}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer: customization + Jim */}
      <div className="card mt" style={{ borderColor: "rgba(201,160,44,.3)" }}>
        <h3><i className="ti ti-layout-grid-add" />Customize everything (like Bloomberg)</h3>
        <div className="muted" style={{ lineHeight: 1.6 }}>
          Every dashboard has a <b style={{ color: "var(--tx)" }}>default</b> layout, but you <b style={{ color: "var(--tx)" }}>add, remove and drag</b> the cards. Start with the Dashboard: remove what you don&apos;t use, bring in what matters. That&apos;s how the terminal becomes your working tool.
        </div>
      </div>

      <div className="card mt" style={{ display: "flex", alignItems: "center", gap: 14, borderColor: "rgba(201,160,44,.3)" }}>
        <i className="ti ti-sparkles" style={{ fontSize: 22, color: "var(--gold)" }} />
        <div style={{ flex: 1 }}><b style={{ fontSize: 13 }}>Need help?</b> <span className="muted" style={{ fontSize: 13 }}>Ask Jim AI anytime — it sees the screen and answers in context.</span></div>
      </div>
    </div>
  );
}

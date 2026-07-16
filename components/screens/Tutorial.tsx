"use client";
import { useState } from "react";
import type { ScreenId } from "@/lib/nav";

// ============================================================
// TUTORIAL — Interactive flowchart of the ETP Terminal
// Each top menu = a node in the flow. Click → why it matters +
// each screen and each box, with the data/information it brings.
// Client-safe: describes RESULT and POSTURE, never method/signals.
// ============================================================

interface Box { t: string; d: string }
interface Tela { nome: string; go?: ScreenId; param?: string; why: string; boxes: Box[] }
interface Node {
  key: string;
  label: string;
  icon: string;
  fase: string;
  cor: string;
  importa: string;
  telas: Tela[];
}

const NODES: Node[] = [
  {
    key: "painel", label: "Dashboard", icon: "ti-home", fase: "1 · Start of day", cor: "var(--gold)",
    importa: "It's the first screen of the day — the essentials in 30 seconds, before opening any client. Like Bloomberg, the layout is yours: drag, add and remove modules.",
    telas: [
      {
        nome: "Dashboard (home)", go: "painel",
        why: "Consolidates funds, regime, clients and market in one place, with Jim's briefing on top.",
        boxes: [
          { t: "JIM · Morning Briefing", d: "Greeting + read on the day: your funds, regime & defense, market DNA (VIX, Fear & Greed, breadth), AUM and clients outside mandate, next event." },
          { t: "Your funds today", d: "HPC22 and HPC11 with the day's % change and whether there was a rebalancing." },
          { t: "Held in the ETP", d: "Top fund tickers with weight % and change (e.g. NVDA, AVGO)." },
          { t: "Regime & Defense", d: "Large regime label (RISK-ON…) and exposure/defense bar." },
          { t: "Quotes / News / Social", d: "Optional modules: 5 assets per class, 3 headlines, 3 social radar posts." },
          { t: "Clients & Alerts", d: "Total AUM, number of clients, how many outside mandate and what needs action." },
        ],
      },
    ],
  },
  {
    key: "mercado", label: "Market", icon: "ti-chart-candle", fase: "2 · Read the scenario", cor: "var(--blue)",
    importa: "Before talking about product or client, understand the environment. This is where the live price and the regime reading that frames every decision of the day live.",
    telas: [
      {
        nome: "Quotes", go: "cotacoes",
        why: "Live price for all classes in one panel, with risk built in.",
        boxes: [
          { t: "Tabs by class", d: "Favorites + stocks, indices, ETFs, sectors, commodities, crypto and forex." },
          { t: "Quotes table", d: "By asset: last price, Day / 1M / YTD / 1Y change and 1-year Sharpe. Click opens the chart." },
        ],
      },
      {
        nome: "Market Overview", go: "regime",
        why: "The regime snapshot: S&P, volatility, breadth and what shifts risk posture.",
        boxes: [
          { t: "4 S&P 500 cards", d: "Price + day change, YTD, RSI(14) with reading, Max DD and Sharpe." },
          { t: "JIM · Market Analysis", d: "Text that consolidates regime, S&P, VIX, Fear & Greed, breadth and next event." },
          { t: "S&P 500 Chart", d: "Candles with 3M–5Y period and indicators (EMA, Bollinger, Volume, RSI, Momentum)." },
          { t: "Market DNA (summary)", d: "Score bars by dimension: Volatility, Sentiment, Breadth, Macro, Positioning, Liquidity." },
          { t: "Calendar + News", d: "Upcoming high-impact economic events and market-moving headlines." },
        ],
      },
    ],
  },
  {
    key: "intelligence", label: "Intelligence", icon: "ti-building", fase: "2 · Read the scenario", cor: "var(--blue)",
    importa: "The institutional differentiator: what the big players are doing (SEC, CFTC), retail sentiment and the deep 10-layer market read. It's what an MFO doesn't have in a home broker.",
    telas: [
      {
        nome: "Social Radar", go: "social-radar",
        why: "Retail's declared sentiment, live, with the reach of who's speaking.",
        boxes: [
          { t: "Post feed (StockTwits)", d: "Author + verified, reach, sentiment (Bullish/Bearish/Neutral), cashtags mentioned and follower count." },
          { t: "Intelligence panel", d: "Clicking a post: assets mentioned and Harpian's read on sentiment/reach." },
        ],
      },
      {
        nome: "News Broadcast", go: "news-broadcast",
        why: "Consolidated financial feed, filterable by source and impact.",
        boxes: [
          { t: "Headline grid", d: "Per card: source, impact level (Market Moving/High/Normal), time, title and tags." },
        ],
      },
      {
        nome: "Insider Orders", go: "insider-orders",
        why: "SEC Form 4 — when a director or officer buys/sells their own shares.",
        boxes: [
          { t: "Filings table", d: "Date, insider, role, company, ticker, type (buy in green / sell in red), share count and $ value." },
        ],
      },
      {
        nome: "13F Holdings", go: "institutional",
        why: "SEC Form 13F — what the largest hedge funds hold in portfolio.",
        boxes: [
          { t: "4 cards", d: "Total 13F AUM, number of holdings, filing date and period." },
          { t: "Top 10 + All Holdings", d: "Issuer, class, CUSIP, $ value, share count and Put/Call." },
        ],
      },
      {
        nome: "Market DNA", go: "market-dna",
        why: "10-layer market read, each with a 0–100 score.",
        boxes: [
          { t: "Summary + Radar", d: "Average Conviction Score, regime and polygon with the score of the 10 layers." },
          { t: "Cards by layer", d: "Positioning, Volatility, Options, Liquidity, Breadth, Sentiment, Macro, Momentum, Structure, Risk Engine — each with 4 indicators (VIX, IV Rank, Yield Curve, Credit Spread…)." },
          { t: "JIM Intelligence", d: "Headline, positive signals, negative signals, alerts and summary." },
        ],
      },
      {
        nome: "COT Intelligence", go: "cot-sentiment",
        why: "CFTC Commitments of Traders — big players' futures positioning, normalized (COT Index 0–100).",
        boxes: [
          { t: "Guide + summary", d: "Explains the 3 groups (Commercials, Large Specs, Nonreportable) and shows markets at extreme." },
          { t: "Cards by market", d: "COT Index 0–100, weekly change, net position by group (% of OI), Open Interest and contrarian alert at extreme." },
        ],
      },
      {
        nome: "COT Data Explorer", go: "cot-legacy",
        why: "The raw CFTC data, for those who want to go straight to the number.",
        boxes: [
          { t: "Raw table", d: "Date, market, Spec Net, Comm Net (and % of OI), longs/shorts by group and Open Interest, 4–52 week window." },
        ],
      },
    ],
  },
  {
    key: "fundos", label: "Funds", icon: "ti-coin", fase: "3 · The product", cor: "var(--green)",
    importa: "The heart of the sale: the complete profile of each ETP (HPC22, HPC11, Lynk Core22). Performance, crisis defense, live composition and the step-by-step of how to buy.",
    telas: [
      {
        nome: "Fund — Overview", go: "fundo", param: "HPC22",
        why: "The product profile: who it is, what it delivers and governance.",
        boxes: [
          { t: "Header + Highlights", d: "Ticker, name, strategy, status, ISIN and 4 cards (CAGR, Max Drawdown, Sortino…) compared to S&P and Nasdaq." },
          { t: "Product data + Seals", d: "Key-value profile and governance seals (the manager does not custody or execute)." },
        ],
      },
      {
        nome: "Fund — Performance", go: "fundo", param: "HPC22",
        why: "Proof of results, always compared against the benchmark.",
        boxes: [
          { t: "Gross vs net vs S&P", d: "Table by metric." },
          { t: "CORE22+ vs S&P vs Nasdaq", d: "CAGR, Max drawdown, Ulcer, Sharpe, Sortino, negative years." },
          { t: "$10,000 over time", d: "Real portfolio growth vs S&P vs CORE22+, with return and MaxDD by period." },
        ],
      },
      {
        nome: "Fund — Defense & Risk", go: "fundo", param: "HPC22",
        why: "The capital preservation argument: how the fund behaves in a crisis.",
        boxes: [
          { t: "Journey risk", d: "Drawdowns ≥5%: CORE22+ vs S&P." },
          { t: "Entry point risk", d: "Buying at the annual peak: % positive and worst case by horizon." },
          { t: "Crisis defense", d: "By crisis: drawdown and recovery time of S&P vs CORE, compared to Nasdaq." },
        ],
      },
      {
        nome: "Live composition", go: "fundo", param: "HPC22",
        why: "What the fund holds today — a result of the system, not the method.",
        boxes: [
          { t: "3 profiles", d: "Conservative/Balanced/Advanced: Stocks vs ETFs split, number of positions and largest positions (ticker, weight %)." },
          { t: "Active defense layer", d: "When active, the defensive assets with weight % (the trigger is proprietary)." },
        ],
      },
      {
        nome: "Submit order (Lynk)", go: "ordem",
        why: "Closes the cycle: from analysis to subscription/redemption execution.",
        boxes: [
          { t: "Product + Order", d: "Profile (ISIN, yesterday's NAV, BNY Mellon custody, Euroclear/Clearstream settlement), subscription/redemption, client, amount and nominal notes." },
          { t: "Validation", d: "Minimum $50k and multiples of $5k, with confirmation." },
          { t: "Custody × broker", d: "Cash held in custody at BNY Mellon (New York); accounts operated via Interactive Brokers (IBKR)." },
          { t: "Manual execution", d: "All daily orders are executed manually by the team after manager review in the cockpit. The AI (Jim) interprets and supports — no order is automatic." },
        ],
      },
    ],
  },
  {
    key: "clientes", label: "Clients", icon: "ti-users", fase: "4 · The people", cor: "var(--gold)",
    importa: "The MFO's client base in one place: who they are, how much they have, what they hold and who's outside the mandate. From onboarding to detailed portfolio.",
    telas: [
      {
        nome: "Client list", go: "clientes",
        why: "The portfolio view of the whole office.",
        boxes: [
          { t: "4 cards", d: "Total AUM, number of clients, average Harpian allocation and how many outside the mandate." },
          { t: "Clients table", d: "Name, type, profile, AUM, gain %, Risk Number and alignment (within / above mandate)." },
        ],
      },
      {
        nome: "Client portfolio", go: "carteira",
        why: "The detail on one client: what they hold, the risk gap and how to migrate.",
        boxes: [
          { t: "What they hold today", d: "Allocation bars by class (% each)." },
          { t: "Risk gap", d: "Risk Number vs mandate + 'migrate % to HPC22' simulator." },
          { t: "Summary + Portfolios", d: "Invested, current, Risk No., and cards per portfolio (account, value, number of positions)." },
        ],
      },
      {
        nome: "Import / connect", go: "importar",
        why: "Brings the outside portfolio into the terminal.",
        boxes: [
          { t: "CSV upload + preview", d: "Drag in the spreadsheet (asset, quantity, average price); review and apply to the client." },
        ],
      },
      {
        nome: "Alerts", go: "alertas",
        why: "What needs action today, without digging.",
        boxes: [
          { t: "Alert list", d: "Level (critical/watch/info), the alert and when — client risk + market events (Fed, CPI)." },
        ],
      },
    ],
  },
  {
    key: "risco", label: "Risk", icon: "ti-shield-half", fase: "5 · Suitability", cor: "var(--red)",
    importa: "Compliance becomes a sales argument: product, mandate, tolerance and portfolio on the SAME ruler. Shows the client whether they are (or aren't) within what was agreed.",
    telas: [
      {
        nome: "Comparison · 4 levels", go: "risco",
        why: "The 4 risks side by side, on the same scale where the S&P 500 sits at ≈72 (HPC22 ≈38, HPC11 ≈34 — well below the market).",
        boxes: [
          { t: "4 level cards", d: "Product risk, client tolerance, mandate (contractual ceiling) and portfolio risk." },
          { t: "Client ruler", d: "Green→red bar with the 4 markers + migration simulator to HPC22." },
          { t: "All on the ruler", d: "Table comparing each client (portfolio vs mandate) and a badge of how many are outside." },
        ],
      },
    ],
  },
  {
    key: "ajustes", label: "Settings", icon: "ti-settings", fase: "6 · Support", cor: "var(--tx2)",
    importa: "The operations and branding layer: connections, API for the management system and white-label so the terminal uses your office's identity.",
    telas: [
      {
        nome: "Integrations", go: "integracoes", why: "Connects accounts and providers.", boxes: [{ t: "Providers", d: "Connection status (custody, data, Lynk)." }] },
      { nome: "API & Integration", go: "api", why: "For the technical team to plug in the management system.", boxes: [{ t: "Keys & endpoints", d: "Integration documentation (phase 2)." }] },
      { nome: "Brand (white-label)", go: "marca", why: "Terminal with your office's identity.", boxes: [{ t: "Brand", d: "Logo, colors and name shown to the end client." }] },
      { nome: "Settings", go: "config", why: "General preferences.", boxes: [{ t: "Settings", d: "Theme (default/light/dark) and display settings." }] },
    ],
  },
];

export default function Tutorial({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const [sel, setSel] = useState("painel");
  const node = NODES.find((n) => n.key === sel)!;

  return (
    <div className="screen">
      <div className="crumb"><b>Tutorial</b></div>
      <div className="h1">How to use the terminal — full map</div>
      <div className="sub">Click each menu to see why it matters and what each box brings. Follows the natural flow of the day: scenario → product → client → execution.</div>

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
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mono)", letterSpacing: .3 }}>{n.fase}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: on ? "var(--tx)" : "var(--tx2)" }}>{n.label}</div>
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
          Every dashboard has a <b style={{ color: "var(--tx)" }}>default</b> layout, but you <b style={{ color: "var(--tx)" }}>add, remove and drag</b> the cards. Start with the Dashboard: remove what you don't use, bring in what matters. That's how the terminal becomes your working tool.
        </div>
      </div>

      <div className="card mt" style={{ display: "flex", alignItems: "center", gap: 14, borderColor: "rgba(201,160,44,.3)" }}>
        <i className="ti ti-sparkles" style={{ fontSize: 22, color: "var(--gold)" }} />
        <div style={{ flex: 1 }}><b style={{ fontSize: 13 }}>Need help?</b> <span className="muted" style={{ fontSize: 13 }}>Ask Jim AI anytime — it sees the screen and answers in context.</span></div>
      </div>
    </div>
  );
}

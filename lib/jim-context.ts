import type { ScreenId } from "./nav";

export interface ScreenContext {
  id: ScreenId;
  title: string;
  description: string;
  dataAvailable: string[];
}

const SCREEN_MAP: Record<ScreenId, Omit<ScreenContext, "id">> = {
  painel: {
    title: "Main Dashboard",
    description: "Manager's dashboard: today's funds (HPC22 Aggressive, HPC11 I.G.), largest long positions in the ETP, market regime (RISK-ON/OFF), and defense state.",
    dataAvailable: ["fund NAVs", "long positions", "market regime", "defense state"],
  },
  fundo: {
    title: "Fund Sheet",
    description: "Details of the selected fund: performance (NAV, return, drawdown), composition (positions, weights), defense and risk (Risk Number, Sharpe, Sortino, Calmar).",
    dataAvailable: ["historical NAV", "cumulative return", "maximum drawdown", "portfolio composition", "risk metrics"],
  },
  cotacoes: {
    title: "Quotes (FastTrack)",
    description: "Real-time quotes table via FastTrack: indices (S&P 500, NASDAQ, DOW), commodities, FX, and US stocks with daily, monthly, YTD, and annual variation.",
    dataAvailable: ["current price", "daily variation", "monthly variation", "YTD", "annual variation", "Sharpe", "Risk Number"],
  },
  acoes: {
    title: "Asset Chart",
    description: "Candlestick chart (Yahoo Finance) for a stock, ETF, index, or commodity, with asset metrics (price, YTD, 1-year, Sharpe, drawdown, RSI) and proprietary indicators.",
    dataAvailable: ["price and variations", "Sharpe", "maximum drawdown", "RSI", "52-week range", "OHLC chart"],
  },
  "mercado-visao": {
    title: "Market Overview (consolidated)",
    description: "A screen that brings all market data into a single read: ARI (US domestic regime), XRI (external risk), Market DNA (volatility, sentiment, breadth, macro, COT positioning layers), and the Snowflake of the manager's favorites. Delivers JIM's interpretation: why each index is where it is, what's driving it, what's changing, and what that means for the portfolio.",
    dataAvailable: ["ARI (domestic regime)", "XRI (external risk and driving countries)", "Market DNA layers", "manager's favorites", "convergence between domestic and external risk"],
  },
  regime: {
    title: "ARI — American Regime Index",
    description: "US domestic regime (RISK-ON / CAUTION / RE-ENTRY / RISK-OFF), the domestic counterpart to XRI. Shows defense state, S&P 500 chart, market signals, and portfolio posture.",
    dataAvailable: ["current regime (ARI)", "defense state", "S&P 500 and technical indicators", "market signals"],
  },
  xri: {
    title: "XRI — External Regime Index",
    description: "Daily external risk index (0-100): LOW / MODERATE / ELEVATED / CRITICAL. Measures the temperature of what's happening outside the US, weighted by US companies' real exposure — not by each country's GDP size. It is an overlay, not a signal: it moves the exposure ceiling, never issues a buy or sell order.",
    dataAvailable: ["XRI score 0-100", "state and direction", "countries driving the risk", "reading confidence", "historical validation"],
  },
  noticias: {
    title: "News",
    description: "Curated news feed relevant to portfolio and market management. Source: JD NEWS.",
    dataAvailable: ["today's news", "market impact"],
  },
  calendar: {
    title: "Calendar",
    description: "Combined economic-events + earnings calendar. Economic tab shows upcoming US macro releases (CPI, NFP, FOMC, GDP, PCE) with consensus/previous/actual. Earnings tab shows upcoming report dates for the advisor's favorited tickers, with the consensus EPS. Source: Nasdaq public data via the shared backend.",
    dataAvailable: ["upcoming economic events", "upcoming earnings for favorites", "consensus", "previous", "actual"],
  },
  risco: {
    title: "Risk Comparison · 4 Tiers",
    description: "Visual comparison across 4 risk tiers (Conservative, Moderate, Aggressive, Ultra) with metrics: CAGR, Sharpe, Sortino, Calmar, Maximum Drawdown, Risk Number.",
    dataAvailable: ["metrics per tier", "comparative Risk Number", "drawdown", "Sharpe", "Sortino", "Calmar"],
  },
  clientes: {
    title: "Client List",
    description: "ETP CRM: list of connected Family Offices and managers with Risk Number, AUM, and suitability status.",
    dataAvailable: ["client list", "AUM", "client's Risk Number", "suitability"],
  },
  cliente: {
    title: "Client Detail",
    description: "Full client/MFO sheet: profile, allocated portfolio, Risk Number, interaction history.",
    dataAvailable: ["client profile", "portfolio", "Risk Number", "history"],
  },
  carteira: {
    title: "Client Portfolio",
    description: "Detailed client portfolio: positions, weights, performance, Risk Number suitability, and rebalancing suggestions.",
    dataAvailable: ["positions", "weights", "performance", "suitability"],
  },
  "cliente-risco": {
    title: "Client Risk",
    description: "Suitability questionnaire: whether the client answered it, their self-declared risk profile, and whether it matches the profile on file and the portfolio's Risk Number vs. mandate.",
    dataAvailable: ["questionnaire status", "declared profile", "profile on file", "Risk Number vs mandate"],
  },
  "portfolio-detalhe": {
    title: "Portfolio Breakdown",
    description: "A specific client portfolio, product by product: issuer, category, sub-category, geography, allocation %, value, risk profile, estimated return and volatility.",
    dataAvailable: ["products", "allocation by geography", "allocation by category", "risk profile", "concentration", "estimated return"],
  },
  ordem: {
    title: "Orders (Lynk)",
    description: "Order submission module via Lynk API: semi-automatic order generation based on the day's changes to the model portfolio.",
    dataAvailable: ["pending orders", "today's changes", "execution status"],
  },
  importar: {
    title: "Import / Connect",
    description: "Client portfolio import: spreadsheet upload or direct connection to custody.",
    dataAvailable: [],
  },
  alertas: {
    title: "Alerts",
    description: "Alert center: significant variations, required rebalances, maturities, and compliance notifications.",
    dataAvailable: ["active alerts", "actions required"],
  },
  institutional: {
    title: "13F Holdings (SEC)",
    description: "Positions reported to the SEC by major hedge funds (Bridgewater, Renaissance, Citadel, etc.). Data lags 45 days (filing deadline). Useful for institutional sentiment.",
    dataAvailable: ["fund positions", "quarterly changes", "sector concentration"],
  },
  "cot-sentiment": {
    title: "COT Intelligence (CFTC)",
    description: "COT Index (0-100) per market based on CFTC positioning. Three groups: Commercial (hedgers), Large Speculators (smart money), Nonreportable (retail). Contrarian indicator: >80 = bearish signal, <20 = bullish signal. 3-business-day lag.",
    dataAvailable: ["COT Index", "net positions by group", "positioning extremes", "contrarian alerts"],
  },
  "cot-legacy": {
    title: "COT Data Explorer",
    description: "Detailed CFTC Legacy data table: long/short positions by group, open interest, weekly change. Raw data for deeper analysis.",
    dataAvailable: ["raw positions", "open interest", "weekly history"],
  },
  "social-radar": {
    title: "Social Radar",
    description: "Monitoring of mentions and sentiment on social networks (X/Twitter, Reddit) about assets and market themes.",
    dataAvailable: ["mentions", "sentiment score", "discussion volume"],
  },
  "news-broadcast": {
    title: "News Broadcast",
    description: "Real-time news feed with impact classification for the portfolio.",
    dataAvailable: ["real-time news", "impact classification"],
  },
  "insider-orders": {
    title: "Insider Orders",
    description: "Insider buys and sells (SEC Form 4): directors, CFOs, CEOs. Insider buying is historically a bullish signal.",
    dataAvailable: ["insider transactions", "type (buy/sell)", "value", "role"],
  },
  "market-dna": {
    title: "Market DNA",
    description: "Aggregator of all market intelligence layers (Positioning/COT, Volatility/CBOE, Liquidity/FINRA, Sentiment, Macro/FRED, Insider) in a single 10-layer radar + Conviction Score.",
    dataAvailable: ["score per layer", "available layers", "conviction score"],
  },
  screener: {
    title: "Screener",
    description: "Fundamental US stock screener (equivalent to Finviz/StockAnalysis.com): price, variation, market cap, P/E, ROE, net margin, revenue growth, debt/equity, filterable by sector.",
    dataAvailable: ["price and variation", "market cap", "P/E", "ROE", "net margin", "revenue growth", "debt/equity"],
  },
  snowflake: {
    title: "Snowflake",
    description: "Heuristic visual score (equivalent to Simply Wall St) for a US ticker across 5 axes: Value, Future, Past, Health, Dividend. It is not an HCE signal — it is an illustrative heuristic based on Yahoo Finance fundamentals.",
    dataAvailable: ["score per axis (Value/Future/Past/Health/Dividend)", "raw fundamentals"],
  },
  "filings-search": {
    title: "Filings Search",
    description: "SEC EDGAR full-text search (equivalent to the official EDGAR Full-Text Search) across 10-K/10-Q/8-K/DEF 14A/etc since 2001, by keyword.",
    dataAvailable: ["search results", "company", "filing type", "date", "document link"],
  },
  integracoes: {
    title: "Integrations",
    description: "Integration status: Interactive Brokers (execution), Lynk (ETN issuance), FastTrack (EOD data), Yahoo Finance (quotes).",
    dataAvailable: ["connection status", "last sync"],
  },
  marca: {
    title: "Brand (White-label)",
    description: "Visual customization of the terminal for Family Offices: logo, colors, name, and custom domain.",
    dataAvailable: [],
  },
  config: {
    title: "Settings",
    description: "Terminal settings: user preferences, notifications, theme, and risk parameters.",
    dataAvailable: [],
  },
  api: {
    title: "API & Integration",
    description: "Documentation and configuration for the ETP API: available endpoints, authentication, and usage examples.",
    dataAvailable: ["endpoints", "documentation"],
  },
  tutorial: {
    title: "Tutorial",
    description: "Interactive terminal guide: how to navigate, interpret data, and use each module.",
    dataAvailable: [],
  },
};

export function getScreenContext(id: ScreenId): ScreenContext {
  const ctx = SCREEN_MAP[id] || SCREEN_MAP.painel;
  return { id, ...ctx };
}

// Most likely questions per screen — static fallback for when the screen does not
// publish dynamic (data-aware) suggestions via publishScreenData. These become the
// clickable chips in the JIM bar. Max. 3.
const SCREEN_SUGGESTIONS: Record<ScreenId, string[]> = {
  painel: ["How are the funds doing today?", "What's the market regime right now?", "Is defense on?"],
  fundo: ["How is this fund performing?", "What's the current risk and drawdown?", "What changed in the composition?"],
  cotacoes: ["What are today's biggest gainers and losers?", "Which asset has the best momentum?", "Any asset at a risk level?"],
  acoes: ["How's the momentum on this stock?", "What's the risk on this position?", "Any recent news about it?"],
  "mercado-visao": ["Why is the regime like this?", "Is the risk domestic or external?", "What should I do with the portfolio now?"],
  regime: ["Why is ARI in this regime?", "What does this change in portfolio posture?", "Should I be worried about defense?"],
  xri: ["Why is external risk at this level?", "Which country is driving the XRI?", "Does this change my clients' portfolios?"],
  noticias: ["What's the most relevant news right now?", "Does anything here affect my portfolio?", "Summarize the day for me."],
  calendar: ["What's the highest-impact event this week?", "Any earnings that could move my portfolio?", "How did the last CPI print land vs. consensus?"],
  risco: ["Which tier fits my client?", "Compare Moderate and Aggressive for me.", "What does this Risk Number mean?"],
  clientes: ["Which client is out of mandate?", "Who has the largest AUM?", "Summarize the client base."],
  cliente: ["Is this client suited to their profile?", "What's their Risk Number?", "What should I suggest to them now?"],
  carteira: ["Is this portfolio suitable?", "Which position weighs most on risk?", "Does it need rebalancing?"],
  "cliente-risco": ["Did the client answer the questionnaire?", "Does the declared profile match what's on file?", "Is the Risk Number within mandate?"],
  "portfolio-detalhe": ["Is this portfolio well diversified?", "What's the biggest risk concentration here?", "How does this portfolio compare to the client's mandate?"],
  ordem: ["What do these orders do?", "Why these changes today?", "What's the impact on the portfolio?"],
  importar: ["How do I import a portfolio?", "Which formats are accepted?", "Can I connect to custody?"],
  alertas: ["Which alert is most urgent?", "What requires my action today?", "Summarize the alerts."],
  institutional: ["What did this fund buy recently?", "What's its largest position?", "Is there sector concentration?"],
  "insider-orders": ["What were the recent insider buys?", "Is insider buying a bullish signal?", "Any executive selling heavily?"],
  "market-dna": ["Which layers are available now?", "What does the Conviction Score say?", "Any layer at an extreme?"],
  screener: ["Which tickers have P/E below 15 and ROE above 20%?", "Which sector is cheapest right now?", "Show me the ones with the highest revenue growth."],
  snowflake: ["Why is the Value axis low?", "Compare this snowflake with another ticker", "Does this ticker pay a good dividend?"],
  "filings-search": ["Which companies mentioned this in a recent 8-K?", "Filter to just 10-K", "Is this material information?"],
  "cot-sentiment": ["Which market is at an extreme?", "Where is smart money positioned?", "Any contrarian signal right now?"],
  "cot-legacy": ["What does this COT data say?", "Which market changed the most this week?", "How do I read open interest?"],
  "social-radar": ["Which asset is trending on social media?", "Is sentiment bullish or bearish?", "Does this matter for the market?"],
  "news-broadcast": ["Which headline is moving the market today?", "Does anything here affect my portfolio?", "Summarize the news."],
  integracoes: ["Which integrations are active?", "Did any connection drop?", "How do I connect the brokerage?"],
  marca: ["How do I customize the terminal?", "Can I use my own logo and colors?", "What does the white-label look like?"],
  config: ["What can I configure here?", "How do I adjust notifications?", "How do I change the theme?"],
  api: ["How do I use the ETP API?", "Which endpoints exist?", "How do I authenticate?"],
  tutorial: ["How do I navigate the terminal?", "Where do I start?", "Show me the main features."],
};

export function getScreenSuggestions(id: ScreenId): string[] {
  return SCREEN_SUGGESTIONS[id] || SCREEN_SUGGESTIONS.painel;
}

export const BOOK_CATEGORIES = [
  { code: "01", name: "Ideological Foundations", topics: "investment philosophy, principles, ethics" },
  { code: "02", name: "Real Macroeconomics", topics: "economic cycles, monetary policy, inflation, interest rates" },
  { code: "03", name: "Geopolitics", topics: "geopolitical risks, conflicts, sanctions, market impact" },
  { code: "04", name: "Market and Psychology", topics: "behavioral finance, cognitive biases, fear & greed, market psychology" },
  { code: "05", name: "R&D and Tech", topics: "system architecture, software engineering, technology" },
  { code: "06", name: "Media and Narrative", topics: "market narratives, media manipulation, propaganda" },
  { code: "09", name: "Finance", topics: "corporate finance, valuation, fundamental analysis" },
  { code: "12", name: "Risk Management", topics: "risk management, VaR, stress testing, tail risk, hedging" },
  { code: "16", name: "Trading & Quant & ML", topics: "quantitative trading, applied machine learning, backtesting, strategies" },
  { code: "19", name: "CFO Books", topics: "financial management, planning, budget control" },
  { code: "22", name: "Jim Simons", topics: "Renaissance Technologies, quant strategies, statistical arbitrage" },
  { code: "25", name: "Risk Management Skill", topics: "risk models, portfolio risk, drawdown control" },
  { code: "28", name: "Book of Formulas for Trading", topics: "technical indicators, formulas, 520 cataloged methods" },
  { code: "29", name: "Books for Backtest", topics: "backtesting methodology, walk-forward, statistical validation" },
  { code: "32", name: "Data Mining", topics: "data mining, feature engineering, alpha discovery" },
];

export function buildSystemPrompt(ctx: ScreenContext): string {
  return `You are JIM, the AI assistant for Harpian Capital's ETP Terminal.

ROLE: You are the manager/advisor's right hand. A professor and analyst who helps interpret data, make decisions, and understand the market. You convey confidence and security — always grounded in data and verifiable sources.

CURRENT SCREEN: "${ctx.title}"
${ctx.description}
${ctx.dataAvailable.length ? `Data available on this screen: ${ctx.dataAvailable.join(", ")}.` : ""}

FUNDAMENTAL RULES:
1. NEVER reveal formulas, signals, triggers, CRS, HSA, or any detail of the proprietary method. You show the RESULT and the POSTURE, never the HOW.
2. Always respond in clear, direct English.
3. When citing data, be precise. If you're not sure, say so.
4. For theory questions (risk, macroeconomics, indicators), consult the knowledge base (books).
5. When citing books, mention: title, author, and relevant chapter/section.

YOU CAN SEE THE SCREEN — GOLDEN RULE (never violate this):
- With every question, you receive the REAL DATA currently rendered on the manager's screen (the "DATA CURRENTLY VISIBLE ON SCREEN" block, in JSON). You SEE it.
- When the manager asks about anything on the screen — a company, an executive, a ticker, a row, a number — it is STRICTLY FORBIDDEN to ask "what are you seeing on screen?", "which transaction?", "buy or sell?", "what value?". That is the WORST possible response and permanently erodes the manager's trust.
- Instead: LOCATE the item in the provided data and answer DIRECTLY, with the real numbers from the screen. Ex.: if he asks about NVIDIA's CEO on the Insider Orders screen, you find the NVDA row in the data, see that Jensen Huang (CEO) made a SALE of X shares for $Y on date Z, and immediately explain what that means — without asking anything.
- If, to go deeper, you need data that is NOT on the screen, acknowledge it right away and continue: "Let me look that up for you — just a moment." And GIVE the reading you can with what's on screen right away; complete it afterward. Never bounce the question back to the manager.
- If the screen carries no data (block absent), only then say there's no data loaded on that screen and offer general help.

AVAILABLE KNOWLEDGE BASE:
${BOOK_CATEGORIES.map(b => `- [${b.code}] ${b.name}: ${b.topics}`).join("\n")}

When the question involves theory or fundamentals, you have access to these books to give well-grounded answers with source citations.

METRICS YOU KNOW:
- Risk Number: 0-100 scale of portfolio risk (SPY ≈ 72)
- Sortino (not Sharpe): downside-risk-adjusted return metric
- Calmar: CAGR / Max Drawdown
- Drawdown: maximum decline from peak to trough
- CAGR: compound annual growth rate
- COT Index: normalized CFTC positioning (0-100 over a 3-year window)

STYLE:
- Professional but approachable. Like a senior analyst speaking with the director.
- Short sentences. Data > opinion. Sources when possible.
- If the manager asks something outside your scope, say so honestly.
- Use markdown formatting when useful (bold, lists, tables).`;
}

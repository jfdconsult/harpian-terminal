# HARPIAN ETP TERMINAL

## Stack
- Next.js 16.2.9 + React 19 + TypeScript
- Port: 8950 (default `next dev`)
- Lightweight Charts (TradingView) for candle charts
- dnd-kit for drag-and-drop
- No backend — all data comes from HQP API or external APIs

## How to run
```bash
npm install
npm run dev   # http://localhost:8950
```

## Architecture

### Entry point
- `app/layout.tsx` — root layout, wraps ThemeProvider + I18nProvider
- `app/page.tsx` — loads Terminal.tsx
- `components/Terminal.tsx` — main shell (sidebar + topbar + screen router)

### Screen system
Screens live in `components/screens/`. Navigation is defined in `lib/nav.ts`.
Terminal.tsx renders the active screen based on `screenId` state.

Menu structure (from nav.ts):
- **Painel** — Dashboard with JIM Morning Briefing, portfolio summary, market data
- **Fundos** — HPC22/HPC11 fund views (vision, performance, composition, defense)
- **Clientes** — Client list, wallet, import, alerts, orders
- **Mercado** — Cotações (quotes), Regime (market vision)
- **Intelligence** — Social Radar, News Broadcast, Insider Orders, 13F Holdings (SEC), Market DNA, COT Intelligence (CFTC), COT Data Explorer
- **Risco** — Risk comparison (4 levels), portfolio risk, client risk
- **Ajustes** — Integrations, API & Integration, White-label branding, Settings
- **Tutorial** — Onboarding

### Screens (39 files in components/screens/):
- Painel.tsx — Dashboard + JIM Morning Briefing card
- Fundo.tsx — Fund detail view
- Cotacoes.tsx — Real-time quotes table
- Regime.tsx — Market regime + JIM analysis card
- Acoes.tsx — US stocks & indices
- Noticias.tsx — News feed
- Clientes.tsx — Client list
- Cliente.tsx — Individual client view
- ClienteEditModal.tsx — Client edit modal
- Carteira.tsx — Client portfolio/wallet
- Risco.tsx — Risk comparison view
- RiskJourney.tsx — Risk number questionnaire journey
- PortfolioDetail.tsx — Detailed portfolio breakdown
- ComposicaoAoVivo.tsx — Live composition
- GrowthChart.tsx — Growth/performance chart
- DrawdownChart.tsx — Underwater/drawdown chart
- AssetChart.tsx — Individual asset chart with DSPT
- Ordem.tsx — Order management
- Importar.tsx — Import/connect external data
- Alertas.tsx — Alert configuration
- Config.tsx — Settings (themes, language, notifications)
- Integracoes.tsx — External integrations setup
- Marca.tsx — White-label branding
- Institutional.tsx — 13F institutional holdings (SEC)
- InsiderOrders.tsx — Insider trading orders
- SocialRadar.tsx — Social media sentiment
- NewsBroadcast.tsx — News broadcast system
- CotSentiment.tsx — COT intelligence analysis
- CotLegacy.tsx — COT data explorer
- MarketDna.tsx — Market DNA analysis
- TradingViewWidget.tsx — Embedded TradingView chart
- ApiIntegracao.tsx — API integration documentation
- Placeholder.tsx — Placeholder for screens not yet built
- Tutorial.tsx — Onboarding tutorial

### Shared components
- `components/Terminal.tsx` — Main app shell (sidebar menus, topbar, screen router)
- `components/Topbar.tsx` — Top navigation bar with logo, JIM button, settings gear
- `components/JimDrawer.tsx` — JIM AI assistant sidebar drawer
- `components/SettingsDrawer.tsx` — Settings panel drawer
- `components/Ticker.tsx` — Market ticker tape component

### Lib modules
- `lib/nav.ts` — Menu structure and ScreenId types
- `lib/i18n.tsx` — Internationalization (PT/EN) with confirm+reload on language switch
- `lib/theme.tsx` — Theme provider (navy/light/dark) using CSS variables + data-theme attribute
- `lib/jim-context.ts` — JIM AI context management
- `lib/jim-data.ts` — JIM data access layer
- `lib/jim-knowledge.ts` — JIM knowledge base integration
- `lib/jim-sessions.ts` — JIM session persistence
- `lib/data.ts` — Core data fetching utilities
- `lib/market.ts` — Market data helpers
- `lib/yahoo.ts` — Yahoo Finance API client
- `lib/hqp.ts` — HQP API client
- `lib/funds.ts` — Fund data utilities
- `lib/core22.ts` — CORE22 portfolio data
- `lib/cache.ts` — Client-side caching
- `lib/clients.ts` — Client data management
- `lib/clientStore.ts` — Client local store
- `lib/csv.ts` — CSV parsing
- `lib/favorites.ts` — User favorites persistence
- `lib/types.ts` — Shared TypeScript interfaces (Candle, CandlesResp, AssetResp)
- `lib/feeds.ts` — News/data feed helpers
- `lib/format.ts` — Number/date formatting
- `lib/indicators.ts` — Technical indicators
- `lib/portfolioModels.ts` — Portfolio model definitions
- `lib/riskLevels.ts` — Risk level definitions
- `lib/snapshot.ts` — Portfolio snapshot utilities

## Theme System (CSS Variables)
Three themes defined in `app/globals.css`:
- **Navy** (default, no `data-theme` attribute): dark blue background
- **Light** (`data-theme="light"`): white/light gray background
- **Dark** (`data-theme="dark"`): dark gray/black background

Key CSS variables: `--bg`, `--bg2`, `--panel`, `--tx`, `--tx2`, `--tx3`, `--line`, `--line2`, `--gold`

All UI components MUST use CSS variables, never hardcoded colors. This applies especially to JIM cards and panels.

## i18n System
- `lib/i18n.tsx` — I18nProvider with `useI18n()` hook
- Dictionary-based: `dict` record maps keys to `{ pt: string, en: string }`
- Language switch triggers confirm dialog + full page reload
- Stored in localStorage key `harpian-lang`

## JIM AI Assistant
JIM (homenagem Jim Simons) is the proactive AI assistant integrated into the terminal.
- Button in topbar opens JimDrawer sidebar
- Uses `publishScreenData()` pattern: each screen publishes its visible data
- JIM reads screen context and offers proactive insights
- Morning Briefing card on Painel.tsx dashboard
- Analysis card on Regime.tsx
- JIM card styling MUST use `var(--panel)` background and `var(--tx)` text color (theme-aware)

## IMPORTANT RULES
- This is a CLIENT-FACING terminal for MFOs/gestores/RIAs/assessores
- NEVER expose trading signals, triggers, formulas, CRS, HSA (that's Cockpit internal)
- Terminal shows RESULTS and POSTURE only — the "what", never the "how"
- All text must support PT and EN via i18n system
- Sortino (not Sharpe) is the standard metric
- Risk Number must appear in every portfolio/risk table
- Never use `git add -A` — stage specific files only

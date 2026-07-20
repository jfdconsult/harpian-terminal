import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── VOP · 5-WEEK COMPOSITION SNAPSHOT ────────────────────────────────────────
// Fotografia FIXA da composição da carteira como estava há ~5 semanas.
// A janela é de 35 dias — larga o suficiente pra o cliente NÃO conseguir usar
// o snapshot pra copiar posições que a carteira ainda pode estar operando
// (o holding médio é ~34 dias; 5 semanas garante que a maioria já foi girada).
//
// Enquanto o feed real do book não estiver plugado, o payload é mock realista.
// Server aplica cache-control no-store — snapshot não pode ser cacheado nem
// remontado por composição de páginas.

// data-base: sempre "hoje - 35 dias", calculada no server no momento da request.
function fiveWeeksAgoISO(now: Date): string {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - 35);
  d.setUTCHours(9, 0, 0, 0); // âncora 06:00 BRT / 09:00 UTC (mesmo ritual da rotação)
  return d.toISOString().slice(0, 10);
}

const CONSERVATIVE_HOLDINGS = [
  { ticker: "SPY",  name: "SPDR S&P 500 ETF Trust",       weight_pct: 22.0 },
  { ticker: "AGG",  name: "iShares Core U.S. Aggregate",  weight_pct: 18.0 },
  { ticker: "GLD",  name: "SPDR Gold Shares",             weight_pct: 12.0 },
  { ticker: "MSFT", name: "Microsoft Corp.",              weight_pct:  5.5 },
  { ticker: "AAPL", name: "Apple Inc.",                    weight_pct:  5.0 },
  { ticker: "V",    name: "Visa Inc.",                     weight_pct:  4.5 },
  { ticker: "JNJ",  name: "Johnson & Johnson",             weight_pct:  4.0 },
];

const BALANCE_HOLDINGS = [
  { ticker: "MSFT", name: "Microsoft Corp.",              weight_pct:  6.5 },
  { ticker: "AAPL", name: "Apple Inc.",                    weight_pct:  6.0 },
  { ticker: "NVDA", name: "NVIDIA Corp.",                  weight_pct:  5.8 },
  { ticker: "AVGO", name: "Broadcom Inc.",                 weight_pct:  5.0 },
  { ticker: "META", name: "Meta Platforms",                weight_pct:  4.5 },
  { ticker: "GOOGL",name: "Alphabet Inc.",                 weight_pct:  4.2 },
  { ticker: "V",    name: "Visa Inc.",                     weight_pct:  3.8 },
  { ticker: "LLY",  name: "Eli Lilly",                     weight_pct:  3.5 },
  { ticker: "COST", name: "Costco Wholesale",              weight_pct:  3.2 },
];

const ADVANCE_HOLDINGS = [
  { ticker: "NVDA", name: "NVIDIA Corp.",                  weight_pct:  8.0 },
  { ticker: "AVGO", name: "Broadcom Inc.",                 weight_pct:  7.5 },
  { ticker: "MSFT", name: "Microsoft Corp.",              weight_pct:  6.8 },
  { ticker: "META", name: "Meta Platforms",                weight_pct:  6.0 },
  { ticker: "AAPL", name: "Apple Inc.",                    weight_pct:  5.5 },
  { ticker: "AMZN", name: "Amazon.com",                    weight_pct:  5.2 },
  { ticker: "TSLA", name: "Tesla Inc.",                    weight_pct:  4.5 },
  { ticker: "GOOGL",name: "Alphabet Inc.",                 weight_pct:  4.2 },
  { ticker: "LLY",  name: "Eli Lilly",                     weight_pct:  3.8 },
  { ticker: "COST", name: "Costco Wholesale",              weight_pct:  3.5 },
];

const DEFENSE_HOLDINGS = [
  { ticker: "GLD",  name: "SPDR Gold Shares",             weight_pct: 28 },
  { ticker: "TLT",  name: "iShares 20+Y Treasury",        weight_pct: 24 },
  { ticker: "IEF",  name: "iShares 7-10Y Treasury",       weight_pct: 18 },
  { ticker: "VNQ",  name: "Vanguard Real Estate ETF",     weight_pct: 15 },
];

export async function GET() {
  const now = new Date();
  const as_of = fiveWeeksAgoISO(now);

  const res = NextResponse.json({
    ok: true,
    as_of,
    delay_days: 35,
    delay_weeks: 5,
    protocol: {
      name: "Verified Opacity Protocol · Composition Snapshot",
      version: "v1",
      rule: "Composição da carteira congelada há 35 dias (5 semanas). Nenhum dado ao vivo. Rotaciona diariamente — a janela avança 1 dia por dia.",
    },
    regime: { state: "BULL", label: "Risk-On" }, // regime NAQUELE momento (5 sem atrás)
    profiles: {
      CONSERVATIVE: {
        pct_acoes: 46, pct_etfs: 54,
        n_holdings: 22,
        top_holdings: CONSERVATIVE_HOLDINGS,
      },
      BALANCE: {
        pct_acoes: 72, pct_etfs: 28,
        n_holdings: 28,
        top_holdings: BALANCE_HOLDINGS,
      },
      ADVANCE: {
        pct_acoes: 92, pct_etfs: 8,
        n_holdings: 32,
        top_holdings: ADVANCE_HOLDINGS,
      },
    },
    defense: {
      label: "GLD + TREASURIES + REITs",
      holdings: DEFENSE_HOLDINGS,
    },
  });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return res;
}

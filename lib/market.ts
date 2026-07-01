// Universo de mercado (tickers Yahoo) + carteira exemplo para a régua de risco.
export interface SymbolDef { symbol: string; name: string; }

export const MARKET_GROUPS: Record<string, SymbolDef[]> = {
  "Índices": [
    { symbol: "^GSPC", name: "S&P 500" },
    { symbol: "^NDX", name: "Nasdaq 100" },
    { symbol: "^RUT", name: "Russell 2000" },
    { symbol: "^DJI", name: "Dow Jones" },
    { symbol: "^SOX", name: "Semicondutores (PHLX)" },
    { symbol: "^VIX", name: "VIX (volatilidade)" },
  ],
  "ETFs": [
    { symbol: "SPY", name: "SPDR S&P 500" },
    { symbol: "QQQ", name: "Invesco Nasdaq 100" },
    { symbol: "IWM", name: "iShares Russell 2000" },
    { symbol: "DIA", name: "SPDR Dow Jones" },
    { symbol: "GLD", name: "SPDR Gold" },
    { symbol: "TLT", name: "iShares 20+Y Treasury" },
  ],
  "Ações": [
    { symbol: "NVDA", name: "NVIDIA" },
    { symbol: "MSFT", name: "Microsoft" },
    { symbol: "AAPL", name: "Apple" },
    { symbol: "META", name: "Meta Platforms" },
    { symbol: "GOOGL", name: "Alphabet" },
    { symbol: "AMZN", name: "Amazon" },
    { symbol: "TSLA", name: "Tesla" },
    { symbol: "JPM", name: "JPMorgan" },
  ],
  "Setores": [
    { symbol: "XLE", name: "Energia" },
    { symbol: "XLK", name: "Tecnologia" },
    { symbol: "XLF", name: "Financeiro" },
    { symbol: "XLV", name: "Saúde" },
    { symbol: "XLY", name: "Consumo discric." },
    { symbol: "XLI", name: "Industrial" },
  ],
};

// Seletor da tela "Ações & índices US"
export const ASSET_LIST: SymbolDef[] = [
  ...MARKET_GROUPS["Ações"],
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^NDX", name: "Nasdaq 100" },
  { symbol: "QQQ", name: "Invesco Nasdaq 100" },
  { symbol: "GLD", name: "SPDR Gold" },
];

// Carteira exemplo do cliente (agressiva) — o Risco de portfólio sai daqui, ao vivo do Yahoo.
export const EXAMPLE_PORTFOLIO: { symbol: string; weight: number }[] = [
  { symbol: "QQQ", weight: 0.30 },
  { symbol: "NVDA", weight: 0.25 },
  { symbol: "TSLA", weight: 0.20 },
  { symbol: "META", weight: 0.15 },
  { symbol: "AMZN", weight: 0.10 },
];

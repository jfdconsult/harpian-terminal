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
  "Commodities": [
    { symbol: "GC=F", name: "Ouro (futuro)" },
    { symbol: "SI=F", name: "Prata (futuro)" },
    { symbol: "CL=F", name: "Petróleo WTI" },
    { symbol: "BZ=F", name: "Petróleo Brent" },
    { symbol: "NG=F", name: "Gás natural" },
    { symbol: "HG=F", name: "Cobre" },
  ],
  "Cripto": [
    { symbol: "BTC-USD", name: "Bitcoin" },
    { symbol: "ETH-USD", name: "Ethereum" },
    { symbol: "SOL-USD", name: "Solana" },
    { symbol: "XRP-USD", name: "XRP" },
    { symbol: "BNB-USD", name: "BNB" },
    { symbol: "DOGE-USD", name: "Dogecoin" },
  ],
  "Forex": [
    { symbol: "EURUSD=X", name: "EUR / USD" },
    { symbol: "USDJPY=X", name: "USD / JPY" },
    { symbol: "GBPUSD=X", name: "GBP / USD" },
    { symbol: "USDBRL=X", name: "USD / BRL" },
    { symbol: "USDCHF=X", name: "USD / CHF" },
    { symbol: "AUDUSD=X", name: "AUD / USD" },
  ],
};

// Seletor da tela "Ações, ETFs & Commodities" — agrupado (optgroup)
export const ASSET_GROUPS: { label: string; items: SymbolDef[] }[] = [
  { label: "Ações", items: MARKET_GROUPS["Ações"] },
  { label: "Índices", items: MARKET_GROUPS["Índices"] },
  { label: "ETFs", items: MARKET_GROUPS["ETFs"] },
  { label: "Setores", items: MARKET_GROUPS["Setores"] },
  { label: "Commodities", items: MARKET_GROUPS["Commodities"] },
];
export const ASSET_LIST: SymbolDef[] = ASSET_GROUPS.flatMap((g) => g.items);

// Mapa Yahoo → símbolo TradingView (para o widget/deep-link).
const TV_MAP: Record<string, string> = {
  "^GSPC": "SP:SPX", "^NDX": "NASDAQ:NDX", "^DJI": "DJ:DJI", "^RUT": "TVC:RUT2K", "^SOX": "NASDAQ:SOX", "^VIX": "TVC:VIX",
  "GC=F": "COMEX:GC1!", "SI=F": "COMEX:SI1!", "CL=F": "NYMEX:CL1!", "BZ=F": "NYMEX:BZ1!", "NG=F": "NYMEX:NG1!", "HG=F": "COMEX:HG1!",
  "BTC-USD": "COINBASE:BTCUSD", "ETH-USD": "COINBASE:ETHUSD", "SOL-USD": "COINBASE:SOLUSD", "XRP-USD": "COINBASE:XRPUSD", "BNB-USD": "BINANCE:BNBUSD", "DOGE-USD": "COINBASE:DOGEUSD",
  "EURUSD=X": "FX:EURUSD", "USDJPY=X": "FX:USDJPY", "GBPUSD=X": "FX:GBPUSD", "USDBRL=X": "FX_IDC:USDBRL", "USDCHF=X": "FX:USDCHF", "AUDUSD=X": "FX:AUDUSD",
};
export const tvSymbol = (s: string) => TV_MAP[s] || s.replace("^", "").replace("=F", "").replace("-USD", "USD").replace("=X", "");


// Carteira exemplo do cliente (agressiva) — o Risco de portfólio sai daqui, ao vivo do Yahoo.
export const EXAMPLE_PORTFOLIO: { symbol: string; weight: number }[] = [
  { symbol: "QQQ", weight: 0.30 },
  { symbol: "NVDA", weight: 0.25 },
  { symbol: "TSLA", weight: 0.20 },
  { symbol: "META", weight: 0.15 },
  { symbol: "AMZN", weight: 0.10 },
];

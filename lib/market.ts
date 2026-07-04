// Universo de mercado (tickers Yahoo) + carteira exemplo para a régua de risco.
export interface SymbolDef { symbol: string; name: string; }

export const MARKET_GROUPS: Record<string, SymbolDef[]> = {
  "Índices US": [
    { symbol: "^GSPC", name: "S&P 500" }, { symbol: "^NDX", name: "Nasdaq 100" },
    { symbol: "^IXIC", name: "Nasdaq Composite" }, { symbol: "^DJI", name: "Dow Jones" },
    { symbol: "^RUT", name: "Russell 2000" }, { symbol: "^OEX", name: "S&P 100" },
    { symbol: "^MID", name: "S&P MidCap 400" }, { symbol: "^SP600", name: "S&P SmallCap 600" },
    { symbol: "^SOX", name: "Semicondutores (PHLX)" }, { symbol: "^NYA", name: "NYSE Composite" },
    { symbol: "^VIX", name: "VIX (volatilidade)" }, { symbol: "^TNX", name: "US 10Y Treasury (yield)" },
  ],
  "Índices Globais": [
    { symbol: "^FTSE", name: "FTSE 100 (UK)" }, { symbol: "^GDAXI", name: "DAX (Alemanha)" },
    { symbol: "^FCHI", name: "CAC 40 (França)" }, { symbol: "^STOXX50E", name: "Euro Stoxx 50" },
    { symbol: "^IBEX", name: "IBEX 35 (Espanha)" }, { symbol: "^N225", name: "Nikkei 225 (Japão)" },
    { symbol: "^HSI", name: "Hang Seng (HK)" }, { symbol: "000001.SS", name: "Shanghai Composite" },
    { symbol: "^KS11", name: "KOSPI (Coreia)" }, { symbol: "^TWII", name: "Taiwan Weighted" },
    { symbol: "^BSESN", name: "SENSEX (Índia)" }, { symbol: "^AXJO", name: "ASX 200 (Austrália)" },
    { symbol: "^GSPTSE", name: "TSX (Canadá)" }, { symbol: "^BVSP", name: "Ibovespa (Brasil)" },
    { symbol: "^MXX", name: "IPC (México)" },
  ],
  "ETFs": [
    { symbol: "SPY", name: "SPDR S&P 500" }, { symbol: "QQQ", name: "Invesco Nasdaq 100" },
    { symbol: "IWM", name: "iShares Russell 2000" }, { symbol: "DIA", name: "SPDR Dow Jones" },
    { symbol: "VTI", name: "Vanguard Total Market" }, { symbol: "GLD", name: "SPDR Gold" },
    { symbol: "SLV", name: "iShares Silver" }, { symbol: "TLT", name: "iShares 20+Y Treasury" },
    { symbol: "IEF", name: "iShares 7-10Y Treasury" }, { symbol: "HYG", name: "iShares High Yield" },
    { symbol: "LQD", name: "iShares IG Corp" }, { symbol: "AGG", name: "iShares US Aggregate" },
    { symbol: "EEM", name: "iShares Emerging Mkts" }, { symbol: "EFA", name: "iShares EAFE" },
    { symbol: "VEA", name: "Vanguard Developed" }, { symbol: "VWO", name: "Vanguard Emerging" },
    { symbol: "SMH", name: "VanEck Semiconductors" }, { symbol: "SOXX", name: "iShares Semiconductors" },
    { symbol: "ARKK", name: "ARK Innovation" }, { symbol: "KWEB", name: "China Internet" },
    { symbol: "VNQ", name: "Vanguard Real Estate" }, { symbol: "USO", name: "US Oil Fund" },
  ],
  "Ações": [
    { symbol: "AAPL", name: "Apple" }, { symbol: "MSFT", name: "Microsoft" }, { symbol: "NVDA", name: "NVIDIA" },
    { symbol: "AMZN", name: "Amazon" }, { symbol: "GOOGL", name: "Alphabet" }, { symbol: "META", name: "Meta" },
    { symbol: "TSLA", name: "Tesla" }, { symbol: "AVGO", name: "Broadcom" }, { symbol: "AMD", name: "AMD" },
    { symbol: "NFLX", name: "Netflix" }, { symbol: "ADBE", name: "Adobe" }, { symbol: "CRM", name: "Salesforce" },
    { symbol: "ORCL", name: "Oracle" }, { symbol: "CSCO", name: "Cisco" }, { symbol: "INTC", name: "Intel" },
    { symbol: "QCOM", name: "Qualcomm" }, { symbol: "TXN", name: "Texas Instruments" }, { symbol: "MU", name: "Micron" },
    { symbol: "PLTR", name: "Palantir" }, { symbol: "IBM", name: "IBM" }, { symbol: "NOW", name: "ServiceNow" },
    { symbol: "JPM", name: "JPMorgan" }, { symbol: "BAC", name: "Bank of America" }, { symbol: "WFC", name: "Wells Fargo" },
    { symbol: "GS", name: "Goldman Sachs" }, { symbol: "MS", name: "Morgan Stanley" }, { symbol: "V", name: "Visa" },
    { symbol: "MA", name: "Mastercard" }, { symbol: "AXP", name: "American Express" }, { symbol: "BRK-B", name: "Berkshire H." },
    { symbol: "UNH", name: "UnitedHealth" }, { symbol: "JNJ", name: "Johnson & Johnson" }, { symbol: "LLY", name: "Eli Lilly" },
    { symbol: "PFE", name: "Pfizer" }, { symbol: "MRK", name: "Merck" }, { symbol: "ABBV", name: "AbbVie" },
    { symbol: "TMO", name: "Thermo Fisher" }, { symbol: "WMT", name: "Walmart" }, { symbol: "COST", name: "Costco" },
    { symbol: "HD", name: "Home Depot" }, { symbol: "PG", name: "Procter & Gamble" }, { symbol: "KO", name: "Coca-Cola" },
    { symbol: "PEP", name: "PepsiCo" }, { symbol: "MCD", name: "McDonald's" }, { symbol: "NKE", name: "Nike" },
    { symbol: "DIS", name: "Disney" }, { symbol: "XOM", name: "Exxon Mobil" }, { symbol: "CVX", name: "Chevron" },
    { symbol: "COP", name: "ConocoPhillips" }, { symbol: "CAT", name: "Caterpillar" }, { symbol: "BA", name: "Boeing" },
    { symbol: "GE", name: "GE Aerospace" }, { symbol: "HON", name: "Honeywell" }, { symbol: "UPS", name: "UPS" },
    { symbol: "T", name: "AT&T" }, { symbol: "VZ", name: "Verizon" }, { symbol: "CMCSA", name: "Comcast" },
    { symbol: "UBER", name: "Uber" }, { symbol: "ABNB", name: "Airbnb" }, { symbol: "SHOP", name: "Shopify" },
    { symbol: "COIN", name: "Coinbase" }, { symbol: "SQ", name: "Block" }, { symbol: "PYPL", name: "PayPal" },
    { symbol: "MSTR", name: "MicroStrategy" }, { symbol: "SMCI", name: "Super Micro" }, { symbol: "ARM", name: "Arm Holdings" },
    { symbol: "MRVL", name: "Marvell" }, { symbol: "SNOW", name: "Snowflake" }, { symbol: "DELL", name: "Dell" },
  ],
  "Setores": [
    { symbol: "XLK", name: "Tecnologia" }, { symbol: "XLV", name: "Saúde" }, { symbol: "XLF", name: "Financeiro" },
    { symbol: "XLY", name: "Consumo discric." }, { symbol: "XLP", name: "Consumo básico" }, { symbol: "XLC", name: "Comunicação" },
    { symbol: "XLI", name: "Industrial" }, { symbol: "XLE", name: "Energia" }, { symbol: "XLU", name: "Utilities" },
    { symbol: "XLB", name: "Materiais" }, { symbol: "XLRE", name: "Imobiliário" },
  ],
  "Commodities": [
    { symbol: "GC=F", name: "Ouro" }, { symbol: "SI=F", name: "Prata" }, { symbol: "PL=F", name: "Platina" },
    { symbol: "PA=F", name: "Paládio" }, { symbol: "HG=F", name: "Cobre" }, { symbol: "CL=F", name: "Petróleo WTI" },
    { symbol: "BZ=F", name: "Petróleo Brent" }, { symbol: "NG=F", name: "Gás natural" }, { symbol: "RB=F", name: "Gasolina" },
    { symbol: "HO=F", name: "Óleo de aquecimento" }, { symbol: "ZC=F", name: "Milho" }, { symbol: "ZW=F", name: "Trigo" },
    { symbol: "ZS=F", name: "Soja" }, { symbol: "KC=F", name: "Café" }, { symbol: "SB=F", name: "Açúcar" },
    { symbol: "CC=F", name: "Cacau" }, { symbol: "CT=F", name: "Algodão" }, { symbol: "LE=F", name: "Boi gordo" },
  ],
  "Cripto": [
    { symbol: "BTC-USD", name: "Bitcoin" }, { symbol: "ETH-USD", name: "Ethereum" }, { symbol: "SOL-USD", name: "Solana" },
    { symbol: "XRP-USD", name: "XRP" }, { symbol: "BNB-USD", name: "BNB" }, { symbol: "ADA-USD", name: "Cardano" },
    { symbol: "DOGE-USD", name: "Dogecoin" }, { symbol: "AVAX-USD", name: "Avalanche" }, { symbol: "LINK-USD", name: "Chainlink" },
    { symbol: "DOT-USD", name: "Polkadot" }, { symbol: "MATIC-USD", name: "Polygon" }, { symbol: "LTC-USD", name: "Litecoin" },
    { symbol: "BCH-USD", name: "Bitcoin Cash" }, { symbol: "TRX-USD", name: "TRON" }, { symbol: "UNI-USD", name: "Uniswap" },
    { symbol: "SHIB-USD", name: "Shiba Inu" },
  ],
  "Forex": [
    { symbol: "USDBRL=X", name: "USD / BRL (dólar-real)" }, { symbol: "EURUSD=X", name: "EUR / USD" },
    { symbol: "USDJPY=X", name: "USD / JPY" }, { symbol: "GBPUSD=X", name: "GBP / USD" },
    { symbol: "USDCHF=X", name: "USD / CHF" }, { symbol: "AUDUSD=X", name: "AUD / USD" },
    { symbol: "USDCAD=X", name: "USD / CAD" }, { symbol: "NZDUSD=X", name: "NZD / USD" },
    { symbol: "USDMXN=X", name: "USD / MXN" }, { symbol: "USDCNY=X", name: "USD / CNY" },
    { symbol: "USDARS=X", name: "USD / ARS" }, { symbol: "EURBRL=X", name: "EUR / BRL" },
    { symbol: "EURGBP=X", name: "EUR / GBP" }, { symbol: "EURJPY=X", name: "EUR / JPY" },
    { symbol: "USDZAR=X", name: "USD / ZAR" }, { symbol: "USDTRY=X", name: "USD / TRY" },
  ],
};

// Seletor da tela "Ações, ETFs & Commodities" — agrupado (optgroup)
export const ASSET_GROUPS: { label: string; items: SymbolDef[] }[] = [
  { label: "Ações", items: MARKET_GROUPS["Ações"] },
  { label: "Índices US", items: MARKET_GROUPS["Índices US"] },
  { label: "Índices Globais", items: MARKET_GROUPS["Índices Globais"] },
  { label: "ETFs", items: MARKET_GROUPS["ETFs"] },
  { label: "Setores", items: MARKET_GROUPS["Setores"] },
  { label: "Commodities", items: MARKET_GROUPS["Commodities"] },
  { label: "Cripto", items: MARKET_GROUPS["Cripto"] },
  { label: "Forex", items: MARKET_GROUPS["Forex"] },
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

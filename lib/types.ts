// ============================================================
// Shared TypeScript interfaces for Harpian Terminal
// ============================================================

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface CandlesResp {
  symbol: string;
  name: string;
  candles: Candle[];
  volume: { time: number; value: number; up: boolean }[];
  compareLine?: { time: number; value: number }[] | null;
  compareName?: string | null;
  error?: boolean;
}

export interface AssetResp {
  name: string;
  price: number;
  dayPct: number | null;
  ytdPct: number | null;
  yPct: number | null;
  sharpe: number | null;
  maxDD: number | null;
  rsi: number | null;
  w52: { lo: number; hi: number };
}

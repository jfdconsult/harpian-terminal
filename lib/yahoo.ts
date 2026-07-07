// ============================================================
// Yahoo Finance — helper server-side + cálculo de métricas.
// Usado apenas em Route Handlers (server). O browser não fala com o
// Yahoo direto (CORS); o Node busca e repassa. Trocável por FastTrack depois.
// ============================================================

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

export interface Series { t: number[]; close: number[]; }

export async function yahooChart(symbol: string, range = "1y", interval = "1d"): Promise<{ meta: Record<string, unknown>; series: Series }> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
  const r = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
  if (!r.ok) throw new Error(`Yahoo ${symbol} HTTP ${r.status}`);
  const j = await r.json();
  const res = j?.chart?.result?.[0];
  if (!res) throw new Error(`Yahoo ${symbol} sem dados`);
  const rawT: number[] = res.timestamp || [];
  const q = res.indicators?.quote?.[0] || {};
  const adj = res.indicators?.adjclose?.[0]?.adjclose;
  const rawClose: (number | null)[] = adj || q.close || [];
  const t: number[] = [];
  const close: number[] = [];
  for (let i = 0; i < rawT.length; i++) {
    if (rawClose[i] != null && !Number.isNaN(rawClose[i] as number)) {
      t.push(rawT[i]);
      close.push(rawClose[i] as number);
    }
  }
  return { meta: res.meta || {}, series: { t, close } };
}

export interface OHLCSeries { t: number[]; o: number[]; h: number[]; l: number[]; c: number[]; v: number[] }

// OHLC + volume (para candlestick). Aceita range/interval (timeframes).
export async function yahooOHLC(symbol: string, range = "1y", interval = "1d"): Promise<{ meta: Record<string, unknown>; s: OHLCSeries }> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
  const r = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
  if (!r.ok) throw new Error(`Yahoo ${symbol} HTTP ${r.status}`);
  const j = await r.json();
  const res = j?.chart?.result?.[0];
  if (!res) throw new Error(`Yahoo ${symbol} sem dados`);
  const rawT: number[] = res.timestamp || [];
  const q = res.indicators?.quote?.[0] || {};
  const s: OHLCSeries = { t: [], o: [], h: [], l: [], c: [], v: [] };
  for (let i = 0; i < rawT.length; i++) {
    if (q.close?.[i] != null && q.open?.[i] != null) {
      s.t.push(rawT[i]); s.o.push(q.open[i]); s.h.push(q.high?.[i] ?? q.open[i]); s.l.push(q.low?.[i] ?? q.open[i]); s.c.push(q.close[i]); s.v.push(q.volume?.[i] || 0);
    }
  }
  return { meta: res.meta || {}, s };
}

// ---------- Métricas (funções puras) ----------
const last = (a: number[]) => a[a.length - 1];
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / (a.length || 1);
function std(a: number[]) {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
}
export function dailyReturns(close: number[]) {
  const r: number[] = [];
  for (let i = 1; i < close.length; i++) r.push(close[i] / close[i - 1] - 1);
  return r;
}
export function pctFrom(close: number[], idx: number): number | null {
  if (idx < 0 || idx >= close.length) return null;
  return (last(close) / close[idx] - 1) * 100;
}
export function dayPct(close: number[]): number | null {
  if (close.length < 2) return null;
  return (last(close) / close[close.length - 2] - 1) * 100;
}
export function ytdIndex(t: number[]): number {
  if (!t.length) return 0;
  const yr = new Date(last(t) * 1000).getUTCFullYear();
  for (let i = 0; i < t.length; i++) if (new Date(t[i] * 1000).getUTCFullYear() === yr) return i;
  return 0;
}
export function idxDaysAgo(len: number, n: number) { return Math.max(0, len - 1 - n); }
export function sharpe(close: number[], rf = 0.035): number | null {
  const r = dailyReturns(close);
  const sd = std(r);
  if (!r.length || sd === 0) return null;
  return (mean(r) * 252 - rf) / (sd * Math.sqrt(252));
}
export function annualVolPct(close: number[]): number | null {
  const r = dailyReturns(close);
  if (r.length < 2) return null;
  return std(r) * Math.sqrt(252) * 100;
}
export function maxDrawdownPct(close: number[]): number | null {
  if (!close.length) return null;
  let peak = close[0], mdd = 0;
  for (const p of close) { if (p > peak) peak = p; const dd = p / peak - 1; if (dd < mdd) mdd = dd; }
  return mdd * 100;
}
// Sortino: como Sharpe, mas penaliza só a volatilidade de queda (downside deviation).
export function sortino(close: number[], rf = 0.035): number | null {
  const r = dailyReturns(close);
  if (!r.length) return null;
  const downside = r.filter((x) => x < 0);
  if (!downside.length) return null;
  const dd = Math.sqrt(downside.reduce((s, x) => s + x * x, 0) / r.length) * Math.sqrt(252);
  if (dd === 0) return null;
  return (mean(r) * 252 - rf) / dd;
}
// Ulcer Index: raiz quadrada média dos quadrados do drawdown — penaliza profundidade E duração da queda.
export function ulcerIndex(close: number[]): number | null {
  if (!close.length) return null;
  let peak = close[0];
  let sumSq = 0;
  for (const p of close) { if (p > peak) peak = p; const dd = (p / peak - 1) * 100; sumSq += dd * dd; }
  return Math.sqrt(sumSq / close.length);
}
// CAGR anualizado a partir de uma série base-100 (ou qualquer NAV) e nº de anos corridos.
export function cagrPct(close: number[], years: number): number | null {
  if (close.length < 2 || years <= 0) return null;
  const total = last(close) / close[0];
  if (total <= 0) return null;
  return (Math.pow(total, 1 / years) - 1) * 100;
}
// Nº de anos-calendário com retorno negativo, dado t (timestamps) e close alinhados.
export function negativeYears(t: number[], close: number[]): number {
  const byYear = new Map<number, { first: number; last: number }>();
  for (let i = 0; i < t.length; i++) {
    const y = new Date(t[i] * 1000).getUTCFullYear();
    const cur = byYear.get(y);
    if (!cur) byYear.set(y, { first: close[i], last: close[i] });
    else cur.last = close[i];
  }
  let n = 0;
  for (const { first, last: l } of byYear.values()) if (l < first) n++;
  return n;
}
export function rsi(close: number[], period = 14): number | null {
  if (close.length <= period) return null;
  let gain = 0, loss = 0;
  for (let i = close.length - period; i < close.length; i++) {
    const d = close[i] - close[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  if (loss === 0) return 100;
  const rs = gain / period / (loss / period);
  return 100 - 100 / (1 + rs);
}
export function w52(close: number[]) {
  if (!close.length) return { lo: 0, hi: 0 };
  let lo = close[0], hi = close[0];
  for (let i = 1; i < close.length; i++) { if (close[i] < lo) lo = close[i]; if (close[i] > hi) hi = close[i]; }
  return { lo, hi };
}
// Número de Risco (0–100) calibrado ao SPY≈27,6 (vol anual ~16%).
export function riskNumber(close: number[]): number | null {
  const v = annualVolPct(close);
  if (v == null) return null;
  return Math.max(1, Math.min(99, Math.round(v * 1.72)));
}

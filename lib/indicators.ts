// ============================================================
// Indicadores técnicos — portados do motor DSPT (Diogo) do Cockpit.
// GOTCHA: EMA do Diogo é CASCATA com α = 1/d (aumenta atraso), ≠ Mulloy.
// EMA padrão (α = 2/(n+1)) é usada só para osciladores.
// Funções puras, client-safe. Arrays alinhados ao input (null no warmup).
// ============================================================

export type Num = number | null;

// EMA "Euler" do Diogo: α = 1/d
export function emaEuler(values: number[], d: number): number[] {
  if (!values.length) return [];
  const a = 1 / d;
  let e = values[0];
  const out = [e];
  for (let i = 1; i < values.length; i++) { e = a * values[i] + (1 - a) * e; out.push(e); }
  return out;
}
export const demaCascade = (v: number[], d: number) => emaEuler(emaEuler(v, d), d);
export const temaCascade = (v: number[], d: number) => emaEuler(emaEuler(emaEuler(v, d), d), d);

// EMA padrão (α = 2/(n+1)) — para osciladores
export function emaStd(values: number[], n: number): number[] {
  if (!values.length) return [];
  const a = 2 / (n + 1);
  let e = values[0];
  const out = [e];
  for (let i = 1; i < values.length; i++) { e = a * values[i] + (1 - a) * e; out.push(e); }
  return out;
}

export function sma(values: number[], n: number): Num[] {
  const out: Num[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < n - 1) { out.push(null); continue; }
    let s = 0; for (let j = i - n + 1; j <= i; j++) s += values[j];
    out.push(s / n);
  }
  return out;
}

export function bollinger(values: number[], n = 20, k = 2): { mid: Num[]; upper: Num[]; lower: Num[] } {
  const mid = sma(values, n);
  const upper: Num[] = [], lower: Num[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < n - 1) { upper.push(null); lower.push(null); continue; }
    const m = mid[i] as number;
    let sq = 0; for (let j = i - n + 1; j <= i; j++) sq += (values[j] - m) ** 2;
    const sd = Math.sqrt(sq / n);
    upper.push(m + k * sd); lower.push(m - k * sd);
  }
  return { mid, upper, lower };
}

export function rsiSeries(values: number[], period = 14): Num[] {
  const out: Num[] = new Array(values.length).fill(null);
  if (values.length <= period) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) { const d = values[i] - values[i - 1]; if (d >= 0) gain += d; else loss -= d; }
  let ag = gain / period, al = loss / period;
  out[period] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    ag = (ag * (period - 1) + (d > 0 ? d : 0)) / period;
    al = (al * (period - 1) + (d < 0 ? -d : 0)) / period;
    out[i] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  }
  return out;
}

// Momento DSPT: DEMA cascata (α=1/d) do retorno %, × projeção. d=13 (D) ou 37 (J).
export function demaReturns(c: number[], d = 37, projection = 21): Num[] {
  if (c.length < 2) return new Array(c.length).fill(null);
  const ret = [0];
  for (let i = 1; i < c.length; i++) ret.push(c[i - 1] ? ((c[i] - c[i - 1]) / c[i - 1]) * 100 : 0);
  const dem = demaCascade(ret, d);
  return dem.map((x) => +(x * projection).toFixed(3));
}

// Helper: array (com nulls) → pares {time,value} para o lightweight-charts
export function toLine(times: number[], vals: Num[]): { time: number; value: number }[] {
  const out: { time: number; value: number }[] = [];
  for (let i = 0; i < times.length; i++) if (vals[i] != null) out.push({ time: times[i], value: vals[i] as number });
  return out;
}

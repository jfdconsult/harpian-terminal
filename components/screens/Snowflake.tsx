"use client";
import { useEffect, useState } from "react";
import { GOV_API, fmtUSD, fmtPct } from "@/lib/data";
import { publishScreenData } from "@/lib/jim-data";
import { askJim } from "@/lib/jim-ask";
import { getFavorites, toggleFavorite } from "@/lib/favorites";
import { renderMarkdown } from "@/lib/markdown";
import BackToVisao from "../BackToVisao";
import type { ScreenId } from "@/lib/nav";

interface Axis { score: number | null; based_on: Record<string, number | null>; }
type Axes = { value: Axis; future: Axis; past: Axis; health: Axis; dividend: Axis };
interface RawFund {
  symbol: string; name?: string; price?: number; change_pct?: number; market_cap?: number;
  pe?: number; forward_pe?: number; roe?: number; profit_margin?: number; revenue_growth?: number;
  debt_equity?: number; beta?: number; dividend_yield?: number; week52_high?: number; week52_low?: number;
}
interface SnowflakeData {
  symbol: string;
  name?: string;
  source?: string;
  error?: string;
  axes?: Axes;
  raw?: RawFund;
}

const AXIS_ORDER: (keyof Axes)[] = ["value", "future", "past", "health", "dividend"];
const AXIS_LABEL: Record<keyof Axes, string> = { value: "Value", future: "Future", past: "Past", health: "Health", dividend: "Dividend" };
const AXIS_QUESTION: Record<keyof Axes, (score: number | null, symbol: string) => string> = {
  value: (s, sym) => `${sym}'s Value axis is at ${s ?? "—"}/5 (based on P/E). Explain what this score means and whether ${sym} is expensive or cheap right now compared to its sector.`,
  future: (s, sym) => `${sym}'s Future axis is at ${s ?? "—"}/5 (based on revenue growth). What does this indicate about the company's growth outlook?`,
  past: (s, sym) => `${sym}'s Past axis is at ${s ?? "—"}/5 (based on ROE). Is the recent profitability track record strong or weak?`,
  health: (s, sym) => `${sym}'s Health axis is at ${s ?? "—"}/5 (based on debt/equity). Is its financial position solid or risky?`,
  dividend: (s, sym) => `${sym}'s Dividend axis is at ${s ?? "—"}/5. Is ${sym} worth it for someone seeking dividend income?`,
};

function axisColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return "var(--tx3)";
  if (score >= 4) return "#2ECC71";
  if (score >= 2.5) return "#C9A02C";
  if (score >= 1) return "#E67E22";
  return "#E74C3C";
}

function SnowflakeRadar({ axes, symbol }: { axes: Axes; symbol: string }) {
  const n = AXIS_ORDER.length;
  const size = 320;
  const cx = size / 2, cy = size / 2, maxR = 122;
  const angleStep = (2 * Math.PI) / n;
  const gridLevels = [1, 2, 3, 4, 5];

  const points = AXIS_ORDER.map((id, i) => {
    const a = -Math.PI / 2 + i * angleStep;
    const r = ((axes[id].score ?? 0) / 5) * maxR;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", margin: "0 auto" }}>
      {gridLevels.map((lv) => (
        <circle key={lv} cx={cx} cy={cy} r={(lv / 5) * maxR} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={lv === 5 ? 1.5 : 1} />
      ))}
      {AXIS_ORDER.map((id, i) => {
        const a = -Math.PI / 2 + i * angleStep;
        const ex = cx + maxR * Math.cos(a);
        const ey = cy + maxR * Math.sin(a);
        const lx = cx + (maxR + 30) * Math.cos(a);
        const ly = cy + (maxR + 30) * Math.sin(a);
        const score = axes[id].score;
        return (
          <g key={id} style={{ cursor: "pointer" }} onClick={() => askJim(AXIS_QUESTION[id](score, symbol))}>
            <line x1={cx} y1={cy} x2={ex} y2={ey} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill={axisColor(score)} fontSize={12} fontFamily="var(--mono)" fontWeight={700}>
              {AXIS_LABEL[id].toUpperCase()}
            </text>
            <text x={lx} y={ly + 14} textAnchor="middle" dominantBaseline="middle" fill="var(--tx3)" fontSize={10} fontFamily="var(--mono)">
              {score ?? "—"}/5
            </text>
          </g>
        );
      })}
      <polygon points={polygon} fill="rgba(201,160,44,.16)" stroke="var(--gold)" strokeWidth={2.5} strokeLinejoin="round" />
      {points.map((p, i) => {
        const id = AXIS_ORDER[i];
        const score = axes[id].score;
        return (
          <circle key={id} cx={p.x} cy={p.y} r={7} fill={axisColor(score)} stroke="var(--bg1)" strokeWidth={2.5}
            style={{ cursor: "pointer" }} onClick={() => askJim(AXIS_QUESTION[id](score, symbol))} />
        );
      })}
    </svg>
  );
}

// Horizontal bar per axis — a second way of reading the same radar data.
function AxisBarRow({ id, axis, symbol }: { id: keyof Axes; axis: Axis; symbol: string }) {
  const score = axis.score;
  const pct = score !== null ? (score / 5) * 100 : 0;
  const color = axisColor(score);
  return (
    <div
      style={{ cursor: "pointer", padding: "6px 0" }}
      onClick={() => askJim(AXIS_QUESTION[id](score, symbol))}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--tx)" }}>{AXIS_LABEL[id]}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{score ?? "no data"}{score !== null ? "/5" : ""}</span>
      </div>
      <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 5, transition: "width .3s ease" }} />
      </div>
    </div>
  );
}

type FieldKey = keyof Omit<RawFund, "symbol" | "name">;
const FIELD_META: Record<FieldKey, { label: string; fmt: (v: number) => string; question: (v: number, s: string) => string }> = {
  price: { label: "Price", fmt: (v) => "$" + v.toFixed(2), question: (v, s) => `${s}'s current price is $${v.toFixed(2)}. Considering the 52-week range and fundamentals, is this expensive or cheap right now?` },
  change_pct: { label: "Day change", fmt: (v) => (v * 100).toFixed(2) + "%", question: (v, s) => `${s} is moving ${(v * 100).toFixed(2)}% today. Is this meaningful or just short-term noise?` },
  market_cap: { label: "Market Cap", fmt: (v) => fmtUSD(v), question: (v, s) => `${s}'s market cap is ${fmtUSD(v)}. What does this indicate about the company's size and maturity?` },
  pe: { label: "P/E", fmt: (v) => v.toFixed(1) + "x", question: (v, s) => `${s}'s P/E is ${v.toFixed(1)}x. Is this expensive or cheap compared to the sector and the market? What does this multiple say about the company?` },
  forward_pe: { label: "Forward P/E", fmt: (v) => v.toFixed(1) + "x", question: (v, s) => `${s}'s forward P/E is ${v.toFixed(1)}x. Is the market pricing in earnings growth? Is that a good sign?` },
  roe: { label: "ROE", fmt: (v) => fmtPct(v), question: (v, s) => `${s}'s ROE is ${fmtPct(v)}. Is that good or bad compared to the sector average? What does it indicate about the company's efficiency in generating returns?` },
  profit_margin: { label: "Net margin", fmt: (v) => fmtPct(v), question: (v, s) => `${s}'s net margin is ${fmtPct(v)}. Is that healthy for its sector? What does it indicate about pricing power?` },
  revenue_growth: { label: "Revenue Growth", fmt: (v) => fmtPct(v), question: (v, s) => `${s} is growing revenue at ${fmtPct(v)}. Is that strong, weak, or average for this company's stage?` },
  debt_equity: { label: "Debt/Equity", fmt: (v) => v.toFixed(0) + "%", question: (v, s) => `${s}'s debt/equity ratio is ${v.toFixed(0)}%. Is that a worrying or a healthy leverage level?` },
  beta: { label: "Beta", fmt: (v) => v.toFixed(2), question: (v, s) => `${s}'s beta is ${v.toFixed(2)}. What does that say about its volatility relative to the market?` },
  dividend_yield: { label: "Dividend Yield", fmt: (v) => fmtPct(v), question: (v, s) => `${s}'s dividend yield is ${fmtPct(v)}. Is that attractive compared to other income options?` },
  week52_high: { label: "52-wk High", fmt: (v) => "$" + v.toFixed(2), question: (v, s) => `${s}'s 52-week high is $${v.toFixed(2)}. Is the current price close to that or far from it? What does that suggest?` },
  week52_low: { label: "52-wk Low", fmt: (v) => "$" + v.toFixed(2), question: (v, s) => `${s}'s 52-week low is $${v.toFixed(2)}. Does that help frame the current trading range?` },
};
const FIELD_ORDER: FieldKey[] = ["price", "change_pct", "market_cap", "pe", "forward_pe", "roe", "profit_margin", "revenue_growth", "debt_equity", "beta", "dividend_yield", "week52_high", "week52_low"];

// Links each fundamental to the radar axis it feeds (same logic as us_snowflake.py) —
// the tile's color matches the corresponding axis color, visually connecting the two screens.
const FIELD_AXIS: Partial<Record<FieldKey, keyof Axes>> = {
  pe: "value",
  revenue_growth: "future",
  roe: "past",
  debt_equity: "health",
  dividend_yield: "dividend",
};

function FundTile({ field, value, symbol, axisScore }: { field: FieldKey; value: number; symbol: string; axisScore?: number | null }) {
  const meta = FIELD_META[field];
  const [asked, setAsked] = useState(false);
  const accent = axisScore !== undefined ? axisColor(axisScore) : "var(--tx3)";

  function handleClick() {
    askJim(meta.question(value, symbol));
    setAsked(true);
    setTimeout(() => setAsked(false), 1800);
  }

  return (
    <div
      style={{
        position: "relative", padding: "11px 13px", background: "var(--bg2, rgba(255,255,255,.03))",
        border: "1px solid var(--tx3)", borderLeft: `3px solid ${accent}`, cursor: "pointer",
        transition: "border-color .15s, transform .1s",
      }}
      onClick={handleClick}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.borderLeftColor = accent; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--tx3)"; e.currentTarget.style.borderLeftColor = accent; }}
      title="Click for JIM to interpret this data"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 9, color: "var(--tx3)", textTransform: "uppercase", letterSpacing: ".4px" }}>{meta.label}</div>
        {!asked && <i className="ti ti-sparkles" style={{ fontSize: 12, color: "var(--gold)", opacity: 0.7 }} />}
      </div>
      <div style={{ fontSize: 16, color: "var(--tx)", marginTop: 4, fontWeight: 700 }}>{meta.fmt(value)}</div>
      {asked && (
        <div style={{
          position: "absolute", inset: 0, background: "rgba(201,160,44,.14)", display: "flex",
          alignItems: "center", justifyContent: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "var(--gold)",
        }}>
          <i className="ti ti-sparkles" /> Asked JIM
        </div>
      )}
    </div>
  );
}

// ---------- Favorites list (same favorites as Quotes — lib/favorites.ts) ----------
function FavoritesList({ favs, onOpen, onToggleFav }: { favs: string[]; onOpen: (sym: string) => void; onToggleFav: (sym: string) => void }) {
  const [rows, setRows] = useState<SnowflakeData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (favs.length === 0) { setRows([]); return; }
    setLoading(true);
    Promise.all(
      favs.map((sym) =>
        fetch(`${GOV_API}/api/snowflake/${sym}`)
          .then((r) => r.json())
          .catch(() => ({ symbol: sym, error: "offline" }) as SnowflakeData)
      )
    ).then(setRows).finally(() => setLoading(false));
  }, [favs]);

  if (favs.length === 0) {
    return (
      <div className="placeholder" style={{ padding: 40, textAlign: "center" }}>
        <i className="ti ti-star" style={{ fontSize: 30, color: "var(--gold)", opacity: 0.6 }} />
        <b style={{ display: "block", marginTop: 8 }}>Your favorites list is empty</b>
        <div className="muted" style={{ marginTop: 4 }}>Search for a ticker below and click the ★ to follow it — these are the same favorites as Quotes.</div>
      </div>
    );
  }
  if (loading) {
    return <div className="muted" style={{ padding: 24, textAlign: "center" }}>Loading favorites' snowflakes…</div>;
  }
  return (
    <div className="card">
      <h3>★ Favorites ({rows.length})</h3>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead><tr>
            <th style={{ width: 24 }}></th><th>Ticker</th><th>Name</th><th className="num">Price</th><th className="num">Chg%</th>
            <th className="num">Value</th><th className="num">Future</th><th className="num">Past</th><th className="num">Health</th><th className="num">Div.</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.symbol} style={{ cursor: "pointer" }} onClick={() => onOpen(r.symbol)}>
                <td style={{ textAlign: "center" }} onClick={(e) => { e.stopPropagation(); onToggleFav(r.symbol); }}>
                  <span style={{ fontSize: 14, color: "var(--gold)", cursor: "pointer" }} title="Remove from favorites">★</span>
                </td>
                <td style={{ color: "var(--gold)", fontWeight: 700 }}>{r.symbol}</td>
                <td style={{ color: "var(--tx2)" }}>{r.name || "—"}</td>
                {r.error || !r.raw ? (
                  <td className="muted" colSpan={7}>unavailable</td>
                ) : (
                  <>
                    <td className="num">{r.raw.price != null ? "$" + r.raw.price.toFixed(2) : "—"}</td>
                    <td className={"num " + (r.raw.change_pct != null ? (r.raw.change_pct >= 0 ? "pos" : "neg") : "")}>
                      {r.raw.change_pct != null ? (r.raw.change_pct * 100).toFixed(2) + "%" : "—"}
                    </td>
                    <td className="num" style={{ color: axisColor(r.axes?.value.score) }}>{r.axes?.value.score ?? "—"}</td>
                    <td className="num" style={{ color: axisColor(r.axes?.future.score) }}>{r.axes?.future.score ?? "—"}</td>
                    <td className="num" style={{ color: axisColor(r.axes?.past.score) }}>{r.axes?.past.score ?? "—"}</td>
                    <td className="num" style={{ color: axisColor(r.axes?.health.score) }}>{r.axes?.health.score ?? "—"}</td>
                    <td className="num" style={{ color: axisColor(r.axes?.dividend.score) }}>{r.axes?.dividend.score ?? "—"}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="muted mt">Click a row to open the full detail · ★ removes from favorites.</div>
    </div>
  );
}

// ---------- JIM proactive analysis panel (Haiku extracts, Sonnet interprets) ----------
function CompanyAnalysisPanel({ symbol, name, axes, raw, isFav }: { symbol: string; name?: string; axes: Axes; raw: RawFund; isFav: boolean }) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);

  // Favorite → JIM jumps in on its own, proactively. One-off ticker → on demand only (saves tokens).
  useEffect(() => {
    setAnalysis(null);
    setError(null);
    setRequested(isFav);
  }, [symbol, isFav]);

  useEffect(() => {
    if (!requested) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/jim/company-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, name, axes, raw }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.error) setError(d.error);
        else setAnalysis(d.analysis);
      })
      .catch(() => { if (!cancelled) setError("Couldn't reach JIM right now."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [requested, symbol]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="card" style={{ flex: 1, minWidth: 380, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <i className="ti ti-sparkles" style={{ color: "var(--gold)", fontSize: 16 }} />
        <h3 style={{ margin: 0 }}>JIM's Reading</h3>
        {analysis && !loading && (
          <span style={{ fontSize: 9, color: "var(--tx3)", marginLeft: "auto", textTransform: "uppercase", letterSpacing: ".4px" }}>
            Sonnet · updates every 12h
          </span>
        )}
      </div>

      {!requested ? (
        <div className="placeholder" style={{ padding: 30, textAlign: "center" }}>
          <div className="muted" style={{ marginBottom: 12 }}>JIM analyzes favorites automatically. This ticker is a one-off — request the analysis on demand.</div>
          <button className="btn ghost" style={{ padding: "8px 16px", fontSize: 11 }} onClick={() => setRequested(true)}>
            <i className="ti ti-sparkles" /> Ask JIM for analysis
          </button>
        </div>
      ) : loading ? (
        <div style={{ padding: "30px 10px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div className="jim-typing"><span /><span /><span /></div>
          <div className="muted">Hold on while JIM analyzes all the numbers…</div>
        </div>
      ) : error ? (
        <div className="placeholder">{error}</div>
      ) : analysis ? (
        <div style={{ fontSize: 13, lineHeight: 1.75, color: "var(--tx)" }} dangerouslySetInnerHTML={{ __html: renderMarkdown(analysis) }} />
      ) : null}
    </div>
  );
}

// ---------- Single-ticker detail ----------
function SnowflakeDetail({ symbol, isFav, onToggleFav, onBack, go }: { symbol: string; isFav: boolean; onToggleFav: () => void; onBack: () => void; go?: (id: ScreenId, param?: string) => void }) {
  const [data, setData] = useState<SnowflakeData | null>(null);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setData(null);
    setOffline(false);
    fetch(`${GOV_API}/api/snowflake/${symbol.toUpperCase()}`)
      .then((r) => r.json())
      .then((d: SnowflakeData) => setData(d))
      .catch(() => setOffline(true))
      .finally(() => setLoading(false));
  }, [symbol]);

  useEffect(() => {
    if (!data || data.error) return;
    publishScreenData(
      "snowflake",
      `Snowflake for ${data.symbol} (${data.name || "—"}) — visual Value/Future/Past/Health/Dividend score, a heuristic over Yahoo Finance fundamentals.`,
      { symbol: data.symbol, axes: data.axes, raw: data.raw },
      {
        briefing: `You're looking at ${data.symbol}'s snowflake. It isn't an HCE signal — it's an illustrative heuristic. Click any data point for me to interpret it.`,
        suggestions: [`Why is ${data.symbol}'s Value axis low?`, "Compare this snowflake with another ticker", `Is it worth investing in ${data.symbol} right now?`],
      }
    );
  }, [data]);

  return (
    <div className="screen">
      <div className="crumb"><b style={{ color: "var(--tx2)" }}>{symbol}</b><BackToVisao go={go} /></div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button className="btn ghost" style={{ padding: "5px 12px", fontSize: 11 }} onClick={onBack}>
          <i className="ti ti-arrow-left" /> Favorites
        </button>
        <div className="h1" style={{ marginBottom: 0 }}>{symbol}</div>
        {isFav ? (
          <span style={{ fontSize: 20, color: "var(--gold)", cursor: "pointer" }} onClick={onToggleFav} title="Remove from favorites">★</span>
        ) : (
          <i className="ti ti-star" style={{ fontSize: 20, color: "var(--tx3)", cursor: "pointer" }} onClick={onToggleFav} title="Add to favorites" />
        )}
      </div>
      <div className="sub">Simply Wall St equivalent · Value/Future/Past/Health/Dividend in a single visual chart — heuristic, not an HCE signal. Click any point on the radar or data below for JIM to interpret.</div>

      {loading ? (
        <div className="muted" style={{ padding: 24, textAlign: "center" }}>Loading {symbol}…</div>
      ) : offline ? (
        <div className="placeholder">gov-data API offline. Run <b>python api_server.py</b> (port 8877) to see real data.</div>
      ) : data?.error ? (
        <div className="placeholder">{data.error}</div>
      ) : data?.axes && data.raw ? (
        <>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "stretch", marginTop: 14, marginBottom: 14 }}>
            <div className="card" style={{ padding: "18px 20px", width: 400, flexShrink: 0 }}>
              <div style={{ color: "var(--tx2)", fontSize: 13, marginBottom: 12 }}>{data.name}</div>
              <SnowflakeRadar axes={data.axes} symbol={data.symbol} />
              <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 14 }}>
                <div style={{ fontSize: 9, color: "var(--tx3)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>Second reading — same scores as bars</div>
                {AXIS_ORDER.map((id) => (
                  <AxisBarRow key={id} id={id} axis={data.axes![id]} symbol={data.symbol} />
                ))}
                <div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 10 }}>{data.source}</div>
              </div>
            </div>

            <CompanyAnalysisPanel symbol={data.symbol} name={data.name} axes={data.axes} raw={data.raw} isFav={isFav} />
          </div>

          <div className="card">
            <h3>Fundamentals (Yahoo Finance) <span style={{ color: "var(--tx3)", fontWeight: 400 }}>— click any one for JIM to interpret</span></h3>
            <div className="grid g4" style={{ marginTop: 10 }}>
              {FIELD_ORDER.filter((f) => data.raw![f] !== null && data.raw![f] !== undefined).map((f) => {
                const axisKey = FIELD_AXIS[f];
                const axisScore = axisKey ? data.axes![axisKey].score : undefined;
                return <FundTile key={f} field={f} value={data.raw![f] as number} symbol={data.symbol} axisScore={axisScore} />;
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

// ---------- Main screen: opens on favorites, manual search for a new ticker ----------
export default function Snowflake({ symbol, go }: { symbol?: string; go?: (id: ScreenId, param?: string) => void }) {
  const [favs, setFavs] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(symbol || null);
  const [input, setInput] = useState("");

  useEffect(() => { setFavs(getFavorites()); }, []);
  useEffect(() => { if (symbol) setSelected(symbol); }, [symbol]);

  function toggleFav(sym: string) {
    setFavs(toggleFavorite(sym));
  }

  function openSearch() {
    const t = input.trim().toUpperCase();
    if (t) { setSelected(t); setInput(""); }
  }

  if (selected) {
    return (
      <SnowflakeDetail
        symbol={selected}
        isFav={favs.includes(selected)}
        onToggleFav={() => toggleFav(selected)}
        onBack={() => setSelected(null)}
        go={go}
      />
    );
  }

  return (
    <div className="screen">
      <div className="crumb"><BackToVisao go={go} /></div>
      <div className="h1">Snowflake</div>
      <div className="sub">Simply Wall St equivalent · Always opens with your favorites (same as Quotes) — search a new ticker below to view it or start following it.</div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "14px 0" }}>
        <span className="flabel">Search ticker:</span>
        <input
          className="fsel" style={{ width: 140, fontSize: 12, padding: "6px 10px", textTransform: "uppercase" }}
          value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. TSLA"
          onKeyDown={(e) => { if (e.key === "Enter") openSearch(); }}
        />
        <button className="btn ghost" style={{ padding: "6px 14px", fontSize: 11 }} onClick={openSearch} disabled={!input.trim()}>
          Search
        </button>
      </div>

      <FavoritesList favs={favs} onOpen={setSelected} onToggleFav={toggleFav} />
    </div>
  );
}

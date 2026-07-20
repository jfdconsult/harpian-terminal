"use client";
import { useEffect, useState } from "react";
import { fetchSnapshot, type RegimeState } from "@/lib/snapshot";
import { fetchXri, type XriView } from "@/lib/xri";
import { GOV_API } from "@/lib/data";
import { getFavorites } from "@/lib/favorites";
import { pctText, pctClass, numShort, num } from "@/lib/format";
import { publishScreenData } from "@/lib/jim-data";
import { askJim } from "@/lib/jim-ask";
import { buildMarketAnalysis, analysisToBriefing, type DnaRaw } from "@/lib/jim-market-analysis";
import XriGauge from "../XriGauge";
import type { ScreenId } from "@/lib/nav";
import type { AssetResp } from "@/lib/types";

// ============================================================
// MARKET OVERVIEW — the SUMMARY. Answers "how's the market doing today?"
// at a glance, no scrolling.
//
// Design rules underpinning this screen:
//  · Krug (billboard): the manager scans, doesn't read. Zero discursive text here.
//  · Von Restorff: ONE highlighted element — the verdict. If everything stands out, nothing does.
//  · Miller (chunking): 4 blocks, not continuous prose.
//  · Tesler: complexity is absorbed by the system (color + state + 1 anchor
//    number), not offloaded to the user as a paragraph.
//  · Sapolsky: in RISK-OFF the manager is under stress — amygdala active, reasoning
//    hijacked. That's why there's an ACTION line: under stress people process
//    instructions, not analysis.
//  · Norman (progressive disclosure): the "why" lives on each indicator's own screen.
// ============================================================

const REGIME_LABEL: Record<string, string> = { BULL: "RISK-ON", CAUTELA: "CAUTION", NEUTRO: "NEUTRAL", BEAR: "RISK-OFF" };
// Red → green order, left to right (same convention as the XRI gauge).
const ARI_ZONES: { key: RegimeState; label: string; color: string }[] = [
  { key: "BEAR", label: "RISK-OFF", color: "#E74C3C" },
  { key: "CAUTELA", label: "CAUTION", color: "#E67E22" },
  { key: "NEUTRO", label: "NEUTRAL", color: "#C9A02C" },
  { key: "BULL", label: "RISK-ON", color: "#2ECC71" },
];

const INDEX_SYMBOLS = ["^GSPC", "^IXIC", "^DJI", "^RUT", "^VIX", "^TNX"];
const INDEX_NAME: Record<string, string> = {
  "^GSPC": "S&P 500", "^IXIC": "Nasdaq", "^DJI": "Dow Jones",
  "^RUT": "Russell 2000", "^VIX": "VIX", "^TNX": "10Y Treasury",
};

interface Quote { symbol: string; price?: number; dayPct?: number | null; ytdPct?: number | null; error?: boolean }
interface SnowAxes { value: number | null; future: number | null; past: number | null; health: number | null; dividend: number | null }
interface FavRow { symbol: string; change_pct?: number | null; axes?: SnowAxes; error?: string }

function axisColor(s: number | null | undefined): string {
  if (s == null) return "var(--tx3)";
  if (s >= 4) return "#2ECC71";
  if (s >= 2.5) return "#C9A02C";
  if (s >= 1) return "#E67E22";
  return "#E74C3C";
}

// Common header for the 4 blocks — same format, same position (Jakob's Law: the eye
// learns the pattern once and reuses it across all four).
function CardHead({ label, tag, tagColor, arrow }: { label: string; tag?: string; tagColor?: string; arrow?: boolean }) {
  return (
    <div className="flex between" style={{ alignItems: "center", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--tx3)", fontFamily: "var(--mono)", letterSpacing: ".08em" }}>{label}</span>
        {tag && (
          <span style={{
            fontSize: 9, fontWeight: 700, fontFamily: "var(--mono)", padding: "1px 6px",
            borderRadius: 3, background: `${tagColor}18`, color: tagColor,
          }}>{tag}</span>
        )}
      </div>
      {arrow && <i className="ti ti-arrow-right" style={{ fontSize: 12, opacity: 0.35 }} />}
    </div>
  );
}

// 1-line footer: the single most important fact for that indicator. Never more than that.
function CardFoot({ text }: { text: string }) {
  return (
    <div style={{
      fontSize: 11, color: "var(--tx2)", lineHeight: 1.45, marginTop: "auto", paddingTop: 8,
      borderTop: "1px solid var(--line)",
      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
    }}>{text}</div>
  );
}

export default function MercadoVisao({ go }: { go?: (id: ScreenId, param?: string) => void }) {
  const [regime, setRegime] = useState<RegimeState>("BULL");
  const [asOf, setAsOf] = useState("");
  const [asset, setAsset] = useState<AssetResp | null>(null);
  const [xri, setXri] = useState<XriView>({ ok: false });
  const [dna, setDna] = useState<DnaRaw | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [favs, setFavs] = useState<FavRow[]>([]);

  useEffect(() => {
    fetchSnapshot().then((s) => { if (s.ok && s.regime) { setRegime(s.regime.state); setAsOf(s.as_of || ""); } });
    fetch(`/api/asset?symbol=${encodeURIComponent("^GSPC")}`).then(r => r.json()).then(j => { if (!j.error) setAsset(j); }).catch(() => {});
    fetchXri().then(setXri);
    fetch(`${GOV_API}/api/market-dna`).then(r => r.json()).then((d: DnaRaw) => setDna(d)).catch(() => {});
    fetch(`/api/quotes?symbols=${encodeURIComponent(INDEX_SYMBOLS.join(","))}`)
      .then(r => r.json()).then((d: Quote[]) => setQuotes(d)).catch(() => {});
  }, []);

  useEffect(() => {
    const symbols = getFavorites();
    if (!symbols.length) { setFavs([]); return; }
    Promise.all(
      symbols.slice(0, 6).map((sym) =>
        fetch(`${GOV_API}/api/snowflake/${sym}`).then(r => r.json())
          .then((d) => ({
            symbol: sym, change_pct: d.raw?.change_pct,
            axes: d.axes ? {
              value: d.axes.value?.score ?? null, future: d.axes.future?.score ?? null,
              past: d.axes.past?.score ?? null, health: d.axes.health?.score ?? null,
              dividend: d.axes.dividend?.score ?? null,
            } : undefined,
            error: d.error,
          } as FavRow))
          .catch(() => ({ symbol: sym, error: "offline" } as FavRow))
      )
    ).then(setFavs);
  }, []);

  const a = buildMarketAnalysis(regime, asset, xri, dna);
  const ariBlock = a.blocks.find(b => b.key === "ari");
  const xriBlock = a.blocks.find(b => b.key === "xri");
  const dnaBlock = a.blocks.find(b => b.key === "dna");
  const validFavs = favs.filter(f => !f.error);

  // Best and worst DNA layer — enough for the summary; the full radar
  // lives on the Market DNA screen.
  const L = dna?.layers;
  const vix = L?.volatility?.data?.vix;
  const sent = L?.sentiment?.data;
  const brd = L?.breadth?.data;
  const macro = L?.macro?.data;

  useEffect(() => {
    publishScreenData("mercado-visao",
      "Market Overview (summary): ARI (internal risk), XRI (external risk), Market DNA and favorites — state of each, without detail.",
      { ari: REGIME_LABEL[regime], xri: { score: xri.score, state: xri.state, drivers: xri.drivers }, dna: dna?.layers, favoritos: validFavs },
      {
        briefing: analysisToBriefing(a),
        suggestions: ["Why is the regime like this?", "Is the risk domestic or external?", "What should I do with the portfolio now?"],
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regime, xri, dna, favs.length]);

  return (
    <div className="screen" style={{ overflow: "hidden" }}>

      <div className="flex between" style={{ alignItems: "baseline", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <div className="h1" style={{ margin: 0 }}>Market Overview</div>
          <span className="muted" style={{ fontSize: 10 }}>Today&apos;s summary{asOf && <> · {asOf}</>}</span>
        </div>
        <button
          onClick={() => askJim("Give me the full read on the market today: why are ARI and XRI at these levels, what changed, the drivers, and the portfolio impact.")}
          style={{
            fontFamily: "var(--mono)", fontSize: 10, padding: "4px 10px", borderRadius: 5, cursor: "pointer",
            border: "1px solid rgba(201,160,44,.4)", background: "rgba(201,160,44,.12)", color: "var(--gold)",
          }}>
          <i className="ti ti-sparkles" style={{ fontSize: 11, marginRight: 4 }} />Ask JIM
        </button>
      </div>

      {/* ── VERDICT — the screen's only highlighted element (Von Restorff) ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", marginBottom: 10,
        borderRadius: 8, background: `${a.headlineColor}12`, border: `1px solid ${a.headlineColor}44`,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: `${a.headlineColor}22`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <i className="ti ti-shield-exclamation" style={{ fontSize: 18, color: a.headlineColor }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: a.headlineColor, lineHeight: 1.3 }}>{a.headline}</div>
          <div style={{ fontSize: 12.5, color: "var(--tx2)", marginTop: 2 }}>
            <b style={{ color: "var(--tx)" }}>What to do:</b> {a.acao}
          </div>
        </div>
        {a.atencao.length > 0 && (
          <div style={{ marginLeft: "auto", flexShrink: 0, textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--mono)", color: "#E67E22", lineHeight: 1 }}>{a.atencao.length}</div>
            <div style={{ fontSize: 9, color: "var(--tx3)", fontFamily: "var(--mono)" }}>ALERTS</div>
          </div>
        )}
      </div>

      {/* ── 4 STATE BLOCKS (Miller: chunks, not prose) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>

        {/* 1 — INTERNAL RISK (ARI) */}
        <div className="card" style={{ padding: "12px 14px", cursor: "pointer", display: "flex", flexDirection: "column" }} onClick={() => go?.("regime")}>
          <CardHead label="INTERNAL RISK" tag="ARI" tagColor="#4A90D9" arrow />
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--mono)", color: ARI_ZONES.find(z => z.key === regime)?.color, lineHeight: 1.1 }}>
            {REGIME_LABEL[regime]}
          </div>
          {/* 4 zones always visible, inactive ones dimmed (same pattern as the XRI gauge) */}
          <div style={{ display: "flex", gap: 3, margin: "8px 0 6px" }}>
            {ARI_ZONES.map((z) => {
              const on = z.key === regime;
              return (
                <div key={z.key} style={{ flex: 1 }}>
                  <div style={{ height: 5, borderRadius: 2, background: z.color, opacity: on ? 1 : 0.18 }} />
                  <div style={{
                    fontSize: 7.5, fontFamily: "var(--mono)", textAlign: "center", marginTop: 3,
                    color: on ? z.color : "var(--tx3)", opacity: on ? 1 : 0.45, fontWeight: on ? 700 : 400,
                  }}>{z.label}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 8px", marginBottom: 6 }}>
            <div><span style={{ fontSize: 9, color: "var(--tx3)" }}>S&P 500</span><div style={{ fontSize: 13, fontWeight: 700 }}>{numShort(asset?.price)}</div></div>
            <div><span style={{ fontSize: 9, color: "var(--tx3)" }}>Today</span><div className={pctClass(asset?.dayPct)} style={{ fontSize: 13, fontWeight: 700 }}>{pctText(asset?.dayPct)}</div></div>
            <div><span style={{ fontSize: 9, color: "var(--tx3)" }}>YTD</span><div className={pctClass(asset?.ytdPct)} style={{ fontSize: 13, fontWeight: 700 }}>{pctText(asset?.ytdPct)}</div></div>
            <div><span style={{ fontSize: 9, color: "var(--tx3)" }}>RSI</span><div style={{ fontSize: 13, fontWeight: 700, color: (asset?.rsi ?? 50) > 70 ? "var(--red)" : (asset?.rsi ?? 50) < 30 ? "var(--green)" : "var(--tx)" }}>{asset?.rsi != null ? num(asset.rsi, 0) : "—"}</div></div>
          </div>
          <CardFoot text={ariBlock?.resumo || "—"} />
        </div>

        {/* 2 — EXTERNAL RISK (XRI) */}
        <div className="card" style={{ padding: "12px 14px", cursor: "pointer", display: "flex", flexDirection: "column" }} onClick={() => go?.("xri")}>
          <CardHead label="EXTERNAL RISK" tag="XRI" tagColor="#E67E22" arrow />
          {xri.ok && xri.score != null && xri.state ? (
            <>
              <div style={{ margin: "-6px 0 -10px" }}>
                <XriGauge score={xri.score} state={xri.state} />
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 800, fontFamily: "var(--mono)", color: xri.state ? undefined : "var(--tx2)" }}>{xri.state}</span>
                <span className="muted" style={{ fontSize: 10 }}>{xri.direction} · confidence {xri.confidence_pct}%</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 6 }}>
                {(xri.drivers || []).slice(0, 3).map((d) => (
                  <span key={d.country} style={{
                    fontSize: 9.5, fontFamily: "var(--mono)", padding: "2px 6px", borderRadius: 3,
                    background: "rgba(230,126,34,.12)", color: "#E67E22",
                  }}>{d.country} {d.pct}%</span>
                ))}
              </div>
              <CardFoot text={xriBlock?.resumo || "—"} />
            </>
          ) : (
            <div className="muted" style={{ fontSize: 11, padding: "20px 0", textAlign: "center" }}>XRI unavailable</div>
          )}
        </div>

        {/* 3 — INTELLIGENCE (Market DNA) */}
        <div className="card" style={{ padding: "12px 14px", cursor: "pointer", display: "flex", flexDirection: "column" }} onClick={() => go?.("market-dna")}>
          <CardHead label="INTELLIGENCE" tag="DNA" tagColor="#7B68EE" arrow />
          {L ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 8px", marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 9, color: "var(--tx3)" }}>VIX</span>
                  <div style={{ fontSize: 17, fontWeight: 800, fontFamily: "var(--mono)", color: (vix?.current ?? 20) < 20 ? "#2ECC71" : "#E74C3C" }}>
                    {vix?.current != null ? vix.current.toFixed(1) : "—"}
                  </div>
                  <span style={{ fontSize: 8.5, color: "var(--tx3)" }}>IV rank {vix?.iv_rank != null ? `${vix.iv_rank.toFixed(0)}%` : "—"}</span>
                </div>
                <div>
                  <span style={{ fontSize: 9, color: "var(--tx3)" }}>Fear &amp; Greed</span>
                  <div style={{ fontSize: 17, fontWeight: 800, fontFamily: "var(--mono)", color: (sent?.score ?? 50) < 45 ? "#E67E22" : (sent?.score ?? 50) > 70 ? "#E74C3C" : "#C9A02C" }}>
                    {sent?.score != null ? sent.score.toFixed(0) : "—"}
                  </div>
                  <span style={{ fontSize: 8.5, color: "var(--tx3)" }}>{sent?.rating || "—"}</span>
                </div>
                <div>
                  <span style={{ fontSize: 9, color: "var(--tx3)" }}>Breadth</span>
                  <div style={{ fontSize: 17, fontWeight: 800, fontFamily: "var(--mono)", color: (brd?.pct_above_200ma ?? 50) > 60 ? "#2ECC71" : "#E67E22" }}>
                    {brd?.pct_above_200ma != null ? `${brd.pct_above_200ma.toFixed(0)}%` : "—"}
                  </div>
                  <span style={{ fontSize: 8.5, color: "var(--tx3)" }}>above MA200</span>
                </div>
                <div>
                  <span style={{ fontSize: 9, color: "var(--tx3)" }}>Credit</span>
                  <div style={{ fontSize: 17, fontWeight: 800, fontFamily: "var(--mono)", color: macro?.credit_signal === "Tight" ? "#2ECC71" : "#E67E22" }}>
                    {macro?.credit_spread != null ? macro.credit_spread.toFixed(2) : "—"}
                  </div>
                  <span style={{ fontSize: 8.5, color: "var(--tx3)" }}>{macro?.credit_signal || "—"} · curve {macro?.yield_curve_signal || "—"}</span>
                </div>
              </div>
              <CardFoot text={dnaBlock?.resumo || "—"} />
            </>
          ) : (
            <div className="muted" style={{ fontSize: 11, padding: "20px 0", textAlign: "center" }}>gov-data offline (8877)</div>
          )}
        </div>

        {/* 4 — INDICES */}
        <div className="card" style={{ padding: "12px 14px", cursor: "pointer", display: "flex", flexDirection: "column" }} onClick={() => go?.("cotacoes")}>
          <CardHead label="INDICES" arrow />
          {quotes.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {quotes.filter(q => !q.error).map((q) => (
                <div key={q.symbol} className="flex between" style={{ alignItems: "baseline" }}>
                  <span style={{ fontSize: 11, color: "var(--tx2)" }}>{INDEX_NAME[q.symbol] || q.symbol}</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--mono)" }}>{numShort(q.price)}</span>
                    <span className={pctClass(q.dayPct)} style={{ fontSize: 10.5, fontFamily: "var(--mono)", width: 46, textAlign: "right" }}>{pctText(q.dayPct)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted" style={{ fontSize: 11, padding: "20px 0", textAlign: "center" }}>loading…</div>
          )}
          <CardFoot text="Open Quotes to build your favorites list." />
        </div>
      </div>

      {/* ── BOTTOM STRIP: alerts (what requires attention) + favorites ── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
        <div className="card" style={{ padding: "10px 14px", borderColor: "rgba(230,126,34,.28)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#E67E22", fontFamily: "var(--mono)", letterSpacing: ".06em", marginBottom: 6 }}>
            <i className="ti ti-alert-triangle" style={{ fontSize: 12, marginRight: 5 }} />
            REQUIRES ATTENTION — ONLY APPEARS WHEN INDICATORS CROSS
          </div>
          {a.atencao.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 14px" }}>
              {a.atencao.slice(0, 4).map((t, i) => (
                <div key={i} style={{
                  fontSize: 11, color: "var(--tx2)", lineHeight: 1.45, paddingLeft: 8,
                  borderLeft: "2px solid rgba(230,126,34,.35)",
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                }} title={t}>{t}</div>
              ))}
            </div>
          ) : (
            <div className="muted" style={{ fontSize: 11 }}>Nothing crossing indicators today.</div>
          )}
        </div>

        <div className="card" style={{ padding: "10px 14px", cursor: "pointer" }} onClick={() => go?.("snowflake")}>
          <CardHead label="YOUR FAVORITES" arrow />
          {validFavs.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {validFavs.slice(0, 4).map((f) => {
                const worst = f.axes ? Math.min(...Object.values(f.axes).filter((v): v is number => v != null)) : null;
                return (
                  <div key={f.symbol} className="flex between" style={{ alignItems: "baseline" }}>
                    <span style={{ fontSize: 11, color: "var(--gold)", fontWeight: 600 }}>{f.symbol}</span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span className={pctClass(f.change_pct)} style={{ fontSize: 10.5, fontFamily: "var(--mono)" }}>
                        {pctText(f.change_pct != null ? f.change_pct * 100 : null)}
                      </span>
                      <span style={{ fontSize: 10, fontFamily: "var(--mono)", color: axisColor(worst), width: 44, textAlign: "right" }}>
                        {worst != null ? `worst ${worst}/5` : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty state showing what WILL be here, not what's missing (Greene) */
            <div style={{ fontSize: 11, color: "var(--tx3)", lineHeight: 1.5, paddingTop: 4 }}>
              Star ★ items in Quotes or Snowflake and I&apos;ll start tracking your assets here — daily change and each one&apos;s weakest axis.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

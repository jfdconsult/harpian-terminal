"use client";
import { useEffect, useState } from "react";
import { publishScreenData } from "@/lib/jim-data";

// ── Verified Opacity Protocol — client view ──────────────────────────────────
// Four sections, top-to-bottom:
//   1) The Vault      — aggregate proof of skin-in-the-game (never tickers)
//   2) The Showcase   — 3 closed positions, 4-week embargo, weekly rotation
//   3) Momentum Weather — regime + defense weight (no factor decomposition)
//   4) Do Not Touch   — 5 worst SPX500 momentum + 2 sector alerts
//
// All disclosure rules live server-side at /api/etp-vault. This component is a
// pure renderer — never mutate or store the payload beyond the current session.

interface Vault {
  n_positions: number; n_hedges: number; gross_exposure_pct: number; net_exposure_pct: number;
  beta: number; avg_holding_days: number; monthly_turnover_pct: number; hit_rate_90d_pct: number; aum_alloc_pct: number;
}
interface ShowcaseItem {
  ticker: string; sector: string; entry: string; exit: string; holdingDays: number;
  momentumEntry: number; retPct: number; retVsSpx: number; thesis: string;
}
interface Weather {
  regime: string; regime_label: string; defense_pct: number; streak_days: number;
  last_change: { date: string; from: string; to: string; magnitude_sigma: number };
}
interface DntStock { ticker: string; name: string; sector: string; momentum: number; tag: string }
interface DntSector { sector: string; momentum: number; tag: string }
interface Payload {
  ok: boolean; as_of: string; next_rotation: string;
  protocol: { name: string; version: string; showcase_embargo_days: number; showcase_size: number; dnt_universe: string; rotation_ritual: string };
  vault: Vault; showcase: ShowcaseItem[]; weather: Weather; dnt: { stocks: DntStock[]; sectors: DntSector[] };
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
const pct = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(1) + "%";

const REGIME_COLOR: Record<string, string> = {
  BULL: "var(--green)", NEUTRO: "#4A90D9", CAUTELA: "var(--orange)", BEAR: "var(--red)",
};

export default function TheVault() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/etp-vault", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: Payload) => {
        if (!j.ok) { setErr("Vault temporarily unavailable"); setLoading(false); return; }
        setData(j); setLoading(false);
      })
      .catch(() => { setErr("Vault temporarily unavailable"); setLoading(false); });
  }, []);

  // Publish to JIM — result only, never the disclosure rule mechanics
  useEffect(() => {
    if (!data) return;
    publishScreenData(
      "fundo",
      "The Vault tab — Verified Opacity Protocol. Aggregates of the ETP (skin-in-the-game proof), 3 sample closed positions with 4-week embargo, regime weather, and Do Not Touch list (5 worst SPX500 momentum + 2 sectors). Client-safe filter — never reveals active positions, formulas, or the selection universe of the ETP itself.",
      {
        vault: data.vault,
        showcase: data.showcase.map((s) => ({ ticker: s.ticker, sector: s.sector, holdingDays: s.holdingDays, retornoPct: s.retPct, vsSpx: s.retVsSpx })),
        weather: data.weather,
        doNotTouch: data.dnt,
        proximaRotacao: data.next_rotation,
      },
      {
        briefing:
          `You're viewing **The Vault** — verified opacity view of the ETP. ` +
          `Aggregate: ${data.vault.n_positions} active positions, ${data.vault.aum_alloc_pct}% invested, avg holding ${data.vault.avg_holding_days} days. ` +
          `3 closed sample positions displayed with a 4-week embargo. ` +
          `Regime **${data.weather.regime_label}**, defense at ${data.weather.defense_pct}%. ` +
          `Do Not Touch: 5 worst SPX500 stocks + 2 fragile sectors.`,
        suggestions: [
          "Why do we only see 3 positions and not the whole book?",
          "How is the Do Not Touch list built?",
          "What does the 4-week embargo protect?",
        ],
      }
    );
  }, [data]);

  if (loading) return <div className="card"><div className="muted" style={{ padding: 40, textAlign: "center" }}>Loading The Vault…</div></div>;
  if (err || !data) return <div className="card"><div className="placeholder"><i className="ti ti-lock" /><b>The Vault is temporarily unavailable</b><div className="muted mt">Try again in a moment.</div></div></div>;

  const v = data.vault;
  const w = data.weather;
  const regimeColor = REGIME_COLOR[w.regime] || "var(--tx)";

  return (
    <>
      {/* Rotation chip moved to the tabs bar in Fundo.tsx (right slot) to save vertical space. */}

      {/* ═══════════ 1. THE VAULT ═══════════ */}
      <div className="card mb">
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}><i className="ti ti-shield-lock" />The Vault — what&apos;s inside, not what</h3>
          <div className="muted" style={{ lineHeight: 1.55, fontSize: 12 }}>Aggregate state of the ETP right now. Tickers stay in the cofre.</div>
        </div>
        <div className="grid g4" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
          <div className="card" style={{ textAlign: "center", padding: 14 }}>
            <div className="big" style={{ fontSize: 26, color: "var(--gold)" }}>{v.n_positions}</div>
            <div style={{ fontSize: 10, color: "var(--tx2)", marginTop: 4, fontWeight: 600 }}>ACTIVE LONGS</div>
            <div className="muted" style={{ fontSize: 10 }}>+ {v.n_hedges} hedges</div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: 14 }}>
            <div className="big" style={{ fontSize: 26, color: "var(--gold)" }}>{v.aum_alloc_pct}%</div>
            <div style={{ fontSize: 10, color: "var(--tx2)", marginTop: 4, fontWeight: 600 }}>AUM INVESTED</div>
            <div className="muted" style={{ fontSize: 10 }}>net {v.net_exposure_pct}%</div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: 14 }}>
            <div className="big" style={{ fontSize: 26, color: "var(--gold)" }}>{v.beta.toFixed(2)}</div>
            <div style={{ fontSize: 10, color: "var(--tx2)", marginTop: 4, fontWeight: 600 }}>PORTFOLIO BETA</div>
            <div className="muted" style={{ fontSize: 10 }}>vs S&amp;P 500</div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: 14 }}>
            <div className="big" style={{ fontSize: 26, color: "var(--gold)" }}>{v.avg_holding_days}d</div>
            <div style={{ fontSize: 10, color: "var(--tx2)", marginTop: 4, fontWeight: 600 }}>AVG HOLDING</div>
            <div className="muted" style={{ fontSize: 10 }}>turnover {v.monthly_turnover_pct}%/mo</div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: 14 }}>
            <div className="big" style={{ fontSize: 26, color: "var(--green)" }}>{v.hit_rate_90d_pct}%</div>
            <div style={{ fontSize: 10, color: "var(--tx2)", marginTop: 4, fontWeight: 600 }}>HIT RATE 90d</div>
            <div className="muted" style={{ fontSize: 10 }}>positions closed positive</div>
          </div>
        </div>
      </div>

      {/* ═══════════ 2. THE SHOWCASE ═══════════ */}
      <div className="card mb">
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}><i className="ti ti-award" />The Showcase — 3 closed positions · 4-week embargo</h3>
          <div className="muted" style={{ lineHeight: 1.55, fontSize: 12 }}>
            Real trades the ETP closed. Sampled to 3, rotated weekly. When a position leaves this showcase, it is not archived.
          </div>
        </div>
        <div className="grid g4" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          {data.showcase.map((s) => (
            <div key={s.ticker + s.entry} className="card" style={{ padding: 16, borderColor: "rgba(201,160,44,.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "var(--gold)" }}>{s.ticker}</div>
                  <div className="muted" style={{ fontSize: 11 }}>{s.sector}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="big" style={{ fontSize: 20, color: s.retPct >= 0 ? "var(--green)" : "var(--red)" }}>{pct(s.retPct)}</div>
                  <div className="muted" style={{ fontSize: 10 }}>vs S&amp;P {pct(s.retVsSpx)}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--tx2)", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid var(--line2)" }}>
                <span><i className="ti ti-clock" style={{ marginRight: 4, color: "var(--tx3)" }} />{s.holdingDays}d</span>
                <span><i className="ti ti-flame" style={{ marginRight: 4, color: "var(--tx3)" }} />mom entry {s.momentumEntry}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--tx3)", marginBottom: 6 }}>
                {fmtDate(s.entry)} → {fmtDate(s.exit)}
              </div>
              <div style={{ fontSize: 12, color: "var(--tx)", lineHeight: 1.55, fontStyle: "italic" }}>
                &ldquo;{s.thesis}&rdquo;
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════ 3. MOMENTUM WEATHER ═══════════ */}
      <div className="card mb">
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}><i className="ti ti-temperature" />Momentum Weather — the system&apos;s stance</h3>
          <div className="muted" style={{ lineHeight: 1.55, fontSize: 12 }}>
            State + posture. The trigger stack is proprietary and stays in the Cockpit.
          </div>
        </div>
        <div className="grid g4" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
          <div className="card" style={{ textAlign: "center", padding: 14, borderColor: regimeColor + "44" }}>
            <div className="big" style={{ fontSize: 22, color: regimeColor }}>{w.regime_label}</div>
            <div style={{ fontSize: 10, color: "var(--tx2)", marginTop: 4, fontWeight: 600 }}>REGIME</div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: 14 }}>
            <div className="big" style={{ fontSize: 22, color: "var(--tx)" }}>{w.defense_pct}%</div>
            <div style={{ fontSize: 10, color: "var(--tx2)", marginTop: 4, fontWeight: 600 }}>DEFENSE / CASH</div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: 14 }}>
            <div className="big" style={{ fontSize: 22, color: "var(--tx)" }}>{w.streak_days}d</div>
            <div style={{ fontSize: 10, color: "var(--tx2)", marginTop: 4, fontWeight: 600 }}>REGIME STREAK</div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: 14 }}>
            <div style={{ fontSize: 13, color: "var(--tx)", fontWeight: 600 }}>{w.last_change.from} → {w.last_change.to}</div>
            <div style={{ fontSize: 10, color: "var(--tx2)", marginTop: 4, fontWeight: 600 }}>LAST FLIP · {fmtDate(w.last_change.date)}</div>
            <div className="muted" style={{ fontSize: 10 }}>magnitude {w.last_change.magnitude_sigma}σ</div>
          </div>
        </div>
      </div>

      {/* ═══════════ 4. DO NOT TOUCH ═══════════ */}
      <div className="card mb">
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}><i className="ti ti-hand-stop" />Do Not Touch — worst momentum in SPX500</h3>
          <div className="muted" style={{ lineHeight: 1.55, fontSize: 12 }}>
            5 stocks + 2 sectors we&apos;re actively avoiding this week. Refreshed Monday 06:00 BRT.
          </div>
        </div>

        <div className="grid g2">
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--tx2)", marginBottom: 8, letterSpacing: 0.5 }}>⛔ STOCKS · 5 WORST MOMENTUM</div>
            <table>
              <thead><tr><th>Ticker</th><th>Sector</th><th className="num">Mom</th><th>Signal</th></tr></thead>
              <tbody>
                {data.dnt.stocks.map((s) => (
                  <tr key={s.ticker}>
                    <td>
                      <span style={{ fontWeight: 600, color: "var(--red)" }}>{s.ticker}</span>
                      <div className="muted" style={{ fontSize: 10 }}>{s.name}</div>
                    </td>
                    <td style={{ color: "var(--tx3)", fontSize: 11 }}>{s.sector}</td>
                    <td className="num" style={{ color: "var(--red)", fontWeight: 600 }}>{s.momentum}</td>
                    <td style={{ color: "var(--tx2)", fontSize: 11, fontStyle: "italic" }}>{s.tag}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--tx2)", marginBottom: 8, letterSpacing: 0.5 }}>⛔ SECTORS ON ALERT</div>
            <table>
              <thead><tr><th>Sector</th><th className="num">Mom</th><th>Signal</th></tr></thead>
              <tbody>
                {data.dnt.sectors.map((s) => (
                  <tr key={s.sector}>
                    <td style={{ color: "var(--red)", fontWeight: 600 }}>{s.sector}</td>
                    <td className="num" style={{ color: "var(--red)", fontWeight: 600 }}>{s.momentum}</td>
                    <td style={{ color: "var(--tx2)", fontSize: 11, fontStyle: "italic" }}>{s.tag}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="card mt" style={{ background: "transparent", borderStyle: "dashed", padding: 12 }}>
              <div style={{ fontSize: 11, color: "var(--tx2)", lineHeight: 1.55 }}>
                <i className="ti ti-info-circle" style={{ marginRight: 6, color: "var(--gold)" }} />
                Publishing what we <b>avoid</b> is safer than publishing what we buy — the universe of &ldquo;bad&rdquo; is orders of magnitude larger than the universe of &ldquo;good.&rdquo; This list warns you without teaching the model.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rule footer */}
      <div className="card" style={{ background: "transparent", borderStyle: "dashed" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <i className="ti ti-book" style={{ color: "var(--gold)", fontSize: 15, flexShrink: 0, marginTop: 2 }} />
          <div className="muted" style={{ fontSize: 10.5, lineHeight: 1.7 }}>
            <b style={{ color: "var(--tx2)" }}>Disclosure rules (server-enforced):</b> Vault shows aggregates only, never tickers or weights of active positions. Showcase samples exactly {data.protocol.showcase_size} closed positions with a {data.protocol.showcase_embargo_days}-day embargo, rotated weekly; there is no history archive. Weather shows regime state and defense weight; the trigger stack is not exposed. Do Not Touch ranks {data.protocol.dnt_universe} (not the ETP's actual selection universe). These rules exist to keep the edge intact while proving we're in the trade with you.
          </div>
        </div>
      </div>
    </>
  );
}

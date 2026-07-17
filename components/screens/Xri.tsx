"use client";
import { useEffect, useState } from "react";
import { fetchXri, XRI_STATE_COLOR, type XriView } from "@/lib/xri";
import { publishScreenData } from "@/lib/jim-data";
import { GOV_API } from "@/lib/data";
import { buildXri, type DnaRaw } from "@/lib/jim-market-analysis";
import XriGauge from "../XriGauge";
import BackToVisao from "../BackToVisao";
import JimBlock from "../JimBlock";
import type { ScreenId } from "@/lib/nav";

const DIRECTION_TXT: Record<string, string> = {
  subindo: "rising over the last few days",
  caindo: "falling over the last few days",
  estável: "stable over the last week",
};

// `state` comes from the server as BAIXO/MODERADO/ELEVADO/CRÍTICO (see
// app/api/xri/route.ts) — kept as-is for comparisons; STATE_TXT below is
// only for what's rendered on screen.
const STATE_TXT: Record<string, string> = {
  BAIXO: "CALM",
  MODERADO: "MODERATE",
  ELEVADO: "ELEVATED",
  CRÍTICO: "CRITICAL",
};

function buildNarrative(v: XriView): string {
  const top = (v.drivers || []).slice(0, 2).map((d) => d.country);
  const driverTxt = top.length ? top.join(" and ") : "no specific country standing out";
  const dirTxt = DIRECTION_TXT[v.direction || "estável"] || "stable over the last week";
  const stateTxt = (v.state && STATE_TXT[v.state]) || v.state;
  return `External risk **${stateTxt}** today, driven mainly by ${driverTxt}. It's ${dirTxt}.`;
}

export default function Xri({ go }: { go?: (id: ScreenId, param?: string) => void }) {
  const [v, setV] = useState<XriView>({ ok: false });
  const [dna, setDna] = useState<DnaRaw | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchXri().then((d) => { setV(d); setLoading(false); });
    // Public COT (CFTC) — lets JIM cross-reference the short yen against Japan's weight.
    fetch(`${GOV_API}/api/market-dna`).then(r => r.json()).then((d: DnaRaw) => setDna(d)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!v.ok) return;
    const narrative = buildNarrative(v).replace(/\*\*/g, "");
    publishScreenData("xri",
      "External Regime Index (XRI) screen: the temperature of what's happening outside the US and why it matters to clients.",
      { score: v.score, state: v.state, direction: v.direction, drivers: v.drivers },
      {
        briefing: narrative,
        suggestions: ["Why is risk at this level?", "Does this change my clients' portfolios?", "How was the XRI validated?"],
      }
    );
  }, [v]);

  const col = v.state ? XRI_STATE_COLOR[v.state] : "var(--tx2)";

  return (
    <div className="screen">
      <div className="crumb">Market › <b>XRI · External Regime Index</b><BackToVisao go={go} /></div>

      <div className="flex between" style={{ alignItems: "center", marginBottom: 8 }}>
        <div className="flex" style={{ alignItems: "baseline", gap: 14 }}>
          <div className="h1" style={{ margin: 0 }}>External Risk</div>
          <span className="muted" style={{ fontSize: 10 }}>
            What's happening out there — ready for you to discuss with your clients{v.as_of && <> · {v.as_of}</>}
          </span>
        </div>
        {v.ok && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px",
            borderRadius: 6, border: `1px solid ${col}40`, background: `${col}15`,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: col, boxShadow: `0 0 6px ${col}60` }} />
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: col }}>{(v.state && STATE_TXT[v.state]) || v.state}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="muted" style={{ padding: 40, textAlign: "center" }}>Loading…</div>
      ) : !v.ok ? (
        <div className="placeholder"><i className="ti ti-cloud-off" /><b>XRI unavailable right now</b></div>
      ) : (
        <>
          {/* Row 1: gauge + narrative + country breakdown (same height). Country
             breakdown was previously a separate card below, in a tiny font — moving
             it up to the same row makes the JIM analysis start higher on the page. */}
          <div className="card" style={{ marginBottom: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 260px", gap: 24, alignItems: "start" }}>
              <XriGauge score={v.score || 0} state={v.state || "MODERADO"} />
              <div>
                <div style={{ fontSize: 15, lineHeight: 1.6 }}>
                  External risk <b style={{ color: col }}>{(v.state && STATE_TXT[v.state]) || v.state}</b> today, driven mainly by{" "}
                  <b>{(v.drivers || []).slice(0, 2).map((d) => d.country).join(" and ") || "no country standing out"}</b>.
                  {" "}It's {DIRECTION_TXT[v.direction || "estável"]}.
                </div>
                <div style={{ marginTop: 12, padding: "12px 14px", background: "rgba(125,150,179,.08)", borderRadius: 8, fontSize: 13, lineHeight: 1.7 }}>
                  <div>Information layer — today it does not automatically change your clients' portfolios.</div>
                  {v.state === "BAIXO" && <div>No special point of attention to mention today.</div>}
                  {v.state === "MODERADO" && <div>Worth keeping on the radar for conversations with clients who follow international news closely.</div>}
                  {(v.state === "ELEVADO" || v.state === "CRÍTICO") && <div>May be worth preparing a response for clients who ask about international volatility.</div>}
                  <div>Confidence in today's data: <b>{v.confidence_pct}%</b>.</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: ".4px", color: "var(--gold)", marginBottom: 8, fontWeight: 700 }}>
                  <i className="ti ti-world" style={{ marginRight: 6 }} />WHERE TODAY'S RISK IS COMING FROM
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
                  {(v.drivers || []).length ? v.drivers!.map((d) => (
                    <div key={d.country} style={{
                      display: "grid",
                      gridTemplateColumns: "16px 1fr auto",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid var(--line2)",
                      background: "rgba(125,150,179,.06)",
                      fontSize: 13,
                    }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: d.pct >= 40 ? "#E74C3C" : d.pct >= 20 ? "#F39C12" : "#2ECC71",
                        justifySelf: "center",
                      }} />
                      <span style={{ textAlign: "left" }}>{d.country}</span>
                      <b style={{ fontFamily: "var(--mono)", fontSize: 14, color: "var(--tx)", textAlign: "right" }}>{d.pct}%</b>
                    </div>
                  )) : <span className="muted" style={{ fontSize: 12 }}>No relevant concentration in any country today.</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Detail: why the XRI is at this level. Lives here, not in the summary. */}
          <div style={{ marginBottom: 8 }}>
            <JimBlock block={buildXri(v, dna)} />
          </div>

          <div className="card">
            <details>
              <summary style={{ cursor: "pointer", fontSize: 12, color: "var(--gold)", letterSpacing: ".4px" }}>
                METHODOLOGY AND VALIDATION — why trust this number
              </summary>
              <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.8, color: "var(--tx2)" }}>
                {v.validation ? (
                  <>
                    <p>We tested the XRI against <b>{v.validation.years} years of market history</b>, including crises such as the Global Financial Crisis (2008), the European sovereign debt crisis (2011), Covid-19 (2020), and the UK gilts crisis (2022).</p>
                    <p>In <b>{v.validation.events_hit} of {v.validation.events_covered} events</b> covered by the historical record, the index was already signaling elevated risk before or during the event.</p>
                  </>
                ) : (
                  <p>The XRI combines hard market and macroeconomic data from more than ten countries/blocs and the real revenue exposure of US companies — news only enters the calculation after passing a confirmation filter.</p>
                )}
                <p>Today the XRI functions as <b>strategic information</b> — it does not automatically change your clients' portfolios.</p>
              </div>
            </details>
          </div>
        </>
      )}
    </div>
  );
}

"use client";
import { useState } from "react";
import {
  SR_POSTS,
  SR_PLATFORM_BADGE,
  SR_IMPACT_COLOR,
  SR_SENTIMENT_COLOR,
  srSignalPos,
  srSignalLabel,
  srWhyItMatters,
  srCalibration,
  type SocialPost,
} from "@/lib/data";

export default function SocialRadar() {
  const [platform, setPlatform] = useState("all");
  const [impact, setImpact] = useState("all");
  const [category, setCategory] = useState("all");
  const [sentiment, setSentiment] = useState("all");
  const [activeId, setActiveId] = useState<number | null>(null);

  const posts = SR_POSTS.filter((p) => {
    if (platform !== "all" && p.platform !== platform) return false;
    if (impact !== "all" && p.impact !== impact) return false;
    if (category !== "all" && p.category !== category) return false;
    if (sentiment !== "all" && p.sentiment !== sentiment) return false;
    return true;
  });

  const active = activeId != null ? SR_POSTS.find((p) => p.id === activeId) ?? null : null;

  return (
    <div className="screen" style={{ display: "flex", flexDirection: "column" }}>
      <div className="crumb">Intelligence › <b>Social Radar</b></div>
      <div className="h1">Social Media Radar</div>
      <div className="sub">Real-time monitoring · Key accounts · Market-moving signals</div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "14px 0", alignItems: "center" }}>
        <span className="flabel" style={{ marginRight: 4 }}>Filter:</span>
        <select className="fsel" value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="all">All Platforms</option>
          <option value="youtube">YouTube</option>
          <option value="twitter">Twitter / X</option>
          <option value="linkedin">LinkedIn</option>
          <option value="instagram">Instagram</option>
          <option value="truth_social">Truth Social</option>
        </select>
        <select className="fsel" value={impact} onChange={(e) => setImpact(e.target.value)}>
          <option value="all">All Impact</option>
          <option value="Market Moving">Market Moving</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select className="fsel" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All Categories</option>
          <option value="central_bank">Central Banks</option>
          <option value="financial_media">Financial Media</option>
          <option value="asset_manager">Asset Managers</option>
          <option value="macro_investor">Macro Investors</option>
          <option value="tech_ai">Tech / AI</option>
          <option value="political">Political</option>
          <option value="crypto">Crypto</option>
        </select>
        <select className="fsel" value={sentiment} onChange={(e) => setSentiment(e.target.value)}>
          <option value="all">All Sentiment</option>
          <option value="Bullish">Bullish</option>
          <option value="Bearish">Bearish</option>
          <option value="Neutral">Neutral</option>
          <option value="Mixed">Mixed</option>
        </select>
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 9, color: "var(--tx3)" }}>
          {posts.length} post{posts.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="sr-body">
        <div className={`sr-feed-col${active ? " has-panel" : ""}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {posts.length === 0 && (
              <div style={{ textAlign: "center", padding: 48, color: "var(--tx3)", fontSize: 11 }}>
                No posts match current filters
              </div>
            )}
            {posts.map((p) => (
              <SocialCard key={p.id} p={p} selected={activeId === p.id} onClick={() => setActiveId(p.id)} />
            ))}
          </div>
        </div>
        <div className={`sr-intel-panel${active ? " open" : ""}`}>
          {active && <IntelPanel p={active} onClose={() => setActiveId(null)} />}
        </div>
      </div>
    </div>
  );
}

function SocialCard({ p, selected, onClick }: { p: SocialPost; selected: boolean; onClick: () => void }) {
  const pb = SR_PLATFORM_BADGE[p.platform] || { label: p.platform.toUpperCase(), color: "rgba(255,255,255,0.3)" };
  const ic = SR_IMPACT_COLOR[p.impact] || "rgba(255,255,255,0.3)";
  const sc = SR_SENTIMENT_COLOR[p.sentiment] || "rgba(255,255,255,0.4)";
  const rel = Math.round(p.relevance * 100);
  return (
    <div
      className={`sr-card${selected ? " selected" : ""}`}
      onClick={onClick}
      style={{ background: "var(--bg2)", border: "1px solid var(--line)", borderLeft: `3px solid ${ic}`, borderRadius: 6, padding: "13px 15px", display: "flex", flexDirection: "column", gap: 7 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, background: pb.color, color: "#000", padding: "3px 7px", borderRadius: 3, minWidth: 22, textAlign: "center" }}>{pb.label}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--tx2)" }}>{p.account}</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tx3)" }}>{p.handle}</span>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, color: ic }}>{p.impact.toUpperCase()}</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: sc }}>{p.sentiment}</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tx3)" }}>{p.ts}</span>
        </span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--tx)", lineHeight: 1.45 }}>{p.headline}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {p.asset_tags.slice(0, 4).map((t) => (
          <span key={t} style={{ fontFamily: "var(--mono)", fontSize: 11, background: "rgba(201,160,44,0.08)", border: "1px solid rgba(201,160,44,0.15)", color: "var(--gold)", padding: "2px 7px", borderRadius: 3 }}>{t}</span>
        ))}
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tx3)" }}>REL</span>
          <div style={{ width: 52, height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${rel}%`, height: "100%", background: "var(--gold)", borderRadius: 2, opacity: 0.8 }} />
          </div>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tx3)" }}>{rel}%</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--tx3)", marginLeft: 4, opacity: 0.5 }}>›</span>
        </span>
      </div>
    </div>
  );
}

function IntelPanel({ p, onClose }: { p: SocialPost; onClose: () => void }) {
  const pb = SR_PLATFORM_BADGE[p.platform] || { label: p.platform.toUpperCase(), color: "rgba(255,255,255,0.3)" };
  const ic = SR_IMPACT_COLOR[p.impact] || "rgba(255,255,255,0.3)";
  const sc = SR_SENTIMENT_COLOR[p.sentiment] || "rgba(255,255,255,0.4)";
  const pos = srSignalPos(p);
  const sig = srSignalLabel(pos);
  const pct = Math.round(pos * 100);
  const bulls = srWhyItMatters(p);
  const cal = srCalibration(p);
  const confColor = cal.confidence >= 85 ? "var(--green)" : cal.confidence >= 65 ? "var(--gold)" : "var(--red)";
  const icons = ["Portfolio", "Regime", "Asset Risk"];

  return (
    <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onClose} className="sr-action-secondary" style={{ width: "auto", padding: "5px 10px", fontSize: 9 }}>← Feed</button>
        <span style={{ fontFamily: "var(--mono)", fontSize: 8, letterSpacing: ".10em", color: "var(--tx3)" }}>INTELLIGENCE LAYER</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--tx3)", fontSize: 16, cursor: "pointer", padding: "0 2px", lineHeight: 1 }}>×</button>
      </div>

      <div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: ".10em", textTransform: "uppercase", color: "var(--tx3)", marginBottom: 6 }}>Source</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, background: pb.color, color: "#000", padding: "3px 8px", borderRadius: 3 }}>{pb.label}</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--tx)" }}>{p.account}</span>
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--tx3)", marginTop: 3 }}>{p.handle} · {p.ts}</div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: 5, padding: "10px 12px" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: ".10em", textTransform: "uppercase", color: "var(--tx3)", marginBottom: 6 }}>Original Signal</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--tx)", lineHeight: 1.5 }}>{p.headline}</div>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".10em", textTransform: "uppercase", color: "var(--tx3)" }}>Signal Temperature</div>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, color: sig.color }}>{sig.label}</span>
        </div>
        <div className="sr-thermo-track"><div className="sr-thermo-marker" style={{ left: `${pct}%` }} /></div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
          {["Cold", "Warm", "Hot", "Critical"].map((l, i) => (
            <span key={l} style={{ fontFamily: "var(--mono)", fontSize: 7, color: `rgba(255,255,255,${i === 0 ? "0.2" : "0.18"})` }}>{l}</span>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".10em", textTransform: "uppercase", color: "var(--tx3)", marginBottom: 6 }}>Why It Matters</div>
        {bulls.map((b, i) => (
          <div className="sr-bullet" key={i}>
            <div className="sr-bullet-dot" />
            <div>
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--gold)", textTransform: "uppercase", letterSpacing: ".06em" }}>{icons[i]}</span>
              <br />{b}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(201,160,44,0.04)", border: "1px solid rgba(201,160,44,0.12)", borderRadius: 5, padding: "10px 12px" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: ".10em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 8 }}>HARPIAN Intelligence Calibration</div>
        <div className="sr-calib-row"><span className="sr-calib-k">Confidence</span><span className="sr-calib-v" style={{ color: confColor }}>{cal.confidence}%</span></div>
        <div className="sr-calib-row"><span className="sr-calib-k">Detected Topic</span><span className="sr-calib-v">{cal.topic}</span></div>
        <div className="sr-calib-row"><span className="sr-calib-k">Asset Class</span><span className="sr-calib-v">{cal.assetClass}</span></div>
        <div className="sr-calib-row"><span className="sr-calib-k">Impact Level</span><span className="sr-calib-v" style={{ color: ic }}>{p.impact}</span></div>
        <div className="sr-calib-row"><span className="sr-calib-k">Sentiment</span><span className="sr-calib-v" style={{ color: sc }}>{p.sentiment}</span></div>
        <div className="sr-calib-row"><span className="sr-calib-k">Signal Freshness</span><span className="sr-calib-v">{cal.freshness}</span></div>
      </div>

      <button onClick={onClose} className="sr-action-secondary">← Back to Feed</button>
    </div>
  );
}

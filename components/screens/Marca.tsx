"use client";
import { useEffect, useState } from "react";
import { publishScreenData } from "@/lib/jim-data";

const COLORS = [
  { name: "Harpian Gold", v: "#C9A02C" },
  { name: "Institutional Blue", v: "#4A90D9" },
  { name: "Green", v: "#2ECC71" },
  { name: "Graphite", v: "#7d96b3" },
  { name: "Burgundy", v: "#A23B4E" },
];

const KEY = "harpian_marca_whitelabel";
interface Saved { advisor: string; color: string }

function load(): Saved {
  if (typeof window === "undefined") return { advisor: "HARPIAN Capital", color: COLORS[0].v };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    return { advisor: raw.advisor || "HARPIAN Capital", color: raw.color || COLORS[0].v };
  } catch {
    return { advisor: "HARPIAN Capital", color: COLORS[0].v };
  }
}

export default function Marca() {
  // Initializes already with what was saved (lazy initializer — runs on the 1st render,
  // before any effect). Avoids the "save" vs. "load" race on mount.
  const [advisor, setAdvisor] = useState(() => load().advisor);
  const [color, setColor] = useState(() => load().color);
  const [saved, setSaved] = useState(false);

  // Persists on every change — no separate "save" button, always up to date.
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify({ advisor, color }));
    setSaved(true);
    const t = setTimeout(() => setSaved(false), 1400);
    return () => clearTimeout(t);
  }, [advisor, color]);

  useEffect(() => {
    const colorName = COLORS.find((c) => c.v === color)?.name || color;
    publishScreenData(
      "marca",
      "Brand (white-label): advisor's identity in reports for the end client — name and primary color. Shows up in the PDF preview.",
      { nomeAssessor: advisor, corPrimaria: colorName },
      {
        briefing: `Your brand today: **${advisor}**, color ${colorName}. Appears in the header of client reports.`,
        suggestions: [
          "Where does this brand show up for the client?",
          "How does the logo upload work?",
          "Can I have a different brand per client?",
        ],
      }
    );
  }, [advisor, color]);

  return (
    <div className="screen">
      <div className="flex between wrap" style={{ alignItems: "flex-start", gap: 10 }}>
        <div className="flex" style={{ alignItems: "baseline", gap: 14, flexWrap: "wrap", flex: 1 }}>
          <div className="h1" style={{ margin: 0 }}>Brand (white-label)</div>
          <div className="sub" style={{ margin: 0 }}>The advisor&apos;s identity in reports generated for the end client.</div>
        </div>
        {saved && <span className="muted" style={{ fontSize: 11, color: "var(--green)", display: "flex", alignItems: "center", gap: 4 }}><i className="ti ti-circle-check" />saved</span>}
      </div>

      <div className="grid g2">
        <div className="card">
          <h3><i className="ti ti-palette" />Your identity</h3>
          <label className="muted" style={{ display: "block", fontSize: 11, marginBottom: 4 }}>Advisor / office name</label>
          <input className="wl-input" style={{ width: "100%" }} value={advisor} onChange={(e) => setAdvisor(e.target.value)} />
          <label className="muted" style={{ display: "block", fontSize: 11, margin: "14px 0 6px" }}>Primary color</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {COLORS.map((c) => (
              <button key={c.v} onClick={() => setColor(c.v)} title={c.name}
                style={{ width: 30, height: 30, borderRadius: 8, background: c.v, cursor: "pointer", border: color === c.v ? "2px solid var(--tx)" : "2px solid transparent", outline: color === c.v ? `2px solid ${c.v}` : "none" }} />
            ))}
          </div>
          <div className="muted mt" style={{ fontSize: 11 }}>Logo, colors and name appear on PDFs generated for the client. (Logo upload in phase 2.)</div>
        </div>

        <div className="card">
          <h3><i className="ti ti-file-text" />Report preview</h3>
          <div style={{ border: "1px solid var(--line2)", borderRadius: 10, overflow: "hidden", background: "#fff" }}>
            <div style={{ background: color, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(255,255,255,.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>{advisor.charAt(0) || "H"}</div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{advisor || "—"}</div>
              <div style={{ marginLeft: "auto", color: "rgba(255,255,255,.85)", fontSize: 10, fontFamily: "var(--mono)" }}>REPORT · HPC22</div>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ color: "#1a2233", fontWeight: 600, fontSize: 13 }}>Client portfolio · June 2026</div>
              <div style={{ height: 1, background: "#e5e9f0", margin: "10px 0" }} />
              <div style={{ display: "flex", gap: 16 }}>
                <div><div style={{ fontSize: 9, color: "#8892a4", textTransform: "uppercase", letterSpacing: ".5px" }}>Return</div><div style={{ color, fontWeight: 700, fontSize: 18, fontFamily: "var(--mono)" }}>+14.2%</div></div>
                <div><div style={{ fontSize: 9, color: "#8892a4", textTransform: "uppercase", letterSpacing: ".5px" }}>Risk Nº</div><div style={{ color: "#1a2233", fontWeight: 700, fontSize: 18, fontFamily: "var(--mono)" }}>38</div></div>
              </div>
            </div>
          </div>
          <div className="muted mt" style={{ fontSize: 11 }}>Illustrative preview of how your brand appears in the client's report.</div>
        </div>
      </div>
    </div>
  );
}

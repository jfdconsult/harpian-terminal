"use client";
import { useState } from "react";

const COLORS = [
  { name: "Ouro Harpian", v: "#C9A02C" },
  { name: "Azul institucional", v: "#4A90D9" },
  { name: "Verde", v: "#2ECC71" },
  { name: "Grafite", v: "#7d96b3" },
  { name: "Bordô", v: "#A23B4E" },
];

export default function Marca() {
  const [advisor, setAdvisor] = useState("HARPIAN Capital");
  const [color, setColor] = useState(COLORS[0].v);

  return (
    <div className="screen">
      <div className="crumb">Ajustes › <b>Marca</b></div>
      <div className="h1">Marca (white-label)</div>
      <div className="sub">A identidade do assessor nos relatórios gerados para o cliente final.</div>

      <div className="grid g2">
        <div className="card">
          <h3><i className="ti ti-palette" />Sua identidade</h3>
          <label className="muted" style={{ display: "block", fontSize: 11, marginBottom: 4 }}>Nome do assessor / escritório</label>
          <input className="wl-input" style={{ width: "100%" }} value={advisor} onChange={(e) => setAdvisor(e.target.value)} />
          <label className="muted" style={{ display: "block", fontSize: 11, margin: "14px 0 6px" }}>Cor primária</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {COLORS.map((c) => (
              <button key={c.v} onClick={() => setColor(c.v)} title={c.name}
                style={{ width: 30, height: 30, borderRadius: 8, background: c.v, cursor: "pointer", border: color === c.v ? "2px solid var(--tx)" : "2px solid transparent", outline: color === c.v ? `2px solid ${c.v}` : "none" }} />
            ))}
          </div>
          <div className="muted mt" style={{ fontSize: 11 }}>Logo, cores e nome aparecem nos PDFs gerados para o cliente. (Upload de logo na fase 2.)</div>
        </div>

        <div className="card">
          <h3><i className="ti ti-file-text" />Preview do relatório</h3>
          <div style={{ border: "1px solid var(--line2)", borderRadius: 10, overflow: "hidden", background: "#fff" }}>
            <div style={{ background: color, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(255,255,255,.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>{advisor.charAt(0) || "H"}</div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{advisor || "—"}</div>
              <div style={{ marginLeft: "auto", color: "rgba(255,255,255,.85)", fontSize: 10, fontFamily: "var(--mono)" }}>RELATÓRIO · HPC22</div>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ color: "#1a2233", fontWeight: 600, fontSize: 13 }}>Carteira do cliente · junho 2026</div>
              <div style={{ height: 1, background: "#e5e9f0", margin: "10px 0" }} />
              <div style={{ display: "flex", gap: 16 }}>
                <div><div style={{ fontSize: 9, color: "#8892a4", textTransform: "uppercase", letterSpacing: ".5px" }}>Retorno</div><div style={{ color, fontWeight: 700, fontSize: 18, fontFamily: "var(--mono)" }}>+14,2%</div></div>
                <div><div style={{ fontSize: 9, color: "#8892a4", textTransform: "uppercase", letterSpacing: ".5px" }}>Risk Nº</div><div style={{ color: "#1a2233", fontWeight: 700, fontSize: 18, fontFamily: "var(--mono)" }}>38</div></div>
              </div>
            </div>
          </div>
          <div className="muted mt" style={{ fontSize: 11 }}>Prévia ilustrativa de como a sua marca aparece no relatório do cliente.</div>
        </div>
      </div>
    </div>
  );
}

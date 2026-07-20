"use client";
import { useEffect, useMemo, useState } from "react";
import { CLIENTS, brl, type Client } from "@/lib/clients";
import { allClients } from "@/lib/clientStore";
import { publishScreenData } from "@/lib/jim-data";
import { HPC22_RN, HPC11_RN, TOLERANCE, OBJETIVO } from "@/lib/riskLevels";

// Compact (inline) ruler with markers — used on each table row.
// Exported to be reused in the "All clients on the ruler" module of the Dashboard.
export function MiniRegua({ portfolio, tolerance, mandate }: { portfolio: number; tolerance: number; mandate: number }) {
  const dot = (v: number, color: string, title: string) => (
    <div title={title} style={{ position: "absolute", top: -2, left: `${v}%`, transform: "translateX(-50%)", width: 8, height: 8, borderRadius: "50%", background: color, border: "1.5px solid var(--bg)" }} />
  );
  return (
    <div style={{ position: "relative", height: 8, width: 150 }}>
      <div style={{ position: "absolute", top: 2, left: 0, right: 0, height: 4, borderRadius: 3, background: "linear-gradient(90deg,#2ECC71,#F39C12,#E74C3C)" }} />
      {dot(mandate, "#4A90D9", `mandate ${mandate}`)}
      {dot(tolerance, "#EAF0F7", `tolerance ${tolerance}`)}
      {dot(portfolio, portfolio > mandate ? "#E74C3C" : "#2ECC71", `portfolio ${portfolio}`)}
    </div>
  );
}

export default function Risco() {
  const [clients, setClients] = useState<Client[]>(CLIENTS);   // seed on SSR; localStorage on client
  const [sel, setSel] = useState(CLIENTS[0].id);
  const [migrate, setMigrate] = useState(0); // % migrated to HPC22

  useEffect(() => { setClients(allClients()); }, []);

  const client = clients.find((c) => c.id === sel) || clients[0];
  const tol = TOLERANCE[client.profile];
  const objetivo = OBJETIVO[client.profile];

  const blended = useMemo(
    () => Math.round((1 - migrate / 100) * client.riskNumber + (migrate / 100) * HPC22_RN),
    [migrate, client.riskNumber]
  );
  const gap = blended - client.mandate;
  const fora = clients.filter((c) => c.riskNumber > c.mandate);

  // Markers for the selected client's ruler; labels at 2 heights to avoid collision.
  const markers = [
    { v: HPC22_RN, color: "var(--gold)", label: `product ${HPC22_RN}` },
    { v: client.mandate, color: "var(--blue)", label: `mandate ${client.mandate}` },
    { v: tol, color: "var(--tx)", label: `tolerance ${tol}` },
    { v: blended, color: gap > 0 ? "var(--red)" : "var(--green)", label: `portfolio ${blended}` },
  ].sort((a, b) => a.v - b.v);

  // Publishes to JIM the risk per client (selected + full-base overview).
  useEffect(() => {
    publishScreenData(
      "risco",
      "Risk per client on the Risk Number ruler (0-100, S&P 500 ≈ 72). For each client, 4 levels: product (fund), tolerance (profile/questionnaire), mandate (contractual ceiling), and portfolio (holdings). Table compares all clients.",
      {
        selectedClient: {
          name: client.name, profile: client.profile, objective: objetivo,
          productRisk_HPC22: HPC22_RN, tolerance: tol, mandate: client.mandate,
          portfolioRisk: client.riskNumber, aboveMandate: client.riskNumber - client.mandate,
        },
        base: clients.map((c) => ({
          name: c.name, profile: c.profile, objective: OBJETIVO[c.profile],
          portfolio: c.riskNumber, tolerance: TOLERANCE[c.profile], mandate: c.mandate,
          compliant: c.riskNumber <= c.mandate,
        })),
        outsideMandate: fora.map((c) => c.name),
      },
      {
        briefing:
          `You're looking at risk per client. Selected: **${client.name}** (${client.profile}, objective ${objetivo}) — ` +
          `portfolio **${client.riskNumber}**, tolerance ${tol}, mandate ${client.mandate}` +
          (client.riskNumber > client.mandate ? ` (**${client.riskNumber - client.mandate} above the ceiling**).` : " (within the ceiling).") +
          (fora.length ? ` In the base, ${fora.length} outside the mandate: ${fora.map((c) => c.name).join(", ")}.` : ""),
        suggestions: [
          client.riskNumber > client.mandate ? `Why is ${client.name} outside the mandate?` : `Is ${client.name} well positioned?`,
          "Which clients need rebalancing?",
          "Migrating to HPC22 reduces whose risk?",
        ],
      }
    );
  }, [client, tol, objetivo, clients, fora]);

  return (
    <div className="screen">
      <div className="flex between wrap" style={{ gap: 10 }}>
        <div className="flex" style={{ alignItems: "baseline", gap: 14, flexWrap: "wrap", flex: 1 }}>
          <div className="h1" style={{ margin: 0 }}>Risk by client — the 4 levels on the same ruler</div>
          <div className="sub" style={{ margin: 0 }}>
            Where each client&apos;s portfolio stands vs. the profile tolerance and the mandate ceiling. All on the Risk Number (0-100).
          </div>
        </div>
        <div className="flex" style={{ gap: 8, alignItems: "center" }}>
          <span className="flabel">Client:</span>
          <select className="fsel" style={{ fontSize: 13, padding: "8px 12px", minWidth: 220 }} value={sel} onChange={(e) => { setSel(e.target.value); setMigrate(0); }}>
            {clients.map((c) => (<option key={c.id} value={c.id}>{c.name} · {c.profile}</option>))}
          </select>
        </div>
      </div>

      {/* 4 levels of the selected client */}
      <div className="grid g4 mt mb">
        <div className="card"><h3><i className="ti ti-coin" />Product risk</h3><div className="big" style={{ color: "var(--orange)" }}>{HPC22_RN}</div><div className="muted mt">HPC22 (the fund). HPC11 = {HPC11_RN}.</div></div>
        <div className="card"><h3><i className="ti ti-user-heart" />Client tolerance</h3><div className="big">{tol}</div><div className="muted mt">{client.profile} profile · objective {objetivo}.</div></div>
        <div className="card"><h3><i className="ti ti-file-certificate" />Mandate</h3><div className="big">{client.mandate}</div><div className="muted mt">Contractual ceiling for the account.</div></div>
        <div className="card" style={{ borderColor: gap > 0 ? "rgba(231,76,60,.3)" : "var(--line2)" }}>
          <h3><i className="ti ti-wallet" />Portfolio risk</h3>
          <div className={`big ${gap > 0 ? "r" : "g"}`}>{blended}</div>
          <div className="muted mt" style={{ color: gap > 0 ? "var(--red)" : "var(--green)" }}>
            {gap > 0 ? `▲ +${gap} above the mandate` : "✓ within the mandate"}
          </div>
        </div>
      </div>

      {/* Selected client's ruler */}
      <div className="card mb">
        <h3><i className="ti ti-scale" />{client.name} — on the same ruler</h3>
        <div style={{ position: "relative", height: 72, margin: "8px 8px 0" }}>
          <div style={{ position: "absolute", top: 48, left: 0, right: 0, height: 9, borderRadius: 5, background: "linear-gradient(90deg,#2ECC71,#F39C12,#E74C3C)" }} />
          {markers.map((m, i) => (
            <div key={m.label}>
              <div style={{ position: "absolute", top: i % 2 === 0 ? 2 : 22, left: `${m.v}%`, transform: "translateX(-50%)", fontSize: 10.5, color: m.color, whiteSpace: "nowrap", fontFamily: "var(--mono)", transition: "left .2s" }}>{m.label}</div>
              <div style={{ position: "absolute", top: 44, left: `${m.v}%`, transform: "translateX(-50%)", width: 2, height: 17, background: m.color, transition: "left .2s" }} />
            </div>
          ))}
        </div>
        <div className="legend" style={{ marginTop: 10 }}>
          <i><b style={{ background: "#C9A02C" }} />Product {HPC22_RN}</i>
          <i><b style={{ background: "#EAF0F7" }} />Tolerance {tol}</i>
          <i><b style={{ background: "#4A90D9" }} />Mandate {client.mandate}</i>
          <i><b style={{ background: gap > 0 ? "#E74C3C" : "#2ECC71" }} />Portfolio {blended}</i>
        </div>
        <div className="flex mt" style={{ gap: 14 }}>
          <span className="muted" style={{ minWidth: 210 }}>Simulate: migrate {client.name} to HPC22</span>
          <input type="range" min={0} max={100} value={migrate} onChange={(e) => setMigrate(+e.target.value)} style={{ flex: 1 }} />
          <span style={{ fontFamily: "var(--mono)", minWidth: 46, textAlign: "right" }}>{migrate}%</span>
        </div>
        <div className="muted mt">
          {gap > 0
            ? `Migrating ${migrate}%, the portfolio risk drops to ${blended} — still ${gap} above the ceiling of ${client.mandate}.`
            : `Migrating ${migrate}%, the portfolio lands at ${blended} — within the mandate (≤ ${client.mandate}).`}
        </div>
      </div>

      {/* Overview of all clients — column distribution */}
      <div className="card">
        <div className="flex between mb">
          <h3 style={{ margin: 0 }}><i className="ti ti-users" />All clients on the ruler</h3>
          <span className={`tag ${fora.length ? "r" : "g"}`}>{fora.length ? `${fora.length} outside the mandate` : "all within"}</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr>
              <th>Client</th><th>Profile</th><th>Objective</th>
              <th className="num">Portfolio</th><th className="num">Tolerance</th><th className="num">Mandate</th>
              <th>Ruler distribution</th><th>Alignment</th>
            </tr></thead>
            <tbody>
              {clients.map((c) => {
                const aligned = c.riskNumber <= c.mandate;
                const t = TOLERANCE[c.profile];
                return (
                  <tr key={c.id} style={{ cursor: "pointer", background: c.id === sel ? "rgba(201,160,44,.06)" : undefined }} onClick={() => { setSel(c.id); setMigrate(0); }}>
                    <td style={{ fontWeight: 600, color: "var(--tx)" }}>{c.name}</td>
                    <td style={{ color: "var(--tx2)" }}>{c.profile}</td>
                    <td style={{ color: "var(--tx3)" }}>{OBJETIVO[c.profile]}</td>
                    <td className="num" style={{ color: aligned ? "var(--tx)" : "var(--red)", fontWeight: 600 }}>{c.riskNumber}</td>
                    <td className="num" style={{ color: "var(--tx2)" }}>{t}</td>
                    <td className="num" style={{ color: "var(--tx2)" }}>{c.mandate}</td>
                    <td><MiniRegua portfolio={c.riskNumber} tolerance={t} mandate={c.mandate} /></td>
                    <td>{aligned ? <span className="tag g">within</span> : <span className="tag r">▲ +{c.riskNumber - c.mandate}</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="legend mt">
          <i><b style={{ background: "#4A90D9" }} />Mandate (ceiling)</i>
          <i><b style={{ background: "#EAF0F7" }} />Tolerance (profile)</i>
          <i><b style={{ background: "#E74C3C" }} />Portfolio outside</i>
          <i><b style={{ background: "#2ECC71" }} />Portfolio within</i>
          <span className="muted" style={{ marginLeft: "auto" }}>Click a row to open the client on the ruler above.</span>
        </div>
      </div>

      <div className="card mt" style={{ background: "transparent", borderStyle: "dashed" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <i className="ti ti-info-circle" style={{ color: "var(--blue)", fontSize: 15, flexShrink: 0, marginTop: 2 }} />
          <div className="muted" style={{ fontSize: 10.5, lineHeight: 1.6 }}>
            Portfolio = Risk Number of the client's holdings. Tolerance comes from the profile (questionnaire) and the mandate from the contract. Product comes from the internal engine. Scale calibrated to the S&amp;P 500 ≈ 72.
          </div>
        </div>
      </div>
    </div>
  );
}

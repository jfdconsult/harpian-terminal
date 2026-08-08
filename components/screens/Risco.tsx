"use client";
import { useEffect, useMemo, useState } from "react";
import { CLIENTS, brl, type Client } from "@/lib/clients";
import { allClients } from "@/lib/clientStore";
import { publishScreenData } from "@/lib/jim-data";
import { HPC22_RN, HPC11_RN, TOLERANCE, OBJETIVO } from "@/lib/riskLevels";
import { useI18n } from "@/lib/i18n";

const TR = {
  title: { pt: "Risco por cliente — os 4 níveis na mesma régua", en: "Risk by client — the 4 levels on the same ruler" },
  subtitle: { pt: "Onde o portfólio de cada cliente está em relação à tolerância do perfil e ao teto do mandato. Tudo no Risk Number (0-100).", en: "Where each client's portfolio stands vs. the profile tolerance and the mandate ceiling. All on the Risk Number (0-100)." },
  client: { pt: "Cliente:", en: "Client:" },
  productRisk: { pt: "Risco do produto", en: "Product risk" },
  productMuted: { pt: "HPC22 (o fundo). HPC11 =", en: "HPC22 (the fund). HPC11 =" },
  clientTolerance: { pt: "Tolerância do cliente", en: "Client tolerance" },
  profileObjective: { pt: "perfil · objetivo", en: "profile · objective" },
  mandate: { pt: "Mandato", en: "Mandate" },
  mandateMuted: { pt: "Teto contratual da conta.", en: "Contractual ceiling for the account." },
  portfolioRisk: { pt: "Risco do portfólio", en: "Portfolio risk" },
  aboveMandate: { pt: "acima do mandato", en: "above the mandate" },
  withinMandate: { pt: "✓ dentro do mandato", en: "✓ within the mandate" },
  onSameRuler: { pt: "na mesma régua", en: "on the same ruler" },
  legendProduct: { pt: "Produto", en: "Product" },
  legendTolerance: { pt: "Tolerância", en: "Tolerance" },
  legendMandate: { pt: "Mandato", en: "Mandate" },
  legendPortfolio: { pt: "Portfólio", en: "Portfolio" },
  simulate: { pt: "Simular: migrar", en: "Simulate: migrate" },
  toHPC22: { pt: "para HPC22", en: "to HPC22" },
  migratingStillAbove: { pt: "risco do portfólio cai para", en: "the portfolio risk drops to" },
  stillAboveCeiling: { pt: "ainda", en: "still" },
  aboveCeilingOf: { pt: "acima do teto de", en: "above the ceiling of" },
  migratingWithin: { pt: "o portfólio chega a", en: "the portfolio lands at" },
  withinMandateOf: { pt: "dentro do mandato (≤", en: "within the mandate (≤" },
  allClients: { pt: "Todos os clientes na régua", en: "All clients on the ruler" },
  outsideMandate: { pt: "fora do mandato", en: "outside the mandate" },
  allWithin: { pt: "todos dentro", en: "all within" },
  colClient: { pt: "Cliente", en: "Client" },
  colProfile: { pt: "Perfil", en: "Profile" },
  colObjective: { pt: "Objetivo", en: "Objective" },
  colPortfolio: { pt: "Portfólio", en: "Portfolio" },
  colTolerance: { pt: "Tolerância", en: "Tolerance" },
  colMandate: { pt: "Mandato", en: "Mandate" },
  colRulerDist: { pt: "Distribuição na régua", en: "Ruler distribution" },
  colAlignment: { pt: "Alinhamento", en: "Alignment" },
  within: { pt: "dentro", en: "within" },
  legendMandateCeiling: { pt: "Mandato (teto)", en: "Mandate (ceiling)" },
  legendToleranceProfile: { pt: "Tolerância (perfil)", en: "Tolerance (profile)" },
  legendPortfolioOutside: { pt: "Portfólio fora", en: "Portfolio outside" },
  legendPortfolioWithin: { pt: "Portfólio dentro", en: "Portfolio within" },
  clickRow: { pt: "Clique numa linha para abrir o cliente na régua acima.", en: "Click a row to open the client on the ruler above." },
  footnote: {
    pt: "Portfólio = Risk Number das posições do cliente. Tolerância vem do perfil (questionário) e o mandato do contrato. Produto vem do motor interno. Escala calibrada ao S&P 500 ≈ 72.",
    en: "Portfolio = Risk Number of the client's holdings. Tolerance comes from the profile (questionnaire) and the mandate from the contract. Product comes from the internal engine. Scale calibrated to the S&P 500 ≈ 72.",
  },
} as const;

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
  const { lang } = useI18n();
  const t = (k: keyof typeof TR) => TR[k][lang];
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
          <div className="h1" style={{ margin: 0 }}>{t("title")}</div>
          <div className="sub" style={{ margin: 0 }}>
            {t("subtitle")}
          </div>
        </div>
        <div className="flex" style={{ gap: 8, alignItems: "center" }}>
          <span className="flabel">{t("client")}</span>
          <select className="fsel" style={{ fontSize: 13, padding: "8px 12px", minWidth: 220 }} value={sel} onChange={(e) => { setSel(e.target.value); setMigrate(0); }}>
            {clients.map((c) => (<option key={c.id} value={c.id}>{c.name} · {c.profile}</option>))}
          </select>
        </div>
      </div>

      {/* 4 levels of the selected client */}
      <div className="grid g4 mt mb">
        <div className="card"><h3><i className="ti ti-coin" />{t("productRisk")}</h3><div className="big" style={{ color: "var(--orange)" }}>{HPC22_RN}</div><div className="muted mt">{t("productMuted")} {HPC11_RN}.</div></div>
        <div className="card"><h3><i className="ti ti-user-heart" />{t("clientTolerance")}</h3><div className="big">{tol}</div><div className="muted mt">{client.profile} {t("profileObjective")} {objetivo}.</div></div>
        <div className="card"><h3><i className="ti ti-file-certificate" />{t("mandate")}</h3><div className="big">{client.mandate}</div><div className="muted mt">{t("mandateMuted")}</div></div>
        <div className="card" style={{ borderColor: gap > 0 ? "rgba(231,76,60,.3)" : "var(--line2)" }}>
          <h3><i className="ti ti-wallet" />{t("portfolioRisk")}</h3>
          <div className={`big ${gap > 0 ? "r" : "g"}`}>{blended}</div>
          <div className="muted mt" style={{ color: gap > 0 ? "var(--red)" : "var(--green)" }}>
            {gap > 0 ? `▲ +${gap} ${t("aboveMandate")}` : t("withinMandate")}
          </div>
        </div>
      </div>

      {/* Selected client's ruler */}
      <div className="card mb">
        <h3><i className="ti ti-scale" />{client.name} — {t("onSameRuler")}</h3>
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
          <i><b style={{ background: "#C9A02C" }} />{t("legendProduct")} {HPC22_RN}</i>
          <i><b style={{ background: "#EAF0F7" }} />{t("legendTolerance")} {tol}</i>
          <i><b style={{ background: "#4A90D9" }} />{t("legendMandate")} {client.mandate}</i>
          <i><b style={{ background: gap > 0 ? "#E74C3C" : "#2ECC71" }} />{t("legendPortfolio")} {blended}</i>
        </div>
        <div className="flex mt" style={{ gap: 14 }}>
          <span className="muted" style={{ minWidth: 210 }}>{t("simulate")} {client.name} {t("toHPC22")}</span>
          <input type="range" min={0} max={100} value={migrate} onChange={(e) => setMigrate(+e.target.value)} style={{ flex: 1 }} />
          <span style={{ fontFamily: "var(--mono)", minWidth: 46, textAlign: "right" }}>{migrate}%</span>
        </div>
        <div className="muted mt">
          {gap > 0
            ? `${t("simulate")} ${migrate}%, ${t("migratingStillAbove")} ${blended} — ${t("stillAboveCeiling")} ${gap} ${t("aboveCeilingOf")} ${client.mandate}.`
            : `${t("simulate")} ${migrate}%, ${t("migratingWithin")} ${blended} — ${t("withinMandateOf")} ${client.mandate}).`}
        </div>
      </div>

      {/* Overview of all clients — column distribution */}
      <div className="card">
        <div className="flex between mb">
          <h3 style={{ margin: 0 }}><i className="ti ti-users" />{t("allClients")}</h3>
          <span className={`tag ${fora.length ? "r" : "g"}`}>{fora.length ? `${fora.length} ${t("outsideMandate")}` : t("allWithin")}</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr>
              <th>{t("colClient")}</th><th>{t("colProfile")}</th><th>{t("colObjective")}</th>
              <th className="num">{t("colPortfolio")}</th><th className="num">{t("colTolerance")}</th><th className="num">{t("colMandate")}</th>
              <th>{t("colRulerDist")}</th><th>{t("colAlignment")}</th>
            </tr></thead>
            <tbody>
              {clients.map((c) => {
                const aligned = c.riskNumber <= c.mandate;
                const tol2 = TOLERANCE[c.profile];
                return (
                  <tr key={c.id} style={{ cursor: "pointer", background: c.id === sel ? "rgba(201,160,44,.06)" : undefined }} onClick={() => { setSel(c.id); setMigrate(0); }}>
                    <td style={{ fontWeight: 600, color: "var(--tx)" }}>{c.name}</td>
                    <td style={{ color: "var(--tx2)" }}>{c.profile}</td>
                    <td style={{ color: "var(--tx3)" }}>{OBJETIVO[c.profile]}</td>
                    <td className="num" style={{ color: aligned ? "var(--tx)" : "var(--red)", fontWeight: 600 }}>{c.riskNumber}</td>
                    <td className="num" style={{ color: "var(--tx2)" }}>{tol2}</td>
                    <td className="num" style={{ color: "var(--tx2)" }}>{c.mandate}</td>
                    <td><MiniRegua portfolio={c.riskNumber} tolerance={tol2} mandate={c.mandate} /></td>
                    <td>{aligned ? <span className="tag g">{t("within")}</span> : <span className="tag r">▲ +{c.riskNumber - c.mandate}</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="legend mt">
          <i><b style={{ background: "#4A90D9" }} />{t("legendMandateCeiling")}</i>
          <i><b style={{ background: "#EAF0F7" }} />{t("legendToleranceProfile")}</i>
          <i><b style={{ background: "#E74C3C" }} />{t("legendPortfolioOutside")}</i>
          <i><b style={{ background: "#2ECC71" }} />{t("legendPortfolioWithin")}</i>
          <span className="muted" style={{ marginLeft: "auto" }}>{t("clickRow")}</span>
        </div>
      </div>

      <div className="card mt" style={{ background: "transparent", borderStyle: "dashed" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <i className="ti ti-info-circle" style={{ color: "var(--blue)", fontSize: 15, flexShrink: 0, marginTop: 2 }} />
          <div className="muted" style={{ fontSize: 10.5, lineHeight: 1.6 }}>
            {t("footnote")}
          </div>
        </div>
      </div>
    </div>
  );
}

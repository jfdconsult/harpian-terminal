"use client";
import { useEffect, useMemo, useState } from "react";
import { CLIENTS, brl, type Client } from "@/lib/clients";
import { allClients } from "@/lib/clientStore";
import { publishScreenData } from "@/lib/jim-data";
import { HPC22_RN, HPC11_RN, TOLERANCE, OBJETIVO } from "@/lib/riskLevels";

// Régua compacta (inline) com marcadores — usada em cada linha da tabela.
function MiniRegua({ portfolio, tolerance, mandate }: { portfolio: number; tolerance: number; mandate: number }) {
  const dot = (v: number, color: string, title: string) => (
    <div title={title} style={{ position: "absolute", top: -2, left: `${v}%`, transform: "translateX(-50%)", width: 8, height: 8, borderRadius: "50%", background: color, border: "1.5px solid var(--bg)" }} />
  );
  return (
    <div style={{ position: "relative", height: 8, width: 150 }}>
      <div style={{ position: "absolute", top: 2, left: 0, right: 0, height: 4, borderRadius: 3, background: "linear-gradient(90deg,#2ECC71,#F39C12,#E74C3C)" }} />
      {dot(mandate, "#4A90D9", `mandato ${mandate}`)}
      {dot(tolerance, "#EAF0F7", `tolerância ${tolerance}`)}
      {dot(portfolio, portfolio > mandate ? "#E74C3C" : "#2ECC71", `portfólio ${portfolio}`)}
    </div>
  );
}

export default function Risco() {
  const [clients, setClients] = useState<Client[]>(CLIENTS);   // seed no SSR; localStorage no client
  const [sel, setSel] = useState(CLIENTS[0].id);
  const [migrate, setMigrate] = useState(0); // % migrado p/ o HPC22

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

  // Marcadores da régua do cliente selecionado; rótulos em 2 alturas p/ não colidir.
  const markers = [
    { v: HPC22_RN, color: "var(--gold)", label: `produto ${HPC22_RN}` },
    { v: client.mandate, color: "var(--blue)", label: `mandato ${client.mandate}` },
    { v: tol, color: "var(--tx)", label: `tolerância ${tol}` },
    { v: blended, color: gap > 0 ? "var(--red)" : "var(--green)", label: `portfólio ${blended}` },
  ].sort((a, b) => a.v - b.v);

  // Publica pro JIM o risco por cliente (selecionado + panorama da base).
  useEffect(() => {
    publishScreenData(
      "risco",
      "Risco por cliente na régua do Número de Risco (0–100, S&P 500 ≈ 27). Para cada cliente, 4 níveis: produto (fundo), tolerância (perfil/questionário), mandato (teto contratual) e portfólio (carteira). Tabela compara todos os clientes.",
      {
        clienteSelecionado: {
          nome: client.name, perfil: client.profile, objetivo,
          riscoProduto_HPC22: HPC22_RN, tolerancia: tol, mandato: client.mandate,
          riscoPortfolio: client.riskNumber, acimaDoMandato: client.riskNumber - client.mandate,
        },
        base: clients.map((c) => ({
          nome: c.name, perfil: c.profile, objetivo: OBJETIVO[c.profile],
          portfolio: c.riskNumber, tolerancia: TOLERANCE[c.profile], mandato: c.mandate,
          adequado: c.riskNumber <= c.mandate,
        })),
        foraDoMandato: fora.map((c) => c.name),
      },
      {
        briefing:
          `Você está vendo o risco por cliente. Selecionado: **${client.name}** (${client.profile}, objetivo ${objetivo}) — ` +
          `portfólio **${client.riskNumber}**, tolerância ${tol}, mandato ${client.mandate}` +
          (client.riskNumber > client.mandate ? ` (**${client.riskNumber - client.mandate} acima do teto**).` : " (dentro do teto).") +
          (fora.length ? ` Na base, ${fora.length} fora do mandato: ${fora.map((c) => c.name).join(", ")}.` : ""),
        suggestions: [
          client.riskNumber > client.mandate ? `Por que ${client.name} está fora do mandato?` : `${client.name} está bem posicionado?`,
          "Quais clientes precisam de rebalanceamento?",
          "Migrar pro HPC22 reduz o risco de quem?",
        ],
      }
    );
  }, [client, tol, objetivo, clients, fora]);

  return (
    <div className="screen">
      <div className="crumb">Risco › <b>Por cliente · 4 níveis</b></div>
      <div className="flex between wrap">
        <div>
          <div className="h1">Risco por cliente — os 4 níveis na mesma régua</div>
          <div className="sub" style={{ margin: 0 }}>
            Onde o portfólio de cada cliente está vs. a tolerância do perfil e o teto do mandato. Tudo no Número de Risco (0–100).
          </div>
        </div>
        <div className="flex" style={{ gap: 8, alignItems: "center" }}>
          <span className="flabel">Cliente:</span>
          <select className="fsel" style={{ fontSize: 13, padding: "8px 12px", minWidth: 220 }} value={sel} onChange={(e) => { setSel(e.target.value); setMigrate(0); }}>
            {clients.map((c) => (<option key={c.id} value={c.id}>{c.name} · {c.profile}</option>))}
          </select>
        </div>
      </div>

      {/* 4 níveis do cliente selecionado */}
      <div className="grid g4 mt mb">
        <div className="card"><h3><i className="ti ti-coin" />Risco produto</h3><div className="big" style={{ color: "var(--orange)" }}>{HPC22_RN}</div><div className="muted mt">HPC22 (o fundo). HPC11 = {HPC11_RN}.</div></div>
        <div className="card"><h3><i className="ti ti-user-heart" />Tolerância do cliente</h3><div className="big">{tol}</div><div className="muted mt">Perfil {client.profile} · objetivo {objetivo}.</div></div>
        <div className="card"><h3><i className="ti ti-file-certificate" />Mandato</h3><div className="big">{client.mandate}</div><div className="muted mt">Teto contratual da conta.</div></div>
        <div className="card" style={{ borderColor: gap > 0 ? "rgba(231,76,60,.3)" : "var(--line2)" }}>
          <h3><i className="ti ti-wallet" />Risco portfólio</h3>
          <div className={`big ${gap > 0 ? "r" : "g"}`}>{blended}</div>
          <div className="muted mt" style={{ color: gap > 0 ? "var(--red)" : "var(--green)" }}>
            {gap > 0 ? `▲ +${gap} acima do mandato` : "✓ dentro do mandato"}
          </div>
        </div>
      </div>

      {/* Régua do cliente selecionado */}
      <div className="card mb">
        <h3><i className="ti ti-scale" />{client.name} — na mesma régua</h3>
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
          <i><b style={{ background: "#C9A02C" }} />Produto {HPC22_RN}</i>
          <i><b style={{ background: "#EAF0F7" }} />Tolerância {tol}</i>
          <i><b style={{ background: "#4A90D9" }} />Mandato {client.mandate}</i>
          <i><b style={{ background: gap > 0 ? "#E74C3C" : "#2ECC71" }} />Portfólio {blended}</i>
        </div>
        <div className="flex mt" style={{ gap: 14 }}>
          <span className="muted" style={{ minWidth: 210 }}>Simular: migrar {client.name} para o HPC22</span>
          <input type="range" min={0} max={100} value={migrate} onChange={(e) => setMigrate(+e.target.value)} style={{ flex: 1 }} />
          <span style={{ fontFamily: "var(--mono)", minWidth: 46, textAlign: "right" }}>{migrate}%</span>
        </div>
        <div className="muted mt">
          {gap > 0
            ? `Migrando ${migrate}%, o risco do portfólio cai para ${blended} — ainda ${gap} acima do teto ${client.mandate}.`
            : `Migrando ${migrate}%, o portfólio fica em ${blended} — dentro do mandato (≤ ${client.mandate}).`}
        </div>
      </div>

      {/* Panorama de todos os clientes — distribuição em colunas */}
      <div className="card">
        <div className="flex between mb">
          <h3 style={{ margin: 0 }}><i className="ti ti-users" />Todos os clientes na régua</h3>
          <span className={`tag ${fora.length ? "r" : "g"}`}>{fora.length ? `${fora.length} fora do mandato` : "todos dentro"}</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr>
              <th>Cliente</th><th>Perfil</th><th>Objetivo</th>
              <th className="num">Portfólio</th><th className="num">Tolerância</th><th className="num">Mandato</th>
              <th>Distribuição na régua</th><th>Alinhamento</th>
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
                    <td>{aligned ? <span className="tag g">dentro</span> : <span className="tag r">▲ +{c.riskNumber - c.mandate}</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="legend mt">
          <i><b style={{ background: "#4A90D9" }} />Mandato (teto)</i>
          <i><b style={{ background: "#EAF0F7" }} />Tolerância (perfil)</i>
          <i><b style={{ background: "#E74C3C" }} />Portfólio fora</i>
          <i><b style={{ background: "#2ECC71" }} />Portfólio dentro</i>
          <span className="muted" style={{ marginLeft: "auto" }}>Clique numa linha para abrir o cliente na régua acima.</span>
        </div>
      </div>

      <div className="card mt" style={{ background: "transparent", borderStyle: "dashed" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <i className="ti ti-info-circle" style={{ color: "var(--blue)", fontSize: 15, flexShrink: 0, marginTop: 2 }} />
          <div className="muted" style={{ fontSize: 10.5, lineHeight: 1.6 }}>
            Portfólio = Número de Risco da carteira do cliente. Tolerância vem do perfil (questionário) e o mandato do contrato. Produto vem do motor interno. Escala calibrada ao S&amp;P 500 ≈ 27.
          </div>
        </div>
      </div>
    </div>
  );
}

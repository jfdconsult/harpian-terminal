"use client";
import { useMemo, useState, useEffect } from "react";
import { brl, type Client } from "@/lib/clients";
import { findClient } from "@/lib/clientStore";
import { publishScreenData } from "@/lib/jim-data";
import ClienteEditModal from "./ClienteEditModal";
import type { ScreenId } from "@/lib/nav";

const HPC22_RN = 38; // Product Risk Number (internal engine)
const ALLOC_COLORS = ["#4A90D9", "#C9A02C", "#2ECC71", "#F39C12", "#7d96b3"];
// Account["type"] stays in Portuguese in lib/clients.ts (stored value); this is
// only for what's rendered on screen.
const ACCOUNT_TYPE_TXT: Record<string, string> = {
  "Conta corrente": "Checking account",
  Corretora: "Brokerage",
  "Custódia": "Custody",
  Outro: "Other",
};

export function ClientDetail({ client: clientProp, go, screen = "cliente" }: { client: Client; go: (id: ScreenId, param?: string) => void; screen?: ScreenId }) {
  const [client, setClient] = useState(clientProp);
  const [editing, setEditing] = useState(false);
  const [editTab, setEditTab] = useState<"perfil" | "portfolios">("perfil");
  const [focusPortfolioId, setFocusPortfolioId] = useState<string | undefined>(undefined);
  useEffect(() => setClient(clientProp), [clientProp]);

  function openPortfolioEdit(portfolioId?: string) {
    setEditTab("portfolios");
    setFocusPortfolioId(portfolioId);
    setEditing(true);
  }

  const [migrate, setMigrate] = useState(0); // % migrated to HPC22
  const ganhoPct = client.invested ? (client.current / client.invested - 1) * 100 : 0;
  const aligned = client.riskNumber <= client.mandate;

  const blendedRN = useMemo(
    () => Math.round((1 - migrate / 100) * client.riskNumber + (migrate / 100) * HPC22_RN),
    [migrate, client.riskNumber]
  );
  const gap = blendedRN - client.mandate;

  // Publishes the open client/portfolio to JIM (suitability, risk, allocation).
  useEffect(() => {
    const foco = screen === "carteira" ? "a carteira de" : "o cliente";
    publishScreenData(
      screen,
      `Client record for ${client.name} (${client.type}, ${client.profile} profile). AUM, gain, Risk Number vs mandate, current allocation, and profile suitability.`,
      {
        cliente: client.name, tipo: client.type, perfil: client.profile,
        aumAtual: client.current, investido: client.invested, ganhoPct: +ganhoPct.toFixed(1),
        riskNumber: client.riskNumber, mandato: client.mandate,
        adequado: aligned, gapAcimaDoMandato: aligned ? 0 : client.riskNumber - client.mandate,
        alocacaoHarpianPct: client.harpianPct,
        alocacao: client.alloc.map((a) => ({ classe: a.label, pct: a.pct })),
        email: client.email || null, dadosPessoais: client.personalData || null,
        contas: (client.accounts || []).map((a) => ({ banco: a.bank, tipo: a.type, numero: a.accountNumber })),
        portfolios: (client.portfolios || []).map((p) => ({ nome: p.name, posicoes: p.positions.length, valor: p.positions.reduce((s, x) => s + x.qty * x.avgPrice, 0) })),
        integracoes: (client.integrations || []).map((i) => ({ sistema: i.system, status: i.status })),
      },
      {
        briefing:
          `You are viewing ${foco === "a carteira de" ? "the portfolio of" : "the client"} **${client.name}** (${client.type}, ${client.profile} profile). ` +
          `AUM ${brl(client.current)}, gain +${ganhoPct.toFixed(1)}%. ` +
          `Risk Number **${client.riskNumber}** vs mandate **${client.mandate}** — ` +
          (aligned ? "within mandate." : `**${client.riskNumber - client.mandate} above the ceiling**.`),
        suggestions: [
          aligned ? "Is this client well positioned?" : "Why is this client outside the mandate?",
          "Which position weighs most on their risk?",
          "Does migrating to HPC22 resolve the compliance gap?",
        ],
      }
    );
  }, [client, screen, aligned, ganhoPct]);

  return (
    <>
      <div className="fhhead">
        <div>
          <div className="tk" style={{ fontSize: 20 }}>{client.name}</div>
          <div className="nm">{client.type} · {client.profile}</div>
        </div>
        <div className="fhstat"><div className="l">Current AUM</div><div className="v">{brl(client.current)}</div></div>
        <div className="fhstat"><div className="l">Gain</div><div className="v g">+{ganhoPct.toFixed(1)}%</div></div>
        <div className="fhstat"><div className="l">Since</div><div className="v" style={{ fontSize: 14 }}>{client.since}</div></div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="btn ghost" onClick={() => { setEditTab("perfil"); setFocusPortfolioId(undefined); setEditing(true); }}><i className="ti ti-settings" />Edit client</button>
          <button className="btn" onClick={() => go("ordem", client.id)}><i className="ti ti-send" />Send order</button>
        </div>
      </div>

      {editing && (
        <ClienteEditModal
          client={client}
          initialTab={editTab}
          focusPortfolioId={focusPortfolioId}
          onClose={() => setEditing(false)}
          onSaved={(updated) => { setClient(updated); setEditing(false); }}
        />
      )}

      <div className="grid g2">
        <div className="card">
          <h3><i className="ti ti-chart-donut" />What they hold today</h3>
          {client.alloc.map((a, i) => (
            <div key={a.label} style={{ marginBottom: 10 }}>
              <div className="flex between" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: a.tone === "r" ? "var(--red)" : "var(--tx2)" }}>{a.label}</span>
                <span className="v" style={{ fontFamily: "var(--mono)", color: "var(--tx)" }}>{a.pct}%</span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: "#08182c", overflow: "hidden" }}>
                <div style={{ width: `${a.pct}%`, height: "100%", background: a.tone === "r" ? "var(--red)" : a.tone === "g" ? "var(--green)" : ALLOC_COLORS[i % ALLOC_COLORS.length] }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ borderColor: aligned ? "var(--line2)" : "rgba(231,76,60,.25)" }}>
          <h3><i className={`ti ${aligned ? "ti-shield-check" : "ti-alert-triangle"}`} />Risk gap</h3>
          <div className={`big ${gap > 0 ? "r" : "g"}`}>{gap > 0 ? `+${gap}` : "✓"}</div>
          <div className="muted mt" style={{ lineHeight: 1.6 }}>
            Risk Number {blendedRN} vs. mandate {client.mandate}. {client.note}
          </div>
          <div className="flex mt" style={{ gap: 12 }}>
            <span className="muted" style={{ minWidth: 150, fontSize: 12 }}>Simulate migration to HPC22</span>
            <input type="range" min={0} max={100} value={migrate} onChange={(e) => setMigrate(+e.target.value)} style={{ flex: 1 }} />
            <span style={{ fontFamily: "var(--mono)", minWidth: 42, textAlign: "right" }}>{migrate}%</span>
          </div>
          <div className="muted mt" style={{ fontSize: 11 }}>
            {gap > 0
              ? `Migrating ${migrate}%, risk drops to ${blendedRN} — still ${gap} above the ceiling.`
              : `Migrating ${migrate}%, the portfolio falls within the mandate (${blendedRN} ≤ ${client.mandate}).`}
          </div>
        </div>
      </div>

      <div className="card mt">
        <h3><i className="ti ti-info-circle" />Summary</h3>
        <div className="grid g4">
          <div className="kv"><span className="muted">Invested</span><span className="v">{brl(client.invested)}</span></div>
          <div className="kv"><span className="muted">Current</span><span className="v">{brl(client.current)}</span></div>
          <div className="kv"><span className="muted">Current Risk Nº</span><span className="v" style={{ color: aligned ? "var(--tx)" : "var(--red)" }}>{client.riskNumber}</span></div>
          <div className="kv"><span className="muted">Harpian Allocation</span><span className="v" style={{ color: "var(--gold)" }}>{client.harpianPct}%</span></div>
        </div>
      </div>

      <div className="grid g3 mt">
        <div className="card">
          <h3><i className="ti ti-id" />Personal data</h3>
          {client.email || client.personalData?.phone || client.personalData?.cpfCnpj ? (
            <>
              {client.email && <div className="kv"><span className="muted">Email</span><span className="v" style={{ fontSize: 12 }}>{client.email}</span></div>}
              {client.personalData?.phone && <div className="kv"><span className="muted">Phone</span><span className="v">{client.personalData.phone}</span></div>}
              {client.personalData?.cpfCnpj && <div className="kv"><span className="muted">CPF/CNPJ</span><span className="v">{client.personalData.cpfCnpj}</span></div>}
              {client.personalData?.responsavel && <div className="kv"><span className="muted">Responsible party</span><span className="v">{client.personalData.responsavel}</span></div>}
            </>
          ) : <div className="muted">No data registered — click Edit client.</div>}
        </div>

        <div className="card">
          <h3><i className="ti ti-building-bank" />Accounts & banks</h3>
          {(client.accounts?.length || 0) === 0 ? <div className="muted">No accounts registered.</div> : (
            client.accounts!.map((a) => (
              <div className="kv" key={a.id}><span>{a.bank || "(no name)"} <span className="muted">{ACCOUNT_TYPE_TXT[a.type] || a.type}</span></span><span className="v" style={{ fontSize: 11 }}>{a.accountNumber || "—"}</span></div>
            ))
          )}
        </div>

        <div className="card">
          <h3><i className="ti ti-plug" />Integrations (API)</h3>
          {(client.integrations?.length || 0) === 0 ? <div className="muted">No integration registered.</div> : (
            client.integrations!.map((i) => (
              <div className="kv" key={i.id}><span>{i.system || "(no name)"}</span><span className={`tag ${i.status === "conectado" ? "g" : i.status === "erro" ? "r" : "o"}`}>{i.status}</span></div>
            ))
          )}
        </div>
      </div>

      <div className="card mt">
        <div className="flex between" style={{ alignItems: "center" }}>
          <h3 style={{ margin: 0 }}><i className="ti ti-briefcase" />Portfolios ({client.portfolios?.length || 0})</h3>
          <button className="btn ghost" style={{ fontSize: 12 }} onClick={() => openPortfolioEdit()}><i className="ti ti-plus" />Add portfolio</button>
        </div>
        {(client.portfolios?.length || 0) === 0 ? (
          <div className="placeholder mt"><i className="ti ti-briefcase" /><b>No portfolio registered</b></div>
        ) : (
          <>
            <div className="muted mb mt" style={{ fontSize: 11 }}>Click a portfolio to see the full breakdown — each portfolio has its own screen. Use the gear icon to edit directly.</div>
            <div className="grid g3">
              {client.portfolios!.map((p) => {
                const hasItems = (p.items?.length || 0) > 0;
                const totalUsd = hasItems ? p.items!.reduce((s, x) => s + x.valorUsd, 0) : null;
                const totalBrl = p.positions.reduce((s, x) => s + x.qty * x.avgPrice, 0);
                const acc = client.accounts?.find((a) => a.id === p.accountId);
                return (
                  <div
                    key={p.id}
                    onClick={() => go("portfolio-detalhe", `${client.id}:${p.id}`)}
                    style={{ background: "var(--panel2)", border: "1px solid var(--line2)", borderRadius: 8, padding: 12, cursor: "pointer", transition: "border-color .15s", position: "relative" }}
                  >
                    <button
                      className="btn ghost"
                      title="Edit portfolio"
                      style={{ position: "absolute", top: 8, right: 8, padding: "3px 7px" }}
                      onClick={(e) => { e.stopPropagation(); openPortfolioEdit(p.id); }}
                    >
                      <i className="ti ti-settings" />
                    </button>
                    <div style={{ fontWeight: 600, color: "var(--tx)", paddingRight: 24 }}>{p.name}</div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{acc ? acc.bank : "no linked account"}{p.modelLabel && ` · ${p.modelLabel}`}</div>
                    <div style={{ fontSize: 15, color: "var(--gold)", fontWeight: 600, marginTop: 6 }}>
                      {hasItems ? "$" + totalUsd!.toLocaleString("en-US", { maximumFractionDigits: 0 }) : brl(totalBrl)}
                    </div>
                    <div className="muted" style={{ fontSize: 11 }}>{hasItems ? p.items!.length : p.positions.length} {hasItems ? "products" : "positions"} <i className="ti ti-chevron-right" style={{ float: "right" }} /></div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default function Cliente({ clientId, go }: { clientId: string; go: (id: ScreenId, param?: string) => void }) {
  const client = findClient(clientId);
  return (
    <div className="screen">
      <ClientDetail client={client} go={go} />
    </div>
  );
}

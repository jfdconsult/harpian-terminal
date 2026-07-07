"use client";
import { useMemo, useState, useEffect } from "react";
import { brl, type Client } from "@/lib/clients";
import { findClient } from "@/lib/clientStore";
import { publishScreenData } from "@/lib/jim-data";
import ClienteEditModal from "./ClienteEditModal";
import type { ScreenId } from "@/lib/nav";

const HPC22_RN = 38; // Número de Risco do produto (motor interno)
const ALLOC_COLORS = ["#4A90D9", "#C9A02C", "#2ECC71", "#F39C12", "#7d96b3"];

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

  const [migrate, setMigrate] = useState(0); // % migrado p/ HPC22
  const ganhoPct = client.invested ? (client.current / client.invested - 1) * 100 : 0;
  const aligned = client.riskNumber <= client.mandate;

  const blendedRN = useMemo(
    () => Math.round((1 - migrate / 100) * client.riskNumber + (migrate / 100) * HPC22_RN),
    [migrate, client.riskNumber]
  );
  const gap = blendedRN - client.mandate;

  // Publica pro JIM o cliente/carteira aberto (adequação, risco, alocação).
  useEffect(() => {
    const foco = screen === "carteira" ? "a carteira de" : "o cliente";
    publishScreenData(
      screen,
      `Ficha do cliente ${client.name} (${client.type}, perfil ${client.profile}). AUM, ganho, Número de Risco vs mandato, alocação atual e adequação ao perfil.`,
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
          `Você está vendo ${foco} **${client.name}** (${client.type}, perfil ${client.profile}). ` +
          `AUM ${brl(client.current)}, ganho +${ganhoPct.toFixed(1).replace(".", ",")}%. ` +
          `Número de Risco **${client.riskNumber}** vs mandato **${client.mandate}** — ` +
          (aligned ? "dentro do mandato." : `**${client.riskNumber - client.mandate} acima do teto**.`),
        suggestions: [
          aligned ? "Esse cliente está bem posicionado?" : "Por que esse cliente está fora do mandato?",
          "Qual posição pesa mais no risco dele?",
          "Migrar pro HPC22 resolve o enquadramento?",
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
        <div className="fhstat"><div className="l">AUM atual</div><div className="v">{brl(client.current)}</div></div>
        <div className="fhstat"><div className="l">Ganho</div><div className="v g">+{ganhoPct.toFixed(1).replace(".", ",")}%</div></div>
        <div className="fhstat"><div className="l">Desde</div><div className="v" style={{ fontSize: 14 }}>{client.since}</div></div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="btn ghost" onClick={() => { setEditTab("perfil"); setFocusPortfolioId(undefined); setEditing(true); }}><i className="ti ti-settings" />Editar cliente</button>
          <button className="btn" onClick={() => go("ordem", client.id)}><i className="ti ti-send" />Enviar ordem</button>
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
          <h3><i className="ti ti-chart-donut" />O que ela tem hoje</h3>
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
          <h3><i className={`ti ${aligned ? "ti-shield-check" : "ti-alert-triangle"}`} />Gap de risco</h3>
          <div className={`big ${gap > 0 ? "r" : "g"}`}>{gap > 0 ? `+${gap}` : "✓"}</div>
          <div className="muted mt" style={{ lineHeight: 1.6 }}>
            Número de Risco {blendedRN} vs. mandato {client.mandate}. {client.note}
          </div>
          <div className="flex mt" style={{ gap: 12 }}>
            <span className="muted" style={{ minWidth: 150, fontSize: 12 }}>Simular migração p/ HPC22</span>
            <input type="range" min={0} max={100} value={migrate} onChange={(e) => setMigrate(+e.target.value)} style={{ flex: 1 }} />
            <span style={{ fontFamily: "var(--mono)", minWidth: 42, textAlign: "right" }}>{migrate}%</span>
          </div>
          <div className="muted mt" style={{ fontSize: 11 }}>
            {gap > 0
              ? `Migrando ${migrate}%, o risco cai para ${blendedRN} — ainda ${gap} acima do teto.`
              : `Migrando ${migrate}%, o portfólio entra dentro do mandato (${blendedRN} ≤ ${client.mandate}).`}
          </div>
        </div>
      </div>

      <div className="card mt">
        <h3><i className="ti ti-info-circle" />Resumo</h3>
        <div className="grid g4">
          <div className="kv"><span className="muted">Investido</span><span className="v">{brl(client.invested)}</span></div>
          <div className="kv"><span className="muted">Atual</span><span className="v">{brl(client.current)}</span></div>
          <div className="kv"><span className="muted">Risk Nº atual</span><span className="v" style={{ color: aligned ? "var(--tx)" : "var(--red)" }}>{client.riskNumber}</span></div>
          <div className="kv"><span className="muted">Alocação Harpian</span><span className="v" style={{ color: "var(--gold)" }}>{client.harpianPct}%</span></div>
        </div>
      </div>

      <div className="grid g3 mt">
        <div className="card">
          <h3><i className="ti ti-id" />Dados pessoais</h3>
          {client.email || client.personalData?.phone || client.personalData?.cpfCnpj ? (
            <>
              {client.email && <div className="kv"><span className="muted">E-mail</span><span className="v" style={{ fontSize: 12 }}>{client.email}</span></div>}
              {client.personalData?.phone && <div className="kv"><span className="muted">Telefone</span><span className="v">{client.personalData.phone}</span></div>}
              {client.personalData?.cpfCnpj && <div className="kv"><span className="muted">CPF/CNPJ</span><span className="v">{client.personalData.cpfCnpj}</span></div>}
              {client.personalData?.responsavel && <div className="kv"><span className="muted">Responsável</span><span className="v">{client.personalData.responsavel}</span></div>}
            </>
          ) : <div className="muted">Nenhum dado cadastrado — clique em Editar cliente.</div>}
        </div>

        <div className="card">
          <h3><i className="ti ti-building-bank" />Contas & bancos</h3>
          {(client.accounts?.length || 0) === 0 ? <div className="muted">Nenhuma conta cadastrada.</div> : (
            client.accounts!.map((a) => (
              <div className="kv" key={a.id}><span>{a.bank || "(sem nome)"} <span className="muted">{a.type}</span></span><span className="v" style={{ fontSize: 11 }}>{a.accountNumber || "—"}</span></div>
            ))
          )}
        </div>

        <div className="card">
          <h3><i className="ti ti-plug" />Integrações (API)</h3>
          {(client.integrations?.length || 0) === 0 ? <div className="muted">Nenhuma integração cadastrada.</div> : (
            client.integrations!.map((i) => (
              <div className="kv" key={i.id}><span>{i.system || "(sem nome)"}</span><span className={`tag ${i.status === "conectado" ? "g" : i.status === "erro" ? "r" : "o"}`}>{i.status}</span></div>
            ))
          )}
        </div>
      </div>

      <div className="card mt">
        <div className="flex between" style={{ alignItems: "center" }}>
          <h3 style={{ margin: 0 }}><i className="ti ti-briefcase" />Portfólios ({client.portfolios?.length || 0})</h3>
          <button className="btn ghost" style={{ fontSize: 12 }} onClick={() => openPortfolioEdit()}><i className="ti ti-plus" />Adicionar portfólio</button>
        </div>
        {(client.portfolios?.length || 0) === 0 ? (
          <div className="placeholder mt"><i className="ti ti-briefcase" /><b>Nenhum portfólio cadastrado</b></div>
        ) : (
          <>
            <div className="muted mb mt" style={{ fontSize: 11 }}>Clique num portfólio para ver o detalhamento completo — cada portfólio tem sua própria tela. Use a engrenagem pra editar direto.</div>
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
                      title="Editar portfólio"
                      style={{ position: "absolute", top: 8, right: 8, padding: "3px 7px" }}
                      onClick={(e) => { e.stopPropagation(); openPortfolioEdit(p.id); }}
                    >
                      <i className="ti ti-settings" />
                    </button>
                    <div style={{ fontWeight: 600, color: "var(--tx)", paddingRight: 24 }}>{p.name}</div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{acc ? acc.bank : "sem conta vinculada"}{p.modelLabel && ` · ${p.modelLabel}`}</div>
                    <div style={{ fontSize: 15, color: "var(--gold)", fontWeight: 600, marginTop: 6 }}>
                      {hasItems ? "US$ " + totalUsd!.toLocaleString("pt-BR", { maximumFractionDigits: 0 }) : brl(totalBrl)}
                    </div>
                    <div className="muted" style={{ fontSize: 11 }}>{hasItems ? p.items!.length : p.positions.length} {hasItems ? "produtos" : "posições"} <i className="ti ti-chevron-right" style={{ float: "right" }} /></div>
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
      <div className="crumb">Clientes › <b>{client.name}</b></div>
      <ClientDetail client={client} go={go} />
    </div>
  );
}

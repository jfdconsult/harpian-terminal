"use client";
import { useEffect, useState } from "react";
import { CLIENTS, brl, type Client } from "@/lib/clients";
import { allClients, addClient, questionnaireLink, type NewClientInput } from "@/lib/clientStore";
import { publishScreenData } from "@/lib/jim-data";
import type { ScreenId } from "@/lib/nav";

const EMPTY: NewClientInput = { name: "", type: "Family Office", profile: "Moderado", invested: 1_000_000, mandate: 55, email: "" };

export default function Clientes({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const [clients, setClients] = useState<Client[]>(CLIENTS);   // seed no SSR; localStorage no client
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<NewClientInput>(EMPTY);
  const [toast, setToast] = useState<string | null>(null);
  const [novoCliente, setNovoCliente] = useState<Client | null>(null);

  useEffect(() => { setClients(allClients()); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2600); return () => clearTimeout(t); }, [toast]);

  const totalAUM = clients.reduce((s, c) => s + c.current, 0);
  const avgHarpian = clients.length ? Math.round(clients.reduce((s, c) => s + c.harpianPct, 0) / clients.length) : 0;
  const foraMandato = clients.filter((c) => c.riskNumber > c.mandate).length;

  // Publica pro JIM a base de clientes (AUM, alinhamento, quem está fora do mandato).
  useEffect(() => {
    const fora = clients.filter((c) => c.riskNumber > c.mandate);
    publishScreenData(
      "clientes",
      "Lista de clientes do MFO: cada linha = nome, tipo, perfil, AUM atual, ganho, Número de Risco, alinhamento ao mandato e alocação Harpian.",
      {
        totalClientes: clients.length, aumTotal: totalAUM, alocacaoHarpianMedia: avgHarpian,
        foraDoMandato: fora.map((c) => ({ nome: c.name, riskNumber: c.riskNumber, mandato: c.mandate, acima: c.riskNumber - c.mandate })),
        clientes: clients.map((c) => ({
          nome: c.name, tipo: c.type, perfil: c.profile, aum: c.current,
          riskNumber: c.riskNumber, mandato: c.mandate, adequado: c.riskNumber <= c.mandate, harpianPct: c.harpianPct,
        })),
      },
      {
        briefing:
          `Você está vendo ${clients.length} clientes, AUM total ${brl(totalAUM)}, alocação Harpian média ${avgHarpian}%. ` +
          (fora.length
            ? `**${fora.length} fora do mandato**: ${fora.map((c) => `${c.name} (+${c.riskNumber - c.mandate})`).join(", ")}.`
            : "Todos dentro do mandato."),
        suggestions: [
          fora.length ? "Quem está fora do mandato e por quê?" : "Algum cliente exige atenção?",
          "Quem tem o maior AUM?",
          "Qual cliente está mais bem posicionado?",
        ],
      }
    );
  }, [clients, totalAUM, avgHarpian]);

  const stats = [
    { v: brl(totalAUM), l: "AUM total sob visão" },
    { v: String(clients.length), l: "Clientes" },
    { v: avgHarpian + "%", l: "Alocação Harpian média" },
    { v: String(foraMandato), l: "Fora do mandato", tone: foraMandato > 0 ? "r" : "g" },
  ];

  function salvar() {
    if (!form.name.trim()) { setToast("Informe o nome do cliente."); return; }
    const c = addClient({ ...form, invested: Number(form.invested) || 0, mandate: Number(form.mandate) || 50 });
    setClients(allClients());
    setModal(false);
    setForm(EMPTY);
    setNovoCliente(c);   // abre o cartão de "cliente criado" com o link do questionário
  }

  function copiarLink(id: string) {
    const link = questionnaireLink(id);
    if (navigator.clipboard) navigator.clipboard.writeText(link).then(() => setToast("Link do questionário copiado."));
    else setToast(link);
  }

  return (
    <div className="screen">
      <div className="crumb">Clientes › <b>Lista</b></div>
      <div className="flex between mb">
        <div><div className="h1">Meus clientes</div><div className="sub" style={{ margin: 0 }}>Sua base do MFO: carteiras, alinhamento ao mandato e alocação Harpian. Adicione clientes e envie o questionário de perfil.</div></div>
        <button className="btn" style={{ background: "var(--gold)", color: "#000", fontWeight: 600 }} onClick={() => setModal(true)}>
          <i className="ti ti-user-plus" style={{ marginRight: 6 }} />Adicionar cliente
        </button>
      </div>

      <div className="grid g4 mb">
        {stats.map((s, i) => (
          <div className="card" key={i} style={{ textAlign: "center", padding: 14 }}>
            <div className="big" style={{ fontSize: 22, color: s.tone === "r" ? "var(--red)" : s.tone === "g" ? "var(--green)" : "var(--gold)" }}>{s.v}</div>
            <div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 4, textTransform: "uppercase", letterSpacing: ".5px" }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* cartão do cliente recém-criado com o link do questionário */}
      {novoCliente && (
        <div className="card mb" style={{ borderColor: "var(--gold)", background: "rgba(201,160,44,.05)" }}>
          <div className="flex between" style={{ alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 600, color: "var(--gold)" }}><i className="ti ti-check" style={{ marginRight: 6 }} />Cliente <b>{novoCliente.name}</b> criado</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Envie o link do questionário de perfil pra ele responder. O resultado ajusta o mandato e a recomendação de carteira.</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
                <code style={{ fontSize: 12, background: "var(--bg2)", border: "1px solid var(--line)", padding: "6px 10px", borderRadius: 5, color: "var(--tx2)" }}>{questionnaireLink(novoCliente.id)}</code>
                <button className="btn" onClick={() => copiarLink(novoCliente.id)}><i className="ti ti-copy" style={{ marginRight: 5 }} />Copiar link</button>
                <button className="btn ghost" onClick={() => go("cliente", novoCliente.id)}>Abrir carteira →</button>
              </div>
            </div>
            <button className="btn ghost" aria-label="Fechar" onClick={() => setNovoCliente(null)}><i className="ti ti-x" /></button>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr>
              <th>Cliente</th><th>Tipo</th><th>Perfil</th><th className="num">Atual</th>
              <th className="num">Ganho</th><th className="num">Risk Nº</th><th>Alinhamento</th><th>Questionário</th><th></th>
            </tr></thead>
            <tbody>
              {clients.map((c) => {
                const ganhoPct = (c.current / c.invested - 1) * 100;
                const aligned = c.riskNumber <= c.mandate;
                return (
                  <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => go("cliente", c.id)}>
                    <td style={{ fontWeight: 600, color: "var(--tx)" }}>{c.name}</td>
                    <td style={{ color: "var(--tx2)" }}>{c.type}</td>
                    <td style={{ color: "var(--tx3)" }}>{c.profile}</td>
                    <td className="num" style={{ color: "var(--tx)" }}>{brl(c.current)}</td>
                    <td className="num" style={{ color: ganhoPct >= 0 ? "var(--green)" : "var(--red)" }}>{ganhoPct >= 0 ? "+" : ""}{ganhoPct.toFixed(1).replace(".", ",")}%</td>
                    <td className="num" style={{ color: aligned ? "var(--tx2)" : "var(--red)", fontWeight: 600 }}>{c.riskNumber}</td>
                    <td>{aligned ? <span className="tag g">dentro</span> : <span className="tag r">▲ +{c.riskNumber - c.mandate}</span>}</td>
                    <td><button className="btn ghost" style={{ fontSize: 11, padding: "3px 8px" }} onClick={(e) => { e.stopPropagation(); copiarLink(c.id); }}><i className="ti ti-send" style={{ marginRight: 4 }} />enviar</button></td>
                    <td style={{ textAlign: "right", color: "var(--tx3)" }}><i className="ti ti-chevron-right" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="muted mt" style={{ fontSize: 11 }}>Alinhamento = Número de Risco do portfólio vs. teto do mandato. Clique numa linha para abrir a carteira · &quot;enviar&quot; copia o link do questionário de perfil.</div>
      </div>

      {/* Modal adicionar cliente */}
      {modal && (
        <div onClick={() => setModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 460, maxWidth: "92vw", padding: 22 }}>
            <div className="flex between mb"><div className="h1" style={{ fontSize: 18 }}>Adicionar cliente</div><button className="btn ghost" onClick={() => setModal(false)}><i className="ti ti-x" /></button></div>
            <div style={{ display: "grid", gap: 12 }}>
              <label style={{ fontSize: 12 }}>Nome<input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ex: Vera Hollanda" style={{ width: "100%", marginTop: 4 }} /></label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ fontSize: 12 }}>Tipo<select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ width: "100%", marginTop: 4 }}>
                  <option>Family Office</option><option>Pessoa Física</option><option>Institucional</option><option>Institucional (endowment)</option>
                </select></label>
                <label style={{ fontSize: 12 }}>Perfil<select className="input" value={form.profile} onChange={(e) => setForm({ ...form, profile: e.target.value as Client["profile"] })} style={{ width: "100%", marginTop: 4 }}>
                  <option>Conservador</option><option>Moderado</option><option>Agressivo</option>
                </select></label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ fontSize: 12 }}>Valor investido (BRL)<input className="input" type="number" value={form.invested} onChange={(e) => setForm({ ...form, invested: Number(e.target.value) })} style={{ width: "100%", marginTop: 4 }} /></label>
                <label style={{ fontSize: 12 }}>Teto do mandato (Risk Nº)<input className="input" type="number" value={form.mandate} onChange={(e) => setForm({ ...form, mandate: Number(e.target.value) })} min={0} max={100} style={{ width: "100%", marginTop: 4 }} /></label>
              </div>
              <label style={{ fontSize: 12 }}>E-mail (para o questionário)<input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="cliente@email.com" style={{ width: "100%", marginTop: 4 }} /></label>
            </div>
            <div className="flex" style={{ gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
              <button className="btn ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn" style={{ background: "var(--gold)", color: "#000", fontWeight: 600 }} onClick={salvar}><i className="ti ti-check" style={{ marginRight: 5 }} />Criar cliente</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "var(--bg2)", border: "1px solid var(--gold)", color: "var(--tx)", padding: "10px 18px", borderRadius: 6, zIndex: 120, fontSize: 13 }}>{toast}</div>}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { CLIENTS, brl, type Client } from "@/lib/clients";
import { allClients, addClient, questionnaireLink, type NewClientInput } from "@/lib/clientStore";
import { publishScreenData } from "@/lib/jim-data";
import type { ScreenId } from "@/lib/nav";

const EMPTY: NewClientInput = { name: "", type: "Family Office", profile: "Moderate", invested: 1_000_000, mandate: 55, email: "" };

export default function Clientes({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const [clients, setClients] = useState<Client[]>(CLIENTS);   // seed on SSR; localStorage on client
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<NewClientInput>(EMPTY);
  const [toast, setToast] = useState<string | null>(null);
  const [novoCliente, setNovoCliente] = useState<Client | null>(null);

  useEffect(() => { setClients(allClients()); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2600); return () => clearTimeout(t); }, [toast]);

  const totalAUM = clients.reduce((s, c) => s + c.current, 0);
  const avgHarpian = clients.length ? Math.round(clients.reduce((s, c) => s + c.harpianPct, 0) / clients.length) : 0;
  const foraMandato = clients.filter((c) => c.riskNumber > c.mandate).length;

  // Publishes the client base to JIM (AUM, alignment, who's outside the mandate).
  useEffect(() => {
    const fora = clients.filter((c) => c.riskNumber > c.mandate);
    publishScreenData(
      "clientes",
      "MFO client list: each row = name, type, profile, current AUM, gain, Risk Number, mandate alignment, and Harpian allocation.",
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
          `You're looking at ${clients.length} clients, total AUM ${brl(totalAUM)}, average Harpian allocation ${avgHarpian}%. ` +
          (fora.length
            ? `**${fora.length} outside the mandate**: ${fora.map((c) => `${c.name} (+${c.riskNumber - c.mandate})`).join(", ")}.`
            : "All within the mandate."),
        suggestions: [
          fora.length ? "Who is outside the mandate and why?" : "Does any client need attention?",
          "Who has the largest AUM?",
          "Which client is best positioned?",
        ],
      }
    );
  }, [clients, totalAUM, avgHarpian]);

  const stats = [
    { v: brl(totalAUM), l: "Total AUM in view" },
    { v: String(clients.length), l: "Clients" },
    { v: avgHarpian + "%", l: "Average Harpian allocation" },
    { v: String(foraMandato), l: "Outside mandate", tone: foraMandato > 0 ? "r" : "g" },
  ];

  function salvar() {
    if (!form.name.trim()) { setToast("Enter the client's name."); return; }
    const c = addClient({ ...form, invested: Number(form.invested) || 0, mandate: Number(form.mandate) || 50 });
    setClients(allClients());
    setModal(false);
    setForm(EMPTY);
    setNovoCliente(c);   // opens the "client created" card with the questionnaire link
  }

  function copiarLink(id: string) {
    const link = questionnaireLink(id);
    if (navigator.clipboard) navigator.clipboard.writeText(link).then(() => setToast("Questionnaire link copied."));
    else setToast(link);
  }

  return (
    <div className="screen">
      <div className="flex between mb">
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
          <div className="h1" style={{ margin: 0 }}>My clients</div>
          <div className="sub" style={{ margin: 0 }}>Your MFO client base: portfolios, mandate alignment, and Harpian allocation. Add clients and send the profile questionnaire.</div>
        </div>
        <button className="btn" style={{ background: "var(--gold)", color: "#000", fontWeight: 600 }} onClick={() => setModal(true)}>
          <i className="ti ti-user-plus" style={{ marginRight: 6 }} />Add client
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

      {/* recently created client card with the questionnaire link */}
      {novoCliente && (
        <div className="card mb" style={{ borderColor: "var(--gold)", background: "rgba(201,160,44,.05)" }}>
          <div className="flex between" style={{ alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 600, color: "var(--gold)" }}><i className="ti ti-check" style={{ marginRight: 6 }} />Client <b>{novoCliente.name}</b> created</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Send the profile questionnaire link for them to fill out. The result adjusts the mandate and portfolio recommendation.</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
                <code style={{ fontSize: 12, background: "var(--bg2)", border: "1px solid var(--line)", padding: "6px 10px", borderRadius: 5, color: "var(--tx2)" }}>{questionnaireLink(novoCliente.id)}</code>
                <button className="btn" onClick={() => copiarLink(novoCliente.id)}><i className="ti ti-copy" style={{ marginRight: 5 }} />Copy link</button>
                <button className="btn ghost" onClick={() => go("cliente", novoCliente.id)}>Open portfolio →</button>
              </div>
            </div>
            <button className="btn ghost" aria-label="Close" onClick={() => setNovoCliente(null)}><i className="ti ti-x" /></button>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr>
              <th>Client</th><th>Type</th><th>Profile</th><th className="num">Current</th>
              <th className="num">Gain</th><th className="num">Risk Nº</th><th>Alignment</th><th>Questionnaire</th><th></th>
            </tr></thead>
            <tbody>
              {clients.map((c) => {
                const ganhoPct = c.invested ? (c.current / c.invested - 1) * 100 : 0;
                const aligned = c.riskNumber <= c.mandate;
                return (
                  <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => go("cliente", c.id)}>
                    <td style={{ fontWeight: 600, color: "var(--tx)" }}>{c.name}</td>
                    <td style={{ color: "var(--tx2)" }}>{c.type}</td>
                    <td style={{ color: "var(--tx3)" }}>{c.profile}</td>
                    <td className="num" style={{ color: "var(--tx)" }}>{brl(c.current)}</td>
                    <td className="num" style={{ color: ganhoPct >= 0 ? "var(--green)" : "var(--red)" }}>{ganhoPct >= 0 ? "+" : ""}{ganhoPct.toFixed(1)}%</td>
                    <td className="num" style={{ color: aligned ? "var(--tx2)" : "var(--red)", fontWeight: 600 }}>{c.riskNumber}</td>
                    <td>{aligned ? <span className="tag g">within</span> : <span className="tag r">▲ +{c.riskNumber - c.mandate}</span>}</td>
                    <td><button className="btn ghost" style={{ fontSize: 11, padding: "3px 8px" }} onClick={(e) => { e.stopPropagation(); copiarLink(c.id); }}><i className="ti ti-send" style={{ marginRight: 4 }} />send</button></td>
                    <td style={{ textAlign: "right", color: "var(--tx3)" }}><i className="ti ti-chevron-right" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="muted mt" style={{ fontSize: 11 }}>Alignment = portfolio Risk Number vs. mandate cap. Click a row to open the portfolio · &quot;send&quot; copies the profile questionnaire link.</div>
      </div>

      {/* Add client modal */}
      {modal && (
        <div onClick={() => setModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 460, maxWidth: "92vw", padding: 22 }}>
            <div className="flex between mb"><div className="h1" style={{ fontSize: 18 }}>Add client</div><button className="btn ghost" onClick={() => setModal(false)}><i className="ti ti-x" /></button></div>
            <div style={{ display: "grid", gap: 12 }}>
              <label style={{ fontSize: 12 }}>Name<input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Vera Hollanda" style={{ width: "100%", marginTop: 4 }} /></label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ fontSize: 12 }}>Type<select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ width: "100%", marginTop: 4 }}>
                  <option>Family Office</option><option>Individual</option><option>Institutional</option><option>Institutional (endowment)</option>
                </select></label>
                <label style={{ fontSize: 12 }}>Profile<select className="input" value={form.profile} onChange={(e) => setForm({ ...form, profile: e.target.value as Client["profile"] })} style={{ width: "100%", marginTop: 4 }}>
                  <option>Conservative</option><option>Moderate</option><option>Aggressive</option>
                </select></label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ fontSize: 12 }}>Amount invested (BRL)<input className="input" type="number" value={form.invested} onChange={(e) => setForm({ ...form, invested: Number(e.target.value) })} style={{ width: "100%", marginTop: 4 }} /></label>
                <label style={{ fontSize: 12 }}>Mandate cap (Risk Nº)<input className="input" type="number" value={form.mandate} onChange={(e) => setForm({ ...form, mandate: Number(e.target.value) })} min={0} max={100} style={{ width: "100%", marginTop: 4 }} /></label>
              </div>
              <label style={{ fontSize: 12 }}>Email (for the questionnaire)<input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="client@email.com" style={{ width: "100%", marginTop: 4 }} /></label>
            </div>
            <div className="flex" style={{ gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
              <button className="btn ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn" style={{ background: "var(--gold)", color: "#000", fontWeight: 600 }} onClick={salvar}><i className="ti ti-check" style={{ marginRight: 5 }} />Create client</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "var(--bg2)", border: "1px solid var(--gold)", color: "var(--tx)", padding: "10px 18px", borderRadius: 6, zIndex: 120, fontSize: 13 }}>{toast}</div>}
    </div>
  );
}

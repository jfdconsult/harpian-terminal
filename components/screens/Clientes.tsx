"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { CLIENTS, brl, type Client } from "@/lib/clients";
import { allClients, addClient, questionnaireLink, type NewClientInput } from "@/lib/clientStore";
import { publishScreenData } from "@/lib/jim-data";
import type { ScreenId } from "@/lib/nav";

const EMPTY: NewClientInput = { name: "", type: "Family Office", profile: "Moderate", invested: 1_000_000, mandate: 55, email: "" };

// ════════════════════════════════════════════════════════════════
// i18n — local dictionary for this screen (see Painel.tsx for the
// canonical pattern). One entry per user-visible English string.
// Brand/product terms (Harpian, Risk Number/Nº) and data values
// are intentionally NOT translated.
// ════════════════════════════════════════════════════════════════
const TR = {
  enterClientName: { pt: "Digite o nome do cliente.", en: "Enter the client's name." },
  questionnaireLinkCopied: { pt: "Link do questionário copiado.", en: "Questionnaire link copied." },
  totalAumInView: { pt: "AUM total em visualização", en: "Total AUM in view" },
  clients: { pt: "Clientes", en: "Clients" },
  avgHarpianAllocation: { pt: "Alocação média Harpian", en: "Average Harpian allocation" },
  outsideMandate: { pt: "Fora do mandato", en: "Outside mandate" },
  myClients: { pt: "Meus clientes", en: "My clients" },
  clientsSubtitle: { pt: "Sua base de clientes MFO: carteiras, alinhamento ao mandato e alocação Harpian. Adicione clientes e envie o questionário de perfil.", en: "Your MFO client base: portfolios, mandate alignment, and Harpian allocation. Add clients and send the profile questionnaire." },
  addClient: { pt: "Adicionar cliente", en: "Add client" },
  clientCreated: { pt: "criado", en: "created" },
  clientPrefix: { pt: "Cliente", en: "Client" },
  sendQuestionnaireHint: { pt: "Suba aqui seu portfólio — comece por você mesmo a analisar seu risco x retorno. Envie também o link do questionário de perfil para ele preencher.", en: "Upload your portfolio here — start by analyzing your own risk x return. Also send the profile questionnaire link for them to fill out." },
  emptyClientsTitle: { pt: "Nenhum cliente cadastrado ainda", en: "No clients registered yet" },
  emptyClientsHint: { pt: "Suba aqui seu portfólio — comece por você mesmo a analisar seu risco x retorno.", en: "Upload your portfolio here — start by analyzing your own risk x return." },
  uploadPortfolio: { pt: "Subir portfólio →", en: "Upload portfolio →" },
  copyLink: { pt: "Copiar link", en: "Copy link" },
  openPortfolio: { pt: "Abrir carteira →", en: "Open portfolio →" },
  close: { pt: "Fechar", en: "Close" },
  colClient: { pt: "Cliente", en: "Client" },
  colType: { pt: "Tipo", en: "Type" },
  colProfile: { pt: "Perfil", en: "Profile" },
  colCurrent: { pt: "Atual", en: "Current" },
  colGain: { pt: "Ganho", en: "Gain" },
  colRiskNo: { pt: "Risk Nº", en: "Risk Nº" },
  colAlignment: { pt: "Alinhamento", en: "Alignment" },
  colQuestionnaire: { pt: "Questionário", en: "Questionnaire" },
  within: { pt: "dentro", en: "within" },
  send: { pt: "enviar", en: "send" },
  alignmentFooter: { pt: "Alinhamento = Risk Number da carteira vs. teto do mandato. Clique em uma linha para abrir a carteira · “enviar” copia o link do questionário de perfil.", en: "Alignment = portfolio Risk Number vs. mandate cap. Click a row to open the portfolio · “send” copies the profile questionnaire link." },
  name: { pt: "Nome", en: "Name" },
  namePlaceholder: { pt: "ex.: Vera Hollanda", en: "e.g. Vera Hollanda" },
  type: { pt: "Tipo", en: "Type" },
  typeFamilyOffice: { pt: "Family Office", en: "Family Office" },
  typeIndividual: { pt: "Pessoa Física", en: "Individual" },
  typeInstitutional: { pt: "Institucional", en: "Institutional" },
  typeInstitutionalEndowment: { pt: "Institucional (endowment)", en: "Institutional (endowment)" },
  profile: { pt: "Perfil", en: "Profile" },
  profileConservative: { pt: "Conservador", en: "Conservative" },
  profileModerate: { pt: "Moderado", en: "Moderate" },
  profileAggressive: { pt: "Agressivo", en: "Aggressive" },
  amountInvested: { pt: "Valor investido (BRL)", en: "Amount invested (BRL)" },
  mandateCap: { pt: "Teto do mandato (Risk Nº)", en: "Mandate cap (Risk Nº)" },
  emailForQuestionnaire: { pt: "E-mail (para o questionário)", en: "Email (for the questionnaire)" },
  emailPlaceholder: { pt: "cliente@email.com", en: "client@email.com" },
  cancel: { pt: "Cancelar", en: "Cancel" },
  createClient: { pt: "Criar cliente", en: "Create client" },
} as const;

export default function Clientes({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const { lang } = useI18n();
  const t = (k: keyof typeof TR) => TR[k][lang];
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
    { v: brl(totalAUM), l: t("totalAumInView") },
    { v: String(clients.length), l: t("clients") },
    { v: avgHarpian + "%", l: t("avgHarpianAllocation") },
    { v: String(foraMandato), l: t("outsideMandate"), tone: foraMandato > 0 ? "r" : "g" },
  ];

  function salvar() {
    if (!form.name.trim()) { setToast(t("enterClientName")); return; }
    const c = addClient({ ...form, invested: Number(form.invested) || 0, mandate: Number(form.mandate) || 50 });
    setClients(allClients());
    setModal(false);
    setForm(EMPTY);
    setNovoCliente(c);   // opens the "client created" card with the questionnaire link
  }

  function copiarLink(id: string) {
    const link = questionnaireLink(id);
    if (navigator.clipboard) navigator.clipboard.writeText(link).then(() => setToast(t("questionnaireLinkCopied")));
    else setToast(link);
  }

  return (
    <div className="screen">
      <div className="flex between mb">
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
          <div className="h1" style={{ margin: 0 }}>{t("myClients")}</div>
          <div className="sub" style={{ margin: 0 }}>{t("clientsSubtitle")}</div>
        </div>
        <button className="btn" style={{ background: "var(--gold)", color: "#000", fontWeight: 600 }} onClick={() => setModal(true)}>
          <i className="ti ti-user-plus" style={{ marginRight: 6 }} />{t("addClient")}
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
              <div style={{ fontWeight: 600, color: "var(--gold)" }}><i className="ti ti-check" style={{ marginRight: 6 }} />{t("clientPrefix")} <b>{novoCliente.name}</b> {t("clientCreated")}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{t("sendQuestionnaireHint")}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
                <code style={{ fontSize: 12, background: "var(--bg2)", border: "1px solid var(--line)", padding: "6px 10px", borderRadius: 5, color: "var(--tx2)" }}>{questionnaireLink(novoCliente.id)}</code>
                <button className="btn" onClick={() => copiarLink(novoCliente.id)}><i className="ti ti-copy" style={{ marginRight: 5 }} />{t("copyLink")}</button>
                <button className="btn ghost" onClick={() => go("cliente", novoCliente.id)}>{t("openPortfolio")}</button>
              </div>
            </div>
            <button className="btn ghost" aria-label={t("close")} onClick={() => setNovoCliente(null)}><i className="ti ti-x" /></button>
          </div>
        </div>
      )}

      {clients.length === 0 && (
        <div className="card mb" style={{ textAlign: "center", padding: "36px 20px" }}>
          <i className="ti ti-upload" style={{ fontSize: 28, color: "var(--gold)" }} />
          <div style={{ fontWeight: 600, color: "var(--tx)", marginTop: 10 }}>{t("emptyClientsTitle")}</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>{t("emptyClientsHint")}</div>
          <button className="btn" style={{ background: "var(--gold)", color: "#000", fontWeight: 600, marginTop: 14 }} onClick={() => go("importar")}>
            <i className="ti ti-upload" style={{ marginRight: 6 }} />{t("uploadPortfolio")}
          </button>
        </div>
      )}

      <div className="card">
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr>
              <th>{t("colClient")}</th><th>{t("colType")}</th><th>{t("colProfile")}</th><th className="num">{t("colCurrent")}</th>
              <th className="num">{t("colGain")}</th><th className="num">{t("colRiskNo")}</th><th>{t("colAlignment")}</th><th>{t("colQuestionnaire")}</th><th></th>
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
                    <td>{aligned ? <span className="tag g">{t("within")}</span> : <span className="tag r">▲ +{c.riskNumber - c.mandate}</span>}</td>
                    <td><button className="btn ghost" style={{ fontSize: 11, padding: "3px 8px" }} onClick={(e) => { e.stopPropagation(); copiarLink(c.id); }}><i className="ti ti-send" style={{ marginRight: 4 }} />{t("send")}</button></td>
                    <td style={{ textAlign: "right", color: "var(--tx3)" }}><i className="ti ti-chevron-right" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="muted mt" style={{ fontSize: 11 }}>{t("alignmentFooter")}</div>
      </div>

      {/* Add client modal */}
      {modal && (
        <div onClick={() => setModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 460, maxWidth: "92vw", padding: 22 }}>
            <div className="flex between mb"><div className="h1" style={{ fontSize: 18 }}>{t("addClient")}</div><button className="btn ghost" onClick={() => setModal(false)}><i className="ti ti-x" /></button></div>
            <div style={{ display: "grid", gap: 12 }}>
              <label style={{ fontSize: 12 }}>{t("name")}<input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("namePlaceholder")} style={{ width: "100%", marginTop: 4 }} /></label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ fontSize: 12 }}>{t("type")}<select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ width: "100%", marginTop: 4 }}>
                  <option value="Family Office">{t("typeFamilyOffice")}</option><option value="Individual">{t("typeIndividual")}</option><option value="Institutional">{t("typeInstitutional")}</option><option value="Institutional (endowment)">{t("typeInstitutionalEndowment")}</option>
                </select></label>
                <label style={{ fontSize: 12 }}>{t("profile")}<select className="input" value={form.profile} onChange={(e) => setForm({ ...form, profile: e.target.value as Client["profile"] })} style={{ width: "100%", marginTop: 4 }}>
                  <option value="Conservative">{t("profileConservative")}</option><option value="Moderate">{t("profileModerate")}</option><option value="Aggressive">{t("profileAggressive")}</option>
                </select></label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ fontSize: 12 }}>{t("amountInvested")}<input className="input" type="number" value={form.invested} onChange={(e) => setForm({ ...form, invested: Number(e.target.value) })} style={{ width: "100%", marginTop: 4 }} /></label>
                <label style={{ fontSize: 12 }}>{t("mandateCap")}<input className="input" type="number" value={form.mandate} onChange={(e) => setForm({ ...form, mandate: Number(e.target.value) })} min={0} max={100} style={{ width: "100%", marginTop: 4 }} /></label>
              </div>
              <label style={{ fontSize: 12 }}>{t("emailForQuestionnaire")}<input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t("emailPlaceholder")} style={{ width: "100%", marginTop: 4 }} /></label>
            </div>
            <div className="flex" style={{ gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
              <button className="btn ghost" onClick={() => setModal(false)}>{t("cancel")}</button>
              <button className="btn" style={{ background: "var(--gold)", color: "#000", fontWeight: 600 }} onClick={salvar}><i className="ti ti-check" style={{ marginRight: 5 }} />{t("createClient")}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "var(--bg2)", border: "1px solid var(--gold)", color: "var(--tx)", padding: "10px 18px", borderRadius: 6, zIndex: 120, fontSize: 13 }}>{toast}</div>}
    </div>
  );
}

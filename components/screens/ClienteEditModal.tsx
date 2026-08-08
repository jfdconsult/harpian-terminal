"use client";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { updateClient, portfoliosTotal } from "@/lib/clientStore";
import { parsePortfolioCsv, downloadPortfolioTemplate } from "@/lib/csv";
import type { Client, Account, Portfolio, ApiIntegration, ImportedPosition } from "@/lib/clients";

type Tab = "perfil" | "pessoais" | "contas" | "portfolios" | "integracoes";

const TR = {
  tabProfile: { pt: "Perfil", en: "Profile" },
  tabPersonal: { pt: "Dados pessoais", en: "Personal data" },
  tabAccounts: { pt: "Contas e bancos", en: "Accounts & banks" },
  tabPortfolios: { pt: "Carteiras", en: "Portfolios" },
  tabIntegrations: { pt: "Integrações (API)", en: "Integrations (API)" },
  editClient: { pt: "Editar cliente", en: "Edit client" },
  name: { pt: "Nome", en: "Name" },
  type: { pt: "Tipo", en: "Type" },
  riskProfile: { pt: "Perfil de risco", en: "Risk profile" },
  optFamilyOffice: { pt: "Family Office", en: "Family Office" },
  optIndividual: { pt: "Pessoa física", en: "Individual" },
  optInstitutional: { pt: "Institucional", en: "Institutional" },
  optInstitutionalEndowment: { pt: "Institucional (endowment)", en: "Institutional (endowment)" },
  optConservative: { pt: "Conservador", en: "Conservative" },
  optModerate: { pt: "Moderado", en: "Moderate" },
  optAggressive: { pt: "Agressivo", en: "Aggressive" },
  since: { pt: "Desde (mm/aaaa)", en: "Since (mm/yyyy)" },
  investedAmount: { pt: "Valor investido (BRL)", en: "Invested amount (BRL)" },
  currentValue: { pt: "Valor atual (BRL)", en: "Current value (BRL)" },
  calculatedFromPortfolios: { pt: "Calculado a partir das carteiras (aba Carteiras).", en: "Calculated from portfolios (Portfolios tab)." },
  riskNumber: { pt: "Risk Number (0–100)", en: "Risk Number (0–100)" },
  mandate: { pt: "Mandato — teto contratual (0–100)", en: "Mandate — contractual ceiling (0–100)" },
  harpianAllocation: { pt: "Alocação Harpian (%)", en: "Harpian Allocation (%)" },
  note: { pt: "Observação", en: "Note" },
  email: { pt: "E-mail", en: "Email" },
  phone: { pt: "Telefone", en: "Phone" },
  cpfCnpj: { pt: "CPF / CNPJ", en: "CPF / CNPJ" },
  contactPerson: { pt: "Pessoa de contato / responsável", en: "Contact person / responsible party" },
  address: { pt: "Endereço", en: "Address" },
  noAccounts: { pt: "Nenhuma conta cadastrada", en: "No accounts registered" },
  bankBroker: { pt: "Banco / corretora", en: "Bank / broker" },
  bankBrokerPlaceholder: { pt: "ex.: XP Investimentos", en: "e.g. XP Investimentos" },
  optChecking: { pt: "Conta corrente", en: "Checking account" },
  optBrokerage: { pt: "Corretora", en: "Brokerage" },
  optCustody: { pt: "Custódia", en: "Custody" },
  optOther: { pt: "Outro", en: "Other" },
  branch: { pt: "Agência", en: "Branch" },
  accountNo: { pt: "Nº da conta", en: "Account No." },
  custodianIfDifferent: { pt: "Custodiante (se diferente)", en: "Custodian (if different)" },
  addAccount: { pt: "Adicionar conta", en: "Add account" },
  noValidRows: { pt: "Nenhuma linha válida encontrada (ativo, quantidade, preço médio).", en: "No valid rows found (asset, quantity, average price)." },
  positionsImported: { pt: "posição(ões) importada(s) ·", en: "position(s) imported ·" },
  rowsSkipped: { pt: "linha(s) ignorada(s).", en: "row(s) skipped." },
  noPortfolio: { pt: "Nenhuma carteira cadastrada", en: "No portfolio registered" },
  noPortfolioHint: { pt: "Um cliente pode ter várias — uma por banco, por exemplo.", en: "A client can have several — one per bank, for example." },
  noLinkedAccount: { pt: "— nenhuma conta vinculada", en: "— no linked account" },
  noName: { pt: "(sem nome)", en: "(no name)" },
  positions: { pt: "posições", en: "positions" },
  csv: { pt: "CSV", en: "CSV" },
  asset: { pt: "Ativo", en: "Asset" },
  qty: { pt: "Qtd.", en: "Qty." },
  avgPrice: { pt: "Preço médio", en: "Average price" },
  addPosition: { pt: "Adicionar posição", en: "Add position" },
  addPortfolio: { pt: "Adicionar carteira", en: "Add portfolio" },
  downloadCsvTemplate: { pt: "Baixar modelo CSV", en: "Download CSV template" },
  integrationsIntro: { pt: "Conexão com o sistema de gestão próprio do MFO (custódia, back-office). A sincronização automática é fase 2 — por ora, isso apenas registra a conexão.", en: "Connection to the MFO's own management system (custody, back-office). Automatic sync is phase 2 — for now, this only registers the connection." },
  noIntegration: { pt: "Nenhuma integração cadastrada", en: "No integration registered" },
  system: { pt: "Sistema", en: "System" },
  systemPlaceholder: { pt: "ex.: Comdinheiro, sistema interno do MFO", en: "e.g. Comdinheiro, MFO's internal system" },
  status: { pt: "Status", en: "Status" },
  optConnected: { pt: "Conectado", en: "Connected" },
  optPendingSetup: { pt: "Configuração pendente", en: "Pending setup" },
  optError: { pt: "Erro", en: "Error" },
  apiBaseUrl: { pt: "URL base da API", en: "API base URL" },
  apiKey: { pt: "Chave da API", en: "API key" },
  addIntegration: { pt: "Adicionar integração", en: "Add integration" },
  cancel: { pt: "Cancelar", en: "Cancel" },
  saveChanges: { pt: "Salvar alterações", en: "Save changes" },
} as const;

const TABS: { id: Tab; key: keyof typeof TR; icon: string }[] = [
  { id: "perfil", key: "tabProfile", icon: "ti-user" },
  { id: "pessoais", key: "tabPersonal", icon: "ti-id" },
  { id: "contas", key: "tabAccounts", icon: "ti-building-bank" },
  { id: "portfolios", key: "tabPortfolios", icon: "ti-briefcase" },
  { id: "integracoes", key: "tabIntegrations", icon: "ti-plug" },
];

const uid = () => Math.random().toString(36).slice(2, 9);

const inputSt: React.CSSProperties = { width: "100%" };
const label: React.CSSProperties = { display: "block", fontSize: 11, color: "var(--tx3)", marginBottom: 4, marginTop: 10 };

export default function ClienteEditModal({ client, initialTab, focusPortfolioId, onClose, onSaved }: { client: Client; initialTab?: Tab; focusPortfolioId?: string; onClose: () => void; onSaved: (c: Client) => void }) {
  const { lang } = useI18n();
  const t = (k: keyof typeof TR) => TR[k][lang];
  const [tab, setTab] = useState<Tab>(initialTab || "perfil");
  const [form, setForm] = useState<Client>(() => JSON.parse(JSON.stringify(client)));
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvTargetPortfolio, setCsvTargetPortfolio] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const focusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusPortfolioId && focusRef.current) focusRef.current.scrollIntoView({ block: "center" });
  }, [focusPortfolioId]);

  const accounts = form.accounts || [];
  const portfolios = form.portfolios || [];
  const integrations = form.integrations || [];
  const personal = form.personalData || {};

  function set<K extends keyof Client>(key: K, value: Client[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function setPersonal(patch: Partial<NonNullable<Client["personalData"]>>) {
    setForm((f) => ({ ...f, personalData: { ...(f.personalData || {}), ...patch } }));
  }

  // ---- Accounts ----
  function addAccount() {
    const a: Account = { id: uid(), bank: "", type: "Corretora" };
    set("accounts", [...accounts, a]);
  }
  function updateAccount(id: string, patch: Partial<Account>) {
    set("accounts", accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }
  function removeAccount(id: string) {
    set("accounts", accounts.filter((a) => a.id !== id));
    set("portfolios", portfolios.map((p) => (p.accountId === id ? { ...p, accountId: undefined } : p)));
  }

  // ---- Portfolios ----
  function addPortfolio() {
    const p: Portfolio = { id: uid(), name: `Portfolio ${portfolios.length + 1}`, positions: [] };
    set("portfolios", [...portfolios, p]);
  }
  function updatePortfolio(id: string, patch: Partial<Portfolio>) {
    set("portfolios", portfolios.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  function removePortfolio(id: string) {
    set("portfolios", portfolios.filter((p) => p.id !== id));
  }
  function addPosition(portfolioId: string) {
    const pos: ImportedPosition = { ticker: "", qty: 0, avgPrice: 0 };
    updatePortfolio(portfolioId, { positions: [...(portfolios.find((p) => p.id === portfolioId)?.positions || []), pos] });
  }
  function updatePosition(portfolioId: string, idx: number, patch: Partial<ImportedPosition>) {
    const p = portfolios.find((x) => x.id === portfolioId);
    if (!p) return;
    const positions = p.positions.map((x, i) => (i === idx ? { ...x, ...patch } : x));
    updatePortfolio(portfolioId, { positions });
  }
  function removePosition(portfolioId: string, idx: number) {
    const p = portfolios.find((x) => x.id === portfolioId);
    if (!p) return;
    updatePortfolio(portfolioId, { positions: p.positions.filter((_, i) => i !== idx) });
  }
  function triggerCsvUpload(portfolioId: string) {
    setCsvTargetPortfolio(portfolioId);
    fileRef.current?.click();
  }
  function onCsvSelected(file: File) {
    setCsvError(null);
    file.text().then((text) => {
      const { rows, skipped } = parsePortfolioCsv(text);
      if (!rows.length) { setCsvError(t("noValidRows")); return; }
      if (csvTargetPortfolio) updatePortfolio(csvTargetPortfolio, { positions: rows });
      if (skipped) setCsvError(`${rows.length} ${t("positionsImported")} ${skipped} ${t("rowsSkipped")}`);
    });
  }

  // ---- Integrations ----
  function addIntegration() {
    const i: ApiIntegration = { id: uid(), system: "", status: "a configurar" };
    set("integrations", [...integrations, i]);
  }
  function updateIntegration(id: string, patch: Partial<ApiIntegration>) {
    set("integrations", integrations.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }
  function removeIntegration(id: string) {
    set("integrations", integrations.filter((i) => i.id !== id));
  }

  function save() {
    const patch: Partial<Client> = { ...form };
    // if there are portfolios with positions, the client's current value becomes the sum of them —
    // consistent with the standalone import (Import/connect), which already uses the same account.
    if (portfolios.length && portfolios.some((p) => p.positions.length)) {
      patch.current = portfoliosTotal(portfolios);
    }
    const updated = updateClient(client.id, patch);
    onSaved(updated);
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 880, maxWidth: "94vw", maxHeight: "88vh", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
        <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onCsvSelected(f); e.target.value = ""; }} />

        {/* Header */}
        <div className="flex between" style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", alignItems: "center" }}>
          <div>
            <div className="h1" style={{ fontSize: 17, margin: 0 }}>{t("editClient")}</div>
            <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{client.name}</div>
          </div>
          <button className="btn ghost" onClick={onClose}><i className="ti ti-x" /></button>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ padding: "0 20px", flexShrink: 0 }}>
          {TABS.map((tb) => (
            <div key={tb.id} className={`tab${tab === tb.id ? " on" : ""}`} onClick={() => setTab(tb.id)}>
              <i className={`ti ${tb.icon}`} />{t(tb.key)}
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
          {tab === "perfil" && (
            <div className="grid g2">
              <label style={{ fontSize: 12 }}>{t("name")}
                <input className="input" style={inputSt} value={form.name} onChange={(e) => set("name", e.target.value)} />
              </label>
              <label style={{ fontSize: 12 }}>{t("type")}
                <select className="input" style={inputSt} value={form.type} onChange={(e) => set("type", e.target.value)}>
                  <option>{t("optFamilyOffice")}</option><option>{t("optIndividual")}</option><option>{t("optInstitutional")}</option><option>{t("optInstitutionalEndowment")}</option>
                </select>
              </label>
              <label style={{ fontSize: 12 }}>{t("riskProfile")}
                <select className="input" style={inputSt} value={form.profile} onChange={(e) => set("profile", e.target.value as Client["profile"])}>
                  <option>{t("optConservative")}</option><option>{t("optModerate")}</option><option>{t("optAggressive")}</option>
                </select>
              </label>
              <label style={{ fontSize: 12 }}>{t("since")}
                <input className="input" style={inputSt} value={form.since} onChange={(e) => set("since", e.target.value)} />
              </label>
              <label style={{ fontSize: 12 }}>{t("investedAmount")}
                <input className="input" type="number" style={inputSt} value={form.invested} onChange={(e) => set("invested", Number(e.target.value))} />
              </label>
              <label style={{ fontSize: 12 }}>{t("currentValue")}
                <input className="input" type="number" style={inputSt} value={form.current} onChange={(e) => set("current", Number(e.target.value))} disabled={portfolios.some((p) => p.positions.length > 0)} />
                {portfolios.some((p) => p.positions.length > 0) && <div className="muted" style={{ fontSize: 10, marginTop: 3 }}>{t("calculatedFromPortfolios")}</div>}
              </label>
              <label style={{ fontSize: 12 }}>{t("riskNumber")}
                <input className="input" type="number" min={0} max={100} style={inputSt} value={form.riskNumber} onChange={(e) => set("riskNumber", Number(e.target.value))} />
              </label>
              <label style={{ fontSize: 12 }}>{t("mandate")}
                <input className="input" type="number" min={0} max={100} style={inputSt} value={form.mandate} onChange={(e) => set("mandate", Number(e.target.value))} />
              </label>
              <label style={{ fontSize: 12 }}>{t("harpianAllocation")}
                <input className="input" type="number" min={0} max={100} style={inputSt} value={form.harpianPct} onChange={(e) => set("harpianPct", Number(e.target.value))} />
              </label>
              <label style={{ fontSize: 12, gridColumn: "1 / -1" }}>{t("note")}
                <textarea className="input" style={{ ...inputSt, minHeight: 60 }} value={form.note || ""} onChange={(e) => set("note", e.target.value)} />
              </label>
            </div>
          )}

          {tab === "pessoais" && (
            <div className="grid g2">
              <label style={{ fontSize: 12 }}>{t("email")}
                <input className="input" type="email" style={inputSt} value={form.email || ""} onChange={(e) => set("email", e.target.value)} />
              </label>
              <label style={{ fontSize: 12 }}>{t("phone")}
                <input className="input" style={inputSt} value={personal.phone || ""} onChange={(e) => setPersonal({ phone: e.target.value })} />
              </label>
              <label style={{ fontSize: 12 }}>{t("cpfCnpj")}
                <input className="input" style={inputSt} value={personal.cpfCnpj || ""} onChange={(e) => setPersonal({ cpfCnpj: e.target.value })} />
              </label>
              <label style={{ fontSize: 12 }}>{t("contactPerson")}
                <input className="input" style={inputSt} value={personal.responsavel || ""} onChange={(e) => setPersonal({ responsavel: e.target.value })} />
              </label>
              <label style={{ fontSize: 12, gridColumn: "1 / -1" }}>{t("address")}
                <input className="input" style={inputSt} value={personal.address || ""} onChange={(e) => setPersonal({ address: e.target.value })} />
              </label>
            </div>
          )}

          {tab === "contas" && (
            <>
              {accounts.length === 0 && <div className="placeholder" style={{ padding: 24 }}><i className="ti ti-building-bank" /><b>{t("noAccounts")}</b></div>}
              {accounts.map((a) => (
                <div className="card" key={a.id} style={{ marginBottom: 10, position: "relative" }}>
                  <button className="btn ghost" style={{ position: "absolute", top: 10, right: 10, padding: "3px 8px" }} onClick={() => removeAccount(a.id)}><i className="ti ti-trash" /></button>
                  <div className="grid g2">
                    <label style={{ fontSize: 12 }}>{t("bankBroker")}
                      <input className="input" style={inputSt} value={a.bank} onChange={(e) => updateAccount(a.id, { bank: e.target.value })} placeholder={t("bankBrokerPlaceholder")} />
                    </label>
                    <label style={{ fontSize: 12 }}>{t("type")}
                      <select className="input" style={inputSt} value={a.type} onChange={(e) => updateAccount(a.id, { type: e.target.value as Account["type"] })}>
                        <option value="Conta corrente">{t("optChecking")}</option><option value="Corretora">{t("optBrokerage")}</option><option value="Custódia">{t("optCustody")}</option><option value="Outro">{t("optOther")}</option>
                      </select>
                    </label>
                    <label style={{ fontSize: 12 }}>{t("branch")}
                      <input className="input" style={inputSt} value={a.agency || ""} onChange={(e) => updateAccount(a.id, { agency: e.target.value })} />
                    </label>
                    <label style={{ fontSize: 12 }}>{t("accountNo")}
                      <input className="input" style={inputSt} value={a.accountNumber || ""} onChange={(e) => updateAccount(a.id, { accountNumber: e.target.value })} />
                    </label>
                    <label style={{ fontSize: 12 }}>{t("custodianIfDifferent")}
                      <input className="input" style={inputSt} value={a.custodian || ""} onChange={(e) => updateAccount(a.id, { custodian: e.target.value })} />
                    </label>
                    <label style={{ fontSize: 12 }}>{t("note")}
                      <input className="input" style={inputSt} value={a.notes || ""} onChange={(e) => updateAccount(a.id, { notes: e.target.value })} />
                    </label>
                  </div>
                </div>
              ))}
              <button className="btn ghost" onClick={addAccount}><i className="ti ti-plus" />{t("addAccount")}</button>
            </>
          )}

          {tab === "portfolios" && (
            <>
              {csvError && <div className="pills mb"><span className="pill o"><span className="pd" />{csvError}</span></div>}
              {portfolios.length === 0 && <div className="placeholder" style={{ padding: 24 }}><i className="ti ti-briefcase" /><b>{t("noPortfolio")}</b><div className="muted mt">{t("noPortfolioHint")}</div></div>}
              {portfolios.map((p) => {
                const total = p.positions.reduce((s, x) => s + x.qty * x.avgPrice, 0);
                const isFocused = p.id === focusPortfolioId;
                return (
                  <div
                    className="card" key={p.id}
                    ref={isFocused ? focusRef : undefined}
                    style={{ marginBottom: 12, borderColor: isFocused ? "rgba(201,160,44,.5)" : undefined, boxShadow: isFocused ? "0 0 0 1px rgba(201,160,44,.5)" : undefined }}
                  >
                    <div className="flex between" style={{ alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                      <input className="input" style={{ fontWeight: 600, width: 220 }} value={p.name} onChange={(e) => updatePortfolio(p.id, { name: e.target.value })} />
                      <select className="input" style={{ width: 200 }} value={p.accountId || ""} onChange={(e) => updatePortfolio(p.id, { accountId: e.target.value || undefined })}>
                        <option value="">{t("noLinkedAccount")}</option>
                        {accounts.map((a) => <option key={a.id} value={a.id}>{a.bank || t("noName")}</option>)}
                      </select>
                      <span className="muted" style={{ fontSize: 11 }}>{p.positions.length} {t("positions")} · {total.toLocaleString(lang === "pt" ? "pt-BR" : "en-US", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}</span>
                      <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                        <button className="btn ghost" style={{ fontSize: 11 }} onClick={() => triggerCsvUpload(p.id)}><i className="ti ti-upload" />{t("csv")}</button>
                        <button className="btn ghost" style={{ fontSize: 11 }} onClick={() => removePortfolio(p.id)}><i className="ti ti-trash" /></button>
                      </div>
                    </div>
                    {p.positions.length > 0 && (
                      <table>
                        <thead><tr><th>{t("asset")}</th><th className="num">{t("qty")}</th><th className="num">{t("avgPrice")}</th><th style={{ width: 30 }}></th></tr></thead>
                        <tbody>
                          {p.positions.map((pos, i) => (
                            <tr key={i}>
                              <td><input className="input" style={{ width: 90 }} value={pos.ticker} onChange={(e) => updatePosition(p.id, i, { ticker: e.target.value.toUpperCase() })} /></td>
                              <td className="num"><input className="input" type="number" style={{ width: 90, textAlign: "right" }} value={pos.qty} onChange={(e) => updatePosition(p.id, i, { qty: Number(e.target.value) })} /></td>
                              <td className="num"><input className="input" type="number" style={{ width: 100, textAlign: "right" }} value={pos.avgPrice} onChange={(e) => updatePosition(p.id, i, { avgPrice: Number(e.target.value) })} /></td>
                              <td><button className="btn ghost" style={{ padding: "2px 6px" }} onClick={() => removePosition(p.id, i)}><i className="ti ti-x" /></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    <button className="btn ghost" style={{ fontSize: 11, marginTop: 8 }} onClick={() => addPosition(p.id)}><i className="ti ti-plus" />{t("addPosition")}</button>
                  </div>
                );
              })}
              <div className="flex" style={{ gap: 8 }}>
                <button className="btn ghost" onClick={addPortfolio}><i className="ti ti-plus" />{t("addPortfolio")}</button>
                <button className="btn ghost" onClick={downloadPortfolioTemplate}><i className="ti ti-download" />{t("downloadCsvTemplate")}</button>
              </div>
            </>
          )}

          {tab === "integracoes" && (
            <>
              <div className="muted mb" style={{ lineHeight: 1.6 }}>{t("integrationsIntro")}</div>
              {integrations.length === 0 && <div className="placeholder" style={{ padding: 24 }}><i className="ti ti-plug" /><b>{t("noIntegration")}</b></div>}
              {integrations.map((i) => (
                <div className="card" key={i.id} style={{ marginBottom: 10, position: "relative" }}>
                  <button className="btn ghost" style={{ position: "absolute", top: 10, right: 10, padding: "3px 8px" }} onClick={() => removeIntegration(i.id)}><i className="ti ti-trash" /></button>
                  <div className="grid g2">
                    <label style={{ fontSize: 12 }}>{t("system")}
                      <input className="input" style={inputSt} value={i.system} onChange={(e) => updateIntegration(i.id, { system: e.target.value })} placeholder={t("systemPlaceholder")} />
                    </label>
                    <label style={{ fontSize: 12 }}>{t("status")}
                      <select className="input" style={inputSt} value={i.status} onChange={(e) => updateIntegration(i.id, { status: e.target.value as ApiIntegration["status"] })}>
                        <option value="conectado">{t("optConnected")}</option><option value="a configurar">{t("optPendingSetup")}</option><option value="erro">{t("optError")}</option>
                      </select>
                    </label>
                    <label style={{ fontSize: 12 }}>{t("apiBaseUrl")}
                      <input className="input" style={inputSt} value={i.baseUrl || ""} onChange={(e) => updateIntegration(i.id, { baseUrl: e.target.value })} placeholder="https://api.sistema-mfo.com" />
                    </label>
                    <label style={{ fontSize: 12 }}>{t("apiKey")}
                      <input className="input" type="password" style={inputSt} value={i.apiKey || ""} onChange={(e) => updateIntegration(i.id, { apiKey: e.target.value })} />
                    </label>
                  </div>
                </div>
              ))}
              <button className="btn ghost" onClick={addIntegration}><i className="ti ti-plus" />{t("addIntegration")}</button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex" style={{ gap: 10, padding: 16, borderTop: "1px solid var(--line)", justifyContent: "flex-end", flexShrink: 0 }}>
          <button className="btn ghost" onClick={onClose}>{t("cancel")}</button>
          <button className="btn" style={{ background: "var(--gold)", color: "#000", fontWeight: 600 }} onClick={save}><i className="ti ti-check" />{t("saveChanges")}</button>
        </div>
      </div>
    </div>
  );
}

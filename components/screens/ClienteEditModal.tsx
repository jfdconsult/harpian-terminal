"use client";
import { useEffect, useRef, useState } from "react";
import { updateClient, portfoliosTotal } from "@/lib/clientStore";
import { parsePortfolioCsv, downloadPortfolioTemplate } from "@/lib/csv";
import type { Client, Account, Portfolio, ApiIntegration, ImportedPosition } from "@/lib/clients";

type Tab = "perfil" | "pessoais" | "contas" | "portfolios" | "integracoes";
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "perfil", label: "Perfil", icon: "ti-user" },
  { id: "pessoais", label: "Dados pessoais", icon: "ti-id" },
  { id: "contas", label: "Contas & bancos", icon: "ti-building-bank" },
  { id: "portfolios", label: "Portfólios", icon: "ti-briefcase" },
  { id: "integracoes", label: "Integrações (API)", icon: "ti-plug" },
];

const uid = () => Math.random().toString(36).slice(2, 9);

const inputSt: React.CSSProperties = { width: "100%" };
const label: React.CSSProperties = { display: "block", fontSize: 11, color: "var(--tx3)", marginBottom: 4, marginTop: 10 };

export default function ClienteEditModal({ client, initialTab, focusPortfolioId, onClose, onSaved }: { client: Client; initialTab?: Tab; focusPortfolioId?: string; onClose: () => void; onSaved: (c: Client) => void }) {
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

  // ---- Contas ----
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

  // ---- Portfólios ----
  function addPortfolio() {
    const p: Portfolio = { id: uid(), name: `Carteira ${portfolios.length + 1}`, positions: [] };
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
      if (!rows.length) { setCsvError("Não encontrei linhas válidas (ativo, quantidade, preço médio)."); return; }
      if (csvTargetPortfolio) updatePortfolio(csvTargetPortfolio, { positions: rows });
      if (skipped) setCsvError(`${rows.length} posições importadas · ${skipped} linha(s) ignorada(s).`);
    });
  }

  // ---- Integrações ----
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
    // se há portfólios com posições, o valor atual do cliente passa a ser a soma deles —
    // consistente com a importação avulsa (Importar/conectar) já usa a mesma conta.
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
            <div className="h1" style={{ fontSize: 17, margin: 0 }}>Editar cliente</div>
            <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{client.name}</div>
          </div>
          <button className="btn ghost" onClick={onClose}><i className="ti ti-x" /></button>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ padding: "0 20px", flexShrink: 0 }}>
          {TABS.map((t) => (
            <div key={t.id} className={`tab${tab === t.id ? " on" : ""}`} onClick={() => setTab(t.id)}>
              <i className={`ti ${t.icon}`} />{t.label}
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
          {tab === "perfil" && (
            <div className="grid g2">
              <label style={{ fontSize: 12 }}>Nome
                <input className="input" style={inputSt} value={form.name} onChange={(e) => set("name", e.target.value)} />
              </label>
              <label style={{ fontSize: 12 }}>Tipo
                <select className="input" style={inputSt} value={form.type} onChange={(e) => set("type", e.target.value)}>
                  <option>Family Office</option><option>Pessoa Física</option><option>Institucional</option><option>Institucional (endowment)</option>
                </select>
              </label>
              <label style={{ fontSize: 12 }}>Perfil de risco
                <select className="input" style={inputSt} value={form.profile} onChange={(e) => set("profile", e.target.value as Client["profile"])}>
                  <option>Conservador</option><option>Moderado</option><option>Agressivo</option>
                </select>
              </label>
              <label style={{ fontSize: 12 }}>Desde (mm/aaaa)
                <input className="input" style={inputSt} value={form.since} onChange={(e) => set("since", e.target.value)} />
              </label>
              <label style={{ fontSize: 12 }}>Valor investido (BRL)
                <input className="input" type="number" style={inputSt} value={form.invested} onChange={(e) => set("invested", Number(e.target.value))} />
              </label>
              <label style={{ fontSize: 12 }}>Valor atual (BRL)
                <input className="input" type="number" style={inputSt} value={form.current} onChange={(e) => set("current", Number(e.target.value))} disabled={portfolios.some((p) => p.positions.length > 0)} />
                {portfolios.some((p) => p.positions.length > 0) && <div className="muted" style={{ fontSize: 10, marginTop: 3 }}>Calculado a partir dos portfólios (aba Portfólios).</div>}
              </label>
              <label style={{ fontSize: 12 }}>Número de Risco (0–100)
                <input className="input" type="number" min={0} max={100} style={inputSt} value={form.riskNumber} onChange={(e) => set("riskNumber", Number(e.target.value))} />
              </label>
              <label style={{ fontSize: 12 }}>Mandato — teto contratual (0–100)
                <input className="input" type="number" min={0} max={100} style={inputSt} value={form.mandate} onChange={(e) => set("mandate", Number(e.target.value))} />
              </label>
              <label style={{ fontSize: 12 }}>Alocação Harpian (%)
                <input className="input" type="number" min={0} max={100} style={inputSt} value={form.harpianPct} onChange={(e) => set("harpianPct", Number(e.target.value))} />
              </label>
              <label style={{ fontSize: 12, gridColumn: "1 / -1" }}>Observação
                <textarea className="input" style={{ ...inputSt, minHeight: 60 }} value={form.note || ""} onChange={(e) => set("note", e.target.value)} />
              </label>
            </div>
          )}

          {tab === "pessoais" && (
            <div className="grid g2">
              <label style={{ fontSize: 12 }}>E-mail
                <input className="input" type="email" style={inputSt} value={form.email || ""} onChange={(e) => set("email", e.target.value)} />
              </label>
              <label style={{ fontSize: 12 }}>Telefone
                <input className="input" style={inputSt} value={personal.phone || ""} onChange={(e) => setPersonal({ phone: e.target.value })} />
              </label>
              <label style={{ fontSize: 12 }}>CPF / CNPJ
                <input className="input" style={inputSt} value={personal.cpfCnpj || ""} onChange={(e) => setPersonal({ cpfCnpj: e.target.value })} />
              </label>
              <label style={{ fontSize: 12 }}>Pessoa de contato / responsável
                <input className="input" style={inputSt} value={personal.responsavel || ""} onChange={(e) => setPersonal({ responsavel: e.target.value })} />
              </label>
              <label style={{ fontSize: 12, gridColumn: "1 / -1" }}>Endereço
                <input className="input" style={inputSt} value={personal.address || ""} onChange={(e) => setPersonal({ address: e.target.value })} />
              </label>
            </div>
          )}

          {tab === "contas" && (
            <>
              {accounts.length === 0 && <div className="placeholder" style={{ padding: 24 }}><i className="ti ti-building-bank" /><b>Nenhuma conta cadastrada</b></div>}
              {accounts.map((a) => (
                <div className="card" key={a.id} style={{ marginBottom: 10, position: "relative" }}>
                  <button className="btn ghost" style={{ position: "absolute", top: 10, right: 10, padding: "3px 8px" }} onClick={() => removeAccount(a.id)}><i className="ti ti-trash" /></button>
                  <div className="grid g2">
                    <label style={{ fontSize: 12 }}>Banco / corretora
                      <input className="input" style={inputSt} value={a.bank} onChange={(e) => updateAccount(a.id, { bank: e.target.value })} placeholder="ex: XP Investimentos" />
                    </label>
                    <label style={{ fontSize: 12 }}>Tipo
                      <select className="input" style={inputSt} value={a.type} onChange={(e) => updateAccount(a.id, { type: e.target.value as Account["type"] })}>
                        <option>Conta corrente</option><option>Corretora</option><option>Custódia</option><option>Outro</option>
                      </select>
                    </label>
                    <label style={{ fontSize: 12 }}>Agência
                      <input className="input" style={inputSt} value={a.agency || ""} onChange={(e) => updateAccount(a.id, { agency: e.target.value })} />
                    </label>
                    <label style={{ fontSize: 12 }}>Nº da conta
                      <input className="input" style={inputSt} value={a.accountNumber || ""} onChange={(e) => updateAccount(a.id, { accountNumber: e.target.value })} />
                    </label>
                    <label style={{ fontSize: 12 }}>Custodiante (se diferente)
                      <input className="input" style={inputSt} value={a.custodian || ""} onChange={(e) => updateAccount(a.id, { custodian: e.target.value })} />
                    </label>
                    <label style={{ fontSize: 12 }}>Observação
                      <input className="input" style={inputSt} value={a.notes || ""} onChange={(e) => updateAccount(a.id, { notes: e.target.value })} />
                    </label>
                  </div>
                </div>
              ))}
              <button className="btn ghost" onClick={addAccount}><i className="ti ti-plus" />Adicionar conta</button>
            </>
          )}

          {tab === "portfolios" && (
            <>
              {csvError && <div className="pills mb"><span className="pill o"><span className="pd" />{csvError}</span></div>}
              {portfolios.length === 0 && <div className="placeholder" style={{ padding: 24 }}><i className="ti ti-briefcase" /><b>Nenhum portfólio cadastrado</b><div className="muted mt">Um cliente pode ter vários — um por banco, por exemplo.</div></div>}
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
                        <option value="">— sem conta vinculada</option>
                        {accounts.map((a) => <option key={a.id} value={a.id}>{a.bank || "(sem nome)"}</option>)}
                      </select>
                      <span className="muted" style={{ fontSize: 11 }}>{p.positions.length} posições · {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}</span>
                      <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                        <button className="btn ghost" style={{ fontSize: 11 }} onClick={() => triggerCsvUpload(p.id)}><i className="ti ti-upload" />CSV</button>
                        <button className="btn ghost" style={{ fontSize: 11 }} onClick={() => removePortfolio(p.id)}><i className="ti ti-trash" /></button>
                      </div>
                    </div>
                    {p.positions.length > 0 && (
                      <table>
                        <thead><tr><th>Ativo</th><th className="num">Qtd.</th><th className="num">Preço médio</th><th style={{ width: 30 }}></th></tr></thead>
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
                    <button className="btn ghost" style={{ fontSize: 11, marginTop: 8 }} onClick={() => addPosition(p.id)}><i className="ti ti-plus" />Adicionar posição</button>
                  </div>
                );
              })}
              <div className="flex" style={{ gap: 8 }}>
                <button className="btn ghost" onClick={addPortfolio}><i className="ti ti-plus" />Adicionar portfólio</button>
                <button className="btn ghost" onClick={downloadPortfolioTemplate}><i className="ti ti-download" />Baixar modelo CSV</button>
              </div>
            </>
          )}

          {tab === "integracoes" && (
            <>
              <div className="muted mb" style={{ lineHeight: 1.6 }}>Conexão com o sistema de gestão do próprio MFO (custódia, back-office). Sincronização automática é fase 2 — aqui já fica registrado o cadastro da conexão.</div>
              {integrations.length === 0 && <div className="placeholder" style={{ padding: 24 }}><i className="ti ti-plug" /><b>Nenhuma integração cadastrada</b></div>}
              {integrations.map((i) => (
                <div className="card" key={i.id} style={{ marginBottom: 10, position: "relative" }}>
                  <button className="btn ghost" style={{ position: "absolute", top: 10, right: 10, padding: "3px 8px" }} onClick={() => removeIntegration(i.id)}><i className="ti ti-trash" /></button>
                  <div className="grid g2">
                    <label style={{ fontSize: 12 }}>Sistema
                      <input className="input" style={inputSt} value={i.system} onChange={(e) => updateIntegration(i.id, { system: e.target.value })} placeholder="ex: Comdinheiro, sistema interno do MFO" />
                    </label>
                    <label style={{ fontSize: 12 }}>Status
                      <select className="input" style={inputSt} value={i.status} onChange={(e) => updateIntegration(i.id, { status: e.target.value as ApiIntegration["status"] })}>
                        <option value="conectado">Conectado</option><option value="a configurar">A configurar</option><option value="erro">Erro</option>
                      </select>
                    </label>
                    <label style={{ fontSize: 12 }}>URL base da API
                      <input className="input" style={inputSt} value={i.baseUrl || ""} onChange={(e) => updateIntegration(i.id, { baseUrl: e.target.value })} placeholder="https://api.sistema-mfo.com" />
                    </label>
                    <label style={{ fontSize: 12 }}>Chave de API
                      <input className="input" type="password" style={inputSt} value={i.apiKey || ""} onChange={(e) => updateIntegration(i.id, { apiKey: e.target.value })} />
                    </label>
                  </div>
                </div>
              ))}
              <button className="btn ghost" onClick={addIntegration}><i className="ti ti-plus" />Adicionar integração</button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex" style={{ gap: 10, padding: 16, borderTop: "1px solid var(--line)", justifyContent: "flex-end", flexShrink: 0 }}>
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn" style={{ background: "var(--gold)", color: "#000", fontWeight: 600 }} onClick={save}><i className="ti ti-check" />Salvar alterações</button>
        </div>
      </div>
    </div>
  );
}

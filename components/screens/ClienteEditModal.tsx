"use client";
import { useEffect, useRef, useState } from "react";
import { updateClient, portfoliosTotal } from "@/lib/clientStore";
import { parsePortfolioCsv, downloadPortfolioTemplate } from "@/lib/csv";
import type { Client, Account, Portfolio, ApiIntegration, ImportedPosition } from "@/lib/clients";

type Tab = "perfil" | "pessoais" | "contas" | "portfolios" | "integracoes";
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "perfil", label: "Profile", icon: "ti-user" },
  { id: "pessoais", label: "Personal data", icon: "ti-id" },
  { id: "contas", label: "Accounts & banks", icon: "ti-building-bank" },
  { id: "portfolios", label: "Portfolios", icon: "ti-briefcase" },
  { id: "integracoes", label: "Integrations (API)", icon: "ti-plug" },
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
      if (!rows.length) { setCsvError("No valid rows found (asset, quantity, average price)."); return; }
      if (csvTargetPortfolio) updatePortfolio(csvTargetPortfolio, { positions: rows });
      if (skipped) setCsvError(`${rows.length} position(s) imported · ${skipped} row(s) skipped.`);
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
            <div className="h1" style={{ fontSize: 17, margin: 0 }}>Edit client</div>
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
              <label style={{ fontSize: 12 }}>Name
                <input className="input" style={inputSt} value={form.name} onChange={(e) => set("name", e.target.value)} />
              </label>
              <label style={{ fontSize: 12 }}>Type
                <select className="input" style={inputSt} value={form.type} onChange={(e) => set("type", e.target.value)}>
                  <option>Family Office</option><option>Individual</option><option>Institutional</option><option>Institutional (endowment)</option>
                </select>
              </label>
              <label style={{ fontSize: 12 }}>Risk profile
                <select className="input" style={inputSt} value={form.profile} onChange={(e) => set("profile", e.target.value as Client["profile"])}>
                  <option>Conservative</option><option>Moderate</option><option>Aggressive</option>
                </select>
              </label>
              <label style={{ fontSize: 12 }}>Since (mm/yyyy)
                <input className="input" style={inputSt} value={form.since} onChange={(e) => set("since", e.target.value)} />
              </label>
              <label style={{ fontSize: 12 }}>Invested amount (BRL)
                <input className="input" type="number" style={inputSt} value={form.invested} onChange={(e) => set("invested", Number(e.target.value))} />
              </label>
              <label style={{ fontSize: 12 }}>Current value (BRL)
                <input className="input" type="number" style={inputSt} value={form.current} onChange={(e) => set("current", Number(e.target.value))} disabled={portfolios.some((p) => p.positions.length > 0)} />
                {portfolios.some((p) => p.positions.length > 0) && <div className="muted" style={{ fontSize: 10, marginTop: 3 }}>Calculated from portfolios (Portfolios tab).</div>}
              </label>
              <label style={{ fontSize: 12 }}>Risk Number (0–100)
                <input className="input" type="number" min={0} max={100} style={inputSt} value={form.riskNumber} onChange={(e) => set("riskNumber", Number(e.target.value))} />
              </label>
              <label style={{ fontSize: 12 }}>Mandate — contractual ceiling (0–100)
                <input className="input" type="number" min={0} max={100} style={inputSt} value={form.mandate} onChange={(e) => set("mandate", Number(e.target.value))} />
              </label>
              <label style={{ fontSize: 12 }}>Harpian Allocation (%)
                <input className="input" type="number" min={0} max={100} style={inputSt} value={form.harpianPct} onChange={(e) => set("harpianPct", Number(e.target.value))} />
              </label>
              <label style={{ fontSize: 12, gridColumn: "1 / -1" }}>Note
                <textarea className="input" style={{ ...inputSt, minHeight: 60 }} value={form.note || ""} onChange={(e) => set("note", e.target.value)} />
              </label>
            </div>
          )}

          {tab === "pessoais" && (
            <div className="grid g2">
              <label style={{ fontSize: 12 }}>Email
                <input className="input" type="email" style={inputSt} value={form.email || ""} onChange={(e) => set("email", e.target.value)} />
              </label>
              <label style={{ fontSize: 12 }}>Phone
                <input className="input" style={inputSt} value={personal.phone || ""} onChange={(e) => setPersonal({ phone: e.target.value })} />
              </label>
              <label style={{ fontSize: 12 }}>CPF / CNPJ
                <input className="input" style={inputSt} value={personal.cpfCnpj || ""} onChange={(e) => setPersonal({ cpfCnpj: e.target.value })} />
              </label>
              <label style={{ fontSize: 12 }}>Contact person / responsible party
                <input className="input" style={inputSt} value={personal.responsavel || ""} onChange={(e) => setPersonal({ responsavel: e.target.value })} />
              </label>
              <label style={{ fontSize: 12, gridColumn: "1 / -1" }}>Address
                <input className="input" style={inputSt} value={personal.address || ""} onChange={(e) => setPersonal({ address: e.target.value })} />
              </label>
            </div>
          )}

          {tab === "contas" && (
            <>
              {accounts.length === 0 && <div className="placeholder" style={{ padding: 24 }}><i className="ti ti-building-bank" /><b>No accounts registered</b></div>}
              {accounts.map((a) => (
                <div className="card" key={a.id} style={{ marginBottom: 10, position: "relative" }}>
                  <button className="btn ghost" style={{ position: "absolute", top: 10, right: 10, padding: "3px 8px" }} onClick={() => removeAccount(a.id)}><i className="ti ti-trash" /></button>
                  <div className="grid g2">
                    <label style={{ fontSize: 12 }}>Bank / broker
                      <input className="input" style={inputSt} value={a.bank} onChange={(e) => updateAccount(a.id, { bank: e.target.value })} placeholder="e.g. XP Investimentos" />
                    </label>
                    <label style={{ fontSize: 12 }}>Type
                      <select className="input" style={inputSt} value={a.type} onChange={(e) => updateAccount(a.id, { type: e.target.value as Account["type"] })}>
                        <option value="Conta corrente">Checking account</option><option value="Corretora">Brokerage</option><option value="Custódia">Custody</option><option value="Outro">Other</option>
                      </select>
                    </label>
                    <label style={{ fontSize: 12 }}>Branch
                      <input className="input" style={inputSt} value={a.agency || ""} onChange={(e) => updateAccount(a.id, { agency: e.target.value })} />
                    </label>
                    <label style={{ fontSize: 12 }}>Account No.
                      <input className="input" style={inputSt} value={a.accountNumber || ""} onChange={(e) => updateAccount(a.id, { accountNumber: e.target.value })} />
                    </label>
                    <label style={{ fontSize: 12 }}>Custodian (if different)
                      <input className="input" style={inputSt} value={a.custodian || ""} onChange={(e) => updateAccount(a.id, { custodian: e.target.value })} />
                    </label>
                    <label style={{ fontSize: 12 }}>Note
                      <input className="input" style={inputSt} value={a.notes || ""} onChange={(e) => updateAccount(a.id, { notes: e.target.value })} />
                    </label>
                  </div>
                </div>
              ))}
              <button className="btn ghost" onClick={addAccount}><i className="ti ti-plus" />Add account</button>
            </>
          )}

          {tab === "portfolios" && (
            <>
              {csvError && <div className="pills mb"><span className="pill o"><span className="pd" />{csvError}</span></div>}
              {portfolios.length === 0 && <div className="placeholder" style={{ padding: 24 }}><i className="ti ti-briefcase" /><b>No portfolio registered</b><div className="muted mt">A client can have several — one per bank, for example.</div></div>}
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
                        <option value="">— no linked account</option>
                        {accounts.map((a) => <option key={a.id} value={a.id}>{a.bank || "(no name)"}</option>)}
                      </select>
                      <span className="muted" style={{ fontSize: 11 }}>{p.positions.length} positions · {total.toLocaleString("en-US", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}</span>
                      <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                        <button className="btn ghost" style={{ fontSize: 11 }} onClick={() => triggerCsvUpload(p.id)}><i className="ti ti-upload" />CSV</button>
                        <button className="btn ghost" style={{ fontSize: 11 }} onClick={() => removePortfolio(p.id)}><i className="ti ti-trash" /></button>
                      </div>
                    </div>
                    {p.positions.length > 0 && (
                      <table>
                        <thead><tr><th>Asset</th><th className="num">Qty.</th><th className="num">Average price</th><th style={{ width: 30 }}></th></tr></thead>
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
                    <button className="btn ghost" style={{ fontSize: 11, marginTop: 8 }} onClick={() => addPosition(p.id)}><i className="ti ti-plus" />Add position</button>
                  </div>
                );
              })}
              <div className="flex" style={{ gap: 8 }}>
                <button className="btn ghost" onClick={addPortfolio}><i className="ti ti-plus" />Add portfolio</button>
                <button className="btn ghost" onClick={downloadPortfolioTemplate}><i className="ti ti-download" />Download CSV template</button>
              </div>
            </>
          )}

          {tab === "integracoes" && (
            <>
              <div className="muted mb" style={{ lineHeight: 1.6 }}>Connection to the MFO's own management system (custody, back-office). Automatic sync is phase 2 — for now, this only registers the connection.</div>
              {integrations.length === 0 && <div className="placeholder" style={{ padding: 24 }}><i className="ti ti-plug" /><b>No integration registered</b></div>}
              {integrations.map((i) => (
                <div className="card" key={i.id} style={{ marginBottom: 10, position: "relative" }}>
                  <button className="btn ghost" style={{ position: "absolute", top: 10, right: 10, padding: "3px 8px" }} onClick={() => removeIntegration(i.id)}><i className="ti ti-trash" /></button>
                  <div className="grid g2">
                    <label style={{ fontSize: 12 }}>System
                      <input className="input" style={inputSt} value={i.system} onChange={(e) => updateIntegration(i.id, { system: e.target.value })} placeholder="e.g. Comdinheiro, MFO's internal system" />
                    </label>
                    <label style={{ fontSize: 12 }}>Status
                      <select className="input" style={inputSt} value={i.status} onChange={(e) => updateIntegration(i.id, { status: e.target.value as ApiIntegration["status"] })}>
                        <option value="conectado">Connected</option><option value="a configurar">Pending setup</option><option value="erro">Error</option>
                      </select>
                    </label>
                    <label style={{ fontSize: 12 }}>API base URL
                      <input className="input" style={inputSt} value={i.baseUrl || ""} onChange={(e) => updateIntegration(i.id, { baseUrl: e.target.value })} placeholder="https://api.sistema-mfo.com" />
                    </label>
                    <label style={{ fontSize: 12 }}>API key
                      <input className="input" type="password" style={inputSt} value={i.apiKey || ""} onChange={(e) => updateIntegration(i.id, { apiKey: e.target.value })} />
                    </label>
                  </div>
                </div>
              ))}
              <button className="btn ghost" onClick={addIntegration}><i className="ti ti-plus" />Add integration</button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex" style={{ gap: 10, padding: 16, borderTop: "1px solid var(--line)", justifyContent: "flex-end", flexShrink: 0 }}>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" style={{ background: "var(--gold)", color: "#000", fontWeight: 600 }} onClick={save}><i className="ti ti-check" />Save changes</button>
        </div>
      </div>
    </div>
  );
}

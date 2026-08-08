"use client";
import { useEffect, useRef, useState } from "react";
import { allClients, applyImportedPortfolio } from "@/lib/clientStore";
import { brl, type Client, type ImportedPosition } from "@/lib/clients";
import { parsePortfolioCsv, downloadPortfolioTemplate } from "@/lib/csv";
import { publishScreenData } from "@/lib/jim-data";
import { useI18n } from "@/lib/i18n";

interface RiskCalc {
  ok: boolean;
  riskNumber?: number;
  loss95_6m_pct?: number;
  coverage_pct?: number;
  missing?: string[];
  positions?: { ticker: string; weight_pct: number; riskNumber: number }[];
}

const TR = {
  uploadError: { pt: "Envie um arquivo .csv (ou .txt com os mesmos campos).", en: "Please upload a .csv file (or .txt with the same fields)." },
  noValidRows: { pt: "Nenhuma linha válida encontrada (esperado: ativo, quantidade, preço médio).", en: "No valid rows found (expected: asset, quantity, average price)." },
  bandAggressive: { pt: "Agressivo", en: "Aggressive" },
  bandGrowth: { pt: "Crescimento", en: "Growth" },
  bandModerate: { pt: "Moderado", en: "Moderate" },
  bandConservative: { pt: "Conservador", en: "Conservative" },
  title: { pt: "Importar / conectar", en: "Import / connect" },
  subtitle: { pt: "Fase 1: planilha do cliente (CSV). Fase 2: API do sistema de gestão.", en: "Phase 1: client spreadsheet (CSV). Phase 2: management system API." },
  dropHere: { pt: "Solte a planilha do cliente aqui (ou clique para escolher)", en: "Drop the client's spreadsheet here (or click to choose)" },
  dropHint: { pt: "CSV: ativo, quantidade, preço médio · ou conecte uma pasta MFO", en: "CSV: asset, quantity, average price · or connect an MFO folder" },
  chipPortfolioFolder: { pt: "pasta de carteira", en: "portfolio folder" },
  chipExcelCsv: { pt: "Excel / CSV", en: "Excel / CSV" },
  chipApiPhase2: { pt: "API (fase 2)", en: "API (phase 2)" },
  positionsLabel: { pt: "posições", en: "positions" },
  totalValueLabel: { pt: "valor total", en: "total value" },
  rowsSkippedLabel: { pt: "linha(s) ignorada(s)", en: "row(s) skipped" },
  applyToClient: { pt: "Aplicar ao cliente", en: "Apply to client" },
  calculatingRisk: { pt: "Calculando o Risk Number da carteira (perda histórica por ativo)…", en: "Calculating the portfolio's Risk Number (historical downside per asset)…" },
  riskNumberLabel: { pt: "RISK NUMBER", en: "RISK NUMBER" },
  estimatedLoss: { pt: "Perda estimada (95%, 6 meses)", en: "Estimated loss (95%, 6 months)" },
  mandateOf: { pt: "mandato de", en: "'s mandate" },
  ceiling: { pt: "teto", en: "ceiling" },
  over: { pt: "acima", en: "over" },
  within: { pt: "dentro", en: "within" },
  aboveMandateWarning: { pt: "A carteira importada está ", en: "The imported portfolio is " },
  aboveMandateWarningBold: { pt: "acima do mandato de risco do cliente", en: "above the client's risk mandate" },
  aboveMandateWarningEnd: { pt: ". Ajuste antes de mantê-la.", en: ". Bring it in line before keeping it." },
  methodologyNote: { pt: "Metodologia Nitrogen/HRIE — perda de 95% em 6 meses, por ativo, ponderada pela carteira.", en: "Nitrogen/HRIE methodology — 95% downside over 6 months, per asset, weighted by the portfolio." },
  coverageLabel: { pt: "Cobertura", en: "Coverage" },
  noHistoryLabel: { pt: "sem histórico", en: "no history" },
  ofPortfolio: { pt: "da carteira", en: "of the portfolio" },
  couldNotCalc: { pt: "Não foi possível calcular o Risk Number — os tickers precisam de histórico de preços (Yahoo). Verifique os símbolos.", en: "Could not calculate the Risk Number — tickers need price history (Yahoo). Check the symbols." },
  appliedTo: { pt: "Aplicado a", en: "Applied to" },
  newCurrentValue: { pt: "novo valor atual", en: "new current value" },
  thAsset: { pt: "Ativo", en: "Asset" },
  thQty: { pt: "Quantidade", en: "Quantity" },
  thAvgPrice: { pt: "Preço médio", en: "Average price" },
  thValue: { pt: "Valor", en: "Value" },
  spreadsheetTitle: { pt: "Planilha", en: "Spreadsheet" },
  spreadsheetDesc: { pt: "Modelo padrão de carteira (colunas: ativo, quantidade, preço médio).", en: "Standard portfolio template (columns: asset, quantity, average price)." },
  downloadTemplate: { pt: "Baixar modelo", en: "Download template" },
  mfoFolderTitle: { pt: "Pasta MFO", en: "MFO folder" },
  toConfigure: { pt: "a configurar", en: "to configure" },
  mfoFolderDesc: { pt: "Leitura automática de carteiras exportadas.", en: "Automatic reading of exported portfolios." },
  managementApiTitle: { pt: "API de gestão", en: "Management API" },
  phase2: { pt: "fase 2", en: "phase 2" },
  managementApiDesc: { pt: "Sincronização direta com o sistema do escritório.", en: "Direct sync with the office's system." },
} as const;

// Risk Number band → label/color (same reading as the Risk screen).
function rnBand(rn: number, t: (k: keyof typeof TR) => string): { label: string; color: string } {
  if (rn >= 75) return { label: t("bandAggressive"), color: "#E74C3C" };
  if (rn >= 55) return { label: t("bandGrowth"), color: "#E67E22" };
  if (rn >= 35) return { label: t("bandModerate"), color: "#C9A02C" };
  return { label: t("bandConservative"), color: "#2ECC71" };
}

export default function Importar() {
  const { lang } = useI18n();
  const t = (k: keyof typeof TR) => TR[k][lang];
  const [over, setOver] = useState(false);
  const [rows, setRows] = useState<ImportedPosition[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [applied, setApplied] = useState<{ client: string; total: number; rn?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [risk, setRisk] = useState<RiskCalc | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const cs = allClients();
    setClients(cs);
    if (cs.length) setClientId(cs[0].id);
  }, []);

  function handleFile(file: File) {
    setError(null);
    setApplied(null);
    if (!/\.(csv|txt)$/i.test(file.name)) {
      setError(t("uploadError"));
      return;
    }
    file.text().then((text) => {
      const { rows: parsed, skipped: sk } = parsePortfolioCsv(text);
      if (parsed.length === 0) {
        setError(t("noValidRows"));
        setRows([]);
        return;
      }
      setRows(parsed);
      setSkipped(sk);
      setFileName(file.name);
      computeRisk(parsed);
    });
  }

  // Risk Number of the imported portfolio (Nitrogen/HRIE methodology, via API).
  // Weighted by market value (qty x average price). Runs when the spreadsheet loads.
  function computeRisk(positions: ImportedPosition[]) {
    setRisk(null);
    if (!positions.length) return;
    setRiskLoading(true);
    fetch("/api/risk-number", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        positions: positions.map((p) => ({ ticker: p.ticker, marketValue: p.qty * p.avgPrice })),
      }),
    })
      .then((r) => r.json())
      .then((d: RiskCalc) => setRisk(d))
      .catch(() => setRisk({ ok: false }))
      .finally(() => setRiskLoading(false));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const total = rows.reduce((s, r) => s + r.qty * r.avgPrice, 0);
  const selectedClient = clients.find((c) => c.id === clientId);

  function aplicar() {
    if (!clientId || rows.length === 0) return;
    const rn = risk?.ok ? risk.riskNumber : undefined;
    const updated = applyImportedPortfolio(clientId, rows, rn);
    setApplied({ client: updated.name, total, rn });
    setClients(allClients());
  }

  // Publishes the loaded spreadsheet (preview) and the import result to JIM.
  useEffect(() => {
    publishScreenData(
      "importar",
      "Import/connect: upload of the client's portfolio spreadsheet (asset, quantity, average price). Once loaded, the manager picks the client and applies the imported portfolio.",
      {
        arquivo: fileName, linhasValidas: rows.length, linhasIgnoradas: skipped,
        valorTotal: total, clienteAlvo: selectedClient?.name || null,
        posicoes: rows.slice(0, 30),
        ultimaImportacaoAplicada: applied,
      },
      {
        briefing: rows.length
          ? `You loaded **${fileName}**: ${rows.length} positions, total value ${brl(total)}` +
            (skipped ? ` (${skipped} row(s) skipped).` : ".") +
            (applied ? ` Already applied to **${applied.client}**.` : ` Ready to apply to a client.`)
          : "You're on the portfolio import screen. Drop a CSV (asset, quantity, average price) or download the template.",
        suggestions: [
          "What spreadsheet format do you accept?",
          "What happens after I apply the portfolio?",
          "How do I connect the MFO folder (phase 2)?",
        ],
      }
    );
  }, [fileName, rows, skipped, total, selectedClient, applied]);

  return (
    <div className="screen">
      <div className="flex" style={{ alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <div className="h1" style={{ margin: 0 }}>{t("title")}</div>
        <div className="sub" style={{ margin: 0 }}>{t("subtitle")}</div>
      </div>

      <input ref={inputRef} type="file" accept=".csv,.txt" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />

      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="placeholder"
        style={{ padding: 48, cursor: "pointer", borderColor: over ? "var(--gold)" : "var(--line2)", background: over ? "rgba(201,160,44,.05)" : "var(--panel2)", transition: "all .15s" }}
      >
        <i className="ti ti-upload" style={{ fontSize: 34 }} />
        <b style={{ fontSize: 15 }}>{t("dropHere")}</b>
        <div className="muted mt">{t("dropHint")}</div>
        <div className="chips">
          <span className="chip">{t("chipPortfolioFolder")}</span>
          <span className="chip">{t("chipExcelCsv")}</span>
          <span className="chip">{t("chipApiPhase2")}</span>
        </div>
      </div>

      {error && (
        <div className="card mt" style={{ borderColor: "rgba(231,76,60,.3)" }}>
          <div style={{ display: "flex", gap: 8, color: "var(--red)" }}><i className="ti ti-alert-circle" />{error}</div>
        </div>
      )}

      {rows.length > 0 && (
        <div className="card mt">
          <div className="flex between mb" style={{ alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <h3 style={{ margin: 0 }}><i className="ti ti-file-check" />{fileName}</h3>
              <div className="muted" style={{ fontSize: 11, marginTop: 3 }}>
                {rows.length} {t("positionsLabel")} · {t("totalValueLabel")} {brl(total)}{skipped ? ` · ${skipped} ${t("rowsSkippedLabel")}` : ""}
              </div>
            </div>
            <div className="flex" style={{ gap: 8, alignItems: "center" }}>
              <select className="fsel" style={{ fontSize: 12, padding: "6px 10px" }} value={clientId} onChange={(e) => setClientId(e.target.value)}>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button className="btn" onClick={aplicar} disabled={!clientId}><i className="ti ti-check" />{t("applyToClient")}</button>
            </div>
          </div>

          {/* Portfolio RISK NUMBER — Nitrogen/HRIE methodology */}
          {(riskLoading || risk) && (
            <div className="card" style={{ marginBottom: 12, borderColor: "rgba(201,160,44,.25)", padding: "12px 16px" }}>
              {riskLoading ? (
                <div className="muted" style={{ fontSize: 12 }}><i className="ti ti-loader-2" style={{ marginRight: 6 }} />{t("calculatingRisk")}</div>
              ) : risk?.ok && risk.riskNumber != null ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 34, fontWeight: 800, fontFamily: "var(--mono)", color: rnBand(risk.riskNumber, t).color, lineHeight: 1 }}>{risk.riskNumber}</span>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mono)" }}>{t("riskNumberLabel")}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: rnBand(risk.riskNumber, t).color }}>{rnBand(risk.riskNumber, t).label}</div>
                      </div>
                    </div>
                    <div style={{ borderLeft: "1px solid var(--line2)", paddingLeft: 16 }}>
                      <div style={{ fontSize: 11, color: "var(--tx3)" }}>{t("estimatedLoss")}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--red)" }}>−{risk.loss95_6m_pct}%</div>
                    </div>
                    {selectedClient && (
                      <div style={{ borderLeft: "1px solid var(--line2)", paddingLeft: 16 }}>
                        <div style={{ fontSize: 11, color: "var(--tx3)" }}>{selectedClient.name.split(" ")[0]}{t("mandateOf")}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: risk.riskNumber > selectedClient.mandate ? "var(--red)" : "var(--green)" }}>
                          {t("ceiling")} {selectedClient.mandate} · {risk.riskNumber > selectedClient.mandate ? `${risk.riskNumber - selectedClient.mandate} ${t("over")}` : t("within")}
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedClient && risk.riskNumber > selectedClient.mandate && (
                    <div style={{ fontSize: 12, color: "#E67E22", marginTop: 8 }}>
                      <i className="ti ti-alert-triangle" style={{ marginRight: 5 }} />
                      {t("aboveMandateWarning")}<b>{t("aboveMandateWarningBold")}</b>{t("aboveMandateWarningEnd")}
                    </div>
                  )}
                  <div style={{ fontSize: 10.5, color: "var(--tx3)", marginTop: 8 }}>
                    {t("methodologyNote")}
                    {risk.coverage_pct != null && risk.coverage_pct < 100 && ` ${t("coverageLabel")} ${risk.coverage_pct}%${risk.missing?.length ? ` — ${t("noHistoryLabel")}: ${risk.missing.join(", ")}` : ""}.`}
                  </div>
                  {risk.positions && risk.positions.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                      {risk.positions.slice(0, 8).map((p) => (
                        <span key={p.ticker} style={{
                          fontSize: 10, fontFamily: "var(--mono)", padding: "2px 7px", borderRadius: 3,
                          background: `${rnBand(p.riskNumber, t).color}18`, color: rnBand(p.riskNumber, t).color,
                        }} title={`${p.weight_pct}% ${t("ofPortfolio")}`}>{p.ticker} {p.riskNumber}</span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="muted" style={{ fontSize: 12 }}>
                  <i className="ti ti-info-circle" style={{ marginRight: 6 }} />
                  {t("couldNotCalc")}
                </div>
              )}
            </div>
          )}

          {applied && (
            <div className="pills mb"><span className="pill g"><span className="pd" />{t("appliedTo")} {applied.client} · {t("newCurrentValue")} {brl(applied.total)}{applied.rn != null ? ` · ${t("riskNumberLabel")} ${applied.rn}` : ""}</span></div>
          )}

          <div style={{ maxHeight: 320, overflow: "auto" }}>
            <table>
              <thead><tr><th>{t("thAsset")}</th><th className="num">{t("thQty")}</th><th className="num">{t("thAvgPrice")}</th><th className="num">{t("thValue")}</th></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ color: "var(--gold)", fontWeight: 600 }}>{r.ticker}</td>
                    <td className="num" style={{ color: "var(--tx2)" }}>{r.qty.toLocaleString("en-US")}</td>
                    <td className="num" style={{ color: "var(--tx2)" }}>{r.avgPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="num" style={{ color: "var(--tx)", fontWeight: 600 }}>{brl(r.qty * r.avgPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid g3 mt">
        <div className="card">
          <h3><i className="ti ti-file-spreadsheet" />{t("spreadsheetTitle")}</h3>
          <div className="muted">{t("spreadsheetDesc")}</div>
          <div className="mt"><button className="btn ghost" onClick={downloadPortfolioTemplate}><i className="ti ti-download" />{t("downloadTemplate")}</button></div>
        </div>
        <div className="card"><h3><i className="ti ti-folder" />{t("mfoFolderTitle")}</h3><span className="tag o">{t("toConfigure")}</span><div className="muted mt">{t("mfoFolderDesc")}</div></div>
        <div className="card"><h3><i className="ti ti-plug" />{t("managementApiTitle")}</h3><span className="tag b">{t("phase2")}</span><div className="muted mt">{t("managementApiDesc")}</div></div>
      </div>
    </div>
  );
}

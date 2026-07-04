"use client";
import { useEffect, useRef, useState } from "react";
import { allClients, applyImportedPortfolio } from "@/lib/clientStore";
import { brl, type Client, type ImportedPosition } from "@/lib/clients";
import { publishScreenData } from "@/lib/jim-data";

const TEMPLATE = "ativo,quantidade,preco_medio\nPETR4,1000,32.10\nVALE3,500,68.40\nITUB4,800,29.75\n";

function downloadTemplate() {
  const blob = new Blob([TEMPLATE], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modelo-carteira-harpian.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// Parser de CSV simples e tolerante: aceita vírgula ou ponto-e-vírgula, cabeçalho
// opcional, e ignora linhas vazias/mal formadas em vez de travar a importação inteira.
function parseCsv(text: string): { rows: ImportedPosition[]; skipped: number } {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows: ImportedPosition[] = [];
  let skipped = 0;
  for (const line of lines) {
    const cols = line.split(/[,;\t]/).map((c) => c.trim());
    if (cols.length < 3) { skipped++; continue; }
    const [ticker, qtyRaw, priceRaw] = cols;
    const qty = Number(qtyRaw.replace(",", "."));
    const avgPrice = Number(priceRaw.replace(",", "."));
    if (!ticker || /^ativo$|^ticker$|^papel$/i.test(ticker) || !Number.isFinite(qty) || !Number.isFinite(avgPrice)) {
      skipped++;
      continue;
    }
    rows.push({ ticker: ticker.toUpperCase(), qty, avgPrice });
  }
  return { rows, skipped };
}

export default function Importar() {
  const [over, setOver] = useState(false);
  const [rows, setRows] = useState<ImportedPosition[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [applied, setApplied] = useState<{ client: string; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      setError("Envie um arquivo .csv (ou .txt com os mesmos campos).");
      return;
    }
    file.text().then((text) => {
      const { rows: parsed, skipped: sk } = parseCsv(text);
      if (parsed.length === 0) {
        setError("Não encontrei linhas válidas (esperado: ativo, quantidade, preço médio).");
        setRows([]);
        return;
      }
      setRows(parsed);
      setSkipped(sk);
      setFileName(file.name);
    });
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
    const updated = applyImportedPortfolio(clientId, rows);
    setApplied({ client: updated.name, total });
    setClients(allClients());
  }

  // Publica pro JIM a planilha carregada (preview) e o resultado da importação.
  useEffect(() => {
    publishScreenData(
      "importar",
      "Importar/conectar: upload de planilha de carteira do cliente (ativo, quantidade, preço médio). Depois de carregada, o gestor escolhe o cliente e aplica a carteira importada.",
      {
        arquivo: fileName, linhasValidas: rows.length, linhasIgnoradas: skipped,
        valorTotal: total, clienteAlvo: selectedClient?.name || null,
        posicoes: rows.slice(0, 30),
        ultimaImportacaoAplicada: applied,
      },
      {
        briefing: rows.length
          ? `Você carregou **${fileName}**: ${rows.length} posições, valor total ${brl(total)}` +
            (skipped ? ` (${skipped} linha(s) ignorada(s)).` : ".") +
            (applied ? ` Já aplicado a **${applied.client}**.` : ` Pronto para aplicar a um cliente.`)
          : "Você está na importação de carteiras. Arraste um CSV (ativo, quantidade, preço médio) ou baixe o modelo.",
        suggestions: [
          "Que formato de planilha vocês aceitam?",
          "O que acontece depois que eu aplico a carteira?",
          "Como conecto a pasta do MFO (fase 2)?",
        ],
      }
    );
  }, [fileName, rows, skipped, total, selectedClient, applied]);

  return (
    <div className="screen">
      <div className="crumb">Clientes › <b>Importar</b></div>
      <div className="h1">Importar / conectar</div>
      <div className="sub">Fase 1: planilha do cliente (CSV). Fase 2: API do sistema gerencial.</div>

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
        <b style={{ fontSize: 15 }}>Arraste a planilha do cliente aqui (ou clique pra escolher)</b>
        <div className="muted mt">CSV: ativo, quantidade, preço médio · ou conecte uma pasta do MFO</div>
        <div className="chips">
          <span className="chip">pasta de portfólios</span>
          <span className="chip">Excel / CSV</span>
          <span className="chip">API (fase 2)</span>
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
                {rows.length} posições · valor total {brl(total)}{skipped ? ` · ${skipped} linha(s) ignorada(s)` : ""}
              </div>
            </div>
            <div className="flex" style={{ gap: 8, alignItems: "center" }}>
              <select className="fsel" style={{ fontSize: 12, padding: "6px 10px" }} value={clientId} onChange={(e) => setClientId(e.target.value)}>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button className="btn" onClick={aplicar} disabled={!clientId}><i className="ti ti-check" />Aplicar ao cliente</button>
            </div>
          </div>

          {applied && (
            <div className="pills mb"><span className="pill g"><span className="pd" />Aplicado a {applied.client} · novo valor atual {brl(applied.total)}</span></div>
          )}

          <div style={{ maxHeight: 320, overflow: "auto" }}>
            <table>
              <thead><tr><th>Ativo</th><th className="num">Quantidade</th><th className="num">Preço médio</th><th className="num">Valor</th></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ color: "var(--gold)", fontWeight: 600 }}>{r.ticker}</td>
                    <td className="num" style={{ color: "var(--tx2)" }}>{r.qty.toLocaleString("pt-BR")}</td>
                    <td className="num" style={{ color: "var(--tx2)" }}>{r.avgPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
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
          <h3><i className="ti ti-file-spreadsheet" />Planilha</h3>
          <div className="muted">Modelo padrão de carteira (colunas: ativo, quantidade, preço médio).</div>
          <div className="mt"><button className="btn ghost" onClick={downloadTemplate}><i className="ti ti-download" />Baixar modelo</button></div>
        </div>
        <div className="card"><h3><i className="ti ti-folder" />Pasta do MFO</h3><span className="tag o">a configurar</span><div className="muted mt">Leitura automática dos portfólios exportados.</div></div>
        <div className="card"><h3><i className="ti ti-plug" />API gerencial</h3><span className="tag b">fase 2</span><div className="muted mt">Sincronização direta com o sistema do escritório.</div></div>
      </div>
    </div>
  );
}

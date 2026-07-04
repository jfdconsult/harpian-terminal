// Parser de CSV de carteira (ativo, quantidade, preço médio) — compartilhado entre
// Importar/conectar e a edição de portfólios do cliente. Tolerante: aceita vírgula
// ou ponto-e-vírgula, cabeçalho opcional, ignora linhas mal formadas em vez de travar.
import type { ImportedPosition } from "./clients";

export function parsePortfolioCsv(text: string): { rows: ImportedPosition[]; skipped: number } {
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

export const PORTFOLIO_CSV_TEMPLATE = "ativo,quantidade,preco_medio\nPETR4,1000,32.10\nVALE3,500,68.40\nITUB4,800,29.75\n";

export function downloadPortfolioTemplate() {
  const blob = new Blob([PORTFOLIO_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modelo-carteira-harpian.csv";
  a.click();
  URL.revokeObjectURL(url);
}

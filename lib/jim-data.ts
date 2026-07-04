// ============================================================
// JIM — Barramento de dados da tela (o que o JIM ENXERGA)
// ------------------------------------------------------------
// Cada tela de dados publica aqui o que está exibindo no momento.
// Quando o gestor pergunta ao JIM sobre algo que está na tela
// (uma empresa, uma linha, um número), o JIM lê este snapshot e
// responde direto — NUNCA pergunta "o que você está vendo".
// É um singleton de módulo: o bundle client compartilha a instância,
// então tela e drawer do JIM veem o mesmo store sem prop drilling.
// ============================================================

export interface ScreenSnapshot {
  screen: string;
  /** 1 linha do que a tela mostra, em português (contexto pro JIM). */
  summary: string;
  /** Dados estruturados atualmente visíveis (linhas da tabela/lista). */
  rows: unknown;
  capturedAt: number;
}

const store: Record<string, ScreenSnapshot> = {};

/** A tela chama isto sempre que seus dados carregam/mudam. */
export function publishScreenData(screen: string, summary: string, rows: unknown): void {
  store[screen] = { screen, summary, rows, capturedAt: Date.now() };
}

/** O JIM lê no momento do envio da pergunta. */
export function readScreenData(screen: string): ScreenSnapshot | null {
  return store[screen] || null;
}

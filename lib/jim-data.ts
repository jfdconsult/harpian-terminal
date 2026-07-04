// ============================================================
// JIM — Barramento de dados da tela (o que o JIM ENXERGA)
// ------------------------------------------------------------
// Cada tela de dados publica aqui o que está exibindo no momento.
// Quando o gestor pergunta ao JIM sobre algo que está na tela
// (uma empresa, uma linha, um número), o JIM lê este snapshot e
// responde direto — NUNCA pergunta "o que você está vendo".
//
// Além dos dados, a tela pode publicar:
//  - briefing: 1 frase com os DADOS REAIS pra saudação do JIM
//    ("Você está na ação NVDA, +131% no ano, momento forte…")
//  - suggestions: 3 perguntas mais prováveis sobre aquele item,
//    que viram chips clicáveis na barra do JIM.
//
// É um singleton de módulo: o bundle client compartilha a instância,
// então tela e drawer do JIM veem o mesmo store sem prop drilling.
// ============================================================

export interface ScreenExtra {
  /** Frase data-aware pra saudação: "Você está vendo a ação X, momento tal, risco tal." */
  briefing?: string;
  /** 3 perguntas mais prováveis sobre o item atual (chips clicáveis). */
  suggestions?: string[];
}

export interface ScreenSnapshot extends ScreenExtra {
  screen: string;
  /** 1 linha do que a tela mostra, em português (contexto pro JIM). */
  summary: string;
  /** Dados estruturados atualmente visíveis (linhas da tabela/lista). */
  rows: unknown;
  capturedAt: number;
}

const store: Record<string, ScreenSnapshot> = {};
type Listener = (s: ScreenSnapshot) => void;
const listeners = new Set<Listener>();

/** A tela chama isto sempre que seus dados carregam/mudam. */
export function publishScreenData(
  screen: string,
  summary: string,
  rows: unknown,
  extra?: ScreenExtra
): void {
  const snap: ScreenSnapshot = {
    screen,
    summary,
    rows,
    briefing: extra?.briefing,
    suggestions: extra?.suggestions,
    capturedAt: Date.now(),
  };
  store[screen] = snap;
  listeners.forEach((fn) => fn(snap));
}

/** O JIM lê no momento do envio da pergunta. */
export function readScreenData(screen: string): ScreenSnapshot | null {
  return store[screen] || null;
}

/** O drawer do JIM assina pra atualizar a saudação/chips quando a tela publica. */
export function subscribeScreenData(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

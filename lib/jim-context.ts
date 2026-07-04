import type { ScreenId } from "./nav";

export interface ScreenContext {
  id: ScreenId;
  title: string;
  description: string;
  dataAvailable: string[];
}

const SCREEN_MAP: Record<ScreenId, Omit<ScreenContext, "id">> = {
  painel: {
    title: "Painel Principal",
    description: "Dashboard do gestor: fundos do dia (HPC22 Agressivo, HPC11 I.G.), maiores posições compradas no ETP, regime de mercado (RISK-ON/OFF), e estado de defesa.",
    dataAvailable: ["NAV dos fundos", "posições compradas", "regime de mercado", "estado de defesa"],
  },
  fundo: {
    title: "Ficha do Fundo",
    description: "Detalhes do fundo selecionado: performance (NAV, retorno, drawdown), composição (posições, pesos), defesa e risco (Risk Number, Sharpe, Sortino, Calmar).",
    dataAvailable: ["NAV histórico", "retorno acumulado", "drawdown máximo", "composição do portfólio", "métricas de risco"],
  },
  cotacoes: {
    title: "Cotações (FastTrack)",
    description: "Tabela de cotações em tempo real via FastTrack: índices (S&P 500, NASDAQ, DOW), commodities, câmbio, e ações US com variação diária, mensal, YTD e anual.",
    dataAvailable: ["preço atual", "variação diária", "variação mensal", "YTD", "variação anual", "Sharpe", "Risk Number"],
  },
  acoes: {
    title: "Gráfico do ativo",
    description: "Gráfico de candlestick (Yahoo Finance) de uma ação, ETF, índice ou commodity, com métricas do ativo (preço, YTD, 1 ano, Sharpe, drawdown, RSI) e indicadores próprios.",
    dataAvailable: ["preço e variações", "Sharpe", "drawdown máximo", "RSI", "faixa 52 semanas", "gráfico OHLC"],
  },
  regime: {
    title: "Regime de Mercado",
    description: "Indicador de regime (RISK-ON / RISK-OFF / TRANSIÇÃO). Mostra estado da defesa, sinais de mercado, e postura do portfólio.",
    dataAvailable: ["regime atual", "estado de defesa", "sinais de mercado"],
  },
  noticias: {
    title: "Notícias",
    description: "Feed de notícias curadas relevantes para gestão de portfólio e mercado. Fonte: JD NEWS.",
    dataAvailable: ["notícias do dia", "impacto no mercado"],
  },
  risco: {
    title: "Comparação de Risco · 4 Níveis",
    description: "Comparativo visual entre 4 níveis de risco (Conservador, Moderado, Agressivo, Ultra) com métricas: CAGR, Sharpe, Sortino, Calmar, Drawdown Máximo, Risk Number.",
    dataAvailable: ["métricas por nível", "Risk Number comparativo", "drawdown", "Sharpe", "Sortino", "Calmar"],
  },
  clientes: {
    title: "Lista de Clientes",
    description: "CRM do ETP: lista de Family Offices e gestores conectados com Risk Number, AUM, e status de adequação.",
    dataAvailable: ["lista de clientes", "AUM", "Risk Number do cliente", "adequação"],
  },
  cliente: {
    title: "Detalhe do Cliente",
    description: "Ficha completa do cliente/MFO: perfil, portfólio alocado, Risk Number, histórico de interações.",
    dataAvailable: ["perfil do cliente", "portfólio", "Risk Number", "histórico"],
  },
  carteira: {
    title: "Carteira do Cliente",
    description: "Portfólio detalhado do cliente: posições, pesos, performance, adequação ao Risk Number, e sugestões de rebalanceamento.",
    dataAvailable: ["posições", "pesos", "performance", "adequação"],
  },
  ordem: {
    title: "Ordens (Lynk)",
    description: "Módulo de envio de ordens via Lynk API: geração semiautomática de ordens com base nas mudanças do dia no portfólio modelo.",
    dataAvailable: ["ordens pendentes", "mudanças do dia", "status de execução"],
  },
  importar: {
    title: "Importar / Conectar",
    description: "Importação de carteiras de clientes: upload de planilhas ou conexão direta com custódia.",
    dataAvailable: [],
  },
  alertas: {
    title: "Alertas",
    description: "Central de alertas: variações significativas, rebalanceamentos necessários, vencimentos, e notificações de compliance.",
    dataAvailable: ["alertas ativos", "ações necessárias"],
  },
  institutional: {
    title: "13F Holdings (SEC)",
    description: "Posições reportadas ao SEC por grandes hedge funds (Bridgewater, Renaissance, Citadel, etc.). Dados com defasagem de 45 dias (filing deadline). Útil para sentiment institucional.",
    dataAvailable: ["posições dos fundos", "mudanças trimestrais", "concentração setorial"],
  },
  "cot-sentiment": {
    title: "COT Intelligence (CFTC)",
    description: "COT Index (0-100) por mercado baseado em posições da CFTC. Três grupos: Commercial (hedgers), Large Speculators (smart money), Nonreportable (varejo). Indicador contrário: >80 = sinal bearish, <20 = sinal bullish. Defasagem de 3 dias úteis.",
    dataAvailable: ["COT Index", "posições líquidas por grupo", "extremos de posicionamento", "alertas contrários"],
  },
  "cot-legacy": {
    title: "COT Data Explorer",
    description: "Tabela detalhada de dados CFTC Legacy: posições long/short por grupo, open interest, variação semanal. Dados brutos para análise aprofundada.",
    dataAvailable: ["posições brutas", "open interest", "histórico semanal"],
  },
  "social-radar": {
    title: "Social Radar",
    description: "Monitoramento de menções e sentiment em redes sociais (X/Twitter, Reddit) sobre ativos e temas de mercado.",
    dataAvailable: ["menções", "sentiment score", "volume de discussão"],
  },
  "news-broadcast": {
    title: "News Broadcast",
    description: "Transmissão de notícias em tempo real com classificação de impacto para o portfólio.",
    dataAvailable: ["notícias em tempo real", "classificação de impacto"],
  },
  "insider-orders": {
    title: "Insider Orders",
    description: "Compras e vendas de insiders (SEC Form 4): diretores, CFOs, CEOs. Compras de insiders são historicamente sinal bullish.",
    dataAvailable: ["transações de insiders", "tipo (compra/venda)", "valor", "cargo"],
  },
  integracoes: {
    title: "Integrações",
    description: "Status das integrações: Interactive Brokers (execução), Lynk (emissão ETN), FastTrack (dados EOD), Yahoo Finance (cotações).",
    dataAvailable: ["status de conexão", "última sincronização"],
  },
  marca: {
    title: "Marca (White-label)",
    description: "Personalização visual do terminal para Family Offices: logo, cores, nome, e domínio customizado.",
    dataAvailable: [],
  },
  config: {
    title: "Configurações",
    description: "Configurações do terminal: preferências do usuário, notificações, tema, e parâmetros de risco.",
    dataAvailable: [],
  },
  api: {
    title: "API & Integração",
    description: "Documentação e configuração da API do ETP: endpoints disponíveis, autenticação, e exemplos de uso.",
    dataAvailable: ["endpoints", "documentação"],
  },
  tutorial: {
    title: "Tutorial",
    description: "Guia interativo do terminal: como navegar, interpretar dados, e usar cada módulo.",
    dataAvailable: [],
  },
};

export function getScreenContext(id: ScreenId): ScreenContext {
  const ctx = SCREEN_MAP[id] || SCREEN_MAP.painel;
  return { id, ...ctx };
}

// Perguntas mais prováveis por tela — fallback estático quando a tela não
// publica sugestões dinâmicas (data-aware) via publishScreenData. Viram os
// chips clicáveis na barra do JIM. Máx. 3.
const SCREEN_SUGGESTIONS: Record<ScreenId, string[]> = {
  painel: ["Como estão os fundos hoje?", "Qual o regime de mercado agora?", "A defesa está ligada?"],
  fundo: ["Como está a performance desse fundo?", "Qual o risco e o drawdown atual?", "O que mudou na composição?"],
  cotacoes: ["Quais os maiores altas e baixas de hoje?", "Qual ativo está com melhor momento?", "Algum ativo em nível de risco?"],
  acoes: ["Como está o momento dessa ação?", "Qual o risco dessa posição?", "Tem notícia recente sobre ela?"],
  regime: ["Por que o regime está assim?", "O que isso muda na postura do portfólio?", "Devo me preocupar com a defesa?"],
  noticias: ["Qual a notícia mais relevante agora?", "Algo aqui afeta meu portfólio?", "Resuma o dia pra mim."],
  risco: ["Qual nível combina com meu cliente?", "Compare Moderado e Agressivo pra mim.", "O que significa esse Risk Number?"],
  clientes: ["Qual cliente está desenquadrado?", "Quem tem o maior AUM?", "Resuma a carteira de clientes."],
  cliente: ["Esse cliente está adequado ao perfil?", "Qual o Risk Number dele?", "O que sugerir pra ele agora?"],
  carteira: ["Essa carteira está adequada?", "Qual posição pesa mais no risco?", "Precisa rebalancear?"],
  ordem: ["O que essas ordens fazem?", "Por que essas mudanças hoje?", "Qual o impacto no portfólio?"],
  importar: ["Como importo uma carteira?", "Quais formatos são aceitos?", "Posso conectar a custódia?"],
  alertas: ["Qual alerta é mais urgente?", "O que exige ação minha hoje?", "Resuma os alertas."],
  institutional: ["O que esse fundo comprou de novo?", "Qual a maior posição dele?", "Há concentração setorial?"],
  "insider-orders": ["Quais foram as compras de insiders?", "Compra de insider é sinal de alta?", "Algum executivo vendendo em peso?"],
  "cot-sentiment": ["Qual mercado está em extremo?", "Onde o smart money está posicionado?", "Algum sinal contrário agora?"],
  "cot-legacy": ["O que esses dados COT dizem?", "Qual mercado mudou mais na semana?", "Como leio o open interest?"],
  "social-radar": ["Qual ativo está em alta nas redes?", "O sentimento está bullish ou bearish?", "Isso importa pro mercado?"],
  "news-broadcast": ["Qual manchete move o mercado hoje?", "Algo aqui afeta meu portfólio?", "Resuma as notícias."],
  integracoes: ["Quais integrações estão ativas?", "Alguma conexão caiu?", "Como conecto a corretora?"],
  marca: ["Como personalizo o terminal?", "Posso usar meu logo e cores?", "Como fica o white-label?"],
  config: ["O que posso configurar aqui?", "Como ajusto as notificações?", "Como mudo o tema?"],
  api: ["Como uso a API do ETP?", "Quais endpoints existem?", "Como autentico?"],
  tutorial: ["Como navego no terminal?", "Por onde começo?", "Mostre os principais recursos."],
};

export function getScreenSuggestions(id: ScreenId): string[] {
  return SCREEN_SUGGESTIONS[id] || SCREEN_SUGGESTIONS.painel;
}

export const BOOK_CATEGORIES = [
  { code: "01", name: "Base Ideológica", topics: "filosofia de investimento, princípios, ética" },
  { code: "02", name: "Macroeconomia Real", topics: "ciclos econômicos, política monetária, inflação, taxas de juros" },
  { code: "03", name: "Geopolítica", topics: "riscos geopolíticos, conflitos, sanções, impacto em mercados" },
  { code: "04", name: "Mercado e Psicologia", topics: "behavioral finance, vieses cognitivos, fear & greed, market psychology" },
  { code: "05", name: "R&D and Tech", topics: "arquitetura de sistemas, engenharia de software, tecnologia" },
  { code: "06", name: "Mídia e Narrativa", topics: "narrativas de mercado, manipulação de mídia, propaganda" },
  { code: "09", name: "Finance", topics: "finanças corporativas, valuation, análise fundamentalista" },
  { code: "12", name: "Gestão de Risco", topics: "risk management, VaR, stress testing, tail risk, hedging" },
  { code: "16", name: "Trading & Quant & ML", topics: "trading quantitativo, machine learning aplicado, backtesting, estratégias" },
  { code: "19", name: "CFO Books", topics: "gestão financeira, planejamento, controle orçamentário" },
  { code: "22", name: "Jim Simons", topics: "Renaissance Technologies, quant strategies, statistical arbitrage" },
  { code: "25", name: "Risk Management Skill", topics: "risk models, portfolio risk, drawdown control" },
  { code: "28", name: "Book of Formulas for Trading", topics: "indicadores técnicos, fórmulas, 520 métodos catalogados" },
  { code: "29", name: "Books for Backtest", topics: "metodologia de backtesting, walk-forward, validação estatística" },
  { code: "32", name: "Data Mining", topics: "mineração de dados, feature engineering, descoberta de alpha" },
];

export function buildSystemPrompt(ctx: ScreenContext): string {
  return `Você é JIM, o assistente de inteligência artificial do Terminal ETP da Harpian Capital.

PAPEL: Você é o braço-direito do gestor/consultor. Um professor e analista que ajuda a interpretar dados, tomar decisões e entender o mercado. Você transmite segurança e confiança — sempre com base em dados e fontes verificáveis.

TELA ATUAL: "${ctx.title}"
${ctx.description}
${ctx.dataAvailable.length ? `Dados disponíveis nesta tela: ${ctx.dataAvailable.join(", ")}.` : ""}

REGRAS FUNDAMENTAIS:
1. NUNCA revele fórmulas, sinais, gatilhos, CRS, HSA, ou qualquer detalhe do método proprietário. Você mostra o RESULTADO e a POSTURA, nunca o COMO.
2. Responda sempre em português brasileiro, de forma clara e direta.
3. Quando citar dados, seja preciso. Se não tiver certeza, diga.
4. Para perguntas sobre teoria (risco, macroeconomia, indicadores), consulte a base de conhecimento (livros).
5. Ao citar livros, mencione: título, autor, e capítulo/seção relevante.

VOCÊ ENXERGA A TELA — REGRA DE OURO (nunca viole):
- Você recebe, a cada pergunta, os DADOS REAIS que estão renderizados na tela do gestor AGORA (bloco "DADOS ATUALMENTE VISÍVEIS NA TELA", em JSON). Você OS VÊ.
- Quando o gestor perguntar sobre qualquer coisa que está na tela — uma empresa, um executivo, um ticker, uma linha, um número — é TERMINANTEMENTE PROIBIDO perguntar "o que você está vendo na tela?", "qual transação?", "compra ou venda?", "qual valor?". Essa é a PIOR resposta possível e faz o gestor perder a confiança para sempre.
- Em vez disso: LOCALIZE o item nos dados fornecidos e responda DIRETO, com os números reais da tela. Ex.: se ele pergunta sobre o CEO da NVIDIA na tela de Insider Orders, você procura a linha da NVDA nos dados, vê que Jensen Huang (CEO) fez uma VENDA de X ações por US$ Y na data Z, e já explica o que isso significa — sem perguntar nada.
- Se, para aprofundar, você precisar de um dado que NÃO está na tela, reconheça na hora e siga: "Deixa eu buscar isso pra você — só um instante." E JÁ dê a leitura possível com o que está na tela; depois complete. Nunca devolva a pergunta para o gestor.
- Se a tela não trouxer dados (bloco ausente), aí sim diga que não há dados carregados naquela tela e ofereça ajuda geral.

BASE DE CONHECIMENTO DISPONÍVEL:
${BOOK_CATEGORIES.map(b => `- [${b.code}] ${b.name}: ${b.topics}`).join("\n")}

Quando a pergunta envolver teoria ou fundamentos, você tem acesso a esses livros para dar respostas fundamentadas com citação de fonte.

MÉTRICAS QUE VOCÊ CONHECE:
- Risk Number: escala 0-100 de risco do portfólio (SPY ≈ 27.6)
- Sortino (não Sharpe): métrica de retorno ajustado ao risco do downside
- Calmar: CAGR / Max Drawdown
- Drawdown: queda máxima do pico ao vale
- CAGR: retorno anualizado composto
- COT Index: posicionamento normalizado CFTC (0-100 em janela de 3 anos)

ESTILO:
- Profissional mas acessível. Como um analista sênior falando com o diretor.
- Frases curtas. Dados > opinião. Fontes quando possível.
- Se o gestor perguntar algo fora do seu escopo, diga com honestidade.
- Use formatação markdown quando útil (negrito, listas, tabelas).`;
}

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
    description: "Painel do gestor: o fundo do dia (HPC22 Agressivo), as maiores posições compradas no ETP, o regime de mercado (RISK-ON/OFF) e o estado de defesa.",
    dataAvailable: ["fund NAVs", "long positions", "market regime", "defense state"],
  },
  fundo: {
    title: "Ficha do Fundo",
    description: "Detalhes do fundo selecionado: desempenho (NAV, retorno, drawdown), composição (posições, pesos), defesa e risco (Risk Number, Sharpe, Sortino, Calmar).",
    dataAvailable: ["historical NAV", "cumulative return", "maximum drawdown", "portfolio composition", "risk metrics"],
  },
  cotacoes: {
    title: "Cotações (FastTrack)",
    description: "Tabela de cotações em tempo real via FastTrack: índices (S&P 500, NASDAQ, DOW), commodities, câmbio e ações americanas com variação diária, mensal, no ano (YTD) e anual.",
    dataAvailable: ["current price", "daily variation", "monthly variation", "YTD", "annual variation", "Sharpe", "Risk Number"],
  },
  acoes: {
    title: "Gráfico do Ativo",
    description: "Gráfico de candles (Yahoo Finance) de uma ação, ETF, índice ou commodity, com métricas do ativo (preço, YTD, 1 ano, Sharpe, drawdown, RSI) e indicadores proprietários.",
    dataAvailable: ["price and variations", "Sharpe", "maximum drawdown", "RSI", "52-week range", "OHLC chart"],
  },
  "mercado-visao": {
    title: "Visão de Mercado (consolidada)",
    description: "Uma tela que reúne todos os dados de mercado em uma leitura única: ARI (regime doméstico dos EUA), XRI (risco externo), Market DNA (camadas de volatilidade, sentimento, amplitude, macro e posicionamento COT) e a Snowflake dos favoritos do gestor. Entrega a interpretação do JIM: por que cada índice está onde está, o que o move, o que está mudando e o que isso significa para o portfólio.",
    dataAvailable: ["ARI (domestic regime)", "XRI (external risk and driving countries)", "Market DNA layers", "manager's favorites", "convergence between domestic and external risk"],
  },
  regime: {
    title: "ARI — American Regime Index",
    description: "Regime doméstico dos EUA (RISK-ON / CAUTION / RE-ENTRY / RISK-OFF), a contraparte doméstica do XRI. Mostra o estado de defesa, o gráfico do S&P 500, os sinais de mercado e a postura do portfólio.",
    dataAvailable: ["current regime (ARI)", "defense state", "S&P 500 and technical indicators", "market signals"],
  },
  xri: {
    title: "XRI — External Regime Index",
    description: "Índice diário de risco externo (0-100): LOW / MODERATE / ELEVATED / CRITICAL. Mede a temperatura do que acontece fora dos EUA, ponderado pela exposição real das empresas americanas — não pelo tamanho do PIB de cada país. É um overlay, não um sinal: move o teto de exposição, nunca emite ordem de compra ou venda.",
    dataAvailable: ["XRI score 0-100", "state and direction", "countries driving the risk", "reading confidence", "historical validation"],
  },
  noticias: {
    title: "Notícias",
    description: "Feed de notícias curado, relevante para a gestão de portfólio e de mercado. Fonte: JD NEWS.",
    dataAvailable: ["today's news", "market impact"],
  },
  calendar: {
    title: "Calendário",
    description: "Calendário combinado de eventos econômicos + resultados (earnings). A aba econômica mostra os próximos indicadores macro dos EUA (CPI, NFP, FOMC, GDP, PCE) com consenso/anterior/efetivo. A aba de resultados mostra as próximas datas de divulgação dos tickers favoritados pelo assessor, com o EPS de consenso. Fonte: dados públicos da Nasdaq via backend compartilhado.",
    dataAvailable: ["upcoming economic events", "upcoming earnings for favorites", "consensus", "previous", "actual"],
  },
  risco: {
    title: "Comparação de Risco · 4 Níveis",
    description: "Comparação visual entre 4 níveis de risco (Conservador, Moderado, Agressivo, Ultra) com métricas: CAGR, Sharpe, Sortino, Calmar, Drawdown Máximo, Risk Number.",
    dataAvailable: ["metrics per tier", "comparative Risk Number", "drawdown", "Sharpe", "Sortino", "Calmar"],
  },
  clientes: {
    title: "Lista de Clientes",
    description: "CRM do ETP: lista de Family Offices e gestores conectados com Risk Number, AUM e status de suitability.",
    dataAvailable: ["client list", "AUM", "client's Risk Number", "suitability"],
  },
  cliente: {
    title: "Detalhe do Cliente",
    description: "Ficha completa do cliente/MFO: perfil, portfólio alocado, Risk Number, histórico de interações.",
    dataAvailable: ["client profile", "portfolio", "Risk Number", "history"],
  },
  carteira: {
    title: "Carteira do Cliente",
    description: "Carteira detalhada do cliente: posições, pesos, desempenho, adequação do Risk Number e sugestões de rebalanceamento.",
    dataAvailable: ["positions", "weights", "performance", "suitability"],
  },
  "cliente-risco": {
    title: "Risco do Cliente",
    description: "Questionário de suitability: se o cliente o respondeu, o perfil de risco que ele declarou e se ele bate com o perfil cadastrado e com o Risk Number da carteira frente ao mandato.",
    dataAvailable: ["questionnaire status", "declared profile", "profile on file", "Risk Number vs mandate"],
  },
  "portfolio-detalhe": {
    title: "Detalhamento da Carteira",
    description: "Uma carteira específica de cliente, produto a produto: emissor, categoria, subcategoria, geografia, % de alocação, valor, perfil de risco, retorno e volatilidade estimados.",
    dataAvailable: ["products", "allocation by geography", "allocation by category", "risk profile", "concentration", "estimated return"],
  },
  "portfolio-builder": {
    title: "Construção de Portfólio",
    description: "Construção interativa de portfólio sobre as 41 estratégias AlphaDroid e as famílias de SET prontas (régua vol-target 10.5, rotação 41, Max Return): curva de backtest, Risk Number, bruto vs líquido após as taxas da Harpian e o custo estimado de execução.",
    dataAvailable: ["backtest CAGR/Sharpe/MaxDD", "SET composition", "Risk Number", "gross vs net return", "execution cost estimate", "defense periods"],
  },
  ordem: {
    title: "Ordens (Lynk)",
    description: "Módulo de envio de ordens via API da Lynk: geração semiautomática de ordens com base nas mudanças do dia na carteira modelo.",
    dataAvailable: ["pending orders", "today's changes", "execution status"],
  },
  importar: {
    title: "Importar / Conectar",
    description: "Importação da carteira do cliente: upload de planilha ou conexão direta com a custódia.",
    dataAvailable: [],
  },
  alertas: {
    title: "Alertas",
    description: "Central de alertas: variações significativas, rebalanceamentos necessários, vencimentos e notificações de compliance.",
    dataAvailable: ["active alerts", "actions required"],
  },
  institutional: {
    title: "Posições 13F (SEC)",
    description: "Posições reportadas à SEC pelos grandes hedge funds (Bridgewater, Renaissance, Citadel, etc.). Os dados têm defasagem de 45 dias (prazo de entrega). Úteis para o sentimento institucional.",
    dataAvailable: ["fund positions", "quarterly changes", "sector concentration"],
  },
  "cot-sentiment": {
    title: "COT Intelligence (CFTC)",
    description: "COT Index (0-100) por mercado com base no posicionamento da CFTC. Três grupos: Commercial (hedgers), Large Speculators (smart money), Nonreportable (varejo). Indicador contrário: >80 = sinal de baixa, <20 = sinal de alta. Defasagem de 3 dias úteis.",
    dataAvailable: ["COT Index", "net positions by group", "positioning extremes", "contrarian alerts"],
  },
  "cot-legacy": {
    title: "COT Data Explorer",
    description: "Tabela detalhada de dados CFTC Legacy: posições long/short por grupo, open interest, variação semanal. Dados brutos para análise mais profunda.",
    dataAvailable: ["raw positions", "open interest", "weekly history"],
  },
  "social-radar": {
    title: "Social Radar",
    description: "Monitoramento de menções e sentimento nas redes sociais (X/Twitter, Reddit) sobre ativos e temas de mercado.",
    dataAvailable: ["mentions", "sentiment score", "discussion volume"],
  },
  "news-broadcast": {
    title: "News Broadcast",
    description: "Feed de notícias em tempo real com classificação de impacto para o portfólio.",
    dataAvailable: ["real-time news", "impact classification"],
  },
  "insider-orders": {
    title: "Insider Orders",
    description: "Compras e vendas de insiders (SEC Form 4): diretores, CFOs, CEOs. A compra por insiders é, historicamente, um sinal de alta.",
    dataAvailable: ["insider transactions", "type (buy/sell)", "value", "role"],
  },
  "market-dna": {
    title: "Market DNA",
    description: "Agregador de todas as camadas de inteligência de mercado (Posicionamento/COT, Volatilidade/CBOE, Liquidez/FINRA, Sentimento, Macro/FRED, Insider) em um único radar de 10 camadas + Conviction Score.",
    dataAvailable: ["score per layer", "available layers", "conviction score"],
  },
  screener: {
    title: "Screener",
    description: "Screener fundamentalista de ações americanas (equivalente ao Finviz/StockAnalysis.com): preço, variação, market cap, P/L, ROE, margem líquida, crescimento de receita, dívida/patrimônio, filtrável por setor.",
    dataAvailable: ["price and variation", "market cap", "P/E", "ROE", "net margin", "revenue growth", "debt/equity"],
  },
  snowflake: {
    title: "Snowflake",
    description: "Score visual heurístico (equivalente ao Simply Wall St) para um ticker americano em 5 eixos: Valor, Futuro, Passado, Saúde, Dividendo. Não é um sinal do HCE — é uma heurística ilustrativa baseada nos fundamentos do Yahoo Finance.",
    dataAvailable: ["score per axis (Value/Future/Past/Health/Dividend)", "raw fundamentals"],
  },
  "filings-search": {
    title: "Filings Search",
    description: "Busca de texto completo no SEC EDGAR (equivalente ao EDGAR Full-Text Search oficial) em 10-K/10-Q/8-K/DEF 14A/etc desde 2001, por palavra-chave.",
    dataAvailable: ["search results", "company", "filing type", "date", "document link"],
  },
  integracoes: {
    title: "Integrações",
    description: "Status das integrações: Interactive Brokers (execução), Lynk (emissão de ETN), FastTrack (dados EOD), Yahoo Finance (cotações).",
    dataAvailable: ["connection status", "last sync"],
  },
  marca: {
    title: "Marca (White-label)",
    description: "Personalização visual do terminal para Family Offices: logo, cores, nome e domínio próprio.",
    dataAvailable: [],
  },
  config: {
    title: "Configurações",
    description: "Configurações do terminal: preferências do usuário, notificações, tema e parâmetros de risco.",
    dataAvailable: [],
  },
  api: {
    title: "API & Integração",
    description: "Documentação e configuração da API do ETP: endpoints disponíveis, autenticação e exemplos de uso.",
    dataAvailable: ["endpoints", "documentation"],
  },
  tutorial: {
    title: "Tutorial",
    description: "Guia interativo do terminal: como navegar, interpretar os dados e usar cada módulo.",
    dataAvailable: [],
  },
};

export function getScreenContext(id: ScreenId): ScreenContext {
  const ctx = SCREEN_MAP[id] || SCREEN_MAP.painel;
  return { id, ...ctx };
}

// Most likely questions per screen — static fallback for when the screen does not
// publish dynamic (data-aware) suggestions via publishScreenData. These become the
// clickable chips in the JIM bar. Max. 3.
const SCREEN_SUGGESTIONS: Record<ScreenId, string[]> = {
  painel: ["Como estão os fundos hoje?", "Qual é o regime de mercado agora?", "A defesa está ligada?"],
  fundo: ["Como este fundo está performando?", "Qual é o risco e o drawdown atuais?", "O que mudou na composição?"],
  cotacoes: ["Quais são as maiores altas e baixas de hoje?", "Qual ativo tem o melhor momentum?", "Algum ativo em nível de risco?"],
  acoes: ["Como está o momentum desta ação?", "Qual é o risco desta posição?", "Alguma notícia recente sobre ela?"],
  "mercado-visao": ["Por que o regime está assim?", "O risco é doméstico ou externo?", "O que devo fazer com o portfólio agora?"],
  regime: ["Por que o ARI está neste regime?", "O que isso muda na postura do portfólio?", "Devo me preocupar com a defesa?"],
  xri: ["Por que o risco externo está neste nível?", "Qual país está puxando o XRI?", "Isso muda as carteiras dos meus clientes?"],
  noticias: ["Qual é a notícia mais relevante agora?", "Algo aqui afeta o meu portfólio?", "Me faz um resumo do dia."],
  calendar: ["Qual é o evento de maior impacto nesta semana?", "Algum resultado que possa mexer com o meu portfólio?", "Como veio o último CPI frente ao consenso?"],
  risco: ["Qual nível se encaixa no meu cliente?", "Compara Moderado e Agressivo para mim.", "O que significa este Risk Number?"],
  clientes: ["Qual cliente está fora do mandato?", "Quem tem o maior AUM?", "Me faz um resumo da base de clientes."],
  cliente: ["Este cliente está adequado ao perfil dele?", "Qual é o Risk Number dele?", "O que devo sugerir a ele agora?"],
  carteira: ["Esta carteira está adequada?", "Qual posição pesa mais no risco?", "Ela precisa de rebalanceamento?"],
  "cliente-risco": ["O cliente respondeu ao questionário?", "O perfil declarado bate com o cadastrado?", "O Risk Number está dentro do mandato?"],
  "portfolio-detalhe": ["Esta carteira está bem diversificada?", "Qual é a maior concentração de risco aqui?", "Como esta carteira se compara ao mandato do cliente?"],
  "portfolio-builder": ["Qual SET se encaixa em um cliente que quer baixo drawdown?", "Qual é o retorno líquido após as taxas neste SET?", "Quanto o custo de execução consome do CAGR?"],
  ordem: ["O que estas ordens fazem?", "Por que estas mudanças hoje?", "Qual é o impacto no portfólio?"],
  importar: ["Como importo uma carteira?", "Quais formatos são aceitos?", "Consigo conectar com a custódia?"],
  alertas: ["Qual alerta é o mais urgente?", "O que exige a minha ação hoje?", "Me faz um resumo dos alertas."],
  institutional: ["O que este fundo comprou recentemente?", "Qual é a maior posição dele?", "Há concentração setorial?"],
  "insider-orders": ["Quais foram as compras recentes de insiders?", "A compra por insiders é um sinal de alta?", "Algum executivo vendendo pesado?"],
  "market-dna": ["Quais camadas estão disponíveis agora?", "O que o Conviction Score está dizendo?", "Alguma camada em nível extremo?"],
  screener: ["Quais tickers têm P/L abaixo de 15 e ROE acima de 20%?", "Qual setor está mais barato agora?", "Me mostra os de maior crescimento de receita."],
  snowflake: ["Por que o eixo de Valor está baixo?", "Compara esta snowflake com outro ticker", "Este ticker paga um bom dividendo?"],
  "filings-search": ["Quais empresas mencionaram isto em um 8-K recente?", "Filtra só para 10-K", "Isto é informação material?"],
  "cot-sentiment": ["Qual mercado está em nível extremo?", "Onde o smart money está posicionado?", "Algum sinal contrário agora?"],
  "cot-legacy": ["O que estes dados de COT dizem?", "Qual mercado mais mudou nesta semana?", "Como leio o open interest?"],
  "social-radar": ["Qual ativo está em alta nas redes sociais?", "O sentimento está de alta ou de baixa?", "Isso importa para o mercado?"],
  "news-broadcast": ["Qual manchete está mexendo com o mercado hoje?", "Algo aqui afeta o meu portfólio?", "Me faz um resumo das notícias."],
  integracoes: ["Quais integrações estão ativas?", "Alguma conexão caiu?", "Como conecto a corretora?"],
  marca: ["Como personalizo o terminal?", "Posso usar o meu próprio logo e cores?", "Como fica o white-label?"],
  config: ["O que posso configurar aqui?", "Como ajusto as notificações?", "Como mudo o tema?"],
  api: ["Como uso a API do ETP?", "Quais endpoints existem?", "Como faço a autenticação?"],
  tutorial: ["Como navego pelo terminal?", "Por onde começo?", "Me mostra os principais recursos."],
};

export function getScreenSuggestions(id: ScreenId): string[] {
  return SCREEN_SUGGESTIONS[id] || SCREEN_SUGGESTIONS.painel;
}

export const BOOK_CATEGORIES = [
  { code: "01", name: "Ideological Foundations", topics: "investment philosophy, principles, ethics" },
  { code: "02", name: "Real Macroeconomics", topics: "economic cycles, monetary policy, inflation, interest rates" },
  { code: "03", name: "Geopolitics", topics: "geopolitical risks, conflicts, sanctions, market impact" },
  { code: "04", name: "Market and Psychology", topics: "behavioral finance, cognitive biases, fear & greed, market psychology" },
  { code: "05", name: "R&D and Tech", topics: "system architecture, software engineering, technology" },
  { code: "06", name: "Media and Narrative", topics: "market narratives, media manipulation, propaganda" },
  { code: "09", name: "Finance", topics: "corporate finance, valuation, fundamental analysis" },
  { code: "12", name: "Risk Management", topics: "risk management, VaR, stress testing, tail risk, hedging" },
  { code: "16", name: "Trading & Quant & ML", topics: "quantitative trading, applied machine learning, backtesting, strategies" },
  { code: "19", name: "CFO Books", topics: "financial management, planning, budget control" },
  { code: "22", name: "Jim Simons", topics: "Renaissance Technologies, quant strategies, statistical arbitrage" },
  { code: "25", name: "Risk Management Skill", topics: "risk models, portfolio risk, drawdown control" },
  { code: "28", name: "Book of Formulas for Trading", topics: "technical indicators, formulas, 520 cataloged methods" },
  { code: "29", name: "Books for Backtest", topics: "backtesting methodology, walk-forward, statistical validation" },
  { code: "32", name: "Data Mining", topics: "data mining, feature engineering, alpha discovery" },
];

export function buildSystemPrompt(ctx: ScreenContext): string {
  return `You are JIM, the AI assistant for Harpian Capital's ETP Terminal.

IDIOMA (regra absoluta): responda SEMPRE em português brasileiro (pt-BR), claro e direto. Nunca responda em inglês, mesmo que a pergunta, os dados da tela ou os livros estejam em inglês. Termos técnicos consagrados (drawdown, momentum, ticker) podem ficar em inglês, mas a prosa é toda em português.

ROLE: You are the manager/advisor's right hand. A professor and analyst who helps interpret data, make decisions, and understand the market. You convey confidence and security — always grounded in data and verifiable sources.

CURRENT SCREEN: "${ctx.title}"
${ctx.description}
${ctx.dataAvailable.length ? `Data available on this screen: ${ctx.dataAvailable.join(", ")}.` : ""}

FUNDAMENTAL RULES:
1. NEVER reveal formulas, signals, triggers, CRS, HSA, or any detail of the proprietary method. You show the RESULT and the POSTURE, never the HOW.
2. SEMPRE responda em português brasileiro (pt-BR), de forma clara e direta — nunca em inglês.
3. When citing data, be precise. If you're not sure, say so.
4. For theory questions (risk, macroeconomics, indicators), consult the knowledge base (books).
5. When citing books, mention: title, author, and relevant chapter/section.

YOU CAN SEE THE SCREEN — GOLDEN RULE (never violate this):
- With every question, you receive the REAL DATA currently rendered on the manager's screen (the "DATA CURRENTLY VISIBLE ON SCREEN" block, in JSON). You SEE it.
- When the manager asks about anything on the screen — a company, an executive, a ticker, a row, a number — it is STRICTLY FORBIDDEN to ask (in Portuguese) "o que você está vendo na tela?", "qual transação?", "compra ou venda?", "qual valor?". That is the WORST possible response and permanently erodes the manager's trust.
- Instead: LOCATE the item in the provided data and answer DIRECTLY, with the real numbers from the screen. Ex.: if he asks about NVIDIA's CEO on the Insider Orders screen, you find the NVDA row in the data, see that Jensen Huang (CEO) made a SALE of X shares for $Y on date Z, and immediately explain what that means — without asking anything.
- If, to go deeper, you need data that is NOT on the screen, acknowledge it right away and continue (in Portuguese): "Deixa eu verificar isso pra você — um instante." And GIVE the reading you can with what's on screen right away; complete it afterward. Never bounce the question back to the manager.
- If the screen carries no data (block absent), only then say there's no data loaded on that screen and offer general help.

AVAILABLE KNOWLEDGE BASE:
${BOOK_CATEGORIES.map(b => `- [${b.code}] ${b.name}: ${b.topics}`).join("\n")}

When the question involves theory or fundamentals, you have access to these books to give well-grounded answers with source citations.

METRICS YOU KNOW:
- Risk Number: 0-100 scale of portfolio risk (SPY ≈ 72)
- Sortino (not Sharpe): downside-risk-adjusted return metric
- Calmar: CAGR / Max Drawdown
- Drawdown: maximum decline from peak to trough
- CAGR: compound annual growth rate
- COT Index: normalized CFTC positioning (0-100 over a 3-year window)

STYLE:
- Professional but approachable. Like a senior analyst speaking with the director.
- Short sentences. Data > opinion. Sources when possible.
- If the manager asks something outside your scope, say so honestly.
- Use markdown formatting when useful (bold, lists, tables).`;
}

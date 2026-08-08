"use client";
import { useState } from "react";
import type { ScreenId } from "@/lib/nav";

// ============================================================
// TUTORIAL — Interactive flowchart of the ETP Terminal
// Each top menu = a node in the flow. Click → why it matters +
// each screen and each box, with the data/information it brings.
// Client-safe: describes RESULT and POSTURE, never method/signals.
// ============================================================

// Box `w` (why it matters) is rendered as a distinct amber accent under the
// description — same tone as JD's newsletter. Absent on trivial boxes.
interface Box { t: string; d: string; w?: string }
interface Tela { nome: string; go?: ScreenId; param?: string; why: string; boxes: Box[] }
interface Node {
  key: string;
  label: string;
  icon: string;
  fase: string;
  cor: string;
  importa: string;
  startHere?: boolean;
  telas: Tela[];
}

// ── QUICK-START ────────────────────────────────────────────────────────
interface QuickStep { n: number; title: string; blurb: string; go: ScreenId; param?: string; icon: string }
const QUICK_START: QuickStep[] = [
  { n: 1, title: "Leia o briefing matinal do JIM",   blurb: "Abra o Painel. A manchete do JIM informa o regime, o estado de defesa e se algum cliente precisa de atenção hoje.",           go: "painel",        icon: "ti-sun" },
  { n: 2, title: "Confira o Veredito (ARI · XRI · Defesa)", blurb: "Mesma página, 3 cartões. Se os dois regimes concordam e a defesa está desarmada, é um dia calmo. Caso contrário, investigue.",         go: "painel",        icon: "ti-checkbox" },
  { n: 3, title: "Abra o fundo → The Vault",      blurb: "Fundos › HPC22 → aba \"The Vault\". É o que seus clientes veem: quantas posições, taxa de acerto, 3 trades encerrados em rodízio.", go: "fundo", param: "HPC22", icon: "ti-shield-lock" },
  { n: 4, title: "Confira um cliente na régua de 4 níveis", blurb: "Risco › Comparação. Todos os clientes na mesma escala — você identifica na hora quem está acima do mandato.",   go: "risco",         icon: "ti-scale" },
  { n: 5, title: "Pergunte qualquer coisa ao JIM",               blurb: "Botão Jim AI (canto superior direito). Ele vê exatamente a tela em que você está e responde no contexto — inclusive os dados privados.",         go: "painel",        icon: "ti-sparkles" },
];

const NODES: Node[] = [
  {
    key: "painel", label: "Painel", icon: "ti-home", fase: "Dia 1 · comece aqui", cor: "var(--gold)", startHere: true,
    importa: "Seu check-in diário de 30 segundos. Abra logo de manhã. JIM no topo, veredito + fundos + alertas abaixo. Arraste e solte os blocos para deixar do seu jeito (como no Bloomberg).",
    telas: [
      {
        nome: "Painel", go: "painel",
        why: "Uma página com tudo o que você precisa para decidir se hoje é um dia normal ou um dia que exige ação.",
        boxes: [
          { t: "JIM — Briefing Matinal", d: "Saudação + manchete do dia + seções recolhíveis: portfólio, regime, market DNA, clientes e risco, calendário. Clique no cabeçalho de qualquer seção para abrir a tela completa." },
          { t: "Veredito — ARI · XRI · Defesa", d: "Três cartões: regime interno (ARI, nosso motor), regime externo (XRI, o índice de estresse de 26 países) e se a Defesa está armada. Os três verdes = risk-on. Qualquer âmbar/vermelho = leia com atenção." },
          { t: "Seus Fundos", d: "HPC22 e HPC11 lado a lado, com chips 1D / 5D / MTD / YTD e o delta vs S&P no ano. Clique para abrir a página do fundo." },
          { t: "XRI — Regime Externo", d: "Score 0–100 + estado (MODERADO/CAUTELA/BEAR), direção, confiança e os 2 principais países que empurram o índice." },
          { t: "Alertas", d: "Sinalizações em tempo real: clientes fora do mandato, clientes a 8 pontos do mandato, eventos de mercado de alto impacto (Fed, CPI…)." },
          { t: "The Vault — agregado", d: "4 KPIs do ETP agora: posições ativas, % do AUM investido, taxa de acerto em 90 dias, média de dias em posição. O CTA abre a aba completa do Vault." },
          { t: "Clientes", d: "AUM total, número de clientes ativos, quantos estão fora do mandato." },
        ],
      },
    ],
  },
  {
    key: "mercado", label: "Mercado", icon: "ti-chart-candle", fase: "Leia o cenário", cor: "var(--blue)", startHere: true,
    importa: "Antes de abrir um cliente ou um fundo, entenda o ambiente. Preços ao vivo, os dois índices de regime (interno e externo), o market DNA de 10 camadas e o calendário.",
    telas: [
      {
        nome: "Visão de Mercado (ARI)", go: "regime",
        why: "A leitura do S&P 500 + o regime interno + o que muda a nossa postura de risco. Comece por aqui nos dias que parecem estranhos.",
        boxes: [
          {
            t: "5 cartões de cabeçalho", d: "Preço do S&P 500 + variação do dia · YTD · RSI(14) · Max DD e Sharpe · Pílula de regime (ARI ao vivo).",
            w: "O preço sozinho engana. Preço + RSI + drawdown juntos dizem se você está comprando força ou aparando uma faca caindo. A pílula de regime condensa mais de 40 sinais em uma palavra — esse é o atalho."
          },
          {
            t: "JIM — Análise de Mercado", d: "Um parágrafo consolidando regime, S&P, VIX, Fear & Greed, amplitude e o próximo evento.",
            w: "O JIM cruza 5 fontes não relacionadas. Quando concordam, a convicção é alta; quando divergem, costuma ser onde o alfa se esconde — e é isso que o JIM vai apontar."
          },
          {
            t: "Gráfico do S&P 500", d: "Candles com alternância 3M–5Y e sobreposição de indicadores (EMA, Bollinger, Volume, RSI, Momentum).",
            w: "Não dá para gerir risco em um gráfico que você não consegue ver. Sobrepor as EMAs permite identificar mudanças de regime antes de a CNBC anunciar — o preço cruza a EMA antes de a narrativa alcançar."
          },
          {
            t: "Resumo do Market DNA", d: "Barras de score por dimensão: Volatilidade, Sentimento, Amplitude, Macro, Posicionamento.",
            w: "Uma dimensão é anedota; cinco concordando é um regime. Esta miniatura é a sua conferência rápida antes de mergulhar na tela completa do Market DNA."
          },
          {
            t: "Calendário + Notícias (barra lateral)", d: "Próximos eventos de alto impacto + manchetes que movem o mercado.",
            w: "Metade dos movimentos do ano acontece em 10 datas. Saber quais são as 10 — e estar posicionado ANTES, não depois — é o jogo inteiro."
          },
        ],
      },
      {
        nome: "XRI — Regime Externo", go: "xri",
        why: "O índice de estresse externo de 26 países. Quando ele vira antes do ARI, o choque vem de fora — costuma ser o primeiro aviso.",
        boxes: [
          {
            t: "Score + estado + confiança", d: "Score 0–100, estado (MODERADO/CAUTELA/BEAR/BULL), direção (estável / deteriorando / melhorando), confiança % (quantos países concordam).",
            w: "Os mercados americanos não se movem no vácuo. Um choque no Japão, na China ou na Zona do Euro pode atingir o SPY 24–48h depois. O XRI é o alerta antecipado que se adianta ao noticiário doméstico."
          },
          {
            t: "Países que puxam o índice", d: "Principais contribuintes para o score atual (Japão, China, Zona do Euro…) com a % de contribuição.",
            w: "Saber DE ONDE o estresse se origina diz qual SETOR proteger. Medo puxado pelo Japão atinge semicondutores; pela China, consumo discricionário; pela Europa, luxo e bancos."
          },
          {
            t: "Canais de transmissão", d: "Fragilidade (estrutural) vs prior macro (lento) vs estresse de mercado (rápido) — de onde o risco vem mecanicamente.",
            w: "Fragilidade significa que o sistema vai rachar sob estresse mesmo sem estresse hoje. Rápido significa que câmbio/juros já estão quebrando. Mesmo score, manual de ação completamente diferente."
          },
        ],
      },
      {
        nome: "Market DNA", go: "market-dna",
        why: "A leitura institucional de 10 camadas. Cada camada pontuada de 0–100. A MÉDIA é a Convicção; a DISPERSÃO é onde fica interessante.",
        boxes: [
          {
            t: "Cabeçalho de resumo (dentro de Score por Camada)", d: "Score de convicção + pílula de regime (CAUTIOUS/HEALTHY/…) + contadores live/partial. A fórmula aparece ao passar o mouse no cabeçalho.",
            w: "A média é sobre o que a multidão fala. A discordância é onde o alfa se esconde. LIVE vs PARTIAL diz quanto do score é dado em tempo real vs defasado."
          },
          {
            t: "Radar de Inteligência", d: "Polígono com os scores das 7 camadas de uma vez — você vê a forma, não só os números.",
            w: "Os números escondem a forma. Um polígono mostra na hora se o mercado está uniformemente bom, uniformemente ruim ou desequilibrado — o caso desequilibrado costuma ser o interessante."
          },
          {
            t: "Score por Camada", d: "Barras ordenadas por score, cada uma com selo LIVE/PART (status da fonte de dados).",
            w: "Se Posicionamento está 90 (comprado extremo) e Sentimento está 20 (medo extremo), alguém está blefando. Essa contradição é o trade que o mercado convencional perde."
          },
          {
            t: "Cartões por camada", d: "Posicionamento, Volatilidade, Opções, Liquidez, Amplitude, Sentimento, Macro — cada um com 4 indicadores (VIX, IV Rank, Curva de Juros, Spread de Crédito…).",
            w: "Cada score é construído sobre 4 subindicadores. Auditá-los diz se o score é frágil (1 indicador dominando) ou robusto (4 concordando) — o mesmo score 60 significa coisas muito diferentes."
          },
          {
            t: "Painel JIM Intelligence", d: "Onde as camadas se CONTRADIZEM — essas discordâncias escondem o sinal de verdade.",
            w: "Qualquer painel mostra médias. O JIM destaca especificamente as CONTRADIÇÕES — porque essa é a informação que nenhum número isolado revelaria."
          },
        ],
      },
      {
        nome: "Snowflake", go: "snowflake",
        why: "Visão multidimensional de um único ativo (valor, futuro, passado, saúde, dividendo).",
        boxes: [
          {
            t: "Snowflake por ativo", d: "Radar de 5 pontos por empresa com a leitura qualitativa de cada eixo.",
            w: "Empresas não são só o seu P/L. Uma visão de 5 dimensões força você a ver saúde + passado + dividendo + valor + futuro juntos — um eixo fraco é um alerta que nenhum índice isolado capta."
          },
        ],
      },
      {
        nome: "Calendário", go: "calendar",
        why: "Só eventos econômicos de alto impacto (Fed, CPI, NFP, BCE…). Ignora o ruído.",
        boxes: [
          {
            t: "Feed de eventos", d: "Data, hora, evento, previsão, anterior. Filtre por país e impacto.",
            w: "Fed, CPI e NFP explicam mais volatilidade de curto prazo do que qualquer temporada de resultados. Você quer estar posicionado ANTES de eles saírem — não correndo atrás depois."
          },
        ],
      },
      {
        nome: "Cotações", go: "cotacoes",
        why: "Preços ao vivo de todas as classes em um único painel.",
        boxes: [
          {
            t: "Abas por classe", d: "Favoritos + ações, índices, ETFs, setores, commodities, cripto, forex.",
            w: "Contexto entre classes: se títulos e ouro sobem enquanto as ações caem, é risk-off. Só as abas de classes lado a lado deixam você ver isso num relance."
          },
          {
            t: "Tabela de cotações", d: "Último preço, Dia / 1M / YTD / 1A e o Sharpe de 1 ano por ativo. Clicar abre o gráfico.",
            w: "O Sharpe de 1 ano ao lado do preço é o seu filtro rápido para 'isto está barato por sorte ou por processo'. Preço alto + Sharpe baixo = bilhete de loteria caro."
          },
        ],
      },
      {
        nome: "Screener", go: "screener",
        why: "Filtre o universo com seus próprios critérios (momentum, valuation, setor…). Seguro para o cliente — os filtros aqui NÃO são os que o ETP usa internamente.",
        boxes: [
          {
            t: "Multifiltro", d: "Combine market cap, setor, momentum, valuation. Resultados em uma tabela ordenável.",
            w: "Todo gestor precisa de uma watchlist pessoal. O Screener é o seu microscópio. O motor do ETP permanece proprietário — este é seu para explorar, não para fazer engenharia reversa do nosso."
          },
        ],
      },
    ],
  },
  {
    key: "intelligence", label: "Inteligência", icon: "ti-building", fase: "Vantagem institucional", cor: "var(--blue)",
    importa: "O diferencial frente a uma corretora de varejo: o que os grandes players estão fazendo (SEC 13F, Form 4 de insiders, COT da CFTC), o sentimento do varejo (StockTwits) e os documentos brutos — tudo em um só lugar.",
    telas: [
      {
        nome: "Social Radar", go: "social-radar",
        why: "O sentimento declarado do varejo, ao vivo, com o alcance de quem está falando.",
        boxes: [
          {
            t: "Feed de posts (StockTwits)", d: "Autor + selo de verificado, faixa de alcance, sentimento (Bullish/Bearish/Neutral), cashtags.",
            w: "O varejo acerta na virada e erra na cauda. Volume de um nome explodindo no StockTwits com fundamentos fracos = setup de short-squeeze contra o qual você pode operar."
          },
          {
            t: "Painel de inteligência", d: "Clique num post: ativos mencionados + a nossa leitura da confiabilidade do sentimento.",
            w: "Sentimento é direção; alcance é amplitude. Alto alcance + sentimento errado = a oportunidade de contra-trade pela qual as mesas institucionais vivem."
          },
        ],
      },
      {
        nome: "News Broadcast", go: "news-broadcast",
        why: "Feed financeiro consolidado, filtrável por fonte e impacto.",
        boxes: [
          {
            t: "Grade de manchetes", d: "Fonte, etiqueta de impacto (Market Moving / High / Normal), horário, título.",
            w: "Você não reage ao que não viu. Filtrar por 'Market Moving' corta 95% do ruído para você gastar atenção só onde importa."
          },
        ],
      },
      {
        nome: "Insider Orders", go: "insider-orders",
        why: "SEC Form 4 — quando um diretor ou executivo compra/vende as próprias ações.",
        boxes: [
          {
            t: "Tabela de filings", d: "Data, nome do insider + cargo, empresa, ticker, lado (compra/venda), quantidade de ações, valor em $. Clique para o filing original.",
            w: "Executivos conhecem o próprio negócio melhor que qualquer analista. Aglomerados de COMPRAS de insiders historicamente superaram o SPX em 6–8% a.a. As vendas de insiders são mais ruidosas (remuneração em ações, diversificação) — o sinal de COMPRA é mais forte."
          },
        ],
      },
      {
        nome: "Posições 13F", go: "institutional",
        why: "SEC Form 13F — o que os maiores hedge funds detêm a cada trimestre.",
        boxes: [
          {
            t: "4 KPIs", d: "AUM total do 13F, número de posições, data do filing, período.",
            w: "O TAMANHO de um fundo diz se as operações dele são informativas ou só marolas. Um fundo de US$ 100 bi adicionando 1% de uma small-cap é uma aposta de convicção real."
          },
          {
            t: "Top 10 + Todas as posições", d: "Emissor, classe, CUSIP, valor em $, quantidade de ações, put/call.",
            w: "Quando a Bridgewater ou a Berkshire adiciona uma posição, tiveram de justificá-la internamente. O portfólio deles é um memorando vazado da convicção — legalmente livre para ler, e a maioria dos gestores não lê."
          },
        ],
      },
      {
        nome: "COT Intelligence", go: "cot-sentiment",
        why: "CFTC Commitments of Traders — o posicionamento em futuros dos grandes players, normalizado (COT Index 0–100).",
        boxes: [
          {
            t: "Guia + sinalizações de extremo", d: "Os 3 grupos (Commercials · Large Specs · Nonreportable) e quais mercados estão em extremo.",
            w: "Large Speculators em compra extrema é um sinal clássico de reversão. Commercials em venda extrema significa produtores fazendo hedge pesado — a mesma reversão, espelhada. Quando ambos apontam na mesma direção, a reversão é iminente."
          },
          {
            t: "Cartões por mercado", d: "COT Index 0–100, variação semanal, posição líquida por grupo (% do OI), Open Interest, alerta contrário quando em extremo.",
            w: "O mesmo princípio em todos os principais futuros. Quando 3 ou mais mercados atingem o extremo ao mesmo tempo, é um aviso sistêmico — não uma anomalia de um único mercado."
          },
        ],
      },
      {
        nome: "COT Data Explorer", go: "cot-legacy",
        why: "Dados brutos da CFTC — direto ao número, sem interpretação.",
        boxes: [
          {
            t: "Tabela bruta", d: "Data, mercado, Spec Net, Comm Net (e % do OI), longs/shorts por grupo, Open Interest, janela de 4–52 semanas.",
            w: "O COT Index normalizado esconde saltos no open interest bruto. O Explorer permite garimpar a exceção que o score suavizado apaga."
          },
        ],
      },
      {
        nome: "Filings Search", go: "filings-search",
        why: "Busca de texto completo no SEC EDGAR em 10-K, 10-Q, 8-K desde 2001.",
        boxes: [
          {
            t: "Busca por palavra-chave", d: "Digite uma palavra-chave, filtre por tipo de formulário / data / ticker. Os resultados linkam para o EDGAR.",
            w: "As empresas enterram a verdade no corpo do 10-K, não no resumo. Buscar 'material weakness' ou 'going concern' revela alertas que o release de resultados não mostra."
          },
        ],
      },
    ],
  },
  {
    key: "fundos", label: "Fundos", icon: "ti-coin", fase: "O produto", cor: "var(--green)", startHere: true,
    importa: "O coração da venda — o perfil completo de cada ETP. 8 abas. O The Vault (padrão) é a estrela: transparência sem entregar o modelo.",
    telas: [
      {
        nome: "Fundo · Visão Geral", go: "fundo", param: "HPC22",
        why: "Perfil do produto: o que é, o que entrega, selos de governança.",
        boxes: [
          { t: "Cabeçalho + Destaques", d: "Ticker, nome, estratégia, status, ISIN + 4 estatísticas de destaque (CAGR, Max DD, Sortino…) com comparação vs S&P e Nasdaq." },
          { t: "Dados do produto + Selos", d: "Perfil chave-valor e selos de governança (a Harpian não faz custódia nem execução — quem faz é a Lynk/BNYM)." },
        ],
      },
      {
        nome: "The Vault (aba padrão)", go: "fundo", param: "HPC22",
        why: "Protocolo de Opacidade Verificada. O cliente vê o suficiente para confiar — não o suficiente para replicar. É isso que protege a vantagem enquanto prova o skin-in-the-game.",
        boxes: [
          { t: "The Vault (agregado)", d: "5 KPIs: comprados ativos, hedges, % do AUM investido, beta do portfólio, tempo médio em posição, taxa de acerto em 90 dias. NUNCA mostra os tickers das posições ativas." },
          { t: "The Showcase (3 posições encerradas)", d: "3 trades reais que o ETP encerrou, amostrados de posições fechadas há 28 dias ou mais. Rotaciona toda segunda-feira às 06:00 (horário de Brasília). Sem arquivo." },
          { t: "Momentum Weather", d: "Estado do regime + % de defesa + dias de sequência + última virada de regime (de/para + magnitude). A pilha de gatilhos permanece proprietária." },
          { t: "Do Not Touch", d: "Os 5 piores momentums do SPX500 + 2 setores frágeis que estamos evitando ativamente esta semana. Publicar o que EVITAMOS é mais seguro do que o que compramos." },
        ],
      },
      {
        nome: "Fundo · Desempenho", go: "fundo", param: "HPC22",
        why: "A prova dos resultados, sempre comparada a benchmark. Layout: gráfico 2/3 · tabelas 1/3.",
        boxes: [
          { t: "US$ 10 mil ao longo do tempo (esquerda, 2/3)", d: "Crescimento real do portfólio vs S&P vs CORE22+, com retorno e MaxDD por período." },
          { t: "Bruto vs líquido vs S&P (direita, 1/3)", d: "Tabela métrica a métrica." },
          { t: "CORE22+ vs S&P vs Nasdaq (direita)", d: "CAGR, Max DD, Ulcer, Sharpe, Sortino, anos negativos — os três benchmarks lado a lado." },
        ],
      },
      {
        nome: "Fundo · Risco e Jornada", go: "fundo", param: "HPC22",
        why: "A história da preservação de capital. Layout: gráfico 2/3 · tabelas 1/3.",
        boxes: [
          { t: "Gráfico da jornada (esquerda, 2/3)", d: "Retorno acumulado vs S&P vs Dow vs Treasuries. A linha do CORE22+ fica ÂMBAR nos períodos em que a Defesa esteve armada (2008, 2020, 2022, etc.), com faixas sutis ao fundo. Passar o mouse mostra o nome da crise." },
          { t: "Dimensão 1 · Risco da jornada (direita)", d: "Quedas ≥5%: CORE22+ vs S&P lado a lado." },
          { t: "Dimensão 2 · Risco do ponto de entrada (direita)", d: "Comprando no topo do ano: % de casos positivos e o pior caso por horizonte." },
        ],
      },
      {
        nome: "Fundo · Defesa em Crises", go: "fundo", param: "HPC22",
        why: "Por crise: drawdown e tempo de recuperação, S&P vs CORE, mais a comparação com a Nasdaq.",
        boxes: [
          { t: "Tabela de defesa em crises", d: "Dot-com, GFC, COVID, bear de 2022, etc. — queda e recuperação do S&P vs queda e recuperação do CORE22+." },
        ],
      },
      {
        nome: "Composição · foto de 5 semanas", go: "fundo", param: "HPC22",
        why: "O portfólio como estava há 35 dias. Transparência total (tickers + pesos + defesa), mas com embargo móvel — o tempo em posição é de ~34 dias, então a maioria das posições aqui já rodou.",
        boxes: [
          { t: "Aviso de defasagem", d: "Aviso explícito: 'composição não é ao vivo'. Mostra a data exata da foto e o estado do regime naquele momento." },
          { t: "3 perfis", d: "Conservador / Balanceado / Avançado: divisão entre ações e ETFs, número de posições, principais posições com % de peso." },
          { t: "Camada de defesa (como estava)", d: "Os ativos defensivos e os pesos ativos naquela data da foto. O gatilho continua proprietário." },
        ],
      },
      {
        nome: "Fundo · Economia e Arquitetura", go: "fundo", param: "HPC22",
        why: "O perfil comercial e operacional — taxas, custódia, liquidação, contatos.",
        boxes: [
          { t: "Economia do ETP", d: "Taxa de gestão, taxa de performance, mínimo, moeda." },
          { t: "Arquitetura institucional", d: "Custódia (BNY Mellon), liquidação (Euroclear/Clearstream), emissor, agente de cálculo." },
          { t: "Arquitetura do motor", d: "Qual variante do motor alimenta este fundo (redação segura para o cliente)." },
          { t: "Contatos", d: "Contrapartes operacionais para onboarding e subscrição." },
        ],
      },
      {
        nome: "Fundo · Como Comprar", go: "fundo", param: "HPC22",
        why: "Guia de 5 passos, da análise ao envio via Lynk.",
        boxes: [
          { t: "Fluxo de 5 passos", d: "Instruções por passo para o MFO / mesa da corretora." },
          { t: "CTA de enviar ordem", d: "Abre a tela de Ordens pré-carregada para este fundo." },
        ],
      },
      {
        nome: "Enviar ordem (Lynk)", go: "ordem",
        why: "Fecha o ciclo: a subscrição/resgate vai para a Lynk.",
        boxes: [
          { t: "Produto + Ordem", d: "Perfil (ISIN, NAV de ontem, custódia BNYM, liquidação Euroclear/Clearstream), lado, cliente, valor, observações." },
          { t: "Validação", d: "Mínimo de US$ 50 mil, múltiplos de US$ 5 mil, diálogo de confirmação." },
          { t: "Custódia × corretora", d: "Caixa no BNY Mellon (NY); contas via Interactive Brokers (IBKR)." },
          { t: "Execução manual", d: "Toda ordem diária é executada manualmente pela equipe após revisão no cockpit. O JIM interpreta e apoia — nenhuma ordem é automática." },
        ],
      },
    ],
  },
  {
    key: "clientes", label: "Clientes", icon: "ti-users", fase: "As pessoas", cor: "var(--gold)",
    importa: "A base de clientes do MFO: quem são, quanto têm, o que carregam, quem está fora do mandato. Do CSV de onboarding à carteira detalhada e aos alertas.",
    telas: [
      {
        nome: "Lista de clientes", go: "clientes",
        why: "Visão de portfólio de todo o escritório em uma tela.",
        boxes: [
          { t: "4 KPIs", d: "AUM total, número de clientes, alocação média na Harpian, quantos estão fora do mandato." },
          { t: "Tabela de clientes", d: "Nome, tipo, perfil, AUM, ganho %, Risk Number, alinhamento (dentro / acima do mandato)." },
          { t: "Adicionar cliente (canto superior direito)", d: "Faça o onboarding de um novo cliente com o questionário de perfil." },
        ],
      },
      {
        nome: "Carteira do cliente", go: "carteira",
        why: "O detalhe de um cliente: o que carrega, o gap de risco e um simulador de migração.",
        boxes: [
          { t: "O que carrega hoje", d: "Barras de alocação por classe de ativo." },
          { t: "Gap de risco", d: "Risk Number vs mandato + slider 'migrar % para o HPC22'." },
          { t: "Carteiras por conta", d: "Cartões por carteira (corretora/conta, valor, número de posições)." },
        ],
      },
      {
        nome: "Importar / conectar", go: "importar",
        why: "Traga uma carteira externa para o terminal.",
        boxes: [
          { t: "Upload de CSV + prévia", d: "Arraste uma planilha (ativo, quantidade, preço médio); revise; aplique ao cliente." },
        ],
      },
      {
        nome: "Alertas", go: "alertas",
        why: "O que exige ação hoje, sem vasculhar cliente por cliente.",
        boxes: [
          { t: "Feed de alertas", d: "Nível (crítico / atenção / informativo), o alerta e quando. Mistura desvios de risco de clientes + eventos de mercado (Fed, CPI…)." },
        ],
      },
    ],
  },
  {
    key: "risco", label: "Risco", icon: "ti-shield-half", fase: "Suitability", cor: "var(--red)",
    importa: "Compliance transformado em argumento de venda. Produto · Mandato · Tolerância · Carteira, todos na MESMA régua de 0-100. Mostra ao cliente se ele está (ou não) dentro do que foi combinado.",
    telas: [
      {
        nome: "Comparação · 4 níveis", go: "risco",
        why: "4 riscos lado a lado. Pontos de referência: o S&P 500 está em ≈72, o HPC22 em ≈38, o HPC11 em ≈34 — ambos bem abaixo do mercado.",
        boxes: [
          {
            t: "4 cartões de nível", d: "Risco do produto · Tolerância do cliente · Teto do mandato · Risco da carteira.",
            w: "A palavra 'risco' não significa nada sem uma escala. Quando você mostra o S&P em 72, o HPC22 em 38 e o mandato do cliente em 40 — a conversa acaba, a imagem vence."
          },
          {
            t: "Régua do cliente", d: "Barra verde→vermelho com 4 marcadores + simulador de migração para o HPC22.",
            w: "Uma régua visual ganha de um parágrafo de jargão por 10 a 1. Clientes institucionais querem uma imagem que caiba em um slide — esta É esse slide."
          },
          {
            t: "Todos os clientes na régua", d: "Tabela comparativa (carteira vs mandato por cliente) + selo mostrando quantos estão fora.",
            w: "Visão de portfólio: quem está desviando acima do mandato, quem está alinhado. Compliance e vendas em uma tela — o alerta de compliance vira o argumento de retenção ('vamos ajustar isso')."
          },
        ],
      },
    ],
  },
  {
    key: "ajustes", label: "Configurações", icon: "ti-settings", fase: "Apoio", cor: "var(--tx2)",
    importa: "Operações + marca: conexões, API para o seu sistema de gestão, white-label para o terminal vestir a identidade do seu escritório.",
    telas: [
      { nome: "Integrações",         go: "integracoes", why: "Status ao vivo de cada fonte de dados e provedor (custódia, dados de mercado, Lynk).", boxes: [{ t: "Provedores", d: "Cada fonte é de fato consultada quando a tela abre — o status é medido, não declarado." }] },
      { nome: "API & Integração",    go: "api",         why: "Para a equipe técnica plugar os dados do Terminal no sistema de gestão do MFO.", boxes: [{ t: "Chaves e endpoints", d: "Endpoints REST, modelo de autenticação, docs de integração (fase 2)." }] },
      { nome: "Marca (white-label)",  go: "marca",       why: "O terminal veste a identidade do seu escritório nos relatórios ao cliente final.", boxes: [{ t: "Kit de marca", d: "Logo, cor primária, cor de destaque, nome exibido ao cliente final." }] },
      { nome: "Configurações",             go: "config",      why: "Preferências gerais e exibição.", boxes: [{ t: "Preferências", d: "Tema (padrão / claro / escuro) e configurações de exibição." }] },
    ],
  },
];

export default function Tutorial({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const [sel, setSel] = useState("painel");
  const node = NODES.find((n) => n.key === sel)!;

  return (
    <div className="screen">
      <div className="flex" style={{ alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <div className="h1" style={{ margin: 0 }}>Como usar o terminal — mapa completo</div>
        <div className="sub" style={{ margin: 0 }}>Clique em cada menu para ver por que importa e o que cada bloco traz. Segue o fluxo natural do dia: cenário → produto → cliente → execução.</div>
      </div>

      {/* ═══════════ QUICK START ═══════════ */}
      <div className="card mt" style={{
        borderColor: "rgba(201,160,44,.3)",
        background: "linear-gradient(90deg, rgba(201,160,44,.06), transparent 60%)",
        padding: "14px 18px",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-rocket" style={{ color: "var(--gold)" }} />
            Início Rápido — 5 minutos, 5 cliques
          </h3>
          <span className="muted" style={{ fontSize: 12 }}>Primeira vez aqui? Siga os números.</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          {QUICK_START.map((s) => (
            <div key={s.n}
              onClick={() => go(s.go, s.param)}
              style={{
                background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 8,
                padding: "10px 12px", cursor: "pointer", position: "relative",
                transition: "border-color .12s, transform .12s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: "var(--gold)", color: "#1a1205", fontWeight: 700, fontSize: 12,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>{s.n}</div>
                <i className={`ti ${s.icon}`} style={{ fontSize: 15, color: "var(--gold)" }} />
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--tx)", lineHeight: 1.3 }}>{s.title}</div>
              </div>
              <div style={{ fontSize: 11, color: "var(--tx3)", lineHeight: 1.5 }}>{s.blurb}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18, marginTop: 16, alignItems: "start" }} className="tut-grid">
        {/* Flow (clickable connected nodes) */}
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 21, top: 20, bottom: 20, width: 2, background: "var(--line)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {NODES.map((n) => {
              const on = n.key === sel;
              return (
                <div key={n.key} onClick={() => setSel(n.key)}
                  style={{
                    position: "relative", display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                    background: on ? "var(--bg2)" : "transparent",
                    border: `1px solid ${on ? n.cor : "transparent"}`,
                    transition: "background .12s, border-color .12s",
                  }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10, flexShrink: 0, display: "grid", placeItems: "center",
                    background: "var(--panel)", border: `2px solid ${on ? n.cor : "var(--line2)"}`, zIndex: 1,
                  }}>
                    <i className={`ti ${n.icon}`} style={{ fontSize: 20, color: on ? n.cor : "var(--tx2)" }} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 10, color: "var(--tx3)", fontFamily: "var(--mono)", letterSpacing: .3 }}>{n.fase}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: on ? "var(--tx)" : "var(--tx2)" }}>{n.label}</div>
                      {n.startHere && (
                        <span title="Ponto de partida recomendado"
                          style={{
                            fontSize: 8.5, fontWeight: 700, padding: "2px 6px", borderRadius: 3,
                            background: "rgba(201,160,44,.18)", color: "var(--gold)",
                            fontFamily: "var(--mono)", letterSpacing: .4,
                          }}>COMECE AQUI</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail of the selected node */}
        <div>
          <div className="card" style={{ borderColor: node.cor, borderLeftWidth: 3 }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <i className={`ti ${node.icon}`} style={{ color: node.cor }} />{node.label}
              <span style={{ marginLeft: "auto", fontSize: 10, fontFamily: "var(--mono)", color: "var(--tx3)" }}>{node.fase}</span>
            </h3>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--tx2)" }}>
              <b style={{ color: "var(--gold)" }}>Por que importa: </b>{node.importa}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
            {node.telas.map((tela, ti) => (
              <div className="card" key={ti}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--tx)" }}>{tela.nome}</span>
                  {tela.go && (
                    <button className="btn ghost" style={{ marginLeft: "auto", fontSize: 11, padding: "3px 10px" }}
                      onClick={() => go(tela.go!, tela.param)}>abrir tela ›</button>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--tx2)", lineHeight: 1.5, marginBottom: 10 }}>{tela.why}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 8 }}>
                  {tela.boxes.map((b, bi) => (
                    <div key={bi} style={{ background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 6, padding: "9px 11px" }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: node.cor, marginBottom: 3 }}>{b.t}</div>
                      <div style={{ fontSize: 11.5, color: "var(--tx2)", lineHeight: 1.5 }}>{b.d}</div>
                      {b.w && (
                        <div style={{
                          marginTop: 8, paddingTop: 8,
                          borderTop: "1px dashed rgba(201,160,44,.35)",
                          fontSize: 11, color: "var(--gold)", lineHeight: 1.55,
                        }}>
                          <b style={{ fontWeight: 700, letterSpacing: 0.4, fontSize: 9.5, fontFamily: "var(--mono)", display: "block", marginBottom: 3, opacity: 0.85 }}>
                            → POR QUE IMPORTA
                          </b>
                          <span style={{ fontStyle: "italic", color: "var(--tx)" }}>{b.w}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer: customization + Jim */}
      <div className="card mt" style={{ borderColor: "rgba(201,160,44,.3)" }}>
        <h3><i className="ti ti-layout-grid-add" />Personalize tudo (como no Bloomberg)</h3>
        <div className="muted" style={{ lineHeight: 1.6 }}>
          Todo painel tem um layout <b style={{ color: "var(--tx)" }}>padrão</b>, mas você <b style={{ color: "var(--tx)" }}>adiciona, remove e arrasta</b> os cartões. Comece pelo Painel: remova o que não usa, traga o que importa. É assim que o terminal vira a sua ferramenta de trabalho.
        </div>
      </div>

      <div className="card mt" style={{ display: "flex", alignItems: "center", gap: 14, borderColor: "rgba(201,160,44,.3)" }}>
        <i className="ti ti-sparkles" style={{ fontSize: 22, color: "var(--gold)" }} />
        <div style={{ flex: 1 }}><b style={{ fontSize: 13 }}>Precisa de ajuda?</b> <span className="muted" style={{ fontSize: 13 }}>Pergunte ao Jim AI a qualquer momento — ele vê a tela e responde no contexto.</span></div>
      </div>
    </div>
  );
}

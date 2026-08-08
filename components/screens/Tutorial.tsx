"use client";
import { useState, useMemo } from "react";
import type { ScreenId } from "@/lib/nav";
import { useI18n, type Lang } from "@/lib/i18n";

// ============================================================
// TUTORIAL — Interactive flowchart of the ETP Terminal
// Each top menu = a node in the flow. Click → why it matters +
// each screen and each box, with the data/information it brings.
// Client-safe: describes RESULT and POSTURE, never method/signals.
// ============================================================

type TDict = Record<Lang, string>;

const TR = {
  // ── Page chrome ──────────────────────────────────────────
  pageTitle: { pt: "Como usar o terminal — mapa completo", en: "How to use the terminal — full map" },
  pageSub: { pt: "Clique em cada menu para ver por que importa e o que cada bloco traz. Segue o fluxo natural do dia: cenário → produto → cliente → execução.", en: "Click each menu to see why it matters and what each block brings. Follows the natural flow of the day: scenario → product → client → execution." },
  quickStartHeading: { pt: "Início Rápido — 5 minutos, 5 cliques", en: "Quick Start — 5 minutes, 5 clicks" },
  quickStartHint: { pt: "Primeira vez aqui? Siga os números.", en: "First time here? Follow the numbers." },
  startHereBadge: { pt: "COMECE AQUI", en: "START HERE" },
  startHereTitle: { pt: "Ponto de partida recomendado", en: "Recommended starting point" },
  whyItMattersLabel: { pt: "Por que importa: ", en: "Why it matters: " },
  openScreen: { pt: "abrir tela ›", en: "open screen ›" },
  whyItMattersArrow: { pt: "→ POR QUE IMPORTA", en: "→ WHY IT MATTERS" },
  customizeHeading: { pt: "Personalize tudo (como no Bloomberg)", en: "Customize everything (like Bloomberg)" },
  customizeBody1: { pt: "Todo painel tem um layout ", en: "Every panel has a " },
  customizeBodyDefault: { pt: "padrão", en: "default" },
  customizeBody2: { pt: ", mas você ", en: " layout, but you " },
  customizeBodyAction: { pt: "adiciona, remove e arrasta", en: "add, remove and drag" },
  customizeBody3: { pt: " os cartões. Comece pelo Painel: remova o que não usa, traga o que importa. É assim que o terminal vira a sua ferramenta de trabalho.", en: " the cards. Start with the Dashboard: remove what you don't use, bring in what matters. That's how the terminal becomes your working tool." },
  needHelpTitle: { pt: "Precisa de ajuda?", en: "Need help?" },
  needHelpBody: { pt: "Pergunte ao Jim AI a qualquer momento — ele vê a tela e responde no contexto.", en: "Ask Jim AI at any time — he sees your screen and answers in context." },

  // ── Quick Start steps ────────────────────────────────────
  qs1Title: { pt: "Leia o briefing matinal do JIM", en: "Read JIM's morning briefing" },
  qs1Blurb: { pt: "Abra o Painel. A manchete do JIM informa o regime, o estado de defesa e se algum cliente precisa de atenção hoje.", en: "Open the Dashboard. JIM's headline tells you the regime, the defense state, and whether any client needs attention today." },
  qs2Title: { pt: "Confira o Veredito (ARI · XRI · Defesa)", en: "Check the Verdict (ARI · XRI · Defense)" },
  qs2Blurb: { pt: "Mesma página, 3 cartões. Se os dois regimes concordam e a defesa está desarmada, é um dia calmo. Caso contrário, investigue.", en: "Same page, 3 cards. If both regimes agree and defense is disarmed, it's a calm day. Otherwise, investigate." },
  qs3Title: { pt: "Abra o fundo → The Vault", en: "Open the fund → The Vault" },
  qs3Blurb: { pt: "Fundos › HPC22 → aba \"The Vault\". É o que seus clientes veem: quantas posições, taxa de acerto, 3 trades encerrados em rodízio.", en: "Funds › HPC22 → \"The Vault\" tab. This is what your clients see: how many positions, hit rate, 3 closed trades on rotation." },
  qs4Title: { pt: "Confira um cliente na régua de 4 níveis", en: "Check a client on the 4-level ruler" },
  qs4Blurb: { pt: "Risco › Comparação. Todos os clientes na mesma escala — você identifica na hora quem está acima do mandato.", en: "Risk › Comparison. All clients on the same scale — you instantly spot who's above mandate." },
  qs5Title: { pt: "Pergunte qualquer coisa ao JIM", en: "Ask JIM anything" },
  qs5Blurb: { pt: "Botão Jim AI (canto superior direito). Ele vê exatamente a tela em que você está e responde no contexto — inclusive os dados privados.", en: "Jim AI button (top-right corner). He sees exactly the screen you're on and answers in context — including private data." },

  // ── Node: Painel ─────────────────────────────────────────
  painelLabel: { pt: "Painel", en: "Dashboard" },
  painelFase: { pt: "Dia 1 · comece aqui", en: "Day 1 · start here" },
  painelImporta: { pt: "Seu check-in diário de 30 segundos. Abra logo de manhã. JIM no topo, veredito + fundos + alertas abaixo. Arraste e solte os blocos para deixar do seu jeito (como no Bloomberg).", en: "Your 30-second daily check-in. Open it first thing in the morning. JIM on top, verdict + funds + alerts below. Drag and drop the blocks to make it your own (like Bloomberg)." },
  painelT0Nome: { pt: "Painel", en: "Dashboard" },
  painelT0Why: { pt: "Uma página com tudo o que você precisa para decidir se hoje é um dia normal ou um dia que exige ação.", en: "One page with everything you need to decide whether today is a normal day or one that demands action." },
  painelT0B0T: { pt: "JIM — Briefing Matinal", en: "JIM — Morning Briefing" },
  painelT0B0D: { pt: "Saudação + manchete do dia + seções recolhíveis: portfólio, regime, market DNA, clientes e risco, calendário. Clique no cabeçalho de qualquer seção para abrir a tela completa.", en: "Greeting + headline of the day + collapsible sections: portfolio, regime, market DNA, clients and risk, calendar. Click any section header to open the full screen." },
  painelT0B1T: { pt: "Veredito — ARI · XRI · Defesa", en: "Verdict — ARI · XRI · Defense" },
  painelT0B1D: { pt: "Três cartões: regime interno (ARI, nosso motor), regime externo (XRI, o índice de estresse de 26 países) e se a Defesa está armada. Os três verdes = risk-on. Qualquer âmbar/vermelho = leia com atenção.", en: "Three cards: internal regime (ARI, our engine), external regime (XRI, the 26-country stress index), and whether Defense is armed. All three green = risk-on. Any amber/red = read carefully." },
  painelT0B2T: { pt: "Seus Fundos", en: "Your Funds" },
  painelT0B2D: { pt: "HPC22 e HPC11 lado a lado, com chips 1D / 5D / MTD / YTD e o delta vs S&P no ano. Clique para abrir a página do fundo.", en: "HPC22 and HPC11 side by side, with 1D / 5D / MTD / YTD chips and the delta vs S&P year-to-date. Click to open the fund page." },
  painelT0B3T: { pt: "XRI — Regime Externo", en: "XRI — External Regime" },
  painelT0B3D: { pt: "Score 0–100 + estado (MODERADO/CAUTELA/BEAR), direção, confiança e os 2 principais países que empurram o índice.", en: "Score 0–100 + state (MODERATE/CAUTION/BEAR), direction, confidence, and the top 2 countries driving the index." },
  painelT0B4T: { pt: "Alertas", en: "Alerts" },
  painelT0B4D: { pt: "Sinalizações em tempo real: clientes fora do mandato, clientes a 8 pontos do mandato, eventos de mercado de alto impacto (Fed, CPI…).", en: "Real-time flags: clients outside mandate, clients within 8 points of mandate, high-impact market events (Fed, CPI…)." },
  painelT0B5T: { pt: "The Vault — agregado", en: "The Vault — aggregate" },
  painelT0B5D: { pt: "4 KPIs do ETP agora: posições ativas, % do AUM investido, taxa de acerto em 90 dias, média de dias em posição. O CTA abre a aba completa do Vault.", en: "4 ETP KPIs right now: active positions, % of AUM invested, 90-day hit rate, average days in position. The CTA opens the full Vault tab." },
  painelT0B6T: { pt: "Clientes", en: "Clients" },
  painelT0B6D: { pt: "AUM total, número de clientes ativos, quantos estão fora do mandato.", en: "Total AUM, number of active clients, how many are outside mandate." },

  // ── Node: Mercado ────────────────────────────────────────
  mercadoLabel: { pt: "Mercado", en: "Market" },
  mercadoFase: { pt: "Leia o cenário", en: "Read the scenario" },
  mercadoImporta: { pt: "Antes de abrir um cliente ou um fundo, entenda o ambiente. Preços ao vivo, os dois índices de regime (interno e externo), o market DNA de 10 camadas e o calendário.", en: "Before opening a client or a fund, understand the environment. Live prices, the two regime indices (internal and external), the 10-layer market DNA, and the calendar." },

  mercadoT0Nome: { pt: "Visão de Mercado (ARI)", en: "Market View (ARI)" },
  mercadoT0Why: { pt: "A leitura do S&P 500 + o regime interno + o que muda a nossa postura de risco. Comece por aqui nos dias que parecem estranhos.", en: "The S&P 500 read + the internal regime + what changes our risk posture. Start here on days that feel off." },
  mercadoT0B0T: { pt: "5 cartões de cabeçalho", en: "5 header cards" },
  mercadoT0B0D: { pt: "Preço do S&P 500 + variação do dia · YTD · RSI(14) · Max DD e Sharpe · Pílula de regime (ARI ao vivo).", en: "S&P 500 price + day change · YTD · RSI(14) · Max DD and Sharpe · Regime pill (live ARI)." },
  mercadoT0B0W: { pt: "O preço sozinho engana. Preço + RSI + drawdown juntos dizem se você está comprando força ou aparando uma faca caindo. A pílula de regime condensa mais de 40 sinais em uma palavra — esse é o atalho.", en: "Price alone is deceiving. Price + RSI + drawdown together tell you whether you're buying strength or catching a falling knife. The regime pill condenses 40+ signals into one word — that's the shortcut." },
  mercadoT0B1T: { pt: "JIM — Análise de Mercado", en: "JIM — Market Analysis" },
  mercadoT0B1D: { pt: "Um parágrafo consolidando regime, S&P, VIX, Fear & Greed, amplitude e o próximo evento.", en: "One paragraph consolidating regime, S&P, VIX, Fear & Greed, breadth, and the next event." },
  mercadoT0B1W: { pt: "O JIM cruza 5 fontes não relacionadas. Quando concordam, a convicção é alta; quando divergem, costuma ser onde o alfa se esconde — e é isso que o JIM vai apontar.", en: "JIM cross-references 5 unrelated sources. When they agree, conviction is high; when they diverge, that's usually where the alpha hides — and that's what JIM will point out." },
  mercadoT0B2T: { pt: "Gráfico do S&P 500", en: "S&P 500 Chart" },
  mercadoT0B2D: { pt: "Candles com alternância 3M–5Y e sobreposição de indicadores (EMA, Bollinger, Volume, RSI, Momentum).", en: "Candles toggling 3M–5Y with overlay indicators (EMA, Bollinger, Volume, RSI, Momentum)." },
  mercadoT0B2W: { pt: "Não dá para gerir risco em um gráfico que você não consegue ver. Sobrepor as EMAs permite identificar mudanças de regime antes de a CNBC anunciar — o preço cruza a EMA antes de a narrativa alcançar.", en: "You can't manage risk on a chart you can't see. Overlaying EMAs lets you spot regime shifts before CNBC announces them — price crosses the EMA before the narrative catches up." },
  mercadoT0B3T: { pt: "Resumo do Market DNA", en: "Market DNA Summary" },
  mercadoT0B3D: { pt: "Barras de score por dimensão: Volatilidade, Sentimento, Amplitude, Macro, Posicionamento.", en: "Score bars per dimension: Volatility, Sentiment, Breadth, Macro, Positioning." },
  mercadoT0B3W: { pt: "Uma dimensão é anedota; cinco concordando é um regime. Esta miniatura é a sua conferência rápida antes de mergulhar na tela completa do Market DNA.", en: "One dimension is an anecdote; five agreeing is a regime. This thumbnail is your quick check before diving into the full Market DNA screen." },
  mercadoT0B4T: { pt: "Calendário + Notícias (barra lateral)", en: "Calendar + News (sidebar)" },
  mercadoT0B4D: { pt: "Próximos eventos de alto impacto + manchetes que movem o mercado.", en: "Upcoming high-impact events + market-moving headlines." },
  mercadoT0B4W: { pt: "Metade dos movimentos do ano acontece em 10 datas. Saber quais são as 10 — e estar posicionado ANTES, não depois — é o jogo inteiro.", en: "Half the year's moves happen on 10 dates. Knowing which 10 — and being positioned BEFORE, not after — is the whole game." },

  mercadoT1Nome: { pt: "XRI — Regime Externo", en: "XRI — External Regime" },
  mercadoT1Why: { pt: "O índice de estresse externo de 26 países. Quando ele vira antes do ARI, o choque vem de fora — costuma ser o primeiro aviso.", en: "The 26-country external stress index. When it turns before ARI, the shock is coming from outside — it's usually the first warning." },
  mercadoT1B0T: { pt: "Score + estado + confiança", en: "Score + state + confidence" },
  mercadoT1B0D: { pt: "Score 0–100, estado (MODERADO/CAUTELA/BEAR/BULL), direção (estável / deteriorando / melhorando), confiança % (quantos países concordam).", en: "Score 0–100, state (MODERATE/CAUTION/BEAR/BULL), direction (stable / deteriorating / improving), confidence % (how many countries agree)." },
  mercadoT1B0W: { pt: "Os mercados americanos não se movem no vácuo. Um choque no Japão, na China ou na Zona do Euro pode atingir o SPY 24–48h depois. O XRI é o alerta antecipado que se adianta ao noticiário doméstico.", en: "US markets don't move in a vacuum. A shock in Japan, China, or the Eurozone can hit the SPY 24–48h later. XRI is the early warning that gets ahead of domestic headlines." },
  mercadoT1B1T: { pt: "Países que puxam o índice", en: "Countries driving the index" },
  mercadoT1B1D: { pt: "Principais contribuintes para o score atual (Japão, China, Zona do Euro…) com a % de contribuição.", en: "Top contributors to the current score (Japan, China, Eurozone…) with % contribution." },
  mercadoT1B1W: { pt: "Saber DE ONDE o estresse se origina diz qual SETOR proteger. Medo puxado pelo Japão atinge semicondutores; pela China, consumo discricionário; pela Europa, luxo e bancos.", en: "Knowing WHERE the stress originates tells you which SECTOR to protect. Fear driven by Japan hits semiconductors; by China, discretionary consumer; by Europe, luxury and banks." },
  mercadoT1B2T: { pt: "Canais de transmissão", en: "Transmission channels" },
  mercadoT1B2D: { pt: "Fragilidade (estrutural) vs prior macro (lento) vs estresse de mercado (rápido) — de onde o risco vem mecanicamente.", en: "Fragility (structural) vs macro prior (slow) vs market stress (fast) — where the risk comes from mechanically." },
  mercadoT1B2W: { pt: "Fragilidade significa que o sistema vai rachar sob estresse mesmo sem estresse hoje. Rápido significa que câmbio/juros já estão quebrando. Mesmo score, manual de ação completamente diferente.", en: "Fragility means the system will crack under stress even without stress today. Fast means FX/rates are already breaking. Same score, completely different playbook." },

  mercadoT2Nome: { pt: "Market DNA", en: "Market DNA" },
  mercadoT2Why: { pt: "A leitura institucional de 10 camadas. Cada camada pontuada de 0–100. A MÉDIA é a Convicção; a DISPERSÃO é onde fica interessante.", en: "The institutional 10-layer read. Each layer scored 0–100. The AVERAGE is Conviction; the DISPERSION is where it gets interesting." },
  mercadoT2B0T: { pt: "Cabeçalho de resumo (dentro de Score por Camada)", en: "Summary header (inside Score by Layer)" },
  mercadoT2B0D: { pt: "Score de convicção + pílula de regime (CAUTIOUS/HEALTHY/…) + contadores live/partial. A fórmula aparece ao passar o mouse no cabeçalho.", en: "Conviction score + regime pill (CAUTIOUS/HEALTHY/…) + live/partial counters. The formula shows on hover over the header." },
  mercadoT2B0W: { pt: "A média é sobre o que a multidão fala. A discordância é onde o alfa se esconde. LIVE vs PARTIAL diz quanto do score é dado em tempo real vs defasado.", en: "The average is about what the crowd says. The disagreement is where the alpha hides. LIVE vs PARTIAL tells you how much of the score is real-time data vs stale." },
  mercadoT2B1T: { pt: "Radar de Inteligência", en: "Intelligence Radar" },
  mercadoT2B1D: { pt: "Polígono com os scores das 7 camadas de uma vez — você vê a forma, não só os números.", en: "Polygon with all 7 layer scores at once — you see the shape, not just the numbers." },
  mercadoT2B1W: { pt: "Os números escondem a forma. Um polígono mostra na hora se o mercado está uniformemente bom, uniformemente ruim ou desequilibrado — o caso desequilibrado costuma ser o interessante.", en: "Numbers hide the shape. A polygon instantly shows whether the market is uniformly good, uniformly bad, or unbalanced — the unbalanced case is usually the interesting one." },
  mercadoT2B2T: { pt: "Score por Camada", en: "Score by Layer" },
  mercadoT2B2D: { pt: "Barras ordenadas por score, cada uma com selo LIVE/PART (status da fonte de dados).", en: "Bars ordered by score, each with a LIVE/PART badge (data source status)." },
  mercadoT2B2W: { pt: "Se Posicionamento está 90 (comprado extremo) e Sentimento está 20 (medo extremo), alguém está blefando. Essa contradição é o trade que o mercado convencional perde.", en: "If Positioning is 90 (extreme long) and Sentiment is 20 (extreme fear), someone is bluffing. That contradiction is the trade the conventional market misses." },
  mercadoT2B3T: { pt: "Cartões por camada", en: "Per-layer cards" },
  mercadoT2B3D: { pt: "Posicionamento, Volatilidade, Opções, Liquidez, Amplitude, Sentimento, Macro — cada um com 4 indicadores (VIX, IV Rank, Curva de Juros, Spread de Crédito…).", en: "Positioning, Volatility, Options, Liquidity, Breadth, Sentiment, Macro — each with 4 indicators (VIX, IV Rank, Yield Curve, Credit Spread…)." },
  mercadoT2B3W: { pt: "Cada score é construído sobre 4 subindicadores. Auditá-los diz se o score é frágil (1 indicador dominando) ou robusto (4 concordando) — o mesmo score 60 significa coisas muito diferentes.", en: "Each score is built on 4 sub-indicators. Auditing them tells you if the score is fragile (1 indicator dominating) or robust (4 agreeing) — the same score of 60 can mean very different things." },
  mercadoT2B4T: { pt: "Painel JIM Intelligence", en: "JIM Intelligence Panel" },
  mercadoT2B4D: { pt: "Onde as camadas se CONTRADIZEM — essas discordâncias escondem o sinal de verdade.", en: "Where the layers CONTRADICT each other — these disagreements hide the true signal." },
  mercadoT2B4W: { pt: "Qualquer painel mostra médias. O JIM destaca especificamente as CONTRADIÇÕES — porque essa é a informação que nenhum número isolado revelaria.", en: "Any dashboard shows averages. JIM specifically highlights the CONTRADICTIONS — because that's the information no single number would reveal." },

  mercadoT3Nome: { pt: "Snowflake", en: "Snowflake" },
  mercadoT3Why: { pt: "Visão multidimensional de um único ativo (valor, futuro, passado, saúde, dividendo).", en: "Multidimensional view of a single asset (value, future, past, health, dividend)." },
  mercadoT3B0T: { pt: "Snowflake por ativo", en: "Snowflake per asset" },
  mercadoT3B0D: { pt: "Radar de 5 pontos por empresa com a leitura qualitativa de cada eixo.", en: "5-point radar per company with a qualitative read of each axis." },
  mercadoT3B0W: { pt: "Empresas não são só o seu P/L. Uma visão de 5 dimensões força você a ver saúde + passado + dividendo + valor + futuro juntos — um eixo fraco é um alerta que nenhum índice isolado capta.", en: "Companies aren't just their P/E. A 5-dimension view forces you to see health + past + dividend + value + future together — one weak axis is a warning no single index captures." },

  mercadoT4Nome: { pt: "Calendário", en: "Calendar" },
  mercadoT4Why: { pt: "Só eventos econômicos de alto impacto (Fed, CPI, NFP, BCE…). Ignora o ruído.", en: "Only high-impact economic events (Fed, CPI, NFP, ECB…). Ignores the noise." },
  mercadoT4B0T: { pt: "Feed de eventos", en: "Event feed" },
  mercadoT4B0D: { pt: "Data, hora, evento, previsão, anterior. Filtre por país e impacto.", en: "Date, time, event, forecast, previous. Filter by country and impact." },
  mercadoT4B0W: { pt: "Fed, CPI e NFP explicam mais volatilidade de curto prazo do que qualquer temporada de resultados. Você quer estar posicionado ANTES de eles saírem — não correndo atrás depois.", en: "Fed, CPI, and NFP explain more short-term volatility than any earnings season. You want to be positioned BEFORE they drop — not chasing after." },

  mercadoT5Nome: { pt: "Cotações", en: "Quotes" },
  mercadoT5Why: { pt: "Preços ao vivo de todas as classes em um único painel.", en: "Live prices for every asset class in a single panel." },
  mercadoT5B0T: { pt: "Abas por classe", en: "Tabs by class" },
  mercadoT5B0D: { pt: "Favoritos + ações, índices, ETFs, setores, commodities, cripto, forex.", en: "Favorites + stocks, indices, ETFs, sectors, commodities, crypto, forex." },
  mercadoT5B0W: { pt: "Contexto entre classes: se títulos e ouro sobem enquanto as ações caem, é risk-off. Só as abas de classes lado a lado deixam você ver isso num relance.", en: "Cross-class context: if bonds and gold rise while stocks fall, that's risk-off. Only side-by-side class tabs let you see that at a glance." },
  mercadoT5B1T: { pt: "Tabela de cotações", en: "Quotes table" },
  mercadoT5B1D: { pt: "Último preço, Dia / 1M / YTD / 1A e o Sharpe de 1 ano por ativo. Clicar abre o gráfico.", en: "Last price, Day / 1M / YTD / 1Y and 1-year Sharpe per asset. Click to open the chart." },
  mercadoT5B1W: { pt: "O Sharpe de 1 ano ao lado do preço é o seu filtro rápido para 'isto está barato por sorte ou por processo'. Preço alto + Sharpe baixo = bilhete de loteria caro.", en: "1-year Sharpe next to price is your quick filter for 'is this cheap by luck or by process.' High price + low Sharpe = expensive lottery ticket." },

  mercadoT6Nome: { pt: "Screener", en: "Screener" },
  mercadoT6Why: { pt: "Filtre o universo com seus próprios critérios (momentum, valuation, setor…). Seguro para o cliente — os filtros aqui NÃO são os que o ETP usa internamente.", en: "Filter the universe with your own criteria (momentum, valuation, sector…). Client-safe — the filters here are NOT what the ETP uses internally." },
  mercadoT6B0T: { pt: "Multifiltro", en: "Multi-filter" },
  mercadoT6B0D: { pt: "Combine market cap, setor, momentum, valuation. Resultados em uma tabela ordenável.", en: "Combine market cap, sector, momentum, valuation. Results in a sortable table." },
  mercadoT6B0W: { pt: "Todo gestor precisa de uma watchlist pessoal. O Screener é o seu microscópio. O motor do ETP permanece proprietário — este é seu para explorar, não para fazer engenharia reversa do nosso.", en: "Every manager needs a personal watchlist. The Screener is your microscope. The ETP engine stays proprietary — this one is yours to explore, not to reverse-engineer ours." },

  // ── Node: Intelligence ───────────────────────────────────
  intelligenceLabel: { pt: "Inteligência", en: "Intelligence" },
  intelligenceFase: { pt: "Vantagem institucional", en: "Institutional edge" },
  intelligenceImporta: { pt: "O diferencial frente a uma corretora de varejo: o que os grandes players estão fazendo (SEC 13F, Form 4 de insiders, COT da CFTC), o sentimento do varejo (StockTwits) e os documentos brutos — tudo em um só lugar.", en: "The edge over a retail brokerage: what the big players are doing (SEC 13F, insider Form 4, CFTC COT), retail sentiment (StockTwits), and raw filings — all in one place." },

  intelT0Nome: { pt: "Social Radar", en: "Social Radar" },
  intelT0Why: { pt: "O sentimento declarado do varejo, ao vivo, com o alcance de quem está falando.", en: "Live, stated retail sentiment, with the reach of who's speaking." },
  intelT0B0T: { pt: "Feed de posts (StockTwits)", en: "Post feed (StockTwits)" },
  intelT0B0D: { pt: "Autor + selo de verificado, faixa de alcance, sentimento (Bullish/Bearish/Neutral), cashtags.", en: "Author + verified badge, reach tier, sentiment (Bullish/Bearish/Neutral), cashtags." },
  intelT0B0W: { pt: "O varejo acerta na virada e erra na cauda. Volume de um nome explodindo no StockTwits com fundamentos fracos = setup de short-squeeze contra o qual você pode operar.", en: "Retail gets the turn right and the tail wrong. A name exploding in volume on StockTwits with weak fundamentals = a short-squeeze setup you can trade against." },
  intelT0B1T: { pt: "Painel de inteligência", en: "Intelligence panel" },
  intelT0B1D: { pt: "Clique num post: ativos mencionados + a nossa leitura da confiabilidade do sentimento.", en: "Click a post: mentioned assets + our read on the sentiment's reliability." },
  intelT0B1W: { pt: "Sentimento é direção; alcance é amplitude. Alto alcance + sentimento errado = a oportunidade de contra-trade pela qual as mesas institucionais vivem.", en: "Sentiment is direction; reach is amplitude. High reach + wrong sentiment = the counter-trade opportunity institutional desks live for." },

  intelT1Nome: { pt: "News Broadcast", en: "News Broadcast" },
  intelT1Why: { pt: "Feed financeiro consolidado, filtrável por fonte e impacto.", en: "Consolidated financial feed, filterable by source and impact." },
  intelT1B0T: { pt: "Grade de manchetes", en: "Headline grid" },
  intelT1B0D: { pt: "Fonte, etiqueta de impacto (Market Moving / High / Normal), horário, título.", en: "Source, impact tag (Market Moving / High / Normal), time, title." },
  intelT1B0W: { pt: "Você não reage ao que não viu. Filtrar por 'Market Moving' corta 95% do ruído para você gastar atenção só onde importa.", en: "You can't react to what you haven't seen. Filtering by 'Market Moving' cuts 95% of the noise so you spend attention only where it matters." },

  intelT2Nome: { pt: "Insider Orders", en: "Insider Orders" },
  intelT2Why: { pt: "SEC Form 4 — quando um diretor ou executivo compra/vende as próprias ações.", en: "SEC Form 4 — when a director or executive buys/sells their own stock." },
  intelT2B0T: { pt: "Tabela de filings", en: "Filings table" },
  intelT2B0D: { pt: "Data, nome do insider + cargo, empresa, ticker, lado (compra/venda), quantidade de ações, valor em $. Clique para o filing original.", en: "Date, insider name + role, company, ticker, side (buy/sell), share count, $ value. Click through to the original filing." },
  intelT2B0W: { pt: "Executivos conhecem o próprio negócio melhor que qualquer analista. Aglomerados de COMPRAS de insiders historicamente superaram o SPX em 6–8% a.a. As vendas de insiders são mais ruidosas (remuneração em ações, diversificação) — o sinal de COMPRA é mais forte.", en: "Executives know their own business better than any analyst. Clusters of insider BUYS have historically outperformed the SPX by 6–8% a year. Insider sells are noisier (stock comp, diversification) — the BUY signal is the stronger one." },

  intelT3Nome: { pt: "Posições 13F", en: "13F Holdings" },
  intelT3Why: { pt: "SEC Form 13F — o que os maiores hedge funds detêm a cada trimestre.", en: "SEC Form 13F — what the biggest hedge funds hold each quarter." },
  intelT3B0T: { pt: "4 KPIs", en: "4 KPIs" },
  intelT3B0D: { pt: "AUM total do 13F, número de posições, data do filing, período.", en: "Total 13F AUM, number of positions, filing date, period." },
  intelT3B0W: { pt: "O TAMANHO de um fundo diz se as operações dele são informativas ou só marolas. Um fundo de US$ 100 bi adicionando 1% de uma small-cap é uma aposta de convicção real.", en: "A fund's SIZE tells you whether its moves are informative or just noise. A $100B fund adding 1% of a small-cap is a genuine conviction bet." },
  intelT3B1T: { pt: "Top 10 + Todas as posições", en: "Top 10 + All positions" },
  intelT3B1D: { pt: "Emissor, classe, CUSIP, valor em $, quantidade de ações, put/call.", en: "Issuer, class, CUSIP, $ value, share count, put/call." },
  intelT3B1W: { pt: "Quando a Bridgewater ou a Berkshire adiciona uma posição, tiveram de justificá-la internamente. O portfólio deles é um memorando vazado da convicção — legalmente livre para ler, e a maioria dos gestores não lê.", en: "When Bridgewater or Berkshire adds a position, they had to justify it internally. Their portfolio is a leaked memo of conviction — legally free to read, and most managers don't." },

  intelT4Nome: { pt: "COT Intelligence", en: "COT Intelligence" },
  intelT4Why: { pt: "CFTC Commitments of Traders — o posicionamento em futuros dos grandes players, normalizado (COT Index 0–100).", en: "CFTC Commitments of Traders — big players' futures positioning, normalized (COT Index 0–100)." },
  intelT4B0T: { pt: "Guia + sinalizações de extremo", en: "Guide + extreme flags" },
  intelT4B0D: { pt: "Os 3 grupos (Commercials · Large Specs · Nonreportable) e quais mercados estão em extremo.", en: "The 3 groups (Commercials · Large Specs · Nonreportable) and which markets are at an extreme." },
  intelT4B0W: { pt: "Large Speculators em compra extrema é um sinal clássico de reversão. Commercials em venda extrema significa produtores fazendo hedge pesado — a mesma reversão, espelhada. Quando ambos apontam na mesma direção, a reversão é iminente.", en: "Large Speculators at extreme long is a classic reversal signal. Commercials at extreme short means producers hedging heavily — the same reversal, mirrored. When both point the same way, the reversal is imminent." },
  intelT4B1T: { pt: "Cartões por mercado", en: "Per-market cards" },
  intelT4B1D: { pt: "COT Index 0–100, variação semanal, posição líquida por grupo (% do OI), Open Interest, alerta contrário quando em extremo.", en: "COT Index 0–100, weekly change, net position per group (% of OI), Open Interest, contrarian alert when at an extreme." },
  intelT4B1W: { pt: "O mesmo princípio em todos os principais futuros. Quando 3 ou mais mercados atingem o extremo ao mesmo tempo, é um aviso sistêmico — não uma anomalia de um único mercado.", en: "Same principle across every major futures market. When 3 or more markets hit the extreme at once, it's a systemic warning — not a single-market anomaly." },

  intelT5Nome: { pt: "COT Data Explorer", en: "COT Data Explorer" },
  intelT5Why: { pt: "Dados brutos da CFTC — direto ao número, sem interpretação.", en: "Raw CFTC data — straight to the number, no interpretation." },
  intelT5B0T: { pt: "Tabela bruta", en: "Raw table" },
  intelT5B0D: { pt: "Data, mercado, Spec Net, Comm Net (e % do OI), longs/shorts por grupo, Open Interest, janela de 4–52 semanas.", en: "Date, market, Spec Net, Comm Net (and % of OI), longs/shorts per group, Open Interest, 4–52 week window." },
  intelT5B0W: { pt: "O COT Index normalizado esconde saltos no open interest bruto. O Explorer permite garimpar a exceção que o score suavizado apaga.", en: "The normalized COT Index hides jumps in raw open interest. The Explorer lets you dig up the exception the smoothed score erases." },

  intelT6Nome: { pt: "Filings Search", en: "Filings Search" },
  intelT6Why: { pt: "Busca de texto completo no SEC EDGAR em 10-K, 10-Q, 8-K desde 2001.", en: "Full-text search on SEC EDGAR across 10-K, 10-Q, 8-K since 2001." },
  intelT6B0T: { pt: "Busca por palavra-chave", en: "Keyword search" },
  intelT6B0D: { pt: "Digite uma palavra-chave, filtre por tipo de formulário / data / ticker. Os resultados linkam para o EDGAR.", en: "Type a keyword, filter by form type / date / ticker. Results link out to EDGAR." },
  intelT6B0W: { pt: "As empresas enterram a verdade no corpo do 10-K, não no resumo. Buscar 'material weakness' ou 'going concern' revela alertas que o release de resultados não mostra.", en: "Companies bury the truth in the body of the 10-K, not the summary. Searching 'material weakness' or 'going concern' surfaces warnings the earnings release won't show." },

  // ── Node: Fundos ─────────────────────────────────────────
  fundosLabel: { pt: "Fundos", en: "Funds" },
  fundosFase: { pt: "O produto", en: "The product" },
  fundosImporta: { pt: "O coração da venda — o perfil completo de cada ETP. 8 abas. O The Vault (padrão) é a estrela: transparência sem entregar o modelo.", en: "The heart of the pitch — the full profile of each ETP. 8 tabs. The Vault (default) is the star: transparency without giving away the model." },

  fundosT0Nome: { pt: "Fundo · Visão Geral", en: "Fund · Overview" },
  fundosT0Why: { pt: "Perfil do produto: o que é, o que entrega, selos de governança.", en: "Product profile: what it is, what it delivers, governance badges." },
  fundosT0B0T: { pt: "Cabeçalho + Destaques", en: "Header + Highlights" },
  fundosT0B0D: { pt: "Ticker, nome, estratégia, status, ISIN + 4 estatísticas de destaque (CAGR, Max DD, Sortino…) com comparação vs S&P e Nasdaq.", en: "Ticker, name, strategy, status, ISIN + 4 highlight stats (CAGR, Max DD, Sortino…) compared vs S&P and Nasdaq." },
  fundosT0B1T: { pt: "Dados do produto + Selos", en: "Product data + Badges" },
  fundosT0B1D: { pt: "Perfil chave-valor e selos de governança (a Harpian não faz custódia nem execução — quem faz é a Lynk/BNYM).", en: "Key-value profile and governance badges (Harpian does not custody or execute — that's Lynk/BNYM)." },

  fundosT1Nome: { pt: "The Vault (aba padrão)", en: "The Vault (default tab)" },
  fundosT1Why: { pt: "Protocolo de Opacidade Verificada. O cliente vê o suficiente para confiar — não o suficiente para replicar. É isso que protege a vantagem enquanto prova o skin-in-the-game.", en: "Verified Opacity Protocol. The client sees enough to trust — not enough to replicate. That's what protects the edge while proving skin-in-the-game." },
  fundosT1B0T: { pt: "The Vault (agregado)", en: "The Vault (aggregate)" },
  fundosT1B0D: { pt: "5 KPIs: comprados ativos, hedges, % do AUM investido, beta do portfólio, tempo médio em posição, taxa de acerto em 90 dias. NUNCA mostra os tickers das posições ativas.", en: "5 KPIs: active longs, hedges, % of AUM invested, portfolio beta, average time in position, 90-day hit rate. NEVER shows the tickers of active positions." },
  fundosT1B1T: { pt: "The Showcase (3 posições encerradas)", en: "The Showcase (3 closed positions)" },
  fundosT1B1D: { pt: "3 trades reais que o ETP encerrou, amostrados de posições fechadas há 28 dias ou mais. Rotaciona toda segunda-feira às 06:00 (horário de Brasília). Sem arquivo.", en: "3 real trades the ETP closed, sampled from positions closed 28+ days ago. Rotates every Monday at 06:00 (Brasília time). No archive." },
  fundosT1B2T: { pt: "Momentum Weather", en: "Momentum Weather" },
  fundosT1B2D: { pt: "Estado do regime + % de defesa + dias de sequência + última virada de regime (de/para + magnitude). A pilha de gatilhos permanece proprietária.", en: "Regime state + % in defense + streak days + last regime flip (from/to + magnitude). The trigger stack stays proprietary." },
  fundosT1B3T: { pt: "Do Not Touch", en: "Do Not Touch" },
  fundosT1B3D: { pt: "Os 5 piores momentums do SPX500 + 2 setores frágeis que estamos evitando ativamente esta semana. Publicar o que EVITAMOS é mais seguro do que o que compramos.", en: "The 5 worst SPX500 momentums + 2 fragile sectors we're actively avoiding this week. Publishing what we AVOID is safer than what we buy." },

  fundosT2Nome: { pt: "Fundo · Desempenho", en: "Fund · Performance" },
  fundosT2Why: { pt: "A prova dos resultados, sempre comparada a benchmark. Layout: gráfico 2/3 · tabelas 1/3.", en: "The proof of results, always compared to benchmark. Layout: chart 2/3 · tables 1/3." },
  fundosT2B0T: { pt: "US$ 10 mil ao longo do tempo (esquerda, 2/3)", en: "$10k over time (left, 2/3)" },
  fundosT2B0D: { pt: "Crescimento real do portfólio vs S&P vs CORE22+, com retorno e MaxDD por período.", en: "Real portfolio growth vs S&P vs CORE22+, with return and MaxDD per period." },
  fundosT2B1T: { pt: "Bruto vs líquido vs S&P (direita, 1/3)", en: "Gross vs net vs S&P (right, 1/3)" },
  fundosT2B1D: { pt: "Tabela métrica a métrica.", en: "Metric-by-metric table." },
  fundosT2B2T: { pt: "CORE22+ vs S&P vs Nasdaq (direita)", en: "CORE22+ vs S&P vs Nasdaq (right)" },
  fundosT2B2D: { pt: "CAGR, Max DD, Ulcer, Sharpe, Sortino, anos negativos — os três benchmarks lado a lado.", en: "CAGR, Max DD, Ulcer, Sharpe, Sortino, negative years — the three benchmarks side by side." },

  fundosT3Nome: { pt: "Fundo · Risco e Jornada", en: "Fund · Risk and Journey" },
  fundosT3Why: { pt: "A história da preservação de capital. Layout: gráfico 2/3 · tabelas 1/3.", en: "The story of capital preservation. Layout: chart 2/3 · tables 1/3." },
  fundosT3B0T: { pt: "Gráfico da jornada (esquerda, 2/3)", en: "Journey chart (left, 2/3)" },
  fundosT3B0D: { pt: "Retorno acumulado vs S&P vs Dow vs Treasuries. A linha do CORE22+ fica ÂMBAR nos períodos em que a Defesa esteve armada (2008, 2020, 2022, etc.), com faixas sutis ao fundo. Passar o mouse mostra o nome da crise.", en: "Cumulative return vs S&P vs Dow vs Treasuries. The CORE22+ line turns AMBER during periods when Defense was armed (2008, 2020, 2022, etc.), with subtle background bands. Hover shows the crisis name." },
  fundosT3B1T: { pt: "Dimensão 1 · Risco da jornada (direita)", en: "Dimension 1 · Journey risk (right)" },
  fundosT3B1D: { pt: "Quedas ≥5%: CORE22+ vs S&P lado a lado.", en: "Drawdowns ≥5%: CORE22+ vs S&P side by side." },
  fundosT3B2T: { pt: "Dimensão 2 · Risco do ponto de entrada (direita)", en: "Dimension 2 · Entry-point risk (right)" },
  fundosT3B2D: { pt: "Comprando no topo do ano: % de casos positivos e o pior caso por horizonte.", en: "Buying at the year's top: % of positive outcomes and the worst case per horizon." },

  fundosT4Nome: { pt: "Fundo · Defesa em Crises", en: "Fund · Crisis Defense" },
  fundosT4Why: { pt: "Por crise: drawdown e tempo de recuperação, S&P vs CORE, mais a comparação com a Nasdaq.", en: "Per crisis: drawdown and recovery time, S&P vs CORE, plus the comparison with Nasdaq." },
  fundosT4B0T: { pt: "Tabela de defesa em crises", en: "Crisis defense table" },
  fundosT4B0D: { pt: "Dot-com, GFC, COVID, bear de 2022, etc. — queda e recuperação do S&P vs queda e recuperação do CORE22+.", en: "Dot-com, GFC, COVID, 2022 bear, etc. — S&P drawdown and recovery vs CORE22+ drawdown and recovery." },

  fundosT5Nome: { pt: "Composição · foto de 5 semanas", en: "Composition · 5-week snapshot" },
  fundosT5Why: { pt: "O portfólio como estava há 35 dias. Transparência total (tickers + pesos + defesa), mas com embargo móvel — o tempo em posição é de ~34 dias, então a maioria das posições aqui já rodou.", en: "The portfolio as it stood 35 days ago. Full transparency (tickers + weights + defense), but with a rolling embargo — time in position is ~34 days, so most positions here have already rotated." },
  fundosT5B0T: { pt: "Aviso de defasagem", en: "Lag notice" },
  fundosT5B0D: { pt: "Aviso explícito: 'composição não é ao vivo'. Mostra a data exata da foto e o estado do regime naquele momento.", en: "Explicit notice: 'composition is not live'. Shows the exact snapshot date and the regime state at that moment." },
  fundosT5B1T: { pt: "3 perfis", en: "3 profiles" },
  fundosT5B1D: { pt: "Conservador / Balanceado / Avançado: divisão entre ações e ETFs, número de posições, principais posições com % de peso.", en: "Conservative / Balanced / Advanced: split between stocks and ETFs, position count, top holdings with % weight." },
  fundosT5B2T: { pt: "Camada de defesa (como estava)", en: "Defense layer (as it stood)" },
  fundosT5B2D: { pt: "Os ativos defensivos e os pesos ativos naquela data da foto. O gatilho continua proprietário.", en: "The defensive assets and active weights at that snapshot date. The trigger stays proprietary." },

  fundosT6Nome: { pt: "Fundo · Economia e Arquitetura", en: "Fund · Economics and Architecture" },
  fundosT6Why: { pt: "O perfil comercial e operacional — taxas, custódia, liquidação, contatos.", en: "The commercial and operational profile — fees, custody, settlement, contacts." },
  fundosT6B0T: { pt: "Economia do ETP", en: "ETP Economics" },
  fundosT6B0D: { pt: "Taxa de gestão, taxa de performance, mínimo, moeda.", en: "Management fee, performance fee, minimum, currency." },
  fundosT6B1T: { pt: "Arquitetura institucional", en: "Institutional architecture" },
  fundosT6B1D: { pt: "Custódia (BNY Mellon), liquidação (Euroclear/Clearstream), emissor, agente de cálculo.", en: "Custody (BNY Mellon), settlement (Euroclear/Clearstream), issuer, calculation agent." },
  fundosT6B2T: { pt: "Arquitetura do motor", en: "Engine architecture" },
  fundosT6B2D: { pt: "Qual variante do motor alimenta este fundo (redação segura para o cliente).", en: "Which engine variant feeds this fund (client-safe wording)." },
  fundosT6B3T: { pt: "Contatos", en: "Contacts" },
  fundosT6B3D: { pt: "Contrapartes operacionais para onboarding e subscrição.", en: "Operational counterparties for onboarding and subscription." },

  fundosT7Nome: { pt: "Fundo · Como Comprar", en: "Fund · How to Buy" },
  fundosT7Why: { pt: "Guia de 5 passos, da análise ao envio via Lynk.", en: "5-step guide, from analysis to submission via Lynk." },
  fundosT7B0T: { pt: "Fluxo de 5 passos", en: "5-step flow" },
  fundosT7B0D: { pt: "Instruções por passo para o MFO / mesa da corretora.", en: "Step-by-step instructions for the MFO / brokerage desk." },
  fundosT7B1T: { pt: "CTA de enviar ordem", en: "Send-order CTA" },
  fundosT7B1D: { pt: "Abre a tela de Ordens pré-carregada para este fundo.", en: "Opens the Orders screen pre-loaded for this fund." },

  fundosT8Nome: { pt: "Enviar ordem (Lynk)", en: "Send Order (Lynk)" },
  fundosT8Why: { pt: "Fecha o ciclo: a subscrição/resgate vai para a Lynk.", en: "Closes the loop: the subscription/redemption goes to Lynk." },
  fundosT8B0T: { pt: "Produto + Ordem", en: "Product + Order" },
  fundosT8B0D: { pt: "Perfil (ISIN, NAV de ontem, custódia BNYM, liquidação Euroclear/Clearstream), lado, cliente, valor, observações.", en: "Profile (ISIN, yesterday's NAV, BNYM custody, Euroclear/Clearstream settlement), side, client, amount, notes." },
  fundosT8B1T: { pt: "Validação", en: "Validation" },
  fundosT8B1D: { pt: "Mínimo de US$ 50 mil, múltiplos de US$ 5 mil, diálogo de confirmação.", en: "Minimum of $50k, multiples of $5k, confirmation dialog." },
  fundosT8B2T: { pt: "Custódia × corretora", en: "Custody × brokerage" },
  fundosT8B2D: { pt: "Caixa no BNY Mellon (NY); contas via Interactive Brokers (IBKR).", en: "Cash at BNY Mellon (NY); accounts via Interactive Brokers (IBKR)." },
  fundosT8B3T: { pt: "Execução manual", en: "Manual execution" },
  fundosT8B3D: { pt: "Toda ordem diária é executada manualmente pela equipe após revisão no cockpit. O JIM interpreta e apoia — nenhuma ordem é automática.", en: "Every daily order is executed manually by the team after review in the cockpit. JIM interprets and supports — no order is automatic." },

  // ── Node: Clientes ───────────────────────────────────────
  clientesLabel: { pt: "Clientes", en: "Clients" },
  clientesFase: { pt: "As pessoas", en: "The people" },
  clientesImporta: { pt: "A base de clientes do MFO: quem são, quanto têm, o que carregam, quem está fora do mandato. Do CSV de onboarding à carteira detalhada e aos alertas.", en: "The MFO's client base: who they are, how much they hold, what they carry, who's outside mandate. From onboarding CSV to detailed portfolio and alerts." },

  clientesT0Nome: { pt: "Lista de clientes", en: "Client list" },
  clientesT0Why: { pt: "Visão de portfólio de todo o escritório em uma tela.", en: "A portfolio view of the whole office on one screen." },
  clientesT0B0T: { pt: "4 KPIs", en: "4 KPIs" },
  clientesT0B0D: { pt: "AUM total, número de clientes, alocação média na Harpian, quantos estão fora do mandato.", en: "Total AUM, number of clients, average Harpian allocation, how many are outside mandate." },
  clientesT0B1T: { pt: "Tabela de clientes", en: "Client table" },
  clientesT0B1D: { pt: "Nome, tipo, perfil, AUM, ganho %, Risk Number, alinhamento (dentro / acima do mandato).", en: "Name, type, profile, AUM, gain %, Risk Number, alignment (within / above mandate)." },
  clientesT0B2T: { pt: "Adicionar cliente (canto superior direito)", en: "Add client (top-right corner)" },
  clientesT0B2D: { pt: "Faça o onboarding de um novo cliente com o questionário de perfil.", en: "Onboard a new client with the profile questionnaire." },

  clientesT1Nome: { pt: "Carteira do cliente", en: "Client portfolio" },
  clientesT1Why: { pt: "O detalhe de um cliente: o que carrega, o gap de risco e um simulador de migração.", en: "A single client's detail: what they hold, the risk gap, and a migration simulator." },
  clientesT1B0T: { pt: "O que carrega hoje", en: "What they hold today" },
  clientesT1B0D: { pt: "Barras de alocação por classe de ativo.", en: "Allocation bars by asset class." },
  clientesT1B1T: { pt: "Gap de risco", en: "Risk gap" },
  clientesT1B1D: { pt: "Risk Number vs mandato + slider 'migrar % para o HPC22'.", en: "Risk Number vs mandate + a 'migrate % to HPC22' slider." },
  clientesT1B2T: { pt: "Carteiras por conta", en: "Portfolios by account" },
  clientesT1B2D: { pt: "Cartões por carteira (corretora/conta, valor, número de posições).", en: "Cards per portfolio (broker/account, value, number of positions)." },

  clientesT2Nome: { pt: "Importar / conectar", en: "Import / connect" },
  clientesT2Why: { pt: "Traga uma carteira externa para o terminal.", en: "Bring an external portfolio into the terminal." },
  clientesT2B0T: { pt: "Upload de CSV + prévia", en: "CSV upload + preview" },
  clientesT2B0D: { pt: "Arraste uma planilha (ativo, quantidade, preço médio); revise; aplique ao cliente.", en: "Drag a spreadsheet (asset, quantity, average price); review; apply to the client." },

  clientesT3Nome: { pt: "Alertas", en: "Alerts" },
  clientesT3Why: { pt: "O que exige ação hoje, sem vasculhar cliente por cliente.", en: "What needs action today, without digging through client by client." },
  clientesT3B0T: { pt: "Feed de alertas", en: "Alert feed" },
  clientesT3B0D: { pt: "Nível (crítico / atenção / informativo), o alerta e quando. Mistura desvios de risco de clientes + eventos de mercado (Fed, CPI…).", en: "Level (critical / warning / informational), the alert, and when. Mixes client risk deviations + market events (Fed, CPI…)." },

  // ── Node: Risco ──────────────────────────────────────────
  riscoLabel: { pt: "Risco", en: "Risk" },
  riscoFase: { pt: "Suitability", en: "Suitability" },
  riscoImporta: { pt: "Compliance transformado em argumento de venda. Produto · Mandato · Tolerância · Carteira, todos na MESMA régua de 0-100. Mostra ao cliente se ele está (ou não) dentro do que foi combinado.", en: "Compliance turned into a sales argument. Product · Mandate · Tolerance · Portfolio, all on the SAME 0-100 ruler. Shows the client whether they're (or aren't) within what was agreed." },

  riscoT0Nome: { pt: "Comparação · 4 níveis", en: "Comparison · 4 levels" },
  riscoT0Why: { pt: "4 riscos lado a lado. Pontos de referência: o S&P 500 está em ≈72, o HPC22 em ≈38, o HPC11 em ≈34 — ambos bem abaixo do mercado.", en: "4 risk levels side by side. Reference points: the S&P 500 sits at ≈72, HPC22 at ≈38, HPC11 at ≈34 — both well below the market." },
  riscoT0B0T: { pt: "4 cartões de nível", en: "4 level cards" },
  riscoT0B0D: { pt: "Risco do produto · Tolerância do cliente · Teto do mandato · Risco da carteira.", en: "Product risk · Client tolerance · Mandate ceiling · Portfolio risk." },
  riscoT0B0W: { pt: "A palavra 'risco' não significa nada sem uma escala. Quando você mostra o S&P em 72, o HPC22 em 38 e o mandato do cliente em 40 — a conversa acaba, a imagem vence.", en: "The word 'risk' means nothing without a scale. When you show the S&P at 72, HPC22 at 38, and the client's mandate at 40 — the conversation ends, the picture wins." },
  riscoT0B1T: { pt: "Régua do cliente", en: "Client ruler" },
  riscoT0B1D: { pt: "Barra verde→vermelho com 4 marcadores + simulador de migração para o HPC22.", en: "Green→red bar with 4 markers + a migration simulator into HPC22." },
  riscoT0B1W: { pt: "Uma régua visual ganha de um parágrafo de jargão por 10 a 1. Clientes institucionais querem uma imagem que caiba em um slide — esta É esse slide.", en: "A visual ruler beats a paragraph of jargon 10 to 1. Institutional clients want an image that fits on a slide — this IS that slide." },
  riscoT0B2T: { pt: "Todos os clientes na régua", en: "All clients on the ruler" },
  riscoT0B2D: { pt: "Tabela comparativa (carteira vs mandato por cliente) + selo mostrando quantos estão fora.", en: "Comparison table (portfolio vs mandate per client) + a badge showing how many are outside." },
  riscoT0B2W: { pt: "Visão de portfólio: quem está desviando acima do mandato, quem está alinhado. Compliance e vendas em uma tela — o alerta de compliance vira o argumento de retenção ('vamos ajustar isso').", en: "Portfolio view: who's deviating above mandate, who's aligned. Compliance and sales in one screen — the compliance alert becomes the retention argument ('let's fix this')." },

  // ── Node: Configurações (Ajustes) ────────────────────────
  ajustesLabel: { pt: "Configurações", en: "Settings" },
  ajustesFase: { pt: "Apoio", en: "Support" },
  ajustesImporta: { pt: "Operações + marca: conexões, API para o seu sistema de gestão, white-label para o terminal vestir a identidade do seu escritório.", en: "Operations + brand: connections, an API for your management system, white-label so the terminal wears your office's identity." },

  ajustesT0Nome: { pt: "Integrações", en: "Integrations" },
  ajustesT0Why: { pt: "Status ao vivo de cada fonte de dados e provedor (custódia, dados de mercado, Lynk).", en: "Live status of every data source and provider (custody, market data, Lynk)." },
  ajustesT0B0T: { pt: "Provedores", en: "Providers" },
  ajustesT0B0D: { pt: "Cada fonte é de fato consultada quando a tela abre — o status é medido, não declarado.", en: "Each source is actually queried when the screen opens — status is measured, not declared." },

  ajustesT1Nome: { pt: "API & Integração", en: "API & Integration" },
  ajustesT1Why: { pt: "Para a equipe técnica plugar os dados do Terminal no sistema de gestão do MFO.", en: "For the tech team to plug the Terminal's data into the MFO's management system." },
  ajustesT1B0T: { pt: "Chaves e endpoints", en: "Keys and endpoints" },
  ajustesT1B0D: { pt: "Endpoints REST, modelo de autenticação, docs de integração (fase 2).", en: "REST endpoints, authentication model, integration docs (phase 2)." },

  ajustesT2Nome: { pt: "Marca (white-label)", en: "Brand (white-label)" },
  ajustesT2Why: { pt: "O terminal veste a identidade do seu escritório nos relatórios ao cliente final.", en: "The terminal wears your office's identity in end-client reports." },
  ajustesT2B0T: { pt: "Kit de marca", en: "Brand kit" },
  ajustesT2B0D: { pt: "Logo, cor primária, cor de destaque, nome exibido ao cliente final.", en: "Logo, primary color, accent color, name shown to the end client." },

  ajustesT3Nome: { pt: "Configurações", en: "Settings" },
  ajustesT3Why: { pt: "Preferências gerais e exibição.", en: "General and display preferences." },
  ajustesT3B0T: { pt: "Preferências", en: "Preferences" },
  ajustesT3B0D: { pt: "Tema (padrão / claro / escuro) e configurações de exibição.", en: "Theme (default / light / dark) and display settings." },
} satisfies Record<string, TDict>;

type TKey = keyof typeof TR;
type TFn = (k: TKey) => string;

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

function makeQuickStart(t: TFn): QuickStep[] {
  return [
    { n: 1, title: t("qs1Title"), blurb: t("qs1Blurb"), go: "painel", icon: "ti-sun" },
    { n: 2, title: t("qs2Title"), blurb: t("qs2Blurb"), go: "painel", icon: "ti-checkbox" },
    { n: 3, title: t("qs3Title"), blurb: t("qs3Blurb"), go: "fundo", param: "HPC22", icon: "ti-shield-lock" },
    { n: 4, title: t("qs4Title"), blurb: t("qs4Blurb"), go: "risco", icon: "ti-scale" },
    { n: 5, title: t("qs5Title"), blurb: t("qs5Blurb"), go: "painel", icon: "ti-sparkles" },
  ];
}

function makeNodes(t: TFn): Node[] {
  return [
    {
      key: "painel", label: t("painelLabel"), icon: "ti-home", fase: t("painelFase"), cor: "var(--gold)", startHere: true,
      importa: t("painelImporta"),
      telas: [
        {
          nome: t("painelT0Nome"), go: "painel",
          why: t("painelT0Why"),
          boxes: [
            { t: t("painelT0B0T"), d: t("painelT0B0D") },
            { t: t("painelT0B1T"), d: t("painelT0B1D") },
            { t: t("painelT0B2T"), d: t("painelT0B2D") },
            { t: t("painelT0B3T"), d: t("painelT0B3D") },
            { t: t("painelT0B4T"), d: t("painelT0B4D") },
            { t: t("painelT0B5T"), d: t("painelT0B5D") },
            { t: t("painelT0B6T"), d: t("painelT0B6D") },
          ],
        },
      ],
    },
    {
      key: "mercado", label: t("mercadoLabel"), icon: "ti-chart-candle", fase: t("mercadoFase"), cor: "var(--blue)", startHere: true,
      importa: t("mercadoImporta"),
      telas: [
        {
          nome: t("mercadoT0Nome"), go: "regime",
          why: t("mercadoT0Why"),
          boxes: [
            { t: t("mercadoT0B0T"), d: t("mercadoT0B0D"), w: t("mercadoT0B0W") },
            { t: t("mercadoT0B1T"), d: t("mercadoT0B1D"), w: t("mercadoT0B1W") },
            { t: t("mercadoT0B2T"), d: t("mercadoT0B2D"), w: t("mercadoT0B2W") },
            { t: t("mercadoT0B3T"), d: t("mercadoT0B3D"), w: t("mercadoT0B3W") },
            { t: t("mercadoT0B4T"), d: t("mercadoT0B4D"), w: t("mercadoT0B4W") },
          ],
        },
        {
          nome: t("mercadoT1Nome"), go: "xri",
          why: t("mercadoT1Why"),
          boxes: [
            { t: t("mercadoT1B0T"), d: t("mercadoT1B0D"), w: t("mercadoT1B0W") },
            { t: t("mercadoT1B1T"), d: t("mercadoT1B1D"), w: t("mercadoT1B1W") },
            { t: t("mercadoT1B2T"), d: t("mercadoT1B2D"), w: t("mercadoT1B2W") },
          ],
        },
        {
          nome: t("mercadoT2Nome"), go: "market-dna",
          why: t("mercadoT2Why"),
          boxes: [
            { t: t("mercadoT2B0T"), d: t("mercadoT2B0D"), w: t("mercadoT2B0W") },
            { t: t("mercadoT2B1T"), d: t("mercadoT2B1D"), w: t("mercadoT2B1W") },
            { t: t("mercadoT2B2T"), d: t("mercadoT2B2D"), w: t("mercadoT2B2W") },
            { t: t("mercadoT2B3T"), d: t("mercadoT2B3D"), w: t("mercadoT2B3W") },
            { t: t("mercadoT2B4T"), d: t("mercadoT2B4D"), w: t("mercadoT2B4W") },
          ],
        },
        {
          nome: t("mercadoT3Nome"), go: "snowflake",
          why: t("mercadoT3Why"),
          boxes: [
            { t: t("mercadoT3B0T"), d: t("mercadoT3B0D"), w: t("mercadoT3B0W") },
          ],
        },
        {
          nome: t("mercadoT4Nome"), go: "calendar",
          why: t("mercadoT4Why"),
          boxes: [
            { t: t("mercadoT4B0T"), d: t("mercadoT4B0D"), w: t("mercadoT4B0W") },
          ],
        },
        {
          nome: t("mercadoT5Nome"), go: "cotacoes",
          why: t("mercadoT5Why"),
          boxes: [
            { t: t("mercadoT5B0T"), d: t("mercadoT5B0D"), w: t("mercadoT5B0W") },
            { t: t("mercadoT5B1T"), d: t("mercadoT5B1D"), w: t("mercadoT5B1W") },
          ],
        },
        {
          nome: t("mercadoT6Nome"), go: "screener",
          why: t("mercadoT6Why"),
          boxes: [
            { t: t("mercadoT6B0T"), d: t("mercadoT6B0D"), w: t("mercadoT6B0W") },
          ],
        },
      ],
    },
    {
      key: "intelligence", label: t("intelligenceLabel"), icon: "ti-building", fase: t("intelligenceFase"), cor: "var(--blue)",
      importa: t("intelligenceImporta"),
      telas: [
        {
          nome: t("intelT0Nome"), go: "social-radar",
          why: t("intelT0Why"),
          boxes: [
            { t: t("intelT0B0T"), d: t("intelT0B0D"), w: t("intelT0B0W") },
            { t: t("intelT0B1T"), d: t("intelT0B1D"), w: t("intelT0B1W") },
          ],
        },
        {
          nome: t("intelT1Nome"), go: "news-broadcast",
          why: t("intelT1Why"),
          boxes: [
            { t: t("intelT1B0T"), d: t("intelT1B0D"), w: t("intelT1B0W") },
          ],
        },
        {
          nome: t("intelT2Nome"), go: "insider-orders",
          why: t("intelT2Why"),
          boxes: [
            { t: t("intelT2B0T"), d: t("intelT2B0D"), w: t("intelT2B0W") },
          ],
        },
        {
          nome: t("intelT3Nome"), go: "institutional",
          why: t("intelT3Why"),
          boxes: [
            { t: t("intelT3B0T"), d: t("intelT3B0D"), w: t("intelT3B0W") },
            { t: t("intelT3B1T"), d: t("intelT3B1D"), w: t("intelT3B1W") },
          ],
        },
        {
          nome: t("intelT4Nome"), go: "cot-sentiment",
          why: t("intelT4Why"),
          boxes: [
            { t: t("intelT4B0T"), d: t("intelT4B0D"), w: t("intelT4B0W") },
            { t: t("intelT4B1T"), d: t("intelT4B1D"), w: t("intelT4B1W") },
          ],
        },
        {
          nome: t("intelT5Nome"), go: "cot-legacy",
          why: t("intelT5Why"),
          boxes: [
            { t: t("intelT5B0T"), d: t("intelT5B0D"), w: t("intelT5B0W") },
          ],
        },
        {
          nome: t("intelT6Nome"), go: "filings-search",
          why: t("intelT6Why"),
          boxes: [
            { t: t("intelT6B0T"), d: t("intelT6B0D"), w: t("intelT6B0W") },
          ],
        },
      ],
    },
    {
      key: "fundos", label: t("fundosLabel"), icon: "ti-coin", fase: t("fundosFase"), cor: "var(--green)", startHere: true,
      importa: t("fundosImporta"),
      telas: [
        {
          nome: t("fundosT0Nome"), go: "fundo", param: "HPC22",
          why: t("fundosT0Why"),
          boxes: [
            { t: t("fundosT0B0T"), d: t("fundosT0B0D") },
            { t: t("fundosT0B1T"), d: t("fundosT0B1D") },
          ],
        },
        {
          nome: t("fundosT1Nome"), go: "fundo", param: "HPC22",
          why: t("fundosT1Why"),
          boxes: [
            { t: t("fundosT1B0T"), d: t("fundosT1B0D") },
            { t: t("fundosT1B1T"), d: t("fundosT1B1D") },
            { t: t("fundosT1B2T"), d: t("fundosT1B2D") },
            { t: t("fundosT1B3T"), d: t("fundosT1B3D") },
          ],
        },
        {
          nome: t("fundosT2Nome"), go: "fundo", param: "HPC22",
          why: t("fundosT2Why"),
          boxes: [
            { t: t("fundosT2B0T"), d: t("fundosT2B0D") },
            { t: t("fundosT2B1T"), d: t("fundosT2B1D") },
            { t: t("fundosT2B2T"), d: t("fundosT2B2D") },
          ],
        },
        {
          nome: t("fundosT3Nome"), go: "fundo", param: "HPC22",
          why: t("fundosT3Why"),
          boxes: [
            { t: t("fundosT3B0T"), d: t("fundosT3B0D") },
            { t: t("fundosT3B1T"), d: t("fundosT3B1D") },
            { t: t("fundosT3B2T"), d: t("fundosT3B2D") },
          ],
        },
        {
          nome: t("fundosT4Nome"), go: "fundo", param: "HPC22",
          why: t("fundosT4Why"),
          boxes: [
            { t: t("fundosT4B0T"), d: t("fundosT4B0D") },
          ],
        },
        {
          nome: t("fundosT5Nome"), go: "fundo", param: "HPC22",
          why: t("fundosT5Why"),
          boxes: [
            { t: t("fundosT5B0T"), d: t("fundosT5B0D") },
            { t: t("fundosT5B1T"), d: t("fundosT5B1D") },
            { t: t("fundosT5B2T"), d: t("fundosT5B2D") },
          ],
        },
        {
          nome: t("fundosT6Nome"), go: "fundo", param: "HPC22",
          why: t("fundosT6Why"),
          boxes: [
            { t: t("fundosT6B0T"), d: t("fundosT6B0D") },
            { t: t("fundosT6B1T"), d: t("fundosT6B1D") },
            { t: t("fundosT6B2T"), d: t("fundosT6B2D") },
            { t: t("fundosT6B3T"), d: t("fundosT6B3D") },
          ],
        },
        {
          nome: t("fundosT7Nome"), go: "fundo", param: "HPC22",
          why: t("fundosT7Why"),
          boxes: [
            { t: t("fundosT7B0T"), d: t("fundosT7B0D") },
            { t: t("fundosT7B1T"), d: t("fundosT7B1D") },
          ],
        },
        {
          nome: t("fundosT8Nome"), go: "ordem",
          why: t("fundosT8Why"),
          boxes: [
            { t: t("fundosT8B0T"), d: t("fundosT8B0D") },
            { t: t("fundosT8B1T"), d: t("fundosT8B1D") },
            { t: t("fundosT8B2T"), d: t("fundosT8B2D") },
            { t: t("fundosT8B3T"), d: t("fundosT8B3D") },
          ],
        },
      ],
    },
    {
      key: "clientes", label: t("clientesLabel"), icon: "ti-users", fase: t("clientesFase"), cor: "var(--gold)",
      importa: t("clientesImporta"),
      telas: [
        {
          nome: t("clientesT0Nome"), go: "clientes",
          why: t("clientesT0Why"),
          boxes: [
            { t: t("clientesT0B0T"), d: t("clientesT0B0D") },
            { t: t("clientesT0B1T"), d: t("clientesT0B1D") },
            { t: t("clientesT0B2T"), d: t("clientesT0B2D") },
          ],
        },
        {
          nome: t("clientesT1Nome"), go: "carteira",
          why: t("clientesT1Why"),
          boxes: [
            { t: t("clientesT1B0T"), d: t("clientesT1B0D") },
            { t: t("clientesT1B1T"), d: t("clientesT1B1D") },
            { t: t("clientesT1B2T"), d: t("clientesT1B2D") },
          ],
        },
        {
          nome: t("clientesT2Nome"), go: "importar",
          why: t("clientesT2Why"),
          boxes: [
            { t: t("clientesT2B0T"), d: t("clientesT2B0D") },
          ],
        },
        {
          nome: t("clientesT3Nome"), go: "alertas",
          why: t("clientesT3Why"),
          boxes: [
            { t: t("clientesT3B0T"), d: t("clientesT3B0D") },
          ],
        },
      ],
    },
    {
      key: "risco", label: t("riscoLabel"), icon: "ti-shield-half", fase: t("riscoFase"), cor: "var(--red)",
      importa: t("riscoImporta"),
      telas: [
        {
          nome: t("riscoT0Nome"), go: "risco",
          why: t("riscoT0Why"),
          boxes: [
            { t: t("riscoT0B0T"), d: t("riscoT0B0D"), w: t("riscoT0B0W") },
            { t: t("riscoT0B1T"), d: t("riscoT0B1D"), w: t("riscoT0B1W") },
            { t: t("riscoT0B2T"), d: t("riscoT0B2D"), w: t("riscoT0B2W") },
          ],
        },
      ],
    },
    {
      key: "ajustes", label: t("ajustesLabel"), icon: "ti-settings", fase: t("ajustesFase"), cor: "var(--tx2)",
      importa: t("ajustesImporta"),
      telas: [
        { nome: t("ajustesT0Nome"), go: "integracoes", why: t("ajustesT0Why"), boxes: [{ t: t("ajustesT0B0T"), d: t("ajustesT0B0D") }] },
        { nome: t("ajustesT1Nome"), go: "api",         why: t("ajustesT1Why"), boxes: [{ t: t("ajustesT1B0T"), d: t("ajustesT1B0D") }] },
        { nome: t("ajustesT2Nome"), go: "marca",       why: t("ajustesT2Why"), boxes: [{ t: t("ajustesT2B0T"), d: t("ajustesT2B0D") }] },
        { nome: t("ajustesT3Nome"), go: "config",      why: t("ajustesT3Why"), boxes: [{ t: t("ajustesT3B0T"), d: t("ajustesT3B0D") }] },
      ],
    },
  ];
}

export default function Tutorial({ go }: { go: (id: ScreenId, param?: string) => void }) {
  const { lang } = useI18n();
  const t: TFn = (k) => TR[k][lang];
  const [sel, setSel] = useState("painel");

  const QUICK_START = useMemo(() => makeQuickStart(t), [lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const NODES = useMemo(() => makeNodes(t), [lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const node = NODES.find((n) => n.key === sel)!;

  return (
    <div className="screen">
      <div className="flex" style={{ alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <div className="h1" style={{ margin: 0 }}>{t("pageTitle")}</div>
        <div className="sub" style={{ margin: 0 }}>{t("pageSub")}</div>
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
            {t("quickStartHeading")}
          </h3>
          <span className="muted" style={{ fontSize: 12 }}>{t("quickStartHint")}</span>
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
                        <span title={t("startHereTitle")}
                          style={{
                            fontSize: 8.5, fontWeight: 700, padding: "2px 6px", borderRadius: 3,
                            background: "rgba(201,160,44,.18)", color: "var(--gold)",
                            fontFamily: "var(--mono)", letterSpacing: .4,
                          }}>{t("startHereBadge")}</span>
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
              <b style={{ color: "var(--gold)" }}>{t("whyItMattersLabel")}</b>{node.importa}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
            {node.telas.map((tela, ti) => (
              <div className="card" key={ti}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--tx)" }}>{tela.nome}</span>
                  {tela.go && (
                    <button className="btn ghost" style={{ marginLeft: "auto", fontSize: 11, padding: "3px 10px" }}
                      onClick={() => go(tela.go!, tela.param)}>{t("openScreen")}</button>
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
                            {t("whyItMattersArrow")}
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
        <h3><i className="ti ti-layout-grid-add" />{t("customizeHeading")}</h3>
        <div className="muted" style={{ lineHeight: 1.6 }}>
          {t("customizeBody1")}<b style={{ color: "var(--tx)" }}>{t("customizeBodyDefault")}</b>{t("customizeBody2")}<b style={{ color: "var(--tx)" }}>{t("customizeBodyAction")}</b>{t("customizeBody3")}
        </div>
      </div>

      <div className="card mt" style={{ display: "flex", alignItems: "center", gap: 14, borderColor: "rgba(201,160,44,.3)" }}>
        <i className="ti ti-sparkles" style={{ fontSize: 22, color: "var(--gold)" }} />
        <div style={{ flex: 1 }}><b style={{ fontSize: 13 }}>{t("needHelpTitle")}</b> <span className="muted" style={{ fontSize: 13 }}>{t("needHelpBody")}</span></div>
      </div>
    </div>
  );
}

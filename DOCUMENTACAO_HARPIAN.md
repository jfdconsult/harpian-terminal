# Documentação — Terminal Harpian, Cockpit e integrações

**Última atualização:** 2026-07-16
**Escopo:** tudo que foi construído/corrigido para deixar o Terminal pronto para apresentação e uso.

> Este documento é a fonte de verdade do que existe hoje, como funciona, e o que
> falta. Leia o [Princípio de Produto](#1-princípio-de-produto) primeiro — ele
> explica *por que* as coisas são como são.

---

## Índice

1. [Princípio de produto](#1-princípio-de-produto)
2. [Arquitetura de confidencialidade](#2-arquitetura-de-confidencialidade)
3. [O motor de interpretação do JIM](#3-o-motor-de-interpretação-do-jim)
4. [XRI no cliente — a régua do ingrediente](#4-xri-no-cliente--a-régua-do-ingrediente)
5. [Risk Number no import — metodologia Nitrogen/HRIE](#5-risk-number-no-import--metodologia-nitrogenhrie)
6. [Favoritos no servidor + e-mail noturno](#6-favoritos-no-servidor--e-mail-noturno)
7. [Visão de Mercado (consolidador)](#7-visão-de-mercado-consolidador)
8. [Calendário econômico real](#8-calendário-econômico-real)
9. [Health check de integrações](#9-health-check-de-integrações)
10. [Dado falso eliminado](#10-dado-falso-eliminado)
11. [Bugs encontrados e corrigidos](#11-bugs-encontrados-e-corrigidos)
12. [Referência de arquivos](#12-referência-de-arquivos)
13. [Referência de APIs](#13-referência-de-apis)
14. [Chaves e configuração](#14-chaves-e-configuração)
15. [Como rodar, testar e fazer deploy](#15-como-rodar-testar-e-fazer-deploy)
16. [O que falta](#16-o-que-falta)

---

## 1. Princípio de produto

**"Tudo real, exceto o portfólio dos sócios."**

O Terminal é apresentado por um **assessor** (o passageiro). O cliente final dele
não tem acesso. Todos os dados de mercado, análises, algoritmos, motores e
resultados são **reais e ao vivo**. A única coisa fictícia são as carteiras dos
"clientes", que na verdade são os próprios sócios da Harpian com carteiras-modelo
de apresentação.

**A metáfora da aeronave e da régua do ingrediente:**
- O passageiro (assessor) vê a TV da poltrona: altitude, velocidade, rota, ETA —
  telemetria real, em outra granularidade. Não vê RPM do motor nem pressão
  hidráulica (o que só o piloto opera).
- Coca-Cola: os **ingredientes** estão na lata (água, açúcar, noz de cola). A
  **proporção** é o segredo. Ninguém deixa de comprar por ver os ingredientes.

Régua operacional, aplicada em código:
> **Nomear o ingrediente, esconder a proporção.** Mostrar todo instrumento sobre
> o qual o assessor pode agir ou se tranquilizar; esconder o que só o gestor opera
> e a fórmula/pesos que são a propriedade intelectual da Harpian.

Consequência: o valor não é "o risco é 49", é **"o risco é 49 porque a estrutura
está frágil, não porque o mercado está em pânico"**. É isso que substitui o
analista. É a diferença entre a Harpian e um Bloomberg (que cospe o número mas não
interpreta).

---

## 2. Arquitetura de confidencialidade

Dois apps, duas fronteiras:

| | Terminal (`harpian-terminal-next`) | Cockpit (`harpian-cockpit-next`) |
|---|---|---|
| Público | Assessor (cliente da Harpian) | Gestor interno |
| Porta dev | 3000 | 8960 |
| Pode mostrar | Resultado + postura + **ingrediente** | Tudo: fórmula, CRS, Temperatura, CC, pesos |
| Fronteira | Whitelist no servidor (rotas `app/api/*`) | Sem whitelist |

**Regra de ouro:** o filtro de confidencialidade acontece **no servidor**, nunca
no cliente. As rotas `app/api/xri` e `app/api/snapshot` do Terminal são whitelists
explícitas — só o que está na lista sai. Turbulence, absorption ratio, slow_prior
bruto, fast_market_stress bruto, pesos (a..e), `overlay_recommendation`, versões e
`contribution_by_pillar` **nunca** saem do Terminal.

Os dois apps têm um `JimBlock.tsx` e um motor de análise **separados de propósito**
(`lib/jim-market-analysis.ts` no Terminal, `lib/jim-cockpit-analysis.ts` no
Cockpit). Compartilhar código entre eles seria o caminho mais curto para vazar
método pro lado do cliente. A UI é gêmea; o miolo não se toca.

---

## 3. O motor de interpretação do JIM

O JIM deixou de **ler** e passou a **interpretar**. Estrutura de cada indicador em
quatro camadas: **Leitura → Por quê (o que influencia) → Tendência → O que muda.**

Regra de escrita: nenhuma frase existe sem um número do feed por trás. Sem número,
não vira frase — o JIM nunca "acha".

**Terminal** (`lib/jim-market-analysis.ts`): funções `buildAri`, `buildXri`,
`buildDna`, `buildMarketAnalysis`. Interpreta ARI, XRI e Market DNA em cima do
resultado dos índices + dado público (CFTC, CBOE, FRED, CNN, Yahoo).

**Cockpit** (`lib/jim-cockpit-analysis.ts`): `buildAriInternal`, `buildXriInternal`,
`buildCockpitAnalysis`. Fala abertamente de Temperatura, CC, gates, MAC Score,
turbulence, absorption ratio, Diebold-Yilmaz, overlay + a flag de validação.

Exemplos reais de cruzamento que o motor produz (impossíveis de ver olhando uma
tela só):
- **ARI × XRI (Cockpit):** *"A cross-correlation do motor está em 0,62 (acima do
  gate de 0,55) e o absorption ratio do XRI está em 94. Um olha os pilares do
  HC-US, o outro os mercados globais — nenhum sabe do outro, e os dois apontam pra
  'tudo virou um fator só'."*
- **Iene × Japão:** o Japão é 54% do XRI e os especuladores estão −31% no iene.
  Carry trade lotado no mesmo país que concentra o risco externo.
- **Overlay + flag:** o XRI recomenda −10% no teto, **mas** `NOT_VALIDATED_AS_OVERLAY`
  está ativa — "é painel, não instrução; aplicar agora seria operar um overlay que
  não passou na validação".

O componente visual (`JimBlock.tsx`) é gêmeo nos dois apps: badge de estado,
leitura destacada, drivers com tom (positivo/negativo/neutro), tendência e impacto.

---

## 4. XRI no cliente — a régua do ingrediente

**Arquivo-chave:** `app/api/xri/route.ts` (whitelist).

Três níveis de informação sobre o mesmo número:
- **Nível 1 (resultado):** "Risco externo MODERADO, 49, puxado pelo Japão." — é o Bloomberg.
- **Nível 2 (ingrediente):** "Os 49 vêm de **fragilidade estrutural**, não de pânico." — é o analista.
- **Nível 3 (fórmula):** `0,20·slow + 0,20·fast + 0,20·turb + ...`, histerese 30/55/75, matriz P7. — fica só no Cockpit.

A whitelist do Terminal agora expõe o **nível 2**: campo `channels` com os canais
nomeados e seu share (Fragilidade estrutural 60% · Prior macro 24% · Stress de
mercado 16%) e `transmission` qualitativo ("aberto"/"fechado"). Verificado por
teste automático que **nenhum** campo de fórmula vaza.

O `buildXri` do Terminal usa isso pra escrever, como um analista faria: *"O risco
de hoje vem principalmente de fragilidade estrutural — o sistema está montado de
um jeito que transmite choque, mesmo sem choque acontecendo hoje."*

---

## 5. Risk Number no import — metodologia Nitrogen/HRIE

**Arquivos:** `lib/risk-number.ts`, `app/api/risk-number/route.ts`,
`lib/risk-number.test.ts`. Integração em `components/screens/Importar.tsx` e
`lib/clientStore.ts`.

Fonte da metodologia: `05 - RISK_NUMBER_ALPHA_QUANT/05.05 - Risk Number MFO`
(HRIE v1.1 + captura da Nitrogen). É o método real do Nitrogen/Riskalyze — banda
de perda 95% em 6 meses, escala 1–99, forma fechada (sem Monte Carlo).

**Fórmula (HRIE v1.1 — RN como observável puro):**
```
downside_dev_anual = RMS dos retornos diários NEGATIVOS × √252   (MAR = 0)
Downside_95_6m     = 1.645 × downside_dev_anual × √0.5           (95%, 6 meses)
RN                 = interpolação linear por partes nas âncoras
```
Âncoras (idênticas às capturadas da Nitrogen): `(0.02,22) (0.05,32) (0.07,42)
(0.12,62) (0.18,82) (0.2742,91)`. `loss ≤ 0 → 1`; `loss > 0.2742 → 99`.

**Calibração validada ao vivo:**
| Carteira | Engine Harpian | Nitrogen capturado |
|---|---|---|
| AGG (bonds) | 31 | 29 |
| 60/40 SPY/AGG | 50 | 52 |
| SPY | 62 | ~70 |
| NVDA/TSLA | 99 (perda 40%) | — (extremo) |

Portfólio = média ponderada conservadora dos downsides (assume correlação 1, não
desconta diversificação). Matriz de covariância (HRIE §12) fica para v2.

**Fluxo:** ao subir a planilha no Importar, a tela chama `/api/risk-number` (busca
3 anos de histórico de cada ticker no Yahoo, calcula o downside, pondera pela
carteira), mostra o RN + perda estimada + **comparação com o mandato do cliente**
(alerta se estourar), e ao aplicar **persiste** o RN no cliente.

**Nota:** a calibração antiga do app (dois valores contradizentes de SPY, 27 vs 72)
foi unificada — `lib/yahoo.ts:riskNumber()` agora usa o mesmo método.

---

## 6. Favoritos no servidor + e-mail noturno

**O gatilho das 9h:** o assessor abre o terminal todo dia porque recebeu um e-mail
com o que mudou nos favoritos dele.

**Terminal (favoritos no servidor):**
- `lib/favorites-store.ts` — store em disco (`data/favorites/<email>.json`), mesmo
  padrão das sessões do JIM. Chave = e-mail (única identidade; não há login).
- `app/api/favorites/route.ts` — GET/PUT por e-mail.
- `lib/favorites.ts` — dual-write: localStorage (instantâneo) + servidor (se
  e-mail configurado). A estrelinha continua instantânea; sincroniza em segundo
  plano. Sobrevive a limpar cache e passa de um dispositivo pro outro.
- `lib/user-prefs.ts` — as preferências de notificação (e-mail/hora/fuso),
  extraídas do `SettingsDrawer`. O e-mail é a identidade do assessor.
- Ao salvar o e-mail em Configurações › Email matinal, registra no servidor.

**Overnight (e-mail):** `.../overnight/email_digest.py`, chamado por
`overnight_run.py` (hook aditivo, try/except que nunca propaga). Por assessor:
lê os favoritos do Terminal, monta a postura de mercado (ARI + XRI), puxa as
notícias do dia (JD News), busca a cotação de fechamento dos favoritos (Yahoo),
compõe um e-mail HTML e **sempre grava** `digest_<email>_latest.html`.

**Envio gated:** só envia de fato se `RESEND_API_KEY` estiver no `.env`. Sem a
chave, compõe e grava mas não envia — igual ao padrão do Claude. A ponte entre os
dois códigos (Next.js e Python) é o Python ler os arquivos que o Terminal grava em
`data/favorites/`.

---

## 7. Visão de Mercado (consolidador)

**Arquivo:** `components/screens/MercadoVisao.tsx`. É a 1ª opção do menu Mercado.

O resumo do dia, sem rolagem. Regras de design aplicadas (framework UX):
- **Krug (billboard):** o gestor escaneia, não lê. Zero texto discursivo.
- **Von Restorff:** um único elemento destacado — o veredicto + "o que fazer".
- **Miller (chunking):** 4 blocos de estado (Risco Interno/ARI, Risco Externo/XRI,
  Inteligência/DNA, Índices), não prosa.
- **Sapolsky:** em RISK-OFF o gestor está sob stress → a linha de AÇÃO ("reduzir
  risco, não realocar geografia") porque sob stress se processa instrução, não análise.
- **Norman (progressive disclosure):** o "por quê" mora na tela de cada indicador.

O texto denso (blocos do JIM) migrou para as telas de detalhe (ARI, XRI, DNA). A
Visão só tem o resumo + a síntese consolidada.

**Navegação:** todas as telas de Mercado têm o botão "Voltar para Visão"
(`components/BackToVisao.tsx`) no canto superior direito, sempre na mesma posição.

Menu Mercado reorganizado: Visão de Mercado → ARI → XRI → Market DNA → Snowflake →
Cotações → Screener. Market DNA/Snowflake/Screener migraram de Intelligence
(monitoramento de mercado ≠ fontes externas).

---

## 8. Calendário econômico real

**Arquivos:** `app/api/calendar/route.ts`, `lib/calendar.ts`.

Fonte: endpoint AJAX do Investing.com (rodado no servidor por CORS, cache 1h).
Antes o calendário era hardcoded no Painel e no ARI, com datas já vencidas mostradas
como "próximo evento". Agora: 91 eventos futuros reais com previsão e anterior. Se a
fonte cair, a tela diz "indisponível" — nunca inventa data. Alimenta Painel, ARI e
Alertas.

---

## 9. Health check de integrações

**Arquivos:** `app/api/health/route.ts`, `components/screens/Integracoes.tsx`.

Cada fonte é **consultada de verdade** ao abrir a tela (latência medida). Antes os
status "conectado" eram constantes digitadas à mão — e a Lynk aparecia como
conectada para roteamento de ordens enquanto a tela de Ordens diz que o envio é
simulado. Agora: Yahoo, SEC EDGAR, CFTC, CBOE, FRED, calendário, engine XRI, motor
HC-US aparecem com status real (8/11 no ar típico); Lynk = "simulado", FastTrack e
TradingView = "planejado".

---

## 10. Dado falso eliminado

Levantamento completo das 31 telas → toda tela no ar passou a dizer a verdade:

| Tela | Antes | Agora |
|---|---|---|
| Insider Orders | 12 transações **inventadas** atribuídas a pessoas reais (Musk vendendo $715M TSLA, Buffett, Cook…), sem aviso | SEC EDGAR real, cada linha abre o filing na SEC |
| Calendário (Painel/ARI) | Datas de julho já vencidas como "próximo evento" | Investing.com real, 91 eventos futuros |
| Market DNA | 3 camadas fantasma com `score: 50` inventado entrando na média | Removidas da média (Conviction 54→56), roadmap declarado sem número |
| Alertas | Eventos de mercado hardcoded ("Fed sinaliza…", "CPI amanhã") | Calendário + notícias reais, tempo relativo calculado |
| COT (2 telas) | Cai em 15 mercados fabricados quando a API falha | CFTC real ou erro honesto |
| Integrações | Badges "conectado" digitados | Health check ao vivo |
| Config | "Tema: Institucional" / "Idioma: PT" fixos; tabela de usuários fake | Tema/idioma/fuso reais; usuários = "fase 2" declarado |
| Manchete do Painel | "Regime RISK-ON" fixo no texto | Regime real (RISK-OFF) |

**Sócios reais (feito):** as carteiras-modelo agora são os 4 sócios da Harpian
(nomes/cargos do slide TEAM da apresentação institucional):
- **João Daniel** — Founder/CIO — Brasil + USA, 35% no ETP (RN 58)
- **Diogo Scelza** — Portfolio Manager — só USA, 25% no HPC (RN 66)
- **Johnny Zighelboim** — Quant Data Architecture — só USA, 30% no HPC (RN 62)
- **João Pedro Panizzutti** — CTO — Europa + USA, 20% no HPC (RN 55)

Todos dentro do mandato. Sem CPF/CNPJ inventado. Editar em `lib/clients.ts`.

---

## 11. Bugs encontrados e corrigidos

1. **Bug do shape do DNA (3 arquivos):** `layers` era lido como lista, mas o
   gov-data devolve objeto. `Regime.tsx`, `Painel.tsx` e o Positioning do
   `MarketDna.tsx` caíam em silêncio (seção não aparecia / camada mostrava "—").
   Corrigido nos três.
2. **Regime mapeado errado (Cockpit, DefesaInteligente):** o array `REGIMES` usava
   chaves `BEAR/CAUTELA/NEUTRO/BULL` que nunca batiam com as strings reais da API
   (`RISK-OFF/WARNING/RE-ENTRY/RISK-ON`). O `.find()` sempre falhava e caía no
   fallback verde (RISK-ON) — a tela de defesa mostrava "tudo certo" independente
   do estado real. Corrigido.
3. **Manchete do Painel:** escrevia "Regime RISK-ON" fixo em todos os caminhos.
   Agora lê o regime real.
4. **Risk Number — bug de fronteira (pego por TDD):** no downside exatamente igual
   à última âncora (0,2742), retornava 99 em vez de 91 (`>=` deveria ser `>`). Um
   portfólio no limite receberia risco máximo indevidamente. Corrigido e travado em
   teste.
5. **Alertas lia a seed em vez de `allClients()`:** cliente cadastrado em runtime
   nunca gerava alerta de risco. Corrigido.
6. **Backtest.tsx `useRef` sem argumento** (não era meu; task separada resolveu).

---

## 12. Referência de arquivos

### Terminal — novos
| Arquivo | Papel |
|---|---|
| `lib/jim-market-analysis.ts` | Motor de interpretação do JIM (cliente): buildAri/buildXri/buildDna |
| `lib/risk-number.ts` | Engine Nitrogen/HRIE (downside 95%/6m → RN 1–99) |
| `lib/risk-number.test.ts` | Teste de calibração (trava as âncoras Nitrogen) |
| `lib/calendar.ts` | Cliente do calendário econômico |
| `lib/favorites-store.ts` | Store de favoritos no servidor (por e-mail) |
| `lib/user-prefs.ts` | Preferências do assessor (identidade = e-mail) |
| `lib/xri.ts` | Tipos + fetch do feed XRI cliente-safe |
| `app/api/xri/route.ts` | Whitelist do XRI (com os canais/ingrediente) |
| `app/api/risk-number/route.ts` | Calcula RN de um portfólio importado |
| `app/api/calendar/route.ts` | Calendário econômico (Investing.com) |
| `app/api/favorites/route.ts` | GET/PUT favoritos por e-mail |
| `app/api/health/route.ts` | Health check das integrações |
| `components/JimBlock.tsx` | Bloco visual de detalhe do JIM |
| `components/BackToVisao.tsx` | Botão "Voltar para Visão" |
| `components/screens/MercadoVisao.tsx` | Consolidador Visão de Mercado |
| `components/screens/Xri.tsx` | Tela XRI (cliente) |

### Terminal — principais modificados
`Painel.tsx` (calendário + DNA + regime real), `Regime.tsx` (ARI + calendário +
shape DNA), `MarketDna.tsx` (camadas fantasma + Positioning + 3 colunas),
`InsiderOrders.tsx` (EDGAR real), `Alertas.tsx` (calendário/notícias reais),
`CotLegacy.tsx`/`CotSentiment.tsx` (mock removido), `Integracoes.tsx` (health),
`Config.tsx` (tema/idioma reais), `Importar.tsx` (Risk Number), `Cotacoes.tsx`
(BackToVisao), `SettingsDrawer.tsx` (e-mail → servidor), `Terminal.tsx` (sync
favoritos + rota MercadoVisao), `lib/favorites.ts` (dual-write), `lib/yahoo.ts`
(riskNumber unificado), `lib/clientStore.ts` (RN no import), `lib/nav.ts` (menu),
`lib/jim-context.ts` (xri/mercado-visao), `lib/data.ts` (IO_DATA removido).

### Cockpit — novos
`lib/jim-cockpit-analysis.ts` (motor interno), `components/JimBlock.tsx` (bloco
interno). Modificado: `DefesaInteligente.tsx` (JIM interno + fix do regime),
`screens/Xri.tsx` (JIM interno), `lib/jim-context.ts` (xri).

### Overnight — novos
`email_digest.py` (resumo diário). Modificado: `overnight_run.py` (hook do digest).

### Engine XRI (`harpian-xri`)
`src/xri/serve.py` (micro-serviço :8879), `src/xri/jim_analysis.py` (análise
noturna). 61 testes passam.

---

## 13. Referência de APIs

### Terminal (`http://localhost:3000/api/*`)
| Rota | Método | O que faz |
|---|---|---|
| `/api/xri` | GET | XRI cliente-safe (score, estado, canais, drivers, validação) |
| `/api/risk-number` | POST `{positions:[{ticker,marketValue}]}` | RN Nitrogen do portfólio |
| `/api/calendar` | GET | Calendário econômico (91 eventos futuros) |
| `/api/favorites` | GET `?email=` / PUT | Favoritos do assessor no servidor |
| `/api/health` | GET | Status ao vivo de cada integração |
| `/api/snapshot` | GET | Snapshot do overnight cliente-safe |
| `/api/quotes`, `/api/candles`, `/api/asset` | GET | Cotações/gráficos (Yahoo via hqp) |

### gov-data (`http://localhost:8877/api/*`)
`market-dna`, `insider` (SEC Form 4), `cot/legacy`, `cboe/volatility`,
`fred/macro`, `snowflake/{ticker}`, `screener`, `sentiment`, `finra/darkpool`,
`filings/search`.

### XRI engine (`http://localhost:8879`)
`/xri/full` — snapshot + validação + calibração + análise JIM.

### hqp-api (`http://localhost:8080/v1/*`)
`protection/defense`, `protection/indicators`, `protection/pilar-d`,
`protection/reentry`, `protection/jim-analysis`.

---

## 14. Chaves e configuração

Nenhuma chave é obrigatória para o app rodar. As opcionais ativam recursos:

| Chave | Onde | Ativa |
|---|---|---|
| `ANTHROPIC_API_KEY` | `.env` do overnight e do harpian-xri | Análise noturna profunda do JIM (LLM) |
| `RESEND_API_KEY` | `.env` do overnight | Envio real do e-mail de resumo |
| `HARPIAN_DIGEST_FROM` | `.env` do overnight | Remetente do e-mail |
| `HARPIAN_TERMINAL_FAVORITES_DIR` | `.env` do overnight | Caminho dos favoritos (default aponta pro repo) |
| `NEXT_PUBLIC_XRI_API_URL` | `.env.local` do cockpit | URL do micro-serviço XRI (default localhost:8879) |

Sem `ANTHROPIC_API_KEY`: a leitura estruturada do JIM (por regra) roda sempre; só
a análise LLM noturna fica de fora. Sem `RESEND_API_KEY`: o e-mail é composto e
gravado em HTML, mas não enviado.

**As chaves são do usuário — nunca foram copiadas/hardcoded pelo assistente.**

---

## 15. Como rodar, testar e fazer deploy

**Serviços (5):**
```
Terminal (cliente):   cd C:\dev\harpian-terminal-next && npm run dev   # :3000
Cockpit (interno):    cd C:\dev\harpian-cockpit-next && npm run dev    # :8960
gov-data:             python api_server.py                            # :8877
XRI engine:           uvicorn xri.serve:app --port 8879               # :8879
hqp-api:              (fly.dev ou local)                              # :8080
```

**Testar:**
```
cd C:\dev\harpian-terminal-next
npm run typecheck          # tsc --noEmit
npm test                   # calibração do Risk Number (20 asserções)
npm run build              # build de produção (o teste real de "pode ir online")

cd C:\dev\harpian-xri
python -m pytest -q        # 61 testes da engine
```

**Deploy:** usar `npm run build` + `npm start` (produção). O build de produção é
limpo. Nota: o dev server (Turbopack) acumula erros de parse no buffer do console
durante a edição — reiniciar o dev server limpa isso; não afeta produção.

**QA:** relatório em `.gstack/qa-reports/qa-report-2026-07-16.md` — health 95/100.

---

## 16. O que falta

1. ~~**Nomes reais dos sócios**~~ — **FEITO.** Os 4 sócios reais estão em
   `lib/clients.ts` com nome, cargo, alocação por geografia e % no ETP. Nenhum
   dado de cliente falso restante no terminal.
2. **`ANTHROPIC_API_KEY`** nos dois `.env` (harpian-xri + overnight) para a análise
   noturna profunda do JIM.
3. **`RESEND_API_KEY`** no `.env` do overnight para o envio real do e-mail.
4. **Import Excel/PDF** — o CSV funciona; Excel é parser determinístico (fácil), PDF
   depende do JIM ler o extrato (varia por layout, precisa da chave Claude).
5. **Covariância no Risk Number (v2)** — hoje é média ponderada conservadora
   (correlação 1). A matriz de covariância (HRIE §12) desconta diversificação.
6. **Cruft:** diretório vazio `C:devharpian-terminal-next` (nome inválido no
   Windows, inofensivo) — remover quando conveniente.

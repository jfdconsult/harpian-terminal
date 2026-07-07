// ============================================================
// HARPIAN ETP TERMINAL — Dados dos fundos (ETPs)
// Fonte HPC22: Institutional Factsheet v4 CORE22+ (Junho 2026), oficial.
// HPC11: estrutura espelhada, aguardando factsheet oficial.
// ============================================================

export interface PerfRow { metric: string; gross: string; net: string; spx: string; }
export interface KV { k: string; v: string; }
export interface JourneyRow { metric: string; core: string; spx: string; }
export interface EndpointRow { horizon: string; corePos: string; coreWorst: string; spxPos: string; spxWorst: string; }
export interface CrisisRow { crisis: string; spxDecline: string; spxRec: string; coreDecline: string; coreRec: string; }
export interface Step { n: number; title: string; desc: string; }
export interface Highlight { label: string; value: string; sub?: string; tone?: "g" | "r" | "gold" }

export interface Fund {
  id: string;
  ticker: string;
  name: string;
  strategy: string;
  assetClass: string;
  tagline: string;
  status: "Homologado" | "Laboratório";
  official: boolean;
  isin: string;
  seals: string[];
  highlights: Highlight[];
  productData: KV[];
  performance: PerfRow[];
  perfNote: string;
  journeyRisk: JourneyRow[];
  endpointRisk: EndpointRow[];
  endpointNote: string;
  crisisDefense: CrisisRow[];
  crisisNote: string;
  economics: KV[];
  architecture: KV[];
  engineArchitecture: KV[];
  purchaseSteps: Step[];
  purchaseData: KV[];
  contacts: KV[];
  disclaimer: string;
}

const HPC22: Fund = {
  id: "HPC22",
  ticker: "HPC22",
  name: "HPC22 · CORE22+",
  strategy: "Adaptive Equity Momentum",
  assetClass: "Listed institutional ETP",
  tagline: "Risk is measured. Capital is preserved. Return is built through method.",
  status: "Laboratório",
  official: true,
  isin: "XS3386635109",
  seals: ["Deloitte", "BNY Mellon", "Interactive Brokers", "Bloomberg", "Vienna Stock Exchange", "Lynk Capital Markets"],
  highlights: [
    { label: "CAGR 36 anos (net)", value: "28,3%", sub: "S&P 500 TR: 10,75%", tone: "g" },
    { label: "Max. drawdown (net)", value: "−29,0%", sub: "S&P 500: −55,3%", tone: "gold" },
    { label: "Sortino (rf 3,5%)", value: "6,73", sub: "S&P 500: 2,83", tone: "g" },
    { label: "Ulcer Index", value: "6,79", sub: "2,1× menor que o S&P", tone: "gold" },
  ],
  productData: [
    { k: "Produto / Estratégia", v: "HPC22 · CORE22+" },
    { k: "Classe", v: "Adaptive Equity Momentum" },
    { k: "Universo", v: "S&P 500 · 2 ações/setor" },
    { k: "Regime", v: "Binário BULL / BEAR" },
    { k: "Defesa", v: "ETFs defensivos" },
    { k: "Rebalanceamento", v: "Mensal, sistemático" },
    { k: "Mínimo", v: "USD 50k (múltiplos de USD 5k)" },
    { k: "Elegibilidade", v: "Não residentes fiscais nos EUA" },
  ],
  performance: [
    { metric: "CAGR (36 anos)", gross: "37,3%", net: "28,3%", spx: "10,75%" },
    { metric: "Max. drawdown", gross: "−26,0%", net: "−29,0%", spx: "−55,3%" },
    { metric: "Ulcer Index", gross: "6,79", net: "6,79", spx: "13,93" },
    { metric: "Sharpe (rf 3,5%)", gross: "1,06", net: "0,93", spx: "0,55" },
    { metric: "Sortino (rf 3,5%)", gross: "12,30", net: "6,73", spx: "2,83" },
    { metric: "Anos negativos", gross: "1", net: "3", spx: "8" },
  ],
  perfNote: "Taxas modeladas: 2,00% a.a. de gestão e 20% de performance sobre hurdle de 5% a.a., com high-water mark. Resultados hipotéticos; índices não incorrem em taxas.",
  journeyRisk: [
    { metric: "Nº de eventos (quedas ≥5%)", core: "111", spx: "42" },
    { metric: "Recuperação — mediana", core: "1,6 meses", spx: "2,7 meses" },
    { metric: "Recuperação — média", core: "2,6 meses", spx: "6,7 meses" },
    { metric: "% recuperado em ≤6 meses", core: "89%", spx: "83%" },
    { metric: "Pior tempo submerso", core: "21,1 meses", spx: "74,8 meses" },
    { metric: "Pior drawdown", core: "−28,3%", spx: "−55,3%" },
  ],
  endpointRisk: [
    { horizon: "Horizonte 3 anos", corePos: "100%", coreWorst: "+5,1%", spxPos: "76%", spxWorst: "−14,6%" },
    { horizon: "Horizonte 5 anos", corePos: "100%", coreWorst: "+20,6%", spxPos: "81%", spxWorst: "−2,7%" },
  ],
  endpointNote: "No backtest, nenhuma janela de 3 ou 5 anos iniciada no pico anual terminou negativa para o CORE22+. A tese não é eliminar volatilidade, mas reduzir a probabilidade de o investidor abandonar o plano no pior ponto do ciclo.",
  crisisDefense: [
    { crisis: "Bolha ponto-com (pico 2000)", spxDecline: "−47,4%", spxRec: "74,8 meses", coreDecline: "−18,6%", coreRec: "21,1 meses" },
    { crisis: "Crise financeira (pico 2007)", spxDecline: "−55,3%", spxRec: "54,6 meses", coreDecline: "−13,8% / −22,6%", coreRec: "7,5 / 6,9 meses" },
    { crisis: "COVID (fev. 2020)", spxDecline: "−33,8%", spxRec: "5,8 meses", coreDecline: "−17,2%", coreRec: "2,2 meses" },
    { crisis: "Bear market 2022", spxDecline: "−24,5%", spxRec: "23,6 meses", coreDecline: "−28,3%", coreRec: "14,2 meses" },
  ],
  crisisNote: "Transparência sobre pontos fracos faz parte do método: em 2022 o CORE22+ caiu mais que o S&P, mas recuperou em cerca de 60% do tempo.",
  economics: [
    { k: "Taxa de gestão", v: "2,00% a.a." },
    { k: "Taxa de performance", v: "20%" },
    { k: "Hurdle", v: "5% a.a." },
    { k: "High-water mark", v: "Sim" },
    { k: "Investimento mínimo", v: "USD 50.000" },
    { k: "Múltiplos", v: "USD 5.000" },
    { k: "Eficiência fiscal", v: "Sem come-cotas semestral brasileiro" },
  ],
  architecture: [
    { k: "Custódia segregada", v: "BNY Mellon" },
    { k: "Execução do mandato", v: "Interactive Brokers" },
    { k: "Auditoria externa", v: "Deloitte" },
    { k: "NAV diário", v: "Bloomberg" },
    { k: "Listagem", v: "Vienna Stock Exchange" },
    { k: "Admin. e liquidação", v: "Lynk Capital Markets" },
    { k: "Distribuição", v: "Wisen (global, ex-EUA)" },
  ],
  engineArchitecture: [
    { k: "Motor de ataque", v: "HC-US 3.1 CORE22+ — Momentum adaptativo por setor (S&P 500, 2 ações/setor)" },
    { k: "Seleção de ataque", v: "DEMA-cascade smoothed ROC · Tau calibrado por setor (28-189 dias)" },
    { k: "Motor de defesa", v: "HSA v6 — Proteção por pilar (COMPARTILHADO entre todos os portfólios)" },
    { k: "Camada 1 (defesa)", v: "Temperatura por pilar — turbulência × 0,40 + trend break × 0,35 + jerk × 0,25" },
    { k: "Camada 2 (defesa)", v: "Gate sistêmico — Cross-correlation (0,55 → 0,75) → fator g" },
    { k: "Camada 3 (defesa)", v: "Re-entry monitor — EMA 20 + velocidade + sizing gradual" },
    { k: "Regime", v: "Binário BULL / BEAR — StormGuard-Armor (SGA ≥ 0 = BULL, SGA < 0 = BEAR)" },
    { k: "Balanceamento", v: "Regime-based switching (COMPARTILHADO) — ataque em BULL, defesa em BEAR" },
    { k: "Rebalanceamento", v: "Mensal, sistemático" },
  ],
  purchaseSteps: [
    { n: 1, title: "Conta Lynk Markets", desc: "O MFO, gestor ou family office deve ter conta ativa na Lynk Markets. Onboarding: lynkmarkets.com." },
    { n: 2, title: "Definir produto e valor", desc: "Produto: HPC22 · ISIN XS3386635109. Mínimo USD 50k, em múltiplos de USD 5k." },
    { n: 3, title: "Envio da ordem", desc: "Ordem via LynkPort, e-mail, Bloomberg ou trading desk. COMPRA: valor, moeda, corretora/custodiante; Harpian apoia o roteamento." },
    { n: 4, title: "Instrução operacional", desc: "Data de liquidação, custodiante, liquidação Lynk." },
    { n: 5, title: "Confirmação e DvP", desc: "Lynk confirma. Liquidação via DvP Euroclear/Clearstream. Investidor recebe Notes/ETP." },
  ],
  purchaseData: [
    { k: "ISIN", v: "XS3386635109" },
    { k: "Issuer FI", v: "BNYM · EC 21625" },
    { k: "Euroclear", v: "21625" },
    { k: "Agent ID", v: "00093034" },
    { k: "DTC / MPID", v: "0901 / BKCM" },
    { k: "BIC", v: "IRTVUS3N" },
    { k: "Institutional ID", v: "00095441" },
  ],
  contacts: [
    { k: "Operações Lynk", v: "lynk.ops@lynkmarkets.com" },
    { k: "Trading desk", v: "lynk.trading@lynkmarkets.com" },
    { k: "Website Lynk", v: "lynkmarkets.com" },
    { k: "Telefone", v: "+1 929 900 5965" },
    { k: "Harpian", v: "contato@harpian.com" },
  ],
  disclaimer: "Performance hipotética / modelada. Os resultados baseiam-se em backtest da estratégia CORE22+ com dados de 1990–2025 e não representam contas reais de clientes. Resultados hipotéticos têm limitações inerentes: são preparados retrospectivamente, não envolvem risco financeiro real e não refletem decisões sob condições reais de mercado. Rentabilidade passada não garante retornos futuros. Comparações com o S&P 500 Total Return são ilustrativas. Harpian não recebe recursos, não executa ordens e não atua como custodiante. Documento confidencial — não constitui oferta ou recomendação.",
};

const HPC11: Fund = {
  id: "HPC11",
  ticker: "HPC11",
  name: "HPC11 · HC-US I.G.",
  strategy: "Investment Grade · perfil conservador",
  assetClass: "Listed institutional ETP",
  tagline: "Risk is measured. Capital is preserved. Return is built through method.",
  status: "Homologado",
  official: false,
  isin: "—",
  seals: ["Deloitte", "BNY Mellon", "Interactive Brokers", "Bloomberg", "Vienna Stock Exchange", "Lynk Capital Markets"],
  highlights: [
    { label: "CAGR (net)", value: "—", sub: "aguardando factsheet", tone: "gold" },
    { label: "Max. drawdown", value: "—", sub: "perfil conservador", tone: "gold" },
    { label: "Sortino", value: "—", sub: "aguardando factsheet", tone: "gold" },
    { label: "Classificação", value: "I.G.", sub: "Investment Grade", tone: "g" },
  ],
  productData: [
    { k: "Produto / Estratégia", v: "HPC11 · HC-US I.G." },
    { k: "Classe", v: "Investment Grade (conservador)" },
    { k: "Universo", v: "S&P 500 · I.G." },
    { k: "Regime", v: "Binário BULL / BEAR" },
    { k: "Defesa", v: "ETFs defensivos + almofada" },
    { k: "Rebalanceamento", v: "Mensal, sistemático" },
    { k: "Mínimo", v: "USD 50k (múltiplos de USD 5k)" },
    { k: "Elegibilidade", v: "Não residentes fiscais nos EUA" },
  ],
  performance: [
    { metric: "CAGR (36 anos)", gross: "—", net: "—", spx: "10,75%" },
    { metric: "Max. drawdown", gross: "—", net: "—", spx: "−55,3%" },
    { metric: "Ulcer Index", gross: "—", net: "—", spx: "13,93" },
    { metric: "Sharpe (rf 3,5%)", gross: "—", net: "—", spx: "0,55" },
    { metric: "Sortino (rf 3,5%)", gross: "—", net: "—", spx: "2,83" },
    { metric: "Anos negativos", gross: "—", net: "—", spx: "8" },
  ],
  perfNote: "Dados oficiais do HPC11 aguardando factsheet institucional. Estrutura espelhada do HPC22.",
  journeyRisk: [],
  endpointRisk: [],
  endpointNote: "",
  crisisDefense: [],
  crisisNote: "",
  economics: [
    { k: "Taxa de gestão", v: "2,00% a.a." },
    { k: "Taxa de performance", v: "20%" },
    { k: "Hurdle", v: "5% a.a." },
    { k: "High-water mark", v: "Sim" },
    { k: "Investimento mínimo", v: "USD 50.000" },
    { k: "Múltiplos", v: "USD 5.000" },
  ],
  architecture: [
    { k: "Custódia segregada", v: "BNY Mellon" },
    { k: "Execução do mandato", v: "Interactive Brokers" },
    { k: "Auditoria externa", v: "Deloitte" },
    { k: "NAV diário", v: "Bloomberg" },
    { k: "Listagem", v: "Vienna Stock Exchange" },
    { k: "Admin. e liquidação", v: "Lynk Capital Markets" },
  ],
  engineArchitecture: [
    { k: "Motor de ataque", v: "HC-US I.G. — Investment Grade conservador (S&P 500, universo I.G.)" },
    { k: "Seleção de ataque", v: "DEMA-cascade smoothed ROC · Tau calibrado por setor" },
    { k: "Motor de defesa", v: "HSA v6 — Proteção por pilar (COMPARTILHADO entre todos os portfólios)" },
    { k: "Camada 1 (defesa)", v: "Temperatura por pilar — turbulência × 0,40 + trend break × 0,35 + jerk × 0,25" },
    { k: "Camada 2 (defesa)", v: "Gate sistêmico — Cross-correlation (0,55 → 0,75) → fator g" },
    { k: "Camada 3 (defesa)", v: "Re-entry monitor — EMA 20 + velocidade + sizing gradual" },
    { k: "Regime", v: "Binário BULL / BEAR — StormGuard-Armor (SGA ≥ 0 = BULL, SGA < 0 = BEAR)" },
    { k: "Balanceamento", v: "Regime-based switching (COMPARTILHADO) — ataque em BULL, defesa em BEAR" },
    { k: "Defesa especial", v: "ETFs defensivos + almofada 60/40 (conservador)" },
    { k: "Rebalanceamento", v: "Mensal, sistemático" },
  ],
  purchaseSteps: [
    { n: 1, title: "Conta Lynk Markets", desc: "Conta ativa na Lynk Markets. Onboarding: lynkmarkets.com." },
    { n: 2, title: "Definir produto e valor", desc: "Produto: HPC11. Mínimo USD 50k, em múltiplos de USD 5k." },
    { n: 3, title: "Envio da ordem", desc: "Ordem via LynkPort, e-mail, Bloomberg ou trading desk." },
    { n: 4, title: "Instrução operacional", desc: "Data de liquidação, custodiante, liquidação Lynk." },
    { n: 5, title: "Confirmação e DvP", desc: "Lynk confirma. Liquidação via DvP Euroclear/Clearstream." },
  ],
  purchaseData: [
    { k: "ISIN", v: "aguardando" },
  ],
  contacts: [
    { k: "Operações Lynk", v: "lynk.ops@lynkmarkets.com" },
    { k: "Trading desk", v: "lynk.trading@lynkmarkets.com" },
    { k: "Harpian", v: "contato@harpian.com" },
  ],
  disclaimer: "Performance hipotética / modelada. Dados oficiais do HPC11 aguardando factsheet institucional. Rentabilidade passada não garante retornos futuros. Harpian não recebe recursos, não executa ordens e não atua como custodiante. Documento confidencial — não constitui oferta ou recomendação.",
};

const LCORE22: Fund = {
  id: "LCORE22",
  ticker: "LCORE22",
  name: "Lynk Core22 HPC",
  strategy: "Core22 MAX · Sector Momentum Rotation (AlphaDroid replica)",
  assetClass: "Listed institutional ETP",
  tagline: "22 sector-momentum sleeves, 12 stocks each, top-1 selection with StormGuard-Armor regime gate. Exact replica of the AlphaDroid CORE22+ MAX architecture.",
  status: "Laboratório",
  official: false,
  isin: "—",
  seals: ["Deloitte", "BNY Mellon", "Interactive Brokers", "Bloomberg", "Vienna Stock Exchange", "Lynk Capital Markets"],
  highlights: [
    { label: "CAGR 37 anos (gross)", value: "37,6%", sub: "S&P 500 TR: 11,6%", tone: "g" },
    { label: "Max. drawdown (gross)", value: "−26,0%", sub: "S&P 500: −55,3%", tone: "gold" },
    { label: "Sharpe (rf 3,5%)", value: "1,07", sub: "S&P 500: 0,55", tone: "g" },
    { label: "Upside / Downside Capture", value: "148% / 39%", sub: "Captura assimétrica", tone: "g" },
  ],
  productData: [
    { k: "Produto / Estratégia", v: "Lynk Core22 HPC · Core22 MAX" },
    { k: "Classe", v: "Sector Momentum Rotation (AlphaDroid replica)" },
    { k: "Motor", v: "22 sleeves × 12 ações = 264 ações monitoradas" },
    { k: "Seleção", v: "Top-1 momentum por sleeve (DEMA/EMA smoothed ROC)" },
    { k: "Setores", v: "11 GICS (Tech, Comm, ConsDisc, ConsStap, Fin, Health, Ind, Mat, RE, Energy, Util) + Bonds + BigTech" },
    { k: "Regime", v: "StormGuard-Armor (BULL ≥ 0 / BEAR < 0)" },
    { k: "Defesa", v: "Nuclear Defensive: bonds 58%, health 21%, energy 20%" },
    { k: "Rebalanceamento", v: "Mensal, sistemático, Tau calibrado por setor" },
    { k: "Mínimo", v: "USD 50k (múltiplos de USD 5k)" },
    { k: "Elegibilidade", v: "Não residentes fiscais nos EUA" },
  ],
  performance: [
    { metric: "CAGR (37,7 anos)", gross: "37,6%", net: "28,3%", spx: "11,6%" },
    { metric: "Max. drawdown", gross: "−26,0%", net: "−29,0%", spx: "−55,3%" },
    { metric: "Std. deviation", gross: "32,4%", net: "32,4%", spx: "—" },
    { metric: "Sharpe (rf 3,5%)", gross: "1,07", net: "0,93", spx: "0,55" },
    { metric: "Sortino (rf 3,5%)", gross: "12,30", net: "6,73", spx: "2,83" },
    { metric: "Anos negativos", gross: "1", net: "3", spx: "8" },
  ],
  perfNote: "Réplica exata da arquitetura AlphaDroid CORE22+ MAX (portfólio 829). Taxas modeladas: 2% a.a. gestão + 20% performance sobre hurdle 5% a.a. com high-water mark. Backtest 1988–2026.",
  journeyRisk: [
    { metric: "Nº de eventos (quedas ≥5%)", core: "111", spx: "42" },
    { metric: "Recuperação — mediana", core: "1,6 meses", spx: "2,7 meses" },
    { metric: "Recuperação — média", core: "2,6 meses", spx: "6,7 meses" },
    { metric: "% recuperado em ≤6 meses", core: "89%", spx: "83%" },
    { metric: "Pior tempo submerso", core: "21,1 meses", spx: "74,8 meses" },
    { metric: "Pior drawdown", core: "−26,0%", spx: "−55,3%" },
  ],
  endpointRisk: [
    { horizon: "Horizonte 3 anos", corePos: "100%", coreWorst: "+5,1%", spxPos: "76%", spxWorst: "−14,6%" },
    { horizon: "Horizonte 5 anos", corePos: "100%", coreWorst: "+20,6%", spxPos: "81%", spxWorst: "−2,7%" },
  ],
  endpointNote: "Nenhuma janela de 3 ou 5 anos iniciada no pico anual terminou negativa para o CORE22+ MAX. StormGuard-Armor atua como gate binário (~23% bear, 77% bull), capturando 148% do upside e apenas 39% do downside.",
  crisisDefense: [
    { crisis: "Bolha ponto-com (pico 2000)", spxDecline: "−47,4%", spxRec: "74,8 meses", coreDecline: "−18,6%", coreRec: "21,1 meses" },
    { crisis: "Crise financeira (pico 2007)", spxDecline: "−55,3%", spxRec: "54,6 meses", coreDecline: "−13,8% / −22,6%", coreRec: "7,5 / 6,9 meses" },
    { crisis: "COVID (fev. 2020)", spxDecline: "−33,8%", spxRec: "5,8 meses", coreDecline: "−17,2%", coreRec: "2,2 meses" },
    { crisis: "Bear market 2022", spxDecline: "−24,5%", spxRec: "23,6 meses", coreDecline: "−26,0%", coreRec: "14,2 meses" },
  ],
  crisisNote: "Em 2022 o CORE22+ MAX caiu ligeiramente mais que o S&P, mas recuperou em ~60% do tempo. StormGuard detectou todos os bear markets desde 1988 (56 episódios).",
  economics: [
    { k: "Taxa de gestão", v: "2,00% a.a." },
    { k: "Taxa de performance", v: "20%" },
    { k: "Hurdle", v: "5% a.a." },
    { k: "High-water mark", v: "Sim" },
    { k: "Investimento mínimo", v: "USD 50.000" },
    { k: "Múltiplos", v: "USD 5.000" },
    { k: "Eficiência fiscal", v: "Sem come-cotas semestral brasileiro" },
  ],
  architecture: [
    { k: "Custódia segregada", v: "BNY Mellon" },
    { k: "Execução do mandato", v: "Interactive Brokers" },
    { k: "Auditoria externa", v: "Deloitte" },
    { k: "NAV diário", v: "Bloomberg" },
    { k: "Listagem", v: "Vienna Stock Exchange" },
    { k: "Admin. e liquidação", v: "Lynk Capital Markets" },
    { k: "Distribuição", v: "Wisen (global, ex-EUA)" },
  ],
  engineArchitecture: [
    { k: "Motor de ataque", v: "AlphaDroid CORE22+ MAX — Réplica exata do motor de momento do Diogo (portfólio 829)" },
    { k: "Seleção de ataque", v: "DEMA-cascade T13 (Tau curto) — smoothed ROC por setor, top-1 por sleeve" },
    { k: "Universo de ataque", v: "22 sleeves × 12 ações = 264 ações · 11 GICS + Bonds + BigTech" },
    { k: "Tau por setor", v: "Tech 28-36d · Comm 55d · ConsDisc 55d · Fin 55d · Health 103-189d · Ind 55d · Mat 55d · RE 55d · Energy 55d · Util 55d" },
    { k: "Motor de defesa", v: "HSA v6 — Proteção por pilar (COMPARTILHADO entre todos os portfólios)" },
    { k: "Camada 1 (defesa)", v: "Temperatura por pilar — turbulência × 0,40 + trend break × 0,35 + jerk × 0,25" },
    { k: "Camada 2 (defesa)", v: "Gate sistêmico — Cross-correlation (0,55 → 0,75) → fator g" },
    { k: "Camada 3 (defesa)", v: "Re-entry monitor — EMA 20 + velocidade + sizing gradual" },
    { k: "Regime", v: "StormGuard-Armor (SGA ≥ 0 = BULL, SGA < 0 = BEAR) — 77% bull / 23% bear historicamente" },
    { k: "Defesa ativada", v: "Nuclear Defensive: bonds 58%, health 21%, energy 20%" },
    { k: "Balanceamento", v: "Regime-based switching (COMPARTILHADO) — ataque em BULL, defesa em BEAR" },
    { k: "Rebalanceamento", v: "Mensal, sistemático, Tau calibrado por setor" },
  ],
  purchaseSteps: [
    { n: 1, title: "Conta Lynk Markets", desc: "Conta ativa na Lynk Markets. Onboarding: lynkmarkets.com." },
    { n: 2, title: "Definir produto e valor", desc: "Produto: Lynk Core22 HPC. Mínimo USD 50k, em múltiplos de USD 5k." },
    { n: 3, title: "Envio da ordem", desc: "Ordem via LynkPort, e-mail, Bloomberg ou trading desk." },
    { n: 4, title: "Instrução operacional", desc: "Data de liquidação, custodiante, liquidação Lynk." },
    { n: 5, title: "Confirmação e DvP", desc: "Lynk confirma. Liquidação via DvP Euroclear/Clearstream." },
  ],
  purchaseData: [
    { k: "ISIN", v: "aguardando" },
  ],
  contacts: [
    { k: "Operações Lynk", v: "lynk.ops@lynkmarkets.com" },
    { k: "Trading desk", v: "lynk.trading@lynkmarkets.com" },
    { k: "Website Lynk", v: "lynkmarkets.com" },
    { k: "Telefone", v: "+1 929 900 5965" },
    { k: "Harpian", v: "contato@harpian.com" },
  ],
  disclaimer: "Performance hipotética / modelada. Réplica exata da arquitetura AlphaDroid CORE22+ MAX. Backtest 1988–2026. Resultados hipotéticos têm limitações inerentes: são preparados retrospectivamente, não envolvem risco financeiro real e não refletem decisões sob condições reais de mercado. Rentabilidade passada não garante retornos futuros. Harpian não recebe recursos, não executa ordens e não atua como custodiante. Documento confidencial — não constitui oferta ou recomendação.",
};

export const FUNDS: Record<string, Fund> = { HPC22, HPC11, LCORE22 };
export const FUND_LIST = [HPC22, HPC11, LCORE22];

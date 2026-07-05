// Clientes do MFO (mock). Carteiras em BRL (investidores brasileiros).
export interface Alloc { label: string; pct: number; tone?: "g" | "r" | "gold" }
export interface ImportedPosition { ticker: string; qty: number; avgPrice: number }

// Dados pessoais/cadastrais — separados do perfil de risco (aba própria na edição).
export interface PersonalData {
  cpfCnpj?: string;
  phone?: string;
  address?: string;
  responsavel?: string; // pessoa de contato no family office/instituição
}

// Uma conta em um banco/corretora/custodiante — o cliente pode ter várias.
export interface Account {
  id: string;
  bank: string;                 // nome do banco/corretora
  type: "Conta corrente" | "Corretora" | "Custódia" | "Outro";
  agency?: string;
  accountNumber?: string;
  custodian?: string;           // custodiante, se diferente do banco
  notes?: string;
}

// Um portfólio — o cliente pode ter vários (um por banco/conta, por exemplo).
export interface Portfolio {
  id: string;
  name: string;                 // ex.: "Carteira XP", "Carteira Itaú Private"
  accountId?: string;           // referência a Account.id
  positions: ImportedPosition[];
}

// Conexão com o sistema de gestão do próprio MFO (fase 2: sincronização real).
export interface ApiIntegration {
  id: string;
  system: string;                // nome do sistema (ex.: Comdinheiro, sistema interno)
  baseUrl?: string;
  apiKey?: string;                // mascarado na UI
  status: "conectado" | "a configurar" | "erro";
  lastSync?: string;
}

export interface Client {
  id: string;
  name: string;
  type: string;         // Family Office / Pessoa Física / Institucional
  profile: "Conservador" | "Moderado" | "Agressivo";
  since: string;        // mês/ano de início
  invested: number;     // BRL
  current: number;      // BRL
  riskNumber: number;   // 0–100
  mandate: number;      // teto contratual
  harpianPct: number;   // % alocado em HPC
  alloc: Alloc[];
  note?: string;
  email?: string;
  importedPositions?: ImportedPosition[]; // planilha importada (Importar/conectar) — legado, 1 portfólio só
  personalData?: PersonalData;
  accounts?: Account[];
  portfolios?: Portfolio[];
  integrations?: ApiIntegration[];
}

export const CLIENTS: Client[] = [
  {
    id: "vera", name: "Vera Hollanda", type: "Family Office", profile: "Moderado",
    since: "03/2023", invested: 7_200_000, current: 8_200_000, riskNumber: 78, mandate: 62, harpianPct: 0,
    alloc: [
      { label: "Renda fixa BR", pct: 52 },
      { label: "Ações BR", pct: 28 },
      { label: "Multimercado", pct: 20 },
      { label: "HPC (Harpian)", pct: 0, tone: "r" },
    ],
    note: "100% fora da Harpian, sem a camada de defesa. Oportunidade: migrar parte para o HPC11/HPC22.",
    // 2 portfólios em 2 bancos — estilo "Investimento Brasil" (Itaú) + "Investimento Exterior" (XP),
    // igual os modelos de referência da apresentação (lente-3-portfolio.html).
    accounts: [
      { id: "vera-itau", bank: "Itaú Private", type: "Custódia", agency: "0910", accountNumber: "18.442-1" },
      { id: "vera-xp", bank: "XP Investimentos", type: "Corretora", accountNumber: "XP-772104" },
    ],
    portfolios: [
      {
        id: "vera-p1", name: "Carteira Itaú · Brasil", accountId: "vera-itau",
        positions: [
          { ticker: "PETR4.SA", qty: 20000, avgPrice: 30 },
          { ticker: "VALE3.SA", qty: 15000, avgPrice: 65 },
          { ticker: "ITUB4.SA", qty: 30000, avgPrice: 30 },
          { ticker: "BOVA11.SA", qty: 10000, avgPrice: 130 },
        ],
      },
      {
        id: "vera-p2", name: "Carteira XP · Exterior (All Weather)", accountId: "vera-xp",
        positions: [
          { ticker: "SPY", qty: 3000, avgPrice: 500 },
          { ticker: "TLT", qty: 5000, avgPrice: 85 },
          { ticker: "GLD", qty: 2000, avgPrice: 370 },
        ],
      },
    ],
  },
  {
    id: "silveira", name: "Silveira Family Office", type: "Family Office", profile: "Agressivo",
    since: "08/2022", invested: 12_000_000, current: 15_400_000, riskNumber: 71, mandate: 70, harpianPct: 8,
    alloc: [
      { label: "Ações US", pct: 40 },
      { label: "Ações BR", pct: 22 },
      { label: "Cripto", pct: 18 },
      { label: "Multimercado", pct: 12 },
      { label: "HPC (Harpian)", pct: 8, tone: "gold" },
    ],
    note: "Levemente acima do mandato; sem proteção estruturada na parte de risco.",
    // 3 portfólios em 3 bancos — Itaú (Brasil + exterior misturado), Santander (cripto/tech),
    // Bank of America (US mega-cap) — o cliente-exemplo com mais bancos, pra testar o leiaute.
    accounts: [
      { id: "silv-itau", bank: "Itaú Private", type: "Custódia", accountNumber: "IT-90234" },
      { id: "silv-santander", bank: "Santander Private Banking", type: "Corretora", accountNumber: "SAN-44120" },
      { id: "silv-boa", bank: "Bank of America Private Bank", type: "Corretora", accountNumber: "BOA-US-33871" },
    ],
    portfolios: [
      {
        id: "silv-p1", name: "Carteira Itaú (Brasil + Exterior)", accountId: "silv-itau",
        positions: [
          { ticker: "PETR4.SA", qty: 10000, avgPrice: 30 },
          { ticker: "VALE3.SA", qty: 8000, avgPrice: 65 },
          { ticker: "SPY", qty: 2000, avgPrice: 500 },
          { ticker: "QQQ", qty: 1000, avgPrice: 480 },
        ],
      },
      {
        id: "silv-p2", name: "Carteira Santander (Cripto)", accountId: "silv-santander",
        positions: [
          { ticker: "BTC-USD", qty: 5, avgPrice: 45000 },
          { ticker: "ETH-USD", qty: 50, avgPrice: 2000 },
          { ticker: "AMZN", qty: 500, avgPrice: 180 },
        ],
      },
      {
        id: "silv-p3", name: "Carteira Bank of America (US)", accountId: "silv-boa",
        positions: [
          { ticker: "AAPL", qty: 2000, avgPrice: 200 },
          { ticker: "MSFT", qty: 1000, avgPrice: 380 },
          { ticker: "NVDA", qty: 500, avgPrice: 150 },
        ],
      },
    ],
  },
  {
    id: "marazul", name: "Instituto MarAzul", type: "Institucional (endowment)", profile: "Conservador",
    since: "01/2024", invested: 20_000_000, current: 21_100_000, riskNumber: 32, mandate: 40, harpianPct: 15,
    alloc: [
      { label: "Renda fixa BR", pct: 58 },
      { label: "Renda fixa global", pct: 15 },
      { label: "HPC11 (Harpian)", pct: 15, tone: "g" },
      { label: "Ações BR", pct: 12 },
    ],
    note: "Bem dentro do mandato. Perfil de preservação com a camada de defesa da Harpian.",
    // Estilo "Endowment (Yale)" da apresentação: diversificação ampla, foco em preservação.
    accounts: [{ id: "maz-bny", bank: "BNY Mellon", type: "Custódia", accountNumber: "BNYM-EC21625" }],
    portfolios: [
      {
        id: "maz-p1", name: "Endowment · estilo Yale", accountId: "maz-bny",
        positions: [
          { ticker: "AGG", qty: 20000, avgPrice: 98 },
          { ticker: "TLT", qty: 10000, avgPrice: 85 },
          { ticker: "GLD", qty: 3000, avgPrice: 370 },
          { ticker: "VTI", qty: 5000, avgPrice: 280 },
        ],
      },
    ],
  },
  {
    id: "ricardo", name: "Ricardo Menezes", type: "Pessoa Física", profile: "Moderado",
    since: "11/2023", invested: 3_500_000, current: 4_000_000, riskNumber: 58, mandate: 60, harpianPct: 22,
    alloc: [
      { label: "Ações US", pct: 30 },
      { label: "HPC22 (Harpian)", pct: 22, tone: "gold" },
      { label: "Renda fixa BR", pct: 28 },
      { label: "Multimercado", pct: 20 },
    ],
    note: "Alinhado ao mandato. Bom candidato a aumentar a alocação no HPC.",
    // Estilo "All Weather (Bridgewater)" da apresentação: risk parity — equity, treasuries, ouro, commodities.
    accounts: [{ id: "ric-btg", bank: "BTG Pactual", type: "Corretora", accountNumber: "BTG-551029" }],
    portfolios: [
      {
        id: "ric-p1", name: "Carteira BTG · All Weather (Bridgewater)", accountId: "ric-btg",
        positions: [
          { ticker: "SPY", qty: 2000, avgPrice: 500 },
          { ticker: "TLT", qty: 8000, avgPrice: 85 },
          { ticker: "IEF", qty: 12000, avgPrice: 95 },
          { ticker: "GLD", qty: 2000, avgPrice: 370 },
          { ticker: "DBC", qty: 12000, avgPrice: 22 },
        ],
      },
    ],
  },
  {
    id: "aurora", name: "Aurora Capital MFO", type: "Institucional", profile: "Agressivo",
    since: "05/2023", invested: 30_000_000, current: 39_000_000, riskNumber: 66, mandate: 68, harpianPct: 30,
    alloc: [
      { label: "Ações US", pct: 35 },
      { label: "HPC22 (Harpian)", pct: 30, tone: "gold" },
      { label: "Ações globais", pct: 20 },
      { label: "Renda fixa", pct: 15 },
    ],
    note: "Maior alocação Harpian da base. Dentro do mandato com retorno forte.",
    // Estilo "Equity-Heavy Growth / Só Exterior" da apresentação — 100% ações US, alta concentração tech.
    accounts: [{ id: "aur-ibkr", bank: "Interactive Brokers", type: "Corretora", accountNumber: "IBKR-U15982774" }],
    portfolios: [
      {
        id: "aur-p1", name: "Carteira IBKR · Só Exterior (Growth)", accountId: "aur-ibkr",
        positions: [
          { ticker: "NVDA", qty: 8000, avgPrice: 150 },
          { ticker: "AAPL", qty: 10000, avgPrice: 200 },
          { ticker: "MSFT", qty: 8000, avgPrice: 380 },
          { ticker: "GOOGL", qty: 6000, avgPrice: 300 },
          { ticker: "AMZN", qty: 6000, avgPrice: 180 },
        ],
      },
    ],
  },
  {
    id: "helena", name: "Helena Prado", type: "Pessoa Física", profile: "Conservador",
    since: "04/2024", invested: 1_800_000, current: 1_900_000, riskNumber: 41, mandate: 38, harpianPct: 5,
    alloc: [
      { label: "Renda fixa BR", pct: 62 },
      { label: "Multimercado", pct: 21 },
      { label: "Ações BR", pct: 12 },
      { label: "HPC11 (Harpian)", pct: 5, tone: "g" },
    ],
    note: "Levemente acima do mandato conservador. Migrar parte para HPC11 reduz o risco.",
    // Estilo "Family Office BR padrão / Investimento Brasil" — mesmos tickers reais do
    // modelo P1 Conservador Brasil (80% Brasil / 20% EUA) usado na Análise USD.
    accounts: [{ id: "hel-itau", bank: "Itaú", type: "Conta corrente", accountNumber: "IT-22841" }],
    portfolios: [
      {
        id: "hel-p1", name: "Conservador · Brasil (modelo P1)", accountId: "hel-itau",
        positions: [
          { ticker: "BOVA11.SA", qty: 3000, avgPrice: 130 },
          { ticker: "ITUB4.SA", qty: 8000, avgPrice: 30 },
          { ticker: "AGG", qty: 3000, avgPrice: 98 },
          { ticker: "TLT", qty: 1500, avgPrice: 85 },
        ],
      },
    ],
  },
];

export const clientById = (id: string) => CLIENTS.find((c) => c.id === id) || CLIENTS[0];
export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

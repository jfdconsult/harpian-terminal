// Clientes do MFO (mock). Carteiras em BRL (investidores brasileiros).
export interface Alloc { label: string; pct: number; tone?: "g" | "r" | "gold" }
export interface ImportedPosition { ticker: string; qty: number; avgPrice: number }
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
  importedPositions?: ImportedPosition[]; // planilha importada (Importar/conectar)
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
  },
];

export const clientById = (id: string) => CLIENTS.find((c) => c.id === id) || CLIENTS[0];
export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/**
 * Yield medio do Treasury de 30 anos por ano-calendario, em fracao decimal.
 *
 * Fonte: FRED DGS30 (Market Yield on U.S. Treasury Securities at 30-Year
 * Constant Maturity), media aritmetica dos yields diarios de cada ano.
 * Baixado em 2026-08-11. Copia crua em data/strategies/hurdle-30y.json.
 *
 * USO: piso do hurdle da taxa de performance —
 *   hurdle_do_ano = max(5% contratual, DGS30 medio do ano)
 * Cobrar performance sobre o que um titulo soberano de 30 anos teria pago
 * no mesmo periodo nao remunera gestao; o cliente conseguiria aquilo sem
 * gestor. Por isso o piso e movel.
 *
 * NOTA MEDIDA: em 2006-2026 o DGS30 NUNCA superou 5% (maximo 4,93% em 2026),
 * entao nesta janela historica o piso contratual sempre prevaleceu e a regra
 * dinamica nao altera nenhum numero de backtest. Ela existe para o futuro —
 * o 30 anos vinha subindo e ja encostou no piso.
 *
 * Para atualizar: refazer o download do CSV do FRED e regerar este arquivo.
 */
export const HURDLE_30Y: Record<string, number> = {
  "2006": 0.0488,
  "2007": 0.04838,
  "2008": 0.04278,
  "2009": 0.04077,
  "2010": 0.04251,
  "2011": 0.03911,
  "2012": 0.02922,
  "2013": 0.03446,
  "2014": 0.03338,
  "2015": 0.02841,
  "2016": 0.02594,
  "2017": 0.02894,
  "2018": 0.03112,
  "2019": 0.0258,
  "2020": 0.01556,
  "2021": 0.02056,
  "2022": 0.03113,
  "2023": 0.04095,
  "2024": 0.04407,
  "2025": 0.04777,
  "2026": 0.04931,
};

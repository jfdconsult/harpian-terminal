// ============================================================
// FEES · calculo de retorno LIQUIDO apos taxas
// ------------------------------------------------------------
// A convencao da Harpian:
//   Taxa de administracao: 2% ao ano (aplicada pro-rata diario)
//   Taxa de performance:   20% sobre o EXCESSO acima do hurdle de 5% aa
//                          (apurada anualmente, sobre o retorno do ano-calendario)
//
// Fluxo:
//   R_bruto_dia:            retorno diario bruto do portfolio (do motor)
//   R_liquido_dia:          R_bruto_dia menos a fracao diaria de adm
//                           (perf sacada uma vez por ano, no ultimo pregao)
//
// Compounding no ano seguinte:
//   o capital que entra em ano N+1 e o capital LIQUIDO do fim de ano N.
//   como aplicamos ambas as taxas dia-a-dia (adm) e no ultimo dia (perf), o
//   compounding acontece naturalmente pelo produto (1 + R_liquido_dia).
// ============================================================

import { HURDLE_30Y } from "./hurdle-30y";

export interface FeeConfig {
  /** Taxa de administracao anual (ex.: 0.02 = 2% aa). Aplicada pro-rata diario. */
  adm: number;
  /** Taxa de performance sobre excesso (ex.: 0.20 = 20%). Apurada anualmente. */
  perf: number;
  /**
   * PISO do hurdle anual (ex.: 0.05 = 5% aa). O hurdle efetivo de cada ano e
   * `max(hurdle, hurdlePorAno[ano])` — a politica Harpian cobra performance
   * sobre o que exceder o MAIOR entre o piso contratual e o juro soberano de
   * 30 anos, porque entregar o que um Treasury entregaria nao e gestao.
   */
  hurdle: number;
  /**
   * Yield do Treasury de 30 anos por ano-calendario ("2008": 0.0432).
   * Ausente => usa so o piso `hurdle`. Ver data/strategies/hurdle-30y.json.
   */
  hurdlePorAno?: Record<string, number>;
  /**
   * Custo de execucao anualizado (0.005 = 0,5% aa), deduzido pro-rata diario
   * ANTES das taxas. Modela corretagem + spread do giro da carteira.
   *
   * Vem antes da adm e da perf de proposito: custo de execucao sai do NAV no
   * momento do trade, entao o retorno que o gestor "entregou" ja e liquido
   * dele — e e sobre esse retorno entregue que a taxa de performance incide.
   * Cobrar perf sobre um retorno que o cliente nao recebeu seria indefensavel.
   */
  custoExecucaoAno?: number;
  /** Se `false`, NAO cobra taxa de performance (so admin). Usado no
   *  Institucional Dinamico — perfil conservador demais para justificar perf. */
  perfEnabled?: boolean;
  /** Dias uteis por ano usados para pro-rata (padrao 252). */
  diasAno?: number;
}

/** Politica padrao Harpian: admin 2% + perf 20% sobre excesso de 5%. */
export const FEE_HARPIAN_DEFAULT: FeeConfig = {
  adm: 0.02,
  perf: 0.20,
  hurdle: 0.05,
  perfEnabled: true,
  diasAno: 252,
};

/**
 * @deprecated Nao mais usada por politicaDoSet — mantida so para nao quebrar
 * import direto em algum script antigo. A regra de isencao de performance para
 * SETs institucionais foi REVOGADA em 18/08/2026 (decisao do Joao: "SEMPRE
 * havera cobranca de 2% adm + 20% performance o que exceder 5% a.a., sempre" —
 * sem excecao para nenhum perfil, incluindo o Institucional Dinamico).
 */
export const FEE_INSTITUCIONAL: FeeConfig = {
  adm: 0.02,
  perf: 0.20,
  hurdle: 0.05,
  perfEnabled: false,
  diasAno: 252,
};

/**
 * Retorna a politica de taxas do SET.
 *
 * REGRA UNICA, sem excecao por perfil (decisao do Joao, 18/08/2026): todo SET
 * paga 2% adm + 20% de performance sobre o que exceder o hurdle de 5% a.a.
 * (ou o Treasury de 30 anos do ano, se maior), com marca d'agua. Isso revoga a
 * isencao que existia para SETs institucionais (`FEE_INSTITUCIONAL`, acima) —
 * inclusive o Institucional Dinamico (`suavemin15`/`dsuave`), que antes era
 * vendido como "so admin, sem performance".
 */
export function politicaDoSet(setId: string | undefined | null): FeeConfig {
  // O hurdle movel entra aqui e nao em cada chamador — assim tela, relatorio
  // e qualquer script novo herdam a mesma politica sem precisar lembrar dela.
  return { ...FEE_HARPIAN_DEFAULT, hurdlePorAno: HURDLE_30Y };
}

/** Descricao textual da politica de taxas (para o cabecalho do relatorio). */
export function descrevehTaxas(cfg: FeeConfig = FEE_HARPIAN_DEFAULT): string {
  const adm = (cfg.adm * 100).toFixed(cfg.adm >= 0.01 ? 0 : 1);
  if (cfg.perfEnabled === false) {
    return `Taxa de administração ${adm}% aa (pro-rata diária) · Sem taxa de performance neste perfil`;
  }
  const perf = (cfg.perf * 100).toFixed(0);
  const hurdle = (cfg.hurdle * 100).toFixed(0);
  return `Taxa de administração ${adm}% aa (pro-rata diária) · Taxa de performance ${perf}% ` +
    `sobre o ganho do ano que superar a marca d'água histórica corrigida pelo hurdle — ` +
    `o maior entre ${hurdle}% e o Treasury de 30 anos do ano. Após uma queda, não há ` +
    `performance até o patrimônio reconquistar o topo anterior`;
}

/**
 * Aplica taxas de administracao e performance sobre uma serie de retornos
 * diarios. Retorna a serie liquida e um resumo dos fees deduzidos.
 *
 * @param retornosDiarios  Retornos diarios BRUTOS (fracao decimal, ex 0.001 = 0.1%).
 * @param datas            Datas ISO alinhadas com retornosDiarios ("YYYY-MM-DD").
 * @param cfg              Configuracao de taxas (default = padrao Harpian).
 */
export function apurarLiquido(
  retornosDiarios: number[],
  datas: string[],
  cfg: FeeConfig = FEE_HARPIAN_DEFAULT,
): {
  liquido: number[];
  totalAdm: number;    // fracao do capital total consumida por adm ao longo da janela
  totalPerf: number;   // idem para perf
  porAno: Array<{ ano: string; bruto: number; exec: number; adm: number; perf: number; liquido: number }>;
} {
  const n = retornosDiarios.length;
  const diasAno = cfg.diasAno ?? 252;
  const admDia = cfg.adm / diasAno;
  const execDia = (cfg.custoExecucaoAno ?? 0) / diasAno;

  const liquido = new Array<number>(n);
  const porAno: Array<{ ano: string; bruto: number; exec: number; adm: number; perf: number; liquido: number }> = [];

  // acumulador anual
  let anoAtual = datas[0]?.slice(0, 4) ?? "";
  let acumBrutoAno = 1;
  let acumEntregueAno = 1;   // bruto ja liquido de custo de execucao
  let acumLiqAno = 1;
  let admAno = 0;
  let execAno = 0;

  let totalAdm = 0;
  let totalPerf = 0;
  let cumBruto = 1;
  let cumLiq = 1;

  /**
   * MARCA D'AGUA — topo historico do NAV entregue (base 1) sobre o qual a
   * performance e apurada. So sobe: depois de uma queda, o cliente nao volta
   * a pagar performance ate reconquistar o topo anterior.
   */
  let navHWM = 1;

  for (let i = 0; i < n; i++) {
    const rB = retornosDiarios[i];
    // custo de execucao sai primeiro: e o retorno que o gestor ENTREGOU
    const rEntregue = (1 + rB) * (1 - execDia) - 1;
    // depois a administracao, tambem dia-a-dia (multiplicativa)
    const rLpre = (1 + rEntregue) * (1 - admDia) - 1;
    // acumuladores
    cumBruto *= 1 + rB;
    cumLiq *= 1 + rLpre;
    acumBrutoAno *= 1 + rB;
    acumEntregueAno *= 1 + rEntregue;
    acumLiqAno *= 1 + rLpre;
    admAno += admDia;   // aproximacao aditiva pro reporting (nao afeta calculo)
    execAno += execDia; // idem
    liquido[i] = rLpre;

    // fim do ano-calendario: acerta performance
    const anoDia = datas[i].slice(0, 4);
    const proxAno = i + 1 < n ? datas[i + 1].slice(0, 4) : null;
    const virandoAno = proxAno !== null && proxAno !== anoDia;
    const ultimoDia = i === n - 1;

    if (virandoAno || ultimoDia) {
      const rBrutoAno = acumBrutoAno - 1;
      const rEntregueAno = acumEntregueAno - 1;  // ja liquido de custo de execucao
      const rLiqAntesPerf = acumLiqAno - 1;

      // HURDLE DO ANO: o maior entre o piso contratual e o juro de 30 anos
      // daquele ano-calendario. Cobrar performance sobre um retorno que o
      // cliente teria obtido num titulo soberano nao remunera gestao.
      const hurdleAno = Math.max(cfg.hurdle, cfg.hurdlePorAno?.[anoAtual] ?? 0);

      // MARCA D'AGUA (high-water mark), em NAV ABSOLUTO — nao em retorno do
      // ano. A performance so incide sobre o que supera o TOPO HISTORICO ja
      // taxado, corrigido pelo hurdle do ano. Sem isso o cliente paga duas
      // vezes pela mesma valorizacao: paga no ano bom, o portfolio cai, e
      // paga de novo ao reconquistar terreno que ja era dele.
      //
      // Raciocinar em fracao do ano NAO funciona aqui: a marca se cancela na
      // divisao e a formula degenera de volta para "excesso = retorno do ano
      // menos hurdle", que e exatamente o comportamento sem marca. E preciso
      // comparar patrimonio contra patrimonio.
      //
      // `cumLiq` neste ponto ja e o NAV liquido do fim do ano ANTES da perf
      // (exec e adm ja sairam dia a dia), com base 1 = capital inicial.
      const navAntesPerf = cumLiq;
      const navInicioAno = acumLiqAno !== 0 ? navAntesPerf / acumLiqAno : navAntesPerf;
      const alvo = navHWM * (1 + hurdleAno);
      const excessoNav = cfg.perfEnabled === false ? 0 : Math.max(0, navAntesPerf - alvo);
      const perfAbs = cfg.perf * excessoNav;
      const navAposPerf = navAntesPerf - perfAbs;

      // perf como fracao do capital do INICIO do ano — e assim que a tabela
      // anual do relatorio reporta, ao lado de bruto/exec/adm.
      const perfPct = navInicioAno > 0 ? perfAbs / navInicioAno : 0;
      const rLiqAno = navInicioAno > 0 ? navAposPerf / navInicioAno - 1 : 0;

      // empurra o saque da perf para o retorno do ULTIMO DIA do ano
      const fatorAjuste = navAntesPerf > 0 ? navAposPerf / navAntesPerf : 1;
      liquido[i] = (1 + liquido[i]) * fatorAjuste - 1;
      cumLiq = navAposPerf;

      porAno.push({
        ano: anoAtual,
        bruto: rBrutoAno,
        exec: execAno,
        adm: admAno,
        perf: perfPct,
        liquido: rLiqAno,
      });
      totalPerf += cumLiq > 0 ? perfAbs / cumLiq : 0;

      // A marca sobe para o NAV JA descontada a performance — e sobre o
      // patrimonio que ficou que a proxima apuracao incide. Nunca desce: e
      // esse "nunca desce" que impede a cobranca em duplicidade.
      navHWM = Math.max(navHWM, navAposPerf);

      // reset para proximo ano
      anoAtual = proxAno ?? anoAtual;
      acumBrutoAno = 1;
      acumEntregueAno = 1;
      acumLiqAno = 1;
      admAno = 0;
      execAno = 0;
    }
  }

  totalAdm = cumBruto - cumLiq * (1 + totalPerf); // aproximacao
  totalAdm = Math.max(0, totalAdm);

  return { liquido, totalAdm, totalPerf, porAno };
}

/** Retorna a curva de capital LIQUIDA a partir do liquido diario. */
export function curvaLiquida(retLiquido: number[], capitalInicial: number): number[] {
  const out = new Array<number>(retLiquido.length + 1);
  out[0] = capitalInicial;
  for (let i = 0; i < retLiquido.length; i++) {
    out[i + 1] = out[i] * (1 + retLiquido[i]);
  }
  return out;
}

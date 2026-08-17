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

export interface FeeConfig {
  /** Taxa de administracao anual (ex.: 0.02 = 2% aa). Aplicada pro-rata diario. */
  adm: number;
  /** Taxa de performance sobre excesso (ex.: 0.20 = 20%). Apurada anualmente. */
  perf: number;
  /** Hurdle rate anual acima do qual a perf incide (ex.: 0.05 = 5% aa). */
  hurdle: number;
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

/** Politica do Institucional Dinamico: SO admin, sem perf. */
export const FEE_INSTITUCIONAL: FeeConfig = {
  adm: 0.02,
  perf: 0.20,
  hurdle: 0.05,
  perfEnabled: false,
  diasAno: 252,
};

/**
 * Retorna a politica de taxas apropriada para um SET.
 * REGRA: SET com perfil Institucional NAO paga perf. Casamos pelo sufixo `ins`
 * do id (com versao opcional) para a regra valer em qualquer familia — hoje
 * `d105ins` da 10.5 e `d4mins` da 4 MOTORES.
 */
export function politicaDoSet(setId: string | undefined | null): FeeConfig {
  if (setId && /ins(-v\d+)?$/.test(setId)) return FEE_INSTITUCIONAL;
  return FEE_HARPIAN_DEFAULT;
}

/** Descricao textual da politica de taxas (para o cabecalho do relatorio). */
export function descrevehTaxas(cfg: FeeConfig = FEE_HARPIAN_DEFAULT): string {
  const adm = (cfg.adm * 100).toFixed(cfg.adm >= 0.01 ? 0 : 1);
  if (cfg.perfEnabled === false) {
    return `Taxa de administração ${adm}% aa (pro-rata diária) · Sem taxa de performance neste perfil`;
  }
  const perf = (cfg.perf * 100).toFixed(0);
  const hurdle = (cfg.hurdle * 100).toFixed(0);
  return `Taxa de administração ${adm}% aa (pro-rata diária) · Taxa de performance ${perf}% sobre o retorno anual bruto que exceder ${hurdle}%`;
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
      // Perf sobre o excesso do retorno ENTREGUE (bruto menos custo de
      // execucao) acima do hurdle — nao sobre o bruto: o custo de execucao ja
      // saiu do NAV, entao o cliente nunca viu aquele pedaco. DESLIGADA quando
      // perfEnabled === false (caso do Institucional).
      const excesso = cfg.perfEnabled === false ? 0 : Math.max(0, rEntregueAno - cfg.hurdle);
      const perfPct = cfg.perf * excesso;
      // aplica perf no ULTIMO dia do ano-calendario, sacando do NAV entregue
      const capEntregueAno = 1 + rEntregueAno;
      const perfSacada = perfPct * capEntregueAno;
      const capLiqAposPerf = (1 + rLiqAntesPerf) - perfSacada;
      const rLiqAno = capLiqAposPerf - 1;

      // desconta o efeito da perf no retorno do ULTIMO DIA (empurra para o dia)
      const fatorAjuste = (1 + rLiqAno) / (1 + rLiqAntesPerf);
      liquido[i] = (1 + liquido[i]) * fatorAjuste - 1;

      // reajusta cumLiq
      cumLiq *= fatorAjuste;

      porAno.push({
        ano: anoAtual,
        bruto: rBrutoAno,
        exec: execAno,
        adm: admAno,
        perf: perfPct,
        liquido: rLiqAno,
      });
      totalPerf += perfSacada / cumLiq; // fracao do capital consumida por perf
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

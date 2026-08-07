// ============================================================
// CUSTOS DE EXECUCAO — estimativa de corretagem + spread (Interactive Brokers)
// ------------------------------------------------------------
// POR QUE ISTO EXISTE
// O disclosure do relatorio admite que o backtest "nao reflete custos
// operacionais efetivos, spreads, slippage". Admitir e correto, mas deixar o
// numero em aberto e pior do que estimar: um alocador institucional que ve
// 2.131 trocas de ticker quer saber quanto isso custa. Mesmo que de 0,1% ao
// ano, ter a memoria de calculo na mesa fecha a pergunta antes dela ser feita.
//
// O QUE ESTE MODULO NAO FAZ
// Nao deduz nada das curvas nem dos numeros bruto/liquido. E uma estimativa
// de ORDEM DE GRANDEZA, exibida ao lado do giro. Os custos reais dependem de
// tamanho de conta, tier de comissao, horario de execucao, liquidez do papel
// no dia e tipo de ordem — nenhum deles esta no dataset.
//
// COMO A CONTA E MONTADA
// Uma TROCA de ticker = 2 ordens: vende o papel que sai, compra o que entra.
// O tamanho de cada ordem e o peso daquela estrategia no portfolio vezes o
// patrimonio medio da janela (usar o capital inicial subestimaria os anos
// finais, quando a carteira ja cresceu).
//
//   ordens/ano    = Σ (trocas_i × 2) / anos
//   notional/ano  = Σ (trocas_i × 2 × peso_i × patrimonio_medio) / anos
//   spread        = notional × spread_cheio_bps / 10.000
//                   (PIOR CASO: cobra o spread inteiro em CADA ordem, o dobro
//                    da convencao de meio spread por ponta — ver comentario
//                    no calculo)
//   comissao      = ordens × max(minimo, por_acao × acoes_da_ordem), teto de
//                   1% do valor da ordem
//   regulatorio   = so no lado da venda (metade do notional): taxa SEC + TAF
// ============================================================

/** Premissas de custo. Todas explicitas de proposito — vao impressas no relatorio. */
export interface PremissasCusto {
  /** Comissao por acao, em USD. IBKR Pro Tiered (acoes/ETFs US). */
  comissaoPorAcao: number;
  /** Piso de comissao por ordem, em USD. */
  minimoPorOrdem: number;
  /** Teto de comissao como fracao do valor da ordem (0.01 = 1%). */
  tetoPctOrdem: number;
  /** Preco medio por acao assumido, em USD — converte notional em quantidade. */
  precoMedioAcao: number;
  /** Spread bid-ask CHEIO, em basis points. Large caps/ETFs US liquidos. */
  spreadBps: number;
  /** Taxa SEC sobre vendas, em basis points do valor vendido. */
  secFeeBpsVenda: number;
  /** FINRA TAF por acao vendida, em USD. */
  finraTafPorAcaoVenda: number;
}

/**
 * Premissas conservadoras para acoes e ETFs americanos liquidos via IBKR Pro
 * (tabela Tiered). Sao PREMISSAS, nao a tabela vigente da corretora — tarifas
 * mudam e variam por volume mensal, tier e classe de ativo.
 */
export const CUSTO_IB_PADRAO: PremissasCusto = {
  comissaoPorAcao: 0.0035,
  minimoPorOrdem: 0.35,
  tetoPctOrdem: 0.01,
  precoMedioAcao: 100,
  spreadBps: 2,
  secFeeBpsVenda: 0.278,
  finraTafPorAcaoVenda: 0.000166,
};

/** Uma estrategia com o que o modelo precisa: quanto pesou e quantas vezes girou. */
export interface LinhaGiro {
  /** peso medio da estrategia no portfolio (0.12 = 12%) */
  pesoPortfolio: number;
  /** trocas de ticker na janela inteira */
  trocas: number;
}

export interface ResultadoCustos {
  ordensAno: number;
  notionalAno: number;
  /** notional negociado por ano como multiplo do patrimonio */
  giroAno: number;
  custoComissaoAno: number;
  custoSpreadAno: number;
  custoRegulatorioAno: number;
  custoTotalAno: number;
  /** custo total como fracao do patrimonio medio, ao ano (0.002 = 0,2% aa) */
  dragAno: number;
  /** custo medio de uma ordem, em USD */
  custoMedioOrdem: number;
  /** tamanho medio de uma ordem, em USD */
  notionalMedioOrdem: number;
  premissas: PremissasCusto;
}

/**
 * Estima o custo anual de execucao do portfolio.
 *
 * @param linhas            estrategias com peso medio e numero de trocas
 * @param patrimonioMedio   patrimonio medio da janela, em USD
 * @param anos              duracao da janela, em anos
 */
export function estimarCustos(
  linhas: LinhaGiro[],
  patrimonioMedio: number,
  anos: number,
  premissas: PremissasCusto = CUSTO_IB_PADRAO,
): ResultadoCustos | null {
  if (!linhas.length || patrimonioMedio <= 0 || anos <= 0) return null;

  let ordens = 0;
  let notional = 0;
  let comissao = 0;

  for (const l of linhas) {
    const nOrdens = l.trocas * 2;               // vende o que sai, compra o que entra
    if (nOrdens <= 0) continue;
    const valorOrdem = l.pesoPortfolio * patrimonioMedio;
    if (valorOrdem <= 0) continue;

    const acoes = valorOrdem / premissas.precoMedioAcao;
    const bruta = acoes * premissas.comissaoPorAcao;
    const comOrdem = Math.min(
      Math.max(bruta, premissas.minimoPorOrdem),
      valorOrdem * premissas.tetoPctOrdem,
    );

    ordens += nOrdens;
    notional += nOrdens * valorOrdem;
    comissao += nOrdens * comOrdem;
  }

  if (ordens === 0) return null;

  // SPREAD CHEIO POR ORDEM — cenario de pior caso, por decisao de apresentacao.
  // O livro-texto cobraria meio spread por ordem (compra no ask, vende no bid,
  // cada ponta atravessa metade). Cobrar o spread inteiro em cada ordem dobra a
  // conta e assume execucao sempre na pior ponta, sem nenhum price improvement,
  // sem ordem passiva, sem cruzamento no meio. Diante de um alocador
  // institucional e melhor errar para cima do que ter o numero contestado.
  const spread = notional * premissas.spreadBps / 10_000;
  // taxas regulatorias incidem so na venda: metade das ordens / do notional
  const notionalVenda = notional / 2;
  const acoesVendidas = notionalVenda / premissas.precoMedioAcao;
  const regulatorio =
    notionalVenda * (premissas.secFeeBpsVenda / 10_000) +
    acoesVendidas * premissas.finraTafPorAcaoVenda;

  const total = comissao + spread + regulatorio;

  return {
    ordensAno: ordens / anos,
    notionalAno: notional / anos,
    giroAno: notional / anos / patrimonioMedio,
    custoComissaoAno: comissao / anos,
    custoSpreadAno: spread / anos,
    custoRegulatorioAno: regulatorio / anos,
    custoTotalAno: total / anos,
    dragAno: total / anos / patrimonioMedio,
    custoMedioOrdem: total / ordens,
    notionalMedioOrdem: notional / ordens,
    premissas,
  };
}

/** Frase curta com as premissas, para o rodape do bloco de custos. */
export function descreverPremissas(p: PremissasCusto = CUSTO_IB_PADRAO): string {
  return (
    `IBKR Pro Tiered — US$ ${p.comissaoPorAcao.toFixed(4)}/ação, mínimo de ` +
    `US$ ${p.minimoPorOrdem.toFixed(2)} por ordem e teto de ${(p.tetoPctOrdem * 100).toFixed(0)}% ` +
    `do valor · spread de ${p.spreadBps} bps cobrado CHEIO em cada ordem (pior caso; ` +
    `a convenção usual cobraria metade por ponta) · preço médio por ação ` +
    `assumido em US$ ${p.precoMedioAcao} · taxas regulatórias (SEC ` +
    `${p.secFeeBpsVenda} bps + FINRA TAF US$ ${p.finraTafPorAcaoVenda}/ação) só na venda`
  );
}

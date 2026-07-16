// Teste de calibração do Risk Number — trava a metodologia Nitrogen/HRIE.
// Não usa framework: roda com `npx tsx lib/risk-number.test.ts`. Funções puras,
// sem rede. Se alguém mexer na fórmula ou nas âncoras e o número drifta do
// modelo validado, este teste quebra. É a rede de segurança do número mais
// sensível do terminal.
import {
  riskNumberFromDownside95,
  downside95_6m,
  downsideDeviation,
  portfolioRiskNumber,
} from "./risk-number";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    console.log(`  ok   ${name}`);
  } else {
    failures++;
    console.log(`  FAIL ${name} ${detail}`);
  }
}
function near(a: number, b: number, tol = 0) {
  return Math.abs(a - b) <= tol;
}

console.log("Risk Number — calibração Nitrogen/HRIE");

// 1) Âncoras exatas (a tabela capturada da Nitrogen). loss → RN.
const ANCHORS: [number, number][] = [
  [0.02, 22], [0.05, 32], [0.07, 42], [0.12, 62], [0.18, 82], [0.2742, 91],
];
for (const [loss, rn] of ANCHORS) {
  const got = riskNumberFromDownside95(loss);
  check(`âncora loss=${loss} → RN ${rn}`, near(got, rn, 0), `(got ${got})`);
}

// 2) Extremos: perda ≤ 0 → 1; acima da última âncora → 99 (cap).
check("loss 0 → RN 1", riskNumberFromDownside95(0) === 1);
check("loss negativa → RN 1", riskNumberFromDownside95(-0.1) === 1);
check("loss 0.40 (extrema) → RN 99", riskNumberFromDownside95(0.4) === 99);

// 3) Interpolação linear entre âncoras (ponto médio 0.12–0.18 → ~72).
const mid = riskNumberFromDownside95(0.15);
check("interpola 0.15 → 71–73", mid >= 71 && mid <= 73, `(got ${mid})`);
// monotônico: mais perda = maior RN
check("monotônico", riskNumberFromDownside95(0.05) < riskNumberFromDownside95(0.10));

// 4) A fórmula 95%/6m: downside anual 0.145 → loss ≈ 0.1686 → RN ~76.
const loss145 = downside95_6m(0.145);
check("downside95_6m(0.145) ≈ 0.169", near(loss145, 0.1686, 0.003), `(got ${loss145.toFixed(4)})`);

// 5) downsideDeviation: só conta retornos negativos, anualiza por √252.
//    série com 100 retornos, metade -0.01 → dd = sqrt(50*0.0001/100)*√252 ≈ 0.1122
const rets = Array.from({ length: 100 }, (_, i) => (i % 2 === 0 ? -0.01 : 0.01));
const dd = downsideDeviation(rets);
check("downsideDeviation amostra ≈ 0.112", dd != null && near(dd, 0.1122, 0.005), `(got ${dd})`);
check("amostra < 20 retornos → null", downsideDeviation([-0.01, 0.01]) === null);

// 6) Portfólio: média ponderada conservadora dos downsides.
//    Downsides reais validados ao vivo: SPY dd≈0.103 (RN 62), AGG dd≈0.041 (RN 31).
//    60/40 → dd_port ≈ 0.078 → loss ≈ 0.091 → RN ~50 (Nitrogen capturou 52).
const SPY_DD = 0.1032, AGG_DD = 0.0413;
check("SPY dd≈0.103 → RN 62 solo", riskNumberFromDownside95(downside95_6m(SPY_DD)) === 62);
check("AGG dd≈0.041 → RN 31 solo", near(riskNumberFromDownside95(downside95_6m(AGG_DD)), 31, 1));
const port = portfolioRiskNumber([
  { ticker: "SPY", weight: 0.6, downsideAnnual: SPY_DD },
  { ticker: "AGG", weight: 0.4, downsideAnnual: AGG_DD },
]);
check("portfólio 60/40 existe", port != null);
if (port) {
  check("portfólio 60/40 RN 48–54 (Nitrogen 52)", port.riskNumber >= 48 && port.riskNumber <= 54, `(got ${port.riskNumber})`);
  check("portfólio cobertura 100%", near(port.coverage, 1, 0.001));
}
// ticker sem histórico não derruba o cálculo, só reduz cobertura
const partial = portfolioRiskNumber([
  { ticker: "SPY", weight: 0.5, downsideAnnual: 0.145 },
  { ticker: "XYZ", weight: 0.5, downsideAnnual: null },
]);
check("cobertura parcial = 50%", partial != null && near(partial.coverage, 0.5, 0.01), `(got ${partial?.coverage})`);

console.log(failures === 0 ? "\nTODOS OS TESTES PASSARAM" : `\n${failures} FALHA(S)`);
if (failures > 0) process.exit(1);

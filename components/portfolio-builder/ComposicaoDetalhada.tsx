"use client";
// ============================================================
// COMPOSIÇÃO DETALHADA — memória de cálculo aberta de um SET
// ------------------------------------------------------------
// Aparece quando um SET está carregado no Portfolio Builder. Expõe as 41 (ou
// 15) estratégias por baixo dos blocos, com o mínimo e o máximo de PROJETO de
// cada uma. Todos os controles são read-only — isto é a auditoria da carteira
// validada, não um editor.
//
// FONTE DAS FAIXAS (min/max):
//   rotacao20   → 0% a `convencoes.rotacao.teto` × pesoBloco no SET
//   corrmin20   → 0% a (1/convencoes.corrmin.k) × pesoBloco
//   aggbond     → 100% do bloco (índice puro, sem 41)
//   maxcagr10   → 0% a `convencoes.maxcagr.teto` × pesoBloco (15 fixas)
//   suavemin15  → 1% (piso) a `convencoes.maxcagr.teto` × pesoBloco (15 fixas)
//
// Nenhum destes é retornado ao motor de simulação. A simulação continua com
// os blocos (`configDoSet` em presets.ts). Este painel é 100% visual.
// ============================================================
import { useMemo, useState } from "react";
import type {
  BenchmarkSetsData,
  BlocoId,
  SetDef,
} from "@/lib/portfolio-builder/benchmark-sets";
import { NOMES_BLOCO } from "@/lib/portfolio-builder/benchmark-sets";
import type { Catalog } from "@/lib/portfolio-builder/types";

interface Props {
  set: SetDef;
  data: BenchmarkSetsData;
  catalog: Catalog | null;
  /** cor do bloco na barra de alocação — para casar o ponto colorido */
  corBloco: (bloco: BlocoId) => string;
  /** sufixo 1/2/... para desambiguar irmãs (Communications 1 vs 2) */
  rotuloIndex?: Record<string, number>;
}

interface RegraBloco {
  minLocal: number; // min DENTRO do bloco (0..1)
  maxLocal: number; // max DENTRO do bloco (0..1)
  regra: string;
  /** null = 41 estratégias rotativas · array = fixas */
  idsFixas: string[] | null;
}

function regraDoBloco(
  bloco: BlocoId,
  conv: BenchmarkSetsData["convencoes"],
): RegraBloco {
  switch (bloco) {
    case "rotacao20":
      return {
        minLocal: 0,
        maxLocal: conv.rotacao.teto,
        regra: `Top-${conv.rotacao.k} por RetMes · teto de ${(conv.rotacao.teto * 100).toFixed(0)}% cada`,
        idsFixas: null,
      };
    case "corrmin20": {
      const each = 1 / conv.corrmin.k;
      return {
        minLocal: 0,
        maxLocal: each,
        regra: `${conv.corrmin.k} de menor correlação · peso igual (${(each * 100).toFixed(1)}% cada quando selecionada)`,
        idsFixas: null,
      };
    }
    case "aggbond":
      return {
        minLocal: 1,
        maxLocal: 1,
        regra: "Índice agregado de renda fixa — não são as 41",
        idsFixas: [],
      };
    case "maxcagr10":
      return {
        minLocal: 0,
        maxLocal: conv.maxcagr.teto,
        regra: `${conv.maxcagr.k} ataque fixas · teto de ${(conv.maxcagr.teto * 100).toFixed(0)}% cada · ${conv.gatilho.idsDefesa.length} defesa`,
        idsFixas: [...conv.maxcagr.idsAtaque, ...conv.gatilho.idsDefesa],
      };
    case "suavemin15":
      return {
        minLocal: 0.01,
        maxLocal: conv.maxcagr.teto,
        regra: `Motor Max Retorno · piso de 1% em cada · ${conv.maxcagr.k} ataque + ${conv.gatilho.idsDefesa.length} defesa`,
        idsFixas: [...conv.maxcagr.idsAtaque, ...conv.gatilho.idsDefesa],
      };
    // Familia 4 MOTORES. As pecas por baixo sao CESTAS (nao as 41 diretamente),
    // entao `idsFixas: []` â o painel mostra a regra, nao a lista de estrategias.
    case "combo4m":
      return {
        minLocal: 0,
        maxLocal: 0.08,
        regra:
          "4 motores com fatia fixa 35/35/15/15 Â· teto de 8% por cesta Â· alocaÃ§Ã£o pela forÃ§a do momento (Ï=91)",
        idsFixas: [],
      };
  }
}

/** Último ticker conhecido da estratégia na janela do export. */
function tickerAtual(id: string, data: BenchmarkSetsData): { sym: string; def: boolean } | null {
  const u = data.universoDetalhe?.[id];
  if (!u || !u.runs.length) return null;
  const last = u.runs[u.runs.length - 1];
  const si = last[1];
  if (si < 0) return null;
  return { sym: u.simbolos[si] ?? id, def: !!u.defensivo[si] };
}

/** Quais estratégias participam do bloco, para os que rodam sobre as 41. */
function idsRotativas(bloco: "rotacao20" | "corrmin20", data: BenchmarkSetsData): string[] {
  const matriz = data.pesosDiarios?.[bloco];
  if (!matriz) return data.idsUniverso;
  const out: string[] = [];
  for (let i = 0; i < data.idsUniverso.length; i++) {
    const linha = matriz[i];
    if (linha && linha.some((v) => (v || 0) > 0)) out.push(data.idsUniverso[i]);
  }
  return out.length ? out : data.idsUniverso;
}

/** Nome curto — mesma regra do PortfolioBuilder.tsx (canonizada). Extrai o
 *  nome humano depois do "- " do label; se der em codigo tipo "C22ACT1CD 154",
 *  cai para `sub`; se nao tiver nada, volta ao label. */
function rotuloCurto(label: string, sub: string): string {
  const l = (label || "").trim();
  const s = (sub || "").trim();
  const i = l.lastIndexOf(" - ");
  if (i >= 0) {
    const after = l.slice(i + 3).trim();
    if (after && !/^[A-Z0-9]+ ?\d*$/.test(after)) return after;
  }
  if (s) return s;
  return l;
}

/** "0%" para zero; "1%" para 0,01; "0,3%" para 0,003. Mesma leitura da tela. */
const pctText = (v: number) => {
  if (v <= 0) return "0%";
  const p = v * 100;
  if (p >= 1) return `${p.toFixed(p >= 10 ? 0 : 1).replace(".", ",")}%`;
  return `${p.toFixed(2).replace(".", ",")}%`;
};

export default function ComposicaoDetalhada({ set, data, catalog, corBloco, rotuloIndex }: Props) {
  const [aberto, setAberto] = useState(true);

  const grupos = useMemo(() => {
    return set.composicao.map((c) => {
      const regra = regraDoBloco(c.bloco, data.convencoes);
      const ids =
        regra.idsFixas === null
          ? idsRotativas(c.bloco as "rotacao20" | "corrmin20", data)
          : regra.idsFixas;
      const isAggbond = c.bloco === "aggbond";
      const idsAtaque =
        c.bloco === "maxcagr10" || c.bloco === "suavemin15"
          ? new Set(data.convencoes.maxcagr.idsAtaque)
          : null;

      const linhas = ids.map((id) => {
        const meta = catalog?.estrategias.find((e) => e.id === id) ?? null;
        const tk = tickerAtual(id, data);
        const ehAtaque = idsAtaque ? idsAtaque.has(id) : null;
        const base = rotuloCurto(meta?.label ?? id, meta?.sub ?? "");
        const sufixo = rotuloIndex?.[id];
        return {
          id,
          label: meta?.label ?? id,
          rotulo: sufixo ? `${base} ${sufixo}` : base,
          ticker: tk?.sym ?? meta?.simbolo_hoje ?? null,
          emDefesaHoje: tk?.def ?? meta?.em_defesa_hoje ?? false,
          ehAtaque,
        };
      });

      return {
        bloco: c.bloco,
        peso: c.peso,
        regra,
        isAggbond,
        linhas,
      };
    });
  }, [set, data, catalog]);

  const totalEstrategias = useMemo(() => {
    const ids = new Set<string>();
    grupos.forEach((g) => {
      if (!g.isAggbond) g.linhas.forEach((l) => ids.add(l.id));
    });
    return ids.size;
  }, [grupos]);

  return (
    <section
      style={{
        marginTop: 10,
        borderRadius: 6,
        border: "1px solid var(--line2)",
        background: "rgba(255,255,255,.02)",
      }}
    >
      <button
        onClick={() => setAberto((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "9px 12px",
          background: "transparent",
          border: "none",
          color: "var(--tx2)",
          cursor: "pointer",
          font: "inherit",
        }}
        title={aberto ? "Fechar composição detalhada" : "Abrir composição detalhada"}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              display: "inline-block",
              transition: "transform .15s",
              transform: aberto ? "rotate(90deg)" : "none",
              color: "var(--gold)",
              fontSize: 9,
            }}
          >
            ▶
          </span>
          <span
            style={{
              fontSize: 10.5,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "var(--tx3)",
              fontWeight: 600,
            }}
          >
            Composição detalhada · memória de cálculo
          </span>
        </span>
        <span
          style={{
            fontSize: 11.5,
            color: "var(--tx3)",
            fontFamily: "var(--mono)",
          }}
        >
          {totalEstrategias} estratégias
        </span>
      </button>

      {aberto && (
        <div style={{ padding: "0 12px 12px" }}>
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 11.5,
              lineHeight: 1.5,
              color: "var(--tx3)",
            }}
          >
            Mínimo e máximo <b style={{ color: "var(--tx2)" }}>de projeto</b> por
            estratégia — o que ela pode chegar a pesar no portfólio dentro deste
            SET. Peso realizado no dia varia dentro da faixa segundo o motor de
            cada bloco. <b style={{ color: "var(--tx2)" }}>Só leitura</b> — para
            editar, mexa em qualquer slider acima e o SET é liberado.
          </p>

          {grupos.map((g) => (
            <BlocoGrupo key={g.bloco} grupo={g} corBloco={corBloco(g.bloco)} />
          ))}
        </div>
      )}
    </section>
  );
}

function BlocoGrupo({
  grupo,
  corBloco,
}: {
  grupo: {
    bloco: BlocoId;
    peso: number;
    regra: RegraBloco;
    isAggbond: boolean;
    linhas: {
      id: string;
      label: string;
      rotulo: string;
      ticker: string | null;
      emDefesaHoje: boolean;
      ehAtaque: boolean | null;
    }[];
  };
  corBloco: string;
}) {
  const { bloco, peso, regra, isAggbond, linhas } = grupo;

  // Peso final da faixa NO SET (contribuição ao portfólio total).
  const minSet = regra.minLocal * peso;
  const maxSet = regra.maxLocal * peso;

  return (
    <div
      style={{
        marginBottom: 10,
        borderRadius: 6,
        border: "1px solid var(--line2)",
        background: "rgba(255,255,255,.02)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 12px",
          background: "rgba(255,255,255,.025)",
          borderBottom: "1px solid var(--line2)",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 2,
            background: corBloco,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--tx)",
              lineHeight: 1.3,
            }}
          >
            {NOMES_BLOCO[bloco]}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--tx3)",
              marginTop: 2,
              lineHeight: 1.4,
            }}
          >
            {regra.regra}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--gold)",
              lineHeight: 1,
            }}
          >
            {(peso * 100).toFixed(0)}%
          </div>
          <div
            style={{
              fontSize: 10,
              color: "var(--tx3)",
              marginTop: 3,
              fontFamily: "var(--mono)",
            }}
          >
            {isAggbond ? "índice" : `${linhas.length} estr.`}
          </div>
        </div>
      </div>

      {isAggbond ? (
        <div style={{ padding: "10px 12px" }}>
          <FaixaMinMax min={minSet} max={maxSet} corBloco={corBloco} />
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 11,
              color: "var(--tx3)",
              lineHeight: 1.4,
            }}
          >
            Renda fixa Agg.Bond entra como bloco único: {(peso * 100).toFixed(0)}%
            fixo do portfólio. Não é decomposta em estratégias.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {linhas.map((l, i) => (
            <LinhaEstrategia
              key={l.id}
              linha={l}
              minSet={minSet}
              maxSet={maxSet}
              corBloco={corBloco}
              zebrada={i % 2 === 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LinhaEstrategia({
  linha,
  minSet,
  maxSet,
  corBloco,
  zebrada,
}: {
  linha: {
    id: string;
    label: string;
    rotulo: string;
    ticker: string | null;
    emDefesaHoje: boolean;
    ehAtaque: boolean | null;
  };
  minSet: number;
  maxSet: number;
  corBloco: string;
  zebrada: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) 90px",
        alignItems: "center",
        gap: 10,
        padding: "7px 12px",
        background: zebrada ? "rgba(255,255,255,.015)" : "transparent",
        borderTop: "1px solid var(--line2)",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 6,
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--tx)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0,
              flex: 1,
            }}
            title={linha.label}
          >
            {linha.rotulo}
          </span>
          {linha.ehAtaque !== null && (
            <span
              style={{
                fontSize: 9,
                fontFamily: "var(--mono)",
                textTransform: "uppercase",
                letterSpacing: ".08em",
                color: linha.ehAtaque ? "var(--gold)" : "var(--blue)",
                padding: "1px 5px",
                borderRadius: 3,
                background: linha.ehAtaque
                  ? "rgba(201,160,44,.12)"
                  : "rgba(79,156,217,.12)",
                flexShrink: 0,
              }}
            >
              {linha.ehAtaque ? "ataque" : "defesa"}
            </span>
          )}
          {linha.ticker && (
            <span
              style={{
                fontSize: 10.5,
                fontFamily: "var(--mono)",
                color: linha.emDefesaHoje ? "var(--blue)" : "var(--tx3)",
                flexShrink: 0,
              }}
            >
              {linha.ticker}
            </span>
          )}
        </div>
        <FaixaMinMax min={minSet} max={maxSet} corBloco={corBloco} />
      </div>
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 11.5,
          color: "var(--tx2)",
          textAlign: "right",
          whiteSpace: "nowrap",
        }}
      >
        {pctText(minSet)} –{" "}
        <span style={{ color: "var(--tx)" }}>{pctText(maxSet)}</span>
      </div>
    </div>
  );
}

/** Barra horizontal com faixa colorida entre min e max, ancorada em 0 e no teto. */
function FaixaMinMax({
  min,
  max,
  corBloco,
  teto = 0.25,
}: {
  min: number;
  max: number;
  corBloco: string;
  teto?: number;
}) {
  // O teto visual do range é max(teto padrão, max real) para nunca cortar.
  const escala = Math.max(teto, max, 0.05);
  const left = (min / escala) * 100;
  const right = (max / escala) * 100;
  return (
    <div
      style={{
        position: "relative",
        height: 6,
        borderRadius: 3,
        background: "rgba(255,255,255,.06)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${left}%`,
          width: `${Math.max(right - left, 1)}%`,
          background: corBloco,
          opacity: 0.75,
        }}
      />
    </div>
  );
}

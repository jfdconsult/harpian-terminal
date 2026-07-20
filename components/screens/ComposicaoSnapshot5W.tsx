"use client";
import { useEffect, useState } from "react";
import { publishScreenData } from "@/lib/jim-data";

// ── Composition Snapshot · 5-week delay ──────────────────────────────────────
// Renderiza a composição da carteira COMO ESTAVA HÁ 5 SEMANAS. Prova cabal de
// posição real (o cliente vê tickers, pesos, defense) sem entregar o presente
// — 5 semanas > holding médio (~34 dias), então a maioria já girou.
//
// Banner enfático deixa claro que NÃO é ao vivo — evita expectativa errada.
// Data source: /api/etp-snapshot-delayed (server-enforced 35-day window).

interface Holding { ticker: string; name: string; weight_pct: number }
interface Profile { pct_acoes: number; pct_etfs: number; n_holdings: number; top_holdings: Holding[] }
interface Payload {
  ok: boolean; as_of: string; delay_days: number; delay_weeks: number;
  protocol: { name: string; version: string; rule: string };
  regime: { state: string; label: string };
  profiles: { CONSERVATIVE: Profile; BALANCE: Profile; ADVANCE: Profile };
  defense: { label: string; holdings: Holding[] };
}

const PROFILE_LABEL: Record<string, string> = {
  CONSERVATIVE: "Conservative", BALANCE: "Balanced", ADVANCE: "Advanced",
};

const REGIME_COLOR: Record<string, string> = {
  BULL: "#2ECC71", NEUTRO: "#4A90D9", CAUTELA: "#F39C12", BEAR: "#E74C3C",
};

const fmtBr = (iso: string) => {
  try { return new Date(iso + "T09:00:00Z").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return iso; }
};

function HoldingsTable({ rows }: { rows: Holding[] }) {
  return (
    <table>
      <thead><tr><th>Asset</th><th className="num">Weight</th></tr></thead>
      <tbody>
        {rows.map((h, i) => (
          <tr key={h.ticker + i}>
            <td>
              <span style={{ fontWeight: 600, color: "var(--gold)" }}>{h.ticker}</span>
              {h.name && <span style={{ marginLeft: 8, fontSize: 11, color: "var(--tx3)" }}>{h.name}</span>}
            </td>
            <td className="num" style={{ color: "var(--tx)", fontWeight: 600 }}>{h.weight_pct.toFixed(1)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ComposicaoSnapshot5W() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/etp-snapshot-delayed", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: Payload) => { setData(j.ok ? j : null); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!data) return;
    publishScreenData(
      "fundo",
      `Composition Snapshot tab — fotografia da composição da carteira há ${data.delay_weeks} semanas (${data.as_of}). Cliente vê tickers e pesos, mas NÃO é composição atual — a janela de 35 dias garante que a maioria das posições já foi girada. Regime naquele momento: ${data.regime.label}.`,
      {
        janela: `${data.delay_weeks} semanas de delay`,
        dataSnapshot: data.as_of,
        regimeNoSnapshot: data.regime.label,
        perfis: (["CONSERVATIVE", "BALANCE", "ADVANCE"] as const).map((k) => {
          const p = data.profiles[k];
          return { perfil: PROFILE_LABEL[k], pctAcoes: p.pct_acoes, pctEtfs: p.pct_etfs, posicoes: p.n_holdings, top: p.top_holdings };
        }),
        defesa: data.defense,
      },
      {
        briefing:
          `Você está vendo a **composição da carteira há ${data.delay_weeks} semanas** (foto de ${fmtBr(data.as_of)}). ` +
          `Regime naquele momento: **${data.regime.label}**. Isto NÃO é a posição atual — o delay de 35 dias é maior que o holding médio, então a maioria já foi girada.`,
        suggestions: [
          "Por que a composição tem 5 semanas de delay?",
          "O que mudou desde essa foto?",
          "Por que a Defesa era essa naquele momento?",
        ],
      }
    );
  }, [data]);

  if (loading) {
    return (
      <div className="grid g4" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {[0, 1, 2].map((i) => <div key={i} className="card" style={{ height: 260 }} />)}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="placeholder">
        <i className="ti ti-cloud-off" /><b>Snapshot temporarily unavailable</b>
        <div className="muted mt">Tente novamente em instantes.</div>
      </div>
    );
  }

  const regimeColor = REGIME_COLOR[data.regime.state] || "var(--tx)";
  const profileKeys = ["CONSERVATIVE", "BALANCE", "ADVANCE"] as const;

  return (
    <>
      {/* Banner enfático de delay */}
      <div
        className="card mb"
        style={{
          display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
          background: "linear-gradient(90deg, rgba(243,156,18,.08), transparent)",
          borderColor: "rgba(243,156,18,.35)",
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "rgba(243,156,18,.15)", display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <i className="ti ti-clock-hour-4" style={{ fontSize: 22, color: "var(--orange)" }} />
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontWeight: 700, color: "var(--tx)", fontSize: 15 }}>
            5-Week Snapshot · não é composição ao vivo
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 3, lineHeight: 1.55 }}>
            Fotografia de <b style={{ color: "var(--tx2)" }}>{fmtBr(data.as_of)}</b> — 35 dias atrás.
            Delay {'>'} holding médio da carteira, então a maioria dessas posições já foi girada.
            A janela avança 1 dia por dia.
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div className="muted" style={{ fontSize: 10 }}>Regime naquele momento</div>
          <div style={{ fontWeight: 700, color: regimeColor, fontSize: 15 }}>{data.regime.label}</div>
        </div>
      </div>

      {/* Perfis */}
      <div className="grid g4 mb" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {profileKeys.map((k) => {
          const p = data.profiles[k];
          return (
            <div className="card" key={k}>
              <h3><i className="ti ti-user-circle" />{PROFILE_LABEL[k]}</h3>
              <div style={{ display: "flex", gap: 8, margin: "4px 0 12px" }}>
                <div style={{ flex: 1, textAlign: "center", background: "var(--panel2)", borderRadius: 8, padding: "8px 4px" }}>
                  <div className="big" style={{ fontSize: 20, color: "var(--tx)" }}>{p.pct_acoes}%</div>
                  <div className="muted" style={{ fontSize: 10 }}>Stocks</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", background: "var(--panel2)", borderRadius: 8, padding: "8px 4px" }}>
                  <div className="big" style={{ fontSize: 20, color: "var(--tx)" }}>{p.pct_etfs}%</div>
                  <div className="muted" style={{ fontSize: 10 }}>ETFs</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", background: "var(--panel2)", borderRadius: 8, padding: "8px 4px" }}>
                  <div className="big" style={{ fontSize: 20, color: "var(--gold)" }}>{p.n_holdings}</div>
                  <div className="muted" style={{ fontSize: 10 }}>Positions</div>
                </div>
              </div>
              <div className="muted mb" style={{ fontSize: 11 }}>Top positions · há 5 semanas</div>
              <HoldingsTable rows={p.top_holdings} />
            </div>
          );
        })}
      </div>

      {/* Defense layer daquele momento */}
      {data.defense.holdings.length > 0 && (
        <div className="card mb">
          <h3>
            <i className="ti ti-shield-half" />
            Defense layer · há 5 semanas
            {data.defense.label && (
              <span style={{ marginLeft: 8, fontWeight: 400, color: "var(--tx2)", fontSize: 13 }}>
                · {data.defense.label}
              </span>
            )}
          </h3>
          <div className="grid g4">
            {data.defense.holdings.map((h) => (
              <div key={h.ticker} className="card" style={{ textAlign: "center", padding: 14, background: "var(--panel2)" }}>
                <div className="big" style={{ fontSize: 22, color: "var(--gold)" }}>{h.ticker}</div>
                {h.name && <div className="muted" style={{ fontSize: 10, marginTop: 2 }}>{h.name}</div>}
                <div style={{ fontSize: 13, color: "var(--tx)", marginTop: 6, fontWeight: 600 }}>{h.weight_pct.toFixed(0)}%</div>
              </div>
            ))}
          </div>
          <div className="muted mt" style={{ fontSize: 11 }}>
            Ativos defensivos que o sistema tinha acionado naquele momento — o gatilho é proprietário.
          </div>
        </div>
      )}

      {/* Footer de regra */}
      <div className="card" style={{ background: "transparent", borderStyle: "dashed" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <i className="ti ti-book" style={{ color: "var(--gold)", fontSize: 15, flexShrink: 0, marginTop: 2 }} />
          <div className="muted" style={{ fontSize: 10.5, lineHeight: 1.7 }}>
            <b style={{ color: "var(--tx2)" }}>Por que 5 semanas?</b> O holding médio da carteira é ~34 dias.
            Uma janela de 35 dias garante que a maior parte das posições que você vê aqui já foi girada —
            provando que temos posição real, sem entregar o que ainda pode estar em rotação.
            A composição de HOJE fica na aba <b>The Vault</b> (agregados) e no Cockpit interno da Harpian.
          </div>
        </div>
      </div>
    </>
  );
}

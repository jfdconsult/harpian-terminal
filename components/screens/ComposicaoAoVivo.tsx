"use client";
import { useEffect, useState } from "react";
import { fetchSnapshot, PROFILE_LABEL, type Snapshot } from "@/lib/snapshot";
import { publishScreenData } from "@/lib/jim-data";

// Composição ao vivo do sistema (saída do overnight), cliente-safe.
// Mostra os 3 perfis (Conservador/Balanceado/Avançado) com o split ações/ETFs
// e as maiores posições, mais a camada de defesa vigente. Nada de sinais/fórmulas.

const REGIME_LABEL: Record<string, { txt: string; color: string }> = {
  BULL: { txt: "Risk-On", color: "#2ECC71" },
  NEUTRO: { txt: "Neutro", color: "#4A90D9" },
  CAUTELA: { txt: "Cautela", color: "#F39C12" },
  BEAR: { txt: "Risk-Off", color: "#E74C3C" },
};

function HoldingsTable({ rows }: { rows: { ticker: string; name: string; weight_pct: number }[] }) {
  return (
    <table>
      <thead><tr><th>Ativo</th><th className="num">Peso</th></tr></thead>
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

export default function ComposicaoAoVivo() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [conn, setConn] = useState<"loading" | "ok" | "offline">("loading");

  useEffect(() => {
    let live = true;
    fetchSnapshot().then((s) => {
      if (!live) return;
      if (s.ok) { setSnap(s); setConn("ok"); } else { setConn("offline"); }
    });
    return () => { live = false; };
  }, []);

  // Publica pro JIM a composição ao vivo (resultado — nunca o gatilho/fórmula).
  // Hook fica ANTES dos early returns (regra dos Hooks) — guarda por dentro.
  useEffect(() => {
    if (!snap) return;
    const reg = snap.regime ? REGIME_LABEL[snap.regime.state] : null;
    const profileKeys = ["CONSERVATIVE", "BALANCE", "ADVANCE"] as const;
    publishScreenData(
      "fundo",
      "Aba Composição ao vivo do fundo: split ações/ETFs e maiores posições por perfil (Conservador/Balanceado/Avançado), mais a camada de defesa vigente. Resultado do sistema — o gatilho é proprietário.",
      {
        leituraDe: snap.as_of, regime: reg?.txt || null,
        perfis: profileKeys.flatMap((k) => {
          const p = snap.profiles?.[k];
          if (!p) return [];
          return [{ perfil: PROFILE_LABEL[k], pctAcoes: p.pct_acoes, pctEtfs: p.pct_etfs, posicoes: p.n_holdings, maioresPosicoes: p.top_holdings }];
        }),
        defesa: snap.defense ? { label: snap.defense.label, holdings: snap.defense.holdings } : null,
      },
      {
        briefing:
          `Você está vendo a composição ao vivo dos perfis (leitura de ${snap.as_of})` +
          (reg ? `, regime **${reg.txt}**.` : ".") +
          (snap.defense?.holdings.length ? ` Defesa vigente: ${snap.defense.holdings.map((h) => h.ticker).join(", ")}.` : ""),
        suggestions: [
          "Qual perfil está mais concentrado em ações?",
          "Por que a defesa tem essas posições agora?",
          "O que muda se o regime virar?",
        ],
      }
    );
  }, [snap]);

  if (conn === "loading") {
    return (
      <div className="grid g4" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {[0, 1, 2].map((i) => <div key={i} className="card" style={{ height: 260 }} />)}
      </div>
    );
  }

  if (conn === "offline" || !snap) {
    return (
      <div className="placeholder">
        <i className="ti ti-cloud-off" /><b>Composição ao vivo indisponível</b>
        <div className="muted mt">O sistema ainda não gerou o snapshot de hoje. Rode o overnight e recarregue.</div>
      </div>
    );
  }

  const reg = snap.regime ? REGIME_LABEL[snap.regime.state] : null;
  const profileKeys = ["CONSERVATIVE", "BALANCE", "ADVANCE"] as const;

  return (
    <>
      <div className="card mb" style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <i className="ti ti-layout-grid" style={{ fontSize: 22, color: "var(--gold)" }} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontWeight: 600, color: "var(--tx)", fontSize: 15 }}>Composição ao vivo dos perfis</div>
          <div className="muted" style={{ fontSize: 11 }}>Leitura de {snap.as_of} · atualizada a cada rodada do sistema</div>
        </div>
        {reg && (
          <div style={{ textAlign: "right" }}>
            <div className="muted" style={{ fontSize: 10 }}>Regime</div>
            <div style={{ fontWeight: 700, color: reg.color, fontSize: 15 }}>{reg.txt}</div>
          </div>
        )}
      </div>

      <div className="grid g4 mb" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {profileKeys.map((k) => {
          const p = snap.profiles?.[k];
          if (!p) return null;
          return (
            <div className="card" key={k}>
              <h3><i className="ti ti-user-circle" />{PROFILE_LABEL[k]}</h3>
              <div style={{ display: "flex", gap: 8, margin: "4px 0 12px" }}>
                <div style={{ flex: 1, textAlign: "center", background: "var(--panel2)", borderRadius: 8, padding: "8px 4px" }}>
                  <div className="big" style={{ fontSize: 20, color: "var(--tx)" }}>{p.pct_acoes}%</div>
                  <div className="muted" style={{ fontSize: 10 }}>Ações</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", background: "var(--panel2)", borderRadius: 8, padding: "8px 4px" }}>
                  <div className="big" style={{ fontSize: 20, color: "var(--tx)" }}>{p.pct_etfs}%</div>
                  <div className="muted" style={{ fontSize: 10 }}>ETFs</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", background: "var(--panel2)", borderRadius: 8, padding: "8px 4px" }}>
                  <div className="big" style={{ fontSize: 20, color: "var(--gold)" }}>{p.n_holdings}</div>
                  <div className="muted" style={{ fontSize: 10 }}>Posições</div>
                </div>
              </div>
              <div className="muted mb" style={{ fontSize: 11 }}>Maiores posições</div>
              <HoldingsTable rows={p.top_holdings} />
            </div>
          );
        })}
      </div>

      {snap.defense && snap.defense.holdings.length > 0 && (
        <div className="card">
          <h3><i className="ti ti-shield-half" />Camada de defesa vigente{snap.defense.label && <span style={{ marginLeft: 8, fontWeight: 400, color: "var(--tx2)", fontSize: 13 }}>· {snap.defense.label}</span>}</h3>
          <div className="grid g4">
            {snap.defense.holdings.map((h) => (
              <div key={h.ticker} className="card" style={{ textAlign: "center", padding: 14, background: "var(--panel2)" }}>
                <div className="big" style={{ fontSize: 22, color: "var(--gold)" }}>{h.ticker}</div>
                {h.name && <div className="muted" style={{ fontSize: 10, marginTop: 2 }}>{h.name}</div>}
                <div style={{ fontSize: 13, color: "var(--tx)", marginTop: 6, fontWeight: 600 }}>{h.weight_pct.toFixed(0)}%</div>
              </div>
            ))}
          </div>
          <div className="muted mt" style={{ fontSize: 11 }}>Ativos defensivos que o sistema aciona quando o regime pede proteção — o gatilho é proprietário.</div>
        </div>
      )}
    </>
  );
}

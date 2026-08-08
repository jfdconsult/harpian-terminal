"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { fetchSnapshot, PROFILE_LABEL, type Snapshot } from "@/lib/snapshot";
import { publishScreenData } from "@/lib/jim-data";

// Live composition of the system (overnight output), client-safe.
// Shows the 3 profiles (Conservative/Balanced/Advanced) with the stock/ETF split
// and top positions, plus the current defense layer. No signals/formulas here.

// ════════════════════════════════════════════════════════════════
// i18n — local dictionary for this screen (see Painel.tsx for the
// canonical pattern). One entry per user-visible English string.
// Brand/product terms and data-driven regime state codes are NOT translated.
// ════════════════════════════════════════════════════════════════
const TR = {
  asset: { pt: "Ativo", en: "Asset" },
  weight: { pt: "Peso", en: "Weight" },
  liveCompositionUnavailable: { pt: "Composição ao vivo indisponível", en: "Live composition unavailable" },
  systemHasntGenerated: { pt: "O sistema ainda não gerou o snapshot de hoje. Rode o processo overnight e recarregue.", en: "The system hasn't generated today's snapshot yet. Run the overnight process and reload." },
  liveCompositionOfProfiles: { pt: "Composição ao vivo dos perfis", en: "Live composition of the profiles" },
  readingAsOf: { pt: "Leitura em", en: "Reading as of" },
  updatedEveryRun: { pt: "atualizado a cada execução do sistema", en: "updated every system run" },
  regime: { pt: "Regime", en: "Regime" },
  stocks: { pt: "Ações", en: "Stocks" },
  etfs: { pt: "ETFs", en: "ETFs" },
  positions: { pt: "Posições", en: "Positions" },
  topPositions: { pt: "Maiores posições", en: "Top positions" },
  currentDefenseLayer: { pt: "Camada de defesa atual", en: "Current defense layer" },
  defenseAssetsNote: { pt: "Ativos defensivos que o sistema ativa quando o regime exige proteção — o gatilho é proprietário.", en: "Defensive assets the system activates when the regime calls for protection — the trigger is proprietary." },
} as const;

const REGIME_LABEL: Record<string, { txt: string; color: string }> = {
  BULL: { txt: "Risk-On", color: "#2ECC71" },
  NEUTRO: { txt: "Neutral", color: "#4A90D9" },
  CAUTELA: { txt: "Caution", color: "#F39C12" },
  BEAR: { txt: "Risk-Off", color: "#E74C3C" },
};

function HoldingsTable({ rows, t }: { rows: { ticker: string; name: string; weight_pct: number }[]; t: (k: keyof typeof TR) => string }) {
  return (
    <table>
      <thead><tr><th>{t("asset")}</th><th className="num">{t("weight")}</th></tr></thead>
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
  const { lang } = useI18n();
  const t = (k: keyof typeof TR) => TR[k][lang];
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

  // Publishes the live composition to JIM (the result — never the trigger/formula).
  // Hook stays BEFORE the early returns (Rules of Hooks) — guarded internally.
  useEffect(() => {
    if (!snap) return;
    const reg = snap.regime ? REGIME_LABEL[snap.regime.state] : null;
    const profileKeys = ["CONSERVATIVE", "BALANCE", "ADVANCE"] as const;
    publishScreenData(
      "fundo",
      "Fund's Live Composition tab: stock/ETF split and top positions by profile (Conservative/Balanced/Advanced), plus the current defense layer. System output — the trigger is proprietary.",
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
          `You're looking at the live composition of the profiles (reading as of ${snap.as_of})` +
          (reg ? `, regime **${reg.txt}**.` : ".") +
          (snap.defense?.holdings.length ? ` Current defense: ${snap.defense.holdings.map((h) => h.ticker).join(", ")}.` : ""),
        suggestions: [
          "Which profile is most concentrated in stocks?",
          "Why does the defense have these positions now?",
          "What changes if the regime flips?",
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
        <i className="ti ti-cloud-off" /><b>{t("liveCompositionUnavailable")}</b>
        <div className="muted mt">{t("systemHasntGenerated")}</div>
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
          <div style={{ fontWeight: 600, color: "var(--tx)", fontSize: 15 }}>{t("liveCompositionOfProfiles")}</div>
          <div className="muted" style={{ fontSize: 11 }}>{t("readingAsOf")} {snap.as_of} · {t("updatedEveryRun")}</div>
        </div>
        {reg && (
          <div style={{ textAlign: "right" }}>
            <div className="muted" style={{ fontSize: 10 }}>{t("regime")}</div>
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
                  <div className="muted" style={{ fontSize: 10 }}>{t("stocks")}</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", background: "var(--panel2)", borderRadius: 8, padding: "8px 4px" }}>
                  <div className="big" style={{ fontSize: 20, color: "var(--tx)" }}>{p.pct_etfs}%</div>
                  <div className="muted" style={{ fontSize: 10 }}>{t("etfs")}</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", background: "var(--panel2)", borderRadius: 8, padding: "8px 4px" }}>
                  <div className="big" style={{ fontSize: 20, color: "var(--gold)" }}>{p.n_holdings}</div>
                  <div className="muted" style={{ fontSize: 10 }}>{t("positions")}</div>
                </div>
              </div>
              <div className="muted mb" style={{ fontSize: 11 }}>{t("topPositions")}</div>
              <HoldingsTable rows={p.top_holdings} t={t} />
            </div>
          );
        })}
      </div>

      {snap.defense && snap.defense.holdings.length > 0 && (
        <div className="card">
          <h3><i className="ti ti-shield-half" />{t("currentDefenseLayer")}{snap.defense.label && <span style={{ marginLeft: 8, fontWeight: 400, color: "var(--tx2)", fontSize: 13 }}>· {snap.defense.label}</span>}</h3>
          <div className="grid g4">
            {snap.defense.holdings.map((h) => (
              <div key={h.ticker} className="card" style={{ textAlign: "center", padding: 14, background: "var(--panel2)" }}>
                <div className="big" style={{ fontSize: 22, color: "var(--gold)" }}>{h.ticker}</div>
                {h.name && <div className="muted" style={{ fontSize: 10, marginTop: 2 }}>{h.name}</div>}
                <div style={{ fontSize: 13, color: "var(--tx)", marginTop: 6, fontWeight: 600 }}>{h.weight_pct.toFixed(0)}%</div>
              </div>
            ))}
          </div>
          <div className="muted mt" style={{ fontSize: 11 }}>{t("defenseAssetsNote")}</div>
        </div>
      )}
    </>
  );
}

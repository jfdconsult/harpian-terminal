"use client";
import { useEffect, useState } from "react";
import { publishScreenData } from "@/lib/jim-data";
import { useI18n } from "@/lib/i18n";

// i18n dictionary — one entry per user-visible English string. en = current
// text (kept exactly), pt = natural institutional Brazilian-Portuguese.
const TR = {
  asset: { pt: "Ativo", en: "Asset" },
  weight: { pt: "Peso", en: "Weight" },
  snapshotUnavailable: { pt: "Snapshot temporariamente indisponível", en: "Snapshot temporarily unavailable" },
  retryShortly: { pt: "Tente novamente em instantes.", en: "Try again shortly." },
  bannerTitle: { pt: "Snapshot de 5 Semanas · não é composição ao vivo", en: "5-Week Snapshot · not a live composition" },
  regimeAtThatTime: { pt: "Regime naquele momento", en: "Regime at that time" },
  stocks: { pt: "Ações", en: "Stocks" },
  etfs: { pt: "ETFs", en: "ETFs" },
  positions: { pt: "Posições", en: "Positions" },
  topPositions5w: { pt: "Principais posições · há 5 semanas", en: "Top positions · 5 weeks ago" },
  defenseLayer5w: { pt: "Camada de defesa · há 5 semanas", en: "Defense layer · 5 weeks ago" },
  defenseNote: { pt: "Ativos defensivos que o sistema tinha acionado naquele momento — o gatilho é proprietário.", en: "Defensive assets the system had triggered at that moment — the trigger is proprietary." },
  whyFiveWeeksTitle: { pt: "Por que 5 semanas?", en: "Why 5 weeks?" },
  bannerBodyPre: { pt: "Fotografia de", en: "Snapshot from" },
  bannerBodyPost: { pt: "dias atrás. Delay > holding médio da carteira, então a maioria dessas posições já foi girada. A janela avança 1 dia por dia.", en: "days ago. Delay > the portfolio's average holding period, so most of these positions have already been rotated. The window advances 1 day per day." },
  whyFiveWeeksBody: { pt: "O holding médio da carteira é ~34 dias. Uma janela de 35 dias garante que a maior parte das posições que você vê aqui já foi girada — provando que temos posição real, sem entregar o que ainda pode estar em rotação. A composição de HOJE fica na aba", en: "The portfolio's average holding period is ~34 days. A 35-day window guarantees that most of the positions you see here have already been rotated — proving we hold real positions without revealing what may still be in rotation. TODAY's composition lives in the" },
  whyFiveWeeksBodyEnd: { pt: "(agregados) e no Cockpit interno da Harpian.", en: "tab (aggregates) and in Harpian's internal Cockpit." },
  profileConservative: { pt: "Conservador", en: "Conservative" },
  profileBalanced: { pt: "Balanceado", en: "Balanced" },
  profileAdvanced: { pt: "Avançado", en: "Advanced" },
} as const;

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

const PROFILE_LABEL_KEY = {
  CONSERVATIVE: "profileConservative", BALANCE: "profileBalanced", ADVANCE: "profileAdvanced",
} as const;

const REGIME_COLOR: Record<string, string> = {
  BULL: "#2ECC71", NEUTRO: "#4A90D9", CAUTELA: "#F39C12", BEAR: "#E74C3C",
};

function fmtBr(iso: string, lang: "pt" | "en") {
  const locale = lang === "pt" ? "pt-BR" : "en-US";
  try { return new Date(iso + "T09:00:00Z").toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return iso; }
}

function HoldingsTable({ rows, t }: { rows: Holding[]; t: (k: keyof typeof TR) => string }) {
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

export default function ComposicaoSnapshot5W() {
  const { lang } = useI18n();
  const t = (k: keyof typeof TR) => TR[k][lang];
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
          return { perfil: t(PROFILE_LABEL_KEY[k]), pctAcoes: p.pct_acoes, pctEtfs: p.pct_etfs, posicoes: p.n_holdings, top: p.top_holdings };
        }),
        defesa: data.defense,
      },
      {
        briefing:
          `Você está vendo a **composição da carteira há ${data.delay_weeks} semanas** (foto de ${fmtBr(data.as_of, lang)}). ` +
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
        <i className="ti ti-cloud-off" /><b>{t("snapshotUnavailable")}</b>
        <div className="muted mt">{t("retryShortly")}</div>
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
            {t("bannerTitle")}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 3, lineHeight: 1.55 }}>
            {t("bannerBodyPre")} <b style={{ color: "var(--tx2)" }}>{fmtBr(data.as_of, lang)}</b> — 35 {t("bannerBodyPost")}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div className="muted" style={{ fontSize: 10 }}>{t("regimeAtThatTime")}</div>
          <div style={{ fontWeight: 700, color: regimeColor, fontSize: 15 }}>{data.regime.label}</div>
        </div>
      </div>

      {/* Perfis */}
      <div className="grid g4 mb" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {profileKeys.map((k) => {
          const p = data.profiles[k];
          return (
            <div className="card" key={k}>
              <h3><i className="ti ti-user-circle" />{t(PROFILE_LABEL_KEY[k])}</h3>
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
              <div className="muted mb" style={{ fontSize: 11 }}>{t("topPositions5w")}</div>
              <HoldingsTable rows={p.top_holdings} t={t} />
            </div>
          );
        })}
      </div>

      {/* Defense layer daquele momento */}
      {data.defense.holdings.length > 0 && (
        <div className="card mb">
          <h3>
            <i className="ti ti-shield-half" />
            {t("defenseLayer5w")}
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
            {t("defenseNote")}
          </div>
        </div>
      )}

      {/* Footer de regra */}
      <div className="card" style={{ background: "transparent", borderStyle: "dashed" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <i className="ti ti-book" style={{ color: "var(--gold)", fontSize: 15, flexShrink: 0, marginTop: 2 }} />
          <div className="muted" style={{ fontSize: 10.5, lineHeight: 1.7 }}>
            <b style={{ color: "var(--tx2)" }}>{t("whyFiveWeeksTitle")}</b> {t("whyFiveWeeksBody")} <b>The Vault</b> {t("whyFiveWeeksBodyEnd")}
          </div>
        </div>
      </div>
    </>
  );
}

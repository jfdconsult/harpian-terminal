"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { publishScreenData } from "@/lib/jim-data";

const TR = {
  loadingVault: { pt: "Carregando The Vault…", en: "Loading The Vault…" },
  vaultUnavailableTitle: { pt: "The Vault está temporariamente indisponível", en: "The Vault is temporarily unavailable" },
  tryAgainMoment: { pt: "Tente novamente em instantes.", en: "Try again in a moment." },
  vaultTitle: { pt: "The Vault — o que está dentro, não o quê", en: "The Vault — what's inside, not what" },
  vaultSubtitle: { pt: "Estado agregado do ETP agora. Os tickers ficam no cofre.", en: "Aggregate state of the ETP right now. Tickers stay in the cofre." },
  activeLongs: { pt: "LONGS ATIVOS", en: "ACTIVE LONGS" },
  hedges: { pt: "hedges", en: "hedges" },
  aumInvested: { pt: "AUM INVESTIDO", en: "AUM INVESTED" },
  net: { pt: "líquido", en: "net" },
  portfolioBeta: { pt: "BETA DA CARTEIRA", en: "PORTFOLIO BETA" },
  vsSp500: { pt: "vs S&P 500", en: "vs S&P 500" },
  avgHolding: { pt: "PERMANÊNCIA MÉDIA", en: "AVG HOLDING" },
  turnoverMo: { pt: "giro", en: "turnover" },
  perMonth: { pt: "/mês", en: "/mo" },
  hitRate90d: { pt: "TAXA DE ACERTO 90d", en: "HIT RATE 90d" },
  positionsClosedPositive: { pt: "posições encerradas positivas", en: "positions closed positive" },
  showcaseTitle: { pt: "The Showcase — 3 posições encerradas · embargo de 4 semanas", en: "The Showcase — 3 closed positions · 4-week embargo" },
  showcaseSubtitle: { pt: "Operações reais encerradas pelo ETP. Amostra de 3, rotacionada semanalmente. Quando uma posição sai desta vitrine, ela não é arquivada.", en: "Real trades the ETP closed. Sampled to 3, rotated weekly. When a position leaves this showcase, it is not archived." },
  vsSp: { pt: "vs S&P", en: "vs S&P" },
  momEntry: { pt: "mom entrada", en: "mom entry" },
  weatherTitle: { pt: "Momentum Weather — a postura do sistema", en: "Momentum Weather — the system's stance" },
  weatherSubtitle: { pt: "Estado + postura. A pilha de gatilhos é proprietária e permanece no Cockpit.", en: "State + posture. The trigger stack is proprietary and stays in the Cockpit." },
  regime: { pt: "REGIME", en: "REGIME" },
  defenseCash: { pt: "DEFESA / CAIXA", en: "DEFENSE / CASH" },
  regimeStreak: { pt: "SEQUÊNCIA DO REGIME", en: "REGIME STREAK" },
  lastFlip: { pt: "ÚLTIMA VIRADA", en: "LAST FLIP" },
  magnitude: { pt: "magnitude", en: "magnitude" },
  dntTitle: { pt: "Do Not Touch — pior momentum no SPX500", en: "Do Not Touch — worst momentum in SPX500" },
  dntSubtitle: { pt: "5 ações + 2 setores que estamos ativamente evitando esta semana. Atualizado segunda 06:00 BRT.", en: "5 stocks + 2 sectors we're actively avoiding this week. Refreshed Monday 06:00 BRT." },
  stocksHeader: { pt: "⛔ AÇÕES · 5 PIOR MOMENTUM", en: "⛔ STOCKS · 5 WORST MOMENTUM" },
  ticker: { pt: "Ticker", en: "Ticker" },
  sector: { pt: "Setor", en: "Sector" },
  mom: { pt: "Mom", en: "Mom" },
  signal: { pt: "Sinal", en: "Signal" },
  sectorsHeader: { pt: "⛔ SETORES EM ALERTA", en: "⛔ SECTORS ON ALERT" },
  dntNotePre: { pt: "Publicar o que a gente ", en: "Publishing what we " },
  dntNoteAvoid: { pt: "evita", en: "avoid" },
  dntNotePost: { pt: " é mais seguro do que publicar o que compramos — o universo do \"ruim\" é ordens de grandeza maior que o universo do \"bom.\" Esta lista alerta você sem ensinar o modelo.", en: " is safer than publishing what we buy — the universe of \"bad\" is orders of magnitude larger than the universe of \"good.\" This list warns you without teaching the model." },
  disclosureLabel: { pt: "Regras de divulgação (impostas pelo servidor):", en: "Disclosure rules (server-enforced):" },
  disclosureBody1: { pt: "Vault mostra apenas agregados, nunca tickers ou pesos de posições ativas. Showcase amostra exatamente", en: "Vault shows aggregates only, never tickers or weights of active positions. Showcase samples exactly" },
  disclosureBody2: { pt: "posições encerradas com embargo de", en: "closed positions with a" },
  disclosureBody3: { pt: "dias, rotacionadas semanalmente; não há arquivo histórico. Weather mostra o estado do regime e o peso de defesa; a pilha de gatilhos não é exposta. Do Not Touch ranqueia", en: "day embargo, rotated weekly; there is no history archive. Weather shows regime state and defense weight; the trigger stack is not exposed. Do Not Touch ranks" },
  disclosureBody4: { pt: "(não é o universo real de seleção do ETP). Essas regras existem para manter o edge intacto ao mesmo tempo em que provam que estamos na operação junto com você.", en: "(not the ETP's actual selection universe). These rules exist to keep the edge intact while proving we're in the trade with you." },
} as const;

// ── Verified Opacity Protocol — client view ──────────────────────────────────
// Four sections, top-to-bottom:
//   1) The Vault      — aggregate proof of skin-in-the-game (never tickers)
//   2) The Showcase   — 3 closed positions, 4-week embargo, weekly rotation
//   3) Momentum Weather — regime + defense weight (no factor decomposition)
//   4) Do Not Touch   — 5 worst SPX500 momentum + 2 sector alerts
//
// All disclosure rules live server-side at /api/etp-vault. This component is a
// pure renderer — never mutate or store the payload beyond the current session.

interface Vault {
  n_positions: number; n_hedges: number; gross_exposure_pct: number; net_exposure_pct: number;
  beta: number; avg_holding_days: number; monthly_turnover_pct: number; hit_rate_90d_pct: number; aum_alloc_pct: number;
}
interface ShowcaseItem {
  ticker: string; sector: string; entry: string; exit: string; holdingDays: number;
  momentumEntry: number; retPct: number; retVsSpx: number; thesis: string;
}
interface Weather {
  regime: string; regime_label: string; defense_pct: number; streak_days: number;
  last_change: { date: string; from: string; to: string; magnitude_sigma: number };
}
interface DntStock { ticker: string; name: string; sector: string; momentum: number; tag: string }
interface DntSector { sector: string; momentum: number; tag: string }
interface Payload {
  ok: boolean; as_of: string; next_rotation: string;
  protocol: { name: string; version: string; showcase_embargo_days: number; showcase_size: number; dnt_universe: string; rotation_ritual: string };
  vault: Vault; showcase: ShowcaseItem[]; weather: Weather; dnt: { stocks: DntStock[]; sectors: DntSector[] };
}

const fmtDate = (iso: string, locale: string) => new Date(iso).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
const pct = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(1) + "%";

const REGIME_COLOR: Record<string, string> = {
  BULL: "var(--green)", NEUTRO: "#4A90D9", CAUTELA: "var(--orange)", BEAR: "var(--red)",
};

export default function TheVault() {
  const { lang } = useI18n();
  const t = (k: keyof typeof TR) => TR[k][lang];
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/etp-vault", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: Payload) => {
        if (!j.ok) { setErr("Vault temporarily unavailable"); setLoading(false); return; }
        setData(j); setLoading(false);
      })
      .catch(() => { setErr("Vault temporarily unavailable"); setLoading(false); });
  }, []);

  // Publish to JIM — result only, never the disclosure rule mechanics
  useEffect(() => {
    if (!data) return;
    publishScreenData(
      "fundo",
      "The Vault tab — Verified Opacity Protocol. Aggregates of the ETP (skin-in-the-game proof), 3 sample closed positions with 4-week embargo, regime weather, and Do Not Touch list (5 worst SPX500 momentum + 2 sectors). Client-safe filter — never reveals active positions, formulas, or the selection universe of the ETP itself.",
      {
        vault: data.vault,
        showcase: data.showcase.map((s) => ({ ticker: s.ticker, sector: s.sector, holdingDays: s.holdingDays, retornoPct: s.retPct, vsSpx: s.retVsSpx })),
        weather: data.weather,
        doNotTouch: data.dnt,
        proximaRotacao: data.next_rotation,
      },
      {
        briefing:
          `You're viewing **The Vault** — verified opacity view of the ETP. ` +
          `Aggregate: ${data.vault.n_positions} active positions, ${data.vault.aum_alloc_pct}% invested, avg holding ${data.vault.avg_holding_days} days. ` +
          `3 closed sample positions displayed with a 4-week embargo. ` +
          `Regime **${data.weather.regime_label}**, defense at ${data.weather.defense_pct}%. ` +
          `Do Not Touch: 5 worst SPX500 stocks + 2 fragile sectors.`,
        suggestions: [
          "Why do we only see 3 positions and not the whole book?",
          "How is the Do Not Touch list built?",
          "What does the 4-week embargo protect?",
        ],
      }
    );
  }, [data]);

  if (loading) return <div className="card"><div className="muted" style={{ padding: 40, textAlign: "center" }}>{t("loadingVault")}</div></div>;
  if (err || !data) return <div className="card"><div className="placeholder"><i className="ti ti-lock" /><b>{t("vaultUnavailableTitle")}</b><div className="muted mt">{t("tryAgainMoment")}</div></div></div>;

  const v = data.vault;
  const w = data.weather;
  const regimeColor = REGIME_COLOR[w.regime] || "var(--tx)";
  const locale = lang === "pt" ? "pt-BR" : "en-US";

  return (
    <>
      {/* Rotation chip moved to the tabs bar in Fundo.tsx (right slot) to save vertical space. */}

      {/* ═══════════ 1. THE VAULT ═══════════ */}
      <div className="card mb">
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}><i className="ti ti-shield-lock" />{t("vaultTitle")}</h3>
          <div className="muted" style={{ lineHeight: 1.55, fontSize: 12 }}>{t("vaultSubtitle")}</div>
        </div>
        <div className="grid g4" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
          <div className="card" style={{ textAlign: "center", padding: 14 }}>
            <div className="big" style={{ fontSize: 26, color: "var(--gold)" }}>{v.n_positions}</div>
            <div style={{ fontSize: 10, color: "var(--tx2)", marginTop: 4, fontWeight: 600 }}>{t("activeLongs")}</div>
            <div className="muted" style={{ fontSize: 10 }}>+ {v.n_hedges} {t("hedges")}</div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: 14 }}>
            <div className="big" style={{ fontSize: 26, color: "var(--gold)" }}>{v.aum_alloc_pct}%</div>
            <div style={{ fontSize: 10, color: "var(--tx2)", marginTop: 4, fontWeight: 600 }}>{t("aumInvested")}</div>
            <div className="muted" style={{ fontSize: 10 }}>{t("net")} {v.net_exposure_pct}%</div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: 14 }}>
            <div className="big" style={{ fontSize: 26, color: "var(--gold)" }}>{v.beta.toFixed(2)}</div>
            <div style={{ fontSize: 10, color: "var(--tx2)", marginTop: 4, fontWeight: 600 }}>{t("portfolioBeta")}</div>
            <div className="muted" style={{ fontSize: 10 }}>{t("vsSp500")}</div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: 14 }}>
            <div className="big" style={{ fontSize: 26, color: "var(--gold)" }}>{v.avg_holding_days}d</div>
            <div style={{ fontSize: 10, color: "var(--tx2)", marginTop: 4, fontWeight: 600 }}>{t("avgHolding")}</div>
            <div className="muted" style={{ fontSize: 10 }}>{t("turnoverMo")} {v.monthly_turnover_pct}%{t("perMonth")}</div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: 14 }}>
            <div className="big" style={{ fontSize: 26, color: "var(--green)" }}>{v.hit_rate_90d_pct}%</div>
            <div style={{ fontSize: 10, color: "var(--tx2)", marginTop: 4, fontWeight: 600 }}>{t("hitRate90d")}</div>
            <div className="muted" style={{ fontSize: 10 }}>{t("positionsClosedPositive")}</div>
          </div>
        </div>
      </div>

      {/* ═══════════ 2. THE SHOWCASE ═══════════ */}
      <div className="card mb">
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}><i className="ti ti-award" />{t("showcaseTitle")}</h3>
          <div className="muted" style={{ lineHeight: 1.55, fontSize: 12 }}>
            {t("showcaseSubtitle")}
          </div>
        </div>
        <div className="grid g4" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          {data.showcase.map((s) => (
            <div key={s.ticker + s.entry} className="card" style={{ padding: 16, borderColor: "rgba(201,160,44,.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "var(--gold)" }}>{s.ticker}</div>
                  <div className="muted" style={{ fontSize: 11 }}>{s.sector}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="big" style={{ fontSize: 20, color: s.retPct >= 0 ? "var(--green)" : "var(--red)" }}>{pct(s.retPct)}</div>
                  <div className="muted" style={{ fontSize: 10 }}>{t("vsSp")} {pct(s.retVsSpx)}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--tx2)", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid var(--line2)" }}>
                <span><i className="ti ti-clock" style={{ marginRight: 4, color: "var(--tx3)" }} />{s.holdingDays}d</span>
                <span><i className="ti ti-flame" style={{ marginRight: 4, color: "var(--tx3)" }} />{t("momEntry")} {s.momentumEntry}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--tx3)", marginBottom: 6 }}>
                {fmtDate(s.entry, locale)} → {fmtDate(s.exit, locale)}
              </div>
              <div style={{ fontSize: 12, color: "var(--tx)", lineHeight: 1.55, fontStyle: "italic" }}>
                &ldquo;{s.thesis}&rdquo;
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════ 3. MOMENTUM WEATHER ═══════════ */}
      <div className="card mb">
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}><i className="ti ti-temperature" />{t("weatherTitle")}</h3>
          <div className="muted" style={{ lineHeight: 1.55, fontSize: 12 }}>
            {t("weatherSubtitle")}
          </div>
        </div>
        <div className="grid g4" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
          <div className="card" style={{ textAlign: "center", padding: 14, borderColor: regimeColor + "44" }}>
            <div className="big" style={{ fontSize: 22, color: regimeColor }}>{w.regime_label}</div>
            <div style={{ fontSize: 10, color: "var(--tx2)", marginTop: 4, fontWeight: 600 }}>{t("regime")}</div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: 14 }}>
            <div className="big" style={{ fontSize: 22, color: "var(--tx)" }}>{w.defense_pct}%</div>
            <div style={{ fontSize: 10, color: "var(--tx2)", marginTop: 4, fontWeight: 600 }}>{t("defenseCash")}</div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: 14 }}>
            <div className="big" style={{ fontSize: 22, color: "var(--tx)" }}>{w.streak_days}d</div>
            <div style={{ fontSize: 10, color: "var(--tx2)", marginTop: 4, fontWeight: 600 }}>{t("regimeStreak")}</div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: 14 }}>
            <div style={{ fontSize: 13, color: "var(--tx)", fontWeight: 600 }}>{w.last_change.from} → {w.last_change.to}</div>
            <div style={{ fontSize: 10, color: "var(--tx2)", marginTop: 4, fontWeight: 600 }}>{t("lastFlip")} · {fmtDate(w.last_change.date, locale)}</div>
            <div className="muted" style={{ fontSize: 10 }}>{t("magnitude")} {w.last_change.magnitude_sigma}σ</div>
          </div>
        </div>
      </div>

      {/* ═══════════ 4. DO NOT TOUCH ═══════════ */}
      <div className="card mb">
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}><i className="ti ti-hand-stop" />{t("dntTitle")}</h3>
          <div className="muted" style={{ lineHeight: 1.55, fontSize: 12 }}>
            {t("dntSubtitle")}
          </div>
        </div>

        <div className="grid g2">
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--tx2)", marginBottom: 8, letterSpacing: 0.5 }}>{t("stocksHeader")}</div>
            <table>
              <thead><tr><th>{t("ticker")}</th><th>{t("sector")}</th><th className="num">{t("mom")}</th><th>{t("signal")}</th></tr></thead>
              <tbody>
                {data.dnt.stocks.map((s) => (
                  <tr key={s.ticker}>
                    <td>
                      <span style={{ fontWeight: 600, color: "var(--red)" }}>{s.ticker}</span>
                      <div className="muted" style={{ fontSize: 10 }}>{s.name}</div>
                    </td>
                    <td style={{ color: "var(--tx3)", fontSize: 11 }}>{s.sector}</td>
                    <td className="num" style={{ color: "var(--red)", fontWeight: 600 }}>{s.momentum}</td>
                    <td style={{ color: "var(--tx2)", fontSize: 11, fontStyle: "italic" }}>{s.tag}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--tx2)", marginBottom: 8, letterSpacing: 0.5 }}>{t("sectorsHeader")}</div>
            <table>
              <thead><tr><th>{t("sector")}</th><th className="num">{t("mom")}</th><th>{t("signal")}</th></tr></thead>
              <tbody>
                {data.dnt.sectors.map((s) => (
                  <tr key={s.sector}>
                    <td style={{ color: "var(--red)", fontWeight: 600 }}>{s.sector}</td>
                    <td className="num" style={{ color: "var(--red)", fontWeight: 600 }}>{s.momentum}</td>
                    <td style={{ color: "var(--tx2)", fontSize: 11, fontStyle: "italic" }}>{s.tag}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="card mt" style={{ background: "transparent", borderStyle: "dashed", padding: 12 }}>
              <div style={{ fontSize: 11, color: "var(--tx2)", lineHeight: 1.55 }}>
                <i className="ti ti-info-circle" style={{ marginRight: 6, color: "var(--gold)" }} />
                {t("dntNotePre")}<b>{t("dntNoteAvoid")}</b>{t("dntNotePost")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rule footer */}
      <div className="card" style={{ background: "transparent", borderStyle: "dashed" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <i className="ti ti-book" style={{ color: "var(--gold)", fontSize: 15, flexShrink: 0, marginTop: 2 }} />
          <div className="muted" style={{ fontSize: 10.5, lineHeight: 1.7 }}>
            <b style={{ color: "var(--tx2)" }}>{t("disclosureLabel")}</b> {t("disclosureBody1")} {data.protocol.showcase_size} {t("disclosureBody2")} {data.protocol.showcase_embargo_days}{lang === "pt" ? "" : "-"}{t("disclosureBody3")} {data.protocol.dnt_universe} {t("disclosureBody4")}
          </div>
        </div>
      </div>
    </>
  );
}

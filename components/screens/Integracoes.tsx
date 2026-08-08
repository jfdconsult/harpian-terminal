"use client";
import { useEffect, useState } from "react";
import { publishScreenData } from "@/lib/jim-data";
import { useI18n } from "@/lib/i18n";

// Status comes from /api/health, which queries each source of truth.
// Before, this screen had 6 hardcoded "connected" constants — and Lynk
// showed up as connected for order routing, while the Orders screen
// explicitly says that submission is simulated.

type IntegrationStatus = "ok" | "offline" | "simulado" | "planejado";
interface IntegrationHealth {
  id: string; name: string; icon: string; status: IntegrationStatus;
  note: string; latency_ms?: number; detail?: string;
}
interface HealthResp { checked_at: string; integrations: IntegrationHealth[] }

const TAG: Record<IntegrationStatus, string> = {
  ok: "g", offline: "r", simulado: "o", planejado: "b",
};

const TR = {
  live: { pt: "live", en: "live" },
  down: { pt: "down", en: "down" },
  simulated: { pt: "simulado", en: "simulated" },
  planned: { pt: "planejado", en: "planned" },
  title: { pt: "Integrações", en: "Integrations" },
  subtitle: {
    pt: "Cada fonte é consultada de verdade quando esta tela abre — o status abaixo é medido agora, não declarado.",
    en: "Each source is genuinely queried when this screen opens — status below is measured now, not declared.",
  },
  checked: { pt: "verificado", en: "checked" },
  checking: { pt: "Verificando…", en: "Checking…" },
  checkNow: { pt: "Verificar agora", en: "Check now" },
  querying: { pt: "Consultando cada fonte…", en: "Querying each source…" },
  couldNotVerify: { pt: "Não foi possível verificar as integrações", en: "Could not verify the integrations" },
  liveLabel: { pt: "LIVE", en: "LIVE" },
  down_: { pt: "fora do ar", en: "down" },
  ms: { pt: "ms", en: "ms" },
  pricingNote: {
    pt: "A cotação vem hoje do Yahoo Finance; a migração para o FastTrack é transparente para as telas. Lynk e FastTrack mostram seu status real — nenhum dos dois está operando.",
    en: "Pricing comes from Yahoo Finance today; the migration to FastTrack is transparent to the screens. Lynk and FastTrack show their real status — neither of the two is operating.",
  },
} as const;

export default function Integracoes() {
  const { lang } = useI18n();
  const t = (k: keyof typeof TR) => TR[k][lang];
  const LABEL: Record<IntegrationStatus, string> = {
    ok: t("live"), offline: t("down"), simulado: t("simulated"), planejado: t("planned"),
  };
  const [data, setData] = useState<HealthResp | null>(null);
  const [loading, setLoading] = useState(true);

  function check() {
    setLoading(true);
    fetch("/api/health", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: HealthResp) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }
  useEffect(check, []);

  const items = data?.integrations || [];
  const noAr = items.filter((i) => i.status === "ok").length;
  const fora = items.filter((i) => i.status === "offline");

  useEffect(() => {
    if (!items.length) return;
    publishScreenData(
      "integracoes",
      "Terminal integrations with REAL health checks (each source is queried right now): Yahoo, SEC EDGAR, CFTC, CBOE, FRED, economic calendar, XRI engine, HC-US engine, Lynk, and FastTrack.",
      items.map((i) => ({ nome: i.name, status: i.status, latencia_ms: i.latency_ms, nota: i.note })),
      {
        briefing:
          `${noAr} of ${items.length} integrations are live right now.` +
          (fora.length ? ` **Down: ${fora.map((i) => i.name).join(", ")}.**` : "") +
          ` Lynk remains simulated (no real routing) and FastTrack hasn't come online yet.`,
        suggestions: [
          fora.length ? "What breaks if this source goes down?" : "Is any integration slow?",
          "What changes when FastTrack comes online?",
          "Does Lynk already route real orders?",
        ],
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, noAr, fora.length]);

  return (
    <div className="screen">
      <div className="flex between wrap" style={{ alignItems: "flex-start", gap: 10 }}>
        <div className="flex" style={{ alignItems: "baseline", gap: 14, flexWrap: "wrap", flex: 1 }}>
          <div className="h1" style={{ margin: 0 }}>{t("title")}</div>
          <div className="sub" style={{ margin: 0 }}>
            {t("subtitle")}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {data && (
            <span className="muted" style={{ fontSize: 10, fontFamily: "var(--mono)" }}>
              {t("checked")} {new Date(data.checked_at).toLocaleTimeString(lang === "pt" ? "pt-BR" : "en-US")}
            </span>
          )}
          <button className="btn ghost" style={{ fontSize: 11, padding: "6px 12px" }} onClick={check} disabled={loading}>
            <i className={`ti ${loading ? "ti-loader-2" : "ti-refresh"}`} />{loading ? t("checking") : t("checkNow")}
          </button>
        </div>
      </div>

      {loading && !items.length ? (
        <div className="muted" style={{ padding: 40, textAlign: "center" }}>{t("querying")}</div>
      ) : !items.length ? (
        <div className="placeholder"><i className="ti ti-cloud-off" /><b>{t("couldNotVerify")}</b></div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", marginBottom: 8, borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--mono)", color: fora.length ? "var(--orange)" : "var(--green)" }}>
              {noAr}/{items.length}
            </span>
            <span style={{ fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mono)" }}>{t("liveLabel")}</span>
            {fora.length > 0 && (
              <span style={{ fontSize: 11, color: "var(--red)" }}>
                <i className="ti ti-alert-triangle" style={{ marginRight: 4 }} />
                {fora.map((i) => i.name).join(", ")} {t("down_")}
              </span>
            )}
          </div>

          <div className="grid g3">
            {items.map((it) => (
              <div className="card" key={it.id}>
                <h3><i className={`ti ${it.icon}`} />{it.name}</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className={`tag ${TAG[it.status]}`}>{LABEL[it.status]}</span>
                  {it.latency_ms != null && it.status === "ok" && (
                    <span className="muted" style={{ fontSize: 9, fontFamily: "var(--mono)" }}>{it.latency_ms}{t("ms")}</span>
                  )}
                </div>
                <div className="muted mt" style={{ lineHeight: 1.5 }}>{it.note}</div>
                {it.detail && it.status === "offline" && (
                  <div style={{ fontSize: 10, color: "var(--red)", marginTop: 4, fontFamily: "var(--mono)" }}>{it.detail}</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="muted mt" style={{ fontSize: 11 }}>
        {t("pricingNote")}
      </div>
    </div>
  );
}

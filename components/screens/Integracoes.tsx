"use client";
import { useEffect, useState } from "react";
import { publishScreenData } from "@/lib/jim-data";

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

const LABEL: Record<IntegrationStatus, string> = {
  ok: "live", offline: "down", simulado: "simulated", planejado: "planned",
};
const TAG: Record<IntegrationStatus, string> = {
  ok: "g", offline: "r", simulado: "o", planejado: "b",
};

export default function Integracoes() {
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
          <div className="h1" style={{ margin: 0 }}>Integrations</div>
          <div className="sub" style={{ margin: 0 }}>
            Each source is genuinely queried when this screen opens — status below is measured now, not declared.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {data && (
            <span className="muted" style={{ fontSize: 10, fontFamily: "var(--mono)" }}>
              checked {new Date(data.checked_at).toLocaleTimeString("en-US")}
            </span>
          )}
          <button className="btn ghost" style={{ fontSize: 11, padding: "6px 12px" }} onClick={check} disabled={loading}>
            <i className={`ti ${loading ? "ti-loader-2" : "ti-refresh"}`} />{loading ? "Checking…" : "Check now"}
          </button>
        </div>
      </div>

      {loading && !items.length ? (
        <div className="muted" style={{ padding: 40, textAlign: "center" }}>Querying each source…</div>
      ) : !items.length ? (
        <div className="placeholder"><i className="ti ti-cloud-off" /><b>Could not verify the integrations</b></div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", marginBottom: 8, borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--mono)", color: fora.length ? "var(--orange)" : "var(--green)" }}>
              {noAr}/{items.length}
            </span>
            <span style={{ fontSize: 11, color: "var(--tx3)", fontFamily: "var(--mono)" }}>LIVE</span>
            {fora.length > 0 && (
              <span style={{ fontSize: 11, color: "var(--red)" }}>
                <i className="ti ti-alert-triangle" style={{ marginRight: 4 }} />
                {fora.map((i) => i.name).join(", ")} down
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
                    <span className="muted" style={{ fontSize: 9, fontFamily: "var(--mono)" }}>{it.latency_ms}ms</span>
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
        Pricing comes from Yahoo Finance today; the migration to FastTrack is transparent to the screens.
        Lynk and FastTrack show their real status — neither of the two is operating.
      </div>
    </div>
  );
}

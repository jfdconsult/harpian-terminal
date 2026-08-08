"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { allClients, findClient } from "@/lib/clientStore";
import type { ScreenId } from "@/lib/nav";
import type { QuestionnaireRecord } from "@/lib/questionnaire-store";

const PROFILE_COLOR: Record<string, string> = { Conservative: "#2ECC71", Moderate: "#C9A02C", Aggressive: "#E67E22" };

const TR = {
  clientRisk: { pt: "Risco do cliente", en: "Client risk" },
  clientLabel: { pt: "Cliente", en: "Client" },
  subtitle: { pt: "O que o cliente declarou sobre sua própria tolerância a risco — e como isso se compara à carteira real.", en: "What the client declared about their own risk tolerance — and how it compares to their actual portfolio." },
  suitabilityQuestionnaire: { pt: "Questionário de suitability", en: "Suitability questionnaire" },
  loading: { pt: "Carregando…", en: "Loading…" },
  answeredOn: { pt: "Respondido em", en: "Answered on" },
  declaredProfile: { pt: "Perfil declarado", en: "Declared profile" },
  score: { pt: "Pontuação", en: "Score" },
  notAnsweredYet: { pt: "Ainda não respondido", en: "Not answered yet" },
  sendLinkPrefix: { pt: "Envie o link abaixo para que", en: "Send the link below so" },
  sendLinkSuffix: { pt: "possa preenchê-lo — leva 2 minutos.", en: "can fill it in — takes 2 minutes." },
  copied: { pt: "Copiado", en: "Copied" },
  copyLink: { pt: "Copiar link", en: "Copy link" },
  suitabilityCheck: { pt: "Verificação de suitability", en: "Suitability check" },
  profileOnFile: { pt: "Perfil registrado (definido pelo consultor)", en: "Profile on file (set by advisor)" },
  matchesDeclared: { pt: "Corresponde ao perfil declarado?", en: "Matches declared profile?" },
  noDeclared: { pt: "Não — declarou", en: "No — declared" },
  yes: { pt: "Sim", en: "Yes" },
  riskNumberVsMandate: { pt: "Risk Number vs. mandato", en: "Risk Number vs. mandate" },
  overMandate: { pt: "— fora do mandato", en: "— over mandate" },
  withinMandate: { pt: "— dentro do mandato", en: "— within mandate" },
  mismatchNote: { pt: "O cliente declarou um perfil diferente do que está registrado. Vale uma conversa antes do próximo rebalanceamento — atualize via", en: "The client declared a different profile than what's on file. Worth a conversation before the next rebalance — update via" },
  editClient: { pt: "Editar cliente", en: "Edit client" },
  ifDeclaredShouldWin: { pt: "se o perfil declarado deve prevalecer.", en: "if the declared profile should win." },
} as const;

export default function ClienteRisco({ clientId = "joao-daniel", go }: { clientId?: string; go: (id: ScreenId, param?: string) => void }) {
  const { lang } = useI18n();
  const t = (k: keyof typeof TR) => TR[k][lang];
  const [selectedId, setSelectedId] = useState(clientId);
  const client = findClient(selectedId);
  const clients = allClients();

  const [record, setRecord] = useState<QuestionnaireRecord | null | undefined>(undefined); // undefined = loading
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setRecord(undefined);
    fetch(`/api/questionnaire?clientId=${encodeURIComponent(selectedId)}`)
      .then((r) => r.json())
      .then((d) => setRecord(d.ok ? d.record : null))
      .catch(() => setRecord(null));
  }, [selectedId]);

  const link = typeof window !== "undefined" ? `${window.location.origin}/questionario/${client.id}` : "";
  function copyLink() {
    navigator.clipboard?.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const mismatch = record && record.profile !== client.profile;
  const overMandate = client.riskNumber > client.mandate;
  const locale = lang === "pt" ? "pt-BR" : "en-US";

  return (
    <div className="screen">
      <div className="flex between" style={{ alignItems: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 11, color: "var(--tx3)" }}>{t("clientRisk")} · <b style={{ color: "var(--tx2)" }}>{client.name}</b></div>
        <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
          {t("clientLabel")}
          <select className="input" style={{ minWidth: 200 }} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>
      <div className="sub" style={{ marginBottom: 16 }}>{t("subtitle")}</div>

      <div className="grid g2" style={{ gap: 16 }}>
        <div className="card">
          <h3><i className="ti ti-clipboard-text" />{t("suitabilityQuestionnaire")}</h3>
          {record === undefined ? (
            <div className="muted" style={{ padding: 20, textAlign: "center" }}>{t("loading")}</div>
          ) : record ? (
            <>
              <div className="kv"><span className="muted">{t("answeredOn")}</span><span className="v">{new Date(record.answeredAt).toLocaleDateString(locale)}</span></div>
              <div className="kv">
                <span className="muted">{t("declaredProfile")}</span>
                <span className="v" style={{ color: PROFILE_COLOR[record.profile], fontWeight: 700 }}>{record.profile}</span>
              </div>
              <div className="kv"><span className="muted">{t("score")}</span><span className="v">{record.score} / {record.answers.length * 3}</span></div>
            </>
          ) : (
            <div className="placeholder" style={{ padding: 20 }}>
              <i className="ti ti-clipboard-off" />
              <b>{t("notAnsweredYet")}</b>
              <div className="muted mt">{t("sendLinkPrefix")} {client.name.split(" ")[0]} {t("sendLinkSuffix")}</div>
            </div>
          )}
          <div className="flex" style={{ gap: 8, marginTop: 14 }}>
            <input className="input" readOnly value={link} style={{ flex: 1, fontSize: 12 }} onFocus={(e) => e.target.select()} />
            <button className="btn" onClick={copyLink}>
              <i className={`ti ${copied ? "ti-check" : "ti-copy"}`} />{copied ? t("copied") : t("copyLink")}
            </button>
          </div>
        </div>

        <div className="card">
          <h3><i className="ti ti-scale" />{t("suitabilityCheck")}</h3>
          <div className="kv">
            <span className="muted">{t("profileOnFile")}</span>
            <span className="v" style={{ color: PROFILE_COLOR[client.profile], fontWeight: 700 }}>{client.profile}</span>
          </div>
          {record && (
            <div className="kv">
              <span className="muted">{t("matchesDeclared")}</span>
              {mismatch ? (
                <span className="v" style={{ color: "var(--orange)" }}><i className="ti ti-alert-triangle" /> {t("noDeclared")} {record.profile}</span>
              ) : (
                <span className="v" style={{ color: "var(--green)" }}><i className="ti ti-check" /> {t("yes")}</span>
              )}
            </div>
          )}
          <div className="kv">
            <span className="muted">{t("riskNumberVsMandate")}</span>
            <span className="v" style={{ color: overMandate ? "var(--red)" : "var(--green)" }}>
              {client.riskNumber} {overMandate ? ">" : "≤"} {client.mandate} {overMandate ? t("overMandate") : t("withinMandate")}
            </span>
          </div>
          {mismatch && (
            <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(230,126,34,.1)", borderRadius: 8, fontSize: 12, lineHeight: 1.6 }}>
              {t("mismatchNote")} <b>{t("editClient")}</b> {t("ifDeclaredShouldWin")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

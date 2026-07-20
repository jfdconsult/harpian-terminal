"use client";
import { useEffect, useState } from "react";
import { allClients, findClient } from "@/lib/clientStore";
import type { ScreenId } from "@/lib/nav";
import type { QuestionnaireRecord } from "@/lib/questionnaire-store";

const PROFILE_COLOR: Record<string, string> = { Conservative: "#2ECC71", Moderate: "#C9A02C", Aggressive: "#E67E22" };

export default function ClienteRisco({ clientId = "joao-daniel", go }: { clientId?: string; go: (id: ScreenId, param?: string) => void }) {
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

  return (
    <div className="screen">
      <div className="flex between" style={{ alignItems: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 11, color: "var(--tx3)" }}>Client risk · <b style={{ color: "var(--tx2)" }}>{client.name}</b></div>
        <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
          Client
          <select className="input" style={{ minWidth: 200 }} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>
      <div className="sub" style={{ marginBottom: 16 }}>What the client declared about their own risk tolerance — and how it compares to their actual portfolio.</div>

      <div className="grid g2" style={{ gap: 16 }}>
        <div className="card">
          <h3><i className="ti ti-clipboard-text" />Suitability questionnaire</h3>
          {record === undefined ? (
            <div className="muted" style={{ padding: 20, textAlign: "center" }}>Loading…</div>
          ) : record ? (
            <>
              <div className="kv"><span className="muted">Answered on</span><span className="v">{new Date(record.answeredAt).toLocaleDateString("en-US")}</span></div>
              <div className="kv">
                <span className="muted">Declared profile</span>
                <span className="v" style={{ color: PROFILE_COLOR[record.profile], fontWeight: 700 }}>{record.profile}</span>
              </div>
              <div className="kv"><span className="muted">Score</span><span className="v">{record.score} / {record.answers.length * 3}</span></div>
            </>
          ) : (
            <div className="placeholder" style={{ padding: 20 }}>
              <i className="ti ti-clipboard-off" />
              <b>Not answered yet</b>
              <div className="muted mt">Send the link below so {client.name.split(" ")[0]} can fill it in — takes 2 minutes.</div>
            </div>
          )}
          <div className="flex" style={{ gap: 8, marginTop: 14 }}>
            <input className="input" readOnly value={link} style={{ flex: 1, fontSize: 12 }} onFocus={(e) => e.target.select()} />
            <button className="btn" onClick={copyLink}>
              <i className={`ti ${copied ? "ti-check" : "ti-copy"}`} />{copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>

        <div className="card">
          <h3><i className="ti ti-scale" />Suitability check</h3>
          <div className="kv">
            <span className="muted">Profile on file (set by advisor)</span>
            <span className="v" style={{ color: PROFILE_COLOR[client.profile], fontWeight: 700 }}>{client.profile}</span>
          </div>
          {record && (
            <div className="kv">
              <span className="muted">Matches declared profile?</span>
              {mismatch ? (
                <span className="v" style={{ color: "var(--orange)" }}><i className="ti ti-alert-triangle" /> No — declared {record.profile}</span>
              ) : (
                <span className="v" style={{ color: "var(--green)" }}><i className="ti ti-check" /> Yes</span>
              )}
            </div>
          )}
          <div className="kv">
            <span className="muted">Risk Number vs. mandate</span>
            <span className="v" style={{ color: overMandate ? "var(--red)" : "var(--green)" }}>
              {client.riskNumber} {overMandate ? ">" : "≤"} {client.mandate} {overMandate ? "— over mandate" : "— within mandate"}
            </span>
          </div>
          {mismatch && (
            <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(230,126,34,.1)", borderRadius: 8, fontSize: 12, lineHeight: 1.6 }}>
              The client declared a different profile than what&apos;s on file. Worth a conversation before the next rebalance — update via <b>Edit client</b> if the declared profile should win.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

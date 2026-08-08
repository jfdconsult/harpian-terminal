"use client";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { allClients, findClient } from "@/lib/clientStore";
import { ClientDetail } from "./Cliente";
import type { ScreenId } from "@/lib/nav";

const TR = {
  portfolio: { pt: "Carteira", en: "Portfolio" },
  client: { pt: "Cliente", en: "Client" },
} as const;

export default function Carteira({ clientId = "joao-daniel", go }: { clientId?: string; go: (id: ScreenId, param?: string) => void }) {
  const { lang } = useI18n();
  const t = (k: keyof typeof TR) => TR[k][lang];
  const [selectedId, setSelectedId] = useState(clientId);
  const client = findClient(selectedId);
  const clients = allClients();
  return (
    <div className="screen">
      <div className="flex between" style={{ alignItems: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 11, color: "var(--tx3)" }}>{t("portfolio")}</div>
        <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
          {t("client")}
          <select className="input" style={{ minWidth: 200 }} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>
      <ClientDetail client={client} go={go} screen="carteira" />
    </div>
  );
}

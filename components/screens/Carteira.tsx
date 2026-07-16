"use client";
import { useState } from "react";
import { allClients, findClient } from "@/lib/clientStore";
import { ClientDetail } from "./Cliente";
import type { ScreenId } from "@/lib/nav";

export default function Carteira({ clientId = "joao-daniel", go }: { clientId?: string; go: (id: ScreenId, param?: string) => void }) {
  const [selectedId, setSelectedId] = useState(clientId);
  const client = findClient(selectedId);
  const clients = allClients();
  return (
    <div className="screen">
      <div className="flex between" style={{ alignItems: "center", marginBottom: 4 }}>
        <div className="crumb" style={{ margin: 0 }}>Clients › <b>Portfolio · {client.name}</b></div>
        <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
          Client
          <select className="input" style={{ minWidth: 200 }} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>
      <ClientDetail client={client} go={go} screen="carteira" />
    </div>
  );
}

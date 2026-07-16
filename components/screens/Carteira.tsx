"use client";
import { findClient } from "@/lib/clientStore";
import { ClientDetail } from "./Cliente";
import type { ScreenId } from "@/lib/nav";

export default function Carteira({ clientId = "joao-daniel", go }: { clientId?: string; go: (id: ScreenId, param?: string) => void }) {
  const client = findClient(clientId);
  return (
    <div className="screen">
      <div className="crumb">Clientes › <b>Carteira · {client.name}</b></div>
      <ClientDetail client={client} go={go} screen="carteira" />
    </div>
  );
}

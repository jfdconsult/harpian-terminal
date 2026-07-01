"use client";
import { clientById } from "@/lib/clients";
import { ClientDetail } from "./Cliente";
import type { ScreenId } from "@/lib/nav";

export default function Carteira({ clientId = "vera", go }: { clientId?: string; go: (id: ScreenId, param?: string) => void }) {
  const client = clientById(clientId);
  return (
    <div className="screen">
      <div className="crumb">Clientes › <b>Carteira · {client.name}</b></div>
      <ClientDetail client={client} go={go} />
    </div>
  );
}

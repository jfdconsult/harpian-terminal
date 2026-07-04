// Cliente do backend HQP (/v1) — para as telas de Mercado/Intelligence do Terminal
// consumirem os MESMOS dados reais do Cockpit (notícias RSS, social StockTwits, cotações
// Yahoo). Só dado de MERCADO entra aqui — nunca o método (CRS/fórmulas). Confidencialidade
// preservada: o backend só expõe ao Terminal o que é público de mercado.
const HQP_URL = process.env.NEXT_PUBLIC_HQP_API_URL || "http://localhost:8080";

export async function hqpGet<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${HQP_URL}${path}`, {
    headers: { "X-User-Role": "assessor", "X-User-Name": "Terminal MFO" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Proxies to hqp-api's /v1/terminal/portfolios/{email} — mesmo padrao de
// /api/favorites (o Terminal roda em Vercel serverless, sem disco durável,
// entao o registro mora no hqp-api, que tem um volume Fly persistente).
//
// Diferenca de seguranca: o email vem do JWT de sessao (server-side), nao do
// corpo/query da requisicao — um usuario logado nao pode ler/editar
// portfolios de outro so trocando o campo `email`.
const HQP_API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_HQP_API_URL || "http://localhost:8080";

// GET /api/portfolios → lista os portfolios salvos do usuario logado
export async function GET() {
  const email = await getSessionEmail();
  if (!email) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const r = await fetch(`${HQP_API}/v1/terminal/portfolios/${encodeURIComponent(email)}`, { cache: "no-store" });
    const data = await r.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ ok: true, portfolios: [] });
  }
}

// POST /api/portfolios  body: { name, config } → cria um novo portfolio salvo
export async function POST(req: NextRequest) {
  const email = await getSessionEmail();
  if (!email) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  let body: { name?: string; config?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid request" }, { status: 400 });
  }
  const name = (body.name || "").trim();
  if (!name || !body.config) {
    return NextResponse.json({ ok: false, error: "name and config required" }, { status: 400 });
  }
  try {
    const r = await fetch(`${HQP_API}/v1/terminal/portfolios/${encodeURIComponent(email)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, config: body.config }),
    });
    if (!r.ok) return NextResponse.json({ ok: false, error: `hqp-api respondeu ${r.status}` }, { status: 400 });
    const data = await r.json();
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "falha ao salvar" }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HQP_API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_HQP_API_URL || "http://localhost:8080";

// PUT /api/portfolios/{id}  body: { name?, config? } → renomeia/atualiza
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = await getSessionEmail();
  if (!email) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  let body: { name?: string; config?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid request" }, { status: 400 });
  }
  try {
    const r = await fetch(`${HQP_API}/v1/terminal/portfolios/${encodeURIComponent(email)}/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: body.name, config: body.config }),
    });
    if (r.status === 404) return NextResponse.json({ ok: false, error: "não encontrado" }, { status: 404 });
    if (!r.ok) return NextResponse.json({ ok: false, error: `hqp-api respondeu ${r.status}` }, { status: 400 });
    const data = await r.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ ok: false, error: "falha ao atualizar" }, { status: 502 });
  }
}

// DELETE /api/portfolios/{id} → apaga um portfolio salvo do usuario logado
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = await getSessionEmail();
  if (!email) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const r = await fetch(`${HQP_API}/v1/terminal/portfolios/${encodeURIComponent(email)}/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (r.status === 404) return NextResponse.json({ ok: false, error: "não encontrado" }, { status: 404 });
    if (!r.ok) return NextResponse.json({ ok: false, error: `hqp-api respondeu ${r.status}` }, { status: 400 });
    const data = await r.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ ok: false, error: "falha ao apagar" }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Proxies to hqp-api's /v1/terminal/questionnaire — this app is deployed on
// Vercel serverless functions, which have no durable local disk (see
// lib/cache.ts for the same class of issue), so the record lives on the
// already-deployed, longer-lived hqp-api backend instead.
const HQP_API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_HQP_API_URL || "http://localhost:8080";

// GET /api/questionnaire?clientId=...  → record (or null if never answered)
export async function GET(req: NextRequest) {
  const clientId = (req.nextUrl.searchParams.get("clientId") || "").trim();
  if (!clientId) return NextResponse.json({ ok: false, error: "missing clientId" }, { status: 200 });
  try {
    const r = await fetch(`${HQP_API}/v1/terminal/questionnaire/${encodeURIComponent(clientId)}`, { cache: "no-store" });
    const data = await r.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ ok: false, record: null });
  }
}

// POST /api/questionnaire  body: { clientId, answers: number[] }
// Submitted once by the client from /questionario/[id] — computes and stores the profile.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clientId = (body.clientId || "").trim();
    const answers = Array.isArray(body.answers) ? body.answers.filter((a: unknown) => typeof a === "number") : [];
    if (!clientId || answers.length === 0) {
      return NextResponse.json({ ok: false, error: "missing clientId or answers" }, { status: 400 });
    }
    const r = await fetch(`${HQP_API}/v1/terminal/questionnaire`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, answers }),
    });
    if (!r.ok) return NextResponse.json({ ok: false, error: `hqp-api responded ${r.status}` }, { status: 400 });
    const data = await r.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid request" }, { status: 400 });
  }
}

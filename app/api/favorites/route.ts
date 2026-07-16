import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Proxies to hqp-api's /v1/terminal/favorites/{email} — this app is deployed
// on Vercel serverless functions, which have no durable local disk (see
// lib/cache.ts for the same class of issue), so the record lives on the
// already-deployed, longer-lived hqp-api backend instead.
const HQP_API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_HQP_API_URL || "http://localhost:8080";

function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim().toLowerCase());
}

// GET /api/favorites?email=...  → advisor record (or empty)
export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("email") || "").trim().toLowerCase();
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "missing or invalid email" }, { status: 200 });
  }
  try {
    const r = await fetch(`${HQP_API}/v1/terminal/favorites/${encodeURIComponent(email)}`, { cache: "no-store" });
    const data = await r.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      ok: true, email, tickers: [], notif: { enabled: false, hour: "07:00", tz: "America/New_York" }, updatedAt: null,
    });
  }
}

// PUT /api/favorites  body: { email, tickers?, notif? }
// Partial merge: send only what changed. tickers replaces the list; notif merges.
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "invalid email" }, { status: 400 });
    }
    const r = await fetch(`${HQP_API}/v1/terminal/favorites/${encodeURIComponent(email)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickers: body.tickers, notif: body.notif }),
    });
    if (!r.ok) return NextResponse.json({ ok: false, error: `hqp-api responded ${r.status}` }, { status: 400 });
    const data = await r.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid request" }, { status: 400 });
  }
}

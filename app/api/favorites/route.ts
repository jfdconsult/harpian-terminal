import { NextRequest, NextResponse } from "next/server";
import { loadAdvisor, saveAdvisor, isValidEmail, type AdvisorRecord } from "@/lib/favorites-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/favorites?email=...  → advisor record (or empty)
export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("email") || "").trim().toLowerCase();
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "missing or invalid email" }, { status: 200 });
  }
  const rec = await loadAdvisor(email);
  return NextResponse.json({
    ok: true,
    email,
    tickers: rec?.tickers || [],
    notif: rec?.notif || { enabled: false, hour: "07:00", tz: "America/New_York" },
    updatedAt: rec?.updatedAt || null,
  });
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

    const existing = await loadAdvisor(email);
    const rec: AdvisorRecord = {
      email,
      tickers: Array.isArray(body.tickers) ? body.tickers.filter((t: unknown) => typeof t === "string") : existing?.tickers || [],
      notif: {
        enabled: body.notif?.enabled ?? existing?.notif?.enabled ?? false,
        hour: body.notif?.hour ?? existing?.notif?.hour ?? "07:00",
        tz: body.notif?.tz ?? existing?.notif?.tz ?? "America/New_York",
      },
      updatedAt: Date.now(),
    };
    await saveAdvisor(rec);
    return NextResponse.json({ ok: true, tickers: rec.tickers, notif: rec.notif });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid request" }, { status: 400 });
  }
}

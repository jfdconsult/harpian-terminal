import { NextRequest, NextResponse } from "next/server";
import { fetchNewsIntelligence } from "@/lib/jim-knowledge";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Interpreting data = always Sonnet. Extracting/condensing raw data = always Haiku
// (cheaper) — a 2-stage pipeline, they are not interchangeable.
const MODEL_HAIKU = "claude-haiku-4-5-20251001";
const MODEL_SONNET = "claude-sonnet-5";
const GOV_API = process.env.NEXT_PUBLIC_GOV_API_URL || "http://localhost:8877";

interface AxisIn { score: number | null }
interface AnalysisRequest {
  symbol: string;
  name?: string;
  axes: Record<string, AxisIn>;
  raw: Record<string, number | string | null | undefined>;
}

// The analysis changes little day to day — fundamentals are quarterly, only price/news are daily.
// An in-process memory cache avoids reprocessing (Haiku + Sonnet) every time the manager reopens
// the same favorite on the same day.
const CACHE = new Map<string, { at: number; text: string }>();
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12h

async function callAnthropic(apiKey: string, model: string, system: string, userText: string, maxTokens: number) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userText }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${model} HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  // content can have blocks that aren't "text" (e.g. thinking) before the actual text —
  // don't blindly trust content[0].
  const blocks: { type: string; text?: string }[] = data.content || [];
  const text = blocks.filter((b) => b.type === "text").map((b) => b.text || "").join("\n").trim();
  if (!text) {
    console.error(`[JIM company-analysis] ${model} returned no text block. stop_reason=${data.stop_reason}, blocks=${JSON.stringify(blocks).slice(0, 500)}`);
  }
  return { text, usage: data.usage || {}, stopReason: data.stop_reason as string | undefined };
}

// "what came out of the company" — recent official filings via SEC EDGAR full-text search (already built in harpian-gov-data).
async function fetchRecentFilings(company: string): Promise<string> {
  try {
    const res = await fetch(`${GOV_API}/api/filings/search?q=${encodeURIComponent(company)}&limit=8`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    const data = await res.json();
    const results: { filed_at?: string; form_type?: string; company?: string }[] = data.results || [];
    if (!results.length) return "";
    return results.map((r) => `- ${r.filed_at || "?"} · ${r.form_type || "?"} · ${r.company || company}`).join("\n");
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured. Set it in .env.local" }, { status: 500 });
  }

  let body: AnalysisRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { symbol, name, axes, raw } = body;
  if (!symbol || !axes || !raw) {
    return NextResponse.json({ error: "symbol, axes, and raw are required" }, { status: 400 });
  }

  const cacheKey = symbol.toUpperCase();
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json({ analysis: cached.text, cached: true });
  }

  // Stage 0 — raw collection (no LLM, just fetch): SEC filings + today's macro news.
  const [filingsRaw, macroNews] = await Promise.all([
    fetchRecentFilings(name || symbol),
    fetchNewsIntelligence(),
  ]);

  const scoresFlat = Object.fromEntries(Object.entries(axes).map(([k, v]) => [k, v.score]));
  const rawContext = `COMPANY: ${name || symbol} (${symbol})

FUNDAMENTALS (Yahoo Finance):
${JSON.stringify(raw, null, 2)}

SNOWFLAKE SCORES (local heuristic 0-5, Value/Future/Past/Health/Dividend):
${JSON.stringify(scoresFlat, null, 2)}

RECENT FILINGS (SEC EDGAR full-text search):
${filingsRaw || "no recent filings found in the search"}

TODAY'S MACRO NEWS (JD NEWS, general market context, not company-specific):
${macroNews || "no macro news available right now"}`;

  // Stage 1 — HAIKU extracts/condenses the raw facts (cheap, no interpretation).
  let digest: string;
  try {
    const r = await callAnthropic(
      apiKey,
      MODEL_HAIKU,
      "You extract objective facts from raw financial data, no opinion and no fluff. " +
        "Respond with only a list of up to 8 short bullets covering the most relevant facts in this data " +
        "for someone evaluating the company. English.",
      rawContext,
      500
    );
    digest = r.text || rawContext;
  } catch {
    digest = rawContext; // Haiku failed — send the raw data straight to Sonnet instead of blocking the analysis
  }

  // Stage 2 — SONNET interprets and writes the analysis (where the actual reasoning happens).
  const sonnetSystem = `You are JIM, the Harpian Terminal's AI assistant, writing a proactive read on ${symbol} for the manager.

Respond in English, in markdown, straight to the point — no filler. Structure:
## ${symbol} — JIM's Read
**Thesis in 1 sentence**
**Strengths** (2-3 bullets)
**Points of attention / risks** (2-3 bullets)
**Valuation read** (do the multiples make sense for what the company delivers?)
**Verdict** — not a buy/sell recommendation, it's context for the manager to decide.

Base this SOLELY on the data provided — never invent a number that isn't there. Be honest about the limitation: this is a heuristic over public fundamentals (Yahoo Finance) + SEC filings, it is not the HCE, not a proprietary Harpian signal.`;

  try {
    const r = await callAnthropic(apiKey, MODEL_SONNET, sonnetSystem, `Extracted facts:\n${digest}`, 2000);
    if (!r.text) {
      return NextResponse.json({ error: `JIM returned no text (stop_reason: ${r.stopReason || "?"})` }, { status: 502 });
    }
    CACHE.set(cacheKey, { at: Date.now(), text: r.text }); // only cache non-empty results
    return NextResponse.json({
      analysis: r.text,
      cached: false,
      pipeline: { extraction_model: MODEL_HAIKU, interpretation_model: MODEL_SONNET },
      tokens: { sonnet_input: r.usage.input_tokens || 0, sonnet_output: r.usage.output_tokens || 0 },
    });
  } catch (e) {
    console.error("[JIM company-analysis] Sonnet failed:", e);
    return NextResponse.json({ error: "Failed to generate analysis" }, { status: 502 });
  }
}

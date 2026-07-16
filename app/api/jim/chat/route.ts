import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt, getScreenContext } from "@/lib/jim-context";
import { consultBlackLibrary, fetchNewsIntelligence, buildKnowledgeContext } from "@/lib/jim-knowledge";
import type { ScreenId } from "@/lib/nav";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: Message[];
  screen: ScreenId;
  model?: "haiku" | "sonnet";
  screenData?: unknown;
  screenSummary?: string | null;
}

// Injects the data currently VISIBLE on screen so JIM can see it and answer
// directly — never asking "what are you looking at?". Truncates to avoid blowing the token budget.
function buildScreenDataContext(summary: string | null | undefined, data: unknown): string {
  if (data == null) return "";
  let json = "";
  try {
    json = JSON.stringify(data);
  } catch {
    return "";
  }
  if (!json || json === "null" || json === "[]" || json === "{}") return "";
  const MAX = 8000;
  const truncated = json.length > MAX ? json.slice(0, MAX) + " …(list truncated)" : json;
  return (
    "\n\n--- DATA CURRENTLY VISIBLE ON SCREEN (you SEE this) ---\n" +
    (summary ? summary + "\n" : "") +
    "This is the real data rendered on the manager's screen RIGHT NOW, in JSON. " +
    "If the question is about any item here (a company, a ticker, a row, a number), " +
    "find it in this data and answer directly with the real values. NEVER ask what they're looking at.\n\n" +
    truncated
  );
}

const MODEL_MAP: Record<string, string> = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-5",
};

const BOOK_SEARCH_URL = process.env.BOOK_SEARCH_URL || "http://localhost:8878";

interface BookResult {
  content: string;
  citation: {
    book: string;
    author: string;
    category: string;
    pages: string;
    chapter: string | null;
  };
  score: number;
}

async function searchBooks(query: string, limit = 3): Promise<BookResult[]> {
  try {
    const res = await fetch(
      `${BOOK_SEARCH_URL}/search?q=${encodeURIComponent(query)}&limit=${limit}`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

function buildBookContext(results: BookResult[]): string {
  if (!results.length) return "";
  const citations = results.map((r, i) => {
    const src = r.citation;
    const ref = [
      src.book,
      src.author ? `by ${src.author}` : "",
      src.pages ? `p. ${src.pages}` : "",
      src.chapter || "",
    ]
      .filter(Boolean)
      .join(", ");
    return `[${i + 1}] ${ref}\n${r.content.slice(0, 600)}`;
  });
  return (
    "\n\n--- RELEVANT EXCERPTS FROM THE LIBRARY ---\n" +
    "Use these sources to back up your answer. Cite as: (Book, p. XX).\n\n" +
    citations.join("\n\n")
  );
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured. Set it in .env.local" },
      { status: 500 }
    );
  }

  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages, screen, model = "haiku", screenData, screenSummary } = body;
  if (!messages?.length) {
    return NextResponse.json({ error: "No messages" }, { status: 400 });
  }

  const ctx = getScreenContext(screen || "painel");
  let systemPrompt = buildSystemPrompt(ctx);
  systemPrompt += buildScreenDataContext(screenSummary, screenData);
  const modelId = MODEL_MAP[model] || MODEL_MAP.haiku;

  const sources = { books: false, blackLibrary: false, news: false };
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  if (lastUserMsg) {
    const [bookResults, blContext, newsContext] = await Promise.all([
      searchBooks(lastUserMsg.content),
      consultBlackLibrary(lastUserMsg.content),
      fetchNewsIntelligence(),
    ]);
    if (bookResults.length) sources.books = true;
    if (blContext) sources.blackLibrary = true;
    if (newsContext) sources.news = true;
    systemPrompt += buildBookContext(bookResults);
    systemPrompt += buildKnowledgeContext(blContext, newsContext);
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 2048,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[JIM] Anthropic API error:", res.status, err);
      return NextResponse.json(
        { error: `API error: ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    // content can have blocks that aren't "text" (e.g. thinking) before the real text —
    // don't blindly trust content[0].
    const blocks: { type: string; text?: string }[] = data.content || [];
    const text =
      blocks.filter((b) => b.type === "text").map((b) => b.text || "").join("\n").trim() ||
      "Sorry, I couldn't process your question.";
    const usage = data.usage || {};

    return NextResponse.json({
      reply: text,
      model: modelId,
      tokens: {
        input: usage.input_tokens || 0,
        output: usage.output_tokens || 0,
      },
      sources,
    });
  } catch (e) {
    console.error("[JIM] Request failed:", e);
    return NextResponse.json(
      { error: "Failed to reach Claude API" },
      { status: 502 }
    );
  }
}

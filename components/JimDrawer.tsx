"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { getScreenContext, getScreenSuggestions } from "@/lib/jim-context";
import { readScreenData, subscribeScreenData, type ScreenSnapshot } from "@/lib/jim-data";
import type { ScreenId } from "@/lib/nav";

interface Msg {
  role: "user" | "assistant";
  content: string;
  ts: number;
  model?: string;
  tokens?: { input: number; output: number };
  greeting?: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  screen: ScreenId;
}

function TypingDots() {
  return (
    <span className="jim-typing">
      <span />
      <span />
      <span />
    </span>
  );
}

function MsgBubble({ msg }: { msg: Msg }) {
  if (msg.role === "user") {
    return (
      <div className="jim-msg jim-msg-user">
        <div className="jim-msg-content">{msg.content}</div>
      </div>
    );
  }
  return (
    <div className="jim-msg jim-msg-ai">
      <div className="jim-msg-avatar">
        <i className="ti ti-sparkles" />
      </div>
      <div className="jim-msg-body">
        <div className="jim-msg-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
        {msg.model && (
          <div className="jim-msg-meta">
            {msg.model.includes("haiku") ? "Haiku" : "Sonnet"} · {(msg.tokens?.input || 0) + (msg.tokens?.output || 0)} tokens
          </div>
        )}
      </div>
    </div>
  );
}

function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code style="background:rgba(201,160,44,.12);padding:1px 5px;border-radius:3px;font-family:var(--mono);font-size:12px">$1</code>')
    .replace(/^- (.+)/gm, "• $1")
    .replace(/^(\d+)\. (.+)/gm, "$1. $2")
    .replace(/\n/g, "<br/>");
}

// Monta a saudação data-aware: nomeia a tela e o item com os dados reais.
function buildGreeting(screen: ScreenId, snap: ScreenSnapshot | null): string {
  const ctx = getScreenContext(screen);
  const lead = snap?.briefing || ctx.description;
  return `Você está na tela **${ctx.title}**.\n\n${lead}\n\nQual a sua dúvida sobre isso? Toque numa das perguntas abaixo ou digite a sua.`;
}

export default function JimDrawer({ open, onClose, screen }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [usesSonnet, setUsesSonnet] = useState(false);
  const [greeted, setGreeted] = useState<ScreenId | null>(null);
  const [greetHadBriefing, setGreetHadBriefing] = useState(false);
  const [snap, setSnap] = useState<ScreenSnapshot | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
  }, []);

  // Assina os dados da tela atual — atualiza saudação/chips quando a tela publica.
  useEffect(() => {
    setSnap(readScreenData(screen));
    const unsub = subscribeScreenData((s) => {
      if (s.screen === screen) setSnap(s);
    });
    return unsub;
  }, [screen]);

  // Saudação ao abrir / trocar de tela — usa o melhor dado disponível na hora.
  useEffect(() => {
    if (open && greeted !== screen) {
      const cur = readScreenData(screen);
      const greeting: Msg = {
        role: "assistant",
        content: buildGreeting(screen, cur),
        ts: Date.now(),
        greeting: true,
      };
      setMessages((prev) => [...prev, greeting]);
      setGreeted(screen);
      setGreetHadBriefing(!!cur?.briefing);
      scrollToEnd();
    }
  }, [open, screen, greeted, scrollToEnd]);

  // Se os dados (briefing) chegarem DEPOIS da saudação, atualiza a saudação in-place.
  useEffect(() => {
    if (!open || greeted !== screen || greetHadBriefing || !snap?.briefing) return;
    const newContent = buildGreeting(screen, snap);
    setMessages((prev) => {
      const idx = prev.map((m) => m.greeting).lastIndexOf(true);
      if (idx === -1) return prev;
      const copy = [...prev];
      copy[idx] = { ...copy[idx], content: newContent };
      return copy;
    });
    setGreetHadBriefing(true);
  }, [snap, open, screen, greeted, greetHadBriefing]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  useEffect(scrollToEnd, [messages, scrollToEnd]);

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || loading) return;
    setInput("");

    const userMsg: Msg = { role: "user", content: text, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const history = [...messages.filter((m) => m.role === "user" || m.role === "assistant"), userMsg]
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }));

    const cur = readScreenData(screen);

    try {
      const res = await fetch("/api/jim/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          screen,
          model: usesSonnet ? "sonnet" : "haiku",
          screenData: cur?.rows ?? null,
          screenSummary: cur?.summary ?? null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const aiMsg: Msg = {
        role: "assistant",
        content: data.reply,
        ts: Date.now(),
        model: data.model,
        tokens: data.tokens,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      const errMsg: Msg = {
        role: "assistant",
        content: `⚠ Erro: ${e instanceof Error ? e.message : "Falha na comunicação"}.\n\nVerifique se a chave \`ANTHROPIC_API_KEY\` está configurada em \`.env.local\`.`,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearHistory = () => {
    setMessages([]);
    setGreeted(null);
    setGreetHadBriefing(false);
  };

  const ctx = getScreenContext(screen);
  // Perguntas prováveis: dinâmicas (data-aware) da tela, senão o fallback estático.
  const suggestions = snap?.suggestions?.length ? snap.suggestions : getScreenSuggestions(screen);

  return (
    <>
      {open && <div className="jim-overlay" onClick={onClose} />}
      <div className={`jim-drawer${open ? " open" : ""}`}>
        {/* Header */}
        <div className="jim-header">
          <div className="jim-header-left">
            <div className="jim-logo"><i className="ti ti-sparkles" /></div>
            <div>
              <div className="jim-title">JIM</div>
              <div className="jim-subtitle">Harpian Intelligence</div>
            </div>
          </div>
          <div className="jim-header-actions">
            <button className="jim-hbtn" onClick={clearHistory} title="Limpar conversa">
              <i className="ti ti-trash" />
            </button>
            <button className="jim-hbtn" onClick={onClose} title="Fechar">
              <i className="ti ti-x" />
            </button>
          </div>
        </div>

        {/* Context strip */}
        <div className="jim-ctx">
          <i className="ti ti-eye" />
          <span>{ctx.title}</span>
          <div className="jim-model-toggle" onClick={() => setUsesSonnet(!usesSonnet)} title={usesSonnet ? "Sonnet (análise profunda)" : "Haiku (rápido)"}>
            <i className={`ti ${usesSonnet ? "ti-brain" : "ti-bolt"}`} />
            {usesSonnet ? "Sonnet" : "Haiku"}
          </div>
        </div>

        {/* Messages */}
        <div className="jim-messages">
          {messages.length === 0 && (
            <div className="jim-empty">
              <i className="ti ti-sparkles" />
              <div>JIM está pronto para ajudar.</div>
              <div className="jim-empty-sub">Pergunte sobre o que está vendo na tela, peça uma análise, ou tire dúvidas sobre teoria de investimentos.</div>
            </div>
          )}

          {messages.map((m, i) => (
            <MsgBubble key={i} msg={m} />
          ))}

          {loading && (
            <div className="jim-msg jim-msg-ai">
              <div className="jim-msg-avatar"><i className="ti ti-sparkles" /></div>
              <div className="jim-msg-body">
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Chips de perguntas prováveis desta tela (menu interativo) */}
        {!loading && (
          <div className="jim-chips">
            {suggestions.map((q, i) => (
              <button key={i} className="jim-chip" onClick={() => send(q)} title={q}>
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="jim-input-area">
          <div className="jim-input-wrap">
            <textarea
              ref={inputRef}
              className="jim-input"
              placeholder="Pergunte ao JIM..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
            />
            <button
              className={`jim-send${input.trim() ? " active" : ""}`}
              onClick={() => send()}
              disabled={!input.trim() || loading}
            >
              <i className="ti ti-send" />
            </button>
          </div>
          <div className="jim-disclaimer">
            JIM usa IA (Claude) e pode cometer erros. Verifique informações importantes.
          </div>
        </div>
      </div>
    </>
  );
}

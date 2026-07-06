import { promises as fs } from "fs";
import path from "path";

export interface SessionMessage {
  role: "user" | "assistant";
  content: string;
  ts: number;
  model?: string;
  tokens?: { input: number; output: number };
  greeting?: boolean;
  screen?: string;
}

export interface JimSession {
  id: string;
  messages: SessionMessage[];
  createdAt: number;
  updatedAt: number;
  screens: string[];
}

const SESSIONS_DIR = path.join(process.cwd(), "data", "jim-sessions");
const MAX_MESSAGES = 200;

async function ensureDir() {
  await fs.mkdir(SESSIONS_DIR, { recursive: true });
}

function sessionPath(id: string): string {
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(SESSIONS_DIR, `${safe}.json`);
}

export async function loadSession(id: string): Promise<JimSession | null> {
  try {
    const raw = await fs.readFile(sessionPath(id), "utf-8");
    return JSON.parse(raw) as JimSession;
  } catch {
    return null;
  }
}

export async function saveSession(session: JimSession): Promise<void> {
  await ensureDir();
  if (session.messages.length > MAX_MESSAGES) {
    session.messages = session.messages.slice(-MAX_MESSAGES);
  }
  session.updatedAt = Date.now();
  await fs.writeFile(sessionPath(session.id), JSON.stringify(session), "utf-8");
}

export async function appendMessages(
  sessionId: string,
  msgs: SessionMessage[],
  screen?: string,
): Promise<JimSession> {
  let session = await loadSession(sessionId);
  if (!session) {
    session = {
      id: sessionId,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      screens: [],
    };
  }
  session.messages.push(...msgs);
  if (screen && !session.screens.includes(screen)) {
    session.screens.push(screen);
  }
  await saveSession(session);
  return session;
}

export async function clearSession(id: string): Promise<void> {
  try {
    await fs.unlink(sessionPath(id));
  } catch {}
}

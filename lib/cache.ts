import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "fs";
import { createHash } from "crypto";
import { join } from "path";
import { tmpdir } from "os";

// Vercel's serverless functions only allow writes under /tmp — the rest of
// the filesystem (including process.cwd()) is read-only. Locally this just
// resolves to a .cache/ folder in the repo, same as before.
const CACHE_DIR = process.env.VERCEL ? join(tmpdir(), "harpian-cache") : join(process.cwd(), ".cache");

function ensureDir() {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
}

// Hash of the key → short, safe file name. Long keys (e.g.: 70 tickers in a
// watchlist) blew past the Windows path limit (MAX_PATH ~260) and broke
// writeFileSync. The readable prefix helps when inspecting .cache manually.
function fileFor(key: string): string {
  const h = createHash("sha1").update(key).digest("hex").slice(0, 16);
  const prefix = key.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 40);
  return join(CACHE_DIR, `${prefix}_${h}.json`);
}

// Caching is a performance optimization, not a correctness requirement — any
// filesystem failure here (read-only FS, permissions, disk full) degrades to
// "always fetch fresh" instead of crashing the calling API route.

export function cacheGet<T>(key: string, maxAgeMs: number): T | null {
  try {
    const path = fileFor(key);
    if (!existsSync(path)) return null;
    const age = Date.now() - statSync(path).mtimeMs;
    if (age > maxAgeMs) return null;
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return null;
  }
}

export function cacheSet(key: string, data: unknown): void {
  try {
    ensureDir();
    writeFileSync(fileFor(key), JSON.stringify(data), "utf-8");
  } catch {
    // best-effort — a failed write just means the next request fetches fresh again
  }
}

export function cacheAge(key: string): number | null {
  try {
    const path = fileFor(key);
    if (!existsSync(path)) return null;
    return Date.now() - statSync(path).mtimeMs;
  } catch {
    return null;
  }
}

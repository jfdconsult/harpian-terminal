import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "fs";
import { createHash } from "crypto";
import { join } from "path";

const CACHE_DIR = join(process.cwd(), ".cache");

function ensureDir() {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
}

// Hash da chave → nome de arquivo curto e seguro. Chaves longas (ex.: 70 tickers numa
// watchlist) estouravam o limite de caminho do Windows (MAX_PATH ~260) e quebravam o
// writeFileSync. O prefixo legível ajuda a inspecionar o .cache manualmente.
function fileFor(key: string): string {
  const h = createHash("sha1").update(key).digest("hex").slice(0, 16);
  const prefix = key.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 40);
  return join(CACHE_DIR, `${prefix}_${h}.json`);
}

export function cacheGet<T>(key: string, maxAgeMs: number): T | null {
  const path = fileFor(key);
  if (!existsSync(path)) return null;
  const age = Date.now() - statSync(path).mtimeMs;
  if (age > maxAgeMs) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return null;
  }
}

export function cacheSet(key: string, data: unknown): void {
  ensureDir();
  writeFileSync(fileFor(key), JSON.stringify(data), "utf-8");
}

export function cacheAge(key: string): number | null {
  const path = fileFor(key);
  if (!existsSync(path)) return null;
  return Date.now() - statSync(path).mtimeMs;
}

import { promises as fs } from "fs";
import path from "path";

// ============================================================
// Favorites store on the SERVER (one JSON file per advisor)
// ------------------------------------------------------------
// Same pattern as lib/jim-sessions.ts: one file per key in data/, no
// database or new dependency. The key is the advisor's email (the only
// identity the terminal has — there's no login).
//
// Why on the server and not just localStorage: (1) it survives clearing the
// cache and carries over from one device to another; (2) the overnight job
// (Python, in the overnight folder) reads these files to build the summary
// email — it's the bridge between the two codebases.
//
// Accepted limitation: JSON on local disk. Works for a single advisor /
// single instance (the presentation scenario). Not safe under concurrent
// writes or multi-instance serverless deploys — swap for KV/DB when scaling.
// ============================================================

export interface AdvisorRecord {
  email: string;
  tickers: string[];
  notif: { enabled: boolean; hour: string; tz: string };
  updatedAt: number;
}

const DIR = path.join(process.cwd(), "data", "favorites");

async function ensureDir() {
  await fs.mkdir(DIR, { recursive: true });
}

// Safe filename derived from the email. Stays readable so the overnight job
// can find it, but strips anything unsafe in a path.
function recordPath(email: string): string {
  const safe = email.trim().toLowerCase().replace(/[^a-z0-9_.@+-]/g, "_");
  return path.join(DIR, `${safe}.json`);
}

export function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim().toLowerCase());
}

export async function loadAdvisor(email: string): Promise<AdvisorRecord | null> {
  try {
    const raw = await fs.readFile(recordPath(email), "utf-8");
    return JSON.parse(raw) as AdvisorRecord;
  } catch {
    return null;
  }
}

export async function saveAdvisor(rec: AdvisorRecord): Promise<void> {
  await ensureDir();
  rec.updatedAt = Date.now();
  await fs.writeFile(recordPath(rec.email), JSON.stringify(rec, null, 2), "utf-8");
}

/** Lists all advisors — used by the overnight job to know who to send to. */
export async function listAdvisors(): Promise<AdvisorRecord[]> {
  try {
    const files = await fs.readdir(DIR);
    const out: AdvisorRecord[] = [];
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      try {
        out.push(JSON.parse(await fs.readFile(path.join(DIR, f), "utf-8")) as AdvisorRecord);
      } catch {}
    }
    return out;
  } catch {
    return [];
  }
}

"use client";
// ============================================================
// Advisor favorites — localStorage (instant) + server (if email set)
// ------------------------------------------------------------
// Screens use getFavorites()/toggleFavorite() SYNCHRONOUSLY — this API
// doesn't change: reads and writes stay instant on localStorage, so the
// star responds immediately, with or without an email configured.
//
// If the advisor has set up their email (Settings › Morning email), every
// change is also pushed to the server in the background, and when the app
// opens the server favorites become the source of truth (they survive
// clearing the cache and carry over from one device to another). Without an
// email, behavior is identical to before — nothing breaks.
// ============================================================
import { getUserEmail, getNotifPrefs } from "./user-prefs";

const KEY = "harpian_favoritos";

export function getFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const r = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

function writeLocal(list: string[]): void {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(list));
}

export function toggleFavorite(sym: string): string[] {
  const cur = getFavorites();
  const next = cur.includes(sym) ? cur.filter((s) => s !== sym) : [...cur, sym];
  writeLocal(next);
  pushToServer(next); // fire-and-forget; no-op without an email
  return next;
}

// ── Server synchronization (only when there's an email) ──

/** Pushes the current list to the server. Silent: a network failure doesn't affect the UI. */
export function pushToServer(list?: string[]): void {
  const email = getUserEmail();
  if (!email || typeof window === "undefined") return;
  const tickers = list ?? getFavorites();
  const p = getNotifPrefs();
  fetch("/api/favorites", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, tickers, notif: { enabled: p.enabled, hour: p.hour, tz: p.tz } }),
  }).catch(() => {});
}

/**
 * When the app opens: if there's an email, pull from the server.
 *  - server has a list → becomes the source of truth (updates localStorage)
 *  - server is empty but local has data → migrates local to the server (first time)
 * Returns the effective list. Without an email, returns localStorage without touching the network.
 */
export async function syncFromServer(): Promise<string[]> {
  const email = getUserEmail();
  if (!email) return getFavorites();
  try {
    const r = await fetch(`/api/favorites?email=${encodeURIComponent(email)}`, { cache: "no-store" });
    const d = await r.json();
    if (d.ok && Array.isArray(d.tickers) && d.tickers.length) {
      writeLocal(d.tickers);
      return d.tickers;
    }
    // server is empty: migrate whatever exists locally
    const local = getFavorites();
    if (local.length) pushToServer(local);
    return local;
  } catch {
    return getFavorites();
  }
}

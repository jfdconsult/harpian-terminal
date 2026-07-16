"use client";
// ============================================================
// Advisor preferences (client-side) — identity = email
// ------------------------------------------------------------
// The terminal has no login. The email the advisor fills in under
// settings ("Morning email") is the only identity that exists, so it's
// what serves as the key for: (a) syncing favorites on the server across
// devices, and (b) the overnight job knowing who to send the summary to.
//
// These prefs used to live only inside the SettingsDrawer, written to
// localStorage with no other use. Extracted here so favorites can also
// see the email.
// ============================================================

const NOTIF_STORAGE = "harpian-notif";

export interface NotifPrefs {
  enabled: boolean;
  email: string;
  hour: string; // "HH:MM"
  tz: string;
}

export function detectTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "America/New_York";
  }
}

export function getNotifPrefs(): NotifPrefs {
  if (typeof window === "undefined") return { enabled: false, email: "", hour: "07:00", tz: "America/New_York" };
  try {
    const raw = localStorage.getItem(NOTIF_STORAGE);
    if (raw) return JSON.parse(raw) as NotifPrefs;
  } catch {}
  return { enabled: false, email: "", hour: "07:00", tz: detectTz() };
}

export function saveNotifPrefs(p: NotifPrefs): void {
  if (typeof window !== "undefined") localStorage.setItem(NOTIF_STORAGE, JSON.stringify(p));
}

/** Normalized email (lowercase, no spaces) or "" if not set / invalid. */
export function getUserEmail(): string {
  const e = getNotifPrefs().email.trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) ? e : "";
}

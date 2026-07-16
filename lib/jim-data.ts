// ============================================================
// JIM — Screen data bus (what JIM SEES)
// ------------------------------------------------------------
// Each data screen publishes here what it's currently displaying.
// When the manager asks JIM about something on the screen
// (a company, a row, a number), JIM reads this snapshot and
// answers directly — it NEVER asks "what are you looking at?".
//
// Besides the data, a screen can publish:
//  - briefing: 1 sentence with the REAL DATA for JIM's greeting
//    ("You're on the NVDA stock, +131% year-to-date, strong momentum…")
//  - suggestions: the 3 most likely questions about that item,
//    which become clickable chips on JIM's bar.
//
// It's a module singleton: the client bundle shares the instance,
// so the screen and JIM's drawer see the same store without prop drilling.
// ============================================================

export interface ScreenExtra {
  /** Data-aware sentence for the greeting: "You're looking at stock X, momentum such, risk such." */
  briefing?: string;
  /** The 3 most likely questions about the current item (clickable chips). */
  suggestions?: string[];
}

export interface ScreenSnapshot extends ScreenExtra {
  screen: string;
  /** 1 line of what the screen shows, in English (context for JIM). */
  summary: string;
  /** Structured data currently visible (table/list rows). */
  rows: unknown;
  capturedAt: number;
}

const store: Record<string, ScreenSnapshot> = {};
type Listener = (s: ScreenSnapshot) => void;
const listeners = new Set<Listener>();

/** The screen calls this whenever its data loads/changes. */
export function publishScreenData(
  screen: string,
  summary: string,
  rows: unknown,
  extra?: ScreenExtra
): void {
  const snap: ScreenSnapshot = {
    screen,
    summary,
    rows,
    briefing: extra?.briefing,
    suggestions: extra?.suggestions,
    capturedAt: Date.now(),
  };
  store[screen] = snap;
  listeners.forEach((fn) => fn(snap));
}

/** JIM reads this at the moment the question is sent. */
export function readScreenData(screen: string): ScreenSnapshot | null {
  return store[screen] || null;
}

/** JIM's drawer subscribes to update the greeting/chips whenever a screen publishes. */
export function subscribeScreenData(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

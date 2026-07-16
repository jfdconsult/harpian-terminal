// ============================================================
// JIM — "Ask for me" bus (askJim)
// ------------------------------------------------------------
// Any screen can call askJim("...") to open the JIM drawer and
// automatically fire off the question, without the user having to
// open the chat and click a chip manually. E.g.: click a fundamental
// data point (P/E, ROE...) and immediately get JIM's read on that
// number.
//
// Same module-singleton pattern as jim-data.ts — two subscribers
// today: Terminal.tsx (opens the drawer) and JimDrawer.tsx
// (sends the question).
// ============================================================

type AskListener = (question: string) => void;
const listeners = new Set<AskListener>();

export function askJim(question: string): void {
  listeners.forEach((fn) => fn(question));
}

export function subscribeAskJim(fn: AskListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

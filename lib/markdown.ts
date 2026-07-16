// Minimalist markdown renderer shared by JIM's responses
// (side chat and proactive analysis panels). Extracted from JimDrawer.tsx.
export function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code style="background:rgba(201,160,44,.12);padding:1px 5px;border-radius:3px;font-family:var(--mono);font-size:12px">$1</code>')
    .replace(/^## (.+)/gm, '<div style="font-size:15px;font-weight:700;color:var(--gold);margin:10px 0 4px">$1</div>')
    .replace(/^- (.+)/gm, "• $1")
    .replace(/^(\d+)\. (.+)/gm, "$1. $2")
    .replace(/\n/g, "<br/>");
}

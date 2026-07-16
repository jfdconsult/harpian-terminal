"use client";
import type { ScreenId } from "@/lib/nav";

// Back button to the consolidated Market Overview.
// Always in the same place (top-right corner, on the crumb line) on
// EVERY Market screen — a predictable position is what stops the user
// from having to search (Krug: don't make me think).
export default function BackToVisao({ go }: { go?: (id: ScreenId, param?: string) => void }) {
  if (!go) return null;
  return (
    <button
      onClick={() => go("mercado-visao")}
      title="Back to the consolidated Market Overview"
      style={{
        marginLeft: "auto",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "var(--mono)",
        fontSize: 10,
        padding: "4px 10px",
        borderRadius: 5,
        cursor: "pointer",
        border: "1px solid var(--line2)",
        background: "transparent",
        color: "var(--tx3)",
        transition: "border-color .15s, color .15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(201,160,44,.45)";
        e.currentTarget.style.color = "var(--gold)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--line2)";
        e.currentTarget.style.color = "var(--tx3)";
      }}
    >
      <i className="ti ti-arrow-left" style={{ fontSize: 12 }} />
      Back to Overview
    </button>
  );
}

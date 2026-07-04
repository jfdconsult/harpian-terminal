"use client";
// Favoritos das Cotações — persistidos no navegador do usuário do Terminal (localStorage).
// Ele marca a estrelinha em qualquer classe e monta a própria lista.
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

export function toggleFavorite(sym: string): string[] {
  const cur = getFavorites();
  const next = cur.includes(sym) ? cur.filter((s) => s !== sym) : [...cur, sym];
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

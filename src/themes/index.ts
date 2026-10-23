import type { Theme } from "./types";
import { halloween } from "./halloween";
export type { Theme };
/** Register theme packs here. Month (0-11) -> theme id for the default. */
export const THEMES: Record<string, Theme> = { halloween };
const BY_MONTH: Record<number, string> = { 9: "halloween" /* 10: "thanksgiving", 11: "christmas" */ };
export function pickTheme(search = typeof location !== "undefined" ? location.search : "", now = new Date()): Theme {
  const q = new URLSearchParams(search).get("theme");
  if (q && THEMES[q]) return THEMES[q];
  return THEMES[BY_MONTH[now.getMonth()]] ?? halloween;
}

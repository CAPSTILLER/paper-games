// Pure Hang Mannequin (kid-friendly hangman) logic.
export interface MannequinState {
  word: string; hint: string;
  guessed: string[]; wrong: string[];
  maxWrong: number;
  status: "playing" | "won" | "lost";
}
export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export function newMannequin(word: string, hint = "", maxWrong = 6): MannequinState {
  return { word: word.toUpperCase(), hint, guessed: [], wrong: [], maxWrong, status: "playing" };
}
export const uniqueLetters = (w: string) => [...new Set(w.toUpperCase().replace(/[^A-Z]/g, "").split(""))];
export function guess(s: MannequinState, letter: string): MannequinState {
  const L = letter.toUpperCase();
  if (s.status !== "playing" || !/^[A-Z]$/.test(L) || s.guessed.includes(L) || s.wrong.includes(L)) return s;
  if (s.word.includes(L)) {
    const guessed = [...s.guessed, L];
    const won = uniqueLetters(s.word).every((x) => guessed.includes(x));
    return { ...s, guessed, status: won ? "won" : "playing" };
  }
  const wrong = [...s.wrong, L];
  return { ...s, wrong, status: wrong.length >= s.maxWrong ? "lost" : "playing" };
}
/** Word with blanks, e.g. "P _ M P _ _ N". Spaces are shown as a gap. */
export const masked = (s: MannequinState) => s.word.split("").map((ch) => (ch === " " ? " " : s.guessed.includes(ch) || s.status === "lost" ? ch : "_"));
/** 0..1 share of the display that's built (correct letters found / total unique letters). */
export const progress = (s: MannequinState) => s.guessed.length / uniqueLetters(s.word).length;
/** Number of display pieces (of `total`) to show. */
export const piecesShown = (s: MannequinState, total: number) => s.status === "won" ? total : Math.min(total, Math.floor(progress(s) * total));

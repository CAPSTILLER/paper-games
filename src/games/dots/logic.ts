// Pure dots & boxes logic. Board of W x H boxes, (W+1)x(H+1) dots.
export type P = 1 | 2;
export interface DotsState {
  w: number; h: number;
  hLines: (0 | P)[]; // (h+1) rows * w : horizontal edge at row r, col c -> r*w+c
  vLines: (0 | P)[]; // h rows * (w+1) : vertical edge at row r, col c -> r*(w+1)+c
  boxes: (0 | P)[];  // h*w owners
  turn: P; score: [number, number]; over: boolean;
}
export type Edge = { kind: "h" | "v"; r: number; c: number };
export const newDots = (w = 10, h = 10): DotsState => ({
  w, h, hLines: Array((h + 1) * w).fill(0), vLines: Array(h * (w + 1)).fill(0),
  boxes: Array(w * h).fill(0), turn: 1, score: [0, 0], over: false,
});
const hIdx = (s: DotsState, r: number, c: number) => r * s.w + c;
const vIdx = (s: DotsState, r: number, c: number) => r * (s.w + 1) + c;
export function sidesOf(s: DotsState, r: number, c: number) {
  return (s.hLines[hIdx(s, r, c)] ? 1 : 0) + (s.hLines[hIdx(s, r + 1, c)] ? 1 : 0)
    + (s.vLines[vIdx(s, r, c)] ? 1 : 0) + (s.vLines[vIdx(s, r, c + 1)] ? 1 : 0);
}
export function isTaken(s: DotsState, e: Edge) {
  return e.kind === "h" ? !!s.hLines[hIdx(s, e.r, e.c)] : !!s.vLines[vIdx(s, e.r, e.c)];
}
function adjBoxes(s: DotsState, e: Edge): [number, number][] {
  const out: [number, number][] = [];
  if (e.kind === "h") { if (e.r > 0) out.push([e.r - 1, e.c]); if (e.r < s.h) out.push([e.r, e.c]); }
  else { if (e.c > 0) out.push([e.r, e.c - 1]); if (e.c < s.w) out.push([e.r, e.c]); }
  return out;
}
export function legalEdges(s: DotsState): Edge[] {
  const out: Edge[] = [];
  for (let r = 0; r <= s.h; r++) for (let c = 0; c < s.w; c++) if (!s.hLines[hIdx(s, r, c)]) out.push({ kind: "h", r, c });
  for (let r = 0; r < s.h; r++) for (let c = 0; c <= s.w; c++) if (!s.vLines[vIdx(s, r, c)]) out.push({ kind: "v", r, c });
  return out;
}
/** Draw an edge. Completing one or two boxes scores them and keeps the turn. */
export function drawEdge(s: DotsState, e: Edge): { state: DotsState; completed: number } {
  if (s.over || isTaken(s, e)) return { state: s, completed: 0 };
  const n: DotsState = { ...s, hLines: s.hLines.slice(), vLines: s.vLines.slice(), boxes: s.boxes.slice(), score: [...s.score] as [number, number] };
  if (e.kind === "h") n.hLines[hIdx(n, e.r, e.c)] = s.turn; else n.vLines[vIdx(n, e.r, e.c)] = s.turn;
  let completed = 0;
  for (const [r, c] of adjBoxes(n, e)) if (sidesOf(n, r, c) === 4 && !n.boxes[r * n.w + c]) { n.boxes[r * n.w + c] = s.turn; completed++; }
  n.score[s.turn - 1] += completed;
  if (!completed) n.turn = s.turn === 1 ? 2 : 1;
  n.over = n.boxes.every((b) => b);
  return { state: n, completed };
}
export const winner = (s: DotsState): P | "draw" | null => !s.over ? null : s.score[0] === s.score[1] ? "draw" : s.score[0] > s.score[1] ? 1 : 2;

/** Easy: take a box if one is there, else random. Medium: also avoid giving a 3rd side. */
export function aiDots(s: DotsState, level: "easy" | "medium", r: () => number = Math.random): Edge {
  const legal = legalEdges(s);
  const pick = (a: Edge[]) => a[Math.floor(r() * a.length)];
  const takes = legal.filter((e) => adjBoxes(s, e).some(([y, x]) => sidesOf(s, y, x) === 3));
  if (takes.length) return pick(takes);
  if (level === "easy") return pick(legal);
  const safe = legal.filter((e) => adjBoxes(s, e).every(([y, x]) => sidesOf(s, y, x) < 2));
  return pick(safe.length ? safe : legal);
}

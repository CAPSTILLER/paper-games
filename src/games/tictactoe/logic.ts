// Pure tic-tac-toe logic (classic + super/ultimate). No DOM.
export type P = 1 | 2;
export type Cell = 0 | P;
export const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

/** Indices of the winning line, or null. Works for cells and for super boxes. */
export function winLine(b: (Cell | BoxResult)[]): number[] | null {
  for (const l of LINES) { const v = b[l[0]]; if ((v === 1 || v === 2) && v === b[l[1]] && v === b[l[2]]) return l; }
  return null;
}
/** Returns winner (1|2), "draw" if full with no winner, or null if still open. */
export function boardResult(b: Cell[]): P | "draw" | null {
  for (const [a, c, d] of LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a] as P;
  return b.every((x) => x) ? "draw" : null;
}

export interface ClassicState { board: Cell[]; turn: P; result: P | "draw" | null }
export const newClassic = (): ClassicState => ({ board: Array(9).fill(0), turn: 1, result: null });
export function classicMove(s: ClassicState, i: number): ClassicState {
  if (s.result || s.board[i]) return s;
  const board = s.board.slice(); board[i] = s.turn;
  return { board, turn: s.turn === 1 ? 2 : 1, result: boardResult(board) };
}
export const classicLegal = (s: ClassicState) => (s.result ? [] : s.board.flatMap((c, i) => (c ? [] : [i])));

// ---- Super (ultimate) ----
export type BoxResult = P | "draw" | null;
export interface SuperState {
  boards: Cell[][];      // 9 small boards
  boxes: BoxResult[];    // result of each small board
  turn: P;
  active: number | null; // board the current player must play in (null = anywhere)
  freePlay: boolean;
  result: P | "draw" | null;
}
export const newSuper = (freePlay = false): SuperState => ({
  boards: Array.from({ length: 9 }, () => Array(9).fill(0)), boxes: Array(9).fill(null),
  turn: 1, active: null, freePlay, result: null,
});
export function superLegal(s: SuperState): [number, number][] {
  if (s.result) return [];
  const out: [number, number][] = [];
  for (let b = 0; b < 9; b++) {
    if (s.boxes[b]) continue;
    if (s.active !== null && s.active !== b) continue;
    s.boards[b].forEach((c, i) => { if (!c) out.push([b, i]); });
  }
  return out;
}
/** Overall winner: three claimed boxes in a row. Drawn boxes count for nobody. */
export function superResult(boxes: BoxResult[]): P | "draw" | null {
  for (const [a, c, d] of LINES) if ((boxes[a] === 1 || boxes[a] === 2) && boxes[a] === boxes[c] && boxes[a] === boxes[d]) return boxes[a] as P;
  return boxes.every((x) => x) ? "draw" : null;
}
export function superMove(s: SuperState, b: number, i: number): SuperState {
  if (!superLegal(s).some(([x, y]) => x === b && y === i)) return s;
  const boards = s.boards.map((x) => x.slice()); boards[b][i] = s.turn;
  const boxes = s.boxes.slice(); boxes[b] = boardResult(boards[b]);
  const result = superResult(boxes);
  // Standard rule: sent to the board matching the cell; if it's decided, play anywhere.
  const active = s.freePlay || boxes[i] ? null : i;
  return { ...s, boards, boxes, turn: s.turn === 1 ? 2 : 1, active, result };
}

// ---- Simple AI ----
type Rng = () => number;
const pick = <T,>(a: T[], r: Rng) => a[Math.floor(r() * a.length)];
/** Easy: random. Medium: win if possible, else block, else center/random. */
export function aiClassic(s: ClassicState, level: "easy" | "medium", r: Rng = Math.random): number {
  const legal = classicLegal(s);
  if (level === "easy") return pick(legal, r);
  return smartCell(s.board, legal, s.turn, r);
}
function smartCell(board: Cell[], legal: number[], me: P, r: Rng): number {
  const them: P = me === 1 ? 2 : 1;
  for (const who of [me, them]) for (const i of legal) { const t = board.slice(); t[i] = who; if (boardResult(t) === who) return i; }
  if (legal.includes(4)) return 4;
  return pick(legal, r);
}
export function aiSuper(s: SuperState, level: "easy" | "medium", r: Rng = Math.random): [number, number] {
  const legal = superLegal(s);
  if (level === "easy") return pick(legal, r);
  // Win the game, then win a box, then block a box, avoid sending opponent to a board they can win.
  for (const [b, i] of legal) if (superMove(s, b, i).result === s.turn) return [b, i];
  const them: P = s.turn === 1 ? 2 : 1;
  const winsBox = legal.filter(([b, i]) => { const t = s.boards[b].slice(); t[i] = s.turn; return boardResult(t) === s.turn; });
  if (winsBox.length) return pick(winsBox, r);
  const blocks = legal.filter(([b, i]) => { const t = s.boards[b].slice(); t[i] = them; return boardResult(t) === them; });
  const threat = (b: number) => !s.boxes[b] && s.boards[b].some((c, i) => { if (c) return false; const t = s.boards[b].slice(); t[i] = them; return boardResult(t) === them; });
  const safe = (m: [number, number]) => s.freePlay ? true : !threat(m[1]) && !(s.boxes[m[1]] && true);
  const pool = blocks.filter(safe).length ? blocks.filter(safe) : blocks.length ? blocks : legal.filter(safe).length ? legal.filter(safe) : legal;
  return pick(pool, r);
}

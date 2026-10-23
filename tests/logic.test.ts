import { describe, it, expect } from "vitest";
import * as T from "../src/games/tictactoe/logic";
import * as D from "../src/games/dots/logic";
import * as M from "../src/games/mannequin/logic";
import { pickTheme } from "../src/themes";

describe("tic-tac-toe classic", () => {
  it("detects row/col/diag wins and draws", () => {
    expect(T.boardResult([1,1,1,0,0,0,0,0,0])).toBe(1);
    expect(T.boardResult([2,0,0,2,0,0,2,0,0])).toBe(2);
    expect(T.boardResult([0,0,1,0,1,0,1,0,0])).toBe(1);
    expect(T.boardResult([1,2,1,1,2,2,2,1,1])).toBe("draw");
    expect(T.boardResult([1,2,0,0,0,0,0,0,0])).toBe(null);
  });
  it("plays moves, alternates, rejects taken cells", () => {
    let s = T.newClassic();
    for (const i of [0, 3, 1, 4, 2]) s = T.classicMove(s, i);
    expect(s.result).toBe(1);
    expect(T.classicMove(s, 8)).toBe(s);
  });
  it("medium AI wins or blocks", () => {
    const s: T.ClassicState = { board: [1,1,0,2,2,0,0,0,0], turn: 2, result: null };
    expect(T.aiClassic(s, "medium")).toBe(5); // win
    const b: T.ClassicState = { board: [1,1,0,2,0,0,0,0,0], turn: 2, result: null };
    expect(T.aiClassic(b, "medium")).toBe(2); // block
  });
});

describe("tic-tac-toe super", () => {
  it("sends opponent to matching board", () => {
    let s = T.newSuper();
    s = T.superMove(s, 4, 2);
    expect(s.active).toBe(2);
    expect(T.superMove(s, 5, 0)).toBe(s); // illegal: wrong board
    s = T.superMove(s, 2, 7);
    expect(s.active).toBe(7);
  });
  it("claims a box when a small board is won and frees play when sent to a decided board", () => {
    let s = T.newSuper();
    s = { ...s, boards: s.boards.map((b, i) => (i === 0 ? [1,1,0,0,0,0,0,0,0] : b)), active: 0 };
    s = T.superMove(s, 0, 2);
    expect(s.boxes[0]).toBe(1);
    expect(s.active).toBe(2);
    s = T.superMove(s, 2, 0); // O sends X to board 0, which is decided
    expect(s.active).toBe(null);
  });
  it("wins with three claimed boxes in a row; drawn boxes count for nobody", () => {
    expect(T.superResult([1,1,1,null,null,null,null,null,null])).toBe(1);
    expect(T.superResult([1,"draw",1,null,null,null,null,null,null])).toBe(null);
    expect(T.superResult([1,2,1,1,2,2,2,1,"draw"])).toBe("draw");
    let s = T.newSuper();
    s = { ...s, boxes: [1,1,null,null,null,null,null,null,null],
      boards: s.boards.map((b, i) => (i === 2 ? [1,1,0,0,0,0,0,0,0] : b)), active: 2 };
    s = T.superMove(s, 2, 2);
    expect(s.result).toBe(1);
    expect(T.superLegal(s)).toEqual([]);
  });
  it("free play allows any board", () => {
    let s = T.newSuper(true);
    s = T.superMove(s, 4, 2);
    expect(s.active).toBe(null);
    expect(T.superMove(s, 8, 8)).not.toBe(s);
  });
  it("AI always returns a legal move through a full game", () => {
    for (const lvl of ["easy", "medium"] as const) {
      let s = T.newSuper(); let n = 0;
      while (!s.result && n++ < 81) { const [b, i] = T.aiSuper(s, lvl); const nx = T.superMove(s, b, i); expect(nx).not.toBe(s); s = nx; }
      expect(s.result).not.toBe(null);
    }
  });
});

describe("dots and boxes", () => {
  it("is 10x10 boxes with 220 edges", () => {
    const s = D.newDots();
    expect(s.boxes.length).toBe(100);
    expect(D.legalEdges(s).length).toBe(220);
  });
  it("completing a box scores and keeps the turn; otherwise turn passes", () => {
    let s = D.newDots(2, 2);
    s = D.drawEdge(s, { kind: "h", r: 0, c: 0 }).state; expect(s.turn).toBe(2);
    s = D.drawEdge(s, { kind: "h", r: 1, c: 0 }).state; expect(s.turn).toBe(1);
    s = D.drawEdge(s, { kind: "v", r: 0, c: 0 }).state; expect(s.turn).toBe(2);
    const r = D.drawEdge(s, { kind: "v", r: 0, c: 1 });
    expect(r.completed).toBe(1); expect(r.state.boxes[0]).toBe(2);
    expect(r.state.score).toEqual([0, 1]); expect(r.state.turn).toBe(2);
    expect(D.drawEdge(r.state, { kind: "v", r: 0, c: 1 }).state).toBe(r.state); // taken
  });
  it("one edge can complete two boxes", () => {
    let s = D.newDots(2, 1);
    for (const e of [{kind:"h",r:0,c:0},{kind:"h",r:1,c:0},{kind:"v",r:0,c:0},{kind:"h",r:0,c:1},{kind:"h",r:1,c:1},{kind:"v",r:0,c:2}] as D.Edge[]) s = D.drawEdge(s, e).state;
    const r = D.drawEdge(s, { kind: "v", r: 0, c: 1 });
    expect(r.completed).toBe(2); expect(r.state.over).toBe(true);
  });
  it("full game with AI ends with all 100 boxes scored", () => {
    let s = D.newDots(); let n = 0;
    while (!s.over && n++ < 300) s = D.drawEdge(s, D.aiDots(s, n % 2 ? "medium" : "easy")).state;
    expect(s.over).toBe(true); expect(s.score[0] + s.score[1]).toBe(100);
    expect(D.winner(s)).not.toBe(null);
  });
});

describe("hang mannequin", () => {
  it("correct and wrong guesses, repeats ignored, win", () => {
    let s = M.newMannequin("bat");
    s = M.guess(s, "a"); expect(s.guessed).toEqual(["A"]);
    s = M.guess(s, "z"); expect(s.wrong).toEqual(["Z"]);
    expect(M.guess(s, "z")).toBe(s);
    expect(M.masked(s).join("")).toBe("_A_");
    s = M.guess(M.guess(s, "b"), "t"); expect(s.status).toBe("won");
    expect(M.piecesShown(s, 10)).toBe(10);
  });
  it("loses after 6 wrong guesses and ignores input afterwards", () => {
    let s = M.newMannequin("OWL");
    for (const l of "ABCDEF") s = M.guess(s, l);
    expect(s.status).toBe("lost"); expect(M.guess(s, "O")).toBe(s);
    expect(M.masked(s).join("")).toBe("OWL");
  });
  it("multi-word phrases keep spaces", () => {
    const s = M.newMannequin("CANDY CORN");
    expect(M.masked(s).join("")).toBe("_____ ____");
    expect(M.uniqueLetters(s.word).length).toBe(7);
  });
});

describe("combo turns", () => {
  it("player keeps turn across a chain of boxes", () => {
    let s = D.newDots(3, 1);
    // all horizontal edges + left wall: each vertical line now closes a box
    for (const e of [{kind:"h",r:0,c:0},{kind:"h",r:1,c:0},{kind:"h",r:0,c:1},{kind:"h",r:1,c:1},{kind:"h",r:0,c:2},{kind:"h",r:1,c:2},{kind:"v",r:0,c:0}] as D.Edge[]) s = D.drawEdge(s, e).state;
    const p = s.turn;
    for (const c of [1, 2, 3]) { const r = D.drawEdge(s, { kind: "v", r: 0, c }); expect(r.completed).toBe(1); s = r.state; if (!s.over) expect(s.turn).toBe(p); }
    expect(s.score[p - 1]).toBe(3);
  });
  it("CPU chains: keeps taking boxes while it can", () => {
    let s = D.newDots(3, 1);
    for (const e of [{kind:"h",r:0,c:0},{kind:"h",r:1,c:0},{kind:"h",r:0,c:1},{kind:"h",r:1,c:1},{kind:"h",r:0,c:2},{kind:"h",r:1,c:2},{kind:"v",r:0,c:0}] as D.Edge[]) s = D.drawEdge(s, e).state;
    s = { ...s, turn: 2 };
    let n = 0; while (!s.over && s.turn === 2 && n++ < 5) s = D.drawEdge(s, D.aiDots(s, "easy")).state;
    expect(s.score[1]).toBe(3); expect(s.over).toBe(true);
  });
});

describe("mannequin parts", () => {
  it("each miss places one part; fully built = lost", () => {
    const mq = pickTheme("?theme=halloween").mannequin.mannequins[0];
    let s = M.newMannequin("CAT", "", mq.parts.length);
    s = M.guess(s, "C"); expect(M.partsPlaced(s)).toBe(0);
    const misses = "BDEFGHIJKLMN".slice(0, mq.parts.length).split("");
    misses.forEach((l, i) => { s = M.guess(s, l); expect(M.partsPlaced(s)).toBe(i + 1); expect(s.status).toBe(i + 1 < mq.parts.length ? "playing" : "lost"); });
  });
  it("halloween has a data-driven witch with 6-8 ordered parts", () => {
    for (const mq of pickTheme("?theme=halloween").mannequin.mannequins) {
      expect(mq.parts.length).toBeGreaterThanOrEqual(6); expect(mq.parts.length).toBeLessThanOrEqual(8);
      expect(mq.parts[0].id).toBe("stand"); expect(new Set(mq.parts.map((p) => p.id)).size).toBe(mq.parts.length);
    }
  });
});

describe("themes", () => {
  it("?theme= wins, otherwise October -> halloween, unknown falls back", () => {
    expect(pickTheme("?theme=halloween").id).toBe("halloween");
    expect(pickTheme("", new Date(2026, 9, 23)).id).toBe("halloween");
    expect(pickTheme("?theme=nope", new Date(2026, 2, 1)).id).toBe("halloween");
    expect(pickTheme("").words.every((w) => /^[A-Z ]+$/.test(w.word))).toBe(true);
  });
});

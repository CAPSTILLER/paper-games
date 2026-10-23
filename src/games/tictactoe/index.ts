import type { GameOpts, GameHandle } from "../types";
import { h, frame } from "../../ui";
import { sfx } from "../../audio";
import { confetti, fog } from "../../fx";
import * as L from "./logic";

export function mount(el: HTMLElement, opts: GameOpts): GameHandle {
  const t = opts.theme, superMode = opts.variant === "super";
  const cpu = opts.mode === "cpu", level = opts.level ?? "easy";
  let c = L.newClassic(), s = L.newSuper(!!opts.freePlay), timer = 0;
  const piece = (p: L.Cell | L.BoxResult) => p === 1 ? t.pieces.p1.emoji : p === 2 ? t.pieces.p2.emoji : p === "draw" ? "🤝" : "";
  const name = (p: L.P) => (p === 1 ? t.pieces.p1 : t.pieces.p2).name;
  const F = frame(el, superMode ? `Super Tic-Tac-Toe${s.freePlay ? " · Free play" : ""}` : "Tic-Tac-Toe", opts.onExit, reset);

  function statusText() {
    const res = superMode ? s.result : c.result, turn = superMode ? s.turn : c.turn;
    if (res === "draw") return "It's a tie! 🤝";
    if (res) return `${piece(res)} ${name(res)} wins! 🎉`;
    return cpu && turn === 2 ? "🤖 Computer is thinking…" : `${piece(turn)} ${name(turn)}'s turn`;
  }
  const BOARD = ["top-left","top","top-right","left","middle","right","bottom-left","bottom","bottom-right"];
  function hintText() {
    const res = superMode ? s.result : c.result, turn = superMode ? s.turn : c.turn;
    if (res) return "Tap ↻ New to play again";
    if (cpu && turn === 2) return "";
    const nm = name(turn).toLowerCase();
    if (!superMode) return `Tap a square to place your ${nm}`;
    if (s.active === null) return `Tap a square in ANY open board to place your ${nm}. Win 3 boards in a row!`;
    return `Play in the glowing ${BOARD[s.active]} board. Win 3 boards in a row!`;
  }
  function render() {
    F.status.innerHTML = "";
    F.status.append(h("span", { class: "turnchip" }, statusText()));
    F.body.innerHTML = "";
    F.body.append(h("div", { class: "hint" }, hintText()));
    if (!superMode) {
      const g = h("div", { class: "ttt big" });
      const wl = L.winLine(c.board) ?? [];
      c.board.forEach((v, i) => g.append(h("button", { class: "cell" + (v ? " filled" : "") + (wl.includes(i) ? " winglow" : ""), onclick: () => play(i) }, h("span", { class: "pc" }, piece(v)))));
      F.body.append(g); return;
    }
    const legal = new Set(L.superLegal(s).map(([b, i]) => b * 9 + i));
    const g = h("div", { class: "ttt super" });
    const swl = L.winLine(s.boxes) ?? [];
    s.boards.forEach((bd, b) => {
      const won = s.boxes[b];
      const active = !s.result && !won && (s.active === null || s.active === b);
      const sb = h("div", { class: "sb" + (active ? " active" : "") + (won ? " done" : "") + (swl.includes(b) ? " winglow" : "") });
      bd.forEach((v, i) => sb.append(h("button", { class: "cell" + (legal.has(b * 9 + i) ? "" : " off"), onclick: () => play(b, i) }, h("span", { class: "pc" }, piece(v)))));
      if (won) sb.append(h("div", { class: "claim" }, piece(won)));
      g.append(sb);
    });
    F.body.append(g);
  }
  function play(a: number, b?: number) {
    const humanTurn = superMode ? s.turn : c.turn;
    if (cpu && humanTurn === 2) return;
    step(a, b);
  }
  function step(a: number, b?: number) {
    const before = superMode ? s : c;
    if (superMode) s = L.superMove(s, a, b!); else c = L.classicMove(c, a);
    if ((superMode ? s : c) === before) return;
    const res = superMode ? s.result : c.result;
    render();
    if (!res) sfx("place");
    else if (res === "draw" || (cpu && res === 2)) { sfx("lose"); fog(F.body); }
    else { sfx("win"); confetti(t.decorations); }
    if (cpu && !res && (superMode ? s.turn : c.turn) === 2) {
      timer = window.setTimeout(() => {
        if (superMode) { const [x, y] = L.aiSuper(s, level); step(x, y); } else step(L.aiClassic(c, level));
      }, 450);
    }
  }
  function reset() { F.body.classList.remove("fogged"); clearTimeout(timer); c = L.newClassic(); s = L.newSuper(!!opts.freePlay); render(); }
  render();
  return { destroy() { clearTimeout(timer); el.innerHTML = ""; }, reset };
}

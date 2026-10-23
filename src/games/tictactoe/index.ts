import type { GameOpts, GameHandle } from "../types";
import { h, frame, beep } from "../../ui";
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
    const who = cpu && turn === 2 ? "Computer is thinking…" : `${piece(turn)} ${name(turn)}'s turn`;
    if (superMode && !s.freePlay) return who + (s.active === null ? " · play any board" : " · play the glowing board");
    return who;
  }
  function render() {
    F.status.textContent = statusText();
    F.body.innerHTML = "";
    if (!superMode) {
      const g = h("div", { class: "ttt big" });
      c.board.forEach((v, i) => g.append(h("button", { class: "cell" + (v ? " filled" : ""), onclick: () => play(i) }, piece(v))));
      F.body.append(g); return;
    }
    const legal = new Set(L.superLegal(s).map(([b, i]) => b * 9 + i));
    const g = h("div", { class: "ttt super" });
    s.boards.forEach((bd, b) => {
      const won = s.boxes[b];
      const active = !s.result && !won && (s.active === null || s.active === b);
      const sb = h("div", { class: "sb" + (active ? " active" : "") + (won ? " done" : "") });
      bd.forEach((v, i) => sb.append(h("button", { class: "cell" + (legal.has(b * 9 + i) ? "" : " off"), onclick: () => play(b, i) }, piece(v))));
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
    beep(res ? t.sounds?.win : t.sounds?.place);
    render();
    if (cpu && !res && (superMode ? s.turn : c.turn) === 2) {
      timer = window.setTimeout(() => {
        if (superMode) { const [x, y] = L.aiSuper(s, level); step(x, y); } else step(L.aiClassic(c, level));
      }, 450);
    }
  }
  function reset() { clearTimeout(timer); c = L.newClassic(); s = L.newSuper(!!opts.freePlay); render(); }
  render();
  return { destroy() { clearTimeout(timer); el.innerHTML = ""; }, reset };
}

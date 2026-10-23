import type { GameOpts, GameHandle } from "../types";
import { h, frame } from "../../ui";
import { sfx } from "../../audio";
import { fireworks, fog } from "../../fx";
import * as L from "./logic";

export function mount(el: HTMLElement, opts: GameOpts): GameHandle {
  const t = opts.theme, C = t.colors, cpu = opts.mode === "cpu", level = opts.level ?? "easy";
  let s = L.newDots(10, 10), timer = 0, combo = 0, lastEdge: L.Edge | null = null;
  const F = frame(el, "Dots & Boxes", opts.onExit, reset);
  const score = h("div", { class: "score" });
  const cv = h("canvas", { class: "dots" }) as HTMLCanvasElement;
  F.body.append(score, cv);
  const ctx = cv.getContext("2d")!;
  let size = 0, pad = 0, gap = 0;

  function layout() {
    const w = Math.max(160, Math.min(F.body.clientWidth || 360, 640, (F.body.clientHeight || 9999) - score.offsetHeight - 12));
    const dpr = window.devicePixelRatio || 1;
    size = w; pad = w * 0.04; gap = (w - pad * 2) / s.w;
    cv.style.width = cv.style.height = w + "px"; cv.width = cv.height = Math.round(w * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
  }
  const X = (c: number) => pad + c * gap, Y = (r: number) => pad + r * gap;
  function draw() {
    ctx.clearRect(0, 0, size, size);
    ctx.font = `${gap * 0.62}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (let r = 0; r < s.h; r++) for (let c = 0; c < s.w; c++) {
      const o = s.boxes[r * s.w + c]; if (!o) continue;
      ctx.fillStyle = (o === 1 ? C.p1 : C.p2) + "33"; ctx.fillRect(X(c), Y(r), gap, gap);
      ctx.fillText(o === 1 ? t.pieces.p1.emoji : t.pieces.p2.emoji, X(c) + gap / 2, Y(r) + gap / 2 + 1);
    }
    ctx.lineCap = "round";
    const line = (e: L.Edge, who: number) => {
      ctx.strokeStyle = who === 1 ? C.p1 : C.p2; ctx.lineWidth = Math.max(3, gap * 0.12);
      if (lastEdge && lastEdge.kind === e.kind && lastEdge.r === e.r && lastEdge.c === e.c) ctx.lineWidth *= 1.6;
      ctx.beginPath();
      if (e.kind === "h") { ctx.moveTo(X(e.c), Y(e.r)); ctx.lineTo(X(e.c + 1), Y(e.r)); }
      else { ctx.moveTo(X(e.c), Y(e.r)); ctx.lineTo(X(e.c), Y(e.r + 1)); }
      ctx.stroke();
    };
    for (let r = 0; r <= s.h; r++) for (let c = 0; c < s.w; c++) { const v = s.hLines[r * s.w + c]; if (v) line({ kind: "h", r, c }, v); }
    for (let r = 0; r < s.h; r++) for (let c = 0; c <= s.w; c++) { const v = s.vLines[r * (s.w + 1) + c]; if (v) line({ kind: "v", r, c }, v); }
    ctx.fillStyle = C.dot;
    for (let r = 0; r <= s.h; r++) for (let c = 0; c <= s.w; c++) { ctx.beginPath(); ctx.arc(X(c), Y(r), Math.max(2.5, gap * 0.09), 0, 7); ctx.fill(); }
    const win = L.winner(s);
    score.innerHTML = "";
    score.append(h("span", { class: s.turn === 1 && !s.over ? "on p1" : "p1" }, `${t.pieces.p1.emoji} ${s.score[0]}`),
                 h("span", { class: s.turn === 2 && !s.over ? "on p2" : "p2" }, `${t.pieces.p2.emoji} ${s.score[1]}`));
    F.status.textContent = win === "draw" ? "It's a tie! 🤝" : win ? `${win === 1 ? t.pieces.p1.emoji + " " + t.pieces.p1.name : t.pieces.p2.emoji + " " + t.pieces.p2.name} wins! 🎉`
      : (cpu && s.turn === 2 ? "🤖 Computer's turn" : `${s.turn === 1 ? t.pieces.p1.emoji + " " + t.pieces.p1.name : t.pieces.p2.emoji + " " + t.pieces.p2.name}'s turn`)
        + (combo ? ` · 🔥 combo x${combo}!` : "");
    F.info.textContent = "Tap a line between two dots. Close a box to score and go again!";
  }
  /** Nearest edge to a point (in CSS px), within half a gap. */
  function edgeAt(x: number, y: number): L.Edge | null {
    const gx = (x - pad) / gap, gy = (y - pad) / gap;
    const c = Math.floor(gx), r = Math.floor(gy), fx = gx - c, fy = gy - r;
    const cands: [number, L.Edge][] = [
      [Math.abs(gy - Math.round(gy)), { kind: "h", r: Math.round(gy), c }],
      [Math.abs(gx - Math.round(gx)), { kind: "v", r, c: Math.round(gx) }],
    ];
    void fx; void fy;
    cands.sort((a, b) => a[0] - b[0]);
    for (const [d, e] of cands) {
      if (d > 0.45) continue;
      if (e.kind === "h" && e.r >= 0 && e.r <= s.h && e.c >= 0 && e.c < s.w && !L.isTaken(s, e)) return e;
      if (e.kind === "v" && e.c >= 0 && e.c <= s.w && e.r >= 0 && e.r < s.h && !L.isTaken(s, e)) return e;
    }
    return null;
  }
  cv.addEventListener("pointerdown", (ev) => {
    if (s.over || (cpu && s.turn === 2)) return;
    const b = cv.getBoundingClientRect(); const e = edgeAt((ev.clientX - b.left) * size / b.width, (ev.clientY - b.top) * size / b.height);
    if (e) step(e);
  });
  function step(e: L.Edge) {
    const { state, completed } = L.drawEdge(s, e); if (state === s) return;
    const who = s.turn;
    s = state; lastEdge = e;
    if (completed) { combo += completed; banner(combo > 1 ? `Combo x${combo}! Go again` : `Box! Go again`, who); } else combo = 0;
    draw();
    if (s.over) { const w = L.winner(s); if (w === "draw" || (cpu && w === 2)) { sfx("lose"); fog(F.body); } else { sfx("win"); fireworks([w === 1 ? C.p1 : C.p2, C.accent, C.dot]); } }
    else sfx(completed ? (combo > 1 ? "combo" : "box") : "place");
    if (cpu && !s.over && s.turn === 2) timer = window.setTimeout(() => step(L.aiDots(s, level)), combo ? 700 : 400);
  }
  function banner(text: string, who: number) {
    if (s.over) text = "Last box!";
    const b = h("div", { class: "banner", style: { background: who === 1 ? C.p1 : C.p2 } }, (who === 1 ? t.pieces.p1.emoji : t.pieces.p2.emoji) + " " + text);
    el.append(b); setTimeout(() => b.remove(), 1100);
  }
  function reset() { F.body.classList.remove("fogged"); F.body.querySelector(".fog")?.remove(); combo = 0; clearTimeout(timer); s = L.newDots(10, 10); lastEdge = null; draw(); }
  const ro = new ResizeObserver(layout); ro.observe(F.body);
  layout();
  return { destroy() { clearTimeout(timer); ro.disconnect(); el.innerHTML = ""; }, reset };
}

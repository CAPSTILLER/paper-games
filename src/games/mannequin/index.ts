import type { GameOpts, GameHandle } from "../types";
import { h, frame, beep } from "../../ui";
import * as L from "./logic";

export function mount(el: HTMLElement, opts: GameOpts): GameHandle {
  const t = opts.theme, m = t.mannequin;
  let last = -1;
  const pickWord = () => { let i; do i = Math.floor(Math.random() * t.words.length); while (i === last && t.words.length > 1); last = i; return t.words[i]; };
  let s = start();
  function start() { const w = pickWord(); return L.newMannequin(w.word, w.hint, 6); }
  const F = frame(el, "Hang Mannequin", opts.onExit, reset);
  const onKey = (e: KeyboardEvent) => { if (!setup && /^[a-z]$/i.test(e.key)) press(e.key); };
  window.addEventListener("keydown", onKey);

  let setup = opts.mode === "2p";
  function renderSetup() {
    F.status.textContent = "Player 1: type a secret word (Player 2 looks away!)";
    F.body.innerHTML = "";
    const inp = h("input", { class: "secret", type: "password", maxLength: 16, placeholder: "secret word", autocomplete: "off" }) as HTMLInputElement;
    const hint = h("input", { class: "secret", type: "text", maxLength: 30, placeholder: "hint (optional)" }) as HTMLInputElement;
    const go = () => { const w = inp.value.toUpperCase().replace(/[^A-Z ]/g, "").trim(); if (!L.uniqueLetters(w).length) return; s = L.newMannequin(w, hint.value || "Player 1's word", 6); setup = false; render(); };
    F.body.append(inp, hint, h("button", { class: "btn", onclick: go }, "Start ▶"),
      h("button", { class: "btn ghost", onclick: () => { setup = false; render(); } }, `Use a ${t.name} word instead`));
  }
  function render() {
    if (setup) return renderSetup();
    const lightsLeft = s.maxWrong - s.wrong.length;
    F.status.textContent = s.status === "won" ? `🎉 ${m.winText}` : s.status === "lost" ? `${m.loseText} The word was ${s.word}.` : `Hint: ${s.hint}`;
    F.body.innerHTML = "";
    const shown = L.piecesShown(s, m.outfit.length);
    const win = h("div", { class: "window" + (lightsLeft <= 2 && s.status !== "won" ? " dim" : "") + (s.status === "lost" ? " dark" : "") });
    win.append(h("div", { class: "sign" }, m.storeName));
    win.append(h("div", { class: "lights" }, ...Array.from({ length: s.maxWrong }, (_, i) => h("span", {}, i < lightsLeft ? m.lightOn : m.lightOff))));
    const stage = h("div", { class: "stage" });
    m.outfit.forEach((p, i) => stage.append(h("span", { class: "piece p" + i + (i < shown ? " on" : ""), title: p.label }, p.emoji)));
    win.append(stage);
    F.body.append(win);
    F.body.append(h("div", { class: "word" }, ...L.masked(s).map((ch) => h("span", { class: ch === " " ? "gap" : "" }, ch))));
    const kb = h("div", { class: "keys" });
    L.ALPHABET.forEach((k) => {
      const st = s.guessed.includes(k) ? " good" : s.wrong.includes(k) ? " bad" : "";
      kb.append(h("button", { class: "key" + st, disabled: !!st || s.status !== "playing", onclick: () => press(k) }, k));
    });
    F.body.append(kb);
    if (s.status !== "playing") F.body.append(h("button", { class: "btn", onclick: reset }, "Next word ▶"));
  }
  function press(k: string) {
    const n = L.guess(s, k); if (n === s) return;
    const good = n.guessed.length > s.guessed.length; s = n;
    beep(s.status === "won" ? t.sounds?.win : good ? t.sounds?.place : [220]);
    render();
  }
  function reset() { s = start(); setup = opts.mode === "2p"; render(); }
  render();
  return { destroy() { window.removeEventListener("keydown", onKey); el.innerHTML = ""; }, reset };
}

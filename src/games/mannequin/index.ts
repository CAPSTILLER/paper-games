import type { GameOpts, GameHandle } from "../types";
import type { Mannequin } from "../../themes/types";
import { h, frame } from "../../ui";
import { sfx } from "../../audio";
import { burst } from "../../fx";
import * as L from "./logic";

/** Storefront window + display stand, drawn in SVG. Parts are layered in order. */
function storefront(store: string, msg: string, mq: Mannequin, placed: number, state: L.MannequinState["status"], lastId?: string) {
  const parts = mq.parts.map((p, i) => i < placed ? `<g class="part${p.id === lastId ? " pop" : ""}">${p.svg}</g>` : "").join("");
  // faint ghost outline of the empty stand spot so kids see where parts go
  return `<svg viewBox="0 0 360 400" class="shop" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9b8"/><stop offset="1" stop-color="#ffbe5c"/></linearGradient>
  <pattern id="brick" width="40" height="20" patternUnits="userSpaceOnUse"><rect width="40" height="20" fill="#5b2f3a"/><path d="M0 0h40M0 10h40M20 0v10M0 10v10M40 10v10" stroke="#3e1d27" stroke-width="2"/></pattern></defs>
  <rect width="360" height="400" fill="url(#brick)"/>
  <path d="M10 18h340v40H10z" fill="#1b1230"/><text x="180" y="46" text-anchor="middle" font-size="22" font-weight="800" fill="#ff8c1a" font-family="system-ui">${store}</text>
  <path d="M10 58h340l-12 30H22z" fill="#7b3fbf"/>${[0,1,2,3,4,5,6,7].map(i => `<path d="M${22+i*40} 88h20l-10 12z" fill="${i%2?"#ff8c1a":"#7b3fbf"}"/>`).join("")}
  <foreignObject x="24" y="58" width="312" height="30"><div xmlns="http://www.w3.org/1999/xhtml" class="awning">${msg}</div></foreignObject>
  <rect x="26" y="98" width="308" height="282" rx="6" fill="#3a2410"/>
  <rect x="36" y="106" width="288" height="266" fill="url(#glass)" class="glass ${state}"/>
  <path d="M50 120l40 0-30 40z" fill="#fff" opacity=".25"/>
  <rect x="36" y="350" width="288" height="22" fill="#a0643a"/>
  <text x="62" y="345" font-size="28">🎃</text><text x="276" y="345" font-size="24">🍬</text><text x="290" y="140" font-size="22">🕸️</text>
  <g transform="translate(80 72)"><g class="mq ${state === "lost" ? "dance" : ""}">
    ${placed === 0 ? `<g opacity=".18"><rect x="70" y="282" width="60" height="8" rx="4" fill="#4a3a2a"/><rect x="97" y="200" width="6" height="84" fill="#4a3a2a"/></g>` : ""}
    ${parts}
  </g></g>
</svg>`;
}

export function mount(el: HTMLElement, opts: GameOpts): GameHandle {
  const t = opts.theme, m = t.mannequin;
  let last = -1, lastPart: string | undefined;
  const pickWord = () => { let i; do i = Math.floor(Math.random() * t.words.length); while (i === last && t.words.length > 1); last = i; return t.words[i]; };
  /** Rotation: each round uses the next mannequin in theme order; index persisted per theme. */
  const KEY = `papergames:mq:${t.id}`;
  const pickMq = () => {
    let i = 0; try { i = L.nextRotation(parseInt(localStorage.getItem(KEY) ?? "-1", 10), m.mannequins.length); localStorage.setItem(KEY, String(i)); } catch {}
    return m.mannequins[Number.isFinite(i) ? i : 0];
  };
  const fill = (txt: string) => txt.replace(/\{name\}/g, mq.name.toLowerCase());
  let mq: Mannequin = m.mannequins[0];
  let s = start();
  function start() { const w = pickWord(); mq = pickMq(); lastPart = undefined; return L.newMannequin(w.word, w.hint, mq.parts.length); }
  const F = frame(el, "Hang Mannequin", opts.onExit, reset);
  let setup = opts.mode === "2p";
  const onKey = (e: KeyboardEvent) => { if (!setup && /^[a-z]$/i.test(e.key)) press(e.key); };
  window.addEventListener("keydown", onKey);

  function renderSetup() {
    F.info.textContent = "2 players: one picks a secret word, the other guesses.";
    F.wrap.classList.remove("mq-game");
    F.status.textContent = "Player 1: type a secret word (Player 2 looks away!)";
    F.body.innerHTML = "";
    const inp = h("input", { class: "secret", type: "password", maxLength: 16, placeholder: "secret word", autocomplete: "off" }) as HTMLInputElement;
    const hint = h("input", { class: "secret", type: "text", maxLength: 30, placeholder: "hint (optional)" }) as HTMLInputElement;
    const go = () => { const w = inp.value.toUpperCase().replace(/[^A-Z ]/g, "").trim(); if (!L.uniqueLetters(w).length) return; s = L.newMannequin(w, hint.value || "Player 1's word", mq.parts.length); setup = false; render(); };
    F.body.append(inp, hint, h("button", { class: "btn", onclick: go }, "Start ▶"),
      h("button", { class: "btn ghost", onclick: () => { setup = false; render(); } }, `Use a ${t.name} word instead`));
  }
  function render() {
    if (setup) return renderSetup();
    F.info.textContent = "Guess the letters. Each miss adds a piece to the mannequin. Solve the word before it's finished!";
    F.wrap.classList.add("mq-game"); F.status.textContent = "";
    const placed = L.partsPlaced(s), left = s.maxWrong - placed;
    const msg = s.status === "won" ? `🎉 ${fill(m.winText)}` : s.status === "lost" ? `${fill(m.loseText)} The word was ${s.word}.`
      : `Hint: ${s.hint} · ${left} miss${left === 1 ? "" : "es"} left before the ${mq.name.toLowerCase()} is finished`;
    F.body.innerHTML = "";
    const win = h("div", { class: "window2" }); win.innerHTML = storefront(m.storeName, msg.replace(/[<&]/g, ""), mq, placed, s.status, lastPart);
    F.body.append(win);
    F.body.append(h("div", { class: "parts" }, ...mq.parts.map((p, i) => h("span", { class: i < placed ? "on" : "" }, p.label))));
    F.body.append(h("div", { class: "word" }, ...L.masked(s).map((ch) => h("span", { class: ch === " " ? "gap" : "" }, ch))));
    const kb = h("div", { class: "keys" });
    L.ALPHABET.forEach((k) => {
      const st = s.guessed.includes(k) ? " good" : s.wrong.includes(k) ? " bad" : "";
      kb.append(h("button", { class: "key" + st, disabled: !!st || s.status !== "playing", onclick: () => press(k) }, k));
    });
    F.body.append(s.status === "playing" ? kb : h("div", { class: "keys done" }, h("button", { class: "btn", onclick: reset }, "Next word ▶")));
  }
  function press(k: string) {
    const n = L.guess(s, k); if (n === s) return;
    const good = n.guessed.length > s.guessed.length; s = n;
    lastPart = good ? undefined : mq.parts[L.partsPlaced(s) - 1]?.id;
    render();
    if (s.status === "won") { sfx("win"); const r = F.body.querySelector(".window2")!.getBoundingClientRect(); burst(["🍬", "🍭", "🍫", "🎃", "⭐"], r.left + r.width / 2, r.top + r.height / 2); }
    else if (s.status === "lost") { sfx("part"); setTimeout(() => sfx("lose"), 250); }
    else sfx(good ? "right" : "part");
  }
  function reset() { s = start(); setup = opts.mode === "2p"; render(); }
  render();
  return { destroy() { window.removeEventListener("keydown", onKey); el.innerHTML = ""; }, reset };
}

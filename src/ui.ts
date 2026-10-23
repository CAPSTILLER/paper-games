import type { Theme } from "./themes";
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, any> = {}, ...kids: (Node | string)[]) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "style" && typeof v === "object") Object.assign(e.style, v);
    else if (k.startsWith("on")) e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "class") e.className = v; else (e as any)[k] = v;
  }
  kids.forEach((k) => e.append(k)); return e;
}
let ctx: AudioContext | null = null;
export function beep(freqs: number[] | undefined, dur = 0.09) {
  if (!freqs) return;
  try {
    ctx ??= new AudioContext();
    freqs.forEach((f, i) => {
      const o = ctx!.createOscillator(), g = ctx!.createGain(), t = ctx!.currentTime + i * dur;
      o.frequency.value = f; o.type = "triangle"; g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(ctx!.destination); o.start(t); o.stop(t + dur);
    });
  } catch {}
}
export function applyTheme(t: Theme, root: HTMLElement = document.documentElement) {
  for (const [k, v] of Object.entries(t.colors)) root.style.setProperty("--" + k, v);
}
/** Standard game frame: top bar (back, title, reset), status line, body. */
export function frame(el: HTMLElement, title: string, onExit: (() => void) | undefined, onReset: () => void) {
  el.innerHTML = "";
  const status = h("div", { class: "status" });
  const body = h("div", { class: "body" });
  const bar = h("div", { class: "bar" },
    onExit ? h("button", { class: "btn small", onclick: onExit }, "← Menu") : h("span"),
    h("div", { class: "title" }, title),
    h("button", { class: "btn small", onclick: onReset }, "↻ New"));
  const wrap = h("div", { class: "game" }, bar, status, body);
  el.append(wrap);
  return { status, body, wrap };
}

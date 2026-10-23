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
import * as A from "./audio";
/** Music + SFX toggle buttons (state saved in localStorage). */
export function audioToggles() {
  const mk = (kind: "music" | "sfx", on: string, off: string) => {
    const b = h("button", { class: "tog", "aria-label": kind }) as HTMLButtonElement;
    const paint = () => { b.textContent = A.settings[kind] ? on : off; b.classList.toggle("off", !A.settings[kind]); };
    b.onclick = (e) => { e.stopPropagation(); A.toggle(kind); paint(); }; paint(); return b;
  };
  return h("div", { class: "togs" }, mk("music", "🎵 Music", "🎵 Off"), mk("sfx", "🔊 Sounds", "🔇 Off"));
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
  const wrap = h("div", { class: "game" }, bar, audioToggles(), status, body);
  el.append(wrap);
  return { status, body, wrap };
}

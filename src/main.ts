import "./style.css";
import { pickTheme } from "./themes";
import { GAMES, type GameHandle, type Mode, type Level } from "./games";
import { h, applyTheme } from "./ui";

const theme = pickTheme();
applyTheme(theme);
const app = document.getElementById("app")!;
const q = new URLSearchParams(location.search);
const opts = {
  mode: (q.get("mode") as Mode) || "2p", level: (q.get("level") as Level) || "easy",
  variant: q.get("variant") || "classic", freePlay: q.has("free"),
};
let current: GameHandle | null = null;

function deco() {
  const d = h("div", { class: "deco" });
  for (let i = 0; i < 10; i++) d.append(h("span", { style: { left: (i * 10 + 3) + "%", top: ((i * 37) % 90) + "%", animationDelay: i * 0.7 + "s" } }, theme.decorations[i % theme.decorations.length]));
  return d;
}
function seg<T extends string>(label: string, val: T, choices: [T, string][], set: (v: T) => void) {
  const row = h("div", { class: "seg" }, h("span", { class: "lbl" }, label));
  choices.forEach(([v, txt]) => row.append(h("button", { class: v === val ? "on" : "", onclick: () => { set(v); menu(); } }, txt)));
  return row;
}
function menu() {
  current?.destroy(); current = null;
  app.innerHTML = ""; app.append(deco());
  const m = h("div", { class: "menu" },
    h("h1", {}, `${theme.pieces.p1.emoji} ${theme.title} ${theme.pieces.p2.emoji}`),
    h("p", { class: "sub" }, `${theme.name} edition · pick a game`));
  m.append(seg("Players", opts.mode, [["2p", "👫 2 players"], ["cpu", "🤖 vs computer"]], (v) => (opts.mode = v)));
  if (opts.mode === "cpu") m.append(seg("Computer", opts.level, [["easy", "Easy"], ["medium", "Medium"]], (v) => (opts.level = v)));
  for (const [id, g] of Object.entries(GAMES)) {
    const card = h("div", { class: "card" },
      h("button", { class: "play", onclick: () => start(id) }, h("span", { class: "icon" }, g.icon), h("span", {}, h("b", {}, g.name), h("small", {}, g.blurb))));
    if (id === "tictactoe") {
      card.append(seg("Mode", opts.variant, [["classic", "Classic"], ["super", "Super"]], (v) => (opts.variant = v)));
      if (opts.variant === "super") card.append(seg("Rule", opts.freePlay ? "free" : "std", [["std", "Send to board"], ["free", "Free play"]], (v) => (opts.freePlay = v === "free")));
    }
    m.append(card);
  }
  app.append(m);
  history.replaceState(null, "", keepTheme());
}
function keepTheme(extra = "") { const t = q.get("theme"); const p = new URLSearchParams(extra); if (t) p.set("theme", t); const s = p.toString(); return location.pathname + (s ? "?" + s : ""); }
function start(id: string) {
  app.innerHTML = ""; app.append(deco());
  const host = h("div", { class: "host" }); app.append(host);
  current = GAMES[id].mount(host, { theme, ...opts, onExit: menu });
  const p: Record<string, string> = { game: id, mode: opts.mode };
  if (opts.mode === "cpu") p.level = opts.level;
  if (id === "tictactoe") { p.variant = opts.variant; if (opts.freePlay) p.free = "1"; }
  history.replaceState(null, "", keepTheme(new URLSearchParams(p).toString()));
}
const g = q.get("game");
if (g && GAMES[g]) start(g); else menu();

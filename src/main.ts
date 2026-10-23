import "./style.css";
import { pickTheme } from "./themes";
import { GAMES, type GameHandle, type Mode, type Level } from "./games";
import { h, applyTheme, audioToggles } from "./ui";
import { useSounds, unlockOnFirstTap } from "./audio";

const theme = pickTheme();
applyTheme(theme);
useSounds(theme.sounds);
unlockOnFirstTap();
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
function seg<T extends string>(label: string, val: T, choices: [T, string][], set: (v: T) => void, after: () => void) {
  const row = h("div", { class: "seg" }, h("span", { class: "lbl" }, label));
  choices.forEach(([v, txt]) => row.append(h("button", { class: v === val ? "on" : "", onclick: () => { set(v); after(); } }, txt)));
  return row;
}
function menu() {
  current?.destroy(); current = null;
  app.innerHTML = ""; app.append(deco());
  const m = h("div", { class: "menu" },
    h("h1", {}, `${theme.pieces.p1.emoji} ${theme.title} ${theme.pieces.p2.emoji}`),
    h("p", { class: "sub" }, `${theme.name} edition · pick a game`), audioToggles());
  for (const [id, g] of Object.entries(GAMES))
    m.append(h("div", { class: "card" }, h("button", { class: "play", onclick: () => options(id) }, (theme.art?.[id] ? h("img", { class: "thumb", src: theme.art[id], alt: g.name, width: 72, height: 72 }) : h("span", { class: "icon" }, g.icon)), h("span", {}, h("b", {}, g.name), h("small", {}, g.blurb)))));
  app.append(m);
  history.replaceState(null, "", keepTheme());
}
const HOW: Record<string, string> = {
  tictactoe: "Get three in a row to win.",
  dots: "Take turns drawing a line between two dots. Close a box to score it and go again!",
  mannequin: "Guess the word one letter at a time. Each miss adds a piece to the window mannequin — finish the word before she's built!",
};
/** Options screen: pick settings, then a big Play button. */
function options(id: string) {
  const g = GAMES[id];
  app.innerHTML = ""; app.append(deco());
  const o = h("div", { class: "menu" },
    h("div", { class: "bar" }, h("button", { class: "btn small", onclick: menu }, "← Menu"), h("div", { class: "title" }, `${g.icon} ${g.name}`), h("span")));
  const box = h("div", { class: "opts" });
  const re = () => options(id);
  box.append(seg("Players", opts.mode, [["2p", "👫 2 players"], ["cpu", "🤖 vs computer"]], (v) => (opts.mode = v), re));
  if (opts.mode === "cpu" && id !== "mannequin") box.append(seg("Computer", opts.level, [["easy", "Easy"], ["medium", "Medium"]], (v) => (opts.level = v), re));
  if (id === "tictactoe") {
    box.append(seg("Mode", opts.variant, [["classic", "Classic"], ["super", "Super"]], (v) => (opts.variant = v), re));
    if (opts.variant === "super") box.append(seg("Rule", opts.freePlay ? "free" : "std", [["std", "Send to board"], ["free", "Free play"]], (v) => (opts.freePlay = v === "free"), re));
  }
  let how = HOW[id];
  if (id === "tictactoe" && opts.variant === "super") how = "9 little boards! Win a little board to claim it, then win 3 claimed boards in a row. " + (opts.freePlay ? "Free play: you can play on any open board." : "Where you play sends your opponent to that board.");
  if (id === "mannequin" && opts.mode === "2p") how += " Player 1 picks the secret word.";
  box.append(h("p", {}, how));
  o.append(box, h("button", { class: "btn huge", onclick: () => start(id) }, "▶ Play"));
  app.append(o);
  history.replaceState(null, "", keepTheme("options=" + id));
}
function keepTheme(extra = "") { const t = q.get("theme"); const p = new URLSearchParams(extra); if (t) p.set("theme", t); const s = p.toString(); return location.pathname + (s ? "?" + s : ""); }
function start(id: string) {
  app.innerHTML = ""; app.append(deco());
  const host = h("div", { class: "host" }); app.append(host);
  current = GAMES[id].mount(host, { theme, ...opts, onExit: () => { current?.destroy(); current = null; options(id); } });
  const p: Record<string, string> = { game: id, mode: opts.mode };
  if (opts.mode === "cpu") p.level = opts.level;
  if (id === "tictactoe") { p.variant = opts.variant; if (opts.freePlay) p.free = "1"; }
  history.replaceState(null, "", keepTheme(new URLSearchParams(p).toString()));
}
const g = q.get("game");
const og = q.get("options");
if (g && GAMES[g]) start(g); else if (og && GAMES[og]) options(og); else menu();

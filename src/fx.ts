/** Win/lose effects. All respect prefers-reduced-motion (falls back to a static flash/label). */
export const reducedMotion = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

function layer() {
  const cv = document.createElement("canvas"); cv.className = "fxlayer";
  const dpr = window.devicePixelRatio || 1; cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  document.body.append(cv); const g = cv.getContext("2d")!; g.scale(dpr, dpr); return { cv, g };
}
/** Emoji confetti falling from the top (candy, bats...). */
export function confetti(emojis: string[], count = 40) {
  if (reducedMotion()) return;
  const { cv, g } = layer();
  const ps = Array.from({ length: count }, () => ({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.5, vy: 2 + Math.random() * 3, vx: -1 + Math.random() * 2, r: Math.random() * 6, vr: -0.1 + Math.random() * 0.2, e: emojis[Math.floor(Math.random() * emojis.length)], s: 18 + Math.random() * 16 }));
  let f = 0;
  const run = () => {
    g.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of ps) { p.y += p.vy; p.x += p.vx + Math.sin((f + p.r * 10) / 15); p.r += p.vr; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.font = p.s + "px serif"; g.fillText(p.e, 0, 0); g.restore(); }
    if (++f < 200) requestAnimationFrame(run); else cv.remove();
  };
  run();
}
/** Burst from a point (candy burst). */
export function burst(emojis: string[], x = innerWidth / 2, y = innerHeight / 2, count = 30) {
  if (reducedMotion()) return;
  const { cv, g } = layer();
  const ps = Array.from({ length: count }, (_, i) => { const a = (i / count) * Math.PI * 2, sp = 4 + Math.random() * 5; return { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3, e: emojis[i % emojis.length] }; });
  let f = 0;
  const run = () => {
    g.clearRect(0, 0, innerWidth, innerHeight); g.globalAlpha = Math.max(0, 1 - f / 90); g.font = "26px serif";
    for (const p of ps) { p.x += p.vx; p.y += p.vy; p.vy += 0.18; g.fillText(p.e, p.x, p.y); }
    if (++f < 90) requestAnimationFrame(run); else cv.remove();
  };
  run();
}
/** Fireworks in given colors. */
export function fireworks(colors: string[], shells = 6) {
  if (reducedMotion()) return;
  const { cv, g } = layer();
  type S = { x: number; y: number; vx: number; vy: number; c: string; life: number };
  const sparks: S[] = []; let f = 0;
  const boom = () => { const x = innerWidth * (0.15 + Math.random() * 0.7), y = innerHeight * (0.15 + Math.random() * 0.35), c = colors[Math.floor(Math.random() * colors.length)];
    for (let i = 0; i < 40; i++) { const a = Math.random() * 7, s = 1 + Math.random() * 4; sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c, life: 60 + Math.random() * 20 }); } };
  const run = () => {
    if (f % 25 === 0 && f / 25 < shells) boom();
    g.fillStyle = "rgba(0,0,0,0.18)"; g.globalCompositeOperation = "destination-out"; g.fillRect(0, 0, innerWidth, innerHeight); g.globalCompositeOperation = "source-over";
    for (const s of sparks) if (s.life > 0) { s.x += s.vx; s.y += s.vy; s.vy += 0.05; s.life--; g.fillStyle = s.c; g.globalAlpha = Math.min(1, s.life / 30); g.fillRect(s.x, s.y, 3, 3); }
    g.globalAlpha = 1;
    if (++f < 260) requestAnimationFrame(run); else cv.remove();
  };
  run();
}
/** Gentle fog drift over an element (loss / draw). */
export function fog(el: HTMLElement) {
  el.classList.add("fogged");
  if (!reducedMotion()) { const f = document.createElement("div"); f.className = "fog"; el.append(f); }
}

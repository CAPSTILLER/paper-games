import type { SoundPack, SfxName, Note } from "./themes/types";
const LS = { music: "papergames:music", sfx: "papergames:sfx" };
const get = (k: string, d: boolean) => { try { const v = localStorage.getItem(k); return v === null ? d : v === "1"; } catch { return d; } };
const set = (k: string, v: boolean) => { try { localStorage.setItem(k, v ? "1" : "0"); } catch {} };

let ctx: AudioContext | null = null, sfxBus: GainNode, musicBus: GainNode;
let pack: SoundPack | null = null, unlocked = false, musicTimer = 0, step = 0, nextT = 0;
export const settings = { music: get(LS.music, true), sfx: get(LS.sfx, true) };
const MUSIC_VOL = 0.05, SFX_VOL = 0.25;

function ac() {
  if (!ctx) {
    ctx = new AudioContext();
    sfxBus = ctx.createGain(); sfxBus.gain.value = SFX_VOL; sfxBus.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = MUSIC_VOL; musicBus.connect(ctx.destination);
  }
  return ctx;
}
function note(n: Note, t0: number, bus: GainNode) {
  const c = ac(), o = c.createOscillator(), g = c.createGain(), t = t0 + (n.at ?? 0);
  o.type = n.wave ?? "triangle"; o.frequency.setValueAtTime(n.f, t);
  if (n.to) o.frequency.exponentialRampToValueAtTime(n.to, t + n.d);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(n.v ?? 0.6, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + n.d);
  o.connect(g).connect(bus); o.start(t); o.stop(t + n.d + 0.02);
}
export function useSounds(p: SoundPack) { pack = p; }
export function sfx(name: SfxName) {
  if (!settings.sfx || !pack || !unlocked) return;
  try { const c = ac(); pack.sfx[name]?.forEach((n) => note(n, c.currentTime, sfxBus)); } catch {}
}
/** Lookahead scheduler for the procedural loop. */
function tick() {
  if (!pack || !ctx) return;
  const m = pack.music, dur = 60 / m.bpm / 2; // eighth notes
  const deg = (d: number) => m.root * Math.pow(2, (m.scale[d % m.scale.length] + 12 * Math.floor(d / m.scale.length)) / 12);
  while (nextT < ctx.currentTime + 0.2) {
    const i = step % m.melody.length, b = m.bass[step % m.bass.length], md = m.melody[i];
    // every other bar, shift melody up a step for variety
    const lift = Math.floor(step / m.melody.length) % 4 === 3 ? 1 : 0;
    if (b !== null) note({ f: deg(b) / 2, d: dur * 1.8, wave: m.bassWave, v: 0.9 }, nextT, musicBus);
    if (md !== null) note({ f: deg(md + lift), d: dur * 0.9, wave: m.wave, v: 0.5 }, nextT, musicBus);
    nextT += dur; step++;
  }
}
export function startMusic() {
  if (!settings.music || musicTimer || !pack) return;
  let c: AudioContext; try { c = ac(); } catch { return; }
  if (c.state !== "running") c.resume().catch(() => {});
  nextT = c.currentTime + 0.05;
  musicTimer = window.setInterval(tick, 50); tick();
}
/** True when the music scheduler is on AND the audio context is actually running. */
export function musicPlaying() { return !!musicTimer && ctx?.state === "running"; }
export function stopMusic() { clearInterval(musicTimer); musicTimer = 0; }
export function toggle(kind: "music" | "sfx") {
  settings[kind] = !settings[kind]; set(LS[kind], settings[kind]);
  if (kind === "music") settings.music ? startMusic() : stopMusic();
  return settings[kind];
}
/**
 * Autoplay: try on load (works when Chrome's autoplay policy allows it), and otherwise on the first
 * real user activation. On Android Chrome `pointerdown`/`touchstart` do NOT count as activation, so
 * resume() there silently fails — we also listen to touchend/click/pointerup/keydown and keep
 * retrying until the context is actually running.
 */
const GESTURES = ["pointerdown", "touchstart", "touchend", "pointerup", "click", "keydown"] as const;
export function unlockOnFirstTap() {
  const done = () => GESTURES.forEach((e) => window.removeEventListener(e, go, true));
  const go = () => {
    unlocked = true;
    let c: AudioContext; try { c = ac(); } catch { return; }
    const after = () => { if (c.state === "running") { done(); nextT = Math.max(nextT, c.currentTime + 0.05); } };
    if (c.state !== "running") c.resume().then(after, () => {}); else after();
    startMusic(); // no-op if already scheduled
  };
  GESTURES.forEach((e) => window.addEventListener(e, go, { capture: true, passive: true }));
  // Attempt on load (may be allowed; if not, the context stays suspended until a gesture).
  try {
    const c = ac();
    c.resume().then(() => { if (c.state === "running") { unlocked = true; done(); startMusic(); } }, () => {});
    if (settings.music) startMusic();
  } catch {}
}
// Read-only debug hook (used by Playwright checks).
(globalThis as any).__pgAudio = { state: () => ctx?.state ?? "none", playing: musicPlaying, music: () => settings.music };

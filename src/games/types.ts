import type { Theme } from "../themes";
export type Mode = "2p" | "cpu";
export type Level = "easy" | "medium";
export interface GameOpts {
  theme: Theme;
  mode?: Mode;          // default "2p"
  level?: Level;        // default "easy"
  variant?: string;     // e.g. tic-tac-toe "classic" | "super"
  freePlay?: boolean;   // super tic-tac-toe
  onExit?: () => void;  // shows a back button when given
}
/** Every game exposes mount(container, opts) -> handle. Rendering is DOM/canvas inside `container` only,
 *  so a host (e.g. a Mysbase three.js room) can mount into an offscreen element / CanvasTexture surface. */
export interface GameHandle { destroy(): void; reset(): void }
export type MountFn = (el: HTMLElement, opts: GameOpts) => GameHandle;

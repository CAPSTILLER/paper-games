import type { MountFn } from "./types";
import { mount as tictactoe } from "./tictactoe";
import { mount as dots } from "./dots";
import { mount as mannequin } from "./mannequin";
export * from "./types";
export const GAMES: Record<string, { name: string; icon: string; blurb: string; mount: MountFn }> = {
  tictactoe: { name: "Tic-Tac-Toe", icon: "#️⃣", blurb: "Classic or Super (9 boards!)", mount: tictactoe },
  dots: { name: "Dots & Boxes", icon: "🔲", blurb: "10×10 — close a box, go again", mount: dots },
  mannequin: { name: "Hang Mannequin", icon: "🛍️", blurb: "Guess letters, dress the window", mount: mannequin },
};

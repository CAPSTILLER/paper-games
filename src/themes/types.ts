/** A theme pack. Add a new holiday by adding one file that exports a Theme and registering it in index.ts. */
export interface Theme {
  id: string;
  name: string;
  title: string;
  colors: {
    bg: string; bg2: string; panel: string; text: string; accent: string;
    p1: string; p2: string; line: string; dot: string;
  };
  /** Player pieces (X and O in tic-tac-toe, box owners in dots & boxes) */
  pieces: { p1: { emoji: string; name: string }; p2: { emoji: string; name: string } };
  /** Floating decorations for the background / window display */
  decorations: string[];
  mannequin: {
    storeName: string;
    /** Display pieces added in order as correct letters are found */
    outfit: { emoji: string; label: string }[];
    /** Gentle "miss" visual: one bulb per allowed wrong guess goes dark */
    lightOn: string; lightOff: string;
    winText: string; loseText: string;
  };
  words: { word: string; hint: string }[];
  sounds?: { place?: number[]; win?: number[] }; // optional tone frequencies (Hz)
}

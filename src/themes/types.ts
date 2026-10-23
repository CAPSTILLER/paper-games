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
    winText: string; loseText: string;
    /** Mannequins to build. One is picked at random per round. Each MISSED letter places the next part;
     *  max misses = parts.length. Art is SVG markup in a 200x300 viewBox (stand base at the bottom). */
    mannequins: Mannequin[];
  };
  words: { word: string; hint: string }[];
  sounds?: { place?: number[]; win?: number[] }; // optional tone frequencies (Hz)
}

export interface MannequinPart { id: string; label: string; svg: string }
export interface Mannequin { id: string; name: string; parts: MannequinPart[] }

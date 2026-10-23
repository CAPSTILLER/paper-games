import type { Theme } from "./types";
export const halloween: Theme = {
  id: "halloween", name: "Halloween", title: "Spooky Fun Games",
  colors: { bg: "#1a0f2e", bg2: "#2d1650", panel: "#2a1a45", text: "#fff7e6", accent: "#ff8c1a",
    p1: "#ff8c1a", p2: "#c9b8ff", line: "#7a5cb8", dot: "#ffd27a" },
  pieces: { p1: { emoji: "🎃", name: "Pumpkin" }, p2: { emoji: "👻", name: "Ghost" } },
  decorations: ["🦇", "🕸️", "🍬", "🌙", "🕷️", "🍭"],
  mannequin: {
    storeName: "Boo Boutique",
    winText: "You solved it before the witch was finished!",
    loseText: "The witch mannequin is all dressed up — she wins this round!",
    mannequins: [
      { id: "witch", name: "Window Witch", parts: [
        { id: "stand", label: "display stand", svg: `<rect x="70" y="282" width="60" height="8" rx="4" fill="#4a3a2a"/><rect x="97" y="200" width="6" height="84" fill="#6b5640"/>` },
        { id: "legs", label: "striped legs & boots", svg: `<g><rect x="84" y="200" width="12" height="62" fill="#fff"/><rect x="104" y="200" width="12" height="62" fill="#fff"/>${[0,1,2,3,4,5].map(i=>`<rect x="84" y="${204+i*10}" width="32" height="5" fill="#7b3fbf"/>`).join("")}<rect x="99" y="200" width="2" height="62" fill="#ffe9b8"/><path d="M80 262h18v12h-24q0-12 6-12z M102 262h18q6 0 6 12h-24z" fill="#222"/></g>` },
        { id: "dress", label: "dress", svg: `<path d="M86 118h28l22 86H64z" fill="#2b1d3f"/><rect x="84" y="150" width="32" height="7" fill="#ff8c1a"/><circle cx="100" cy="153" r="5" fill="#ffd27a"/>` },
        { id: "arms", label: "arms", svg: `<path d="M86 124l-24 46" stroke="#2b1d3f" stroke-width="12" stroke-linecap="round"/><path d="M114 124l24 46" stroke="#2b1d3f" stroke-width="12" stroke-linecap="round"/><circle cx="61" cy="173" r="6" fill="#8fd16a"/><circle cx="139" cy="173" r="6" fill="#8fd16a"/>` },
        { id: "head", label: "head", svg: `<rect x="95" y="104" width="10" height="16" fill="#8fd16a"/><ellipse cx="100" cy="88" rx="20" ry="22" fill="#8fd16a"/><circle cx="92" cy="86" r="3" fill="#222"/><circle cx="108" cy="86" r="3" fill="#222"/><path d="M92 98q8 6 16 0" stroke="#222" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M100 88l5 8h-6z" fill="#6fb04a"/>` },
        { id: "hair", label: "hair", svg: `<path d="M80 80q-10 30 2 44M120 80q10 30-2 44" stroke="#ff8c1a" stroke-width="8" fill="none" stroke-linecap="round"/>` },
        { id: "hat", label: "witch hat", svg: `<ellipse cx="100" cy="70" rx="36" ry="7" fill="#1b1230"/><path d="M80 70L104 14l4 4-8 52z M80 70h40L106 16z" fill="#1b1230"/><rect x="82" y="60" width="36" height="7" fill="#7b3fbf"/>` },
        { id: "broom", label: "broom", svg: `<path d="M150 120l-8 150" stroke="#8a5a2b" stroke-width="5" stroke-linecap="round"/><path d="M134 262l18 0 6 26h-30z" fill="#e0b050"/>` },
      ] },
    ],
  },
  words: [
    { word: "PUMPKIN", hint: "Orange and carved" }, { word: "GHOST", hint: "Says boo" },
    { word: "CANDY", hint: "Sweet treat" }, { word: "WITCH", hint: "Rides a broom" },
    { word: "COSTUME", hint: "What you dress up in" }, { word: "SPIDER", hint: "Eight legs" },
    { word: "BAT", hint: "Flies at night" }, { word: "MOON", hint: "Shines at night" },
    { word: "BROOM", hint: "Sweeps or flies" }, { word: "CAULDRON", hint: "Big bubbly pot" },
    { word: "LANTERN", hint: "Carries a light" }, { word: "SCARECROW", hint: "Stands in a field" },
    { word: "TREAT", hint: "Trick or ___" }, { word: "OWL", hint: "Says hoo" },
    { word: "CAT", hint: "Black and says meow" }, { word: "MASK", hint: "Covers your face" },
    { word: "HAUNTED HOUSE", hint: "Spooky place" }, { word: "CANDY CORN", hint: "Tri-color treat" },
    { word: "MONSTER", hint: "Friendly or not" }, { word: "WEB", hint: "Spider makes it" },
  ],
  sounds: { place: [440, 660], win: [523, 659, 784] },
};

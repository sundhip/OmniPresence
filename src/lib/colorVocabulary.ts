/**
 * OmniPresence Color Vocabulary & Normalization Engine
 * Centralized controlled vocabulary for clothing color detection, filtering, and harmonies.
 */

export const PRIMARY_COLORS = [
  "Red",
  "Orange",
  "Yellow",
  "Green",
  "Blue",
  "Purple",
  "Pink",
  "Brown",
  "Black",
  "White",
  "Grey",
  "Beige",
] as const;

export const EXTENDED_COLORS = [
  "Navy",
  "Maroon",
  "Burgundy",
  "Olive",
  "Teal",
  "Cyan",
  "Lavender",
  "Coral",
  "Mustard",
  "Cream",
  "Khaki",
  "Tan",
  "Charcoal",
] as const;

export type PrimaryColor = (typeof PRIMARY_COLORS)[number];
export type ExtendedColor = (typeof EXTENDED_COLORS)[number];
export type ControlledColor = PrimaryColor | ExtendedColor;

export const ALL_CONTROLLED_COLORS: ControlledColor[] = [
  ...PRIMARY_COLORS,
  ...EXTENDED_COLORS,
];

// Hex map for clean accessible rendering
export const COLOR_HEX_MAP: Record<string, string> = {
  // Primary
  Red: "#DC2626",
  Orange: "#EA580C",
  Yellow: "#EAB308",
  Green: "#16A34A",
  Blue: "#2563EB",
  Purple: "#7C3AED",
  Pink: "#EC4899",
  Brown: "#78350F",
  Black: "#171526",
  White: "#FFFFFF",
  Grey: "#64748B",
  Gray: "#64748B",
  Beige: "#D4C5B9",
  // Extended
  Navy: "#1E293B",
  Maroon: "#800000",
  Burgundy: "#831843",
  Olive: "#4D7C0F",
  Teal: "#0D9488",
  Cyan: "#06B6D4",
  Lavender: "#C8B5FF",
  Coral: "#F43F5E",
  Mustard: "#D97706",
  Cream: "#FFFDD0",
  Khaki: "#C3B091",
  Tan: "#D2B48C",
  Charcoal: "#334155",
};

// Comprehensive normalization dictionary mapping synonyms to controlled color names
const SYNONYM_MAP: Record<string, ControlledColor> = {
  // Red family
  red: "Red",
  crimson: "Red",
  scarlet: "Red",
  ruby: "Red",
  cherry: "Red",
  vermilion: "Red",
  cardinal: "Red",
  carmine: "Red",
  "brick red": "Red",
  "bright red": "Red",
  "dark red": "Burgundy",
  "deep red": "Burgundy",
  "wine red": "Burgundy",
  wine: "Burgundy",
  maroon: "Maroon",
  burgundy: "Burgundy",
  oxblood: "Burgundy",
  merlot: "Burgundy",
  bordeaux: "Burgundy",

  // Orange & Coral
  orange: "Orange",
  tangerine: "Orange",
  amber: "Orange",
  rust: "Orange",
  terracotta: "Orange",
  copper: "Orange",
  coral: "Coral",
  peach: "Coral",
  salmon: "Coral",
  apricot: "Coral",

  // Yellow & Mustard
  yellow: "Yellow",
  gold: "Yellow",
  golden: "Yellow",
  lemon: "Yellow",
  canary: "Yellow",
  mustard: "Mustard",
  ochre: "Mustard",
  honey: "Mustard",

  // Green & Olive
  green: "Green",
  emerald: "Green",
  forest: "Green",
  "forest green": "Green",
  hunter: "Green",
  mint: "Green",
  lime: "Green",
  jade: "Green",
  pine: "Green",
  moss: "Olive",
  olive: "Olive",
  "olive green": "Olive",
  sage: "Olive",
  "army green": "Olive",
  khaki: "Khaki",

  // Blue & Navy
  blue: "Blue",
  sky: "Blue",
  "sky blue": "Blue",
  azure: "Blue",
  cobalt: "Blue",
  royal: "Blue",
  "royal blue": "Blue",
  sapphire: "Blue",
  denim: "Blue",
  cerulean: "Blue",
  navy: "Navy",
  "navy blue": "Navy",
  "midnight blue": "Navy",
  midnight: "Navy",
  indigo: "Navy",
  "dark blue": "Navy",

  // Teal & Cyan
  teal: "Teal",
  cyan: "Cyan",
  turquoise: "Teal",
  aqua: "Cyan",
  aquamarine: "Cyan",

  // Purple & Lavender
  purple: "Purple",
  violet: "Purple",
  plum: "Purple",
  eggplant: "Purple",
  amethyst: "Purple",
  magenta: "Purple",
  lavender: "Lavender",
  lilac: "Lavender",
  mauve: "Lavender",
  periwinkle: "Lavender",

  // Pink
  pink: "Pink",
  rose: "Pink",
  blush: "Pink",
  fuchsia: "Pink",
  hotpink: "Pink",
  "hot pink": "Pink",
  bubblegum: "Pink",
  flamingo: "Pink",

  // Brown & Tan
  brown: "Brown",
  chocolate: "Brown",
  espresso: "Brown",
  mocha: "Brown",
  cocoa: "Brown",
  coffee: "Brown",
  chestnut: "Brown",
  mahogany: "Brown",
  tan: "Tan",
  camel: "Tan",
  sand: "Tan",
  cognac: "Tan",
  taupe: "Beige",

  // Black, Charcoal, Grey
  black: "Black",
  noir: "Black",
  onyx: "Black",
  ebony: "Black",
  jet: "Black",
  "jet black": "Black",
  charcoal: "Charcoal",
  anthracite: "Charcoal",
  grey: "Grey",
  gray: "Grey",
  silver: "Grey",
  slate: "Grey",
  ash: "Grey",
  heather: "Grey",

  // White, Cream, Beige
  white: "White",
  snow: "White",
  pearl: "White",
  ivory: "Cream",
  cream: "Cream",
  "off-white": "Cream",
  offwhite: "Cream",
  vanilla: "Cream",
  bone: "Cream",
  beige: "Beige",
  nude: "Beige",
  oatmeal: "Beige",
  linen: "Beige",
  wheat: "Beige",
};

/**
 * Normalizes any free-form color name or description into controlled primary/extended colors.
 */
export function normalizeColor(input: string): {
  primary: ControlledColor;
  secondary?: ControlledColor[];
} {
  if (!input || !input.trim()) {
    return { primary: "Black" };
  }

  const raw = input.toLowerCase().trim();

  // 1. Direct synonym match
  if (SYNONYM_MAP[raw]) {
    return { primary: SYNONYM_MAP[raw] };
  }

  // 2. Check for multi-color patterns (e.g. "black with red stripes", "blue and white", "navy/beige")
  const splitKeywords = raw.split(/\s*(?:and|with|&|\/|\+|,|\s+on\s+)\s*/);
  if (splitKeywords.length > 1) {
    const parsedColors: ControlledColor[] = [];
    for (const part of splitKeywords) {
      const matched = findColorInString(part);
      if (matched && !parsedColors.includes(matched)) {
        parsedColors.push(matched);
      }
    }
    if (parsedColors.length > 0) {
      return {
        primary: parsedColors[0],
        secondary: parsedColors.slice(1),
      };
    }
  }

  // 3. Substring matching with explicit priority for clear basic colors
  const matched = findColorInString(raw);
  if (matched) {
    return { primary: matched };
  }

  return { primary: "Black" };
}

/**
 * Helper to match highest-confidence color keyword in a string
 */
function findColorInString(str: string): ControlledColor | null {
  const words = str.toLowerCase();

  // High priority primary matches first
  if (/\bred\b/.test(words) || words.includes("crimson") || words.includes("scarlet") || words.includes("ruby")) {
    return "Red";
  }
  if (/\bnavy\b/.test(words) || words.includes("midnight blue")) {
    return "Navy";
  }
  if (/\bblue\b/.test(words) || words.includes("denim") || words.includes("cobalt")) {
    return "Blue";
  }
  if (/\bblack\b/.test(words) || words.includes("noir") || words.includes("onyx")) {
    return "Black";
  }
  if (/\bwhite\b/.test(words) || words.includes("ivory") || words.includes("snow")) {
    return "White";
  }
  if (/\bcream\b/.test(words) || words.includes("off-white") || words.includes("offwhite")) {
    return "Cream";
  }
  if (/\bgreen\b/.test(words) || words.includes("emerald") || words.includes("forest")) {
    return "Green";
  }
  if (/\bolive\b/.test(words) || words.includes("sage") || words.includes("moss")) {
    return "Olive";
  }
  if (/\byellow\b/.test(words) || words.includes("gold") || words.includes("lemon")) {
    return "Yellow";
  }
  if (/\bmustard\b/.test(words)) {
    return "Mustard";
  }
  if (/\borange\b/.test(words) || words.includes("tangerine") || words.includes("terracotta")) {
    return "Orange";
  }
  if (/\bcoral\b/.test(words) || words.includes("peach")) {
    return "Coral";
  }
  if (/\bpink\b/.test(words) || words.includes("blush") || words.includes("rose")) {
    return "Pink";
  }
  if (/\bpurple\b/.test(words) || words.includes("violet") || words.includes("plum")) {
    return "Purple";
  }
  if (/\blavender\b/.test(words) || words.includes("lilac") || words.includes("mauve")) {
    return "Lavender";
  }
  if (/\bburgundy\b/.test(words) || words.includes("maroon") || words.includes("wine")) {
    return "Burgundy";
  }
  if (/\bbrown\b/.test(words) || words.includes("espresso") || words.includes("chocolate") || words.includes("mocha")) {
    return "Brown";
  }
  if (/\btan\b/.test(words) || words.includes("camel") || words.includes("cognac")) {
    return "Tan";
  }
  if (/\bbeige\b/.test(words) || words.includes("sand") || words.includes("nude") || words.includes("khaki")) {
    return "Beige";
  }
  if (/\bcharcoal\b/.test(words)) {
    return "Charcoal";
  }
  if (/\bgrey\b/.test(words) || /\bgray\b/.test(words) || words.includes("silver") || words.includes("slate")) {
    return "Grey";
  }
  if (/\bteal\b/.test(words) || words.includes("turquoise")) {
    return "Teal";
  }
  if (/\bcyan\b/.test(words) || words.includes("aqua")) {
    return "Cyan";
  }

  // Iterate over full synonym map as fallback
  for (const [key, val] of Object.entries(SYNONYM_MAP)) {
    if (words.includes(key)) {
      return val;
    }
  }

  return null;
}

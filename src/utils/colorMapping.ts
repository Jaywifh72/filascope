/**
 * Filament color mapping utilities.
 *
 * Provides hex lookups, color-family classification, prefix stripping,
 * and display-name generation for the onboarding pipeline and admin tools.
 */

// ---------------------------------------------------------------------------
// 1. COLOR_NAME_TO_HEX
// ---------------------------------------------------------------------------

/**
 * Maps ~100 common filament color names (lowercase keys) to approximate hex values.
 *
 * @example
 *   COLOR_NAME_TO_HEX["sky blue"]  // "#87CEEB"
 *   COLOR_NAME_TO_HEX["gold"]      // "#FFD700"
 */
export const COLOR_NAME_TO_HEX: Record<string, string> = {
  // --- Standard ---
  white: "#FFFFFF",
  black: "#000000",
  red: "#E53E3E",
  blue: "#3B82F6",
  green: "#22C55E",
  yellow: "#FACC15",
  orange: "#F97316",
  pink: "#EC4899",
  purple: "#8B5CF6",
  grey: "#9CA3AF",
  gray: "#9CA3AF",
  brown: "#92400E",
  beige: "#D2B48C",
  ivory: "#FFFFF0",
  cream: "#FFFDD0",

  // --- Metallic ---
  gold: "#FFD700",
  silver: "#C0C0C0",
  bronze: "#CD7F32",
  copper: "#B87333",
  "rose gold": "#B76E79",

  // --- Blues ---
  "klein blue": "#002FA7",
  "sky blue": "#87CEEB",
  "light blue": "#ADD8E6",
  "baby blue": "#89CFF0",
  "ocean blue": "#0077BE",
  "navy blue": "#001F3F",
  navy: "#001F3F",
  "royal blue": "#4169E1",
  teal: "#008080",
  cyan: "#00BCD4",
  "dark blue": "#00008B",
  cobalt: "#0047AB",
  "powder blue": "#B0E0E6",
  turquoise: "#40E0D0",
  aqua: "#00FFFF",
  midnight: "#191970",
  "midnight blue": "#191970",

  // --- Greens ---
  "grass green": "#7CFC00",
  "mint green": "#98FB98",
  mint: "#98FB98",
  "olive green": "#556B2F",
  olive: "#808000",
  "forest green": "#228B22",
  "dark green": "#006400",
  lime: "#00FF00",
  "lime green": "#32CD32",
  "sage green": "#9DC183",
  sage: "#9DC183",
  "army green": "#4B5320",
  emerald: "#50C878",

  // --- Reds / Pinks ---
  "cherry red": "#DE3163",
  cherry: "#DE3163",
  coral: "#FF7F50",
  salmon: "#FA8072",
  burgundy: "#800020",
  "wine red": "#722F37",
  wine: "#722F37",
  maroon: "#800000",
  crimson: "#DC143C",
  magenta: "#FF00FF",
  fuchsia: "#FF00FF",
  "hot pink": "#FF69B4",
  "sakura pink": "#FFB7C5",
  sakura: "#FFB7C5",
  "rose pink": "#FF66CC",
  rose: "#FF007F",
  "pale pink": "#FADADD",
  peach: "#FFCBA4",

  // --- Yellows / Oranges ---
  "lemon yellow": "#FFF44F",
  lemon: "#FFF44F",
  "vivid yellow": "#FFE900",
  amber: "#FFBF00",
  mustard: "#E1AD01",
  tangerine: "#FF9966",
  apricot: "#FBCEB1",
  "burnt orange": "#CC5500",

  // --- Purples ---
  "lavender purple": "#B57EDC",
  lavender: "#E6E6FA",
  violet: "#7F00FF",
  plum: "#8E4585",
  lilac: "#C8A2C8",
  mauve: "#E0B0FF",
  indigo: "#4B0082",
  amethyst: "#9966CC",

  // --- Browns / Woods ---
  coffee: "#6F4E37",
  chocolate: "#7B3F00",
  mocha: "#967969",
  oak: "#C0A080",
  walnut: "#5C3317",
  wood: "#DEB887",
  "roasted chestnut": "#4A2C2A",
  "roasted chestnut black": "#2C1A1A",
  caramel: "#FFD59A",
  tan: "#D2B48C",

  // --- Whites ---
  "bone white": "#F9F6EE",
  "ceramic white": "#F5F5F0",
  "snow white": "#FFFAFA",
  "pearl white": "#F0EAD6",
  "cloudy white": "#E8E4DE",
  "warm white": "#FAF0E6",
  "cool white": "#F0F8FF",

  // --- Greys ---
  charcoal: "#36454F",
  "slate grey": "#708090",
  "slate gray": "#708090",
  slate: "#708090",
  "stone grey": "#928E85",
  "stone gray": "#928E85",
  "warm grey": "#A89F91",
  "warm gray": "#A89F91",
  "cool grey": "#8C92AC",
  "cool gray": "#8C92AC",
  "dark grey": "#404040",
  "dark gray": "#404040",
  "light grey": "#D3D3D3",
  "light gray": "#D3D3D3",
  ash: "#B2BEB5",

  // --- Nature / Elements ---
  nebula: "#4B0082",
  galaxy: "#2E1A47",
  "galaxy black": "#1A1A2E",
  cosmic: "#2E1A47",
  sunrise: "#FF6B35",
  sunset: "#FF4500",
  ocean: "#006994",
  forest: "#228B22",
  arctic: "#E0F0FF",
  "arctic white": "#F0F8FF",
  lava: "#CF1020",
  storm: "#4F666A",
  thunder: "#4F666A",
  sky: "#87CEEB",
  cloud: "#F0F0F0",
  fog: "#C8C8C8",
  mist: "#D3D3D3",
  dusk: "#4E3B5E",
  dawn: "#FFB347",
  fire: "#FF4500",
  flame: "#E25822",
  earth: "#5B3A29",
  snow: "#FFFAFA",
  ice: "#D6ECEF",

  // --- Gemstone ---
  pearl: "#FDEADB",
  opal: "#A8C3BC",
  jade: "#00A86B",
  ruby: "#E0115F",
  sapphire: "#0F52BA",
  topaz: "#FFC87C",
  obsidian: "#1B1B1B",

  // --- Earthy / Material ---
  bamboo: "#D4C99E",
  bone: "#E3DAC9",
  sand: "#C2B280",
  clay: "#B66A50",
  stone: "#928E85",
  champagne: "#F7E7CE",
  espresso: "#3C1414",
  honey: "#EB9605",
  butterscotch: "#E29C45",
  cinnamon: "#D2691E",
  "olive drab": "#6B8E23",

  // --- Fruit / Food ---
  melon: "#FEBAAD",
  berry: "#8E4585",
  grape: "#6F2DA8",
  aubergine: "#3D0C02",
  eggplant: "#614051",
  pistachio: "#93C572",

  // --- Botanical ---
  seafoam: "#93E9BE",
  eucalyptus: "#44D7A8",
  petrol: "#005F6B",

  // --- Metal ---
  steel: "#71797E",
  gunmetal: "#2C3539",
  titanium: "#878681",
  chrome: "#DBE4EB",
  iron: "#48494B",
  rust: "#B7410E",
  oxide: "#B7410E",
  patina: "#407A52",
  verdigris: "#43B3AE",

  // --- Transparent / Special ---
  transparent: "#FFFFFF",
  clear: "#FFFFFF",
  "natural/clear": "#FFFFFF",
  natural: "#F5F5DC",
  translucent: "#FFFFFF",
  glow: "#C8E6C9",
  "glow in the dark": "#C8E6C9",

  // --- Neons ---
  "neon green": "#39FF14",
  "neon pink": "#FF6EC7",
  "neon orange": "#FF5F1F",
  "neon yellow": "#DFFF00",
  "neon blue": "#1B03A3",
  "neon red": "#FF073A",
};

// ---------------------------------------------------------------------------
// 2. COLOR_FAMILY_MAP
// ---------------------------------------------------------------------------

/**
 * Maps lowercase color names to a canonical color-family category.
 *
 * Categories: White, Black, Grey, Red, Orange, Yellow, Green, Blue, Purple,
 * Pink, Brown, Beige, Gold/Silver, Transparent, Multi-Color, Other.
 *
 * @example
 *   COLOR_FAMILY_MAP["navy blue"]  // "Blue"
 */
export const COLOR_FAMILY_MAP: Record<string, string> = {
  // Whites
  white: "White", "bone white": "White", "ceramic white": "White",
  "snow white": "White", "pearl white": "White", "cloudy white": "White",
  "warm white": "White", "cool white": "White", ivory: "White",

  // Blacks
  black: "Black", "roasted chestnut black": "Black", charcoal: "Black",
  midnight: "Black",

  // Greys
  grey: "Grey", gray: "Grey", "slate grey": "Grey", "slate gray": "Grey",
  slate: "Grey", "stone grey": "Grey", "stone gray": "Grey",
  "warm grey": "Grey", "warm gray": "Grey", "cool grey": "Grey",
  "cool gray": "Grey", "dark grey": "Grey", "dark gray": "Grey",
  "light grey": "Grey", "light gray": "Grey", ash: "Grey",

  // Reds
  red: "Red", "cherry red": "Red", cherry: "Red", crimson: "Red",
  burgundy: "Red", "wine red": "Red", wine: "Red", maroon: "Red",
  "neon red": "Red",

  // Oranges
  orange: "Orange", tangerine: "Orange", "burnt orange": "Orange",
  "neon orange": "Orange", apricot: "Orange", coral: "Orange",

  // Yellows
  yellow: "Yellow", "lemon yellow": "Yellow", lemon: "Yellow",
  "vivid yellow": "Yellow", amber: "Yellow", mustard: "Yellow",
  "neon yellow": "Yellow",

  // Greens
  green: "Green", "grass green": "Green", "mint green": "Green",
  mint: "Green", "olive green": "Green", olive: "Green",
  "forest green": "Green", "dark green": "Green", lime: "Green",
  "lime green": "Green", "sage green": "Green", sage: "Green",
  "army green": "Green", emerald: "Green", "neon green": "Green",
  teal: "Green",

  // Blues
  blue: "Blue", "klein blue": "Blue", "sky blue": "Blue",
  "light blue": "Blue", "baby blue": "Blue", "ocean blue": "Blue",
  "navy blue": "Blue", navy: "Blue", "royal blue": "Blue",
  cyan: "Blue", "dark blue": "Blue", cobalt: "Blue",
  "powder blue": "Blue", turquoise: "Blue", aqua: "Blue",
  "midnight blue": "Blue", "neon blue": "Blue",

  // Purples
  purple: "Purple", "lavender purple": "Purple", lavender: "Purple",
  violet: "Purple", plum: "Purple", lilac: "Purple", mauve: "Purple",
  indigo: "Purple", amethyst: "Purple",

  // Pinks
  pink: "Pink", "sakura pink": "Pink", sakura: "Pink",
  "rose pink": "Pink", rose: "Pink", "pale pink": "Pink",
  "hot pink": "Pink", magenta: "Pink", fuchsia: "Pink",
  "neon pink": "Pink", peach: "Pink", salmon: "Pink",

  // Browns
  brown: "Brown", coffee: "Brown", chocolate: "Brown", mocha: "Brown",
  oak: "Brown", walnut: "Brown", wood: "Brown",
  "roasted chestnut": "Brown", caramel: "Brown",

  // Beiges
  beige: "Beige", cream: "Beige", tan: "Beige", natural: "Beige",

  // Metallics
  gold: "Gold/Silver", silver: "Gold/Silver", bronze: "Gold/Silver",
  copper: "Gold/Silver", "rose gold": "Gold/Silver",

  // Transparent
  transparent: "Transparent", clear: "Transparent",
  "natural/clear": "Transparent", translucent: "Transparent",

  // Special
  glow: "Other", "glow in the dark": "Other",
  "multi-color": "Multi-Color", rainbow: "Multi-Color",
  multicolor: "Multi-Color",
};

// ---------------------------------------------------------------------------
// Prefix-stripping helpers
// ---------------------------------------------------------------------------

/** Prefixes to remove before colour lookup (order matters — longest first). */
const STRIP_PREFIXES = [
  "high speed", "high-speed", "hs",
  "silk", "matte", "satin", "glossy", "galaxy",
  "marble", "rainbow", "dual-color", "dual color",
  "glow-in-the-dark", "glow in the dark",
  // material names
  "petg cf", "pla cf", "abs cf", "asa cf",
  "petg", "pla+", "pla", "abs", "asa", "tpu", "tpee",
  "pa12", "pa6", "pa", "pc", "pom", "pvb",
  "hips", "nylon",
];

/**
 * Remove known material / finish prefixes from a raw colour string.
 * Also strips a leading `materialPrefix` when supplied.
 */
function stripPrefixes(raw: string, materialPrefix?: string): string {
  let s = raw.trim();

  // Remove explicit material prefix
  if (materialPrefix) {
    const re = new RegExp(`^${materialPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i");
    s = s.replace(re, "");
  }

  // Remove known generic prefixes (repeat twice for stacked prefixes like "Matte PLA")
  for (let pass = 0; pass < 2; pass++) {
    for (const prefix of STRIP_PREFIXES) {
      const re = new RegExp(`^${prefix}\\s+`, "i");
      if (re.test(s)) {
        s = s.replace(re, "").trim();
        break; // restart prefix scan
      }
    }
  }

  return s.trim();
}

// ---------------------------------------------------------------------------
// 3. guessColorHex
// ---------------------------------------------------------------------------

/**
 * Attempts to resolve a raw filament color name to a hex value.
 *
 * Strips common material / finish prefixes then performs:
 *   1. Exact lowercase match
 *   2. Substring match (longest key that appears in the name)
 *
 * @returns Hex string (e.g. "#FF0000") or `null` if no match.
 *
 * @example
 *   guessColorHex("PLA Roasted Chestnut Black") // "#2C1A1A"
 *   guessColorHex("Matte Forest Green")         // "#228B22"
 *   guessColorHex("xyzzy unknown color")        // null
 */
export function guessColorHex(colorName: string): string | null {
  const cleaned = stripPrefixes(colorName).toLowerCase();

  // Exact match
  if (COLOR_NAME_TO_HEX[cleaned]) return COLOR_NAME_TO_HEX[cleaned];

  // Substring match — prefer longest matching key
  let bestKey = "";
  for (const key of Object.keys(COLOR_NAME_TO_HEX)) {
    if (cleaned.includes(key) && key.length > bestKey.length) {
      bestKey = key;
    }
  }
  if (bestKey) return COLOR_NAME_TO_HEX[bestKey];

  // Fallback: check for base color words (e.g. "Galaxy Blue" → blue)
  const FALLBACK_COLOR_WORDS: Record<string, string> = {
    red: "#E53E3F",
    blue: "#3182CE",
    green: "#22C55E",
    yellow: "#FACC15",
    orange: "#F97316",
    purple: "#8B5CF6",
    pink: "#EC4899",
    black: "#000000",
    white: "#FFFFFF",
    grey: "#9CA3AF",
    gray: "#9CA3AF",
    brown: "#92400E",
    silver: "#C0C0C0",
    gold: "#FFD700",
    cyan: "#06B6D4",
    teal: "#008080",
    magenta: "#FF00FF",
  };

  for (const [word, hex] of Object.entries(FALLBACK_COLOR_WORDS)) {
    if (cleaned.includes(word)) return hex;
  }

  return null;
}

// ---------------------------------------------------------------------------
// 4. guessColorFamily
// ---------------------------------------------------------------------------

/**
 * Determines the canonical color-family for a raw filament color name.
 *
 * @returns One of the predefined family names or `null`.
 *
 * @example
 *   guessColorFamily("Silk Navy Blue")  // "Blue"
 *   guessColorFamily("Matte Lavender")  // "Purple"
 */
export function guessColorFamily(colorName: string): string | null {
  const cleaned = stripPrefixes(colorName).toLowerCase();

  if (COLOR_FAMILY_MAP[cleaned]) return COLOR_FAMILY_MAP[cleaned];

  let bestKey = "";
  for (const key of Object.keys(COLOR_FAMILY_MAP)) {
    if (cleaned.includes(key) && key.length > bestKey.length) {
      bestKey = key;
    }
  }
  return bestKey ? COLOR_FAMILY_MAP[bestKey] : null;
}

// ---------------------------------------------------------------------------
// 5. normalizeColorName
// ---------------------------------------------------------------------------

/**
 * Strips material prefixes and finish modifiers from a raw colour string.
 *
 * @param rawName          The full variant/option name (e.g. "PLA Roasted Chestnut Black")
 * @param materialPrefix   Optional explicit material to remove (e.g. "PLA")
 * @returns Clean colour name (e.g. "Roasted Chestnut Black")
 *
 * @example
 *   normalizeColorName("PLA Roasted Chestnut Black", "PLA") // "Roasted Chestnut Black"
 *   normalizeColorName("Matte PLA Forest Green")            // "Forest Green"
 *   normalizeColorName("High Speed ABS Red", "ABS")         // "Red"
 */
export function normalizeColorName(rawName: string, materialPrefix?: string): string {
  const result = stripPrefixes(rawName, materialPrefix);
  // Capitalise first letter of each word for consistency
  return result.replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// 6. generateDisplayName
// ---------------------------------------------------------------------------

/**
 * Creates a standardized display name for a filament variant.
 *
 * Format: `BRAND MATERIAL - Color (weight)`
 *
 * @example
 *   generateDisplayName("SUNLU", "PLA", "White", "1kg")
 *   // "SUNLU PLA - White (1kg)"
 *
 *   generateDisplayName("Polymaker", "PETG", "Blue")
 *   // "Polymaker PETG - Blue"
 */
export function generateDisplayName(
  brandName: string,
  material: string,
  colorName: string,
  weight?: string,
): string {
  const base = `${brandName} ${material} - ${colorName}`;
  return weight ? `${base} (${weight})` : base;
}

// Color family definitions with representative HEX colors
export const COLOR_FAMILIES = [
  { name: "Red", hex: "#DC2626", families: ["Red", "Burgundy", "Maroon", "Crimson"] },
  { name: "Orange", hex: "#EA580C", families: ["Orange", "Coral", "Peach"] },
  { name: "Yellow", hex: "#EAB308", families: ["Yellow", "Gold", "Amber", "Mustard"] },
  { name: "Green", hex: "#16A34A", families: ["Green", "Olive", "Lime", "Forest", "Mint", "Sage"] },
  { name: "Teal", hex: "#0D9488", families: ["Teal", "Turquoise", "Aqua"] },
  { name: "Blue", hex: "#2563EB", families: ["Blue", "Navy", "Sky", "Royal", "Cobalt"] },
  { name: "Purple", hex: "#9333EA", families: ["Purple", "Violet", "Lavender", "Plum"] },
  { name: "Pink", hex: "#EC4899", families: ["Pink", "Magenta", "Rose", "Fuchsia"] },
  { name: "Brown", hex: "#92400E", families: ["Brown", "Tan", "Chocolate", "Coffee", "Mocha"] },
  { name: "Beige", hex: "#D4A574", families: ["Beige", "Cream", "Ivory", "Natural", "Nude"] },
  { name: "Black", hex: "#1A1A1A", families: ["Black", "Charcoal", "Ebony"] },
  { name: "White", hex: "#F5F5F5", families: ["White", "Ivory", "Snow"] },
  { name: "Gray", hex: "#6B7280", families: ["Gray", "Grey", "Silver", "Slate", "Ash"] },
  { name: "Clear", hex: "#E0F2FE", families: ["Clear", "Transparent", "Translucent", "Crystal"] },
  { name: "Multi", hex: "linear-gradient(135deg, #DC2626, #EA580C, #EAB308, #16A34A, #2563EB, #9333EA)", families: ["Rainbow", "Multi", "Multicolor", "Gradient", "Silk"] },
  { name: "Glow", hex: "#84CC16", families: ["Glow", "Phosphorescent", "Luminous"] },
];

// Helper to convert HEX to RGB
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// Calculate color distance (Euclidean in RGB space, approximates delta-E)
export const colorDistance = (hex1: string, hex2: string): number => {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return Infinity;
  
  // Weighted Euclidean distance (human eye is more sensitive to green)
  const rMean = (rgb1.r + rgb2.r) / 2;
  const deltaR = rgb1.r - rgb2.r;
  const deltaG = rgb1.g - rgb2.g;
  const deltaB = rgb1.b - rgb2.b;
  
  // Redmean color difference formula (better perceptual accuracy)
  const weightR = 2 + rMean / 256;
  const weightG = 4;
  const weightB = 2 + (255 - rMean) / 256;
  
  return Math.sqrt(weightR * deltaR * deltaR + weightG * deltaG * deltaG + weightB * deltaB * deltaB);
};

// Calculate color match percentage (100% = exact match, 0% = max difference)
export const getColorMatchPercent = (searchHex: string, filamentHex: string): number => {
  const distance = colorDistance(searchHex, filamentHex);
  // Max distance in redmean formula is ~764 (black to white)
  const maxDistance = 764;
  const percent = Math.max(0, Math.min(100, 100 - (distance / maxDistance) * 100));
  return Math.round(percent);
};

// Convert HSL to HEX
export const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

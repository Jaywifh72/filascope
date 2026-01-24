/**
 * Fuzzy Search & Typo Tolerance Utilities
 * Uses Levenshtein distance to find close matches for search terms
 */

// Common brand names and materials for typo matching
const KNOWN_BRANDS = [
  "Bambu Lab", "Creality", "Prusa Research", "Prusament", "QIDI", "Anycubic",
  "Elegoo", "FlashForge", "Sovol", "Voron", "FLSUN", "Snapmaker", "Raise3D",
  "UltiMaker", "Markforged", "Polymaker", "Hatchbox", "eSUN", "Overture",
  "Sunlu", "Eryone", "PolyTerra", "PolyLite", "PolyMax", "Inland", "Duramic",
  "MatterHackers", "Proto-pasta", "ColorFabb", "FilamentOne", "3D Solutech",
  "Amazon Basics", "Geeetech", "Kingroon", "Artillery", "Voxelab", "Longer",
  "Anker", "AnkerMake", "eufyMake", "Rat Rig", "LDO", "Formbot"
];

const KNOWN_MATERIALS = [
  "PLA", "PLA+", "PETG", "ABS", "ASA", "TPU", "TPE", "Nylon", "PA", "PC",
  "Polycarbonate", "HIPS", "PVA", "Carbon Fiber", "CF", "Glass Fiber", "GF",
  "Wood", "Marble", "Silk", "Matte", "Metallic", "Glow", "Transparent",
  "Translucent", "High Speed", "High Flow", "Flexible", "Rigid"
];

const COMMON_TYPOS: Record<string, string[]> = {
  "creality": ["crality", "crealit", "crealty", "crealitey", "crealtiy"],
  "bambu lab": ["bamboo lab", "bambo lab", "bambu", "bambulab", "bambu labs"],
  "prusa": ["prusa research", "prusament", "prussa", "prusia", "pursa"],
  "polymaker": ["polymmaker", "polymaker", "poly maker", "polimaker"],
  "hatchbox": ["hatchbok", "hatchboks", "hatch box", "hatcbox"],
  "esun": ["e-sun", "e sun", "esun3d", "esunn"],
  "anycubic": ["anycubik", "anycubuc", "anycubic3d", "any cubic"],
  "elegoo": ["elegoo3d", "elego", "eleggo", "elegoo3d"],
  "sunlu": ["sunloo", "sun lu", "sunlu3d", "sulu"],
  "overture": ["overtur", "overature", "overture3d"],
  "petg": ["pet-g", "pet g", "pteg"],
  "abs": ["abss"],
  "tpu": ["t-pu", "t pu", "thermoplastic polyurethane"],
  "nylon": ["nyllon", "pa6", "pa12", "polyamide"],
  "carbon fiber": ["cf", "carbon", "carbo fiber", "carbon fibre"],
  "glass fiber": ["gf", "glass", "glas fiber", "fiberglass"],
  "high speed": ["hi speed", "highspeed", "hs", "fast"],
  "silk": ["silky", "shiny", "shimmer"],
};

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Increment along the first column of each row
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // Increment each column in the first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity ratio between 0 and 1
 */
export function getSimilarity(a: string, b: string): number {
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1;
  return 1 - distance / maxLength;
}

/**
 * Find best matching term from a list
 */
export function findBestMatch(
  query: string,
  candidates: string[],
  minSimilarity = 0.6
): { match: string; similarity: number } | null {
  const normalizedQuery = query.toLowerCase().trim();
  
  let bestMatch: string | null = null;
  let bestSimilarity = 0;

  for (const candidate of candidates) {
    const similarity = getSimilarity(normalizedQuery, candidate.toLowerCase());
    if (similarity > bestSimilarity && similarity >= minSimilarity) {
      bestSimilarity = similarity;
      bestMatch = candidate;
    }
  }

  return bestMatch ? { match: bestMatch, similarity: bestSimilarity } : null;
}

/**
 * Check for common typos and suggest corrections
 */
export function getTypoSuggestion(query: string): string | null {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Check exact typo mappings first
  for (const [correct, typos] of Object.entries(COMMON_TYPOS)) {
    if (typos.includes(normalizedQuery)) {
      // Return the properly cased version from KNOWN_BRANDS or KNOWN_MATERIALS
      const brandMatch = KNOWN_BRANDS.find(b => b.toLowerCase() === correct);
      const materialMatch = KNOWN_MATERIALS.find(m => m.toLowerCase() === correct);
      return brandMatch || materialMatch || correct;
    }
  }
  
  // Check fuzzy match against known brands
  const brandMatch = findBestMatch(normalizedQuery, KNOWN_BRANDS, 0.7);
  if (brandMatch && brandMatch.similarity < 1) {
    return brandMatch.match;
  }
  
  // Check fuzzy match against known materials
  const materialMatch = findBestMatch(normalizedQuery, KNOWN_MATERIALS, 0.75);
  if (materialMatch && materialMatch.similarity < 1) {
    return materialMatch.match;
  }
  
  return null;
}

/**
 * Get multiple similar suggestions for a query
 */
export function getSimilarSuggestions(query: string, limit = 3): string[] {
  const normalizedQuery = query.toLowerCase().trim();
  const suggestions: { term: string; similarity: number }[] = [];
  
  // Check brands
  for (const brand of KNOWN_BRANDS) {
    const similarity = getSimilarity(normalizedQuery, brand.toLowerCase());
    if (similarity >= 0.4 && similarity < 1) {
      suggestions.push({ term: brand, similarity });
    }
  }
  
  // Check materials
  for (const material of KNOWN_MATERIALS) {
    const similarity = getSimilarity(normalizedQuery, material.toLowerCase());
    if (similarity >= 0.4 && similarity < 1) {
      suggestions.push({ term: material, similarity });
    }
  }
  
  // Sort by similarity and return top matches
  return suggestions
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map(s => s.term);
}

/**
 * Check if a query needs correction
 */
export function needsCorrection(query: string): boolean {
  if (!query || query.trim().length < 3) return false;
  
  const normalizedQuery = query.toLowerCase().trim();
  
  // Check if it's already an exact match
  const isExactBrand = KNOWN_BRANDS.some(b => b.toLowerCase() === normalizedQuery);
  const isExactMaterial = KNOWN_MATERIALS.some(m => m.toLowerCase() === normalizedQuery);
  
  if (isExactBrand || isExactMaterial) return false;
  
  // Check if we have a suggestion
  return getTypoSuggestion(query) !== null;
}

/**
 * Get all known brands for autocomplete
 */
export function getKnownBrands(): string[] {
  return [...KNOWN_BRANDS];
}

/**
 * Get all known materials for autocomplete
 */
export function getKnownMaterials(): string[] {
  return [...KNOWN_MATERIALS];
}

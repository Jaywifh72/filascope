/**
 * Pure utility functions for the TD matching engine.
 * Color normalization, color extraction from product titles,
 * material alias mapping, and hex distance calculation.
 */

// ─── Material Family Map ─────────────────────────────────────────────
// Maps base material families to all their variant names (lowercased).
// Used for Rule 5 (material family fallback) and Rule 1 alias matching.
const MATERIAL_FAMILIES: Record<string, string[]> = {
  'pla': ['pla', 'pla+', 'pla plus', 'pla pro', 'pla basic', 'pla matte', 'pla silk',
    'pla-cf', 'pla high speed', 'pla hs', 'pla extrafill', 'pla easyfil',
    'pla tough', 'pla premium', 'pla+ 2.0', 'standard pla+', 'easyprint pla',
    'pla-blend', 'pla-meta', 'pla-tough', 'bio-pla', 'rpla', 'r-pla'],
  'petg': ['petg', 'petg+', 'petg basic', 'petg pro', 'petg-cf', 'pctg', 'petg matte',
    'pet-g', 'pet-g premium', 'petg economy', 'pro petg', 'petg-translucent',
    'petg iridescent'],
  'abs': ['abs', 'abs+', 'abs plus', 'abs basic', 'abs-cf', 'abs easy', 'abs easyfil',
    'easy abs', 'smart abs', 'abs-r', 'abs medical', 'abs-hs'],
  'asa': ['asa', 'asa basic', 'asa extrafill'],
  'pc': ['pc', 'pc blend', 'pc-cf', 'pc pro', 'ezpc', 'pc-abs', 'pc-275'],
  'tpu': ['tpu', 'tpu-95a', 'tpu-90a', 'tpu-85a', 'tpu-75a', 'tpe', 'flex',
    'tpu 95a', 'tpu 85a', 'tpu 75a', 'rtpu', 'tpu-bio', 'tpu-foam'],
  'nylon': ['pa', 'pa6', 'pa11', 'pa12', 'nylon', 'pa-cf', 'pa-gf',
    'pa6-cf', 'pa12-cf', 'nylon-cf', 'nylon-gf'],
  'pvb': ['pvb'],
  'hips': ['hips', 'hips-x'],
};

// Build a reverse lookup: variant -> base family
const _variantToFamily = new Map<string, string>();
for (const [family, variants] of Object.entries(MATERIAL_FAMILIES)) {
  for (const v of variants) {
    _variantToFamily.set(v, family);
  }
}

/** Get base material family for a material string, or null */
export function getMaterialFamily(material: string): string | null {
  return _variantToFamily.get(material.toLowerCase().trim()) ?? null;
}

/** Check if two materials belong to the same family */
export function sameMaterialFamily(a: string, b: string): boolean {
  const fa = getMaterialFamily(a);
  const fb = getMaterialFamily(b);
  return fa !== null && fa === fb;
}

/** Check if two materials match (exact or alias) */
export function materialsMatch(filamentMaterial: string, refMaterial: string): boolean {
  const fm = filamentMaterial.toLowerCase().trim();
  const rm = refMaterial.toLowerCase().trim();
  if (fm === rm) return true;
  // Both resolve to the same family AND one of them is the base
  const ff = getMaterialFamily(fm);
  const rf = getMaterialFamily(rm);
  return ff !== null && ff === rf;
}

// ─── Color Normalization ─────────────────────────────────────────────

const STRIP_SUFFIXES = /\b(1\.75\s*mm|2\.85\s*mm|1\s*kg|850\s*g|970\s*g|750\s*g|500\s*g|spool|filament|3d|printer)\b/gi;
const TRADEMARK = /[™®©(TM)(R)]+/gi;

/** Normalize a color string for comparison */
export function normalizeColor(color: string): string {
  let c = color.trim().toLowerCase();
  c = c.replace(STRIP_SUFFIXES, '').trim();
  c = c.replace(/\s+/g, ' ').trim();
  c = c.replace(/grey/g, 'gray');
  return c;
}

/** Strip trademark symbols from a string */
export function stripTrademark(s: string): string {
  return s.replace(TRADEMARK, '').replace(/\s+/g, ' ').trim();
}

// ─── Color Extraction from Product Title ─────────────────────────────

const MATERIAL_KEYWORDS = new Set([
  'pla', 'petg', 'abs', 'asa', 'pc', 'tpu', 'tpe', 'nylon', 'pa',
  'pvb', 'hips', 'pctg', 'pet-g', 'filament', 'silk', 'matte',
  'wood', 'marble', 'glow', 'cf', 'gf', 'carbon', 'fiber',
]);

/**
 * Extract color name from a product title when color_family is NULL.
 * Handles patterns like:
 *   "PolyLite™ ABS - Black"           -> "Black"
 *   "PolyTerra PLA, Sakura Pink, 1.75" -> "Sakura Pink"
 *   "BLACK PLA FILAMENT - 1.75MM"     -> "Black"
 *   "ABS-GF"                          -> null
 */
export function extractColorFromTitle(title: string): string | null {
  const cleaned = stripTrademark(title);

  // Pattern 1: "ProductLine Material - Color" or "ProductLine Material, Color, ..."
  const dashSplit = cleaned.split(/\s[-–]\s/);
  if (dashSplit.length >= 2) {
    let candidate = dashSplit[dashSplit.length - 1].trim();
    // Remove trailing size/weight info
    candidate = candidate.replace(STRIP_SUFFIXES, '').trim();
    // Remove trailing comma-separated specs
    candidate = candidate.split(',')[0].trim();
    if (candidate.length > 0 && candidate.length < 40 && !looksLikeMaterial(candidate)) {
      return toTitleCase(candidate);
    }
  }

  // Pattern 2: comma-separated "Material, Color, Size"
  const commaSplit = cleaned.split(',').map(s => s.trim());
  if (commaSplit.length >= 2) {
    for (let i = 1; i < commaSplit.length; i++) {
      const part = commaSplit[i].replace(STRIP_SUFFIXES, '').trim();
      if (part.length > 0 && part.length < 40 && !looksLikeMaterial(part) && !looksLikeSize(part)) {
        return toTitleCase(part);
      }
    }
  }

  // Pattern 3: ALL CAPS title like "BLACK PLA FILAMENT"
  // Take leading words before a material keyword
  const words = cleaned.split(/\s+/);
  const colorWords: string[] = [];
  for (const w of words) {
    if (MATERIAL_KEYWORDS.has(w.toLowerCase()) || looksLikeSize(w)) break;
    if (w.length > 1) colorWords.push(w);
  }
  if (colorWords.length > 0 && colorWords.length <= 3) {
    const candidate = colorWords.join(' ');
    if (!looksLikeMaterial(candidate)) {
      return toTitleCase(candidate);
    }
  }

  return null;
}

function looksLikeMaterial(s: string): boolean {
  const lower = s.toLowerCase();
  return MATERIAL_KEYWORDS.has(lower) || /^(pla|abs|petg|asa|pc|tpu|pa)\b/i.test(lower);
}

function looksLikeSize(s: string): boolean {
  return /^\d+(\.\d+)?\s*(mm|kg|g)$/i.test(s);
}

function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Fuzzy Color Matching ────────────────────────────────────────────

/** Get the "base color" by stripping known prefixes/qualifiers */
export function getBaseColor(color: string): string | null {
  const c = normalizeColor(color);
  // Strip brand prefixes
  const prefixed = c.replace(/^(prusa|bambu|polymaker|hatchbox|esun|sunlu)\s+/i, '');
  if (prefixed !== c) return prefixed;
  // Strip qualifiers like "dark", "light", "traffic", "jet"
  const qualified = c.replace(/^(dark|light|traffic|jet|signal|pastel|neon|bright|deep|pure|royal|army|forest|sky|baby|ice|warm|cool)\s+/i, '');
  if (qualified !== c && qualified.length > 0) return qualified;
  return null;
}

/** Check if two colors match with fuzzy logic */
export function fuzzyColorMatch(filamentColor: string, refColor: string): boolean {
  const fc = normalizeColor(filamentColor);
  const rc = normalizeColor(refColor);
  if (fc === rc) return true;

  // Try base color fallback
  const fcBase = getBaseColor(fc);
  const rcBase = getBaseColor(rc);
  if (fcBase && fcBase === rc) return true;
  if (rcBase && rcBase === fc) return true;
  if (fcBase && rcBase && fcBase === rcBase) return true;

  // Check if one contains the other (for compound names)
  if (fc.includes(rc) || rc.includes(fc)) return true;

  return false;
}

// ─── Hex Color Distance ──────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return null;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return [r, g, b];
}

/** Euclidean RGB distance between two hex colors */
export function hexDistance(hex1: string, hex2: string): number {
  const a = hexToRgb(hex1);
  const b = hexToRgb(hex2);
  if (!a || !b) return Infinity;
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

// ─── Product Line Extraction ─────────────────────────────────────────

/**
 * Extract a product line from a material_type reference string.
 * E.g. "PolyTerra PLA" -> "PolyTerra", "PLA Basic" -> null, "PolyLite ABS" -> "PolyLite"
 */
export function extractProductLine(materialType: string): string | null {
  const parts = materialType.trim().split(/\s+/);
  if (parts.length < 2) return null;
  // If first word is NOT a base material keyword, it's likely a product line
  const first = parts[0].toLowerCase().replace(/[+]/g, '');
  if (!MATERIAL_KEYWORDS.has(first) && first !== 'basic' && first !== 'pro') {
    return parts[0];
  }
  // Check for trailing product line: "PLA Basic" -> not a product line
  // "ABS Extrafill" -> "Extrafill"
  const last = parts[parts.length - 1].toLowerCase();
  if (!MATERIAL_KEYWORDS.has(last) && last !== 'basic' && last !== 'pro' && last !== 'plus') {
    return parts[parts.length - 1];
  }
  return null;
}

/** Extract base material from a material_type string (e.g. "PolyTerra PLA" -> "PLA") */
export function extractBaseMaterial(materialType: string): string {
  const parts = materialType.trim().split(/\s+/);
  for (const p of parts) {
    if (getMaterialFamily(p) !== null) return p;
  }
  // Fallback: return the whole thing
  return materialType.trim();
}

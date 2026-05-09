/**
 * Product vetting — prevents non-filament products from being committed to the database.
 * Called before any INSERT to filaments table.
 *
 * Two-tier approach:
 *  1. Hard-block: title matches a known non-filament product type
 *  2. Require positive signal: material field, spool weight, "filament" in title,
 *     or material keyword with diameter context
 */

export interface VetResult {
  pass: boolean;
  reason: string;
}

// Non-filament product type patterns — reject immediately, before positive-signal check
const BLOCKED_PATTERNS: RegExp[] = [
  // Protection plans / warranties
  /protect(?:ion)?\s*plan/i,
  /extended?\s*warrant/i,
  /service\s*plan/i,
  /care\s*plan/i,
  /damage\s*protect(?:ion)?\s*plan/i,
  /accident\s*protect/i,
  /shipping\s*protect/i,
  /\bdeductible\b/i,
  // Dryers / storage
  /filament\s*dry(?:er|ing|box)/i,
  /drying?\s*(box|station|cabinet|container)/i,
  /\bdehumid/i,
  // 3D printers and printer accessories
  /\b3[- ]?d\s*printer\b/i,
  /\bfdm\s*printer\b/i,
  /\bprint(?:er)?\s*kit\b/i,
  /\bbuild\s*plate\b/i,
  /\bprint(?:ing)?\s*(bed|surface)\b/i,
  /\benclosure\b/i,
  /\bhot\s*end\b/i,
  /\bhotend\b/i,
  /\bheater\s*block\b/i,
  /\bthermistor\b/i,
  /\bsilicone\s*case\b/i,
  /\bnozzle\s*(kit|set|cleaner)\b/i,
  /\bnozzle\s*&/i,
  // CNC and laser tools
  /\bcnc\s*(router|machine|mill)\b/i,
  /\blaser\s*(cutter|engraver?|module|machine)\b/i,
  /\bengraving\s*machine\b/i,
  /\blaser\s*class/i,
  // Power tools / hardware
  /\bwood\s*planer\b/i,
  /\bwood\s*lathe\b/i,
  /\bwood\s*turning\b/i,
  /\bchainsaw\b/i,
  /\bjigsaw\b/i,
  /\breciprocat/i,
  /\bband\s*saw\b/i,
  /\belectric\s*saw\b/i,
  /\bhand\s*planer\b/i,
  /\bplaner\s*blade/i,
  /\brouter\s*bit\b/i,
  /\bend\s*mill\b/i,
  /\bspindle\s*motor\b/i,
  /\brotary\s*module\b/i,
  /\borbit(?:al)?\s*sander\b/i,
  /\bstepper\s*motor\b/i,
  /\bclosed.loop\s*motor\b/i,
  // Other non-filament hardware
  /\bbattery\s*charg/i,
  /\breplacement\s*batter/i,
  /\baquarium\s*pump\b/i,
  /\bfish\s*tank\b/i,
  /\bhoneycomb\s*laser\b/i,
  /\bgift\s*card\b/i,
  /\bspool\s*(holder|rack)\b/i,
  /\bdeburr/i,
  /\bdistance\s*meter\b/i,
  /\brad\s*nailer\b/i,
  /\bstapler\s*kit\b/i,
  /\bcollet\s*kit\b/i,
  /\bplastic\s*pulley\b/i,
  /\bflush\s*trim\s*router\b/i,
  /\bcardboard\s*cutter\b/i,
  /\bcleaning\s*needle\b/i,
];

// Material keywords that identify filament products
const MATERIAL_KEYWORDS_EXACT: RegExp[] = [
  /\bpla\b/i,
  /\bpla\+/i,
  /\bpla-cf\b/i,
  /\bpetg\b/i,
  /\bpetg-cf\b/i,
  /\babs\b.*(?:filament|1\.75|spool)/i,  // ABS requires context (too common in non-filament titles)
  /\basa\b/i,
  /\btpu\b/i,
  /\btpe\b/i,
  /\bnylon\b/i,
  /\bpa\s*(?:6|11|12|66|6\.6|612)\b/i,
  /\bhips\b/i,
  /\bpva\b/i,
  /\bpeek\b/i,
  /\bpei\b/i,
  /\bultem\b/i,
  /carbon\s*fi(?:ber|bre)/i,
];

/**
 * Determines whether a scraped product should be committed to the filaments table.
 *
 * @param title       - Product title as scraped
 * @param material    - Material field (if already extracted by brand scraper)
 * @param netWeightG  - Spool weight in grams (if known)
 */
export function vetProduct(
  title: string,
  material?: string | null,
  netWeightG?: number | null,
): VetResult {
  if (!title) return { pass: false, reason: 'Empty product title' };

  // 1. Hard-block non-filament product types
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(title)) {
      return { pass: false, reason: `Blocked product type: title matches "${pattern}"` };
    }
  }

  // 2. Brand scraper already identified a material → definitely a filament
  if (material && material.trim().length > 0) {
    return { pass: true, reason: `Has material: ${material}` };
  }

  // 3. Title explicitly says "filament" → very strong signal
  if (/\bfilament\b/i.test(title)) {
    return { pass: true, reason: 'Title contains "filament"' };
  }

  // 4. Has a physical spool weight → likely a filament
  if (netWeightG && netWeightG > 0) {
    return { pass: true, reason: `Has spool weight: ${netWeightG}g` };
  }

  // 5. Title contains a filament material keyword (with safeguards against ABS false positives)
  for (const pattern of MATERIAL_KEYWORDS_EXACT) {
    if (pattern.test(title)) {
      return { pass: true, reason: `Material pattern in title: ${pattern}` };
    }
  }

  // 6. Diameter strongly suggests filament (1.75mm in title alone is a strong signal)
  if (/1\.75\s*mm/i.test(title) || /\b1\.75\b/.test(title)) {
    return { pass: true, reason: 'Has 1.75mm diameter in title' };
  }

  // 7. No positive filament signal found
  return {
    pass: false,
    reason: `No filament signal: title has no material keyword, "filament", weight, or material field`,
  };
}

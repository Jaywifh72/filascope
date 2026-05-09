/**
 * PRINTER PRODUCT VETTER
 *
 * Determines whether a Shopify product scraped from a brand store is actually
 * a 3D printer (FDM, SLA, DLP, MSLA, CoreXY, etc.) vs. filament, accessories,
 * spare parts, or other hardware.
 *
 * Used by sync-brand-printers before any INSERT to the printers table.
 */

export interface PrinterVetResult {
  pass: boolean;
  printer_technology: string | null;
  reason: string;
}

// ─── Positive: product_type values that mean "this is a printer" ──────────────
const PRINTER_PRODUCT_TYPES = new Set([
  '3d printer', 'printer', '3dprinter', 'fdm printer', 'resin printer',
  'sla printer', 'dlp printer', 'msla printer', '3d printing machine',
  'fdm 3d printer', 'resin 3d printer', 'desktop printer', 'industrial printer',
  'lcd 3d printer', '3d printers',
]);

// ─── Positive: technology keyword in product type / tags / title ──────────────
const TECH_PATTERNS: Record<string, RegExp> = {
  'CoreXY': /\bcorexy\b|\bcore[\s-]*xy\b/i,
  'FDM':    /\bfdm\b|\bfff\b|\bfused[\s-](?:deposition|filament)\b/i,
  'SLA':    /\bsla\b|\bstereolithography\b/i,
  'DLP':    /\bdlp\b|\bdigital[\s-]light[\s-]process/i,
  'MSLA':   /\bmsla\b|\bmono[\s-]?lcd\b|\bmono[\s-]?resin\b/i,
  'Resin':  /\bresin\b/i,
};

// ─── Positive: title patterns that strongly suggest a 3D printer model ────────
const PRINTER_TITLE_PATTERNS: RegExp[] = [
  // Build volume in title (very strong signal)
  /\d{2,4}\s*[x×*]\s*\d{2,4}\s*[x×*]\s*\d{2,4}\s*mm/i,
  // Explicit "3D Printer" in title
  /\b3d\s*printer\b/i,
  // Technology in title
  /\b(?:fdm|fff|sla|dlp|msla|resin)\s+(?:3d\s*)?printer\b/i,
  // Bambu Lab models
  /\b(?:x1[ce]?|p1[sp]|a1(?:\s+mini)?|h2d)\b/i,
  // Creality models
  /\bender[-\s]?\d+[a-z]*/i,
  /\b(?:k[12][cm]?|cr[-\s]?\d+(?:[a-z\s]+)?|halot|nebula|sonic|hyper(?!\s*cube))\b/i,
  // Anycubic models
  /\bkobra\s*(?:\d+|max|plus|neo|s1|go)?\b/i,
  /\bphoton\s*\w+/i,
  /\b(?:mono\s*x|mono\s*m\d|vyper|predator|chiron)\b/i,
  // Elegoo models
  /\bneptune\s*\d+[a-z]*/i,
  /\b(?:saturn|mars|jupiter|mercury)\s*(?:\d+)?\s*(?:pro|ultra|plus|max)?\b/i,
  // Prusa models
  /\b(?:mk[3-9]s?|mini\+?|xl\b|core\s*one)\b.*print/i,
  /\bprusa.*\b(?:mk|xl|mini|core|sl[12])\b/i,
  // Sovol models
  /\bsv[-\s]?\d{2}\b/i,
  // Flashforge models
  /\b(?:adventurer|guider|dreamer|creator\s*\d+|inventor)\s*\d*/i,
  // QIDI models
  /\b(?:q\d+[xcm]?|x-(?:max|plus|cf|smart)|tech\s*x\d)\b/i,
  // Kingroon
  /\bkp[e\d]\d+[a-z]*/i,
  // FLSUN
  /\b(?:speeder\s*pad|super\s*racer|v400|q5|qq-s)\b/i,
  // Artillery / Sidewinder
  /\b(?:sidewinder|hornet|genius|sw[-\s]?x\d)\b/i,
  // Voxelab
  /\b(?:aquila|polaris|proxima)\b/i,
  // Two Trees
  /\b(?:bluer|sapphire|timber)\b/i,
  // Raise3D
  /\b(?:pro\d+|n\d+(?:\s*plus)?)\b/i,
  // FLSUN speed series
  /\bflsun\b.*\bprinter\b/i,
  // Generic patterns
  /\b\d{3,4}[a-z]*\s+3d\s*printer\b/i,
  /\b3d\s*printer\s+\d{3,4}/i,
];

// ─── Negative: patterns that mean this product is NOT a printer ───────────────
const NOT_PRINTER_PATTERNS: RegExp[] = [
  // Filament materials
  /\bfilament\b/i,
  /\b(?:pla|petg|abs|tpu|tpe|asa|nylon)\b.*(?:1\.75|spool|kg|roll)/i,
  // Extruder / hotend parts
  /\bhotend\b|\bhot[-\s]end\b/i,
  /\bheater\s*block\b/i,
  /\bnozzle(?!\s+temp|\s+diameter)\b/i,
  /\bthermistor\b/i,
  /\bextruder\s*kit\b/i,
  /\bheatbreak\b|\bheat\s*break\b/i,
  // Build plate / bed (standalone product)
  /\bbuild\s*plate\b(?!.*printer)/i,
  /\bprint\s*(?:bed|surface)\b(?!.*printer)/i,
  /\bflexible\s*(?:plate|sheet)\b/i,
  /\bpei\s*sheet\b/i,
  // Multi-material add-ons
  /\bams(?:\s+(?:lite|hub|combo))?\b(?!.*printer)/i,
  /\bmmu\b(?!.*printer)/i,
  /\btoolhead\b(?!.*printer)/i,
  // Enclosure / accessories
  /\benclosure\b(?!.*printer)/i,
  /\bfilament\s*dryer?\b/i,
  /\bdrying\s*(?:box|station|cabinet)\b/i,
  /\bspool\s*holder\b/i,
  // Resin-specific consumables
  /\bfep\s*film\b|\brelease\s*film\b/i,
  /\bresin\s*tank\b|\bvat\b(?!.*printer)/i,
  /\bwash.*cure\b|\bcure.*wash\b/i,
  // Spare parts
  /\bsilicone\s*sock\b/i,
  /\bliner\b(?!.*printer)/i,
  /\bspring\s*steel\b/i,
  /\bbelt\b(?!.*printer)/i,
  /\bstepper\s*motor\b/i,
  /\blinear\s*rail\b/i,
  /\bmosfet\b/i,
  // Protection plan / warranty
  /\bprotection\s*plan\b/i,
  /\bextended?\s*warrant/i,
  // Laser / CNC (not 3D printers)
  /\blaser\s*(?:cutter|engraver|module)\b/i,
  /\bcnc\s*(?:router|machine)\b/i,
  // 3D scanner
  /\b3d\s*scanner\b/i,
  // Software / accessories
  /\bslicing\s*software\b/i,
  /\bcontrol\s*board\b|\bmainboard\b/i,
  /\bscreen\b(?!.*printer)/i,
  /\bdisplay\b(?!.*printer)/i,
  // Gift cards
  /\bgift\s*card\b/i,
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function detectTechnology(combined: string): string | null {
  for (const [tech, pattern] of Object.entries(TECH_PATTERNS)) {
    if (pattern.test(combined)) return tech;
  }
  return null;
}

// ─── Main vetter ──────────────────────────────────────────────────────────────

/**
 * Vet a Shopify product as a 3D printer.
 *
 * @param productType  - product.product_type
 * @param title        - product.title
 * @param tags         - product.tags (comma-separated string or array)
 * @param bodyHtml     - product.body_html (product description)
 */
export function vetPrinterProduct(
  productType: string,
  title: string,
  tags: string | string[],
  bodyHtml?: string,
): PrinterVetResult {
  const tagArr = Array.isArray(tags)
    ? tags
    : tags.split(',').map(t => t.trim());
  const tagStr = tagArr.join(' ');
  const combined = `${productType} ${title} ${tagStr}`;

  // 1. Hard-block: clearly not a printer
  for (const pattern of NOT_PRINTER_PATTERNS) {
    if (pattern.test(combined)) {
      return { pass: false, printer_technology: null, reason: `Not a printer: matches "${pattern}"` };
    }
  }

  // 2. product_type is a known printer type → strong accept
  const normalizedType = productType.toLowerCase().trim();
  if (PRINTER_PRODUCT_TYPES.has(normalizedType)) {
    return {
      pass: true,
      printer_technology: detectTechnology(combined),
      reason: `product_type: "${productType}"`,
    };
  }

  // 3. Tags include a known printer type
  for (const tag of tagArr) {
    if (PRINTER_PRODUCT_TYPES.has(tag.toLowerCase())) {
      return {
        pass: true,
        printer_technology: detectTechnology(combined),
        reason: `tag: "${tag}"`,
      };
    }
  }

  // 4. Title matches a known printer model pattern
  for (const pattern of PRINTER_TITLE_PATTERNS) {
    if (pattern.test(title)) {
      return {
        pass: true,
        printer_technology: detectTechnology(combined),
        reason: `title pattern: ${pattern}`,
      };
    }
  }

  // 5. Description contains build volume spec (very strong signal)
  if (bodyHtml) {
    const plain = bodyHtml.replace(/<[^>]+>/g, ' ');
    if (/\d{2,4}\s*[x×*]\s*\d{2,4}\s*[x×*]\s*\d{2,4}\s*mm/i.test(plain)) {
      return {
        pass: true,
        printer_technology: detectTechnology(plain),
        reason: 'body_html contains build volume spec',
      };
    }
  }

  return { pass: false, printer_technology: null, reason: 'No printer signal found' };
}

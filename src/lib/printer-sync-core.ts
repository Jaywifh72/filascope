/**
 * Printer Catalog Sync Core — Self-contained processing utilities
 *
 * Contains classification, extraction, and diff logic for printer catalog sync.
 * Mirrors the structure of catalog-sync-core.ts but for printers instead of filaments.
 *
 * This file has minimal imports — works in both browser and edge-function contexts.
 */

import type { ExtractedPrinter, PrinterSyncItem } from '@/types/printer-sync';

// ============================================================
// Classification — Is this product a 3D printer?
// ============================================================

/**
 * Strong title phrases that definitively indicate a product IS a printer.
 * If the title contains any of these, it overrides exclusion keywords.
 */
const STRONG_PRINTER_PHRASES = [
  '3d printer', 'fdm printer',
];

/**
 * Title phrases that indicate a RESIN printer — we exclude these entirely.
 * FilaScope only tracks FDM printers.
 */
const RESIN_PRINTER_PHRASES = [
  'resin printer', 'sla printer', 'dlp printer', 'msla printer',
  'resin 3d printer', 'lcd 3d printer',
];

/**
 * Weaker signals — only used together with price validation.
 */
const WEAK_PRINTER_SIGNALS = [
  'corexy', 'core xy', 'bed slinger', 'delta printer',
];

/**
 * Product types (lowercase) that definitively mean "this IS a printer".
 * Must be checked EXACTLY — "3D Printer Parts" should NOT match.
 */
const PRINTER_PRODUCT_TYPES = new Set([
  // Exact types seen across stores (FDM only — resin/SLA/MSLA/DLP excluded)
  '3d printer', '3d printers',
  'fdm 3d printer', 'fdm 3d printers', 'fdm printer', 'fdm printers',
  'printer', 'printers',
]);

/**
 * Product types (substrings, lowercase) that definitively mean "this is NOT a printer".
 * If product_type contains any of these, skip immediately.
 */
const EXCLUDE_PRODUCT_TYPE_KEYWORDS = [
  'part', 'material', 'kit', 'filament', 'resin', 'accessory', 'accessories',
  'combo offer', 'sale', 'pack', 'gift', 'card', 'voucher', 'protection',
  'wash', 'cure', 'machine', 'creative', 'scanner', 'laser', 'engraver',
  'pen', 'aff', 'amz', 'kol', 'eol', 'end of life',
];

/** Keywords in the TITLE that indicate a product is NOT a printer */
const EXCLUDE_TITLE_KEYWORDS = [
  // ── Filament & Resin (consumables) ──
  'filament', 'pla ', 'pla+', 'petg ', 'abs ', 'tpu ', 'asa ', 'nylon ', 'pc ',
  'silk ', 'matte ', 'glow ', 'marble ', 'metal ', 'galaxy ', 'special ',
  'resin', 'uv resin', 'bio resin', 'tough resin', 'craftsman resin',
  'high speed resin', 'high clear resin', 'standard resin', 'water-wash',
  'abs-like', 'dlp craftsman',
  'refill', 'bulk sale', 'kg deal', '10-100kg', '50-100kg',

  // ── Parts & Components ──
  'nozzle', 'hotend', 'hot end', 'heat bed', 'heated bed', 'heat block',
  'build plate', 'pei sheet', 'spring steel', 'cool plate', 'smooth plate',
  'effect plate', '3d effect plate',
  'extruder kit', 'stepper motor', 'motor ', 'thermistor',
  'bowden tube', 'ptfe tube', 'belt ', 'bearing', 'pulley', 'v-wheel', 'wheel ',
  'fan ', 'cooling fan', 'power supply', 'power adapter',
  'mainboard', 'motherboard', 'pcba', 'module ',
  'screen ', 'display ', 'touchscreen', 'control screen',
  'sensor ', 'limit switch', 'strain gage',
  'lead screw', 'guide rail', 'coupler',
  'silicone sock', 'heater ', 'ntc ', 'wifi antenna', 'antenna ',
  'signal cable', 'cable ', 'adapter ',

  // ── Accessories & Supplies ──
  'enclosure kit', 'dryer', 'filament dryer',
  'tool head', 'toolhead', 'print head',
  'spool holder', 'filament holder', 'filament hub', 'filament cutter',
  'filament tube', 'reusable spool',
  'spare part', 'replacement', 'upgrade kit', 'upgrade bundle',
  'accessory', 'accessories',
  'cleaning', 'lubricant', 'grease', 'adhesive',
  'scraper', 'tool kit', 'toolkit', 'gift card', 'voucher',
  'air purifier', 'airpure', 'air filter', 'air pure', 'air heat',
  'camera ', 'camera for', 'gooseneck', 'locking nut', 'brush',
  'wiper', 'purge wiper', 'nozzle wiper',

  // ── Bundles, Packs, Deals ──
  'bundle', 'combo pack', 'combo deal', 'starter pack',
  'mystery box', 'clearance sale',

  // ── Resin Post-Processing ──
  'wash & cure', 'wash and cure', 'curing station', 'curing table',
  'washing ', 'fep film', 'nfep', 'acf film', 'wave release film',
  'vat ', 'resin tank', 'build platform', 'leveling kit',
  'sealed washing', 'washing tray', 'washing basket', 'bucket',
  'detergent', 'water pipe', 'fresnel lens', 'peristaltic pump',

  // ── Non-Printer Products ──
  '3d pen', 'laser', 'engraver', 'scanner',
  'speaker', 'lamp ', 'carousel', 'mouse ', 'sunglasses', 'saber',
  'forklift', 'laptop cooler', 'wireless charger',
  'creative kit', 'components kit', 'findings kit',
  'led kit', 'motion kit', 'led relief',

  // ── General Non-Printer ──
  'protection', 'cover ', 'sticker', 'decal', 'mat ',
  'sg15 ', 'pom ', 'synchronous wheel',
];

/**
 * Tags (exact match, lowercase) that are strong indicators of a printer product.
 * These must be very specific — generic tags like "fdm" or "printer" alone are too broad
 * (accessories and filaments often share those tags).
 */
const PRINTER_TAGS = new Set([
  '3d printer', '3d-printer', '3d_printer',
  '3d printers', '3d-printers',
  'fdm 3d printer', 'fdm 3d printers', 'fdm-3d-printer',
  // Note: resin/SLA/MSLA/DLP tags excluded — FilaScope only tracks FDM
]);

/**
 * Classify whether a raw store product is a 3D printer.
 * Returns true if it should be extracted as a printer, false if it should be skipped.
 *
 * Logic is intentionally strict to avoid false positives — it's better to miss a rare
 * edge-case printer than to flood the review table with accessories and consumables.
 *
 * Order of checks:
 *   1. Strong title phrases ("3D Printer") → always accept
 *   2. Hard product_type exclusions (parts, materials, kits) → always reject
 *   3. Exact product_type match (e.g. "FDM 3D Printer") → accept
 *   4. Title exclusion keywords → reject
 *   5. Printer-specific tags → accept (with price floor)
 *   6. "printer" in title + price heuristic → accept
 *   7. Default → reject
 */
export function classifyProductAsPrinter(product: any): boolean {
  const title = (product.title || '').toLowerCase();
  const productType = (product.product_type || '').toLowerCase().trim();
  const tagList: string[] = Array.isArray(product.tags)
    ? product.tags.map((t: any) => (typeof t === 'string' ? t : '').toLowerCase().trim())
    : (product.tags || '').split(',').map((t: string) => t.trim().toLowerCase());

  const firstVariantPrice = parseFloat(product.variants?.[0]?.price || '0');

  // ── 0. Exclude resin/SLA/MSLA/DLP printers — FilaScope only tracks FDM ──
  if (RESIN_PRINTER_PHRASES.some(p => title.includes(p))) return false;
  const resinProductTypes = ['resin', 'sla', 'msla', 'dlp', 'lcd'];
  if (resinProductTypes.some(t => productType.includes(t))) return false;
  if (tagList.some(tag => tag.includes('resin') || tag.includes('sla') || tag.includes('msla') || tag.includes('dlp'))) return false;

  // ── 1. Strong title phrases always win ──
  // If the title explicitly says "3D Printer" etc., it IS a printer.
  // BUT: "Nozzle for FDM 3D Printers" contains "3d printer" yet is NOT a printer —
  // the "for [qualifier] 3D Printer(s)" pattern indicates an accessory FOR a printer.
  const hasPrinterPhrase = STRONG_PRINTER_PHRASES.some(p => title.includes(p));
  if (hasPrinterPhrase) {
    const isAccessoryForPrinter = /\bfor\b.*\b(?:3d\s*printer|fdm\s*printer|resin\s*printer|sla\s*printer|dlp\s*printer|msla\s*printer)/i.test(title);
    if (!isAccessoryForPrinter) return true;
    // If it's "for ... printer", fall through to product_type checks below
  }

  // ── 2. Hard product_type exclusions ──
  // Product types like "3D Printer Parts", "UV Resin", "Filaments", "Combo Offer",
  // "Washing & Curing Machine", "3D Printer Creative Kits" etc. are NEVER printers.
  if (productType) {
    const isExcludedType = EXCLUDE_PRODUCT_TYPE_KEYWORDS.some(kw => productType.includes(kw));
    if (isExcludedType) return false;
  }

  // ── 3. Exact product_type match ──
  // e.g. "FDM 3D Printer", "LCD 3D Printer", "Printer", "3D Printers"
  if (productType && PRINTER_PRODUCT_TYPES.has(productType)) {
    return true;
  }

  // ── 4. Title exclusion keywords ──
  // Check title for specific non-printer indicators.
  for (const kw of EXCLUDE_TITLE_KEYWORDS) {
    if (title.includes(kw)) return false;
  }

  // Also check: if ALL variants have exclusion keywords in their titles, skip
  const variants: any[] = product.variants || [];
  if (variants.length > 0) {
    const allVariantTitles = variants.map((v: any) => (v.title || '').toLowerCase());
    const allVariantsExcluded = allVariantTitles.every((vTitle: string) =>
      EXCLUDE_TITLE_KEYWORDS.some(kw => vTitle.includes(kw))
    );
    if (allVariantsExcluded) return false;
  }

  // ── 5. Printer-specific tags (with price floor) ──
  // Tags like "3d printer", "resin 3d printer" are strong signals, but validate with price.
  const hasPrinterTag = tagList.some(tag => PRINTER_TAGS.has(tag));
  if (hasPrinterTag && firstVariantPrice >= 50) {
    return true;
  }

  // ── 6. Weak positive signals (title patterns + price) ──
  // e.g., "corexy", "bed slinger" in title with printer-level pricing
  const hasWeakSignal = WEAK_PRINTER_SIGNALS.some(s => title.includes(s));
  if (hasWeakSignal && firstVariantPrice >= 100) {
    return true;
  }

  // ── 7. "printer" in title + price heuristic ──
  // If title has "printer" (but not strong phrase) and price is high enough
  if (title.includes('printer') && firstVariantPrice >= 100) {
    return true;
  }

  // ── Default: not a printer ──
  return false;
}

// ============================================================
// Name Cleaning & Normalization Helpers
// ============================================================

/**
 * Clean a product title into a concise model name by stripping brand prefix,
 * "3D Printer" suffix, and other common noise.
 */
export function cleanModelName(title: string, brandName?: string): string {
  let name = title.trim();

  // Strip brand prefix (case-insensitive)
  if (brandName) {
    const re = new RegExp(`^${brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i');
    name = name.replace(re, '');
  }

  // Strip common suffixes
  name = name
    .replace(/\s+3D\s+Printer\b/gi, '')
    .replace(/\s+FDM\s+Printer\b/gi, '')
    .replace(/\s+Resin\s+Printer\b/gi, '')
    .replace(/\s+SLA\s+Printer\b/gi, '')
    .replace(/\s+MSLA\s+Printer\b/gi, '')
    .replace(/\s+DLP\s+Printer\b/gi, '')
    .replace(/\s+Printer\b/gi, '')
    // Strip standalone trailing "Resin" (technology descriptor, not part of model name)
    .replace(/\s+Resin\s*$/i, '')
    // Strip trailing year markers (e.g., "K1C 2025" → "K1C")
    .replace(/\s+20[2-3]\d\s*$/g, '')
    .trim();

  return name || title.trim(); // Fallback to original if stripping left nothing
}

/**
 * Normalize a name for fuzzy matching: lowercase, strip noise, collapse whitespace.
 */
export function normalizeForMatching(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b3d\s*printer\b/gi, '')
    .replace(/\bfdm\b|\bsla\b|\bmsla\b|\bdlp\b/gi, '')
    .replace(/\bresin\b/gi, '')
    .replace(/\bprinter\b/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================
// Extraction — Convert raw product to ExtractedPrinter
// ============================================================

/**
 * Parse pre-fetched `_specs` strings (e.g. "220x220x250mm", "500mm/s") into numeric fields.
 * These specs come from the full product page HTML in pre-fetch scripts, which is much richer
 * than the short JSON-LD description stored in body_html.
 */
function parsePrefetchedSpecs(rawSpecs: Record<string, string> | null | undefined): Record<string, any> {
  if (!rawSpecs || typeof rawSpecs !== 'object') return {};
  const specs: Record<string, any> = {};

  // Build volume: "220x220x250mm" or "220x220x250"
  if (rawSpecs.build_volume) {
    const bv = rawSpecs.build_volume.match(/(\d{2,4})\s*[x×]\s*(\d{2,4})\s*[x×]\s*(\d{2,4})/);
    if (bv) {
      specs.build_volume_x_mm = parseInt(bv[1]);
      specs.build_volume_y_mm = parseInt(bv[2]);
      specs.build_volume_z_mm = parseInt(bv[3]);
    }
  }

  // Max speed: "500mm/s"
  if (rawSpecs.max_speed) {
    const s = rawSpecs.max_speed.match(/(\d{2,4})/);
    if (s) specs.max_print_speed_mms = parseInt(s[1]);
  }

  // Nozzle temp: "300°C" or "300C"
  if (rawSpecs.max_nozzle_temp) {
    const n = rawSpecs.max_nozzle_temp.match(/(\d{2,3})/);
    if (n) specs.max_nozzle_temp_c = parseInt(n[1]);
  }

  // Bed temp: "110°C"
  if (rawSpecs.max_bed_temp) {
    const b = rawSpecs.max_bed_temp.match(/(\d{2,3})/);
    if (b) specs.bed_max_temp_c = parseInt(b[1]);
  }

  // Layer height: "0.1-0.4mm"
  if (rawSpecs.layer_height) {
    const lh = rawSpecs.layer_height.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
    if (lh) {
      specs.layer_height_min_um = Math.round(parseFloat(lh[1]) * 1000);
      specs.layer_height_max_um = Math.round(parseFloat(lh[2]) * 1000);
    }
  }

  return specs;
}

/**
 * Map a currency code to the corresponding price field name.
 */
const CURRENCY_TO_PRICE_FIELD: Record<string, string> = {
  USD: 'price_usd',
  CAD: 'price_cad',
  EUR: 'price_eur',
  GBP: 'price_gbp',
  AUD: 'price_aud',
};

/**
 * Extract an ExtractedPrinter from a raw Shopify-style product object.
 * Pulls pricing from variants, images from product images, and attempts
 * to parse specs from the product body_html, pre-fetched _specs, or metafields.
 *
 * @param sourceCurrency — The currency of the source store (e.g., 'USD', 'CAD').
 *   If not provided, defaults to 'USD'. Pre-fetched data includes a `_currency` field.
 */
export function extractPrinterFromProduct(
  product: any,
  brandId: string,
  regionalUrlPattern?: Record<string, string> | null,
  brandName?: string,
  sourceCurrency?: string,
): ExtractedPrinter {
  const title = product.title || '';
  const handle = product.handle || '';

  // ── Variant-level availability awareness ──
  // Prefer the first *available* variant for pricing (instead of blindly using variants[0]).
  // If no variant is available, fall back to variants[0] for its price data anyway.
  const allVariants: any[] = product.variants || [];
  const firstAvailableVariant = allVariants.find((v: any) => v.available === true);
  const variant = firstAvailableVariant || allVariants[0];
  const price = parseFloat(variant?.price || '0') || null;
  const compareAtPrice = parseFloat(variant?.compare_at_price || '0') || null;
  const sku = variant?.sku || null;
  const image = product.images?.[0]?.src || product.image?.src || null;

  // ── Discontinued detection ──
  // If ALL variants have available === false, the product is discontinued
  const allDiscontinued = allVariants.length > 0
    && allVariants.every((v: any) => v.available === false);
  // Also flag as discontinued if product only has $0 price and no available variants
  const isDiscontinued = allDiscontinued || (price === null && !firstAvailableVariant);

  // Build model name by stripping brand prefix and "3D Printer" suffix
  const modelName = cleanModelName(title, brandName);

  // Determine technology from title + tags (tags are more reliable for resin)
  const titleLower = title.toLowerCase();
  const tagList: string[] = Array.isArray(product.tags)
    ? product.tags.map((t: any) => (typeof t === 'string' ? t : '').toLowerCase())
    : (product.tags || '').split(',').map((t: string) => t.trim().toLowerCase());
  const tagsJoined = tagList.join(' ');

  let technology: string | null = null;
  const combinedTech = `${titleLower} ${tagsJoined}`;
  if (combinedTech.includes('dlp')) {
    technology = 'DLP';
  } else if (combinedTech.includes('msla')) {
    technology = 'MSLA';
  } else if (combinedTech.includes('resin') || combinedTech.includes('sla')) {
    technology = 'MSLA'; // Most modern resin printers are MSLA
  } else {
    technology = 'FDM';
  }

  // Parse specs from body_html if available
  const htmlSpecs = parseSpecsFromHtml(product.body_html || '');

  // Parse pre-fetched _specs (extracted from full page HTML, much richer than body_html)
  const prefetchSpecs = parsePrefetchedSpecs(product._specs);

  // Merge specs: pre-fetched specs take priority over body_html specs
  const specs = { ...htmlSpecs, ...prefetchSpecs };

  // Build regional URLs
  const baseProductUrl = regionalUrlPattern?.US
    ? `${regionalUrlPattern.US.replace(/\/$/, '')}/products/${handle}`
    : `/products/${handle}`;

  const regionUrls: Record<string, string | null> = {
    US: regionalUrlPattern?.US ? `${regionalUrlPattern.US.replace(/\/$/, '')}/products/${handle}` : null,
    EU: regionalUrlPattern?.EU ? `${regionalUrlPattern.EU.replace(/\/$/, '')}/products/${handle}` : null,
    UK: regionalUrlPattern?.UK ? `${regionalUrlPattern.UK.replace(/\/$/, '')}/products/${handle}` : null,
    CA: regionalUrlPattern?.CA ? `${regionalUrlPattern.CA.replace(/\/$/, '')}/products/${handle}` : null,
    AU: regionalUrlPattern?.AU ? `${regionalUrlPattern.AU.replace(/\/$/, '')}/products/${handle}` : null,
  };

  const availableRegions = Object.entries(regionUrls)
    .filter(([, url]) => url != null)
    .map(([region]) => region);

  // ── Currency-aware pricing ──
  // Determine the actual currency of the scraped price
  const currency = (sourceCurrency || product._currency || 'USD').toUpperCase();
  const effectivePrice = price && price > 0 ? price : compareAtPrice;
  const priceField = CURRENCY_TO_PRICE_FIELD[currency] || 'price_usd';

  // Initialize all prices as null, then set the correct one
  const prices: Record<string, number | null> = {
    price_usd: null,
    price_eur: null,
    price_gbp: null,
    price_cad: null,
    price_aud: null,
  };
  prices[priceField] = effectivePrice;

  return {
    brand_id: brandId,
    model_name: modelName,
    display_name: title,
    product_title: title,
    product_handle: handle,
    printer_technology: technology,
    featured_image: image,

    // Dimensions (from parsed specs)
    build_volume_x_mm: specs.build_volume_x_mm,
    build_volume_y_mm: specs.build_volume_y_mm,
    build_volume_z_mm: specs.build_volume_z_mm,
    machine_footprint_x_mm: specs.machine_footprint_x_mm,
    machine_footprint_y_mm: specs.machine_footprint_y_mm,
    machine_footprint_z_mm: specs.machine_footprint_z_mm,
    machine_weight_kg: specs.machine_weight_kg,

    // Temperature
    max_nozzle_temp_c: specs.max_nozzle_temp_c,
    sustained_nozzle_temp_c: null,
    bed_max_temp_c: specs.bed_max_temp_c,
    bed_heated: specs.bed_max_temp_c != null ? true : null,

    // Performance
    max_print_speed_mms: specs.max_print_speed_mms,
    max_travel_speed_xy_mms: null,
    recommended_quality_speed_mms: null,
    max_acceleration_xy_mmss: null,
    max_acceleration_z_mmss: null,
    layer_height_min_um: specs.layer_height_min_um,
    layer_height_max_um: specs.layer_height_max_um,
    layer_height_default_um: null,

    // Extruder
    extruder_count: specs.extruder_count ?? 1,
    extruder_type: specs.extruder_type,
    filament_diameter_mm: specs.filament_diameter_mm ?? 1.75,
    hotend_type: null,
    max_flow_rate_mm3s: null,
    stock_nozzle_diameter_mm: specs.stock_nozzle_diameter_mm,
    nozzle_material: null,

    // Build plate
    bed_size_x_mm: specs.build_volume_x_mm, // Usually same as build volume x/y
    bed_size_y_mm: specs.build_volume_y_mm,
    bed_type: null,
    auto_bed_leveling: specs.auto_bed_leveling,
    auto_bed_leveling_method: null,

    // Enclosure
    has_enclosure: specs.has_enclosure,
    enclosure_type: null,
    enclosure_heated: null,
    filter_type: null,
    internal_lighting: null,

    // Connectivity
    has_wifi: specs.has_wifi,
    has_usb: null,
    has_sd_card: null,
    has_ethernet: null,

    // Multi-Material
    multi_material_supported: specs.multi_material_supported,
    multi_material_max_spools: specs.multi_material_max_spools,

    // Power
    rated_power_w: null,
    power_input_voltage: null,
    thermal_runaway_protection: null,
    power_loss_recovery: null,

    // Frame
    frame_material: null,
    assembly_required: null,

    // Firmware
    firmware_family: null,
    firmware_open_source: null,

    // Features
    input_shaping_supported: specs.input_shaping_supported,
    filament_runout_detection: specs.filament_runout_detection,

    // Pricing — routed to correct currency field based on source store
    price_usd: prices.price_usd,
    price_eur: prices.price_eur,
    price_gbp: prices.price_gbp,
    price_cad: prices.price_cad,
    price_aud: prices.price_aud,

    // URLs
    product_url: baseProductUrl,
    product_url_us: regionUrls.US,
    product_url_eu: regionUrls.EU,
    product_url_uk: regionUrls.UK,
    product_url_ca: regionUrls.CA,
    product_url_au: regionUrls.AU,

    // Metadata
    variant_sku: sku,
    available_regions: availableRegions,
    sku,
    release_date: product.published_at?.slice(0, 10) || null,
    discontinued: isDiscontinued ?? null,
    target_user_segment: null,
    price_tier: null,
  };
}

/**
 * Parse specifications from HTML body content.
 * Looks for common patterns like "Build Volume: 220x220x250mm".
 */
function parseSpecsFromHtml(html: string): Record<string, any> {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  const textLower = text.toLowerCase();
  const specs: Record<string, any> = {};

  // Build volume: "220x220x250mm" or "220 x 220 x 250 mm"
  const buildVolumeMatch = text.match(/(\d{2,4})\s*[x×]\s*(\d{2,4})\s*[x×]\s*(\d{2,4})\s*mm/i);
  if (buildVolumeMatch) {
    specs.build_volume_x_mm = parseInt(buildVolumeMatch[1]);
    specs.build_volume_y_mm = parseInt(buildVolumeMatch[2]);
    specs.build_volume_z_mm = parseInt(buildVolumeMatch[3]);
  }

  // Max speed: "500mm/s" or "500 mm/s"
  const speedMatch = text.match(/(?:max(?:imum)?\s*(?:print)?\s*speed|print\s*speed)[:\s]*(\d{2,4})\s*mm\/?s/i);
  if (speedMatch) {
    specs.max_print_speed_mms = parseInt(speedMatch[1]);
  }

  // Nozzle temp: "max nozzle temp: 300°C"
  const nozzleTempMatch = text.match(/(?:max(?:imum)?\s*)?nozzle\s*temp(?:erature)?[:\s]*(\d{2,3})\s*[°]?\s*[Cc]/i);
  if (nozzleTempMatch) {
    specs.max_nozzle_temp_c = parseInt(nozzleTempMatch[1]);
  }

  // Bed temp: "max bed temp: 110°C" or "heated bed: 110°C"
  const bedTempMatch = text.match(/(?:max(?:imum)?\s*)?(?:heated?\s*)?bed\s*temp(?:erature)?[:\s]*(\d{2,3})\s*[°]?\s*[Cc]/i);
  if (bedTempMatch) {
    specs.bed_max_temp_c = parseInt(bedTempMatch[1]);
  }

  // Layer height: "0.05-0.35mm"
  const layerMatch = text.match(/layer\s*height[:\s]*(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)\s*mm/i);
  if (layerMatch) {
    specs.layer_height_min_um = Math.round(parseFloat(layerMatch[1]) * 1000);
    specs.layer_height_max_um = Math.round(parseFloat(layerMatch[2]) * 1000);
  }

  // Nozzle diameter: "0.4mm nozzle"
  const nozzleMatch = text.match(/(\d+\.?\d*)\s*mm\s*nozzle/i);
  if (nozzleMatch) {
    specs.stock_nozzle_diameter_mm = parseFloat(nozzleMatch[1]);
  }

  // Machine footprint/dimensions: after build volume
  const footprintMatch = text.match(/(?:machine|printer)\s*(?:size|dimensions?|footprint)[:\s]*(\d{2,4})\s*[x×]\s*(\d{2,4})\s*[x×]\s*(\d{2,4})\s*mm/i);
  if (footprintMatch) {
    specs.machine_footprint_x_mm = parseInt(footprintMatch[1]);
    specs.machine_footprint_y_mm = parseInt(footprintMatch[2]);
    specs.machine_footprint_z_mm = parseInt(footprintMatch[3]);
  }

  // Weight: "12.5kg" or "12.5 kg"
  const weightMatch = text.match(/(?:weight|net\s*weight)[:\s]*(\d+\.?\d*)\s*kg/i);
  if (weightMatch) {
    specs.machine_weight_kg = parseFloat(weightMatch[1]);
  }

  // Boolean features
  specs.auto_bed_leveling = textLower.includes('auto bed leveling') || textLower.includes('auto-leveling') || textLower.includes('automatic leveling') || null;
  specs.has_wifi = textLower.includes('wifi') || textLower.includes('wi-fi') || textLower.includes('wireless') || null;
  specs.has_enclosure = textLower.includes('enclosed') || textLower.includes('enclosure') || null;
  specs.multi_material_supported = textLower.includes('multi-color') || textLower.includes('multi color') || textLower.includes('ams') || textLower.includes('multi-material') || null;
  specs.input_shaping_supported = textLower.includes('input shap') || null;
  specs.filament_runout_detection = textLower.includes('filament runout') || textLower.includes('filament sensor') || null;

  // Multi-material spools
  if (specs.multi_material_supported) {
    const spoolMatch = text.match(/(\d+)\s*(?:colors?|spools?|materials?)/i);
    if (spoolMatch) {
      const count = parseInt(spoolMatch[1]);
      if (count >= 2 && count <= 16) {
        specs.multi_material_max_spools = count;
      }
    }
  }

  // Extruder type
  if (textLower.includes('direct drive') || textLower.includes('direct-drive')) {
    specs.extruder_type = 'direct-drive';
  } else if (textLower.includes('bowden')) {
    specs.extruder_type = 'bowden';
  }

  // Extruder count
  if (textLower.includes('dual extruder') || textLower.includes('dual-extruder') || textLower.includes('idex')) {
    specs.extruder_count = 2;
  }

  // Filament diameter
  if (textLower.includes('2.85mm') || textLower.includes('2.85 mm') || textLower.includes('3mm filament')) {
    specs.filament_diameter_mm = 2.85;
  } else if (textLower.includes('1.75mm') || textLower.includes('1.75 mm')) {
    specs.filament_diameter_mm = 1.75;
  }

  return specs;
}

// ============================================================
// Quality Score — Data completeness for a printer sync item
// ============================================================

/**
 * Compute a data quality score 0-100 for a printer sync item.
 * Adapted from the filament computeQualityScore in NewFilamentsTable.
 */
export function computePrinterQualityScore(d: Record<string, any>): number {
  let score = 0;
  if (d.display_name || d.model_name) score += 10;
  if (d.model_name) score += 10;
  if (d.printer_technology) score += 5;
  if (d.build_volume_x_mm && d.build_volume_y_mm && d.build_volume_z_mm) score += 15;
  if ((d.price_usd && d.price_usd > 0) || (d.price_eur && d.price_eur > 0) ||
      (d.price_cad && d.price_cad > 0) || (d.price_gbp && d.price_gbp > 0) ||
      (d.price_aud && d.price_aud > 0)) score += 15;
  if (d.featured_image || d.image_url) score += 10;
  if (d.max_nozzle_temp_c) score += 5;
  if (d.max_print_speed_mms) score += 5;
  if (d.extruder_type) score += 5;
  if (d.has_enclosure != null) score += 5;
  if (d.has_wifi != null) score += 5;
  if (d.auto_bed_leveling != null) score += 5;
  if (d.variant_sku || d.sku) score += 5;
  return Math.min(score, 100);
}

// ============================================================
// Diff — Compare extracted printers against database
// ============================================================

export interface PrinterDiffResult {
  newPrinters: ExtractedPrinter[];
  matched: ExtractedPrinter[];
  priceChanged: Array<{
    printer: ExtractedPrinter;
    existingId: string;
    priceDiffs: Array<{ field: string; old: number | null; new: number | null }>;
  }>;
  errors: Array<{ printer: ExtractedPrinter; error: string }>;
}

/**
 * Convert a PrinterDiffResult into PrinterSyncItem[] for the UI.
 */
export function diffResultToSyncItems(
  result: PrinterDiffResult,
  jobId: string,
): PrinterSyncItem[] {
  const items: PrinterSyncItem[] = [];

  for (const p of result.newPrinters) {
    items.push(printerToSyncItem(p, jobId, 'new', true));
  }

  for (const p of result.matched) {
    items.push(printerToSyncItem(p, jobId, 'matched', false));
  }

  for (const { printer, existingId, priceDiffs } of result.priceChanged) {
    const item = printerToSyncItem(printer, jobId, 'price_changed', false);
    item.existing_printer_id = existingId;
    item.price_diff = priceDiffs as any;
    items.push(item);
  }

  for (const { printer, error } of result.errors) {
    const item = printerToSyncItem(printer, jobId, 'error', false);
    item.error_message = error;
    items.push(item);
  }

  return items;
}

function printerToSyncItem(
  p: ExtractedPrinter,
  jobId: string,
  status: string,
  isNew: boolean,
): PrinterSyncItem {
  return {
    id: `${jobId}-${p.product_handle}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    job_id: jobId,
    status,
    is_new: isNew,
    extracted_data: p as unknown as Record<string, unknown>,
    admin_override_data: null,
    display_name: p.display_name,
    model_name: p.model_name,
    printer_technology: p.printer_technology,
    image_url: p.featured_image,
    build_volume_x_mm: p.build_volume_x_mm,
    build_volume_y_mm: p.build_volume_y_mm,
    build_volume_z_mm: p.build_volume_z_mm,
    max_print_speed_mms: p.max_print_speed_mms,
    max_nozzle_temp_c: p.max_nozzle_temp_c,
    bed_max_temp_c: p.bed_max_temp_c,
    has_enclosure: p.has_enclosure,
    has_wifi: p.has_wifi,
    multi_material_supported: p.multi_material_supported,
    multi_material_max_spools: p.multi_material_max_spools,
    auto_bed_leveling: p.auto_bed_leveling,
    extruder_type: p.extruder_type,
    extruder_count: p.extruder_count,
    filament_diameter_mm: p.filament_diameter_mm,
    price_usd: p.price_usd,
    price_eur: p.price_eur,
    price_cad: p.price_cad,
    price_gbp: p.price_gbp,
    price_aud: p.price_aud,
    existing_printer_id: null,
    inserted_printer_id: null,
    price_diff: null,
    error_message: null,
    variant_sku: p.variant_sku,
    product_handle: p.product_handle,
    available_regions: p.available_regions,
    discontinued: p.discontinued ?? null,
    created_at: new Date().toISOString(),
  };
}

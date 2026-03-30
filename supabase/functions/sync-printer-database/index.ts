import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  normalizeTemp,
  normalizeSpeedToMms,
  normalizeDimensionToMm,
  normalizePrice,
  normalizeBoolean,
  sanitizeRecord,
  MATERIAL_VOCABULARY,
  normalizeMaterial,
} from '../_shared/normalization-engine.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Brand configs ─────────────────────────────────────────────────────────────

interface PrinterSpec {
  model_name: string;
  brand: string;
  display_name: string;
  official_product_url: string;
  // Scraped from page
  build_volume_x_mm?: number | null;
  build_volume_y_mm?: number | null;
  build_volume_z_mm?: number | null;
  max_nozzle_temp_c?: number | null;
  bed_max_temp_c?: number | null;
  max_print_speed_mms?: number | null;
  has_enclosure?: boolean | null;
  auto_bed_leveling?: boolean | null;
  multi_material_supported?: boolean | null;
  multi_material_max_spools?: number | null;
  filament_runout_detection?: boolean | null;
  has_wifi?: boolean | null;
  extruder_type?: string | null;
  filament_diameter_mm?: number | null;
  printer_technology?: string | null;
  official_supported_materials?: string[];
  current_price_usd_store?: number | null;
  image_url?: string | null;
  description?: string | null;
  price_tier?: string | null;
  machine_weight_kg?: number | null;
}

/** Classify price tier. */
function priceTier(usd: number | null | undefined): string {
  if (!usd) return 'mid';
  if (usd < 300)   return 'budget';
  if (usd < 800)   return 'mid';
  if (usd < 2000)  return 'premium';
  return 'prosumer';
}

/** Fetch HTML from a URL with timeout. */
async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FilaScope-bot/1.0; +https://filascope.com)' },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** Strip HTML tags to plain text. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Extract meta og:image or first large img src from HTML. */
function extractImage(html: string): string | null {
  const ogImg = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1];
  if (ogImg) return ogImg;
  const img = html.match(/<img[^>]+src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp))[^"]*"/i)?.[1];
  return img ?? null;
}

/** Extract og:description or meta description. */
function extractDescription(html: string): string | null {
  return (
    html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i)?.[1] ??
    html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i)?.[1] ??
    null
  );
}

/** Find a numeric value near a label in plain text. */
function extractNearLabel(text: string, labels: string[], unit?: string): number | null {
  for (const label of labels) {
    const re = new RegExp(
      label + '[^\\d]{0,30}([\\d,.]+)' + (unit ? `\\s*${unit}` : ''),
      'i',
    );
    const m = text.match(re);
    if (m) {
      const val = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(val)) return val;
    }
  }
  return null;
}

/** Extract build volume "XxYxZ mm" pattern. */
function extractBuildVolume(text: string): { x: number; y: number; z: number } | null {
  // "256 × 256 × 256 mm", "220x220x250mm", "350 * 350 * 400 mm"
  const m = text.match(/(\d{2,4})\s*[x×*]\s*(\d{2,4})\s*[x×*]\s*(\d{2,4})\s*mm/i);
  if (m) {
    return { x: parseInt(m[1]), y: parseInt(m[2]), z: parseInt(m[3]) };
  }
  return null;
}

/** Normalize supported materials list from a comma/slash separated string. */
function parseSupportedMaterials(text: string): string[] {
  const results = new Set<string>();
  // Common delimiters: comma, slash, semicolon, bullet
  const tokens = text.split(/[,\/;\n•·]+/).map(s => s.trim()).filter(Boolean);
  for (const token of tokens) {
    const normalized = normalizeMaterial(token);
    if (normalized) results.add(normalized);
  }
  return [...results];
}

/** Extract a price from text like "$799", "US$799", "799.00" */
function extractPrice(text: string): number | null {
  const m = text.match(/(?:US\s*)?[$€£¥]?\s*(\d{3,5}(?:\.\d{2})?)/);
  if (!m) return null;
  const val = parseFloat(m[1]);
  return isNaN(val) ? null : val;
}

// ── Per-brand scraper configs ─────────────────────────────────────────────────

interface BrandConfig {
  brand: string;
  models: Array<{ name: string; url: string; display_name?: string }>;
  defaults?: Partial<PrinterSpec>;
}

const BRAND_CONFIGS: Record<string, BrandConfig> = {
  'bambu-lab': {
    brand: 'Bambu Lab',
    models: [
      { name: 'X1 Carbon', url: 'https://bambulab.com/en-US/compare/H2D-and-X1-Carbon', display_name: 'Bambu Lab X1 Carbon' },
      { name: 'X1E',       url: 'https://bambulab.com/en-US/3d-printer/X1E',             display_name: 'Bambu Lab X1E' },
      { name: 'P1S',       url: 'https://bambulab.com/en-US/3d-printer/P1S',             display_name: 'Bambu Lab P1S' },
      { name: 'P1P',       url: 'https://bambulab.com/en-US/3d-printer/P1P',             display_name: 'Bambu Lab P1P' },
      { name: 'A1',        url: 'https://bambulab.com/en-US/3d-printer/A1',              display_name: 'Bambu Lab A1' },
      { name: 'A1 Mini',   url: 'https://bambulab.com/en-US/3d-printer/A1-mini',         display_name: 'Bambu Lab A1 Mini' },
      { name: 'H2D',       url: 'https://bambulab.com/en-US/3d-printer/H2D',             display_name: 'Bambu Lab H2D' },
    ],
    defaults: {
      filament_diameter_mm: 1.75,
      has_wifi: true,
      auto_bed_leveling: true,
      filament_runout_detection: true,
      printer_technology: 'CoreXY',
    },
  },
  'prusa': {
    brand: 'Prusa Research',
    models: [
      { name: 'MK4S',    url: 'https://www.prusa3d.com/product/original-prusa-mk4s-3d-printer-2/', display_name: 'Prusa MK4S' },
      { name: 'MK4',     url: 'https://www.prusa3d.com/product/original-prusa-mk4-3d-printer/',    display_name: 'Prusa MK4' },
      { name: 'XL',      url: 'https://www.prusa3d.com/product/original-prusa-xl-semi-assembled-3d-printer/', display_name: 'Prusa XL' },
      { name: 'MINI+',   url: 'https://www.prusa3d.com/product/original-prusa-mini-semi-assembled-3d-printer-2/', display_name: 'Prusa MINI+' },
      { name: 'Core One', url: 'https://www.prusa3d.com/product/prusa-core-one/', display_name: 'Prusa Core One' },
    ],
    defaults: {
      filament_diameter_mm: 1.75,
      has_wifi: true,
      auto_bed_leveling: true,
      printer_technology: 'FDM',
    },
  },
  'creality': {
    brand: 'Creality',
    models: [
      { name: 'K1 Max',      url: 'https://store.creality.com/products/creality-k1-max-3d-printer',      display_name: 'Creality K1 Max' },
      { name: 'K1C',         url: 'https://store.creality.com/products/creality-k1c-3d-printer',         display_name: 'Creality K1C' },
      { name: 'Ender-3 V3',  url: 'https://store.creality.com/products/ender-3-v3-3d-printer',           display_name: 'Creality Ender-3 V3' },
      { name: 'Ender-3 S1 Pro', url: 'https://store.creality.com/products/ender-3-s1-pro-fdm-3d-printer', display_name: 'Creality Ender-3 S1 Pro' },
      { name: 'CR-10 SE',    url: 'https://store.creality.com/products/cr-10-se-3d-printer',              display_name: 'Creality CR-10 SE' },
    ],
    defaults: {
      filament_diameter_mm: 1.75,
      printer_technology: 'FDM',
    },
  },
  'anycubic': {
    brand: 'Anycubic',
    models: [
      { name: 'Kobra 3 Combo', url: 'https://store.anycubic.com/products/kobra-3-combo', display_name: 'Anycubic Kobra 3 Combo' },
      { name: 'Kobra Max',     url: 'https://store.anycubic.com/products/kobra-max',     display_name: 'Anycubic Kobra Max' },
      { name: 'Kobra 2 Pro',   url: 'https://store.anycubic.com/products/kobra-2-pro-fdm-3d-printer', display_name: 'Anycubic Kobra 2 Pro' },
    ],
    defaults: {
      filament_diameter_mm: 1.75,
      printer_technology: 'FDM',
      has_wifi: true,
    },
  },
  'elegoo': {
    brand: 'Elegoo',
    models: [
      { name: 'Neptune 4 Max',  url: 'https://www.elegoo.com/products/elegoo-neptune-4-max-fdm-3d-printer', display_name: 'Elegoo Neptune 4 Max' },
      { name: 'Neptune 4 Pro',  url: 'https://www.elegoo.com/products/elegoo-neptune-4-pro-fdm-3d-printer', display_name: 'Elegoo Neptune 4 Pro' },
      { name: 'Neptune 4 Plus', url: 'https://www.elegoo.com/products/elegoo-neptune-4-plus-fdm-3d-printer', display_name: 'Elegoo Neptune 4 Plus' },
    ],
    defaults: {
      filament_diameter_mm: 1.75,
      printer_technology: 'FDM',
      auto_bed_leveling: true,
    },
  },
  'flashforge': {
    brand: 'Flashforge',
    models: [
      { name: 'Adventurer 5M Pro', url: 'https://www.flashforge.com/product-detail/flashforge-adventurer-5m-pro-3d-printer', display_name: 'Flashforge Adventurer 5M Pro' },
      { name: 'Creator 4S',        url: 'https://www.flashforge.com/product-detail/flashforge-creator-4s-3d-printer',        display_name: 'Flashforge Creator 4S' },
    ],
    defaults: {
      filament_diameter_mm: 1.75,
      printer_technology: 'FDM',
    },
  },
  'sovol': {
    brand: 'Sovol',
    models: [
      { name: 'SV08',  url: 'https://sovol3d.com/products/sovol-sv08',  display_name: 'Sovol SV08' },
      { name: 'SV07+', url: 'https://sovol3d.com/products/sovol-sv07-plus', display_name: 'Sovol SV07 Plus' },
    ],
    defaults: { filament_diameter_mm: 1.75, printer_technology: 'CoreXY' },
  },
  'kingroon': {
    brand: 'Kingroon',
    models: [
      { name: 'KP3S Pro V2', url: 'https://kingroon.com/products/kingroon-kp3s-pro-v2', display_name: 'Kingroon KP3S Pro V2' },
    ],
    defaults: { filament_diameter_mm: 1.75, printer_technology: 'FDM' },
  },
};

// ── Known specs (static fallback for pages that block scraping) ──────────────
// These are well-documented public specs — used when HTML parsing yields nothing.
const KNOWN_SPECS: Record<string, Partial<PrinterSpec>> = {
  'Bambu Lab|X1 Carbon': {
    build_volume_x_mm: 256, build_volume_y_mm: 256, build_volume_z_mm: 256,
    max_nozzle_temp_c: 300, bed_max_temp_c: 120, max_print_speed_mms: 500,
    has_enclosure: true, multi_material_supported: true, multi_material_max_spools: 4,
    extruder_type: 'Direct Drive', current_price_usd_store: 1199,
    official_supported_materials: ['PLA', 'PLA+', 'PLA-SILK', 'PETG', 'TPU', 'ABS', 'ASA', 'PA-CF', 'PLA-CF', 'PETG-CF'],
  },
  'Bambu Lab|X1E': {
    build_volume_x_mm: 256, build_volume_y_mm: 256, build_volume_z_mm: 256,
    max_nozzle_temp_c: 320, bed_max_temp_c: 120, max_print_speed_mms: 500,
    has_enclosure: true, multi_material_supported: true, multi_material_max_spools: 4,
    extruder_type: 'Direct Drive', current_price_usd_store: 1899,
    official_supported_materials: ['PLA', 'PETG', 'TPU', 'ABS', 'ASA', 'PA-CF', 'PLA-CF', 'PEEK', 'PC'],
  },
  'Bambu Lab|P1S': {
    build_volume_x_mm: 256, build_volume_y_mm: 256, build_volume_z_mm: 256,
    max_nozzle_temp_c: 300, bed_max_temp_c: 120, max_print_speed_mms: 500,
    has_enclosure: true, multi_material_supported: true, multi_material_max_spools: 4,
    extruder_type: 'Direct Drive', current_price_usd_store: 699,
    official_supported_materials: ['PLA', 'PLA+', 'PLA-SILK', 'PETG', 'TPU', 'ABS', 'ASA', 'PA-CF', 'PLA-CF'],
  },
  'Bambu Lab|P1P': {
    build_volume_x_mm: 256, build_volume_y_mm: 256, build_volume_z_mm: 256,
    max_nozzle_temp_c: 300, bed_max_temp_c: 120, max_print_speed_mms: 500,
    has_enclosure: false, multi_material_supported: true, multi_material_max_spools: 4,
    extruder_type: 'Direct Drive', current_price_usd_store: 599,
    official_supported_materials: ['PLA', 'PLA+', 'PETG', 'TPU', 'ABS', 'ASA'],
  },
  'Bambu Lab|A1': {
    build_volume_x_mm: 256, build_volume_y_mm: 256, build_volume_z_mm: 256,
    max_nozzle_temp_c: 300, bed_max_temp_c: 100, max_print_speed_mms: 500,
    has_enclosure: false, multi_material_supported: true, multi_material_max_spools: 4,
    extruder_type: 'Direct Drive', current_price_usd_store: 399,
    official_supported_materials: ['PLA', 'PLA+', 'PLA-SILK', 'PETG', 'TPU'],
  },
  'Bambu Lab|A1 Mini': {
    build_volume_x_mm: 180, build_volume_y_mm: 180, build_volume_z_mm: 180,
    max_nozzle_temp_c: 300, bed_max_temp_c: 100, max_print_speed_mms: 500,
    has_enclosure: false, multi_material_supported: true, multi_material_max_spools: 4,
    extruder_type: 'Direct Drive', current_price_usd_store: 299,
    official_supported_materials: ['PLA', 'PLA+', 'PLA-SILK', 'PETG', 'TPU'],
  },
  'Bambu Lab|H2D': {
    build_volume_x_mm: 350, build_volume_y_mm: 320, build_volume_z_mm: 325,
    max_nozzle_temp_c: 320, bed_max_temp_c: 120, max_print_speed_mms: 600,
    has_enclosure: true, multi_material_supported: true, multi_material_max_spools: 12,
    extruder_type: 'Direct Drive', current_price_usd_store: 2999,
    official_supported_materials: ['PLA', 'PETG', 'TPU', 'ABS', 'ASA', 'PA-CF', 'PLA-CF', 'PC', 'PEEK'],
  },
  'Prusa|MK4S': {
    build_volume_x_mm: 250, build_volume_y_mm: 210, build_volume_z_mm: 220,
    max_nozzle_temp_c: 290, bed_max_temp_c: 120, max_print_speed_mms: 500,
    has_enclosure: false, extruder_type: 'Direct Drive', current_price_usd_store: 799,
    official_supported_materials: ['PLA', 'PLA+', 'PETG', 'ABS', 'ASA', 'PC', 'NYLON', 'TPU'],
  },
  'Prusa|MK4': {
    build_volume_x_mm: 250, build_volume_y_mm: 210, build_volume_z_mm: 220,
    max_nozzle_temp_c: 290, bed_max_temp_c: 120, max_print_speed_mms: 500,
    has_enclosure: false, extruder_type: 'Direct Drive', current_price_usd_store: 799,
    official_supported_materials: ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'NYLON', 'PC'],
  },
  'Prusa|XL': {
    build_volume_x_mm: 360, build_volume_y_mm: 360, build_volume_z_mm: 360,
    max_nozzle_temp_c: 290, bed_max_temp_c: 120, max_print_speed_mms: 500,
    has_enclosure: false, extruder_type: 'Direct Drive', current_price_usd_store: 1999,
    multi_material_supported: true, multi_material_max_spools: 5,
    official_supported_materials: ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'NYLON', 'PC', 'PLA-CF'],
  },
  'Prusa|MINI+': {
    build_volume_x_mm: 180, build_volume_y_mm: 180, build_volume_z_mm: 180,
    max_nozzle_temp_c: 280, bed_max_temp_c: 100, max_print_speed_mms: 200,
    has_enclosure: false, extruder_type: 'Bowden', current_price_usd_store: 459,
    official_supported_materials: ['PLA', 'PETG', 'ASA', 'ABS', 'TPU'],
  },
  'Creality|K1 Max': {
    build_volume_x_mm: 300, build_volume_y_mm: 300, build_volume_z_mm: 300,
    max_nozzle_temp_c: 300, bed_max_temp_c: 100, max_print_speed_mms: 600,
    has_enclosure: true, auto_bed_leveling: true, has_wifi: true,
    extruder_type: 'Direct Drive', current_price_usd_store: 599,
    official_supported_materials: ['PLA', 'PLA+', 'PETG', 'ABS', 'ASA', 'TPU', 'PLA-CF', 'PETG-CF'],
  },
  'Creality|K1C': {
    build_volume_x_mm: 220, build_volume_y_mm: 220, build_volume_z_mm: 250,
    max_nozzle_temp_c: 300, bed_max_temp_c: 100, max_print_speed_mms: 600,
    has_enclosure: true, auto_bed_leveling: true, has_wifi: true,
    extruder_type: 'Direct Drive', current_price_usd_store: 399,
    official_supported_materials: ['PLA', 'PLA+', 'PETG', 'ABS', 'ASA', 'TPU', 'PLA-CF', 'PETG-CF'],
  },
  'Creality|Ender-3 V3': {
    build_volume_x_mm: 220, build_volume_y_mm: 220, build_volume_z_mm: 250,
    max_nozzle_temp_c: 300, bed_max_temp_c: 100, max_print_speed_mms: 600,
    has_enclosure: false, auto_bed_leveling: true, has_wifi: true,
    extruder_type: 'Direct Drive', current_price_usd_store: 299,
    official_supported_materials: ['PLA', 'PLA+', 'PETG', 'ABS', 'ASA', 'TPU'],
  },
  'Anycubic|Kobra 3 Combo': {
    build_volume_x_mm: 250, build_volume_y_mm: 250, build_volume_z_mm: 260,
    max_nozzle_temp_c: 260, bed_max_temp_c: 100, max_print_speed_mms: 500,
    has_enclosure: false, auto_bed_leveling: true, has_wifi: true,
    multi_material_supported: true, multi_material_max_spools: 4,
    extruder_type: 'Direct Drive', current_price_usd_store: 599,
    official_supported_materials: ['PLA', 'PLA+', 'PETG', 'TPU'],
  },
  'Elegoo|Neptune 4 Max': {
    build_volume_x_mm: 420, build_volume_y_mm: 420, build_volume_z_mm: 480,
    max_nozzle_temp_c: 300, bed_max_temp_c: 110, max_print_speed_mms: 500,
    has_enclosure: false, auto_bed_leveling: true, has_wifi: true,
    extruder_type: 'Direct Drive', current_price_usd_store: 399,
    official_supported_materials: ['PLA', 'PLA+', 'PETG', 'ABS', 'ASA', 'TPU'],
  },
  'Elegoo|Neptune 4 Pro': {
    build_volume_x_mm: 225, build_volume_y_mm: 225, build_volume_z_mm: 265,
    max_nozzle_temp_c: 300, bed_max_temp_c: 110, max_print_speed_mms: 500,
    has_enclosure: false, auto_bed_leveling: true, has_wifi: true,
    extruder_type: 'Direct Drive', current_price_usd_store: 249,
    official_supported_materials: ['PLA', 'PLA+', 'PETG', 'ABS', 'ASA', 'TPU'],
  },
};

// ── Spec scraper ─────────────────────────────────────────────────────────────

async function scrapeSpec(
  model: { name: string; url: string; display_name?: string },
  brand: string,
  defaults: Partial<PrinterSpec>,
): Promise<PrinterSpec> {
  const knownKey = `${brand}|${model.name}`;
  const known = KNOWN_SPECS[knownKey] ?? {};

  // Start with defaults + known specs
  const spec: PrinterSpec = {
    model_name: model.name,
    brand,
    display_name: model.display_name ?? `${brand} ${model.name}`,
    official_product_url: model.url,
    ...defaults,
    ...known,
  };

  // Try to fill any missing fields from live page
  const html = await fetchHtml(model.url);
  if (html) {
    const text = stripHtml(html);

    // Image
    if (!spec.image_url) spec.image_url = extractImage(html);

    // Description
    if (!spec.description) spec.description = extractDescription(html)?.slice(0, 500) ?? null;

    // Build volume (if not in known specs)
    if (!spec.build_volume_x_mm) {
      const vol = extractBuildVolume(text);
      if (vol) {
        spec.build_volume_x_mm = vol.x;
        spec.build_volume_y_mm = vol.y;
        spec.build_volume_z_mm = vol.z;
      }
    }

    // Nozzle temp
    if (!spec.max_nozzle_temp_c) {
      const raw = extractNearLabel(text, ['max.*nozzle', 'nozzle.*temp', 'hotend.*temp', 'printing.*temp']);
      if (raw) spec.max_nozzle_temp_c = normalizeTemp(String(raw));
    }

    // Bed temp
    if (!spec.bed_max_temp_c) {
      const raw = extractNearLabel(text, ['max.*bed', 'bed.*temp', 'platform.*temp', 'heated.*bed']);
      if (raw) spec.bed_max_temp_c = normalizeTemp(String(raw));
    }

    // Speed
    if (!spec.max_print_speed_mms) {
      const raw = extractNearLabel(text, ['max.*speed', 'print.*speed', 'speed.*max']);
      if (raw) spec.max_print_speed_mms = normalizeSpeedToMms(String(raw) + 'mm/s');
    }

    // Price
    if (!spec.current_price_usd_store) {
      const priceMatch = text.match(/\$\s*(\d{3,5}(?:\.\d{2})?)/);
      if (priceMatch) spec.current_price_usd_store = parseFloat(priceMatch[1]);
    }

    // Materials
    if (!spec.official_supported_materials?.length) {
      const matMatch = text.match(/(?:compatible|supported|works with)\s*(?:materials?|filaments?)[:\s]+([^\n.]+)/i);
      if (matMatch) spec.official_supported_materials = parseSupportedMaterials(matMatch[1]);
    }
  }

  // Derived fields
  spec.price_tier = priceTier(spec.current_price_usd_store);

  // Sanity check numeric fields
  sanitizeRecord(spec as unknown as Record<string, unknown>, `${brand} ${model.name}`);

  return spec;
}

/** Generate a URL-safe slug from a string. */
function toSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    let body: { brands?: string[] } = {};
    try { body = await req.json(); } catch { /* no body */ }

    const targetBrandSlugs = body.brands ?? Object.keys(BRAND_CONFIGS);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Pre-load brand_id map from printer_brands table
    const { data: brandRows } = await supabase
      .from('printer_brands')
      .select('id, brand');
    const brandIdMap: Record<string, string> = {};
    for (const row of brandRows ?? []) {
      brandIdMap[row.brand.toLowerCase()] = row.id;
    }

    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    const report: Record<string, { inserted: number; updated: number; errors: number }> = {};

    for (const slug of targetBrandSlugs) {
      const config = BRAND_CONFIGS[slug];
      if (!config) {
        console.log(`[sync-printer-database] unknown brand slug: ${slug}`);
        continue;
      }

      // Resolve brand_id
      const brandId = brandIdMap[config.brand.toLowerCase()];
      if (!brandId) {
        console.warn(`[sync-printer-database] brand_id not found for: ${config.brand} — skipping`);
        continue;
      }

      report[slug] = { inserted: 0, updated: 0, errors: 0 };

      for (const model of config.models) {
        try {
          // Rate limit between scrapes
          await new Promise(r => setTimeout(r, 800));

          const spec = await scrapeSpec(model, config.brand, config.defaults ?? {});

          const modelSlug = toSlug(`${config.brand}-${spec.model_name}`);
          const printerId = modelSlug;

          // Check for existing record by printer_id
          const { data: existing } = await supabase
            .from('printers')
            .select('id')
            .eq('printer_id', printerId)
            .maybeSingle();

          const now = new Date().toISOString();

          // Build record using actual table column names
          const record: Record<string, unknown> = {
            brand_id: brandId,
            printer_id: printerId,
            slug: modelSlug,
            model_name: spec.model_name,
            display_name: spec.display_name,
            printer_technology: spec.printer_technology ?? 'FDM',
            official_product_url: spec.official_product_url,
            product_url: spec.official_product_url,
            image_url: spec.image_url ?? null,
            description: spec.description ?? null,
            build_volume_x_mm: spec.build_volume_x_mm ?? null,
            build_volume_y_mm: spec.build_volume_y_mm ?? null,
            build_volume_z_mm: spec.build_volume_z_mm ?? null,
            max_nozzle_temp_c: spec.max_nozzle_temp_c ?? null,
            bed_max_temp_c: spec.bed_max_temp_c ?? null,
            max_print_speed_mms: spec.max_print_speed_mms ?? null,
            has_enclosure: spec.has_enclosure ?? null,
            auto_bed_leveling: spec.auto_bed_leveling ?? null,
            multi_material_supported: spec.multi_material_supported ?? null,
            multi_material_max_spools: spec.multi_material_max_spools ?? null,
            filament_runout_detection: spec.filament_runout_detection ?? null,
            has_wifi: spec.has_wifi ?? null,
            extruder_type: spec.extruder_type ?? null,
            filament_diameter_mm: spec.filament_diameter_mm ?? 1.75,
            official_supported_materials: spec.official_supported_materials ?? null,
            current_price_usd_store: spec.current_price_usd_store ?? null,
            price_tier: spec.price_tier ?? null,
            machine_weight_kg: spec.machine_weight_kg ?? null,
            last_synced_at: now,
            status: 'active',
          };

          if (existing) {
            const { error } = await supabase
              .from('printers')
              .update(record)
              .eq('id', existing.id);
            if (error) throw error;
            report[slug].updated++;
            totalUpdated++;
            console.log(`[sync-printer-database] updated: ${spec.brand} ${spec.model_name}`);
          } else {
            const { error } = await supabase
              .from('printers')
              .insert(record);
            if (error) throw error;
            report[slug].inserted++;
            totalInserted++;
            console.log(`[sync-printer-database] inserted: ${spec.brand} ${spec.model_name}`);
          }
        } catch (e) {
          console.error(`[sync-printer-database] error for ${config.brand} ${model.name}:`, e);
          report[slug].errors++;
          totalErrors++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        inserted: totalInserted,
        updated: totalUpdated,
        errors: totalErrors,
        by_brand: report,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[sync-printer-database] error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

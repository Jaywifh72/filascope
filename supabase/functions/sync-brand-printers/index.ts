/**
 * sync-brand-printers
 *
 * Discovers and syncs 3D printers from brand Shopify stores.
 * Mirrors sync-brand-products but targets the `printers` table.
 *
 * Supported brands (Shopify /products.json):
 *   creality, anycubic, elegoo, kingroon, sovol, bambu-lab,
 *   qidi, flsun, artillery, raise3d, voxelab, two-trees, ratrig, flashforge
 *
 * Non-Shopify brands handled separately:
 *   prusa (WooCommerce) — uses direct product page HTML
 *
 * POST body: { brand_slug: string, dry_run?: boolean }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { vetPrinterProduct } from '../_shared/printer-product-vetter.ts';
import {
  normalizeTemp,
  normalizeSpeedToMms,
  normalizeDimensionToMm,
} from '../_shared/normalization-engine.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Brand configuration ──────────────────────────────────────────────────────

interface RegionalDomains {
  US?: string;
  CA?: string;
  UK?: string;
  EU?: string;
  AU?: string;
  JP?: string;
}

interface PrinterBrandConfig {
  brand_name: string;
  /** Shopify store domains per region */
  domains: RegionalDomains;
  /** URL path prefix per region (for path-based routing like Creality) */
  path_prefix?: Partial<Record<keyof RegionalDomains, string>>;
  /** ms delay between region requests */
  rate_limit_ms?: number;
  /** Filter products.json by these collection handles before vetting */
  printer_collection?: string;
  /** Minimum price (USD) to accept as a printer — filters out accessories */
  min_price_usd?: number;
  /** Maximum price (USD) for consumer printers */
  max_price_usd?: number;
  /** Platform: 'shopify' | 'woocommerce' | 'custom' */
  platform?: string;
  /** For WooCommerce/custom: list of known product page URLs */
  known_urls?: string[];
}

const PRINTER_BRAND_CONFIGS: Record<string, PrinterBrandConfig> = {
  // ── Shopify brands (auto-discovery via /products.json) ────────────────────
  'creality': {
    brand_name: 'Creality',
    domains: { US: 'store.creality.com', CA: 'store.creality.com', UK: 'store.creality.com', EU: 'store.creality.com', AU: 'store.creality.com' },
    path_prefix: { CA: '/ca', UK: '/uk', EU: '/eu', AU: '/au', JP: '/jp' },
    rate_limit_ms: 1500,
    min_price_usd: 100,
    max_price_usd: 5000,
  },
  'anycubic': {
    brand_name: 'Anycubic',
    domains: { US: 'store.anycubic.com', CA: 'ca.anycubic.com', UK: 'uk.anycubic.com', EU: 'eu.anycubic.com' },
    rate_limit_ms: 1500,
    min_price_usd: 100,
    max_price_usd: 5000,
  },
  'elegoo': {
    brand_name: 'Elegoo',
    domains: { US: 'us.elegoo.com', CA: 'ca.elegoo.com', UK: 'uk.elegoo.com', EU: 'eu.elegoo.com', AU: 'au.elegoo.com' },
    rate_limit_ms: 1000,
    min_price_usd: 100,
    max_price_usd: 5000,
  },
  'kingroon': {
    brand_name: 'Kingroon',
    domains: { US: 'kingroon.com', CA: 'ca.kingroon.com', UK: 'uk.kingroon.com', EU: 'eu.kingroon.com', AU: 'au.kingroon.com' },
    rate_limit_ms: 1000,
    min_price_usd: 80,
    max_price_usd: 3000,
  },
  'sovol': {
    brand_name: 'Sovol',
    domains: { US: 'www.sovol3d.com', EU: 'sovol.eu' },
    rate_limit_ms: 1500,
    min_price_usd: 150,
    max_price_usd: 3000,
  },
  'bambu-lab': {
    brand_name: 'Bambu Lab',
    domains: { US: 'us.store.bambulab.com', CA: 'ca.store.bambulab.com', UK: 'uk.store.bambulab.com', EU: 'eu.store.bambulab.com', AU: 'au.store.bambulab.com', JP: 'jp.store.bambulab.com' },
    rate_limit_ms: 2000,
    min_price_usd: 200,
    max_price_usd: 8000,
  },
  'qidi': {
    brand_name: 'QIDI Tech',
    domains: { US: 'us.qidi3d.com', CA: 'ca.qidi3d.com', UK: 'uk.qidi3d.com', EU: 'eu.qidi3d.com', AU: 'au.qidi3d.com' },
    rate_limit_ms: 1000,
    min_price_usd: 150,
    max_price_usd: 5000,
  },
  'flsun': {
    brand_name: 'FLSUN',
    domains: { US: 'us.store.flsun3d.com', CA: 'ca.store.flsun3d.com', UK: 'uk.store.flsun3d.com', EU: 'eu.store.flsun3d.com', AU: 'au.store.flsun3d.com' },
    rate_limit_ms: 1000,
    min_price_usd: 200,
    max_price_usd: 2000,
  },
  'artillery': {
    brand_name: 'Artillery',
    domains: { US: 'artillery3d.com', EU: 'eu.artillery3d.com' },
    rate_limit_ms: 1000,
    min_price_usd: 150,
    max_price_usd: 3000,
  },
  'raise3d': {
    brand_name: 'Raise3D',
    domains: { US: 'shop.raise3d.com', EU: 'eu.raise3d.com' },
    rate_limit_ms: 1500,
    min_price_usd: 500,
    max_price_usd: 15000,
  },
  'voxelab': {
    brand_name: 'Voxelab',
    domains: { US: 'www.voxelab3dp.com', EU: 'eu.voxelab3dp.com' },
    rate_limit_ms: 1000,
    min_price_usd: 100,
    max_price_usd: 2000,
  },
  'two-trees': {
    brand_name: 'Two Trees',
    domains: { US: 'www.twotrees3d.com', EU: 'eu.twotrees3d.com' },
    rate_limit_ms: 1000,
    min_price_usd: 100,
    max_price_usd: 2000,
  },
  'ratrig': {
    brand_name: 'RatRig',
    domains: { US: 'www.ratrig.com' },
    rate_limit_ms: 1500,
    min_price_usd: 300,
    max_price_usd: 5000,
  },
  'flashforge': {
    brand_name: 'FlashForge',
    domains: { US: 'www.flashforge.com' },
    rate_limit_ms: 2000,
    min_price_usd: 150,
    max_price_usd: 8000,
    platform: 'custom',
    // FlashForge doesn't use standard Shopify /products.json, fall back to known models
    known_urls: [
      'https://www.flashforge.com/product-detail/flashforge-adventurer-5m-3d-printer',
      'https://www.flashforge.com/product-detail/flashforge-adventurer-5m-pro-3d-printer',
      'https://www.flashforge.com/product-detail/flashforge-adventurer-7-3d-printer',
      'https://www.flashforge.com/product-detail/flashforge-creator-4s-3d-printer',
      'https://www.flashforge.com/product-detail/flashforge-creator-3-pro-3d-printer',
      'https://www.flashforge.com/product-detail/flashforge-guider-3-plus-3d-printer',
      'https://www.flashforge.com/product-detail/flashforge-guider-3-ultra-3d-printer',
      'https://www.flashforge.com/product-detail/flashforge-dreamer-3d-printer',
    ],
  },
  'prusa': {
    brand_name: 'Prusa Research',
    domains: { US: 'www.prusa3d.com' },
    rate_limit_ms: 2000,
    min_price_usd: 200,
    max_price_usd: 10000,
    platform: 'woocommerce',
    known_urls: [
      'https://www.prusa3d.com/product/original-prusa-mk4s-3d-printer-2/',
      'https://www.prusa3d.com/product/original-prusa-mk4-3d-printer/',
      'https://www.prusa3d.com/product/prusa-core-one/',
      'https://www.prusa3d.com/product/original-prusa-xl-semi-assembled-3d-printer/',
      'https://www.prusa3d.com/product/original-prusa-mini-semi-assembled-3d-printer-2/',
      'https://www.prusa3d.com/product/original-prusa-sl1s-speed-3d-printer/',
    ],
  },
};

// ─── Regional field mapping (matches sync-printer-prices column names) ────────

const REGION_FIELD_MAP = {
  US: { priceCol: 'current_price_usd_store', urlCol: 'product_url',    currency: 'USD' },
  CA: { priceCol: 'current_price_cad_store', urlCol: 'product_url_ca', currency: 'CAD' },
  UK: { priceCol: 'current_price_gbp_store', urlCol: 'product_url_uk', currency: 'GBP' },
  EU: { priceCol: 'current_price_eur_store', urlCol: 'product_url_eu', currency: 'EUR' },
  AU: { priceCol: 'current_price_aud_store', urlCol: 'product_url_au', currency: 'AUD' },
  JP: { priceCol: 'current_price_jpy_store', urlCol: 'product_url_jp', currency: 'JPY' },
} as const;
type RegionCode = keyof typeof REGION_FIELD_MAP;

// ─── Shopify product shape ────────────────────────────────────────────────────

interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  available: boolean;
  sku: string;
}

interface ShopifyImage {
  src: string;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  product_type: string;
  tags: string;
  body_html: string;
  images: ShopifyImage[];
  variants: ShopifyVariant[];
  published_at: string | null;
  status: string;
}

// ─── Spec extraction from product HTML / tags ─────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function findNearLabel(text: string, labels: string[], unitPattern?: string): number | null {
  for (const label of labels) {
    const re = new RegExp(
      label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      '[^\\d\\n]{0,40}([\\d,. ]+)' +
      (unitPattern ? `\\s*${unitPattern}` : ''),
      'i',
    );
    const m = text.match(re);
    if (m) {
      const val = parseFloat(m[1].replace(/[,\s]/g, ''));
      if (!isNaN(val) && val > 0) return val;
    }
  }
  return null;
}

function findBoolean(text: string, labels: string[]): boolean | null {
  for (const label of labels) {
    const re = new RegExp(label + '[^\\n]{0,60}', 'i');
    const m = text.match(re);
    if (m) {
      const frag = m[0].toLowerCase();
      if (/\byes\b|\btrue\b|\bsupported\b|\bincluded\b|\bautomatic\b|\bauto\b/.test(frag)) return true;
      if (/\bno\b|\bnone\b|\bnot\s+supported\b|\bmanual\b/.test(frag)) return false;
    }
  }
  return null;
}

interface ExtractedSpecs {
  build_volume_x_mm?: number | null;
  build_volume_y_mm?: number | null;
  build_volume_z_mm?: number | null;
  max_nozzle_temp_c?: number | null;
  bed_max_temp_c?: number | null;
  max_print_speed_mms?: number | null;
  max_travel_speed_xy_mms?: number | null;
  filament_diameter_mm?: number | null;
  stock_nozzle_diameter_mm?: number | null;
  has_enclosure?: boolean | null;
  auto_bed_leveling?: boolean | null;
  has_wifi?: boolean | null;
  has_ethernet?: boolean | null;
  multi_material_supported?: boolean | null;
  multi_material_max_spools?: number | null;
  extruder_type?: string | null;
  extruder_count?: number | null;
  machine_weight_kg?: number | null;
  rated_power_w?: number | null;
  bed_heated?: boolean | null;
  assembly_required?: boolean | null;
  printer_technology?: string | null;
  official_supported_materials?: string[];
  max_layer_height_mm?: number | null;
  min_layer_height_mm?: number | null;
  input_shaping_supported?: boolean | null;
  thermal_runaway_protection?: boolean | null;
  power_loss_recovery?: boolean | null;
  screen_type?: string | null;
  screen_size_inch?: number | null;
  noise_level_printing_db?: number | null;
  bed_heater_power_w?: number | null;
}

function extractSpecs(bodyHtml: string, title: string, tags: string, productType: string): ExtractedSpecs {
  const plain = stripHtml(bodyHtml);
  const combined = `${plain} ${title} ${tags} ${productType}`;
  const specs: ExtractedSpecs = {};

  // Build volume — "256 × 256 × 256 mm", "220x220x250mm", "350 * 350 * 400mm"
  const bvMatch = plain.match(/(\d{2,4})\s*[x×*]\s*(\d{2,4})\s*[x×*]\s*(\d{2,4})\s*(?:mm|millim)/i);
  if (bvMatch) {
    specs.build_volume_x_mm = parseInt(bvMatch[1]);
    specs.build_volume_y_mm = parseInt(bvMatch[2]);
    specs.build_volume_z_mm = parseInt(bvMatch[3]);
  }

  // Labeled build volume
  if (!specs.build_volume_x_mm) {
    const bvLabeled = plain.match(/(?:build\s*(?:volume|size)|print\s*(?:volume|size|area))[^:]*:\s*(\d{2,4})\s*[x×*]\s*(\d{2,4})\s*[x×*]\s*(\d{2,4})/i);
    if (bvLabeled) {
      specs.build_volume_x_mm = parseInt(bvLabeled[1]);
      specs.build_volume_y_mm = parseInt(bvLabeled[2]);
      specs.build_volume_z_mm = parseInt(bvLabeled[3]);
    }
  }

  // Max nozzle temperature
  const nozzleTempRaw = findNearLabel(plain, [
    'max(?:imum)?\\s+nozzle\\s+temp',
    'nozzle\\s+temp(?:erature)?',
    'hotend\\s+temp(?:erature)?',
    'extruder\\s+temp(?:erature)?',
  ], '°?[Cc]');
  if (nozzleTempRaw) specs.max_nozzle_temp_c = Math.round(nozzleTempRaw);

  // Bed max temperature
  const bedTempRaw = findNearLabel(plain, [
    'max(?:imum)?\\s+bed\\s+temp',
    'bed\\s+temp(?:erature)?',
    'heated\\s+bed',
    'build\\s+plate\\s+temp',
  ], '°?[Cc]');
  if (bedTempRaw) {
    specs.bed_max_temp_c = Math.round(bedTempRaw);
    specs.bed_heated = true;
  }

  // Max print speed
  const speedRaw = findNearLabel(plain, [
    'max(?:imum)?\\s+print(?:ing)?\\s+speed',
    'print\\s+speed',
    'max\\s+speed',
  ], 'mm\\/s');
  if (speedRaw) specs.max_print_speed_mms = speedRaw;

  // Max travel speed
  const travelRaw = findNearLabel(plain, [
    'travel\\s+speed',
    'max(?:imum)?\\s+travel',
    'motion\\s+speed',
  ], 'mm\\/s');
  if (travelRaw) specs.max_travel_speed_xy_mms = travelRaw;

  // Filament diameter
  if (/\b1\.75\s*mm\b/.test(combined)) specs.filament_diameter_mm = 1.75;
  else if (/\b2\.85\s*mm\b|\b3\.0\s*mm\b/.test(combined)) specs.filament_diameter_mm = 2.85;

  // Nozzle diameter
  const nozzleDiamMatch = combined.match(/(?:nozzle|stock\s+nozzle)\s*(?:diameter)?[:\s]+0\.([24])\s*mm/i);
  if (nozzleDiamMatch) specs.stock_nozzle_diameter_mm = parseFloat(`0.${nozzleDiamMatch[1]}`);

  // Enclosure
  if (/\bfully?\s*enclosed?\b|\bbuilt[-\s]+in\s+enclosure\b|\benclosed?\s+(?:design|chamber|body)\b/i.test(combined)) {
    specs.has_enclosure = true;
  } else if (/\bopen[\s-]frame\b|\bopen[\s-]body\b|\bno\s+enclosure\b/i.test(combined)) {
    specs.has_enclosure = false;
  }

  // Auto bed leveling
  specs.auto_bed_leveling = findBoolean(combined, [
    'auto(?:matic)?\\s+(?:bed\\s+level|leveling|levelling)',
    'auto\\s+level',
    'ABL',
    'CR\\s*Touch',
    'BL\\s*Touch',
  ]);
  if (/\b(?:cr[\s-]?touch|bl[\s-]?touch|abb|lidar|eddy|csf|klack|tap|palpeur)\b/i.test(combined)) {
    specs.auto_bed_leveling = true;
  }

  // WiFi
  if (/\bwi[-\s]?fi\b|\bwireless\b|\bwlan\b/i.test(combined)) specs.has_wifi = true;
  else if (/\bno\s+wifi\b|\bno\s+wireless\b/i.test(combined)) specs.has_wifi = false;

  // Ethernet
  if (/\bethernet\b|\blan\s+port\b|\brj[-\s]?45\b/i.test(combined)) specs.has_ethernet = true;

  // Multi-material
  if (/\b(?:multi[-\s]?color|multi[-\s]?material|ams|mmu|toolchanger|dual\s+nozzle|idex|multi[-\s]?extrusion)\b/i.test(combined)) {
    specs.multi_material_supported = true;
    const spoolMatch = combined.match(/(\d+)[\s-]*(?:color|colour|spool|filament|material)[s]?\s*(?:supported|capable|capacity)/i)
      || combined.match(/support[s]?\s*(?:up\s+to\s+)?(\d+)\s*(?:color|colour|material)/i);
    if (spoolMatch) specs.multi_material_max_spools = parseInt(spoolMatch[1]);
    // AMS: 4 spools typically
    if (/\bams\b/i.test(combined) && !specs.multi_material_max_spools) specs.multi_material_max_spools = 4;
  }

  // Extruder type
  if (/\bdirect[\s-]drive\b/i.test(combined)) specs.extruder_type = 'direct-drive';
  else if (/\bbowden\b/i.test(combined)) specs.extruder_type = 'bowden';

  // Dual / IDEX extruder
  const extruderCountMatch = combined.match(/(\d+)[\s-]*(?:extruder|hotend|nozzle)s?\b/i);
  if (extruderCountMatch) {
    const n = parseInt(extruderCountMatch[1]);
    if (n >= 1 && n <= 5) specs.extruder_count = n;
  }
  if (/\bidex\b|\bdual\s+(?:extruder|nozzle|hotend)\b/i.test(combined)) specs.extruder_count = 2;

  // Machine weight
  const weightRaw = findNearLabel(plain, ['machine\\s+weight', 'net\\s+weight', 'product\\s+weight', 'printer\\s+weight'], 'kg');
  if (weightRaw && weightRaw < 100) specs.machine_weight_kg = weightRaw;

  // Rated power
  const powerRaw = findNearLabel(plain, ['rated\\s+power', 'power\\s+consumption', 'power\\s+input', 'input\\s+power'], '[Ww]');
  if (powerRaw && powerRaw < 2000) specs.rated_power_w = Math.round(powerRaw);

  // Bed heated (independent of temp extraction)
  if (!specs.bed_heated) {
    if (/\bheated\s+(?:bed|build\s+plate)\b/i.test(combined)) specs.bed_heated = true;
    else if (/\bnon?[-\s]heated\b/i.test(combined)) specs.bed_heated = false;
  }

  // Assembly
  if (/\b(?:fully?\s+assembled|pre[-\s]assembled|ready[-\s]to[-\s]print|plug\s+and\s+play)\b/i.test(combined)) {
    specs.assembly_required = false;
  } else if (/\b(?:kit\b|diy\b|requires\s+assembly|self[-\s]assembly)\b/i.test(combined)) {
    specs.assembly_required = true;
  }

  // Layer height
  const minLayerMatch = plain.match(/(?:min(?:imum)?\s+layer\s+(?:height|resolution)|layer\s+height\s*:?\s*0\.)([\d.]+)\s*mm/i);
  if (minLayerMatch) specs.min_layer_height_mm = parseFloat(minLayerMatch[1].includes('.') ? minLayerMatch[1] : `0.${minLayerMatch[1]}`);
  const maxLayerMatch = plain.match(/max(?:imum)?\s+layer\s+(?:height|resolution)[^:]*:?\s*([\d.]+)\s*mm/i);
  if (maxLayerMatch) specs.max_layer_height_mm = parseFloat(maxLayerMatch[1]);

  // Input shaping
  if (/\binput[\s-]shaping\b|\bvibration\s+compensation\b|\bresonance\s+compensation\b|\bklipper\b/i.test(combined)) {
    specs.input_shaping_supported = true;
  }

  // Thermal runaway protection
  if (/\bthermal\s+runaway\b/i.test(combined)) specs.thermal_runaway_protection = true;

  // Power loss recovery
  if (/\bpower[\s-](?:loss|outage|failure)\s+(?:recovery|resume)\b/i.test(combined)) {
    specs.power_loss_recovery = true;
  }

  // Screen type and size
  if (/\btouch\s*screen\b|\btouchscreen\b/i.test(combined)) specs.screen_type = 'touchscreen';
  else if (/\bcolor\s*screen\b|\bcolour\s*screen\b/i.test(combined)) specs.screen_type = 'color';
  else if (/\blcd\s*screen\b/i.test(combined)) specs.screen_type = 'lcd';
  const screenSizeMatch = combined.match(/(\d+(?:\.\d+)?)['""]?\s*inch|(\d+(?:\.\d+)?)\s*inch\s*(?:touch|lcd|screen|display)/i);
  if (screenSizeMatch) specs.screen_size_inch = parseFloat(screenSizeMatch[1] || screenSizeMatch[2]);

  // Noise level
  const noiseMatch = plain.match(/noise[^:]*:?\s*(?:≤|<=|<|about|approx\.?)?\s*(\d+(?:\.\d+)?)\s*d[Bb]/i);
  if (noiseMatch) specs.noise_level_printing_db = parseFloat(noiseMatch[1]);

  // Supported materials
  const materialPatterns = ['pla', 'pla+', 'petg', 'abs', 'asa', 'tpu', 'nylon', 'pa', 'pc', 'hips', 'pva', 'peek', 'pei', 'wood', 'carbon fiber', 'cf'];
  const foundMaterials: string[] = [];
  for (const mat of materialPatterns) {
    if (new RegExp(`\\b${mat.replace('+', '\\+')}\\b`, 'i').test(combined)) {
      foundMaterials.push(mat.toUpperCase());
    }
  }
  if (foundMaterials.length > 0) specs.official_supported_materials = foundMaterials;

  // Printer technology (fallback from vetter)
  if (/\bcorexy\b/i.test(combined)) specs.printer_technology = 'CoreXY';
  else if (/\bbed[\s-]slinger\b|\bcartesian\b/i.test(combined)) specs.printer_technology = 'FDM';
  else if (/\bsla\b/i.test(combined)) specs.printer_technology = 'SLA';
  else if (/\bdlp\b/i.test(combined)) specs.printer_technology = 'DLP';
  else if (/\bmsla\b|\bmono[\s-]?lcd\b/i.test(combined)) specs.printer_technology = 'MSLA';

  // Bed heater power
  const bedPowerMatch = plain.match(/(?:bed|heated\s+bed|build\s+plate)\s+(?:heater\s+)?power[^:]*:?\s*(\d+)\s*[Ww]/i);
  if (bedPowerMatch) specs.bed_heater_power_w = parseInt(bedPowerMatch[1]);

  return specs;
}

// ─── Model name cleaning ──────────────────────────────────────────────────────

function cleanModelName(title: string, brandName: string): string {
  // Remove brand prefix from title
  const cleaned = title
    .replace(new RegExp(`^${brandName}\\s+`, 'i'), '')
    .replace(/\b3D\s*Printer\b/gi, '')
    .replace(/\(.*?\)/g, '')           // Remove parenthetical notes
    .replace(/,\s*.*$/, '')            // Remove everything after first comma
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || title;
}

function generatePrinterId(brandSlug: string, handle: string): string {
  return `${brandSlug}-${handle}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// ─── Shopify products.json fetcher ────────────────────────────────────────────

async function fetchShopifyProducts(domain: string, pathPrefix: string = '', page = 1): Promise<ShopifyProduct[]> {
  const url = `https://${domain}${pathPrefix}/products.json?limit=250&page=${page}`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(20_000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FilaScope-bot/1.0; +https://filascope.com)',
        'Accept': 'application/json',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.products ?? []) as ShopifyProduct[];
  } catch {
    return [];
  }
}

// ─── HTML page scraper (for non-Shopify brands) ───────────────────────────────

async function fetchProductPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(20_000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FilaScope-bot/1.0; +https://filascope.com)',
        'Accept': 'text/html',
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractTitleFromHtml(html: string): string {
  return (
    html.match(/<h1[^>]*>(.*?)<\/h1>/is)?.[1]?.replace(/<[^>]+>/g, '').trim() ||
    html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1] ||
    html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.split('|')[0].trim() ||
    ''
  );
}

function extractPriceFromHtml(html: string): number | null {
  // JSON-LD Product
  const ldMatch = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (ldMatch) {
    for (const block of ldMatch) {
      try {
        const json = JSON.parse(block.replace(/<\/?script[^>]*>/gi, ''));
        const price = json?.offers?.price ?? json?.offers?.[0]?.price;
        if (price) return parseFloat(price);
      } catch { /* ignore */ }
    }
  }
  // og:price:amount meta
  const ogPrice = html.match(/<meta[^>]+property="og:price:amount"[^>]+content="([^"]+)"/i)?.[1];
  if (ogPrice) return parseFloat(ogPrice);
  // Shopify variant price in page
  const variantPrice = html.match(/"price"\s*:\s*"?(\d+(?:\.\d{2})?)"?/)?.[1];
  if (variantPrice) return parseFloat(variantPrice);
  return null;
}

function extractImageFromHtml(html: string): string | null {
  return (
    html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1] ||
    html.match(/<img[^>]+class="[^"]*product[^"]*"[^>]+src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/i)?.[1] ||
    null
  );
}

// ─── Select best printer variant (price) ─────────────────────────────────────

function selectVariant(variants: ShopifyVariant[], minPrice: number, maxPrice: number): ShopifyVariant | null {
  const EXCLUDED = /combo|bundle|kit\b|ams|mmu|pack\b|\+\s*\d+/i;
  const candidates = variants
    .filter(v => v.available !== false)
    .filter(v => !EXCLUDED.test(v.title))
    .filter(v => {
      const p = parseFloat(v.price);
      return p >= minPrice && p <= maxPrice;
    });
  if (candidates.length === 0) {
    // Fall back to any variant in price range
    const fallback = variants.filter(v => {
      const p = parseFloat(v.price);
      return p >= minPrice && p <= maxPrice;
    });
    return fallback[0] ?? null;
  }
  // Pick lowest standalone price
  return candidates.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))[0];
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')!;

  // Auth
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  let isAuthorized = token === serviceKey;
  if (!isAuthorized && token) {
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (user) {
      const { data: role } = await userClient.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
      if (role) isAuthorized = true;
    }
  }
  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const brandSlug: string = body.brand_slug;
    const dryRun: boolean = body.dry_run ?? false;

    if (!brandSlug) {
      return new Response(JSON.stringify({ error: 'brand_slug is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const config = PRINTER_BRAND_CONFIGS[brandSlug];
    if (!config) {
      return new Response(JSON.stringify({
        error: `Unknown brand_slug: "${brandSlug}"`,
        available: Object.keys(PRINTER_BRAND_CONFIGS),
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Look up brand_id from printer_brands table
    const { data: brandRow } = await supabase
      .from('printer_brands')
      .select('id, brand')
      .ilike('brand', config.brand_name)
      .maybeSingle();

    const brandId: string | null = brandRow?.id ?? null;
    if (!brandId) {
      console.warn(`[sync-brand-printers] printer_brands entry not found for "${config.brand_name}" — will insert without brand_id`);
    }

    const summary = { brand: config.brand_name, total_scraped: 0, printers_found: 0, created: 0, updated: 0, skipped: 0, errors: 0, results: [] as any[] };
    const minPrice = config.min_price_usd ?? 100;
    const maxPrice = config.max_price_usd ?? 10000;

    // ── Collect products per region ──────────────────────────────────────────
    // Map: printerId → { insertData, regionPrices }
    const printerMap = new Map<string, { data: Record<string, any>; regionPrices: Partial<Record<RegionCode, number>>; regionUrls: Partial<Record<RegionCode, string>> }>();

    const isShopify = !config.platform || config.platform === 'shopify';

    if (isShopify) {
      const regions = Object.keys(config.domains) as RegionCode[];

      for (let ri = 0; ri < regions.length; ri++) {
        const region = regions[ri];
        const domain = config.domains[region]!;
        const prefix = config.path_prefix?.[region] ?? '';

        // Paginate products.json
        let page = 1;
        let products: ShopifyProduct[] = [];
        while (true) {
          const batch = await fetchShopifyProducts(domain, prefix, page);
          if (batch.length === 0) break;
          products = products.concat(batch);
          if (batch.length < 250) break;
          page++;
        }

        summary.total_scraped += products.length;
        console.log(`[sync-brand-printers] ${config.brand_name} ${region}: ${products.length} products`);

        for (const product of products) {
          // Vet as printer
          const vet = vetPrinterProduct(product.product_type, product.title, product.tags, product.body_html);
          if (!vet.pass) continue;

          const variant = selectVariant(product.variants, minPrice, maxPrice);
          if (!variant) continue;

          const printerId = generatePrinterId(brandSlug, product.handle);
          const productUrl = `https://${domain}${prefix}/products/${product.handle}`;
          const price = parseFloat(variant.price);

          if (!printerMap.has(printerId)) {
            // First time seeing this printer — extract full specs
            const specs = extractSpecs(product.body_html, product.title, product.tags, product.product_type);
            const modelName = cleanModelName(product.title, config.brand_name);

            const insertData: Record<string, any> = {
              printer_id:        printerId,
              brand_id:          brandId,
              model_name:        modelName,
              product_title:     product.title,
              printer_technology: vet.printer_technology ?? specs.printer_technology ?? 'FDM',
              image_url:         product.images[0]?.src ?? null,
              status:            'active',
              prices_last_updated_at: new Date().toISOString(),
            };

            // Apply extracted specs
            const specFields: (keyof ExtractedSpecs)[] = [
              'build_volume_x_mm', 'build_volume_y_mm', 'build_volume_z_mm',
              'max_nozzle_temp_c', 'bed_max_temp_c', 'max_print_speed_mms',
              'max_travel_speed_xy_mms', 'filament_diameter_mm', 'stock_nozzle_diameter_mm',
              'has_enclosure', 'auto_bed_leveling', 'has_wifi', 'has_ethernet',
              'multi_material_supported', 'multi_material_max_spools',
              'extruder_type', 'extruder_count', 'machine_weight_kg', 'rated_power_w',
              'bed_heated', 'assembly_required', 'min_layer_height_mm', 'max_layer_height_mm',
              'input_shaping_supported', 'thermal_runaway_protection', 'power_loss_recovery',
              'screen_type', 'screen_size_inch', 'noise_level_printing_db', 'bed_heater_power_w',
            ];
            for (const f of specFields) {
              if (specs[f] !== undefined && specs[f] !== null) {
                insertData[f] = specs[f];
              }
            }
            if (specs.official_supported_materials?.length) {
              insertData.official_supported_materials = specs.official_supported_materials.join(', ');
            }

            printerMap.set(printerId, { data: insertData, regionPrices: {}, regionUrls: {} });
            summary.printers_found++;
          }

          // Record region price + URL
          const entry = printerMap.get(printerId)!;
          entry.regionPrices[region] = price;
          entry.regionUrls[region] = productUrl;
        }

        // Rate limit between regions
        if (ri < regions.length - 1) {
          await new Promise(r => setTimeout(r, config.rate_limit_ms ?? 1000));
        }
      }
    } else {
      // Non-Shopify: scrape known product page URLs (Prusa, FlashForge)
      const urls = config.known_urls ?? [];
      summary.total_scraped = urls.length;

      for (const url of urls) {
        const html = await fetchProductPage(url);
        if (!html) {
          summary.errors++;
          continue;
        }

        const title = extractTitleFromHtml(html);
        if (!title) continue;

        const productType = html.match(/product[_\s-]?type["']?\s*:\s*["']([^"']+)/i)?.[1] ?? '3D Printer';
        const tags = html.match(/tags["']?\s*:\s*\[([^\]]+)\]/i)?.[1]?.replace(/["']/g, '') ?? '';
        const bodyHtml = html.match(/<div[^>]+class="[^"]*product[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? html;

        const vet = vetPrinterProduct(productType, title, tags, bodyHtml);
        if (!vet.pass) {
          summary.skipped++;
          continue;
        }

        const price = extractPriceFromHtml(html);
        if (!price || price < minPrice || price > maxPrice) {
          summary.skipped++;
          continue;
        }

        const handle = url.split('/').filter(Boolean).pop() ?? title.toLowerCase().replace(/\s+/g, '-');
        const printerId = generatePrinterId(brandSlug, handle);
        const specs = extractSpecs(bodyHtml, title, tags, productType);
        const modelName = cleanModelName(title, config.brand_name);

        const insertData: Record<string, any> = {
          printer_id:        printerId,
          brand_id:          brandId,
          model_name:        modelName,
          product_title:     title,
          printer_technology: vet.printer_technology ?? specs.printer_technology ?? 'FDM',
          image_url:         extractImageFromHtml(html),
          official_product_url: url,
          product_url:       url,
          current_price_usd_store: price,
          status:            'active',
          prices_last_updated_at: new Date().toISOString(),
        };

        const specFields: (keyof ExtractedSpecs)[] = [
          'build_volume_x_mm', 'build_volume_y_mm', 'build_volume_z_mm',
          'max_nozzle_temp_c', 'bed_max_temp_c', 'max_print_speed_mms',
          'max_travel_speed_xy_mms', 'filament_diameter_mm', 'stock_nozzle_diameter_mm',
          'has_enclosure', 'auto_bed_leveling', 'has_wifi', 'has_ethernet',
          'multi_material_supported', 'multi_material_max_spools',
          'extruder_type', 'extruder_count', 'machine_weight_kg', 'rated_power_w',
          'bed_heated', 'assembly_required', 'min_layer_height_mm', 'max_layer_height_mm',
          'input_shaping_supported', 'thermal_runaway_protection', 'power_loss_recovery',
          'screen_type', 'screen_size_inch', 'noise_level_printing_db', 'bed_heater_power_w',
        ];
        for (const f of specFields) {
          if (specs[f] !== undefined && specs[f] !== null) insertData[f] = specs[f];
        }
        if (specs.official_supported_materials?.length) {
          insertData.official_supported_materials = specs.official_supported_materials.join(', ');
        }

        printerMap.set(printerId, { data: insertData, regionPrices: { US: price }, regionUrls: { US: url } });
        summary.printers_found++;
      }
    }

    // ── Write to database ────────────────────────────────────────────────────
    for (const [printerId, { data: insertData, regionPrices, regionUrls }] of printerMap.entries()) {
      // Apply regional prices and URLs
      for (const [region, price] of Object.entries(regionPrices) as [RegionCode, number][]) {
        const fieldMap = REGION_FIELD_MAP[region];
        if (fieldMap) {
          insertData[fieldMap.priceCol] = price;
        }
      }
      for (const [region, url] of Object.entries(regionUrls) as [RegionCode, string][]) {
        const fieldMap = REGION_FIELD_MAP[region];
        if (fieldMap) {
          insertData[fieldMap.urlCol] = url;
        }
      }

      // Price tier from US price
      const usdPrice = regionPrices.US ?? Object.values(regionPrices)[0];
      if (usdPrice) {
        insertData.price_tier = usdPrice < 300 ? 'budget' : usdPrice < 800 ? 'mid' : usdPrice < 2000 ? 'premium' : 'prosumer';
      }

      const resultEntry: any = { printer_id: printerId, model_name: insertData.model_name };

      if (dryRun) {
        resultEntry.action = 'dry_run';
        summary.skipped++;
      } else {
        try {
          // Check if printer exists
          const { data: existing } = await supabase
            .from('printers')
            .select('id')
            .eq('printer_id', printerId)
            .maybeSingle();

          if (existing) {
            // Update: always refresh prices/URLs, preserve manually-set spec overrides
            const updateData: Record<string, any> = {
              prices_last_updated_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            // Always update prices and URLs
            for (const [region] of Object.entries(regionPrices) as [RegionCode, number][]) {
              const fieldMap = REGION_FIELD_MAP[region];
              if (fieldMap && insertData[fieldMap.priceCol] !== undefined) {
                updateData[fieldMap.priceCol] = insertData[fieldMap.priceCol];
              }
              if (fieldMap && insertData[fieldMap.urlCol] !== undefined) {
                updateData[fieldMap.urlCol] = insertData[fieldMap.urlCol];
              }
            }

            // Update spec fields from scraper (non-price fields that may have improved)
            const specFields = [
              'build_volume_x_mm', 'build_volume_y_mm', 'build_volume_z_mm',
              'max_nozzle_temp_c', 'bed_max_temp_c', 'max_print_speed_mms',
              'max_travel_speed_xy_mms', 'has_enclosure', 'auto_bed_leveling',
              'has_wifi', 'has_ethernet', 'multi_material_supported',
              'extruder_type', 'printer_technology', 'image_url', 'official_supported_materials',
              'price_tier', 'filament_diameter_mm',
            ];
            for (const field of specFields) {
              if (insertData[field] !== undefined) {
                updateData[field] = insertData[field];
              }
            }

            const { error } = await supabase.from('printers').update(updateData).eq('id', existing.id);
            if (error) throw error;
            resultEntry.action = 'updated';
            summary.updated++;
          } else {
            // Insert new printer
            const { error } = await supabase.from('printers').insert(insertData);
            if (error) throw error;
            resultEntry.action = 'created';
            summary.created++;
          }
        } catch (err: any) {
          console.error(`[sync-brand-printers] Error for ${printerId}:`, err);
          resultEntry.action = 'error';
          resultEntry.error = err.message;
          summary.errors++;
        }
      }

      summary.results.push(resultEntry);
    }

    return new Response(JSON.stringify({ ok: true, dry_run: dryRun, ...summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('[sync-brand-printers] Fatal error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// DEBUG LOGGING UTILITIES
// ============================================================================
interface LogContext {
  requestId: string;
  startTime: number;
  region?: string;
  productName?: string;
  colorName?: string;
  operation?: string;
}

interface TimingMetrics {
  firecrawlMs: number;
  dbMs: number;
  delayMs: number;
  totalMs: number;
}

const LOG_LEVELS = {
  DEBUG: '🔍',
  INFO: 'ℹ️',
  WARN: '⚠️',
  ERROR: '❌',
  SUCCESS: '✅',
  TIMING: '⏱️',
} as const;

function generateRequestId(): string {
  return crypto.randomUUID().substring(0, 8).toUpperCase();
}

function formatElapsed(startTime: number): string {
  return `${Date.now() - startTime}ms`;
}

function log(level: keyof typeof LOG_LEVELS, ctx: LogContext, category: string, message: string, data?: any): void {
  const elapsed = formatElapsed(ctx.startTime);
  const prefix = ctx.region ? `[${ctx.requestId}][${ctx.region}]` : `[${ctx.requestId}]`;
  const dataStr = data !== undefined ? ` | ${typeof data === 'object' ? JSON.stringify(data) : data}` : '';
  console.log(`${LOG_LEVELS[level]} ${prefix}[${category}][${elapsed}] ${message}${dataStr}`);
}

function logDebug(ctx: LogContext, category: string, message: string, data?: any): void {
  log('DEBUG', ctx, category, message, data);
}

function logInfo(ctx: LogContext, category: string, message: string, data?: any): void {
  log('INFO', ctx, category, message, data);
}

function logWarn(ctx: LogContext, category: string, message: string, data?: any): void {
  log('WARN', ctx, category, message, data);
}

function logError(ctx: LogContext, category: string, message: string, error?: unknown): void {
  const errorDetails = error instanceof Error 
    ? { message: error.message, stack: error.stack?.split('\n').slice(0, 5).join('\n') }
    : error;
  log('ERROR', ctx, category, message, errorDetails);
}

function logSuccess(ctx: LogContext, category: string, message: string, data?: any): void {
  log('SUCCESS', ctx, category, message, data);
}

function logTiming(ctx: LogContext, category: string, message: string, durationMs: number): void {
  log('TIMING', ctx, category, `${message}: ${durationMs}ms`);
}

function logSeparator(ctx: LogContext, title?: string): void {
  if (title) {
    console.log(`\n[${ctx.requestId}] ${'='.repeat(50)}`);
    console.log(`[${ctx.requestId}] ${title}`);
    console.log(`[${ctx.requestId}] ${'='.repeat(50)}`);
  } else {
    console.log(`[${ctx.requestId}] ${'='.repeat(50)}`);
  }
}

// ============================================================================
// REGIONAL STORE CONFIGURATION
// ============================================================================
const BAMBU_REGIONAL_STORES: Record<string, {
  subdomain: string;
  currency: string;
  currencySymbol: string;
  priceField: string;
  urlField: string;
}> = {
  US: { subdomain: "us", currency: "USD", currencySymbol: "$", priceField: "variant_price", urlField: "product_url" },
  CA: { subdomain: "ca", currency: "CAD", currencySymbol: "C$", priceField: "price_cad", urlField: "product_url_ca" },
  UK: { subdomain: "uk", currency: "GBP", currencySymbol: "£", priceField: "price_gbp", urlField: "product_url_uk" },
  EU: { subdomain: "eu", currency: "EUR", currencySymbol: "€", priceField: "price_eur", urlField: "product_url_eu" },
  AU: { subdomain: "au", currency: "AUD", currencySymbol: "A$", priceField: "price_aud", urlField: "product_url_au" },
  JP: { subdomain: "jp", currency: "JPY", currencySymbol: "¥", priceField: "price_jpy", urlField: "product_url_jp" },
};

// ============================================================================
// MATERIAL-SPECIFIC PRICE RANGES (by region)
// ============================================================================
const PRICE_RANGES_BY_MATERIAL: Record<string, Record<string, [number, number]>> = {
  PLA: {
    US: [15, 40], CA: [20, 50], UK: [14, 35], EU: [16, 40], AU: [22, 55], JP: [2000, 5500]
  },
  "PLA-CF": {
    US: [25, 55], CA: [32, 70], UK: [22, 48], EU: [25, 55], AU: [35, 75], JP: [3500, 7500]
  },
  PETG: {
    US: [18, 45], CA: [24, 55], UK: [16, 38], EU: [18, 45], AU: [26, 60], JP: [2500, 6000]
  },
  "PETG-CF": {
    US: [28, 60], CA: [36, 78], UK: [25, 52], EU: [28, 60], AU: [40, 82], JP: [4000, 8500]
  },
  TPU: {
    US: [28, 55], CA: [35, 70], UK: [25, 48], EU: [28, 55], AU: [40, 75], JP: [3500, 7500]
  },
  ABS: {
    US: [18, 40], CA: [22, 50], UK: [16, 35], EU: [18, 40], AU: [25, 55], JP: [2500, 5500]
  },
  // FIX 1: Add specific ABS-GF price range (glass fiber reinforced - premium material)
  "ABS-GF": {
    US: [35, 70], CA: [45, 88], UK: [30, 60], EU: [35, 70], AU: [50, 95], JP: [5000, 9800]
  },
  ASA: {
    US: [25, 50], CA: [32, 62], UK: [22, 42], EU: [25, 50], AU: [35, 68], JP: [3500, 7000]
  },
  // FIX 1: Add specific ASA-Aero price range (lightweight foaming ASA - specialty material)
  "ASA-Aero": {
    US: [30, 60], CA: [38, 75], UK: [26, 52], EU: [30, 60], AU: [42, 82], JP: [4200, 8400]
  },
  "ASA-CF": {
    US: [30, 55], CA: [38, 70], UK: [26, 48], EU: [30, 55], AU: [42, 75], JP: [4200, 7700]
  },
  // FIX: Add specific PAHT-CF and PPA-CF price ranges (premium PA materials)
  "PAHT-CF": {
    US: [45, 90], CA: [55, 115], UK: [38, 78], EU: [45, 90], AU: [62, 125], JP: [6500, 13000]
  },
  "PPA-CF": {
    US: [55, 100], CA: [68, 130], UK: [48, 88], EU: [55, 100], AU: [78, 140], JP: [8000, 14500]
  },
  "PA-CF": {
    US: [35, 75], CA: [45, 95], UK: [30, 65], EU: [35, 75], AU: [50, 100], JP: [5000, 10500]
  },
  "PA-GF": {
    US: [30, 65], CA: [40, 82], UK: [28, 55], EU: [30, 65], AU: [45, 88], JP: [4500, 9000]
  },
  "PET-CF": {
    US: [30, 60], CA: [38, 75], UK: [28, 55], EU: [32, 60], AU: [45, 85], JP: [4500, 8500]
  },
  PC: {
    US: [28, 60], CA: [36, 78], UK: [25, 52], EU: [28, 60], AU: [40, 82], JP: [4000, 8500]
  },
  "PC-FR": {
    US: [38, 75], CA: [48, 95], UK: [34, 65], EU: [38, 75], AU: [55, 100], JP: [5500, 10500]
  },
  "PPS-CF": {
    US: [85, 140], CA: [100, 170], UK: [75, 125], EU: [85, 140], AU: [120, 195], JP: [12000, 19500]
  },
  PVA: {
    US: [50, 100], CA: [65, 130], UK: [45, 88], EU: [50, 100], AU: [72, 138], JP: [7000, 14000]
  },
  Support: {
    US: [25, 90], CA: [32, 115], UK: [22, 78], EU: [25, 90], AU: [36, 122], JP: [3500, 12500]
  },
};

// ============================================================================
// FIX 4: SMART PRICE RANGE FALLBACK FOR ENGINEERING MATERIALS
// ============================================================================
const ENGINEERING_MATERIALS = ['PA-CF', 'PA-GF', 'PET-CF', 'PC', 'PC-FR', 'PPS-CF', 'ABS-GF', 'ASA-CF', 'PETG-CF'];
const SPECIALTY_MATERIALS = ['TPU', 'PVA', 'Support'];

function getMaterialPriceRange(material: string, region: string): [number, number] {
  // Direct lookup first
  if (PRICE_RANGES_BY_MATERIAL[material]?.[region]) {
    return PRICE_RANGES_BY_MATERIAL[material][region];
  }
  
  // Smart fallback based on material category
  if (ENGINEERING_MATERIALS.some(m => material.includes(m) || m.includes(material))) {
    // Fallback to PA-CF range (mid-range engineering material)
    return PRICE_RANGES_BY_MATERIAL['PA-CF']?.[region] || PRICE_RANGES_BY_MATERIAL['PA-CF']['US'];
  }
  
  if (SPECIALTY_MATERIALS.some(m => material.includes(m) || m.includes(material))) {
    // Fallback to Support range
    return PRICE_RANGES_BY_MATERIAL['Support']?.[region] || PRICE_RANGES_BY_MATERIAL['Support']['US'];
  }
  
  // Default fallback to PLA for basic materials
  return PRICE_RANGES_BY_MATERIAL['PLA']?.[region] || PRICE_RANGES_BY_MATERIAL['PLA']['US'];
}

const REGION_TO_FIRECRAWL_LOCATION: Record<string, { country: string; languages: string[] }> = {
  US: { country: "US", languages: ["en"] },
  CA: { country: "CA", languages: ["en"] },
  UK: { country: "GB", languages: ["en"] },
  EU: { country: "DE", languages: ["en", "de"] },
  AU: { country: "AU", languages: ["en"] },
  JP: { country: "JP", languages: ["ja", "en"] },
};

// ============================================================================
// RATE LIMIT CONFIGURATION - Configurable delays for safe scraping
// ============================================================================
const RATE_LIMIT_CONFIG = {
  synchronous: {
    betweenRegions: 2000,
    betweenProducts: 3000,
  },
  background: {
    betweenRegions: 1500,
    betweenProducts: 2500,
  },
};

// ============================================================================
// ERROR CATEGORIZATION - Structured error tracking
// ============================================================================
type ErrorCategory = 'firecrawl' | 'price_extraction' | 'database' | 'data_quality';

interface CategorizedError {
  category: ErrorCategory;
  message: string;
  product?: string;
  region?: string;
  details?: string;
}

function createError(
  category: ErrorCategory,
  message: string,
  options?: { product?: string; region?: string; details?: string }
): CategorizedError {
  return {
    category,
    message,
    ...options,
  };
}

function formatError(err: CategorizedError): string {
  const parts = [`[${err.category.toUpperCase()}]`, err.message];
  if (err.product) parts.push(`(${err.product})`);
  if (err.region) parts.push(`[${err.region}]`);
  return parts.join(' ');
}

// ============================================================================
// PLA PRODUCT DEFINITIONS - All Bambu Lab PLA types
// Uses ProductConfig interface for type consistency
// ============================================================================
const BAMBU_PLA_PRODUCTS: Record<string, ProductConfig> = {
  // ============================================================================
  // PLA Products - Slugs verified from Excel file (ca.store.bambulab.com)
  // ============================================================================
  "PLA Basic": {
    slug: "pla-basic-filament",  // Correct: https://ca.store.bambulab.com/products/pla-basic-filament
    material: "PLA",
    tdsUrl: "https://store.bblcdn.com/s7/default/23b4cf2b83d5470bb96d19970b5f3ae8/Bambu_PLA_Basic_Technical_Data_Sheet.pdf",
    nozzleTempMin: 190, nozzleTempMax: 220,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Matte": {
    slug: "pla-matte",  // FIXED from pla-matte-filament
    material: "PLA",
    tdsUrl: "https://store.bblcdn.com/s7/default/5b061f2feeac4ba88f355a33248bbda7/Bambu_PLA_Matte_Technical_Data_Sheet.pdf",
    nozzleTempMin: 190, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Silk": {
    slug: "pla-silk-upgrade",  // FIXED from pla-silk-filament
    material: "PLA",
    tdsUrl: "https://store.bblcdn.com/s7/default/Bambu_PLA_Silk_Technical_Data_Sheet.pdf",
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Silk Multi-color": {
    slug: "pla-silk-multi-color",  // NEW - added from Excel
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Sparkle": {
    slug: "pla-sparkle",  // FIXED from pla-sparkle-filament
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Metal": {
    slug: "pla-metal",  // FIXED from pla-metal-filament
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Marble": {
    slug: "pla-marble",  // FIXED from pla-marble-filament
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 190, nozzleTempMax: 220,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Galaxy": {
    slug: "pla-galaxy",  // FIXED from pla-galaxy-filament
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Glow": {
    slug: "pla-glow",  // FIXED from pla-glow-filament
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Wood": {
    slug: "pla-wood",  // FIXED from pla-wood-filament
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Tough": {
    slug: "pla-tough-upgrade",  // Correct
    material: "PLA",
    tdsUrl: "https://store.bblcdn.com/s7/default/80a85371db2e40bda97069d283fed76c/BambuPLA_Tough_TechnicalData_Sheet_(2).pdf",
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA-CF": {
    slug: "pla-cf",  // FIXED from pla-cf-filament
    material: "PLA-CF",
    tdsUrl: null,
    nozzleTempMin: 220, nozzleTempMax: 250,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "ePLA-HS": {
    slug: "epla-hs-filament",  // Correct
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 190, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Aero": {
    slug: "pla-aero",  // FIXED from pla-aero-filament
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Impact": {
    slug: "pla-impact-filament",  // Correct
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Translucent": {
    slug: "pla-translucent",  // FIXED from pla-translucent-filament
    material: "PLA",
    tdsUrl: "https://store.bblcdn.com/s7/default/729a8bf233e9474db25c8d5be1e64a00/Bambu_PLA_Translucent_Technical_Data_Sheet.pdf",
    nozzleTempMin: 190, nozzleTempMax: 220,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Basic Gradient": {
    slug: "pla-basic-gradient",  // FIXED from pla-gradient-filament
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 190, nozzleTempMax: 220,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
};

// ============================================================================
// PETG PRODUCT DEFINITIONS
// ============================================================================
interface ProductConfig {
  slug: string;
  material: string;
  tdsUrl: string | null;
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  dryingTempC: number;
  dryingTimeHours: number;
  netWeightG?: number;
}

// ============================================================================
// PETG PRODUCT DEFINITIONS - Slugs verified from Excel file (ca.store.bambulab.com)
// ============================================================================
const BAMBU_PETG_PRODUCTS: Record<string, ProductConfig> = {
  // Note: "PETG Basic" removed - not in official product lineup per Excel file
  "PETG HF": {
    slug: "petg-hf",  // Verified: https://ca.store.bambulab.com/products/petg-hf
    material: "PETG",
    tdsUrl: null,  // Will be extracted from page
    nozzleTempMin: 220, nozzleTempMax: 260,
    bedTempMin: 70, bedTempMax: 90,
    dryingTempC: 65, dryingTimeHours: 8,
  },
  "PETG-CF": {
    slug: "petg-cf",  // Verified: https://ca.store.bambulab.com/products/petg-cf
    material: "PETG-CF",
    tdsUrl: "https://store.bblcdn.com/626e4f424bf345ae965ad0ddfcaf2459.pdf",
    nozzleTempMin: 240, nozzleTempMax: 280,
    bedTempMin: 70, bedTempMax: 90,
    dryingTempC: 65, dryingTimeHours: 8,
  },
  "PETG Translucent": {
    slug: "petg-translucent",  // Verified: https://ca.store.bambulab.com/products/petg-translucent
    material: "PETG",
    tdsUrl: "https://store.bblcdn.com/s1/default/338c9cd853fd44d9b6ed354a49048e72/Bambu_PETG_Translucent_Technical_Data_Sheet.pdf",
    nozzleTempMin: 230, nozzleTempMax: 260,
    bedTempMin: 65, bedTempMax: 75,
    dryingTempC: 65, dryingTimeHours: 8,
  },
};

// ============================================================================
// TPU PRODUCT DEFINITIONS - Slugs verified from Excel file (ca.store.bambulab.com)
// ============================================================================
const BAMBU_TPU_PRODUCTS: Record<string, ProductConfig> = {
  "TPU 95A HF": {
    slug: "tpu-95a-hf",  // Verified: https://ca.store.bambulab.com/products/tpu-95a-hf
    material: "TPU",
    tdsUrl: "https://store.bblcdn.com/58df32731eab4c90a7dac9b12e13ba88.pdf",
    nozzleTempMin: 220, nozzleTempMax: 240,
    bedTempMin: 30, bedTempMax: 35,
    dryingTempC: 70, dryingTimeHours: 8,
  },
  "TPU 85A / TPU 90A": {
    slug: "tpu-85a-tpu-90a",  // Verified: https://ca.store.bambulab.com/products/tpu-85a-tpu-90a
    material: "TPU",
    tdsUrl: "https://cdn.shopify.com/s/files/1/0645/5876/0155/files/Bambu_TPU_90A_Technical_Data_Sheet_582bf8f6-1f0a-474c-aeda-9e72af3689dc.pdf?v=1741314674",
    nozzleTempMin: 200, nozzleTempMax: 250,
    bedTempMin: 30, bedTempMax: 35,
    dryingTempC: 70, dryingTimeHours: 8,
  },
  "TPU for AMS": {
    slug: "tpu-for-ams",  // Verified: https://ca.store.bambulab.com/products/tpu-for-ams
    material: "TPU",
    tdsUrl: "https://store.bblcdn.com/s5/default/0a98353dce6d486ca848b21d2b19a207.pdf",
    nozzleTempMin: 220, nozzleTempMax: 240,
    bedTempMin: 30, bedTempMax: 35,
    dryingTempC: 70, dryingTimeHours: 8,
  },
};

// ============================================================================
// ABS PRODUCT DEFINITIONS - Slugs verified from Excel file (ca.store.bambulab.com)
// ============================================================================
const BAMBU_ABS_PRODUCTS: Record<string, ProductConfig> = {
  "ABS": {
    slug: "abs-filament",  // Verified: https://ca.store.bambulab.com/products/abs-filament
    material: "ABS",
    tdsUrl: "https://store.bblcdn.com/s7/default/23b4cf2b83d5470bb96d19970b5f3ae8/Bambu_ABS_Technical_Data_Sheet_V3.pdf",
    nozzleTempMin: 240, nozzleTempMax: 270,
    bedTempMin: 80, bedTempMax: 100,
    dryingTempC: 80, dryingTimeHours: 8,
  },
  // ABS-GF (Glass Fiber reinforced ABS)
  "ABS-GF": {
    slug: "abs-gf",  // Verified: https://ca.store.bambulab.com/products/abs-gf
    material: "ABS-GF",
    tdsUrl: "https://store.bblcdn.com/69f0758087c943f8a0a87bffa6dc901b.pdf",
    nozzleTempMin: 240, nozzleTempMax: 270,
    bedTempMin: 80, bedTempMax: 100,
    dryingTempC: 80, dryingTimeHours: 8,
  },
};

// ============================================================================
// ASA PRODUCT DEFINITIONS - Slugs verified from Excel file (ca.store.bambulab.com)
// ============================================================================
const BAMBU_ASA_PRODUCTS: Record<string, ProductConfig> = {
  "ASA": {
    slug: "asa-filament",  // Verified: https://ca.store.bambulab.com/products/asa-filament
    material: "ASA",
    tdsUrl: "https://store.bblcdn.com/ad7b08230c164e72856cffbe06bb7dc9.pdf",
    nozzleTempMin: 240, nozzleTempMax: 270,
    bedTempMin: 80, bedTempMax: 100,
    dryingTempC: 80, dryingTimeHours: 8,
  },
  "ASA Aero": {
    slug: "asa-aero",  // Verified: https://ca.store.bambulab.com/products/asa-aero
    material: "ASA",
    tdsUrl: "https://store.bblcdn.com/s1/default/02b005fdf02d450084e3128f7cf0c36f/Bambu_ASA_Aero_Technical_Data_Sheet.pdf",
    nozzleTempMin: 240, nozzleTempMax: 280,
    bedTempMin: 80, bedTempMax: 90,
    dryingTempC: 80, dryingTimeHours: 8,
  },
  "ASA-CF": {
    slug: "asa-cf",  // Verified: https://ca.store.bambulab.com/products/asa-cf
    material: "ASA-CF",
    tdsUrl: "https://store.bblcdn.com/s7/default/44b0a48ab1d84e819647c980eb179ae9/Bambus_ASA-CF_Technical_Data_Sheet.pdf",
    nozzleTempMin: 250, nozzleTempMax: 280,
    bedTempMin: 80, bedTempMax: 100,
    dryingTempC: 80, dryingTimeHours: 8,
    netWeightG: 500,  // ASA-CF uses 500g spools
  },
};

// ============================================================================
// PA (NYLON) PRODUCT DEFINITIONS - Slugs verified from Excel file (ca.store.bambulab.com)
// ============================================================================
const BAMBU_PA_PRODUCTS: Record<string, ProductConfig> = {
  "PA6-CF": {
    slug: "pa6-cf",  // Verified: https://ca.store.bambulab.com/products/pa6-cf
    material: "PA-CF",
    tdsUrl: "https://store.bblcdn.com/b2abc59ac250492b979a52f1ce3e61b3.pdf",
    nozzleTempMin: 270, nozzleTempMax: 290,
    bedTempMin: 80, bedTempMax: 90,
    dryingTempC: 80, dryingTimeHours: 12,
    netWeightG: 500,  // PA-CF uses 500g spools
  },
  "PAHT-CF": {
    slug: "paht-cf",  // Verified: https://ca.store.bambulab.com/products/paht-cf
    material: "PA-CF",
    tdsUrl: "https://store.bblcdn.com/7166b20bc68f4c87b32c972b856eeb4b.pdf",
    nozzleTempMin: 280, nozzleTempMax: 300,
    bedTempMin: 80, bedTempMax: 90,
    dryingTempC: 80, dryingTimeHours: 12,
    netWeightG: 500,  // PAHT-CF uses 500g spools
  },
  "PA6-GF": {
    slug: "pa6-gf",  // Verified: https://ca.store.bambulab.com/products/pa6-gf
    material: "PA-GF",
    tdsUrl: "https://store.bblcdn.com/s5/default/f0317db8b3f44d0486553c1e214cff9d.pdf",
    nozzleTempMin: 270, nozzleTempMax: 290,
    bedTempMin: 80, bedTempMax: 90,
    dryingTempC: 80, dryingTimeHours: 12,
    netWeightG: 1000,  // PA6-GF uses standard 1kg spools
  },
  "PPA-CF": {
    slug: "ppa-cf",  // Verified: https://ca.store.bambulab.com/products/ppa-cf
    material: "PA-CF",
    tdsUrl: "https://store.bblcdn.com/05b0e4ca5ee14a4cb378cfa48df24f91.pdf",
    nozzleTempMin: 280, nozzleTempMax: 310,
    bedTempMin: 100, bedTempMax: 120,
    dryingTempC: 100, dryingTimeHours: 12,
    netWeightG: 500,  // PPA-CF uses 500g spools
  },
};

// ============================================================================
// PET PRODUCT DEFINITIONS - Slugs verified from Excel file (ca.store.bambulab.com)
// ============================================================================
const BAMBU_PET_PRODUCTS: Record<string, ProductConfig> = {
  "PET-CF": {
    slug: "pet-cf",  // Verified: https://ca.store.bambulab.com/products/pet-cf
    material: "PET-CF",
    tdsUrl: "https://store.bblcdn.com/9690d6226f024acab2ba0dd52dabb654.pdf",
    nozzleTempMin: 260, nozzleTempMax: 290,
    bedTempMin: 80, bedTempMax: 100,
    dryingTempC: 80, dryingTimeHours: 8,
    netWeightG: 750,  // PET-CF uses 750g spools
  },
};

// ============================================================================
// PC (POLYCARBONATE) PRODUCT DEFINITIONS - Slugs verified from Excel file (ca.store.bambulab.com)
// ============================================================================
const BAMBU_PC_PRODUCTS: Record<string, ProductConfig> = {
  "PC": {
    slug: "pc-filament",  // Verified: https://ca.store.bambulab.com/products/pc-filament
    material: "PC",
    tdsUrl: "https://store.bblcdn.com/a52afdccddfd448583d119587122c8c5.pdf",
    nozzleTempMin: 260, nozzleTempMax: 280,
    bedTempMin: 90, bedTempMax: 110,
    dryingTempC: 80, dryingTimeHours: 8,
  },
  "PC FR": {
    slug: "pc-fr",  // Verified: https://ca.store.bambulab.com/products/pc-fr
    material: "PC-FR",
    tdsUrl: "https://store.bblcdn.com/s1/default/4adf3c9827a0475d8777e9b8cfd11fbe.pdf",
    nozzleTempMin: 260, nozzleTempMax: 280,
    bedTempMin: 90, bedTempMax: 110,
    dryingTempC: 80, dryingTimeHours: 8,
  },
};

// ============================================================================
// PPS (POLYPHENYLENE SULFIDE) PRODUCT DEFINITIONS - Slugs verified from Excel file (ca.store.bambulab.com)
// ============================================================================
const BAMBU_PPS_PRODUCTS: Record<string, ProductConfig> = {
  "PPS-CF": {
    slug: "pps-cf",  // Verified: https://ca.store.bambulab.com/products/pps-cf
    material: "PPS-CF",
    tdsUrl: "https://store.bblcdn.com/26f4f40359484040a8660c9150a90fc0.pdf",
    nozzleTempMin: 310, nozzleTempMax: 340,
    bedTempMin: 100, bedTempMax: 120,
    dryingTempC: 120, dryingTimeHours: 10,  // Mid-range of 100-140°C and 8-12h
    netWeightG: 750,  // PPS-CF uses 750g spools (different from standard 1kg)
  },
};

// ============================================================================
// SUPPORT MATERIAL PRODUCT DEFINITIONS - Slugs verified from Excel file (ca.store.bambulab.com)
// ============================================================================
const BAMBU_SUPPORT_PRODUCTS: Record<string, ProductConfig> = {
  "PVA": {
    slug: "pva",  // Verified: https://ca.store.bambulab.com/products/pva
    material: "PVA",
    tdsUrl: "https://store.bblcdn.com/s7/default/868930e5a44944258586caa250cc8143/Bambu_PVA_Technical_Data_Sheet.pdf",
    nozzleTempMin: 220, nozzleTempMax: 250,
    bedTempMin: 35, bedTempMax: 45,
    dryingTempC: 80, dryingTimeHours: 12,
    netWeightG: 500,
  },
  "Support for PLA (New Version)": {
    slug: "support-for-pla-new",  // Verified: https://ca.store.bambulab.com/products/support-for-pla-new
    material: "Support",
    tdsUrl: "https://store.bblcdn.com/s2/default/200ef29f5cd04b20ba6c2c86f0cc3ec0/Bambus_Support_for_PLA_Technical_Data_Sheet.pdf",
    nozzleTempMin: 220, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 45,
    dryingTempC: 55, dryingTimeHours: 8,
    netWeightG: 500,
  },
  "Support for PLA/PETG": {
    slug: "support-for-pla-petg",  // Verified: https://ca.store.bambulab.com/products/support-for-pla-petg
    material: "Support",
    tdsUrl: "https://store.bblcdn.com/d09d55778d42495db121e28a3b04a4c5.pdf",
    nozzleTempMin: 190, nozzleTempMax: 220,
    bedTempMin: 35, bedTempMax: 60,
    dryingTempC: 75, dryingTimeHours: 8,
    netWeightG: 500,
  },
  "Support for ABS": {
    slug: "support-for-abs",  // Verified: https://ca.store.bambulab.com/products/support-for-abs
    material: "Support",
    tdsUrl: "https://store.bblcdn.com/4ea7b59ca78c485f828115735ed35050.pdf",
    nozzleTempMin: 240, nozzleTempMax: 270,
    bedTempMin: 80, bedTempMax: 100,
    dryingTempC: 80, dryingTimeHours: 4,
    netWeightG: 500,
  },
  "Support for PA/PET": {
    slug: "support-for-pa-pet",  // Verified: https://ca.store.bambulab.com/products/support-for-pa-pet
    material: "Support",
    tdsUrl: "https://store.bblcdn.com/7e83189be1eb4a3dab8ce9b9a7b2065a.pdf",
    nozzleTempMin: 280, nozzleTempMax: 300,
    bedTempMin: 80, bedTempMax: 110,
    dryingTempC: 80, dryingTimeHours: 12,
    netWeightG: 500,
  },
};

// ============================================================================
// UNIFIED PRODUCT MAP BY MATERIAL CATEGORY
// ============================================================================
const ALL_BAMBU_PRODUCTS: Record<string, Record<string, ProductConfig>> = {
  PLA: BAMBU_PLA_PRODUCTS,  // FIX: Removed 'as unknown as' cast since PLA now uses ProductConfig
  PETG: BAMBU_PETG_PRODUCTS,
  TPU: BAMBU_TPU_PRODUCTS,
  ABS: BAMBU_ABS_PRODUCTS,
  ASA: BAMBU_ASA_PRODUCTS,
  PA: BAMBU_PA_PRODUCTS,
  PET: BAMBU_PET_PRODUCTS,
  PC: BAMBU_PC_PRODUCTS,
  PPS: BAMBU_PPS_PRODUCTS,
  Support: BAMBU_SUPPORT_PRODUCTS,
};

// ============================================================================
// PRODUCT COLOR FALLBACKS - For products where dynamic extraction fails
// Used when color swatches are JavaScript-loaded and not captured by Firecrawl
// ============================================================================
interface ColorVariant {
  colorName: string;
  colorHex: string | null;
  colorFamily: string | null;
  imageUrl: string | null;
  variantId: string | null;
}

const PRODUCT_COLOR_FALLBACKS: Record<string, ColorVariant[]> = {
  // ============================================================================
  // PLA BASIC - 30 colors (verified from https://ca.store.bambulab.com/products/pla-basic-filament)
  // Updated with all colors from hex code table on product page
  // ============================================================================
  "pla-basic-filament": [
    { colorName: "White", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Jade White", colorHex: "#E8F5E9", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
    { colorName: "Gray", colorHex: "#808080", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Light Gray", colorHex: "#D3D3D3", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Dark Gray", colorHex: "#555555", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Blue Gray", colorHex: "#6699CC", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Charcoal", colorHex: "#36454F", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Silver", colorHex: "#C0C0C0", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Red", colorHex: "#FF0000", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "Crimson Red", colorHex: "#DC143C", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "Maroon Red", colorHex: "#800000", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "Orange", colorHex: "#FFA500", colorFamily: "Orange", imageUrl: null, variantId: null },
    { colorName: "Mandarin Orange", colorHex: "#FF8243", colorFamily: "Orange", imageUrl: null, variantId: null },
    { colorName: "Pumpkin Orange", colorHex: "#FF7518", colorFamily: "Orange", imageUrl: null, variantId: null },
    { colorName: "Yellow", colorHex: "#FFFF00", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Lemon Yellow", colorHex: "#FFF44F", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Sunflower Yellow", colorHex: "#FFDA03", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Green", colorHex: "#00FF00", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Grass Green", colorHex: "#7CFC00", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Bright Green", colorHex: "#66FF00", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Bambu Green", colorHex: "#00AE42", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Dark Green", colorHex: "#006400", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Blue", colorHex: "#0000FF", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Cobalt Blue", colorHex: "#0047AB", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Sky Blue", colorHex: "#87CEEB", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Cyan", colorHex: "#00FFFF", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Navy Blue", colorHex: "#000080", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Purple", colorHex: "#800080", colorFamily: "Purple", imageUrl: null, variantId: null },
    { colorName: "Lilac Purple", colorHex: "#C8A2C8", colorFamily: "Purple", imageUrl: null, variantId: null },
    { colorName: "Indigo Purple", colorHex: "#4B0082", colorFamily: "Purple", imageUrl: null, variantId: null },
    { colorName: "Pink", colorHex: "#FFC0CB", colorFamily: "Pink", imageUrl: null, variantId: null },
    { colorName: "Sakura Pink", colorHex: "#FFB7C5", colorFamily: "Pink", imageUrl: null, variantId: null },
    { colorName: "Hot Pink", colorHex: "#FF69B4", colorFamily: "Pink", imageUrl: null, variantId: null },
    { colorName: "Brown", colorHex: "#8B4513", colorFamily: "Brown", imageUrl: null, variantId: null },
    { colorName: "Cocoa Brown", colorHex: "#D2691E", colorFamily: "Brown", imageUrl: null, variantId: null },
    { colorName: "Beige", colorHex: "#F5F5DC", colorFamily: "Brown", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PLA BASIC GRADIENT - 8 dual-color gradient variants (from hex code table)
  // ============================================================================
  "pla-basic-gradient": [
    { colorName: "Arctic Whisper", colorHex: "#9CDBD9", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Solar Breeze", colorHex: "#E94B3C", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "Ocean to Meadow", colorHex: "#307FE2", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Cotton Candy Cloud", colorHex: "#E7C1D5", colorFamily: "Pink", imageUrl: null, variantId: null },
    { colorName: "Blueberry Bubblegum", colorHex: "#6FCAEF", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Mint Lime", colorHex: "#B6FF43", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Pink Citrus", colorHex: "#F78F77", colorFamily: "Orange", imageUrl: null, variantId: null },
    { colorName: "Dusk Glare", colorHex: "#ED9558", colorFamily: "Orange", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PLA TRANSLUCENT - 10 translucent colors (from hex code table)
  // ============================================================================
  "pla-translucent": [
    { colorName: "Teal", colorHex: "#008080", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Blue", colorHex: "#0000FF", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Orange", colorHex: "#FFA500", colorFamily: "Orange", imageUrl: null, variantId: null },
    { colorName: "Purple", colorHex: "#800080", colorFamily: "Purple", imageUrl: null, variantId: null },
    { colorName: "Red", colorHex: "#FF0000", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "Jade Green", colorHex: "#00A86B", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Mellow Yellow", colorHex: "#F8DE7E", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Pink", colorHex: "#FFC0CB", colorFamily: "Pink", imageUrl: null, variantId: null },
    { colorName: "Light Blue", colorHex: "#ADD8E6", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Lavender", colorHex: "#E6E6FA", colorFamily: "Purple", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PLA MATTE - 25 matte finish colors (verified from https://ca.store.bambulab.com/products/pla-matte)
  // Updated with all colors from hex code table on product page
  // ============================================================================
  "pla-matte": [
    { colorName: "Ivory White", colorHex: "#FFFFF0", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Jade White", colorHex: "#E8F5E9", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Lemon Yellow", colorHex: "#FFF44F", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Mandarin Orange", colorHex: "#FF8243", colorFamily: "Orange", imageUrl: null, variantId: null },
    { colorName: "Sakura Pink", colorHex: "#FFB7C5", colorFamily: "Pink", imageUrl: null, variantId: null },
    { colorName: "Lilac Purple", colorHex: "#C8A2C8", colorFamily: "Purple", imageUrl: null, variantId: null },
    { colorName: "Scarlet Red", colorHex: "#FF2400", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "Wine Red", colorHex: "#722F37", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "Dark Red", colorHex: "#8B0000", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "Grass Green", colorHex: "#7CFC00", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Light Green", colorHex: "#90EE90", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Army Green", colorHex: "#4B5320", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Dark Green", colorHex: "#006400", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Ice Blue", colorHex: "#B0E0E6", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Marine Blue", colorHex: "#00008B", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Dark Blue", colorHex: "#00008B", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Desert Tan", colorHex: "#EDC9AF", colorFamily: "Brown", imageUrl: null, variantId: null },
    { colorName: "Latte Brown", colorHex: "#967969", colorFamily: "Brown", imageUrl: null, variantId: null },
    { colorName: "Dark Brown", colorHex: "#654321", colorFamily: "Brown", imageUrl: null, variantId: null },
    { colorName: "Ash Grey", colorHex: "#B2BEB5", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Charcoal", colorHex: "#36454F", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PLA SILK - Silk-finish colors with metallic sheen
  // ============================================================================
  "pla-silk-upgrade": [
    { colorName: "Silk Red", colorHex: "#CC0000", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "Silk Blue", colorHex: "#4169E1", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Silk Green", colorHex: "#228B22", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Silk Gold", colorHex: "#FFD700", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Silk Silver", colorHex: "#C0C0C0", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Silk Pink", colorHex: "#FF69B4", colorFamily: "Pink", imageUrl: null, variantId: null },
    { colorName: "Silk Purple", colorHex: "#9370DB", colorFamily: "Purple", imageUrl: null, variantId: null },
    { colorName: "Silk Orange", colorHex: "#FF8C00", colorFamily: "Orange", imageUrl: null, variantId: null },
    { colorName: "Silk White", colorHex: "#F8F8FF", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Silk Black", colorHex: "#1A1A1A", colorFamily: "Black", imageUrl: null, variantId: null },
    { colorName: "Silk Champagne", colorHex: "#F7E7CE", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Silk Rose Gold", colorHex: "#B76E79", colorFamily: "Pink", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PLA SILK MULTI-COLOR - Multi-color silk gradient variants
  // Updated with actual gradient names from Bambu Lab's website
  // ============================================================================
  "pla-silk-multi-color": [
    { colorName: "Aurora Purple", colorHex: "#9966CC", colorFamily: "Purple", imageUrl: null, variantId: null },
    { colorName: "Dawn Radiance", colorHex: "#FFB366", colorFamily: "Orange", imageUrl: null, variantId: null },
    { colorName: "Sunset Glow", colorHex: "#FF6B35", colorFamily: "Orange", imageUrl: null, variantId: null },
    { colorName: "Ocean Twilight", colorHex: "#2E5A88", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Forest Whisper", colorHex: "#4A7C59", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Rose Dream", colorHex: "#E8A0BF", colorFamily: "Pink", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PLA SPARKLE - Glitter/sparkle effect colors
  // ============================================================================
  "pla-sparkle": [
    { colorName: "Gold", colorHex: "#FFD700", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Silver", colorHex: "#C0C0C0", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Bronze", colorHex: "#CD7F32", colorFamily: "Brown", imageUrl: null, variantId: null },
    { colorName: "Red", colorHex: "#FF0000", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "Blue", colorHex: "#0000FF", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Purple", colorHex: "#800080", colorFamily: "Purple", imageUrl: null, variantId: null },
    { colorName: "Green", colorHex: "#00FF00", colorFamily: "Green", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PLA METAL - Metallic finish colors
  // ============================================================================
  "pla-metal": [
    { colorName: "Metal Gold", colorHex: "#D4AF37", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Metal Silver", colorHex: "#AAA9AD", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Metal Bronze", colorHex: "#CD7F32", colorFamily: "Brown", imageUrl: null, variantId: null },
    { colorName: "Metal Copper", colorHex: "#B87333", colorFamily: "Brown", imageUrl: null, variantId: null },
    { colorName: "Metal Titanium", colorHex: "#878681", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Metal Iron", colorHex: "#48494B", colorFamily: "Gray", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PLA MARBLE - Marble pattern variants
  // ============================================================================
  "pla-marble": [
    { colorName: "White Marble", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Black Marble", colorHex: "#2C2C2C", colorFamily: "Black", imageUrl: null, variantId: null },
    { colorName: "Gray Marble", colorHex: "#808080", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Green Marble", colorHex: "#2E8B57", colorFamily: "Green", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PLA GALAXY - Galaxy/cosmic effect colors
  // ============================================================================
  "pla-galaxy": [
    { colorName: "Nebula", colorHex: "#5D3FD3", colorFamily: "Purple", imageUrl: null, variantId: null },
    { colorName: "Cosmic Black", colorHex: "#1E0F3C", colorFamily: "Black", imageUrl: null, variantId: null },
    { colorName: "Stardust Blue", colorHex: "#0047AB", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Galaxy Purple", colorHex: "#663399", colorFamily: "Purple", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PLA GLOW - Glow-in-the-dark colors
  // ============================================================================
  "pla-glow": [
    { colorName: "Glow Green", colorHex: "#39FF14", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Glow Blue", colorHex: "#00FFFF", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Glow Yellow", colorHex: "#FFFF00", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Glow Orange", colorHex: "#FF6600", colorFamily: "Orange", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PLA WOOD - Wood-textured PLA
  // ============================================================================
  "pla-wood": [
    { colorName: "Oak", colorHex: "#806517", colorFamily: "Brown", imageUrl: null, variantId: null },
    { colorName: "Walnut", colorHex: "#5D432C", colorFamily: "Brown", imageUrl: null, variantId: null },
    { colorName: "Bamboo", colorHex: "#E3D26F", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Cherry", colorHex: "#DE3163", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "Mahogany", colorHex: "#C04000", colorFamily: "Brown", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PLA-CF - Carbon Fiber reinforced PLA
  // ============================================================================
  "pla-cf": [
    { colorName: "Black", colorHex: "#1A1A1A", colorFamily: "Black", imageUrl: null, variantId: null },
    { colorName: "Gray", colorHex: "#4A4A4A", colorFamily: "Gray", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PLA AERO - Lightweight foaming PLA
  // ============================================================================
  "pla-aero": [
    { colorName: "White", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
    { colorName: "Gray", colorHex: "#808080", colorFamily: "Gray", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // ePLA-HS - High Speed PLA (FIX: Added missing color fallbacks)
  // ============================================================================
  "epla-hs-filament": [
    { colorName: "White", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
    { colorName: "Gray", colorHex: "#808080", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Red", colorHex: "#FF0000", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "Blue", colorHex: "#0000FF", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Green", colorHex: "#00FF00", colorFamily: "Green", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PLA IMPACT - Impact-resistant PLA (FIX: Added missing color fallbacks)
  // ============================================================================
  "pla-impact-filament": [
    { colorName: "White", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
    { colorName: "Gray", colorHex: "#808080", colorFamily: "Gray", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PLA TOUGH - Engineering-grade PLA (7 colors verified from product page)
  // Verified from: https://ca.store.bambulab.com/products/pla-tough-upgrade
  // ============================================================================
  "pla-tough-upgrade": [
    { colorName: "White", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Gray", colorHex: "#AFB1AE", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
    { colorName: "Silver", colorHex: "#959698", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Yellow", colorHex: "#F4D53F", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Cyan", colorHex: "#009BD8", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Red", colorHex: "#E02928", colorFamily: "Red", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // ABS PRODUCT COLOR FALLBACKS
  // ============================================================================
  
  // ABS - 12 colors from hex code table on product page
  // Verified from: https://ca.store.bambulab.com/products/abs-filament
  "abs-filament": [
    { colorName: "White", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
    { colorName: "Silver", colorHex: "#87909A", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Red", colorHex: "#D32941", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "Orange", colorHex: "#FF6A13", colorFamily: "Orange", imageUrl: null, variantId: null },
    { colorName: "Olive", colorHex: "#789D4A", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Bambu Green", colorHex: "#00AE42", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Azure", colorHex: "#489FDF", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Blue", colorHex: "#0A2CA5", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Navy Blue", colorHex: "#0C2340", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Purple", colorHex: "#AF1685", colorFamily: "Purple", imageUrl: null, variantId: null },
    { colorName: "Tangerine Yellow", colorHex: "#FFC72C", colorFamily: "Yellow", imageUrl: null, variantId: null },
  ],
  
  // ABS-GF - colors from hex code table on product page
  "abs-gf": [
    { colorName: "White", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Gray", colorHex: "#C6C6C6", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Yellow", colorHex: "#FFE133", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Orange", colorHex: "#F48438", colorFamily: "Orange", imageUrl: null, variantId: null },
    { colorName: "Red", colorHex: "#E83100", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "Green", colorHex: "#61BF36", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Blue", colorHex: "#0C3B95", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // ASA PRODUCT COLOR FALLBACKS
  // ============================================================================
  
  // ASA - colors from hex code table on product page
  "asa-filament": [
    { colorName: "White", colorHex: "#FFFAF2", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Gray", colorHex: "#8A949E", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Red", colorHex: "#E02928", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "Green", colorHex: "#00A6A0", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Blue", colorHex: "#2140B4", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
  ],
  
  // ASA Aero - Lightweight foaming ASA (1 color)
  // Verified from: https://ca.store.bambulab.com/products/asa-aero
  "asa-aero": [
    { colorName: "White", colorHex: "#F5F1DD", colorFamily: "White", imageUrl: null, variantId: null },
  ],
  
  // ASA-CF - Carbon Fiber reinforced ASA (1 color)
  // Verified from: https://ca.store.bambulab.com/products/asa-cf
  "asa-cf": [
    { colorName: "Black", colorHex: "#1A1A1A", colorFamily: "Black", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // TPU PRODUCT COLOR FALLBACKS
  // ============================================================================
  
  // TPU 95A HF - High Flow TPU (6 colors from hex code table)
  // Verified from: https://ca.store.bambulab.com/products/tpu-95a-hf
  "tpu-95a-hf": [
    { colorName: "White", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Yellow", colorHex: "#F3E600", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Blue", colorHex: "#0072CE", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Red", colorHex: "#C8102E", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "Gray", colorHex: "#898D8D", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Black", colorHex: "#101820", colorFamily: "Black", imageUrl: null, variantId: null },
  ],
  
  // TPU 85A / TPU 90A - Soft TPU (6 colors from hex code table)
  // Verified from: https://ca.store.bambulab.com/products/tpu-85a-tpu-90a
  "tpu-85a-tpu-90a": [
    { colorName: "Light Cyan", colorHex: "#C3E2D6", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Neon Orange", colorHex: "#F68B1B", colorFamily: "Orange", imageUrl: null, variantId: null },
    { colorName: "Frozen", colorHex: "#40B6E4", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Blaze", colorHex: "#D21B3C", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "White", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
  ],
  
  // TPU for AMS - AMS-compatible TPU (7 colors from hex code table)
  // Verified from: https://ca.store.bambulab.com/products/tpu-for-ams
  "tpu-for-ams": [
    { colorName: "Red", colorHex: "#ED0000", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "Yellow", colorHex: "#F9EF41", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Blue", colorHex: "#5898DD", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Neon Green", colorHex: "#90FF1A", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "White", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Gray", colorHex: "#939393", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PETG PRODUCT COLOR FALLBACKS
  // ============================================================================
  
  // PETG HF - High Flow PETG (verified colors from Bambu Lab product page)
  // Verified from: https://ca.store.bambulab.com/products/petg-hf
  "petg-hf": [
    { colorName: "Ivory White", colorHex: "#FFFFF0", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Black", colorHex: "#1A1A1A", colorFamily: "Black", imageUrl: null, variantId: null },
    { colorName: "Gray", colorHex: "#8A949E", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Charcoal", colorHex: "#36454F", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Red", colorHex: "#E02928", colorFamily: "Red", imageUrl: null, variantId: null },
    { colorName: "Blue", colorHex: "#2140B4", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Green", colorHex: "#00A6A0", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Yellow", colorHex: "#FFE133", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Orange", colorHex: "#F48438", colorFamily: "Orange", imageUrl: null, variantId: null },
  ],
  
  // PETG Translucent - 8 colors from hex code table on product page
  "petg-translucent": [
    { colorName: "Translucent Gray", colorHex: "#8E8E8E", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Translucent Light Blue", colorHex: "#61B0FF", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Translucent Olive", colorHex: "#748C45", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Translucent Brown", colorHex: "#C9A381", colorFamily: "Brown", imageUrl: null, variantId: null },
    { colorName: "Translucent Teal", colorHex: "#77EDD7", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Translucent Orange", colorHex: "#FF911A", colorFamily: "Orange", imageUrl: null, variantId: null },
    { colorName: "Translucent Purple", colorHex: "#D6ABFF", colorFamily: "Purple", imageUrl: null, variantId: null },
    { colorName: "Translucent Pink", colorHex: "#F9C1BD", colorFamily: "Pink", imageUrl: null, variantId: null },
  ],
  
  // PETG-CF - Carbon Fiber reinforced PETG (limited colors)
  "petg-cf": [
    { colorName: "Black", colorHex: "#1A1A1A", colorFamily: "Black", imageUrl: null, variantId: null },
    { colorName: "Gray", colorHex: "#4A4A4A", colorFamily: "Gray", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PA (NYLON) PRODUCT COLOR FALLBACKS
  // ============================================================================
  
  // PAHT-CF - High Temperature PA Carbon Fiber (1 color - Black only)
  // Verified from: https://ca.store.bambulab.com/products/paht-cf
  "paht-cf": [
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
  ],
  
  // PA6-CF - PA6 Carbon Fiber (1 color - Black only)
  // Verified from: https://ca.store.bambulab.com/products/pa6-cf
  "pa6-cf": [
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
  ],
  
  // PPA-CF - PPA Carbon Fiber (1 color - Black only)
  // Verified from: https://ca.store.bambulab.com/products/ppa-cf
  "ppa-cf": [
    { colorName: "Black", colorHex: "#1A1A1A", colorFamily: "Black", imageUrl: null, variantId: null },
  ],
  
  // PA6-GF - PA6 Glass Fiber (8 colors from hex code table on product page)
  // Verified from: https://ca.store.bambulab.com/products/pa6-gf
  "pa6-gf": [
    { colorName: "White", colorHex: "#EAEAE4", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Yellow", colorHex: "#FFCE00", colorFamily: "Yellow", imageUrl: null, variantId: null },
    { colorName: "Lime", colorHex: "#C5ED48", colorFamily: "Green", imageUrl: null, variantId: null },
    { colorName: "Blue", colorHex: "#75AED8", colorFamily: "Blue", imageUrl: null, variantId: null },
    { colorName: "Orange", colorHex: "#FF4800", colorFamily: "Orange", imageUrl: null, variantId: null },
    { colorName: "Brown", colorHex: "#5B492F", colorFamily: "Brown", imageUrl: null, variantId: null },
    { colorName: "Gray", colorHex: "#353533", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PET PRODUCT COLOR FALLBACKS
  // ============================================================================
  
  // PET-CF - PET Carbon Fiber (1 color - Black only)
  // Verified from: https://ca.store.bambulab.com/products/pet-cf
  "pet-cf": [
    { colorName: "Black", colorHex: "#1A1A1A", colorFamily: "Black", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // SUPPORT MATERIAL COLOR FALLBACKS
  // ============================================================================
  
  // PVA - Water-soluble support material (1 color - Clear)
  // Verified from: https://ca.store.bambulab.com/products/pva (Hex code table shows Clear #F0F1A8)
  "pva": [
    { colorName: "Clear", colorHex: "#F0F1A8", colorFamily: "Clear", imageUrl: null, variantId: null },
  ],
  
  // Support for PLA (New Version) - 1 color (Natural/Clear)
  // Verified from: https://ca.store.bambulab.com/products/support-for-pla-new
  "support-for-pla-new": [
    { colorName: "Natural", colorHex: "#F5F5DC", colorFamily: "Clear", imageUrl: null, variantId: null },
  ],
  
  // Support for PLA/PETG - 1 color (Natural)
  // Verified from: https://ca.store.bambulab.com/products/support-for-pla-petg
  "support-for-pla-petg": [
    { colorName: "Natural", colorHex: "#FFFFF0", colorFamily: "Clear", imageUrl: null, variantId: null },
  ],
  
  // Support for ABS - 1 color (Natural)
  // Verified from: https://ca.store.bambulab.com/products/support-for-abs
  "support-for-abs": [
    { colorName: "Natural", colorHex: "#FFFFF0", colorFamily: "Clear", imageUrl: null, variantId: null },
  ],
  
  // Support for PA/PET - 1 color (Natural)
  // Verified from: https://ca.store.bambulab.com/products/support-for-pa-pet
  "support-for-pa-pet": [
    { colorName: "Natural", colorHex: "#FFFFF0", colorFamily: "Clear", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PC (POLYCARBONATE) COLOR FALLBACKS
  // ============================================================================
  
  // PC Filament - 3 colors (Transparent, Black, White)
  // Verified from: https://ca.store.bambulab.com/products/pc-filament
  "pc-filament": [
    { colorName: "Transparent", colorHex: "#E8E8E8", colorFamily: "Clear", imageUrl: null, variantId: null },
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
    { colorName: "White", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: null, variantId: null },
  ],
  
  // PC FR - 3 colors (White, Gray, Black)
  // Verified from: https://ca.store.bambulab.com/products/pc-fr (Hex code table shows exact values)
  "pc-fr": [
    { colorName: "White", colorHex: "#FFFFFF", colorFamily: "White", imageUrl: null, variantId: null },
    { colorName: "Gray", colorHex: "#A8A8AA", colorFamily: "Gray", imageUrl: null, variantId: null },
    { colorName: "Black", colorHex: "#000000", colorFamily: "Black", imageUrl: null, variantId: null },
  ],

  // ============================================================================
  // PPS (POLYPHENYLENE SULFIDE) COLOR FALLBACKS
  // ============================================================================
  
  // PPS-CF - 1 color (Black only - carbon fiber composite)
  // Verified from: https://ca.store.bambulab.com/products/pps-cf
  "pps-cf": [
    { colorName: "Black", colorHex: "#1A1A1A", colorFamily: "Black", imageUrl: null, variantId: null },
  ],
};

// ============================================================================
// COLOR HEX MAP - Comprehensive color to hex mapping
// ============================================================================
const COLOR_HEX_MAP: Record<string, string> = {
  // Basics
  'black': '#000000', 'white': '#FFFFFF', 'red': '#FF0000', 'blue': '#0000FF',
  'green': '#00FF00', 'yellow': '#FFFF00', 'orange': '#FFA500', 'purple': '#800080',
  'pink': '#FFC0CB', 'brown': '#8B4513', 'gray': '#808080', 'grey': '#808080',
  // Bambu specific
  'bambu green': '#00AE42', 'charcoal': '#36454F',
  'silver': '#C0C0C0', 'gold': '#FFD700', 'bronze': '#CD7F32', 'copper': '#B87333',
  'champagne': '#F7E7CE', 'rose gold': '#B76E79',
  
  // Bambu Lab Matte compound colors (CRITICAL - these appear in CDN image filenames)
  'ivory white': '#FFFFF0', 'ivory-white': '#FFFFF0',
  'jade white': '#E8F5E9', 'jade-white': '#E8F5E9',
  'grass green': '#7CFC00', 'grass-green': '#7CFC00',
  'ice blue': '#B0E0E6', 'ice-blue': '#B0E0E6',
  'marine blue': '#00008B', 'marine-blue': '#00008B',
  'sakura pink': '#FFB7C5', 'sakura-pink': '#FFB7C5',
  'lemon yellow': '#FFF44F', 'lemon-yellow': '#FFF44F',
  'mandarin orange': '#FF8243', 'mandarin-orange': '#FF8243',
  'lilac purple': '#C8A2C8', 'lilac-purple': '#C8A2C8',
  'scarlet red': '#FF2400', 'scarlet-red': '#FF2400',
  'dark red': '#8B0000', 'dark-red': '#8B0000',
  'dark green': '#006400', 'dark-green': '#006400',
  'dark blue': '#00008B', 'dark-blue': '#00008B',
  'dark brown': '#654321', 'dark-brown': '#654321',
  'latte brown': '#967969', 'latte-brown': '#967969',
  'desert tan': '#EDC9AF', 'desert-tan': '#EDC9AF',
  'ash grey': '#B2BEB5', 'ash-grey': '#B2BEB5', 'ash gray': '#B2BEB5',
  'wine red': '#722F37', 'wine-red': '#722F37',
  'army green': '#4B5320', 'army-green': '#4B5320',
  'light blue': '#ADD8E6', 'light-blue': '#ADD8E6',
  'light green': '#90EE90', 'light-green': '#90EE90',
  'light pink': '#FFB6C1', 'light-pink': '#FFB6C1',
  'sky blue': '#87CEEB', 'sky-blue': '#87CEEB',
  'mango yellow': '#FFBE00', 'mango-yellow': '#FFBE00',
  'matcha green': '#C4D79B', 'matcha-green': '#C4D79B',
  'burnt titanium': '#878681', 'burnt-titanium': '#878681',
  'scarlet orange': '#FF5349', 'scarlet-orange': '#FF5349',
  
  // FIX: Added missing colors found in PLA Basic/Matte/Tough product pages
  'sunflower yellow': '#FFDA03', 'sunflower-yellow': '#FFDA03',
  'pumpkin orange': '#FF7518', 'pumpkin-orange': '#FF7518',
  'bright green': '#66FF00', 'bright-green': '#66FF00',
  'bambu-green': '#00AE42',  // Note: 'bambu green' already defined above
  'cobalt blue': '#0047AB', 'cobalt-blue': '#0047AB',
  'indigo purple': '#4B0082', 'indigo-purple': '#4B0082',
  'hot pink': '#FF69B4', 'hot-pink': '#FF69B4',
  'maroon red': '#800000', 'maroon-red': '#800000',
  'cocoa brown': '#D2691E', 'cocoa-brown': '#D2691E',
  'light gray': '#D3D3D3', 'light-gray': '#D3D3D3', 'light grey': '#D3D3D3',
  'dark gray': '#555555', 'dark-gray': '#555555', 'dark grey': '#555555',
  'blue gray': '#6699CC', 'blue-gray': '#6699CC', 'blue grey': '#6699CC',
  
  // ============================================================================
  // PLA Basic Gradient creative colors (specialty dual-color products)
  // ============================================================================
  'arctic whisper': '#9CDBD9', 'arctic-whisper': '#9CDBD9',
  'solar breeze': '#E94B3C', 'solar-breeze': '#E94B3C',
  'ocean to meadow': '#307FE2', 'ocean-to-meadow': '#307FE2',
  'cotton candy cloud': '#E7C1D5', 'cotton-candy-cloud': '#E7C1D5',
  'blueberry bubblegum': '#6FCAEF', 'blueberry-bubblegum': '#6FCAEF',
  'mint lime': '#B6FF43', 'mint-lime': '#B6FF43',
  'pink citrus': '#F78F77', 'pink-citrus': '#F78F77',
  'dusk glare': '#ED9558', 'dusk-glare': '#ED9558',
  
  // ============================================================================
  // PLA Silk Multi-Color creative colors (silk gradient variants)
  // ============================================================================
  'aurora purple': '#9966CC', 'aurora-purple': '#9966CC',
  'dawn radiance': '#FFB366', 'dawn-radiance': '#FFB366',
  'sunset glow': '#FF6B35', 'sunset-glow': '#FF6B35',
  'ocean twilight': '#2E5A88', 'ocean-twilight': '#2E5A88',
  'forest whisper': '#4A7C59', 'forest-whisper': '#4A7C59',
  'rose dream': '#E8A0BF', 'rose-dream': '#E8A0BF',
  
  // ============================================================================
  // Additional Bambu Lab colors from product pages (PLA Translucent, Galaxy, etc.)
  // ============================================================================
  'mellow yellow': '#F8DE7E', 'mellow-yellow': '#F8DE7E',
  'jade green': '#00A86B', 'jade-green': '#00A86B',
  'stardust blue': '#0047AB', 'stardust-blue': '#0047AB',
  'galaxy purple': '#663399', 'galaxy-purple': '#663399',
  'cosmic black': '#1E0F3C', 'cosmic-black': '#1E0F3C',
  'glow green': '#39FF14', 'glow-green': '#39FF14',
  'glow blue': '#00FFFF', 'glow-blue': '#00FFFF',
  'glow yellow': '#FFFF00', 'glow-yellow': '#FFFF00',
  'glow orange': '#FF6600', 'glow-orange': '#FF6600',
  'white marble': '#FFFFFF', 'white-marble': '#FFFFFF',
  'black marble': '#2C2C2C', 'black-marble': '#2C2C2C',
  'gray marble': '#808080', 'gray-marble': '#808080', 'grey marble': '#808080',
  'green marble': '#2E8B57', 'green-marble': '#2E8B57',
  'silk rose gold': '#B76E79', 'silk-rose-gold': '#B76E79',
  
  // Blues
  'navy blue': '#000080', 'navy': '#000080', 'azure': '#007FFF',
  'cobalt': '#0047AB', 'sapphire': '#0F52BA', 'midnight': '#191970',
  'teal': '#008080', 'cyan': '#00FFFF', 'aqua': '#00FFFF', 'turquoise': '#40E0D0',
  // Greens
  'olive': '#808000', 'forest green': '#228B22', 'emerald': '#50C878', 'jade': '#00A86B',
  'mint': '#98FF98', 'sage': '#9DC183', 'moss': '#8A9A5B', 'lime': '#32CD32',
  // Reds/Pinks
  'crimson': '#DC143C', 'scarlet': '#FF2400', 'maroon': '#800000', 'burgundy': '#800020',
  'wine': '#722F37', 'ruby': '#E0115F', 'cherry': '#DE3163', 'coral': '#FF7F50',
  'salmon': '#FA8072', 'rose': '#FF007F', 'magenta': '#FF00FF',
  // Yellows/Oranges
  'tangerine': '#FF9966', 'tangerine yellow': '#FFC72C', 'peach': '#FFCBA4',
  'apricot': '#FBCEB1', 'amber': '#FFBF00', 'lemon': '#FFF44F', 'mustard': '#FFDB58',
  // Purples
  'violet': '#EE82EE', 'lavender': '#E6E6FA', 'lilac': '#C8A2C8', 'plum': '#DDA0DD',
  'orchid': '#DA70D6', 'mauve': '#E0B0FF', 'grape': '#6F2DA8', 'indigo': '#4B0082',
  // Browns/Naturals
  'tan': '#D2B48C', 'beige': '#F5F5DC', 'khaki': '#C3B091', 'chocolate': '#7B3F00',
  'coffee': '#6F4E37', 'mocha': '#967969', 'espresso': '#4E312D', 'caramel': '#FFD59A',
  'wood': '#BA8C63', 'walnut': '#5D432C', 'oak': '#806517', 'bamboo': '#E3D26F',
  'ivory': '#FFFFF0',
  // Special effects
  'transparent': '#FFFFFF', 'translucent': '#FFFFFF', 'clear': '#FFFFFF',
  'glow': '#39FF14', 'glow in dark': '#39FF14',
  'rainbow': '#FF0000', 'galaxy': '#2E2D88', 'cosmic': '#1E0F3C', 'nebula': '#5D3FD3',
  'marble': '#EAEAEA', 'granite': '#676767', 'stone': '#928E85',
  // Silk variants
  'silk red': '#CC0000', 'silk blue': '#4169E1', 'silk green': '#228B22',
  'silk gold': '#FFD700', 'silk silver': '#C0C0C0', 'silk pink': '#FF69B4',
  'silk purple': '#9370DB', 'silk orange': '#FF8C00', 'silk white': '#F8F8FF',
  'silk black': '#1A1A1A', 'silk champagne': '#F7E7CE',
  // Metal variants
  'metal gold': '#D4AF37', 'metal silver': '#AAA9AD', 'metal bronze': '#CD7F32',
  'metal copper': '#B87333', 'metal titanium': '#878681', 'metal iron': '#48494B',
};

const COLOR_FAMILY_MAP: Record<string, string> = {
  'red': 'Red', 'crimson': 'Red', 'scarlet': 'Red', 'maroon': 'Red', 'burgundy': 'Red',
  'ruby': 'Red', 'cherry': 'Red', 'silk red': 'Red',
  'orange': 'Orange', 'tangerine': 'Orange', 'peach': 'Orange', 'coral': 'Orange',
  'salmon': 'Orange', 'amber': 'Orange', 'silk orange': 'Orange', 'tangerine yellow': 'Yellow',
  'yellow': 'Yellow', 'gold': 'Yellow', 'lemon': 'Yellow', 'mustard': 'Yellow',
  'silk gold': 'Yellow', 'metal gold': 'Yellow', 'champagne': 'Yellow',
  'mellow yellow': 'Yellow', 'sunflower yellow': 'Yellow',
  'green': 'Green', 'olive': 'Green', 'forest green': 'Green', 'emerald': 'Green',
  'jade': 'Green', 'mint': 'Green', 'sage': 'Green', 'moss': 'Green', 'lime': 'Green',
  'bambu green': 'Green', 'silk green': 'Green', 'jade white': 'Green', 'jade green': 'Green',
  'forest whisper': 'Green', 'mint lime': 'Green', 'ocean to meadow': 'Green',
  'blue': 'Blue', 'navy': 'Blue', 'navy blue': 'Blue', 'azure': 'Blue', 'sky blue': 'Blue',
  'cobalt': 'Blue', 'sapphire': 'Blue', 'midnight': 'Blue', 'teal': 'Blue', 'cyan': 'Blue',
  'aqua': 'Blue', 'turquoise': 'Blue', 'silk blue': 'Blue', 'stardust blue': 'Blue',
  'arctic whisper': 'Blue', 'blueberry bubblegum': 'Blue', 'ocean twilight': 'Blue',
  'purple': 'Purple', 'violet': 'Purple', 'lavender': 'Purple', 'lilac': 'Purple',
  'plum': 'Purple', 'orchid': 'Purple', 'mauve': 'Purple', 'grape': 'Purple', 'indigo': 'Purple',
  'silk purple': 'Purple', 'galaxy': 'Purple', 'cosmic': 'Purple', 'nebula': 'Purple',
  'aurora purple': 'Purple', 'galaxy purple': 'Purple',
  'pink': 'Pink', 'hot pink': 'Pink', 'rose': 'Pink', 'magenta': 'Pink',
  'silk pink': 'Pink', 'rose gold': 'Pink', 'cotton candy cloud': 'Pink', 'rose dream': 'Pink',
  'brown': 'Brown', 'tan': 'Brown', 'beige': 'Brown', 'khaki': 'Brown', 'chocolate': 'Brown',
  'coffee': 'Brown', 'mocha': 'Brown', 'espresso': 'Brown', 'caramel': 'Brown',
  'wood': 'Brown', 'walnut': 'Brown', 'oak': 'Brown', 'bamboo': 'Brown',
  'gray': 'Gray', 'grey': 'Gray', 'charcoal': 'Gray', 'silver': 'Gray',
  'silk silver': 'Gray', 'metal silver': 'Gray', 'metal titanium': 'Gray',
  'black': 'Black', 'silk black': 'Black', 'metal iron': 'Black', 'cosmic black': 'Black',
  'white': 'White', 'silk white': 'White', 'transparent': 'Clear', 'translucent': 'Clear',
  'clear': 'Clear', 'glow': 'Glow', 'glow in dark': 'Glow',
  'glow green': 'Glow', 'glow blue': 'Glow', 'glow yellow': 'Glow', 'glow orange': 'Glow',
  'rainbow': 'Rainbow', 'marble': 'Special', 'granite': 'Gray', 'stone': 'Gray',
  'white marble': 'White', 'black marble': 'Black', 'gray marble': 'Gray', 'green marble': 'Green',
  'bronze': 'Bronze', 'metal bronze': 'Bronze', 'copper': 'Copper', 'metal copper': 'Copper',
  // Gradient/creative colors - map to dominant color
  'solar breeze': 'Red', 'pink citrus': 'Orange', 'dusk glare': 'Orange',
  'dawn radiance': 'Orange', 'sunset glow': 'Orange',
};

// ============================================================================
// PRICE EXTRACTION UTILITIES
// ============================================================================
const DISCOUNT_EXCLUSION_KEYWORDS = [
  'as low as', 'low as', 'per roll', 'per spool', 'bulk', 'discount',
  '% off', 'save ', 'savings', 'bundle', 'pack of', 'multi-pack',
  'subscribe', 'subscription', 'qty', 'quantity', 'x+ items', '+ items'
];

function containsDiscountKeywords(text: string, ctx?: LogContext): boolean {
  const lowerText = text.toLowerCase();
  const hasDiscount = DISCOUNT_EXCLUSION_KEYWORDS.some(keyword => lowerText.includes(keyword));
  if (hasDiscount && ctx) {
    const matchedKeyword = DISCOUNT_EXCLUSION_KEYWORDS.find(keyword => lowerText.includes(keyword));
    logDebug(ctx, 'PRICE', `Discount keyword detected: "${matchedKeyword}"`);
  }
  return hasDiscount;
}

function extractNumericPrice(text: string, ctx?: LogContext): number | null {
  const cleaned = text.replace(/[C$A$£€¥,\s]/g, '').replace(/CA|AU|US|JP/gi, '');
  const match = cleaned.match(/(\d+\.?\d*)/);
  if (match) {
    const price = parseFloat(match[1]);
    if (!isNaN(price) && price > 0) {
      if (ctx) logDebug(ctx, 'PRICE', `Extracted numeric price: ${price} from "${text.substring(0, 50)}"`);
      return price;
    }
  }
  if (ctx) logDebug(ctx, 'PRICE', `Failed to extract price from: "${text.substring(0, 50)}"`);
  return null;
}

function extractFromJsonLd(html: string): number | null {
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '');
        const jsonData = JSON.parse(jsonContent);
        if (jsonData['@type'] === 'Product' && jsonData.offers) {
          const offers = Array.isArray(jsonData.offers) ? jsonData.offers : [jsonData.offers];
          for (const offer of offers) {
            if (offer.price) {
              const price = parseFloat(offer.price);
              if (!isNaN(price) && price > 0) return price;
            }
          }
        }
      } catch { /* Invalid JSON, continue */ }
    }
  }
  return null;
}

function extractFromMetaTags(html: string): number | null {
  const metaPriceMatch = html.match(/<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']product:price:amount["']/i);
  if (metaPriceMatch) {
    const price = parseFloat(metaPriceMatch[1]);
    if (!isNaN(price) && price > 0) return price;
  }
  return null;
}

// Extract compare-at price (original price before discount)
function extractCompareAtPrice(html: string, markdown: string, ctx?: LogContext): number | null {
  // Look for strikethrough/original price patterns
  const comparePatterns = [
    // Pattern 1: Strikethrough text with price
    /<s[^>]*>(?:\$|€|£|C\$|CA\$|A\$|¥)\s*(\d{1,3}(?:[.,]\d{2})?)<\/s>/gi,
    // Pattern 2: Compare-at-price class
    /class="[^"]*compare[-_]?at[-_]?price[^"]*"[^>]*>(?:\$|€|£|C\$|CA\$|A\$|¥)\s*(\d{1,3}(?:[.,]\d{2})?)/gi,
    // Pattern 3: Was/Original price text
    /(?:was|original|reg(?:ular)?)\s*(?:price)?[:\s]*(?:\$|€|£|C\$|CA\$|A\$|¥)\s*(\d{1,3}(?:[.,]\d{2})?)/gi,
    // Pattern 4: JSON-LD compare price
    /"compareAtPrice":\s*"?(\d+(?:\.\d{2})?)"?/i,
  ];

  for (const pattern of comparePatterns) {
    const match = pattern.exec(html);
    if (match && match[1]) {
      const price = parseFloat(match[1].replace(',', '.'));
      if (!isNaN(price) && price > 0) {
        if (ctx) logDebug(ctx, 'PRICE', `Found compare-at price: ${price}`);
        return price;
      }
    }
  }
  
  return null;
}

function extractBambuLabPrice(
  html: string, 
  markdown: string, 
  region: string, 
  material: string = 'PLA',
  ctx?: LogContext
): { price: number; compareAtPrice: number | null; source: string } | null {
  const store = BAMBU_REGIONAL_STORES[region];
  if (!store) {
    if (ctx) logWarn(ctx, 'PRICE', `Unknown region: ${region}`);
    return null;
  }

  // FIX 4: Use smart price range lookup with fallback for engineering materials
  const [minExpected, maxExpected] = getMaterialPriceRange(material, region);
  
  if (ctx) {
    logInfo(ctx, 'PRICE', `Expected ${material} price range: ${minExpected}-${maxExpected} ${store.currency}`);
    logDebug(ctx, 'PRICE', `HTML size: ${html.length} chars, Markdown size: ${markdown.length} chars`);
  }

  // Extract compare-at price once (for discount detection)
  const compareAtPrice = extractCompareAtPrice(html, markdown, ctx);

  // Strategy 1: bbl-title-1 class (Bambu Lab's main price element)
  if (ctx) logDebug(ctx, 'PRICE', 'Trying Strategy 1: bbl-title-1 class');
  const bblTitleMatch = html.match(/class="[^"]*bbl-title-1[^"]*"[^>]*>([^<]*(?:\$|€|£|¥|C\$|CA\$|A\$)[^<]*)<\/[^>]+>/i);
  if (bblTitleMatch) {
    const priceText = bblTitleMatch[1];
    if (ctx) logDebug(ctx, 'PRICE', `Strategy 1 found: "${priceText}"`);
    const matchIndex = html.indexOf(bblTitleMatch[0]);
    const context = html.substring(Math.max(0, matchIndex - 200), Math.min(html.length, matchIndex + 200));
    
    if (!containsDiscountKeywords(context, ctx)) {
      const price = extractNumericPrice(priceText, ctx);
      if (price && price >= minExpected && price <= maxExpected) {
        if (ctx) logSuccess(ctx, 'PRICE', `Strategy 1 SUCCESS: ${price} ${store.currency} (bbl-title-1)`);
        return { price, compareAtPrice, source: 'bbl-title-1' };
      } else if (price && ctx) {
        logWarn(ctx, 'PRICE', `Strategy 1 REJECTED: ${price} outside range [${minExpected}-${maxExpected}]`);
      }
    } else if (ctx) {
      logDebug(ctx, 'PRICE', 'Strategy 1 SKIPPED: discount keywords in context');
    }
  } else if (ctx) {
    logDebug(ctx, 'PRICE', 'Strategy 1: No bbl-title-1 match found');
  }

  // Strategy 2: "From $XX.XX" pattern
  if (ctx) logDebug(ctx, 'PRICE', 'Trying Strategy 2: From/Starting patterns');
  const fromPricePatterns = [
    /From\s+(?:\$|€|£|C\$|CA\$|A\$|¥)\s*(\d{1,3}(?:[.,]\d{2})?)/gi,
    /Starting\s+(?:at\s+)?(?:\$|€|£|C\$|CA\$|A\$|¥)\s*(\d{1,3}(?:[.,]\d{2})?)/gi,
  ];
  
  for (let i = 0; i < fromPricePatterns.length; i++) {
    const pattern = fromPricePatterns[i];
    const matches = [...html.matchAll(pattern)];
    if (ctx) logDebug(ctx, 'PRICE', `Strategy 2.${i+1}: Found ${matches.length} pattern matches`);
    
    for (const match of matches) {
      const fullMatch = match[0];
      const priceStr = match[1].replace(',', '.');
      const price = parseFloat(priceStr);
      
      if (ctx) logDebug(ctx, 'PRICE', `Strategy 2 candidate: "${fullMatch}" -> ${price}`);
      
      const matchIndex = html.indexOf(fullMatch);
      const context = html.substring(Math.max(0, matchIndex - 200), Math.min(html.length, matchIndex + 200));
      
      if (!containsDiscountKeywords(context, ctx) && price >= minExpected && price <= maxExpected) {
        if (ctx) logSuccess(ctx, 'PRICE', `Strategy 2 SUCCESS: ${price} ${store.currency} (from-pattern)`);
        return { price, compareAtPrice, source: 'from-pattern' };
      } else if (ctx && (price < minExpected || price > maxExpected)) {
        logDebug(ctx, 'PRICE', `Strategy 2 REJECTED: ${price} outside range [${minExpected}-${maxExpected}]`);
      }
    }
  }

  // Strategy 3: JSON-LD
  if (ctx) logDebug(ctx, 'PRICE', 'Trying Strategy 3: JSON-LD structured data');
  const jsonLdPrice = extractFromJsonLd(html);
  if (jsonLdPrice) {
    if (ctx) logDebug(ctx, 'PRICE', `Strategy 3 found JSON-LD price: ${jsonLdPrice}`);
    if (jsonLdPrice >= minExpected && jsonLdPrice <= maxExpected) {
      if (ctx) logSuccess(ctx, 'PRICE', `Strategy 3 SUCCESS: ${jsonLdPrice} ${store.currency} (json-ld)`);
      return { price: jsonLdPrice, compareAtPrice, source: 'json-ld' };
    } else if (ctx) {
      logWarn(ctx, 'PRICE', `Strategy 3 REJECTED: ${jsonLdPrice} outside range [${minExpected}-${maxExpected}]`);
    }
  } else if (ctx) {
    logDebug(ctx, 'PRICE', 'Strategy 3: No JSON-LD price found');
  }

  // Strategy 4: Meta tags
  if (ctx) logDebug(ctx, 'PRICE', 'Trying Strategy 4: Meta tags');
  const metaPrice = extractFromMetaTags(html);
  if (metaPrice) {
    if (ctx) logDebug(ctx, 'PRICE', `Strategy 4 found meta price: ${metaPrice}`);
    if (metaPrice >= minExpected && metaPrice <= maxExpected) {
      if (ctx) logSuccess(ctx, 'PRICE', `Strategy 4 SUCCESS: ${metaPrice} ${store.currency} (meta-tag)`);
      return { price: metaPrice, compareAtPrice, source: 'meta-tag' };
    } else if (ctx) {
      logWarn(ctx, 'PRICE', `Strategy 4 REJECTED: ${metaPrice} outside range [${minExpected}-${maxExpected}]`);
    }
  } else if (ctx) {
    logDebug(ctx, 'PRICE', 'Strategy 4: No meta tag price found');
  }

  // Strategy 5: Markdown "From" patterns
  if (ctx) logDebug(ctx, 'PRICE', 'Trying Strategy 5: Markdown patterns');
  const mdFromMatch = markdown.match(/From\s+(?:\$|€|£|C\$|CA\$|A\$|¥)?\s*(\d{1,3}(?:[.,]\d{2})?)/i);
  if (mdFromMatch) {
    const price = parseFloat(mdFromMatch[1].replace(',', '.'));
    if (ctx) logDebug(ctx, 'PRICE', `Strategy 5 found markdown price: ${price}`);
    if (price >= minExpected && price <= maxExpected) {
      if (ctx) logSuccess(ctx, 'PRICE', `Strategy 5 SUCCESS: ${price} ${store.currency} (markdown-from)`);
      return { price, compareAtPrice, source: 'markdown-from' };
    } else if (ctx) {
      logWarn(ctx, 'PRICE', `Strategy 5 REJECTED: ${price} outside range [${minExpected}-${maxExpected}]`);
    }
  } else if (ctx) {
    logDebug(ctx, 'PRICE', 'Strategy 5: No markdown price pattern found');
  }

  // Strategy 6: Direct "$XX.XX USD" or "€XX.XX EUR" pattern in markdown (Bambu Lab specific)
  // This catches the clear price display like "$19.99 USD" near the product title
  if (ctx) logDebug(ctx, 'PRICE', 'Trying Strategy 6: Direct currency+amount+code pattern');
  const directPricePatterns = [
    /(?<!\w)(\$)(\d{1,3}(?:\.\d{2})?)\s*USD(?!\s*(?:per|\/|each))/gi,  // $19.99 USD (not per roll)
    /(?<!\w)(€)(\d{1,3}(?:[.,]\d{2})?)\s*EUR(?!\s*(?:per|\/|each))/gi,  // €18.99 EUR
    /(?<!\w)(£)(\d{1,3}(?:\.\d{2})?)\s*GBP(?!\s*(?:per|\/|each))/gi,  // £16.99 GBP
    /(?<!\w)(C\$|CA\$)(\d{1,3}(?:\.\d{2})?)\s*CAD(?!\s*(?:per|\/|each))/gi,  // C$24.99 CAD
    /(?<!\w)(A\$)(\d{1,3}(?:\.\d{2})?)\s*AUD(?!\s*(?:per|\/|each))/gi,  // A$29.99 AUD
    /(?<!\w)(¥)(\d{1,5})\s*JPY(?!\s*(?:per|\/|each))/gi,  // ¥2999 JPY
  ];
  
  for (const pattern of directPricePatterns) {
    const matches = [...markdown.matchAll(pattern)];
    for (const priceMatch of matches) {
      const priceStr = priceMatch[2].replace(',', '.');
      const price = parseFloat(priceStr);
      
      if (ctx) logDebug(ctx, 'PRICE', `Strategy 6 candidate: "${priceMatch[0]}" -> ${price}`);
      
      // Check context around this match - reject if near discount keywords
      const matchIndex = markdown.indexOf(priceMatch[0]);
      const context = markdown.substring(Math.max(0, matchIndex - 100), Math.min(markdown.length, matchIndex + 100));
      
      if (!containsDiscountKeywords(context, ctx) && price >= minExpected && price <= maxExpected) {
        if (ctx) logSuccess(ctx, 'PRICE', `Strategy 6 SUCCESS: ${price} ${store.currency} (direct-currency-code)`);
        return { price, compareAtPrice, source: 'direct-currency-code' };
      }
    }
  }
  if (ctx) logDebug(ctx, 'PRICE', 'Strategy 6: No direct currency+code pattern matched');

  if (ctx) {
    logWarn(ctx, 'PRICE', `ALL STRATEGIES FAILED for ${material} in ${region}`, {
      htmlHasCurrency: html.includes('$') || html.includes('€') || html.includes('£'),
      markdownHasCurrency: markdown.includes('$') || markdown.includes('€') || markdown.includes('£'),
      htmlSample: html.substring(0, 500),
    });
  }
  return null;
}

// ============================================================================
// COLOR VARIANT EXTRACTION
// Note: ColorVariant interface is defined at line 559, no duplicate needed
// ============================================================================

// ============================================================================
// MATERIAL ISSUE TRACKING
// ============================================================================
interface MaterialIssues {
  missingPrices: string[];
  missingColors: string[];
  missingImages: string[];
  invalidColorNames: string[];
}

function logMaterialIssues(material: string, issues: MaterialIssues, ctx?: LogContext): void {
  const hasIssues = issues.missingPrices.length > 0 || 
                    issues.missingColors.length > 0 || 
                    issues.missingImages.length > 0 ||
                    issues.invalidColorNames.length > 0;
  
  console.log(`\n=== ${material} ISSUES SUMMARY ===`);
  
  if (issues.missingPrices.length > 0) {
    console.log(`❌ Missing Prices (${issues.missingPrices.length}): ${issues.missingPrices.slice(0, 10).join(', ')}${issues.missingPrices.length > 10 ? '...' : ''}`);
  }
  if (issues.missingColors.length > 0) {
    console.log(`❌ Missing Color Hex (${issues.missingColors.length}): ${issues.missingColors.slice(0, 10).join(', ')}${issues.missingColors.length > 10 ? '...' : ''}`);
  }
  if (issues.missingImages.length > 0) {
    console.log(`⚠️ Missing Images (${issues.missingImages.length}): ${issues.missingImages.slice(0, 10).join(', ')}${issues.missingImages.length > 10 ? '...' : ''}`);
  }
  if (issues.invalidColorNames.length > 0) {
    console.log(`🚫 Filtered Invalid Colors (${issues.invalidColorNames.length}): ${issues.invalidColorNames.slice(0, 10).join(', ')}${issues.invalidColorNames.length > 10 ? '...' : ''}`);
  }
  
  if (!hasIssues) {
    console.log(`✅ No critical issues`);
  }
  console.log(`=================================\n`);
}

// ============================================================================
// NON-COLOR BLOCKLIST - UI elements that should NEVER be treated as colors
// ============================================================================
const NON_COLOR_BLOCKLIST = [
  // UI elements from Bambu Lab website
  /hex\s*code/i,
  /\bdisplay\b/i,  // FIX: Added word boundary to prevent false positives
  /suggest\s*one/i,
  /can'?t\s*find/i,
  /automatic\s*material/i,
  /\bprinting\b/i,  // FIX: Added word boundary
  /^\s*ams\s*$/i,
  /material\s*system/i,
  /select\s*color/i,
  /choose\s*color/i,
  /color\s*options?/i,
  /variant\s*options?/i,
  /add\s*to\s*cart/i,
  /buy\s*now/i,
  /out\s*of\s*stock/i,
  /in\s*stock/i,
  /\bavailable\b/i,  // FIX: Added word boundary to prevent blocking colors like "Available Blue"
  /\bunavailable\b/i,  // FIX: Added word boundary
  /notify\s*me/i,
  /sold\s*out/i,
  /coming\s*soon/i,
  /\bquantity\b/i,  // FIX: Added word boundary
  /^\s*qty\s*$/i,
  /\breview\b/i,  // FIX: Added word boundary
  /\brating\b/i,  // FIX: Added word boundary
  /\bdescription\b/i,  // FIX: Added word boundary
  /\bspecification\b/i,  // FIX: Added word boundary
  /\bdetails\b/i,  // FIX: Added word boundary to prevent blocking "Details Red" type colors
  /\bfeatures\b/i,  // FIX: Added word boundary
  // Navigation/UI
  /\bhome\b/i,  // FIX: Added word boundary
  /^\s*back\s*$/i,  // FIX: Made more specific to only match standalone "back"
  /^\s*next\s*$/i,  // FIX: Made more specific
  /^\s*previous\s*$/i,  // FIX: Made more specific
  /^\s*see\s*all\s*$/i,
  /view\s*more/i,
  /show\s*more/i,
  /^\s*less\s*$/i,  // FIX: Made more specific
  /^\s*more\s*$/i,  // FIX: Made more specific
  /^\s*close\s*$/i,  // FIX: Made more specific
  /^\s*open\s*$/i,  // FIX: Made more specific
  // Form field artifacts
  /^\s*[\d\(\)\-\+]+\s*$/,  // Just numbers/parens/dashes
  /^\s*[\\\/\-\?\!\.\,\*\#\@]+\s*$/,  // Just punctuation
  /^\s*$/,  // Empty or whitespace only
  // Size/weight/dimension
  /^\s*\d+\s*(g|kg|mm|cm|m)\s*$/i,
  /^\s*1\.75\s*mm?\s*$/i,
  /^\s*2\.85\s*mm?\s*$/i,
  
  // ============================================================================
  // MARKETING PHRASES - Common phrases extracted from multi-color product pages
  // ============================================================================
  /captivating/i,
  /silk[-\s]*like/i,
  /\bappearance\b/i,
  /dynamic\s*effects?/i,
  /with\s*dynamic/i,
  /transformations?/i,
  /gradients?\s*that/i,
  /vibrant\s*and/i,
  /lustrous/i,
  /iridescent/i,
  /multi[-\s]*tonal/i,
  /color\s*shift/i,
  /shimmering/i,
  /eye[-\s]*catching/i,
  /stunning/i,
  /gorgeous/i,
  /beautiful\s*prints?/i,
  /premium\s*quality/i,
  /high[-\s]*quality/i,
];

/**
 * Check if a string matches any blocklist pattern
 */
function isBlockedColorName(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;
  if (trimmed.length > 50) return true; // Colors shouldn't be this long
  
  return NON_COLOR_BLOCKLIST.some(pattern => pattern.test(trimmed));
}

// ============================================================================
// FIX: CamelCase splitting and UUID stripping for CDN image filename parsing
// These helpers extract color names from filenames like "SunflowerYellow.jpg"
// or "light_gray_25c0c41d-107b-4d05-96d1-3de1efb728d9.jpg"
// ============================================================================

/**
 * Split CamelCase strings into space-separated words
 * e.g., "SunflowerYellow" -> "Sunflower Yellow"
 * e.g., "MaroonRed" -> "Maroon Red"
 * e.g., "PLABasic" -> "PLA Basic"
 */
function splitCamelCase(str: string): string {
  return str
    // Insert space before uppercase letters that follow lowercase letters
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Handle consecutive uppercase followed by uppercase+lowercase (e.g., "PLABasic" -> "PLA Basic")
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

/**
 * Strip UUID patterns from filenames
 * e.g., "light_gray_25c0c41d-107b-4d05-96d1-3de1efb728d9" -> "light_gray"
 * e.g., "PLA-Basic_Black_e33768fd-c87a-4b2d-a3f7-0b3afc81f13f" -> "PLA-Basic_Black"
 */
function stripUUID(filename: string): string {
  // Remove UUID patterns like "_25c0c41d-107b-4d05-96d1-3de1efb728d9" or "-25c0c41d..."
  return filename.replace(/[-_][a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '');
}

/**
 * Clean Bambu-specific color codes like "Red (33200)" -> "Red"
 */
function cleanColorName(rawColor: string): string {
  let cleaned = rawColor.trim();
  
  // Remove Bambu color codes like (33200), (65500), etc.
  cleaned = cleaned.replace(/\s*\(\d+\)\s*$/g, '');
  
  // Remove leading/trailing punctuation
  cleaned = cleaned.replace(/^[\-\.\,\:\;]+|[\-\.\,\:\;]+$/g, '');
  
  return cleaned.trim();
}

function extractColorVariantsFromHtml(html: string, markdown: string, ctx?: LogContext): { variants: ColorVariant[]; invalidFiltered: string[] } {
  const variants: ColorVariant[] = [];
  const seenColors = new Set<string>();
  const invalidFiltered: string[] = [];
  const patternStats = { p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, blocked: 0 };

  if (ctx) logDebug(ctx, 'COLORS', `Starting color extraction from HTML (${html.length} chars) and Markdown (${markdown.length} chars)`);

  const addColorIfValid = (rawColorName: string, source: string, imageUrl?: string, variantId?: string) => {
    // First clean the color name
    const colorName = cleanColorName(rawColorName);
    
    // Check blocklist
    if (isBlockedColorName(colorName)) {
      invalidFiltered.push(rawColorName);
      patternStats.blocked++;
      if (ctx) logDebug(ctx, 'COLORS', `BLOCKED (${source}): "${rawColorName}" -> cleaned: "${colorName}"`);
      return false;
    }
    
    const normalizedKey = colorName.toLowerCase();
    if (seenColors.has(normalizedKey)) {
      return false; // Already seen
    }
    
    // Validate it looks like a color (skip validation for trusted sources like fallbacks)
    // For trusted sources, we've already verified the color is valid
    if (source !== 'fallback' && !isColorName(colorName)) {
      invalidFiltered.push(rawColorName);
      patternStats.blocked++;
      if (ctx) logDebug(ctx, 'COLORS', `NOT A COLOR (${source}): "${rawColorName}"`);
      return false;
    }
    
    seenColors.add(normalizedKey);
    const colorInfo = extractColorInfo(colorName);
    variants.push({
      ...colorInfo,
      imageUrl: imageUrl || null,
      variantId: variantId || null,
    });
    return true;
  };

  // Pattern 1: Look for color swatches with data attributes
  const swatchPattern = /data-(?:color|variant|option)=["']([^"']+)["']/gi;
  let match;
  while ((match = swatchPattern.exec(html)) !== null) {
    if (addColorIfValid(match[1], 'data-attr')) {
      patternStats.p1++;
      if (ctx) logDebug(ctx, 'COLORS', `Pattern 1 (data-attr): Found "${cleanColorName(match[1])}"`);
    }
  }

  // Pattern 2: Look for color names in markdown color sections
  const colorSectionPattern = /(?:Color|Colour|Variant)s?[:\s]*([^\n]+)/gi;
  while ((match = colorSectionPattern.exec(markdown)) !== null) {
    const colorLine = match[1];
    const colors = colorLine.split(/[,|]/);
    for (const color of colors) {
      if (addColorIfValid(color, 'markdown')) {
        patternStats.p2++;
        if (ctx) logDebug(ctx, 'COLORS', `Pattern 2 (markdown): Found "${cleanColorName(color)}"`);
      }
    }
  }

  // Pattern 3: Look for Bambu Lab CDN image URLs with color names
  // Enhanced with CamelCase splitting and UUID stripping for better color extraction
  // Examples: "SunflowerYellow.jpg" -> "Sunflower Yellow"
  //           "light_gray_25c0c41d-107b-4d05-96d1-3de1efb728d9.jpg" -> "Light Gray"
  const imagePattern = /store\.bblcdn\.com[^"'\s]+\/([A-Za-z0-9_-]+)\.(?:png|jpg|jpeg)/gi;
  while ((match = imagePattern.exec(html)) !== null) {
    let filename = match[1]; // e.g., "PLA-Matte_Ivory-White" or "SunflowerYellow"
    let colorName = '';
    
    // Step 1: Strip UUID patterns from filename first
    filename = stripUUID(filename);
    
    // Step 2: Apply CamelCase splitting for filenames like "SunflowerYellow"
    filename = splitCamelCase(filename);
    
    // Strategy 1: If filename contains underscore, take everything after last underscore
    // e.g., "PLA-Matte_Ivory-White" -> "Ivory-White" -> "Ivory White"
    if (filename.includes('_')) {
      const parts = filename.split('_');
      colorName = parts[parts.length - 1].replace(/-/g, ' ');
    } 
    // Strategy 2: For filenames like "Matte-Lemon-Yellow", extract color after the product type
    else if (filename.toLowerCase().includes('matte-') || filename.toLowerCase().includes('basic-') || 
             filename.toLowerCase().includes('silk-') || filename.toLowerCase().includes('sparkle-') ||
             filename.toLowerCase().includes('tough-') || filename.toLowerCase().includes('translucent-')) {
      // Match pattern: ProductType-Color-Name (e.g., Matte-Lemon-Yellow)
      const productTypeMatch = filename.match(/^(?:PLA-?)?(?:Matte|Basic|Silk|Sparkle|Metal|Galaxy|Glow|Marble|Tough|Wood|Translucent)-(.+)$/i);
      if (productTypeMatch) {
        colorName = productTypeMatch[1].replace(/-/g, ' ');
      } else {
        // Fallback: take everything after first dash that starts with a capital
        const colorMatch = filename.match(/-([A-Z][a-z]+-?[A-Z]?[a-z]*(?:-[A-Z][a-z]+)*)$/);
        if (colorMatch) {
          colorName = colorMatch[1].replace(/-/g, ' ');
        }
      }
    }
    // Strategy 3: Simple case - CamelCase already split, or just the color name with dashes
    else {
      colorName = filename.replace(/-/g, ' ').replace(/_/g, ' ');
      // Try to extract just the color part (last 1-3 words that look like colors)
      const words = colorName.split(' ').filter(w => w.length > 0);
      if (words.length > 2) {
        // Take last 2-3 words if they look like a compound color
        const lastTwo = words.slice(-2).join(' ').toLowerCase();
        const lastThree = words.slice(-3).join(' ').toLowerCase();
        if (COLOR_HEX_MAP[lastThree]) {
          colorName = words.slice(-3).join(' ');
        } else if (COLOR_HEX_MAP[lastTwo]) {
          colorName = words.slice(-2).join(' ');
        } else {
          // Check if the last two words form a valid color (even if not in map)
          const lastTwoWords = words.slice(-2).join(' ');
          if (lastTwoWords.length >= 3 && isColorName(lastTwoWords)) {
            colorName = lastTwoWords;
          } else {
            colorName = words[words.length - 1]; // Fallback to last word
          }
        }
      }
    }
    
    if (colorName && colorName.length > 1) {
      const fullMatch = match[0];
      const imageUrl = fullMatch.startsWith('http') ? fullMatch : `https://${fullMatch}`;
      if (ctx) logDebug(ctx, 'COLORS', `Pattern 3 parsing: "${match[1]}" -> cleaned: "${filename}" -> color: "${colorName}"`);
      if (addColorIfValid(colorName, 'CDN-image', imageUrl)) {
        patternStats.p3++;
        if (ctx) logDebug(ctx, 'COLORS', `Pattern 3 (CDN image): Found "${cleanColorName(colorName)}" from image`);
      }
    }
  }

  // Pattern 4: Look for variant option values in script tags
  const scriptPattern = /"option\d*":\s*"([^"]+)"/gi;
  while ((match = scriptPattern.exec(html)) !== null) {
    if (addColorIfValid(match[1], 'script-option')) {
      patternStats.p4++;
      if (ctx) logDebug(ctx, 'COLORS', `Pattern 4 (script option): Found "${cleanColorName(match[1])}"`);
    }
  }

  // Pattern 5: Look for Shopify variant data
  const variantDataPattern = /"title":"([^"]+)"[^}]*"id":(\d+)/gi;
  while ((match = variantDataPattern.exec(html)) !== null) {
    const variantTitle = match[1].trim();
    const variantId = match[2];
    if (addColorIfValid(variantTitle, 'shopify-variant', undefined, variantId)) {
      patternStats.p5++;
      if (ctx) logDebug(ctx, 'COLORS', `Pattern 5 (Shopify variant): Found "${cleanColorName(variantTitle)}" (id: ${variantId})`);
    }
  }

  if (ctx) {
    logInfo(ctx, 'COLORS', `Extraction complete: ${variants.length} valid colors, ${patternStats.blocked} blocked`, patternStats);
    if (variants.length > 0) {
      logDebug(ctx, 'COLORS', `Color list: ${variants.map(v => `${v.colorName}${v.colorHex ? ` (${v.colorHex})` : ''}`).join(', ')}`);
    }
  }

  return { variants, invalidFiltered };
}

function isColorName(text: string): boolean {
  const normalized = cleanColorName(text).toLowerCase().trim();
  
  // Reject empty or too short
  if (normalized.length < 2) return false;
  
  // Reject if blocked (double-check)
  if (isBlockedColorName(text)) return false;
  
  // Reject if contains non-color indicators
  if (/[\?\\\!\(\)\[\]\{\}\<\>]/.test(normalized)) return false;
  
  // Reject if it's just numbers
  if (/^\d+$/.test(normalized)) return false;
  
  // Check if it's in our color map
  if (COLOR_HEX_MAP[normalized]) return true;
  
  // Check for common color keywords (EXPANDED for Bambu Lab specialty products)
  const colorKeywords = [
    // Basic colors
    'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown',
    'gray', 'grey', 'gold', 'silver', 'bronze', 'copper', 'silk', 'matte', 'metallic',
    'navy', 'olive', 'teal', 'mint', 'coral', 'salmon', 'burgundy', 'maroon', 'crimson',
    'jade', 'emerald', 'sapphire', 'ruby', 'amber', 'ivory', 'cream', 'charcoal',
    'glow', 'galaxy', 'marble', 'rainbow', 'translucent', 'transparent', 'clear',
    'nature', 'natural', 'wood', 'walnut', 'oak', 'bamboo', 'beige', 'tan',
    'violet', 'lavender', 'lilac', 'plum', 'orchid', 'mauve', 'indigo',
    'aqua', 'cyan', 'turquoise', 'azure', 'cobalt', 'midnight',
    
    // Creative/Descriptive (Bambu Lab specialty gradient & silk products)
    'arctic', 'ocean', 'whisper', 'meadow', 'radiance', 'cloud', 'twilight',
    'dream', 'aurora', 'solar', 'breeze', 'cotton', 'candy', 'blueberry',
    'bubblegum', 'dusk', 'glare', 'citrus', 'forest', 'sunset', 'dawn',
    'stardust', 'cosmic', 'nebula', 'sparkle', 'shimmer', 'glitter',
    
    // Temperature/Texture descriptors
    'ice', 'frozen', 'warm', 'hot', 'cool', 'bright', 'pale', 'deep', 'soft',
    
    // Nature-inspired
    'sky', 'sea', 'earth', 'sun', 'moon', 'star', 'spring', 'autumn', 'winter',
    'summer', 'mellow', 'peachy', 'rose',
    
    // Food-inspired (common in filament colors)
    'latte', 'mocha', 'cocoa', 'chocolate', 'caramel', 'butter', 'cream',
    'lemon', 'lime', 'mango', 'peach', 'cherry', 'berry', 'mint',
    'pumpkin', 'mandarin', 'sunflower', 'matcha',
  ];
  
  return colorKeywords.some(kw => normalized.includes(kw));
}

function extractColorInfo(colorName: string): ColorVariant {
  const cleaned = cleanColorName(colorName);
  const normalized = cleaned.toLowerCase().trim();
  
  // Direct match
  let hex = COLOR_HEX_MAP[normalized] || null;
  let family = COLOR_FAMILY_MAP[normalized] || null;
  
  // Try partial match
  if (!hex) {
    for (const [name, hexValue] of Object.entries(COLOR_HEX_MAP)) {
      if (normalized.includes(name)) {
        hex = hexValue;
        family = COLOR_FAMILY_MAP[name] || null;
        break;
      }
    }
  }
  
  return {
    colorName: cleaned,
    colorHex: hex,
    colorFamily: family,
    imageUrl: null,
    variantId: null,
  };
}

// ============================================================================
// FIRECRAWL SCRAPING WITH RETRY LOGIC
// ============================================================================
const FIRECRAWL_MAX_RETRIES = 3;
const FIRECRAWL_BASE_DELAY_MS = 1000;
const FIRECRAWL_429_MULTIPLIER = 3; // Extended backoff for rate limits

async function scrapeWithFirecrawl(
  url: string, 
  region: string,
  ctx?: LogContext
): Promise<{ html: string; markdown: string; success: boolean; error?: string; errorCategory?: ErrorCategory; durationMs?: number }> {
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  
  if (!firecrawlKey) {
    if (ctx) logError(ctx, 'FIRECRAWL', 'No Firecrawl API key configured');
    return { html: '', markdown: '', success: false, error: 'No Firecrawl API key' };
  }

  const location = REGION_TO_FIRECRAWL_LOCATION[region];
  
  // Retry loop with exponential backoff
  for (let attempt = 0; attempt <= FIRECRAWL_MAX_RETRIES; attempt++) {
    const startTime = Date.now();
    
    if (attempt > 0) {
      const backoffDelay = FIRECRAWL_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      if (ctx) logInfo(ctx, 'FIRECRAWL', `Retry attempt ${attempt}/${FIRECRAWL_MAX_RETRIES} after ${backoffDelay}ms delay`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }

    if (ctx) {
      logInfo(ctx, 'FIRECRAWL', `Request${attempt > 0 ? ` (attempt ${attempt + 1})` : ''}: ${url}`);
      logDebug(ctx, 'FIRECRAWL', `Geo-location: ${JSON.stringify(location || { country: 'CA', languages: ['en'] })}`);
    }

    try {
      const requestBody = {
        url,
        formats: ['html', 'markdown'],
        onlyMainContent: false,
        waitFor: 10000,  // Increased to 10s for full variant/color loading on JS-heavy pages
        // Wait for color swatch elements to be rendered before returning HTML
        waitForSelector: '.product-variants-color, [data-option-name="Color"], .variant-option-values, .swatch-container, [class*="color-swatch"], [class*="variant-color"]',
        location: location || { country: 'CA', languages: ['en'] },
      };
      
      if (ctx) logDebug(ctx, 'FIRECRAWL', 'Request body', requestBody);

      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const durationMs = Date.now() - startTime;

      if (!response.ok) {
        const errText = await response.text();
        const isRateLimit = response.status === 429;
        const isServerError = response.status >= 500;
        const isRetryable = isServerError || isRateLimit;
        
        if (ctx) {
          logError(ctx, 'FIRECRAWL', `HTTP ${response.status} error after ${durationMs}ms`, { 
            status: response.status, 
            response: errText.substring(0, 500),
            retryable: isRetryable,
            isRateLimit,
            attempt: attempt + 1,
          });
        }
        
        // Only retry on server errors (5xx) or rate limits (429)
        if (isRetryable && attempt < FIRECRAWL_MAX_RETRIES) {
          // Extended backoff for rate limits (429)
          if (isRateLimit) {
            const rateLimitBackoff = FIRECRAWL_BASE_DELAY_MS * Math.pow(FIRECRAWL_429_MULTIPLIER, attempt);
            if (ctx) logWarn(ctx, 'FIRECRAWL', `Rate limited (429) - extended backoff: ${rateLimitBackoff}ms`);
            await new Promise(resolve => setTimeout(resolve, rateLimitBackoff));
          }
          continue; // Retry
        }
        
        return { 
          html: '', 
          markdown: '', 
          success: false, 
          error: `HTTP ${response.status}`, 
          errorCategory: 'firecrawl',
          durationMs 
        };
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        if (ctx) logError(ctx, 'FIRECRAWL', 'Unsuccessful response from Firecrawl', { 
          success: data.success, 
          hasData: !!data.data,
          attempt: attempt + 1,
        });
        
        // Retry unsuccessful responses
        if (attempt < FIRECRAWL_MAX_RETRIES) {
          continue;
        }
        
        return { html: '', markdown: '', success: false, error: 'Unsuccessful response', durationMs };
      }

      const htmlSize = data.data.html?.length || 0;
      const mdSize = data.data.markdown?.length || 0;
      
      if (ctx) {
        logSuccess(ctx, 'FIRECRAWL', `Response received in ${durationMs}ms${attempt > 0 ? ` (after ${attempt} retries)` : ''}`, { htmlSize, mdSize });
        if (htmlSize < 1000) {
          logWarn(ctx, 'FIRECRAWL', `Suspiciously small HTML response (${htmlSize} chars)`);
        }
      }

      return {
        html: data.data.html || '',
        markdown: data.data.markdown || '',
        success: true,
        durationMs,
      };
    } catch (error: unknown) {
      const durationMs = Date.now() - startTime;
      const errMsg = error instanceof Error ? error.message : String(error);
      
      if (ctx) logError(ctx, 'FIRECRAWL', `Exception after ${durationMs}ms: ${errMsg}`, { 
        error, 
        attempt: attempt + 1 
      });
      
      // Retry on network errors
      if (attempt < FIRECRAWL_MAX_RETRIES) {
        continue;
      }
      
      return { html: '', markdown: '', success: false, error: errMsg, durationMs };
    }
  }
  
  // Should never reach here, but TypeScript needs a return
  return { html: '', markdown: '', success: false, error: 'Max retries exceeded' };
}

async function scrapeProductPage(
  productSlug: string, 
  region: string = 'CA', 
  material: string = 'PLA',
  ctx?: LogContext
): Promise<{
  colors: ColorVariant[];
  invalidFilteredColors: string[];
  price: number | null;
  tdsUrl: string | null;
  success: boolean;
  firecrawlMs?: number;
}> {
  const store = BAMBU_REGIONAL_STORES[region];
  const url = `https://${store.subdomain}.store.bambulab.com/products/${productSlug}`;
  
  if (ctx) {
    logSeparator(ctx);
    logInfo(ctx, 'PRODUCT_SCRAPE', `Scraping product page: ${url}`);
    logDebug(ctx, 'PRODUCT_SCRAPE', `Slug: ${productSlug}, Region: ${region}, Material: ${material}`);
  }
  
  const { html, markdown, success, error, durationMs } = await scrapeWithFirecrawl(url, region, ctx);
  
  if (!success) {
    if (ctx) logError(ctx, 'PRODUCT_SCRAPE', `Failed to scrape ${productSlug}`, { error, url });
    return { colors: [], invalidFilteredColors: [], price: null, tdsUrl: null, success: false, firecrawlMs: durationMs };
  }

  // Extract colors - PREFER fallbacks for specialty products that have known color sets
  // This prevents garbage extraction for multi-color and specialty products
  if (ctx) logInfo(ctx, 'PRODUCT_SCRAPE', 'Extracting color variants...');
  
  let colors: ColorVariant[] = [];
  let invalidFilteredColors: string[] = [];
  
  // Products that should ALWAYS use fallbacks (their dynamic extraction is unreliable)
  const PREFER_FALLBACK_PRODUCTS = [
    'pla-silk-multi-color',  // Multi-color products have marketing text that gets extracted as colors
    'pla-basic-gradient',    // Gradient products have complex names
  ];
  
  const shouldPreferFallback = PREFER_FALLBACK_PRODUCTS.includes(productSlug) && PRODUCT_COLOR_FALLBACKS[productSlug];
  
  if (shouldPreferFallback) {
    // For specialty products, use fallbacks directly
    colors = PRODUCT_COLOR_FALLBACKS[productSlug];
    if (ctx) {
      logInfo(ctx, 'PRODUCT_SCRAPE', `PREFER FALLBACK for specialty product ${productSlug}: ${colors.length} colors`);
      logDebug(ctx, 'PRODUCT_SCRAPE', `Fallback colors: ${colors.map(c => c.colorName).join(', ')}`);
    }
  } else {
    // For regular products, try dynamic extraction first
    const extraction = extractColorVariantsFromHtml(html, markdown, ctx);
    colors = extraction.variants;
    invalidFilteredColors = extraction.invalidFiltered;
    
    // FIX 4: Add fallback validation logging - warn when dynamic extraction finds significantly fewer colors
    if (colors.length > 0 && PRODUCT_COLOR_FALLBACKS[productSlug] && ctx) {
      const fallbackCount = PRODUCT_COLOR_FALLBACKS[productSlug].length;
      const extractedCount = colors.length;
      const difference = fallbackCount - extractedCount;
      
      if (difference > 3) {
        logWarn(ctx, 'PRODUCT_SCRAPE', 
          `Dynamic extraction found ${extractedCount} colors, but fallback has ${fallbackCount} (missing ${difference})`,
          { product: productSlug, extracted: colors.map(c => c.colorName).slice(0, 5) }
        );
      }
    }
    
    // If no colors found, fall back to hardcoded colors
    if (colors.length === 0 && PRODUCT_COLOR_FALLBACKS[productSlug]) {
      colors = PRODUCT_COLOR_FALLBACKS[productSlug];
      if (ctx) {
        logInfo(ctx, 'PRODUCT_SCRAPE', `Using FALLBACK colors for ${productSlug}: ${colors.length} colors`);
        logDebug(ctx, 'PRODUCT_SCRAPE', `Fallback colors: ${colors.map(c => c.colorName).join(', ')}`);
      }
    }
  }
  
  if (ctx) {
    logInfo(ctx, 'PRODUCT_SCRAPE', `Found ${colors.length} valid color variants for ${productSlug}`);
    if (invalidFilteredColors.length > 0) {
      logInfo(ctx, 'PRODUCT_SCRAPE', `Filtered ${invalidFilteredColors.length} invalid colors: ${invalidFilteredColors.slice(0, 5).join(', ')}${invalidFilteredColors.length > 5 ? '...' : ''}`);
    }
  }

  // Extract price with material-specific range
  if (ctx) logInfo(ctx, 'PRODUCT_SCRAPE', 'Extracting price...');
  const priceResult = extractBambuLabPrice(html, markdown, region, material, ctx);
  const price = priceResult?.price || null;
  if (price && ctx) {
    logSuccess(ctx, 'PRODUCT_SCRAPE', `Price extracted: ${price} ${store.currency} via ${priceResult?.source}`);
  } else if (ctx) {
    logWarn(ctx, 'PRODUCT_SCRAPE', 'No valid price extracted');
  }

  // FIX 2: Extract TDS URL with multi-pattern matching using RegExp.exec()
  let tdsUrl: string | null = null;
  
  // TDS URL extraction patterns (ordered by specificity)
  // NOTE: Using RegExp (not literals with gi) so we can properly use exec() for capture groups
  const TDS_URL_PATTERNS = [
    // Pattern 1: Standard Technical_Data_Sheet naming
    new RegExp(/href=["']([^"']*Technical_Data_Sheet[^"']*\.pdf)["']/i),
    // Pattern 2: TDS abbreviation
    new RegExp(/href=["']([^"']*(?:\/|_)tds[^"']*\.pdf)["']/i),
    // Pattern 3: bblcdn.com hosted PDFs (common Bambu pattern)
    new RegExp(/href=["'](https?:\/\/(?:store\.)?bblcdn\.com\/[^"']+\.pdf)["']/i),
    // Pattern 4: Shopify CDN hosted PDFs
    new RegExp(/href=["'](https?:\/\/cdn\.shopify\.com\/[^"']+\.pdf)["']/i),
    // Pattern 5: Any PDF with technical/datasheet keywords in the URL path
    new RegExp(/href=["']([^"']*(?:technical|datasheet|data[-_]sheet|specs?)[^"']*\.pdf)["']/i),
  ];
  
  for (const pattern of TDS_URL_PATTERNS) {
    // Use exec() instead of match() for proper capture group extraction
    const tdsMatch = pattern.exec(html);
    if (tdsMatch && tdsMatch[1]) {
      tdsUrl = tdsMatch[1];
      if (!tdsUrl.startsWith('http')) {
        tdsUrl = `https://store.bblcdn.com${tdsUrl}`;
      }
      if (ctx) logInfo(ctx, 'PRODUCT_SCRAPE', `TDS URL found via pattern: ${tdsUrl}`);
      break;
    }
  }
  
  if (!tdsUrl && ctx) {
    logDebug(ctx, 'PRODUCT_SCRAPE', 'No TDS URL found in page with any pattern');
  }

  if (ctx) {
    logSuccess(ctx, 'PRODUCT_SCRAPE', `Page scrape complete`, { 
      colors: colors.length, 
      invalidFiltered: invalidFilteredColors.length,
      price, 
      hasTds: !!tdsUrl,
      firecrawlMs: durationMs 
    });
  }

  return { colors, invalidFilteredColors, price, tdsUrl, success: true, firecrawlMs: durationMs };
}

async function scrapeRegionalPrice(
  productSlug: string, 
  region: string, 
  material: string = 'PLA',
  ctx?: LogContext
): Promise<{
  price: number | null;
  compareAtPrice: number | null;
  url: string;
  firecrawlMs?: number;
}> {
  const store = BAMBU_REGIONAL_STORES[region];
  const url = `https://${store.subdomain}.store.bambulab.com/products/${productSlug}`;
  
  if (ctx) logDebug(ctx, 'REGIONAL', `Scraping regional price: ${region} -> ${url}`);
  
  const { html, markdown, success, durationMs } = await scrapeWithFirecrawl(url, region, ctx);
  
  if (!success) {
    if (ctx) logWarn(ctx, 'REGIONAL', `Failed to scrape ${region} price for ${productSlug}`);
    return { price: null, compareAtPrice: null, url, firecrawlMs: durationMs };
  }

  const priceResult = extractBambuLabPrice(html, markdown, region, material, ctx);
  if (priceResult?.price && ctx) {
    logSuccess(ctx, 'REGIONAL', `${region}: ${priceResult.price} ${store.currency}${priceResult.compareAtPrice ? ` (was ${priceResult.compareAtPrice})` : ''}`);
  }
  return { 
    price: priceResult?.price || null, 
    compareAtPrice: priceResult?.compareAtPrice || null,
    url, 
    firecrawlMs: durationMs 
  };
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================
async function upsertFilament(
  supabase: any,
  productType: string,
  colorVariant: ColorVariant,
  productConfig: ProductConfig,
  brandId: string | null,
  prices: Record<string, { price: number | null; compareAtPrice: number | null; url: string }>,
  ctx?: LogContext
): Promise<{ created: boolean; updated: boolean; error?: string; durationMs?: number }> {
  const startTime = Date.now();
  
  // FIX: Strip product type prefix from color name to avoid duplication
  // e.g., "PLA Silk" + "Silk Red" should become "Bambu Lab PLA Silk Red" not "Bambu Lab PLA Silk Silk Red"
  let displayColor = colorVariant.colorName;
  const productTypeWords = productType.split(' '); // e.g., ["PLA", "Silk"]
  
  // Helper to escape special regex characters in product type words
  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  for (const word of productTypeWords) {
    // Check if color name starts with a word from the product type (case insensitive)
    // Use escapeRegExp to safely handle special characters like "+" in "PLA+"
    const regex = new RegExp(`^${escapeRegExp(word)}\\s+`, 'i');
    if (regex.test(displayColor)) {
      displayColor = displayColor.replace(regex, '');
    }
  }
  
  const productTitle = `Bambu Lab ${productType} ${displayColor}`;
  const productId = `bambu-${productConfig.slug}-${colorVariant.colorName.toLowerCase().replace(/\s+/g, '-')}`;
  
  if (ctx) {
    logInfo(ctx, 'DB', `Upserting: ${productTitle}`);
    logDebug(ctx, 'DB', `Product ID: ${productId}`);
    logDebug(ctx, 'DB', `Color: ${colorVariant.colorName}, Hex: ${colorVariant.colorHex}, Family: ${colorVariant.colorFamily}`);
  }

  // Check if filament exists
  const checkStart = Date.now();
  const { data: existing, error: checkError } = await supabase
    .from('filaments')
    .select('id')
    .eq('product_id', productId)
    .maybeSingle();

  if (ctx) logTiming(ctx, 'DB', 'Existence check', Date.now() - checkStart);

  if (checkError) {
    if (ctx) logError(ctx, 'DB', 'Error checking existing filament', checkError);
    return { created: false, updated: false, error: checkError.message, durationMs: Date.now() - startTime };
  }

  if (ctx) logDebug(ctx, 'DB', `Existing record: ${existing ? `YES (id: ${existing.id})` : 'NO (new insert)'}`);

  const filamentData: Record<string, any> = {
    product_id: productId,
    product_title: productTitle,
    vendor: 'Bambu Lab',
    brand_id: brandId,
    material: productConfig.material,
    color_hex: colorVariant.colorHex,
    color_family: colorVariant.colorFamily,
    featured_image: colorVariant.imageUrl,
    tds_url: productConfig.tdsUrl,
    nozzle_temp_min_c: productConfig.nozzleTempMin,
    nozzle_temp_max_c: productConfig.nozzleTempMax,
    bed_temp_min_c: productConfig.bedTempMin,
    bed_temp_max_c: productConfig.bedTempMax,
    drying_temp_c: productConfig.dryingTempC,
    drying_time_hours: productConfig.dryingTimeHours,
    diameter_nominal_mm: 1.75,
    net_weight_g: productConfig.netWeightG || 1000,
    auto_created: true,
    auto_updated: true,
    last_scraped_at: new Date().toISOString(),
    sync_status: 'synced',
  };

  // Add regional prices, compare-at prices, and URLs
  const pricesSummary: string[] = [];
  for (const [region, { price, compareAtPrice, url }] of Object.entries(prices)) {
    const store = BAMBU_REGIONAL_STORES[region];
    if (store && price) {
      filamentData[store.priceField] = price;
      filamentData[store.urlField] = url;
      pricesSummary.push(`${region}:${price}`);
      
      // Save compare-at price for US region only (variant_compare_at_price column)
      if (region === 'US' && compareAtPrice) {
        filamentData['variant_compare_at_price'] = compareAtPrice;
      }
    }
  }
  
  if (ctx) {
    logDebug(ctx, 'DB', `Prices to save: ${pricesSummary.join(', ') || 'NONE'}`);
    logDebug(ctx, 'DB', `Filament data keys: ${Object.keys(filamentData).join(', ')}`);
  }

  const opStart = Date.now();
  if (existing) {
    // Update
    const { error: updateError } = await supabase
      .from('filaments')
      .update(filamentData)
      .eq('id', existing.id);

    const opDuration = Date.now() - opStart;
    const totalDuration = Date.now() - startTime;

    if (updateError) {
      if (ctx) logError(ctx, 'DB', `Update failed for ${productTitle}`, updateError);
      return { created: false, updated: false, error: updateError.message, durationMs: totalDuration };
    }
    
    if (ctx) {
      logSuccess(ctx, 'DB', `Updated: ${productTitle}`, { opDuration, totalDuration });
    }
    return { created: false, updated: true, durationMs: totalDuration };
  } else {
    // Insert
    const { error: insertError } = await supabase
      .from('filaments')
      .insert(filamentData);

    const opDuration = Date.now() - opStart;
    const totalDuration = Date.now() - startTime;

    if (insertError) {
      if (ctx) logError(ctx, 'DB', `Insert failed for ${productTitle}`, insertError);
      return { created: false, updated: false, error: insertError.message, durationMs: totalDuration };
    }
    
    if (ctx) {
      logSuccess(ctx, 'DB', `Created: ${productTitle}`, { opDuration, totalDuration });
    }
    return { created: true, updated: false, durationMs: totalDuration };
  }
}

// ============================================================================
// EDGE RUNTIME DECLARATION FOR BACKGROUND TASKS
// ============================================================================
declare const EdgeRuntime: {
  waitUntil(promise: Promise<any>): void;
};

// ============================================================================
// JOB TIMEOUT CONFIGURATION (30 minutes max)
// ============================================================================
const JOB_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

function checkJobTimeout(ctx: LogContext, jobId: string): boolean {
  const elapsed = Date.now() - ctx.startTime;
  if (elapsed > JOB_TIMEOUT_MS) {
    logError(ctx, 'TIMEOUT', `Job ${jobId} exceeded ${JOB_TIMEOUT_MS / 60000} minute timeout after ${Math.round(elapsed / 60000)} minutes`);
    return true;
  }
  return false;
}

// ============================================================================
// BACKGROUND SCRAPE FUNCTION
// ============================================================================
async function runBackgroundScrape(
  supabaseClient: any,
  jobId: string,
  selectedMaterials: string[],
  products: string[] | undefined,
  limit: number | undefined,
  dryRun: boolean | undefined,
  ctx: LogContext,
  timing: { firecrawlMs: number; dbMs: number; delayMs: number }
): Promise<void> {
  logInfo(ctx, 'BACKGROUND', `Starting background scrape for job: ${jobId} (timeout: ${JOB_TIMEOUT_MS / 60000} minutes)`);
  
  const results = {
    requestId: ctx.requestId,
    startedAt: new Date(ctx.startTime).toISOString(),
    materialsProcessed: selectedMaterials,
    productsScraped: 0,
    colorsDiscovered: 0,
    filamentsCreated: 0,
    filamentsUpdated: 0,
    errors: [] as CategorizedError[],
    productDetails: [] as any[],
    timing: {} as TimingMetrics,
  };
  
  // Progress update throttling - only update every N products or on significant events
  const PROGRESS_UPDATE_INTERVAL = 3; // Update every 3 products
  let lastProgressUpdate = 0;

  try {
    // Get Bambu Lab brand ID
    const { data: brandData } = await supabaseClient
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'bambu-lab')
      .single();
    
    const brandId = brandData?.id || null;
    
    // Calculate total products for progress tracking
    let totalProducts = 0;
    for (const materialCategory of selectedMaterials) {
      const materialProducts = ALL_BAMBU_PRODUCTS[materialCategory];
      if (materialProducts) {
        let count = Object.keys(materialProducts).length;
        if (limit && limit > 0) count = Math.min(count, limit);
        totalProducts += count;
      }
    }

    let productsProcessed = 0;

    // Process each selected material category
    for (const materialCategory of selectedMaterials) {
      const materialProducts = ALL_BAMBU_PRODUCTS[materialCategory];
      
      if (!materialProducts) {
        results.errors.push(createError('data_quality', `Unknown material category: ${materialCategory}`));
        continue;
      }

      logSeparator(ctx, `MATERIAL: ${materialCategory}`);

      // Track issues for this material
      const materialIssues: MaterialIssues = {
        missingPrices: [],
        missingColors: [],
        missingImages: [],
        invalidColorNames: [],
      };

      // Determine which products to scrape for this material
      let productsToScrape = Object.entries(materialProducts);
      
      if (products && Array.isArray(products)) {
        productsToScrape = productsToScrape.filter(([name]) => 
          products.some((p: string) => name.toLowerCase().includes(p.toLowerCase()))
        );
      }
      
      if (limit && limit > 0) {
        productsToScrape = productsToScrape.slice(0, limit);
      }

      // Process each product
      for (const [productName, productConfig] of productsToScrape) {
        // Check for job timeout at the start of each product
        if (checkJobTimeout(ctx, jobId)) {
          const timeoutError = createError('data_quality', `Job timed out after ${JOB_TIMEOUT_MS / 60000} minutes`, {
            product: productName,
            details: `Processed ${productsProcessed}/${totalProducts} products before timeout`
          });
          results.errors.push(timeoutError);
          
          // Mark job as failed due to timeout
          await supabaseClient.from('scrape_jobs').update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error: `Job exceeded ${JOB_TIMEOUT_MS / 60000} minute timeout`,
            results: { ...results, errors: results.errors.map(formatError) },
            progress: {
              currentMaterial: materialCategory,
              currentProduct: productName,
              currentRegion: null,
              productsProcessed,
              totalProducts,
              colorsDiscovered: results.colorsDiscovered,
              filamentsCreated: results.filamentsCreated,
              filamentsUpdated: results.filamentsUpdated,
              errors: results.errors.map(formatError),
            },
          }).eq('id', jobId);
          
          return; // Exit the function entirely
        }

        ctx.productName = productName;
        productsProcessed++;

        // Update job progress
        await supabaseClient.from('scrape_jobs').update({
          progress: {
            currentMaterial: materialCategory,
            currentProduct: productName,
            currentRegion: null,
            productsProcessed,
            totalProducts,
            colorsDiscovered: results.colorsDiscovered,
            filamentsCreated: results.filamentsCreated,
            filamentsUpdated: results.filamentsUpdated,
            errors: results.errors,
          },
        }).eq('id', jobId);

        // Scrape product page for colors
        const { colors, invalidFilteredColors, tdsUrl, success, firecrawlMs } = await scrapeProductPage(
          productConfig.slug, 
          'CA', 
          productConfig.material,
          { ...ctx, region: 'CA' }
        );
        
        // Track filtered invalid colors
        if (invalidFilteredColors.length > 0) {
          materialIssues.invalidColorNames.push(...invalidFilteredColors);
        }
        
        if (firecrawlMs) timing.firecrawlMs += firecrawlMs;
        
        // Use mutable array for colors
        const colorVariants = [...colors];
        
        if (!success || colorVariants.length === 0) {
          const defaultColors = productConfig.material === 'Support' || productConfig.material === 'PVA'
            ? ['White']
            : ['Black', 'White'];
          for (const colorName of defaultColors) {
            colorVariants.push(extractColorInfo(colorName));
          }
        }

        if (tdsUrl && !productConfig.tdsUrl) {
          (productConfig as any).tdsUrl = tdsUrl;
        }

        results.productsScraped++;
        results.colorsDiscovered += colorVariants.length;

        // Scrape regional prices
        const regionalPrices: Record<string, { price: number | null; compareAtPrice: number | null; url: string }> = {};
        const regions = Object.keys(BAMBU_REGIONAL_STORES);
        
        for (let i = 0; i < regions.length; i++) {
          const region = regions[i];
          ctx.region = region;
          
          // Throttled progress update - only update every PROGRESS_UPDATE_INTERVAL products
          const shouldUpdateProgress = (productsProcessed - lastProgressUpdate) >= PROGRESS_UPDATE_INTERVAL;
          if (shouldUpdateProgress) {
            await supabaseClient.from('scrape_jobs').update({
              progress: {
                currentMaterial: materialCategory,
                currentProduct: productName,
                currentRegion: region,
                productsProcessed,
                totalProducts,
                colorsDiscovered: results.colorsDiscovered,
                filamentsCreated: results.filamentsCreated,
                filamentsUpdated: results.filamentsUpdated,
                errors: results.errors.map(formatError),
              },
            }).eq('id', jobId);
            lastProgressUpdate = productsProcessed;
          }

          // Rate limit delay using config
          if (i > 0) {
            const delay = RATE_LIMIT_CONFIG.background.betweenRegions;
            const delayStart = Date.now();
            await new Promise(r => setTimeout(r, delay));
            timing.delayMs += Date.now() - delayStart;
          }
          
          const { price, compareAtPrice, url, firecrawlMs: regionFirecrawlMs } = await scrapeRegionalPrice(
            productConfig.slug, 
            region, 
            productConfig.material,
            ctx
          );
          
          if (regionFirecrawlMs) timing.firecrawlMs += regionFirecrawlMs;
          regionalPrices[region] = { price, compareAtPrice, url };
          
          // Track missing prices
          if (!price) {
            materialIssues.missingPrices.push(`${productName} (${region})`);
          }
        }
        
        ctx.region = undefined;

        // Upsert filaments (if not dry run)
        if (!dryRun) {
          for (const colorVariant of colorVariants) {
            ctx.colorName = colorVariant.colorName;
            
            // Track missing color hex
            if (!colorVariant.colorHex) {
              materialIssues.missingColors.push(`${productName} - ${colorVariant.colorName}`);
            }
            // Track missing images
            if (!colorVariant.imageUrl) {
              materialIssues.missingImages.push(`${productName} - ${colorVariant.colorName}`);
            }
            
            const result = await upsertFilament(
              supabaseClient,
              productName,
              colorVariant,
              productConfig,
              brandId,
              regionalPrices,
              ctx
            );

            if (result.durationMs) timing.dbMs += result.durationMs;
            if (result.created) results.filamentsCreated++;
            if (result.updated) results.filamentsUpdated++;
            if (result.error) {
              results.errors.push(createError('database', result.error, { product: `${productName} ${colorVariant.colorName}` }));
            }
          }
          ctx.colorName = undefined;
        }

        // Always update progress after each product (important for UI feedback)
        await supabaseClient.from('scrape_jobs').update({
          progress: {
            currentMaterial: materialCategory,
            currentProduct: productName,
            currentRegion: null,
            productsProcessed,
            totalProducts,
            colorsDiscovered: results.colorsDiscovered,
            filamentsCreated: results.filamentsCreated,
            filamentsUpdated: results.filamentsUpdated,
            errors: results.errors.map(formatError),
          },
        }).eq('id', jobId);
        lastProgressUpdate = productsProcessed;

        // Inter-product delay using config
        const productDelay = RATE_LIMIT_CONFIG.background.betweenProducts;
        const delayStart = Date.now();
        await new Promise(r => setTimeout(r, productDelay));
        timing.delayMs += Date.now() - delayStart;
      }
      
      // Log material issues summary
      logMaterialIssues(materialCategory, materialIssues, ctx);
      
      ctx.productName = undefined;
    }

    // Calculate final timing
    const totalMs = Date.now() - ctx.startTime;
    results.timing = {
      firecrawlMs: timing.firecrawlMs,
      dbMs: timing.dbMs,
      delayMs: timing.delayMs,
      totalMs,
    };

    // Mark job as completed with formatted errors for display
    const formattedErrors = results.errors.map(formatError);
    await supabaseClient.from('scrape_jobs').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      results: { ...results, errors: formattedErrors },
      progress: {
        currentMaterial: null,
        currentProduct: null,
        currentRegion: null,
        productsProcessed: results.productsScraped,
        totalProducts,
        colorsDiscovered: results.colorsDiscovered,
        filamentsCreated: results.filamentsCreated,
        filamentsUpdated: results.filamentsUpdated,
        errors: formattedErrors,
      },
    }).eq('id', jobId);

    logSuccess(ctx, 'BACKGROUND', `Job ${jobId} completed successfully`);

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logError(ctx, 'BACKGROUND', `Job ${jobId} failed`, error);
    
    await supabaseClient.from('scrape_jobs').update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      error: errMsg,
      results,
    }).eq('id', jobId);
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize logging context
  const ctx: LogContext = {
    requestId: generateRequestId(),
    startTime: Date.now(),
  };

  // Timing metrics
  const timing = {
    firecrawlMs: 0,
    dbMs: 0,
    delayMs: 0,
  };

  try {
    const { 
      materials, // Optional: which material categories to scrape e.g., ["PLA", "PETG", "TPU"]
      products,  // Optional: specific product types to scrape e.g., ["PLA Basic", "PLA Matte"]
      limit,     // Optional: limit number of products per material
      dryRun,    // Optional: don't save to DB, just scrape and report
      debug = true, // Optional: enable verbose debug logging (default: true)
      background = false, // New: run in background mode
    } = await req.json().catch(() => ({}));

    // Default to PLA only if no materials specified
    const selectedMaterials: string[] = materials && Array.isArray(materials) && materials.length > 0 
      ? materials 
      : ['PLA'];

    // Log request initialization
    logSeparator(ctx, 'BAMBU LAB UNIFIED SCRAPER');
    logInfo(ctx, 'INIT', `Request ID: ${ctx.requestId}`);
    logInfo(ctx, 'INIT', `Started at: ${new Date().toISOString()}`);
    logInfo(ctx, 'INIT', `Request params:`, { 
      materials: selectedMaterials, 
      products: products || 'ALL', 
      limit: limit || 'NONE', 
      dryRun: dryRun || false,
      background,
      debug 
    });

    // Environment check first (needed for both modes)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    if (!firecrawlKey) {
      throw new Error('Missing Firecrawl API key');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // BACKGROUND MODE: Create job and return immediately
    if (background) {
      logInfo(ctx, 'INIT', 'Background mode enabled - creating job record');
      
      // Count total products across selected materials
      let totalProducts = 0;
      for (const materialCategory of selectedMaterials) {
        const materialProducts = ALL_BAMBU_PRODUCTS[materialCategory];
        if (materialProducts) {
          totalProducts += Object.keys(materialProducts).length;
        }
      }

      // Create job record
      const { data: jobData, error: jobError } = await supabase
        .from('scrape_jobs')
        .insert({
          job_type: 'bambu_filaments',
          status: 'running',
          materials: selectedMaterials,
          products: products || [],
          request_id: ctx.requestId,
          dry_run: dryRun || false,
          started_at: new Date().toISOString(),
          progress: {
            currentMaterial: null,
            currentProduct: null,
            currentRegion: null,
            productsProcessed: 0,
            totalProducts,
            colorsDiscovered: 0,
            filamentsCreated: 0,
            filamentsUpdated: 0,
            errors: [],
          },
        })
        .select('id')
        .single();

      if (jobError) {
        logError(ctx, 'INIT', 'Failed to create job record', jobError);
        throw new Error(`Failed to create job: ${jobError.message}`);
      }

      const jobId = jobData.id;
      logInfo(ctx, 'INIT', `Created job: ${jobId}`);

      // Start background processing
      EdgeRuntime.waitUntil(runBackgroundScrape(
        supabase, 
        jobId, 
        selectedMaterials, 
        products, 
        limit, 
        dryRun, 
        ctx, 
        timing
      ));

      // Return immediately with job ID
      return new Response(JSON.stringify({
        success: true,
        background: true,
        jobId,
        message: `Background scrape started for ${selectedMaterials.join(', ')}`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SYNCHRONOUS MODE: Original behavior
    logInfo(ctx, 'INIT', 'Synchronous mode - processing inline');
    logInfo(ctx, 'INIT', 'Supabase client initialized');

    // Get Bambu Lab brand ID
    const brandStart = Date.now();
    const { data: brandData, error: brandError } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'bambu-lab')
      .single();
    
    logTiming(ctx, 'INIT', 'Brand lookup', Date.now() - brandStart);
    
    if (brandError) {
      logWarn(ctx, 'INIT', 'Brand lookup failed', brandError);
    }
    
    const brandId = brandData?.id || null;
    logInfo(ctx, 'INIT', `Brand ID: ${brandId || 'NOT FOUND (will use null)'}`);

    const results = {
      requestId: ctx.requestId,
      startedAt: new Date(ctx.startTime).toISOString(),
      materialsProcessed: selectedMaterials,
      productsScraped: 0,
      colorsDiscovered: 0,
      filamentsCreated: 0,
      filamentsUpdated: 0,
      errors: [] as string[],
      productDetails: [] as any[],
      timing: {} as TimingMetrics,
    };

    // Process each selected material category
    for (const materialCategory of selectedMaterials) {
      const materialProducts = ALL_BAMBU_PRODUCTS[materialCategory];
      
      if (!materialProducts) {
        logWarn(ctx, 'MATERIAL', `Unknown material category: ${materialCategory}`);
        results.errors.push(`Unknown material category: ${materialCategory}`);
        continue;
      }

      logSeparator(ctx, `MATERIAL: ${materialCategory}`);
      logInfo(ctx, 'MATERIAL', `Processing material category: ${materialCategory}`);
      logInfo(ctx, 'MATERIAL', `Available products: ${Object.keys(materialProducts).length}`);

      // Track issues for this material
      const materialIssues: MaterialIssues = {
        missingPrices: [],
        missingColors: [],
        missingImages: [],
        invalidColorNames: [],
      };

      // Determine which products to scrape for this material
      let productsToScrape = Object.entries(materialProducts);
      
      if (products && Array.isArray(products)) {
        productsToScrape = productsToScrape.filter(([name]) => 
          products.some((p: string) => name.toLowerCase().includes(p.toLowerCase()))
        );
        logInfo(ctx, 'MATERIAL', `Filtered to ${productsToScrape.length} products matching: ${products.join(', ')}`);
      }
      
      if (limit && limit > 0) {
        productsToScrape = productsToScrape.slice(0, limit);
        logInfo(ctx, 'MATERIAL', `Limited to first ${limit} products`);
      }

      logInfo(ctx, 'MATERIAL', `Products to scrape: ${productsToScrape.map(([name]) => name).join(', ')}`);

      // Process each product type in this material category
      let productIndex = 0;
      for (const [productName, productConfig] of productsToScrape) {
        productIndex++;
        ctx.productName = productName;
        
        logSeparator(ctx, `PRODUCT [${productIndex}/${productsToScrape.length}]: ${productName}`);
        logInfo(ctx, 'PRODUCT', `Material: ${productConfig.material}, Slug: ${productConfig.slug}`);
        logDebug(ctx, 'PRODUCT', `Config:`, {
          nozzleTemp: `${productConfig.nozzleTempMin}-${productConfig.nozzleTempMax}°C`,
          bedTemp: `${productConfig.bedTempMin}-${productConfig.bedTempMax}°C`,
          drying: `${productConfig.dryingTempC}°C for ${productConfig.dryingTimeHours}h`,
          hasTds: !!productConfig.tdsUrl,
        });

        // Step 1: Scrape product page from Canadian store to get colors
        logInfo(ctx, 'PRODUCT', 'Step 1: Scraping CA store for colors and base price');
        const productScrapeStart = Date.now();
        const { colors, invalidFilteredColors, price: caPrice, tdsUrl, success, firecrawlMs } = await scrapeProductPage(
          productConfig.slug, 
          'CA', 
          productConfig.material,
          { ...ctx, region: 'CA' }
        );
        
        // Track filtered invalid colors
        if (invalidFilteredColors.length > 0) {
          materialIssues.invalidColorNames.push(...invalidFilteredColors);
        }
        
        if (firecrawlMs) timing.firecrawlMs += firecrawlMs;
        logTiming(ctx, 'PRODUCT', 'CA product page scrape', Date.now() - productScrapeStart);
        
        // Use mutable array for colors
        const colorVariants = [...colors];
        
        if (!success || colorVariants.length === 0) {
          logWarn(ctx, 'PRODUCT', `No colors found for ${productName}, using defaults`);
          const defaultColors = productConfig.material === 'Support' || productConfig.material === 'PVA'
            ? ['White']
            : ['Black', 'White'];
          logInfo(ctx, 'PRODUCT', `Default colors: ${defaultColors.join(', ')}`);
          for (const colorName of defaultColors) {
            colorVariants.push(extractColorInfo(colorName));
          }
        }

        // Update TDS URL if found
        if (tdsUrl && !productConfig.tdsUrl) {
          logInfo(ctx, 'PRODUCT', `TDS URL discovered: ${tdsUrl}`);
          (productConfig as any).tdsUrl = tdsUrl;
        }

        results.productsScraped++;
        results.colorsDiscovered += colorVariants.length;
        
        logInfo(ctx, 'PRODUCT', `Colors discovered: ${colorVariants.length}`, colorVariants.map(c => ({
          name: c.colorName,
          hex: c.colorHex,
          family: c.colorFamily,
        })));

        const productResult = {
          productName,
          material: productConfig.material,
          slug: productConfig.slug,
          colorsFound: colorVariants.length,
          colors: colorVariants.map(c => c.colorName),
          prices: {} as Record<string, number | null>,
          timing: {
            colorScrapeMs: Date.now() - productScrapeStart,
            regionalScrapeMs: 0,
            dbUpsertMs: 0,
          },
        };

        // Step 2: Scrape regional prices
        logInfo(ctx, 'PRODUCT', 'Step 2: Scraping regional prices');
        const regionalStart = Date.now();
        const regionalPrices: Record<string, { price: number | null; compareAtPrice: number | null; url: string }> = {};
        const regions = Object.keys(BAMBU_REGIONAL_STORES);
        
        for (let i = 0; i < regions.length; i++) {
          const region = regions[i];
          ctx.region = region;
          
          // Add delay between regional scrapes using config
          if (i > 0) {
            const delay = RATE_LIMIT_CONFIG.synchronous.betweenRegions;
            logDebug(ctx, 'REGIONAL', `Rate limit delay: ${delay}ms`);
            const delayStart = Date.now();
            await new Promise(r => setTimeout(r, delay));
            timing.delayMs += Date.now() - delayStart;
          }
          
          logInfo(ctx, 'REGIONAL', `[${i+1}/${regions.length}] Scraping ${region}...`);
          const { price, compareAtPrice, url, firecrawlMs: regionFirecrawlMs } = await scrapeRegionalPrice(
            productConfig.slug, 
            region, 
            productConfig.material,
            ctx
          );
          
          if (regionFirecrawlMs) timing.firecrawlMs += regionFirecrawlMs;
          
          regionalPrices[region] = { price, compareAtPrice, url };
          productResult.prices[region] = price;
        }
        
        ctx.region = undefined;
        productResult.timing.regionalScrapeMs = Date.now() - regionalStart;
        
        // Log regional price summary
        const pricesSummary = Object.entries(regionalPrices)
          .map(([r, { price }]) => `${r}:${price ?? 'null'}`)
          .join(', ');
        logInfo(ctx, 'REGIONAL', `Price summary: ${pricesSummary}`);

        // Step 3: Upsert each color variant
        if (!dryRun) {
          logInfo(ctx, 'PRODUCT', `Step 3: Upserting ${colorVariants.length} color variants to database`);
          const dbStart = Date.now();
          
          for (let i = 0; i < colorVariants.length; i++) {
            const colorVariant = colorVariants[i];
            ctx.colorName = colorVariant.colorName;
            
            // Track missing color hex
            if (!colorVariant.colorHex) {
              materialIssues.missingColors.push(`${productName} - ${colorVariant.colorName}`);
            }
            // Track missing images
            if (!colorVariant.imageUrl) {
              materialIssues.missingImages.push(`${productName} - ${colorVariant.colorName}`);
            }
            
            logDebug(ctx, 'DB', `[${i+1}/${colorVariants.length}] Processing: ${colorVariant.colorName}`);
            
            const result = await upsertFilament(
              supabase,
              productName,
              colorVariant,
              productConfig,
              brandId,
              regionalPrices,
              ctx
            );

            if (result.durationMs) timing.dbMs += result.durationMs;
            if (result.created) results.filamentsCreated++;
            if (result.updated) results.filamentsUpdated++;
            if (result.error) {
              const errorMsg = `${productName} ${colorVariant.colorName}: ${result.error}`;
              results.errors.push(errorMsg);
              logError(ctx, 'DB', errorMsg);
            }
          }
          
          ctx.colorName = undefined;
          productResult.timing.dbUpsertMs = Date.now() - dbStart;
          logTiming(ctx, 'PRODUCT', 'Database upserts', productResult.timing.dbUpsertMs);
        } else {
          logInfo(ctx, 'PRODUCT', 'DRY RUN: Skipping database operations');
        }

        results.productDetails.push(productResult);
        
        // Log product completion
        logSuccess(ctx, 'PRODUCT', `Completed: ${productName}`, {
          colors: colorVariants.length,
          prices: Object.values(productResult.prices).filter(Boolean).length,
          created: results.filamentsCreated,
          updated: results.filamentsUpdated,
        });

        // Delay between products to respect rate limits using config
        const productDelay = RATE_LIMIT_CONFIG.synchronous.betweenProducts;
        logDebug(ctx, 'PRODUCT', `Inter-product rate limit delay: ${productDelay}ms`);
        const interProductDelayStart = Date.now();
        await new Promise(r => setTimeout(r, productDelay));
        timing.delayMs += Date.now() - interProductDelayStart;
      }
      
      // Log material issues summary
      logMaterialIssues(materialCategory, materialIssues, ctx);
      
      ctx.productName = undefined;
    }

    // Calculate final timing
    const totalMs = Date.now() - ctx.startTime;
    results.timing = {
      firecrawlMs: timing.firecrawlMs,
      dbMs: timing.dbMs,
      delayMs: timing.delayMs,
      totalMs,
    };

    // Final summary
    logSeparator(ctx, 'SCRAPE COMPLETE');
    logInfo(ctx, 'SUMMARY', `Request ID: ${ctx.requestId}`);
    logInfo(ctx, 'SUMMARY', `Duration: ${totalMs}ms (${(totalMs / 1000).toFixed(1)}s)`);
    logInfo(ctx, 'SUMMARY', `Timing breakdown:`, {
      firecrawl: `${timing.firecrawlMs}ms (${((timing.firecrawlMs / totalMs) * 100).toFixed(1)}%)`,
      database: `${timing.dbMs}ms (${((timing.dbMs / totalMs) * 100).toFixed(1)}%)`,
      delays: `${timing.delayMs}ms (${((timing.delayMs / totalMs) * 100).toFixed(1)}%)`,
    });
    logInfo(ctx, 'SUMMARY', `Materials: ${selectedMaterials.join(', ')}`);
    logInfo(ctx, 'SUMMARY', `Products scraped: ${results.productsScraped}`);
    logInfo(ctx, 'SUMMARY', `Colors discovered: ${results.colorsDiscovered}`);
    logSuccess(ctx, 'SUMMARY', `Filaments created: ${results.filamentsCreated}`);
    logSuccess(ctx, 'SUMMARY', `Filaments updated: ${results.filamentsUpdated}`);
    
    if (results.errors.length > 0) {
      logWarn(ctx, 'SUMMARY', `Errors: ${results.errors.length}`);
      results.errors.forEach((err, i) => {
        logError(ctx, 'SUMMARY', `  Error ${i+1}: ${err}`);
      });
    } else {
      logSuccess(ctx, 'SUMMARY', 'No errors encountered');
    }

    logSeparator(ctx);

    return new Response(JSON.stringify({
      success: true,
      message: `Scraped ${results.productsScraped} products across ${selectedMaterials.length} material(s), found ${results.colorsDiscovered} color variants`,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const totalMs = Date.now() - ctx.startTime;
    
    logSeparator(ctx, 'SCRAPE FAILED');
    logError(ctx, 'FATAL', `Unhandled exception after ${totalMs}ms`, error);
    
    if (error instanceof Error && error.stack) {
      logError(ctx, 'FATAL', 'Stack trace:', error.stack);
    }
    
    logSeparator(ctx);
    
    return new Response(JSON.stringify({
      success: false,
      error: errMsg,
      requestId: ctx.requestId,
      durationMs: totalMs,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

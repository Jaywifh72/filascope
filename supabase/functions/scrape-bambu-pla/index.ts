import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  ASA: {
    US: [25, 50], CA: [32, 62], UK: [22, 42], EU: [25, 50], AU: [35, 68], JP: [3500, 7000]
  },
  "PA-CF": {
    US: [35, 75], CA: [45, 95], UK: [30, 65], EU: [35, 75], AU: [50, 100], JP: [5000, 10500]
  },
  "PA-GF": {
    US: [30, 65], CA: [40, 82], UK: [28, 55], EU: [30, 65], AU: [45, 88], JP: [4500, 9000]
  },
  PC: {
    US: [28, 60], CA: [36, 78], UK: [25, 52], EU: [28, 60], AU: [40, 82], JP: [4000, 8500]
  },
  "PC-FR": {
    US: [38, 75], CA: [48, 95], UK: [34, 65], EU: [38, 75], AU: [55, 100], JP: [5500, 10500]
  },
  PVA: {
    US: [50, 100], CA: [65, 130], UK: [45, 88], EU: [50, 100], AU: [72, 138], JP: [7000, 14000]
  },
  Support: {
    US: [25, 90], CA: [32, 115], UK: [22, 78], EU: [25, 90], AU: [36, 122], JP: [3500, 12500]
  },
};

const REGION_TO_FIRECRAWL_LOCATION: Record<string, { country: string; languages: string[] }> = {
  US: { country: "US", languages: ["en"] },
  CA: { country: "CA", languages: ["en"] },
  UK: { country: "GB", languages: ["en"] },
  EU: { country: "DE", languages: ["en", "de"] },
  AU: { country: "AU", languages: ["en"] },
  JP: { country: "JP", languages: ["ja", "en"] },
};

// ============================================================================
// PLA PRODUCT DEFINITIONS - All Bambu Lab PLA types
// ============================================================================
const BAMBU_PLA_PRODUCTS: Record<string, {
  slug: string;
  material: string;
  tdsUrl: string | null;
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  dryingTempC: number;
  dryingTimeHours: number;
}> = {
  "PLA Basic": {
    slug: "pla-basic-filament",
    material: "PLA",
    tdsUrl: "https://store.bblcdn.com/s7/default/23b4cf2b83d5470bb96d19970b5f3ae8/Bambu_PLA_Basic_Technical_Data_Sheet.pdf",
    nozzleTempMin: 190, nozzleTempMax: 220,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Matte": {
    slug: "pla-matte-filament",
    material: "PLA",
    tdsUrl: "https://store.bblcdn.com/s7/default/Bambu_PLA_Matte_Technical_Data_Sheet.pdf",
    nozzleTempMin: 190, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Silk": {
    slug: "pla-silk-filament",
    material: "PLA",
    tdsUrl: "https://store.bblcdn.com/s7/default/Bambu_PLA_Silk_Technical_Data_Sheet.pdf",
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Sparkle": {
    slug: "pla-sparkle-filament",
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Metal": {
    slug: "pla-metal-filament",
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Marble": {
    slug: "pla-marble-filament",
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 190, nozzleTempMax: 220,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Galaxy": {
    slug: "pla-galaxy-filament",
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Glow": {
    slug: "pla-glow-filament",
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Wood": {
    slug: "pla-wood-filament",
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Tough": {
    slug: "pla-tough-filament",
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA-CF": {
    slug: "pla-cf-filament",
    material: "PLA-CF",
    tdsUrl: null,
    nozzleTempMin: 220, nozzleTempMax: 250,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "ePLA-HS": {
    slug: "epla-hs-filament",
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 190, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Aero": {
    slug: "pla-aero-filament",
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Impact": {
    slug: "pla-impact-filament",
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 200, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Translucent": {
    slug: "pla-translucent-filament",
    material: "PLA",
    tdsUrl: null,
    nozzleTempMin: 190, nozzleTempMax: 220,
    bedTempMin: 35, bedTempMax: 55,
    dryingTempC: 55, dryingTimeHours: 8,
  },
  "PLA Gradient": {
    slug: "pla-gradient-filament",
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

const BAMBU_PETG_PRODUCTS: Record<string, ProductConfig> = {
  "PETG Basic": {
    slug: "petg-basic-filament",
    material: "PETG",
    tdsUrl: null,
    nozzleTempMin: 220, nozzleTempMax: 260,
    bedTempMin: 70, bedTempMax: 90,
    dryingTempC: 65, dryingTimeHours: 8,
  },
  "PETG HF": {
    slug: "petg-hf",
    material: "PETG",
    tdsUrl: null,
    nozzleTempMin: 220, nozzleTempMax: 260,
    bedTempMin: 70, bedTempMax: 90,
    dryingTempC: 65, dryingTimeHours: 8,
  },
  "PETG-CF": {
    slug: "petg-cf",
    material: "PETG-CF",
    tdsUrl: null,
    nozzleTempMin: 240, nozzleTempMax: 280,
    bedTempMin: 70, bedTempMax: 90,
    dryingTempC: 65, dryingTimeHours: 8,
  },
  "PETG Translucent": {
    slug: "petg-translucent",
    material: "PETG",
    tdsUrl: null,
    nozzleTempMin: 220, nozzleTempMax: 260,
    bedTempMin: 70, bedTempMax: 90,
    dryingTempC: 65, dryingTimeHours: 8,
  },
};

// ============================================================================
// TPU PRODUCT DEFINITIONS
// ============================================================================
const BAMBU_TPU_PRODUCTS: Record<string, ProductConfig> = {
  "TPU 95A HF": {
    slug: "tpu-95a-hf",
    material: "TPU",
    tdsUrl: null,
    nozzleTempMin: 220, nozzleTempMax: 250,
    bedTempMin: 35, bedTempMax: 50,
    dryingTempC: 70, dryingTimeHours: 8,
  },
  "TPU 85A / TPU 90A": {
    slug: "tpu-85a-tpu-90a",
    material: "TPU",
    tdsUrl: null,
    nozzleTempMin: 220, nozzleTempMax: 250,
    bedTempMin: 35, bedTempMax: 50,
    dryingTempC: 70, dryingTimeHours: 8,
  },
  "TPU for AMS": {
    slug: "tpu-for-ams",
    material: "TPU",
    tdsUrl: null,
    nozzleTempMin: 220, nozzleTempMax: 250,
    bedTempMin: 35, bedTempMax: 50,
    dryingTempC: 70, dryingTimeHours: 8,
  },
};

// ============================================================================
// ABS PRODUCT DEFINITIONS
// ============================================================================
const BAMBU_ABS_PRODUCTS: Record<string, ProductConfig> = {
  "ABS": {
    slug: "abs-filament",
    material: "ABS",
    tdsUrl: "https://store.bblcdn.com/s7/default/Bambu_ABS_Technical_Data_Sheet.pdf",
    nozzleTempMin: 240, nozzleTempMax: 270,
    bedTempMin: 80, bedTempMax: 100,
    dryingTempC: 80, dryingTimeHours: 8,
  },
};

// ============================================================================
// ASA PRODUCT DEFINITIONS
// ============================================================================
const BAMBU_ASA_PRODUCTS: Record<string, ProductConfig> = {
  "ASA": {
    slug: "asa-filament",
    material: "ASA",
    tdsUrl: null,
    nozzleTempMin: 240, nozzleTempMax: 270,
    bedTempMin: 80, bedTempMax: 100,
    dryingTempC: 80, dryingTimeHours: 8,
  },
};

// ============================================================================
// PA (NYLON) PRODUCT DEFINITIONS
// ============================================================================
const BAMBU_PA_PRODUCTS: Record<string, ProductConfig> = {
  "PA6-CF": {
    slug: "pa6-cf",
    material: "PA-CF",
    tdsUrl: null,
    nozzleTempMin: 270, nozzleTempMax: 290,
    bedTempMin: 80, bedTempMax: 90,
    dryingTempC: 80, dryingTimeHours: 12,
  },
  "PAHT-CF": {
    slug: "paht-cf",
    material: "PA-CF",
    tdsUrl: null,
    nozzleTempMin: 280, nozzleTempMax: 300,
    bedTempMin: 80, bedTempMax: 90,
    dryingTempC: 80, dryingTimeHours: 12,
  },
  "PA6-GF": {
    slug: "pa6-gf",
    material: "PA-GF",
    tdsUrl: null,
    nozzleTempMin: 270, nozzleTempMax: 290,
    bedTempMin: 80, bedTempMax: 90,
    dryingTempC: 80, dryingTimeHours: 12,
  },
  "PPA-CF": {
    slug: "ppa-cf",
    material: "PA-CF",
    tdsUrl: null,
    nozzleTempMin: 290, nozzleTempMax: 320,
    bedTempMin: 90, bedTempMax: 110,
    dryingTempC: 80, dryingTimeHours: 12,
  },
};

// ============================================================================
// PC (POLYCARBONATE) PRODUCT DEFINITIONS
// ============================================================================
const BAMBU_PC_PRODUCTS: Record<string, ProductConfig> = {
  "PC": {
    slug: "pc-filament",
    material: "PC",
    tdsUrl: "https://store.bblcdn.com/a52afdccddfd448583d119587122c8c5.pdf",
    nozzleTempMin: 260, nozzleTempMax: 280,
    bedTempMin: 90, bedTempMax: 110,
    dryingTempC: 80, dryingTimeHours: 8,
  },
  "PC FR": {
    slug: "pc-fr",
    material: "PC-FR",
    tdsUrl: null,
    nozzleTempMin: 260, nozzleTempMax: 280,
    bedTempMin: 90, bedTempMax: 110,
    dryingTempC: 80, dryingTimeHours: 8,
  },
};

// ============================================================================
// SUPPORT MATERIAL PRODUCT DEFINITIONS
// ============================================================================
const BAMBU_SUPPORT_PRODUCTS: Record<string, ProductConfig> = {
  "PVA": {
    slug: "pva",
    material: "PVA",
    tdsUrl: "https://store.bblcdn.com/s7/default/868930e5a44944258586caa250cc8143/Bambu_PVA_Technical_Data_Sheet.pdf",
    nozzleTempMin: 220, nozzleTempMax: 250,
    bedTempMin: 35, bedTempMax: 45,
    dryingTempC: 80, dryingTimeHours: 12,
    netWeightG: 500,
  },
  "Support for PLA": {
    slug: "support-for-pla-new",
    material: "Support",
    tdsUrl: null,
    nozzleTempMin: 220, nozzleTempMax: 230,
    bedTempMin: 35, bedTempMax: 45,
    dryingTempC: 75, dryingTimeHours: 8,
    netWeightG: 500,
  },
  "Support for PLA/PETG": {
    slug: "support-for-pla-petg",
    material: "Support",
    tdsUrl: "https://store.bblcdn.com/d09d55778d42495db121e28a3b04a4c5.pdf",
    nozzleTempMin: 190, nozzleTempMax: 220,
    bedTempMin: 35, bedTempMax: 60,
    dryingTempC: 75, dryingTimeHours: 8,
    netWeightG: 500,
  },
  "Support for ABS": {
    slug: "support-for-abs",
    material: "Support",
    tdsUrl: "https://store.bblcdn.com/4ea7b59ca78c485f828115735ed35050.pdf",
    nozzleTempMin: 240, nozzleTempMax: 270,
    bedTempMin: 80, bedTempMax: 100,
    dryingTempC: 80, dryingTimeHours: 4,
    netWeightG: 500,
  },
  "Support for PA/PET": {
    slug: "support-for-pa-pet",
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
  PLA: BAMBU_PLA_PRODUCTS as unknown as Record<string, ProductConfig>,
  PETG: BAMBU_PETG_PRODUCTS,
  TPU: BAMBU_TPU_PRODUCTS,
  ABS: BAMBU_ABS_PRODUCTS,
  ASA: BAMBU_ASA_PRODUCTS,
  PA: BAMBU_PA_PRODUCTS,
  PC: BAMBU_PC_PRODUCTS,
  Support: BAMBU_SUPPORT_PRODUCTS,
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
  'bambu green': '#00AE42', 'jade white': '#00E5B6', 'charcoal': '#36454F',
  'silver': '#C0C0C0', 'gold': '#FFD700', 'bronze': '#CD7F32', 'copper': '#B87333',
  'champagne': '#F7E7CE', 'rose gold': '#B76E79',
  // Blues
  'navy blue': '#000080', 'navy': '#000080', 'azure': '#007FFF', 'sky blue': '#87CEEB',
  'cobalt': '#0047AB', 'sapphire': '#0F52BA', 'midnight': '#191970',
  'teal': '#008080', 'cyan': '#00FFFF', 'aqua': '#00FFFF', 'turquoise': '#40E0D0',
  // Greens
  'olive': '#808000', 'forest green': '#228B22', 'emerald': '#50C878', 'jade': '#00A86B',
  'mint': '#98FF98', 'sage': '#9DC183', 'moss': '#8A9A5B', 'lime': '#32CD32',
  // Reds/Pinks
  'crimson': '#DC143C', 'scarlet': '#FF2400', 'maroon': '#800000', 'burgundy': '#800020',
  'wine': '#722F37', 'ruby': '#E0115F', 'cherry': '#DE3163', 'coral': '#FF7F50',
  'salmon': '#FA8072', 'hot pink': '#FF69B4', 'rose': '#FF007F', 'magenta': '#FF00FF',
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
  'green': 'Green', 'olive': 'Green', 'forest green': 'Green', 'emerald': 'Green',
  'jade': 'Green', 'mint': 'Green', 'sage': 'Green', 'moss': 'Green', 'lime': 'Green',
  'bambu green': 'Green', 'silk green': 'Green', 'jade white': 'Green',
  'blue': 'Blue', 'navy': 'Blue', 'navy blue': 'Blue', 'azure': 'Blue', 'sky blue': 'Blue',
  'cobalt': 'Blue', 'sapphire': 'Blue', 'midnight': 'Blue', 'teal': 'Blue', 'cyan': 'Blue',
  'aqua': 'Blue', 'turquoise': 'Blue', 'silk blue': 'Blue',
  'purple': 'Purple', 'violet': 'Purple', 'lavender': 'Purple', 'lilac': 'Purple',
  'plum': 'Purple', 'orchid': 'Purple', 'mauve': 'Purple', 'grape': 'Purple', 'indigo': 'Purple',
  'silk purple': 'Purple', 'galaxy': 'Purple', 'cosmic': 'Purple', 'nebula': 'Purple',
  'pink': 'Pink', 'hot pink': 'Pink', 'rose': 'Pink', 'magenta': 'Pink',
  'silk pink': 'Pink', 'rose gold': 'Pink',
  'brown': 'Brown', 'tan': 'Brown', 'beige': 'Brown', 'khaki': 'Brown', 'chocolate': 'Brown',
  'coffee': 'Brown', 'mocha': 'Brown', 'espresso': 'Brown', 'caramel': 'Brown',
  'wood': 'Brown', 'walnut': 'Brown', 'oak': 'Brown', 'bamboo': 'Brown',
  'gray': 'Gray', 'grey': 'Gray', 'charcoal': 'Gray', 'silver': 'Gray',
  'silk silver': 'Gray', 'metal silver': 'Gray', 'metal titanium': 'Gray',
  'black': 'Black', 'silk black': 'Black', 'metal iron': 'Black',
  'white': 'White', 'silk white': 'White', 'transparent': 'Clear', 'translucent': 'Clear',
  'clear': 'Clear', 'glow': 'Glow', 'glow in dark': 'Glow',
  'rainbow': 'Rainbow', 'marble': 'Special', 'granite': 'Gray', 'stone': 'Gray',
  'bronze': 'Bronze', 'metal bronze': 'Bronze', 'copper': 'Copper', 'metal copper': 'Copper',
};

// ============================================================================
// PRICE EXTRACTION UTILITIES
// ============================================================================
const DISCOUNT_EXCLUSION_KEYWORDS = [
  'as low as', 'low as', 'per roll', 'per spool', 'bulk', 'discount',
  '% off', 'save ', 'savings', 'bundle', 'pack of', 'multi-pack',
  'subscribe', 'subscription', 'qty', 'quantity', 'x+ items', '+ items'
];

function containsDiscountKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return DISCOUNT_EXCLUSION_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

function extractNumericPrice(text: string): number | null {
  const cleaned = text.replace(/[C$A$£€¥,\s]/g, '').replace(/CA|AU|US|JP/gi, '');
  const match = cleaned.match(/(\d+\.?\d*)/);
  if (match) {
    const price = parseFloat(match[1]);
    if (!isNaN(price) && price > 0) return price;
  }
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

function extractBambuLabPrice(html: string, markdown: string, region: string, material: string = 'PLA'): { price: number; source: string } | null {
  const store = BAMBU_REGIONAL_STORES[region];
  if (!store) return null;

  // Get material-specific price range, fallback to PLA range
  const materialRanges = PRICE_RANGES_BY_MATERIAL[material] || PRICE_RANGES_BY_MATERIAL['PLA'];
  const [minExpected, maxExpected] = materialRanges[region] || materialRanges['US'];
  console.log(`[${region}] Expected ${material} price range: ${minExpected}-${maxExpected} ${store.currency}`);

  // Strategy 1: bbl-title-1 class (Bambu Lab's main price element)
  const bblTitleMatch = html.match(/class="[^"]*bbl-title-1[^"]*"[^>]*>([^<]*(?:\$|€|£|¥|C\$|CA\$|A\$)[^<]*)<\/[^>]+>/i);
  if (bblTitleMatch) {
    const priceText = bblTitleMatch[1];
    const matchIndex = html.indexOf(bblTitleMatch[0]);
    const context = html.substring(Math.max(0, matchIndex - 200), Math.min(html.length, matchIndex + 200));
    
    if (!containsDiscountKeywords(context)) {
      const price = extractNumericPrice(priceText);
      if (price && price >= minExpected && price <= maxExpected) {
        console.log(`[${region}] ✓ bbl-title-1 price VALID: ${price} ${store.currency}`);
        return { price, source: 'bbl-title-1' };
      }
    }
  }

  // Strategy 2: "From $XX.XX" pattern
  const fromPricePatterns = [
    /From\s+(?:\$|€|£|C\$|CA\$|A\$|¥)\s*(\d{1,3}(?:[.,]\d{2})?)/gi,
    /Starting\s+(?:at\s+)?(?:\$|€|£|C\$|CA\$|A\$|¥)\s*(\d{1,3}(?:[.,]\d{2})?)/gi,
  ];
  
  for (const pattern of fromPricePatterns) {
    const matches = [...html.matchAll(pattern)];
    for (const match of matches) {
      const fullMatch = match[0];
      const priceStr = match[1].replace(',', '.');
      const price = parseFloat(priceStr);
      
      const matchIndex = html.indexOf(fullMatch);
      const context = html.substring(Math.max(0, matchIndex - 200), Math.min(html.length, matchIndex + 200));
      
      if (!containsDiscountKeywords(context) && price >= minExpected && price <= maxExpected) {
        console.log(`[${region}] ✓ "From" price VALID: ${price} ${store.currency}`);
        return { price, source: 'from-pattern' };
      }
    }
  }

  // Strategy 3: JSON-LD
  const jsonLdPrice = extractFromJsonLd(html);
  if (jsonLdPrice && jsonLdPrice >= minExpected && jsonLdPrice <= maxExpected) {
    console.log(`[${region}] ✓ JSON-LD price VALID: ${jsonLdPrice} ${store.currency}`);
    return { price: jsonLdPrice, source: 'json-ld' };
  }

  // Strategy 4: Meta tags
  const metaPrice = extractFromMetaTags(html);
  if (metaPrice && metaPrice >= minExpected && metaPrice <= maxExpected) {
    console.log(`[${region}] ✓ Meta tag price VALID: ${metaPrice} ${store.currency}`);
    return { price: metaPrice, source: 'meta-tag' };
  }

  // Strategy 5: Markdown "From" patterns
  const mdFromMatch = markdown.match(/From\s+(?:\$|€|£|C\$|CA\$|A\$|¥)?\s*(\d{1,3}(?:[.,]\d{2})?)/i);
  if (mdFromMatch) {
    const price = parseFloat(mdFromMatch[1].replace(',', '.'));
    if (price >= minExpected && price <= maxExpected) {
      console.log(`[${region}] ✓ Markdown price VALID: ${price} ${store.currency}`);
      return { price, source: 'markdown-from' };
    }
  }

  console.warn(`[${region}] Could not extract valid price for ${material}`);
  return null;
}

// ============================================================================
// COLOR VARIANT EXTRACTION
// ============================================================================
interface ColorVariant {
  colorName: string;
  colorHex: string | null;
  colorFamily: string | null;
  imageUrl: string | null;
  variantId: string | null;
}

function extractColorVariantsFromHtml(html: string, markdown: string): ColorVariant[] {
  const variants: ColorVariant[] = [];
  const seenColors = new Set<string>();

  // Pattern 1: Look for color swatches with data attributes
  const swatchPattern = /data-(?:color|variant|option)=["']([^"']+)["']/gi;
  let match;
  while ((match = swatchPattern.exec(html)) !== null) {
    const colorName = match[1].trim();
    if (colorName && !seenColors.has(colorName.toLowerCase())) {
      seenColors.add(colorName.toLowerCase());
      variants.push(extractColorInfo(colorName));
    }
  }

  // Pattern 2: Look for color names in markdown color sections
  const colorSectionPattern = /(?:Color|Colour|Variant)s?[:\s]*([^\n]+)/gi;
  while ((match = colorSectionPattern.exec(markdown)) !== null) {
    const colorLine = match[1];
    const colors = colorLine.split(/[,|]/);
    for (const color of colors) {
      const colorName = color.trim();
      if (colorName && !seenColors.has(colorName.toLowerCase()) && colorName.length < 50) {
        seenColors.add(colorName.toLowerCase());
        variants.push(extractColorInfo(colorName));
      }
    }
  }

  // Pattern 3: Look for Bambu Lab CDN image URLs with color names
  const imagePattern = /store\.bblcdn\.com[^"'\s]+\/([A-Za-z_-]+)\.(?:png|jpg|jpeg)/gi;
  while ((match = imagePattern.exec(html)) !== null) {
    const imageName = match[1].replace(/_/g, ' ').replace(/-/g, ' ');
    // Extract color from image name (e.g., "PLA_Basic_White" -> "White")
    const parts = imageName.split(' ');
    const lastPart = parts[parts.length - 1];
    if (lastPart && !seenColors.has(lastPart.toLowerCase()) && isColorName(lastPart)) {
      seenColors.add(lastPart.toLowerCase());
      const fullMatch = match[0];
      const imageUrl = fullMatch.startsWith('http') ? fullMatch : `https://${fullMatch}`;
      variants.push({
        ...extractColorInfo(lastPart),
        imageUrl,
      });
    }
  }

  // Pattern 4: Look for variant option values in script tags
  const scriptPattern = /"option\d*":\s*"([^"]+)"/gi;
  while ((match = scriptPattern.exec(html)) !== null) {
    const optionValue = match[1].trim();
    if (optionValue && !seenColors.has(optionValue.toLowerCase()) && isColorName(optionValue)) {
      seenColors.add(optionValue.toLowerCase());
      variants.push(extractColorInfo(optionValue));
    }
  }

  // Pattern 5: Look for Shopify variant data
  const variantDataPattern = /"title":"([^"]+)"[^}]*"id":(\d+)/gi;
  while ((match = variantDataPattern.exec(html)) !== null) {
    const variantTitle = match[1].trim();
    const variantId = match[2];
    if (variantTitle && !seenColors.has(variantTitle.toLowerCase()) && isColorName(variantTitle)) {
      seenColors.add(variantTitle.toLowerCase());
      variants.push({
        ...extractColorInfo(variantTitle),
        variantId,
      });
    }
  }

  return variants;
}

function isColorName(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  
  // Check if it's in our color map
  if (COLOR_HEX_MAP[normalized]) return true;
  
  // Check for common color keywords
  const colorKeywords = [
    'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown',
    'gray', 'grey', 'gold', 'silver', 'bronze', 'copper', 'silk', 'matte', 'metallic',
    'navy', 'olive', 'teal', 'mint', 'coral', 'salmon', 'burgundy', 'maroon', 'crimson',
    'jade', 'emerald', 'sapphire', 'ruby', 'amber', 'ivory', 'cream', 'charcoal',
    'glow', 'galaxy', 'marble', 'rainbow', 'translucent', 'transparent',
  ];
  
  return colorKeywords.some(kw => normalized.includes(kw));
}

function extractColorInfo(colorName: string): ColorVariant {
  const normalized = colorName.toLowerCase().trim();
  
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
    colorName: colorName.trim(),
    colorHex: hex,
    colorFamily: family,
    imageUrl: null,
    variantId: null,
  };
}

// ============================================================================
// FIRECRAWL SCRAPING
// ============================================================================
async function scrapeWithFirecrawl(
  url: string, 
  region: string
): Promise<{ html: string; markdown: string; success: boolean; error?: string }> {
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  
  if (!firecrawlKey) {
    return { html: '', markdown: '', success: false, error: 'No Firecrawl API key' };
  }

  const location = REGION_TO_FIRECRAWL_LOCATION[region];
  console.log(`[${region}] Scraping ${url} with geo-location: ${location?.country || 'default'}`);

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['html', 'markdown'],
        onlyMainContent: false,
        waitFor: 3000,
        location: location || { country: 'CA', languages: ['en'] },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[${region}] Firecrawl error: ${response.status} - ${errText}`);
      return { html: '', markdown: '', success: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    
    if (!data.success || !data.data) {
      console.error(`[${region}] Firecrawl returned unsuccessful response`);
      return { html: '', markdown: '', success: false, error: 'Unsuccessful response' };
    }

    return {
      html: data.data.html || '',
      markdown: data.data.markdown || '',
      success: true,
    };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[${region}] Scrape error:`, error);
    return { html: '', markdown: '', success: false, error: errMsg };
  }
}

async function scrapeProductPage(productSlug: string, region: string = 'CA', material: string = 'PLA'): Promise<{
  colors: ColorVariant[];
  price: number | null;
  tdsUrl: string | null;
  success: boolean;
}> {
  const store = BAMBU_REGIONAL_STORES[region];
  const url = `https://${store.subdomain}.store.bambulab.com/products/${productSlug}`;
  
  console.log(`\n[SCRAPE] Scraping ${url}`);
  
  const { html, markdown, success, error } = await scrapeWithFirecrawl(url, region);
  
  if (!success) {
    console.error(`[SCRAPE] Failed to scrape ${productSlug}: ${error}`);
    return { colors: [], price: null, tdsUrl: null, success: false };
  }

  // Extract colors
  const colors = extractColorVariantsFromHtml(html, markdown);
  console.log(`[SCRAPE] Found ${colors.length} color variants for ${productSlug}`);

  // Extract price with material-specific range
  const priceResult = extractBambuLabPrice(html, markdown, region, material);
  const price = priceResult?.price || null;

  // Extract TDS URL
  let tdsUrl: string | null = null;
  const tdsMatch = html.match(/href=["']([^"']*Technical_Data_Sheet[^"']*\.pdf)["']/i);
  if (tdsMatch) {
    tdsUrl = tdsMatch[1];
    if (!tdsUrl.startsWith('http')) {
      tdsUrl = `https://store.bblcdn.com${tdsUrl}`;
    }
  }

  return { colors, price, tdsUrl, success: true };
}

async function scrapeRegionalPrice(productSlug: string, region: string, material: string = 'PLA'): Promise<{
  price: number | null;
  url: string;
}> {
  const store = BAMBU_REGIONAL_STORES[region];
  const url = `https://${store.subdomain}.store.bambulab.com/products/${productSlug}`;
  
  const { html, markdown, success } = await scrapeWithFirecrawl(url, region);
  
  if (!success) {
    return { price: null, url };
  }

  const priceResult = extractBambuLabPrice(html, markdown, region, material);
  return { price: priceResult?.price || null, url };
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
  prices: Record<string, { price: number | null; url: string }>,
): Promise<{ created: boolean; updated: boolean; error?: string }> {
  
  const productTitle = `Bambu Lab ${productType} ${colorVariant.colorName}`;
  const productId = `bambu-${productConfig.slug}-${colorVariant.colorName.toLowerCase().replace(/\s+/g, '-')}`;
  
  console.log(`[DB] Upserting: ${productTitle}`);

  // Check if filament exists
  const { data: existing, error: checkError } = await supabase
    .from('filaments')
    .select('id')
    .eq('product_id', productId)
    .maybeSingle();

  if (checkError) {
    console.error(`[DB] Error checking existing filament:`, checkError);
    return { created: false, updated: false, error: checkError.message };
  }

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
    net_weight_g: productConfig.netWeightG || 1000, // Support 0.5kg spools
    auto_created: true,
    auto_updated: true,
    last_scraped_at: new Date().toISOString(),
    sync_status: 'synced',
  };

  // Add regional prices and URLs
  for (const [region, { price, url }] of Object.entries(prices)) {
    const store = BAMBU_REGIONAL_STORES[region];
    if (store && price) {
      filamentData[store.priceField] = price;
      filamentData[store.urlField] = url;
    }
  }

  if (existing) {
    // Update
    const { error: updateError } = await supabase
      .from('filaments')
      .update(filamentData)
      .eq('id', existing.id);

    if (updateError) {
      console.error(`[DB] Update error:`, updateError);
      return { created: false, updated: false, error: updateError.message };
    }
    
    console.log(`[DB] Updated: ${productTitle}`);
    return { created: false, updated: true };
  } else {
    // Insert
    const { error: insertError } = await supabase
      .from('filaments')
      .insert(filamentData);

    if (insertError) {
      console.error(`[DB] Insert error:`, insertError);
      return { created: false, updated: false, error: insertError.message };
    }
    
    console.log(`[DB] Created: ${productTitle}`);
    return { created: true, updated: false };
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      materials, // Optional: which material categories to scrape e.g., ["PLA", "PETG", "TPU"]
      products,  // Optional: specific product types to scrape e.g., ["PLA Basic", "PLA Matte"]
      limit,     // Optional: limit number of products per material
      dryRun,    // Optional: don't save to DB, just scrape and report
    } = await req.json().catch(() => ({}));

    // Default to PLA only if no materials specified
    const selectedMaterials: string[] = materials && Array.isArray(materials) && materials.length > 0 
      ? materials 
      : ['PLA'];

    console.log(`\n========================================`);
    console.log(`BAMBU LAB UNIFIED SCRAPER`);
    console.log(`========================================`);
    console.log(`Materials: ${selectedMaterials.join(', ')}`);
    console.log(`Products: ${products ? products.join(', ') : 'ALL in selected materials'}`);
    console.log(`Limit: ${limit || 'NONE'}`);
    console.log(`Dry Run: ${dryRun || false}`);

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Bambu Lab brand ID
    const { data: brandData } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'bambu-lab')
      .single();
    
    const brandId = brandData?.id || null;
    console.log(`Brand ID: ${brandId || 'NOT FOUND'}`);

    const results = {
      materialsProcessed: selectedMaterials,
      productsScraped: 0,
      colorsDiscovered: 0,
      filamentsCreated: 0,
      filamentsUpdated: 0,
      errors: [] as string[],
      productDetails: [] as any[],
    };

    // Process each selected material category
    for (const materialCategory of selectedMaterials) {
      const materialProducts = ALL_BAMBU_PRODUCTS[materialCategory];
      
      if (!materialProducts) {
        console.warn(`[WARN] Unknown material category: ${materialCategory}`);
        results.errors.push(`Unknown material category: ${materialCategory}`);
        continue;
      }

      console.log(`\n========================================`);
      console.log(`MATERIAL: ${materialCategory}`);
      console.log(`========================================`);

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

      console.log(`Products to scrape: ${productsToScrape.map(([name]) => name).join(', ')}`);

      // Process each product type in this material category
      for (const [productName, productConfig] of productsToScrape) {
        console.log(`\n========================================`);
        console.log(`Processing: ${productName} (${productConfig.material})`);
        console.log(`========================================`);

        // Step 1: Scrape product page from Canadian store to get colors
        const { colors, price: caPrice, tdsUrl, success } = await scrapeProductPage(
          productConfig.slug, 
          'CA', 
          productConfig.material
        );
        
        if (!success || colors.length === 0) {
          console.log(`[${productName}] No colors found, trying with default colors`);
          // Use material-appropriate default colors
          const defaultColors = productConfig.material === 'Support' || productConfig.material === 'PVA'
            ? ['White'] // Support materials usually only have one color
            : ['Black', 'White'];
          for (const colorName of defaultColors) {
            colors.push(extractColorInfo(colorName));
          }
        }

        // Update TDS URL if found
        if (tdsUrl && !productConfig.tdsUrl) {
          (productConfig as any).tdsUrl = tdsUrl;
        }

        results.productsScraped++;
        results.colorsDiscovered += colors.length;

        const productResult = {
          productName,
          material: productConfig.material,
          slug: productConfig.slug,
          colorsFound: colors.length,
          colors: colors.map(c => c.colorName),
          prices: {} as Record<string, number | null>,
        };

        // Step 2: Scrape regional prices (for the base product)
        console.log(`\n[${productName}] Scraping regional prices...`);
        
        const regionalPrices: Record<string, { price: number | null; url: string }> = {};
        
        for (const region of Object.keys(BAMBU_REGIONAL_STORES)) {
          // Add delay between regional scrapes
          if (Object.keys(regionalPrices).length > 0) {
            await new Promise(r => setTimeout(r, 2000));
          }
          
          const { price, url } = await scrapeRegionalPrice(
            productConfig.slug, 
            region, 
            productConfig.material
          );
          regionalPrices[region] = { price, url };
          productResult.prices[region] = price;
          
          if (price) {
            console.log(`[${productName}] ${region}: ${price}`);
          }
        }

        // Step 3: Upsert each color variant
        if (!dryRun) {
          for (const colorVariant of colors) {
            const result = await upsertFilament(
              supabase,
              productName,
              colorVariant,
              productConfig,
              brandId,
              regionalPrices,
            );

            if (result.created) results.filamentsCreated++;
            if (result.updated) results.filamentsUpdated++;
            if (result.error) results.errors.push(`${productName} ${colorVariant.colorName}: ${result.error}`);
          }
        }

        results.productDetails.push(productResult);

        // Delay between products to respect rate limits
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    console.log(`\n========================================`);
    console.log(`SCRAPE COMPLETE`);
    console.log(`========================================`);
    console.log(`Materials: ${selectedMaterials.join(', ')}`);
    console.log(`Products scraped: ${results.productsScraped}`);
    console.log(`Colors discovered: ${results.colorsDiscovered}`);
    console.log(`Filaments created: ${results.filamentsCreated}`);
    console.log(`Filaments updated: ${results.filamentsUpdated}`);
    console.log(`Errors: ${results.errors.length}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Scraped ${results.productsScraped} products across ${selectedMaterials.length} material(s), found ${results.colorsDiscovered} color variants`,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Error in scrape-bambu-pla:', error);
    return new Response(JSON.stringify({
      success: false,
      error: errMsg,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

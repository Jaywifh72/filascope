/**
 * PROTO-PASTA BRAND DEFAULTS
 * 
 * Specialty filament manufacturer known for HTPLA (heat-treatable PLA),
 * metal composites, and unique specialty materials.
 * 
 * Platform: Shopify (proto-pasta.com)
 * Regional Stores: None (US only)
 * 
 * Key Features:
 * - HTPLA that can be heat-treated for higher temp resistance
 * - Metal composite filaments (Brass, Bronze, Copper, Iron, Steel)
 * - Carbon Fiber variants
 * - Electrically Conductive PLA
 */

// ============= PRINT SETTINGS =============

export interface PrintSettings {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  printSpeedMax?: number;
  requiresEnclosure?: boolean;
  isAbrasive?: boolean;
  isConductive?: boolean;
  nozzleSizeMin?: number;
  notes?: string;
}

export const PROTOPASTA_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // HTPLA Standard Lines
  'htpla-standard': {
    nozzleTempMin: 195,
    nozzleTempMax: 220,
    bedTempMin: 0,
    bedTempMax: 60,
    notes: 'No heated bed required. Glass or PEI recommended.',
  },
  'htpla-translucent': {
    nozzleTempMin: 195,
    nozzleTempMax: 220,
    bedTempMin: 0,
    bedTempMax: 60,
    notes: 'Translucent/sparkly finish. Heat treat at 110C for 10-30 min.',
  },
  'htpla-metallic': {
    nozzleTempMin: 195,
    nozzleTempMax: 220,
    bedTempMin: 0,
    bedTempMax: 60,
    notes: 'Metallic finish. Heat treat at 110C for improved properties.',
  },
  'htpla-glitter': {
    nozzleTempMin: 195,
    nozzleTempMax: 220,
    bedTempMin: 0,
    bedTempMax: 60,
    notes: 'Glitter flake finish.',
  },
  'htpla-nebula': {
    nozzleTempMin: 195,
    nozzleTempMax: 220,
    bedTempMin: 0,
    bedTempMax: 60,
    notes: 'Multicolor gradient effect.',
  },
  'htpla-matte-fiber': {
    nozzleTempMin: 195,
    nozzleTempMax: 220,
    bedTempMin: 0,
    bedTempMax: 60,
    notes: 'Matte fiber finish with subtle texture.',
  },

  // Carbon Fiber Variants
  'htpla-cf': {
    nozzleTempMin: 210,
    nozzleTempMax: 230,
    bedTempMin: 50,
    bedTempMax: 60,
    isAbrasive: true,
    nozzleSizeMin: 0.4,
    notes: 'Carbon fiber HTPLA. Use hardened nozzle 0.4mm+.',
  },
  'pla-cf': {
    nozzleTempMin: 195,
    nozzleTempMax: 220,
    bedTempMin: 50,
    bedTempMax: 60,
    isAbrasive: true,
    nozzleSizeMin: 0.4,
    notes: 'Carbon fiber PLA. Use hardened nozzle 0.4mm+.',
  },

  // Metal Composite Filaments
  'htpla-brass': {
    nozzleTempMin: 185,
    nozzleTempMax: 210,
    bedTempMin: 50,
    bedTempMax: 60,
    isAbrasive: true,
    nozzleSizeMin: 0.5,
    notes: 'Brass-filled HTPLA. Use hardened nozzle 0.5mm+. Can be polished.',
  },
  'htpla-bronze': {
    nozzleTempMin: 185,
    nozzleTempMax: 210,
    bedTempMin: 50,
    bedTempMax: 60,
    isAbrasive: true,
    nozzleSizeMin: 0.5,
    notes: 'Bronze-filled HTPLA. Use hardened nozzle 0.5mm+. Can be polished.',
  },
  'htpla-copper': {
    nozzleTempMin: 185,
    nozzleTempMax: 210,
    bedTempMin: 50,
    bedTempMax: 60,
    isAbrasive: true,
    nozzleSizeMin: 0.5,
    notes: 'Copper-filled HTPLA. Use hardened nozzle 0.5mm+. Develops patina.',
  },
  'pla-iron': {
    nozzleTempMin: 185,
    nozzleTempMax: 210,
    bedTempMin: 50,
    bedTempMax: 60,
    isAbrasive: true,
    nozzleSizeMin: 0.5,
    notes: 'Iron-filled PLA. Magnetic! Can rust for weathered effect.',
  },
  'pla-steel': {
    nozzleTempMin: 185,
    nozzleTempMax: 210,
    bedTempMin: 50,
    bedTempMax: 60,
    isAbrasive: true,
    nozzleSizeMin: 0.5,
    notes: 'Steel-filled PLA. Use hardened nozzle 0.5mm+.',
  },

  // Specialty
  'pla-conductive': {
    nozzleTempMin: 185,
    nozzleTempMax: 215,
    bedTempMin: 50,
    bedTempMax: 60,
    isConductive: true,
    notes: 'Electrically conductive PLA. ~30 ohm-cm resistivity.',
  },
};

// ============= MATERIAL MAPPING =============

export const PROTOPASTA_MATERIAL_MAPPING: Record<string, string> = {
  // HTPLA variants
  'htpla': 'HTPLA',
  'ht-pla': 'HTPLA',
  'high-temp pla': 'HTPLA',
  'high temp pla': 'HTPLA',
  'heat treatable pla': 'HTPLA',

  // Carbon Fiber
  'carbon fiber htpla': 'HTPLA-CF',
  'cf htpla': 'HTPLA-CF',
  'carbon fiber pla': 'PLA-CF',
  'cf pla': 'PLA-CF',

  // Metal Composites (HTPLA base)
  'brass htpla': 'HTPLA',
  'bronze htpla': 'HTPLA',
  'copper htpla': 'HTPLA',

  // Metal Composites (PLA base)
  'iron pla': 'PLA',
  'magnetic iron pla': 'PLA',
  'steel pla': 'PLA',
  'stainless steel pla': 'PLA',

  // Conductive
  'conductive pla': 'PLA-Conductive',
  'electrically conductive pla': 'PLA-Conductive',
  'conductive': 'PLA-Conductive',

  // Standard PLA fallback
  'pla': 'PLA',
};

// ============= FINISH TYPE DETECTION =============

export type FinishType = 
  | 'Metallic' 
  | 'Glitter' 
  | 'Translucent' 
  | 'Multicolor' 
  | 'Matte' 
  | 'Filled' 
  | 'Carbon' 
  | 'Standard';

export function extractProtoPastaFinishType(title: string): FinishType {
  if (!title) return 'Standard';
  const t = title.toLowerCase();

  // Carbon Fiber detection
  if (/carbon\s*fiber|cf\s|cf-/i.test(t)) return 'Carbon';

  // Metal composite detection
  if (/brass|bronze|copper|iron|steel/i.test(t)) return 'Filled';

  // Metallic finishes
  if (/metallic|empire|galactic|highfive|high\s*five/i.test(t)) return 'Metallic';

  // Glitter/Sparkle
  if (/glitter|candy\s*apple|stardust|flake/i.test(t)) return 'Glitter';

  // Translucent/Iridescent
  if (/translucent|iridescent|ice|water|crystal|clear/i.test(t)) return 'Translucent';

  // Multicolor/Nebula
  if (/nebula|multicolor|gradient|galaxy/i.test(t)) return 'Multicolor';

  // Matte
  if (/matte|matte\s*fiber/i.test(t)) return 'Matte';

  return 'Standard';
}

// ============= PRODUCT LINE ID GENERATION =============

interface ProductLineResult {
  productLineId: string;
  settingsKey: string;
}

export function generateProtoPastaProductLineId(title: string, material?: string | null): ProductLineResult {
  if (!title) {
    return { productLineId: 'protopasta__unknown__unknown', settingsKey: 'htpla-standard' };
  }

  const t = title.toLowerCase();
  const normalizedMaterial = normalizeProtoPastaMaterial(title, material);
  const materialSlug = normalizedMaterial.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Carbon Fiber HTPLA
  if (/carbon\s*fiber.*htpla|cf.*htpla/i.test(t) || normalizedMaterial === 'HTPLA-CF') {
    return { productLineId: 'protopasta__htpla-cf__carbon-fiber', settingsKey: 'htpla-cf' };
  }

  // Carbon Fiber PLA (non-HT)
  if (/carbon\s*fiber.*pla|cf.*pla/i.test(t) && !/htpla/i.test(t)) {
    return { productLineId: 'protopasta__pla-cf__carbon-fiber', settingsKey: 'pla-cf' };
  }

  // Metal Composites
  if (/brass/i.test(t)) {
    return { productLineId: 'protopasta__htpla__brass', settingsKey: 'htpla-brass' };
  }
  if (/bronze/i.test(t)) {
    return { productLineId: 'protopasta__htpla__bronze', settingsKey: 'htpla-bronze' };
  }
  if (/copper/i.test(t)) {
    return { productLineId: 'protopasta__htpla__copper', settingsKey: 'htpla-copper' };
  }
  if (/iron|magnetic/i.test(t)) {
    return { productLineId: 'protopasta__pla__iron', settingsKey: 'pla-iron' };
  }
  if (/steel|stainless/i.test(t)) {
    return { productLineId: 'protopasta__pla__steel', settingsKey: 'pla-steel' };
  }

  // Conductive PLA
  if (/conductive/i.test(t) || normalizedMaterial === 'PLA-Conductive') {
    return { productLineId: 'protopasta__pla-conductive__conductive', settingsKey: 'pla-conductive' };
  }

  // HTPLA Sub-lines based on finish
  if (/htpla|ht-pla|high.?temp/i.test(t) || normalizedMaterial === 'HTPLA') {
    // Nebula Multicolor
    if (/nebula|multicolor/i.test(t)) {
      return { productLineId: 'protopasta__htpla__nebula', settingsKey: 'htpla-nebula' };
    }
    // Metallic
    if (/metallic|empire|galactic|highfive|high\s*five/i.test(t)) {
      return { productLineId: 'protopasta__htpla__metallic', settingsKey: 'htpla-metallic' };
    }
    // Glitter
    if (/glitter|candy\s*apple|flake/i.test(t)) {
      return { productLineId: 'protopasta__htpla__glitter', settingsKey: 'htpla-glitter' };
    }
    // Translucent/Sparkly
    if (/translucent|iridescent|sparkl|ice|water|crystal/i.test(t)) {
      return { productLineId: 'protopasta__htpla__translucent', settingsKey: 'htpla-translucent' };
    }
    // Matte Fiber
    if (/matte\s*fiber/i.test(t)) {
      return { productLineId: 'protopasta__htpla__matte-fiber', settingsKey: 'htpla-matte-fiber' };
    }
    // Standard HTPLA
    return { productLineId: 'protopasta__htpla__standard', settingsKey: 'htpla-standard' };
  }

  // Standard PLA fallback
  return { productLineId: `protopasta__${materialSlug}__standard`, settingsKey: 'htpla-standard' };
}

// ============= MATERIAL NORMALIZATION =============

export function normalizeProtoPastaMaterial(title: string, existingMaterial?: string | null): string {
  if (!title) return existingMaterial || 'HTPLA';

  const t = title.toLowerCase();

  // Check for carbon fiber first
  if (/carbon\s*fiber.*htpla|cf.*htpla/i.test(t)) return 'HTPLA-CF';
  if (/carbon\s*fiber|cf\s|cf-/i.test(t)) return 'PLA-CF';

  // Conductive
  if (/conductive/i.test(t)) return 'PLA-Conductive';

  // Metal composites - iron/steel are PLA base, others are HTPLA
  if (/iron|steel|stainless/i.test(t)) return 'PLA';

  // HTPLA detection (most Proto-Pasta products)
  if (/htpla|ht-pla|high.?temp|brass|bronze|copper/i.test(t)) return 'HTPLA';

  // Fallback to existing or HTPLA
  if (existingMaterial) {
    const mapped = PROTOPASTA_MATERIAL_MAPPING[existingMaterial.toLowerCase()];
    if (mapped) return mapped;
    return existingMaterial;
  }

  return 'HTPLA';
}

// ============= TDS URL MAPPING =============

export const PROTOPASTA_TDS_URLS: Record<string, string> = {
  // HTPLA lines
  'translucent': 'https://cdn.shopify.com/s/files/1/0717/9095/files/TDS__Translucent_Sparkly_HTPLA.pdf',
  'metallic': 'https://cdn.shopify.com/s/files/1/0717/9095/files/TDS__Metallic_HTPLA.pdf',
  'glitter': 'https://cdn.shopify.com/s/files/1/0717/9095/files/TDS__Glitter_Flake_HTPLA.pdf',
  'nebula': 'https://cdn.shopify.com/s/files/1/0717/9095/files/TDS__Nebula_Multicolor_HTPLA.pdf',
  'matte-fiber': 'https://cdn.shopify.com/s/files/1/0717/9095/files/TDS__Matte_Fiber_HTPLA.pdf',
  'standard': 'https://cdn.shopify.com/s/files/1/0717/9095/files/TDS__HTPLA.pdf',

  // Carbon Fiber
  'htpla-cf': 'https://cdn.shopify.com/s/files/1/0717/9095/files/TDS__Carbon_Fiber_HTPLA.pdf',
  'pla-cf': 'https://cdn.shopify.com/s/files/1/0717/9095/files/TDS__Carbon_Fiber_PLA.pdf',

  // Metal Composites
  'brass': 'https://cdn.shopify.com/s/files/1/0717/9095/files/TDS__Brass_Metal_Composite.pdf',
  'bronze': 'https://cdn.shopify.com/s/files/1/0717/9095/files/TDS__Bronze_Metal_Composite.pdf',
  'copper': 'https://cdn.shopify.com/s/files/1/0717/9095/files/TDS__Copper_Metal_Composite.pdf',
  'iron': 'https://cdn.shopify.com/s/files/1/0717/9095/files/TDS__Iron_Metal_Composite.pdf',
  'steel': 'https://cdn.shopify.com/s/files/1/0717/9095/files/TDS__Steel_Metal_Composite.pdf',

  // Specialty
  'conductive': 'https://cdn.shopify.com/s/files/1/0717/9095/files/TDS__Conductive_PLA.pdf',
};

export function getProtoPastaTdsUrl(productLineId: string): string | null {
  // Extract the sub-line from product_line_id (e.g., 'protopasta__htpla__translucent' -> 'translucent')
  const parts = productLineId.split('__');
  if (parts.length < 3) return null;

  const subLine = parts[2];

  // Direct match
  if (PROTOPASTA_TDS_URLS[subLine]) {
    return PROTOPASTA_TDS_URLS[subLine];
  }

  // Check material part for CF
  const material = parts[1];
  if (material === 'htpla-cf') return PROTOPASTA_TDS_URLS['htpla-cf'];
  if (material === 'pla-cf') return PROTOPASTA_TDS_URLS['pla-cf'];
  if (material === 'pla-conductive') return PROTOPASTA_TDS_URLS['conductive'];

  // Fallback to generic HTPLA TDS
  if (material === 'htpla') return PROTOPASTA_TDS_URLS['standard'];

  return null;
}

// ============= COLOR MAPPING =============

export const PROTOPASTA_COLOR_MAPPING: Record<string, string> = {
  // Metallic HTPLA
  'empire strikes black': '#1A1A1A',
  'empire black': '#1A1A1A',
  'highfive blue': '#1E88E5',
  'high five blue': '#1E88E5',
  'galactic empire purple': '#8E24AA',
  'galactic purple': '#8E24AA',

  // Glitter HTPLA
  'candy apple red': '#E53935',
  'stardust silver': '#C0C0C0',

  // Translucent HTPLA
  'iridescent ice': '#A5F2F3',
  'iridescent blue': '#4FC3F7',
  'translucent blue': '#42A5F5',
  'translucent red': '#EF5350',
  'translucent green': '#66BB6A',
  'translucent purple': '#AB47BC',
  'translucent orange': '#FFA726',
  'crystal clear': '#FFFFFF',

  // Nebula Multicolor
  'nebula multicolor': '#7B68EE',
  'nebula': '#7B68EE',
  'galaxy': '#483D8B',

  // Matte Fiber
  'matte fiber black': '#2D2D2D',
  'matte fiber gray': '#6B6B6B',
  'matte fiber grey': '#6B6B6B',
  'matte fiber white': '#E0E0E0',

  // Metal Composites
  'brass': '#B5A642',
  'bronze': '#CD7F32',
  'copper': '#B87333',
  'iron': '#48494B',
  'steel': '#71797E',
  'stainless steel': '#8B8D8E',
  'magnetic iron': '#48494B',

  // Carbon Fiber
  'carbon fiber': '#1C1C1C',
  'carbon fiber black': '#1C1C1C',

  // Conductive
  'conductive black': '#1A1A1A',
  'conductive': '#1A1A1A',

  // Standard colors
  'black': '#000000',
  'white': '#FFFFFF',
  'red': '#FF0000',
  'blue': '#0000FF',
  'green': '#00FF00',
  'yellow': '#FFFF00',
  'orange': '#FFA500',
  'purple': '#800080',
  'pink': '#FFC0CB',
  'gray': '#808080',
  'grey': '#808080',
};

export function getProtoPastaColorHex(colorName: string): string | null {
  if (!colorName) return null;
  const normalized = colorName.toLowerCase().trim();
  return PROTOPASTA_COLOR_MAPPING[normalized] || null;
}

// ============= TITLE CLEANING =============

const PROTOPASTA_TITLE_NOISE: RegExp[] = [
  /proto-?pasta\s*/gi,
  /\s*3d\s*printing\s*filament\s*/gi,
  /\s*filament\s*$/gi,
  /\s*1\.75\s*mm\s*/gi,
  /\s*2\.85\s*mm\s*/gi,
  /\s*500\s*g\s*/gi,
  /\s*1\s*kg\s*/gi,
  /\s*2\s*kg\s*/gi,
  /\s{2,}/g,
];

export function cleanProtoPastaTitle(title: string): string {
  if (!title) return '';
  let cleaned = title;
  for (const pattern of PROTOPASTA_TITLE_NOISE) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  return cleaned.trim();
}

// ============= PRODUCT FILTERING =============

const PROTOPASTA_EXCLUDED_TYPES = [
  'nozzle',
  'accessory',
  'bundle',
  'kit',
  'sample',
  'tool',
  'merch',
  'shirt',
  'sticker',
  'gift card',
  'spool holder',
  'dry box',
];

export function isProtoPastaFilamentProduct(title: string, productType?: string): boolean {
  const t = title.toLowerCase();
  const pt = (productType || '').toLowerCase();

  // Exclude non-filament products
  for (const excluded of PROTOPASTA_EXCLUDED_TYPES) {
    if (t.includes(excluded) || pt.includes(excluded)) {
      return false;
    }
  }

  // Include if contains filament-related terms
  if (/htpla|pla|filament|spool|composite|conductive/i.test(t)) {
    return true;
  }

  // Include if product type is filament
  if (pt.includes('filament')) {
    return true;
  }

  return false;
}

// ============= WEIGHT/DIAMETER EXTRACTION =============

export function extractProtoPastaWeight(variantTitle: string): number | null {
  if (!variantTitle) return null;
  const t = variantTitle.toLowerCase();

  // Match patterns like "500g", "1kg", "2kg", "1 kg"
  const kgMatch = t.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (kgMatch) {
    return parseFloat(kgMatch[1]) * 1000;
  }

  const gMatch = t.match(/(\d+)\s*g(?:ram)?/i);
  if (gMatch) {
    return parseInt(gMatch[1], 10);
  }

  // Proto-Pasta default is 500g
  return 500;
}

export function extractProtoPastaDiameter(variantTitle: string): number {
  if (!variantTitle) return 1.75;
  const t = variantTitle.toLowerCase();

  if (t.includes('2.85') || t.includes('3mm') || t.includes('3.0')) {
    return 2.85;
  }

  return 1.75;
}

// ============= MAIN ENRICHMENT FUNCTION =============

export interface ProtoPastaEnrichmentResult {
  material: string;
  finishType: FinishType;
  productLineId: string;
  settingsKey: string;
  tdsUrl: string | null;
  colorHex: string | null;
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  isAbrasive: boolean;
  isConductive: boolean;
  nozzleSizeMin: number | null;
  notes: string | null;
}

export function enrichProtoPastaProduct(
  title: string,
  variantTitle: string,
  existingMaterial?: string | null
): ProtoPastaEnrichmentResult {
  const material = normalizeProtoPastaMaterial(title, existingMaterial);
  const finishType = extractProtoPastaFinishType(title);
  const { productLineId, settingsKey } = generateProtoPastaProductLineId(title, material);
  const tdsUrl = getProtoPastaTdsUrl(productLineId);

  // Extract color from variant title or main title
  const colorText = variantTitle || title;
  const colorHex = getProtoPastaColorHex(colorText);

  // Get print settings
  const settings = PROTOPASTA_PRINT_SETTINGS[settingsKey] || PROTOPASTA_PRINT_SETTINGS['htpla-standard'];

  return {
    material,
    finishType,
    productLineId,
    settingsKey,
    tdsUrl,
    colorHex,
    nozzleTempMin: settings.nozzleTempMin,
    nozzleTempMax: settings.nozzleTempMax,
    bedTempMin: settings.bedTempMin,
    bedTempMax: settings.bedTempMax,
    isAbrasive: settings.isAbrasive || false,
    isConductive: settings.isConductive || false,
    nozzleSizeMin: settings.nozzleSizeMin || null,
    notes: settings.notes || null,
  };
}

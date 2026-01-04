/**
 * BAMBU LAB BRAND-SPECIFIC DEFAULTS
 * 
 * Enrichment logic for finish_type and product_line_id population.
 * Integrates with sync-bambulab-products edge function.
 * 
 * Platform: Shopify (Regional stores)
 * Currency: CAD (syncing from Canadian store for stability)
 * Diameter: 1.75mm only
 */

// ============================================================================
// STORE INFO
// ============================================================================

export const BAMBULAB_STORE_INFO = {
  vendor: 'Bambu Lab',
  platform: 'shopify',
  baseUrl: 'https://ca.store.bambulab.com',
  productsUrl: 'https://ca.store.bambulab.com/collections/bambu-lab-3d-printer-filament',
  currency: 'CAD',
  region: 'CA',
  defaultDiameter: 1.75,
  notes: 'Chinese manufacturer with global regional stores. Syncing from CA store for consistent pricing.',
};

// ============================================================================
// CATEGORY WHITELIST (Single collection URL for all filaments)
// ============================================================================

export interface BambuLabCategoryConfig {
  material: string;
  categoryUrl: string;
  displayMaterial: string;
}

export const BAMBULAB_CATEGORY_WHITELIST: BambuLabCategoryConfig[] = [
  { 
    material: 'All Filaments', 
    categoryUrl: 'https://ca.store.bambulab.com/collections/bambu-lab-3d-printer-filament',
    displayMaterial: 'All' 
  },
];

// ============================================================================
// SAFE DELETE THRESHOLD
// ============================================================================

export const BAMBULAB_SAFE_DELETE_THRESHOLD = 30; // Bambu Lab has ~40 distinct product lines

// ============================================================================
// NON-FILAMENT FILTER
// ============================================================================

// WHITELIST: These are VALID filament products despite containing excluded keywords
const FILAMENT_WHITELIST_PATTERNS = [
  /tpu\s*(for\s*)?ams/i,      // TPU for AMS is a valid filament
  /epla[- ]?hs/i,             // ePLA-HS is valid
  /pet[- ]?cf/i,              // PET-CF is valid
  /support.*for.*pla/i,       // Support materials are valid
  /support.*for.*abs/i,
  /support.*for.*pa/i,
  /support.*for.*pet/i,
  /\bpva\b/i,                 // PVA is valid
];

const NON_FILAMENT_PATTERNS = [
  // 3D Printers (very important to exclude!)
  /\b(?:x1c?|p1[sp]?|a1\s*(?:mini)?)\b/i,  // X1, X1C, P1S, P1P, A1, A1 Mini
  /3d\s*printer/i,
  
  // Accessories and parts - but NOT "AMS" in product names like "TPU for AMS"
  /\bams\s*(?:lite|hub|unit|system)\b/i, // AMS hardware, not filament products
  /\bnozzle/i,
  /\bhotend/i,
  /\bextruder/i,
  /\bbuild\s*plate/i,
  /\btextured.*plate/i,
  /\bpei\s*(?:plate|sheet)/i,
  /\bcover\b/i,
  /\benclosure\b/i,
  /\baccessor/i,
  /\btool(?:head|kit|box)?\b/i,
  /\bspare\s*part/i,
  /\bupgrade/i,
  /\bdesiccant/i,
  /\bdry.*box/i,
  /\bvacuum.*bag/i,
  /\bstorage/i,
  /\bspool\s*holder/i,
  /\bcable/i,
  /\bpower\s*supply/i,
  /\bcamera/i,
  /\bscreen/i,
  /\bdisplay/i,
  /\bmotor/i,
  /\bbearing/i,
  /\bbelt/i,
  /\bbed\s*(?:sheet|sticker)/i,
  /\bglue\s*stick/i,
  /\bscraper/i,
  
  // More specific exclusions (matching AzureFilm patterns)
  /\bhardened\s*steel\s*nozzle/i,
  /\bwiper\s*blade/i,
  /\bglass\s*plate/i,
  /\bcarbon\s*plate/i,
  /\bpurge\s*wiper/i,
  /\bcutter\s*blade/i,
  /\bspool\s*adapter/i,
  /\bptfe\s*tube/i,
  /\bmatrix\s*tray/i,
  /\bheated\s*bed/i,
  /\bwifi\s*module/i,
  /\bsd\s*card/i,
  /\bmicro\s*sd/i,
  /\blcd\s*screen/i,
  /\btouch\s*screen/i,
  /\bfilter\s*cartridge/i,
  /\bair\s*filter/i,
  
  // Bundle/pack products
  /super\s*pack/i,
  /starter\s*(?:kit|pack)/i,
  /multi[\s-]*pack/i,
  /variety\s*pack/i,
  /bundle/i,
  
  // Gift cards and non-product items
  /gift\s*card/i,
  /voucher/i,
  /\b3d\s*pen\b/i,
  /\barch\s*support/i,
  /\binsoles?\b/i,
];

export function isBambuLabNonFilament(title: string): boolean {
  if (!title) return true;
  
  const t = title.toLowerCase();
  
  // WHITELIST CHECK FIRST: These are valid filaments despite containing excluded keywords
  for (const pattern of FILAMENT_WHITELIST_PATTERNS) {
    if (pattern.test(t)) {
      return false; // IS a valid filament
    }
  }
  
  // Must contain "filament" or material keywords to be valid
  const hasFilamentKeyword = /filament|pla|petg|abs|asa|tpu|pa|pc|pps|support|pva/i.test(t);
  
  for (const pattern of NON_FILAMENT_PATTERNS) {
    if (pattern.test(t)) {
      return true;
    }
  }
  
  // If it doesn't contain any filament keywords, it's likely not a filament
  if (!hasFilamentKeyword) {
    return true;
  }
  
  return false;
}

// ============================================================================
// PRODUCT LINE DEFINITIONS (45+ distinct product lines)
// ============================================================================

export const BAMBULAB_PRODUCT_LINES: Record<string, {
  productLineId: string;
  material: string;
  finishType: string;
  isAbrasive: boolean;
  enclosureRequired: boolean;
  highSpeedCapable: boolean;
  isFlexible: boolean;
  isLightweight: boolean;
}> = {
  // PLA Variants
  'pla-basic': {
    productLineId: 'bambulab__pla__basic',
    material: 'PLA',
    finishType: 'Standard',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'pla-matte': {
    productLineId: 'bambulab__pla__matte',
    material: 'PLA',
    finishType: 'Matte',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'pla-silk': {
    productLineId: 'bambulab__pla__silk',
    material: 'PLA',
    finishType: 'Silk',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'pla-silk-multi-color': {
    productLineId: 'bambulab__pla__silk-multicolor',
    material: 'PLA',
    finishType: 'Silk',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'pla-translucent': {
    productLineId: 'bambulab__pla__translucent',
    material: 'PLA',
    finishType: 'Translucent',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'pla-tough': {
    productLineId: 'bambulab__pla__tough',
    material: 'PLA+',
    finishType: 'Standard',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'pla-basic-gradient': {
    productLineId: 'bambulab__pla__basic-gradient',
    material: 'PLA',
    finishType: 'Multi',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'pla-wood': {
    productLineId: 'bambulab__pla__wood',
    material: 'PLA-Wood',
    finishType: 'Wood',
    isAbrasive: true,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'pla-marble': {
    productLineId: 'bambulab__pla__marble',
    material: 'PLA',
    finishType: 'Marble',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'pla-metal': {
    productLineId: 'bambulab__pla__metal',
    material: 'PLA',
    finishType: 'Metal',
    isAbrasive: true,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'pla-galaxy': {
    productLineId: 'bambulab__pla__galaxy',
    material: 'PLA',
    finishType: 'Sparkle',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'pla-glow': {
    productLineId: 'bambulab__pla__glow',
    material: 'PLA',
    finishType: 'Glow',
    isAbrasive: true, // Glow particles are slightly abrasive
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'pla-sparkle': {
    productLineId: 'bambulab__pla__sparkle',
    material: 'PLA',
    finishType: 'Sparkle',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'pla-aero': {
    productLineId: 'bambulab__pla__aero',
    material: 'PLA',
    finishType: 'Standard',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: true,
  },
  'pla-impact': {
    productLineId: 'bambulab__pla__impact',
    material: 'PLA+',
    finishType: 'Standard',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'pla-cf': {
    productLineId: 'bambulab__pla-cf__composite',
    material: 'PLA-CF',
    finishType: 'Standard',
    isAbrasive: true,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  // ePLA-HS (High Speed)
  'epla-hs': {
    productLineId: 'bambulab__epla-hs__high-speed',
    material: 'PLA',
    finishType: 'Standard',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: true,
    isFlexible: false,
    isLightweight: false,
  },
  // PETG Variants
  'petg-hf': {
    productLineId: 'bambulab__petg__hf',
    material: 'PETG',
    finishType: 'Standard',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: true,
    isFlexible: false,
    isLightweight: false,
  },
  'petg-translucent': {
    productLineId: 'bambulab__petg__translucent',
    material: 'PETG',
    finishType: 'Translucent',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'petg-cf': {
    productLineId: 'bambulab__petg-cf__composite',
    material: 'PETG-CF',
    finishType: 'Standard',
    isAbrasive: true,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  // TPU Variants
  'tpu-95a-hf': {
    productLineId: 'bambulab__tpu__95a-hf',
    material: 'TPU-95A',
    finishType: 'Standard',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: true,
    isFlexible: true,
    isLightweight: false,
  },
  'tpu-85a': {
    productLineId: 'bambulab__tpu__85a-90a',
    material: 'TPU-85A',
    finishType: 'Standard',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: true,
    isLightweight: false,
  },
  'tpu-90a': {
    productLineId: 'bambulab__tpu__85a-90a',
    material: 'TPU-90A',
    finishType: 'Standard',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: true,
    isLightweight: false,
  },
  'tpu-for-ams': {
    productLineId: 'bambulab__tpu__ams',
    material: 'TPU',
    finishType: 'Standard',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: true,
    isLightweight: false,
  },
  // ABS Variants
  'abs-filament': {
    productLineId: 'bambulab__abs__standard',
    material: 'ABS',
    finishType: 'Standard',
    isAbrasive: false,
    enclosureRequired: true,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'abs': {
    productLineId: 'bambulab__abs__standard',
    material: 'ABS',
    finishType: 'Standard',
    isAbrasive: false,
    enclosureRequired: true,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'abs-gf': {
    productLineId: 'bambulab__abs-gf__composite',
    material: 'ABS-GF',
    finishType: 'Standard',
    isAbrasive: true,
    enclosureRequired: true,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  // ASA Variants
  'asa': {
    productLineId: 'bambulab__asa__standard',
    material: 'ASA',
    finishType: 'Standard',
    isAbrasive: false,
    enclosureRequired: true,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'asa-aero': {
    productLineId: 'bambulab__asa__aero',
    material: 'ASA',
    finishType: 'Standard',
    isAbrasive: false,
    enclosureRequired: true,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: true,
  },
  'asa-cf': {
    productLineId: 'bambulab__asa-cf__composite',
    material: 'ASA-CF',
    finishType: 'Standard',
    isAbrasive: true,
    enclosureRequired: true,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  // PA (Nylon) Variants
  'pa6-cf': {
    productLineId: 'bambulab__pa-cf__pa6',
    material: 'PA6-CF',
    finishType: 'Standard',
    isAbrasive: true,
    enclosureRequired: true,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'paht-cf': {
    productLineId: 'bambulab__pa-cf__paht',
    material: 'PAHT-CF',
    finishType: 'Standard',
    isAbrasive: true,
    enclosureRequired: true,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'ppa-cf': {
    productLineId: 'bambulab__pa-cf__ppa',
    material: 'PPA-CF',
    finishType: 'Standard',
    isAbrasive: true,
    enclosureRequired: true,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'pa6-gf': {
    productLineId: 'bambulab__pa-gf__pa6',
    material: 'PA6-GF',
    finishType: 'Standard',
    isAbrasive: true,
    enclosureRequired: true,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  // PET-CF
  'pet-cf': {
    productLineId: 'bambulab__pet-cf__composite',
    material: 'PET-CF',
    finishType: 'Standard',
    isAbrasive: true,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  // PC Variants
  'pc': {
    productLineId: 'bambulab__pc__standard',
    material: 'PC',
    finishType: 'Standard',
    isAbrasive: false,
    enclosureRequired: true,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'pc-fr': {
    productLineId: 'bambulab__pc__fr',
    material: 'PC',
    finishType: 'Standard',
    isAbrasive: false,
    enclosureRequired: true,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  // PPS-CF
  'pps-cf': {
    productLineId: 'bambulab__pps-cf__composite',
    material: 'PPS-CF',
    finishType: 'Standard',
    isAbrasive: true,
    enclosureRequired: true,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  // Support Materials
  'support-for-pla': {
    productLineId: 'bambulab__support__pla',
    material: 'Support',
    finishType: 'Standard',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'support-for-pla-new': {
    productLineId: 'bambulab__support__pla-new',
    material: 'Support',
    finishType: 'Standard',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'support-for-pla-petg': {
    productLineId: 'bambulab__support__pla-petg',
    material: 'Support',
    finishType: 'Standard',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'support-for-abs': {
    productLineId: 'bambulab__support__abs',
    material: 'Support',
    finishType: 'Standard',
    isAbrasive: false,
    enclosureRequired: true,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'support-for-pa-pet': {
    productLineId: 'bambulab__support__pa-pet',
    material: 'Support',
    finishType: 'Standard',
    isAbrasive: false,
    enclosureRequired: true,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'support-g': {
    productLineId: 'bambulab__support__g',
    material: 'Support',
    finishType: 'Standard',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  'support-w': {
    productLineId: 'bambulab__support__w',
    material: 'Support',
    finishType: 'Standard',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
  // PVA
  'pva': {
    productLineId: 'bambulab__pva__standard',
    material: 'PVA',
    finishType: 'Standard',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    isFlexible: false,
    isLightweight: false,
  },
};

// ============================================================================
// FINISH TYPE EXTRACTION FROM PRODUCT TITLE
// ============================================================================

export type FinishType = 'Standard' | 'Matte' | 'Silk' | 'Sparkle' | 'Translucent' | 'Glow' | 'Multi' | 'Marble' | 'Wood' | 'Metal';

export function extractBambuLabFinishType(title: string): FinishType {
  if (!title) return 'Standard';
  const t = title.toLowerCase();
  
  // Check in order of specificity
  if (/\bsilk\b/i.test(t)) return 'Silk';
  if (/\bmatte\b/i.test(t)) return 'Matte';
  if (/\bsparkle\b/i.test(t)) return 'Sparkle';
  if (/\bgalaxy\b/i.test(t)) return 'Sparkle'; // Galaxy is a sparkle variant
  if (/\btranslucent\b/i.test(t)) return 'Translucent';
  if (/\bglow\b/i.test(t)) return 'Glow';
  if (/\bgradient\b|multi[- ]?color/i.test(t)) return 'Multi';
  if (/\bmarble\b/i.test(t)) return 'Marble';
  if (/\bwood\b/i.test(t)) return 'Wood';
  if (/\bmetal\b/i.test(t)) return 'Metal';
  
  return 'Standard';
}

// ============================================================================
// PRODUCT LINE ID GENERATION FROM SLUG OR TITLE
// ============================================================================

export function generateBambuLabProductLineId(slugOrTitle: string): string {
  // Normalize: lowercase, spaces to dashes, slashes to dashes, strip parentheses
  const normalized = slugOrTitle.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-').replace(/[()]/g, '');
  
  // Try exact match first
  if (BAMBULAB_PRODUCT_LINES[normalized]) {
    return BAMBULAB_PRODUCT_LINES[normalized].productLineId;
  }
  
  // Try partial matches
  for (const [key, config] of Object.entries(BAMBULAB_PRODUCT_LINES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return config.productLineId;
    }
  }
  
  // Parse from title patterns
  const t = normalized;
  
  // PLA variants
  if (/pla.*silk.*multi/i.test(t)) return 'bambulab__pla__silk-multicolor';
  if (/pla.*silk/i.test(t)) return 'bambulab__pla__silk';
  if (/pla.*matte/i.test(t)) return 'bambulab__pla__matte';
  if (/pla.*translucent/i.test(t)) return 'bambulab__pla__translucent';
  if (/pla.*tough/i.test(t)) return 'bambulab__pla__tough';
  if (/pla.*gradient/i.test(t)) return 'bambulab__pla__basic-gradient';
  if (/pla.*wood/i.test(t)) return 'bambulab__pla__wood';
  if (/pla.*marble/i.test(t)) return 'bambulab__pla__marble';
  if (/pla.*metal/i.test(t)) return 'bambulab__pla__metal';
  if (/pla.*galaxy/i.test(t)) return 'bambulab__pla__galaxy';
  if (/pla.*glow/i.test(t)) return 'bambulab__pla__glow';
  if (/pla.*sparkle/i.test(t)) return 'bambulab__pla__sparkle';
  if (/pla.*aero/i.test(t)) return 'bambulab__pla__aero';
  if (/pla.*impact/i.test(t)) return 'bambulab__pla__impact';
  if (/pla[- ]?cf/i.test(t)) return 'bambulab__pla-cf__composite';
  if (/epla[- ]?hs/i.test(t)) return 'bambulab__epla-hs__high-speed';
  if (/pla.*basic/i.test(t) || /\bpla\b/i.test(t)) return 'bambulab__pla__basic';
  
  // PETG variants
  if (/petg[- ]?cf/i.test(t)) return 'bambulab__petg-cf__composite';
  if (/petg.*translucent/i.test(t)) return 'bambulab__petg__translucent';
  if (/petg.*hf|petg/i.test(t)) return 'bambulab__petg__hf';
  
  // TPU variants
  if (/tpu.*95a/i.test(t)) return 'bambulab__tpu__95a-hf';
  if (/tpu.*85a/i.test(t)) return 'bambulab__tpu__85a-90a';
  if (/tpu.*90a/i.test(t)) return 'bambulab__tpu__85a-90a';
  if (/tpu.*ams/i.test(t)) return 'bambulab__tpu__ams';
  if (/\btpu\b/i.test(t)) return 'bambulab__tpu__95a-hf';
  
  // ABS variants
  if (/abs[- ]?gf/i.test(t)) return 'bambulab__abs-gf__composite';
  if (/\babs\b/i.test(t)) return 'bambulab__abs__standard';
  
  // ASA variants
  if (/asa[- ]?cf/i.test(t)) return 'bambulab__asa-cf__composite';
  if (/asa.*aero/i.test(t)) return 'bambulab__asa__aero';
  if (/\basa\b/i.test(t)) return 'bambulab__asa__standard';
  
  // PA variants
  if (/pa6[- ]?cf/i.test(t)) return 'bambulab__pa-cf__pa6';
  if (/paht[- ]?cf/i.test(t)) return 'bambulab__pa-cf__paht';
  if (/ppa[- ]?cf/i.test(t)) return 'bambulab__pa-cf__ppa';
  if (/pa6[- ]?gf/i.test(t)) return 'bambulab__pa-gf__pa6';
  
  // PET-CF
  if (/pet[- ]?cf/i.test(t)) return 'bambulab__pet-cf__composite';
  
  // PC variants
  if (/pc[- ]?fr/i.test(t)) return 'bambulab__pc__fr';
  if (/\bpc\b/i.test(t)) return 'bambulab__pc__standard';
  
  // PPS-CF
  if (/pps[- ]?cf/i.test(t)) return 'bambulab__pps-cf__composite';
  
  // Support materials (order matters - most specific first)
  if (/support.*(?:pla.*\/.*petg|pla.*and.*petg|pla\/petg)/i.test(t)) return 'bambulab__support__pla-petg';
  if (/support.*pa.*pet/i.test(t)) return 'bambulab__support__pa-pet';
  if (/support.*(?:pla.*\(new|pla.*new\s*version)/i.test(t)) return 'bambulab__support__pla-new';
  if (/support.*abs/i.test(t)) return 'bambulab__support__abs';
  if (/support[- ]?g\b/i.test(t)) return 'bambulab__support__g';
  if (/support[- ]?w\b/i.test(t)) return 'bambulab__support__w';
  if (/support.*pla/i.test(t)) return 'bambulab__support__pla';
  if (/\bsupport\b/i.test(t)) return 'bambulab__support__pla';
  
  // PVA
  if (/\bpva\b/i.test(t)) return 'bambulab__pva__standard';
  
  // Fallback
  return 'bambulab__pla__basic';
}

// ============================================================================
// GET PRODUCT LINE CONFIG FROM SLUG
// ============================================================================

export function getBambuLabProductLineConfig(slugOrTitle: string): {
  productLineId: string;
  finishType: string;
  isAbrasive: boolean;
  enclosureRequired: boolean;
  highSpeedCapable: boolean;
  isFlexible: boolean;
  isLightweight: boolean;
} {
  // Normalize: lowercase, spaces to dashes, slashes to dashes, strip parentheses (critical for "Support for PLA (New Version)")
  const normalized = slugOrTitle.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-').replace(/[()]/g, '');
  
  // Try exact match
  if (BAMBULAB_PRODUCT_LINES[normalized]) {
    const config = BAMBULAB_PRODUCT_LINES[normalized];
    return {
      productLineId: config.productLineId,
      finishType: config.finishType,
      isAbrasive: config.isAbrasive,
      enclosureRequired: config.enclosureRequired,
      highSpeedCapable: config.highSpeedCapable,
      isFlexible: config.isFlexible,
      isLightweight: config.isLightweight,
    };
  }
  
  // Try partial matches - SORT BY LENGTH (longest first) to prevent short-key false positives
  // e.g., "support-for-pla-petg" must match before "support-for-pla"
  const sortedKeys = Object.keys(BAMBULAB_PRODUCT_LINES).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (normalized.includes(key)) {
      const config = BAMBULAB_PRODUCT_LINES[key];
      return {
        productLineId: config.productLineId,
        finishType: config.finishType,
        isAbrasive: config.isAbrasive,
        enclosureRequired: config.enclosureRequired,
        highSpeedCapable: config.highSpeedCapable,
        isFlexible: config.isFlexible,
        isLightweight: config.isLightweight,
      };
    }
  }
  
  // Generate from title patterns
  const productLineId = generateBambuLabProductLineId(slugOrTitle);
  const finishType = extractBambuLabFinishType(slugOrTitle);
  
  // Determine flags based on product line ID
  const isAbrasive = productLineId.includes('-cf') || productLineId.includes('-gf') || 
                     productLineId.includes('wood') || productLineId.includes('metal') ||
                     productLineId.includes('glow');
  const enclosureRequired = productLineId.includes('abs') || productLineId.includes('asa') ||
                            productLineId.includes('pa-') || productLineId.includes('pc') ||
                            productLineId.includes('pps');
  const highSpeedCapable = productLineId.includes('hs') || productLineId.includes('hf');
  const isFlexible = productLineId.includes('tpu');
  const isLightweight = productLineId.includes('aero');
  
  return {
    productLineId,
    finishType,
    isAbrasive,
    enclosureRequired,
    highSpeedCapable,
    isFlexible,
    isLightweight,
  };
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface BambuLabEnrichmentResult {
  productLineId: string;
  finishType: string;
  isNozzleAbrasive: boolean | null;
  highSpeedCapable: boolean | null;
}

export function enrichBambuLabProduct(
  titleOrSlug: string,
  existingProductLineId?: string | null,
  existingFinishType?: string | null
): BambuLabEnrichmentResult {
  // If already enriched, skip
  if (existingProductLineId && existingFinishType) {
    return {
      productLineId: existingProductLineId,
      finishType: existingFinishType,
      isNozzleAbrasive: null,
      highSpeedCapable: null,
    };
  }
  
  const config = getBambuLabProductLineConfig(titleOrSlug);
  
  return {
    productLineId: existingProductLineId || config.productLineId,
    finishType: existingFinishType || config.finishType,
    isNozzleAbrasive: config.isAbrasive,
    highSpeedCapable: config.highSpeedCapable,
  };
}

// ============================================================================
// BAMBU LAB COLOR HEX MAP (Brand-specific colors)
// ============================================================================

export const BAMBULAB_COLOR_HEX_MAP: Record<string, string> = {
  // ===== Bambu Lab Unique Named Colors =====
  'jade white': 'F7F8F4', // Off-white with slight jade tint (NOT jade green)
  'jade': '00A86B',
  'bambu green': '00AE42',
  'sky blue': '87CEEB',
  'sky': '87CEEB',
  
  // ===== Matte PLA Specific Colors =====
  'matte ivory white': 'F5F5DC',
  'matte charcoal': '36454F',
  'matte black': '1A1A1A',
  'matte white': 'FFFFFF',
  'matte dark gray': '4A4A4A',
  'matte light gray': 'D3D3D3',
  'matte blue gray': '6699CC',
  'matte terracotta': 'E2725B',
  'matte grass green': '7CFC00',
  'matte mandarin orange': 'FF8C00',
  'matte lilac purple': 'C8A2C8',
  'matte sakura pink': 'FFB7C5',
  
  // ===== Specific Named Colors (from Bambu Lab website) =====
  'cobalt blue': '0047AB',
  'indigo purple': '4B0082',
  'maroon red': '800000',
  'hot pink': 'FF69B4',
  'pumpkin orange': 'FF7518',
  'sunflower yellow': 'FFDA03',
  'bright green': '66FF00',
  'cocoa brown': 'D2691E',
  'light gray': 'D3D3D3',
  'dark gray': '4A4A4A',
  'blue gray': '6699CC',
  'coral': 'FF7F50',
  'lavender': 'E6E6FA',
  'mint': '98FF98',
  'peach': 'FFCBA4',
  'rose': 'FF007F',
  'salmon': 'FA8072',
  'teal': '008080',
  'turquoise': '40E0D0',
  'cyan': '00FFFF',
  'magenta': 'FF00FF',
  'olive': '808000',
  'navy': '000080',
  'lime': '00FF00',
  'crimson': 'DC143C',
  'scarlet': 'FF2400',
  'slate': '708090',
  'wine': '722F37',
  'bone': 'E3DAC9',
  'cream': 'FFFDD0',
  
  // ===== Basic Colors =====
  'black': '1A1A1A',
  'white': 'FFFFFF',
  'gray': '808080',
  'grey': '808080',
  'red': 'DC2626',
  'orange': 'EA580C',
  'yellow': 'EAB308',
  'green': '16A34A',
  'blue': '2563EB',
  'purple': '9333EA',
  'pink': 'EC4899',
  'brown': '92400E',
  
  // ===== Specialty Colors =====
  'natural': 'F5F5DC',
  'ivory': 'FFFFF0',
  'beige': 'D4C4A8',
  'charcoal': '36454F',
  'tan': 'D2B48C',
  'plum': '8E4585',
  'matte plum': '8E4585',
  
  // ===== Translucent =====
  'translucent': 'FFFFFF',
  'clear': 'FFFFFF',
  'water clear': 'F0FFFF',
  'translucent blue': '87CEEB',
  'translucent green': '90EE90',
  'translucent orange': 'FFA500',
  'translucent red': 'FF6B6B',
  'translucent yellow': 'FFFF99',
  
  // ===== Metallic =====
  'gold': 'D4AF37',
  'silver': 'C0C0C0',
  'copper': 'B87333',
  'bronze': 'CD7F32',
  
  // ===== Support Materials =====
  'support white': 'FFFFFF',
  'support black': '1A1A1A',
  
  // ===== Galaxy/Sparkle variants =====
  'galaxy black': '1A1A1A',
  'galaxy blue': '1E3A5F',
  'galaxy purple': '4B0082',
  
  // ===== Glow variants =====
  'glow green': '39FF14',
  'glow blue': '00FFFF',
  'glow orange': 'FF6600',
  
  // ===== Silk variants =====
  'silk gold': 'D4AF37',
  'silk silver': 'C0C0C0',
  'silk copper': 'B87333',
  'silk red': 'CC2936',
  'silk blue': '4169E1',
  'silk green': '228B22',
  'silk purple': '800080',
  'silk pink': 'FF69B4',
  
  // ===== Bambu Lab Specific Named Colors (from website) =====
  'gilded rose': 'B76E79',        // Rose gold, not magenta
  'candy red': 'E2252B',
  'titan gray': '708090',
  'titan grey': '708090',
  'blue hawaii': '00CED1',
  'mystic magenta': 'FF00FF',
  'aurora purple': '9370DB',
  'phantom blue': '191970',
  'matte dark charcoal': '36454F',
  'matte lilac': 'C8A2C8',
  'polar white': 'F8F8FF',
  'arctic white': 'F0F8FF',
  'lemon yellow': 'FFF44F',
  'army green': '4B5320',
  'khaki': 'C3B091',
  'coffee': '6F4E37',
  'champagne': 'F7E7CE',
  'emerald green': '50C878',
  'ruby red': 'E0115F',
  'sapphire blue': '0F52BA',
  
  // ===== British spelling variants (grey -> gray) =====
  'blue grey': '6699CC',
  'dark grey': '4A4A4A',
  'light grey': 'D3D3D3',
  'ash grey': '8A8A8A',
  'charcoal grey': '36454F',
  'nardo grey': '8A8A8A',
  'iron grey': '52595D',
  'lava grey': '59595B',
  'slate grey': '708090',
  
  // ===== Translucent compound colors (only ones not already defined above) =====
  'translucent light blue': 'ADD8E6',
  'translucent pink': 'FFB6C1',
  'translucent brown': 'D2691E',
  'translucent purple': 'DDA0DD',
  'translucent white': 'F5F5F5',
  'translucent black': '2F2F2F',
};

export function getBambuLabColorHex(colorName: string | null): string | null {
  if (!colorName) return null;
  let normalized = colorName.toLowerCase().trim();
  
  // 1. Exact match first (highest priority)
  if (BAMBULAB_COLOR_HEX_MAP[normalized]) {
    return BAMBULAB_COLOR_HEX_MAP[normalized];
  }
  
  // 2. Normalize British -> American spelling and try exact match
  const americanized = normalized.replace(/grey/g, 'gray');
  if (BAMBULAB_COLOR_HEX_MAP[americanized]) {
    return BAMBULAB_COLOR_HEX_MAP[americanized];
  }
  
  // 3. For translucent/matte/silk compounds, try matching WITHOUT the modifier
  const modifiersToStrip = ['translucent', 'matte', 'silk', 'metallic', 'glow'];
  for (const modifier of modifiersToStrip) {
    if (normalized.startsWith(modifier + ' ')) {
      const colorPart = normalized.substring(modifier.length + 1);
      if (BAMBULAB_COLOR_HEX_MAP[colorPart]) {
        return BAMBULAB_COLOR_HEX_MAP[colorPart];
      }
      // Also try americanized version
      const americanColor = colorPart.replace(/grey/g, 'gray');
      if (BAMBULAB_COLOR_HEX_MAP[americanColor]) {
        return BAMBULAB_COLOR_HEX_MAP[americanColor];
      }
    }
  }
  
  // Sort keys by length (longest first) to prevent short keys from matching before specific ones
  const sortedKeys = Object.keys(BAMBULAB_COLOR_HEX_MAP)
    .sort((a, b) => b.length - a.length);
  
  // 4. Starts-with or ends-with match (e.g., "gold" should match "gold", not get contaminated by "gilded rose")
  for (const key of sortedKeys) {
    if (normalized.startsWith(key + ' ') || normalized.endsWith(' ' + key) || normalized === key) {
      return BAMBULAB_COLOR_HEX_MAP[key];
    }
  }
  
  // 5. Word-boundary match (e.g., "titan gray" matches "gray" as a word, not partial)
  for (const key of sortedKeys) {
    // Escape special regex chars in key
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedKey}\\b`, 'i');
    if (regex.test(normalized)) {
      return BAMBULAB_COLOR_HEX_MAP[key];
    }
  }
  
  // 6. Fallback: Contains match (least priority, may cause cross-contamination)
  for (const key of sortedKeys) {
    if (normalized.includes(key)) {
      return BAMBULAB_COLOR_HEX_MAP[key];
    }
  }
  
  return null;
}

// ============================================================================
// EXCLUDED COLOR PATTERNS (promotional text, not colors)
// ============================================================================

export const EXCLUDED_COLOR_PATTERNS = [
  // Bundle/pack promotional text
  /set\s*of\s*\d+/i,
  /\d+\s*pack/i,
  /starter\s*kit/i,
  /combo/i,
  /bundle/i,
  /variety/i,
  
  // Promotional accessories
  /coaster/i,
  /holder/i,
  /clock\s*kit/i,
  /modular/i,
  /accessory/i,
  
  // Navigation/UI text that may appear in scraped content
  /quick\s*add/i,
  /bulk\s*savings/i,
  /related\s*models/i,
  /discover\s*more/i,
  /shipping/i,
  /order\s*info/i,
  /add\s*to\s*cart/i,
  /buy\s*now/i,
  /out\s*of\s*stock/i,
  /coming\s*soon/i,
  /pre[\s-]*order/i,
  /free\s*shipping/i,
  /select\s*option/i,
  /choose\s*color/i,
  /color\s*options/i,
  
  // Size/weight text
  /\d+\s*g\b/i,
  /\d+\s*kg\b/i,
  /\d+\s*mm\b/i,
  
  // Brand/product descriptors
  /bambu\s*lab/i,
  /filament/i,
  /high\s*flow/i,
  /high\s*speed/i,
  /for\s*ams/i,
  
  // Sentence fragments (junk from markdown parsing)
  /\b(of|the|and|in|is|a|an|for|to|with|when|used|your|prints?)\b.*\b(of|the|and|in|is|a|an|for|to|with|when|used|your|prints?)\b/i,
  /welcome\s*code/i,
  /matte\s*finish/i,
  /matte\s*achieve/i,
  /achieve\s*a/i,
  /transitions?/i,
  /appearance/i,
  /vibrant/i,
  /perspectives/i,
  /retains?/i,
  /familiar/i,
  /segment/i,
  /variation/i,
  /depending/i,
  /available/i,
  /achieve/i,
  /texture/i,
  /smooth/i,
  /layer/i,
  /printing/i,
  /printed/i,
  /quality/i,
  /excellent/i,
  /perfect/i,
  /ideal/i,
  /suitable/i,
  /compatible/i,
  /recommended/i,
  
  // Multi-word phrases that aren't colors
  /per\s*spool/i,
  /in\s*one/i,
  /one\s*spool/i,
  /\boptions?\b/i,
  /\bsuit\b/i,
  
  // UI/Form labels that appear in scraped markdown
  /^add$/i,
  /^type$/i,
  /^size$/i,
  /^quantity$/i,
  /^refill$/i,
  /^color$/i,
  /^weight$/i,
  /^material$/i,
  /^region$/i,
  /^country$/i,
  /^states?$/i,
  /^features?$/i,
  /^description$/i,
  /^specifications?$/i,
  /^details?$/i,
  /united\s*states/i,
  /product\s*features/i,
  /^select$/i,
  /^choose$/i,
  /^buy$/i,
  /^cart$/i,
  /^checkout$/i,
  /^shipping$/i,
  /^delivery$/i,
  /^stock$/i,
  /^available$/i,
  /^sold\s*out$/i,
];

// Known valid color words for strict validation
const KNOWN_COLOR_WORDS = new Set([
  'black', 'white', 'gray', 'grey', 'red', 'blue', 'green', 'yellow', 'orange', 
  'purple', 'pink', 'brown', 'gold', 'silver', 'jade', 'sky', 'coral', 'mint', 
  'ivory', 'beige', 'charcoal', 'tan', 'teal', 'cyan', 'magenta', 'olive', 
  'navy', 'lime', 'lavender', 'peach', 'rose', 'salmon', 'turquoise', 'crimson', 
  'scarlet', 'wine', 'cream', 'natural', 'clear', 'translucent', 'matte', 'silk', 
  'glow', 'galaxy', 'sparkle', 'cobalt', 'indigo', 'maroon', 'hot', 'pumpkin', 
  'sunflower', 'bright', 'cocoa', 'light', 'dark', 'copper', 'bronze', 'bone',
  'slate', 'terracotta', 'grass', 'mandarin', 'lilac', 'sakura', 'water',
  // Bambu Lab specific color modifiers
  'mistletoe', 'bambu', 'coffee', 'azure', 'scarlet', 'vermillion', 'apricot',
  'champagne', 'emerald', 'ruby', 'sapphire', 'arctic', 'lemon', 'army', 'khaki',
]);

export function isValidColorName(text: string): boolean {
  if (!text || text.length < 2 || text.length > 30) return false;
  
  // Check against excluded patterns first
  if (EXCLUDED_COLOR_PATTERNS.some(pattern => pattern.test(text))) {
    return false;
  }
  
  // Must not contain newlines or excessive spaces (scraped junk)
  if (/[\n\r]|\s{3,}/.test(text)) return false;
  
  // Must not look like a sentence (multiple common words)
  const words = text.toLowerCase().split(/\s+/);
  if (words.length > 3) return false; // Colors are at most 3 words
  
  // MUST have at least one known color word (strict validation)
  const hasKnownColor = words.some(word => KNOWN_COLOR_WORDS.has(word));
  if (!hasKnownColor) {
    return false; // Reject if no known color word
  }
  
  // Must also be in proper color format (capitalized words)
  const isProperColorFormat = /^[A-Z][a-z]+(\s+[A-Z][a-z]+){0,2}$/.test(text);
  
  return isProperColorFormat;
}

// ============================================================================
// TDS URL MAPPING (Reference - already in scrape-bambu-pla)
// ============================================================================

export const BAMBULAB_TDS_URLS: Record<string, string> = {
  'pla-basic': 'https://store.bblcdn.com/s7/default/23b4cf2b83d5470bb96d19970b5f3ae8/Bambu_PLA_Basic_Technical_Data_Sheet.pdf',
  'pla-matte': 'https://store.bblcdn.com/s7/default/23b4cf2b83d5470bb96d19970b5f3ae8/Bambu_PLA_Matte_Technical_Data_Sheet.pdf',
  'pla-silk': 'https://store.bblcdn.com/s7/default/23b4cf2b83d5470bb96d19970b5f3ae8/Bambu_PLA_Silk_Technical_Data_Sheet.pdf',
  'abs-filament': 'https://store.bblcdn.com/s7/default/23b4cf2b83d5470bb96d19970b5f3ae8/Bambu_ABS_Technical_Data_Sheet_V3.pdf',
  'petg-hf': 'https://store.bblcdn.com/s7/default/23b4cf2b83d5470bb96d19970b5f3ae8/Bambu_PETG_HF_Technical_Data_Sheet.pdf',
};

export function getBambuLabTdsUrl(slug: string): string | null {
  return BAMBULAB_TDS_URLS[slug] || null;
}

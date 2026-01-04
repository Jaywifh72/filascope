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

export const BAMBULAB_SAFE_DELETE_THRESHOLD = 100; // Bambu Lab has 300+ filament variants

// ============================================================================
// NON-FILAMENT FILTER
// ============================================================================

const NON_FILAMENT_PATTERNS = [
  // 3D Printers (very important to exclude!)
  /\b(?:x1c?|p1[sp]?|a1\s*(?:mini)?)\b/i,  // X1, X1C, P1S, P1P, A1, A1 Mini
  /3d\s*printer/i,
  
  // Accessories and parts
  /\bams\b(?!\s*compatible|\s*ready)/i, // AMS but not "AMS compatible"
  /\bnozzle/i,
  /\bhotend/i,
  /\bextruder/i,
  /\bbuild\s*plate/i,
  /\btextured.*plate/i,
  /\bpei\b/i,
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
  
  // Bundle/pack products
  /super\s*pack/i,
  /starter\s*(?:kit|pack)/i,
  /multi[\s-]*pack/i,
  /variety\s*pack/i,
  /bundle/i,
  
  // Gift cards
  /gift\s*card/i,
  /voucher/i,
];

export function isBambuLabNonFilament(title: string): boolean {
  if (!title) return true;
  
  const t = title.toLowerCase();
  
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
  const normalized = slugOrTitle.toLowerCase().replace(/\s+/g, '-');
  
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
  
  // Support materials
  if (/support.*pla.*petg/i.test(t)) return 'bambulab__support__pla-petg';
  if (/support.*pa.*pet/i.test(t)) return 'bambulab__support__pa-pet';
  if (/support.*pla/i.test(t)) return 'bambulab__support__pla';
  if (/support.*abs/i.test(t)) return 'bambulab__support__abs';
  if (/support[- ]?g\b/i.test(t)) return 'bambulab__support__g';
  if (/support[- ]?w\b/i.test(t)) return 'bambulab__support__w';
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
  const normalized = slugOrTitle.toLowerCase().replace(/\s+/g, '-');
  
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
  
  // Try partial matches
  for (const [key, config] of Object.entries(BAMBULAB_PRODUCT_LINES)) {
    if (normalized.includes(key)) {
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

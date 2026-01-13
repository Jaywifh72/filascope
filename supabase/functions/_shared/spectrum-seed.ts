/**
 * SPECTRUM FILAMENTS SEED DATA
 * 
 * CSV-seeded sync architecture for Spectrum Filaments.
 * 662 products across 40+ material types from Shopify CA store.
 */

export interface SpectrumSeedProduct {
  title: string;
  material: string;
  productUrl: string;
  color: string;
  imageUrl: string;
  colorHex: string | null;
  tdsUrl: string | null;
}

// Import embedded seed data
import { SPECTRUM_SEED_DATA } from './spectrum-seed-data.ts';

// Load seed data (synchronous - data is embedded)
export function loadSpectrumSeed(): SpectrumSeedProduct[] {
  console.log(`Loaded ${SPECTRUM_SEED_DATA.length} Spectrum products from embedded seed`);
  return SPECTRUM_SEED_DATA.filter(p => !isExcludedProduct(p.title, p.material));
}

function isExcludedProduct(title: string, material: string): boolean {
  const t = (title + ' ' + material).toLowerCase();
  
  // Exclude sample packs and bundles (5PACK, bundle, combo, gift, starter kit, variety)
  if (/5pack|bundle|combo|gift|starter\s*kit|variety/i.test(t)) return true;
  
  // Exclude non-standard weights (filter out <250g samples, >5500g bulk)
  const weightMatch = title.match(/(\d+(?:\.\d+)?)\s*(kg|g)/i);
  if (weightMatch) {
    const value = parseFloat(weightMatch[1]);
    const unit = weightMatch[2].toLowerCase();
    const grams = unit === 'kg' ? value * 1000 : value;
    
    // Keep 0.25kg (250g) and above, exclude <250g and >5500g
    if (grams < 250 || grams > 5500) return true;
  }
  
  // Exclude 2.85mm/3mm diameter
  if (/2\.85\s*mm|3\.0?\s*mm/i.test(title)) return true;
  
  // Exclude non-filament products
  if (/accessory|swatch|card|gift\s*card|3d\s*pen/i.test(t)) return true;
  
  return false;
}

// Group products by product line for UI display
export function groupSpectrumByProductLine(products: SpectrumSeedProduct[]): Map<string, SpectrumSeedProduct[]> {
  const groups = new Map<string, SpectrumSeedProduct[]>();
  
  for (const product of products) {
    const lineId = generateSpectrumProductLineIdFromSeed(product);
    
    if (!groups.has(lineId)) {
      groups.set(lineId, []);
    }
    groups.get(lineId)!.push(product);
  }
  
  return groups;
}

export function generateSpectrumProductLineIdFromSeed(product: SpectrumSeedProduct): string {
  const material = product.material || 'PLA';
  const t = product.title.toLowerCase();
  
  // Detect ReFill variant
  const isRefill = /refill/i.test(t);
  const suffix = isRefill ? '__refill' : '__standard';
  
  // ========== "THE FILAMENT" SUB-BRAND (MUST BE FIRST!) ==========
  // These products have titles like "The Filament PETG CF 1.75mm TRANSPARENT BLUE 1kg"
  if (/^the\s+filament/i.test(t)) {
    // Carbon Fiber variants
    if (/petg\s*cf/i.test(t)) return `spectrum__the-filament-petg-cf${suffix}`;
    if (/pla\s*cf/i.test(t)) return `spectrum__the-filament-pla-cf${suffix}`;
    
    // High Speed variants
    if (/petg\s*hs/i.test(t)) return `spectrum__the-filament-petg-hs${suffix}`;
    if (/pla\s*hs/i.test(t)) return `spectrum__the-filament-pla-hs${suffix}`;
    
    // Standard PETG/PLA
    if (/petg/i.test(t)) return `spectrum__the-filament-petg${suffix}`;
    if (/pla/i.test(t)) return `spectrum__the-filament-pla${suffix}`;
    
    // Fallback for unknown "The Filament" products
    return `spectrum__the-filament${suffix}`;
  }
  
  // ========== HIGH-SPEED VARIANTS ==========
  if (/premium\s*pla\s*high\s*speed|pla\s*high\s*speed/i.test(t)) {
    return `spectrum__premium-pla-high-speed${suffix}`;
  }
  if (/pet-?g\s*premium\s*high\s*speed|petg\s*high\s*speed/i.test(t)) {
    return `spectrum__pet-g-premium-high-speed${suffix}`;
  }
  
  // ========== SPECIALTY MATERIALS (separate from PLA Premium) ==========
  if (/r-pla/i.test(t)) return `spectrum__r-pla${suffix}`;
  if (/hips-x|hips\s*x/i.test(t)) return `spectrum__hips-x${suffix}`;
  if (/pla\s*metal/i.test(t)) return `spectrum__pla-metal${suffix}`;
  
  // ========== SPECIALTY PLA LINES ==========
  if (/pla\s*magic\s*silk/i.test(t)) return `spectrum__pla-magic-silk${suffix}`;
  if (/pla\s*silk\s*rainbow/i.test(t)) return `spectrum__pla-silk-rainbow${suffix}`;
  if (/pla\s*silk/i.test(t)) return `spectrum__pla-silk${suffix}`;
  if (/pastello\s*pla/i.test(t)) return `spectrum__pastello-pla${suffix}`;
  if (/flameguard\s*pla/i.test(t)) return `spectrum__flameguard-pla${suffix}`;
  if (/safeguard\s*pla/i.test(t)) return `spectrum__safeguard-pla${suffix}`;
  if (/aquaprint\s*pla/i.test(t)) return `spectrum__aquaprint-pla${suffix}`;
  if (/pla\s*glitter/i.test(t)) return `spectrum__pla-glitter${suffix}`;
  if (/pla\s*crystal/i.test(t)) return `spectrum__pla-crystal${suffix}`;
  if (/pla\s*matt|pla\s*matte/i.test(t)) return `spectrum__pla-matte${suffix}`;
  if (/pla\s*glow/i.test(t)) return `spectrum__pla-glow-in-the-dark${suffix}`;
  if (/pla\s*carbon/i.test(t)) return `spectrum__pla-carbon${suffix}`;
  if (/pla\s*stone\s*age/i.test(t)) return `spectrum__pla-stone-age${suffix}`;
  if (/pla\s*premium/i.test(t)) return `spectrum__pla-premium${suffix}`;
  
  // ========== ASA VARIANTS ==========
  if (/flameguard\s*asa/i.test(t)) return `spectrum__flameguard-asa-275${suffix}`;
  if (/asa[\s-]*x[\s-]*cf/i.test(t)) return `spectrum__asa-x-cf10${suffix}`;
  if (/asa[\s-]*x[\s-]*gf/i.test(t)) return `spectrum__asa-x-gf10${suffix}`;
  if (/asa[\s-]*kevlar/i.test(t)) return `spectrum__asa-kevlar${suffix}`;
  if (/asa\s*275|asa/i.test(t)) return `spectrum__asa-275${suffix}`;
  
  // ========== PETG VARIANTS ==========
  if (/pet-?g\s*glow/i.test(t)) return `spectrum__pet-g-glow-in-the-dark${suffix}`;
  if (/pctg\s*cf/i.test(t)) return `spectrum__pctg-cf10${suffix}`;
  if (/pctg\s*gf/i.test(t)) return `spectrum__pctg-gf10${suffix}`;
  if (/pctg\s*premium|pctg/i.test(t)) return `spectrum__pctg-premium${suffix}`;
  if (/pet-?g\s*premium/i.test(t)) return `spectrum__pet-g-premium${suffix}`;
  
  // ========== ENGINEERING MATERIALS ==========
  if (/nylon\s*pa6\s*gf30/i.test(t)) return `spectrum__nylon-pa6-gf30-low-warp${suffix}`;
  if (/nylon\s*pa6.*gf15s/i.test(t)) return `spectrum__nylon-pa6-low-warp-gf15s${suffix}`;
  if (/nylon\s*pa6/i.test(t)) return `spectrum__nylon-pa6-low-warp${suffix}`;
  if (/pa12[\s-]*cf/i.test(t)) return `spectrum__pa12-cf15${suffix}`;
  if (/pa6[\s-]*cf/i.test(t)) return `spectrum__pa6-cf15${suffix}`;
  if (/pa6[\s-]*cs20/i.test(t)) return `spectrum__pa6-cs20-fr-v0${suffix}`;
  if (/pa6[\s-]*gk/i.test(t)) return `spectrum__pa6-gk10${suffix}`;
  if (/pa6[\s-]*neat/i.test(t)) return `spectrum__pa6-neat${suffix}`;
  if (/pc[\s-]*abs/i.test(t)) return `spectrum__pc-abs${suffix}`;
  if (/pc[\s-]*ptfe/i.test(t)) return `spectrum__pc-ptfe${suffix}`;
  if (/pc[\s-]*275|polycarbonate/i.test(t)) return `spectrum__pc-275${suffix}`;
  
  // ========== ABS/SMART ==========
  if (/smart\s*abs/i.test(t)) return `spectrum__smart-abs${suffix}`;
  
  // ========== FLEXIBLE ==========
  if (/s-?flex\s*90a/i.test(t)) return `spectrum__s-flex-90a${suffix}`;
  if (/s-?flex\s*85a/i.test(t)) return `spectrum__s-flex-85a${suffix}`;
  
  // ========== WOOD ==========
  if (/wood/i.test(t)) return `spectrum__wood${suffix}`;
  
  // ========== FALLBACK: Use material slug ==========
  let matSlug = material
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `spectrum__${matSlug}${suffix}`;
}

// Expected product line counts for Post Sync Check validation
// These are approximate counts - actual may vary slightly based on Shopify catalog
export const SPECTRUM_EXPECTED_PRODUCT_LINES: Record<string, number> = {
  // ========== "THE FILAMENT" SUB-BRAND ==========
  'spectrum__the-filament-petg__standard': 8,
  'spectrum__the-filament-petg__refill': 6,
  'spectrum__the-filament-petg-cf__standard': 6,
  'spectrum__the-filament-petg-cf__refill': 5,
  'spectrum__the-filament-pla__standard': 8,
  'spectrum__the-filament-pla__refill': 5,
  'spectrum__the-filament-pla-cf__standard': 6,
  'spectrum__the-filament-pla-cf__refill': 4,
  'spectrum__the-filament-petg-hs__standard': 6,
  'spectrum__the-filament-petg-hs__refill': 4,
  'spectrum__the-filament-pla-hs__standard': 6,
  'spectrum__the-filament-pla-hs__refill': 4,
  
  // ========== PLA Family ==========
  'spectrum__pla-premium__standard': 40,
  'spectrum__pla-premium__refill': 20,
  'spectrum__pla-silk__standard': 30,
  'spectrum__pla-silk__refill': 15,
  'spectrum__pla-magic-silk__standard': 25,
  'spectrum__pla-silk-rainbow__standard': 5,
  'spectrum__pla-silk-rainbow__refill': 5,
  'spectrum__pastello-pla__standard': 12,
  'spectrum__pastello-pla__refill': 10,
  'spectrum__premium-pla-high-speed__standard': 20,
  'spectrum__premium-pla-high-speed__refill': 18,
  'spectrum__pla-glitter__standard': 8,
  'spectrum__pla-crystal__standard': 6,
  'spectrum__pla-matte__standard': 8,
  'spectrum__pla-glow-in-the-dark__standard': 5,
  'spectrum__pla-carbon__standard': 4,
  'spectrum__pla-stone-age__standard': 4,
  'spectrum__flameguard-pla__standard': 8,
  'spectrum__flameguard-pla__refill': 2,
  'spectrum__safeguard-pla__standard': 6,
  'spectrum__aquaprint-pla__standard': 5,
  
  // ========== PETG Family ==========
  'spectrum__pet-g-premium__standard': 16,
  'spectrum__pet-g-premium__refill': 10,
  'spectrum__pet-g-premium-high-speed__standard': 10,
  'spectrum__pet-g-premium-high-speed__refill': 8,
  'spectrum__pctg-premium__standard': 10,
  'spectrum__pctg-premium__refill': 8,
  'spectrum__pctg-cf10__standard': 2,
  'spectrum__pctg-gf10__standard': 2,
  'spectrum__pet-g-glow-in-the-dark__standard': 3,
  
  // ========== ASA Family ==========
  'spectrum__asa-275__standard': 12,
  'spectrum__asa-275__refill': 12,
  'spectrum__flameguard-asa-275__standard': 8,
  'spectrum__flameguard-asa-275__refill': 2,
  'spectrum__asa-x-cf10__standard': 2,
  'spectrum__asa-x-cf10__refill': 1,
  'spectrum__asa-x-gf10__standard': 4,
  'spectrum__asa-kevlar__standard': 2,
  
  // ========== ABS Family ==========
  'spectrum__smart-abs__standard': 12,
  'spectrum__smart-abs__refill': 8,
  
  // ========== Engineering ==========
  'spectrum__pc-275__standard': 10,
  'spectrum__pc-abs__standard': 4,
  'spectrum__pc-ptfe__standard': 1,
  'spectrum__nylon-pa6-low-warp__standard': 6,
  'spectrum__nylon-pa6-gf30-low-warp__standard': 2,
  'spectrum__nylon-pa6-low-warp-gf15s__standard': 2,
  'spectrum__pa6-cf15__standard': 1,
  'spectrum__pa6-cs20-fr-v0__standard': 4,
  'spectrum__pa6-gk10__standard': 2,
  'spectrum__pa6-neat__standard': 4,
  'spectrum__pa12-cf15__standard': 1,
  
  // ========== Flexible ==========
  'spectrum__s-flex-90a__standard': 8,
  'spectrum__s-flex-85a__standard': 6,
  
  // ========== Specialty Materials ==========
  'spectrum__wood__standard': 6,
  'spectrum__r-pla__standard': 4,
  'spectrum__r-pla__refill': 2,
  'spectrum__hips-x__standard': 2,
  'spectrum__pla-metal__standard': 6,
};

// Total expected filament cards in UI (unique product lines)
// Updated to include "The Filament" sub-brand lines and specialty materials
export const SPECTRUM_EXPECTED_CARD_COUNT = Object.keys(SPECTRUM_EXPECTED_PRODUCT_LINES).length;

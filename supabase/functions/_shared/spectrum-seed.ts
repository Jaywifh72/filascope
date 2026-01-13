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
  
  // Normalize material for ID
  let matSlug = material
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Detect ReFill variant
  const isRefill = /refill/i.test(t);
  
  // Build product line ID
  let lineId = `spectrum__${matSlug}`;
  
  // Add ReFill suffix if applicable
  if (isRefill) {
    lineId += '__refill';
  } else {
    lineId += '__standard';
  }
  
  return lineId;
}

// Expected product line counts for Post Sync Check validation
export const SPECTRUM_EXPECTED_PRODUCT_LINES: Record<string, number> = {
  'spectrum__pla-premium__standard': 47,
  'spectrum__pla-premium__refill': 21,
  'spectrum__pla-silk__standard': 32,
  'spectrum__pla-silk__refill': 16,
  'spectrum__pet-g-premium__standard': 18,
  'spectrum__pet-g-premium__refill': 12,
  'spectrum__asa-275__standard': 14,
  'spectrum__asa-275__refill': 14,
  'spectrum__pla-magic-silk__standard': 30,
  'spectrum__premium-pla-high-speed__standard': 22,
  'spectrum__premium-pla-high-speed__refill': 20,
  'spectrum__pastello-pla__standard': 12,
  'spectrum__pastello-pla__refill': 12,
  'spectrum__pla-silk-rainbow__standard': 6,
  'spectrum__pla-silk-rainbow__refill': 6,
  'spectrum__flameguard-pla__standard': 8,
  'spectrum__flameguard-pla__refill': 2,
  'spectrum__flameguard-asa-275__standard': 10,
  'spectrum__flameguard-asa-275__refill': 2,
  'spectrum__safeguard-pla__standard': 6,
  'spectrum__pctg-premium__standard': 10,
  'spectrum__pctg-premium__refill': 8,
  'spectrum__pet-g-premium-high-speed__standard': 10,
  'spectrum__pet-g-premium-high-speed__refill': 10,
  'spectrum__smart-abs__standard': 14,
  'spectrum__smart-abs__refill': 10,
  'spectrum__pc-275__standard': 12,
  'spectrum__pla-glitter__standard': 8,
  'spectrum__pla-crystal__standard': 6,
  'spectrum__pla-matte__standard': 8,
  'spectrum__pla-glow-in-the-dark__standard': 5,
  'spectrum__pla-carbon__standard': 4,
  'spectrum__pla-stone-age__standard': 4,
  'spectrum__wood__standard': 6,
  'spectrum__s-flex-90a__standard': 8,
  'spectrum__asa-x-cf10__standard': 2,
  'spectrum__asa-x-cf10__refill': 1,
  'spectrum__asa-x-gf10__standard': 4,
  'spectrum__nylon-pa6-low-warp__standard': 6,
  'spectrum__nylon-pa6-gf30-low-warp__standard': 2,
  'spectrum__nylon-pa6-low-warp-gf15s__standard': 2,
  'spectrum__pa6-cf15__standard': 1,
  'spectrum__pa6-cs20-fr-v0__standard': 4,
  'spectrum__pa6-gk10__standard': 2,
  'spectrum__pa6-neat__standard': 4,
  'spectrum__pa12-cf15__standard': 1,
  'spectrum__pc-abs__standard': 4,
  'spectrum__pc-ptfe__standard': 1,
  'spectrum__pctg-cf10__standard': 2,
  'spectrum__pctg-gf10__standard': 2,
  'spectrum__aquaprint-pla__standard': 5,
  'spectrum__asa-kevlar__standard': 2,
  'spectrum__pet-g-glow-in-the-dark__standard': 3,
};

// Total expected filament cards in UI (unique product lines)
export const SPECTRUM_EXPECTED_CARD_COUNT = Object.keys(SPECTRUM_EXPECTED_PRODUCT_LINES).length;

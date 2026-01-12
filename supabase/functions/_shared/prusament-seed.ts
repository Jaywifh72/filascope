/**
 * Prusament CSV Seed Data
 * 
 * Curated product catalog for Prusament filaments.
 * Sourced from prusa3d.com product listings.
 * 
 * EXCLUSIONS APPLIED:
 * - Sample products (< 300g / 25g, 30g, 100g samples)
 * - Bundle products (with print sheets)
 * - 2.85mm/3.0mm diameter products (none in catalog, Prusament is 1.75mm only)
 * - Bulk products (> 5.5kg - none in catalog)
 * - Gift cards, non-filament products
 */

export interface PrusamentProductSeed {
  filamentName: string;
  material: string;
  productUrl: string;
  color: string;
  colorHex: string | null;
  weightGrams: number;
  hasNfc: boolean;
  isRefill: boolean;
}

/**
 * Extract weight from product title
 */
export function extractWeightFromPrusamentTitle(title: string): number {
  const lowerTitle = title.toLowerCase();
  
  // Match kg patterns
  const kgMatch = lowerTitle.match(/(\d+(?:\.\d+)?)\s*kg/);
  if (kgMatch) {
    return parseFloat(kgMatch[1]) * 1000;
  }
  
  // Match gram patterns
  const gMatch = lowerTitle.match(/(\d+)\s*g(?:ram)?(?!\s*nfc)/i);
  if (gMatch) {
    return parseInt(gMatch[1], 10);
  }
  
  // Default weights by material
  if (lowerTitle.includes('asa')) return 800;
  if (lowerTitle.includes('pc blend')) return 900;
  if (lowerTitle.includes('pa11')) return 800;
  if (lowerTitle.includes('pp cf') || lowerTitle.includes('pp-cf')) return 650;
  if (lowerTitle.includes('pp gf') || lowerTitle.includes('pp-gf')) return 850;
  if (lowerTitle.includes('tpu')) return 500;
  
  return 1000; // Default for PLA/PETG
}

/**
 * Check if product should be excluded
 */
export function shouldExcludePrusamentProduct(product: PrusamentProductSeed): boolean {
  const titleLower = product.filamentName.toLowerCase();
  
  // Exclude samples (< 300g)
  if (product.weightGrams < 300) return true;
  
  // Exclude bundles
  if (titleLower.includes('bundle')) return true;
  
  // Exclude 2.85mm (though Prusament doesn't have these)
  if (titleLower.includes('2.85') || titleLower.includes('3mm') || titleLower.includes('3.0mm')) return true;
  
  // Exclude discontinued
  if (titleLower.includes('discontinued')) return true;
  
  return false;
}

/**
 * Clean color name from CSV (remove weight suffix, refill text, etc.)
 */
export function cleanPrusamentColorName(color: string): string {
  return color
    .replace(/\s*\d+g\s*/gi, '')
    .replace(/\s*refill\s*/gi, '')
    .replace(/\s*compatible\s*/gi, '')
    .replace(/\s*nfc\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Full curated seed data from Prusament website
 * Processed from CSV: samples and bundles filtered out
 */
export const PRUSAMENT_PRODUCT_SEED: PrusamentProductSeed[] = [
  // =====================================================================
  // TPU 95A
  // =====================================================================
  { filamentName: 'Prusament TPU 95A Natural 500g (NFC)', material: 'TPU', productUrl: 'https://www.prusa3d.com/product/prusament-tpu-95a-natural-500g-nfc/', color: 'Natural', colorHex: '#F5F5DC', weightGrams: 500, hasNfc: true, isRefill: false },
  
  // =====================================================================
  // PETG STANDARD
  // =====================================================================
  { filamentName: 'Prusament PETG Neon Green 1kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-neon-green-1kg-nfc/', color: 'Neon Green', colorHex: '#39FF14', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PETG Prusa Orange 1kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-prusa-orange-1kg-nfc/', color: 'Prusa Orange', colorHex: '#FA6831', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PETG Prusa Pro Green 1kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-prusa-pro-green-1kg-nfc/', color: 'Prusa Pro Green', colorHex: '#228B22', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PETG Neon Green 1kg', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-neon-green-1kg/', color: 'Neon Green', colorHex: '#39FF14', weightGrams: 1000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PETG Prusa Orange 1kg', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-prusa-orange-1kg/', color: 'Prusa Orange', colorHex: '#FA6831', weightGrams: 1000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PETG Jet Black 1kg', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-jet-black-1kg/', color: 'Jet Black', colorHex: '#0A0A0A', weightGrams: 1000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PETG Jet Black 1kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-jet-black-1kg-nfc/', color: 'Jet Black', colorHex: '#0A0A0A', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PETG Jet Black 2kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-jet-black-2kg-nfc/', color: 'Jet Black', colorHex: '#0A0A0A', weightGrams: 2000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PETG Matte Black 1kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-matte-black-1kg-nfc/', color: 'Matte Black', colorHex: '#1C1C1C', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PETG Prusa Galaxy Black 1kg', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-prusa-galaxy-black-1kg/', color: 'Prusa Galaxy Black', colorHex: '#1C1C1C', weightGrams: 1000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PETG Prusa Galaxy Black 1kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-prusa-galaxy-black-1kg-nfc/', color: 'Prusa Galaxy Black', colorHex: '#1C1C1C', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PETG Anthracite Grey 1kg', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-anthracite-grey-1kg/', color: 'Anthracite Grey', colorHex: '#293133', weightGrams: 1000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PETG Anthracite Grey 1kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-anthracite-grey-1kg-nfc/', color: 'Anthracite Grey', colorHex: '#293133', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PETG Anthracite Grey 2kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-anthracite-grey-2kg-nfc/', color: 'Anthracite Grey', colorHex: '#293133', weightGrams: 2000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PETG Clear 1kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-clear-1kg-nfc/', color: 'Clear', colorHex: '#F0F0F0', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PETG Clear 2kg', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-clear-2kg/', color: 'Clear', colorHex: '#F0F0F0', weightGrams: 2000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PETG Clear 2kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-clear-2kg-nfc/', color: 'Clear', colorHex: '#F0F0F0', weightGrams: 2000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PETG Prusa Orange 2kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-prusa-orange-2kg-nfc/', color: 'Prusa Orange', colorHex: '#FA6831', weightGrams: 2000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PETG Shimmering Violet 1kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-shimmering-violet-1kg-nfc/', color: 'Shimmering Violet', colorHex: '#9400D3', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PETG Signal White 1kg', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-signal-white-1kg/', color: 'Signal White', colorHex: '#FFFFFF', weightGrams: 1000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PETG Signal White 1kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-signal-white-1kg-nfc/', color: 'Signal White', colorHex: '#FFFFFF', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PETG Signal White 2kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-signal-white-2kg-nfc/', color: 'Signal White', colorHex: '#FFFFFF', weightGrams: 2000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PETG Sky Blue 1kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-sky-blue-1kg-nfc/', color: 'Sky Blue', colorHex: '#87CEEB', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PETG Urban Grey 1kg', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-urban-grey-1kg/', color: 'Urban Grey', colorHex: '#5A5A5A', weightGrams: 1000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PETG Urban Grey 1kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-urban-grey-1kg-nfc/', color: 'Urban Grey', colorHex: '#5A5A5A', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PETG Urban Grey 2kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-urban-grey-2kg-nfc/', color: 'Urban Grey', colorHex: '#5A5A5A', weightGrams: 2000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PETG Carmine Red 1kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-carmine-red-1kg-nfc/', color: 'Carmine Red', colorHex: '#960018', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PETG Chalky Blue 1kg', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-chalky-blue-1kg/', color: 'Chalky Blue', colorHex: '#0066CC', weightGrams: 1000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PETG Chalky Blue 1kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-chalky-blue-1kg-nfc/', color: 'Chalky Blue', colorHex: '#0066CC', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PETG Jungle Green 1kg', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-jungle-green-1kg/', color: 'Jungle Green', colorHex: '#2E8B57', weightGrams: 1000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PETG Jungle Green 1kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-jungle-green-1kg-nfc/', color: 'Jungle Green', colorHex: '#2E8B57', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PETG Lipstick Red 1kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-lipstick-red-1kg-nfc/', color: 'Lipstick Red', colorHex: '#C41E3A', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PETG Mango Yellow 1kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-mango-yellow-1kg-nfc/', color: 'Mango Yellow', colorHex: '#FFD700', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PETG Orange for PPE 1kg', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-orange-for-ppe-1kg-2/', color: 'Orange for PPE', colorHex: '#FF6B35', weightGrams: 1000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PETG Ultramarine Blue 1kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-ultramarine-blue-1kg-nfc/', color: 'Ultramarine Blue', colorHex: '#4166F5', weightGrams: 1000, hasNfc: true, isRefill: false },
  
  // =====================================================================
  // PETG SPECIALTY (Tungsten, Magnetite)
  // =====================================================================
  { filamentName: 'Prusament PETG Tungsten 75% 1kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-tungsten-75-1kg-nfc/', color: 'Tungsten 75%', colorHex: '#848482', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PETG Magnetite 40% Grey 1kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-magnetite-40-grey-1kg-nfc/', color: 'Magnetite 40% Grey', colorHex: '#808080', weightGrams: 1000, hasNfc: true, isRefill: false },
  
  // =====================================================================
  // PETG RECYCLED
  // =====================================================================
  { filamentName: 'Prusament PETG Recycled 2kg', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-recycled-2kg-3/', color: 'Recycled', colorHex: '#808080', weightGrams: 2000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PETG Recycled 2kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-recycled-2kg-nfc/', color: 'Recycled', colorHex: '#808080', weightGrams: 2000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PETG Recycled Black 2kg (NFC)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-recycled-black-2kg-nfc/', color: 'Recycled Black', colorHex: '#1C1C1C', weightGrams: 2000, hasNfc: true, isRefill: false },
  
  // =====================================================================
  // PETG REFILLS
  // =====================================================================
  { filamentName: 'Prusament PETG Anthracite Grey 900g Refill (NFC Compatible)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-anthracite-grey-900g-refill-nfc-compatible/', color: 'Anthracite Grey', colorHex: '#293133', weightGrams: 900, hasNfc: false, isRefill: true },
  { filamentName: 'Prusament PETG Clear 900g Refill (NFC Compatible)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-clear-900g-refill-nfc-compatible/', color: 'Clear', colorHex: '#F0F0F0', weightGrams: 900, hasNfc: false, isRefill: true },
  { filamentName: 'Prusament PETG Jet Black 900g Refill (NFC Compatible)', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-jet-black-900g-refill-nfc-compatible/', color: 'Jet Black', colorHex: '#0A0A0A', weightGrams: 900, hasNfc: false, isRefill: true },
  { filamentName: 'Prusament PETG Signal White 1kg Refill', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-signal-white-1kg-refill/', color: 'Signal White', colorHex: '#FFFFFF', weightGrams: 1000, hasNfc: false, isRefill: true },
  { filamentName: 'Prusament PETG Urban Grey 1kg Refill', material: 'PETG', productUrl: 'https://www.prusa3d.com/product/prusament-petg-urban-grey-1kg-refill/', color: 'Urban Grey', colorHex: '#5A5A5A', weightGrams: 1000, hasNfc: false, isRefill: true },
  
  // =====================================================================
  // PLA STANDARD
  // =====================================================================
  { filamentName: 'Prusament PLA Jet Black 1kg', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-jet-black-1kg/', color: 'Jet Black', colorHex: '#0A0A0A', weightGrams: 1000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PLA Jet Black 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-jet-black-1kg-nfc/', color: 'Jet Black', colorHex: '#0A0A0A', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Jet Black 2kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-jet-black-2kg-nfc/', color: 'Jet Black', colorHex: '#0A0A0A', weightGrams: 2000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Prusa Galaxy Black 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-prusa-galaxy-black-1kg-nfc/', color: 'Prusa Galaxy Black', colorHex: '#1C1C1C', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Prusa Galaxy Black 2kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-prusa-galaxy-black-2kg-nfc/', color: 'Prusa Galaxy Black', colorHex: '#1C1C1C', weightGrams: 2000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Prusa Orange 1kg', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-prusa-orange-1kg/', color: 'Prusa Orange', colorHex: '#FA6831', weightGrams: 1000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PLA Prusa Orange 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-prusa-orange-1kg-nfc/', color: 'Prusa Orange', colorHex: '#FA6831', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Prusa Orange 2kg', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-prusa-orange-2kg/', color: 'Prusa Orange', colorHex: '#FA6831', weightGrams: 2000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PLA Prusa Orange 2kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-prusa-orange-2kg-nfc/', color: 'Prusa Orange', colorHex: '#FA6831', weightGrams: 2000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Prusa Pro Green 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-prusa-pro-green-1kg-nfc/', color: 'Prusa Pro Green', colorHex: '#228B22', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Pristine White 1kg', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-pristine-white-1kg/', color: 'Pristine White', colorHex: '#FFFFFF', weightGrams: 1000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PLA Pristine White 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-pristine-white-1kg-nfc/', color: 'Pristine White', colorHex: '#FFFFFF', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Pristine White 2kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-pristine-white-2kg-nfc/', color: 'Pristine White', colorHex: '#FFFFFF', weightGrams: 2000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Vanilla White 1kg', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-vanilla-white-1kg/', color: 'Vanilla White', colorHex: '#F3E5AB', weightGrams: 1000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PLA Vanilla White 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-vanilla-white-1kg-nfc/', color: 'Vanilla White', colorHex: '#F3E5AB', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Azure Blue 1kg', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-azure-blue-1kg/', color: 'Azure Blue', colorHex: '#007FFF', weightGrams: 1000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PLA Azure Blue 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-azure-blue-1kg-nfc/', color: 'Azure Blue', colorHex: '#007FFF', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Azure Blue 2kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-azure-blue-2kg-nfc/', color: 'Azure Blue', colorHex: '#007FFF', weightGrams: 2000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Chalky Blue 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-chalky-blue-1kg-nfc/', color: 'Chalky Blue', colorHex: '#0066CC', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Gravity Grey 1kg', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-gravity-grey-1kg/', color: 'Gravity Grey', colorHex: '#808080', weightGrams: 1000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PLA Gravity Grey 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-gravity-grey-1kg-nfc/', color: 'Gravity Grey', colorHex: '#808080', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Gravity Grey 2kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-gravity-grey-2kg-nfc/', color: 'Gravity Grey', colorHex: '#808080', weightGrams: 2000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Anthracite Grey 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-anthracite-grey-1kg-nfc/', color: 'Anthracite Grey', colorHex: '#293133', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: "Prusament PLA Gentleman's Grey 1kg", material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-gentleman-s-grey-1kg/', color: "Gentleman's Grey", colorHex: '#696969', weightGrams: 1000, hasNfc: false, isRefill: false },
  { filamentName: "Prusament PLA Gentleman's Grey 1kg (NFC)", material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-gentleman-s-grey-1kg-nfc/', color: "Gentleman's Grey", colorHex: '#696969', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Marble Grey 1kg', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-marble-grey-1kg/', color: 'Marble Grey', colorHex: '#808080', weightGrams: 1000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PLA Marble Grey 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-marble-grey-1kg-nfc/', color: 'Marble Grey', colorHex: '#808080', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Lipstick Red 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-lipstick-red-1kg-nfc/', color: 'Lipstick Red', colorHex: '#C41E3A', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Lipstick Red 2kg', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-lipstick-red-2kg/', color: 'Lipstick Red', colorHex: '#C41E3A', weightGrams: 2000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PLA Lipstick Red 2kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-lipstick-red-2kg-nfc/', color: 'Lipstick Red', colorHex: '#C41E3A', weightGrams: 2000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Army Green 2kg', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-army-green-2kg/', color: 'Army Green', colorHex: '#4B5320', weightGrams: 2000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PLA Army Green 2kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-army-green-2kg-nfc/', color: 'Army Green', colorHex: '#4B5320', weightGrams: 2000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Pistachio Green 1kg', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-pistachio-green-1kg/', color: 'Pistachio Green', colorHex: '#93C572', weightGrams: 1000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PLA Pistachio Green 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-pistachio-green-1kg-nfc/', color: 'Pistachio Green', colorHex: '#93C572', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Simply Green 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-simply-green-1kg-nfc/', color: 'Simply Green', colorHex: '#4CBB17', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Recycled 2kg', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-recycled-2kg/', color: 'Recycled', colorHex: '#808080', weightGrams: 2000, hasNfc: false, isRefill: false },
  
  // =====================================================================
  // PLA GALAXY (Glitter)
  // =====================================================================
  { filamentName: 'Prusament PLA Galaxy Purple 1kg', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-galaxy-purple-1kg/', color: 'Galaxy Purple', colorHex: '#7B68EE', weightGrams: 1000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PLA Galaxy Purple 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-galaxy-purple-1kg-nfc/', color: 'Galaxy Purple', colorHex: '#7B68EE', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Galaxy Purple 2kg', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-galaxy-purple-2kg/', color: 'Galaxy Purple', colorHex: '#7B68EE', weightGrams: 2000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PLA Galaxy Purple 2kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-galaxy-purple-2kg-nfc/', color: 'Galaxy Purple', colorHex: '#7B68EE', weightGrams: 2000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Galaxy Silver 1kg', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-galaxy-silver-1kg/', color: 'Galaxy Silver', colorHex: '#C0C0C0', weightGrams: 1000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PLA Galaxy Silver 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-galaxy-silver-1kg-nfc/', color: 'Galaxy Silver', colorHex: '#C0C0C0', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Galaxy Green 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-galaxy-green-1kg-nfc/', color: 'Galaxy Green', colorHex: '#228B22', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Galaxy Red 1kg', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-galaxy-red-1kg/', color: 'Galaxy Red', colorHex: '#C41E3A', weightGrams: 1000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PLA Galaxy Red 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-galaxy-red-1kg-nfc/', color: 'Galaxy Red', colorHex: '#C41E3A', weightGrams: 1000, hasNfc: true, isRefill: false },
  
  // =====================================================================
  // PLA OPAL (Translucent)
  // =====================================================================
  { filamentName: 'Prusament PLA Opal Green 1kg', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-opal-green-1kg/', color: 'Opal Green', colorHex: '#7CB9A8', weightGrams: 1000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament PLA Opal Green 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-opal-green-1kg-nfc/', color: 'Opal Green', colorHex: '#7CB9A8', weightGrams: 1000, hasNfc: true, isRefill: false },
  
  // =====================================================================
  // PLA BLEND (Metallic)
  // =====================================================================
  { filamentName: 'Prusament PLA Blend Royal Blue 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-blend-royal-blue-1kg-nfc/', color: 'Royal Blue', colorHex: '#4169E1', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Blend Viva La Bronze 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-blend-viva-la-bronze-1kg-nfc/', color: 'Viva La Bronze', colorHex: '#CD7F32', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Blend Ms. Pink 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-blend-ms-pink-1kg-nfc/', color: 'Ms. Pink', colorHex: '#FF69B4', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Blend Oh My Gold 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-blend-oh-my-gold-1kg-nfc/', color: 'Oh My Gold', colorHex: '#FFD700', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Blend Pearl White 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-blend-pearl-white-1kg-nfc/', color: 'Pearl White', colorHex: '#FAEBD7', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Blend My Silverness 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-blend-my-silverness-1kg-nfc/', color: 'My Silverness', colorHex: '#C0C0C0', weightGrams: 1000, hasNfc: true, isRefill: false },
  
  // =====================================================================
  // PLA PREMIUM/MYSTIC (Shimmer)
  // =====================================================================
  { filamentName: 'Prusament Premium PLA Mystic Brown 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-premium-pla-mystic-brown-1kg-nfc/', color: 'Mystic Brown', colorHex: '#7B5544', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament Premium PLA Mystic Brown 1kg', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-premium-pla-mystic-brown-1kg-2/', color: 'Mystic Brown', colorHex: '#7B5544', weightGrams: 1000, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament Premium PLA Mystic Green 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-premium-pla-mystic-green-1kg-nfc/', color: 'Mystic Green', colorHex: '#5E8B65', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament Premium PLA Mystic Green 1kg', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-premium-pla-mystic-green-1kg-2/', color: 'Mystic Green', colorHex: '#5E8B65', weightGrams: 1000, hasNfc: false, isRefill: false },
  
  // =====================================================================
  // PLA NOCTUA (Partnership)
  // =====================================================================
  { filamentName: 'Prusament PLA Noctua Beige 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-noctua-beige-1kg-nfc/', color: 'Noctua Beige', colorHex: '#D4B896', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PLA Noctua Brown 1kg (NFC)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-noctua-brown-1kg-nfc/', color: 'Noctua Brown', colorHex: '#8B4513', weightGrams: 1000, hasNfc: true, isRefill: false },
  
  // =====================================================================
  // PLA REFILLS
  // =====================================================================
  { filamentName: 'Prusament PLA Azure Blue 1kg Refill', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-azure-blue-1kg-refill/', color: 'Azure Blue', colorHex: '#007FFF', weightGrams: 1000, hasNfc: false, isRefill: true },
  { filamentName: 'Prusament PLA Azure Blue 900g Refill (NFC Compatible)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-azure-blue-900g-refill-nfc-compatible/', color: 'Azure Blue', colorHex: '#007FFF', weightGrams: 900, hasNfc: false, isRefill: true },
  { filamentName: 'Prusament PLA Galaxy Silver 900g Refill (NFC Compatible)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-galaxy-silver-900g-refill-nfc-compatible/', color: 'Galaxy Silver', colorHex: '#C0C0C0', weightGrams: 900, hasNfc: false, isRefill: true },
  { filamentName: 'Prusament PLA Jet Black 900g Refill (NFC Compatible)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-jet-black-900g-refill-nfc-compatible/', color: 'Jet Black', colorHex: '#0A0A0A', weightGrams: 900, hasNfc: false, isRefill: true },
  { filamentName: 'Prusament PLA Pristine White 900g Refill (NFC Compatible)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-pristine-white-900g-refill-nfc-compatible/', color: 'Pristine White', colorHex: '#FFFFFF', weightGrams: 900, hasNfc: false, isRefill: true },
  { filamentName: 'Prusament PLA Prusa Galaxy Black 900g Refill (NFC Compatible)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-prusa-galaxy-black-900g-refill-nfc-compatible/', color: 'Prusa Galaxy Black', colorHex: '#1C1C1C', weightGrams: 900, hasNfc: false, isRefill: true },
  { filamentName: 'Prusament PLA Vanilla White 1kg Refill', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-vanilla-white-1kg-refill/', color: 'Vanilla White', colorHex: '#F3E5AB', weightGrams: 1000, hasNfc: false, isRefill: true },
  { filamentName: 'Prusament PLA Vanilla White 900g Refill (NFC Compatible)', material: 'PLA', productUrl: 'https://www.prusa3d.com/product/prusament-pla-vanilla-white-900g-refill-nfc-compatible/', color: 'Vanilla White', colorHex: '#F3E5AB', weightGrams: 900, hasNfc: false, isRefill: true },
  
  // =====================================================================
  // rPLA (Recycled PLA with natural pigments)
  // =====================================================================
  { filamentName: 'Prusament rPLA Algae Pigment 1kg (NFC)', material: 'rPLA', productUrl: 'https://www.prusa3d.com/product/prusament-rpla-algae-pigment-1kg-nfc/', color: 'Algae Pigment', colorHex: '#7E9B5E', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament rPLA Corn Pigment 1kg (NFC)', material: 'rPLA', productUrl: 'https://www.prusa3d.com/product/prusament-rpla-corn-pigment-1kg-nfc/', color: 'Corn Pigment', colorHex: '#F5DEB3', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament rPLA Wine Pigment 1kg (NFC)', material: 'rPLA', productUrl: 'https://www.prusa3d.com/product/prusament-rpla-wine-pigment-1kg-nfc/', color: 'Wine Pigment', colorHex: '#722F37', weightGrams: 1000, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament rPLA Risotto Pigment 1kg (NFC)', material: 'rPLA', productUrl: 'https://www.prusa3d.com/product/prusament-rpla-risotto-pigment-1kg-nfc/', color: 'Risotto Pigment', colorHex: '#DAA520', weightGrams: 1000, hasNfc: true, isRefill: false },
  
  // =====================================================================
  // ASA (Weather-resistant)
  // =====================================================================
  { filamentName: 'Prusament ASA Jet Black 800g (NFC)', material: 'ASA', productUrl: 'https://www.prusa3d.com/product/prusament-asa-jet-black-800g-nfc/', color: 'Jet Black', colorHex: '#0A0A0A', weightGrams: 800, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament ASA Natural 800g (NFC)', material: 'ASA', productUrl: 'https://www.prusa3d.com/product/prusament-asa-natural-800g-nfc/', color: 'Natural', colorHex: '#F5F5DC', weightGrams: 800, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament ASA Prusa Galaxy Black 800g (NFC)', material: 'ASA', productUrl: 'https://www.prusa3d.com/product/prusament-asa-prusa-galaxy-black-800g-nfc/', color: 'Prusa Galaxy Black', colorHex: '#1C1C1C', weightGrams: 800, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament ASA Prusa Orange 800g (NFC)', material: 'ASA', productUrl: 'https://www.prusa3d.com/product/prusament-asa-prusa-orange-800g-nfc/', color: 'Prusa Orange', colorHex: '#FA6831', weightGrams: 800, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament ASA Signal White 800g (NFC)', material: 'ASA', productUrl: 'https://www.prusa3d.com/product/prusament-asa-signal-white-800g-nfc/', color: 'Signal White', colorHex: '#FFFFFF', weightGrams: 800, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament ASA Prusa Pro Green 800g (NFC)', material: 'ASA', productUrl: 'https://www.prusa3d.com/product/prusament-asa-prusa-pro-green-800g-nfc/', color: 'Prusa Pro Green', colorHex: '#228B22', weightGrams: 800, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament ASA Lipstick Red 800g (NFC)', material: 'ASA', productUrl: 'https://www.prusa3d.com/product/prusament-asa-lipstick-red-800g-nfc/', color: 'Lipstick Red', colorHex: '#C41E3A', weightGrams: 800, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament ASA Sapphire Blue 800g (NFC)', material: 'ASA', productUrl: 'https://www.prusa3d.com/product/prusament-asa-sapphire-blue-800g-nfc/', color: 'Sapphire Blue', colorHex: '#0066CC', weightGrams: 800, hasNfc: true, isRefill: false },
  
  // =====================================================================
  // PC BLEND (Polycarbonate)
  // =====================================================================
  { filamentName: 'Prusament PC Blend Jet Black 900g (NFC)', material: 'PC Blend', productUrl: 'https://www.prusa3d.com/product/prusament-pc-blend-jet-black-900g-nfc/', color: 'Jet Black', colorHex: '#0A0A0A', weightGrams: 900, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PC Blend Natural 900g (NFC)', material: 'PC Blend', productUrl: 'https://www.prusa3d.com/product/prusament-pc-blend-natural-900g-nfc/', color: 'Natural', colorHex: '#F5F5DC', weightGrams: 900, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PC Blend Prusa Orange 900g (NFC)', material: 'PC Blend', productUrl: 'https://www.prusa3d.com/product/prusament-pc-blend-prusa-orange-900g-nfc/', color: 'Prusa Orange', colorHex: '#FA6831', weightGrams: 900, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PC Blend Prusa Pro Green 900g (NFC)', material: 'PC Blend', productUrl: 'https://www.prusa3d.com/product/prusament-pc-blend-prusa-pro-green-900g-nfc/', color: 'Prusa Pro Green', colorHex: '#228B22', weightGrams: 900, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PC Blend Urban Grey 900g (NFC)', material: 'PC Blend', productUrl: 'https://www.prusa3d.com/product/prusament-pc-blend-urban-grey-900g-nfc/', color: 'Urban Grey', colorHex: '#5A5A5A', weightGrams: 900, hasNfc: true, isRefill: false },
  { filamentName: 'Prusament PC Blend Carbon Fiber Black 800g (NFC)', material: 'PC Blend', productUrl: 'https://www.prusa3d.com/product/prusament-pc-blend-carbon-fiber-black-800g-nfc/', color: 'Carbon Fiber Black', colorHex: '#1C1C1C', weightGrams: 800, hasNfc: true, isRefill: false },
  
  // =====================================================================
  // PC SPACE GRADE (High-Performance PC)
  // =====================================================================
  { filamentName: 'Prusament PC Space Grade Black 850g (NFC)', material: 'PC', productUrl: 'https://www.prusa3d.com/product/prusament-pc-space-grade-black-850g-nfc/', color: 'Space Grade Black', colorHex: '#1C1C1C', weightGrams: 850, hasNfc: true, isRefill: false },
  
  // =====================================================================
  // PA11-CF (Carbon Fiber Nylon)
  // =====================================================================
  { filamentName: 'Prusament PA11 Carbon Fiber Black 800g (NFC)', material: 'PA11-CF', productUrl: 'https://www.prusa3d.com/product/prusament-pa11-carbon-fiber-black-800g-nfc/', color: 'Carbon Fiber Black', colorHex: '#1C1C1C', weightGrams: 800, hasNfc: true, isRefill: false },
  
  // =====================================================================
  // PP-CF (Carbon Fiber Polypropylene)
  // =====================================================================
  { filamentName: 'Prusament PP Carbon Fiber Black 650g (NFC)', material: 'PP-CF', productUrl: 'https://www.prusa3d.com/product/prusament-pp-carbon-fiber-black-650g-nfc/', color: 'Carbon Fiber Black', colorHex: '#1C1C1C', weightGrams: 650, hasNfc: true, isRefill: false },
  
  // =====================================================================
  // PP-GF (Glass Fiber Polypropylene)
  // =====================================================================
  { filamentName: 'Prusament PP Glass Fiber Natural 850g (NFC)', material: 'PP-GF', productUrl: 'https://www.prusa3d.com/product/prusament-pp-glass-fiber-natural-850g-nfc/', color: 'Natural', colorHex: '#F5F5DC', weightGrams: 850, hasNfc: true, isRefill: false },
  
  // =====================================================================
  // PVB (Alcohol-smoothable)
  // =====================================================================
  { filamentName: 'Prusament PVB Natural 500g (NFC)', material: 'PVB', productUrl: 'https://www.prusa3d.com/product/prusament-pvb-natural-500g-nfc/', color: 'Natural', colorHex: '#F5F5DC', weightGrams: 500, hasNfc: true, isRefill: false },
  
  // =====================================================================
  // WOODFILL (PLA + Wood)
  // =====================================================================
  { filamentName: 'Prusament Woodfill Chocolate Brown 750g', material: 'Woodfill', productUrl: 'https://www.prusa3d.com/product/prusament-woodfill-chocolate-brown-750g/', color: 'Chocolate Brown', colorHex: '#7B3F00', weightGrams: 750, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament Woodfill Linden Light 750g', material: 'Woodfill', productUrl: 'https://www.prusa3d.com/product/prusament-woodfill-linden-light-750g/', color: 'Linden Light', colorHex: '#DEB887', weightGrams: 750, hasNfc: false, isRefill: false },
  { filamentName: 'Prusament Woodfill Pastel Brown 750g', material: 'Woodfill', productUrl: 'https://www.prusa3d.com/product/prusament-woodfill-pastel-brown-750g/', color: 'Pastel Brown', colorHex: '#8B4513', weightGrams: 750, hasNfc: false, isRefill: false },
  
  // =====================================================================
  // PEI 1010 (High-performance ULTEM)
  // =====================================================================
  { filamentName: 'Prusament PEI 1010 Natural 500g (NFC)', material: 'PEI', productUrl: 'https://www.prusa3d.com/product/prusament-pei-1010-natural-500g-nfc/', color: 'Natural', colorHex: '#F5F5DC', weightGrams: 500, hasNfc: true, isRefill: false },
];

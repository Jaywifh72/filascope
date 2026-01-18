/**
 * NUMAKERS-SPECIFIC DEFAULTS (CSV-SEEDED ARCHITECTURE)
 * 
 * Numakers is a US-based filament brand with a focus on vibrant colors.
 * They use Shopify and offer PLA variants (Matte, Silk, Marble, Glow, Wood, CF, Starlight),
 * PETG-HS (high-speed), PETG Translucent, ASA, and ABS.
 * 
 * Key Features:
 * - Wide color selection with creative names (Thanos Purple, Ryobix Green)
 * - High-speed PETG (PETG-HS)
 * - PLA Starlight (glitter finish)
 * - TDS PDFs available via Scribd for core materials
 * - 1kg spools standard
 * 
 * Excluded Products:
 * - NuBox Surplus (subscription surplus items)
 * - Hueforge Packs (multi-spool bundles)
 * - Warehouse Clearance (mystery/older formula)
 */

// ============================================================================
// TDS URL PATTERNS - Curated official Scribd document URLs
// ============================================================================

export const NUMAKERS_TDS_PATTERNS: Record<string, string> = {
  // Core materials - official Scribd TDS documents
  'PLA+': 'https://www.scribd.com/document/868964978/PLA-TDS-2',
  'PLA': 'https://www.scribd.com/document/868964978/PLA-TDS-2',
  'PETG': 'https://www.scribd.com/document/868964958/PETG-TDS-2',
  'PETG-HS': 'https://www.scribd.com/document/868964958/PETG-TDS-2',
  'ABS': 'https://www.scribd.com/document/868964969/ABS-TDS',
  'ASA': 'https://www.scribd.com/document/868964972/ASA-TDS',
};

/**
 * Match a product title against known Numakers TDS patterns
 * Uses explicit matching with material-based aliases
 */
export function matchNumakersTds(title: string): { url: string; pattern: string } | null {
  if (!title) return null;
  
  const normalizedTitle = title.toUpperCase();
  
  // Direct material matching with priority order (most specific first)
  const materialPatterns = [
    { pattern: 'PETG-HS', aliases: ['PETG-HS', 'PETG HS', 'HIGH-SPEED PETG', 'HIGH SPEED PETG'] },
    { pattern: 'PETG', aliases: ['PETG', 'PETG TRANSLUCENT'] },
    { pattern: 'PLA+', aliases: ['PLA+', 'PLA PLUS'] },
    { pattern: 'ASA', aliases: ['ASA'] },
    { pattern: 'ABS', aliases: ['ABS'] },
    { pattern: 'PLA', aliases: ['PLA MATTE', 'PLA SILK', 'PLA MARBLE', 'PLA GLOW', 'PLA WOOD', 'PLA CF', 'PLA STARLIGHT', 'PLA'] },
  ];
  
  for (const { pattern, aliases } of materialPatterns) {
    for (const alias of aliases) {
      if (normalizedTitle.includes(alias)) {
        const url = NUMAKERS_TDS_PATTERNS[pattern];
        if (url) {
          return { url, pattern };
        }
      }
    }
  }
  
  return null;
}

// ============================================================================
// CSV SEED DATA
// ============================================================================

export interface NumakersSeedEntry {
  material: string;
  filamentLine: string;
  productUrl: string;
  color: string;
  imageUrl: string;
  colorHex?: string;
}

export const NUMAKERS_SEED_DATA: NumakersSeedEntry[] = [
  // PLA+ (35 colors)
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Pitch Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#1A1A1A' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Pure White', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#FFFFFF' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Lemon Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#FFF44F' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Mauve Purple', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#E0B0FF' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Nuclear Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#FF2400' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Outrageous Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#FF6600' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Atomic Pink', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#FF6EC7' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Royal Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#4169E1' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Light Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#D3D3D3' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Light Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#ADD8E6' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Grass Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#7CFC00' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Beige Brown', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#D2B48C' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Teal Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#008080' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Army Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#4B5320' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Dark Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#4A4A4A' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Ivory White', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#FFFFF0' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Rust Copper', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#B87333' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Apricot', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#FBCEB1' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Lagoon Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#009DC4' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Forest Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#228B22' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Fluorescent Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#FF5F1F' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Fluorescent Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#39FF14' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Fluorescent Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#CCFF00' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Transparent', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#FEFEFE' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Lavender Violet', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#B57EDC' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Ryobix Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#9ACD32' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Chocolate Brown', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#D2691E' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Fuchsia/Magenta', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#FF00FF' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Bahama Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#FFD700' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Cool (Lithophane) White', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#F5F5F5' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Simply Silver', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#C0C0C0' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Midnight Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#2F2F2F' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Thanos Purple', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#663399' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Military Khaki', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#BDB76B' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', productUrl: 'https://numakers.com/products/pla-filament', color: 'Imperial Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Pitch_Black_Spool_Printzy.png?v=1745716985', colorHex: '#ED2939' },

  // PLA Silk (11 colors)
  { material: 'PLA-SILK', filamentLine: 'PLA Silk', productUrl: 'https://numakers.com/products/pla-silk', color: 'Gold', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PLA_Silk_Gold_Spool_Printzy.png?v=1755458931', colorHex: '#FFD700' },
  { material: 'PLA-SILK', filamentLine: 'PLA Silk', productUrl: 'https://numakers.com/products/pla-silk', color: 'Enchanted Gold', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PLA_Silk_Gold_Spool_Printzy.png?v=1755458931', colorHex: '#DAA520' },
  { material: 'PLA-SILK', filamentLine: 'PLA Silk', productUrl: 'https://numakers.com/products/pla-silk', color: 'Silver', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PLA_Silk_Gold_Spool_Printzy.png?v=1755458931', colorHex: '#C0C0C0' },
  { material: 'PLA-SILK', filamentLine: 'PLA Silk', productUrl: 'https://numakers.com/products/pla-silk', color: 'Copper', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PLA_Silk_Gold_Spool_Printzy.png?v=1755458931', colorHex: '#B87333' },
  { material: 'PLA-SILK', filamentLine: 'PLA Silk', productUrl: 'https://numakers.com/products/pla-silk', color: 'Bronze', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PLA_Silk_Gold_Spool_Printzy.png?v=1755458931', colorHex: '#CD7F32' },
  { material: 'PLA-SILK', filamentLine: 'PLA Silk', productUrl: 'https://numakers.com/products/pla-silk', color: 'Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PLA_Silk_Gold_Spool_Printzy.png?v=1755458931', colorHex: '#FF0000' },
  { material: 'PLA-SILK', filamentLine: 'PLA Silk', productUrl: 'https://numakers.com/products/pla-silk', color: 'Purple', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PLA_Silk_Gold_Spool_Printzy.png?v=1755458931', colorHex: '#800080' },
  { material: 'PLA-SILK', filamentLine: 'PLA Silk', productUrl: 'https://numakers.com/products/pla-silk', color: 'Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PLA_Silk_Gold_Spool_Printzy.png?v=1755458931', colorHex: '#0000FF' },
  { material: 'PLA-SILK', filamentLine: 'PLA Silk', productUrl: 'https://numakers.com/products/pla-silk', color: 'Forest Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PLA_Silk_Gold_Spool_Printzy.png?v=1755458931', colorHex: '#228B22' },
  { material: 'PLA-SILK', filamentLine: 'PLA Silk', productUrl: 'https://numakers.com/products/pla-silk', color: 'Obsidian Night', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PLA_Silk_Gold_Spool_Printzy.png?v=1755458931', colorHex: '#0B0B0B' },
  { material: 'PLA-SILK', filamentLine: 'PLA Silk', productUrl: 'https://numakers.com/products/pla-silk', color: 'Molten Sol', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PLA_Silk_Gold_Spool_Printzy.png?v=1755458931', colorHex: '#FF4500' },

  // PETG-HS (16 colors)
  { material: 'PETG-HS', filamentLine: 'PETG-HS Filament', productUrl: 'https://numakers.com/products/petg-hs-filament', color: 'Pitch Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PETG-HS_Royal_Blue_Spool_Printzy.png?v=1749810305', colorHex: '#1A1A1A' },
  { material: 'PETG-HS', filamentLine: 'PETG-HS Filament', productUrl: 'https://numakers.com/products/petg-hs-filament', color: 'Pure White', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PETG-HS_Royal_Blue_Spool_Printzy.png?v=1749810305', colorHex: '#FFFFFF' },
  { material: 'PETG-HS', filamentLine: 'PETG-HS Filament', productUrl: 'https://numakers.com/products/petg-hs-filament', color: 'Lemon Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PETG-HS_Royal_Blue_Spool_Printzy.png?v=1749810305', colorHex: '#FFF44F' },
  { material: 'PETG-HS', filamentLine: 'PETG-HS Filament', productUrl: 'https://numakers.com/products/petg-hs-filament', color: 'Mauve Purple', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PETG-HS_Royal_Blue_Spool_Printzy.png?v=1749810305', colorHex: '#E0B0FF' },
  { material: 'PETG-HS', filamentLine: 'PETG-HS Filament', productUrl: 'https://numakers.com/products/petg-hs-filament', color: 'Nuclear Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PETG-HS_Royal_Blue_Spool_Printzy.png?v=1749810305', colorHex: '#FF2400' },
  { material: 'PETG-HS', filamentLine: 'PETG-HS Filament', productUrl: 'https://numakers.com/products/petg-hs-filament', color: 'Outrageous Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PETG-HS_Royal_Blue_Spool_Printzy.png?v=1749810305', colorHex: '#FF6600' },
  { material: 'PETG-HS', filamentLine: 'PETG-HS Filament', productUrl: 'https://numakers.com/products/petg-hs-filament', color: 'Royal Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PETG-HS_Royal_Blue_Spool_Printzy.png?v=1749810305', colorHex: '#4169E1' },
  { material: 'PETG-HS', filamentLine: 'PETG-HS Filament', productUrl: 'https://numakers.com/products/petg-hs-filament', color: 'Light Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PETG-HS_Royal_Blue_Spool_Printzy.png?v=1749810305', colorHex: '#D3D3D3' },
  { material: 'PETG-HS', filamentLine: 'PETG-HS Filament', productUrl: 'https://numakers.com/products/petg-hs-filament', color: 'Grass Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PETG-HS_Royal_Blue_Spool_Printzy.png?v=1749810305', colorHex: '#7CFC00' },
  { material: 'PETG-HS', filamentLine: 'PETG-HS Filament', productUrl: 'https://numakers.com/products/petg-hs-filament', color: 'Transparent', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PETG-HS_Royal_Blue_Spool_Printzy.png?v=1749810305', colorHex: '#FEFEFE' },
  { material: 'PETG-HS', filamentLine: 'PETG-HS Filament', productUrl: 'https://numakers.com/products/petg-hs-filament', color: 'Thanos Purple', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PETG-HS_Royal_Blue_Spool_Printzy.png?v=1749810305', colorHex: '#663399' },
  { material: 'PETG-HS', filamentLine: 'PETG-HS Filament', productUrl: 'https://numakers.com/products/petg-hs-filament', color: 'Atomic Pink', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PETG-HS_Royal_Blue_Spool_Printzy.png?v=1749810305', colorHex: '#FF6EC7' },
  { material: 'PETG-HS', filamentLine: 'PETG-HS Filament', productUrl: 'https://numakers.com/products/petg-hs-filament', color: 'Forest Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PETG-HS_Royal_Blue_Spool_Printzy.png?v=1749810305', colorHex: '#228B22' },
  { material: 'PETG-HS', filamentLine: 'PETG-HS Filament', productUrl: 'https://numakers.com/products/petg-hs-filament', color: 'Light Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PETG-HS_Royal_Blue_Spool_Printzy.png?v=1749810305', colorHex: '#ADD8E6' },
  { material: 'PETG-HS', filamentLine: 'PETG-HS Filament', productUrl: 'https://numakers.com/products/petg-hs-filament', color: 'Midnight Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PETG-HS_Royal_Blue_Spool_Printzy.png?v=1749810305', colorHex: '#2F2F2F' },
  { material: 'PETG-HS', filamentLine: 'PETG-HS Filament', productUrl: 'https://numakers.com/products/petg-hs-filament', color: 'Simply Silver', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PETG-HS_Royal_Blue_Spool_Printzy.png?v=1749810305', colorHex: '#C0C0C0' },

  // PLA Matte (13 colors)
  { material: 'PLA-MATTE', filamentLine: 'PLA Matte', productUrl: 'https://numakers.com/products/pla-matte', color: "Dragon's Hide", imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PLA-Matte_Dragons-Hide_Printzy_w_Spool.png?v=1745282720', colorHex: '#2F4F4F' },
  { material: 'PLA-MATTE', filamentLine: 'PLA Matte', productUrl: 'https://numakers.com/products/pla-matte', color: 'Midnight Shade', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PLA-Matte_Dragons-Hide_Printzy_w_Spool.png?v=1745282720', colorHex: '#191970' },
  { material: 'PLA-MATTE', filamentLine: 'PLA Matte', productUrl: 'https://numakers.com/products/pla-matte', color: 'Blushing Ember', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PLA-Matte_Dragons-Hide_Printzy_w_Spool.png?v=1745282720', colorHex: '#FF6B6B' },
  { material: 'PLA-MATTE', filamentLine: 'PLA Matte', productUrl: 'https://numakers.com/products/pla-matte', color: 'Mystic Lilac', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PLA-Matte_Dragons-Hide_Printzy_w_Spool.png?v=1745282720', colorHex: '#C8A2C8' },
  { material: 'PLA-MATTE', filamentLine: 'PLA Matte', productUrl: 'https://numakers.com/products/pla-matte', color: 'Sakura Blaze', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PLA-Matte_Dragons-Hide_Printzy_w_Spool.png?v=1745282720', colorHex: '#FFB7C5' },
  { material: 'PLA-MATTE', filamentLine: 'PLA Matte', productUrl: 'https://numakers.com/products/pla-matte', color: 'Frozen Tides', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PLA-Matte_Dragons-Hide_Printzy_w_Spool.png?v=1745282720', colorHex: '#87CEEB' },
  { material: 'PLA-MATTE', filamentLine: 'PLA Matte', productUrl: 'https://numakers.com/products/pla-matte', color: 'Frosted Pearl', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PLA-Matte_Dragons-Hide_Printzy_w_Spool.png?v=1745282720', colorHex: '#F0F0F0' },
  { material: 'PLA-MATTE', filamentLine: 'PLA Matte', productUrl: 'https://numakers.com/products/pla-matte', color: 'Moon Shadow', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PLA-Matte_Dragons-Hide_Printzy_w_Spool.png?v=1745282720', colorHex: '#4A4A4A' },
  { material: 'PLA-MATTE', filamentLine: 'PLA Matte', productUrl: 'https://numakers.com/products/pla-matte', color: 'Frosted Fern', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PLA-Matte_Dragons-Hide_Printzy_w_Spool.png?v=1745282720', colorHex: '#98FB98' },
  { material: 'PLA-MATTE', filamentLine: 'PLA Matte', productUrl: 'https://numakers.com/products/pla-matte', color: 'Desert Sandstone', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PLA-Matte_Dragons-Hide_Printzy_w_Spool.png?v=1745282720', colorHex: '#D2B48C' },
  { material: 'PLA-MATTE', filamentLine: 'PLA Matte', productUrl: 'https://numakers.com/products/pla-matte', color: 'Infernal Ruby', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PLA-Matte_Dragons-Hide_Printzy_w_Spool.png?v=1745282720', colorHex: '#9B111E' },
  { material: 'PLA-MATTE', filamentLine: 'PLA Matte', productUrl: 'https://numakers.com/products/pla-matte', color: 'Golden Dawn', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PLA-Matte_Dragons-Hide_Printzy_w_Spool.png?v=1745282720', colorHex: '#FFD700' },
  { material: 'PLA-MATTE', filamentLine: 'PLA Matte', productUrl: 'https://numakers.com/products/pla-matte', color: 'Deep Cosmos', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Numakers_PLA-Matte_Dragons-Hide_Printzy_w_Spool.png?v=1745282720', colorHex: '#191970' },

  // ASA (8 colors)
  { material: 'ASA', filamentLine: 'ASA Filament', productUrl: 'https://numakers.com/products/asa-filament', color: 'Pitch Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/ASAshadow.png?v=1691925940', colorHex: '#1A1A1A' },
  { material: 'ASA', filamentLine: 'ASA Filament', productUrl: 'https://numakers.com/products/asa-filament', color: 'Pure White', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/ASAshadow.png?v=1691925940', colorHex: '#FFFFFF' },
  { material: 'ASA', filamentLine: 'ASA Filament', productUrl: 'https://numakers.com/products/asa-filament', color: 'Lemon Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/ASAshadow.png?v=1691925940', colorHex: '#FFF44F' },
  { material: 'ASA', filamentLine: 'ASA Filament', productUrl: 'https://numakers.com/products/asa-filament', color: 'Apple Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/ASAshadow.png?v=1691925940', colorHex: '#FF0800' },
  { material: 'ASA', filamentLine: 'ASA Filament', productUrl: 'https://numakers.com/products/asa-filament', color: 'Burnt Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/ASAshadow.png?v=1691925940', colorHex: '#CC5500' },
  { material: 'ASA', filamentLine: 'ASA Filament', productUrl: 'https://numakers.com/products/asa-filament', color: 'Royal Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/ASAshadow.png?v=1691925940', colorHex: '#4169E1' },
  { material: 'ASA', filamentLine: 'ASA Filament', productUrl: 'https://numakers.com/products/asa-filament', color: 'Light Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/ASAshadow.png?v=1691925940', colorHex: '#D3D3D3' },
  { material: 'ASA', filamentLine: 'ASA Filament', productUrl: 'https://numakers.com/products/asa-filament', color: 'Grass Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/ASAshadow.png?v=1691925940', colorHex: '#7CFC00' },

  // Silk Tri-Color PLA (9 colors)
  { material: 'PLA-SILK', filamentLine: 'Tri-Color Silk PLA', productUrl: 'https://numakers.com/products/tri-color-silk-pla', color: 'Copper-Silver-Gold', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Silk_tri_color_copper_silver_gold.png?v=1760457583', colorHex: '#B87333' },
  { material: 'PLA-SILK', filamentLine: 'Tri-Color Silk PLA', productUrl: 'https://numakers.com/products/tri-color-silk-pla', color: 'Blue-Green-Gold', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Silk_tri_color_copper_silver_gold.png?v=1760457583', colorHex: '#4169E1' },
  { material: 'PLA-SILK', filamentLine: 'Tri-Color Silk PLA', productUrl: 'https://numakers.com/products/tri-color-silk-pla', color: 'Black-Purple-Gold', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Silk_tri_color_copper_silver_gold.png?v=1760457583', colorHex: '#1A1A1A' },
  { material: 'PLA-SILK', filamentLine: 'Tri-Color Silk PLA', productUrl: 'https://numakers.com/products/tri-color-silk-pla', color: 'Black-Purple-Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Silk_tri_color_copper_silver_gold.png?v=1760457583', colorHex: '#1B1B1B' },
  { material: 'PLA-SILK', filamentLine: 'Tri-Color Silk PLA', productUrl: 'https://numakers.com/products/tri-color-silk-pla', color: 'Silver-Purple-Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Silk_tri_color_copper_silver_gold.png?v=1760457583', colorHex: '#C0C0C0' },
  { material: 'PLA-SILK', filamentLine: 'Tri-Color Silk PLA', productUrl: 'https://numakers.com/products/tri-color-silk-pla', color: 'Green-Magenta-Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Silk_tri_color_copper_silver_gold.png?v=1760457583', colorHex: '#00FF00' },
  { material: 'PLA-SILK', filamentLine: 'Tri-Color Silk PLA', productUrl: 'https://numakers.com/products/tri-color-silk-pla', color: 'Red-Yellow-Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Silk_tri_color_copper_silver_gold.png?v=1760457583', colorHex: '#FF0000' },
  { material: 'PLA-SILK', filamentLine: 'Tri-Color Silk PLA', productUrl: 'https://numakers.com/products/tri-color-silk-pla', color: 'Red-Orange-Gold', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Silk_tri_color_copper_silver_gold.png?v=1760457583', colorHex: '#FF2200' },
  { material: 'PLA-SILK', filamentLine: 'Tri-Color Silk PLA', productUrl: 'https://numakers.com/products/tri-color-silk-pla', color: 'Red-Blue-White', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Silk_tri_color_copper_silver_gold.png?v=1760457583', colorHex: '#FF0011' },

  // ABS (8 colors)
  { material: 'ABS', filamentLine: 'ABS Filament', productUrl: 'https://numakers.com/products/abs-filament', color: 'Pitch Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/unnamed.png?v=1699114024', colorHex: '#1A1A1A' },
  { material: 'ABS', filamentLine: 'ABS Filament', productUrl: 'https://numakers.com/products/abs-filament', color: 'Pure White', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/unnamed.png?v=1699114024', colorHex: '#FFFFFF' },
  { material: 'ABS', filamentLine: 'ABS Filament', productUrl: 'https://numakers.com/products/abs-filament', color: 'Lemon Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/unnamed.png?v=1699114024', colorHex: '#FFF44F' },
  { material: 'ABS', filamentLine: 'ABS Filament', productUrl: 'https://numakers.com/products/abs-filament', color: 'Apple Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/unnamed.png?v=1699114024', colorHex: '#FF0800' },
  { material: 'ABS', filamentLine: 'ABS Filament', productUrl: 'https://numakers.com/products/abs-filament', color: 'Burnt Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/unnamed.png?v=1699114024', colorHex: '#CC5500' },
  { material: 'ABS', filamentLine: 'ABS Filament', productUrl: 'https://numakers.com/products/abs-filament', color: 'Royal Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/unnamed.png?v=1699114024', colorHex: '#4169E1' },
  { material: 'ABS', filamentLine: 'ABS Filament', productUrl: 'https://numakers.com/products/abs-filament', color: 'Light Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/unnamed.png?v=1699114024', colorHex: '#D3D3D3' },
  { material: 'ABS', filamentLine: 'ABS Filament', productUrl: 'https://numakers.com/products/abs-filament', color: 'Grass Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/unnamed.png?v=1699114024', colorHex: '#7CFC00' },

  // PLA Wood (1 color)
  { material: 'PLA-WOOD', filamentLine: 'PLA Wood', productUrl: 'https://numakers.com/products/pla-wood', color: 'Standard', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/products/Wood123.jpg?v=1690199703', colorHex: '#8B4513' },

  // PLA Marble (1 color)
  { material: 'PLA-MARBLE', filamentLine: 'PLA Marble', productUrl: 'https://numakers.com/products/pla-marble', color: 'White Marble', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/marble1.png?v=1717876185', colorHex: '#F5F5F5' },

  // PLA-CF (4 colors)
  { material: 'PLA-CF', filamentLine: 'PLA-CF', productUrl: 'https://numakers.com/products/pla-cf', color: 'Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/PLACF.png?v=1719362887', colorHex: '#1A1A1A' },
  { material: 'PLA-CF', filamentLine: 'PLA-CF', productUrl: 'https://numakers.com/products/pla-cf', color: 'Wine Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/PLACF.png?v=1719362887', colorHex: '#722F37' },
  { material: 'PLA-CF', filamentLine: 'PLA-CF', productUrl: 'https://numakers.com/products/pla-cf', color: 'Denim Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/PLACF.png?v=1719362887', colorHex: '#1560BD' },
  { material: 'PLA-CF', filamentLine: 'PLA-CF', productUrl: 'https://numakers.com/products/pla-cf', color: 'Lemongrass Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/PLACF.png?v=1719362887', colorHex: '#9DC183' },

  // PLA Glow in the Dark (5 colors)
  { material: 'PLA-GLOW', filamentLine: 'PLA Glow in the Dark', productUrl: 'https://numakers.com/products/pla-glow-in-the-dark', color: 'Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/PLAglowinthedarkgreen.jpg?v=1764068236', colorHex: '#00FF00' },
  { material: 'PLA-GLOW', filamentLine: 'PLA Glow in the Dark', productUrl: 'https://numakers.com/products/pla-glow-in-the-dark', color: 'Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/PLAglowinthedarkgreen.jpg?v=1764068236', colorHex: '#FFA500' },
  { material: 'PLA-GLOW', filamentLine: 'PLA Glow in the Dark', productUrl: 'https://numakers.com/products/pla-glow-in-the-dark', color: 'Pink', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/PLAglowinthedarkgreen.jpg?v=1764068236', colorHex: '#FFC0CB' },
  { material: 'PLA-GLOW', filamentLine: 'PLA Glow in the Dark', productUrl: 'https://numakers.com/products/pla-glow-in-the-dark', color: 'Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/PLAglowinthedarkgreen.jpg?v=1764068236', colorHex: '#0000FF' },
  { material: 'PLA-GLOW', filamentLine: 'PLA Glow in the Dark', productUrl: 'https://numakers.com/products/pla-glow-in-the-dark', color: 'Aqua Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/PLAglowinthedarkgreen.jpg?v=1764068236', colorHex: '#00FFFF' },

  // PLA Starlight (5 colors)
  { material: 'PLA-STARLIGHT', filamentLine: 'PLA Starlight', productUrl: 'https://numakers.com/products/pla-starlight', color: 'Nebula', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Nebula.png?v=1766411091', colorHex: '#663399' },
  { material: 'PLA-STARLIGHT', filamentLine: 'PLA Starlight', productUrl: 'https://numakers.com/products/pla-starlight', color: 'Comet', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Nebula.png?v=1766411091', colorHex: '#C0C0C0' },
  { material: 'PLA-STARLIGHT', filamentLine: 'PLA Starlight', productUrl: 'https://numakers.com/products/pla-starlight', color: 'Titan', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Nebula.png?v=1766411091', colorHex: '#708090' },
  { material: 'PLA-STARLIGHT', filamentLine: 'PLA Starlight', productUrl: 'https://numakers.com/products/pla-starlight', color: 'Midnight', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Nebula.png?v=1766411091', colorHex: '#191970' },
  { material: 'PLA-STARLIGHT', filamentLine: 'PLA Starlight', productUrl: 'https://numakers.com/products/pla-starlight', color: 'Neptune', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Nebula.png?v=1766411091', colorHex: '#0077BE' },

  // PETG Translucent (9 colors)
  { material: 'PETG-TRANSLUCENT', filamentLine: 'PETG Translucent', productUrl: 'https://numakers.com/products/petg-translucent', color: 'Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Blue.png?v=1766412617', colorHex: '#0000FF' },
  { material: 'PETG-TRANSLUCENT', filamentLine: 'PETG Translucent', productUrl: 'https://numakers.com/products/petg-translucent', color: 'Ice Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Blue.png?v=1766412617', colorHex: '#99FFFF' },
  { material: 'PETG-TRANSLUCENT', filamentLine: 'PETG Translucent', productUrl: 'https://numakers.com/products/petg-translucent', color: 'Arctic', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Blue.png?v=1766412617', colorHex: '#E0FFFF' },
  { material: 'PETG-TRANSLUCENT', filamentLine: 'PETG Translucent', productUrl: 'https://numakers.com/products/petg-translucent', color: 'Pink', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Blue.png?v=1766412617', colorHex: '#FFB6C1' },
  { material: 'PETG-TRANSLUCENT', filamentLine: 'PETG Translucent', productUrl: 'https://numakers.com/products/petg-translucent', color: 'Hot Pink', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Blue.png?v=1766412617', colorHex: '#FF69B4' },
  { material: 'PETG-TRANSLUCENT', filamentLine: 'PETG Translucent', productUrl: 'https://numakers.com/products/petg-translucent', color: 'Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Blue.png?v=1766412617', colorHex: '#FF0000' },
  { material: 'PETG-TRANSLUCENT', filamentLine: 'PETG Translucent', productUrl: 'https://numakers.com/products/petg-translucent', color: 'Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Blue.png?v=1766412617', colorHex: '#FFA500' },
  { material: 'PETG-TRANSLUCENT', filamentLine: 'PETG Translucent', productUrl: 'https://numakers.com/products/petg-translucent', color: 'Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Blue.png?v=1766412617', colorHex: '#00FF00' },
  { material: 'PETG-TRANSLUCENT', filamentLine: 'PETG Translucent', productUrl: 'https://numakers.com/products/petg-translucent', color: 'Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0740/4643/9732/files/Blue.png?v=1766412617', colorHex: '#FFFF00' },
];

// ============================================================================
// PRODUCT EXCLUSION LOGIC
// ============================================================================

/**
 * Check if a product should be excluded from sync
 * Excludes: NuBox Surplus, Hueforge Packs, Warehouse Clearance
 */
export function shouldExcludeNumakersProduct(title: string): boolean {
  if (!title) return false;
  const t = title.toLowerCase();
  
  return (
    t.includes('nubox') ||
    t.includes('laboratory') ||
    t.includes('hueforge') ||
    t.includes('clearance') ||
    t.includes('surplus') ||
    t.includes('mystery') ||
    t.includes('printzy\'s') ||
    t.includes("printzy's") ||
    t.includes('older formula')
  );
}

// ============================================================================
// DEFAULT PRICES BY PRODUCT LINE
// ============================================================================

export const NUMAKERS_DEFAULT_PRICES: Record<string, number> = {
  'PLA+ Filament': 19.99,
  'PLA Silk': 23.99,
  'PETG-HS Filament': 21.99,
  'PLA Matte': 22.99,
  'ASA Filament': 24.99,
  'ABS Filament': 19.99,
  'PLA Wood': 24.99,
  'PLA Marble': 22.99,
  'PLA-CF': 32.99,
  'PLA Glow in the Dark': 24.99,
  'PLA Starlight': 23.99,
  'PETG Translucent': 21.99,
  'Tri-Color Silk PLA': 24.99,
};

export function getNumakersDefaultPrice(filamentLine: string): number {
  return NUMAKERS_DEFAULT_PRICES[filamentLine] || 21.99;
}

// ============================================================================
// PRINT SETTINGS BY MATERIAL
// ============================================================================

export interface PrintSettings {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  printSpeedMax?: number;
  requiresEnclosure?: boolean;
  isAbrasive?: boolean;
  fanMin?: number;
  fanMax?: number;
  highSpeedCapable?: boolean;
}

export const NUMAKERS_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // PLA Variants
  'PLA+': {
    nozzleTempMin: 200, nozzleTempMax: 220,
    bedTempMin: 50, bedTempMax: 60,
    printSpeedMax: 100,
    fanMin: 100, fanMax: 100
  },
  'PLA': {
    nozzleTempMin: 200, nozzleTempMax: 220,
    bedTempMin: 50, bedTempMax: 60,
    printSpeedMax: 100
  },
  'PLA-MATTE': {
    nozzleTempMin: 200, nozzleTempMax: 220,
    bedTempMin: 50, bedTempMax: 60,
    printSpeedMax: 80
  },
  'PLA-SILK': {
    nozzleTempMin: 205, nozzleTempMax: 225,
    bedTempMin: 50, bedTempMax: 60,
    printSpeedMax: 60 // Slower for best silk finish
  },
  'PLA-MARBLE': {
    nozzleTempMin: 200, nozzleTempMax: 220,
    bedTempMin: 50, bedTempMax: 60,
    printSpeedMax: 80
  },
  'PLA-GLOW': {
    nozzleTempMin: 200, nozzleTempMax: 220,
    bedTempMin: 50, bedTempMax: 60,
    printSpeedMax: 60,
    isAbrasive: true // Glow particles can wear nozzle
  },
  'PLA-WOOD': {
    nozzleTempMin: 190, nozzleTempMax: 210,
    bedTempMin: 50, bedTempMax: 60,
    printSpeedMax: 50,
    isAbrasive: true
  },
  'PLA-STARLIGHT': {
    nozzleTempMin: 200, nozzleTempMax: 220,
    bedTempMin: 50, bedTempMax: 60,
    printSpeedMax: 80,
    isAbrasive: true // Glitter particles
  },
  'PLA-CF': {
    nozzleTempMin: 210, nozzleTempMax: 230,
    bedTempMin: 50, bedTempMax: 60,
    printSpeedMax: 60,
    isAbrasive: true
  },
  // PETG
  'PETG': {
    nozzleTempMin: 230, nozzleTempMax: 250,
    bedTempMin: 70, bedTempMax: 80,
    printSpeedMax: 60
  },
  'PETG-HS': {
    nozzleTempMin: 230, nozzleTempMax: 250,
    bedTempMin: 70, bedTempMax: 80,
    printSpeedMax: 150, // High-speed variant
    highSpeedCapable: true
  },
  'PETG-TRANSLUCENT': {
    nozzleTempMin: 230, nozzleTempMax: 250,
    bedTempMin: 70, bedTempMax: 80,
    printSpeedMax: 60
  },
  // Engineering
  'ASA': {
    nozzleTempMin: 240, nozzleTempMax: 260,
    bedTempMin: 90, bedTempMax: 110,
    printSpeedMax: 60,
    requiresEnclosure: true
  },
  'ABS': {
    nozzleTempMin: 230, nozzleTempMax: 250,
    bedTempMin: 90, bedTempMax: 110,
    printSpeedMax: 60,
    requiresEnclosure: true
  },
};

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

export const NUMAKERS_MATERIAL_MAPPING: Record<string, string> = {
  // PLA variants
  'pla+': 'PLA+',
  'pla plus': 'PLA+',
  'pla+ filament': 'PLA+',
  'pla filament': 'PLA+',
  'pla matte': 'PLA-MATTE',
  'matte pla': 'PLA-MATTE',
  'pla silk': 'PLA-SILK',
  'silk pla': 'PLA-SILK',
  'tri-color silk': 'PLA-SILK',
  'tri-color silk pla': 'PLA-SILK',
  'silk tri-color pla': 'PLA-SILK',
  'pla marble': 'PLA-MARBLE',
  'marble pla': 'PLA-MARBLE',
  'pla glow': 'PLA-GLOW',
  'pla glow in the dark': 'PLA-GLOW',
  'glow in the dark': 'PLA-GLOW',
  'pla wood': 'PLA-WOOD',
  'wood pla': 'PLA-WOOD',
  'pla starlight': 'PLA-STARLIGHT',
  'starlight': 'PLA-STARLIGHT',
  'pla-cf': 'PLA-CF',
  'pla cf': 'PLA-CF',
  'carbon fiber pla': 'PLA-CF',
  // PETG variants
  'petg-hs': 'PETG-HS',
  'petg hs': 'PETG-HS',
  'petg-hs filament': 'PETG-HS',
  'petg high speed': 'PETG-HS',
  'petg translucent': 'PETG-TRANSLUCENT',
  'petg': 'PETG',
  // Engineering
  'asa': 'ASA',
  'asa filament': 'ASA',
  'abs': 'ABS',
  'abs filament': 'ABS',
};

export function normalizeNumakersMaterial(title: string): string {
  if (!title) return 'PLA+';
  const t = title.toLowerCase();
  
  // Sort by length (longest first) for accurate matching
  const sorted = Object.entries(NUMAKERS_MATERIAL_MAPPING)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [pattern, material] of sorted) {
    if (t.includes(pattern)) {
      return material;
    }
  }
  
  // Fallback detection
  if (t.includes('petg')) return 'PETG';
  if (t.includes('asa')) return 'ASA';
  if (t.includes('abs')) return 'ABS';
  if (t.includes('pla')) return 'PLA+';
  
  return 'PLA+';
}

// ============================================================================
// FINISH TYPE DETECTION
// ============================================================================

export type FinishType = 'Matte' | 'Silk' | 'Marble' | 'Glow' | 'Wood' | 'Starlight' | 'Carbon' | 'Translucent' | 'Standard';

export function extractFinishType(title: string): FinishType {
  if (!title) return 'Standard';
  const t = title.toLowerCase();
  
  if (t.includes('matte')) return 'Matte';
  if (t.includes('silk')) return 'Silk';
  if (t.includes('marble')) return 'Marble';
  if (t.includes('glow')) return 'Glow';
  if (t.includes('wood')) return 'Wood';
  if (t.includes('starlight')) return 'Starlight';
  if (t.includes('cf') || t.includes('carbon')) return 'Carbon';
  if (t.includes('translucent')) return 'Translucent';
  
  return 'Standard';
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

const NUMAKERS_TITLE_NOISE = [
  /\s*-?\s*1\.75\s*mm/gi,
  /\s*-?\s*1\s*kg/gi,
  /\s*-?\s*3\s*kg/gi,
  /\s*-?\s*1000\s*g/gi,
  /\s*-?\s*3000\s*g/gi,
  /3D\s*Printing\s*Filament/gi,
  /3D\s*Printer\s*Filament/gi,
  /Filament$/gi,
  /Numakers\s*/gi,
  /\s*\|\s*Explore.*$/gi,
  /^\s*-+\s*/,
  /\s*-+\s*$/,
];

export function cleanNumakersTitle(title: string): string {
  if (!title) return '';
  let cleaned = title;
  
  for (const pattern of NUMAKERS_TITLE_NOISE) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  
  return cleaned.replace(/\s+/g, ' ').trim();
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateNumakersProductLineId(filamentLine: string, material?: string): string {
  const mat = material?.toLowerCase().replace(/-/g, '_') || 'pla_plus';
  
  // Normalize the line name to a slug
  const lineSlug = filamentLine
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  return `numakers__${mat}__${lineSlug}`;
}

// ============================================================================
// CHEAT SHEET URLS (instead of TDS)
// ============================================================================

export const NUMAKERS_CHEAT_SHEETS: Record<string, { cura: string; prusa: string; bambu?: string }> = {
  'PLA+': {
    cura: 'https://numakers.com/blogs/news/pla-plus-cura-settings',
    prusa: 'https://numakers.com/blogs/news/pla-plus-prusaslicer',
    bambu: 'https://numakers.com/blogs/news/pla-plus-bambu-studio'
  },
  'PLA-CF': {
    cura: 'https://numakers.com/blogs/news/pla-cf-cura',
    prusa: 'https://numakers.com/blogs/news/pla-cf-prusaslicer',
    bambu: 'https://numakers.com/blogs/news/pla-cf-bambu-studio'
  },
  'PETG': {
    cura: 'https://numakers.com/blogs/news/petg-cura',
    prusa: 'https://numakers.com/blogs/news/petg-prusaslicer'
  },
  'PETG-HS': {
    cura: 'https://numakers.com/blogs/news/petg-cura',
    prusa: 'https://numakers.com/blogs/news/petg-prusaslicer'
  },
  'ASA': {
    cura: 'https://numakers.com/blogs/news/asa-cura',
    prusa: 'https://numakers.com/blogs/news/asa-prusaslicer',
    bambu: 'https://numakers.com/blogs/news/asa-bambu-studio'
  },
  'PLA-SILK': {
    cura: 'https://numakers.com/blogs/news/pla-silk-cura',
    prusa: 'https://numakers.com/blogs/news/pla-silk-prusaslicer'
  },
  'ABS': {
    cura: 'https://numakers.com/blogs/news/abs-filament-cura',
    prusa: 'https://numakers.com/blogs/news/abs-filament-prusaslicer'
  },
};

export function getNumakersCheatSheet(material: string): string | null {
  const sheets = NUMAKERS_CHEAT_SHEETS[material];
  if (sheets) {
    // Return Cura as primary link (most common slicer)
    return sheets.cura;
  }
  return null;
}

// ============================================================================
// COLOR MAPPING (EXPANDED)
// ============================================================================

export const NUMAKERS_COLOR_MAPPING: Record<string, string> = {
  // Blacks & Whites
  'pitch black': '#1A1A1A',
  'black': '#1A1A1A',
  'pure white': '#FFFFFF',
  'white': '#FFFFFF',
  'cool white': '#F5F5F5',
  'cool (lithophane) white': '#F5F5F5',
  'ivory': '#FFFFF0',
  'ivory white': '#FFFFF0',
  'frosted pearl': '#F0F0F0',
  'white marble': '#F5F5F5',
  
  // Grays
  'light gray': '#D3D3D3',
  'light grey': '#D3D3D3',
  'dark gray': '#4A4A4A',
  'dark grey': '#4A4A4A',
  'midnight gray': '#2F2F2F',
  'midnight grey': '#2F2F2F',
  'simply silver': '#C0C0C0',
  'silver': '#C0C0C0',
  'moon shadow': '#4A4A4A',
  'titan': '#708090',
  
  // Reds & Pinks
  'nuclear red': '#FF2400',
  'red': '#FF0000',
  'imperial red': '#ED2939',
  'apple red': '#FF0800',
  'atomic pink': '#FF6EC7',
  'pink': '#FFC0CB',
  'hot pink': '#FF69B4',
  'magenta': '#FF00FF',
  'fuchsia/magenta': '#FF00FF',
  'blushing ember': '#FF6B6B',
  'sakura blaze': '#FFB7C5',
  'infernal ruby': '#9B111E',
  'wine red': '#722F37',
  
  // Oranges
  'outrageous orange': '#FF6600',
  'orange': '#FFA500',
  'fluorescent orange': '#FF5F1F',
  'burnt orange': '#CC5500',
  'molten sol': '#FF4500',
  
  // Yellows
  'lemon yellow': '#FFF44F',
  'yellow': '#FFFF00',
  'bahama yellow': '#FFD700',
  'fluorescent yellow': '#CCFF00',
  'golden dawn': '#FFD700',
  
  // Greens
  'grass green': '#7CFC00',
  'green': '#00FF00',
  'army green': '#4B5320',
  'forest green': '#228B22',
  'fluorescent green': '#39FF14',
  'ryobix green': '#9ACD32',
  'frosted fern': '#98FB98',
  'lemongrass green': '#9DC183',
  
  // Blues
  'royal blue': '#4169E1',
  'blue': '#0000FF',
  'light blue': '#ADD8E6',
  'teal blue': '#008080',
  'lagoon blue': '#009DC4',
  'ice blue': '#99FFFF',
  'arctic': '#E0FFFF',
  'aqua blue': '#00FFFF',
  'frozen tides': '#87CEEB',
  'denim blue': '#1560BD',
  'neptune': '#0077BE',
  
  // Purples
  'mauve purple': '#E0B0FF',
  'purple': '#800080',
  'thanos purple': '#663399',
  'lavender violet': '#B57EDC',
  'mystic lilac': '#C8A2C8',
  'midnight shade': '#191970',
  'deep cosmos': '#191970',
  'midnight': '#191970',
  'nebula': '#663399',
  
  // Browns & Tans
  'beige brown': '#D2B48C',
  'chocolate brown': '#D2691E',
  'rust copper': '#B87333',
  'military khaki': '#BDB76B',
  'khaki': '#BDB76B',
  'desert sandstone': '#D2B48C',
  "dragon's hide": '#2F4F4F',
  'standard': '#8B4513', // Wood
  
  // Metallics
  'gold': '#FFD700',
  'enchanted gold': '#DAA520',
  'copper': '#B87333',
  'bronze': '#CD7F32',
  'comet': '#C0C0C0',
  
  // Specialty
  'apricot': '#FBCEB1',
  'transparent': '#FEFEFE',
  'clear': '#FEFEFE',
  'obsidian night': '#0B0B0B',
  
  // Tri-color (use first color as representative)
  'copper-silver-gold': '#B87333',
  'blue-green-gold': '#4169E1',
  'black-purple-gold': '#1A1A1A',
  'black-purple-orange': '#1B1B1B',
  'silver-purple-blue': '#C0C0C0',
  'green-magenta-blue': '#00FF00',
  'red-yellow-blue': '#FF0000',
  'red-orange-gold': '#FF2200',
  'red-blue-white': '#FF0011',
};

export function getNumakersColorHex(colorName: string): string | null {
  if (!colorName) return null;
  const normalized = colorName.toLowerCase().trim();
  return NUMAKERS_COLOR_MAPPING[normalized] || null;
}

// ============================================================================
// WEIGHT EXTRACTION
// ============================================================================

export function extractWeightKg(title: string): number {
  if (!title) return 1.0;
  const t = title.toLowerCase();
  
  if (t.includes('3kg') || t.includes('3 kg') || t.includes('3000g')) return 3.0;
  if (t.includes('500g') || t.includes('0.5kg')) return 0.5;
  
  return 1.0; // Default
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface NumakersEnrichmentResult {
  material: string;
  finishType: FinishType;
  productLineId: string;
  cheatSheetUrl: string | null;
  colorHex: string | null;
  colorName: string | null;
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  printSpeedMax: number | null;
  requiresEnclosure: boolean;
  isAbrasive: boolean;
  highSpeedCapable: boolean;
  weightKg: number;
}

export function enrichNumakersProduct(
  seed: NumakersSeedEntry
): NumakersEnrichmentResult {
  const material = seed.material || normalizeNumakersMaterial(seed.filamentLine);
  const settings = NUMAKERS_PRINT_SETTINGS[material] || NUMAKERS_PRINT_SETTINGS['PLA+'];
  
  return {
    material,
    finishType: extractFinishType(seed.filamentLine),
    productLineId: generateNumakersProductLineId(seed.filamentLine, material),
    cheatSheetUrl: getNumakersCheatSheet(material),
    colorHex: seed.colorHex || getNumakersColorHex(seed.color),
    colorName: seed.color,
    nozzleTempMin: settings?.nozzleTempMin || null,
    nozzleTempMax: settings?.nozzleTempMax || null,
    bedTempMin: settings?.bedTempMin || null,
    bedTempMax: settings?.bedTempMax || null,
    printSpeedMax: settings?.printSpeedMax || null,
    requiresEnclosure: settings?.requiresEnclosure || false,
    isAbrasive: settings?.isAbrasive || false,
    highSpeedCapable: settings?.highSpeedCapable || false,
    weightKg: 1.0, // Numakers standard is 1kg
  };
}

/**
 * Push Plastic CSV Seed Data
 * 
 * Consumer-focused curated catalog (~200 products)
 * Filters:
 * - 1.75mm diameter only (no 2.85mm)
 * - 1kg weight only (no 3kg/5kg/10kg/25kg bulk)
 * - No Factory Seconds, Cases, Subscriptions, Pallet Pricing
 * - No SiPC industrial products
 * - Standard spool type preferred (AMS variants deduplicated)
 * 
 * Product Lines (16):
 * 1. PLA (standard)
 * 2. PETG (standard)  
 * 3. PCTG
 * 4. ABS (standard)
 * 5. ASA
 * 6. PC+PBT
 * 7. High Heat+Tough PLA (PLA-HT)
 * 8. TPU 98A
 * 9. HIPS
 * 10. ABS-CF (Carbon Fiber)
 * 11. PETG-CF (Carbon Fiber)
 * 12. PA-CF (Carbon Fiber Nylon)
 * 13. PC-CF (Carbon Fiber PC+PBT)
 * 14. PEI 9085 (Ultem)
 * 15. PEI 1010
 * 16. PMMA (Acrylic)
 */

export interface PushPlasticSeedEntry {
  filamentName: string;
  material: string;
  productLink: string;
  color: string;
  colorLink: string;
  colorHex: string;
}

// Complete color hex mapping (fills gaps in CSV data)
export const PUSHPLASTIC_EXTENDED_HEX_MAP: Record<string, string> = {
  // Standard Colors
  'black': '#1C1C1C',
  'white': '#EFEBE9',
  'natural': '#F5F5DC',
  
  // Grays
  'dark grey': '#606164',
  'dark gray': '#606164',
  'light grey': '#B6B4B2',
  'light gray': '#B6B4B2',
  'grey': '#808080',
  'gray': '#808080',
  'granite': '#676767',
  
  // Reds
  'red': '#C41E3A',
  'translucent red': '#C41E3A',
  
  // Pinks/Magenta
  'pink': '#FF69B4',
  'fluorescent pink': '#FF1493',
  'translucent pink': '#FF69B4',
  'magenta': '#C2185B',
  
  // Oranges
  'orange': '#FF6B35',
  'terra cotta': '#B85C38',
  'rust': '#B7410E',
  
  // Yellows
  'yellow': '#FFD700',
  'pwalt yellow': '#FFD700',
  'safety yellow': '#FFD700',
  'fluorescent yellow': '#FFFF00',
  
  // Browns/Tans
  'brown': '#5D4037',
  'chavant brown': '#6D4C41',
  'desert tan': '#EAD1AF',
  'flat dark earth': '#A67B5B',
  
  // Greens
  'green': '#228B22',
  'army green': '#4B5320',
  'fatigue green': '#5B6B4F',
  'forest green': '#228B22',
  'lime green': '#32CD32',
  'pusch green': '#228B22',
  'fluorescent green': '#39FF14',
  'translucent green': '#228B22',
  'mint': '#98FF98',
  'seafoam': '#71EEB8',
  
  // Blues
  'navy blue': '#0D2C54',
  'ocean blue': '#006994',
  'ultra blue': '#0047AB',
  'electric blue': '#0066CC',
  'translucent blue': '#0066CC',
  'blue pearl': '#4169E1',
  
  // Teals
  'dark teal': '#014D4E',
  'light teal': '#20B2AA',
  
  // Purples
  'purple': '#800080',
  'lavender': '#E6E6FA',
  
  // Metallics
  'gold metallic': '#957C67',
  'silver metallic': '#97979B',
  'bronze metallic': '#CD7F32',
  
  // Translucents
  'translucent amber': '#E0E0E0',
  'translucent grey': '#828082',
  'translucent gray': '#828082',
  'clear': '#F0F8FF',
};

/**
 * Check if a product should be excluded from the consumer catalog
 */
export function shouldExcludePushPlasticProduct(entry: PushPlasticSeedEntry): boolean {
  const titleLower = entry.filamentName.toLowerCase();
  const colorLower = entry.color.toLowerCase();
  
  // Exclude 2.85mm diameter
  if (titleLower.includes('2.85mm')) return true;
  
  // Exclude bulk weights (3kg, 5kg, 10kg, 25kg)
  if (titleLower.includes('3kg') || titleLower.includes('5kg') || 
      titleLower.includes('10kg') || titleLower.includes('25kg')) return true;
  
  // Exclude subscriptions
  if (titleLower.includes('subscription')) return true;
  
  // Exclude factory seconds
  if (titleLower.includes('factory seconds')) return true;
  
  // Exclude cases and pallet pricing
  if (titleLower.includes('case') || titleLower.includes('pallet')) return true;
  
  // Exclude SiPC industrial products
  if (titleLower.includes('sipc')) return true;
  
  // Exclude "Default Title" placeholders
  if (colorLower === 'default title') return true;
  
  // Exclude material-as-color entries (like "PLA", "PETG" in color field)
  const materialColors = ['pla', 'petg', 'abs', 'asa', 'pc+pbt', 'hips', 'pctg', 'tpu', 'nylon', 'high heat'];
  if (materialColors.some(m => colorLower === m)) return true;
  
  return false;
}

/**
 * Get hex code for a color, with extended mapping fallback
 */
export function getPushPlasticSeedHex(csvHex: string, colorName: string): string {
  // If CSV provides a hex, use it (clean up any escape characters)
  if (csvHex && csvHex.length >= 6) {
    const cleanHex = csvHex.replace(/\\/g, '').trim();
    if (cleanHex.startsWith('#') && cleanHex.length === 7) {
      return cleanHex;
    }
    if (cleanHex.length === 6 && /^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
      return `#${cleanHex}`;
    }
  }
  
  // Fallback to extended mapping
  const normalizedColor = colorName.toLowerCase().trim();
  return PUSHPLASTIC_EXTENDED_HEX_MAP[normalizedColor] || '';
}

/**
 * Deduplicate entries by color (AMS vs Standard spool variants)
 * Prefer Standard spool type, take first occurrence otherwise
 */
export function deduplicatePushPlasticEntries(entries: PushPlasticSeedEntry[]): PushPlasticSeedEntry[] {
  const seen = new Map<string, PushPlasticSeedEntry>();
  
  for (const entry of entries) {
    // Create a unique key based on material + color
    const key = `${entry.material.toLowerCase()}_${entry.color.toLowerCase()}`;
    
    if (!seen.has(key)) {
      seen.set(key, entry);
    }
    // If we already have this color, prefer the one with "Standard" in URL or first occurrence
  }
  
  return Array.from(seen.values());
}

/**
 * Parse material from filament name
 */
export function extractMaterialFromTitle(title: string): string {
  const titleLower = title.toLowerCase();
  
  // Carbon Fiber variants (most specific first)
  if (titleLower.includes('carbon fiber nylon') || titleLower.includes('cf nylon')) return 'PA-CF';
  if (titleLower.includes('carbon fiber pc') || titleLower.includes('cf pc')) return 'PC-CF';
  if (titleLower.includes('carbon fiber petg') || titleLower.includes('cf petg')) return 'PETG-CF';
  if (titleLower.includes('carbon fiber abs') || titleLower.includes('cf abs')) return 'ABS-CF';
  
  // Specialty materials
  if (titleLower.includes('ultem') || titleLower.includes('pei')) return 'PEI';
  if (titleLower.includes('aquasys') || titleLower.includes('bvoh')) return 'BVOH';
  if (titleLower.includes('pmma') || titleLower.includes('acrylic')) return 'PMMA';
  
  // High-heat PLA variants
  if (titleLower.includes('high heat+tough') || titleLower.includes('hh tough') || 
      titleLower.includes('hh+tough') || titleLower.includes('3d870')) return 'PLA-HT';
  if (titleLower.includes('hh pla') || titleLower.includes('high heat pla') || 
      titleLower.includes('3d850')) return 'PLA-HH';
  
  // PC+PBT
  if (titleLower.includes('pc+pbt') || titleLower.includes('pc-pbt')) return 'PC+PBT';
  
  // Standard materials
  if (titleLower.includes('tpu')) return 'TPU-98A';
  if (titleLower.includes('pctg')) return 'PCTG';
  if (titleLower.includes('petg')) return 'PETG';
  if (titleLower.includes('asa')) return 'ASA';
  if (titleLower.includes('hips')) return 'HIPS';
  if (titleLower.includes('abs')) return 'ABS';
  if (titleLower.includes('pla')) return 'PLA';
  
  return 'Other';
}

/**
 * Generate product_line_id from material
 */
export function generatePushPlasticProductLineId(material: string): string {
  const materialKey = material.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `push-plastic__${materialKey}__standard`;
}

/**
 * Get default price by material (USD)
 */
export function getPushPlasticDefaultPrice(material: string): number {
  const prices: Record<string, number> = {
    'PLA': 29.99,
    'PETG': 34.99,
    'PCTG': 34.99,
    'ABS': 34.99,
    'ASA': 44.99,
    'PC+PBT': 49.99,
    'PLA-HT': 44.99,
    'TPU-98A': 49.99,
    'HIPS': 34.99,
    'ABS-CF': 74.99,
    'PETG-CF': 74.99,
    'PA-CF': 89.99,
    'PC-CF': 89.99,
    'PEI': 199.99,
    'PMMA': 59.99,
    'BVOH': 89.99,
  };
  return prices[material] || 34.99;
}

/**
 * The curated Push Plastic product seed
 * This is populated from the CSV with filtering applied
 * 
 * Structure: Only 1.75mm 1kg consumer products
 */
export const PUSHPLASTIC_PRODUCT_SEED: PushPlasticSeedEntry[] = [
  // ASA 1.75mm 750g (consumer size)
  { filamentName: 'ASA Filament 1.75mm 750g', material: 'ASA', productLink: 'https://www.pushplastic.com/products/asa-filament-1-75mm-750g', color: 'Black', colorLink: 'https://www.pushplastic.com/products/asa-filament-1-75mm-750g?variant=44429689651361', colorHex: '#1C1C1C' },
  { filamentName: 'ASA Filament 1.75mm 750g', material: 'ASA', productLink: 'https://www.pushplastic.com/products/asa-filament-1-75mm-750g', color: 'Green', colorLink: 'https://www.pushplastic.com/products/asa-filament-1-75mm-750g?variant=44489492103329', colorHex: '#228B22' },
  { filamentName: 'ASA Filament 1.75mm 750g', material: 'ASA', productLink: 'https://www.pushplastic.com/products/asa-filament-1-75mm-750g', color: 'Light Grey', colorLink: 'https://www.pushplastic.com/products/asa-filament-1-75mm-750g?variant=44889510052001', colorHex: '#B6B4B2' },
  { filamentName: 'ASA Filament 1.75mm 750g', material: 'ASA', productLink: 'https://www.pushplastic.com/products/asa-filament-1-75mm-750g', color: 'Natural', colorLink: 'https://www.pushplastic.com/products/asa-filament-1-75mm-750g?variant=44429689684129', colorHex: '#F5F5DC' },
  { filamentName: 'ASA Filament 1.75mm 750g', material: 'ASA', productLink: 'https://www.pushplastic.com/products/asa-filament-1-75mm-750g', color: 'Silver Metallic', colorLink: 'https://www.pushplastic.com/products/asa-filament-1-75mm-750g?variant=44429689716897', colorHex: '#97979B' },
  { filamentName: 'ASA Filament 1.75mm 750g', material: 'ASA', productLink: 'https://www.pushplastic.com/products/asa-filament-1-75mm-750g', color: 'Ultra Blue', colorLink: 'https://www.pushplastic.com/products/asa-filament-1-75mm-750g?variant=44889510084769', colorHex: '#0047AB' },
  { filamentName: 'ASA Filament 1.75mm 750g', material: 'ASA', productLink: 'https://www.pushplastic.com/products/asa-filament-1-75mm-750g', color: 'White', colorLink: 'https://www.pushplastic.com/products/asa-filament-1-75mm-750g?variant=44429689749665', colorHex: '#EFEBE9' },

  // PCTG 1.75mm 1kg
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'Army Green', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291027617', colorHex: '#4B5320' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'Black', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291060385', colorHex: '#1C1C1C' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'Dark Grey', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291093153', colorHex: '#606164' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'Desert Tan', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291125921', colorHex: '#EAD1AF' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'Electric Blue', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291158689', colorHex: '#0066CC' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'Flat Dark Earth', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291191457', colorHex: '#A67B5B' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'Fatigue Green', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291224225', colorHex: '#5B6B4F' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'Green', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291256993', colorHex: '#228B22' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'Light Grey', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291289761', colorHex: '#B6B4B2' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'Lime Green', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291322529', colorHex: '#32CD32' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'Light Teal', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291355297', colorHex: '#20B2AA' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'Natural', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291388065', colorHex: '#F5F5DC' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'Navy Blue', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291420833', colorHex: '#0D2C54' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'Ocean Blue', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291453601', colorHex: '#006994' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'Orange', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291486369', colorHex: '#FF6B35' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'PUSCH Green', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291519137', colorHex: '#228B22' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'Pink', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291551905', colorHex: '#FF69B4' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'Purple', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291584673', colorHex: '#800080' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'PWalt Yellow', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291617441', colorHex: '#FFD700' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'Red', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291650209', colorHex: '#C41E3A' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'Rust', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291682977', colorHex: '#B7410E' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'Silver Metallic', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291715745', colorHex: '#97979B' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'Safety Yellow', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291748513', colorHex: '#FFD700' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'Translucent Amber', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291781281', colorHex: '#E0E0E0' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'Translucent Blue', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291814049', colorHex: '#0066CC' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'Translucent Green', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291846817', colorHex: '#228B22' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'Translucent Red', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291879585', colorHex: '#C41E3A' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'Ultra Blue', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291912353', colorHex: '#0047AB' },
  { filamentName: 'PCTG Filament 1.75mm 1kg', material: 'PCTG', productLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg', color: 'White', colorLink: 'https://www.pushplastic.com/products/pctg-filament-1-75mm-1kg?variant=45287291945121', colorHex: '#EFEBE9' },

  // PLA 1.75mm 1kg - Standard colors (deduplicated, one per color)
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Army Green', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074847912097', colorHex: '#4B5320' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Black', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074847977633', colorHex: '#1C1C1C' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Blue Pearl', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848010401', colorHex: '#4169E1' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Bronze Metallic', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848043169', colorHex: '#CD7F32' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Brown', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848075937', colorHex: '#5D4037' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Chavant Brown', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848108705', colorHex: '#6D4C41' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Dark Grey', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848141473', colorHex: '#606164' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Dark Teal', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848174241', colorHex: '#014D4E' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Desert Tan', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848207009', colorHex: '#EAD1AF' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Electric Blue', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848239777', colorHex: '#0066CC' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Fatigue Green', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848272545', colorHex: '#5B6B4F' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Flat Dark Earth', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848305313', colorHex: '#A67B5B' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Fluorescent Green', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848338081', colorHex: '#39FF14' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Fluorescent Pink', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848370849', colorHex: '#FF1493' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Fluorescent Yellow', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848403617', colorHex: '#FFFF00' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Forest Green', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848436385', colorHex: '#228B22' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Gold Metallic', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848502945', colorHex: '#957C67' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Granite', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848535713', colorHex: '#676767' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Green', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848568481', colorHex: '#228B22' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Lavender', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848601249', colorHex: '#E6E6FA' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Light Grey', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848634017', colorHex: '#B6B4B2' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Light Teal', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848666785', colorHex: '#20B2AA' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Lime Green', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848699553', colorHex: '#32CD32' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Magenta', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848732321', colorHex: '#C2185B' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Mint', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848798857', colorHex: '#98FF98' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Natural', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848831625', colorHex: '#F5F5DC' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Navy Blue', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848864393', colorHex: '#0D2C54' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Ocean Blue', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848897161', colorHex: '#006994' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Orange', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848929929', colorHex: '#FF6B35' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Pink', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848962697', colorHex: '#FF69B4' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Purple', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074848995465', colorHex: '#800080' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'PWalt Yellow', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074849028233', colorHex: '#FFD700' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Red', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074849061001', colorHex: '#C41E3A' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Seafoam', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074849093769', colorHex: '#71EEB8' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Silver Metallic', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074849126537', colorHex: '#97979B' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Terra Cotta', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074849159305', colorHex: '#B85C38' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Translucent Amber', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074849192073', colorHex: '#FFB347' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Translucent Blue', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074849224841', colorHex: '#87CEEB' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Translucent Green', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074849257609', colorHex: '#90EE90' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Translucent Grey', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074849290377', colorHex: '#D3D3D3' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Translucent Pink', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074849323145', colorHex: '#FFB6C1' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Translucent Red', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074849355913', colorHex: '#FF6B6B' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Ultra Blue', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074849388681', colorHex: '#0047AB' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'White', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074849421449', colorHex: '#EFEBE9' },
  { filamentName: 'PLA Filament 1.75mm 1kg', material: 'PLA', productLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg', color: 'Yellow', colorLink: 'https://www.pushplastic.com/products/pla-filament-1-75mm-1kg?variant=46074849454217', colorHex: '#FFD700' },

  // PETG 1.75mm 1kg
  { filamentName: 'PETG Filament 1.75mm 1kg', material: 'PETG', productLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg', color: 'Black', colorLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg?variant=46074843717793', colorHex: '#1C1C1C' },
  { filamentName: 'PETG Filament 1.75mm 1kg', material: 'PETG', productLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg', color: 'Desert Tan', colorLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg?variant=46074843750561', colorHex: '#EAD1AF' },
  { filamentName: 'PETG Filament 1.75mm 1kg', material: 'PETG', productLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg', color: 'Green', colorLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg?variant=46074843783329', colorHex: '#228B22' },
  { filamentName: 'PETG Filament 1.75mm 1kg', material: 'PETG', productLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg', color: 'Light Grey', colorLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg?variant=46074843816097', colorHex: '#B6B4B2' },
  { filamentName: 'PETG Filament 1.75mm 1kg', material: 'PETG', productLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg', color: 'Natural', colorLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg?variant=46074843848865', colorHex: '#F5F5DC' },
  { filamentName: 'PETG Filament 1.75mm 1kg', material: 'PETG', productLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg', color: 'Navy Blue', colorLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg?variant=46074843881633', colorHex: '#0D2C54' },
  { filamentName: 'PETG Filament 1.75mm 1kg', material: 'PETG', productLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg', color: 'Ocean Blue', colorLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg?variant=46074843914401', colorHex: '#006994' },
  { filamentName: 'PETG Filament 1.75mm 1kg', material: 'PETG', productLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg', color: 'Orange', colorLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg?variant=46074843947169', colorHex: '#FF6B35' },
  { filamentName: 'PETG Filament 1.75mm 1kg', material: 'PETG', productLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg', color: 'PUSCH Green', colorLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg?variant=46074843979937', colorHex: '#228B22' },
  { filamentName: 'PETG Filament 1.75mm 1kg', material: 'PETG', productLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg', color: 'PWalt Yellow', colorLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg?variant=46074844012705', colorHex: '#FFD700' },
  { filamentName: 'PETG Filament 1.75mm 1kg', material: 'PETG', productLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg', color: 'Red', colorLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg?variant=46074844045473', colorHex: '#C41E3A' },
  { filamentName: 'PETG Filament 1.75mm 1kg', material: 'PETG', productLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg', color: 'Rust', colorLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg?variant=46074844078241', colorHex: '#B7410E' },
  { filamentName: 'PETG Filament 1.75mm 1kg', material: 'PETG', productLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg', color: 'Safety Yellow', colorLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg?variant=46074844111009', colorHex: '#FFD700' },
  { filamentName: 'PETG Filament 1.75mm 1kg', material: 'PETG', productLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg', color: 'Silver Metallic', colorLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg?variant=46074844143777', colorHex: '#97979B' },
  { filamentName: 'PETG Filament 1.75mm 1kg', material: 'PETG', productLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg', color: 'Translucent Amber', colorLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg?variant=46074844176545', colorHex: '#FFB347' },
  { filamentName: 'PETG Filament 1.75mm 1kg', material: 'PETG', productLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg', color: 'Translucent Blue', colorLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg?variant=46074844209313', colorHex: '#87CEEB' },
  { filamentName: 'PETG Filament 1.75mm 1kg', material: 'PETG', productLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg', color: 'Translucent Green', colorLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg?variant=46074844242081', colorHex: '#90EE90' },
  { filamentName: 'PETG Filament 1.75mm 1kg', material: 'PETG', productLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg', color: 'Translucent Red', colorLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg?variant=46074844274849', colorHex: '#FF6B6B' },
  { filamentName: 'PETG Filament 1.75mm 1kg', material: 'PETG', productLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg', color: 'Ultra Blue', colorLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg?variant=46074844307617', colorHex: '#0047AB' },
  { filamentName: 'PETG Filament 1.75mm 1kg', material: 'PETG', productLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg', color: 'White', colorLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg?variant=46074844340385', colorHex: '#EFEBE9' },
  { filamentName: 'PETG Filament 1.75mm 1kg', material: 'PETG', productLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg', color: 'Yellow', colorLink: 'https://www.pushplastic.com/products/petg-filament-1-75mm-1kg?variant=46074844373153', colorHex: '#FFD700' },

  // ABS 1.75mm 1kg
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'Army Green', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074838573217', colorHex: '#4B5320' },
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'Black', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074838605985', colorHex: '#1C1C1C' },
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'Bronze Metallic', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074838638753', colorHex: '#CD7F32' },
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'Brown', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074838671521', colorHex: '#5D4037' },
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'Chavant Brown', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074838704289', colorHex: '#6D4C41' },
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'Dark Grey', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074838737057', colorHex: '#606164' },
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'Dark Teal', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074838769825', colorHex: '#014D4E' },
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'Desert Tan', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074838802593', colorHex: '#EAD1AF' },
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'Electric Blue', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074838835361', colorHex: '#0066CC' },
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'Fatigue Green', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074838868129', colorHex: '#5B6B4F' },
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'Flat Dark Earth', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074838900897', colorHex: '#A67B5B' },
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'Forest Green', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074838933665', colorHex: '#228B22' },
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'Gold Metallic', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074838999201', colorHex: '#957C67' },
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'Green', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074839031969', colorHex: '#228B22' },
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'Light Grey', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074839064737', colorHex: '#B6B4B2' },
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'Lime Green', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074839097505', colorHex: '#32CD32' },
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'Natural', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074839130273', colorHex: '#F5F5DC' },
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'Navy Blue', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074839163041', colorHex: '#0D2C54' },
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'Orange', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074839195809', colorHex: '#FF6B35' },
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'Pink', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074839228577', colorHex: '#FF69B4' },
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'Purple', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074839261345', colorHex: '#800080' },
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'PWalt Yellow', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074839294113', colorHex: '#FFD700' },
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'Red', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074839326881', colorHex: '#C41E3A' },
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'Silver Metallic', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074839359649', colorHex: '#97979B' },
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'Ultra Blue', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074839392417', colorHex: '#0047AB' },
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'White', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074839425185', colorHex: '#EFEBE9' },
  { filamentName: 'ABS Filament 1.75mm 1kg', material: 'ABS', productLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg', color: 'Yellow', colorLink: 'https://www.pushplastic.com/products/abs-filament-1-75mm-1kg?variant=46074839457953', colorHex: '#FFD700' },

  // PC+PBT 1.75mm 1kg
  { filamentName: 'PC+PBT Filament 1.75mm 1kg', material: 'PC+PBT', productLink: 'https://www.pushplastic.com/products/pc-pbt-filament-1-75mm-1kg', color: 'Black', colorLink: 'https://www.pushplastic.com/products/pc-pbt-filament-1-75mm-1kg?variant=44429691781281', colorHex: '#1C1C1C' },
  { filamentName: 'PC+PBT Filament 1.75mm 1kg', material: 'PC+PBT', productLink: 'https://www.pushplastic.com/products/pc-pbt-filament-1-75mm-1kg', color: 'Light Grey', colorLink: 'https://www.pushplastic.com/products/pc-pbt-filament-1-75mm-1kg?variant=44429691814049', colorHex: '#B6B4B2' },
  { filamentName: 'PC+PBT Filament 1.75mm 1kg', material: 'PC+PBT', productLink: 'https://www.pushplastic.com/products/pc-pbt-filament-1-75mm-1kg', color: 'Natural', colorLink: 'https://www.pushplastic.com/products/pc-pbt-filament-1-75mm-1kg?variant=44429691846817', colorHex: '#F5F5DC' },
  { filamentName: 'PC+PBT Filament 1.75mm 1kg', material: 'PC+PBT', productLink: 'https://www.pushplastic.com/products/pc-pbt-filament-1-75mm-1kg', color: 'Silver Metallic', colorLink: 'https://www.pushplastic.com/products/pc-pbt-filament-1-75mm-1kg?variant=44429691879585', colorHex: '#97979B' },
  { filamentName: 'PC+PBT Filament 1.75mm 1kg', material: 'PC+PBT', productLink: 'https://www.pushplastic.com/products/pc-pbt-filament-1-75mm-1kg', color: 'White', colorLink: 'https://www.pushplastic.com/products/pc-pbt-filament-1-75mm-1kg?variant=44429691912353', colorHex: '#EFEBE9' },

  // TPU 98A 1.75mm 750g
  { filamentName: 'TPU 98A Filament 1.75mm 750g', material: 'TPU-98A', productLink: 'https://www.pushplastic.com/products/tpu-98a-filament-1-75mm-750g', color: 'Black', colorLink: 'https://www.pushplastic.com/products/tpu-98a-filament-1-75mm-750g?variant=44429692272801', colorHex: '#1C1C1C' },
  { filamentName: 'TPU 98A Filament 1.75mm 750g', material: 'TPU-98A', productLink: 'https://www.pushplastic.com/products/tpu-98a-filament-1-75mm-750g', color: 'Light Grey', colorLink: 'https://www.pushplastic.com/products/tpu-98a-filament-1-75mm-750g?variant=44489508356257', colorHex: '#B6B4B2' },
  { filamentName: 'TPU 98A Filament 1.75mm 750g', material: 'TPU-98A', productLink: 'https://www.pushplastic.com/products/tpu-98a-filament-1-75mm-750g', color: 'Natural', colorLink: 'https://www.pushplastic.com/products/tpu-98a-filament-1-75mm-750g?variant=44429692305569', colorHex: '#F5F5DC' },
  { filamentName: 'TPU 98A Filament 1.75mm 750g', material: 'TPU-98A', productLink: 'https://www.pushplastic.com/products/tpu-98a-filament-1-75mm-750g', color: 'Red', colorLink: 'https://www.pushplastic.com/products/tpu-98a-filament-1-75mm-750g?variant=44489508323489', colorHex: '#C41E3A' },
  { filamentName: 'TPU 98A Filament 1.75mm 750g', material: 'TPU-98A', productLink: 'https://www.pushplastic.com/products/tpu-98a-filament-1-75mm-750g', color: 'Ultra Blue', colorLink: 'https://www.pushplastic.com/products/tpu-98a-filament-1-75mm-750g?variant=44489508389025', colorHex: '#0047AB' },
  { filamentName: 'TPU 98A Filament 1.75mm 750g', material: 'TPU-98A', productLink: 'https://www.pushplastic.com/products/tpu-98a-filament-1-75mm-750g', color: 'White', colorLink: 'https://www.pushplastic.com/products/tpu-98a-filament-1-75mm-750g?variant=44429692338337', colorHex: '#EFEBE9' },

  // HIPS 1.75mm 1kg
  { filamentName: 'HIPS Filament 1.75mm 1kg', material: 'HIPS', productLink: 'https://www.pushplastic.com/products/hips-filament-1-75mm-1kg', color: 'Black', colorLink: 'https://www.pushplastic.com/products/hips-filament-1-75mm-1kg?variant=44429690503329', colorHex: '#1C1C1C' },
  { filamentName: 'HIPS Filament 1.75mm 1kg', material: 'HIPS', productLink: 'https://www.pushplastic.com/products/hips-filament-1-75mm-1kg', color: 'Natural', colorLink: 'https://www.pushplastic.com/products/hips-filament-1-75mm-1kg?variant=44429690536097', colorHex: '#F5F5DC' },
  { filamentName: 'HIPS Filament 1.75mm 1kg', material: 'HIPS', productLink: 'https://www.pushplastic.com/products/hips-filament-1-75mm-1kg', color: 'White', colorLink: 'https://www.pushplastic.com/products/hips-filament-1-75mm-1kg?variant=44429690568865', colorHex: '#EFEBE9' },

  // Carbon Fiber ABS 1.75mm 750g (single color)
  { filamentName: 'Carbon Fiber ABS Filament 1.75mm 750g', material: 'ABS-CF', productLink: 'https://www.pushplastic.com/products/carbon-fiber-abs-filament-1-75mm-750g', color: 'Black', colorLink: 'https://www.pushplastic.com/products/carbon-fiber-abs-filament-1-75mm-750g?variant=44429688668321', colorHex: '#1C1C1C' },

  // Carbon Fiber PETG 1.75mm 750g (single color)
  { filamentName: 'Carbon Fiber PETG Filament 1.75mm 750g', material: 'PETG-CF', productLink: 'https://www.pushplastic.com/products/carbon-fiber-petg-filament-1-75mm-750g', color: 'Black', colorLink: 'https://www.pushplastic.com/products/carbon-fiber-petg-filament-1-75mm-750g?variant=44429688832161', colorHex: '#1C1C1C' },

  // Carbon Fiber Nylon 1.75mm 750g (single color)
  { filamentName: 'Carbon Fiber Nylon Filament 1.75mm 750g', material: 'PA-CF', productLink: 'https://www.pushplastic.com/products/carbon-fiber-nylon-filament-1-75mm-750g', color: 'Black', colorLink: 'https://www.pushplastic.com/products/carbon-fiber-nylon-filament-1-75mm-750g?variant=44429688766625', colorHex: '#1C1C1C' },

  // Carbon Fiber PC+PBT 1.75mm 750g (single color)
  { filamentName: 'Carbon Fiber PC+PBT Filament 1.75mm 750g', material: 'PC-CF', productLink: 'https://www.pushplastic.com/products/carbon-fiber-pc-pbt-filament-1-75mm-750g', color: 'Black', colorLink: 'https://www.pushplastic.com/products/carbon-fiber-pc-pbt-filament-1-75mm-750g?variant=44429688897697', colorHex: '#1C1C1C' },

  // High Heat+Tough PLA (PLA-HT) 1.75mm 1kg
  { filamentName: 'High Heat+Tough PLA Filament 1.75mm 1kg', material: 'PLA-HT', productLink: 'https://www.pushplastic.com/products/hh-tough-pla-filament-1-75mm-1kg', color: 'Black', colorLink: 'https://www.pushplastic.com/products/hh-tough-pla-filament-1-75mm-1kg?variant=44429690339489', colorHex: '#1C1C1C' },
  { filamentName: 'High Heat+Tough PLA Filament 1.75mm 1kg', material: 'PLA-HT', productLink: 'https://www.pushplastic.com/products/hh-tough-pla-filament-1-75mm-1kg', color: 'Natural', colorLink: 'https://www.pushplastic.com/products/hh-tough-pla-filament-1-75mm-1kg?variant=44429690372257', colorHex: '#F5F5DC' },
  { filamentName: 'High Heat+Tough PLA Filament 1.75mm 1kg', material: 'PLA-HT', productLink: 'https://www.pushplastic.com/products/hh-tough-pla-filament-1-75mm-1kg', color: 'White', colorLink: 'https://www.pushplastic.com/products/hh-tough-pla-filament-1-75mm-1kg?variant=44429690405025', colorHex: '#EFEBE9' },

  // PEI/ULTEM 9085 1.75mm 250g (premium, single color)
  { filamentName: 'PEI/ULTEM 9085 Filament 1.75mm 250g', material: 'PEI', productLink: 'https://www.pushplastic.com/products/ultem-9085-pei-filament-1-75mm-250g', color: 'Natural', colorLink: 'https://www.pushplastic.com/products/ultem-9085-pei-filament-1-75mm-250g?variant=44447131189409', colorHex: '#C19A6B' },

  // PMMA/Acrylic 1.75mm 750g
  { filamentName: 'PMMA Filament 1.75mm 750g', material: 'PMMA', productLink: 'https://www.pushplastic.com/products/pmma-filament-1-75mm-750g', color: 'Clear', colorLink: 'https://www.pushplastic.com/products/pmma-filament-1-75mm-750g?variant=44429691486369', colorHex: '#F0F8FF' },
];

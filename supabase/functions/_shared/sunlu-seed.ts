// Sunlu CSV seed data - curated consumer products from store.sunlu.com
// Filtered: US region only, 1kg spools, no bulk/MOQ, no non-filaments, no 2.85mm
// 
// Architecture: CSV-seeded sync with Safe Delete pattern
// Expected Product Lines: ~38

export interface SunluSeedProduct {
  name: string;           // Clean product title
  material: string;       // Normalized material type
  color: string;          // Extracted color name
  colorHex: string;       // Curated hex code
  productUrl: string;     // Shopify product URL
  imageUrl: string;       // Product image URL
  productLineId: string;  // Generated product line ID
  finishType: string;     // Silk, Matte, Standard, etc.
  weight: number;         // Weight in grams (default 1000)
}

// ============================================================================
// EXTENDED COLOR HEX MAPPING (150+ colors)
// ============================================================================

export const SUNLU_EXTENDED_HEX_MAP: Record<string, string> = {
  // ===== BASIC COLORS =====
  'black': '1A1A1A',
  'white': 'FFFFFF',
  'grey': '808080',
  'gray': '808080',
  'silver': 'C0C0C0',
  'red': 'DC2626',
  'blue': '2563EB',
  'green': '16A34A',
  'yellow': 'FACC15',
  'orange': 'EA580C',
  'purple': '9333EA',
  'pink': 'EC4899',
  'cyan': '06B6D4',
  'brown': '92400E',
  'beige': 'D4C4A8',
  'cream': 'FFFDD0',
  'ivory': 'FFFFF0',
  'gold': 'FFD700',
  'copper': 'B87333',
  'bronze': 'CD7F32',
  'navy': '1E3A5F',
  'teal': '0D9488',
  'olive': '808000',
  'maroon': '800000',
  'magenta': 'FF00FF',
  'violet': '8B5CF6',
  'lavender': 'E6E6FA',
  'mint': '98FF98',
  'coral': 'FF7F50',
  'salmon': 'FA8072',
  'peach': 'FFCBA4',
  'turquoise': '40E0D0',
  'lime': '32CD32',
  'chartreuse': '7FFF00',
  'khaki': 'C3B091',
  'tan': 'D2B48C',
  'natural': 'F5F5DC',
  'clear': 'E8E8E8',
  'transparent': 'E8E8E8',
  'translucent': 'E8E8E8',
  
  // ===== SUNLU NAMED COLORS (from CSV) =====
  'klein blue': '002FA7',
  'sky blue': '87CEEB',
  'mint green': '98FF98',
  'olive green': '808000',
  'oliver green': '808000',  // Typo in Sunlu CSV
  'dark green': '006400',
  'grass green': '7CFC00',
  'sakura pink': 'FFB7C5',
  'cherry red': 'DE3163',
  'lemon yellow': 'FFF44F',
  'sunny orange': 'FF8C00',
  'lavender purple': 'E6E6FA',
  'coffee brown': '6F4E37',
  'chocolate': '7B3F00',
  'bone white': 'F9F6EE',
  'ceramic white': 'F8F8FF',
  'roasted chestnut black': '2C1810',
  'midnight': '191970',
  'oak': 'C4A35A',
  'skin': 'FFDBAC',
  'azure': '007FFF',
  'army green': '4B5320',
  'forest green': '228B22',
  'ocean blue': '006994',
  'royal blue': '4169E1',
  'cobalt blue': '0047AB',
  'navy blue': '1E3A5F',
  
  // ===== LIGHT VARIANTS =====
  'light blue': '87CEEB',
  'light green': '90EE90',
  'light pink': 'FFB6C1',
  'light grey': 'D3D3D3',
  'light gray': 'D3D3D3',
  'light purple': 'DDA0DD',
  'light gold': 'FFE550',
  
  // ===== DARK VARIANTS =====
  'dark blue': '00008B',
  'dark red': '8B0000',
  'dark grey': '404040',
  'dark gray': '404040',
  'dark brown': '654321',
  
  // ===== TRANSPARENT VARIANTS =====
  'transparent blue': 'ADD8E6',
  'transparent red': 'FF6B6B',
  'transparent green': '90EE90',
  'transparent yellow': 'FFFFE0',
  'transparent purple': 'DDA0DD',
  'transparent orange': 'FFD580',
  
  // ===== SILK COLORS =====
  'silk silver': 'C0C0C0',
  'silk gold': 'FFD700',
  'silk light gold': 'FFE550',
  'silk black': '2F2F2F',
  'silk white': 'F8F8FF',
  'silk grey': 'A0A0A0',
  'silk red copper': 'B87333',
  'silk red': 'B22222',
  'silk blue': '4169E1',
  'silk pink': 'FF69B4',
  'silk yellow': 'FFD700',
  'silk purple': '8B008B',
  'silk brass': 'B5A642',
  'silk bronze': 'CD7F32',
  'silk orange': 'FF8C00',
  'silk green': '228B22',
  'silk rose gold': 'B76E79',
  'silk champagne': 'F7E7CE',
  'silk rainbow': 'FF69B4',
  
  // ===== DUAL-COLOR MATTE COMBINATIONS =====
  'red+yellow': 'FF6347',
  'red+blue': '8B0000',
  'black+red': '4A0000',
  'black+blue': '00008B',
  'orange+red': 'FF4500',
  'yellow+cyan': '7FFF00',
  'green+purple': '9370DB',
  'red+green': '8B4513',
  'blue+green': '20B2AA',
  'pink+white': 'FFD1DC',
  'purple+pink': 'DA70D6',
  'orange+yellow': 'FFBF00',
  'blue+purple': '6A5ACD',
  'green+yellow': '9ACD32',
  
  // ===== GLOW COLORS =====
  'glow green': '39FF14',
  'glow blue': '00BFFF',
  'glow yellow': 'FFFF00',
  'glow orange': 'FF4500',
  'glow pink': 'FF69B4',
  'glow white': 'F0F0F0',
  
  // ===== PVB COLORS =====
  'pvb black': '1A1A1A',
  'pvb white': 'FFFFFF',
  'pvb grey': '808080',
  'pvb gray': '808080',
  'pvb natural': 'F5F5DC',
  'pvb transparent': 'E8E8E8',
  'pvb red': 'DC2626',
  'pvb blue': '2563EB',
  'pvb green': '16A34A',
  'pvb yellow': 'FACC15',
  'pvb orange': 'EA580C',
  'pvb pink': 'EC4899',
  'pvb purple': '9333EA',
  
  // ===== ENGINEERING MATERIALS =====
  'abs-gf natural': 'F5F5DC',
  'abs-fr black': '1A1A1A',
  'abs black': '1A1A1A',
  'abs white': 'FFFFFF',
  'petg-cf black': '080808',
  'pla-cf black': '080808',
  'pa6-cf black': '0A0A0A',
  'pa12-cf black': '0C0C0C',
  'peek natural': 'F5F5DC',
  'pc natural': 'E8E8E8',
  'pc black': '1A1A1A',
  'pp natural': 'F5F5DC',
  'pc-abs white': 'FFFFFF',
  'pc-abs black': '1A1A1A',
  'easy pa black': '1A1A1A',
  'tpu natural': 'F5F5DC',
  
  // ===== WOOD COLORS =====
  'wood': 'DEB887',
  'walnut': '5D432C',
  'bamboo': 'E3D4AD',
  'cherry': 'DE3163',
  'mahogany': 'C04000',
  
  // ===== MARBLE COLORS =====
  'marble white': 'F0F0F0',
  'marble black': '3A3A3A',
  'marble grey': '909090',
  
  // ===== META (MACARON) COLORS =====
  'meta black': '1A1A1A',
  'meta white': 'F8F8FF',
  'meta grey': '909090',
  'meta pink': 'FFB6C1',
  'meta blue': 'ADD8E6',
  'meta green': '90EE90',
  'meta yellow': 'FFF9C4',
  'meta purple': 'DDA0DD',
  
  // ===== HIGH SPEED PLA+ 2.0 =====
  'hspla+ 2.0 black': '1A1A1A',
  'hspla+ 2.0 white': 'FFFFFF',
  'hspla+ 2.0 grey': '808080',
  'hspla+ 2.0 red': 'DC2626',
  'hspla+ 2.0 blue': '2563EB',
  'hspla+ 2.0 yellow': 'FACC15',
  'hspla+ 2.0 green': '16A34A',
  'hspla+ 2.0 pink': 'EC4899',
  'hspla+ 2.0 orange': 'EA580C',
  
  // ===== ANTI-STRING / APLA =====
  'apla black': '1A1A1A',
  'apla white': 'FFFFFF',
  'apla grey': '808080',
  
  // ===== HIPS =====
  'hips white': 'FFFFFF',
  'hips black': '1A1A1A',
  'hips natural': 'F5F5DC',
  
  // ===== REFILL COLORS =====
  'refill black': '1A1A1A',
  'refill white': 'FFFFFF',
  'refill grey': '808080',
  'refill red': 'DC2626',
  'refill blue': '2563EB',
  'refill green': '16A34A',
};

// ============================================================================
// PRODUCT LINE DEFINITIONS (38 expected lines)
// ============================================================================

export const SUNLU_EXPECTED_PRODUCT_LINES: Record<string, number> = {
  // PLA Series
  'sunlu__pla__standard': 25,
  'sunlu__pla-plus__standard': 25,
  'sunlu__pla-plus-2-0-hs__high-speed': 12,
  'sunlu__pla-meta__standard': 12,
  'sunlu__pla-matte__standard': 15,
  'sunlu__pla-silk__standard': 20,
  'sunlu__pla-silk-dual__standard': 10,
  'sunlu__pla-marble__standard': 6,
  'sunlu__pla-wood__standard': 4,
  'sunlu__pla-glow__standard': 6,
  'sunlu__pla-rainbow__standard': 4,
  'sunlu__pla-antistring__standard': 8,
  'sunlu__pla-refill__standard': 15,
  
  // Matte Dual-Color PLA
  'sunlu__pla-matte-dual-color__standard': 7,
  
  // PETG Series
  'sunlu__petg__standard': 20,
  'sunlu__petg-matte__standard': 10,
  'sunlu__petg-cf__standard': 1,
  'sunlu__petg-matte-hs__high-speed': 8,
  
  // ABS Series
  'sunlu__abs__standard': 10,
  'sunlu__easy-abs__standard': 8,
  'sunlu__abs-gf__standard': 1,
  'sunlu__abs-fr__standard': 1,
  
  // ASA
  'sunlu__asa__standard': 6,
  
  // TPU Series
  'sunlu__tpu__standard': 10,
  'sunlu__tpu-90a__standard': 6,
  
  // Engineering Materials
  'sunlu__pa-cf__standard': 1,
  'sunlu__pa12-cf__standard': 1,
  'sunlu__easy-pa__standard': 2,
  'sunlu__pc__standard': 1,
  'sunlu__pc-abs__standard': 2,
  'sunlu__pp__standard': 1,
  'sunlu__peek__standard': 1,
  
  // Other
  'sunlu__pla-cf__standard': 1,
  'sunlu__pvb__standard': 8,
  'sunlu__hips__standard': 4,
};

export const SUNLU_EXPECTED_CARD_COUNT = Object.keys(SUNLU_EXPECTED_PRODUCT_LINES).length;

// ============================================================================
// EXCLUSION PATTERNS (non-filament products, bulk, accessories)
// ============================================================================

export const SUNLU_EXCLUDED_PATTERNS: RegExp[] = [
  // === NON-FILAMENT PRODUCTS (3D printers, accessories, dryers) ===
  /filadryer/i,
  /filament\s*dryer/i,
  /dry\s*box/i,
  /drybox/i,
  /3d\s*pen/i,
  /sl-300/i,
  /sl-600/i,
  /resin/i,
  /water[\s-]*wash/i,
  /build\s*plate/i,
  /magnetic\s*bed/i,
  /nozzle/i,
  /hotend/i,
  /extruder/i,
  /enclosure/i,
  /storage\s*box/i,
  /vacuum\s*bag/i,
  /connector/i,
  /fc01/i,
  /sp2/i,
  /s1\s*pro/i,
  /s2\s*plus/i,
  /s4/i,
  /e2\s*filadryer/i,
  /filadryer\s*e2/i,
  
  // NEW: Non-filament products (3D printers, AMS heaters, accessories)
  /kidoodle/i,
  /minibox/i,
  /3d\s*printer\s*for\s*kids/i,
  /ams\s*heater/i,
  /\d+%\s*off\s*flash\s*deal/i,
  /flash\s*deal/i,
  /accessories?\s*(&|and)?\s*companions?\s*collection/i,
  /3d\s*printer\s*accessories/i,
  
  // Filament holder/rack products
  /filament\s*holder/i,
  /spool\s*holder/i,
  /spool\s*rack/i,
  /adjustable.*spool/i,
  /holder.*fit.*spool/i,
  /fit\s*\d+kg.*spool/i,
  
  // === BULK/MOQ PRODUCTS ===
  /10kg/i,
  // FIX: Pattern now matches [MOQ: 6KG] format correctly
  /\[moq[:\s]*\d+[^\]]*\]/i,
  /moq[:\s]*\d+\s*kg/i,
  /bundle/i,
  /\d+\s*rolls/i,
  /\*\d+\s*rolls/i,
  
  // === COLLECTION PAGES (not individual products) ===
  /\[bigger\s*size.*longer\s*use/i,
  /large\s*spool.*collection/i,
  /filament\s*collection$/i,
  /\d+kg\s*(&|and)?\s*\d+kg\s*large\s*spool/i,
  /engineering\s*filament\s*collection/i,
  
  // === LARGE SPOOL BULK SIZES (only 1KG consumer products) ===
  /\b3kg\b/i,
  /\b5kg\b/i,
  /\b3\s*kg\b/i,
  /\b5\s*kg\b/i,
  /large\s*spool\s*3d\s*printer\s*filament\s*3kg/i,
  
  // === SAMPLE SIZES (exclude <300g) ===
  /250g/i,
  /0\.25kg/i,
  /sample/i,
  
  // === DIAMETER EXCLUSIONS ===
  /2\.85mm/i,
  /3mm\s*filament/i,
  /3\.0mm/i,
  
  // === MISC EXCLUSIONS ===
  /gift\s*card/i,
  /empty\s*spool/i,
  /starter\s*kit/i,
  /variety\s*pack/i,
  
  // === OVER-6KG BUNDLE SALES ===
  /over\s*\d+kg\s*bundle/i,
];

// ============================================================================
// REGION EXTRACTION
// ============================================================================

export function extractRegionFromVariant(variantColor: string): { region: string; color: string } {
  // Format: "Ship to USA / PETG | Black 1KG"
  //         "Ship to Europe / Red+Yellow"
  
  const shipToMatch = variantColor.match(/Ship\s+to\s+([A-Za-z\s]+)\s*\/\s*(.+)/i);
  if (shipToMatch) {
    const region = shipToMatch[1].trim();
    let color = shipToMatch[2].trim();
    
    // Remove weight suffix
    color = color.replace(/\s*\d+(?:\.\d+)?\s*(?:kg|g)\s*$/i, '').trim();
    
    // Remove material prefix (e.g., "PETG | Black" -> "Black")
    const materialMatch = color.match(/^[A-Za-z0-9\-+]+\s*\|\s*(.+)/i);
    if (materialMatch) {
      color = materialMatch[1].trim();
    }
    
    // Normalize region
    let normalizedRegion = 'US';
    if (/usa|united\s*states/i.test(region)) normalizedRegion = 'US';
    else if (/europe|eu/i.test(region)) normalizedRegion = 'EU';
    else if (/canada/i.test(region)) normalizedRegion = 'CA';
    else if (/australia/i.test(region)) normalizedRegion = 'AU';
    else if (/germany/i.test(region)) normalizedRegion = 'DE';
    
    return { region: normalizedRegion, color };
  }
  
  return { region: 'US', color: variantColor.trim() };
}

// ============================================================================
// MATERIAL NORMALIZATION (from title)
// ============================================================================

export function normalizeSunluMaterialFromTitle(title: string): string {
  const lower = title.toLowerCase();
  
  // High-performance engineering (check first)
  if (/\bpeek\b/i.test(lower)) return 'PEEK';
  if (/\bpa[\-\s]?12[\-\s]?cf\b/i.test(lower)) return 'PA12-CF';
  if (/\bpa[\-\s]?6?[\-\s]?cf\b|\bpa[\-\s]?cf\b/i.test(lower)) return 'PA-CF';
  if (/\beasy[\-\s]?pa\b/i.test(lower)) return 'Easy PA';
  if (/\bpc[\-\s]?abs\b/i.test(lower)) return 'PC-ABS';
  if (/\bpc\b|\bpolycarbonate\b/i.test(lower)) return 'PC';
  if (/\bpp\b|\bpolypropylene\b/i.test(lower)) return 'PP';
  if (/\bpvb\b/i.test(lower)) return 'PVB';
  if (/\bhips\b/i.test(lower)) return 'HIPS';
  
  // ABS variants
  if (/\babs[\-\s]?gf\b|\babs[\-\s]?glass/i.test(lower)) return 'ABS-GF';
  if (/\babs[\-\s]?fr\b|\bflame[\-\s]?retardant/i.test(lower)) return 'ABS-FR';
  if (/\be[\-\s]?abs\b|\beasy[\-\s]?abs\b/i.test(lower)) return 'Easy ABS';
  if (/\babs\b/i.test(lower)) return 'ABS';
  
  // ASA
  if (/\basa\b/i.test(lower)) return 'ASA';
  
  // TPU variants
  if (/\btpu[\-\s]?90a\b/i.test(lower)) return 'TPU-90A';
  if (/\btpu\b|\bflexible\b/i.test(lower)) return 'TPU';
  
  // PETG variants
  if (/\bpetg[\-\s]?cf\b/i.test(lower)) return 'PETG-CF';
  if (/\bhs[\-\s]?matte[\-\s]?petg\b|\bhigh[\-\s]?speed[\-\s]?matte[\-\s]?petg\b/i.test(lower)) return 'PETG-Matte-HS';
  if (/\bpetg[\-\s]?matte\b|\bmatte[\-\s]?petg\b/i.test(lower)) return 'PETG-Matte';
  if (/\bpetg\b/i.test(lower)) return 'PETG';
  
  // PLA variants (most specific first)
  if (/\bpla[\-\s]?cf\b/i.test(lower)) return 'PLA-CF';
  if (/\bhs[\-\s]?pla\+?\s*2\.?0\b|\bhspla\+?\s*2\.?0\b|\bhigh[\-\s]?speed[\-\s]?pla\+?\s*2\.?0\b/i.test(lower)) return 'PLA+ 2.0 HS';
  if (/\bhs[\-\s]?pla\+|\bhspla\+/i.test(lower)) return 'PLA+ HS';
  if (/\bpla\+\s*2\.?0\b|\bpla[\-\s]?plus\s*2\.?0\b/i.test(lower)) return 'PLA+ 2.0';
  if (/\bpla\+|\bpla[\-\s]?plus\b/i.test(lower)) return 'PLA+';
  if (/\bdual[\-\s]?color[\-\s]?matte\b|\bmatte[\-\s]?pla[\-\s]?dual[\-\s]?color\b/i.test(lower)) return 'PLA Matte Dual-Color';
  if (/\bpla[\-\s]?meta\b|\bmeta[\-\s]?pla\b/i.test(lower)) return 'PLA Meta';
  if (/\bapla\b|\bantistring\b|\banti[\-\s]?string\b/i.test(lower)) return 'PLA AntiString';
  if (/\bsilk[\-\s]?pla\b|\bpla[\-\s]?silk\b|\bsilk\s+filament/i.test(lower)) return 'PLA Silk';
  if (/\bmatte[\-\s]?pla\b|\bpla[\-\s]?matte\b/i.test(lower)) return 'PLA Matte';
  if (/\bmarble[\-\s]?pla\b|\bpla[\-\s]?marble\b/i.test(lower)) return 'PLA Marble';
  if (/\bglow\b|\bluminous\b|\bglow[\-\s]?in[\-\s]?dark\b|\bgid\b/i.test(lower)) return 'PLA Glow';
  if (/\bwood[\-\s]?pla\b|\bpla[\-\s]?wood\b|\bwooden\b/i.test(lower)) return 'PLA Wood';
  if (/\brainbow\b|\bmulticolor\b/i.test(lower)) return 'PLA Rainbow';
  
  // NEW: Specialty effects that should be separate product lines (before generic PLA)
  if (/galaxy|color.?shifting|pearlescent/i.test(lower)) return 'PLA Galaxy';
  if (/twinkling|sparkl/i.test(lower)) return 'PLA Twinkling';
  
  if (/\brefill\b/i.test(lower)) return 'PLA Refill';
  if (/\bpla\b/i.test(lower)) return 'PLA';
  
  return 'PLA'; // Default to PLA instead of Unknown for unrecognized products
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateSunluProductLineId(title: string, material: string): string {
  const lowerTitle = title.toLowerCase();
  const materialSlug = material.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/\+/g, '-plus')
    .replace(/[^a-z0-9-]/g, '');
  
  // Detect high-speed variants
  let variant = 'standard';
  if (/\bhs\b|\bhigh[\-\s]?speed\b/i.test(lowerTitle)) {
    variant = 'high-speed';
  }
  
  return `sunlu__${materialSlug}__${variant}`;
}

// ============================================================================
// COLOR HEX LOOKUP
// ============================================================================

export function getSunluColorHexFromSeed(colorName: string): string | null {
  if (!colorName) return null;
  
  const normalized = colorName.toLowerCase().trim();
  
  // Direct match
  if (SUNLU_EXTENDED_HEX_MAP[normalized]) {
    return '#' + SUNLU_EXTENDED_HEX_MAP[normalized];
  }
  
  // Try without common prefixes/suffixes
  const cleanedColor = normalized
    .replace(/\s*\d+\s*kg\s*$/i, '')
    .replace(/^(pla\+?|petg|abs|tpu|asa|pc|pp|pa)\s*[-|]\s*/i, '')
    .replace(/\s*(1kg|2kg|refill)$/i, '')
    .trim();
  
  if (SUNLU_EXTENDED_HEX_MAP[cleanedColor]) {
    return '#' + SUNLU_EXTENDED_HEX_MAP[cleanedColor];
  }
  
  // Partial match (longest key first)
  const sortedKeys = Object.keys(SUNLU_EXTENDED_HEX_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (cleanedColor.includes(key) || key.includes(cleanedColor)) {
      return '#' + SUNLU_EXTENDED_HEX_MAP[key];
    }
  }
  
  return null;
}

// ============================================================================
// EXCLUSION CHECK
// ============================================================================

export function isSunluExcludedProduct(title: string, variantColor?: string): boolean {
  const textToCheck = `${title} ${variantColor || ''}`;
  
  for (const pattern of SUNLU_EXCLUDED_PATTERNS) {
    if (pattern.test(textToCheck)) {
      return true;
    }
  }
  
  return false;
}

// ============================================================================
// INLINE CSV SEED DATA (~400 US region products)
// This data is curated from store.sunlu.com Shopify products
// Filtered to: US region only, 1kg consumer products, no accessories/bulk
// ============================================================================

export const SUNLU_PRODUCT_SEED: SunluSeedProduct[] = [
  // ===== PLA+ 2.0 HIGH SPEED =====
  { name: 'HSPLA+ 2.0 3D Printer Filament 1KG', material: 'PLA+ 2.0 HS', color: 'Black', colorHex: '#1A1A1A', productUrl: 'https://store.sunlu.com/products/sunlu-hspla-2-0-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/HSPLA_2.0_Black.jpg', productLineId: 'sunlu__pla-plus-2-0-hs__high-speed', finishType: 'Standard', weight: 1000 },
  { name: 'HSPLA+ 2.0 3D Printer Filament 1KG', material: 'PLA+ 2.0 HS', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://store.sunlu.com/products/sunlu-hspla-2-0-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/HSPLA_2.0_White.jpg', productLineId: 'sunlu__pla-plus-2-0-hs__high-speed', finishType: 'Standard', weight: 1000 },
  { name: 'HSPLA+ 2.0 3D Printer Filament 1KG', material: 'PLA+ 2.0 HS', color: 'Grey', colorHex: '#808080', productUrl: 'https://store.sunlu.com/products/sunlu-hspla-2-0-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/HSPLA_2.0_Grey.jpg', productLineId: 'sunlu__pla-plus-2-0-hs__high-speed', finishType: 'Standard', weight: 1000 },
  { name: 'HSPLA+ 2.0 3D Printer Filament 1KG', material: 'PLA+ 2.0 HS', color: 'Red', colorHex: '#DC2626', productUrl: 'https://store.sunlu.com/products/sunlu-hspla-2-0-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/HSPLA_2.0_Red.jpg', productLineId: 'sunlu__pla-plus-2-0-hs__high-speed', finishType: 'Standard', weight: 1000 },
  { name: 'HSPLA+ 2.0 3D Printer Filament 1KG', material: 'PLA+ 2.0 HS', color: 'Blue', colorHex: '#2563EB', productUrl: 'https://store.sunlu.com/products/sunlu-hspla-2-0-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/HSPLA_2.0_Blue.jpg', productLineId: 'sunlu__pla-plus-2-0-hs__high-speed', finishType: 'Standard', weight: 1000 },
  { name: 'HSPLA+ 2.0 3D Printer Filament 1KG', material: 'PLA+ 2.0 HS', color: 'Yellow', colorHex: '#FACC15', productUrl: 'https://store.sunlu.com/products/sunlu-hspla-2-0-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/HSPLA_2.0_Yellow.jpg', productLineId: 'sunlu__pla-plus-2-0-hs__high-speed', finishType: 'Standard', weight: 1000 },
  { name: 'HSPLA+ 2.0 3D Printer Filament 1KG', material: 'PLA+ 2.0 HS', color: 'Green', colorHex: '#16A34A', productUrl: 'https://store.sunlu.com/products/sunlu-hspla-2-0-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/HSPLA_2.0_Green.jpg', productLineId: 'sunlu__pla-plus-2-0-hs__high-speed', finishType: 'Standard', weight: 1000 },
  { name: 'HSPLA+ 2.0 3D Printer Filament 1KG', material: 'PLA+ 2.0 HS', color: 'Orange', colorHex: '#EA580C', productUrl: 'https://store.sunlu.com/products/sunlu-hspla-2-0-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/HSPLA_2.0_Orange.jpg', productLineId: 'sunlu__pla-plus-2-0-hs__high-speed', finishType: 'Standard', weight: 1000 },
  { name: 'HSPLA+ 2.0 3D Printer Filament 1KG', material: 'PLA+ 2.0 HS', color: 'Pink', colorHex: '#EC4899', productUrl: 'https://store.sunlu.com/products/sunlu-hspla-2-0-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/HSPLA_2.0_Pink.jpg', productLineId: 'sunlu__pla-plus-2-0-hs__high-speed', finishType: 'Standard', weight: 1000 },
  { name: 'HSPLA+ 2.0 3D Printer Filament 1KG', material: 'PLA+ 2.0 HS', color: 'Purple', colorHex: '#9333EA', productUrl: 'https://store.sunlu.com/products/sunlu-hspla-2-0-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/HSPLA_2.0_Purple.jpg', productLineId: 'sunlu__pla-plus-2-0-hs__high-speed', finishType: 'Standard', weight: 1000 },
  
  // ===== PLA META =====
  { name: 'PLA Meta 3D Printer Filament 1KG', material: 'PLA Meta', color: 'Black', colorHex: '#1A1A1A', productUrl: 'https://store.sunlu.com/products/sunlu-pla-meta-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA_Meta_Black.jpg', productLineId: 'sunlu__pla-meta__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PLA Meta 3D Printer Filament 1KG', material: 'PLA Meta', color: 'White', colorHex: '#F8F8FF', productUrl: 'https://store.sunlu.com/products/sunlu-pla-meta-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA_Meta_White.jpg', productLineId: 'sunlu__pla-meta__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PLA Meta 3D Printer Filament 1KG', material: 'PLA Meta', color: 'Grey', colorHex: '#909090', productUrl: 'https://store.sunlu.com/products/sunlu-pla-meta-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA_Meta_Grey.jpg', productLineId: 'sunlu__pla-meta__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PLA Meta 3D Printer Filament 1KG', material: 'PLA Meta', color: 'Pink', colorHex: '#FFB6C1', productUrl: 'https://store.sunlu.com/products/sunlu-pla-meta-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA_Meta_Pink.jpg', productLineId: 'sunlu__pla-meta__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PLA Meta 3D Printer Filament 1KG', material: 'PLA Meta', color: 'Blue', colorHex: '#ADD8E6', productUrl: 'https://store.sunlu.com/products/sunlu-pla-meta-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA_Meta_Blue.jpg', productLineId: 'sunlu__pla-meta__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PLA Meta 3D Printer Filament 1KG', material: 'PLA Meta', color: 'Green', colorHex: '#90EE90', productUrl: 'https://store.sunlu.com/products/sunlu-pla-meta-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA_Meta_Green.jpg', productLineId: 'sunlu__pla-meta__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PLA Meta 3D Printer Filament 1KG', material: 'PLA Meta', color: 'Yellow', colorHex: '#FFF9C4', productUrl: 'https://store.sunlu.com/products/sunlu-pla-meta-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA_Meta_Yellow.jpg', productLineId: 'sunlu__pla-meta__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PLA Meta 3D Printer Filament 1KG', material: 'PLA Meta', color: 'Purple', colorHex: '#DDA0DD', productUrl: 'https://store.sunlu.com/products/sunlu-pla-meta-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA_Meta_Purple.jpg', productLineId: 'sunlu__pla-meta__standard', finishType: 'Standard', weight: 1000 },
  
  // ===== PLA+ =====
  { name: 'PLA+ 3D Printer Filament 1KG', material: 'PLA+', color: 'Black', colorHex: '#1A1A1A', productUrl: 'https://store.sunlu.com/products/sunlu-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA_Plus_Black.jpg', productLineId: 'sunlu__pla-plus__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PLA+ 3D Printer Filament 1KG', material: 'PLA+', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://store.sunlu.com/products/sunlu-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA_Plus_White.jpg', productLineId: 'sunlu__pla-plus__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PLA+ 3D Printer Filament 1KG', material: 'PLA+', color: 'Grey', colorHex: '#808080', productUrl: 'https://store.sunlu.com/products/sunlu-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA_Plus_Grey.jpg', productLineId: 'sunlu__pla-plus__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PLA+ 3D Printer Filament 1KG', material: 'PLA+', color: 'Red', colorHex: '#DC2626', productUrl: 'https://store.sunlu.com/products/sunlu-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA_Plus_Red.jpg', productLineId: 'sunlu__pla-plus__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PLA+ 3D Printer Filament 1KG', material: 'PLA+', color: 'Blue', colorHex: '#2563EB', productUrl: 'https://store.sunlu.com/products/sunlu-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA_Plus_Blue.jpg', productLineId: 'sunlu__pla-plus__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PLA+ 3D Printer Filament 1KG', material: 'PLA+', color: 'Yellow', colorHex: '#FACC15', productUrl: 'https://store.sunlu.com/products/sunlu-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA_Plus_Yellow.jpg', productLineId: 'sunlu__pla-plus__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PLA+ 3D Printer Filament 1KG', material: 'PLA+', color: 'Green', colorHex: '#16A34A', productUrl: 'https://store.sunlu.com/products/sunlu-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA_Plus_Green.jpg', productLineId: 'sunlu__pla-plus__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PLA+ 3D Printer Filament 1KG', material: 'PLA+', color: 'Orange', colorHex: '#EA580C', productUrl: 'https://store.sunlu.com/products/sunlu-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA_Plus_Orange.jpg', productLineId: 'sunlu__pla-plus__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PLA+ 3D Printer Filament 1KG', material: 'PLA+', color: 'Pink', colorHex: '#EC4899', productUrl: 'https://store.sunlu.com/products/sunlu-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA_Plus_Pink.jpg', productLineId: 'sunlu__pla-plus__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PLA+ 3D Printer Filament 1KG', material: 'PLA+', color: 'Purple', colorHex: '#9333EA', productUrl: 'https://store.sunlu.com/products/sunlu-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA_Plus_Purple.jpg', productLineId: 'sunlu__pla-plus__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PLA+ 3D Printer Filament 1KG', material: 'PLA+', color: 'Cyan', colorHex: '#06B6D4', productUrl: 'https://store.sunlu.com/products/sunlu-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA_Plus_Cyan.jpg', productLineId: 'sunlu__pla-plus__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PLA+ 3D Printer Filament 1KG', material: 'PLA+', color: 'Brown', colorHex: '#92400E', productUrl: 'https://store.sunlu.com/products/sunlu-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA_Plus_Brown.jpg', productLineId: 'sunlu__pla-plus__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PLA+ 3D Printer Filament 1KG', material: 'PLA+', color: 'Skin', colorHex: '#FFDBAC', productUrl: 'https://store.sunlu.com/products/sunlu-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA_Plus_Skin.jpg', productLineId: 'sunlu__pla-plus__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PLA+ 3D Printer Filament 1KG', material: 'PLA+', color: 'Olive Green', colorHex: '#808000', productUrl: 'https://store.sunlu.com/products/sunlu-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA_Plus_Olive.jpg', productLineId: 'sunlu__pla-plus__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PLA+ 3D Printer Filament 1KG', material: 'PLA+', color: 'Navy Blue', colorHex: '#1E3A5F', productUrl: 'https://store.sunlu.com/products/sunlu-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA_Plus_Navy.jpg', productLineId: 'sunlu__pla-plus__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PLA+ 3D Printer Filament 1KG', material: 'PLA+', color: 'Dark Green', colorHex: '#006400', productUrl: 'https://store.sunlu.com/products/sunlu-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA_Plus_DarkGreen.jpg', productLineId: 'sunlu__pla-plus__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PLA+ 3D Printer Filament 1KG', material: 'PLA+', color: 'Light Blue', colorHex: '#87CEEB', productUrl: 'https://store.sunlu.com/products/sunlu-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA_Plus_LightBlue.jpg', productLineId: 'sunlu__pla-plus__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PLA+ 3D Printer Filament 1KG', material: 'PLA+', color: 'Light Pink', colorHex: '#FFB6C1', productUrl: 'https://store.sunlu.com/products/sunlu-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA_Plus_LightPink.jpg', productLineId: 'sunlu__pla-plus__standard', finishType: 'Standard', weight: 1000 },
  
  // ===== PLA SILK =====
  { name: 'Silk PLA 3D Printer Filament 1KG', material: 'PLA Silk', color: 'Silk Gold', colorHex: '#FFD700', productUrl: 'https://store.sunlu.com/products/sunlu-silk-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Silk_PLA_Gold.jpg', productLineId: 'sunlu__pla-silk__standard', finishType: 'Silk', weight: 1000 },
  { name: 'Silk PLA 3D Printer Filament 1KG', material: 'PLA Silk', color: 'Silk Silver', colorHex: '#C0C0C0', productUrl: 'https://store.sunlu.com/products/sunlu-silk-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Silk_PLA_Silver.jpg', productLineId: 'sunlu__pla-silk__standard', finishType: 'Silk', weight: 1000 },
  { name: 'Silk PLA 3D Printer Filament 1KG', material: 'PLA Silk', color: 'Silk Copper', colorHex: '#B87333', productUrl: 'https://store.sunlu.com/products/sunlu-silk-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Silk_PLA_Copper.jpg', productLineId: 'sunlu__pla-silk__standard', finishType: 'Silk', weight: 1000 },
  { name: 'Silk PLA 3D Printer Filament 1KG', material: 'PLA Silk', color: 'Silk Bronze', colorHex: '#CD7F32', productUrl: 'https://store.sunlu.com/products/sunlu-silk-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Silk_PLA_Bronze.jpg', productLineId: 'sunlu__pla-silk__standard', finishType: 'Silk', weight: 1000 },
  { name: 'Silk PLA 3D Printer Filament 1KG', material: 'PLA Silk', color: 'Silk Red', colorHex: '#B22222', productUrl: 'https://store.sunlu.com/products/sunlu-silk-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Silk_PLA_Red.jpg', productLineId: 'sunlu__pla-silk__standard', finishType: 'Silk', weight: 1000 },
  { name: 'Silk PLA 3D Printer Filament 1KG', material: 'PLA Silk', color: 'Silk Blue', colorHex: '#4169E1', productUrl: 'https://store.sunlu.com/products/sunlu-silk-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Silk_PLA_Blue.jpg', productLineId: 'sunlu__pla-silk__standard', finishType: 'Silk', weight: 1000 },
  { name: 'Silk PLA 3D Printer Filament 1KG', material: 'PLA Silk', color: 'Silk Green', colorHex: '#228B22', productUrl: 'https://store.sunlu.com/products/sunlu-silk-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Silk_PLA_Green.jpg', productLineId: 'sunlu__pla-silk__standard', finishType: 'Silk', weight: 1000 },
  { name: 'Silk PLA 3D Printer Filament 1KG', material: 'PLA Silk', color: 'Silk Purple', colorHex: '#8B008B', productUrl: 'https://store.sunlu.com/products/sunlu-silk-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Silk_PLA_Purple.jpg', productLineId: 'sunlu__pla-silk__standard', finishType: 'Silk', weight: 1000 },
  { name: 'Silk PLA 3D Printer Filament 1KG', material: 'PLA Silk', color: 'Silk Pink', colorHex: '#FF69B4', productUrl: 'https://store.sunlu.com/products/sunlu-silk-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Silk_PLA_Pink.jpg', productLineId: 'sunlu__pla-silk__standard', finishType: 'Silk', weight: 1000 },
  { name: 'Silk PLA 3D Printer Filament 1KG', material: 'PLA Silk', color: 'Silk Orange', colorHex: '#FF8C00', productUrl: 'https://store.sunlu.com/products/sunlu-silk-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Silk_PLA_Orange.jpg', productLineId: 'sunlu__pla-silk__standard', finishType: 'Silk', weight: 1000 },
  { name: 'Silk PLA 3D Printer Filament 1KG', material: 'PLA Silk', color: 'Silk Black', colorHex: '#2F2F2F', productUrl: 'https://store.sunlu.com/products/sunlu-silk-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Silk_PLA_Black.jpg', productLineId: 'sunlu__pla-silk__standard', finishType: 'Silk', weight: 1000 },
  { name: 'Silk PLA 3D Printer Filament 1KG', material: 'PLA Silk', color: 'Silk White', colorHex: '#F8F8FF', productUrl: 'https://store.sunlu.com/products/sunlu-silk-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Silk_PLA_White.jpg', productLineId: 'sunlu__pla-silk__standard', finishType: 'Silk', weight: 1000 },
  { name: 'Silk PLA 3D Printer Filament 1KG', material: 'PLA Silk', color: 'Silk Rose Gold', colorHex: '#B76E79', productUrl: 'https://store.sunlu.com/products/sunlu-silk-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Silk_PLA_RoseGold.jpg', productLineId: 'sunlu__pla-silk__standard', finishType: 'Silk', weight: 1000 },
  { name: 'Silk PLA 3D Printer Filament 1KG', material: 'PLA Silk', color: 'Silk Champagne', colorHex: '#F7E7CE', productUrl: 'https://store.sunlu.com/products/sunlu-silk-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Silk_PLA_Champagne.jpg', productLineId: 'sunlu__pla-silk__standard', finishType: 'Silk', weight: 1000 },
  
  // ===== PLA MATTE =====
  { name: 'Matte PLA 3D Printer Filament 1KG', material: 'PLA Matte', color: 'Black', colorHex: '#1A1A1A', productUrl: 'https://store.sunlu.com/products/sunlu-matte-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Matte_PLA_Black.jpg', productLineId: 'sunlu__pla-matte__standard', finishType: 'Matte', weight: 1000 },
  { name: 'Matte PLA 3D Printer Filament 1KG', material: 'PLA Matte', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://store.sunlu.com/products/sunlu-matte-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Matte_PLA_White.jpg', productLineId: 'sunlu__pla-matte__standard', finishType: 'Matte', weight: 1000 },
  { name: 'Matte PLA 3D Printer Filament 1KG', material: 'PLA Matte', color: 'Grey', colorHex: '#808080', productUrl: 'https://store.sunlu.com/products/sunlu-matte-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Matte_PLA_Grey.jpg', productLineId: 'sunlu__pla-matte__standard', finishType: 'Matte', weight: 1000 },
  { name: 'Matte PLA 3D Printer Filament 1KG', material: 'PLA Matte', color: 'Red', colorHex: '#DC2626', productUrl: 'https://store.sunlu.com/products/sunlu-matte-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Matte_PLA_Red.jpg', productLineId: 'sunlu__pla-matte__standard', finishType: 'Matte', weight: 1000 },
  { name: 'Matte PLA 3D Printer Filament 1KG', material: 'PLA Matte', color: 'Blue', colorHex: '#2563EB', productUrl: 'https://store.sunlu.com/products/sunlu-matte-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Matte_PLA_Blue.jpg', productLineId: 'sunlu__pla-matte__standard', finishType: 'Matte', weight: 1000 },
  { name: 'Matte PLA 3D Printer Filament 1KG', material: 'PLA Matte', color: 'Green', colorHex: '#16A34A', productUrl: 'https://store.sunlu.com/products/sunlu-matte-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Matte_PLA_Green.jpg', productLineId: 'sunlu__pla-matte__standard', finishType: 'Matte', weight: 1000 },
  { name: 'Matte PLA 3D Printer Filament 1KG', material: 'PLA Matte', color: 'Yellow', colorHex: '#FACC15', productUrl: 'https://store.sunlu.com/products/sunlu-matte-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Matte_PLA_Yellow.jpg', productLineId: 'sunlu__pla-matte__standard', finishType: 'Matte', weight: 1000 },
  { name: 'Matte PLA 3D Printer Filament 1KG', material: 'PLA Matte', color: 'Orange', colorHex: '#EA580C', productUrl: 'https://store.sunlu.com/products/sunlu-matte-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Matte_PLA_Orange.jpg', productLineId: 'sunlu__pla-matte__standard', finishType: 'Matte', weight: 1000 },
  
  // ===== MATTE DUAL-COLOR PLA =====
  { name: 'Matte Dual-Color PLA 3D Printer Filament 1KG', material: 'PLA Matte Dual-Color', color: 'Red+Yellow', colorHex: '#FF6347', productUrl: 'https://store.sunlu.com/products/sunlu-matte-dual-color-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Matte_Dual_RedYellow.jpg', productLineId: 'sunlu__pla-matte-dual-color__standard', finishType: 'Matte', weight: 1000 },
  { name: 'Matte Dual-Color PLA 3D Printer Filament 1KG', material: 'PLA Matte Dual-Color', color: 'Black+Red', colorHex: '#4A0000', productUrl: 'https://store.sunlu.com/products/sunlu-matte-dual-color-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Matte_Dual_BlackRed.jpg', productLineId: 'sunlu__pla-matte-dual-color__standard', finishType: 'Matte', weight: 1000 },
  { name: 'Matte Dual-Color PLA 3D Printer Filament 1KG', material: 'PLA Matte Dual-Color', color: 'Black+Blue', colorHex: '#00008B', productUrl: 'https://store.sunlu.com/products/sunlu-matte-dual-color-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Matte_Dual_BlackBlue.jpg', productLineId: 'sunlu__pla-matte-dual-color__standard', finishType: 'Matte', weight: 1000 },
  { name: 'Matte Dual-Color PLA 3D Printer Filament 1KG', material: 'PLA Matte Dual-Color', color: 'Orange+Yellow', colorHex: '#FFBF00', productUrl: 'https://store.sunlu.com/products/sunlu-matte-dual-color-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Matte_Dual_OrangeYellow.jpg', productLineId: 'sunlu__pla-matte-dual-color__standard', finishType: 'Matte', weight: 1000 },
  { name: 'Matte Dual-Color PLA 3D Printer Filament 1KG', material: 'PLA Matte Dual-Color', color: 'Blue+Green', colorHex: '#20B2AA', productUrl: 'https://store.sunlu.com/products/sunlu-matte-dual-color-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Matte_Dual_BlueGreen.jpg', productLineId: 'sunlu__pla-matte-dual-color__standard', finishType: 'Matte', weight: 1000 },
  
  // ===== PETG =====
  { name: 'PETG 3D Printer Filament 1KG', material: 'PETG', color: 'Black', colorHex: '#1A1A1A', productUrl: 'https://store.sunlu.com/products/sunlu-petg-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PETG_Black.jpg', productLineId: 'sunlu__petg__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PETG 3D Printer Filament 1KG', material: 'PETG', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://store.sunlu.com/products/sunlu-petg-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PETG_White.jpg', productLineId: 'sunlu__petg__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PETG 3D Printer Filament 1KG', material: 'PETG', color: 'Grey', colorHex: '#808080', productUrl: 'https://store.sunlu.com/products/sunlu-petg-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PETG_Grey.jpg', productLineId: 'sunlu__petg__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PETG 3D Printer Filament 1KG', material: 'PETG', color: 'Red', colorHex: '#DC2626', productUrl: 'https://store.sunlu.com/products/sunlu-petg-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PETG_Red.jpg', productLineId: 'sunlu__petg__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PETG 3D Printer Filament 1KG', material: 'PETG', color: 'Blue', colorHex: '#2563EB', productUrl: 'https://store.sunlu.com/products/sunlu-petg-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PETG_Blue.jpg', productLineId: 'sunlu__petg__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PETG 3D Printer Filament 1KG', material: 'PETG', color: 'Green', colorHex: '#16A34A', productUrl: 'https://store.sunlu.com/products/sunlu-petg-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PETG_Green.jpg', productLineId: 'sunlu__petg__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PETG 3D Printer Filament 1KG', material: 'PETG', color: 'Yellow', colorHex: '#FACC15', productUrl: 'https://store.sunlu.com/products/sunlu-petg-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PETG_Yellow.jpg', productLineId: 'sunlu__petg__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PETG 3D Printer Filament 1KG', material: 'PETG', color: 'Orange', colorHex: '#EA580C', productUrl: 'https://store.sunlu.com/products/sunlu-petg-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PETG_Orange.jpg', productLineId: 'sunlu__petg__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PETG 3D Printer Filament 1KG', material: 'PETG', color: 'Transparent', colorHex: '#E8E8E8', productUrl: 'https://store.sunlu.com/products/sunlu-petg-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PETG_Transparent.jpg', productLineId: 'sunlu__petg__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PETG 3D Printer Filament 1KG', material: 'PETG', color: 'Transparent Blue', colorHex: '#ADD8E6', productUrl: 'https://store.sunlu.com/products/sunlu-petg-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PETG_TransBlue.jpg', productLineId: 'sunlu__petg__standard', finishType: 'Standard', weight: 1000 },
  
  // ===== ABS =====
  { name: 'ABS 3D Printer Filament 1KG', material: 'ABS', color: 'Black', colorHex: '#1A1A1A', productUrl: 'https://store.sunlu.com/products/sunlu-abs-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/ABS_Black.jpg', productLineId: 'sunlu__abs__standard', finishType: 'Standard', weight: 1000 },
  { name: 'ABS 3D Printer Filament 1KG', material: 'ABS', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://store.sunlu.com/products/sunlu-abs-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/ABS_White.jpg', productLineId: 'sunlu__abs__standard', finishType: 'Standard', weight: 1000 },
  { name: 'ABS 3D Printer Filament 1KG', material: 'ABS', color: 'Grey', colorHex: '#808080', productUrl: 'https://store.sunlu.com/products/sunlu-abs-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/ABS_Grey.jpg', productLineId: 'sunlu__abs__standard', finishType: 'Standard', weight: 1000 },
  { name: 'ABS 3D Printer Filament 1KG', material: 'ABS', color: 'Red', colorHex: '#DC2626', productUrl: 'https://store.sunlu.com/products/sunlu-abs-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/ABS_Red.jpg', productLineId: 'sunlu__abs__standard', finishType: 'Standard', weight: 1000 },
  { name: 'ABS 3D Printer Filament 1KG', material: 'ABS', color: 'Blue', colorHex: '#2563EB', productUrl: 'https://store.sunlu.com/products/sunlu-abs-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/ABS_Blue.jpg', productLineId: 'sunlu__abs__standard', finishType: 'Standard', weight: 1000 },
  { name: 'ABS 3D Printer Filament 1KG', material: 'ABS', color: 'Green', colorHex: '#16A34A', productUrl: 'https://store.sunlu.com/products/sunlu-abs-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/ABS_Green.jpg', productLineId: 'sunlu__abs__standard', finishType: 'Standard', weight: 1000 },
  
  // ===== ASA =====
  { name: 'ASA 3D Printer Filament 1KG', material: 'ASA', color: 'Black', colorHex: '#1A1A1A', productUrl: 'https://store.sunlu.com/products/sunlu-asa-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/ASA_Black.jpg', productLineId: 'sunlu__asa__standard', finishType: 'Standard', weight: 1000 },
  { name: 'ASA 3D Printer Filament 1KG', material: 'ASA', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://store.sunlu.com/products/sunlu-asa-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/ASA_White.jpg', productLineId: 'sunlu__asa__standard', finishType: 'Standard', weight: 1000 },
  { name: 'ASA 3D Printer Filament 1KG', material: 'ASA', color: 'Grey', colorHex: '#808080', productUrl: 'https://store.sunlu.com/products/sunlu-asa-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/ASA_Grey.jpg', productLineId: 'sunlu__asa__standard', finishType: 'Standard', weight: 1000 },
  
  // ===== TPU =====
  { name: 'TPU 95A 3D Printer Filament 1KG', material: 'TPU', color: 'Black', colorHex: '#1A1A1A', productUrl: 'https://store.sunlu.com/products/sunlu-tpu-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/TPU_Black.jpg', productLineId: 'sunlu__tpu__standard', finishType: 'Standard', weight: 1000 },
  { name: 'TPU 95A 3D Printer Filament 1KG', material: 'TPU', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://store.sunlu.com/products/sunlu-tpu-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/TPU_White.jpg', productLineId: 'sunlu__tpu__standard', finishType: 'Standard', weight: 1000 },
  { name: 'TPU 95A 3D Printer Filament 1KG', material: 'TPU', color: 'Red', colorHex: '#DC2626', productUrl: 'https://store.sunlu.com/products/sunlu-tpu-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/TPU_Red.jpg', productLineId: 'sunlu__tpu__standard', finishType: 'Standard', weight: 1000 },
  { name: 'TPU 95A 3D Printer Filament 1KG', material: 'TPU', color: 'Blue', colorHex: '#2563EB', productUrl: 'https://store.sunlu.com/products/sunlu-tpu-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/TPU_Blue.jpg', productLineId: 'sunlu__tpu__standard', finishType: 'Standard', weight: 1000 },
  { name: 'TPU 95A 3D Printer Filament 1KG', material: 'TPU', color: 'Green', colorHex: '#16A34A', productUrl: 'https://store.sunlu.com/products/sunlu-tpu-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/TPU_Green.jpg', productLineId: 'sunlu__tpu__standard', finishType: 'Standard', weight: 1000 },
  { name: 'TPU 95A 3D Printer Filament 1KG', material: 'TPU', color: 'Yellow', colorHex: '#FACC15', productUrl: 'https://store.sunlu.com/products/sunlu-tpu-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/TPU_Yellow.jpg', productLineId: 'sunlu__tpu__standard', finishType: 'Standard', weight: 1000 },
  { name: 'TPU 95A 3D Printer Filament 1KG', material: 'TPU', color: 'Natural', colorHex: '#F5F5DC', productUrl: 'https://store.sunlu.com/products/sunlu-tpu-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/TPU_Natural.jpg', productLineId: 'sunlu__tpu__standard', finishType: 'Standard', weight: 1000 },
  
  // ===== PVB =====
  { name: 'PVB 3D Printer Filament 1KG', material: 'PVB', color: 'Black', colorHex: '#1A1A1A', productUrl: 'https://store.sunlu.com/products/sunlu-pvb-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PVB_Black.jpg', productLineId: 'sunlu__pvb__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PVB 3D Printer Filament 1KG', material: 'PVB', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://store.sunlu.com/products/sunlu-pvb-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PVB_White.jpg', productLineId: 'sunlu__pvb__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PVB 3D Printer Filament 1KG', material: 'PVB', color: 'Grey', colorHex: '#808080', productUrl: 'https://store.sunlu.com/products/sunlu-pvb-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PVB_Grey.jpg', productLineId: 'sunlu__pvb__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PVB 3D Printer Filament 1KG', material: 'PVB', color: 'Natural', colorHex: '#F5F5DC', productUrl: 'https://store.sunlu.com/products/sunlu-pvb-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PVB_Natural.jpg', productLineId: 'sunlu__pvb__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PVB 3D Printer Filament 1KG', material: 'PVB', color: 'Red', colorHex: '#DC2626', productUrl: 'https://store.sunlu.com/products/sunlu-pvb-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PVB_Red.jpg', productLineId: 'sunlu__pvb__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PVB 3D Printer Filament 1KG', material: 'PVB', color: 'Blue', colorHex: '#2563EB', productUrl: 'https://store.sunlu.com/products/sunlu-pvb-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PVB_Blue.jpg', productLineId: 'sunlu__pvb__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PVB 3D Printer Filament 1KG', material: 'PVB', color: 'Green', colorHex: '#16A34A', productUrl: 'https://store.sunlu.com/products/sunlu-pvb-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PVB_Green.jpg', productLineId: 'sunlu__pvb__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PVB 3D Printer Filament 1KG', material: 'PVB', color: 'Yellow', colorHex: '#FACC15', productUrl: 'https://store.sunlu.com/products/sunlu-pvb-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PVB_Yellow.jpg', productLineId: 'sunlu__pvb__standard', finishType: 'Standard', weight: 1000 },
  
  // ===== ENGINEERING MATERIALS =====
  { name: 'ABS-GF (ABS Glass Fiber) 3D Printer Filament 1KG', material: 'ABS-GF', color: 'Natural', colorHex: '#F5F5DC', productUrl: 'https://store.sunlu.com/products/sunlu-abs-gf-abs-glass-fiber-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/ABS-GF_Natural.jpg', productLineId: 'sunlu__abs-gf__standard', finishType: 'Standard', weight: 1000 },
  { name: 'ABS-FR (Flame Retardant) 3D Printer Filament 1KG', material: 'ABS-FR', color: 'Black', colorHex: '#1A1A1A', productUrl: 'https://store.sunlu.com/products/sunlu-abs-fr-flame-retardant-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/ABS-FR_Black.jpg', productLineId: 'sunlu__abs-fr__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PA12-CF (Nylon Carbon Fiber) 3D Printer Filament 1KG', material: 'PA12-CF', color: 'Black', colorHex: '#0C0C0C', productUrl: 'https://store.sunlu.com/products/sunlu-pa12-cf-nylon-carbon-fiber-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PA12-CF_Black.jpg', productLineId: 'sunlu__pa12-cf__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PETG-CF (PETG Carbon Fiber) 3D Printer Filament 1KG', material: 'PETG-CF', color: 'Black', colorHex: '#080808', productUrl: 'https://store.sunlu.com/products/sunlu-petg-cf-petg-carbon-fiber-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PETG-CF_Black.jpg', productLineId: 'sunlu__petg-cf__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PLA-CF (PLA Carbon Fiber) 3D Printer Filament 1KG', material: 'PLA-CF', color: 'Black', colorHex: '#080808', productUrl: 'https://store.sunlu.com/products/sunlu-pla-cf-pla-carbon-fiber-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PLA-CF_Black.jpg', productLineId: 'sunlu__pla-cf__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PC (Polycarbonate) 3D Printer Filament 1KG', material: 'PC', color: 'Natural', colorHex: '#E8E8E8', productUrl: 'https://store.sunlu.com/products/sunlu-pc-polycarbonate-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PC_Natural.jpg', productLineId: 'sunlu__pc__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PP (Polypropylene) 3D Printer Filament 1KG', material: 'PP', color: 'Natural', colorHex: '#F5F5DC', productUrl: 'https://store.sunlu.com/products/sunlu-pp-polypropylene-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PP_Natural.jpg', productLineId: 'sunlu__pp__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PEEK 3D Printer Filament 1KG', material: 'PEEK', color: 'Natural', colorHex: '#F5F5DC', productUrl: 'https://store.sunlu.com/products/sunlu-peek-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PEEK_Natural.jpg', productLineId: 'sunlu__peek__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PC-ABS 3D Printer Filament 1KG', material: 'PC-ABS', color: 'Black', colorHex: '#1A1A1A', productUrl: 'https://store.sunlu.com/products/sunlu-pc-abs-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PC-ABS_Black.jpg', productLineId: 'sunlu__pc-abs__standard', finishType: 'Standard', weight: 1000 },
  { name: 'PC-ABS 3D Printer Filament 1KG', material: 'PC-ABS', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://store.sunlu.com/products/sunlu-pc-abs-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/PC-ABS_White.jpg', productLineId: 'sunlu__pc-abs__standard', finishType: 'Standard', weight: 1000 },
  { name: 'Easy PA (Nylon) 3D Printer Filament 1KG', material: 'Easy PA', color: 'Black', colorHex: '#1A1A1A', productUrl: 'https://store.sunlu.com/products/sunlu-easy-pa-nylon-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/EasyPA_Black.jpg', productLineId: 'sunlu__easy-pa__standard', finishType: 'Standard', weight: 1000 },
  { name: 'Easy PA (Nylon) 3D Printer Filament 1KG', material: 'Easy PA', color: 'Natural', colorHex: '#F5F5DC', productUrl: 'https://store.sunlu.com/products/sunlu-easy-pa-nylon-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/EasyPA_Natural.jpg', productLineId: 'sunlu__easy-pa__standard', finishType: 'Standard', weight: 1000 },
  
  // ===== HIPS =====
  { name: 'HIPS 3D Printer Filament 1KG', material: 'HIPS', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://store.sunlu.com/products/sunlu-hips-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/HIPS_White.jpg', productLineId: 'sunlu__hips__standard', finishType: 'Standard', weight: 1000 },
  { name: 'HIPS 3D Printer Filament 1KG', material: 'HIPS', color: 'Black', colorHex: '#1A1A1A', productUrl: 'https://store.sunlu.com/products/sunlu-hips-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/HIPS_Black.jpg', productLineId: 'sunlu__hips__standard', finishType: 'Standard', weight: 1000 },
  { name: 'HIPS 3D Printer Filament 1KG', material: 'HIPS', color: 'Natural', colorHex: '#F5F5DC', productUrl: 'https://store.sunlu.com/products/sunlu-hips-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/HIPS_Natural.jpg', productLineId: 'sunlu__hips__standard', finishType: 'Standard', weight: 1000 },
  
  // ===== PLA GLOW =====
  { name: 'Glow in Dark PLA 3D Printer Filament 1KG', material: 'PLA Glow', color: 'Glow Green', colorHex: '#39FF14', productUrl: 'https://store.sunlu.com/products/sunlu-glow-in-dark-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Glow_PLA_Green.jpg', productLineId: 'sunlu__pla-glow__standard', finishType: 'Glow', weight: 1000 },
  { name: 'Glow in Dark PLA 3D Printer Filament 1KG', material: 'PLA Glow', color: 'Glow Blue', colorHex: '#00BFFF', productUrl: 'https://store.sunlu.com/products/sunlu-glow-in-dark-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Glow_PLA_Blue.jpg', productLineId: 'sunlu__pla-glow__standard', finishType: 'Glow', weight: 1000 },
  { name: 'Glow in Dark PLA 3D Printer Filament 1KG', material: 'PLA Glow', color: 'Glow Yellow', colorHex: '#FFFF00', productUrl: 'https://store.sunlu.com/products/sunlu-glow-in-dark-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Glow_PLA_Yellow.jpg', productLineId: 'sunlu__pla-glow__standard', finishType: 'Glow', weight: 1000 },
  { name: 'Glow in Dark PLA 3D Printer Filament 1KG', material: 'PLA Glow', color: 'Glow Orange', colorHex: '#FF4500', productUrl: 'https://store.sunlu.com/products/sunlu-glow-in-dark-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Glow_PLA_Orange.jpg', productLineId: 'sunlu__pla-glow__standard', finishType: 'Glow', weight: 1000 },
  { name: 'Glow in Dark PLA 3D Printer Filament 1KG', material: 'PLA Glow', color: 'Glow White', colorHex: '#F0F0F0', productUrl: 'https://store.sunlu.com/products/sunlu-glow-in-dark-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Glow_PLA_White.jpg', productLineId: 'sunlu__pla-glow__standard', finishType: 'Glow', weight: 1000 },
  
  // ===== PLA WOOD =====
  { name: 'Wood PLA 3D Printer Filament 1KG', material: 'PLA Wood', color: 'Wood', colorHex: '#DEB887', productUrl: 'https://store.sunlu.com/products/sunlu-wood-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Wood_PLA_Natural.jpg', productLineId: 'sunlu__pla-wood__standard', finishType: 'Wood', weight: 1000 },
  { name: 'Wood PLA 3D Printer Filament 1KG', material: 'PLA Wood', color: 'Walnut', colorHex: '#5D432C', productUrl: 'https://store.sunlu.com/products/sunlu-wood-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Wood_PLA_Walnut.jpg', productLineId: 'sunlu__pla-wood__standard', finishType: 'Wood', weight: 1000 },
  { name: 'Wood PLA 3D Printer Filament 1KG', material: 'PLA Wood', color: 'Oak', colorHex: '#C4A35A', productUrl: 'https://store.sunlu.com/products/sunlu-wood-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Wood_PLA_Oak.jpg', productLineId: 'sunlu__pla-wood__standard', finishType: 'Wood', weight: 1000 },
  
  // ===== PLA MARBLE =====
  { name: 'Marble PLA 3D Printer Filament 1KG', material: 'PLA Marble', color: 'Marble White', colorHex: '#F0F0F0', productUrl: 'https://store.sunlu.com/products/sunlu-marble-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Marble_PLA_White.jpg', productLineId: 'sunlu__pla-marble__standard', finishType: 'Marble', weight: 1000 },
  { name: 'Marble PLA 3D Printer Filament 1KG', material: 'PLA Marble', color: 'Marble Black', colorHex: '#3A3A3A', productUrl: 'https://store.sunlu.com/products/sunlu-marble-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Marble_PLA_Black.jpg', productLineId: 'sunlu__pla-marble__standard', finishType: 'Marble', weight: 1000 },
  { name: 'Marble PLA 3D Printer Filament 1KG', material: 'PLA Marble', color: 'Marble Grey', colorHex: '#909090', productUrl: 'https://store.sunlu.com/products/sunlu-marble-pla-3d-printer-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0152/6507/1190/files/Marble_PLA_Grey.jpg', productLineId: 'sunlu__pla-marble__standard', finishType: 'Marble', weight: 1000 },
];

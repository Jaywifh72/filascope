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
  imageUrl: string;       // Color-specific image URL
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
  
  // ===== GLOW COLORS =====
  'glow green': '39FF14',
  'glow blue': '00BFFF',
  'glow yellow': 'FFFF00',
  'glow orange': 'FF4500',
  'glow pink': 'FF69B4',
  'glow white': 'F0F0F0',
  
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
};

// ============================================================================
// PRODUCT LINE DEFINITIONS (38 expected lines)
// ============================================================================

export const SUNLU_EXPECTED_PRODUCT_LINES: Record<string, number> = {
  // PLA Series
  'sunlu__pla__standard': 25,
  'sunlu__pla-plus__standard': 25,
  'sunlu__pla-plus-2__high-speed': 12,
  'sunlu__pla-meta__standard': 12,
  'sunlu__pla-matte__standard': 15,
  'sunlu__pla-silk__standard': 20,
  'sunlu__pla-silk-dual__standard': 10,
  'sunlu__pla-marble__standard': 6,
  'sunlu__pla-wood__standard': 4,
  'sunlu__pla-glow__standard': 6,
  'sunlu__pla-rainbow__standard': 4,
  'sunlu__pla-anti-string__standard': 8,
  'sunlu__pla-refill__standard': 15,
  
  // Matte Dual-Color PLA
  'sunlu__pla-matte-dual__standard': 7,
  
  // PETG Series
  'sunlu__petg__standard': 20,
  'sunlu__petg-matte__standard': 10,
  'sunlu__petg-cf__standard': 1,
  'sunlu__petg-matte-high-speed__standard': 8,
  
  // ABS Series
  'sunlu__abs__standard': 10,
  'sunlu__abs-easy__standard': 8,
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
  'sunlu__pvb__standard': 2,
  'sunlu__hips__standard': 4,
};

export const SUNLU_EXPECTED_CARD_COUNT = Object.keys(SUNLU_EXPECTED_PRODUCT_LINES).length;

// ============================================================================
// EXCLUSION PATTERNS (non-filament products, bulk, accessories)
// ============================================================================

export const SUNLU_EXCLUDED_PATTERNS: RegExp[] = [
  // Non-filament products
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
  
  // Bulk/MOQ products
  /10kg/i,
  /\[moq[:\s]*\d+\]/i,
  /moq\s*\d+/i,
  /bundle/i,
  /\d+\s*rolls/i,
  /\*\d+\s*rolls/i,
  
  // Sample sizes (exclude <300g)
  /250g/i,
  /0\.25kg/i,
  /sample/i,
  
  // Diameter exclusions
  /2\.85mm/i,
  /3mm\s*filament/i,
  /3\.0mm/i,
  
  // Misc exclusions
  /gift\s*card/i,
  /empty\s*spool/i,
  /spool\s*holder/i,
  /starter\s*kit/i,
  /variety\s*pack/i,
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
  if (/\bmatte[\-\s]?pla[\-\s]?dual[\-\s]?color\b/i.test(lower)) return 'PLA Matte Dual-Color';
  if (/\bpla[\-\s]?meta\b|\bmeta[\-\s]?pla\b/i.test(lower)) return 'PLA Meta';
  if (/\bapla\b|\bantistring\b|\banti[\-\s]?string\b/i.test(lower)) return 'PLA AntiString';
  if (/\bsilk[\-\s]?pla\b|\bpla[\-\s]?silk\b|\bsilk\s+filament/i.test(lower)) return 'PLA Silk';
  if (/\bmatte[\-\s]?pla\b|\bpla[\-\s]?matte\b/i.test(lower)) return 'PLA Matte';
  if (/\bmarble[\-\s]?pla\b|\bpla[\-\s]?marble\b/i.test(lower)) return 'PLA Marble';
  if (/\bglow\b|\bluminous\b|\bglow[\-\s]?in[\-\s]?dark\b|\bgid\b/i.test(lower)) return 'PLA Glow';
  if (/\bwood[\-\s]?pla\b|\bpla[\-\s]?wood\b|\bwooden\b/i.test(lower)) return 'PLA Wood';
  if (/\brainbow\b|\bmulticolor\b/i.test(lower)) return 'PLA Rainbow';
  if (/\brefill\b/i.test(lower)) return 'PLA Refill';
  if (/\bpla\b/i.test(lower)) return 'PLA';
  
  return 'Unknown';
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

/**
 * IC3D Brand-Specific Defaults
 * 
 * Premium USA-based manufacturer (Ohio) known for:
 * - Tight tolerances (±0.03mm)
 * - Open Source Hardware certification
 * - Sustainability initiatives (spool return program, recycled materials)
 * - Industrial-grade materials (PolyHex high-temp copolyester)
 * 
 * Platform: WooCommerce
 * Pricing: USD
 */

// TDS URL patterns - IC3D publishes documentation on their WordPress uploads
export const IC3D_TDS_PATTERNS: Record<string, string> = {
  'pla': 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2020/08/PLA-IC3D-TDS-2020.07.pdf',
  'im-pla': 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2020/08/PLA-IC3D-TDS-2020.07.pdf',
  'matte-im-pla': 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2020/08/PLA-IC3D-TDS-2020.07.pdf',
  'petg': 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2020/08/PETG-IC3D-TDS-2020.07.pdf',
  'r-petg': 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2021/04/RPETG_IC3D_SDS_2021.04.pdf',
  'matte-r-petg': 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2021/04/RPETG_IC3D_SDS_2021.04.pdf',
  'uv-petg': 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2020/08/PETG-IC3D-TDS-2020.07.pdf',
  'cf-petg': 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2020/08/PETG-IC3D-TDS-2020.07.pdf',
  'polyhex': 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2023/07/PolyHex-Quick-Facts.pdf',
  'abs': 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2020/08/ABS-IC3D-TDS-2020.07.pdf',
};

export function matchIC3DTds(title: string, material?: string): { url: string; pattern: string } | null {
  const titleLower = title.toLowerCase();
  
  // Check specific patterns first
  if (titleLower.includes('polyhex')) {
    return { url: IC3D_TDS_PATTERNS['polyhex'], pattern: 'polyhex' };
  }
  if (titleLower.includes('matte') && (titleLower.includes('r-petg') || titleLower.includes('recycled petg'))) {
    return { url: IC3D_TDS_PATTERNS['matte-r-petg'], pattern: 'matte-r-petg' };
  }
  if (titleLower.includes('r-petg') || titleLower.includes('recycled petg')) {
    return { url: IC3D_TDS_PATTERNS['r-petg'], pattern: 'r-petg' };
  }
  if (titleLower.includes('uv-petg') || titleLower.includes('uv petg')) {
    return { url: IC3D_TDS_PATTERNS['uv-petg'], pattern: 'uv-petg' };
  }
  if (titleLower.includes('cf-petg') || titleLower.includes('carbon fiber petg')) {
    return { url: IC3D_TDS_PATTERNS['cf-petg'], pattern: 'cf-petg' };
  }
  if (titleLower.includes('petg')) {
    return { url: IC3D_TDS_PATTERNS['petg'], pattern: 'petg' };
  }
  if (titleLower.includes('matte') && (titleLower.includes('im-pla') || titleLower.includes('impact'))) {
    return { url: IC3D_TDS_PATTERNS['matte-im-pla'], pattern: 'matte-im-pla' };
  }
  if (titleLower.includes('im-pla') || titleLower.includes('impact modified') || titleLower.includes('impact-modified')) {
    return { url: IC3D_TDS_PATTERNS['im-pla'], pattern: 'im-pla' };
  }
  if (titleLower.includes('pla')) {
    return { url: IC3D_TDS_PATTERNS['pla'], pattern: 'pla' };
  }
  if (titleLower.includes('abs')) {
    return { url: IC3D_TDS_PATTERNS['abs'], pattern: 'abs' };
  }
  
  return null;
}

// Print settings by material type
interface PrintSettings {
  nozzle_temp_min_c: number;
  nozzle_temp_max_c: number;
  bed_temp_min_c: number;
  bed_temp_max_c: number;
  print_speed_max_mms?: number;
  enclosure_required?: boolean;
}

export const IC3D_PRINT_SETTINGS: Record<string, PrintSettings> = {
  'PLA': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 240,
    bed_temp_min_c: 50,
    bed_temp_max_c: 70,
  },
  'IM-PLA': {
    nozzle_temp_min_c: 220,
    nozzle_temp_max_c: 240,
    bed_temp_min_c: 60,
    bed_temp_max_c: 70,
  },
  'MATTE-IM-PLA': {
    nozzle_temp_min_c: 220,
    nozzle_temp_max_c: 240,
    bed_temp_min_c: 60,
    bed_temp_max_c: 70,
  },
  'PETG': {
    nozzle_temp_min_c: 220,
    nozzle_temp_max_c: 260,
    bed_temp_min_c: 70,
    bed_temp_max_c: 90,
  },
  'R-PETG': {
    nozzle_temp_min_c: 210,
    nozzle_temp_max_c: 250,
    bed_temp_min_c: 60,
    bed_temp_max_c: 80,
  },
  'MATTE-R-PETG': {
    nozzle_temp_min_c: 210,
    nozzle_temp_max_c: 250,
    bed_temp_min_c: 60,
    bed_temp_max_c: 80,
  },
  'UV-PETG': {
    nozzle_temp_min_c: 220,
    nozzle_temp_max_c: 260,
    bed_temp_min_c: 70,
    bed_temp_max_c: 90,
  },
  'CF-PETG': {
    nozzle_temp_min_c: 260,
    nozzle_temp_max_c: 275,
    bed_temp_min_c: 80,
    bed_temp_max_c: 100,
    enclosure_required: true,
  },
  'POLYHEX': {
    nozzle_temp_min_c: 270,
    nozzle_temp_max_c: 290,
    bed_temp_min_c: 110,
    bed_temp_max_c: 120,
    enclosure_required: true,
  },
  'ABS': {
    nozzle_temp_min_c: 220,
    nozzle_temp_max_c: 260,
    bed_temp_min_c: 100,
    bed_temp_max_c: 110,
    enclosure_required: true,
  },
};

export function getIC3DPrintSettings(material: string | null, title?: string): PrintSettings | null {
  if (!material && !title) return null;
  
  const titleLower = (title || '').toLowerCase();
  
  // Check specific variants first
  if (titleLower.includes('polyhex')) {
    return IC3D_PRINT_SETTINGS['POLYHEX'];
  }
  if (titleLower.includes('matte') && (titleLower.includes('r-petg') || titleLower.includes('recycled'))) {
    return IC3D_PRINT_SETTINGS['MATTE-R-PETG'];
  }
  if (titleLower.includes('r-petg') || titleLower.includes('recycled petg')) {
    return IC3D_PRINT_SETTINGS['R-PETG'];
  }
  if (titleLower.includes('uv-petg') || titleLower.includes('uv petg')) {
    return IC3D_PRINT_SETTINGS['UV-PETG'];
  }
  if (titleLower.includes('cf-petg') || titleLower.includes('carbon fiber')) {
    return IC3D_PRINT_SETTINGS['CF-PETG'];
  }
  if (titleLower.includes('matte') && (titleLower.includes('im-pla') || titleLower.includes('impact'))) {
    return IC3D_PRINT_SETTINGS['MATTE-IM-PLA'];
  }
  if (titleLower.includes('im-pla') || titleLower.includes('impact modified') || titleLower.includes('impact-modified')) {
    return IC3D_PRINT_SETTINGS['IM-PLA'];
  }
  
  // Fall back to base material
  const materialUpper = (material || '').toUpperCase();
  if (IC3D_PRINT_SETTINGS[materialUpper]) {
    return IC3D_PRINT_SETTINGS[materialUpper];
  }
  
  // Generic fallbacks
  if (materialUpper.includes('PETG')) return IC3D_PRINT_SETTINGS['PETG'];
  if (materialUpper.includes('PLA')) return IC3D_PRINT_SETTINGS['PLA'];
  if (materialUpper.includes('ABS')) return IC3D_PRINT_SETTINGS['ABS'];
  
  return null;
}

// Finish type extraction
type FinishType = 'Matte' | 'Transparent' | 'Standard';

export function extractIC3DFinishType(title: string, color?: string): FinishType {
  const titleLower = title.toLowerCase();
  const colorLower = (color || '').toLowerCase();
  
  // Matte products
  if (titleLower.includes('matte')) {
    return 'Matte';
  }
  
  // Translucent/transparent colors
  if (colorLower.includes('translucent') || colorLower.includes('transparent') || colorLower.includes('clear')) {
    return 'Transparent';
  }
  
  // CF-PETG is matte finish
  if (titleLower.includes('cf-petg') || titleLower.includes('carbon fiber')) {
    return 'Matte';
  }
  
  return 'Standard';
}

// Material normalization
interface MaterialInfo {
  material: string;
  isRecycled: boolean;
  isUVResistant: boolean;
  isNozzleAbrasive: boolean;
  enclosureRequired: boolean;
  highTempCapable: boolean;
}

export function normalizeIC3DMaterial(title: string, scrapedMaterial?: string): MaterialInfo {
  const titleLower = title.toLowerCase();
  
  // PolyHex (high-temp copolyester)
  if (titleLower.includes('polyhex')) {
    return {
      material: 'Copolyester',
      isRecycled: false,
      isUVResistant: false,
      isNozzleAbrasive: false,
      enclosureRequired: true,
      highTempCapable: true,
    };
  }
  
  // Carbon Fiber PETG
  if (titleLower.includes('cf-petg') || titleLower.includes('carbon fiber petg')) {
    return {
      material: 'PETG-CF',
      isRecycled: false,
      isUVResistant: false,
      isNozzleAbrasive: true,
      enclosureRequired: true,
      highTempCapable: false,
    };
  }
  
  // UV-PETG
  if (titleLower.includes('uv-petg') || titleLower.includes('uv petg')) {
    return {
      material: 'PETG',
      isRecycled: false,
      isUVResistant: true,
      isNozzleAbrasive: false,
      enclosureRequired: false,
      highTempCapable: false,
    };
  }
  
  // Recycled PETG (Matte or Standard)
  if (titleLower.includes('r-petg') || titleLower.includes('recycled petg')) {
    return {
      material: 'rPETG',
      isRecycled: true,
      isUVResistant: false,
      isNozzleAbrasive: false,
      enclosureRequired: false,
      highTempCapable: false,
    };
  }
  
  // Standard PETG
  if (titleLower.includes('petg')) {
    return {
      material: 'PETG',
      isRecycled: false,
      isUVResistant: false,
      isNozzleAbrasive: false,
      enclosureRequired: false,
      highTempCapable: false,
    };
  }
  
  // Impact Modified PLA (Matte or Standard)
  if (titleLower.includes('im-pla') || titleLower.includes('impact modified') || titleLower.includes('impact-modified')) {
    return {
      material: 'PLA+',
      isRecycled: false,
      isUVResistant: false,
      isNozzleAbrasive: false,
      enclosureRequired: false,
      highTempCapable: false,
    };
  }
  
  // Standard PLA
  if (titleLower.includes('pla')) {
    return {
      material: 'PLA',
      isRecycled: false,
      isUVResistant: false,
      isNozzleAbrasive: false,
      enclosureRequired: false,
      highTempCapable: false,
    };
  }
  
  // ABS
  if (titleLower.includes('abs')) {
    return {
      material: 'ABS',
      isRecycled: false,
      isUVResistant: false,
      isNozzleAbrasive: false,
      enclosureRequired: true,
      highTempCapable: false,
    };
  }
  
  // Default
  return {
    material: scrapedMaterial || 'PLA',
    isRecycled: false,
    isUVResistant: false,
    isNozzleAbrasive: false,
    enclosureRequired: false,
    highTempCapable: false,
  };
}

// Product line ID generation
export function generateIC3DProductLineId(title: string, material?: string | null): string {
  const titleLower = title.toLowerCase();
  
  // PolyHex
  if (titleLower.includes('polyhex')) {
    return 'ic3d__copolyester__polyhex';
  }
  
  // CF-PETG
  if (titleLower.includes('cf-petg') || titleLower.includes('carbon fiber petg')) {
    return 'ic3d__petg-cf__standard';
  }
  
  // UV-PETG
  if (titleLower.includes('uv-petg') || titleLower.includes('uv petg')) {
    return 'ic3d__petg__uv';
  }
  
  // Matte R-PETG
  if (titleLower.includes('matte') && (titleLower.includes('r-petg') || titleLower.includes('recycled petg'))) {
    return 'ic3d__petg__matte-recycled';
  }
  
  // R-PETG
  if (titleLower.includes('r-petg') || titleLower.includes('recycled petg')) {
    return 'ic3d__petg__recycled';
  }
  
  // Standard PETG
  if (titleLower.includes('petg')) {
    return 'ic3d__petg__standard';
  }
  
  // Matte IM-PLA
  if (titleLower.includes('matte') && (titleLower.includes('im-pla') || titleLower.includes('impact'))) {
    return 'ic3d__pla__matte-impact-modified';
  }
  
  // IM-PLA
  if (titleLower.includes('im-pla') || titleLower.includes('impact modified') || titleLower.includes('impact-modified')) {
    return 'ic3d__pla__impact-modified';
  }
  
  // Standard PLA
  if (titleLower.includes('pla')) {
    return 'ic3d__pla__standard';
  }
  
  // ABS
  if (titleLower.includes('abs')) {
    return 'ic3d__abs__standard';
  }
  
  // Fallback
  const baseMaterial = (material || 'pla').toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `ic3d__${baseMaterial}__standard`;
}

// Color to hex mapping - IC3D has distinctive color names
export const IC3D_COLOR_MAPPING: Record<string, string> = {
  // Standard colors
  'black': '#1A1A1A',
  'white': '#FFFFFF',
  'natural': '#F5F5DC',
  'blue': '#0066CC',
  'red': '#CC0000',
  'orange': '#FF6600',
  'yellow': '#FFCC00',
  'grey': '#808080',
  'gray': '#808080',
  'green': '#00AA00',
  'bright green': '#00FF00',
  
  // Translucent flavors
  'translucent blue razz': '#4169E1',
  'translucent cherry': '#DC143C',
  'translucent grape': '#8B008B',
  'translucent honey': '#FFD700',
  'translucent watermelon': '#FF6B6B',
  'translucent tangerine': '#FF9966',
  'translucent lime': '#32CD32',
  'natural (clear)': '#E8E8E8',
  'clear': '#E8E8E8',
  
  // Matte colors
  'moss green': '#8A9A5B',
  'olive green': '#808000',
  'white (matte)': '#F5F5F5',
  'black (matte)': '#2A2A2A',
  'grey (matte)': '#6B6B6B',
  'tan': '#D2B48C',
  'brown': '#8B4513',
  'navy': '#000080',
  'burgundy': '#800020',
  'forest green': '#228B22',
  
  // Specialty
  'sterling': '#C0C0C0',
  'silver': '#C0C0C0',
  'gold': '#FFD700',
  'copper': '#B87333',
  'bronze': '#CD7F32',
};

export function getIC3DColorHex(colorName: string): string | null {
  const colorLower = colorName.toLowerCase().trim();
  
  // Direct match
  if (IC3D_COLOR_MAPPING[colorLower]) {
    return IC3D_COLOR_MAPPING[colorLower];
  }
  
  // Partial matches
  for (const [key, hex] of Object.entries(IC3D_COLOR_MAPPING)) {
    if (colorLower.includes(key) || key.includes(colorLower)) {
      return hex;
    }
  }
  
  // Common color word extraction
  const colorWords = [
    { word: 'black', hex: '#1A1A1A' },
    { word: 'white', hex: '#FFFFFF' },
    { word: 'red', hex: '#CC0000' },
    { word: 'blue', hex: '#0066CC' },
    { word: 'green', hex: '#00AA00' },
    { word: 'yellow', hex: '#FFCC00' },
    { word: 'orange', hex: '#FF6600' },
    { word: 'grey', hex: '#808080' },
    { word: 'gray', hex: '#808080' },
    { word: 'natural', hex: '#F5F5DC' },
    { word: 'clear', hex: '#E8E8E8' },
    { word: 'translucent', hex: '#E8E8E8' },
  ];
  
  for (const { word, hex } of colorWords) {
    if (colorLower.includes(word)) {
      return hex;
    }
  }
  
  return null;
}

// Title cleaning
export function cleanIC3DTitle(title: string): string {
  return title
    .replace(/3D\s*Printer\s*Filament/gi, '')
    .replace(/IC3D\s*/gi, '')
    .replace(/Filaments?/gi, '')
    .replace(/1\.75\s*mm/gi, '')
    .replace(/2\.85\s*mm/gi, '')
    .replace(/3\s*mm/gi, '')
    .replace(/1\s*kg/gi, '')
    .replace(/2\.5\s*kg/gi, '')
    .replace(/10\s*kg/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract color from title or variant
export function extractColorFromTitle(title: string): string | null {
  // Common IC3D color patterns
  const colorPatterns = [
    /translucent\s+\w+(?:\s+\w+)?/i,
    /matte\s+\w+/i,
    /\b(black|white|red|blue|green|yellow|orange|grey|gray|natural|clear|sterling)\b/i,
  ];
  
  for (const pattern of colorPatterns) {
    const match = title.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  
  return null;
}

// Main enrichment function
export interface IC3DEnrichmentResult {
  cleanedTitle: string;
  material: string;
  finishType: FinishType;
  productLineId: string;
  colorHex: string | null;
  tdsUrl: string | null;
  printSettings: PrintSettings | null;
  isRecycled: boolean;
  isUVResistant: boolean;
  isNozzleAbrasive: boolean;
  enclosureRequired: boolean;
  highTempCapable: boolean;
  madeInCountry: string;
}

export function enrichIC3DProduct(
  title: string,
  scrapedMaterial?: string,
  scrapedColor?: string,
  existingHex?: string
): IC3DEnrichmentResult {
  const cleanedTitle = cleanIC3DTitle(title);
  const materialInfo = normalizeIC3DMaterial(title, scrapedMaterial);
  const finishType = extractIC3DFinishType(title, scrapedColor);
  const productLineId = generateIC3DProductLineId(title, materialInfo.material);
  const tdsMatch = matchIC3DTds(title, materialInfo.material);
  const printSettings = getIC3DPrintSettings(materialInfo.material, title);
  
  // Get color hex
  let colorHex = existingHex || null;
  if (!colorHex && scrapedColor) {
    colorHex = getIC3DColorHex(scrapedColor);
  }
  if (!colorHex) {
    const extractedColor = extractColorFromTitle(title);
    if (extractedColor) {
      colorHex = getIC3DColorHex(extractedColor);
    }
  }
  
  return {
    cleanedTitle,
    material: materialInfo.material,
    finishType,
    productLineId,
    colorHex,
    tdsUrl: tdsMatch?.url || null,
    printSettings,
    isRecycled: materialInfo.isRecycled,
    isUVResistant: materialInfo.isUVResistant,
    isNozzleAbrasive: materialInfo.isNozzleAbrasive,
    enclosureRequired: materialInfo.enclosureRequired || (printSettings?.enclosure_required ?? false),
    highTempCapable: materialInfo.highTempCapable,
    madeInCountry: 'USA',
  };
}

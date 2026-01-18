/**
 * Overture Brand Defaults
 * 
 * Major Chinese manufacturer with extensive consumer-focused catalog.
 * Platform: Shopify (JSON API available)
 * Store: https://overture3d.com
 * 
 * Product Lines:
 * - Standard PLA, Professional PLA, Super PLA+, Easy PLA
 * - Air PLA (foaming/lightweight)
 * - Matte PLA, Silk PLA, Sparkle PLA, Glow PLA
 * - Standard PETG, Rock PETG (tough)
 * - Standard TPU, High Speed TPU
 * - ABS, ASA, PC Professional, Easy Nylon
 * - Carbon Fiber PLA
 */

// ============================================================
// TDS URL Patterns - Curated from official Overture documentation
// ============================================================
export const OVERTURE_TDS_PATTERNS: Record<string, string> = {
  // Core Materials
  'pla': 'https://overture3d.com/cdn/shop/files/OVERTURE_PLA_TDS_EN_V5.1_a4102671-a3b0-416f-9191-7e6feb681e3e.pdf?v=3056189678228575855',
  'petg': 'https://overture3d.com/cdn/shop/files/OVERTURE_PETG_TDS_EN_V5.2_2.pdf?v=9802109789192864041',
  'abs': 'https://overture3d.com/cdn/shop/files/OVERTURE_ABS_TDS_EN_V5.1_9d827267-f215-4734-9c0b-c04232b8df92.pdf?v=14112127381514289602',
  'asa': 'https://overture3d.com/cdn/shop/files/OVERTURE_ASA_TDS_EN_V5.1_60023de4-0977-4f96-9c55-0d94bacc7d0f.pdf?v=13809907352339313230',
  'tpu': 'https://overture3d.com/cdn/shop/files/OVERTURE_TPU_TDS_EN_V5.1_195e4c18-e1da-47fc-964f-a651a96edc78.pdf?v=3016081695131481537',
  
  // PLA Variants
  'matte-pla': 'https://overture3d.com/cdn/shop/files/OVERTURE_MATTE_PLA_TDS_EN_V5.1_0ae7a33c-dd34-49b9-a202-c6ba0fddfdcb.pdf?v=8219732571127076035',
  'pla-matte': 'https://overture3d.com/cdn/shop/files/OVERTURE_MATTE_PLA_TDS_EN_V5.1_0ae7a33c-dd34-49b9-a202-c6ba0fddfdcb.pdf?v=8219732571127076035',
  'pla-pro': 'https://overture3d.com/cdn/shop/files/OVERTURE_PLA_PROFESSIONAL_TDS_EN_V5.1_b6097b34-61cd-4f4c-9f6e-260f44e22ebe.pdf?v=1470696260597554615',
  'pla-professional': 'https://overture3d.com/cdn/shop/files/OVERTURE_PLA_PROFESSIONAL_TDS_EN_V5.1_b6097b34-61cd-4f4c-9f6e-260f44e22ebe.pdf?v=1470696260597554615',
  'silk-pla': 'https://overture3d.com/cdn/shop/files/OVERTURE_SILK_PLA_TDS_EN_V5.1_09e26446-13ed-49b4-a85f-b8a460d8b16e.pdf?v=4835263043845209884',
  'pla-silk': 'https://overture3d.com/cdn/shop/files/OVERTURE_SILK_PLA_TDS_EN_V5.1_09e26446-13ed-49b4-a85f-b8a460d8b16e.pdf?v=4835263043845209884',
  'easy-pla': 'https://overture3d.com/cdn/shop/files/OVERTURE__EASY_PLA_TDS_EN_V5.1_f2df1ff7-e3da-4ae4-8c69-7e90319c05c1.pdf?v=12114623221063733916',
  'pla-easy': 'https://overture3d.com/cdn/shop/files/OVERTURE__EASY_PLA_TDS_EN_V5.1_f2df1ff7-e3da-4ae4-8c69-7e90319c05c1.pdf?v=12114623221063733916',
  'super-pla': 'https://overture3d.com/cdn/shop/files/OVERTURE_SUPER_PLA__TDS_EN_V5.1_fff22cb0-35bb-4889-9e0a-f8bbb914a865.pdf?v=13928545924607624736',
  'pla-super': 'https://overture3d.com/cdn/shop/files/OVERTURE_SUPER_PLA__TDS_EN_V5.1_fff22cb0-35bb-4889-9e0a-f8bbb914a865.pdf?v=13928545924607624736',
  'glow-pla': 'https://overture3d.com/cdn/shop/files/OVERTURE__EASY_PLA_TDS_EN_V5.1.pdf?v=11676870451522155229',
  'pla-glow': 'https://overture3d.com/cdn/shop/files/OVERTURE__EASY_PLA_TDS_EN_V5.1.pdf?v=11676870451522155229',
  
  // Other Materials
  'high-speed-tpu': 'https://overture3d.com/cdn/shop/files/OVERTURE__HIGH_SPEED_TPU_TDS_EN_V5.1_112e83e3-da49-495b-bd52-96b491f2fc64.pdf?v=708369137709490471',
  'tpu-hs': 'https://overture3d.com/cdn/shop/files/OVERTURE__HIGH_SPEED_TPU_TDS_EN_V5.1_112e83e3-da49-495b-bd52-96b491f2fc64.pdf?v=708369137709490471',
  'hs-tpu': 'https://overture3d.com/cdn/shop/files/OVERTURE__HIGH_SPEED_TPU_TDS_EN_V5.1_112e83e3-da49-495b-bd52-96b491f2fc64.pdf?v=708369137709490471',
  'easy-nylon': 'https://overture3d.com/cdn/shop/files/OVERTURE_EASY_NYLON_TDS_EN_V5.1_b6ce0042-6686-42dd-a5ab-696d2cc734b8.pdf?v=11212874094828829355',
  'nylon': 'https://overture3d.com/cdn/shop/files/OVERTURE_EASY_NYLON_TDS_EN_V5.1_b6ce0042-6686-42dd-a5ab-696d2cc734b8.pdf?v=11212874094828829355',
  'pa': 'https://overture3d.com/cdn/shop/files/OVERTURE_EASY_NYLON_TDS_EN_V5.1_b6ce0042-6686-42dd-a5ab-696d2cc734b8.pdf?v=11212874094828829355',
  'pc-pro': 'https://overture3d.com/cdn/shop/files/OVERTURE_PC_PROFESSIONAL_TDS_EN_V5.1_b609023a-6c21-4c78-b6f7-5c84407e4938.pdf?v=78315135494492787',
  'pc-professional': 'https://overture3d.com/cdn/shop/files/OVERTURE_PC_PROFESSIONAL_TDS_EN_V5.1_b609023a-6c21-4c78-b6f7-5c84407e4938.pdf?v=78315135494492787',
  'pc': 'https://overture3d.com/cdn/shop/files/OVERTURE_PC_PROFESSIONAL_TDS_EN_V5.1_b609023a-6c21-4c78-b6f7-5c84407e4938.pdf?v=78315135494492787',
};

/**
 * Match TDS URL for an Overture product
 */
export function matchOvertureTds(productLineId: string | null, material: string | null): string | null {
  if (!productLineId && !material) return null;
  
  // Try product line ID first
  if (productLineId) {
    const lineKey = productLineId.replace('overture__', '').replace(/__/g, '-');
    if (OVERTURE_TDS_PATTERNS[lineKey]) {
      return OVERTURE_TDS_PATTERNS[lineKey];
    }
    
    // Try parts of the line ID
    const parts = lineKey.split('-');
    for (const part of parts) {
      if (OVERTURE_TDS_PATTERNS[part]) {
        return OVERTURE_TDS_PATTERNS[part];
      }
    }
  }
  
  // Try material
  if (material) {
    const materialKey = material.toLowerCase().replace(/[\s_]+/g, '-');
    if (OVERTURE_TDS_PATTERNS[materialKey]) {
      return OVERTURE_TDS_PATTERNS[materialKey];
    }
    
    // Try base material
    const baseMaterial = material.toLowerCase().split('-')[0];
    if (OVERTURE_TDS_PATTERNS[baseMaterial]) {
      return OVERTURE_TDS_PATTERNS[baseMaterial];
    }
  }
  
  return null;
}

export interface OvertureProductLine {
  id: string;
  material: string;
  lineName: string;
  finishType: string;
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  enclosureRequired: boolean;
  isNozzleAbrasive: boolean;
  isTough?: boolean;
  isFoaming?: boolean;
  highSpeedCapable?: boolean;
}

// Product line definitions
export const OVERTURE_PRODUCT_LINES: Record<string, OvertureProductLine> = {
  'overture__pla__standard': {
    id: 'overture__pla__standard',
    material: 'PLA',
    lineName: 'Standard',
    finishType: 'Standard',
    nozzleTempMin: 190,
    nozzleTempMax: 220,
    bedTempMin: 50,
    bedTempMax: 60,
    enclosureRequired: false,
    isNozzleAbrasive: false,
  },
  'overture__pla__professional': {
    id: 'overture__pla__professional',
    material: 'PLA',
    lineName: 'Professional',
    finishType: 'Standard',
    nozzleTempMin: 200,
    nozzleTempMax: 230,
    bedTempMin: 50,
    bedTempMax: 60,
    enclosureRequired: false,
    isNozzleAbrasive: false,
  },
  'overture__pla__super-plus': {
    id: 'overture__pla__super-plus',
    material: 'PLA',
    lineName: 'Super PLA+',
    finishType: 'Standard',
    nozzleTempMin: 200,
    nozzleTempMax: 230,
    bedTempMin: 50,
    bedTempMax: 60,
    enclosureRequired: false,
    isNozzleAbrasive: false,
    isTough: true,
  },
  'overture__pla__easy': {
    id: 'overture__pla__easy',
    material: 'PLA',
    lineName: 'Easy',
    finishType: 'Standard',
    nozzleTempMin: 190,
    nozzleTempMax: 220,
    bedTempMin: 50,
    bedTempMax: 60,
    enclosureRequired: false,
    isNozzleAbrasive: false,
  },
  'overture__pla__easy-6': {
    id: 'overture__pla__easy-6',
    material: 'PLA',
    lineName: 'Easy 6-Pack',
    finishType: 'Standard',
    nozzleTempMin: 190,
    nozzleTempMax: 220,
    bedTempMin: 50,
    bedTempMax: 60,
    enclosureRequired: false,
    isNozzleAbrasive: false,
  },
  'overture__pla__air': {
    id: 'overture__pla__air',
    material: 'PLA',
    lineName: 'Air',
    finishType: 'Standard',
    nozzleTempMin: 190,
    nozzleTempMax: 240,
    bedTempMin: 50,
    bedTempMax: 60,
    enclosureRequired: false,
    isNozzleAbrasive: false,
    isFoaming: true,
  },
  'overture__pla__matte': {
    id: 'overture__pla__matte',
    material: 'PLA',
    lineName: 'Matte',
    finishType: 'Matte',
    nozzleTempMin: 190,
    nozzleTempMax: 220,
    bedTempMin: 50,
    bedTempMax: 60,
    enclosureRequired: false,
    isNozzleAbrasive: false,
  },
  'overture__pla__silk': {
    id: 'overture__pla__silk',
    material: 'PLA',
    lineName: 'Silk',
    finishType: 'Silk',
    nozzleTempMin: 200,
    nozzleTempMax: 230,
    bedTempMin: 50,
    bedTempMax: 60,
    enclosureRequired: false,
    isNozzleAbrasive: false,
  },
  'overture__pla__sparkle': {
    id: 'overture__pla__sparkle',
    material: 'PLA',
    lineName: 'Sparkle',
    finishType: 'Sparkle',
    nozzleTempMin: 200,
    nozzleTempMax: 220,
    bedTempMin: 50,
    bedTempMax: 60,
    enclosureRequired: false,
    isNozzleAbrasive: false,
  },
  'overture__pla__glow': {
    id: 'overture__pla__glow',
    material: 'PLA',
    lineName: 'Glow',
    finishType: 'Glow',
    nozzleTempMin: 200,
    nozzleTempMax: 220,
    bedTempMin: 50,
    bedTempMax: 60,
    enclosureRequired: false,
    isNozzleAbrasive: false,
  },
  'overture__petg__standard': {
    id: 'overture__petg__standard',
    material: 'PETG',
    lineName: 'Standard',
    finishType: 'Standard',
    nozzleTempMin: 230,
    nozzleTempMax: 250,
    bedTempMin: 70,
    bedTempMax: 80,
    enclosureRequired: false,
    isNozzleAbrasive: false,
  },
  'overture__petg__rock': {
    id: 'overture__petg__rock',
    material: 'PETG',
    lineName: 'Rock',
    finishType: 'Standard',
    nozzleTempMin: 230,
    nozzleTempMax: 250,
    bedTempMin: 70,
    bedTempMax: 80,
    enclosureRequired: false,
    isNozzleAbrasive: false,
    isTough: true,
  },
  'overture__tpu__standard': {
    id: 'overture__tpu__standard',
    material: 'TPU-95A',
    lineName: 'Standard',
    finishType: 'Standard',
    nozzleTempMin: 210,
    nozzleTempMax: 230,
    bedTempMin: 30,
    bedTempMax: 50,
    enclosureRequired: false,
    isNozzleAbrasive: false,
  },
  'overture__tpu__high-speed': {
    id: 'overture__tpu__high-speed',
    material: 'TPU-95A',
    lineName: 'High Speed',
    finishType: 'Standard',
    nozzleTempMin: 220,
    nozzleTempMax: 250,
    bedTempMin: 40,
    bedTempMax: 60,
    enclosureRequired: false,
    isNozzleAbrasive: false,
    highSpeedCapable: true,
  },
  'overture__abs__standard': {
    id: 'overture__abs__standard',
    material: 'ABS',
    lineName: 'Standard',
    finishType: 'Standard',
    nozzleTempMin: 230,
    nozzleTempMax: 250,
    bedTempMin: 90,
    bedTempMax: 110,
    enclosureRequired: true,
    isNozzleAbrasive: false,
  },
  'overture__asa__standard': {
    id: 'overture__asa__standard',
    material: 'ASA',
    lineName: 'Standard',
    finishType: 'Standard',
    nozzleTempMin: 240,
    nozzleTempMax: 260,
    bedTempMin: 90,
    bedTempMax: 110,
    enclosureRequired: true,
    isNozzleAbrasive: false,
  },
  'overture__pc__professional': {
    id: 'overture__pc__professional',
    material: 'PC',
    lineName: 'Professional',
    finishType: 'Standard',
    nozzleTempMin: 250,
    nozzleTempMax: 280,
    bedTempMin: 100,
    bedTempMax: 120,
    enclosureRequired: true,
    isNozzleAbrasive: false,
  },
  'overture__pa__easy-nylon': {
    id: 'overture__pa__easy-nylon',
    material: 'PA',
    lineName: 'Easy Nylon',
    finishType: 'Standard',
    nozzleTempMin: 240,
    nozzleTempMax: 260,
    bedTempMin: 70,
    bedTempMax: 90,
    enclosureRequired: false,
    isNozzleAbrasive: false,
  },
  'overture__pla-cf__standard': {
    id: 'overture__pla-cf__standard',
    material: 'PLA-CF',
    lineName: 'Carbon Fiber',
    finishType: 'Matte',
    nozzleTempMin: 200,
    nozzleTempMax: 230,
    bedTempMin: 50,
    bedTempMax: 60,
    enclosureRequired: false,
    isNozzleAbrasive: true,
  },
};

// Color to hex mapping (extensive catalog)
export const OVERTURE_COLOR_MAP: Record<string, string> = {
  // Standard Colors
  'black': '#1A1A1A',
  'white': '#FFFFFF',
  'grey': '#808080',
  'gray': '#808080',
  'red': '#CC0000',
  'blue': '#0066CC',
  'green': '#00AA00',
  'yellow': '#FFCC00',
  'orange': '#FF6600',
  'purple': '#8B008B',
  'pink': '#FF69B4',
  'brown': '#8B4513',
  'beige': '#F5F5DC',
  'cream': '#FFFDD0',
  'natural': '#F5F5DC',
  
  // Light/Dark Variants
  'light blue': '#87CEEB',
  'light green': '#90EE90',
  'light grey': '#D3D3D3',
  'light gray': '#D3D3D3',
  'light pink': '#FFB6C1',
  'dark blue': '#00008B',
  'dark green': '#006400',
  'dark grey': '#404040',
  'dark gray': '#404040',
  'dark red': '#8B0000',
  
  // Specific Named Colors
  'army green': '#4B5320',
  'army': '#4B5320',
  'navy blue': '#000080',
  'navy': '#000080',
  'sky blue': '#87CEEB',
  'royal blue': '#4169E1',
  'cobalt blue': '#0047AB',
  'teal': '#008080',
  'cyan': '#00FFFF',
  'aqua': '#00FFFF',
  'mint': '#98FF98',
  'mint green': '#98FF98',
  'olive': '#808000',
  'olive green': '#808000',
  'forest green': '#228B22',
  'lime': '#00FF00',
  'lime green': '#32CD32',
  'neon green': '#39FF14',
  'grass green': '#7CFC00',
  'apple green': '#8DB600',
  
  // Reds/Oranges/Yellows
  'crimson': '#DC143C',
  'maroon': '#800000',
  'burgundy': '#800020',
  'wine': '#722F37',
  'coral': '#FF7F50',
  'salmon': '#FA8072',
  'peach': '#FFCBA4',
  'tangerine': '#FF9966',
  'gold': '#FFD700',
  'golden': '#FFD700',
  'mustard': '#FFDB58',
  'lemon': '#FFF44F',
  'amber': '#FFBF00',
  
  // Purples/Pinks
  'violet': '#EE82EE',
  'lavender': '#E6E6FA',
  'magenta': '#FF00FF',
  'fuchsia': '#FF00FF',
  'plum': '#DDA0DD',
  'grape': '#6F2DA8',
  'hot pink': '#FF69B4',
  'rose': '#FF007F',
  'blush': '#DE5D83',
  
  // Metallics/Specials
  'silver': '#C0C0C0',
  'bronze': '#CD7F32',
  'copper': '#B87333',
  'champagne': '#F7E7CE',
  'space grey': '#4A4A4A',
  'space gray': '#4A4A4A',
  
  // Transparent/Clear
  'transparent': '#E8E8E8',
  'clear': '#E8E8E8',
  'translucent': '#E8E8E8',
  'transparent blue': '#87CEEB',
  'transparent green': '#90EE90',
  'transparent red': '#FF6B6B',
  'transparent orange': '#FFB347',
  'transparent yellow': '#FFFF99',
  'transparent purple': '#DDA0DD',
  
  // Glow Colors
  'glow green': '#39FF14',
  'glow blue': '#00FFFF',
  'glow orange': '#FF6600',
  'glow yellow': '#FFFF00',
  'glow pink': '#FF69B4',
  'glow white': '#F0F0F0',
  
  // Silk Colors
  'silk white': '#FFFAFA',
  'silk black': '#2A2A2A',
  'silk gold': '#FFD700',
  'silk silver': '#C0C0C0',
  'silk copper': '#B87333',
  'silk bronze': '#CD7F32',
  'silk red': '#DC143C',
  'silk blue': '#4169E1',
  'silk green': '#00AA00',
  'silk purple': '#9370DB',
  'silk pink': '#FF69B4',
  'silk rose': '#FF007F',
  'silk champagne': '#F7E7CE',
  
  // Multi/Rainbow
  'rainbow': '#FF0000',
  'multicolor': '#FF0000',
  'dual color': '#FF0000',
  'gradient': '#FF0000',
  
  // Matte Colors
  'matte black': '#2A2A2A',
  'matte white': '#F5F5F5',
  'matte grey': '#6B6B6B',
  'matte gray': '#6B6B6B',
  'matte blue': '#4A6FA5',
  'matte green': '#5A8A5A',
  'matte red': '#A52A2A',
  
  // Diamond/Sparkle (shimmer effect)
  'diamond white': '#FFFAFA',
  'diamond black': '#1A1A1A',
  'diamond blue': '#4169E1',
  'diamond red': '#DC143C',
  'diamond gold': '#FFD700',
  'diamond silver': '#C0C0C0',
  
  // Bundle/Pack Colors
  'multi-pack': '#808080',
  '6 pack': '#808080',
  'variety': '#808080',
};

/**
 * Detect product line from title
 */
export function detectOvertureProductLine(title: string): OvertureProductLine | null {
  const titleLower = title.toLowerCase();
  
  // Check for specific product lines first (more specific matches)
  if (/carbon\s*fiber|pla[\s-]*cf/i.test(titleLower)) {
    return OVERTURE_PRODUCT_LINES['overture__pla-cf__standard'];
  }
  
  if (/easy\s*nylon|nylon/i.test(titleLower)) {
    return OVERTURE_PRODUCT_LINES['overture__pa__easy-nylon'];
  }
  
  if (/pc\s*professional|polycarbonate/i.test(titleLower)) {
    return OVERTURE_PRODUCT_LINES['overture__pc__professional'];
  }
  
  if (/\basa\b/i.test(titleLower)) {
    return OVERTURE_PRODUCT_LINES['overture__asa__standard'];
  }
  
  if (/\babs\b/i.test(titleLower)) {
    return OVERTURE_PRODUCT_LINES['overture__abs__standard'];
  }
  
  // TPU variants
  if (/hs\s*tpu|high[\s-]*speed\s*tpu/i.test(titleLower)) {
    return OVERTURE_PRODUCT_LINES['overture__tpu__high-speed'];
  }
  if (/\btpu\b/i.test(titleLower)) {
    return OVERTURE_PRODUCT_LINES['overture__tpu__standard'];
  }
  
  // PETG variants
  if (/rock\s*petg/i.test(titleLower)) {
    return OVERTURE_PRODUCT_LINES['overture__petg__rock'];
  }
  if (/\bpetg\b/i.test(titleLower)) {
    return OVERTURE_PRODUCT_LINES['overture__petg__standard'];
  }
  
  // PLA variants (check specific variants first)
  if (/air\s*pla|pla\s*air/i.test(titleLower)) {
    return OVERTURE_PRODUCT_LINES['overture__pla__air'];
  }
  if (/super\s*pla\+?|pla\+?\s*super/i.test(titleLower)) {
    return OVERTURE_PRODUCT_LINES['overture__pla__super-plus'];
  }
  if (/professional\s*pla|pla\s*professional/i.test(titleLower)) {
    return OVERTURE_PRODUCT_LINES['overture__pla__professional'];
  }
  if (/easy.*pla.*6|6.*pack.*pla/i.test(titleLower)) {
    return OVERTURE_PRODUCT_LINES['overture__pla__easy-6'];
  }
  if (/easy\s*pla|pla\s*easy/i.test(titleLower)) {
    return OVERTURE_PRODUCT_LINES['overture__pla__easy'];
  }
  if (/matte\s*pla|pla\s*matte/i.test(titleLower)) {
    return OVERTURE_PRODUCT_LINES['overture__pla__matte'];
  }
  if (/silk\s*pla|pla\s*silk/i.test(titleLower)) {
    return OVERTURE_PRODUCT_LINES['overture__pla__silk'];
  }
  if (/sparkle\s*pla|pla\s*sparkle|glitter/i.test(titleLower)) {
    return OVERTURE_PRODUCT_LINES['overture__pla__sparkle'];
  }
  if (/glow|luminous/i.test(titleLower)) {
    return OVERTURE_PRODUCT_LINES['overture__pla__glow'];
  }
  if (/\bpla\b/i.test(titleLower)) {
    return OVERTURE_PRODUCT_LINES['overture__pla__standard'];
  }
  
  return null;
}

/**
 * Detect finish type from title and color
 */
export function detectOvertureFinishType(title: string, color?: string): string {
  const combined = `${title} ${color || ''}`.toLowerCase();
  
  if (/matte/i.test(combined)) return 'Matte';
  if (/silk/i.test(combined)) return 'Silk';
  if (/sparkle|glitter/i.test(combined)) return 'Sparkle';
  if (/glow|luminous/i.test(combined)) return 'Glow';
  if (/transparent|translucent|clear/i.test(combined)) return 'Transparent';
  if (/diamond|shimmer/i.test(combined)) return 'Shimmer';
  if (/gradient|rainbow|dual\s*color|multicolor/i.test(combined)) return 'Multi';
  
  return 'Standard';
}

/**
 * Extract color hex from color name
 */
export function getOvertureColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  const colorLower = colorName.toLowerCase().trim();
  
  // Direct match
  if (OVERTURE_COLOR_MAP[colorLower]) {
    return OVERTURE_COLOR_MAP[colorLower];
  }
  
  // Try partial matches
  for (const [key, hex] of Object.entries(OVERTURE_COLOR_MAP)) {
    if (colorLower.includes(key) || key.includes(colorLower)) {
      return hex;
    }
  }
  
  return null;
}

/**
 * Clean product title
 */
export function cleanOvertureTitle(title: string, colorName?: string): string {
  let cleaned = title
    .replace(/OVERTURE\s*/gi, '')
    .replace(/3D\s*Printer\s*Filament/gi, '')
    .replace(/3D\s*Printing\s*Filament/gi, '')
    .replace(/Filament\s*1\.75\s*mm/gi, '')
    .replace(/1\.75\s*mm/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Add color to title if provided and not already included
  if (colorName && !cleaned.toLowerCase().includes(colorName.toLowerCase())) {
    cleaned = `${cleaned} - ${colorName}`;
  }
  
  return cleaned;
}

/**
 * Extract weight from title or variant
 */
export function extractOvertureWeight(title: string, variantTitle?: string): number {
  const combined = `${title} ${variantTitle || ''}`.toLowerCase();
  
  // Check for kg patterns
  const kgMatch = combined.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (kgMatch) {
    return Math.round(parseFloat(kgMatch[1]) * 1000);
  }
  
  // Check for gram patterns
  const gMatch = combined.match(/(\d+)\s*g(?:ram)?s?/i);
  if (gMatch) {
    return parseInt(gMatch[1], 10);
  }
  
  // Default to 1kg
  return 1000;
}

/**
 * Enrich Overture product with brand-specific data
 */
export function enrichOvertureProduct(product: {
  title: string;
  color?: string;
  variantTitle?: string;
}): {
  material: string;
  finishType: string;
  productLineId: string | null;
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  enclosureRequired: boolean;
  isNozzleAbrasive: boolean;
  isTough: boolean;
  isFoaming: boolean;
  highSpeedCapable: boolean;
  colorHex: string | null;
  cleanedTitle: string;
  netWeightG: number;
} {
  const productLine = detectOvertureProductLine(product.title);
  const finishType = detectOvertureFinishType(product.title, product.color);
  const colorHex = getOvertureColorHex(product.color || '');
  const cleanedTitle = cleanOvertureTitle(product.title, product.color);
  const netWeightG = extractOvertureWeight(product.title, product.variantTitle);
  
  if (productLine) {
    return {
      material: productLine.material,
      finishType: productLine.finishType !== 'Standard' ? productLine.finishType : finishType,
      productLineId: productLine.id,
      nozzleTempMin: productLine.nozzleTempMin,
      nozzleTempMax: productLine.nozzleTempMax,
      bedTempMin: productLine.bedTempMin,
      bedTempMax: productLine.bedTempMax,
      enclosureRequired: productLine.enclosureRequired,
      isNozzleAbrasive: productLine.isNozzleAbrasive,
      isTough: productLine.isTough || false,
      isFoaming: productLine.isFoaming || false,
      highSpeedCapable: productLine.highSpeedCapable || false,
      colorHex,
      cleanedTitle,
      netWeightG,
    };
  }
  
  // Fallback for unrecognized products
  return {
    material: 'PLA',
    finishType,
    productLineId: null,
    nozzleTempMin: 190,
    nozzleTempMax: 220,
    bedTempMin: 50,
    bedTempMax: 60,
    enclosureRequired: false,
    isNozzleAbrasive: false,
    isTough: false,
    isFoaming: false,
    highSpeedCapable: false,
    colorHex,
    cleanedTitle,
    netWeightG,
  };
}

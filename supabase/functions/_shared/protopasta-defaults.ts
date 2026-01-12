/**
 * PROTO-PASTA BRAND DEFAULTS
 * 
 * Specialty filament manufacturer known for HTPLA (heat-treatable PLA),
 * metal composites, and unique specialty materials.
 * 
 * Platform: Shopify (proto-pasta.com)
 * Regional Stores: None (US only)
 * 
 * Key Features:
 * - HTPLA that can be heat-treated for higher temp resistance
 * - Metal composite filaments (Brass, Bronze, Copper, Iron, Steel)
 * - Carbon Fiber variants
 * - Electrically Conductive PLA
 */

import { getColorHex as getSharedColorHex } from './color-mapping.ts';

// ============= PRINT SETTINGS =============

export interface PrintSettings {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  printSpeedMax?: number;
  requiresEnclosure?: boolean;
  isAbrasive?: boolean;
  isConductive?: boolean;
  nozzleSizeMin?: number;
  notes?: string;
}

export const PROTOPASTA_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // HTPLA Standard Lines
  'htpla-standard': {
    nozzleTempMin: 195,
    nozzleTempMax: 220,
    bedTempMin: 0,
    bedTempMax: 60,
    notes: 'No heated bed required. Glass or PEI recommended.',
  },
  'htpla-translucent': {
    nozzleTempMin: 195,
    nozzleTempMax: 220,
    bedTempMin: 0,
    bedTempMax: 60,
    notes: 'Translucent/sparkly finish. Heat treat at 110C for 10-30 min.',
  },
  'htpla-metallic': {
    nozzleTempMin: 195,
    nozzleTempMax: 220,
    bedTempMin: 0,
    bedTempMax: 60,
    notes: 'Metallic finish. Heat treat at 110C for improved properties.',
  },
  'htpla-glitter': {
    nozzleTempMin: 195,
    nozzleTempMax: 220,
    bedTempMin: 0,
    bedTempMax: 60,
    notes: 'Glitter flake finish.',
  },
  'htpla-nebula': {
    nozzleTempMin: 195,
    nozzleTempMax: 220,
    bedTempMin: 0,
    bedTempMax: 60,
    notes: 'Multicolor gradient effect.',
  },
  'htpla-matte-fiber': {
    nozzleTempMin: 195,
    nozzleTempMax: 220,
    bedTempMin: 0,
    bedTempMax: 60,
    notes: 'Matte fiber finish with subtle texture.',
  },

  // Carbon Fiber Variants
  'htpla-cf': {
    nozzleTempMin: 210,
    nozzleTempMax: 230,
    bedTempMin: 50,
    bedTempMax: 60,
    isAbrasive: true,
    nozzleSizeMin: 0.4,
    notes: 'Carbon fiber HTPLA. Use hardened nozzle 0.4mm+.',
  },
  'pla-cf': {
    nozzleTempMin: 195,
    nozzleTempMax: 220,
    bedTempMin: 50,
    bedTempMax: 60,
    isAbrasive: true,
    nozzleSizeMin: 0.4,
    notes: 'Carbon fiber PLA. Use hardened nozzle 0.4mm+.',
  },

  // Metal Composite Filaments
  'htpla-brass': {
    nozzleTempMin: 185,
    nozzleTempMax: 210,
    bedTempMin: 50,
    bedTempMax: 60,
    isAbrasive: true,
    nozzleSizeMin: 0.5,
    notes: 'Brass-filled HTPLA. Use hardened nozzle 0.5mm+. Can be polished.',
  },
  'htpla-bronze': {
    nozzleTempMin: 185,
    nozzleTempMax: 210,
    bedTempMin: 50,
    bedTempMax: 60,
    isAbrasive: true,
    nozzleSizeMin: 0.5,
    notes: 'Bronze-filled HTPLA. Use hardened nozzle 0.5mm+. Can be polished.',
  },
  'htpla-copper': {
    nozzleTempMin: 185,
    nozzleTempMax: 210,
    bedTempMin: 50,
    bedTempMax: 60,
    isAbrasive: true,
    nozzleSizeMin: 0.5,
    notes: 'Copper-filled HTPLA. Use hardened nozzle 0.5mm+. Develops patina.',
  },
  'pla-iron': {
    nozzleTempMin: 185,
    nozzleTempMax: 210,
    bedTempMin: 50,
    bedTempMax: 60,
    isAbrasive: true,
    nozzleSizeMin: 0.5,
    notes: 'Iron-filled PLA. Magnetic! Can rust for weathered effect.',
  },
  'pla-steel': {
    nozzleTempMin: 185,
    nozzleTempMax: 210,
    bedTempMin: 50,
    bedTempMax: 60,
    isAbrasive: true,
    nozzleSizeMin: 0.5,
    notes: 'Steel-filled PLA. Use hardened nozzle 0.5mm+.',
  },

  // Specialty
  'pla-conductive': {
    nozzleTempMin: 185,
    nozzleTempMax: 215,
    bedTempMin: 50,
    bedTempMax: 60,
    isConductive: true,
    notes: 'Electrically conductive PLA. ~30 ohm-cm resistivity.',
  },
};

// ============= MATERIAL MAPPING =============

export const PROTOPASTA_MATERIAL_MAPPING: Record<string, string> = {
  // HTPLA variants
  'htpla': 'HTPLA',
  'ht-pla': 'HTPLA',
  'high-temp pla': 'HTPLA',
  'high temp pla': 'HTPLA',
  'heat treatable pla': 'HTPLA',

  // Carbon Fiber
  'carbon fiber htpla': 'HTPLA-CF',
  'cf htpla': 'HTPLA-CF',
  'carbon fiber pla': 'PLA-CF',
  'cf pla': 'PLA-CF',

  // Metal Composites (HTPLA base)
  'brass htpla': 'HTPLA',
  'bronze htpla': 'HTPLA',
  'copper htpla': 'HTPLA',

  // Metal Composites (PLA base)
  'iron pla': 'PLA',
  'magnetic iron pla': 'PLA',
  'steel pla': 'PLA',
  'stainless steel pla': 'PLA',

  // Conductive
  'conductive pla': 'PLA-Conductive',
  'electrically conductive pla': 'PLA-Conductive',
  'conductive': 'PLA-Conductive',

  // Standard PLA fallback
  'pla': 'PLA',
};

// ============= FINISH TYPE DETECTION =============

export type FinishType = 
  | 'Metallic' 
  | 'Glitter' 
  | 'Translucent' 
  | 'Multicolor' 
  | 'Matte' 
  | 'Filled' 
  | 'Carbon' 
  | 'Standard';

export function extractProtoPastaFinishType(title: string): FinishType {
  if (!title) return 'Standard';
  const t = title.toLowerCase();

  // Carbon Fiber detection
  if (/carbon\s*fiber|cf\s|cf-/i.test(t)) return 'Carbon';

  // Metal composite detection
  if (/brass|bronze|copper|iron|steel/i.test(t)) return 'Filled';

  // Metallic finishes
  if (/metallic|empire|galactic|highfive|high\s*five/i.test(t)) return 'Metallic';

  // Glitter/Sparkle
  if (/glitter|candy\s*apple|stardust|flake/i.test(t)) return 'Glitter';

  // Translucent/Iridescent
  if (/translucent|iridescent|ice|water|crystal|clear/i.test(t)) return 'Translucent';

  // Multicolor/Nebula
  if (/nebula|multicolor|gradient|galaxy/i.test(t)) return 'Multicolor';

  // Matte
  if (/matte|matte\s*fiber/i.test(t)) return 'Matte';

  return 'Standard';
}

// ============= PRODUCT LINE ID GENERATION =============

interface ProductLineResult {
  productLineId: string;
  settingsKey: string;
}

export function generateProtoPastaProductLineId(title: string, material?: string | null): ProductLineResult {
  if (!title) {
    return { productLineId: 'protopasta__unknown__unknown', settingsKey: 'htpla-standard' };
  }

  const t = title.toLowerCase();
  const normalizedMaterial = normalizeProtoPastaMaterial(title, material);
  const materialSlug = normalizedMaterial.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Carbon Fiber HTPLA
  if (/carbon\s*fiber.*htpla|cf.*htpla/i.test(t) || normalizedMaterial === 'HTPLA-CF') {
    return { productLineId: 'protopasta__htpla-cf__carbon-fiber', settingsKey: 'htpla-cf' };
  }

  // Carbon Fiber PLA (non-HT)
  if (/carbon\s*fiber.*pla|cf.*pla/i.test(t) && !/htpla/i.test(t)) {
    return { productLineId: 'protopasta__pla-cf__carbon-fiber', settingsKey: 'pla-cf' };
  }

  // Glass Fiber (before standard HTPLA check)
  if (/glass\s*fiber/i.test(t)) {
    return { productLineId: 'protopasta__htpla-gf__glass-fiber', settingsKey: 'htpla-standard' };
  }

  // Metal Composites
  if (/brass/i.test(t)) {
    return { productLineId: 'protopasta__htpla__brass', settingsKey: 'htpla-brass' };
  }
  if (/bronze/i.test(t)) {
    return { productLineId: 'protopasta__htpla__bronze', settingsKey: 'htpla-bronze' };
  }
  if (/copper/i.test(t)) {
    return { productLineId: 'protopasta__htpla__copper', settingsKey: 'htpla-copper' };
  }
  if (/iron|magnetic/i.test(t)) {
    return { productLineId: 'protopasta__pla__iron', settingsKey: 'pla-iron' };
  }
  if (/steel|stainless/i.test(t)) {
    return { productLineId: 'protopasta__pla__steel', settingsKey: 'pla-steel' };
  }

  // Conductive PLA
  if (/conductive/i.test(t) || normalizedMaterial === 'PLA-Conductive') {
    return { productLineId: 'protopasta__pla-conductive__conductive', settingsKey: 'pla-conductive' };
  }

  // Static Dissipative / ESD
  if (/static.*dissipative|esd/i.test(t)) {
    if (/petg/i.test(t)) {
      return { productLineId: 'protopasta__petg-esd__dissipative', settingsKey: 'htpla-standard' };
    }
    return { productLineId: 'protopasta__pla-esd__dissipative', settingsKey: 'pla-conductive' };
  }

  // Polyketone (POK)
  if (/polyketone|pok/i.test(t)) {
    if (/carbon\s*fiber|cf/i.test(t)) {
      return { productLineId: 'protopasta__pok-cf__carbon-fiber', settingsKey: 'htpla-standard' };
    }
    if (/glass\s*fiber|gf/i.test(t)) {
      return { productLineId: 'protopasta__pok-gf__glass-fiber', settingsKey: 'htpla-standard' };
    }
    return { productLineId: 'protopasta__pok__standard', settingsKey: 'htpla-standard' };
  }

  // PETG lines
  if (/petg/i.test(t)) {
    if (/carbon\s*fiber|cf/i.test(t)) {
      return { productLineId: 'protopasta__petg-cf__carbon-fiber', settingsKey: 'pla-cf' };
    }
    return { productLineId: 'protopasta__petg__standard', settingsKey: 'htpla-standard' };
  }

  // TPU/TPE lines
  if (/tpu|tpe|flexible/i.test(t)) {
    if (/rigid/i.test(t)) {
      return { productLineId: 'protopasta__tpu__rigid', settingsKey: 'htpla-standard' };
    }
    return { productLineId: 'protopasta__tpu__flexible', settingsKey: 'htpla-standard' };
  }

  // Calcium Carbonate
  if (/calcium\s*carbonate/i.test(t)) {
    return { productLineId: 'protopasta__pla__calcium-carbonate', settingsKey: 'htpla-standard' };
  }

  // HTPLA Sub-lines based on finish
  if (/htpla|ht-pla|high.?temp/i.test(t) || normalizedMaterial === 'HTPLA') {
    // Smoothie line (food names)
    if (/smoothie|blueberry|dragonfruit|papaya|pineapple\s*banana/i.test(t)) {
      return { productLineId: 'protopasta__htpla__smoothie', settingsKey: 'htpla-standard' };
    }
    // Reflective
    if (/reflective/i.test(t)) {
      return { productLineId: 'protopasta__htpla__reflective', settingsKey: 'htpla-standard' };
    }
    // Glow-in-the-Dark
    if (/glow.*dark|glow-in-the-dark/i.test(t)) {
      return { productLineId: 'protopasta__htpla__glow', settingsKey: 'htpla-standard' };
    }
    // Thermochromic
    if (/thermochromic/i.test(t)) {
      return { productLineId: 'protopasta__htpla__thermochromic', settingsKey: 'htpla-standard' };
    }
    // Marble
    if (/marble/i.test(t)) {
      return { productLineId: 'protopasta__htpla__marble', settingsKey: 'htpla-standard' };
    }
    // Wood variants
    if (/wood|walnut|mahogany|daffodil/i.test(t)) {
      return { productLineId: 'protopasta__htpla__wood', settingsKey: 'htpla-matte-fiber' };
    }
    // c-Matte / High Flow PLA
    if (/c-matte/i.test(t)) {
      return { productLineId: 'protopasta__hfpla__c-matte', settingsKey: 'htpla-standard' };
    }
    // Nebula Multicolor
    if (/nebula|multicolor/i.test(t)) {
      return { productLineId: 'protopasta__htpla__nebula', settingsKey: 'htpla-nebula' };
    }
    // Metallic
    if (/metallic|empire|galactic|highfive|high\s*five/i.test(t)) {
      return { productLineId: 'protopasta__htpla__metallic', settingsKey: 'htpla-metallic' };
    }
    // Glitter
    if (/glitter|candy\s*apple|flake|confetti|stardust|obsidian|sparkling/i.test(t)) {
      return { productLineId: 'protopasta__htpla__glitter', settingsKey: 'htpla-glitter' };
    }
    // Translucent/Sparkly
    if (/translucent|iridescent|sparkl|ice|water|crystal/i.test(t)) {
      return { productLineId: 'protopasta__htpla__translucent', settingsKey: 'htpla-translucent' };
    }
    // Matte Fiber
    if (/matte\s*fiber/i.test(t)) {
      return { productLineId: 'protopasta__htpla__matte-fiber', settingsKey: 'htpla-matte-fiber' };
    }
    // Standard Opaque HTPLA (colors like Red, Blue, Black, White)
    if (/opaque/i.test(t)) {
      return { productLineId: 'protopasta__htpla__opaque', settingsKey: 'htpla-standard' };
    }
    // Standard HTPLA fallback
    return { productLineId: 'protopasta__htpla__standard', settingsKey: 'htpla-standard' };
  }

  // Standard PLA fallback
  return { productLineId: `protopasta__${materialSlug}__standard`, settingsKey: 'htpla-standard' };
}

// ============= MATERIAL NORMALIZATION =============

export function normalizeProtoPastaMaterial(title: string, existingMaterial?: string | null): string {
  if (!title) return existingMaterial || 'HTPLA';

  const t = title.toLowerCase();

  // Check for carbon fiber first
  if (/carbon\s*fiber.*htpla|cf.*htpla/i.test(t)) return 'HTPLA-CF';
  if (/carbon\s*fiber|cf\s|cf-/i.test(t)) return 'PLA-CF';

  // Conductive
  if (/conductive/i.test(t)) return 'PLA-Conductive';

  // Metal composites - iron/steel are PLA base, others are HTPLA
  if (/iron|steel|stainless/i.test(t)) return 'PLA';

  // HTPLA detection (most Proto-Pasta products)
  if (/htpla|ht-pla|high.?temp|brass|bronze|copper/i.test(t)) return 'HTPLA';

  // Fallback to existing or HTPLA
  if (existingMaterial) {
    const mapped = PROTOPASTA_MATERIAL_MAPPING[existingMaterial.toLowerCase()];
    if (mapped) return mapped;
    return existingMaterial;
  }

  return 'HTPLA';
}

// ============= TDS URL MAPPING =============

// Proto-Pasta consolidated TDS page - individual PDFs have unpredictable version suffixes
export const PROTOPASTA_TDS_PAGE = 'https://proto-pasta.com/pages/technical-data-sheets';

// For future: if we discover stable patterns, add them here
// Current CDN pattern observed: TDS__[Name]_[version].pdf where version varies
export const PROTOPASTA_TDS_URLS: Record<string, string> = {
  // All products link to the main TDS page since individual PDFs have unpredictable URLs
  'default': PROTOPASTA_TDS_PAGE,
};

export function getProtoPastaTdsUrl(_productLineId: string): string {
  // Proto-Pasta's individual TDS PDFs have unpredictable version suffixes
  // Return the consolidated TDS page which contains all datasheets
  return PROTOPASTA_TDS_PAGE;
}

// ============= COLOR MAPPING =============

export const PROTOPASTA_COLOR_MAPPING: Record<string, string> = {
  // Reflective HTPLA
  'yellow reflective': '#FFD700',
  'white reflective': '#F5F5F5',
  'red reflective': '#DC143C',
  'nebula reflective': '#7B68EE',
  'gray reflective': '#808080',
  'green reflective': '#228B22',
  'fluorescent yellow reflective': '#CCFF00',
  'denim blue reflective': '#1560BD',
  'bronze reflective': '#CD7F32',
  'blue reflective': '#1E90FF',
  
  // Metallic HTPLA
  'empire strikes black': '#1A1A1A',
  'empire black': '#1A1A1A',
  'highfive blue': '#1E88E5',
  'high five blue': '#1E88E5',
  'galactic empire purple': '#8E24AA',
  'galactic purple': '#8E24AA',
  'sun gold metallic yellow': '#FFD700',
  'second to none silver': '#C0C0C0',
  'stefs rose gold': '#B76E79',
  'what karat smooth gold': '#FFD700',
  'heartthrob metallic red': '#E53935',
  'lukes proton purple': '#9C27B0',
  'out of darts orange': '#FF8C00',
  'moonstruck white satin': '#FAFAFA',
  'glitters mane teal': '#008B8B',

  // Glitter HTPLA
  'candy apple red': '#E53935',
  'stardust silver': '#C0C0C0',
  'glitter n gourd orange': '#FF8C00',
  'lapis lazuli glitter': '#1E3A8A',
  'night before blue': '#1A237E',
  'candle light white': '#FFF8DC',
  'texas tea black': '#1A1A1A',
  'wonder black rainbow glitter': '#1A1A1A',
  'fleck n forest green glitter': '#228B22',
  'fleck n fire red glitter': '#DC143C',
  'atomic age gray glitter': '#708090',
  'unicorn tears white glitter': '#FFFFFF',
  'filafetti confetti frosting': '#FFFFFF',
  'dusty smoke': '#696969',
  'good as gold': '#FFD700',
  'pretty in pink pearl': '#FFB6C1',
  'obsidian': '#1A1A1A',
  'sparkling spruce': '#228B22',

  // Translucent HTPLA
  'iridescent ice': '#A5F2F3',
  'iridescent blue': '#4FC3F7',
  'translucent blue': '#42A5F5',
  'translucent red': '#EF5350',
  'translucent green': '#66BB6A',
  'translucent purple': '#AB47BC',
  'translucent orange': '#FFA726',
  'crystal clear': '#FFFFFF',
  'purple ice translucent': '#9932CC',
  'aqua ice translucent': '#00CED1',
  'blue ice translucent': '#87CEEB',
  'nerfed translucent orange': '#FF6347',
  'totally translucent yellow': '#FFFF00',
  'bottle brown translucent': '#8B4513',
  'cobalt blue translucent': '#0047AB',
  'soda green translucent': '#7CFC00',

  // Nebula/Multicolor
  'nebula multicolor': '#7B68EE',
  'nebula': '#7B68EE',
  'galaxy': '#483D8B',
  'gradient gray multicolor': '#808080',
  'black to the fuchsia': '#FF00FF',
  'fading rainbow': '#FF69B4',
  'candy rainbow': '#FF69B4',
  'tidal turquoise': '#40E0D0',
  'kermie green': '#32CD32',
  'erratic indigo': '#4B0082',
  'seafoam green': '#20B2AA',
  'partly sunny yellow': '#FFD700',
  'partly cloudy blue': '#87CEEB',
  'amethyst aria': '#9966CC',
  'mango medley': '#FF8C00',
  'scarlet symphony': '#DC143C',
  'stratocumulus': '#87CEEB',
  'midnight multicolor': '#191970',
  'forest fantasy green': '#228B22',
  'citrus sunrise orange': '#FF4500',
  'marine dream blue': '#006994',
  'the original nebula': '#7B68EE',
  'nebula cotton candy': '#FFB6C1',
  'nebula night glow': '#7B68EE',
  'nebula silver silk': '#C0C0C0',
  'nebula rainbow': '#FF69B4',
  'nebula gold dust': '#FFD700',
  'nebula stardust': '#C0C0C0',

  // Smoothie HTPLA
  'super green smoothie': '#32CD32',
  'blueberry smoothie': '#4169E1',
  'dragonfruit smoothie': '#FF1493',
  'orange papaya smoothie': '#FF8C00',
  'pineapple banana smoothie': '#FFD700',

  // Thermochromic
  'galactic duel thermochromic': '#1A1A1A',
  'chlorophylled thermochromic': '#32CD32',
  'autumn orange thermochromic': '#FF8C00',
  'just peachy thermochromic': '#FFCBA4',
  'sour apple thermochromic': '#7CFC00',

  // Glow-in-the-Dark
  'green glow-in-the-dark': '#ADFF2F',

  // Marble
  'stone gray marble': '#708090',
  'white marble': '#F5F5F5',

  // Matte Fiber (Wood)
  'matte fiber black': '#2D2D2D',
  'matte fiber gray': '#6B6B6B',
  'matte fiber grey': '#6B6B6B',
  'matte fiber white': '#E0E0E0',
  'daffodil wood': '#DAA520',
  'mahogany wood': '#C04000',
  'walnut wood': '#5D432C',

  // Metal Composites
  'brass': '#B5A642',
  'bronze': '#CD7F32',
  'copper': '#B87333',
  'iron': '#48494B',
  'steel': '#71797E',
  'stainless steel': '#8B8D8E',
  'magnetic iron': '#48494B',
  'smooth bronze': '#CD7F32',
  'copper-filled': '#B87333',
  'high density stainless steel': '#8B8D8E',
  'high density iron': '#48494B',

  // Carbon Fiber
  'carbon fiber': '#1C1C1C',
  'carbon fiber black': '#1C1C1C',

  // Conductive/ESD
  'conductive black': '#1A1A1A',
  'conductive': '#1A1A1A',
  'static dissipative': '#1A1A1A',

  // Community Inspired
  'chocolate eruption brown': '#3D2314',
  'red hot cinnamon': '#D2691E',
  'international orange': '#FF4F00',
  'bluish opaque purple': '#5D3FD3',
  'sophys aqua phresh': '#00CED1',
  'beach bum beige': '#F5DEB3',
  'tropical palm green': '#228B22',
  'watermelon crush red': '#FF3B58',
  'gloop purple': '#8E44AD',
  'ecto ooze green': '#7FFF00',
  'amber alchemy': '#FF7E00',
  'nice n navy blue': '#000080',
  'lab coat white': '#FFFFFF',
  'caution opaque yellow': '#FFFF00',
  'dereks olive drab': '#6B8E23',
  'juliettes raspberry jam': '#872657',
  'dereks good old gray': '#808080',
  'bobbis purple iris': '#5D3FD3',
  'atikam teal': '#008080',
  'lootsef green': '#228B22',
  'fluorescent yellow': '#CCFF00',

  // c-Matte PLA
  'jurassic jungle green': '#228B22',
  'brick red': '#CB4154',
  'terracotta': '#E2725B',
  'granite gray': '#676767',

  // PETG
  'simply clear': '#FFFFFF',
  'joels highfive blue': '#1E88E5',
  'simply white': '#FFFFFF',
  'simply black': '#000000',
  'amies blood of my enemies': '#8B0000',
  'toms tangerine orange': '#FF9966',

  // Glass Fiber
  'blue glass fiber': '#4169E1',
  'red glass fiber': '#DC143C',
  'white glass fiber': '#F5F5F5',

  // Standard colors
  'black': '#000000',
  'white': '#FFFFFF',
  'red': '#FF0000',
  'blue': '#0000FF',
  'green': '#00FF00',
  'yellow': '#FFFF00',
  'orange': '#FFA500',
  'purple': '#800080',
  'pink': '#FFC0CB',
  'gray': '#808080',
  'grey': '#808080',
  'natural': '#F5F5DC',
  'clear': '#FFFFFF',
  'teal': '#008080',
  'gold': '#FFD700',
  'silver': '#C0C0C0',
  'brown': '#8B4513',
};

/**
 * Extract color name from variant title (e.g., "500g" -> null, "Empire Strikes Black" -> "Empire Strikes Black")
 */
function extractColorFromVariant(variantTitle: string): string | null {
  if (!variantTitle) return null;
  
  // Skip weight-only variants
  if (/^\d+\s*(?:g|kg)\s*$/i.test(variantTitle.trim())) {
    return null;
  }
  
  // Handle "Color / Weight" format
  if (variantTitle.includes('/')) {
    const parts = variantTitle.split('/').map(p => p.trim());
    for (const part of parts) {
      if (part && !/^\d+\s*(?:g|kg)\s*$/i.test(part)) {
        return part;
      }
    }
  }
  
  // Handle "Color - Weight" format
  if (variantTitle.includes(' - ')) {
    const parts = variantTitle.split(' - ').map(p => p.trim());
    for (const part of parts) {
      if (part && !/^\d+\s*(?:g|kg)\s*$/i.test(part)) {
        return part;
      }
    }
  }
  
  // If not a weight pattern, return as-is
  if (!/^\d+\s*(?:g|kg)\s*$/i.test(variantTitle.trim())) {
    return variantTitle.trim();
  }
  
  return null;
}

export function getProtoPastaColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  // Extract color from variant title first
  const extractedColor = extractColorFromVariant(colorName);
  if (!extractedColor) return null;
  
  const normalized = extractedColor.toLowerCase().trim();
  
  // Try brand-specific map first
  if (PROTOPASTA_COLOR_MAPPING[normalized]) {
    return PROTOPASTA_COLOR_MAPPING[normalized];
  }
  
  // Partial match in brand-specific map
  for (const [key, hex] of Object.entries(PROTOPASTA_COLOR_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return hex;
    }
  }
  
  // Fallback to shared color mapping
  const sharedHex = getSharedColorHex(normalized);
  if (sharedHex) {
    return sharedHex.startsWith('#') ? sharedHex : `#${sharedHex}`;
  }
  
  return null;
}

// ============= TITLE CLEANING =============

const PROTOPASTA_TITLE_NOISE: RegExp[] = [
  /proto-?pasta\s*/gi,
  /\s*3d\s*printing\s*filament\s*/gi,
  /\s*filament\s*$/gi,
  /\s*1\.75\s*mm\s*/gi,
  /\s*2\.85\s*mm\s*/gi,
  /\s*500\s*g\s*/gi,
  /\s*1\s*kg\s*/gi,
  /\s*2\s*kg\s*/gi,
  /\s{2,}/g,
];

export function cleanProtoPastaTitle(title: string): string {
  if (!title) return '';
  let cleaned = title;
  
  // Remove " - / " pattern first (variant explosion artifact from "Color - / 500g Spool")
  cleaned = cleaned.replace(/\s*-\s*\/\s*/g, ' ');
  
  // Remove weight/spool patterns at end of title
  cleaned = cleaned.replace(/\s*-?\s*(?:50g|100g|500g|1kg|2kg|3kg)?\s*(?:Coil|Spool)\s*$/gi, '');
  
  // Apply standard noise patterns
  for (const pattern of PROTOPASTA_TITLE_NOISE) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  
  return cleaned.trim();
}

/**
 * Extract color from the PRODUCT TITLE (not variant title)
 * Proto-Pasta product titles contain the color name directly
 * e.g., "Aqua Ice Translucent HTPLA" -> "Aqua Ice"
 */
export function extractColorFromProductTitle(title: string): string | null {
  if (!title) return null;
  
  // Remove product line descriptors to isolate color
  let colorPart = title
    .replace(/HTPLA|PLA|PETG|TPU|TPE|Composite|Metal|Carbon\s*Fiber|CF|Conductive|Glass\s*Fiber/gi, '')
    .replace(/\s*-\s*\/\s*.*/g, '') // Remove variant suffix
    .replace(/\s*-?\s*(?:Spool|Coil)\s*$/gi, '')
    .replace(/\s*(?:50g|100g|500g|1kg|2kg|3kg)\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Try to find color in mapping
  const hex = getProtoPastaColorHex(colorPart);
  if (hex) return hex;
  
  // Try with lowercase
  return getProtoPastaColorHex(colorPart.toLowerCase());
}

// ============= PRODUCT FILTERING =============

const PROTOPASTA_EXCLUDED_TYPES = [
  'nozzle',
  'accessory',
  'bundle',
  'kit',
  'sample',
  'tool',
  'merch',
  'shirt',
  'sticker',
  'gift card',
  'spool holder',
  'dry box',
];

export function isProtoPastaFilamentProduct(title: string, productType?: string): boolean {
  const t = title.toLowerCase();
  const pt = (productType || '').toLowerCase();

  // Exclude non-filament products
  for (const excluded of PROTOPASTA_EXCLUDED_TYPES) {
    if (t.includes(excluded) || pt.includes(excluded)) {
      return false;
    }
  }

  // Include if contains filament-related terms
  if (/htpla|pla|filament|spool|composite|conductive/i.test(t)) {
    return true;
  }

  // Include if product type is filament
  if (pt.includes('filament')) {
    return true;
  }

  return false;
}

// ============= WEIGHT/DIAMETER EXTRACTION =============

export function extractProtoPastaWeight(variantTitle: string): number | null {
  if (!variantTitle) return null;
  const t = variantTitle.toLowerCase();

  // Match patterns like "500g", "1kg", "2kg", "1 kg"
  const kgMatch = t.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (kgMatch) {
    return parseFloat(kgMatch[1]) * 1000;
  }

  const gMatch = t.match(/(\d+)\s*g(?:ram)?/i);
  if (gMatch) {
    return parseInt(gMatch[1], 10);
  }

  // Proto-Pasta default is 500g
  return 500;
}

export function extractProtoPastaDiameter(variantTitle: string): number {
  if (!variantTitle) return 1.75;
  const t = variantTitle.toLowerCase();

  if (t.includes('2.85') || t.includes('3mm') || t.includes('3.0')) {
    return 2.85;
  }

  return 1.75;
}

// ============= MAIN ENRICHMENT FUNCTION =============

export interface ProtoPastaEnrichmentResult {
  material: string;
  finishType: FinishType;
  productLineId: string;
  settingsKey: string;
  tdsUrl: string | null;
  colorHex: string | null;
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  isAbrasive: boolean;
  isConductive: boolean;
  nozzleSizeMin: number | null;
  notes: string | null;
}

export function enrichProtoPastaProduct(
  title: string,
  variantTitle: string,
  existingMaterial?: string | null
): ProtoPastaEnrichmentResult {
  const material = normalizeProtoPastaMaterial(title, existingMaterial);
  const finishType = extractProtoPastaFinishType(title);
  const { productLineId, settingsKey } = generateProtoPastaProductLineId(title, material);
  const tdsUrl = getProtoPastaTdsUrl(productLineId);

  // Extract color from variant title or main title
  const colorText = variantTitle || title;
  const colorHex = getProtoPastaColorHex(colorText);

  // Get print settings
  const settings = PROTOPASTA_PRINT_SETTINGS[settingsKey] || PROTOPASTA_PRINT_SETTINGS['htpla-standard'];

  return {
    material,
    finishType,
    productLineId,
    settingsKey,
    tdsUrl,
    colorHex,
    nozzleTempMin: settings.nozzleTempMin,
    nozzleTempMax: settings.nozzleTempMax,
    bedTempMin: settings.bedTempMin,
    bedTempMax: settings.bedTempMax,
    isAbrasive: settings.isAbrasive || false,
    isConductive: settings.isConductive || false,
    nozzleSizeMin: settings.nozzleSizeMin || null,
    notes: settings.notes || null,
  };
}

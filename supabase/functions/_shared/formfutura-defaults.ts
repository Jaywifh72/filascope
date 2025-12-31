/**
 * FORMFUTURA-SPECIFIC DEFAULTS
 * 
 * Premium Dutch manufacturer with RAL-style color naming,
 * high-precision engineering materials, and eco-friendly ReFill system.
 */

// ============================================================================
// TDS URL PATTERNS
// ============================================================================

export const FORMFUTURA_TDS_PATTERNS: Record<string, string> = {
  // PLA Family
  'EASYFIL EPLA': 'https://www.formfutura.com/web/content/256521',
  'EPLA': 'https://www.formfutura.com/web/content/256521',
  'PREMIUM PLA CF03': 'https://3d.nice-cdn.com/upload/file/formfutura-tds-premiumplacf03.pdf',
  'PLA CF03': 'https://3d.nice-cdn.com/upload/file/formfutura-tds-premiumplacf03.pdf',
  'VOLCANO PLA': 'https://www.formfutura.com/datasheets/volcano-pla-tds.pdf',
  'MATT PLA': 'https://www.formfutura.com/datasheets/matt-pla-tds.pdf',
  'MATTE PLA': 'https://www.formfutura.com/datasheets/matt-pla-tds.pdf',
  'HIGH GLOSS PLA': 'https://www.formfutura.com/datasheets/high-gloss-pla-tds.pdf',
  'GALAXY PLA': 'https://www.formfutura.com/datasheets/galaxy-pla-tds.pdf',
  'GLOW PLA': 'https://www.formfutura.com/datasheets/glow-pla-tds.pdf',
  'PREMIUM PLA': 'https://www.formfutura.com/datasheets/premium-pla-tds.pdf',
  'TOUGH PLA': 'https://www.formfutura.com/datasheets/tough-pla-tds.pdf',
  'REFORM RPLA': 'https://www.formfutura.com/datasheets/reform-rpla-tds.pdf',
  'REFORM ORGANIC': 'https://www.formfutura.com/datasheets/reform-organic-rpla-tds.pdf',
  'BULK PLA': 'https://www.formfutura.com/datasheets/bulk-pla-tds.pdf',
  
  // PETG Family
  'HDGLASS': 'https://www.formfutura.com/datasheets/hdglass-tds.pdf',
  'HD GLASS': 'https://www.formfutura.com/datasheets/hdglass-tds.pdf',
  'REFORM RPETG': 'https://www.formfutura.com/datasheets/reform-rpetg-tds.pdf',
  'BULK PETG': 'https://www.formfutura.com/datasheets/bulk-petg-tds.pdf',
  
  // ASA Family
  'APOLLOX CF10': 'https://3d.nice-cdn.com/upload/file/formfutura-tds-apolloxcf10.pdf',
  'APOLLOX': 'https://www.formfutura.com/datasheets/apollox-tds.pdf',
  
  // Engineering
  'CLEARSCENT ABS': 'https://www.formfutura.com/datasheets/clearscent-abs-tds.pdf',
  'STYX PA6-GF30': 'https://www.formfutura.com/datasheets/styx-pa6-gf30-tds.pdf',
  'STYX PA6 GF30': 'https://www.formfutura.com/datasheets/styx-pa6-gf30-tds.pdf',
  'STYX PA6': 'https://3d.nice-cdn.com/upload/file/formfutura-tds-styxpa6.pdf',
  'LUVOCOM': 'https://www.formfutura.com/datasheets/luvocom-3f-paht-cf-9891-tds.pdf',
  'PAHT CF': 'https://www.formfutura.com/datasheets/luvocom-3f-paht-cf-9891-tds.pdf',
  'CENTAUR PP': 'https://www.formfutura.com/datasheets/centaur-pp-tds.pdf',
  
  // Flexible
  'PYTHON FLEX 90A': 'https://www.formfutura.com/datasheets/python-flex-90a-tds.pdf',
  'PYTHONFLEX 90A': 'https://www.formfutura.com/datasheets/python-flex-90a-tds.pdf',
  'PYTHON FLEX 98A': 'https://www.formfutura.com/datasheets/python-flex-98a-tds.pdf',
  'PYTHONFLEX 98A': 'https://www.formfutura.com/datasheets/python-flex-98a-tds.pdf',
  
  // Specialty
  'EASYWOOD': 'https://www.formfutura.com/datasheets/easywood-tds.pdf',
  'BIOFIL PCL': 'https://www.formfutura.com/datasheets/biofil-pcl-tds.pdf',
  'PCL': 'https://www.formfutura.com/datasheets/biofil-pcl-tds.pdf',
  'HIPS': 'https://www.formfutura.com/datasheets/easyfil-hips-tds.pdf',
  'PVA': 'https://www.formfutura.com/datasheets/helios-pva-tds.pdf',
};

export function matchFormFuturaTds(title: string): { url: string; pattern: string } | null {
  if (!title) return null;
  const normalizedTitle = title.toUpperCase();
  const sorted = Object.entries(FORMFUTURA_TDS_PATTERNS).sort((a, b) => b[0].length - a[0].length);
  for (const [pattern, url] of sorted) {
    if (normalizedTitle.includes(pattern)) return { url, pattern };
  }
  return null;
}

// ============================================================================
// PRINT SETTINGS
// ============================================================================

export interface PrintSettings {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  printSpeedMax?: number;
  requiresEnclosure?: boolean;
  isAbrasive?: boolean;
  highSpeedCapable?: boolean;
}

export const FORMFUTURA_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // PLA variants
  'EASYFIL EPLA': { nozzleTempMin: 200, nozzleTempMax: 275, bedTempMin: 50, bedTempMax: 60, highSpeedCapable: true, printSpeedMax: 150 },
  'VOLCANO PLA': { nozzleTempMin: 200, nozzleTempMax: 275, bedTempMin: 50, bedTempMax: 60, highSpeedCapable: true, printSpeedMax: 150 },
  'PREMIUM PLA': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'TOUGH PLA': { nozzleTempMin: 195, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'MATT PLA': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60 },
  'HIGH GLOSS PLA': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60 },
  'GALAXY PLA': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60 },
  'GLOW PLA': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60 },
  'PREMIUM PLA CF03': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60, isAbrasive: true },
  'REFORM RPLA': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'EASYWOOD': { nozzleTempMin: 180, nozzleTempMax: 200, bedTempMin: 50, bedTempMax: 60 },
  
  // PETG
  'HDGLASS': { nozzleTempMin: 225, nozzleTempMax: 245, bedTempMin: 80, bedTempMax: 90 },
  'REFORM RPETG': { nozzleTempMin: 220, nozzleTempMax: 240, bedTempMin: 75, bedTempMax: 85 },
  
  // ASA
  'APOLLOX': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'APOLLOX CF10': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true, isAbrasive: true },
  
  // ABS
  'CLEARSCENT ABS': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  
  // PA/Nylon
  'STYX PA6': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 80, bedTempMax: 100, requiresEnclosure: true },
  'STYX PA6-GF30': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 80, bedTempMax: 100, requiresEnclosure: true, isAbrasive: true },
  
  // High-performance
  'LUVOCOM': { nozzleTempMin: 280, nozzleTempMax: 320, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true, isAbrasive: true },
  'PAHT CF': { nozzleTempMin: 280, nozzleTempMax: 320, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true, isAbrasive: true },
  'CENTAUR PP': { nozzleTempMin: 200, nozzleTempMax: 220, bedTempMin: 60, bedTempMax: 80 },
  
  // Flexible
  'PYTHON FLEX 90A': { nozzleTempMin: 220, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 60, printSpeedMax: 40 },
  'PYTHON FLEX 98A': { nozzleTempMin: 220, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 60, printSpeedMax: 40 },
  
  // Specialty
  'BIOFIL PCL': { nozzleTempMin: 55, nozzleTempMax: 80, bedTempMin: 0, bedTempMax: 30 },
  'HIPS': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'PVA': { nozzleTempMin: 190, nozzleTempMax: 210, bedTempMin: 45, bedTempMax: 60 },
  
  // Generic fallbacks
  'PLA': { nozzleTempMin: 190, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60 },
  'PETG': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 90 },
  'ABS': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'ASA': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'TPU': { nozzleTempMin: 220, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 60, printSpeedMax: 40 },
  'PA': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 80, bedTempMax: 100, requiresEnclosure: true },
};

export function getFormFuturaPrintSettings(title: string, material: string | null): PrintSettings | null {
  if (!title) return null;
  const normalizedTitle = title.toUpperCase();
  
  // Check specific product lines first
  const sortedSettings = Object.entries(FORMFUTURA_PRINT_SETTINGS).sort((a, b) => b[0].length - a[0].length);
  for (const [pattern, settings] of sortedSettings) {
    if (normalizedTitle.includes(pattern)) return settings;
  }
  
  // Fall back to material-based settings
  if (material) {
    const upperMaterial = material.toUpperCase();
    if (FORMFUTURA_PRINT_SETTINGS[upperMaterial]) {
      return FORMFUTURA_PRINT_SETTINGS[upperMaterial];
    }
  }
  
  return null;
}

// ============================================================================
// FINISH TYPE EXTRACTION
// ============================================================================

export type FinishType = 'Matte' | 'Glossy' | 'Silk' | 'Glow' | 'Sparkle' | 'Pearl' | 'Transparent' | 'ColorChange' | 'Standard';

export function extractFormFuturaFinishType(title: string): FinishType {
  if (!title) return 'Standard';
  const t = title.toLowerCase();
  
  if (/\bmatt\b|\bmatte\b/i.test(t)) return 'Matte';
  if (/high[- ]?gloss/i.test(t)) return 'Glossy';
  if (/galaxy/i.test(t)) return 'Sparkle';
  if (/glow|luminous/i.test(t)) return 'Glow';
  if (/colormorph|thermo/i.test(t)) return 'ColorChange';
  if (/pearl/i.test(t)) return 'Pearl';
  if (/hdglass.*see[- ]?through|transparent|clear/i.test(t)) return 'Transparent';
  if (/silk/i.test(t)) return 'Silk';
  
  return 'Standard';
}

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

export function normalizeFormFuturaMaterial(title: string): string | null {
  if (!title) return null;
  const t = title.toLowerCase();
  
  // High-performance polymers (check first)
  if (/luvocom|paht[- ]?cf/i.test(t)) return 'PAHT-CF';
  if (/peek/i.test(t)) return 'PEEK';
  if (/pekk/i.test(t)) return 'PEKK';
  if (/ppsu/i.test(t)) return 'PPSU';
  if (/pei|ultem/i.test(t)) return 'PEI';
  
  // Carbon fiber composites
  if (/apollox[- ]?cf|asa[- ]?cf/i.test(t)) return 'ASA-CF';
  if (/premium[- ]?pla[- ]?cf|pla[- ]?cf/i.test(t)) return 'PLA-CF';
  if (/pa6?[- ]?gf|styx.*gf/i.test(t)) return 'PA-GF';
  if (/pa[- ]?cf|nylon[- ]?cf/i.test(t)) return 'PA-CF';
  if (/pc[- ]?cf/i.test(t)) return 'PC-CF';
  
  // Nylon/PA
  if (/styx|pa6|nylon/i.test(t)) return 'PA';
  
  // ASA
  if (/apollox|asa/i.test(t)) return 'ASA';
  
  // PETG variants
  if (/hdglass|hd[- ]?glass/i.test(t)) return 'PETG';
  if (/petg/i.test(t)) return 'PETG';
  
  // ABS
  if (/clearscent|abs/i.test(t)) return 'ABS';
  
  // TPU/Flexible
  if (/python[- ]?flex.*90a/i.test(t)) return 'TPU-90A';
  if (/python[- ]?flex.*98a/i.test(t)) return 'TPU-98A';
  if (/python[- ]?flex|tpu/i.test(t)) return 'TPU';
  
  // Specialty
  if (/easywood|wood/i.test(t)) return 'PLA-Wood';
  if (/biofil[- ]?pcl|pcl/i.test(t)) return 'PCL';
  if (/centaur|polypropylene|\bpp\b/i.test(t)) return 'PP';
  if (/polycarbonate|\bpc\b/i.test(t)) return 'PC';
  if (/hips/i.test(t)) return 'HIPS';
  if (/pva/i.test(t)) return 'PVA';
  
  // PLA variants (check last since many products contain "PLA")
  if (/volcano[- ]?pla/i.test(t)) return 'PLA';
  if (/tough[- ]?pla/i.test(t)) return 'PLA+';
  if (/reform.*rpla|recycled.*pla|rpla/i.test(t)) return 'rPLA';
  if (/reform.*rpetg|recycled.*petg|rpetg/i.test(t)) return 'rPETG';
  if (/epla|easyfil|premium[- ]?pla|matt[- ]?pla|matte[- ]?pla|galaxy[- ]?pla|glow[- ]?pla|high[- ]?gloss[- ]?pla|colormorph|\bpla\b/i.test(t)) return 'PLA';
  
  return null;
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export function cleanFormFuturaTitle(title: string): string {
  if (!title) return '';
  return title
    .replace(/formfutura/gi, '')
    .replace(/free shipping/gi, '')
    .replace(/sale/gi, '')
    .replace(/\s*-\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateFormFuturaProductLineId(title: string, material?: string | null): string {
  const mat = material || normalizeFormFuturaMaterial(title) || 'unknown';
  const t = title.toLowerCase();
  
  // PLA lines
  if (/easyfil[- ]?epla|epla/i.test(t)) return `formfutura__pla__easyfil-epla`;
  if (/volcano[- ]?pla.*150c/i.test(t)) return `formfutura__pla__volcano-pla-150c`;
  if (/volcano[- ]?pla/i.test(t)) return `formfutura__pla__volcano-pla`;
  if (/tough[- ]?pla/i.test(t)) return `formfutura__pla-plus__tough-pla`;
  if (/matt[- ]?pla|matte[- ]?pla/i.test(t)) return `formfutura__pla__matt-pla`;
  if (/high[- ]?gloss[- ]?pla/i.test(t)) return `formfutura__pla__high-gloss-pla`;
  if (/galaxy[- ]?pla/i.test(t)) return `formfutura__pla__galaxy-pla`;
  if (/glow.*pla|pla.*glow/i.test(t)) return `formfutura__pla__glow-pla`;
  if (/colormorph/i.test(t)) return `formfutura__pla__colormorph`;
  if (/reform.*organic.*rpla/i.test(t)) return `formfutura__rpla__reform-organic`;
  if (/reform.*rpla|rpla/i.test(t)) return `formfutura__rpla__reform`;
  if (/bulk[- ]?pla/i.test(t)) return `formfutura__pla__bulk`;
  if (/premium[- ]?pla[- ]?cf/i.test(t)) return `formfutura__pla-cf__premium-cf03`;
  if (/premium[- ]?pla/i.test(t)) return `formfutura__pla__premium`;
  
  // PETG lines
  if (/hdglass.*blinded|hd[- ]?glass.*blinded/i.test(t)) return `formfutura__petg__hdglass-blinded`;
  if (/hdglass|hd[- ]?glass/i.test(t)) return `formfutura__petg__hdglass`;
  if (/reform.*rpetg|rpetg/i.test(t)) return `formfutura__rpetg__reform`;
  if (/bulk[- ]?petg/i.test(t)) return `formfutura__petg__bulk`;
  
  // ASA lines
  if (/apollox[- ]?cf/i.test(t)) return `formfutura__asa-cf__apollox-cf10`;
  if (/apollox/i.test(t)) return `formfutura__asa__apollox`;
  
  // ABS
  if (/clearscent/i.test(t)) return `formfutura__abs__clearscent`;
  
  // PA/Nylon
  if (/styx.*pa6.*gf|styx.*gf/i.test(t)) return `formfutura__pa-gf__styx-gf30`;
  if (/styx.*pa6|styx[- ]?pa/i.test(t)) return `formfutura__pa__styx`;
  
  // High-performance
  if (/luvocom|paht[- ]?cf/i.test(t)) return `formfutura__paht-cf__luvocom`;
  if (/centaur/i.test(t)) return `formfutura__pp__centaur`;
  
  // Flexible
  if (/python[- ]?flex.*90a/i.test(t)) return `formfutura__tpu-90a__pythonflex`;
  if (/python[- ]?flex.*98a/i.test(t)) return `formfutura__tpu-98a__pythonflex`;
  if (/python[- ]?flex/i.test(t)) return `formfutura__tpu__pythonflex`;
  
  // Specialty
  if (/easywood/i.test(t)) return `formfutura__pla-wood__easywood`;
  if (/biofil[- ]?pcl|pcl/i.test(t)) return `formfutura__pcl__biofil`;
  if (/hips/i.test(t)) return `formfutura__hips__easyfil`;
  if (/pva|helios/i.test(t)) return `formfutura__pva__helios`;
  
  // Generic fallback
  const matSlug = mat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `formfutura__${matSlug}__generic`;
}

// ============================================================================
// COLOR MAPPING (RAL-style naming)
// ============================================================================

export const FORMFUTURA_COLOR_MAPPING: Record<string, string> = {
  // Traffic colors
  'traffic black': '1A1A1A',
  'traffic white': 'F5F5F5',
  'traffic red': 'CC0000',
  'traffic green': '00A651',
  'traffic yellow': 'FFCC00',
  'traffic blue': '0057B8',
  'traffic orange': 'FF6600',
  'traffic grey': '8B8B8B',
  
  // Signal colors
  'signal black': '1C1C1C',
  'signal white': 'FFFFFF',
  'signal red': 'FF0000',
  'signal blue': '0057B8',
  'signal yellow': 'FFD700',
  'signal green': '008000',
  'signal orange': 'FF8000',
  
  // Blues
  'cobalt blue': '0047AB',
  'sapphire blue': '0F52BA',
  'sky blue': '87CEEB',
  'light blue': 'ADD8E6',
  'turquoise blue': '40E0D0',
  'ultramarine blue': '4166F5',
  'water blue': '00A4D9',
  'ocean blue': '0077BE',
  'night blue': '003366',
  'pastel blue': 'AEC6CF',
  'blue grey': '6699CC',
  
  // Greens
  'leaf green': '00AA00',
  'light green': '90EE90',
  'yellow green': '9ACD32',
  'mint green': '98FF98',
  'pastel green': '77DD77',
  'moss green': '8A9A5B',
  'fern green': '4F7942',
  'pine green': '01796F',
  
  // Reds & Oranges
  'orient red': 'CC3333',
  'pure red': 'FF0000',
  'ruby red': 'E0115F',
  'wine red': '722F37',
  'coral red': 'FF7F50',
  'salmon red': 'FA8072',
  'pure orange': 'FF6600',
  'bright red orange': 'FF4500',
  'fluor orange': 'FF6700',
  'yellow orange': 'FFAE42',
  'pastel orange': 'FFB347',
  
  // Yellows
  'maize yellow': 'FBEC5D',
  'sulfur yellow': 'E4E600',
  'zinc yellow': 'F4E600',
  'melon yellow': 'FFD966',
  'pastel yellow': 'FDFD96',
  'lemon yellow': 'FFF44F',
  
  // Greys
  'iron grey': '52595D',
  'light grey': 'D3D3D3',
  'basalt grey': '4E5754',
  'moss grey': '78776E',
  'squirrel grey': '78858B',
  'anthracite grey': '293133',
  'khaki grey': '7E6E54',
  'grey aluminium': '8F8F8F',
  'white aluminium': 'A5A5A5',
  'telegrey 4': 'CFD0CF',
  'telegrey': 'CFD0CF',
  'silver grey': 'C0C0C0',
  'stone grey': '928E85',
  
  // Whites & Naturals
  'natural': 'F0E6D2',
  'ivory': 'FFFFF0',
  'light ivory': 'FAF0E6',
  'snow white': 'FFFAFA',
  'pearl white': 'F8F6F0',
  'pure white': 'FFFFFF',
  'cream white': 'FFFDD0',
  'oyster white': 'EFEBD8',
  
  // Pinks & Violets
  'telemagenta': 'CF3476',
  'heather violet': '9966CC',
  'blue lilac': '6C5896',
  'purple violet': '8B008B',
  'pastel pink': 'FFD1DC',
  'pastel violet': 'B19CD9',
  'magenta': 'FF00FF',
  'pink': 'FFC0CB',
  'light pink': 'FFB6C1',
  
  // Browns & Beiges
  'copper brown': 'B87333',
  'mahogany brown': 'C04000',
  'beige brown': 'C19A6B',
  'nut brown': '5C4033',
  'chocolate brown': '3D2314',
  'sepia brown': '704214',
  'ochre brown': 'CC7722',
  'beige': 'F5F5DC',
  'sand': 'C2B280',
  
  // Metallics
  'pearl bronze': '876E55',
  'pearl gold': 'E6BE8A',
  'pearl copper': 'B87333',
  'pearl silver': 'C0C0C0',
  'metallic grey': 'A8A9AD',
  'bronze': 'CD7F32',
  'copper': 'B87333',
  'gold': 'FFD700',
  'silver': 'C0C0C0',
  
  // Luminous/Glow
  'luminous green': '50FF50',
  'luminous bright orange': 'FF6600',
  'luminous yellow': 'CCFF00',
  'luminous blue': '00FFFF',
  'luminous red': 'FF3333',
  
  // Matt colors
  'matt black': '1C1C1C',
  'matt white': 'F8F8F8',
  'matt light grey': 'C0C0C0',
  'matt apricot': 'FFCBA4',
  'matt lemon cream': 'FFFACD',
  'matt mauve': 'E0B0FF',
  'matt mint green': '98FB98',
  'matt polar blue': '88ACE0',
  'matt soft blue': 'A7C7E7',
  'matt vanilla white': 'F3E5AB',
  'matt water blue': '87CEEB',
  
  // Standard colors
  'black': '000000',
  'white': 'FFFFFF',
  'red': 'FF0000',
  'blue': '0000FF',
  'green': '00FF00',
  'yellow': 'FFFF00',
  'orange': 'FFA500',
  'purple': '800080',
  'grey': '808080',
  'gray': '808080',
  'brown': '8B4513',
  'clear': 'E8E8E8',
  'transparent': 'E8E8E8',
  'translucent': 'E8E8E8',
};

export function getFormFuturaColorHex(colorName: string): string | null {
  if (!colorName) return null;
  const normalized = colorName.toLowerCase().trim();
  
  // Direct match
  if (FORMFUTURA_COLOR_MAPPING[normalized]) {
    return FORMFUTURA_COLOR_MAPPING[normalized];
  }
  
  // Partial match
  for (const [key, hex] of Object.entries(FORMFUTURA_COLOR_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return hex;
    }
  }
  
  return null;
}

// ============================================================================
// MAIN ENRICHMENT
// ============================================================================

export interface FormFuturaEnrichmentResult {
  tdsUrl: string | null;
  finishType: FinishType;
  material: string | null;
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  printSpeedMax: number | null;
  requiresEnclosure: boolean;
  isAbrasive: boolean;
  highSpeedCapable: boolean;
  productLineId: string;
}

export function enrichFormFuturaProduct(title: string, existingMaterial?: string | null): FormFuturaEnrichmentResult {
  const material = existingMaterial || normalizeFormFuturaMaterial(title);
  const settings = getFormFuturaPrintSettings(title, material);
  const tds = matchFormFuturaTds(title);
  
  return {
    tdsUrl: tds?.url || null,
    finishType: extractFormFuturaFinishType(title),
    material,
    nozzleTempMin: settings?.nozzleTempMin || null,
    nozzleTempMax: settings?.nozzleTempMax || null,
    bedTempMin: settings?.bedTempMin || null,
    bedTempMax: settings?.bedTempMax || null,
    printSpeedMax: settings?.printSpeedMax || null,
    requiresEnclosure: settings?.requiresEnclosure || false,
    isAbrasive: settings?.isAbrasive || false,
    highSpeedCapable: settings?.highSpeedCapable || false,
    productLineId: generateFormFuturaProductLineId(title, material),
  };
}

// ============================================================================
// WEIGHT EXTRACTION
// ============================================================================

export function extractFormFuturaWeight(title: string, variant?: string): number {
  const text = `${title} ${variant || ''}`.toLowerCase();
  
  // Check for kg weights first
  const kgMatch = text.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (kgMatch) {
    return parseFloat(kgMatch[1]) * 1000;
  }
  
  // Check for gram weights
  const gMatch = text.match(/(\d+)\s*g(?:ram)?/i);
  if (gMatch) {
    return parseInt(gMatch[1], 10);
  }
  
  // Default to 750g (FormFutura standard spool)
  return 750;
}

// ============================================================================
// FORMAT FLAGS
// ============================================================================

export function isFormFuturaRefill(title: string, variant?: string): boolean {
  const text = `${title} ${variant || ''}`.toLowerCase();
  return /refill|coil(?!.*spool)|masterfile/i.test(text);
}

export function isFormFuturaBambuCompatible(title: string, variant?: string): boolean {
  const text = `${title} ${variant || ''}`.toLowerCase();
  return /bambu|bbl/i.test(text);
}

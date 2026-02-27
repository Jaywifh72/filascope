/**
 * FORMFUTURA-SPECIFIC DEFAULTS
 * 
 * Premium Dutch manufacturer with RAL-style color naming,
 * high-precision engineering materials, and eco-friendly ReFill system.
 * 
 * Version: 2026-01-09-v2 (CSV-seeded architecture)
 */

export const FORMFUTURA_DEFAULTS_VERSION = '2026-01-09-v2';

// ============================================================================
// TDS URL PATTERNS - Official FormFutura download URLs
// ============================================================================

export const FORMFUTURA_TDS_PATTERNS: Record<string, string> = {
  // PLA Family - Official URLs
  'EASYFIL EPLA': 'https://www.formfutura.com/web/content/256521?download=true',
  'EPLA': 'https://www.formfutura.com/web/content/256521?download=true',
  'BULK PLA': 'https://www.formfutura.com/web/content/273966?download=true',
  'REFORM RPLA': 'https://www.formfutura.com/web/content/256632?download=true',
  'REFORM - RPLA': 'https://www.formfutura.com/web/content/256632?download=true',
  'REFILL PLA': 'https://www.formfutura.com/web/content/256626?download=true',
  'PREMIUM PLA': 'https://www.formfutura.com/web/content/256613?download=true',
  'TOUGH PLA': 'https://www.formfutura.com/web/content/256649?download=true',
  'PREMIUM PLA FLAME RETARDANT': 'https://www.formfutura.com/web/content/256617?download=true',
  'PREMIUM PLA CF03': 'https://www.formfutura.com/web/content/256615?download=true',
  'PLA CF03': 'https://www.formfutura.com/web/content/256615?download=true',
  'VOLCANO PLA 150C': 'https://www.formfutura.com/web/content/275229?download=true',
  'VOLCANO PLA': 'https://www.formfutura.com/web/content/256653?download=true',
  'MATT PLA': 'https://www.formfutura.com/web/content/256590?download=true',
  'MATTE PLA': 'https://www.formfutura.com/web/content/256590?download=true',
  'HIGH GLOSS PLA': 'https://www.formfutura.com/web/content/256566?download=true',
  'HIGH GLOSS PLA COLORMORPH': 'https://www.formfutura.com/web/content/256568?download=true',
  'COLORMORPH': 'https://www.formfutura.com/web/content/256568?download=true',
  'GALAXY PLA': 'https://www.formfutura.com/web/content/256560?download=true',
  'REFORM ORGANIC RPLA': 'https://www.formfutura.com/web/content/256627?download=true',
  'REFORM - ORGANIC RPLA': 'https://www.formfutura.com/web/content/256627?download=true',
  
  // Specialty - Official URLs
  'STONEFIL': 'https://www.formfutura.com/web/content/256646?download=true',
  'EASYWOOD': 'https://www.formfutura.com/web/content/256523?download=true',
  'METALFIL - CLASSIC COPPER': 'https://www.formfutura.com/web/content/256597?download=true',
  'METALFIL CLASSIC COPPER': 'https://www.formfutura.com/web/content/256597?download=true',
  'METALFIL - ANCIENT BRONZE': 'https://www.formfutura.com/web/content/256594?download=true',
  'METALFIL ANCIENT BRONZE': 'https://www.formfutura.com/web/content/256594?download=true',
  'METALFIL - BRASS': 'https://www.formfutura.com/web/content/256596?download=true',
  'METALFIL BRASS': 'https://www.formfutura.com/web/content/256596?download=true',
  
  // Legacy fallback patterns for other product lines
  'HDGLASS': 'https://www.formfutura.com/datasheets/hdglass-tds.pdf',
  'HD GLASS': 'https://www.formfutura.com/datasheets/hdglass-tds.pdf',
  'REFORM RPETG': 'https://www.formfutura.com/datasheets/reform-rpetg-tds.pdf',
  'BULK PETG': 'https://www.formfutura.com/datasheets/bulk-petg-tds.pdf',
  'APOLLOX CF10': 'https://3d.nice-cdn.com/upload/file/formfutura-tds-apolloxcf10.pdf',
  'APOLLOX': 'https://www.formfutura.com/datasheets/apollox-tds.pdf',
  'CLEARSCENT ABS': 'https://www.formfutura.com/datasheets/clearscent-abs-tds.pdf',
  'STYX PA6-GF30': 'https://www.formfutura.com/datasheets/styx-pa6-gf30-tds.pdf',
  'STYX PA6 GF30': 'https://www.formfutura.com/datasheets/styx-pa6-gf30-tds.pdf',
  'STYX PA6': 'https://3d.nice-cdn.com/upload/file/formfutura-tds-styxpa6.pdf',
  'LUVOCOM': 'https://www.formfutura.com/datasheets/luvocom-3f-paht-cf-9891-tds.pdf',
  'PAHT CF': 'https://www.formfutura.com/datasheets/luvocom-3f-paht-cf-9891-tds.pdf',
  'CENTAUR PP': 'https://www.formfutura.com/datasheets/centaur-pp-tds.pdf',
  'PYTHON FLEX 90A': 'https://www.formfutura.com/datasheets/python-flex-90a-tds.pdf',
  'PYTHONFLEX 90A': 'https://www.formfutura.com/datasheets/python-flex-90a-tds.pdf',
  'PYTHON FLEX 98A': 'https://www.formfutura.com/datasheets/python-flex-98a-tds.pdf',
  'PYTHONFLEX 98A': 'https://www.formfutura.com/datasheets/python-flex-98a-tds.pdf',
  'BIOFIL PCL': 'https://www.formfutura.com/datasheets/biofil-pcl-tds.pdf',
  'PCL': 'https://www.formfutura.com/datasheets/biofil-pcl-tds.pdf',
  'HIPS': 'https://www.formfutura.com/datasheets/easyfil-hips-tds.pdf',
  'PVA': 'https://www.formfutura.com/datasheets/helios-pva-tds.pdf',
  'GLOW PLA': 'https://www.formfutura.com/datasheets/glow-pla-tds.pdf',
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
  'ATHENAX': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'ATHENAX CF10': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true, isAbrasive: true },
  'ATHENAX GF10': { nozzleTempMin: 235, nozzleTempMax: 255, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true, isAbrasive: true },
  'PREMIUM ASA': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'RAPOLLO': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  
  // ABS
  'CLEARSCENT ABS': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'TITANX': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'ABSPRO': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  
  // PA/Nylon
  'STYX PA6': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 80, bedTempMax: 100, requiresEnclosure: true },
  'STYX PA6-GF30': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 80, bedTempMax: 100, requiresEnclosure: true, isAbrasive: true },
  'STYX PA6-CF15': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 80, bedTempMax: 100, requiresEnclosure: true, isAbrasive: true },
  
  // High-performance
  'LUVOCOM': { nozzleTempMin: 280, nozzleTempMax: 320, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true, isAbrasive: true },
  'PAHT CF': { nozzleTempMin: 280, nozzleTempMax: 320, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true, isAbrasive: true },
  'CENTAUR PP': { nozzleTempMin: 200, nozzleTempMax: 220, bedTempMin: 60, bedTempMax: 80 },
  
  // Flexible
  'PYTHON FLEX 90A': { nozzleTempMin: 220, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 60, printSpeedMax: 40 },
  'PYTHON FLEX 98A': { nozzleTempMin: 220, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 60, printSpeedMax: 40 },
  'FLEXIFIL TPC': { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 40, bedTempMax: 60, printSpeedMax: 40 },
  
  // Specialty
  'BIOFIL PCL': { nozzleTempMin: 55, nozzleTempMax: 80, bedTempMin: 0, bedTempMax: 30 },
  'HIPS': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'PVA': { nozzleTempMin: 190, nozzleTempMax: 210, bedTempMin: 45, bedTempMax: 60 },
  'METALFIL': { nozzleTempMin: 195, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'STONEFIL': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60, isAbrasive: true },
  'CARBONFIL': { nozzleTempMin: 225, nozzleTempMax: 245, bedTempMin: 80, bedTempMax: 90, isAbrasive: true },
  'KRATOS PC': { nozzleTempMin: 250, nozzleTempMax: 280, bedTempMin: 100, bedTempMax: 120, requiresEnclosure: true },
  
  // Generic fallbacks
  'PLA': { nozzleTempMin: 190, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60 },
  'PETG': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 90 },
  'ABS': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'ASA': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'TPU': { nozzleTempMin: 220, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 60, printSpeedMax: 40 },
  'TPC': { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 40, bedTempMax: 60, printSpeedMax: 40 },
  'PA': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 80, bedTempMax: 100, requiresEnclosure: true },
  'PC': { nozzleTempMin: 250, nozzleTempMax: 280, bedTempMin: 100, bedTempMax: 120, requiresEnclosure: true },
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
  
  // Carbon/Glass fiber composites
  if (/apollox[- ]?cf|athenax[- ]?cf|asa[- ]?cf/i.test(t)) return 'ASA-CF';
  if (/athenax[- ]?gf|asa[- ]?gf/i.test(t)) return 'ASA-GF';
  if (/premium[- ]?pla[- ]?cf|pla[- ]?cf/i.test(t)) return 'PLA-CF';
  if (/pa6?[- ]?gf|styx.*gf/i.test(t)) return 'PA-GF';
  if (/pa[- ]?cf|nylon[- ]?cf|styx.*cf/i.test(t)) return 'PA-CF';
  if (/pc[- ]?cf|kratos.*cf/i.test(t)) return 'PC-CF';
  if (/carbonfil/i.test(t)) return 'PETG-CF';
  
  // Nylon/PA
  if (/styx|pa6|nylon/i.test(t)) return 'PA';
  
  // ASA (must be after ASA-CF/GF checks)
  if (/apollox|athenax|rapollo/i.test(t)) return 'ASA';
  if (/premium[- ]?asa/i.test(t)) return 'ASA';
  
  // ABS (TitanX is ABS-based)
  if (/titanx/i.test(t)) return 'ABS';
  if (/clearscent|abspro/i.test(t)) return 'ABS';
  if (/\babs\b/i.test(t)) return 'ABS';
  
  // PETG variants
  if (/hdglass|hd[- ]?glass/i.test(t)) return 'PETG';
  if (/petg/i.test(t)) return 'PETG';
  
  // TPU/Flexible
  if (/python[- ]?flex.*90a/i.test(t)) return 'TPU-90A';
  if (/python[- ]?flex.*98a/i.test(t)) return 'TPU-98A';
  if (/python[- ]?flex|tpu/i.test(t)) return 'TPU';
  if (/flexifil|tpc/i.test(t)) return 'TPC';
  
  // Specialty
  if (/metalfil/i.test(t)) return 'PLA-Metal';
  if (/stonefil/i.test(t)) return 'PLA-Stone';
  if (/easywood|biofil.*wood/i.test(t)) return 'PLA-Wood';
  if (/biofil[- ]?pcl|pcl/i.test(t)) return 'PCL';
  if (/centaur|polypropylene|\bpp\b/i.test(t)) return 'PP';
  if (/kratos|\bpc\b/i.test(t)) return 'PC';
  if (/hips/i.test(t)) return 'HIPS';
  if (/pva|aquasolve/i.test(t)) return 'PVA';
  if (/bvoh/i.test(t)) return 'BVOH';
  if (/atlas.*support/i.test(t)) return 'PVA';
  
  // Recycled materials  
  if (/reform.*rpet(?!g)/i.test(t)) return 'rPET';
  if (/reform.*rtitan/i.test(t)) return 'rABS';
  if (/reform.*rtpu/i.test(t)) return 'rTPU';
  if (/reform.*rpetg|recycled.*petg|rpetg/i.test(t)) return 'rPETG';
  
  // PLA variants (check last since many products contain "PLA")
  if (/volcano[- ]?pla/i.test(t)) return 'PLA';
  if (/tough[- ]?pla/i.test(t)) return 'PLA+';
  if (/reform.*rpla|recycled.*pla|rpla/i.test(t)) return 'rPLA';
  if (/epla|easyfil|premium[- ]?pla|matt[- ]?pla|matte[- ]?pla|galaxy[- ]?pla|glow[- ]?pla|high[- ]?gloss[- ]?pla|colormorph|\bpla\b/i.test(t)) return 'PLA';
  
  // Refill system
  if (/refill.*system/i.test(t)) return 'Other';
  
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
  if (/high[- ]?gloss[- ]?pla.*colormorph/i.test(t)) return `formfutura__pla__colormorph`;
  if (/high[- ]?gloss[- ]?pla/i.test(t)) return `formfutura__pla__high-gloss-pla`;
  if (/galaxy[- ]?pla/i.test(t)) return `formfutura__pla__galaxy-pla`;
  if (/glow.*pla|pla.*glow/i.test(t)) return `formfutura__pla__glow-pla`;
  if (/reform.*organic.*rpla/i.test(t)) return `formfutura__rpla__reform-organic`;
  if (/reform.*rpla|rpla/i.test(t)) return `formfutura__rpla__reform`;
  if (/refill[- ]?pla/i.test(t)) return `formfutura__pla__refill`;
  if (/bulk[- ]?pla/i.test(t)) return `formfutura__pla__bulk`;
  if (/premium[- ]?pla[- ]?cf/i.test(t)) return `formfutura__pla-cf__premium-cf03`;
  if (/premium[- ]?pla.*flame/i.test(t)) return `formfutura__pla__premium-flame-retardant`;
  if (/premium[- ]?pla/i.test(t)) return `formfutura__pla__premium`;
  
  // PETG lines
  if (/hdglass.*blinded|hd[- ]?glass.*blinded/i.test(t)) return `formfutura__petg__hdglass-blinded`;
  if (/hdglass|hd[- ]?glass/i.test(t)) return `formfutura__petg__hdglass`;
  if (/easyfil[- ]?epetg|epetg/i.test(t)) return `formfutura__petg__easyfil-epetg`;
  if (/refill[- ]?petg/i.test(t)) return `formfutura__petg__refill`;
  if (/reform.*rpetg|rpetg/i.test(t)) return `formfutura__rpetg__reform`;
  if (/bulk[- ]?petg/i.test(t)) return `formfutura__petg__bulk`;
  if (/premium[- ]?petg.*flame/i.test(t)) return `formfutura__petg__premium-flame-retardant`;
  
  // ASA lines
  if (/athenax[- ]?cf/i.test(t)) return `formfutura__asa-cf__athenax-cf10`;
  if (/athenax[- ]?gf/i.test(t)) return `formfutura__asa-gf__athenax-gf10`;
  if (/athenax/i.test(t)) return `formfutura__asa__athenax`;
  if (/apollox[- ]?cf/i.test(t)) return `formfutura__asa-cf__apollox-cf10`;
  if (/apollox[- ]?kevlar/i.test(t)) return `formfutura__asa-kevlar__apollox-kevlar`;
  if (/apollox.*flame/i.test(t)) return `formfutura__asa__apollox-flame-retardant`;
  if (/apollox.*foaming/i.test(t)) return `formfutura__asa__apollox-foaming`;
  if (/apollox/i.test(t)) return `formfutura__asa__apollox`;
  if (/premium[- ]?asa/i.test(t)) return `formfutura__asa__premium`;
  if (/reform.*rapollo/i.test(t)) return `formfutura__rasa__reform-rapollo`;
  
  // ABS lines
  if (/abspro.*flame/i.test(t)) return `formfutura__abs__abspro-flame-retardant`;
  if (/abspro/i.test(t)) return `formfutura__abs__abspro`;
  if (/easyfil[- ]?abs.*glow/i.test(t)) return `formfutura__abs__easyfil-glow`;
  if (/easyfil[- ]?abs/i.test(t)) return `formfutura__abs__easyfil`;
  if (/premium[- ]?abs.*medical/i.test(t)) return `formfutura__abs__premium-medical`;
  if (/clearscent/i.test(t)) return `formfutura__abs__clearscent`;
  
  // PA/Nylon lines
  if (/styx.*pa6.*gf|styx.*gf30/i.test(t)) return `formfutura__pa-gf__styx-gf30`;
  if (/styx.*pa6.*cf|styx.*cf15/i.test(t)) return `formfutura__pa-cf__styx-cf15`;
  if (/styx.*pa6|styx[- ]?pa/i.test(t)) return `formfutura__pa__styx`;
  
  // High-performance LUVOCOM lines
  if (/luvocom.*pekk/i.test(t)) return `formfutura__pekk__luvocom-pekk`;
  if (/luvocom.*peek.*cf/i.test(t)) return `formfutura__peek-cf__luvocom-peek-cf`;
  if (/luvocom.*peek/i.test(t)) return `formfutura__peek__luvocom-peek`;
  if (/luvocom.*pps.*cf/i.test(t)) return `formfutura__pps-cf__luvocom-pps-cf`;
  if (/luvocom.*pp.*cf/i.test(t)) return `formfutura__pp-cf__luvocom-pp-cf`;
  if (/luvocom.*pei/i.test(t)) return `formfutura__pei__luvocom-pei`;
  if (/luvocom.*paht.*cf.*9742/i.test(t)) return `formfutura__paht-cf__luvocom-9742`;
  if (/luvocom.*paht.*kk.*fr/i.test(t)) return `formfutura__paht-cf__luvocom-fr`;
  if (/luvocom.*paht.*9936/i.test(t)) return `formfutura__paht__luvocom-9936`;
  if (/luvocom.*paht.*9825/i.test(t)) return `formfutura__paht__luvocom-9825`;
  if (/luvocom|paht[- ]?cf/i.test(t)) return `formfutura__paht-cf__luvocom`;
  
  // PEI/ULTEM lines
  if (/pei.*ultem.*9085/i.test(t)) return `formfutura__pei__ultem-9085`;
  if (/pei.*ultem.*1010/i.test(t)) return `formfutura__pei__ultem-1010`;
  if (/pei|ultem/i.test(t)) return `formfutura__pei__ultem`;
  
  // PC lines
  if (/kratos.*pc.*cf/i.test(t)) return `formfutura__pc-cf__kratos-cf10`;
  if (/kratos.*pc|kratos/i.test(t)) return `formfutura__pc__kratos`;
  
  // TPU/TPC/Flexible lines
  if (/reform.*rtpu.*85a/i.test(t)) return `formfutura__rtpu-85a__reform`;
  if (/reform.*rtpu.*90a/i.test(t)) return `formfutura__rtpu-90a__reform`;
  if (/reform.*rtpu.*95a/i.test(t)) return `formfutura__rtpu-95a__reform`;
  if (/python[- ]?flex.*90a/i.test(t)) return `formfutura__tpu-90a__pythonflex`;
  if (/python[- ]?flex.*98a/i.test(t)) return `formfutura__tpu-98a__pythonflex`;
  if (/python[- ]?flex/i.test(t)) return `formfutura__tpu__pythonflex`;
  if (/flexifil.*tpc.*30d/i.test(t)) return `formfutura__tpc-30d__flexifil`;
  if (/flexifil.*tpc.*40d/i.test(t)) return `formfutura__tpc-40d__flexifil`;
  if (/flexifil.*tpc/i.test(t)) return `formfutura__tpc__flexifil`;
  
  // Metal lines
  if (/metalfil.*brass/i.test(t)) return `formfutura__metal__metalfil-brass`;
  if (/metalfil.*copper/i.test(t)) return `formfutura__metal__metalfil-copper`;
  if (/metalfil.*bronze/i.test(t)) return `formfutura__metal__metalfil-bronze`;
  if (/metalfil/i.test(t)) return `formfutura__metal__metalfil`;
  
  // Specialty lines
  if (/titanx/i.test(t)) return `formfutura__abs__titanx`;
  if (/ppsu/i.test(t)) return `formfutura__ppsu__ppsu`;
  if (/centaur/i.test(t)) return `formfutura__pp__centaur`;
  if (/stonefil/i.test(t)) return `formfutura__pla-stone__stonefil`;
  if (/carbonfil.*cf03/i.test(t)) return `formfutura__petg-cf__carbonfil-cf03`;
  if (/carbonfil/i.test(t)) return `formfutura__petg-cf__carbonfil`;
  if (/biofil.*wood/i.test(t)) return `formfutura__pla-wood__biofil-wood`;
  if (/easywood/i.test(t)) return `formfutura__pla-wood__easywood`;
  if (/biofil[- ]?pcl|pcl/i.test(t)) return `formfutura__pcl__biofil`;
  
  // Support lines
  if (/atlas.*support/i.test(t)) return `formfutura__support__atlas`;
  if (/aquasolve.*pva/i.test(t)) return `formfutura__pva__aquasolve`;
  if (/bvoh/i.test(t)) return `formfutura__bvoh__bvoh`;
  if (/easyfil.*hips/i.test(t)) return `formfutura__hips__easyfil`;
  if (/hips/i.test(t)) return `formfutura__hips__easyfil`;
  if (/pva|helios/i.test(t)) return `formfutura__pva__helios`;
  
  // Recycled lines
  if (/reform.*rtitan/i.test(t)) return `formfutura__recycled__reform-rtitan`;
  if (/reform.*rpet(?!g)/i.test(t)) return `formfutura__rpet__reform-rpet`;
  if (/refill[- ]?system/i.test(t)) return `formfutura__other__refill-system`;
  
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
  'pure orange': 'FF6500',  // Distinct from fluor orange (FF6700)
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
  'curry': 'CC9900',           // Yellow-brown curry color (EasyFil ePLA)
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
  
  // Luminous/Glow (distinct hex codes to avoid duplicates)
  'luminous green': '50FF50',
  'luminous bright orange': 'FF5500',  // Distinct from fluor orange
  'luminous yellow': 'CCFF00',
  'luminous blue': '00FFFF',
  'luminous red': 'FF3333',
  'glow green': '39FF14',
  'glow blue': '00BFFF',
  'glow red': 'FF6B6B',
  
  // Specialty: StoneFil (mineral/stone textures)
  'granite': '8B8589',
  'terracotta': 'E2725B',
  'concrete': 'C5C5C5',
  'pottery clay': 'C19A6B',
  
  // Specialty: EasyWood (wood tones)
  'pine': 'DEB887',
  'cedar': 'A0522D',
  'olive': '808000',
  'coconut': '8B5A2B',
  'ebony': '555D50',
  
  // Specialty: ColorMorph (temperature-changing - use primary color)
  'lava': 'FF4500',
  'ocean': '006994',
  'forest': '228B22',
  'sunset': 'FA8072',
  'aurora': '00FF7F',
  
  // Specialty: Galaxy (sparkle variants)
  'galaxy black': '1C1C1C',
  'galaxy blue': '191970',
  'galaxy green': '006400',
  'galaxy purple': '4B0082',
  'galaxy red': '8B0000',
  'galaxy silver': 'C0C0C0',
  
  // Standard/Single-color product colors
  'standard': 'D4C4A8',         // Beige/natural tone for generic "Standard" color
  'amber': 'FFBF00',            // PEI/ULTEM amber color
  'brass': 'B5A642',            // MetalFil Brass
  'classic copper': 'B87333',   // MetalFil Copper
  'ancient bronze': 'CD7F32',   // MetalFil Bronze
  'wood': 'DEB887',             // BioFil Wood (natural wood tone)
  'recycled black': '2A2A2A',
  'recycled grey': '6B6B6B',
  'recycled white': 'F0F0F0',
  'recycled blue': '4A6FA5',
  'recycled green': '4A8C4A',
  'recycled clear': 'E8E8E8',
  'recycled natural': 'E8DCC8',
  
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
  
  // PRIORITY 1: Direct/exact match
  if (FORMFUTURA_COLOR_MAPPING[normalized]) {
    return FORMFUTURA_COLOR_MAPPING[normalized];
  }
  
  // PRIORITY 2: Sorted partial match - longer keys first for more specific matches
  const sortedEntries = Object.entries(FORMFUTURA_COLOR_MAPPING)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [key, hex] of sortedEntries) {
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

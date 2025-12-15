import { Database } from "@/integrations/supabase/types";

type Filament = Database["public"]["Tables"]["filaments"]["Row"];
type Printer = Database["public"]["Tables"]["printers"]["Row"];

// ============================================
// TROUBLESHOOTING GUIDE
// ============================================

export interface TroubleshootingItem {
  id: string;
  icon: string;
  issue: string;
  tempType: 'nozzle' | 'bed';
  adjustment: number;
  additionalTips: string[];
  learnMoreUrl?: string;
}

export const TROUBLESHOOTING_GUIDE: TroubleshootingItem[] = [
  {
    id: 'stringing',
    icon: '🕸️',
    issue: 'Stringing / Oozing',
    tempType: 'nozzle',
    adjustment: -7,
    additionalTips: ['Increase retraction distance', 'Enable coasting', 'Check for wet filament'],
    learnMoreUrl: '/reference/troubleshooting/stringing',
  },
  {
    id: 'under-extrusion',
    icon: '⛔',
    issue: 'Under-extrusion / Gaps',
    tempType: 'nozzle',
    adjustment: 7,
    additionalTips: ['Check for partial clog', 'Increase flow rate 2-5%', 'Slow down print speed'],
    learnMoreUrl: '/reference/troubleshooting/under-extrusion',
  },
  {
    id: 'warping',
    icon: '📐',
    issue: 'Warping / Corner Lifting',
    tempType: 'bed',
    adjustment: 7,
    additionalTips: ['Check for drafts', 'Add brim or raft', 'Use enclosure'],
    learnMoreUrl: '/reference/troubleshooting/warping',
  },
  {
    id: 'layer-adhesion',
    icon: '🧱',
    issue: 'Poor Layer Adhesion',
    tempType: 'nozzle',
    adjustment: 7,
    additionalTips: ['Reduce fan speed', 'Slow down print', 'Check layer height'],
    learnMoreUrl: '/reference/troubleshooting/layer-adhesion',
  },
  {
    id: 'surface-finish',
    icon: '🎨',
    issue: 'Poor Surface Finish',
    tempType: 'nozzle',
    adjustment: -5,
    additionalTips: ['Increase fan speed', 'Reduce print speed', 'Check belt tension'],
    learnMoreUrl: '/reference/troubleshooting/surface-finish',
  },
  {
    id: 'bubbling',
    icon: '💧',
    issue: 'Bubbling / Popping Sounds',
    tempType: 'nozzle',
    adjustment: 0,
    additionalTips: ['Filament is wet! Dry before printing', 'Not a temperature issue', 'Store filament properly'],
    learnMoreUrl: '/reference/troubleshooting/wet-filament',
  },
];

// ============================================
// MATERIAL TEMPERATURE NOTES
// ============================================

export interface MaterialTemperatureNote {
  generalTip: string;
  firstLayers: { count: number; adjustment: number; reason: string };
  lastLayers: { count: number; adjustment: number; reason: string };
  highSpeed?: { threshold: number; adjustment: number };
  specificNotes?: string[];
}

export const MATERIAL_TEMP_NOTES: Record<string, MaterialTemperatureNote> = {
  'PLA': {
    generalTip: 'PLA prints well at lower temperatures. Excess heat causes stringing and poor overhangs.',
    firstLayers: { count: 2, adjustment: 5, reason: 'Better bed adhesion' },
    lastLayers: { count: 3, adjustment: -5, reason: 'Cleaner top surface' },
    highSpeed: { threshold: 80, adjustment: 10 },
    specificNotes: ['Watch for heat creep in long prints', 'Active cooling essential after first layers'],
  },
  'PLA+': {
    generalTip: 'PLA+ benefits from slightly higher temps than standard PLA for improved layer bonding.',
    firstLayers: { count: 2, adjustment: 5, reason: 'Better bed adhesion' },
    lastLayers: { count: 3, adjustment: -5, reason: 'Reduced stringing on finish' },
    highSpeed: { threshold: 80, adjustment: 10 },
    specificNotes: ['Higher temps (215-220°C) improve toughness', 'Can handle faster speeds than standard PLA'],
  },
  'PETG': {
    generalTip: 'PETG requires higher temperatures and is prone to stringing. Reduce retraction aggressiveness.',
    firstLayers: { count: 2, adjustment: 5, reason: 'Improved adhesion to bed' },
    lastLayers: { count: 5, adjustment: -5, reason: 'Better surface finish' },
    highSpeed: { threshold: 60, adjustment: 10 },
    specificNotes: ['Reduce fan to 50% max', 'Too hot causes stringing, too cold causes layer separation'],
  },
  'ABS': {
    generalTip: 'ABS needs consistent high temperatures and enclosed printing for best results.',
    firstLayers: { count: 3, adjustment: 5, reason: 'Critical for adhesion' },
    lastLayers: { count: 0, adjustment: 0, reason: 'Maintain temp throughout' },
    highSpeed: { threshold: 60, adjustment: 10 },
    specificNotes: ['Enclosure strongly recommended', 'Avoid drafts completely', 'ABS juice helps adhesion'],
  },
  'ASA': {
    generalTip: 'ASA prints similarly to ABS but with better UV resistance. Enclosure recommended.',
    firstLayers: { count: 3, adjustment: 5, reason: 'Improved first layer adhesion' },
    lastLayers: { count: 0, adjustment: 0, reason: 'Maintain consistent temp' },
    highSpeed: { threshold: 60, adjustment: 10 },
    specificNotes: ['Less warping than ABS', 'Still benefits from enclosure', 'Good for outdoor parts'],
  },
  'TPU': {
    generalTip: 'TPU requires slow speeds and careful temperature control. Direct drive extruder preferred.',
    firstLayers: { count: 2, adjustment: 5, reason: 'Better adhesion' },
    lastLayers: { count: 0, adjustment: 0, reason: 'Maintain flexibility' },
    highSpeed: { threshold: 30, adjustment: 5 },
    specificNotes: ['Print SLOW (20-30mm/s)', 'Disable retraction or use minimal', 'Bowden setups struggle'],
  },
  'NYLON': {
    generalTip: 'Nylon absorbs moisture rapidly. Always dry before printing and use enclosure.',
    firstLayers: { count: 3, adjustment: 10, reason: 'Critical for bed adhesion' },
    lastLayers: { count: 0, adjustment: 0, reason: 'Maintain strength' },
    highSpeed: { threshold: 50, adjustment: 10 },
    specificNotes: ['Dry at 70°C for 6+ hours before use', 'Garolite/G10 bed surface works best', 'Warps significantly without enclosure'],
  },
  'PC': {
    generalTip: 'Polycarbonate requires very high temperatures and enclosed printing environment.',
    firstLayers: { count: 3, adjustment: 10, reason: 'Essential for adhesion' },
    lastLayers: { count: 0, adjustment: 0, reason: 'Maintain throughout' },
    highSpeed: { threshold: 40, adjustment: 10 },
    specificNotes: ['All-metal hotend required', 'Enclosure mandatory', 'Extremely prone to warping'],
  },
};

// ============================================
// SPEED-TEMPERATURE RELATIONSHIP
// ============================================

export interface SpeedTempRecommendation {
  minSpeed: number;
  maxSpeed: number;
  tempAdjustment: number;
  note: string;
}

export const SPEED_TEMP_BRACKETS: SpeedTempRecommendation[] = [
  { minSpeed: 0, maxSpeed: 40, tempAdjustment: -5, note: 'Detail-focused printing - lower temp for precision' },
  { minSpeed: 40, maxSpeed: 80, tempAdjustment: 0, note: 'Balanced printing - standard temperature works well' },
  { minSpeed: 80, maxSpeed: 150, tempAdjustment: 7, note: 'Higher flow rate needed - increase temp for flow' },
  { minSpeed: 150, maxSpeed: 999, tempAdjustment: 12, note: 'Maximum flow - ensure hotend can keep up' },
];

export function getSpeedTempRecommendation(baseTemp: number, speed: number): { min: number; max: number; note: string } {
  const bracket = SPEED_TEMP_BRACKETS.find(b => speed >= b.minSpeed && speed < b.maxSpeed) || SPEED_TEMP_BRACKETS[1];
  return {
    min: baseTemp + bracket.tempAdjustment,
    max: baseTemp + bracket.tempAdjustment + 5,
    note: bracket.note,
  };
}

// ============================================
// ENVIRONMENT/SEASONAL ADJUSTMENTS
// ============================================

export interface EnvironmentAdjustment {
  id: 'cold' | 'normal' | 'hot';
  label: string;
  tempRange: string;
  nozzleAdjust: number;
  bedAdjust: number;
  fanAdjust: number;
  tips: string[];
}

export const ENVIRONMENT_ADJUSTMENTS: EnvironmentAdjustment[] = [
  {
    id: 'cold',
    label: 'Cold',
    tempRange: '<18°C',
    nozzleAdjust: 5,
    bedAdjust: 10,
    fanAdjust: -10,
    tips: ['Allow longer warm-up time', 'Consider using enclosure or draft shield', 'First layer may need extra adhesion help'],
  },
  {
    id: 'normal',
    label: 'Normal',
    tempRange: '18-26°C',
    nozzleAdjust: 0,
    bedAdjust: 0,
    fanAdjust: 0,
    tips: ['Standard settings should work well', 'No adjustments needed'],
  },
  {
    id: 'hot',
    label: 'Hot',
    tempRange: '>26°C',
    nozzleAdjust: -5,
    bedAdjust: -5,
    fanAdjust: 15,
    tips: ['Increase cooling fan speed', 'Watch for heat creep with PLA', 'May need to slow down prints'],
  },
];

// ============================================
// EXISTING TYPES
// ============================================

export interface CompatibilityStatus {
  status: 'fully_compatible' | 'requires_upgrade' | 'not_recommended';
  requirements: string[];
  message: string;
}

export interface QuickStartSettings {
  nozzleTemp: number;
  nozzleTempRange: [number, number];
  bedTemp: number;
  bedTempRange: [number, number];
  printSpeed: string;
  buildSurface: {
    recommended: string;
    alternatives: string[];
  };
}

export interface TemperatureGuidance {
  nozzle: {
    recommended: number;
    range: [number, number];
    guidance: {
      low: string;
      middle: string;
      high: string;
    };
  };
  bed: {
    recommended: number;
    range: [number, number];
    guidance: {
      firstLayer: string;
      remaining: string;
    };
  };
  advanced: {
    chamber: { required: boolean; recommended?: [number, number] };
    cooling: string;
    bridging: string;
    overhang: string;
  };
}

export interface PrintSettingsData {
  printerModel: string;
  printerBrand: string;
  compatibility: CompatibilityStatus;
  quickStart: QuickStartSettings;
  temperature: TemperatureGuidance;
  warnings: Array<{
    type: 'notice' | 'requirement';
    icon: string;
    message: string;
    link?: string;
  }>;
  additionalSettings: {
    maxSpeed: string;
    acceleration?: string;
    retraction?: string;
    minLayerTime?: string;
    autoBedLevel?: boolean;
    zHop?: string;
    cooling: string;
  };
}

// Build surface recommendations by material
const BUILD_SURFACE_RECOMMENDATIONS: Record<string, { recommended: string; alternatives: string[] }> = {
  'PLA': { recommended: 'Textured PEI', alternatives: ['Smooth PEI', 'Glass', 'BuildTak'] },
  'PLA+': { recommended: 'Textured PEI', alternatives: ['Smooth PEI', 'Glass', 'BuildTak'] },
  'PETG': { recommended: 'Textured PEI', alternatives: ['Smooth PEI', 'Glass (with glue)'] },
  'ABS': { recommended: 'Smooth PEI', alternatives: ['Textured PEI', 'Glass (with ABS slurry)'] },
  'ASA': { recommended: 'Smooth PEI', alternatives: ['Textured PEI', 'Glass'] },
  'TPU': { recommended: 'Smooth PEI', alternatives: ['Glass', 'Textured PEI'] },
  'Nylon': { recommended: 'Garolite (G10)', alternatives: ['Glass (with glue)', 'Textured PEI'] },
  'PC': { recommended: 'Smooth PEI', alternatives: ['Garolite', 'Glass'] },
  'PEEK': { recommended: 'PEI Sheet', alternatives: ['Garolite'] },
  'default': { recommended: 'Textured PEI', alternatives: ['Smooth PEI', 'Glass'] },
};

// Material-specific quick tips
export const MATERIAL_TIPS: Record<string, string[]> = {
  'PLA': [
    'First layer: Print 5-10°C hotter for better adhesion',
    'Bridging: Reduce temp by 5-10°C for cleaner bridges',
    'Stringing issues: Lower temp by 5°C',
  ],
  'PETG': [
    'First layer: Use higher Z-offset to prevent sticking too well',
    'Enable "Avoid crossing perimeters" to reduce stringing',
    'Print slower than PLA for best quality',
  ],
  'ABS': [
    'Enclosure required: Keep at 40-60°C chamber temp',
    'First layer: Disable cooling fan completely',
    'Use ABS slurry or glue stick for large prints',
  ],
  'ASA': [
    'Enclosure recommended for best results',
    'Less prone to warping than ABS but still needs heat',
    'Excellent UV resistance for outdoor prints',
  ],
  'TPU': [
    'Print very slowly: 20-30mm/s for best quality',
    'Disable retraction or use minimal (0.5-1mm)',
    'Direct drive extruder strongly recommended',
  ],
  'Nylon': [
    'Dry thoroughly before printing (4-6 hours at 70°C)',
    'Use Garolite or glue stick for adhesion',
    'Enclosure helps prevent warping',
  ],
  'PC': [
    'All-metal hotend required (prints at 260-300°C)',
    'Heated enclosure strongly recommended (50-70°C)',
    'Dry thoroughly: extremely hygroscopic',
  ],
  'default': [
    'First layer: Print 5-10°C hotter for better adhesion',
    'Check manufacturer TDS for optimal settings',
    'Dry filament if you notice bubbling or stringing',
  ],
};

function getMaterialCategory(material: string | null): string {
  if (!material) return 'default';
  const upper = material.toUpperCase();
  if (upper.includes('PLA') && !upper.includes('PLUS')) return 'PLA';
  if (upper.includes('PLA+') || upper.includes('PLA PLUS')) return 'PLA+';
  if (upper.includes('PETG')) return 'PETG';
  if (upper.includes('ABS') && !upper.includes('ASA')) return 'ABS';
  if (upper.includes('ASA')) return 'ASA';
  if (upper.includes('TPU') || upper.includes('TPE')) return 'TPU';
  if (upper.includes('NYLON') || upper.includes('PA')) return 'Nylon';
  if (upper.includes('PC') || upper.includes('POLYCARBONATE')) return 'PC';
  if (upper.includes('PEEK') || upper.includes('PEKK') || upper.includes('PEI')) return 'PEEK';
  return 'default';
}

function getRecommendedSpeed(filament: Filament, printer: Printer | null): string {
  const maxSpeed = filament.print_speed_max_mms;
  if (!maxSpeed) return '40-60 mm/s';
  
  // Use printer's recommended quality speed if available
  const qualitySpeed = printer?.recommended_quality_speed_mms;
  if (qualitySpeed) {
    const minSpeed = Math.round(qualitySpeed * 0.8);
    const maxRecommended = Math.min(qualitySpeed, maxSpeed);
    return `${minSpeed}-${maxRecommended} mm/s`;
  }
  
  // Default recommendation based on material
  const category = getMaterialCategory(filament.material);
  if (category === 'TPU') return '20-40 mm/s';
  if (category === 'PETG') return '40-60 mm/s';
  if (category === 'ABS' || category === 'ASA') return '40-60 mm/s';
  return '45-60 mm/s';
}

export function generatePrintSettingsData(
  filament: Filament,
  printer: Printer | null,
  printerBrand: string | null,
  compatibility: { is_supported: boolean; ease_rating: string; limitations: string[]; recommendations: string[] } | null
): PrintSettingsData {
  const materialCategory = getMaterialCategory(filament.material);
  
  // Calculate single recommended temperatures
  const nozzleMin = filament.nozzle_temp_min_c || 190;
  const nozzleMax = filament.nozzle_temp_max_c || 220;
  const nozzleRecommended = filament.nozzle_temp_sweetspot_c || Math.round((nozzleMin + nozzleMax) / 2);
  
  const bedMin = filament.bed_temp_min_c || 50;
  const bedMax = filament.bed_temp_max_c || 70;
  const bedRecommended = Math.round((bedMin + bedMax) / 2);
  
  // Determine compatibility status
  let compatibilityStatus: CompatibilityStatus;
  if (!compatibility) {
    compatibilityStatus = {
      status: 'fully_compatible',
      requirements: [],
      message: 'Compatible with most printers',
    };
  } else if (compatibility.is_supported && compatibility.ease_rating === 'Easy') {
    compatibilityStatus = {
      status: 'fully_compatible',
      requirements: [],
      message: 'Fully compatible with your printer',
    };
  } else if (compatibility.is_supported) {
    compatibilityStatus = {
      status: 'requires_upgrade',
      requirements: compatibility.limitations,
      message: compatibility.ease_rating === 'Medium' 
        ? 'Compatible with some considerations'
        : 'Requires upgrades for best results',
    };
  } else {
    compatibilityStatus = {
      status: 'not_recommended',
      requirements: compatibility.limitations,
      message: 'Not recommended for this printer',
    };
  }
  
  // Build surface recommendation
  const buildSurface = BUILD_SURFACE_RECOMMENDATIONS[materialCategory] || BUILD_SURFACE_RECOMMENDATIONS['default'];
  
  // Temperature guidance
  const nozzleLow = Math.round(nozzleMin + (nozzleMax - nozzleMin) * 0.25);
  const nozzleHigh = Math.round(nozzleMin + (nozzleMax - nozzleMin) * 0.75);
  
  // Warnings
  const warnings: PrintSettingsData['warnings'] = [];
  
  // Check if material is officially supported
  if (printer) {
    const supportedMaterials = printer.official_supported_materials?.toLowerCase() || '';
    const materialLower = filament.material?.toLowerCase() || '';
    if (supportedMaterials && !supportedMaterials.includes(materialLower.split('-')[0])) {
      warnings.push({
        type: 'notice',
        icon: '⚠️',
        message: 'Material not officially listed as supported by printer manufacturer. Settings based on community testing.',
      });
    }
  }
  
  // Check for special requirements
  if (filament.is_nozzle_abrasive) {
    warnings.push({
      type: 'requirement',
      icon: '🔧',
      message: 'Requires hardened steel or ruby nozzle (material is abrasive)',
    });
  }
  
  if (materialCategory === 'ABS' || materialCategory === 'ASA' || materialCategory === 'PC' || materialCategory === 'Nylon') {
    if (!printer?.has_enclosure) {
      warnings.push({
        type: 'requirement',
        icon: '🔧',
        message: 'Enclosure recommended for best results with this material',
      });
    }
  }
  
  if ((nozzleMax || 0) > 260 && printer?.max_nozzle_temp_c && printer.max_nozzle_temp_c < (nozzleMax || 0)) {
    warnings.push({
      type: 'requirement',
      icon: '🔧',
      message: 'Requires all-metal hotend for high temperature printing',
    });
  }

  // Cooling recommendations
  const fanMin = filament.fan_min_percent ?? 0;
  const fanMax = filament.fan_max_percent ?? 100;
  let coolingStr = `${fanMin}-${fanMax}%`;
  if (materialCategory === 'ABS' || materialCategory === 'ASA') {
    coolingStr = '0% first layers, 30-50% after';
  } else if (materialCategory === 'PETG') {
    coolingStr = '50-80% after layer 2';
  } else if (materialCategory === 'PLA') {
    coolingStr = '100% after first layer';
  }

  return {
    printerModel: printer?.model_name || 'Generic Printer',
    printerBrand: printerBrand || '',
    compatibility: compatibilityStatus,
    quickStart: {
      nozzleTemp: nozzleRecommended,
      nozzleTempRange: [nozzleMin, nozzleMax],
      bedTemp: bedRecommended,
      bedTempRange: [bedMin, bedMax],
      printSpeed: getRecommendedSpeed(filament, printer),
      buildSurface,
    },
    temperature: {
      nozzle: {
        recommended: nozzleRecommended,
        range: [nozzleMin, nozzleMax],
        guidance: {
          low: `Lower temps (${nozzleMin}-${nozzleLow}°C): Better detail, less stringing, potential under-extrusion`,
          middle: `Optimal (${nozzleLow}-${nozzleHigh}°C): Balanced strength and quality — start here`,
          high: `Higher temps (${nozzleHigh}-${nozzleMax}°C): Stronger layer adhesion, faster flow, risk of stringing`,
        },
      },
      bed: {
        recommended: bedRecommended,
        range: [bedMin, bedMax],
        guidance: {
          firstLayer: `${bedMax}°C for first layer — better adhesion`,
          remaining: `${bedRecommended}°C for remaining layers — prevents warping`,
        },
      },
      advanced: {
        chamber: {
          required: materialCategory === 'ABS' || materialCategory === 'PC' || materialCategory === 'Nylon',
          recommended: materialCategory === 'ABS' ? [40, 60] : materialCategory === 'PC' ? [50, 70] : undefined,
        },
        cooling: coolingStr,
        bridging: '-5 to -10°C from base temp',
        overhang: '-5°C from base temp',
      },
    },
    warnings,
    additionalSettings: {
      maxSpeed: filament.print_speed_max_mms ? `${filament.print_speed_max_mms} mm/s` : 'See manufacturer specs',
      cooling: coolingStr,
      retraction: materialCategory === 'TPU' ? '0-1mm @ 20mm/s' : '0.4-0.8mm @ 35-45mm/s',
      minLayerTime: '5-10 seconds',
      zHop: filament.is_nozzle_abrasive ? '0.3-0.4mm' : '0.2mm',
    },
  };
}

export function getMaterialTips(material: string | null): string[] {
  const category = getMaterialCategory(material);
  return MATERIAL_TIPS[category] || MATERIAL_TIPS['default'];
}

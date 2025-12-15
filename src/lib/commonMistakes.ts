export interface CommonMistake {
  id: string;
  mistake: string;
  consequence: string;
  fix: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  icon?: string;
}

export const SEVERITY_CONFIG = {
  critical: { label: 'Critical', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  error: { label: 'Serious', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  warning: { label: 'Warning', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  info: { label: 'Tip', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
};

export const COMMON_MISTAKES: Record<string, CommonMistake[]> = {
  'PLA': [
    {
      id: 'pla_too_hot',
      mistake: 'Printing above 230°C',
      consequence: 'Causes heat creep, clogs, and poor surface quality with glossy appearance',
      fix: 'Keep nozzle temp between 190-220°C for standard PLA',
      severity: 'warning',
    },
    {
      id: 'pla_no_cooling',
      mistake: 'Printing without part cooling fan',
      consequence: 'Overhangs droop, small details melt, poor bridging performance',
      fix: 'Use 100% cooling after the first 2-3 layers for PLA',
      severity: 'error',
    },
    {
      id: 'pla_too_fast_first_layer',
      mistake: 'First layer too fast',
      consequence: 'Poor bed adhesion leading to warped corners or complete detachment',
      fix: 'Print first layer at 20-30mm/s, regardless of overall print speed',
      severity: 'warning',
    },
    {
      id: 'pla_wet_filament',
      mistake: 'Using filament without checking moisture',
      consequence: 'Popping sounds, stringing, rough surface, weak layer adhesion',
      fix: 'Dry PLA at 45-50°C for 4+ hours if stored unsealed for weeks',
      severity: 'info',
    },
  ],
  
  'PETG': [
    {
      id: 'petg_z_too_close',
      mistake: 'First layer too squished (Z too close)',
      consequence: 'PETG bonds too strongly to bed surface, damages PEI or tears off coating',
      fix: 'Raise Z-offset by 0.02-0.05mm compared to PLA settings',
      severity: 'error',
    },
    {
      id: 'petg_too_much_cooling',
      mistake: 'Using 100% part cooling like PLA',
      consequence: 'Weak layer adhesion, parts crack or delaminate under stress',
      fix: 'Use 30-50% cooling for PETG to maintain layer bonding',
      severity: 'warning',
    },
    {
      id: 'petg_not_dried',
      mistake: 'Printing wet PETG without drying',
      consequence: 'Severe stringing, bubbles in extrusion, cloudy appearance, weak parts',
      fix: 'Dry PETG at 65°C for 4-6 hours before printing',
      severity: 'error',
    },
    {
      id: 'petg_slow_retraction',
      mistake: 'Using PLA retraction settings',
      consequence: 'Excessive stringing between parts and on travel moves',
      fix: 'PETG needs higher retraction speed (40-60mm/s) and may need more distance',
      severity: 'warning',
    },
  ],
  
  'ABS': [
    {
      id: 'abs_no_enclosure',
      mistake: 'Printing without an enclosure',
      consequence: 'Severe warping, layer splitting, cracking, failed prints',
      fix: 'Use heated enclosure (40-60°C ambient) or at minimum a draft shield',
      severity: 'critical',
    },
    {
      id: 'abs_ptfe_hotend',
      mistake: 'Using PTFE-lined hotend above 250°C',
      consequence: 'PTFE releases toxic fumes, tube degrades and causes clogs',
      fix: 'Upgrade to all-metal hotend for ABS and high-temp materials',
      severity: 'critical',
    },
    {
      id: 'abs_fan_on',
      mistake: 'Using part cooling fan',
      consequence: 'Rapid cooling causes warping, layer splitting, and weak parts',
      fix: 'Disable part cooling entirely for ABS (0% fan)',
      severity: 'error',
    },
    {
      id: 'abs_bed_too_cold',
      mistake: 'Bed temperature below 90°C',
      consequence: 'Corner warping, poor adhesion, parts pop off mid-print',
      fix: 'Use 95-110°C bed temperature for ABS',
      severity: 'warning',
    },
  ],
  
  'ASA': [
    {
      id: 'asa_no_enclosure',
      mistake: 'Printing without enclosure (even though ASA warps less)',
      consequence: 'Inconsistent results, some warping, layer adhesion issues',
      fix: 'ASA still benefits from enclosure, aim for 40-50°C ambient',
      severity: 'warning',
    },
    {
      id: 'asa_fumes',
      mistake: 'Printing ASA without ventilation',
      consequence: 'Styrene fumes are irritating and potentially harmful with prolonged exposure',
      fix: 'Use activated carbon filter or vent enclosure to outdoors',
      severity: 'error',
    },
  ],
  
  'TPU': [
    {
      id: 'tpu_too_fast',
      mistake: 'Printing too fast',
      consequence: 'Flexible filament buckles, jams in extruder, uneven extrusion',
      fix: 'Print TPU at 20-30mm/s maximum, even slower for soft variants',
      severity: 'error',
    },
    {
      id: 'tpu_retraction',
      mistake: 'Using normal retraction settings',
      consequence: 'Flexible filament stretches and jams in extruder path',
      fix: 'Minimize retraction (0-2mm) or disable entirely for TPU',
      severity: 'warning',
    },
    {
      id: 'tpu_bowden',
      mistake: 'Printing with Bowden setup without modifications',
      consequence: 'Filament compresses and buckles in long tube, causing jams',
      fix: 'Use direct drive extruder, or constrained filament path for Bowden',
      severity: 'warning',
    },
  ],
  
  'Nylon': [
    {
      id: 'nylon_not_dried',
      mistake: 'Printing without drying first',
      consequence: 'Nylon absorbs moisture rapidly - causes bubbling, weak parts, poor finish',
      fix: 'Always dry Nylon at 70-80°C for 6-12 hours before printing',
      severity: 'critical',
    },
    {
      id: 'nylon_no_enclosure',
      mistake: 'Printing without enclosure',
      consequence: 'Warping, poor layer adhesion, dimensional instability',
      fix: 'Use heated enclosure (45-60°C) for best results',
      severity: 'error',
    },
    {
      id: 'nylon_brass_nozzle',
      mistake: 'Using brass nozzle with filled Nylon',
      consequence: 'Glass or carbon fiber wears through brass nozzle in hours',
      fix: 'Use hardened steel, tungsten carbide, or ruby nozzle',
      severity: 'critical',
    },
  ],
  
  'PC': [
    {
      id: 'pc_not_dry',
      mistake: 'Printing without thorough drying',
      consequence: 'PC is extremely hygroscopic - moisture causes bubbles and weak parts',
      fix: 'Dry PC at 80°C for 8+ hours, print from dry box if possible',
      severity: 'critical',
    },
    {
      id: 'pc_enclosure',
      mistake: 'Printing without heated enclosure',
      consequence: 'Severe warping, layer cracking, print failure',
      fix: 'Requires enclosed chamber at 50-70°C for successful prints',
      severity: 'critical',
    },
    {
      id: 'pc_bed_adhesion',
      mistake: 'Using standard bed surface',
      consequence: 'PC requires specific adhesion - may not stick or may bond too strongly',
      fix: 'Use Garolite/G10 sheet, or PEI with glue stick as release agent',
      severity: 'error',
    },
  ],
  
  'High Performance': [
    {
      id: 'hightemp_hotend',
      mistake: 'Using standard hotend for PEEK/PEI',
      consequence: 'Standard hotends cannot reach required temperatures (350-400°C)',
      fix: 'Requires specialized high-temp hotend rated for 400°C+',
      severity: 'critical',
    },
    {
      id: 'hightemp_chamber',
      mistake: 'Insufficient chamber temperature',
      consequence: 'Crystallization issues, warping, delamination',
      fix: 'PEEK requires 120-140°C chamber temperature',
      severity: 'critical',
    },
  ],
};

export function getMistakesForMaterial(material: string): CommonMistake[] {
  // Direct match first
  if (COMMON_MISTAKES[material]) {
    return COMMON_MISTAKES[material];
  }
  
  // Try to find partial matches
  const materialUpper = material.toUpperCase();
  
  if (materialUpper.includes('PLA') && !materialUpper.includes('PLA-')) {
    return COMMON_MISTAKES['PLA'] || [];
  }
  if (materialUpper.includes('PETG') || materialUpper.includes('PET-G')) {
    return COMMON_MISTAKES['PETG'] || [];
  }
  if (materialUpper.includes('ABS') && !materialUpper.includes('ASA')) {
    return COMMON_MISTAKES['ABS'] || [];
  }
  if (materialUpper.includes('ASA')) {
    return COMMON_MISTAKES['ASA'] || [];
  }
  if (materialUpper.includes('TPU') || materialUpper.includes('TPE') || materialUpper.includes('FLEX')) {
    return COMMON_MISTAKES['TPU'] || [];
  }
  if (materialUpper.includes('NYLON') || materialUpper.includes('PA6') || materialUpper.includes('PA12')) {
    return COMMON_MISTAKES['Nylon'] || [];
  }
  if (materialUpper.includes('PC') || materialUpper.includes('POLYCARBONATE')) {
    return COMMON_MISTAKES['PC'] || [];
  }
  if (materialUpper.includes('PEEK') || materialUpper.includes('PEI') || materialUpper.includes('PEKK')) {
    return COMMON_MISTAKES['High Performance'] || [];
  }
  
  return [];
}

export function getMostCriticalMistakes(material: string, limit: number = 3): CommonMistake[] {
  const mistakes = getMistakesForMaterial(material);
  const severityOrder = ['critical', 'error', 'warning', 'info'];
  
  return mistakes
    .sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity))
    .slice(0, limit);
}

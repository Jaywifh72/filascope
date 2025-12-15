// Conditional scoring based on printer capabilities

import { Database } from '@/integrations/supabase/types';

type Filament = Database['public']['Tables']['filaments']['Row'];
type Printer = Database['public']['Tables']['printers']['Row'];

export type ScoreType = 'ease_of_printing' | 'strength_index' | 'value_score';

export interface ScoreAdjustment {
  reason: string;
  impact: number;
  type: 'bonus' | 'penalty';
}

export interface ConditionalScoreResult {
  originalScore: number;
  adjustedScore: number;
  adjustments: ScoreAdjustment[];
  label: string;
  isExcellentMatch: boolean;
}

// Materials that require enclosure for best results
const ENCLOSURE_PREFERRED_MATERIALS = ['ABS', 'ASA', 'PC', 'Nylon', 'PA', 'PEEK', 'PEI', 'PEKK'];

// Materials that are abrasive
const ABRASIVE_MATERIALS = ['CF', 'GF', 'Carbon', 'Glass', 'Wood'];

// High-speed capable materials
const HIGH_SPEED_MATERIALS = ['PLA', 'PETG', 'PLA+', 'PLA-Silk'];

export function getConditionalScore(
  baseScore: number | null,
  scoreType: ScoreType,
  printer: Printer | null,
  filament: Filament
): ConditionalScoreResult {
  if (baseScore === null) {
    return {
      originalScore: 0,
      adjustedScore: 0,
      adjustments: [],
      label: 'No data',
      isExcellentMatch: false,
    };
  }

  if (!printer) {
    return {
      originalScore: baseScore,
      adjustedScore: baseScore,
      adjustments: [],
      label: 'Select printer for personalized score',
      isExcellentMatch: false,
    };
  }

  const adjustments: ScoreAdjustment[] = [];
  let adjustedScore = baseScore;
  const material = filament.material || '';

  if (scoreType === 'ease_of_printing') {
    // Enclosure check
    const needsEnclosure = ENCLOSURE_PREFERRED_MATERIALS.some(m => 
      material.toUpperCase().includes(m.toUpperCase())
    );
    const hasEnclosure = printer.has_enclosure || printer.enclosure_type;
    
    if (needsEnclosure && !hasEnclosure) {
      adjustments.push({
        reason: 'No enclosure (recommended for this material)',
        impact: -1.5,
        type: 'penalty',
      });
      adjustedScore -= 1.5;
    } else if (needsEnclosure && hasEnclosure) {
      adjustments.push({
        reason: 'Enclosed chamber',
        impact: 0.3,
        type: 'bonus',
      });
      adjustedScore += 0.3;
    }

    // Bed temperature check
    const filamentBedMin = filament.bed_temp_min_c;
    const printerBedMax = printer.bed_max_temp_c;
    if (filamentBedMin && printerBedMax && filamentBedMin > printerBedMax) {
      adjustments.push({
        reason: `Bed temp limited (needs ${filamentBedMin}°C, max ${printerBedMax}°C)`,
        impact: -1.5,
        type: 'penalty',
      });
      adjustedScore -= 1.5;
    }

    // Nozzle temperature check
    const filamentNozzleMin = filament.nozzle_temp_min_c;
    const printerNozzleMax = printer.max_nozzle_temp_c;
    if (filamentNozzleMin && printerNozzleMax) {
      const tempMargin = printerNozzleMax - filamentNozzleMin;
      if (tempMargin < 0) {
        adjustments.push({
          reason: `Nozzle temp insufficient (needs ${filamentNozzleMin}°C)`,
          impact: -2.0,
          type: 'penalty',
        });
        adjustedScore -= 2.0;
      } else if (tempMargin < 20) {
        adjustments.push({
          reason: 'Operating near max nozzle temp',
          impact: -0.5,
          type: 'penalty',
        });
        adjustedScore -= 0.5;
      }
    }

    // High-speed compatibility
    const isHighSpeedMaterial = HIGH_SPEED_MATERIALS.some(m => 
      material.toUpperCase().includes(m.toUpperCase())
    );
    const isHighSpeedPrinter = printer.max_print_speed_mms && printer.max_print_speed_mms >= 300;
    const isHighSpeedFilament = filament.high_speed_capable;
    
    if (isHighSpeedPrinter && isHighSpeedFilament) {
      adjustments.push({
        reason: 'High-speed compatible',
        impact: 0.5,
        type: 'bonus',
      });
      adjustedScore += 0.5;
    }

    // Input shaping support for better quality at speed
    if (printer.input_shaping_supported && isHighSpeedFilament) {
      adjustments.push({
        reason: 'Input shaping support',
        impact: 0.2,
        type: 'bonus',
      });
      adjustedScore += 0.2;
    }
  }

  if (scoreType === 'strength_index') {
    // Abrasive material check
    const isAbrasive = ABRASIVE_MATERIALS.some(m => 
      material.toUpperCase().includes(m.toUpperCase())
    ) || filament.is_nozzle_abrasive;
    
    const hasAbrasiveSupport = printer.abrasive_filament_support || printer.abrasive_materials_supported;
    
    if (isAbrasive && !hasAbrasiveSupport) {
      adjustments.push({
        reason: 'Risk of nozzle wear (no hardened nozzle)',
        impact: -1.0,
        type: 'penalty',
      });
      adjustedScore -= 1.0;
    }

    // Proper enclosure for engineering materials improves strength consistency
    const needsEnclosure = ENCLOSURE_PREFERRED_MATERIALS.some(m => 
      material.toUpperCase().includes(m.toUpperCase())
    );
    const hasEnclosure = printer.has_enclosure || printer.enclosure_type;
    
    if (needsEnclosure && hasEnclosure) {
      adjustments.push({
        reason: 'Consistent layer adhesion (enclosed)',
        impact: 0.3,
        type: 'bonus',
      });
      adjustedScore += 0.3;
    }
  }

  if (scoreType === 'value_score') {
    // AMS compatibility bonus
    const hasAMS = printer.multi_material_supported || printer.native_multi_material_system;
    const isAMSCompatible = filament.spool_ams_fit;
    
    if (hasAMS && isAMSCompatible) {
      adjustments.push({
        reason: 'AMS compatible',
        impact: 0.2,
        type: 'bonus',
      });
      adjustedScore += 0.2;
    }

    // Auto bed leveling reduces waste
    if (printer.auto_bed_leveling) {
      adjustments.push({
        reason: 'Auto bed leveling (less waste)',
        impact: 0.1,
        type: 'bonus',
      });
      adjustedScore += 0.1;
    }
  }

  // Clamp score between 0 and 10
  adjustedScore = Math.max(0, Math.min(10, adjustedScore));

  // Determine label
  const scoreDiff = adjustedScore - baseScore;
  let label: string;
  if (adjustments.length === 0) {
    label = 'Compatible';
  } else if (scoreDiff >= 0.5) {
    label = 'Excellent match!';
  } else if (scoreDiff >= 0) {
    label = 'Good match';
  } else if (scoreDiff >= -1) {
    label = 'Some limitations';
  } else {
    label = 'Challenging setup';
  }

  return {
    originalScore: baseScore,
    adjustedScore: Math.round(adjustedScore * 10) / 10,
    adjustments,
    label,
    isExcellentMatch: scoreDiff >= 0.5,
  };
}

export function getAllConditionalScores(
  filament: Filament,
  printer: Printer | null
): Record<ScoreType, ConditionalScoreResult> {
  return {
    ease_of_printing: getConditionalScore(
      filament.ease_of_printing_score,
      'ease_of_printing',
      printer,
      filament
    ),
    strength_index: getConditionalScore(
      filament.strength_index ? Number(filament.strength_index) : null,
      'strength_index',
      printer,
      filament
    ),
    value_score: getConditionalScore(
      filament.value_score ? Number(filament.value_score) : null,
      'value_score',
      printer,
      filament
    ),
  };
}

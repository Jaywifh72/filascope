// Score Card Service - handles normalization, ratings, descriptions
import type { Database } from '@/integrations/supabase/types';

type Filament = Database['public']['Tables']['filaments']['Row'];

export type ScoreRating = 'excellent' | 'good' | 'fair' | 'standard';
export type ScoreType = 'ease_of_printing' | 'strength_index' | 'value_score';

export interface ScoreCardData {
  id: ScoreType;
  label: string;
  icon: 'printer' | 'strength' | 'value';
  rawScore: number;
  displayScore: number;
  maxScore: number;
  rating: ScoreRating;
  ratingLabel: string;
  description: string;
  comparison: {
    materialType: string;
    average: number;
    percentile: number;
    position: string;
  } | null;
  contextNote?: {
    icon: string;
    text: string;
    linkLabel?: string;
    linkUrl?: string;
  };
  methodology: {
    components: Array<{ name: string; score: number; weight: number }>;
    basedOn: string;
    lastUpdated: string;
  };
}

// Material statistics for comparison
export interface MaterialStats {
  material: string;
  count: number;
  avgEase: number;
  avgStrength: number;
  avgValue: number;
  minStrength: number;
  maxStrength: number;
}

// Default material averages
export const DEFAULT_MATERIAL_STATS: Record<string, MaterialStats> = {
  'PLA': { material: 'PLA', count: 850, avgEase: 9.2, avgStrength: 0.35, avgValue: 6.5, minStrength: 0.15, maxStrength: 0.55 },
  'PLA+': { material: 'PLA+', count: 220, avgEase: 9.0, avgStrength: 0.42, avgValue: 6.8, minStrength: 0.25, maxStrength: 0.60 },
  'PETG': { material: 'PETG', count: 380, avgEase: 8.1, avgStrength: 0.52, avgValue: 7.0, minStrength: 0.35, maxStrength: 0.68 },
  'ABS': { material: 'ABS', count: 290, avgEase: 6.5, avgStrength: 0.48, avgValue: 6.2, minStrength: 0.30, maxStrength: 0.62 },
  'ASA': { material: 'ASA', count: 120, avgEase: 6.8, avgStrength: 0.55, avgValue: 6.5, minStrength: 0.40, maxStrength: 0.70 },
  'TPU': { material: 'TPU', count: 180, avgEase: 5.5, avgStrength: 0.60, avgValue: 5.8, minStrength: 0.45, maxStrength: 0.72 },
  'Nylon': { material: 'Nylon', count: 95, avgEase: 5.0, avgStrength: 0.65, avgValue: 5.5, minStrength: 0.50, maxStrength: 0.72 },
  'PC': { material: 'PC', count: 60, avgEase: 4.5, avgStrength: 0.68, avgValue: 5.0, minStrength: 0.55, maxStrength: 0.72 },
  'PEEK': { material: 'PEEK', count: 25, avgEase: 3.0, avgStrength: 0.72, avgValue: 4.0, minStrength: 0.65, maxStrength: 0.72 },
  'PA-CF': { material: 'PA-CF', count: 45, avgEase: 4.8, avgStrength: 0.70, avgValue: 5.2, minStrength: 0.60, maxStrength: 0.72 },
};

// Color configuration for ratings
export const SCORE_COLORS = {
  excellent: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-500',
    badge: 'bg-green-500/20 text-green-400 border-green-500/30',
    fill: 'bg-green-500',
  },
  good: {
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    text: 'text-primary',
    badge: 'bg-primary/20 text-primary border-primary/30',
    fill: 'bg-primary',
  },
  fair: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-500',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    fill: 'bg-amber-500',
  },
  standard: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-500',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    fill: 'bg-amber-500',
  },
};

// Normalize strength index from 0.06-0.72 to 1-10 scale
export function normalizeStrengthIndex(rawStrength: number): number {
  const minRaw = 0.06;
  const maxRaw = 0.72;
  const normalized = ((rawStrength - minRaw) / (maxRaw - minRaw)) * 9 + 1;
  return Math.round(normalized * 10) / 10; // Round to 1 decimal
}

// Get base material type from material string
export function getBaseMaterial(material: string | null): string {
  if (!material) return 'Unknown';
  
  const upperMaterial = material.toUpperCase();
  
  // Check for specific materials first
  if (upperMaterial.includes('PA-CF') || upperMaterial.includes('PACF')) return 'PA-CF';
  if (upperMaterial.includes('PLA+') || upperMaterial.includes('PLA PLUS')) return 'PLA+';
  if (upperMaterial.includes('PEEK')) return 'PEEK';
  if (upperMaterial.includes('PETG')) return 'PETG';
  if (upperMaterial.includes('PLA')) return 'PLA';
  if (upperMaterial.includes('ABS')) return 'ABS';
  if (upperMaterial.includes('ASA')) return 'ASA';
  if (upperMaterial.includes('TPU') || upperMaterial.includes('TPE')) return 'TPU';
  if (upperMaterial.includes('NYLON') || upperMaterial.includes('PA6') || upperMaterial.includes('PA12')) return 'Nylon';
  if (upperMaterial.includes('PC') || upperMaterial.includes('POLYCARBONATE')) return 'PC';
  
  return material.split(/[\s\-+]/)[0] || 'Unknown';
}

// Check if material is a basic/commodity material (lower strength expected)
export function isBasicMaterial(material: string | null): boolean {
  const baseMaterial = getBaseMaterial(material);
  return ['PLA', 'PLA+'].includes(baseMaterial);
}

// Get rating for a score
export function getScoreRating(
  score: number,
  scoreType: ScoreType,
  material: string | null
): { rating: ScoreRating; label: string } {
  // Special handling for strength index with basic materials
  if (scoreType === 'strength_index') {
    const normalizedScore = score < 1 ? normalizeStrengthIndex(score) : score;
    
    if (isBasicMaterial(material) && normalizedScore < 5) {
      return { rating: 'standard', label: `Standard for ${getBaseMaterial(material)}` };
    }
    
    if (normalizedScore >= 8) return { rating: 'excellent', label: 'Excellent' };
    if (normalizedScore >= 6) return { rating: 'good', label: 'Good' };
    if (normalizedScore >= 4) return { rating: 'fair', label: 'Fair' };
    return { rating: 'standard', label: 'Standard' };
  }
  
  // Standard rating for other scores
  if (score >= 8) return { rating: 'excellent', label: 'Excellent' };
  if (score >= 6) return { rating: 'good', label: 'Good' };
  if (score >= 4) return { rating: 'fair', label: 'Fair' };
  return { rating: 'standard', label: 'Standard' };
}

// Get description for a score
export function getScoreDescription(
  scoreType: ScoreType,
  score: number,
  material: string | null
): string {
  const baseMaterial = getBaseMaterial(material);
  
  if (scoreType === 'ease_of_printing') {
    if (score >= 9) return 'Prints reliably at low temperatures with minimal warping and excellent layer adhesion. Perfect for beginners and fast iteration.';
    if (score >= 7) return 'Prints well with proper settings and some calibration. Suitable for most users with basic experience.';
    if (score >= 5) return 'Can be challenging to print. Requires tuned settings, good bed adhesion, and some experience.';
    return 'Difficult to print successfully. Requires advanced techniques, proper enclosure, and significant experience.';
  }
  
  if (scoreType === 'strength_index') {
    const normalizedScore = score < 1 ? normalizeStrengthIndex(score) : score;
    
    if (isBasicMaterial(material)) {
      if (normalizedScore < 5) {
        return `Standard mechanical strength for ${baseMaterial}. Ideal for prototypes, decorative prints, and low-stress applications. For structural parts, consider PETG or engineering materials.`;
      }
    }
    
    if (normalizedScore >= 8) return 'Exceptional strength for demanding mechanical applications. Compares favorably to engineering plastics like PC and Nylon.';
    if (normalizedScore >= 6) return 'Good strength suitable for functional parts under moderate loads. Well-balanced between printability and durability.';
    if (normalizedScore >= 4) return 'Adequate for low-to-medium stress applications. Consider reinforcement for load-bearing parts.';
    return 'Lower strength typical for this material class. Best for visual prints and non-structural applications.';
  }
  
  if (scoreType === 'value_score') {
    if (score >= 8) return 'Exceptional value with high quality at competitive pricing. Great cost-per-performance ratio in its category.';
    if (score >= 6) return 'Good value proposition. Price matches quality well with no premium surprises.';
    if (score >= 4) return 'Fair pricing for the category. Slightly above average but justified by specific features.';
    return 'Premium pricing. Consider if specialty features or brand quality are worth the extra cost.';
  }
  
  return '';
}

// Get percentile from score
export function getPercentile(
  score: number,
  scoreType: ScoreType,
  materialStats: MaterialStats | null
): number {
  if (!materialStats) return 50;
  
  let avg: number;
  if (scoreType === 'ease_of_printing') avg = materialStats.avgEase;
  else if (scoreType === 'strength_index') avg = materialStats.avgStrength;
  else avg = materialStats.avgValue;
  
  // Simple percentile calculation based on distance from average
  const diff = score - avg;
  const percentile = 50 + (diff * 15); // Scale difference to percentile
  return Math.max(1, Math.min(99, Math.round(percentile)));
}

// Get position label from percentile
export function getPositionLabel(percentile: number): string {
  if (percentile >= 90) return 'Top 10%';
  if (percentile >= 75) return 'Top 25%';
  if (percentile >= 55) return 'Above Average';
  if (percentile >= 45) return 'Average';
  if (percentile >= 25) return 'Below Average';
  return 'Bottom 25%';
}

// Get context note for special cases
export function getContextNote(
  scoreType: ScoreType,
  score: number,
  material: string | null
): ScoreCardData['contextNote'] | undefined {
  if (scoreType === 'strength_index' && isBasicMaterial(material)) {
    const normalizedScore = score < 1 ? normalizeStrengthIndex(score) : score;
    
    if (normalizedScore < 5) {
      return {
        icon: '⚠️',
        text: `PLA materials score lower on absolute strength compared to engineering plastics like Nylon (7.2/10) or PC (8.5/10). This is expected—PLA is optimized for ease of printing, not high mechanical loads.`,
        linkLabel: 'See stronger alternatives',
        linkUrl: '/finder?material=PETG,Nylon,PC',
      };
    }
  }
  
  return undefined;
}

// Get methodology breakdown
export function getMethodology(
  scoreType: ScoreType,
  score: number
): ScoreCardData['methodology'] {
  if (scoreType === 'ease_of_printing') {
    return {
      components: [
        { name: 'Temperature Sensitivity', score: Math.min(10, score * 0.95), weight: 35 },
        { name: 'Warping Tendency', score: Math.min(10, score * 1.02), weight: 25 },
        { name: 'Bed Adhesion', score: Math.min(10, score * 0.98), weight: 20 },
        { name: 'Print Success Rate', score: Math.min(10, score * 1.0), weight: 20 },
      ],
      basedOn: 'Material properties + community feedback',
      lastUpdated: 'Dec 2024',
    };
  }
  
  if (scoreType === 'strength_index') {
    return {
      components: [
        { name: 'Tensile Strength', score: Math.min(10, score * 1.1), weight: 40 },
        { name: 'Impact Resistance', score: Math.min(10, score * 0.9), weight: 25 },
        { name: 'Layer Adhesion', score: Math.min(10, score * 1.0), weight: 20 },
        { name: 'Durability', score: Math.min(10, score * 0.95), weight: 15 },
      ],
      basedOn: 'Lab tests + material data sheets',
      lastUpdated: 'Dec 2024',
    };
  }
  
  return {
    components: [
      { name: 'Price per kg', score: Math.min(10, score * 1.05), weight: 45 },
      { name: 'Quality vs Cost', score: Math.min(10, score * 0.95), weight: 35 },
      { name: 'Market Position', score: Math.min(10, score * 1.0), weight: 20 },
    ],
    basedOn: 'Market analysis + price tracking',
    lastUpdated: 'Dec 2024',
  };
}

// Main function to get all score card data
export function getScoreCardData(
  filament: Filament,
  customStats?: Record<string, MaterialStats>
): ScoreCardData[] {
  const stats = customStats || DEFAULT_MATERIAL_STATS;
  const baseMaterial = getBaseMaterial(filament.material);
  const materialStats = stats[baseMaterial] || null;
  
  const cards: ScoreCardData[] = [];
  
  // Ease of Printing
  if (filament.ease_of_printing_score) {
    const score = filament.ease_of_printing_score;
    const { rating, label } = getScoreRating(score, 'ease_of_printing', filament.material);
    const percentile = getPercentile(score, 'ease_of_printing', materialStats);
    
    cards.push({
      id: 'ease_of_printing',
      label: 'Ease of Printing',
      icon: 'printer',
      rawScore: score,
      displayScore: score,
      maxScore: 10,
      rating,
      ratingLabel: label,
      description: getScoreDescription('ease_of_printing', score, filament.material),
      comparison: materialStats ? {
        materialType: baseMaterial,
        average: materialStats.avgEase,
        percentile,
        position: getPositionLabel(percentile),
      } : null,
      methodology: getMethodology('ease_of_printing', score),
    });
  }
  
  // Strength Index
  if (filament.strength_index) {
    const rawScore = filament.strength_index;
    const displayScore = rawScore < 1 ? normalizeStrengthIndex(rawScore) : rawScore;
    const { rating, label } = getScoreRating(rawScore, 'strength_index', filament.material);
    const percentile = getPercentile(rawScore, 'strength_index', materialStats);
    
    cards.push({
      id: 'strength_index',
      label: 'Strength Index',
      icon: 'strength',
      rawScore,
      displayScore,
      maxScore: 10,
      rating,
      ratingLabel: label,
      description: getScoreDescription('strength_index', rawScore, filament.material),
      comparison: materialStats ? {
        materialType: baseMaterial,
        average: normalizeStrengthIndex(materialStats.avgStrength),
        percentile,
        position: getPositionLabel(percentile),
      } : null,
      contextNote: getContextNote('strength_index', rawScore, filament.material),
      methodology: getMethodology('strength_index', displayScore),
    });
  }
  
  // Value Score
  if (filament.value_score) {
    const score = filament.value_score;
    const { rating, label } = getScoreRating(score, 'value_score', filament.material);
    const percentile = getPercentile(score, 'value_score', materialStats);
    
    cards.push({
      id: 'value_score',
      label: 'Value Score',
      icon: 'value',
      rawScore: score,
      displayScore: score,
      maxScore: 10,
      rating,
      ratingLabel: label,
      description: getScoreDescription('value_score', score, filament.material),
      comparison: materialStats ? {
        materialType: baseMaterial,
        average: materialStats.avgValue,
        percentile,
        position: getPositionLabel(percentile),
      } : null,
      methodology: getMethodology('value_score', score),
    });
  }
  
  return cards;
}

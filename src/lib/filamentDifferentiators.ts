// Enhanced differentiator calculation utilities for comparing filaments

export interface PriceComparison {
  difference: number;
  percentDifference: number;
  label: string;
  arrow: '↓' | '↑' | '=';
  color: 'green' | 'red' | 'gray';
  savingsText: string;
}

export interface Differentiator {
  icon: string;
  text: string;
  type: 'positive' | 'warning' | 'negative' | 'standout';
}

export interface EnhancedDifferentiator extends Differentiator {
  metric: string;
  currentValue: number | null;
  compareValue: number | null;
  percentDiff: number | null;
  realWorldImpact?: string;
}

export interface CostBenefitAnalysis {
  headline: string;
  tradeoffType: 'upgrade' | 'savings' | 'neutral';
  primaryBenefit?: string;
  primaryCost?: string;
  recommendation?: string;
}

export interface StandoutBadge {
  icon: string;
  label: string;
  color: string;
  tooltip?: string;
}

export type MaterialCategory = 'decorative' | 'functional' | 'engineering' | 'flexible' | 'specialty';

// Minimum difference threshold (15%) for showing a differentiator
const SIGNIFICANCE_THRESHOLD = 0.15;

// Material category detection
export function getMaterialCategory(material: string | null): MaterialCategory {
  if (!material) return 'decorative';
  const upper = material.toUpperCase();
  
  if (upper.includes('TPU') || upper.includes('TPE') || upper.includes('FLEX')) {
    return 'flexible';
  }
  if (upper.includes('PEEK') || upper.includes('PEI') || upper.includes('PC') || upper.includes('NYLON') || upper.includes('PA')) {
    return 'engineering';
  }
  if (upper.includes('PETG') || upper.includes('ABS') || upper.includes('ASA')) {
    return 'functional';
  }
  if (upper.includes('WOOD') || upper.includes('SILK') || upper.includes('MARBLE') || upper.includes('GLOW')) {
    return 'specialty';
  }
  return 'decorative'; // PLA and others
}

// Priority metrics per category
const METRIC_PRIORITIES: Record<MaterialCategory, string[]> = {
  decorative: ['finish', 'colors', 'ease', 'value'],
  functional: ['strength', 'durability', 'heat', 'ease'],
  engineering: ['heat', 'strength', 'chemical', 'precision'],
  flexible: ['flexibility', 'rebound', 'ease', 'durability'],
  specialty: ['unique', 'effect', 'ease', 'value'],
};

export function calculatePriceComparison(
  currentPricePerKg: number | null,
  comparePricePerKg: number | null
): PriceComparison | null {
  if (!currentPricePerKg || !comparePricePerKg || currentPricePerKg <= 0 || comparePricePerKg <= 0) {
    return null;
  }

  const difference = comparePricePerKg - currentPricePerKg;
  const percentDifference = Math.round((difference / currentPricePerKg) * 100);
  const absDifference = Math.abs(difference);
  const absPercent = Math.abs(percentDifference);

  if (absPercent <= 5) {
    return {
      difference: 0,
      percentDifference: 0,
      label: 'Similar price',
      arrow: '=',
      color: 'gray',
      savingsText: '',
    };
  }

  if (difference < 0) {
    return {
      difference,
      percentDifference,
      label: `${absPercent}% cheaper`,
      arrow: '↓',
      color: 'green',
      savingsText: `Save $${absDifference.toFixed(2)}/kg`,
    };
  }

  return {
    difference,
    percentDifference,
    label: `${absPercent}% more`,
    arrow: '↑',
    color: 'red',
    savingsText: `Costs $${absDifference.toFixed(2)} more/kg`,
  };
}

// Calculate percentage difference between two values
function calcPercentDiff(current: number | null, compare: number | null): number | null {
  if (current == null || compare == null || current === 0) return null;
  return ((compare - current) / Math.abs(current)) * 100;
}

// Check if difference is significant (>15%)
function isSignificant(percentDiff: number | null): boolean {
  if (percentDiff == null) return false;
  return Math.abs(percentDiff) > SIGNIFICANCE_THRESHOLD * 100;
}

// Generate real-world impact statements
function getStrengthImpact(percentDiff: number, compareValue: number): string | undefined {
  if (percentDiff > 30) {
    return compareValue > 0.7 ? 'Suitable for functional parts' : 'Strong enough for mechanical use';
  }
  if (percentDiff < -30) {
    return 'Best for decorative/display items';
  }
  return undefined;
}

function getHeatImpact(compareTg: number | null): string | undefined {
  if (!compareTg) return undefined;
  if (compareTg >= 100) return "Won't warp in hot cars or outdoor use";
  if (compareTg >= 80) return 'Handles warm environments well';
  if (compareTg < 55) return 'Keep away from heat sources';
  return undefined;
}

function getEaseImpact(percentDiff: number, compareValue: number): string | undefined {
  if (compareValue >= 8.5) return 'Prints reliably with minimal tuning';
  if (compareValue <= 5) return 'May require experience and enclosure';
  if (percentDiff > 20) return 'Easier to dial in than current';
  if (percentDiff < -20) return 'More challenging to print well';
  return undefined;
}

export function generateEnhancedDifferentiators(
  current: {
    ease_of_printing_score?: number | null;
    value_score?: number | null;
    strength_index?: number | null;
    printability_index?: number | null;
    tg_c?: number | null;
  },
  compare: {
    ease_of_printing_score?: number | null;
    value_score?: number | null;
    strength_index?: number | null;
    printability_index?: number | null;
    tg_c?: number | null;
    high_speed_capable?: boolean | null;
  },
  materialCategory: MaterialCategory = 'decorative'
): EnhancedDifferentiator[] {
  const differentiators: EnhancedDifferentiator[] = [];

  // Strength comparison (normalize to 0-10 scale for strength_index which is 0-1)
  const currentStrength = current.strength_index != null ? current.strength_index * 10 : null;
  const compareStrength = compare.strength_index != null ? compare.strength_index * 10 : null;
  const strengthDiff = calcPercentDiff(currentStrength, compareStrength);

  if (isSignificant(strengthDiff) && strengthDiff != null) {
    const isBetter = strengthDiff > 0;
    differentiators.push({
      metric: 'strength',
      icon: isBetter ? '💪' : '⚠️',
      text: isBetter
        ? `${Math.round(strengthDiff)}% stronger`
        : `${Math.abs(Math.round(strengthDiff))}% less strength`,
      type: isBetter ? 'positive' : 'warning',
      currentValue: currentStrength,
      compareValue: compareStrength,
      percentDiff: strengthDiff,
      realWorldImpact: getStrengthImpact(strengthDiff, compare.strength_index || 0),
    });
  }

  // Printability comparison
  const printDiff = calcPercentDiff(current.printability_index, compare.printability_index);
  if (isSignificant(printDiff) && printDiff != null) {
    const isBetter = printDiff > 0;
    differentiators.push({
      metric: 'printability',
      icon: isBetter ? '🎯' : '⚠️',
      text: isBetter ? 'Easier to print' : 'Harder to print',
      type: isBetter ? 'positive' : 'warning',
      currentValue: current.printability_index,
      compareValue: compare.printability_index,
      percentDiff: printDiff,
      realWorldImpact: getEaseImpact(printDiff, compare.printability_index || 0),
    });
  }

  // Value comparison
  const valueDiff = calcPercentDiff(current.value_score, compare.value_score);
  if (isSignificant(valueDiff) && valueDiff != null) {
    const isBetter = valueDiff > 0;
    differentiators.push({
      metric: 'value',
      icon: isBetter ? '💰' : '⚠️',
      text: isBetter ? 'Better value' : 'Lower value score',
      type: isBetter ? 'positive' : 'warning',
      currentValue: current.value_score,
      compareValue: compare.value_score,
      percentDiff: valueDiff,
    });
  }

  // Heat resistance (Tg)
  if (compare.tg_c != null && (materialCategory === 'functional' || materialCategory === 'engineering')) {
    const tgDiff = current.tg_c != null ? compare.tg_c - current.tg_c : null;
    if (tgDiff != null && Math.abs(tgDiff) > 10) {
      const isBetter = tgDiff > 0;
      differentiators.push({
        metric: 'heat',
        icon: isBetter ? '🔥' : '❄️',
        text: isBetter ? `+${Math.round(tgDiff)}°C heat tolerance` : `${Math.round(tgDiff)}°C less heat tolerant`,
        type: isBetter ? 'positive' : 'warning',
        currentValue: current.tg_c,
        compareValue: compare.tg_c,
        percentDiff: tgDiff,
        realWorldImpact: getHeatImpact(compare.tg_c),
      });
    }
  }

  // High-speed capability
  if (compare.high_speed_capable === true) {
    differentiators.push({
      metric: 'speed',
      icon: '⚡',
      text: 'High-speed printing capable',
      type: 'standout',
      currentValue: null,
      compareValue: 1,
      percentDiff: null,
    });
  }

  // Sort by category priorities
  const priorities = METRIC_PRIORITIES[materialCategory];
  differentiators.sort((a, b) => {
    const aPriority = priorities.indexOf(a.metric);
    const bPriority = priorities.indexOf(b.metric);
    // If not in priorities, put at end
    const aIdx = aPriority === -1 ? 999 : aPriority;
    const bIdx = bPriority === -1 ? 999 : bPriority;
    return aIdx - bIdx;
  });

  return differentiators.slice(0, 3);
}

// Backwards-compatible wrapper
export function generateDifferentiators(
  current: {
    ease_of_printing_score?: number | null;
    value_score?: number | null;
    strength_index?: number | null;
    printability_index?: number | null;
  },
  compare: {
    ease_of_printing_score?: number | null;
    value_score?: number | null;
    strength_index?: number | null;
    printability_index?: number | null;
  }
): Differentiator[] {
  return generateEnhancedDifferentiators(current, compare, 'decorative');
}

// Generate cost-benefit analysis
export function generateCostBenefitAnalysis(
  priceComparison: PriceComparison | null,
  strengthDiff: number | null,
  easeDiff: number | null
): CostBenefitAnalysis | null {
  if (!priceComparison) return null;

  const { percentDifference } = priceComparison;
  const isPricier = percentDifference > 10;
  const isCheaper = percentDifference < -10;
  const isStronger = strengthDiff != null && strengthDiff > 20;
  const isWeaker = strengthDiff != null && strengthDiff < -20;
  const isEasier = easeDiff != null && easeDiff > 15;
  const isHarder = easeDiff != null && easeDiff < -15;

  // Premium upgrade: pay more for better performance
  if (isPricier && isStronger) {
    const multiplier = strengthDiff ? (1 + strengthDiff / 100).toFixed(1) : '1.5';
    return {
      headline: `Pay ${Math.abs(percentDifference)}% more for ${multiplier}x strength`,
      tradeoffType: 'upgrade',
      primaryBenefit: 'Significantly stronger for functional parts',
      primaryCost: 'Higher cost per kg',
      recommendation: 'Worth it for mechanical/functional prints',
    };
  }

  // Budget savings with trade-off
  if (isCheaper && isWeaker) {
    return {
      headline: `Save ${Math.abs(percentDifference)}% with ${Math.abs(Math.round(strengthDiff || 0))}% less strength`,
      tradeoffType: 'savings',
      primaryBenefit: 'Lower cost per kg',
      primaryCost: 'Reduced strength',
      recommendation: 'Good for decorative prints or prototypes',
    };
  }

  // Better value: cheaper AND better/same quality
  if (isCheaper && !isWeaker) {
    return {
      headline: `Save ${Math.abs(percentDifference)}% with similar performance`,
      tradeoffType: 'savings',
      primaryBenefit: 'Great value alternative',
      recommendation: 'Strong budget choice',
    };
  }

  // Easier printing at similar price
  if (isEasier && Math.abs(percentDifference) <= 10) {
    return {
      headline: 'Easier printing, similar price',
      tradeoffType: 'neutral',
      primaryBenefit: 'More forgiving print settings',
      recommendation: 'Good for beginners or hassle-free prints',
    };
  }

  // Premium but harder to print
  if (isPricier && isHarder) {
    return {
      headline: `Costs ${Math.abs(percentDifference)}% more, needs more tuning`,
      tradeoffType: 'upgrade',
      primaryBenefit: isStronger ? 'Better material properties' : 'Specialty features',
      primaryCost: 'More challenging to print',
      recommendation: 'For experienced users seeking specific properties',
    };
  }

  // Default: neutral trade-off
  if (Math.abs(percentDifference) <= 10) {
    return {
      headline: 'Similar price and performance',
      tradeoffType: 'neutral',
      recommendation: 'Comparable alternative',
    };
  }

  return null;
}

// Generate standout badges based on filament properties
export function getStandoutBadges(
  filament: {
    value_score?: number | null;
    ease_of_printing_score?: number | null;
    strength_index?: number | null;
    high_speed_capable?: boolean | null;
    colorCount?: number;
  },
  allFilaments?: Array<{
    value_score?: number | null;
    ease_of_printing_score?: number | null;
    strength_index?: number | null;
  }>
): StandoutBadge[] {
  const badges: StandoutBadge[] = [];

  // Calculate if this is the best in category among all filaments
  const isBestValue = allFilaments
    ? filament.value_score != null && 
      filament.value_score >= Math.max(...allFilaments.map(f => f.value_score || 0))
    : filament.value_score != null && filament.value_score >= 8.5;

  const isEasiest = allFilaments
    ? filament.ease_of_printing_score != null &&
      filament.ease_of_printing_score >= Math.max(...allFilaments.map(f => f.ease_of_printing_score || 0))
    : filament.ease_of_printing_score != null && filament.ease_of_printing_score >= 9;

  const isStrongest = allFilaments
    ? filament.strength_index != null &&
      filament.strength_index >= Math.max(...allFilaments.map(f => f.strength_index || 0))
    : filament.strength_index != null && filament.strength_index >= 0.85;

  if (isBestValue && filament.value_score && filament.value_score >= 8) {
    badges.push({
      icon: '🏆',
      label: 'Best Value',
      color: 'amber',
      tooltip: `Outstanding value score of ${filament.value_score.toFixed(1)}/10`,
    });
  }

  if (filament.high_speed_capable) {
    badges.push({
      icon: '⚡',
      label: 'High-Speed',
      color: 'blue',
      tooltip: 'Optimized for high-speed printing',
    });
  }

  if (isStrongest && filament.strength_index && filament.strength_index >= 0.7) {
    badges.push({
      icon: '💪',
      label: 'Strongest',
      color: 'purple',
      tooltip: `Top strength rating of ${(filament.strength_index * 10).toFixed(1)}/10`,
    });
  }

  if (isEasiest && filament.ease_of_printing_score && filament.ease_of_printing_score >= 8) {
    badges.push({
      icon: '🎯',
      label: 'Easiest Print',
      color: 'green',
      tooltip: `Exceptionally easy to print (${filament.ease_of_printing_score.toFixed(1)}/10)`,
    });
  }

  if (filament.colorCount && filament.colorCount >= 30) {
    badges.push({
      icon: '🎨',
      label: `${filament.colorCount} Colors`,
      color: 'blue',
      tooltip: 'Wide color selection available',
    });
  }

  return badges.slice(0, 2);
}

export function getBestForDescription(material: string | null, scores: {
  ease_of_printing_score?: number | null;
  value_score?: number | null;
  strength_index?: number | null;
}): string {
  const baseMaterial = material?.split(/[\s-]/)[0]?.toUpperCase() || '';
  
  const descriptions: Record<string, string> = {
    'PLA': 'Decorative prints, prototypes, learning',
    'PETG': 'Functional parts, outdoor use, durability',
    'ABS': 'Heat-resistant parts, mechanical components',
    'ASA': 'Outdoor applications, UV resistance',
    'TPU': 'Flexible parts, phone cases, gaskets',
    'NYLON': 'Engineering parts, high wear resistance',
    'PC': 'High-strength applications, heat resistance',
    'PEEK': 'Professional engineering, extreme conditions',
  };

  if (descriptions[baseMaterial]) {
    return descriptions[baseMaterial];
  }

  // Fallback based on scores
  if (scores.value_score && scores.value_score > 8) {
    return 'Budget-friendly everyday printing';
  }
  if (scores.strength_index && scores.strength_index > 0.7) {
    return 'Functional parts, load-bearing applications';
  }
  if (scores.ease_of_printing_score && scores.ease_of_printing_score > 8) {
    return 'Beginners, low-maintenance printing';
  }

  return 'General purpose 3D printing';
}

export function calculateOverallScore(filament: {
  value_score?: number | null;
  ease_of_printing_score?: number | null;
  strength_index?: number | null;
  printability_index?: number | null;
}): number | null {
  const scores: number[] = [];
  
  if (filament.value_score != null) scores.push(filament.value_score);
  if (filament.printability_index != null) scores.push(filament.printability_index);
  if (filament.ease_of_printing_score != null) scores.push(filament.ease_of_printing_score);
  if (filament.strength_index != null) scores.push(filament.strength_index * 10);

  if (scores.length === 0) return null;
  
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

export function calculatePricePerKg(price: number | null, weightG: number | null): number | null {
  if (!price || !weightG || weightG <= 0) return null;
  return price / (weightG / 1000);
}

// Differentiator calculation utilities for comparing filaments

export interface PriceComparison {
  difference: number;
  percentDifference: number;
  label: string;
  arrow: '↓' | '↑' | '=';
  color: 'green' | 'red' | 'gray';
  savingsText: string;
}

export interface Differentiator {
  icon: '✓' | '⚠️' | '✗';
  text: string;
  type: 'positive' | 'warning' | 'negative';
}

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
  const differentiators: Differentiator[] = [];

  // Printability comparison
  if (current.printability_index != null && compare.printability_index != null) {
    const diff = compare.printability_index - current.printability_index;
    if (Math.abs(diff) < 0.5) {
      differentiators.push({
        icon: '✓',
        text: `Same printability (${compare.printability_index.toFixed(1)}/10)`,
        type: 'positive',
      });
    } else if (diff > 0) {
      differentiators.push({
        icon: '✓',
        text: `Easier to print (${compare.printability_index.toFixed(1)} vs ${current.printability_index.toFixed(1)})`,
        type: 'positive',
      });
    } else {
      differentiators.push({
        icon: '⚠️',
        text: `Harder to print (${compare.printability_index.toFixed(1)} vs ${current.printability_index.toFixed(1)})`,
        type: 'warning',
      });
    }
  }

  // Value score comparison
  if (current.value_score != null && compare.value_score != null) {
    const diff = compare.value_score - current.value_score;
    if (Math.abs(diff) < 0.3) {
      differentiators.push({
        icon: '✓',
        text: `Similar value (${compare.value_score.toFixed(1)}/10)`,
        type: 'positive',
      });
    } else if (diff > 0) {
      differentiators.push({
        icon: '✓',
        text: `Better value (${compare.value_score.toFixed(1)} vs ${current.value_score.toFixed(1)})`,
        type: 'positive',
      });
    } else {
      differentiators.push({
        icon: '⚠️',
        text: `Lower value score (${compare.value_score.toFixed(1)} vs ${current.value_score.toFixed(1)})`,
        type: 'warning',
      });
    }
  }

  // Strength comparison
  if (current.strength_index != null && compare.strength_index != null) {
    const diff = compare.strength_index - current.strength_index;
    if (Math.abs(diff) < 0.05) {
      differentiators.push({
        icon: '✓',
        text: 'Similar strength',
        type: 'positive',
      });
    } else if (diff > 0) {
      differentiators.push({
        icon: '✓',
        text: 'Stronger material',
        type: 'positive',
      });
    } else {
      differentiators.push({
        icon: '⚠️',
        text: 'Lower strength',
        type: 'warning',
      });
    }
  }

  return differentiators.slice(0, 4);
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

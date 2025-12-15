// Performance Profile Service - calculates profiles, insights, and comparison suggestions
import { getBaseMaterial, normalizeStrengthIndex, DEFAULT_MATERIAL_STATS } from './scoreCardService';

export type PerformanceProfile = 
  | 'balanced' 
  | 'beginner_friendly' 
  | 'specialist' 
  | 'performance_oriented' 
  | 'budget' 
  | 'premium';

export type MetricRating = 'excellent' | 'good' | 'fair' | 'standard';

export interface PerformanceMetric {
  id: string;
  name: string;
  score: number;
  normalizedScore: number; // 0-10 scale for visualization
  rating: MetricRating;
  ratingLabel: string;
  explanation: string;
  categoryAverage: number;
  percentile: number;
  icon: string;
  color: 'green' | 'cyan' | 'amber' | 'red';
}

export interface CategoryComparison {
  category: string;
  overallPercentile: number;
  position: string;
  comparisonText: string;
}

export interface SuggestedComparison {
  id: string;
  name: string;
  price: number | null;
  pricePerKg: number | null;
  overallScore: number;
  differentiator: string;
  featured_image?: string | null;
  material?: string | null;
}

export interface PerformanceData {
  overallScore: number;
  performanceProfile: PerformanceProfile;
  profileLabel: string;
  profileDescription: string;
  metrics: PerformanceMetric[];
  categoryComparison: CategoryComparison;
  insights: string[];
  suggestedComparisons: SuggestedComparison[];
}

interface FilamentScores {
  ease_of_printing_score?: number | null;
  printability_index?: number | null;
  strength_index?: number | null;
  value_score?: number | null;
  material?: string | null;
}

// Calculate overall score from individual metrics
export function calculateOverallScore(scores: FilamentScores): number {
  const printability = scores.ease_of_printing_score || scores.printability_index || 0;
  const strength = scores.strength_index ? normalizeStrengthIndex(scores.strength_index) : 0;
  const value = scores.value_score || 0;
  
  // Weighted average: printability 40%, strength 30%, value 30%
  const overall = (printability * 0.4) + (strength * 0.3) + (value * 0.3);
  return Math.round(overall * 100) / 100;
}

// Determine performance profile based on score distribution
export function derivePerformanceProfile(scores: FilamentScores): PerformanceProfile {
  const printability = scores.ease_of_printing_score || scores.printability_index || 5;
  const strength = scores.strength_index ? normalizeStrengthIndex(scores.strength_index) : 5;
  const value = scores.value_score || 5;
  
  const avgScore = (printability + strength + value) / 3;
  const maxDiff = Math.max(
    Math.abs(printability - avgScore),
    Math.abs(strength - avgScore),
    Math.abs(value - avgScore)
  );
  
  // Check for specialist (one score dominates)
  if (maxDiff > 3) {
    if (printability > strength && printability > value) return 'beginner_friendly';
    if (strength > printability && strength > value) return 'performance_oriented';
    if (value > printability && value > strength) return 'budget';
  }
  
  // Check for premium (high performance, lower value)
  if (printability >= 8 && strength >= 6 && value < 5) return 'premium';
  
  // Check for budget (high value, lower performance)
  if (value >= 8 && avgScore < 6) return 'budget';
  
  // Check for beginner-friendly (high printability)
  if (printability >= 9 && strength < 5) return 'beginner_friendly';
  
  // Default to balanced
  return 'balanced';
}

// Get profile label and description
export function getProfileInfo(profile: PerformanceProfile): { label: string; description: string } {
  const profiles: Record<PerformanceProfile, { label: string; description: string }> = {
    balanced: {
      label: 'Balanced All-Rounder',
      description: 'Well-rounded performance across all metrics'
    },
    beginner_friendly: {
      label: 'Beginner-Friendly',
      description: 'Easy to print with forgiving settings'
    },
    specialist: {
      label: 'Specialist Material',
      description: 'Excels in specific applications'
    },
    performance_oriented: {
      label: 'Performance-Oriented',
      description: 'High strength for demanding applications'
    },
    budget: {
      label: 'Value Champion',
      description: 'Great performance for the price'
    },
    premium: {
      label: 'Premium Quality',
      description: 'Top-tier performance with premium pricing'
    }
  };
  
  return profiles[profile];
}

// Get rating from score
function getMetricRating(score: number, isStrength: boolean = false, material?: string | null): MetricRating {
  // Special case for PLA strength (expected to be lower)
  if (isStrength) {
    const baseMaterial = getBaseMaterial(material || '');
    if (['PLA', 'PLA+'].includes(baseMaterial) && score < 5) {
      return 'standard'; // "Standard for PLA"
    }
  }
  
  if (score >= 8.5) return 'excellent';
  if (score >= 6.5) return 'good';
  if (score >= 4) return 'fair';
  return 'standard';
}

// Get rating label
function getRatingLabel(rating: MetricRating, isStrength: boolean = false, material?: string | null): string {
  if (isStrength && rating === 'standard') {
    const baseMaterial = getBaseMaterial(material || '');
    if (['PLA', 'PLA+'].includes(baseMaterial)) {
      return `Standard for ${baseMaterial}`;
    }
  }
  
  const labels: Record<MetricRating, string> = {
    excellent: 'Best-in-class',
    good: 'Above Average',
    fair: 'Fair',
    standard: 'Standard'
  };
  return labels[rating];
}

// Get rating icon (stars or warning)
function getRatingIcon(rating: MetricRating): string {
  const icons: Record<MetricRating, string> = {
    excellent: '★★★★★',
    good: '★★★★☆',
    fair: '★★★☆☆',
    standard: '★★☆☆☆'
  };
  return icons[rating];
}

// Get rating color
function getRatingColor(rating: MetricRating): 'green' | 'cyan' | 'amber' | 'red' {
  const colors: Record<MetricRating, 'green' | 'cyan' | 'amber' | 'red'> = {
    excellent: 'green',
    good: 'cyan',
    fair: 'amber',
    standard: 'amber'
  };
  return colors[rating];
}

// Get explanation for a metric
function getMetricExplanation(metricId: string, score: number, material?: string | null): string {
  const baseMaterial = getBaseMaterial(material || '');
  
  if (metricId === 'printability') {
    if (score >= 9) return 'Prints easily with minimal calibration';
    if (score >= 7) return 'Good print success with standard settings';
    if (score >= 5) return 'May need tuning for best results';
    return 'Requires careful setup and experience';
  }
  
  if (metricId === 'strength') {
    const normalizedScore = score < 1 ? normalizeStrengthIndex(score) : score;
    if (['PLA', 'PLA+'].includes(baseMaterial) && normalizedScore < 5) {
      return 'Typical for PLA - ideal for prototypes';
    }
    if (normalizedScore >= 8) return 'Excellent for functional parts';
    if (normalizedScore >= 6) return 'Good for moderate loads';
    if (normalizedScore >= 4) return 'Adequate for light-duty use';
    return 'Best for decorative prints';
  }
  
  if (metricId === 'value') {
    if (score >= 8) return 'Excellent cost-performance ratio';
    if (score >= 6) return 'Fair price for quality';
    if (score >= 4) return 'Slightly premium pricing';
    return 'Premium material, premium price';
  }
  
  return '';
}

// Calculate percentile from score and category average
function calculatePercentile(score: number, average: number): number {
  const diff = score - average;
  const percentile = 50 + (diff * 12); // Scale difference
  return Math.max(1, Math.min(99, Math.round(percentile)));
}

// Get position label from percentile
function getPositionLabel(percentile: number): string {
  if (percentile >= 90) return 'Top 10%';
  if (percentile >= 75) return 'Top 25%';
  if (percentile >= 55) return 'Above Average';
  if (percentile >= 45) return 'Average';
  if (percentile >= 25) return 'Below Average';
  return 'Bottom 25%';
}

// Generate auto insights based on scores
export function generateInsights(scores: FilamentScores): string[] {
  const insights: string[] = [];
  const baseMaterial = getBaseMaterial(scores.material || '');
  
  const printability = scores.ease_of_printing_score || scores.printability_index || 0;
  const strengthRaw = scores.strength_index || 0;
  const strength = strengthRaw < 1 ? normalizeStrengthIndex(strengthRaw) : strengthRaw;
  const value = scores.value_score || 0;
  
  // High printability insight
  if (printability >= 9) {
    insights.push('Exceptional printability makes this ideal for beginners and complex geometries with minimal failed prints.');
  } else if (printability >= 7) {
    insights.push('Good print success rate with standard slicer settings. Minor tuning may improve results.');
  }
  
  // Strength insights
  if (['PLA', 'PLA+'].includes(baseMaterial) && strength < 5) {
    insights.push(`Lower strength is typical for ${baseMaterial}. For structural parts under load, consider PETG, ABS, or Nylon.`);
  } else if (strength >= 8) {
    insights.push('High mechanical strength makes this suitable for functional parts, jigs, and load-bearing applications.');
  }
  
  // Value insights
  if (value >= 8) {
    insights.push('Outstanding value - excellent quality-to-price ratio compared to similar materials in this category.');
  } else if (value < 5) {
    insights.push('Premium pricing reflects brand quality or specialty features. Evaluate if specific benefits match your needs.');
  }
  
  // Combined insights
  if (printability >= 8 && strength < 4) {
    insights.push('Optimized for ease of printing over strength - great for prototypes and decorative prints.');
  }
  
  if (printability < 5 && strength >= 7) {
    insights.push('Challenging to print but rewards patience with excellent mechanical properties. Best for experienced users.');
  }
  
  return insights.slice(0, 3); // Max 3 insights
}

// Build metrics array
export function buildPerformanceMetrics(scores: FilamentScores): PerformanceMetric[] {
  const metrics: PerformanceMetric[] = [];
  const baseMaterial = getBaseMaterial(scores.material || '');
  const materialStats = DEFAULT_MATERIAL_STATS[baseMaterial];
  
  // Printability
  const printability = scores.ease_of_printing_score || scores.printability_index || 0;
  if (printability > 0) {
    const avgPrint = materialStats?.avgEase || 7.5;
    const percentile = calculatePercentile(printability, avgPrint);
    const rating = getMetricRating(printability);
    
    metrics.push({
      id: 'printability',
      name: 'Printability',
      score: printability,
      normalizedScore: printability,
      rating,
      ratingLabel: getRatingLabel(rating),
      explanation: getMetricExplanation('printability', printability, scores.material),
      categoryAverage: avgPrint,
      percentile,
      icon: getRatingIcon(rating),
      color: getRatingColor(rating)
    });
  }
  
  // Strength
  if (scores.strength_index && scores.strength_index > 0) {
    const rawStrength = scores.strength_index;
    const normalizedStrength = rawStrength < 1 ? normalizeStrengthIndex(rawStrength) : rawStrength;
    const avgStrength = materialStats?.avgStrength 
      ? normalizeStrengthIndex(materialStats.avgStrength)
      : 5;
    const percentile = calculatePercentile(normalizedStrength, avgStrength);
    const rating = getMetricRating(normalizedStrength, true, scores.material);
    
    metrics.push({
      id: 'strength',
      name: 'Strength',
      score: rawStrength,
      normalizedScore: normalizedStrength,
      rating,
      ratingLabel: getRatingLabel(rating, true, scores.material),
      explanation: getMetricExplanation('strength', rawStrength, scores.material),
      categoryAverage: avgStrength,
      percentile,
      icon: rating === 'standard' ? '⚠️' : getRatingIcon(rating),
      color: getRatingColor(rating)
    });
  }
  
  // Value
  if (scores.value_score && scores.value_score > 0) {
    const value = scores.value_score;
    const avgValue = materialStats?.avgValue || 6.5;
    const percentile = calculatePercentile(value, avgValue);
    const rating = getMetricRating(value);
    
    metrics.push({
      id: 'value',
      name: 'Value',
      score: value,
      normalizedScore: value,
      rating,
      ratingLabel: getRatingLabel(rating),
      explanation: getMetricExplanation('value', value, scores.material),
      categoryAverage: avgValue,
      percentile,
      icon: getRatingIcon(rating),
      color: getRatingColor(rating)
    });
  }
  
  return metrics;
}

// Build category comparison
export function buildCategoryComparison(scores: FilamentScores): CategoryComparison {
  const baseMaterial = getBaseMaterial(scores.material || '');
  const overall = calculateOverallScore(scores);
  
  // Calculate overall percentile based on weighted averages
  const materialStats = DEFAULT_MATERIAL_STATS[baseMaterial];
  let percentile = 50;
  
  if (materialStats) {
    const avgOverall = (materialStats.avgEase * 0.4) + 
      (normalizeStrengthIndex(materialStats.avgStrength) * 0.3) + 
      (materialStats.avgValue * 0.3);
    percentile = calculatePercentile(overall, avgOverall);
  }
  
  const position = getPositionLabel(percentile);
  
  let comparisonText: string;
  if (percentile >= 75) {
    comparisonText = `Outperforms ${percentile}% of ${baseMaterial} materials`;
  } else if (percentile >= 50) {
    comparisonText = `Performs above average for ${baseMaterial} materials`;
  } else {
    comparisonText = `Budget option among ${baseMaterial} materials`;
  }
  
  return {
    category: baseMaterial,
    overallPercentile: percentile,
    position,
    comparisonText
  };
}

// Generate prose narrative that tells the material's story
export function generatePerformanceNarrative(
  scores: FilamentScores,
  pricePerKg: number | null,
  categoryPriceAvg: number = 22
): string {
  const baseMaterial = getBaseMaterial(scores.material || '');
  const printability = scores.ease_of_printing_score || scores.printability_index || 0;
  const strengthRaw = scores.strength_index || 0;
  const strength = strengthRaw < 1 ? normalizeStrengthIndex(strengthRaw) : strengthRaw;
  const value = scores.value_score || 0;
  
  const sentences: string[] = [];
  
  // Opening: Lead with strongest attribute
  if (printability >= 9) {
    sentences.push(`This material excels at printability **(${printability.toFixed(1)}/10)**, making it perfect for beginners and complex prints with minimal failed attempts.`);
  } else if (strength >= 7) {
    sentences.push(`This material prioritizes mechanical strength **(${strength.toFixed(1)}/10)**, delivering excellent performance for functional parts and load-bearing applications.`);
  } else if (value >= 8) {
    sentences.push(`This is a value champion **(${value.toFixed(1)}/10 value score)**, delivering solid performance at an unbeatable price point.`);
  } else if (printability >= 7) {
    sentences.push(`This material offers reliable printability **(${printability.toFixed(1)}/10)**, working well with standard slicer settings.`);
  } else {
    sentences.push(`This material delivers balanced performance across all metrics, suitable for a variety of applications.`);
  }
  
  // Trade-off section
  if (printability >= 8 && strength < 4) {
    sentences.push(`The trade-off is lower strength **(${strength.toFixed(1)}/10)**, which is standard for ${baseMaterial} materials—ideal for prototypes but not load-bearing parts.`);
  } else if (strength >= 7 && printability < 6) {
    sentences.push(`It requires more careful tuning **(printability: ${printability.toFixed(1)}/10)** but rewards patience with superior durability.`);
  } else if (value < 5 && printability >= 7) {
    sentences.push(`Premium pricing **(${value.toFixed(1)}/10 value)** reflects brand quality and specialty features.`);
  }
  
  // Price context
  if (pricePerKg) {
    const priceDiff = ((pricePerKg - categoryPriceAvg) / categoryPriceAvg) * 100;
    if (Math.abs(priceDiff) >= 15) {
      const direction = priceDiff > 0 ? 'more' : 'less';
      const absPercent = Math.abs(Math.round(priceDiff));
      
      if (priceDiff > 0 && value >= 7) {
        sentences.push(`At **$${pricePerKg.toFixed(2)}/kg**, you're paying ${absPercent}% ${direction} than average for enhanced quality and reliability.`);
      } else if (priceDiff < 0) {
        sentences.push(`At **$${pricePerKg.toFixed(2)}/kg**, it's ${absPercent}% ${direction} than the category average, making it a budget-friendly choice.`);
      } else {
        sentences.push(`At **$${pricePerKg.toFixed(2)}/kg**, it's positioned as a premium option in the ${baseMaterial} category.`);
      }
    }
  }
  
  return sentences.join(' ');
}

// Decision framework item type
export interface DecisionItem {
  priority: string;
  icon: 'check' | 'warning' | 'dollar' | 'fire' | 'x';
  fit: 'excellent' | 'good' | 'consider' | 'poor';
  label: string;
  suggestion?: string;
}

// Generate decision framework
export function generateDecisionFramework(scores: FilamentScores): DecisionItem[] {
  const baseMaterial = getBaseMaterial(scores.material || '');
  const printability = scores.ease_of_printing_score || scores.printability_index || 0;
  const strengthRaw = scores.strength_index || 0;
  const strength = strengthRaw < 1 ? normalizeStrengthIndex(strengthRaw) : strengthRaw;
  const value = scores.value_score || 0;
  
  const items: DecisionItem[] = [];
  
  // Easy printing priority
  if (printability >= 8) {
    items.push({
      priority: 'Easy printing',
      icon: 'check',
      fit: 'excellent',
      label: 'This is excellent'
    });
  } else if (printability >= 6) {
    items.push({
      priority: 'Easy printing',
      icon: 'check',
      fit: 'good',
      label: 'Good with minor tuning'
    });
  } else {
    items.push({
      priority: 'Easy printing',
      icon: 'warning',
      fit: 'consider',
      label: 'Requires experience',
      suggestion: 'PLA or PLA+ for easier printing'
    });
  }
  
  // Strength priority
  if (strength >= 7) {
    items.push({
      priority: 'Maximum strength',
      icon: 'check',
      fit: 'excellent',
      label: 'Excellent for functional parts'
    });
  } else if (strength >= 5) {
    items.push({
      priority: 'Maximum strength',
      icon: 'warning',
      fit: 'consider',
      label: 'Moderate strength only',
      suggestion: 'PETG or Nylon for more strength'
    });
  } else {
    items.push({
      priority: 'Maximum strength',
      icon: 'warning',
      fit: 'poor',
      label: 'Consider alternatives',
      suggestion: 'PETG, ABS, or Nylon'
    });
  }
  
  // Value priority
  if (value >= 8) {
    items.push({
      priority: 'Best value',
      icon: 'dollar',
      fit: 'excellent',
      label: 'Outstanding value'
    });
  } else if (value >= 6) {
    items.push({
      priority: 'Best value',
      icon: 'dollar',
      fit: 'good',
      label: 'Fair price for quality'
    });
  } else {
    items.push({
      priority: 'Best value',
      icon: 'dollar',
      fit: 'consider',
      label: `Budget ${baseMaterial} options exist`,
      suggestion: `Basic ${baseMaterial} for savings`
    });
  }
  
  // Heat resistance (based on material type)
  if (['ABS', 'ASA', 'PC', 'PEEK', 'Nylon'].includes(baseMaterial)) {
    items.push({
      priority: 'Heat resistance',
      icon: 'fire',
      fit: 'excellent',
      label: 'Good heat tolerance'
    });
  } else if (['PETG', 'PLA+'].includes(baseMaterial)) {
    items.push({
      priority: 'Heat resistance',
      icon: 'warning',
      fit: 'consider',
      label: 'Limited heat tolerance',
      suggestion: 'ABS or ASA for hot environments'
    });
  } else {
    items.push({
      priority: 'Heat resistance',
      icon: 'x',
      fit: 'poor',
      label: 'Not suitable',
      suggestion: 'ABS, ASA, or PC'
    });
  }
  
  return items;
}

// Scenario guidance type
export interface ScenarioGuidance {
  useIf: string[];
  alternativeIf: string[];
}

// Generate scenario-based guidance
export function generateScenarioGuidance(scores: FilamentScores): ScenarioGuidance {
  const baseMaterial = getBaseMaterial(scores.material || '');
  const printability = scores.ease_of_printing_score || scores.printability_index || 0;
  const strengthRaw = scores.strength_index || 0;
  const strength = strengthRaw < 1 ? normalizeStrengthIndex(strengthRaw) : strengthRaw;
  const value = scores.value_score || 0;
  
  const useIf: string[] = [];
  const alternativeIf: string[] = [];
  
  // Use if conditions
  if (printability >= 8) {
    useIf.push("You're new to 3D printing");
    useIf.push("You need complex geometries");
  }
  
  if (value >= 7) {
    useIf.push("You want good value for money");
  }
  
  if (strength >= 7) {
    useIf.push("Parts need mechanical strength");
    useIf.push("Building functional prototypes");
  }
  
  if (['PLA', 'PLA+'].includes(baseMaterial)) {
    useIf.push("Prototyping and rapid iteration");
    if (baseMaterial === 'PLA+') {
      useIf.push("You want better than basic PLA");
    }
  }
  
  if (['PETG', 'ABS', 'ASA'].includes(baseMaterial)) {
    useIf.push("Parts need outdoor durability");
  }
  
  // Alternative if conditions
  if (strength < 5) {
    alternativeIf.push("Parts will bear significant loads");
    alternativeIf.push("You need maximum durability");
  }
  
  if (printability < 6) {
    alternativeIf.push("You're a beginner printer");
    alternativeIf.push("You want hassle-free printing");
  }
  
  if (value < 5) {
    alternativeIf.push("Budget is your top priority");
  }
  
  if (['PLA', 'PLA+'].includes(baseMaterial)) {
    alternativeIf.push("Parts need heat resistance above 60°C");
    alternativeIf.push("Outdoor UV exposure is expected");
  }
  
  // Ensure we have items
  if (useIf.length === 0) {
    useIf.push("General purpose printing");
    useIf.push("Balanced performance matters");
  }
  
  if (alternativeIf.length === 0) {
    alternativeIf.push("Specialty requirements exist");
  }
  
  return { 
    useIf: useIf.slice(0, 4), 
    alternativeIf: alternativeIf.slice(0, 4) 
  };
}

// Comparison landscape type
export interface ComparisonLandscapeItem {
  tier: 'budget' | 'balanced' | 'premium';
  label: string;
  item: SuggestedComparison | null;
  summary: string;
  isCurrent?: boolean;
}

// Select comparison landscape options
export function selectComparisonLandscape(
  currentPrice: number | null,
  currentScore: number,
  currentName: string,
  currentId: string,
  recommendations: SuggestedComparison[]
): ComparisonLandscapeItem[] {
  const landscape: ComparisonLandscapeItem[] = [];
  
  // Find budget option (cheaper, decent score)
  const budgetOption = recommendations.find(r => 
    r.pricePerKg && currentPrice && 
    r.pricePerKg < currentPrice * 0.85
  );
  
  // Find premium option (more expensive, higher score)
  const premiumOption = recommendations.find(r => 
    r.pricePerKg && currentPrice && 
    r.pricePerKg > currentPrice * 1.15 &&
    r.overallScore >= currentScore
  );
  
  landscape.push({
    tier: 'budget',
    label: 'Budget Route',
    item: budgetOption || null,
    summary: budgetOption 
      ? 'Maximum value, standard quality'
      : 'No cheaper alternatives found'
  });
  
  landscape.push({
    tier: 'balanced',
    label: 'Current Choice',
    item: {
      id: currentId,
      name: currentName,
      price: null,
      pricePerKg: currentPrice,
      overallScore: currentScore,
      differentiator: 'Your selection'
    },
    summary: 'Balanced performance and price',
    isCurrent: true
  });
  
  landscape.push({
    tier: 'premium',
    label: 'Premium Route',
    item: premiumOption || null,
    summary: premiumOption 
      ? 'Best quality, premium price'
      : 'Already top-tier in category'
  });
  
  return landscape;
}

// Chart annotation type
export interface ChartAnnotation {
  metric: string;
  position: 'top' | 'left' | 'right';
  text: string;
  subtext: string;
}

// Generate chart annotations
export function generateChartAnnotations(metrics: PerformanceMetric[], material: string | null): ChartAnnotation[] {
  const baseMaterial = getBaseMaterial(material || '');
  const annotations: ChartAnnotation[] = [];
  
  metrics.forEach((m, index) => {
    const positions: ('top' | 'left' | 'right')[] = ['top', 'left', 'right'];
    const position = positions[index % 3];
    
    let text = '';
    let subtext = '';
    
    if (m.id === 'printability') {
      if (m.normalizedScore >= 9) {
        text = 'High printability →';
        subtext = 'Great for beginners';
      } else if (m.normalizedScore >= 7) {
        text = 'Good printability →';
        subtext = 'Reliable results';
      } else {
        text = 'Needs tuning →';
        subtext = 'For experienced users';
      }
    } else if (m.id === 'strength') {
      if (m.normalizedScore >= 7) {
        text = '← Strong material';
        subtext = 'Good for functional parts';
      } else if (['PLA', 'PLA+'].includes(baseMaterial)) {
        text = `← Typical for ${baseMaterial}`;
        subtext = 'Consider PETG for strength';
      } else {
        text = '← Standard strength';
        subtext = 'Adequate for prototypes';
      }
    } else if (m.id === 'value') {
      if (m.normalizedScore >= 8) {
        text = 'Great value →';
        subtext = 'Excellent price/quality';
      } else if (m.normalizedScore >= 6) {
        text = 'Fair value →';
        subtext = 'Competitive pricing';
      } else {
        text = 'Premium pricing →';
        subtext = 'Quality comes at a cost';
      }
    }
    
    if (text) {
      annotations.push({ metric: m.name, position, text, subtext });
    }
  });
  
  return annotations;
}

// Main function to get complete performance data
export function getPerformanceData(
  scores: FilamentScores,
  suggestedComparisons: SuggestedComparison[] = []
): PerformanceData {
  const overallScore = calculateOverallScore(scores);
  const profile = derivePerformanceProfile(scores);
  const { label, description } = getProfileInfo(profile);
  const metrics = buildPerformanceMetrics(scores);
  const categoryComparison = buildCategoryComparison(scores);
  const insights = generateInsights(scores);
  
  return {
    overallScore,
    performanceProfile: profile,
    profileLabel: label,
    profileDescription: description,
    metrics,
    categoryComparison,
    insights,
    suggestedComparisons
  };
}

// Sophisticated multi-factor recommendation scoring system

import type { SkillLevel } from "@/lib/skillLevels";

// ============= Types =============

export interface RecommendationFactors {
  priceSimilarityScore: number;
  propertySimilarityScore: number;
  useCaseOverlapScore: number;
  brandPreferenceScore: number;
  printerCompatibilityScore: number;
  skillLevelMatchScore: number;
  popularityScore: number;
  trendingScore: number;
  relevanceScore: number;
}

export interface UserContext {
  favoriteFilamentIds: string[];
  topMaterials: string[];
  printerSpecs: {
    maxNozzleTemp: number | null;
    maxBedTemp: number | null;
    hasEnclosure: boolean | null;
    abrasiveSupport: boolean | null;
  } | null;
  skillLevel: SkillLevel;
  priceSensitivity: "budget" | "moderate" | "premium";
  browseHistory: Array<{ vendor?: string | null }>;
}

export interface FilamentCandidate {
  id: string;
  product_id?: string | null;
  product_title: string;
  vendor: string | null;
  material: string | null;
  variant_price: number | null;
  net_weight_g: number | null;
  nozzle_temp_min_c?: number | null;
  nozzle_temp_max_c?: number | null;
  bed_temp_min_c?: number | null;
  is_nozzle_abrasive?: boolean | null;
  ease_of_printing_score?: number | null;
  value_score?: number | null;
  strength_index?: number | null;
  printability_index?: number | null;
  use_case_tags?: string[] | null;
}

export interface TrendingMaterial {
  material_filter: string;
  trend_velocity: number;
}

export interface PopularityData {
  filament_id: string;
  view_count: number;
}

export interface FilterResult {
  shouldExclude: boolean;
  reason?: string;
}

export type RecommendationReason =
  | "budget_alternative"
  | "premium_upgrade"
  | "same_family"
  | "brand_alternative"
  | "trending_choice"
  | "popular_alternative"
  | "easy_to_print"
  | "similar_properties"
  | "skill_appropriate"
  | "printer_optimized";

export interface RecommendationExplanation {
  reason: RecommendationReason;
  headline: string;
  description: string;
  icon: string;
}

export interface DiversitySlot {
  type: "budget" | "similar" | "premium" | "differentBrand" | "easyToPrint" | "trending";
  filled: boolean;
}

// ============= Scoring Weights =============

const SCORING_WEIGHTS = {
  priceSimilarity: 0.15,
  propertySimilarity: 0.20,
  useCaseOverlap: 0.10,
  brandPreference: 0.10,
  printerCompatibility: 0.15,
  skillLevelMatch: 0.10,
  popularity: 0.10,
  trending: 0.10,
};

// ============= Scoring Functions =============

function calculatePriceSimilarityScore(
  currentPricePerKg: number | null,
  candidatePricePerKg: number | null
): number {
  if (!currentPricePerKg || !candidatePricePerKg) return 0.5;

  const percentDiff = Math.abs((candidatePricePerKg - currentPricePerKg) / currentPricePerKg);

  if (percentDiff <= 0.1) return 1.0;
  if (percentDiff <= 0.2) return 0.8;
  if (percentDiff <= 0.3) return 0.6;
  if (percentDiff <= 0.5) return 0.4;
  return 0.2;
}

function calculatePropertySimilarityScore(
  current: FilamentCandidate,
  candidate: FilamentCandidate
): number {
  const scores: number[] = [];

  // Ease of printing
  if (current.ease_of_printing_score != null && candidate.ease_of_printing_score != null) {
    const diff = Math.abs(current.ease_of_printing_score - candidate.ease_of_printing_score) / 10;
    scores.push(1 - diff);
  }

  // Value score
  if (current.value_score != null && candidate.value_score != null) {
    const diff = Math.abs(current.value_score - candidate.value_score) / 10;
    scores.push(1 - diff);
  }

  // Strength index
  if (current.strength_index != null && candidate.strength_index != null) {
    const diff = Math.abs(current.strength_index - candidate.strength_index);
    scores.push(1 - Math.min(diff, 1));
  }

  // Printability index
  if (current.printability_index != null && candidate.printability_index != null) {
    const diff = Math.abs(current.printability_index - candidate.printability_index) / 10;
    scores.push(1 - diff);
  }

  if (scores.length === 0) return 0.5;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function calculateUseCaseOverlapScore(
  currentTags: string[] | null | undefined,
  candidateTags: string[] | null | undefined
): number {
  if (!currentTags?.length || !candidateTags?.length) return 0.5;

  const currentSet = new Set(currentTags.map(t => t.toLowerCase()));
  const candidateSet = new Set(candidateTags.map(t => t.toLowerCase()));

  // Jaccard similarity
  const intersection = [...currentSet].filter(t => candidateSet.has(t)).length;
  const union = new Set([...currentSet, ...candidateSet]).size;

  return union > 0 ? intersection / union : 0.5;
}

function calculateBrandPreferenceScore(
  candidateVendor: string | null,
  browseHistory: Array<{ vendor?: string | null }>
): number {
  if (!candidateVendor || browseHistory.length === 0) return 0.5;

  const vendorCounts: Record<string, number> = {};
  browseHistory.forEach(item => {
    if (item.vendor) {
      vendorCounts[item.vendor.toLowerCase()] = (vendorCounts[item.vendor.toLowerCase()] || 0) + 1;
    }
  });

  const candidateCount = vendorCounts[candidateVendor.toLowerCase()] || 0;
  const maxCount = Math.max(...Object.values(vendorCounts), 1);

  return candidateCount / maxCount;
}

function calculatePrinterCompatibilityScore(
  candidate: FilamentCandidate,
  printerSpecs: UserContext["printerSpecs"]
): number {
  if (!printerSpecs) return 1.0; // No printer = all compatible

  let score = 1.0;
  let checks = 0;

  // Nozzle temp check
  if (candidate.nozzle_temp_min_c && printerSpecs.maxNozzleTemp) {
    checks++;
    if (candidate.nozzle_temp_min_c <= printerSpecs.maxNozzleTemp) {
      score += 1;
    } else {
      score -= 0.5;
    }
  }

  // Bed temp check
  if (candidate.bed_temp_min_c && printerSpecs.maxBedTemp) {
    checks++;
    if (candidate.bed_temp_min_c <= printerSpecs.maxBedTemp) {
      score += 1;
    } else {
      score -= 0.3;
    }
  }

  // Abrasive check
  if (candidate.is_nozzle_abrasive) {
    checks++;
    if (printerSpecs.abrasiveSupport) {
      score += 1;
    } else {
      score -= 0.4;
    }
  }

  // Enclosure check for high-temp materials
  const needsEnclosure = ["ABS", "ASA", "NYLON", "PC", "PEEK"].some(
    m => candidate.material?.toUpperCase().includes(m)
  );
  if (needsEnclosure) {
    checks++;
    if (printerSpecs.hasEnclosure) {
      score += 1;
    } else {
      score -= 0.3;
    }
  }

  return checks > 0 ? Math.max(0, Math.min(1, score / (checks + 1))) : 1.0;
}

function calculateSkillLevelMatchScore(
  candidate: FilamentCandidate,
  skillLevel: SkillLevel
): number {
  const ease = candidate.ease_of_printing_score;

  if (skillLevel === "beginner") {
    if (ease == null) return 0.5;
    if (ease >= 8) return 1.0;
    if (ease >= 6) return 0.7;
    if (ease >= 4) return 0.4;
    return 0.2;
  }

  if (skillLevel === "intermediate") {
    if (ease == null) return 0.5;
    if (ease >= 5 && ease <= 8) return 1.0;
    return 0.7;
  }

  // Advanced - no penalty
  return 1.0;
}

function calculatePopularityScore(
  candidateId: string,
  popularityData: PopularityData[]
): number {
  if (popularityData.length === 0) return 0.5;

  const candidate = popularityData.find(p => p.filament_id === candidateId);
  if (!candidate) return 0.3;

  const maxViews = Math.max(...popularityData.map(p => p.view_count), 1);
  return candidate.view_count / maxViews;
}

function calculateTrendingScore(
  candidateMaterial: string | null,
  trendingMaterials: TrendingMaterial[]
): number {
  if (!candidateMaterial || trendingMaterials.length === 0) return 0.5;

  const baseMaterial = candidateMaterial.split(/[\s-]/)[0].toLowerCase();
  const trending = trendingMaterials.find(
    t => t.material_filter.toLowerCase().includes(baseMaterial)
  );

  if (!trending) return 0.3;

  // Normalize trend velocity (assuming 0-100 scale)
  return Math.min(1, (trending.trend_velocity + 50) / 100);
}

// ============= Main Scoring Function =============

export function calculateRecommendationFactors(
  current: FilamentCandidate,
  candidate: FilamentCandidate,
  currentPricePerKg: number | null,
  candidatePricePerKg: number | null,
  context: {
    userContext?: UserContext;
    trendingMaterials?: TrendingMaterial[];
    popularityData?: PopularityData[];
  }
): RecommendationFactors {
  const userContext = context.userContext;

  const priceSimilarityScore = calculatePriceSimilarityScore(currentPricePerKg, candidatePricePerKg);
  const propertySimilarityScore = calculatePropertySimilarityScore(current, candidate);
  const useCaseOverlapScore = calculateUseCaseOverlapScore(current.use_case_tags, candidate.use_case_tags);

  const brandPreferenceScore = userContext
    ? calculateBrandPreferenceScore(candidate.vendor, userContext.browseHistory)
    : 0.5;

  const printerCompatibilityScore = userContext
    ? calculatePrinterCompatibilityScore(candidate, userContext.printerSpecs)
    : 1.0;

  const skillLevelMatchScore = userContext
    ? calculateSkillLevelMatchScore(candidate, userContext.skillLevel)
    : 0.7;

  const popularityScore = context.popularityData
    ? calculatePopularityScore(candidate.id, context.popularityData)
    : 0.5;

  const trendingScore = context.trendingMaterials
    ? calculateTrendingScore(candidate.material, context.trendingMaterials)
    : 0.5;

  // Weighted combination
  const relevanceScore =
    priceSimilarityScore * SCORING_WEIGHTS.priceSimilarity +
    propertySimilarityScore * SCORING_WEIGHTS.propertySimilarity +
    useCaseOverlapScore * SCORING_WEIGHTS.useCaseOverlap +
    brandPreferenceScore * SCORING_WEIGHTS.brandPreference +
    printerCompatibilityScore * SCORING_WEIGHTS.printerCompatibility +
    skillLevelMatchScore * SCORING_WEIGHTS.skillLevelMatch +
    popularityScore * SCORING_WEIGHTS.popularity +
    trendingScore * SCORING_WEIGHTS.trending;

  return {
    priceSimilarityScore,
    propertySimilarityScore,
    useCaseOverlapScore,
    brandPreferenceScore,
    printerCompatibilityScore,
    skillLevelMatchScore,
    popularityScore,
    trendingScore,
    relevanceScore,
  };
}

// ============= Negative Filtering =============

export function applyNegativeFilters(
  candidate: FilamentCandidate,
  current: FilamentCandidate,
  candidatePricePerKg: number | null,
  currentPricePerKg: number | null,
  userContext?: UserContext
): FilterResult {
  // 1. Already in favorites
  if (userContext?.favoriteFilamentIds.includes(candidate.id)) {
    return { shouldExclude: true, reason: "already_favorited" };
  }

  // 2. Printer incompatibility - hard exclusions
  if (userContext?.printerSpecs) {
    const { maxNozzleTemp, maxBedTemp, hasEnclosure, abrasiveSupport } = userContext.printerSpecs;

    // Temperature incompatibility
    if (candidate.nozzle_temp_min_c && maxNozzleTemp && candidate.nozzle_temp_min_c > maxNozzleTemp + 20) {
      return { shouldExclude: true, reason: "temp_incompatible" };
    }

    // Abrasive material without support
    if (candidate.is_nozzle_abrasive && abrasiveSupport === false) {
      return { shouldExclude: true, reason: "abrasive_incompatible" };
    }

    // High-temp materials without enclosure
    const needsEnclosure = ["ABS", "ASA", "NYLON", "PC", "PEEK"].some(
      m => candidate.material?.toUpperCase().includes(m)
    );
    if (needsEnclosure && hasEnclosure === false) {
      return { shouldExclude: true, reason: "enclosure_required" };
    }
  }

  // 3. Same product variant (different color)
  if (candidate.product_id && current.product_id && candidate.product_id === current.product_id) {
    return { shouldExclude: true, reason: "same_product_variant" };
  }

  // 4. Significantly worse in ALL metrics
  const easeWorse = (candidate.ease_of_printing_score || 5) < (current.ease_of_printing_score || 5) - 2;
  const valueWorse = (candidate.value_score || 5) < (current.value_score || 5) - 2;
  const strengthWorse = (candidate.strength_index || 0.5) < (current.strength_index || 0.5) - 0.2;
  const moreExpensive = candidatePricePerKg && currentPricePerKg && candidatePricePerKg > currentPricePerKg * 1.3;

  if (easeWorse && valueWorse && strengthWorse && moreExpensive) {
    return { shouldExclude: true, reason: "inferior_all_metrics" };
  }

  return { shouldExclude: false };
}

// ============= Diversity Enforcement =============

export interface ScoredCandidate extends FilamentCandidate {
  pricePerKg: number | null;
  factors: RecommendationFactors;
  priceComparison?: {
    percentDifference: number;
  } | null;
  overallScore?: number | null;
  isTrending?: boolean;
}

export function ensureDiversity(
  candidates: ScoredCandidate[],
  currentVendor: string | null | undefined,
  targetCount: number = 6
): ScoredCandidate[] {
  if (candidates.length <= targetCount) return candidates;

  const selected: ScoredCandidate[] = [];
  const remaining = [...candidates];

  // Helper to find and remove a candidate
  const pickOne = (predicate: (c: ScoredCandidate) => boolean): ScoredCandidate | null => {
    const idx = remaining.findIndex(predicate);
    if (idx === -1) return null;
    const [picked] = remaining.splice(idx, 1);
    return picked;
  };

  // Slot 1: Budget option (20%+ cheaper)
  const budget = pickOne(c => (c.priceComparison?.percentDifference || 0) < -20);
  if (budget) selected.push(budget);

  // Slot 2: Similar price/properties
  const similar = pickOne(c => 
    Math.abs(c.priceComparison?.percentDifference || 0) < 15 &&
    c.factors.propertySimilarityScore > 0.7
  );
  if (similar) selected.push(similar);

  // Slot 3: Premium upgrade (higher score, higher price)
  const premium = pickOne(c => 
    (c.priceComparison?.percentDifference || 0) > 15 &&
    (c.overallScore || 0) > 7
  );
  if (premium) selected.push(premium);

  // Slot 4: Different brand
  const differentBrand = pickOne(c => 
    c.vendor !== currentVendor && c.vendor != null
  );
  if (differentBrand) selected.push(differentBrand);

  // Slot 5: Easy to print (for beginners)
  const easyToPrint = pickOne(c => (c.ease_of_printing_score || 0) >= 8);
  if (easyToPrint) selected.push(easyToPrint);

  // Slot 6: Trending
  const trending = pickOne(c => c.isTrending === true);
  if (trending) selected.push(trending);

  // Fill remaining slots with highest relevance
  while (selected.length < targetCount && remaining.length > 0) {
    remaining.sort((a, b) => b.factors.relevanceScore - a.factors.relevanceScore);
    selected.push(remaining.shift()!);
  }

  // Deduplicate by ID
  const seen = new Set<string>();
  return selected.filter(c => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}

// ============= Explanation Generation =============

export function generateExplanation(
  candidate: ScoredCandidate,
  factors: RecommendationFactors,
  currentVendor: string | null | undefined,
  userContext?: UserContext
): RecommendationExplanation {
  const priceDiff = candidate.priceComparison?.percentDifference || 0;
  const overallScore = candidate.overallScore || 0;
  const isBeginner = userContext?.skillLevel === "beginner";

  // Priority-based explanation selection
  if (priceDiff < -20) {
    return {
      reason: "budget_alternative",
      headline: "Budget Friendly",
      description: `Save ${Math.abs(Math.round(priceDiff))}% with similar quality`,
      icon: "💰",
    };
  }

  if (priceDiff > 20 && overallScore > 7.5) {
    return {
      reason: "premium_upgrade",
      headline: "Premium Upgrade",
      description: "Better performance for demanding prints",
      icon: "⭐",
    };
  }

  if (factors.trendingScore > 0.7 && candidate.isTrending) {
    return {
      reason: "trending_choice",
      headline: "Trending Now",
      description: "Popular choice this week",
      icon: "🔥",
    };
  }

  if (factors.popularityScore > 0.8) {
    return {
      reason: "popular_alternative",
      headline: "Popular Choice",
      description: "Highly rated by the community",
      icon: "👥",
    };
  }

  if (isBeginner && (candidate.ease_of_printing_score || 0) >= 8) {
    return {
      reason: "easy_to_print",
      headline: "Beginner Friendly",
      description: "Great for learning with forgiving settings",
      icon: "🎯",
    };
  }

  if (candidate.vendor !== currentVendor && candidate.vendor) {
    return {
      reason: "brand_alternative",
      headline: "Brand Alternative",
      description: `Try ${candidate.vendor} for this material`,
      icon: "🔄",
    };
  }

  if (factors.printerCompatibilityScore > 0.9 && userContext?.printerSpecs) {
    return {
      reason: "printer_optimized",
      headline: "Printer Optimized",
      description: "Perfect match for your printer specs",
      icon: "🖨️",
    };
  }

  if (factors.propertySimilarityScore > 0.8) {
    return {
      reason: "similar_properties",
      headline: "Similar Properties",
      description: "Comparable performance characteristics",
      icon: "📊",
    };
  }

  // Default
  return {
    reason: "same_family",
    headline: "Same Material Family",
    description: "Compatible alternative in the same category",
    icon: "🧵",
  };
}

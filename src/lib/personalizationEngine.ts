// Comprehensive Personalization Engine
// Aggregates all user signals for personalized recommendation scoring

import type { SkillLevel } from "@/lib/skillLevels";

// ============= Types =============

export type UserSegment = 
  | "first_visit"      // No history, no session
  | "new_visitor"      // Has session, <3 views
  | "returning"        // Has session, 3+ views, <7 days old
  | "regular"          // 7+ day session, 10+ views
  | "power_user";      // Authenticated, 20+ interactions

export interface SearchIntent {
  keywords: string[];
  boostMaterials: string[];
  context: string;
}

export interface PurchaseHistory {
  purchasedMaterials: string[];
  preferredBrands: string[];
  avgPricePerKg: number | null;
  purchaseCount: number;
  daysSinceLastPurchase: number | null;
}

export interface TimeContext {
  firstVisitDate: Date | null;
  lastVisitDate: Date | null;
  sessionAge: number; // days
  totalVisits: number;
  daysSinceLastVisit: number;
}

export interface UserPersonalizationContext {
  // Core identity
  userId: string | null;
  sessionId: string;
  segment: UserSegment;
  skillLevel: SkillLevel;
  
  // Browsing behavior
  materialAffinities: Record<string, number>; // material -> interest score
  brandAffinities: Record<string, number>; // brand -> interest score
  recentSearches: string[];
  viewedFilamentIds: string[];
  
  // Purchase behavior
  purchaseHistory: PurchaseHistory;
  
  // Preferences
  priceSensitivity: "budget" | "moderate" | "premium";
  wishlistIds: string[];
  favoriteIds: string[];
  
  // Printer context
  printerSpecs: {
    maxNozzleTemp: number | null;
    maxBedTemp: number | null;
    hasEnclosure: boolean | null;
    abrasiveSupport: boolean | null;
    hasAMS: boolean | null;
  } | null;
  
  // Time context
  timeContext: TimeContext;
}

// ============= Search Intent Mapping =============

export const SEARCH_INTENT_MAP: Record<string, SearchIntent> = {
  outdoor: {
    keywords: ["outdoor", "uv", "weather", "sun", "exterior"],
    boostMaterials: ["ASA", "PETG", "ABS"],
    context: "uv_resistant",
  },
  flexible: {
    keywords: ["flexible", "rubber", "soft", "bendable", "elastic"],
    boostMaterials: ["TPU", "TPE", "TPC"],
    context: "flexible",
  },
  strong: {
    keywords: ["strong", "tough", "durable", "structural", "functional"],
    boostMaterials: ["PA-CF", "PETG-CF", "PC", "Nylon", "ABS"],
    context: "functional",
  },
  waterproof: {
    keywords: ["water", "waterproof", "moisture", "bathroom", "wet"],
    boostMaterials: ["PETG", "ASA", "PP"],
    context: "moisture_resistant",
  },
  food: {
    keywords: ["food", "food-safe", "kitchen", "container", "utensil"],
    boostMaterials: ["PLA", "PETG", "PP"],
    context: "food_safe",
  },
  heat: {
    keywords: ["heat", "hot", "temperature", "automotive", "engine"],
    boostMaterials: ["PC", "PEEK", "PA-CF", "ASA", "ABS"],
    context: "heat_resistant",
  },
  easy: {
    keywords: ["easy", "beginner", "simple", "first"],
    boostMaterials: ["PLA", "PLA+", "PETG"],
    context: "beginner_friendly",
  },
  cheap: {
    keywords: ["cheap", "budget", "affordable", "inexpensive", "value"],
    boostMaterials: ["PLA", "PETG"],
    context: "budget",
  },
  carbon: {
    keywords: ["carbon", "cf", "fiber", "reinforced"],
    boostMaterials: ["PA-CF", "PETG-CF", "PLA-CF", "PC-CF"],
    context: "reinforced",
  },
  wood: {
    keywords: ["wood", "wooden", "natural"],
    boostMaterials: ["PLA-Wood"],
    context: "aesthetic",
  },
};

// ============= Segment Derivation =============

export function deriveUserSegment(
  userId: string | null,
  viewCount: number,
  sessionAge: number,
  purchaseCount: number
): UserSegment {
  // Authenticated power user
  if (userId && (viewCount >= 20 || purchaseCount >= 3)) {
    return "power_user";
  }
  
  // Regular returning user
  if (sessionAge >= 7 && viewCount >= 10) {
    return "regular";
  }
  
  // Returning visitor
  if (sessionAge >= 1 && viewCount >= 3) {
    return "returning";
  }
  
  // New visitor with some activity
  if (viewCount >= 1) {
    return "new_visitor";
  }
  
  return "first_visit";
}

// ============= Search Context Analysis =============

export function analyzeSearchContext(recentSearches: string[]): {
  matchedIntents: SearchIntent[];
  materialBoosts: Record<string, number>;
} {
  const matchedIntents: SearchIntent[] = [];
  const materialBoosts: Record<string, number> = {};
  
  const searchText = recentSearches.join(" ").toLowerCase();
  
  for (const [key, intent] of Object.entries(SEARCH_INTENT_MAP)) {
    const hasMatch = intent.keywords.some(kw => searchText.includes(kw));
    if (hasMatch) {
      matchedIntents.push(intent);
      // Boost materials based on matched intent
      intent.boostMaterials.forEach(mat => {
        materialBoosts[mat] = (materialBoosts[mat] || 0) + 0.2;
      });
    }
  }
  
  return { matchedIntents, materialBoosts };
}

// ============= Upgrade Path Suggestions =============

const MATERIAL_UPGRADE_PATHS: Record<string, { to: string; reason: string }[]> = {
  PLA: [
    { to: "PLA+", reason: "Better layer adhesion and impact resistance" },
    { to: "PLA-CF", reason: "3x stiffer for functional parts" },
    { to: "PETG", reason: "Better temperature resistance" },
  ],
  "PLA+": [
    { to: "PETG", reason: "Better heat resistance and flexibility" },
    { to: "PLA-CF", reason: "Reinforced for structural parts" },
  ],
  PETG: [
    { to: "ASA", reason: "UV resistance for outdoor use" },
    { to: "PETG-CF", reason: "Carbon fiber reinforced strength" },
    { to: "ABS", reason: "Higher temperature resistance" },
  ],
  ABS: [
    { to: "ASA", reason: "UV stable without losing properties" },
    { to: "PC", reason: "Maximum impact resistance" },
  ],
  ASA: [
    { to: "PC", reason: "Higher heat and impact resistance" },
  ],
  Nylon: [
    { to: "PA-CF", reason: "Carbon fiber reinforced strength" },
  ],
  TPU: [
    { to: "TPE", reason: "Different flexibility profiles" },
  ],
};

export function getSuggestedUpgrades(
  purchasedMaterials: string[]
): Array<{ from: string; to: string; reason: string }> {
  const suggestions: Array<{ from: string; to: string; reason: string }> = [];
  
  for (const material of purchasedMaterials) {
    const baseMat = material.split(/[\s-]/)[0].toUpperCase();
    const upgrades = MATERIAL_UPGRADE_PATHS[baseMat];
    
    if (upgrades) {
      // Only suggest if user hasn't already tried the upgrade
      for (const upgrade of upgrades) {
        const hasTried = purchasedMaterials.some(
          pm => pm.toUpperCase().includes(upgrade.to.toUpperCase())
        );
        if (!hasTried) {
          suggestions.push({
            from: baseMat,
            to: upgrade.to,
            reason: upgrade.reason,
          });
        }
      }
    }
  }
  
  return suggestions.slice(0, 3); // Limit to top 3
}

// ============= Personalization Scoring =============

export interface PersonalizationBoosts {
  searchContextBoost: number;
  wishlistBoost: number;
  purchaseAffinityBoost: number;
  materialAffinityBoost: number;
  brandAffinityBoost: number;
  noveltyBoost: number;
  timeRelevanceBoost: number;
  skillLevelBoost: number;
}

export function calculatePersonalizationBoosts(
  candidateId: string,
  candidateMaterial: string | null,
  candidateBrand: string | null,
  candidateEase: number | null,
  context: UserPersonalizationContext
): PersonalizationBoosts {
  const baseMaterial = candidateMaterial?.split(/[\s-]/)[0].toUpperCase() || "";
  const normalizedBrand = candidateBrand?.toLowerCase() || "";
  
  // 1. Search Context Boost
  const { materialBoosts } = analyzeSearchContext(context.recentSearches);
  const searchContextBoost = materialBoosts[baseMaterial] || 0;
  
  // 2. Wishlist Boost - high priority if in wishlist
  const wishlistBoost = context.wishlistIds.includes(candidateId) ? 0.3 : 0;
  
  // 3. Purchase Affinity - based on past purchases
  let purchaseAffinityBoost = 0;
  if (context.purchaseHistory.purchasedMaterials.length > 0) {
    const hasPurchasedSimilar = context.purchaseHistory.purchasedMaterials.some(
      pm => pm.toUpperCase().includes(baseMaterial)
    );
    if (hasPurchasedSimilar) {
      purchaseAffinityBoost = 0.15;
    }
  }
  
  // 4. Material Affinity - based on browsing history
  const materialAffinityBoost = Math.min(
    0.2,
    (context.materialAffinities[baseMaterial] || 0) * 0.05
  );
  
  // 5. Brand Affinity - based on browsing history
  const brandAffinityBoost = Math.min(
    0.15,
    (context.brandAffinities[normalizedBrand] || 0) * 0.03
  );
  
  // 6. Novelty Boost - materials user hasn't tried
  let noveltyBoost = 0;
  if (context.segment === "power_user" || context.segment === "regular") {
    const hasTried = context.purchaseHistory.purchasedMaterials.some(
      pm => pm.toUpperCase().includes(baseMaterial)
    );
    const hasViewed = context.viewedFilamentIds.includes(candidateId);
    if (!hasTried && !hasViewed) {
      noveltyBoost = 0.1;
    }
  }
  
  // 7. Time Relevance Boost - based on user lifecycle
  let timeRelevanceBoost = 0;
  if (context.segment === "first_visit") {
    // Boost popular/easy materials for first-time visitors
    if (["PLA", "PETG"].includes(baseMaterial)) {
      timeRelevanceBoost = 0.15;
    }
  } else if (context.segment === "returning") {
    // Boost for returning users who might want to try new things
    if (context.purchaseHistory.purchaseCount === 0) {
      timeRelevanceBoost = 0.1;
    }
  }
  
  // 8. Skill Level Boost
  let skillLevelBoost = 0;
  const ease = candidateEase || 5;
  
  if (context.skillLevel === "beginner") {
    if (ease >= 8) skillLevelBoost = 0.2;
    else if (ease >= 6) skillLevelBoost = 0.1;
    else if (ease < 4) skillLevelBoost = -0.2; // Penalty for difficult materials
  } else if (context.skillLevel === "intermediate") {
    if (ease >= 5 && ease <= 8) skillLevelBoost = 0.1;
  } else if (context.skillLevel === "advanced") {
    // Advanced users get boost for challenging materials
    if (ease < 5) skillLevelBoost = 0.1;
  }
  
  return {
    searchContextBoost,
    wishlistBoost,
    purchaseAffinityBoost,
    materialAffinityBoost,
    brandAffinityBoost,
    noveltyBoost,
    timeRelevanceBoost,
    skillLevelBoost,
  };
}

// ============= Aggregate Personalization Score =============

const PERSONALIZATION_WEIGHTS = {
  searchContext: 0.15,
  wishlist: 0.12,
  purchaseAffinity: 0.10,
  materialAffinity: 0.10,
  brandAffinity: 0.08,
  novelty: 0.08,
  timeRelevance: 0.07,
  skillLevel: 0.10,
};

export function calculatePersonalizedScore(
  baseScore: number,
  boosts: PersonalizationBoosts
): number {
  const totalBoost =
    boosts.searchContextBoost * PERSONALIZATION_WEIGHTS.searchContext +
    boosts.wishlistBoost * PERSONALIZATION_WEIGHTS.wishlist +
    boosts.purchaseAffinityBoost * PERSONALIZATION_WEIGHTS.purchaseAffinity +
    boosts.materialAffinityBoost * PERSONALIZATION_WEIGHTS.materialAffinity +
    boosts.brandAffinityBoost * PERSONALIZATION_WEIGHTS.brandAffinity +
    boosts.noveltyBoost * PERSONALIZATION_WEIGHTS.novelty +
    boosts.timeRelevanceBoost * PERSONALIZATION_WEIGHTS.timeRelevance +
    boosts.skillLevelBoost * PERSONALIZATION_WEIGHTS.skillLevel;
  
  return Math.min(1, Math.max(0, baseScore + totalBoost));
}

// ============= Explanation Generation =============

export interface PersonalizationExplanation {
  primaryReason: string;
  icon: string;
  badge?: string;
}

export function generatePersonalizationExplanation(
  boosts: PersonalizationBoosts,
  context: UserPersonalizationContext
): PersonalizationExplanation | null {
  // Priority order for explanations
  if (boosts.wishlistBoost > 0) {
    return {
      primaryReason: "On your wishlist",
      icon: "⭐",
      badge: "Wishlisted",
    };
  }
  
  if (boosts.searchContextBoost > 0.1) {
    const intents = analyzeSearchContext(context.recentSearches);
    const topIntent = intents.matchedIntents[0];
    if (topIntent) {
      return {
        primaryReason: `Matches your "${topIntent.context.replace("_", " ")}" search`,
        icon: "🔍",
        badge: "Search Match",
      };
    }
  }
  
  if (boosts.purchaseAffinityBoost > 0) {
    return {
      primaryReason: "Similar to your past purchases",
      icon: "🛒",
      badge: "Bought Before",
    };
  }
  
  if (boosts.noveltyBoost > 0) {
    return {
      primaryReason: "Something new to try",
      icon: "✨",
      badge: "New for You",
    };
  }
  
  if (boosts.skillLevelBoost > 0.15) {
    if (context.skillLevel === "beginner") {
      return {
        primaryReason: "Beginner-friendly material",
        icon: "🎯",
        badge: "Easy Print",
      };
    } else if (context.skillLevel === "advanced") {
      return {
        primaryReason: "For experienced users",
        icon: "🔬",
        badge: "Advanced",
      };
    }
  }
  
  if (boosts.timeRelevanceBoost > 0.1 && context.segment === "first_visit") {
    return {
      primaryReason: "Popular choice for new users",
      icon: "👍",
      badge: "Popular",
    };
  }
  
  if (boosts.materialAffinityBoost > 0.1) {
    return {
      primaryReason: "Based on your browsing",
      icon: "📊",
      badge: "For You",
    };
  }
  
  return null;
}

// ============= Price Sensitivity Filtering =============

export function filterByPriceSensitivity(
  candidatePricePerKg: number | null,
  referencePricePerKg: number | null,
  sensitivity: "budget" | "moderate" | "premium"
): boolean {
  if (!candidatePricePerKg) return true;
  
  if (sensitivity === "budget") {
    // Budget users: show items up to 20% more expensive than reference
    if (referencePricePerKg) {
      return candidatePricePerKg <= referencePricePerKg * 1.2;
    }
    // Or under $20/kg if no reference
    return candidatePricePerKg <= 20;
  }
  
  if (sensitivity === "premium") {
    // Premium users: no filtering, show everything
    return true;
  }
  
  // Moderate: show items up to 50% more expensive
  if (referencePricePerKg) {
    return candidatePricePerKg <= referencePricePerKg * 1.5;
  }
  return candidatePricePerKg <= 40;
}

import { useMemo } from "react";
import { useAuth } from "./useAuth";
import { useUserPersonalization } from "./useUserPersonalization";
import { useUserSkillLevel } from "./useUserSkillLevel";
import { usePurchaseHistory } from "./usePurchaseHistory";
import { useSearchContext } from "./useSearchContext";
import { useWishlist } from "./useWishlist";
import { useBrowseHistory } from "./useBrowseHistory";
import { getTimeContext, getTimeBasedRecommendations } from "@/lib/timePersonalization";
import {
  deriveUserSegment,
  calculatePersonalizationBoosts,
  calculatePersonalizedScore,
  generatePersonalizationExplanation,
  type UserPersonalizationContext,
  type PersonalizationBoosts,
  type PersonalizationExplanation,
} from "@/lib/personalizationEngine";

const SESSION_KEY = "filascope_session_id";

function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export interface PersonalizedRecommendation {
  filamentId: string;
  baseScore: number;
  personalizedScore: number;
  boosts: PersonalizationBoosts;
  explanation: PersonalizationExplanation | null;
  badges: string[];
}

export function usePersonalizedRecommendations() {
  const { user } = useAuth();
  const { 
    favoriteFilamentIds, 
    printerSpecs, 
    priceSensitivity,
    topMaterials,
    recentlyViewed,
  } = useUserPersonalization();
  const { skillLevel } = useUserSkillLevel();
  const { 
    purchasedMaterials, 
    preferredBrands, 
    avgPricePerKg, 
    purchaseCount,
    daysSinceLastPurchase,
    suggestedUpgrades,
  } = usePurchaseHistory();
  const { recentSearches, materialBoosts } = useSearchContext();
  const { items: wishlistItems } = useWishlist();
  const { history: browseHistory } = useBrowseHistory(20);

  // Build the full personalization context
  const personalizationContext: UserPersonalizationContext = useMemo(() => {
    const timeContext = getTimeContext();
    const viewCount = browseHistory.length;
    
    // Derive user segment
    const segment = deriveUserSegment(
      user?.id || null,
      viewCount,
      timeContext.sessionAge,
      purchaseCount
    );

    // Build material affinities from browse history
    const materialAffinities: Record<string, number> = {};
    browseHistory.forEach((item) => {
      if (item.filament?.material) {
        const baseMat = item.filament.material.split(/[\s-]/)[0].toUpperCase();
        materialAffinities[baseMat] = (materialAffinities[baseMat] || 0) + 1;
      }
    });

    // Build brand affinities
    const brandAffinities: Record<string, number> = {};
    browseHistory.forEach((item) => {
      if (item.filament?.vendor) {
        const brand = item.filament.vendor.toLowerCase();
        brandAffinities[brand] = (brandAffinities[brand] || 0) + 1;
      }
    });

    // Get wishlist IDs
    const wishlistIds = wishlistItems.map((item) => item.filament_id);

    // Get viewed filament IDs
    const viewedFilamentIds = browseHistory.map((item) => item.product_id);

    return {
      userId: user?.id || null,
      sessionId: getSessionId(),
      segment,
      skillLevel,
      materialAffinities,
      brandAffinities,
      recentSearches,
      viewedFilamentIds,
      purchaseHistory: {
        purchasedMaterials,
        preferredBrands,
        avgPricePerKg,
        purchaseCount,
        daysSinceLastPurchase,
      },
      priceSensitivity,
      wishlistIds,
      favoriteIds: favoriteFilamentIds,
      printerSpecs: printerSpecs ? {
        ...printerSpecs,
        hasAMS: null, // Could be enhanced later
      } : null,
      timeContext,
    };
  }, [
    user?.id,
    skillLevel,
    browseHistory,
    wishlistItems,
    recentSearches,
    purchasedMaterials,
    preferredBrands,
    avgPricePerKg,
    purchaseCount,
    daysSinceLastPurchase,
    priceSensitivity,
    favoriteFilamentIds,
    printerSpecs,
  ]);

  // Get time-based recommendation strategy
  const timeRecommendations = useMemo(() => {
    return getTimeBasedRecommendations(
      personalizationContext.timeContext,
      purchasedMaterials,
      !!user?.id
    );
  }, [personalizationContext.timeContext, purchasedMaterials, user?.id]);

  // Function to get personalized score for a candidate
  const getPersonalizedScore = (
    candidateId: string,
    candidateMaterial: string | null,
    candidateBrand: string | null,
    candidateEase: number | null,
    baseScore: number
  ): PersonalizedRecommendation => {
    const boosts = calculatePersonalizationBoosts(
      candidateId,
      candidateMaterial,
      candidateBrand,
      candidateEase,
      personalizationContext
    );

    const personalizedScore = calculatePersonalizedScore(baseScore, boosts);
    const explanation = generatePersonalizationExplanation(boosts, personalizationContext);

    // Build badges
    const badges: string[] = [];
    if (boosts.wishlistBoost > 0) badges.push("⭐ On your wishlist");
    if (boosts.searchContextBoost > 0.1) badges.push("🔍 Search match");
    if (boosts.noveltyBoost > 0) badges.push("✨ New for you");
    if (boosts.skillLevelBoost > 0.15) {
      if (skillLevel === "beginner") badges.push("🎯 Easy print");
      else if (skillLevel === "advanced") badges.push("🔬 Advanced");
    }
    if (timeRecommendations.showNewBadge) badges.push("🆕 New arrival");

    return {
      filamentId: candidateId,
      baseScore,
      personalizedScore,
      boosts,
      explanation,
      badges,
    };
  };

  return {
    // Context
    personalizationContext,
    timeRecommendations,
    suggestedUpgrades,
    
    // Functions
    getPersonalizedScore,
    
    // Derived data
    userSegment: personalizationContext.segment,
    topMaterials,
    purchasedMaterials,
    isAuthenticated: !!user?.id,
    
    // Search context
    recentSearches,
    searchMaterialBoosts: materialBoosts,
  };
}

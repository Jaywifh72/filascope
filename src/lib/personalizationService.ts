// Personalization utilities for filtering and prioritizing content

interface PrinterSpecs {
  maxNozzleTemp?: number | null;
  maxBedTemp?: number | null;
  hasEnclosure?: boolean | null;
  abrasiveSupport?: boolean | null;
}

interface FilamentLike {
  id: string;
  material?: string | null;
  nozzle_temp_min_c?: number | null;
  nozzle_temp_max_c?: number | null;
  bed_temp_min_c?: number | null;
  bed_temp_max_c?: number | null;
  is_nozzle_abrasive?: boolean | null;
  variant_price?: number | null;
}

interface DealLike {
  id: string;
  filament_id?: string | null;
  filament?: FilamentLike | null;
}

// Check if a filament is compatible with printer specs
export function isFilamentCompatibleWithPrinter(
  filament: FilamentLike,
  specs: PrinterSpecs
): boolean {
  // Check nozzle temp
  if (specs.maxNozzleTemp && filament.nozzle_temp_min_c) {
    if (filament.nozzle_temp_min_c > specs.maxNozzleTemp) {
      return false;
    }
  }

  // Check bed temp
  if (specs.maxBedTemp && filament.bed_temp_min_c) {
    if (filament.bed_temp_min_c > specs.maxBedTemp) {
      return false;
    }
  }

  // Check abrasive material support
  if (filament.is_nozzle_abrasive && !specs.abrasiveSupport) {
    return false;
  }

  return true;
}

// Filter deals to only printer-compatible materials
export function filterDealsForPrinter<T extends DealLike>(
  deals: T[],
  specs: PrinterSpecs | null
): T[] {
  if (!specs) return deals;

  return deals.filter((deal) => {
    if (!deal.filament) return true; // Include if no filament data
    return isFilamentCompatibleWithPrinter(deal.filament, specs);
  });
}

// Prioritize items that are in user's favorites
export function prioritizeFavorites<T extends { id?: string; filament_id?: string }>(
  items: T[],
  favoriteIds: string[]
): T[] {
  if (!favoriteIds.length) return items;

  const favoriteSet = new Set(favoriteIds);
  const favorites: T[] = [];
  const others: T[] = [];

  items.forEach((item) => {
    const id = item.filament_id || item.id;
    if (id && favoriteSet.has(id)) {
      favorites.push(item);
    } else {
      others.push(item);
    }
  });

  return [...favorites, ...others];
}

// Filter items by material interest
export function filterByMaterialInterest<T extends { material?: string | null }>(
  items: T[],
  interests: string[]
): T[] {
  if (!interests.length) return items;

  const interestSet = new Set(interests.map((i) => i.toLowerCase()));
  return items.filter((item) => {
    if (!item.material) return false;
    return interestSet.has(item.material.toLowerCase());
  });
}

// Highlight items matching user's material interests
export function highlightByMaterialInterest<T extends { material?: string | null }>(
  items: T[],
  interests: string[]
): (T & { isInterestMatch: boolean })[] {
  if (!interests.length) return items.map((i) => ({ ...i, isInterestMatch: false }));

  const interestSet = new Set(interests.map((i) => i.toLowerCase()));
  return items.map((item) => ({
    ...item,
    isInterestMatch: item.material ? interestSet.has(item.material.toLowerCase()) : false,
  }));
}

// Get smart module order based on engagement
export function getSmartModuleOrder(
  engagement: Record<string, number>,
  defaultOrder: string[]
): string[] {
  // Safety always stays first
  const safetyModule = "safety";
  
  const otherModules = defaultOrder.filter((m) => m !== safetyModule);
  
  // Sort by engagement score
  const sorted = otherModules.sort((a, b) => {
    const scoreA = engagement[a] || 0;
    const scoreB = engagement[b] || 0;
    return scoreB - scoreA;
  });

  return [safetyModule, ...sorted];
}

// Determine price sensitivity from viewing patterns
export function derivePriceSensitivity(
  viewedPrices: number[]
): "budget" | "moderate" | "premium" {
  if (!viewedPrices.length) return "moderate";

  const avgPrice = viewedPrices.reduce((a, b) => a + b, 0) / viewedPrices.length;
  const pricePerKg = avgPrice; // Assuming prices are already per kg

  if (pricePerKg < 20) return "budget";
  if (pricePerKg > 40) return "premium";
  return "moderate";
}

// Get seasonal recommendations based on current date
export function getSeasonalRecommendations(): {
  materials: string[];
  message: string;
} {
  const month = new Date().getMonth(); // 0-11

  // Holiday season (Nov-Dec)
  if (month === 10 || month === 11) {
    return {
      materials: ["PLA-Silk", "PLA-Glow", "PLA-Metal"],
      message: "Popular for holiday prints",
    };
  }

  // Spring (Mar-May)
  if (month >= 2 && month <= 4) {
    return {
      materials: ["PLA", "PETG"],
      message: "Great weather for outdoor prints",
    };
  }

  // Summer (Jun-Aug)
  if (month >= 5 && month <= 7) {
    return {
      materials: ["ASA", "ABS", "PETG"],
      message: "Heat-resistant materials for summer",
    };
  }

  // Fall (Sep-Oct)
  if (month >= 8 && month <= 9) {
    return {
      materials: ["Wood PLA", "PLA"],
      message: "Autumn-themed prints",
    };
  }

  // Winter (Jan-Feb)
  return {
    materials: ["ABS", "ASA", "Nylon"],
    message: "Enclosed printing season",
  };
}

// Personalization utilities for filtering and prioritizing content
import type { NozzleMaterial, FlowType, NozzleSize } from "@/hooks/useNozzleConfig";

export interface NozzleConfig {
  size: NozzleSize;
  material: NozzleMaterial;
  flowType: FlowType;
}

interface PrinterSpecs {
  maxNozzleTemp?: number | null;
  maxBedTemp?: number | null;
  hasEnclosure?: boolean | null;
  abrasiveSupport?: boolean | null;
  nozzleConfig?: NozzleConfig | null;
  maxFlowRate?: number | null;
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
  high_speed_capable?: boolean | null;
  carbon_fiber_percentage?: number | null;
  glass_fiber_percentage?: number | null;
}

interface DealLike {
  id: string;
  filament_id?: string | null;
  filament?: FilamentLike | null;
}

// Check if nozzle material supports abrasive filaments
export function nozzleSupportsAbrasive(material: NozzleMaterial): boolean {
  return material !== "brass";
}

// Check if a filament is compatible with printer specs (including nozzle config)
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

  // Check abrasive material support based on nozzle material
  const isAbrasive = filament.is_nozzle_abrasive || 
    (filament.carbon_fiber_percentage && filament.carbon_fiber_percentage > 0) ||
    (filament.glass_fiber_percentage && filament.glass_fiber_percentage > 0);

  if (isAbrasive) {
    // If we have nozzle config, use material check
    if (specs.nozzleConfig) {
      if (!nozzleSupportsAbrasive(specs.nozzleConfig.material)) {
        return false;
      }
    } else if (!specs.abrasiveSupport) {
      // Fall back to printer-level abrasive support
      return false;
    }
  }

  // Check flow rate for high-speed filaments with regular nozzles
  if (specs.nozzleConfig && filament.high_speed_capable) {
    // High-speed filaments work better with high-flow nozzles
    // This is a soft check - we don't block but could add a warning
  }

  return true;
}

// Get compatibility warnings for a filament
export function getFilamentCompatibilityWarnings(
  filament: FilamentLike,
  specs: PrinterSpecs
): string[] {
  const warnings: string[] = [];

  // Check nozzle material for abrasive filaments
  const isAbrasive = filament.is_nozzle_abrasive || 
    (filament.carbon_fiber_percentage && filament.carbon_fiber_percentage > 0) ||
    (filament.glass_fiber_percentage && filament.glass_fiber_percentage > 0);

  if (isAbrasive && specs.nozzleConfig?.material === "brass") {
    warnings.push("This filament is abrasive and will wear out brass nozzles quickly. Consider using a hardened steel or tungsten carbide nozzle.");
  }

  // Check for high-speed filaments with regular nozzles
  if (filament.high_speed_capable && specs.nozzleConfig?.flowType === "regular") {
    warnings.push("This high-speed filament may benefit from a high-flow nozzle for optimal performance.");
  }

  // Check small nozzle with high-viscosity materials
  if (specs.nozzleConfig?.size === 0.2) {
    const material = filament.material?.toLowerCase() || "";
    if (material.includes("nylon") || material.includes("pa") || material.includes("pc")) {
      warnings.push("Small 0.2mm nozzles may clog more easily with this material. Consider a larger nozzle size.");
    }
  }

  return warnings;
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

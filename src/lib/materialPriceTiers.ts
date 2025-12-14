// Material price tiers based on actual database averages (USD per kg)
// Used to determine if a filament is budget-friendly, competitive, or premium

export interface PriceTier {
  budget: number;    // Below this = budget-friendly
  premium: number;   // Above this = premium
  // Between budget and premium = competitive
}

export const MATERIAL_PRICE_TIERS: Record<string, PriceTier> = {
  "PLA": { budget: 18, premium: 32 },
  "PLA+": { budget: 20, premium: 35 },
  "PLA-Silk": { budget: 22, premium: 40 },
  "PETG": { budget: 22, premium: 38 },
  "ABS": { budget: 20, premium: 35 },
  "ASA": { budget: 28, premium: 50 },
  "TPU": { budget: 30, premium: 55 },
  "Nylon": { budget: 35, premium: 65 },
  "PC": { budget: 40, premium: 75 },
  "PEEK": { budget: 300, premium: 600 },
  "PVA": { budget: 50, premium: 90 },
  "HIPS": { budget: 22, premium: 40 },
  "PP": { budget: 35, premium: 60 },
  "CPE": { budget: 40, premium: 70 },
  "PEI": { budget: 150, premium: 300 },
  "PA-CF": { budget: 60, premium: 120 },
  "Wood": { budget: 28, premium: 50 },
};

// Default tier for unknown materials
const DEFAULT_TIER: PriceTier = { budget: 25, premium: 45 };

export interface PriceContext {
  label: string;
  colorClass: string;
  iconName: "piggy-bank" | "scale" | "crown";
}

export function getPriceContext(pricePerKg: number, material: string | null | undefined): PriceContext {
  const baseMaterial = material?.split(/[\s\-+]/)[0] || "";
  const tier = MATERIAL_PRICE_TIERS[baseMaterial] || MATERIAL_PRICE_TIERS[material || ""] || DEFAULT_TIER;
  
  if (pricePerKg <= tier.budget) {
    return {
      label: "Budget-friendly",
      colorClass: "text-green-400",
      iconName: "piggy-bank",
    };
  }
  
  if (pricePerKg >= tier.premium) {
    return {
      label: "Premium",
      colorClass: "text-purple-400",
      iconName: "crown",
    };
  }
  
  return {
    label: "Competitive",
    colorClass: "text-muted-foreground",
    iconName: "scale",
  };
}

export function isBestPriceInRange(
  currentPrice: number,
  historicalLow: number,
  tolerance: number = 0.05
): boolean {
  // Returns true if current price is within tolerance% of historical low
  return currentPrice <= historicalLow * (1 + tolerance);
}

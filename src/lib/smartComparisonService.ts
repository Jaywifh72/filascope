// Smart Comparison Suggestions Service
// Provides intelligent comparison recommendations based on material type, variants, and price tiers

export interface SmartComparisonSuggestion {
  id: string;
  name: string;
  material: string;
  vendor: string | null;
  price: number | null;
  strength_index: number | null;
  printability_index: number | null;
  color_hex: string | null;
  relevanceReason: string;
  relevanceType: "variant" | "budget" | "premium" | "alternative" | "cross-brand";
}

interface FilamentForComparison {
  id: string;
  product_title: string;
  material: string | null;
  vendor: string | null;
  variant_price: number | null;
  net_weight_g: number | null;
  strength_index: number | null;
  printability_index: number | null;
  color_hex: string | null;
}

// Material variant mappings for smart suggestions
const VARIANT_COMPARISONS: Record<string, { compare: string[]; reason: string }> = {
  // PLA variants
  "tough": { compare: ["basic", "standard", "pla"], reason: "Standard alternative" },
  "pro": { compare: ["basic", "standard"], reason: "Budget alternative" },
  "plus": { compare: ["standard", "basic"], reason: "Standard version" },
  "silk": { compare: ["matte", "standard"], reason: "Different finish" },
  "matte": { compare: ["silk", "gloss"], reason: "Different finish" },
  "gloss": { compare: ["matte", "silk"], reason: "Different finish" },
  "glow": { compare: ["standard", "basic"], reason: "Non-glow version" },
  "galaxy": { compare: ["standard", "basic"], reason: "Solid color option" },
  "marble": { compare: ["standard", "solid"], reason: "Solid color option" },
  "gradient": { compare: ["standard", "solid"], reason: "Solid color option" },
  "cf": { compare: ["standard", "basic"], reason: "Non-reinforced version" },
  "gf": { compare: ["standard", "basic"], reason: "Non-reinforced version" },
  "wood": { compare: ["standard", "pla"], reason: "Standard PLA" },
  "metal": { compare: ["standard", "silk"], reason: "Standard finish" },
  "engineering": { compare: ["basic", "standard"], reason: "Consumer grade" },
  "ht": { compare: ["standard"], reason: "Standard temp version" },
  "high-speed": { compare: ["standard"], reason: "Regular speed version" },
  "hs": { compare: ["standard"], reason: "Regular speed version" },
};

// Material alternative mappings
const MATERIAL_ALTERNATIVES: Record<string, { materials: string[]; reason: string }> = {
  "petg": { materials: ["pla", "abs"], reason: "Compare with PLA and ABS" },
  "abs": { materials: ["asa", "petg"], reason: "Compare with ASA and PETG" },
  "asa": { materials: ["abs", "petg"], reason: "Compare with ABS and PETG" },
  "pla": { materials: ["petg", "pla+"], reason: "Compare with PETG" },
  "tpu": { materials: ["tpe", "tpu"], reason: "Compare flexible options" },
  "nylon": { materials: ["petg", "pa-cf"], reason: "Compare alternatives" },
  "pc": { materials: ["petg", "abs"], reason: "Compare alternatives" },
  "pla+": { materials: ["pla", "petg"], reason: "Compare with standard PLA" },
};

/**
 * Detects variant type from product title
 */
function detectVariantType(title: string): string | null {
  const lowerTitle = (title || '').toLowerCase();
  
  for (const variant of Object.keys(VARIANT_COMPARISONS)) {
    if (lowerTitle.includes(variant)) {
      return variant;
    }
  }
  
  return null;
}

/**
 * Gets the base material from a material string (e.g., "PLA Tough" -> "PLA")
 */
function getBaseMaterial(material: string | null): string {
  if (!material) return "PLA";
  
  const parts = material.split(/[\s-]+/);
  return parts[0].toUpperCase();
}

/**
 * Calculates price per kg for comparison
 */
function getPricePerKg(price: number | null, weight: number | null): number | null {
  if (!price || !weight || weight === 0) return price;
  return (price / weight) * 1000;
}

/**
 * Determines smart comparison suggestions based on current filament
 */
export function getSmartComparisonContext(
  currentFilament: FilamentForComparison
): {
  variantSuggestion: { searchTerms: string[]; reason: string } | null;
  materialAlternatives: { materials: string[]; reason: string } | null;
  priceTierSuggestion: "budget" | "premium" | null;
} {
  const title = currentFilament.product_title || "";
  const material = currentFilament.material || "";
  const baseMaterial = getBaseMaterial(material);
  
  // Check for variant type
  const variantType = detectVariantType(title);
  let variantSuggestion = null;
  
  if (variantType && VARIANT_COMPARISONS[variantType]) {
    variantSuggestion = {
      searchTerms: VARIANT_COMPARISONS[variantType].compare,
      reason: VARIANT_COMPARISONS[variantType].reason
    };
  }
  
  // Check for material alternatives
  const materialKey = baseMaterial.toLowerCase();
  const materialAlternatives = MATERIAL_ALTERNATIVES[materialKey] || null;
  
  // Determine price tier suggestion
  const pricePerKg = getPricePerKg(currentFilament.variant_price, currentFilament.net_weight_g);
  let priceTierSuggestion: "budget" | "premium" | null = null;
  
  if (pricePerKg) {
    if (pricePerKg > 25) {
      priceTierSuggestion = "budget"; // Suggest finding budget alternatives
    } else if (pricePerKg < 15) {
      priceTierSuggestion = "premium"; // Suggest premium options
    }
  }
  
  return {
    variantSuggestion,
    materialAlternatives,
    priceTierSuggestion
  };
}

/**
 * Scores a potential comparison filament for relevance
 */
export function scoreComparisonRelevance(
  current: FilamentForComparison,
  candidate: FilamentForComparison,
  context: ReturnType<typeof getSmartComparisonContext>
): { score: number; reason: string; type: SmartComparisonSuggestion["relevanceType"] } {
  let score = 0;
  let reason = "Similar material";
  let type: SmartComparisonSuggestion["relevanceType"] = "alternative";
  
  const currentTitle = (current.product_title || '').toLowerCase();
  const candidateTitle = (candidate.product_title || '').toLowerCase();
  const currentMaterial = getBaseMaterial(current.material);
  const candidateMaterial = getBaseMaterial(candidate.material);
  
  // Same material type is a base requirement
  if (currentMaterial === candidateMaterial) {
    score += 10;
  } else {
    // Check if it's a recommended alternative material
    if (context.materialAlternatives?.materials.includes(candidateMaterial.toLowerCase())) {
      score += 8;
      reason = context.materialAlternatives.reason;
      type = "alternative";
    }
  }
  
  // Check variant matching
  if (context.variantSuggestion) {
    for (const term of context.variantSuggestion.searchTerms) {
      if (candidateTitle.includes(term) && !currentTitle.includes(term)) {
        score += 15;
        reason = context.variantSuggestion.reason;
        type = "variant";
        break;
      }
    }
  }
  
  // Cross-brand bonus (same material, different vendor)
  if (current.vendor !== candidate.vendor && currentMaterial === candidateMaterial) {
    score += 5;
    if (type === "alternative") {
      reason = "Cross-brand comparison";
      type = "cross-brand";
    }
  }
  
  // Price tier matching
  const currentPriceKg = getPricePerKg(current.variant_price, current.net_weight_g);
  const candidatePriceKg = getPricePerKg(candidate.variant_price, candidate.net_weight_g);
  
  if (currentPriceKg && candidatePriceKg) {
    if (context.priceTierSuggestion === "budget" && candidatePriceKg < currentPriceKg * 0.7) {
      score += 12;
      reason = "Budget alternative";
      type = "budget";
    } else if (context.priceTierSuggestion === "premium" && candidatePriceKg > currentPriceKg * 1.3) {
      score += 12;
      reason = "Premium option";
      type = "premium";
    }
  }
  
  // Penalize if it's essentially the same product
  if (candidateTitle === currentTitle) {
    score = -100;
  }
  
  return { score, reason, type };
}

/**
 * Transforms filament data into a comparison suggestion
 */
export function toComparisonSuggestion(
  filament: FilamentForComparison,
  relevance: { score: number; reason: string; type: SmartComparisonSuggestion["relevanceType"] }
): SmartComparisonSuggestion {
  return {
    id: filament.id,
    name: filament.product_title,
    material: filament.material || "Unknown",
    vendor: filament.vendor,
    price: filament.variant_price,
    strength_index: filament.strength_index,
    printability_index: filament.printability_index,
    color_hex: filament.color_hex,
    relevanceReason: relevance.reason,
    relevanceType: relevance.type
  };
}

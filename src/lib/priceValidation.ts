// Smart price validation service to detect suspicious price calculations
// Particularly for MOQ/bundle listings where weight is incorrectly stored

export interface PriceValidationResult {
  isValid: boolean;
  isSuspicious: boolean;
  rawPricePerKg: number;
  estimatedTruePricePerKg: number | null;
  confidence: 'high' | 'medium' | 'low';
  issues: string[];
  detectedPattern: 'moq' | 'bundle' | 'bulk' | 'pack' | null;
}

// Minimum realistic price thresholds per kg by material type (USD)
const PRICE_THRESHOLDS: Record<string, number> = {
  // Standard materials - impossible to be under $6/kg legitimately
  'PLA': 6,
  'PLA+': 6,
  'PETG': 6,
  'ABS': 6,
  'ASA': 8,
  
  // Flexible materials
  'TPU': 10,
  'TPE': 10,
  
  // Engineering materials
  'Nylon': 12,
  'PA': 12,
  'PC': 12,
  
  // Composites - higher threshold
  'CF': 15,
  'GF': 12,
  'Carbon': 15,
  
  // Specialty
  'PEEK': 50,
  'PEI': 40,
  'ULTEM': 40,
  
  // Default for unknown materials
  'default': 6
};

// Patterns that indicate MOQ/bulk/bundle pricing
const MOQ_PATTERNS = [
  /\[MOQ:\s*(\d+(?:\.\d+)?)\s*KG\]/i,
  /MOQ\s*(\d+)\s*(?:kg|rolls?|spools?)/i,
  /minimum\s*order\s*(\d+)/i,
];

const BUNDLE_PATTERNS = [
  /(\d+)\s*(?:pack|bundle|set|pcs|pieces|rolls?|spools?)\b/i,
  /pack\s*of\s*(\d+)/i,
  /bundle\s*of\s*(\d+)/i,
  /(\d+)x\s*(?:\d+(?:\.\d+)?\s*kg)/i,
];

const PER_SPOOL_PATTERNS = [
  /(\d+(?:\.\d+)?)\s*KG\s*(?:Roll|Spool|per\s*roll|per\s*spool|each)/i,
  /(?:Roll|Spool)\s*(\d+(?:\.\d+)?)\s*KG/i,
  /(?:1|one)\s*(?:kg|kilogram)\s*(?:roll|spool)/i,
];

/**
 * Get the minimum realistic price threshold for a material
 */
function getThreshold(material: string | null | undefined): number {
  if (!material) return PRICE_THRESHOLDS.default;
  
  const upperMaterial = material.toUpperCase();
  
  // Check for composites first
  if (upperMaterial.includes('CF') || upperMaterial.includes('CARBON')) {
    return PRICE_THRESHOLDS.CF;
  }
  if (upperMaterial.includes('GF') || upperMaterial.includes('GLASS')) {
    return PRICE_THRESHOLDS.GF;
  }
  
  // Check base materials
  for (const [key, threshold] of Object.entries(PRICE_THRESHOLDS)) {
    if (upperMaterial.includes(key.toUpperCase())) {
      return threshold;
    }
  }
  
  return PRICE_THRESHOLDS.default;
}

/**
 * Analyze a filament listing for suspicious pricing
 */
export function validateFilamentPrice(
  price: number | null | undefined,
  netWeightG: number | null | undefined,
  packQuantity: number | null | undefined,
  material: string | null | undefined,
  productTitle: string | null | undefined,
  productUrl: string | null | undefined
): PriceValidationResult {
  const issues: string[] = [];
  let detectedPattern: PriceValidationResult['detectedPattern'] = null;
  let estimatedTruePricePerKg: number | null = null;
  let confidence: PriceValidationResult['confidence'] = 'low';
  
  // If no price or weight, can't validate
  if (!price || !netWeightG) {
    return {
      isValid: true,
      isSuspicious: false,
      rawPricePerKg: 0,
      estimatedTruePricePerKg: null,
      confidence: 'low',
      issues: [],
      detectedPattern: null
    };
  }
  
  const qty = packQuantity || 1;
  const totalWeightKg = (netWeightG / 1000) * qty;
  const rawPricePerKg = price / totalWeightKg;
  const threshold = getThreshold(material);
  
  // If price is above threshold, it's likely valid
  if (rawPricePerKg >= threshold) {
    return {
      isValid: true,
      isSuspicious: false,
      rawPricePerKg,
      estimatedTruePricePerKg: null,
      confidence: 'high',
      issues: [],
      detectedPattern: null
    };
  }
  
  // Price is suspiciously low - analyze title and URL for patterns
  const title = productTitle || '';
  const url = productUrl || '';
  const combinedText = `${title} ${url}`.toLowerCase();
  
  // Check for MOQ patterns
  for (const pattern of MOQ_PATTERNS) {
    const match = title.match(pattern);
    if (match) {
      detectedPattern = 'moq';
      const moqKg = parseFloat(match[1]);
      
      // Check if there's a per-spool weight indicator
      let perSpoolKg = 1; // Default assumption
      for (const spoolPattern of PER_SPOOL_PATTERNS) {
        const spoolMatch = title.match(spoolPattern);
        if (spoolMatch && spoolMatch[1]) {
          perSpoolKg = parseFloat(spoolMatch[1]);
          break;
        }
      }
      
      // If net_weight_g equals MOQ total, it's miscalculated
      if (Math.abs(netWeightG - (moqKg * 1000)) < 100) {
        issues.push(`Weight appears to be MOQ total (${moqKg}kg) instead of per-spool (likely ${perSpoolKg}kg)`);
        estimatedTruePricePerKg = price / perSpoolKg;
        confidence = 'high';
      }
      break;
    }
  }
  
  // Check for bundle patterns
  if (!detectedPattern) {
    for (const pattern of BUNDLE_PATTERNS) {
      const match = title.match(pattern) || url.match(pattern);
      if (match) {
        detectedPattern = 'bundle';
        const bundleQty = parseInt(match[1]);
        
        if (bundleQty > 1) {
          issues.push(`Appears to be a ${bundleQty}-pack/bundle listing`);
          // Estimate true price assuming 1kg spools
          estimatedTruePricePerKg = price / bundleQty;
          confidence = 'medium';
        }
        break;
      }
    }
  }
  
  // Check URL for bundle/bulk indicators
  if (!detectedPattern) {
    if (combinedText.includes('bulk') || combinedText.includes('wholesale')) {
      detectedPattern = 'bulk';
      issues.push('URL/title suggests bulk pricing');
      confidence = 'medium';
    } else if (combinedText.includes('pack') || combinedText.includes('bundle')) {
      detectedPattern = 'pack';
      issues.push('URL/title suggests pack/bundle pricing');
      confidence = 'low';
    }
  }
  
  // If still suspicious but no pattern found
  if (!detectedPattern && rawPricePerKg < threshold) {
    issues.push(`Price/kg ($${rawPricePerKg.toFixed(2)}) is below realistic threshold ($${threshold}/kg)`);
    
    // Try to estimate - if weight seems like a multi-kg total
    if (netWeightG > 1500) {
      const possibleSpools = Math.round(netWeightG / 1000);
      if (possibleSpools >= 2) {
        estimatedTruePricePerKg = price;  // Price is probably per-kg already
        issues.push(`Weight (${netWeightG}g) suggests ${possibleSpools} spools - price may be per-spool`);
        confidence = 'low';
      }
    }
  }
  
  return {
    isValid: rawPricePerKg >= threshold,
    isSuspicious: rawPricePerKg < threshold,
    rawPricePerKg,
    estimatedTruePricePerKg,
    confidence,
    issues,
    detectedPattern
  };
}

/**
 * Quick check if a price/kg value is suspicious
 */
export function isPriceSuspicious(
  pricePerKg: number,
  material: string | null | undefined
): boolean {
  const threshold = getThreshold(material);
  return pricePerKg < threshold;
}

/**
 * Get the threshold for a material type
 */
export function getPriceThreshold(material: string | null | undefined): number {
  return getThreshold(material);
}

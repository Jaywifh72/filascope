/**
 * Filament Scoring Algorithm
 * 
 * Creates meaningful differentiation between filaments by computing
 * relative scores based on multiple factors within the dataset.
 * 
 * Score Components (out of 10):
 * - Price Competitiveness (0-3): How price compares to material category average
 * - Data Quality (0-2): Completeness of specs, TDS, images, etc.
 * - Brand Signal (0-2): Established brands with good reputation
 * - Feature Richness (0-2): Special capabilities (high-speed, specialty finishes)
 * - Availability (0-1): Regional pricing, multiple retailers
 */

export interface FilamentForScoring {
  id: string;
  material: string | null;
  vendor: string | null;
  variant_price: number | null;
  net_weight_g: number | null;
  pack_quantity?: number;
  high_speed_capable: boolean | null;
  nozzle_temp_min_c: number | null;
  nozzle_temp_max_c: number | null;
  bed_temp_min_c: number | null;
  bed_temp_max_c: number | null;
  tds_url: string | null;
  featured_image: string | null;
  color_hex: string | null;
  product_url: string | null;
  amazon_link_us: string | null;
  price_cad: number | null;
  price_eur: number | null;
  price_gbp: number | null;
  price_aud: number | null;
  strength_index: number | null;
  tg_c: number | null;
  matte?: boolean | null;
  silk?: boolean | null;
  sparkle?: boolean | null;
  glow?: boolean | null;
  metallic?: boolean | null;
  translucent?: boolean | null;
  carbon_fiber?: boolean | null;
  glass_fiber?: boolean | null;
  wood_filled?: boolean | null;
  value_score: number | null;
  printability_index: number | null;
}

// Premium brands known for quality (rough tier list)
const PREMIUM_BRANDS = new Set([
  'polymaker', 'prusament', 'bambu lab', 'overture', 'hatchbox', 
  'esun', 'protopasta', 'colorfabb', 'fillamentum', 'formfutura',
  'matterhackers', 'atomic filament', 'paramount 3d', 'polyalchemy'
]);

const MID_TIER_BRANDS = new Set([
  'sunlu', 'eryone', 'inland', 'duramic', 'mika3d', 'geeetech',
  'jayo', 'elegoo', 'creality', 'anycubic', 'flashforge', 'ziro'
]);

/**
 * Computes material category price averages for relative scoring
 */
function computeMaterialPriceStats(filaments: FilamentForScoring[]): Map<string, { avg: number; min: number; max: number; count: number }> {
  const stats = new Map<string, { prices: number[] }>();
  
  for (const f of filaments) {
    if (!f.variant_price || !f.net_weight_g || f.net_weight_g < 100) continue;
    
    const material = normalizeMaterial(f.material);
    const pricePerKg = f.variant_price / (f.net_weight_g / 1000);
    
    if (!stats.has(material)) {
      stats.set(material, { prices: [] });
    }
    stats.get(material)!.prices.push(pricePerKg);
  }
  
  const result = new Map<string, { avg: number; min: number; max: number; count: number }>();
  for (const [material, data] of stats) {
    if (data.prices.length === 0) continue;
    const sorted = data.prices.sort((a, b) => a - b);
    result.set(material, {
      avg: sorted.reduce((a, b) => a + b, 0) / sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      count: sorted.length
    });
  }
  
  return result;
}

/**
 * Normalize material names for grouping
 */
function normalizeMaterial(material: string | null): string {
  if (!material) return 'OTHER';
  const upper = material.toUpperCase();
  
  // Group similar materials
  if (upper.includes('PLA') && !upper.includes('PETG')) return 'PLA';
  if (upper.includes('PETG')) return 'PETG';
  if (upper.includes('ABS') && !upper.includes('ASA')) return 'ABS';
  if (upper.includes('ASA')) return 'ASA';
  if (upper.includes('TPU') || upper.includes('TPE') || upper.includes('FLEX')) return 'TPU';
  if (upper.includes('NYLON') || upper.includes('PA')) return 'NYLON';
  if (upper.includes('PC') || upper.includes('POLYCARB')) return 'PC';
  if (upper.includes('PVA')) return 'PVA';
  if (upper.includes('HIPS')) return 'HIPS';
  
  return 'OTHER';
}

/**
 * Calculate price competitiveness score (0-3)
 * Lower prices relative to category average = higher score
 */
function getPriceScore(
  filament: FilamentForScoring, 
  materialStats: Map<string, { avg: number; min: number; max: number; count: number }>
): number {
  if (!filament.variant_price || !filament.net_weight_g || filament.net_weight_g < 100) {
    return 1.0; // Neutral score for no price data
  }
  
  const material = normalizeMaterial(filament.material);
  const stats = materialStats.get(material);
  
  if (!stats || stats.count < 3) {
    return 1.5; // Neutral score if not enough comparison data
  }
  
  const pricePerKg = filament.variant_price / (filament.net_weight_g / 1000);
  const range = stats.max - stats.min;
  
  if (range < 1) return 1.5; // Not enough range
  
  // Calculate percentile position (0 = cheapest, 1 = most expensive)
  const percentile = Math.min(1, Math.max(0, (pricePerKg - stats.min) / range));
  
  // Invert so cheaper = higher score
  // Use non-linear scaling: really good deals get more boost
  const invertedPercentile = 1 - percentile;
  
  // Score from 0-3, with bias toward middle-high values
  // Top 10% cheapest: 2.5-3.0
  // 10-30%: 2.0-2.5
  // 30-60%: 1.2-2.0
  // 60-90%: 0.5-1.2
  // Bottom 10% expensive: 0-0.5
  if (invertedPercentile >= 0.9) return 2.5 + (invertedPercentile - 0.9) * 5;
  if (invertedPercentile >= 0.7) return 2.0 + (invertedPercentile - 0.7) * 2.5;
  if (invertedPercentile >= 0.4) return 1.2 + (invertedPercentile - 0.4) * 2.67;
  if (invertedPercentile >= 0.1) return 0.5 + (invertedPercentile - 0.1) * 2.33;
  return invertedPercentile * 5;
}

/**
 * Calculate data quality score (0-2)
 * More complete data = higher score
 */
function getDataQualityScore(filament: FilamentForScoring): number {
  let score = 0;
  
  // Temperature data (0.4 max)
  if (filament.nozzle_temp_min_c && filament.nozzle_temp_max_c) score += 0.2;
  if (filament.bed_temp_min_c && filament.bed_temp_max_c) score += 0.2;
  
  // Technical data (0.6 max)
  if (filament.tds_url) score += 0.3;
  if (filament.strength_index) score += 0.15;
  if (filament.tg_c) score += 0.15;
  
  // Visual data (0.4 max)
  if (filament.featured_image) score += 0.2;
  if (filament.color_hex) score += 0.2;
  
  // Availability data (0.6 max)
  if (filament.product_url) score += 0.2;
  if (filament.amazon_link_us) score += 0.2;
  if (filament.variant_price && filament.variant_price > 0) score += 0.2;
  
  return Math.min(2, score);
}

/**
 * Calculate brand score (0-2)
 * Established quality brands = higher score
 */
function getBrandScore(filament: FilamentForScoring): number {
  const vendor = (filament.vendor || '').toLowerCase().trim();
  
  if (PREMIUM_BRANDS.has(vendor)) return 2.0;
  if (MID_TIER_BRANDS.has(vendor)) return 1.2;
  
  // Unknown brands get a slight penalty but not zero
  // (new brands can still be good)
  return 0.6;
}

/**
 * Calculate feature richness score (0-2)
 * Special capabilities and finishes = higher score
 */
function getFeatureScore(filament: FilamentForScoring): number {
  let score = 0;
  
  // High-speed capability is valuable
  if (filament.high_speed_capable) score += 0.8;
  
  // Specialty finishes add value
  const specialtyCount = [
    filament.matte,
    filament.silk,
    filament.sparkle,
    filament.glow,
    filament.metallic,
    filament.translucent
  ].filter(Boolean).length;
  
  // Diminishing returns for multiple finishes
  score += Math.min(0.6, specialtyCount * 0.25);
  
  // Reinforced materials
  if (filament.carbon_fiber || filament.glass_fiber) score += 0.4;
  if (filament.wood_filled) score += 0.2;
  
  return Math.min(2, score);
}

/**
 * Calculate regional availability score (0-1)
 * Multiple regional prices = higher score
 */
function getAvailabilityScore(filament: FilamentForScoring): number {
  let score = 0;
  
  // Count regional price availability
  const regionalPrices = [
    filament.price_cad,
    filament.price_eur,
    filament.price_gbp,
    filament.price_aud
  ].filter(p => p && p > 0).length;
  
  // Base availability
  if (filament.variant_price && filament.variant_price > 0) score += 0.3;
  if (filament.amazon_link_us) score += 0.2;
  
  // Regional bonus (0.1 per region, max 0.4)
  score += Math.min(0.4, regionalPrices * 0.1);
  
  // Direct store link is valuable
  if (filament.product_url) score += 0.1;
  
  return Math.min(1, score);
}

/**
 * Main scoring function - computes a 0-10 score for a single filament
 * Uses dataset context for relative scoring
 */
export function computeFilamentScore(
  filament: FilamentForScoring,
  materialStats: Map<string, { avg: number; min: number; max: number; count: number }>
): number {
  // If we have a stored value_score, use it but blend with computed factors
  if (filament.value_score && filament.value_score > 0) {
    // Weight stored score at 70%, computed at 30% for consistency
    const computed = computeRawScore(filament, materialStats);
    return filament.value_score * 0.7 + computed * 0.3;
  }
  
  // If we have printability_index, blend it in
  if (filament.printability_index && filament.printability_index > 0) {
    const computed = computeRawScore(filament, materialStats);
    return filament.printability_index * 0.5 + computed * 0.5;
  }
  
  return computeRawScore(filament, materialStats);
}

function computeRawScore(
  filament: FilamentForScoring,
  materialStats: Map<string, { avg: number; min: number; max: number; count: number }>
): number {
  const priceScore = getPriceScore(filament, materialStats);        // 0-3
  const dataScore = getDataQualityScore(filament);                   // 0-2
  const brandScore = getBrandScore(filament);                        // 0-2
  const featureScore = getFeatureScore(filament);                    // 0-2
  const availabilityScore = getAvailabilityScore(filament);          // 0-1
  
  const total = priceScore + dataScore + brandScore + featureScore + availabilityScore;
  
  // Total max is 10, add slight noise to break ties
  const noise = (hashString(filament.id) % 100) / 1000; // 0-0.099
  
  return Math.min(10, Math.max(1, total + noise));
}

/**
 * Simple hash for consistent but varied tie-breaking
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Create a scoring context from the filament dataset
 * Call once with all filaments, then use for individual scoring
 */
export function createScoringContext(filaments: FilamentForScoring[]) {
  const materialStats = computeMaterialPriceStats(filaments);
  
  return {
    getScore: (filament: FilamentForScoring) => computeFilamentScore(filament, materialStats),
    materialStats
  };
}

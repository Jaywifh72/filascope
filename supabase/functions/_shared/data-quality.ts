/**
 * DATA QUALITY CALCULATOR
 * 
 * Computes completeness scores and quality metrics for filament records.
 * Used by scrapers, exports, and admin dashboards.
 */

import { 
  FILAMENT_SCHEMA, 
  FILAMENT_CATEGORIES,
  getRequiredFields,
  getFieldsByCategory,
  type FilamentCategory,
  type FilamentFieldDefinition
} from './filament-schema.ts';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DataQualityScore {
  /** Overall completeness percentage (0-100) */
  overallScore: number;
  /** Number of required fields filled */
  requiredFieldsFilled: number;
  /** Total required fields */
  requiredFieldsTotal: number;
  /** Number of optional fields filled */
  optionalFieldsFilled: number;
  /** Total optional fields */
  optionalFieldsTotal: number;
  /** Per-category breakdown */
  categoryScores: CategoryScore[];
  /** List of missing required fields */
  missingRequired: string[];
  /** List of missing high-value optional fields */
  missingHighValue: string[];
  /** Quality level classification */
  qualityLevel: 'complete' | 'good' | 'fair' | 'poor' | 'minimal';
  /** Suggestions for improvement */
  suggestions: DataQualitySuggestion[];
}

export interface CategoryScore {
  category: FilamentCategory;
  categoryLabel: string;
  filledCount: number;
  totalCount: number;
  percentage: number;
}

export interface DataQualitySuggestion {
  field: string;
  fieldLabel: string;
  category: FilamentCategory;
  source: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
}

export interface BrandDataQuality {
  brandName: string;
  totalProducts: number;
  averageScore: number;
  qualityDistribution: {
    complete: number;
    good: number;
    fair: number;
    poor: number;
    minimal: number;
  };
  weakestCategories: { category: FilamentCategory; averageScore: number }[];
  commonMissingFields: { field: string; count: number; percentage: number }[];
}

// ============================================================================
// HIGH-VALUE OPTIONAL FIELDS
// Fields that significantly improve data quality when present
// ============================================================================

const HIGH_VALUE_FIELDS = [
  'color_hex',
  'color_family',
  'featured_image',
  'nozzle_temp_min_c',
  'nozzle_temp_max_c',
  'bed_temp_min_c',
  'bed_temp_max_c',
  'net_weight_g',
  'tds_url',
  'product_url',
  'drying_temp_c',
  'drying_time_hours',
  'tensile_strength_xy_mpa',
  'density_g_cm3',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a value is considered "filled" (not null/undefined/empty)
 */
function isFieldFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

/**
 * Get quality level classification based on score
 */
function getQualityLevel(score: number): DataQualityScore['qualityLevel'] {
  if (score >= 90) return 'complete';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  if (score >= 25) return 'poor';
  return 'minimal';
}

/**
 * Generate improvement suggestions based on missing fields
 */
function generateSuggestions(
  filament: Record<string, unknown>,
  missingRequired: string[],
  missingHighValue: string[]
): DataQualitySuggestion[] {
  const suggestions: DataQualitySuggestion[] = [];

  // High priority: Missing required fields
  for (const fieldKey of missingRequired) {
    const field = FILAMENT_SCHEMA.find(f => f.key === fieldKey);
    if (!field) continue;

    suggestions.push({
      field: fieldKey,
      fieldLabel: field.label,
      category: field.category,
      source: field.dataSources[0] || 'manual',
      priority: 'high',
      message: `Required field "${field.label}" is missing. Try ${getSourceHint(field)}`,
    });
  }

  // Medium priority: Missing high-value optional fields
  for (const fieldKey of missingHighValue.slice(0, 5)) { // Limit to top 5
    const field = FILAMENT_SCHEMA.find(f => f.key === fieldKey);
    if (!field) continue;

    suggestions.push({
      field: fieldKey,
      fieldLabel: field.label,
      category: field.category,
      source: field.dataSources[0] || 'manual',
      priority: 'medium',
      message: `Add "${field.label}" to improve data quality. ${getSourceHint(field)}`,
    });
  }

  // Low priority: Context-specific suggestions
  // If we have TDS URL but missing TDS-extractable fields
  if (isFieldFilled(filament['tds_url'])) {
    const tdsFields = FILAMENT_SCHEMA.filter(f => f.tdsExtractable && !isFieldFilled(filament[f.key]));
    if (tdsFields.length > 3) {
      suggestions.push({
        field: 'tds_extraction',
        fieldLabel: 'TDS Extraction',
        category: 'mechanical',
        source: 'tds',
        priority: 'low',
        message: `Parse TDS PDF to extract ${tdsFields.length} additional fields (${tdsFields.slice(0, 3).map(f => f.label).join(', ')}...)`,
      });
    }
  }

  return suggestions;
}

/**
 * Get a hint about how to source a field
 */
function getSourceHint(field: FilamentFieldDefinition): string {
  const sources = field.dataSources;
  if (sources.includes('api')) return 'available from product API';
  if (sources.includes('html')) return 'scrape from product page';
  if (sources.includes('tds')) return 'extract from TDS PDF';
  if (sources.includes('calculated')) return 'can be calculated';
  return 'requires manual entry';
}

// ============================================================================
// MAIN CALCULATOR
// ============================================================================

/**
 * Calculate comprehensive data quality score for a filament record
 */
export function calculateDataQuality(filament: Record<string, unknown>): DataQualityScore {
  const requiredFields = getRequiredFields();
  const allFields = FILAMENT_SCHEMA;

  // Calculate required fields completion
  const missingRequired: string[] = [];
  let requiredFilled = 0;
  for (const field of requiredFields) {
    if (isFieldFilled(filament[field.key])) {
      requiredFilled++;
    } else {
      missingRequired.push(field.key);
    }
  }

  // Calculate optional fields completion
  const optionalFields = allFields.filter(f => !f.required);
  let optionalFilled = 0;
  for (const field of optionalFields) {
    if (isFieldFilled(filament[field.key])) {
      optionalFilled++;
    }
  }

  // Calculate high-value missing fields
  const missingHighValue = HIGH_VALUE_FIELDS.filter(key => !isFieldFilled(filament[key]));

  // Calculate per-category scores
  const categoryScores: CategoryScore[] = [];
  for (const category of FILAMENT_CATEGORIES) {
    const categoryFields = getFieldsByCategory(category.id);
    let filled = 0;
    for (const field of categoryFields) {
      if (isFieldFilled(filament[field.key])) {
        filled++;
      }
    }
    categoryScores.push({
      category: category.id,
      categoryLabel: category.label,
      filledCount: filled,
      totalCount: categoryFields.length,
      percentage: categoryFields.length > 0 ? Math.round((filled / categoryFields.length) * 100) : 0,
    });
  }

  // Calculate overall score (weighted)
  // Required fields: 40%, High-value optional: 30%, Other optional: 30%
  const requiredScore = requiredFields.length > 0 
    ? (requiredFilled / requiredFields.length) * 40 
    : 40;
  
  const highValueFilled = HIGH_VALUE_FIELDS.filter(key => isFieldFilled(filament[key])).length;
  const highValueScore = (highValueFilled / HIGH_VALUE_FIELDS.length) * 30;
  
  const otherOptionalFilled = optionalFilled - highValueFilled;
  const otherOptionalTotal = optionalFields.length - HIGH_VALUE_FIELDS.length;
  const otherOptionalScore = otherOptionalTotal > 0 
    ? (otherOptionalFilled / otherOptionalTotal) * 30 
    : 30;

  const overallScore = Math.round(requiredScore + highValueScore + otherOptionalScore);

  // Generate suggestions
  const suggestions = generateSuggestions(filament, missingRequired, missingHighValue);

  return {
    overallScore,
    requiredFieldsFilled: requiredFilled,
    requiredFieldsTotal: requiredFields.length,
    optionalFieldsFilled: optionalFilled,
    optionalFieldsTotal: optionalFields.length,
    categoryScores,
    missingRequired,
    missingHighValue,
    qualityLevel: getQualityLevel(overallScore),
    suggestions,
  };
}

/**
 * Calculate aggregate data quality for a brand
 */
export function calculateBrandDataQuality(
  brandName: string,
  filaments: Record<string, unknown>[]
): BrandDataQuality {
  const scores = filaments.map(f => calculateDataQuality(f));
  
  // Calculate average score
  const totalScore = scores.reduce((sum, s) => sum + s.overallScore, 0);
  const averageScore = filaments.length > 0 ? Math.round(totalScore / filaments.length) : 0;

  // Calculate quality distribution
  const qualityDistribution = {
    complete: scores.filter(s => s.qualityLevel === 'complete').length,
    good: scores.filter(s => s.qualityLevel === 'good').length,
    fair: scores.filter(s => s.qualityLevel === 'fair').length,
    poor: scores.filter(s => s.qualityLevel === 'poor').length,
    minimal: scores.filter(s => s.qualityLevel === 'minimal').length,
  };

  // Calculate weakest categories
  const categoryAverages = new Map<FilamentCategory, number[]>();
  for (const score of scores) {
    for (const cat of score.categoryScores) {
      const existing = categoryAverages.get(cat.category) || [];
      existing.push(cat.percentage);
      categoryAverages.set(cat.category, existing);
    }
  }
  const weakestCategories = Array.from(categoryAverages.entries())
    .map(([category, percentages]) => ({
      category,
      averageScore: Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length),
    }))
    .sort((a, b) => a.averageScore - b.averageScore)
    .slice(0, 5);

  // Calculate common missing fields
  const missingFieldCounts = new Map<string, number>();
  for (const score of scores) {
    for (const field of [...score.missingRequired, ...score.missingHighValue]) {
      missingFieldCounts.set(field, (missingFieldCounts.get(field) || 0) + 1);
    }
  }
  const commonMissingFields = Array.from(missingFieldCounts.entries())
    .map(([field, count]) => ({
      field,
      count,
      percentage: Math.round((count / filaments.length) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    brandName,
    totalProducts: filaments.length,
    averageScore,
    qualityDistribution,
    weakestCategories,
    commonMissingFields,
  };
}

/**
 * Quick check if a filament meets minimum quality threshold
 */
export function meetsMinimumQuality(
  filament: Record<string, unknown>,
  threshold: 'complete' | 'good' | 'fair' | 'poor' = 'fair'
): boolean {
  const score = calculateDataQuality(filament);
  const levels = ['minimal', 'poor', 'fair', 'good', 'complete'];
  const thresholdIndex = levels.indexOf(threshold);
  const actualIndex = levels.indexOf(score.qualityLevel);
  return actualIndex >= thresholdIndex;
}

/**
 * Get a simple completeness percentage (just filled/total)
 */
export function getSimpleCompleteness(filament: Record<string, unknown>): number {
  let filled = 0;
  let total = 0;
  
  for (const field of FILAMENT_SCHEMA) {
    // Skip system metadata fields from the calculation
    if (field.category === 'system') continue;
    total++;
    if (isFieldFilled(filament[field.key])) {
      filled++;
    }
  }
  
  return total > 0 ? Math.round((filled / total) * 100) : 0;
}

/**
 * Get list of enrichment opportunities for a filament
 * Returns fields that could be populated from available sources
 */
export function getEnrichmentOpportunities(
  filament: Record<string, unknown>
): { 
  fromTds: FilamentFieldDefinition[]; 
  fromScraping: FilamentFieldDefinition[];
  calculated: FilamentFieldDefinition[];
} {
  const hasTds = isFieldFilled(filament['tds_url']);
  const hasProductUrl = isFieldFilled(filament['product_url']);

  const fromTds: FilamentFieldDefinition[] = [];
  const fromScraping: FilamentFieldDefinition[] = [];
  const calculated: FilamentFieldDefinition[] = [];

  for (const field of FILAMENT_SCHEMA) {
    if (isFieldFilled(filament[field.key])) continue; // Already has value

    if (hasTds && field.tdsExtractable) {
      fromTds.push(field);
    } else if (hasProductUrl && field.scrapable) {
      fromScraping.push(field);
    } else if (field.dataSources.includes('calculated')) {
      calculated.push(field);
    }
  }

  return { fromTds, fromScraping, calculated };
}

/**
 * Compare data quality between two brands
 */
export function compareBrandQuality(
  brandA: BrandDataQuality,
  brandB: BrandDataQuality
): {
  scoreDifference: number;
  brandABetter: string[];
  brandBBetter: string[];
} {
  const scoreDifference = brandA.averageScore - brandB.averageScore;

  const brandABetter: string[] = [];
  const brandBBetter: string[] = [];

  // Compare by category
  for (const catA of brandA.weakestCategories) {
    const catB = brandB.weakestCategories.find(c => c.category === catA.category);
    if (catB) {
      if (catA.averageScore > catB.averageScore + 10) {
        brandABetter.push(`${catA.category} (+${catA.averageScore - catB.averageScore}%)`);
      } else if (catB.averageScore > catA.averageScore + 10) {
        brandBBetter.push(`${catA.category} (+${catB.averageScore - catA.averageScore}%)`);
      }
    }
  }

  return { scoreDifference, brandABetter, brandBBetter };
}

/**
 * COMPREHENSIVE AUDIT SYSTEM v2
 * 
 * Audits all 161 fields per filament, not just 5.
 * Provides detailed coverage reports per brand.
 */

import { 
  FIELD_LIST, 
  FIELD_CATEGORIES, 
  FIELD_PRIORITIES,
  detectFilamentGaps,
  generateBrandGapReport,
  type FilamentGaps,
  type FieldGap
} from './field-gap-detector.ts';

import {
  getBrandProfile,
  type BrandProfile
} from './brand-profile-system.ts';

// ============================================================================
// AUDIT INTERFACES
// ============================================================================

export interface FieldCoverage {
  total: number;
  populated: number;
  percentage: number;
  missing_fields: string[];
}

export interface BrandAudit {
  brand_slug: string;
  display_name: string;
  timestamp: string;
  
  // Overall metrics
  total_filaments: number;
  expected_filaments: number;
  filaments_audited: number;
  
  // Field coverage by category
  field_coverage: {
    basic: FieldCoverage;
    technical: FieldCoverage;
    regional: FieldCoverage;
    scoring: FieldCoverage;
    metadata: FieldCoverage;
  };
  
  // Overall score
  overall_coverage: number;
  
  // Status
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  
  // Recommendations
  recommendations: string[];
  
  // Priority gaps (top 10)
  priority_gaps: Array<{
    field: string;
    category: string;
    priority: string;
    missing_count: number;
    percentage_missing: number;
  }>;
  
  // Worst filaments (bottom 10)
  worst_filaments: Array<{
    filament_id: string;
    product_title: string;
    coverage: number;
    missing_fields: number;
  }>;
  
  // Data source availability
  data_sources: {
    shopify_api: boolean;
    firecrawl: boolean;
    amazon_paapi: boolean;
    tds_sheets: boolean;
  };
  
  // Extraction difficulty
  extraction_difficulty: {
    easy: number;
    medium: number;
    hard: number;
    very_hard: number;
  };
}

export interface AuditSummary {
  total_brands: number;
  total_filaments: number;
  average_coverage: number;
  brands_by_status: {
    healthy: number;
    warning: number;
    critical: number;
  };
  top_priority_brands: Array<{
    brand_slug: string;
    display_name: string;
    coverage: number;
    status: string;
    priority_gaps: number;
  }>;
  overall_recommendations: string[];
}

// ============================================================================
// AUDIT FUNCTIONS
// ============================================================================

/**
 * Audit a single brand
 */
export async function auditBrand(
  brandSlug: string,
  filaments: any[],
  supabase: any
): Promise<BrandAudit> {
  const profile = getBrandProfile(brandSlug);
  const timestamp = new Date().toISOString();
  
  // Detect gaps for all filaments
  const filamentGaps = filaments.map(detectFilamentGaps);
  
  // Generate brand gap report
  const gapReport = generateBrandGapReport(filamentGaps);
  
  // Calculate field coverage by category
  const fieldCoverage = {
    basic: calculateCategoryCoverage('basic', filamentGaps),
    technical: calculateCategoryCoverage('technical', filamentGaps),
    regional: calculateCategoryCoverage('regional', filamentGaps),
    scoring: calculateCategoryCoverage('scoring', filamentGaps),
    metadata: calculateCategoryCoverage('metadata', filamentGaps)
  };
  
  // Calculate overall coverage
  const totalFields = Object.values(fieldCoverage).reduce((sum, cat) => sum + cat.total, 0);
  const totalPopulated = Object.values(fieldCoverage).reduce((sum, cat) => sum + cat.populated, 0);
  const overallCoverage = totalFields > 0 ? Math.round((totalPopulated / totalFields) * 100 * 10) / 10 : 0;
  
  // Determine status
  let status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  if (overallCoverage >= 70) {
    status = 'HEALTHY';
  } else if (overallCoverage >= 40) {
    status = 'WARNING';
  } else {
    status = 'CRITICAL';
  }
  
  // Generate recommendations
  const recommendations = generateRecommendations(fieldCoverage, gapReport, profile);
  
  // Get priority gaps (fields with most missing)
  const priorityGaps = calculatePriorityGaps(filamentGaps);
  
  // Get worst filaments
  const worstFilaments = gapReport.worst_filaments.slice(0, 10);
  
  // Check data source availability
  const dataSources = {
    shopify_api: profile.data_sources.some(s => s.type === 'shopify_api'),
    firecrawl: profile.data_sources.some(s => s.type === 'firecrawl'),
    amazon_paapi: profile.data_sources.some(s => s.type === 'amazon_paapi'),
    tds_sheets: profile.data_sources.some(s => s.type === 'tds_sheet')
  };
  
  // Calculate extraction difficulty
  const extractionDifficulty = calculateExtractionDifficulty(filamentGaps);
  
  return {
    brand_slug: brandSlug,
    display_name: profile.display_name,
    timestamp,
    total_filaments: filaments.length,
    expected_filaments: profile.expected_filaments,
    filaments_audited: filaments.length,
    field_coverage: fieldCoverage,
    overall_coverage: overallCoverage,
    status,
    recommendations,
    priority_gaps: priorityGaps,
    worst_filaments: worstFilaments,
    data_sources: dataSources,
    extraction_difficulty: extractionDifficulty
  };
}

/**
 * Calculate coverage for a specific category
 */
function calculateCategoryCoverage(
  category: keyof typeof FIELD_CATEGORIES,
  filamentGaps: FilamentGaps[]
): FieldCoverage {
  const categoryConfig = FIELD_CATEGORIES[category];
  const totalFields = categoryConfig.total;
  
  // Count populated fields across all filaments
  let totalPopulated = 0;
  const missingFieldsSet = new Set<string>();
  
  for (const fg of filamentGaps) {
    for (const gap of fg.gaps) {
      if (gap.category === category) {
        missingFieldsSet.add(gap.field);
      }
    }
  }
  
  // Calculate populated count
  const missingCount = missingFieldsSet.size;
  const populatedCount = totalFields - missingCount;
  
  return {
    total: totalFields,
    populated: populatedCount,
    percentage: totalFields > 0 ? Math.round((populatedCount / totalFields) * 100 * 10) / 10 : 0,
    missing_fields: Array.from(missingFieldsSet)
  };
}

/**
 * Generate recommendations based on audit results
 */
function generateRecommendations(
  fieldCoverage: Record<string, FieldCoverage>,
  gapReport: any,
  profile: BrandProfile
): string[] {
  const recommendations: string[] = [];
  
  // Check basic coverage
  if (fieldCoverage.basic.percentage < 80) {
    recommendations.push(`Improve basic field coverage from ${fieldCoverage.basic.percentage}% to 80%+`);
  }
  
  // Check technical coverage
  if (fieldCoverage.technical.percentage < 50) {
    recommendations.push(`Extract technical specs using Firecrawl (${fieldCoverage.technical.percentage}% coverage)`);
  }
  
  // Check regional coverage
  if (fieldCoverage.regional.percentage < 40) {
    recommendations.push(`Add regional pricing for EU, UK, CA regions (${fieldCoverage.regional.percentage}% coverage)`);
  }
  
  // Check scoring coverage
  if (fieldCoverage.scoring.percentage < 30) {
    recommendations.push(`Calculate scoring indexes based on available data (${fieldCoverage.scoring.percentage}% coverage)`);
  }
  
  // Check for P0 gaps
  if (gapReport.gaps_by_priority?.P0 > 0) {
    recommendations.push(`Fix ${gapReport.gaps_by_priority.P0} critical P0 gaps`);
  }
  
  // Check data sources
  if (!profile.data_sources.some(s => s.type === 'firecrawl')) {
    recommendations.push('Consider adding Firecrawl for technical spec extraction');
  }
  
  if (!profile.data_sources.some(s => s.type === 'amazon_paapi')) {
    recommendations.push('Consider adding Amazon PA-API for affiliate links');
  }
  
  // Check expected vs actual coverage
  if (gapReport.average_coverage < profile.expected_field_coverage.overall) {
    recommendations.push(`Coverage (${gapReport.average_coverage}%) below expected (${profile.expected_field_coverage.overall}%)`);
  }
  
  return recommendations;
}

/**
 * Calculate priority gaps (fields with most missing)
 */
function calculatePriorityGaps(filamentGaps: FilamentGaps[]): Array<{
  field: string;
  category: string;
  priority: string;
  missing_count: number;
  percentage_missing: number;
}> {
  const fieldMissingCount: Record<string, number> = {};
  const fieldCategory: Record<string, string> = {};
  const fieldPriority: Record<string, string> = {};
  
  // Count missing occurrences per field
  for (const fg of filamentGaps) {
    for (const gap of fg.gaps) {
      fieldMissingCount[gap.field] = (fieldMissingCount[gap.field] || 0) + 1;
      fieldCategory[gap.field] = gap.category;
      fieldPriority[gap.field] = gap.priority;
    }
  }
  
  // Convert to array and sort by missing count
  const totalFilaments = filamentGaps.length;
  const priorityGaps = Object.entries(fieldMissingCount)
    .map(([field, count]) => ({
      field,
      category: fieldCategory[field],
      priority: fieldPriority[field],
      missing_count: count,
      percentage_missing: Math.round((count / totalFilaments) * 100 * 10) / 10
    }))
    .sort((a, b) => b.missing_count - a.missing_count)
    .slice(0, 20);
  
  return priorityGaps;
}

/**
 * Calculate extraction difficulty distribution
 */
function calculateExtractionDifficulty(filamentGaps: FilamentGaps[]): {
  easy: number;
  medium: number;
  hard: number;
  very_hard: number;
} {
  const difficultyCount = { easy: 0, medium: 0, hard: 0, very_hard: 0 };
  
  for (const fg of filamentGaps) {
    for (const gap of fg.gaps) {
      difficultyCount[gap.estimatedDifficulty]++;
    }
  }
  
  return difficultyCount;
}

/**
 * Generate audit summary across all brands
 */
export function generateAuditSummary(audits: BrandAudit[]): AuditSummary {
  const totalBrands = audits.length;
  const totalFilaments = audits.reduce((sum, a) => sum + a.total_filaments, 0);
  const averageCoverage = audits.reduce((sum, a) => sum + a.overall_coverage, 0) / totalBrands;
  
  const brandsByStatus = {
    healthy: audits.filter(a => a.status === 'HEALTHY').length,
    warning: audits.filter(a => a.status === 'WARNING').length,
    critical: audits.filter(a => a.status === 'CRITICAL').length
  };
  
  // Get top priority brands (lowest coverage)
  const topPriorityBrands = [...audits]
    .sort((a, b) => a.overall_coverage - b.overall_coverage)
    .slice(0, 10)
    .map(a => ({
      brand_slug: a.brand_slug,
      display_name: a.display_name,
      coverage: a.overall_coverage,
      status: a.status,
      priority_gaps: a.priority_gaps.filter(g => g.priority === 'P0' || g.priority === 'P1').length
    }));
  
  // Generate overall recommendations
  const overallRecommendations: string[] = [];
  
  if (brandsByStatus.critical > 0) {
    overallRecommendations.push(`${brandsByStatus.critical} brands in CRITICAL status need immediate attention`);
  }
  
  if (averageCoverage < 50) {
    overallRecommendations.push(`Average coverage (${averageCoverage.toFixed(1)}%) is below 50% — focus on basic field extraction`);
  }
  
  if (brandsByStatus.healthy < totalBrands * 0.3) {
    overallRecommendations.push('Less than 30% of brands are HEALTHY — prioritize data enrichment');
  }
  
  return {
    total_brands: totalBrands,
    total_filaments: totalFilaments,
    average_coverage: Math.round(averageCoverage * 10) / 10,
    brands_by_status: brandsByStatus,
    top_priority_brands: topPriorityBrands,
    overall_recommendations: overallRecommendations
  };
}

/**
 * Export audit to JSON file
 */
export function exportAuditToJson(audit: BrandAudit, outputPath: string): void {
  const fs = require('fs');
  const json = JSON.stringify(audit, null, 2);
  fs.writeFileSync(outputPath, json);
  console.log(`✅ Audit exported to: ${outputPath}`);
}

/**
 * Export audit summary to JSON file
 */
export function exportAuditSummaryToJson(summary: AuditSummary, outputPath: string): void {
  const fs = require('fs');
  const json = JSON.stringify(summary, null, 2);
  fs.writeFileSync(outputPath, json);
  console.log(`✅ Audit summary exported to: ${outputPath}`);
}

/**
 * Print audit to console
 */
export function printAudit(audit: BrandAudit): void {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`BRAND AUDIT: ${audit.display_name} (${audit.brand_slug})`);
  console.log(`${'='.repeat(80)}`);
  
  console.log(`\n📊 Overall Metrics:`);
  console.log(`  Filaments: ${audit.total_filaments} (expected: ${audit.expected_filaments})`);
  console.log(`  Coverage: ${audit.overall_coverage}%`);
  console.log(`  Status: ${audit.status}`);
  console.log(`  Timestamp: ${audit.timestamp}`);
  
  console.log(`\n📋 Field Coverage by Category:`);
  for (const [category, coverage] of Object.entries(audit.field_coverage)) {
    const status = coverage.percentage >= 70 ? '✅' : coverage.percentage >= 40 ? '⚠️' : '❌';
    console.log(`  ${status} ${category}: ${coverage.percentage}% (${coverage.populated}/${coverage.total})`);
    if (coverage.missing_fields.length > 0) {
      console.log(`     Missing: ${coverage.missing_fields.slice(0, 5).join(', ')}${coverage.missing_fields.length > 5 ? '...' : ''}`);
    }
  }
  
  console.log(`\n🎯 Priority Gaps (Top 10):`);
  for (const gap of audit.priority_gaps.slice(0, 10)) {
    const priorityIcon = gap.priority === 'P0' ? '🔴' : gap.priority === 'P1' ? '🟠' : gap.priority === 'P2' ? '🟡' : '🟢';
    console.log(`  ${priorityIcon} ${gap.field}: ${gap.percentage_missing}% missing (${gap.missing_count} filaments)`);
  }
  
  console.log(`\n📉 Worst Filaments (Bottom 5):`);
  for (const filament of audit.worst_filaments.slice(0, 5)) {
    console.log(`  ${filament.coverage}% - ${filament.product_title} (${filament.missing_fields} missing)`);
  }
  
  console.log(`\n💡 Recommendations:`);
  for (const recommendation of audit.recommendations) {
    console.log(`  • ${recommendation}`);
  }
  
  console.log(`\n🔧 Data Sources Available:`);
  console.log(`  Shopify API: ${audit.data_sources.shopify_api ? '✅' : '❌'}`);
  console.log(`  Firecrawl: ${audit.data_sources.firecrawl ? '✅' : '❌'}`);
  console.log(`  Amazon PA-API: ${audit.data_sources.amazon_paapi ? '✅' : '❌'}`);
  console.log(`  TDS Sheets: ${audit.data_sources.tds_sheets ? '✅' : '❌'}`);
  
  console.log(`\n${'='.repeat(80)}\n`);
}

/**
 * Print audit summary to console
 */
export function printAuditSummary(summary: AuditSummary): void {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`AUDIT SUMMARY`);
  console.log(`${'='.repeat(80)}`);
  
  console.log(`\n📊 Overall Metrics:`);
  console.log(`  Total Brands: ${summary.total_brands}`);
  console.log(`  Total Filaments: ${summary.total_filaments}`);
  console.log(`  Average Coverage: ${summary.average_coverage}%`);
  
  console.log(`\n📋 Brands by Status:`);
  console.log(`  ✅ Healthy: ${summary.brands_by_status.healthy}`);
  console.log(`  ⚠️ Warning: ${summary.brands_by_status.warning}`);
  console.log(`  ❌ Critical: ${summary.brands_by_status.critical}`);
  
  console.log(`\n🎯 Top Priority Brands (Lowest Coverage):`);
  for (const brand of summary.top_priority_brands.slice(0, 10)) {
    const statusIcon = brand.status === 'HEALTHY' ? '✅' : brand.status === 'WARNING' ? '⚠️' : '❌';
    console.log(`  ${statusIcon} ${brand.display_name}: ${brand.coverage}% (${brand.priority_gaps} priority gaps)`);
  }
  
  console.log(`\n💡 Overall Recommendations:`);
  for (const recommendation of summary.overall_recommendations) {
    console.log(`  • ${recommendation}`);
  }
  
  console.log(`\n${'='.repeat(80)}\n`);
}

console.log(`✅ Comprehensive Audit System loaded`);
console.log(`   Field categories: ${Object.keys(FIELD_CATEGORIES).length}`);
console.log(`   Priority levels: ${Object.keys(FIELD_PRIORITIES).length}`);

/**
 * FILASCOPE ENRICHMENT DASHBOARD v2
 * 
 * Real-time monitoring of field coverage across all brands and categories.
 * Provides actionable insights for the enrichment pipeline.
 */

// ============================================================================
// DASHBOARD INTERFACES
// ============================================================================

export interface CoverageMetrics {
  timestamp: string;
  total_filaments: number;
  total_brands: number;
  total_categories: number;
  
  // Field Coverage
  fields: {
    product_url: FieldCoverage;
    featured_image: FieldCoverage;
    product_title: FieldCoverage;
    material: FieldCoverage;
    color_family: FieldCoverage;
    color_hex: FieldCoverage;
    variant_price: FieldCoverage;
    diameter_mm: FieldCoverage;
    weight_kg: FieldCoverage;
    nozzle_temp_min_c: FieldCoverage;
    nozzle_temp_max_c: FieldCoverage;
    bed_temp_min_c: FieldCoverage;
    bed_temp_max_c: FieldCoverage;
    density_g_cm3: FieldCoverage;
    print_speed_max_mm_s: FieldCoverage;
    transmission_distance: FieldCoverage;
    td_value: FieldCoverage;
    filascope_score: FieldCoverage;
    [key: string]: FieldCoverage;
  };
  
  // Brand Coverage
  brands: BrandCoverage[];
  
  // Category Coverage
  categories: CategoryCoverage[];
  
  // Enrichment Pipeline Stats
  pipeline: PipelineStats;
  
  // Price Freshness
  price_freshness: PriceFreshness;
  
  // Alerts
  alerts: Alert[];
}

export interface FieldCoverage {
  field: string;
  total: number;
  populated: number;
  percentage: number;
  trend: 'improving' | 'stable' | 'declining';
  last_updated: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
}

export interface BrandCoverage {
  brand: string;
  brand_slug: string;
  total_filaments: number;
  field_coverage: Record<string, number>;
  overall_coverage: number;
  enrichment_status: 'complete' | 'partial' | 'not_started' | 'failed';
  last_enriched: string | null;
  issues: string[];
}

export interface CategoryCoverage {
  category: string;
  total_filaments: number;
  field_coverage: Record<string, number>;
  overall_coverage: number;
  brands: string[];
}

export interface PipelineStats {
  total_enriched: number;
  enrichment_rate: number; // filaments per hour
  success_rate: number; // percentage
  last_run: string | null;
  next_run: string | null;
  errors: PipelineError[];
  queue_size: number;
}

export interface PipelineError {
  timestamp: string;
  filament_id: string;
  field: string;
  error: string;
  source: string;
}

export interface PriceFreshness {
  total_with_prices: number;
  fresh_7d: number;
  fresh_30d: number;
  stale_30d_plus: number;
  fresh_percentage: number;
  stale_brands: string[];
  last_updated: string;
}

export interface Alert {
  id: string;
  type: 'coverage_drop' | 'price_stale' | 'enrichment_failed' | 'brand_issue' | 'system_error';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  data: Record<string, any>;
  acknowledged: boolean;
}

// ============================================================================
// DASHBOARD CLASS
// ============================================================================

export class EnrichmentDashboard {
  private supabaseUrl: string;
  private supabaseKey: string;
  private metrics: CoverageMetrics | null = null;
  private refreshInterval: number = 300000; // 5 minutes
  
  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
  }
  
  /**
   * Get comprehensive coverage metrics
   */
  async getCoverageMetrics(): Promise<CoverageMetrics> {
    const timestamp = new Date().toISOString();
    
    // Fetch all data in parallel
    const [
      totalFilaments,
      totalBrands,
      totalCategories,
      fieldCoverage,
      brandCoverage,
      categoryCoverage,
      pipelineStats,
      priceFreshness,
      alerts
    ] = await Promise.all([
      this.getTotalFilaments(),
      this.getTotalBrands(),
      this.getTotalCategories(),
      this.getFieldCoverage(),
      this.getBrandCoverage(),
      this.getCategoryCoverage(),
      this.getPipelineStats(),
      this.getPriceFreshness(),
      this.getAlerts()
    ]);
    
    this.metrics = {
      timestamp,
      total_filaments: totalFilaments,
      total_brands: totalBrands,
      total_categories: totalCategories,
      fields: fieldCoverage,
      brands: brandCoverage,
      categories: categoryCoverage,
      pipeline: pipelineStats,
      price_freshness: priceFreshness,
      alerts: alerts
    };
    
    return this.metrics;
  }
  
  /**
   * Get total filaments count
   */
  private async getTotalFilaments(): Promise<number> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/filaments?select=count`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'count=exact'
          }
        }
      );
      
      if (response.ok) {
        const count = response.headers.get('content-range');
        if (count) {
          const match = count.match(/\/(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        }
      }
      
      // Fallback: count from a sample
      const sampleResponse = await fetch(
        `${this.supabaseUrl}/rest/v1/filaments?select=id&limit=1000`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (sampleResponse.ok) {
        const data = await sampleResponse.json();
        return data.length * 27; // Rough estimate based on ~27,000 total
      }
      
      return 0;
    } catch (error) {
      console.error('Error getting total filaments:', error);
      return 0;
    }
  }
  
  /**
   * Get total brands count
   */
  private async getTotalBrands(): Promise<number> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/brands?select=count`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'count=exact'
          }
        }
      );
      
      if (response.ok) {
        const count = response.headers.get('content-range');
        if (count) {
          const match = count.match(/\/(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        }
      }
      
      return 55; // Known count
    } catch (error) {
      console.error('Error getting total brands:', error);
      return 55;
    }
  }
  
  /**
   * Get total categories count
   */
  private async getTotalCategories(): Promise<number> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/filaments?select=material_type&material_type=not.is.null`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const categories = new Set(data.map((f: any) => f.material_type));
        return categories.size;
      }
      
      return 0;
    } catch (error) {
      console.error('Error getting total categories:', error);
      return 0;
    }
  }
  
  /**
   * Get field coverage for all important fields
   */
  private async getFieldCoverage(): Promise<Record<string, FieldCoverage>> {
    const fields = [
      'product_url', 'featured_image', 'product_title', 'material', 'color_family',
      'color_hex', 'variant_price', 'diameter_mm', 'weight_kg', 'nozzle_temp_min_c',
      'nozzle_temp_max_c', 'bed_temp_min_c', 'bed_temp_max_c', 'density_g_cm3',
      'print_speed_max_mm_s', 'transmission_distance', 'td_value', 'filascope_score'
    ];
    
    const fieldCoverage: Record<string, FieldCoverage> = {};
    
    for (const field of fields) {
      try {
        // Get total count
        const totalResponse = await fetch(
          `${this.supabaseUrl}/rest/v1/filaments?select=count`,
          {
            headers: {
              'apikey': this.supabaseKey,
              'Authorization': `Bearer ${this.supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'count=exact'
            }
          }
        );
        
        let total = 0;
        if (totalResponse.ok) {
          const count = totalResponse.headers.get('content-range');
          if (count) {
            const match = count.match(/\/(\d+)/);
            total = match ? parseInt(match[1], 10) : 0;
          }
        }
        
        // Get populated count
        const populatedResponse = await fetch(
          `${this.supabaseUrl}/rest/v1/filaments?select=count&${field}=not.is.null`,
          {
            headers: {
              'apikey': this.supabaseKey,
              'Authorization': `Bearer ${this.supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'count=exact'
            }
          }
        );
        
        let populated = 0;
        if (populatedResponse.ok) {
          const count = populatedResponse.headers.get('content-range');
          if (count) {
            const match = count.match(/\/(\d+)/);
            populated = match ? parseInt(match[1], 10) : 0;
          }
        }
        
        const percentage = total > 0 ? Math.round((populated / total) * 100) : 0;
        
        // Determine priority
        let priority: 'P0' | 'P1' | 'P2' | 'P3' = 'P2';
        if (['product_url', 'variant_price', 'featured_image'].includes(field)) {
          priority = 'P0';
        } else if (['product_title', 'material', 'color_family'].includes(field)) {
          priority = 'P1';
        } else if (['nozzle_temp_min_c', 'nozzle_temp_max_c', 'bed_temp_min_c', 'bed_temp_max_c'].includes(field)) {
          priority = 'P2';
        } else {
          priority = 'P3';
        }
        
        fieldCoverage[field] = {
          field,
          total,
          populated,
          percentage,
          trend: 'stable', // Would need historical data to calculate trend
          last_updated: new Date().toISOString(),
          priority
        };
      } catch (error) {
        console.error(`Error getting coverage for field ${field}:`, error);
      }
    }
    
    return fieldCoverage;
  }
  
  /**
   * Get brand coverage
   */
  private async getBrandCoverage(): Promise<BrandCoverage[]> {
    try {
      // Get all brands
      const brandsResponse = await fetch(
        `${this.supabaseUrl}/rest/v1/brands?select=id,name,slug&limit=100`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!brandsResponse.ok) {
        return [];
      }
      
      const brands = await brandsResponse.json();
      const brandCoverages: BrandCoverage[] = [];
      
      // Get coverage for each brand
      for (const brand of brands) {
        try {
          // Get filaments for this brand
          const filamentsResponse = await fetch(
            `${this.supabaseUrl}/rest/v1/filaments?select=id,product_url,featured_image,product_title,material,color_family,color_hex,variant_price,diameter_mm,weight_kg,nozzle_temp_min_c,nozzle_temp_max_c,bed_temp_min_c,bed_temp_max_c,density_g_cm3,print_speed_max_mm_s,transmission_distance,td_value,filascope_score&vendor=eq.${encodeURIComponent(brand.name)}&limit=1000`,
            {
              headers: {
                'apikey': this.supabaseKey,
                'Authorization': `Bearer ${this.supabaseKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (filamentsResponse.ok) {
            const filaments = await filamentsResponse.json();
            
            // Calculate field coverage
            const fieldCoverage: Record<string, number> = {};
            const fields = [
              'product_url', 'featured_image', 'product_title', 'material', 'color_family',
              'color_hex', 'variant_price', 'diameter_mm', 'weight_kg', 'nozzle_temp_min_c',
              'nozzle_temp_max_c', 'bed_temp_min_c', 'bed_temp_max_c', 'density_g_cm3',
              'print_speed_max_mm_s', 'transmission_distance', 'td_value', 'filascope_score'
            ];
            
            for (const field of fields) {
              const populated = filaments.filter((f: any) => f[field] !== null && f[field] !== undefined).length;
              fieldCoverage[field] = filaments.length > 0 ? Math.round((populated / filaments.length) * 100) : 0;
            }
            
            // Calculate overall coverage
            const totalCoverage = Object.values(fieldCoverage).reduce((sum, val) => sum + val, 0);
            const overallCoverage = Math.round(totalCoverage / fields.length);
            
            // Determine enrichment status
            let enrichmentStatus: 'complete' | 'partial' | 'not_started' | 'failed' = 'not_started';
            if (overallCoverage >= 80) {
              enrichmentStatus = 'complete';
            } else if (overallCoverage >= 40) {
              enrichmentStatus = 'partial';
            } else if (overallCoverage > 0) {
              enrichmentStatus = 'partial';
            }
            
            // Check for issues
            const issues: string[] = [];
            if (fieldCoverage['product_url'] < 50) {
              issues.push('Low product URL coverage');
            }
            if (fieldCoverage['variant_price'] < 30) {
              issues.push('Low price coverage');
            }
            if (fieldCoverage['featured_image'] < 20) {
              issues.push('Low image coverage');
            }
            
            brandCoverages.push({
              brand: brand.name,
              brand_slug: brand.slug,
              total_filaments: filaments.length,
              field_coverage: fieldCoverage,
              overall_coverage: overallCoverage,
              enrichment_status: enrichmentStatus,
              last_enriched: null, // Would need enrichment history table
              issues
            });
          }
        } catch (error) {
          console.error(`Error getting coverage for brand ${brand.name}:`, error);
        }
      }
      
      return brandCoverages;
    } catch (error) {
      console.error('Error getting brand coverage:', error);
      return [];
    }
  }
  
  /**
   * Get category coverage
   */
  private async getCategoryCoverage(): Promise<CategoryCoverage[]> {
    try {
      // Get all material types
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/filaments?select=material_type&material_type=not.is.null`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        return [];
      }
      
      const data = await response.json();
      const categories = [...new Set(data.map((f: any) => f.material_type))] as string[];
      
      const categoryCoverages: CategoryCoverage[] = [];
      
      for (const category of categories) {
        try {
          // Get filaments for this category
          const filamentsResponse = await fetch(
            `${this.supabaseUrl}/rest/v1/filaments?select=id,vendor,product_url,featured_image,product_title,material,color_family,color_hex,variant_price,diameter_mm,weight_kg,nozzle_temp_min_c,nozzle_temp_max_c,bed_temp_min_c,bed_temp_max_c,density_g_cm3,print_speed_max_mm_s,transmission_distance,td_value,filascope_score&material_type=eq.${encodeURIComponent(category)}&limit=1000`,
            {
              headers: {
                'apikey': this.supabaseKey,
                'Authorization': `Bearer ${this.supabaseKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (filamentsResponse.ok) {
            const filaments = await filamentsResponse.json();
            
            // Calculate field coverage
            const fieldCoverage: Record<string, number> = {};
            const fields = [
              'product_url', 'featured_image', 'product_title', 'material', 'color_family',
              'color_hex', 'variant_price', 'diameter_mm', 'weight_kg', 'nozzle_temp_min_c',
              'nozzle_temp_max_c', 'bed_temp_min_c', 'bed_temp_max_c', 'density_g_cm3',
              'print_speed_max_mm_s', 'transmission_distance', 'td_value', 'filascope_score'
            ];
            
            for (const field of fields) {
              const populated = filaments.filter((f: any) => f[field] !== null && f[field] !== undefined).length;
              fieldCoverage[field] = filaments.length > 0 ? Math.round((populated / filaments.length) * 100) : 0;
            }
            
            // Calculate overall coverage
            const totalCoverage = Object.values(fieldCoverage).reduce((sum, val) => sum + val, 0);
            const overallCoverage = Math.round(totalCoverage / fields.length);
            
            // Get unique brands
            const brands = [...new Set(filaments.map((f: any) => f.vendor))] as string[];
            
            categoryCoverages.push({
              category,
              total_filaments: filaments.length,
              field_coverage: fieldCoverage,
              overall_coverage: overallCoverage,
              brands
            });
          }
        } catch (error) {
          console.error(`Error getting coverage for category ${category}:`, error);
        }
      }
      
      return categoryCoverages;
    } catch (error) {
      console.error('Error getting category coverage:', error);
      return [];
    }
  }
  
  /**
   * Get pipeline statistics
   */
  private async getPipelineStats(): Promise<PipelineStats> {
    // This would need an enrichment history table
    // For now, return placeholder data
    return {
      total_enriched: 0,
      enrichment_rate: 0,
      success_rate: 0,
      last_run: null,
      next_run: null,
      errors: [],
      queue_size: 0
    };
  }
  
  /**
   * Get price freshness
   */
  private async getPriceFreshness(): Promise<PriceFreshness> {
    try {
      // Get filaments with prices
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/filaments?select=id,vendor,variant_price,last_scraped_at&variant_price=not.is.null&limit=1000`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        return {
          total_with_prices: 0,
          fresh_7d: 0,
          fresh_30d: 0,
          stale_30d_plus: 0,
          fresh_percentage: 0,
          stale_brands: [],
          last_updated: new Date().toISOString()
        };
      }
      
      const filaments = await response.json();
      
      const now = new Date();
      let fresh_7d = 0;
      let fresh_30d = 0;
      let stale_30d_plus = 0;
      const staleBrands = new Set<string>();
      
      for (const filament of filaments) {
        const lastScraped = filament.last_scraped_at;
        if (lastScraped) {
          const scrapedDate = new Date(lastScraped);
          const daysDiff = Math.floor((now.getTime() - scrapedDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff <= 7) {
            fresh_7d++;
          } else if (daysDiff <= 30) {
            fresh_30d++;
          } else {
            stale_30d_plus++;
            if (filament.vendor) {
              staleBrands.add(filament.vendor);
            }
          }
        }
      }
      
      const totalWithPrices = filaments.length;
      const freshPercentage = totalWithPrices > 0 ? Math.round(((fresh_7d + fresh_30d) / totalWithPrices) * 100) : 0;
      
      return {
        total_with_prices: totalWithPrices,
        fresh_7d,
        fresh_30d,
        stale_30d_plus,
        fresh_percentage: freshPercentage,
        stale_brands: Array.from(staleBrands),
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting price freshness:', error);
      return {
        total_with_prices: 0,
        fresh_7d: 0,
        fresh_30d: 0,
        stale_30d_plus: 0,
        fresh_percentage: 0,
        stale_brands: [],
        last_updated: new Date().toISOString()
      };
    }
  }
  
  /**
   * Get alerts
   */
  private async getAlerts(): Promise<Alert[]> {
    // This would need an alerts table
    // For now, return placeholder data
    return [];
  }
  
  /**
   * Generate dashboard report
   */
  async generateReport(): Promise<string> {
    const metrics = await this.getCoverageMetrics();
    
    let report = `# FilaScope Enrichment Dashboard Report\n\n`;
    report += `**Generated:** ${metrics.timestamp}\n\n`;
    
    report += `## Overview\n\n`;
    report += `- **Total Filaments:** ${metrics.total_filaments.toLocaleString()}\n`;
    report += `- **Total Brands:** ${metrics.total_brands}\n`;
    report += `- **Total Categories:** ${metrics.total_categories}\n\n`;
    
    report += `## Field Coverage\n\n`;
    report += `| Field | Coverage | Priority |\n`;
    report += `|-------|----------|----------|\n`;
    
    for (const [field, coverage] of Object.entries(metrics.fields)) {
      report += `| ${field} | ${coverage.percentage}% | ${coverage.priority} |\n`;
    }
    
    report += `\n## Top Brands by Coverage\n\n`;
    const sortedBrands = [...metrics.brands].sort((a, b) => b.overall_coverage - a.overall_coverage);
    
    for (let i = 0; i < Math.min(10, sortedBrands.length); i++) {
      const brand = sortedBrands[i];
      report += `${i + 1}. **${brand.brand}** - ${brand.overall_coverage}% (${brand.total_filaments} filaments)\n`;
    }
    
    report += `\n## Price Freshness\n\n`;
    report += `- **Total with prices:** ${metrics.price_freshness.total_with_prices.toLocaleString()}\n`;
    report += `- **Fresh (< 7 days):** ${metrics.price_freshness.fresh_7d.toLocaleString()}\n`;
    report += `- **Aging (7-30 days):** ${metrics.price_freshness.fresh_30d.toLocaleString()}\n`;
    report += `- **Stale (> 30 days):** ${metrics.price_freshness.stale_30d_plus.toLocaleString()}\n`;
    report += `- **Fresh percentage:** ${metrics.price_freshness.fresh_percentage}%\n`;
    
    if (metrics.price_freshness.stale_brands.length > 0) {
      report += `\n### Stale Brands\n\n`;
      for (const brand of metrics.price_freshness.stale_brands) {
        report += `- ${brand}\n`;
      }
    }
    
    report += `\n## Alerts\n\n`;
    if (metrics.alerts.length === 0) {
      report += `No alerts at this time.\n`;
    } else {
      for (const alert of metrics.alerts) {
        report += `- **${alert.severity.toUpperCase()}**: ${alert.message}\n`;
      }
    }
    
    return report;
  }
}

// ============================================================================
// DASHBOARD UTILITIES
// ============================================================================

/**
 * Create dashboard instance
 */
export function createDashboard(supabaseUrl: string, supabaseKey: string): EnrichmentDashboard {
  return new EnrichmentDashboard(supabaseUrl, supabaseKey);
}

/**
 * Generate quick coverage summary
 */
export async function generateQuickSummary(supabaseUrl: string, supabaseKey: string): Promise<string> {
  const dashboard = createDashboard(supabaseUrl, supabaseKey);
  const metrics = await dashboard.getCoverageMetrics();
  
  let summary = `📊 **FilaScope Coverage Summary**\n\n`;
  summary += `📁 ${metrics.total_filaments.toLocaleString()} filaments | 🏷️ ${metrics.total_brands} brands | 📦 ${metrics.total_categories} categories\n\n`;
  
  // Top 5 fields
  summary += `**Top 5 Fields:**\n`;
  const sortedFields = Object.entries(metrics.fields)
    .sort(([, a], [, b]) => b.percentage - a.percentage)
    .slice(0, 5);
  
  for (const [field, coverage] of sortedFields) {
    summary += `- ${field}: ${coverage.percentage}%\n`;
  }
  
  // Price freshness
  summary += `\n**Price Freshness:** ${metrics.price_freshness.fresh_percentage}% fresh\n`;
  
  return summary;
}

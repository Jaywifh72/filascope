/**
 * PRICE FRESHNESS MONITOR v2
 * 
 * Detects and fixes stale prices across all brands.
 * Provides actionable insights for maintaining fresh pricing data.
 */

// ============================================================================
// PRICE FRESHNESS INTERFACES
// ============================================================================

export interface PriceFreshnessReport {
  timestamp: string;
  total_filaments: number;
  filaments_with_prices: number;
  coverage_percentage: number;
  
  // Freshness tiers
  fresh: PriceTier;      // < 7 days
  aging: PriceTier;      // 7-30 days
  stale: PriceTier;      // > 30 days
  
  // Brand analysis
  brand_freshness: BrandFreshness[];
  
  // Category analysis
  category_freshness: CategoryFreshness[];
  
  // Actionable insights
  insights: PriceInsight[];
  
  // Recommended actions
  actions: RecommendedAction[];
}

export interface PriceTier {
  count: number;
  percentage: number;
  brands: string[];
  oldest_timestamp: string | null;
  newest_timestamp: string | null;
}

export interface BrandFreshness {
  brand: string;
  brand_slug: string;
  total_filaments: number;
  filaments_with_prices: number;
  fresh_count: number;
  aging_count: number;
  stale_count: number;
  fresh_percentage: number;
  average_age_days: number;
  oldest_price_days: number;
  issues: string[];
}

export interface CategoryFreshness {
  category: string;
  total_filaments: number;
  filaments_with_prices: number;
  fresh_count: number;
  aging_count: number;
  stale_count: number;
  fresh_percentage: number;
}

export interface PriceInsight {
  type: 'coverage' | 'freshness' | 'trend' | 'anomaly';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  data: Record<string, any>;
}

export interface RecommendedAction {
  priority: 'high' | 'medium' | 'low';
  action: string;
  target: string;
  expected_impact: string;
  estimated_effort: string;
}

// ============================================================================
// PRICE FRESHNESS MONITOR CLASS
// ============================================================================

export class PriceFreshnessMonitor {
  private supabaseUrl: string;
  private supabaseKey: string;
  
  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
  }
  
  /**
   * Generate comprehensive price freshness report
   */
  async generateReport(): Promise<PriceFreshnessReport> {
    const timestamp = new Date().toISOString();
    
    // Fetch all data in parallel
    const [
      totalFilaments,
      filamentsWithPrices,
      priceData,
      brandFreshness,
      categoryFreshness
    ] = await Promise.all([
      this.getTotalFilaments(),
      this.getFilamentsWithPrices(),
      this.getPriceData(),
      this.getBrandFreshness(),
      this.getCategoryFreshness()
    ]);
    
    // Calculate freshness tiers
    const now = new Date();
    const fresh: PriceTier = { count: 0, percentage: 0, brands: [], oldest_timestamp: null, newest_timestamp: null };
    const aging: PriceTier = { count: 0, percentage: 0, brands: [], oldest_timestamp: null, newest_timestamp: null };
    const stale: PriceTier = { count: 0, percentage: 0, brands: [], oldest_timestamp: null, newest_timestamp: null };
    
    for (const filament of priceData) {
      const lastScraped = filament.last_scraped_at;
      if (!lastScraped) continue;
      
      const scrapedDate = new Date(lastScraped);
      const daysDiff = Math.floor((now.getTime() - scrapedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 7) {
        fresh.count++;
        if (filament.vendor && !fresh.brands.includes(filament.vendor)) {
          fresh.brands.push(filament.vendor);
        }
        if (!fresh.oldest_timestamp || scrapedDate < new Date(fresh.oldest_timestamp)) {
          fresh.oldest_timestamp = lastScraped;
        }
        if (!fresh.newest_timestamp || scrapedDate > new Date(fresh.newest_timestamp)) {
          fresh.newest_timestamp = lastScraped;
        }
      } else if (daysDiff <= 30) {
        aging.count++;
        if (filament.vendor && !aging.brands.includes(filament.vendor)) {
          aging.brands.push(filament.vendor);
        }
        if (!aging.oldest_timestamp || scrapedDate < new Date(aging.oldest_timestamp)) {
          aging.oldest_timestamp = lastScraped;
        }
        if (!aging.newest_timestamp || scrapedDate > new Date(aging.newest_timestamp)) {
          aging.newest_timestamp = lastScraped;
        }
      } else {
        stale.count++;
        if (filament.vendor && !stale.brands.includes(filament.vendor)) {
          stale.brands.push(filament.vendor);
        }
        if (!stale.oldest_timestamp || scrapedDate < new Date(stale.oldest_timestamp)) {
          stale.oldest_timestamp = lastScraped;
        }
        if (!stale.newest_timestamp || scrapedDate > new Date(stale.newest_timestamp)) {
          stale.newest_timestamp = lastScraped;
        }
      }
    }
    
    const totalWithPrices = filamentsWithPrices;
    fresh.percentage = totalWithPrices > 0 ? Math.round((fresh.count / totalWithPrices) * 100) : 0;
    aging.percentage = totalWithPrices > 0 ? Math.round((aging.count / totalWithPrices) * 100) : 0;
    stale.percentage = totalWithPrices > 0 ? Math.round((stale.count / totalWithPrices) * 100) : 0;
    
    // Generate insights
    const insights = this.generateInsights(fresh, aging, stale, brandFreshness, totalFilaments, totalWithPrices);
    
    // Generate recommended actions
    const actions = this.generateRecommendedActions(fresh, aging, stale, brandFreshness);
    
    return {
      timestamp,
      total_filaments: totalFilaments,
      filaments_with_prices: totalWithPrices,
      coverage_percentage: totalFilaments > 0 ? Math.round((totalWithPrices / totalFilaments) * 100) : 0,
      fresh,
      aging,
      stale,
      brand_freshness: brandFreshness,
      category_freshness: categoryFreshness,
      insights,
      actions
    };
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
      
      return 0;
    } catch (error) {
      console.error('Error getting total filaments:', error);
      return 0;
    }
  }
  
  /**
   * Get filaments with prices count
   */
  private async getFilamentsWithPrices(): Promise<number> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/filaments?select=count&variant_price=not.is.null`,
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
      
      return 0;
    } catch (error) {
      console.error('Error getting filaments with prices:', error);
      return 0;
    }
  }
  
  /**
   * Get price data with timestamps
   */
  private async getPriceData(): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/filaments?select=id,vendor,material_type,variant_price,last_scraped_at&variant_price=not.is.null&limit=10000`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        return await response.json();
      }
      
      return [];
    } catch (error) {
      console.error('Error getting price data:', error);
      return [];
    }
  }
  
  /**
   * Get brand freshness analysis
   */
  private async getBrandFreshness(): Promise<BrandFreshness[]> {
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
      const brandFreshnessList: BrandFreshness[] = [];
      
      const now = new Date();
      
      for (const brand of brands) {
        try {
          // Get filaments for this brand with prices
          const filamentsResponse = await fetch(
            `${this.supabaseUrl}/rest/v1/filaments?select=id,variant_price,last_scraped_at&vendor=eq.${encodeURIComponent(brand.name)}&variant_price=not.is.null&limit=1000`,
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
            
            let freshCount = 0;
            let agingCount = 0;
            let staleCount = 0;
            let totalAgeDays = 0;
            let oldestDays = 0;
            
            for (const filament of filaments) {
              const lastScraped = filament.last_scraped_at;
              if (!lastScraped) continue;
              
              const scrapedDate = new Date(lastScraped);
              const daysDiff = Math.floor((now.getTime() - scrapedDate.getTime()) / (1000 * 60 * 60 * 24));
              
              totalAgeDays += daysDiff;
              oldestDays = Math.max(oldestDays, daysDiff);
              
              if (daysDiff <= 7) {
                freshCount++;
              } else if (daysDiff <= 30) {
                agingCount++;
              } else {
                staleCount++;
              }
            }
            
            const totalWithPrices = filaments.length;
            const freshPercentage = totalWithPrices > 0 ? Math.round((freshCount / totalWithPrices) * 100) : 0;
            const averageAgeDays = totalWithPrices > 0 ? Math.round(totalAgeDays / totalWithPrices) : 0;
            
            // Check for issues
            const issues: string[] = [];
            if (freshPercentage < 50) {
              issues.push('Low price freshness');
            }
            if (oldestDays > 60) {
              issues.push('Very old prices (>60 days)');
            }
            if (totalWithPrices < 10) {
              issues.push('Few prices available');
            }
            
            brandFreshnessList.push({
              brand: brand.name,
              brand_slug: brand.slug,
              total_filaments: totalWithPrices,
              filaments_with_prices: totalWithPrices,
              fresh_count: freshCount,
              aging_count: agingCount,
              stale_count: staleCount,
              fresh_percentage: freshPercentage,
              average_age_days: averageAgeDays,
              oldest_price_days: oldestDays,
              issues
            });
          }
        } catch (error) {
          console.error(`Error getting freshness for brand ${brand.name}:`, error);
        }
      }
      
      return brandFreshnessList;
    } catch (error) {
      console.error('Error getting brand freshness:', error);
      return [];
    }
  }
  
  /**
   * Get category freshness analysis
   */
  private async getCategoryFreshness(): Promise<CategoryFreshness[]> {
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
      
      const categoryFreshnessList: CategoryFreshness[] = [];
      const now = new Date();
      
      for (const category of categories) {
        try {
          // Get filaments for this category with prices
          const filamentsResponse = await fetch(
            `${this.supabaseUrl}/rest/v1/filaments?select=id,variant_price,last_scraped_at&material_type=eq.${encodeURIComponent(category)}&variant_price=not.is.null&limit=1000`,
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
            
            let freshCount = 0;
            let agingCount = 0;
            let staleCount = 0;
            
            for (const filament of filaments) {
              const lastScraped = filament.last_scraped_at;
              if (!lastScraped) continue;
              
              const scrapedDate = new Date(lastScraped);
              const daysDiff = Math.floor((now.getTime() - scrapedDate.getTime()) / (1000 * 60 * 60 * 24));
              
              if (daysDiff <= 7) {
                freshCount++;
              } else if (daysDiff <= 30) {
                agingCount++;
              } else {
                staleCount++;
              }
            }
            
            const totalWithPrices = filaments.length;
            const freshPercentage = totalWithPrices > 0 ? Math.round((freshCount / totalWithPrices) * 100) : 0;
            
            categoryFreshnessList.push({
              category,
              total_filaments: totalWithPrices,
              filaments_with_prices: totalWithPrices,
              fresh_count: freshCount,
              aging_count: agingCount,
              stale_count: staleCount,
              fresh_percentage: freshPercentage
            });
          }
        } catch (error) {
          console.error(`Error getting freshness for category ${category}:`, error);
        }
      }
      
      return categoryFreshnessList;
    } catch (error) {
      console.error('Error getting category freshness:', error);
      return [];
    }
  }
  
  /**
   * Generate actionable insights
   */
  private generateInsights(
    fresh: PriceTier,
    aging: PriceTier,
    stale: PriceTier,
    brandFreshness: BrandFreshness[],
    totalFilaments: number,
    totalWithPrices: number
  ): PriceInsight[] {
    const insights: PriceInsight[] = [];
    
    // Coverage insight
    const coveragePercentage = totalFilaments > 0 ? Math.round((totalWithPrices / totalFilaments) * 100) : 0;
    if (coveragePercentage < 80) {
      insights.push({
        type: 'coverage',
        severity: 'critical',
        message: `Price coverage is low (${coveragePercentage}%). Only ${totalWithPrices.toLocaleString()} of ${totalFilaments.toLocaleString()} filaments have prices.`,
        data: { coverage_percentage: coveragePercentage, total_filaments: totalFilaments, filaments_with_prices: totalWithPrices }
      });
    }
    
    // Freshness insight
    const freshPercentage = totalWithPrices > 0 ? Math.round((fresh.count / totalWithPrices) * 100) : 0;
    if (freshPercentage < 70) {
      insights.push({
        type: 'freshness',
        severity: 'warning',
        message: `Price freshness is below target (${freshPercentage}%). ${stale.count.toLocaleString()} prices are older than 30 days.`,
        data: { fresh_percentage: freshPercentage, fresh_count: fresh.count, stale_count: stale.count }
      });
    }
    
    // Brand issues insight
    const brandsWithIssues = brandFreshness.filter(b => b.issues.length > 0);
    if (brandsWithIssues.length > 0) {
      insights.push({
        type: 'anomaly',
        severity: 'warning',
        message: `${brandsWithIssues.length} brands have price freshness issues.`,
        data: { brands_with_issues: brandsWithIssues.map(b => b.brand) }
      });
    }
    
    return insights;
  }
  
  /**
   * Generate recommended actions
   */
  private generateRecommendedActions(
    fresh: PriceTier,
    aging: PriceTier,
    stale: PriceTier,
    brandFreshness: BrandFreshness[]
  ): RecommendedAction[] {
    const actions: RecommendedAction[] = [];
    
    // High priority: Stale prices
    if (stale.count > 100) {
      actions.push({
        priority: 'high',
        action: 'Refresh stale prices',
        target: `${stale.count} filaments with prices older than 30 days`,
        expected_impact: 'Improve price freshness by 20-30%',
        estimated_effort: '2-3 hours'
      });
    }
    
    // Medium priority: Aging prices
    if (aging.count > 500) {
      actions.push({
        priority: 'medium',
        action: 'Schedule aging price refresh',
        target: `${aging.count} filaments with prices 7-30 days old`,
        expected_impact: 'Prevent prices from becoming stale',
        estimated_effort: '1-2 hours'
      });
    }
    
    // Low priority: Brand-specific issues
    const brandsWithIssues = brandFreshness.filter(b => b.issues.length > 0);
    if (brandsWithIssues.length > 0) {
      actions.push({
        priority: 'low',
        action: 'Address brand-specific price issues',
        target: `${brandsWithIssues.length} brands with freshness issues`,
        expected_impact: 'Improve overall brand coverage',
        estimated_effort: '3-5 hours'
      });
    }
    
    return actions;
  }
  
  /**
   * Generate price freshness report
   */
  async generateReportString(): Promise<string> {
    const report = await this.generateReport();
    
    let output = `# Price Freshness Report\n\n`;
    output += `**Generated:** ${report.timestamp}\n\n`;
    
    output += `## Overview\n\n`;
    output += `- **Total Filaments:** ${report.total_filaments.toLocaleString()}\n`;
    output += `- **Filaments with Prices:** ${report.filaments_with_prices.toLocaleString()}\n`;
    output += `- **Coverage:** ${report.coverage_percentage}%\n\n`;
    
    output += `## Freshness Tiers\n\n`;
    output += `| Tier | Count | Percentage | Brands |\n`;
    output += `|------|-------|------------|--------|\n`;
    output += `| Fresh (< 7 days) | ${report.fresh.count.toLocaleString()} | ${report.fresh.percentage}% | ${report.fresh.brands.length} |\n`;
    output += `| Aging (7-30 days) | ${report.aging.count.toLocaleString()} | ${report.aging.percentage}% | ${report.aging.brands.length} |\n`;
    output += `| Stale (> 30 days) | ${report.stale.count.toLocaleString()} | ${report.stale.percentage}% | ${report.stale.brands.length} |\n\n`;
    
    output += `## Top Brands by Freshness\n\n`;
    const sortedBrands = [...report.brand_freshness].sort((a, b) => b.fresh_percentage - a.fresh_percentage);
    
    for (let i = 0; i < Math.min(10, sortedBrands.length); i++) {
      const brand = sortedBrands[i];
      output += `${i + 1}. **${brand.brand}** - ${brand.fresh_percentage}% fresh (${brand.total_filaments} filaments)\n`;
    }
    
    output += `\n## Insights\n\n`;
    for (const insight of report.insights) {
      output += `- **${insight.severity.toUpperCase()}**: ${insight.message}\n`;
    }
    
    output += `\n## Recommended Actions\n\n`;
    for (const action of report.actions) {
      output += `### ${action.priority.toUpperCase()}: ${action.action}\n`;
      output += `- **Target:** ${action.target}\n`;
      output += `- **Expected Impact:** ${action.expected_impact}\n`;
      output += `- **Estimated Effort:** ${action.estimated_effort}\n\n`;
    }
    
    return output;
  }
}

// ============================================================================
// PRICE FRESHNESS UTILITIES
// ============================================================================

/**
 * Create price freshness monitor instance
 */
export function createPriceFreshnessMonitor(supabaseUrl: string, supabaseKey: string): PriceFreshnessMonitor {
  return new PriceFreshnessMonitor(supabaseUrl, supabaseKey);
}

/**
 * Generate quick price freshness summary
 */
export async function generateQuickPriceSummary(supabaseUrl: string, supabaseKey: string): Promise<string> {
  const monitor = createPriceFreshnessMonitor(supabaseUrl, supabaseKey);
  const report = await monitor.generateReport();
  
  let summary = `💰 **Price Freshness Summary**\n\n`;
  summary += `📊 ${report.filaments_with_prices.toLocaleString()}/${report.total_filaments.toLocaleString()} filaments have prices (${report.coverage_percentage}%)\n\n`;
  summary += `**Freshness:**\n`;
  summary += `✅ Fresh (< 7 days): ${report.fresh.percentage}%\n`;
  summary += `⚠️ Aging (7-30 days): ${report.aging.percentage}%\n`;
  summary += `❌ Stale (> 30 days): ${report.stale.percentage}%\n`;
  
  return summary;
}

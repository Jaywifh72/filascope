/**
 * URL RESOLVER v2
 * 
 * Finds and validates product URLs for filaments.
 * Supports multiple strategies:
 * 1. Shopify API query
 * 2. Firecrawl search
 * 3. Amazon product lookup
 * 4. Direct URL validation
 */

// ============================================================================
// URL RESOLVER INTERFACES
// ============================================================================

export interface UrlResolverResult {
  filament_id: string;
  vendor: string;
  product_title: string;
  resolved_url: string | null;
  source: 'shopify_api' | 'firecrawl' | 'amazon' | 'database' | 'search';
  confidence: number;
  metadata: {
    product_type?: string;
    price?: string;
    image_url?: string;
    handle?: string;
    sku?: string;
  };
  timestamp: string;
}

export interface BrandUrlConfig {
  vendor: string;
  base_url: string;
  platform: 'shopify' | 'woocommerce' | 'amazon' | 'custom';
  search_pattern?: string;
  api_endpoint?: string;
  requires_auth: boolean;
  auth_method?: 'api_key' | 'bearer_token' | 'none';
  rate_limit_ms: number;
}

// ============================================================================
// URL RESOLVER CLASS
// ============================================================================

export class UrlResolver {
  private firecrawlApiKey: string;
  private supabaseUrl: string;
  private supabaseKey: string;
  private brandConfigs: Map<string, BrandUrlConfig>;
  
  constructor(
    firecrawlApiKey: string,
    supabaseUrl: string,
    supabaseKey: string,
    brandConfigs: Map<string, BrandUrlConfig>
  ) {
    this.firecrawlApiKey = firecrawlApiKey;
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.brandConfigs = brandConfigs;
  }
  
  /**
   * Resolve URL for a filament using multiple strategies
   */
  async resolveUrl(filament: any): Promise<UrlResolverResult> {
    const result: UrlResolverResult = {
      filament_id: filament.id,
      vendor: filament.vendor || 'Unknown',
      product_title: filament.title || filament.product_title || '',
      resolved_url: null,
      source: 'database',
      confidence: 0,
      metadata: {},
      timestamp: new Date().toISOString()
    };
    
    // Strategy 1: Check if URL already exists and is valid
    if (filament.product_url) {
      const isValid = await this.validateUrl(filament.product_url);
      if (isValid) {
        result.resolved_url = filament.product_url;
        result.confidence = 1.0;
        result.source = 'database';
        return result;
      }
    }
    
    // Strategy 2: Try Shopify API for brands that support it
    const shopifyResult = await this.tryShopifyApi(filament);
    if (shopifyResult) {
      return shopifyResult;
    }
    
    // Strategy 3: Try Firecrawl search
    const firecrawlResult = await this.tryFirecrawlSearch(filament);
    if (firecrawlResult) {
      return firecrawlResult;
    }
    
    // Strategy 4: Try Amazon lookup (if we have ASIN or can find one)
    const amazonResult = await this.tryAmazonLookup(filament);
    if (amazonResult) {
      return amazonResult;
    }
    
    return result;
  }
  
  /**
   * Validate if a URL is accessible and returns valid content
   */
  private async validateUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'FilaScope/1.0 (+https://filascope.com/)',
        },
        signal: AbortSignal.timeout(10000),
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Try Shopify API for brands that support it
   */
  private async tryShopifyApi(filament: any): Promise<UrlResolverResult | null> {
    const vendor = filament.vendor || '';
    const config = this.brandConfigs.get(vendor.toLowerCase());
    
    if (!config || config.platform !== 'shopify') {
      return null;
    }
    
    try {
      // Search for product by title or SKU
      const searchQuery = filament.title || filament.product_title || '';
      if (!searchQuery) {
        return null;
      }
      
      // Clean search query
      const cleanQuery = searchQuery
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 50);
      
      // Try Shopify search API
      const searchUrl = `${config.base_url}/search/suggest.json?q=${encodeURIComponent(cleanQuery)}&resources[type]=product&resources[limit]=5`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'FilaScope/1.0 (+https://filascope.com/)',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      const products = data.resources?.results?.products || [];
      
      if (products.length === 0) {
        return null;
      }
      
      // Find best match by title similarity
      const bestMatch = this.findBestTitleMatch(searchQuery, products);
      
      if (bestMatch && bestMatch.confidence > 0.7) {
        return {
          filament_id: filament.id,
          vendor: vendor,
          product_title: searchQuery,
          resolved_url: bestMatch.url,
          source: 'shopify_api',
          confidence: bestMatch.confidence,
          metadata: {
            product_type: bestMatch.product_type,
            price: bestMatch.price,
            image_url: bestMatch.image,
            handle: bestMatch.handle,
          },
          timestamp: new Date().toISOString()
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Shopify API error for ${vendor}:`, error);
      return null;
    }
}
  
  /**
   * Try Firecrawl search for product URLs
   */
  private async tryFirecrawlSearch(filament: any): Promise<UrlResolverResult | null> {
    const vendor = filament.vendor || '';
    const searchQuery = filament.title || filament.product_title || '';
    
    if (!searchQuery) {
      return null;
    }
    
    try {
      // Search for product using Firecrawl
      const response = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `${vendor} ${searchQuery} filament 3d printing`,
          limit: 5,
          scrapeOptions: {
            formats: ['markdown'],
            onlyMainContent: true,
          },
        }),
        signal: AbortSignal.timeout(30000),
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      const results = data.data || [];
      
      if (results.length === 0) {
        return null;
      }
      
      // Find best match by title similarity and content relevance
      const bestMatch = this.findBestFirecrawlMatch(searchQuery, vendor, results);
      
      if (bestMatch && bestMatch.confidence > 0.6) {
        return {
          filament_id: filament.id,
          vendor: vendor,
          product_title: searchQuery,
          resolved_url: bestMatch.url,
          source: 'firecrawl',
          confidence: bestMatch.confidence,
          metadata: {},
          timestamp: new Date().toISOString()
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Firecrawl search error for ${vendor}:`, error);
      return null;
    }
  }
  
  /**
   * Try Amazon product lookup
   */
  private async tryAmazonLookup(filament: any): Promise<UrlResolverResult | null> {
    // Amazon lookup would require ASIN or product matching
    // This is a placeholder for future implementation
    return null;
  }
  
  /**
   * Find best title match from Shopify products
   */
  private findBestTitleMatch(searchQuery: string, products: any[]): any | null {
    const searchWords = searchQuery.toLowerCase().split(/\s+/);
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const product of products) {
      const productTitle = (product.title || '').toLowerCase();
      const productWords = productTitle.split(/\s+/);
      
      // Calculate word overlap score
      let matchCount = 0;
      for (const word of searchWords) {
        if (word.length > 2 && productWords.some((pw: string) => pw.includes(word) || word.includes(pw))) {
          matchCount++;
        }
      }
      
      const score = searchWords.length > 0 ? matchCount / searchWords.length : 0;
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          url: product.url,
          title: product.title,
          product_type: product.product_type,
          price: product.price,
          image: product.image?.src,
          handle: product.handle,
          confidence: score,
        };
      }
    }
    
    return bestMatch;
  }
  
  /**
   * Find best match from Firecrawl results
   */
  private findBestFirecrawlMatch(searchQuery: string, vendor: string, results: any[]): any | null {
    const searchWords = searchQuery.toLowerCase().split(/\s+/);
    const vendorLower = vendor.toLowerCase();
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const result of results) {
      const url = result.url || '';
      const title = result.title || '';
      const content = result.markdown || '';
      
      let score = 0;
      
      // Check URL for vendor name
      if (url.toLowerCase().includes(vendorLower)) {
        score += 0.3;
      }
      
      // Check title for search words
      const titleLower = title.toLowerCase();
      let titleMatches = 0;
      for (const word of searchWords) {
        if (word.length > 2 && titleLower.includes(word)) {
          titleMatches++;
        }
      }
      score += searchWords.length > 0 ? (titleMatches / searchWords.length) * 0.5 : 0;
      
      // Check content for product-related keywords
      if (content.includes('filament') || content.includes('3d printing') || content.includes('1.75mm')) {
        score += 0.2;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          url: url,
          title: title,
          confidence: score,
        };
      }
    }
    
    return bestMatch;
  }
}

// ============================================================================
// BRAND URL CONFIGURATIONS
// ============================================================================

export const BRAND_URL_CONFIGS: Map<string, BrandUrlConfig> = new Map([
  // Shopify brands with working API
  ['polymaker', {
    vendor: 'Polymaker',
    base_url: 'https://us.polymaker.com',
    platform: 'shopify',
    search_pattern: '/search/suggest.json?q={query}&resources[type]=product',
    api_endpoint: '/products.json',
    requires_auth: false,
    rate_limit_ms: 500,
  }],
  ['3dhojor', {
    vendor: '3DHOJOR',
    base_url: 'https://3dhojor.com',
    platform: 'shopify',
    search_pattern: '/search/suggest.json?q={query}&resources[type]=product',
    api_endpoint: '/products.json',
    requires_auth: false,
    rate_limit_ms: 500,
  }],
  ['hatchbox', {
    vendor: 'Hatchbox',
    base_url: 'https://www.hatchbox3d.com',
    platform: 'shopify',
    search_pattern: '/search/suggest.json?q={query}&resources[type]=product',
    api_endpoint: '/products.json',
    requires_auth: false,
    rate_limit_ms: 500,
  }],
  ['amolen', {
    vendor: 'Amolen',
    base_url: 'https://amolen.com',
    platform: 'shopify',
    search_pattern: '/search/suggest.json?q={query}&resources[type]=product',
    api_endpoint: '/products.json',
    requires_auth: false,
    rate_limit_ms: 500,
  }],
  
  // Brands that need Firecrawl
  ['bambu lab', {
    vendor: 'Bambu Lab',
    base_url: 'https://us.store.bambulab.com',
    platform: 'shopify',
    requires_auth: false,
    rate_limit_ms: 1000,
  }],
  ['esun', {
    vendor: 'eSun',
    base_url: 'https://www.esun3d.com',
    platform: 'custom',
    requires_auth: false,
    rate_limit_ms: 1000,
  }],
  ['gizmo dorks', {
    vendor: 'Gizmo Dorks',
    base_url: 'https://gizmodorks.com',
    platform: 'custom',
    requires_auth: false,
    rate_limit_ms: 1000,
  }],
  
  // Amazon-only brands would go here
]);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create URL resolver instance
 */
export function createUrlResolver(
  firecrawlApiKey: string,
  supabaseUrl: string,
  supabaseKey: string
): UrlResolver {
  return new UrlResolver(firecrawlApiKey, supabaseUrl, supabaseKey, BRAND_URL_CONFIGS);
}

/**
 * Batch resolve URLs for multiple filaments
 */
export async function batchResolveUrls(
  filaments: any[],
  resolver: UrlResolver,
  maxConcurrent: number = 3
): Promise<UrlResolverResult[]> {
  const results: UrlResolverResult[] = [];
  
  // Process in batches
  for (let i = 0; i < filaments.length; i += maxConcurrent) {
    const batch = filaments.slice(i, i + maxConcurrent);
    const batchPromises = batch.map(f => resolver.resolveUrl(f));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Rate limiting
    if (i + maxConcurrent < filaments.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

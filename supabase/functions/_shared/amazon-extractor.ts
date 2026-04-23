/**
 * AMAZON AFFILIATE LINK EXTRACTOR v2
 * 
 * Matches filaments to Amazon products and generates affiliate links.
 * Uses existing Amazon links in database as reference.
 * Falls back to product title/vendor matching for new products.
 */

// ============================================================================
// AMAZON INTERFACES
// ============================================================================

export interface AmazonProduct {
  asin: string;
  title: string;
  url: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  brand?: string;
  matchConfidence: number;
}

export interface ExtractionResult {
  field: string;
  value: any;
  source: string;
  confidence: number;
  raw_value?: any;
}

// ============================================================================
// AMAZON AFFILIATE LINK GENERATOR
// ============================================================================

/**
 * Generate Amazon affiliate link from ASIN
 */
export function generateAmazonAffiliateLink(
  asin: string,
  tag: string = 'filascope-20',
  region: string = 'US'
): string {
  const regionDomains: Record<string, string> = {
    'US': 'www.amazon.com',
    'CA': 'www.amazon.ca',
    'UK': 'www.amazon.co.uk',
    'DE': 'www.amazon.de',
    'FR': 'www.amazon.fr',
    'ES': 'www.amazon.es',
    'IT': 'www.amazon.it',
    'NL': 'www.amazon.nl',
    'BE': 'www.amazon.com.be',
    'JP': 'www.amazon.co.jp',
    'AU': 'www.amazon.com.au'
  };
  
  const domain = regionDomains[region] || regionDomains['US'];
  return `https://${domain}/dp/${asin}?tag=${tag}`;
}

/**
 * Extract ASIN from Amazon URL
 */
export function extractAsinFromUrl(url: string): string | null {
  if (!url) return null;
  
  // Match patterns like:
  // https://www.amazon.com/dp/B08XYZ1234
  // https://www.amazon.com/gp/product/B08XYZ1234
  // https://www.amazon.com/exec/obidos/ASIN/B08XYZ1234
  
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/exec\/obidos\/ASIN\/([A-Z0-9]{10})/i,
    /\/ASIN\/([A-Z0-9]{10})/i,
    /\/([A-Z0-9]{10})(?:\/|\?|$)/i
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
  }
  
  return null;
}

/**
 * Extract affiliate tag from Amazon URL
 */
export function extractAffiliateTag(url: string): string | null {
  if (!url) return null;
  
  // Match ?tag=xxx or &tag=xxx
  const tagMatch = url.match(/[?&]tag=([^&]+)/i);
  return tagMatch ? tagMatch[1] : null;
}

/**
 * Match filament to Amazon product using existing links in database
 */
export function matchFilamentToAmazon(
  filament: any,
  existingAmazonLinks: any[]
): AmazonProduct | null {
  if (!existingAmazonLinks || existingAmazonLinks.length === 0) {
    return null;
  }
  
  const filamentTitle = (filament.product_title || '').toLowerCase();
  const filamentVendor = (filament.vendor || '').toLowerCase();
  const filamentMaterial = (filament.material || '').toLowerCase();
  
  // Try to find exact match by ASIN
  if (filament.amazon_link_us) {
    const asin = extractAsinFromUrl(filament.amazon_link_us);
    if (asin) {
      return {
        asin,
        title: filament.product_title,
        url: filament.amazon_link_us,
        brand: filament.vendor,
        matchConfidence: 1.0
      };
    }
  }
  
  // Try to find match by title similarity
  for (const link of existingAmazonLinks) {
    const linkTitle = (link.title || '').toLowerCase();
    const linkVendor = (link.brand || '').toLowerCase();
    
    // Check for title match
    if (linkTitle && filamentTitle) {
      const titleSimilarity = calculateStringSimilarity(filamentTitle, linkTitle);
      if (titleSimilarity > 0.8) {
        const asin = extractAsinFromUrl(link.url) || '';
        return {
          asin,
          title: link.title,
          url: link.url,
          price: link.price,
          currency: link.currency,
          imageUrl: link.imageUrl,
          brand: link.brand,
          matchConfidence: titleSimilarity
        };
      }
    }
    
    // Check for vendor + material match
    if (linkVendor && filamentVendor && linkVendor === filamentVendor) {
      const linkMaterial = (link.material || '').toLowerCase();
      if (linkMaterial && filamentMaterial && linkMaterial === filamentMaterial) {
        const asin = extractAsinFromUrl(link.url) || '';
        return {
          asin,
          title: link.title,
          url: link.url,
          price: link.price,
          currency: link.currency,
          imageUrl: link.imageUrl,
          brand: link.brand,
          matchConfidence: 0.7
        };
      }
    }
  }
  
  return null;
}

/**
 * Calculate string similarity (Levenshtein distance based)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  
  // Simple word overlap calculation
  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Generate Amazon affiliate links for all regions
 */
export function generateAllRegionalLinks(
  asin: string,
  tag: string = 'filascope-20'
): Record<string, string> {
  const regions = ['US', 'CA', 'UK', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'JP', 'AU'];
  const links: Record<string, string> = {};
  
  for (const region of regions) {
    links[`amazon_link_${region.toLowerCase()}`] = generateAmazonAffiliateLink(asin, tag, region);
  }
  
  return links;
}

/**
 * Extract Amazon links from filament data
 */
export function extractAmazonLinksFromFilament(filament: any): ExtractionResult[] {
  const results: ExtractionResult[] = [];
  
  // Check for existing Amazon links
  const amazonFields = [
    'amazon_link_us', 'amazon_link_ca', 'amazon_link_uk', 'amazon_link_de',
    'amazon_link_fr', 'amazon_link_es', 'amazon_link_it', 'amazon_link_nl',
    'amazon_link_be', 'amazon_link_jp', 'amazon_link_au'
  ];
  
  for (const field of amazonFields) {
    const value = filament[field];
    if (value) {
      const asin = extractAsinFromUrl(value);
      const tag = extractAffiliateTag(value);
      
      results.push({
        field,
        value,
        source: 'database',
        confidence: 1.0,
        raw_value: { asin, tag }
      });
    }
  }
  
  // Check for Amazon price
  if (filament.amazon_price_usd) {
    results.push({
      field: 'amazon_price_usd',
      value: filament.amazon_price_usd,
      source: 'database',
      confidence: 1.0,
      raw_value: filament.amazon_price_usd
    });
  }
  
  // Check for match confidence
  if (filament.amazon_match_confidence) {
    results.push({
      field: 'amazon_match_confidence',
      value: filament.amazon_match_confidence,
      source: 'database',
      confidence: 1.0,
      raw_value: filament.amazon_match_confidence
    });
  }
  
  return results;
}

/**
 * Find Amazon products by search query
 * NOTE: This requires Amazon PA-API credentials
 * For now, returns empty array as placeholder
 */
export async function searchAmazonProducts(
  query: string,
  brand: string,
  material: string,
  limit: number = 5
): Promise<AmazonProduct[]> {
  // TODO: Implement Amazon PA-API search
  // This would require:
  // 1. Amazon PA-API credentials
  // 2. Product Advertising API client
  // 3. Search by keywords
  
  console.log(`[AMAZON] Search not implemented: ${query}`);
  return [];
}

/**
 * Match filaments to Amazon products using existing database links
 */
export function matchFilamentsToAmazon(
  filaments: any[],
  existingAmazonLinks: any[]
): Map<string, AmazonProduct> {
  const matches = new Map<string, AmazonProduct>();
  
  for (const filament of filaments) {
    const match = matchFilamentToAmazon(filament, existingAmazonLinks);
    if (match) {
      matches.set(filament.id, match);
    }
  }
  
  return matches;
}

/**
 * Generate Amazon affiliate link report
 */
export function generateAmazonReport(
  filaments: any[],
  matches: Map<string, AmazonProduct>
): {
  total_filaments: number;
  filaments_with_amazon: number;
  filaments_without_amazon: number;
  coverage_percentage: number;
  top_brands_with_amazon: Array<{ brand: string; count: number }>;
  top_brands_without_amazon: Array<{ brand: string; count: number }>;
} {
  const filamentsWithAmazon = filaments.filter(f => 
    f.amazon_link_us || f.amazon_link_ca || f.amazon_link_uk
  );
  
  const filamentsWithoutAmazon = filaments.filter(f => 
    !f.amazon_link_us && !f.amazon_link_ca && !f.amazon_link_uk
  );
  
  // Count by brand
  const brandWithAmazon: Record<string, number> = {};
  const brandWithoutAmazon: Record<string, number> = {};
  
  for (const f of filamentsWithAmazon) {
    const brand = f.vendor || 'Unknown';
    brandWithAmazon[brand] = (brandWithAmazon[brand] || 0) + 1;
  }
  
  for (const f of filamentsWithoutAmazon) {
    const brand = f.vendor || 'Unknown';
    brandWithoutAmazon[brand] = (brandWithoutAmazon[brand] || 0) + 1;
  }
  
  // Convert to arrays and sort
  const topBrandsWithAmazon = Object.entries(brandWithAmazon)
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  const topBrandsWithoutAmazon = Object.entries(brandWithoutAmazon)
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return {
    total_filaments: filaments.length,
    filaments_with_amazon: filamentsWithAmazon.length,
    filaments_without_amazon: filamentsWithoutAmazon.length,
    coverage_percentage: Math.round((filamentsWithAmazon.length / filaments.length) * 100 * 10) / 10,
    top_brands_with_amazon: topBrandsWithAmazon,
    top_brands_without_amazon: topBrandsWithoutAmazon
  };
}

console.log(`✅ Amazon Affiliate Link Extractor loaded`);
console.log(`   Generates affiliate links from ASINs`);
console.log(`   Matches filaments to existing Amazon links`);
console.log(`   Supports 11 regions: US, CA, UK, DE, FR, ES, IT, NL, BE, JP, AU`);
console.log(`   Default affiliate tag: filascope-20`);

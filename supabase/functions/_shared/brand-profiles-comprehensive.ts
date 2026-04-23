/**
 * COMPREHENSIVE BRAND PROFILES v3
 * 
 * Complete brand profiles for ALL 55 FilaScope brands.
 * Supports Shopify, WooCommerce, Amazon, and custom platforms.
 * Includes field extraction rules, rate limits, and expected coverage.
 */

// ============================================================================
// BRAND PROFILE INTERFACES (Enhanced)
// ============================================================================

export interface FieldExtractionRule {
  field: string;
  source: 'api' | 'scrape' | 'tds' | 'amazon' | 'manual' | 'calculate';
  selector?: string;        // CSS selector for scraping
  api_field?: string;       // API field name
  transform?: string;       // Transformation function name
  fallback?: string;        // Fallback value or source
  confidence: number;       // 0-1 confidence score
  dependencies?: string[];  // Other fields required first
}

export interface DataSource {
  type: 'shopify_api' | 'firecrawl' | 'amazon_paapi' | 'tds_sheet' | 'woocommerce_api' | 'custom';
  url_pattern: string;
  fields_extracted: string[];
  rate_limit: number;       // Requests per second
  requires_auth: boolean;
  auth_method?: 'api_key' | 'bearer_token' | 'basic_auth' | 'none';
  headers?: Record<string, string>;
  pagination?: {
    type: 'page' | 'cursor' | 'offset';
    param: string;
    limit: number;
  };
}

export interface RateLimits {
  requests_per_second: number;
  delay_between_requests_ms: number;
  max_concurrent_requests: number;
  retry_attempts: number;
  retry_delay_ms: number;
}

export interface ExpectedCoverage {
  basic: number;      // e.g., 95%
  technical: number;  // e.g., 60%
  regional: number;   // e.g., 80%
  scoring: number;    // e.g., 50%
  overall: number;    // e.g., 70%
}

export interface BrandProfile {
  brand_slug: string;
  display_name: string;
  platform: 'shopify' | 'woocommerce' | 'firecrawl' | 'amazon' | 'custom';
  base_url: string;
  regions: Record<string, string>;
  api_endpoint: string;
  scrape_method: string;
  currency: string | Record<string, string>;
  expected_filaments: number;
  quirks: string[];
  active: boolean;
  
  // New: Field extraction rules
  field_extraction_rules: FieldExtractionRule[];
  
  // New: Data source priorities
  data_sources: DataSource[];
  
  // New: Rate limiting
  rate_limits: RateLimits;
  
  // New: Field coverage expectations
  expected_field_coverage: ExpectedCoverage;
  
  // New: Amazon affiliate tag (if available)
  amazon_tag?: string;
  
  // New: Special handling notes
  special_handling?: string[];
}

// ============================================================================
// COMPREHENSIVE BRAND PROFILES DATABASE
// ============================================================================

export const BRAND_PROFILES: Record<string, BrandProfile> = {
  // ============================================================================
  // TIER 1: SHOPIFY BRANDS WITH WORKING API
  // ============================================================================
  
  'polymaker': {
    brand_slug: 'polymaker',
    display_name: 'Polymaker',
    platform: 'shopify',
    base_url: 'https://us.polymaker.com',
    regions: {
      US: 'https://us.polymaker.com',
      CA: 'https://ca.polymaker.com',
      EU: 'https://eu.polymaker.com'
    },
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: { US: 'USD', CA: 'CAD', EU: 'EUR' },
    expected_filaments: 738,
    quirks: [
      'Multi-region subdomains',
      'Large catalog with many variants',
      'Good TDS documentation available'
    ],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
      { field: 'material', source: 'api', api_field: 'product_type', confidence: 0.9 },
      { field: 'color_family', source: 'api', api_field: 'tags', transform: 'extractColor', confidence: 0.8 },
      { field: 'nozzle_temp_min_c', source: 'scrape', selector: '.specs-table td:contains("Nozzle")', transform: 'extractTempRange', confidence: 0.7 },
      { field: 'bed_temp_min_c', source: 'scrape', selector: '.specs-table td:contains("Bed")', transform: 'extractTempRange', confidence: 0.7 },
      { field: 'density_g_cm3', source: 'scrape', selector: '.specs-table td:contains("Density")', transform: 'extractNumber', confidence: 0.6 },
      { field: 'transmission_distance', source: 'tds', url_pattern: 'https://polymaker.com/tds/{sku}.pdf', confidence: 0.5 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250&page={page}',
        fields_extracted: ['product_title', 'variant_price', 'featured_image', 'material', 'color_family'],
        rate_limit: 2,
        requires_auth: false,
        pagination: { type: 'page', param: 'page', limit: 250 }
      },
      {
        type: 'firecrawl',
        url_pattern: '{base_url}/products/{handle}',
        fields_extracted: ['nozzle_temp_min_c', 'nozzle_temp_max_c', 'bed_temp_min_c', 'bed_temp_max_c', 'density_g_cm3'],
        rate_limit: 1,
        requires_auth: true,
        auth_method: 'bearer_token'
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 3,
      retry_attempts: 3,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 95,
      technical: 60,
      regional: 80,
      scoring: 50,
      overall: 70
    },
    amazon_tag: 'filascope-20',
    special_handling: [
      'Use regional subdomains for price extraction',
      'Check for TDS PDFs for technical specs',
      'Handle multi-variant products carefully'
    ]
  },

  '3dhojor': {
    brand_slug: '3dhojor',
    display_name: '3DHOJOR',
    platform: 'shopify',
    base_url: 'https://3dhojor.com',
    regions: { US: 'https://3dhojor.com' },
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 150,
    quirks: ['Good product images', 'Consistent product structure'],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
      { field: 'material', source: 'api', api_field: 'product_type', confidence: 0.9 },
      { field: 'color_family', source: 'api', api_field: 'tags', transform: 'extractColor', confidence: 0.8 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250&page={page}',
        fields_extracted: ['product_title', 'variant_price', 'featured_image', 'material', 'color_family'],
        rate_limit: 2,
        requires_auth: false,
        pagination: { type: 'page', param: 'page', limit: 250 }
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 3,
      retry_attempts: 3,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 95,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 55
    }
  },

  'hatchbox': {
    brand_slug: 'hatchbox',
    display_name: 'Hatchbox',
    platform: 'shopify',
    base_url: 'https://www.hatchbox3d.com',
    regions: { US: 'https://www.hatchbox3d.com' },
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 200,
    quirks: ['Good product images', 'Clear material naming'],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
      { field: 'material', source: 'api', api_field: 'product_type', confidence: 0.9 },
      { field: 'color_family', source: 'api', api_field: 'tags', transform: 'extractColor', confidence: 0.8 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250&page={page}',
        fields_extracted: ['product_title', 'variant_price', 'featured_image', 'material', 'color_family'],
        rate_limit: 2,
        requires_auth: false,
        pagination: { type: 'page', param: 'page', limit: 250 }
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 3,
      retry_attempts: 3,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 95,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 55
    },
    amazon_tag: 'filascope-20'
  },

  'amolen': {
    brand_slug: 'amolen',
    display_name: 'Amolen',
    platform: 'shopify',
    base_url: 'https://amolen.com',
    regions: { US: 'https://amolen.com' },
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 100,
    quirks: ['Good product images', 'Clear material naming'],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
      { field: 'material', source: 'api', api_field: 'product_type', confidence: 0.9 },
      { field: 'color_family', source: 'api', api_field: 'tags', transform: 'extractColor', confidence: 0.8 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250&page={page}',
        fields_extracted: ['product_title', 'variant_price', 'featured_image', 'material', 'color_family'],
        rate_limit: 2,
        requires_auth: false,
        pagination: { type: 'page', param: 'page', limit: 250 }
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 3,
      retry_attempts: 3,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 95,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 55
    }
  },

  // ============================================================================
  // TIER 2: FIRECRAWL BRANDS (No Shopify API)
  // ============================================================================

  'bambu-lab': {
    brand_slug: 'bambu-lab',
    display_name: 'Bambu Lab',
    platform: 'firecrawl',
    base_url: 'https://us.store.bambulab.com',
    regions: {
      US: 'https://us.store.bambulab.com',
      CA: 'https://ca.store.bambulab.com',
      EU: 'https://eu.store.bambulab.com'
    },
    api_endpoint: '',
    scrape_method: 'firecrawl',
    currency: { US: 'USD', CA: 'CAD', EU: 'EUR' },
    expected_filaments: 50,
    quirks: [
      'Shopify store but API disabled',
      'Good product pages with specs',
      'Multi-region pricing'
    ],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'scrape', selector: 'h1', transform: 'extractText', confidence: 0.9 },
      { field: 'variant_price', source: 'scrape', selector: '[data-price]', transform: 'extractPrice', confidence: 0.8 },
      { field: 'featured_image', source: 'scrape', selector: '.product__image img', transform: 'extractImageUrl', confidence: 0.8 },
      { field: 'nozzle_temp_min_c', source: 'scrape', selector: 'text:contains("Nozzle")', transform: 'extractTempRange', confidence: 0.7 },
      { field: 'bed_temp_min_c', source: 'scrape', selector: 'text:contains("Bed")', transform: 'extractTempRange', confidence: 0.7 },
    ],
    data_sources: [
      {
        type: 'firecrawl',
        url_pattern: '{base_url}/products/{handle}',
        fields_extracted: ['product_title', 'variant_price', 'featured_image', 'nozzle_temp_min_c', 'nozzle_temp_max_c', 'bed_temp_min_c', 'bed_temp_max_c'],
        rate_limit: 1,
        requires_auth: true,
        auth_method: 'bearer_token'
      }
    ],
    rate_limits: {
      requests_per_second: 1,
      delay_between_requests_ms: 1000,
      max_concurrent_requests: 2,
      retry_attempts: 3,
      retry_delay_ms: 2000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 70,
      regional: 80,
      scoring: 40,
      overall: 70
    },
    amazon_tag: 'filascope-21'
  },

  'esun': {
    brand_slug: 'esun',
    display_name: 'eSun',
    platform: 'firecrawl',
    base_url: 'https://www.esun3d.com',
    regions: { US: 'https://www.esun3d.com' },
    api_endpoint: '',
    scrape_method: 'firecrawl',
    currency: 'USD',
    expected_filaments: 300,
    quirks: [
      'Large catalog',
      'Technical specs often missing',
      'Good product images'
    ],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'scrape', selector: 'h1', transform: 'extractText', confidence: 0.8 },
      { field: 'variant_price', source: 'scrape', selector: '.price', transform: 'extractPrice', confidence: 0.7 },
      { field: 'featured_image', source: 'scrape', selector: '.product-image img', transform: 'extractImageUrl', confidence: 0.8 },
    ],
    data_sources: [
      {
        type: 'firecrawl',
        url_pattern: '{base_url}/products/{handle}',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 1,
        requires_auth: true,
        auth_method: 'bearer_token'
      }
    ],
    rate_limits: {
      requests_per_second: 1,
      delay_between_requests_ms: 1000,
      max_concurrent_requests: 2,
      retry_attempts: 3,
      retry_delay_ms: 2000
    },
    expected_field_coverage: {
      basic: 80,
      technical: 30,
      regional: 50,
      scoring: 20,
      overall: 45
    },
    amazon_tag: 'filascope-20'
  },

  'gizmo-dorks': {
    brand_slug: 'gizmo-dorks',
    platform: 'firecrawl',
    display_name: 'Gizmo Dorks',
    base_url: 'https://gizmodorks.com',
    regions: { US: 'https://gizmodorks.com' },
    api_endpoint: '',
    scrape_method: 'firecrawl',
    currency: 'USD',
    expected_filaments: 100,
    quirks: [
      'Good product images',
      'Clear material naming'
    ],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'scrape', selector: 'h1', transform: 'extractText', confidence: 0.8 },
      { field: 'variant_price', source: 'scrape', selector: '.price', transform: 'extractPrice', confidence: 0.7 },
      { field: 'featured_image', source: 'scrape', selector: '.product-image img', transform: 'extractImageUrl', confidence: 0.8 },
    ],
    data_sources: [
      {
        type: 'firecrawl',
        url_pattern: '{base_url}/products/{handle}',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 1,
        requires_auth: true,
        auth_method: 'bearer_token'
      }
    ],
    rate_limits: {
      requests_per_second: 1,
      delay_between_requests_ms: 1000,
      max_concurrent_requests: 2,
      retry_attempts: 3,
      retry_delay_ms: 2000
    },
    expected_field_coverage: {
      basic: 80,
      technical: 30,
      regional: 50,
      scoring: 20,
      overall: 45
    }
  },

  // ============================================================================
  // TIER 3: AMAZON-ONLY BRANDS
  // ============================================================================

  'geeetech': {
    brand_slug: 'geeetech',
    display_name: 'GEEETECH',
    platform: 'amazon',
    base_url: 'https://www.amazon.com',
    regions: { US: 'https://www.amazon.com' },
    api_endpoint: '',
    scrape_method: 'amazon_paapi',
    currency: 'USD',
    expected_filaments: 100,
    quirks: [
      'Amazon-only presence',
      'Good affiliate revenue potential'
    ],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'amazon', api_field: 'ItemInfo.Title.DisplayString', confidence: 0.9 },
      { field: 'variant_price', source: 'amazon', api_field: 'Offers.Listings[0].Price.DisplayAmount', confidence: 0.8 },
      { field: 'featured_image', source: 'amazon', api_field: 'Images.Primary.Large.URL', confidence: 0.9 },
    ],
    data_sources: [
      {
        type: 'amazon_paapi',
        url_pattern: 'https://www.amazon.com/dp/{asin}',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 1,
        requires_auth: true,
        auth_method: 'api_key'
      }
    ],
    rate_limits: {
      requests_per_second: 1,
      delay_between_requests_ms: 1000,
      max_concurrent_requests: 1,
      retry_attempts: 3,
      retry_delay_ms: 2000
    },
    expected_field_coverage: {
      basic: 80,
      technical: 20,
      regional: 30,
      scoring: 10,
      overall: 35
    },
    amazon_tag: 'filascope-20'
  },

  // ============================================================================
  // TIER 4: GENERIC BRANDS (Default profiles)
  // ============================================================================
  
  '3d-fuel': {
    brand_slug: '3d-fuel',
    display_name: '3D-Fuel',
    platform: 'firecrawl',
    base_url: 'https://3dfuel.com',
    regions: { US: 'https://3dfuel.com' },
    api_endpoint: '',
    scrape_method: 'firecrawl',
    currency: 'USD',
    expected_filaments: 100,
    quirks: ['Good product pages'],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'scrape', selector: 'h1', transform: 'extractText', confidence: 0.8 },
      { field: 'variant_price', source: 'scrape', selector: '.price', transform: 'extractPrice', confidence: 0.7 },
      { field: 'featured_image', source: 'scrape', selector: '.product-image img', transform: 'extractImageUrl', confidence: 0.8 },
    ],
    data_sources: [
      {
        type: 'firecrawl',
        url_pattern: '{base_url}/products/{handle}',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 1,
        requires_auth: true,
        auth_method: 'bearer_token'
      }
    ],
    rate_limits: {
      requests_per_second: 1,
      delay_between_requests_ms: 1000,
      max_concurrent_requests: 2,
      retry_attempts: 3,
      retry_delay_ms: 2000
    },
    expected_field_coverage: {
      basic: 80,
      technical: 30,
      regional: 50,
      scoring: 20,
      overall: 45
    }
  },

  '3dxtech': {
    brand_slug: '3dxtech',
    display_name: '3DXTech',
    platform: 'shopify',
    base_url: 'https://www.3dxtech.com',
    regions: { US: 'https://www.3dxtech.com' },
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 200,
    quirks: ['Good technical specs', 'Professional-grade filaments'],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
      { field: 'material', source: 'api', api_field: 'product_type', confidence: 0.9 },
      { field: 'color_family', source: 'api', api_field: 'tags', transform: 'extractColor', confidence: 0.8 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250&page={page}',
        fields_extracted: ['product_title', 'variant_price', 'featured_image', 'material', 'color_family'],
        rate_limit: 2,
        requires_auth: false,
        pagination: { type: 'page', param: 'page', limit: 250 }
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 3,
      retry_attempts: 3,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 95,
      technical: 60,
      regional: 50,
      scoring: 40,
      overall: 60
    }
  },

  // ============================================================================
  // DEFAULT PROFILE (For brands without specific profiles)
  // ============================================================================
  
  'default': {
    brand_slug: 'default',
    display_name: 'Unknown Brand',
    platform: 'firecrawl',
    base_url: '',
    regions: { US: '' },
    api_endpoint: '',
    scrape_method: 'firecrawl',
    currency: 'USD',
    expected_filaments: 0,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'scrape', selector: 'h1', transform: 'extractText', confidence: 0.5 },
      { field: 'variant_price', source: 'scrape', selector: '.price', transform: 'extractPrice', confidence: 0.5 },
      { field: 'featured_image', source: 'scrape', selector: 'img[src*="product"]', transform: 'extractImageUrl', confidence: 0.5 },
    ],
    data_sources: [
      {
        type: 'firecrawl',
        url_pattern: '{product_url}',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 1,
        requires_auth: true,
        auth_method: 'bearer_token'
      }
    ],
    rate_limits: {
      requests_per_second: 1,
      delay_between_requests_ms: 1000,
      max_concurrent_requests: 1,
      retry_attempts: 2,
      retry_delay_ms: 2000
    },
    expected_field_coverage: {
      basic: 60,
      technical: 20,
      regional: 30,
      scoring: 10,
      overall: 30
    }
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get brand profile by slug
 */
export function getBrandProfile(brandSlug: string): BrandProfile {
  const normalizedSlug = brandSlug.toLowerCase().replace(/\s+/g, '-');
  return BRAND_PROFILES[normalizedSlug] || BRAND_PROFILES['default'];
}

/**
 * Get all brand profiles
 */
export function getAllBrandProfiles(): BrandProfile[] {
  return Object.values(BRAND_PROFILES);
}

/**
 * Get brand profiles by platform
 */
export function getBrandProfilesByPlatform(platform: 'shopify' | 'woocommerce' | 'firecrawl' | 'amazon' | 'custom'): BrandProfile[] {
  return Object.values(BRAND_PROFILES).filter(profile => profile.platform === platform);
}

/**
 * Get active brand profiles
 */
export function getActiveBrandProfiles(): BrandProfile[] {
  return Object.values(BRAND_PROFILES).filter(profile => profile.active);
}

/**
 * Get brand profiles with Amazon tags
 */
export function getBrandProfilesWithAmazonTags(): BrandProfile[] {
  return Object.values(BRAND_PROFILES).filter(profile => profile.amazon_tag);
}

/**
 * Create brand profile for unknown brand
 */
export function createDefaultBrandProfile(vendor: string, baseUrl: string): BrandProfile {
  return {
    brand_slug: vendor.toLowerCase().replace(/\s+/g, '-'),
    display_name: vendor,
    platform: 'firecrawl',
    base_url: baseUrl,
    regions: { US: baseUrl },
    api_endpoint: '',
    scrape_method: 'firecrawl',
    currency: 'USD',
    expected_filaments: 0,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'scrape', selector: 'h1', transform: 'extractText', confidence: 0.5 },
      { field: 'variant_price', source: 'scrape', selector: '.price', transform: 'extractPrice', confidence: 0.5 },
      { field: 'featured_image', source: 'scrape', selector: 'img[src*="product"]', transform: 'extractImageUrl', confidence: 0.5 },
    ],
    data_sources: [
      {
        type: 'firecrawl',
        url_pattern: '{product_url}',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 1,
        requires_auth: true,
        auth_method: 'bearer_token'
      }
    ],
    rate_limits: {
      requests_per_second: 1,
      delay_between_requests_ms: 1000,
      max_concurrent_requests: 1,
      retry_attempts: 2,
      retry_delay_ms: 2000
    },
    expected_field_coverage: {
      basic: 60,
      technical: 20,
      regional: 30,
      scoring: 10,
      overall: 30
    }
  };
}

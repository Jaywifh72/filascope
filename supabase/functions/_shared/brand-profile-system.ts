/**
 * BRAND PROFILE SYSTEM v2 - UPDATED WITH TESTED SCRAPING METHODS
 * 
 * Custom scraping methodology for each brand based on platform, data availability, and quirks.
 * Defines field extraction rules and data source priorities.
 * 
 * UPDATED: 2026-04-18
 * 
 * TESTED RESULTS:
 * - Shopify API working: 32 brands
 * - Direct scraping working: 18 brands  
 * - Firecrawl working: 6 brands
 * - No method working: 6 brands
 */

// ============================================================================
// BRAND PROFILE INTERFACES
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
// BRAND PROFILES DATABASE - TESTED AND VERIFIED
// ============================================================================

export const BRAND_PROFILES: Record<string, BrandProfile> = {
  '3dfuel': {
    brand_slug: '3dfuel',
    display_name: '3D-Fuel',
    platform: 'shopify',
    base_url: 'https://www.3dfuel.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 283,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  '3dhojor': {
    brand_slug: '3dhojor',
    display_name: '3DHoJor',
    platform: 'shopify',
    base_url: 'https://www.3dhojor.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 10,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  '3dxtech': {
    brand_slug: '3dxtech',
    display_name: '3DXTech',
    platform: 'shopify',
    base_url: 'https://www.3dxtech.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 306,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'amolen': {
    brand_slug: 'amolen',
    display_name: 'Amolen',
    platform: 'shopify',
    base_url: 'https://amolen.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 475,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'anycubic': {
    brand_slug: 'anycubic',
    display_name: 'Anycubic',
    platform: 'shopify',
    base_url: 'https://ca.anycubic.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 298,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'atomic-filament': {
    brand_slug: 'atomic-filament',
    display_name: 'Atomic Filament',
    platform: 'shopify',
    base_url: 'https://atomicfilament.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 101,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'azurefilm': {
    brand_slug: 'azurefilm',
    display_name: 'AzureFilm',
    platform: 'firecrawl',
    base_url: 'https://azurefilm.com',
    regions: {},
    api_endpoint: '',
    scrape_method: 'firecrawl',
    currency: 'USD',
    expected_filaments: 1928,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'firecrawl',
        url_pattern: '{base_url}/products/{handle}',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: true
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'bambu-lab': {
    brand_slug: 'bambu-lab',
    display_name: 'Bambu Lab',
    platform: 'custom',
    base_url: 'https://us.store.bambulab.com',
    regions: {},
    api_endpoint: '',
    scrape_method: 'direct_scraping',
    currency: 'USD',
    expected_filaments: 17038,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'custom',
        url_pattern: 'https://us.store.bambulab.com/products/pc-filament?id=43584501842160',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: true
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'colorfabb': {
    brand_slug: 'colorfabb',
    display_name: 'ColorFabb',
    platform: 'firecrawl',
    base_url: 'https://colorfabb.com',
    regions: {},
    api_endpoint: '',
    scrape_method: 'firecrawl',
    currency: 'USD',
    expected_filaments: 619,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'firecrawl',
        url_pattern: '{base_url}/products/{handle}',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: true
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'creality': {
    brand_slug: 'creality',
    display_name: 'Creality',
    platform: 'custom',
    base_url: 'https://store.creality.com',
    regions: {},
    api_endpoint: '',
    scrape_method: 'direct_scraping',
    currency: 'USD',
    expected_filaments: 247,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'custom',
        url_pattern: 'https://store.creality.com/products/cr-silk-1-75mm-pla-3d-printing-filament-1kg',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: true
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'duramic-3d': {
    brand_slug: 'duramic-3d',
    display_name: 'Duramic 3D',
    platform: 'shopify',
    base_url: 'https://duramic3d.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 220,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'elegoo': {
    brand_slug: 'elegoo',
    display_name: 'Elegoo',
    platform: 'shopify',
    base_url: 'https://us.elegoo.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 763,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'eryone': {
    brand_slug: 'eryone',
    display_name: 'Eryone',
    platform: 'shopify',
    base_url: 'https://eryone3d.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 318,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'esun': {
    brand_slug: 'esun',
    display_name: 'eSun',
    platform: 'firecrawl',
    base_url: 'https://esun3dstore.com',
    regions: {},
    api_endpoint: '',
    scrape_method: 'firecrawl',
    currency: 'USD',
    expected_filaments: 394,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'firecrawl',
        url_pattern: '{base_url}/products/{handle}',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: true
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'extrudr': {
    brand_slug: 'extrudr',
    display_name: 'Extrudr',
    platform: 'custom',
    base_url: 'https://www.extrudr.com',
    regions: {},
    api_endpoint: '',
    scrape_method: 'direct_scraping',
    currency: 'USD',
    expected_filaments: 131,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'custom',
        url_pattern: 'https://www.extrudr.com/en/inlt/products/durapro-asa/',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: true
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'fiberlogy': {
    brand_slug: 'fiberlogy',
    display_name: 'Fiberlogy',
    platform: 'custom',
    base_url: 'https://fiberlogy.com',
    regions: {},
    api_endpoint: '',
    scrape_method: 'direct_scraping',
    currency: 'USD',
    expected_filaments: 274,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'custom',
        url_pattern: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: true
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'filaments-ca': {
    brand_slug: 'filaments-ca',
    display_name: 'Filaments.ca',
    platform: 'shopify',
    base_url: 'https://filaments.ca',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 144,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'fillamentum': {
    brand_slug: 'fillamentum',
    display_name: 'Fillamentum',
    platform: 'shopify',
    base_url: 'https://shop.fillamentum.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 194,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'flashforge': {
    brand_slug: 'flashforge',
    display_name: 'FlashForge',
    platform: 'shopify',
    base_url: 'https://www.flashforge.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 26,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'flsun': {
    brand_slug: 'flsun',
    display_name: 'FLSUN',
    platform: 'shopify',
    base_url: 'https://us.store.flsun3d.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 37,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'formfutura': {
    brand_slug: 'formfutura',
    display_name: 'FormFutura',
    platform: 'custom',
    base_url: 'https://www.formfutura.com',
    regions: {},
    api_endpoint: '',
    scrape_method: 'direct_scraping',
    currency: 'USD',
    expected_filaments: 483,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'custom',
        url_pattern: 'https://www.formfutura.com/easyfil-abs',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: true
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'fusion-filaments': {
    brand_slug: 'fusion-filaments',
    display_name: 'Fusion Filaments',
    platform: 'custom',
    base_url: 'https://www.fusionfilaments.com',
    regions: {},
    api_endpoint: '',
    scrape_method: 'direct_scraping',
    currency: 'USD',
    expected_filaments: 223,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'custom',
        url_pattern: 'https://www.fusionfilaments.com/shop/870175apo-1kg-htpla-filament-alpha-particle-orange-8032',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: true
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'geeetech': {
    brand_slug: 'geeetech',
    display_name: 'Geeetech',
    platform: 'custom',
    base_url: 'https://www.geeetech.com',
    regions: {},
    api_endpoint: '',
    scrape_method: 'direct_scraping',
    currency: 'USD',
    expected_filaments: 228,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'custom',
        url_pattern: 'https://www.geeetech.com/pla-matte-navy-blue-3d-printer-filament-175mm-1kgroll-p-1313.html',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: true
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'gizmo-dorks': {
    brand_slug: 'gizmo-dorks',
    display_name: 'Gizmo Dorks',
    platform: 'firecrawl',
    base_url: 'https://gizmodorks.com',
    regions: {},
    api_endpoint: '',
    scrape_method: 'firecrawl',
    currency: 'USD',
    expected_filaments: 502,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'firecrawl',
        url_pattern: '{base_url}/products/{handle}',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: true
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'gst3d': {
    brand_slug: 'gst3d',
    display_name: 'GST3D',
    platform: 'shopify',
    base_url: 'https://gst3d.eu',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 104,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'hatchbox': {
    brand_slug: 'hatchbox',
    display_name: 'Hatchbox',
    platform: 'custom',
    base_url: 'https://www.hatchbox3d.com',
    regions: {},
    api_endpoint: '',
    scrape_method: 'direct_scraping',
    currency: 'USD',
    expected_filaments: 644,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'custom',
        url_pattern: 'https://www.hatchbox3d.com/products/hb-pla-max-teal',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: true
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'ic3dprinters': {
    brand_slug: 'ic3dprinters',
    display_name: 'IC3D Printers',
    platform: 'firecrawl',
    base_url: 'https://www.ic3dprinters.com',
    regions: {},
    api_endpoint: '',
    scrape_method: 'firecrawl',
    currency: 'USD',
    expected_filaments: 107,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'firecrawl',
        url_pattern: '{base_url}/products/{handle}',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: true
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'kingroon': {
    brand_slug: 'kingroon',
    display_name: 'Kingroon',
    platform: 'shopify',
    base_url: 'https://kingroon.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 524,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'matter3d': {
    brand_slug: 'matter3d',
    display_name: 'Matter3D',
    platform: 'shopify',
    base_url: 'https://matter3d.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 128,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'ninjatek': {
    brand_slug: 'ninjatek',
    display_name: 'NinjaTek',
    platform: 'custom',
    base_url: 'https://ninjatek.com',
    regions: {},
    api_endpoint: '',
    scrape_method: 'direct_scraping',
    currency: 'USD',
    expected_filaments: 72,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'custom',
        url_pattern: 'https://ninjatek.com/shop/armadillo/',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: true
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'numakers': {
    brand_slug: 'numakers',
    display_name: 'Numakers',
    platform: 'shopify',
    base_url: 'https://numakers.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 125,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'overture': {
    brand_slug: 'overture',
    display_name: 'Overture',
    platform: 'shopify',
    base_url: 'https://www.overture3d.ca',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 180,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'paramount-3d': {
    brand_slug: 'paramount-3d',
    display_name: 'Paramount 3D',
    platform: 'custom',
    base_url: 'https://www.paramount-3d.com',
    regions: {},
    api_endpoint: '',
    scrape_method: 'direct_scraping',
    currency: 'USD',
    expected_filaments: 113,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'custom',
        url_pattern: 'https://www.paramount-3d.com/petg',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: true
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'polymaker': {
    brand_slug: 'polymaker',
    display_name: 'Polymaker',
    platform: 'shopify',
    base_url: 'https://shop.polymaker.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 738,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'printed-solid': {
    brand_slug: 'printed-solid',
    display_name: 'Printed Solid',
    platform: 'shopify',
    base_url: 'https://www.printedsolid.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 210,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'proto-pasta': {
    brand_slug: 'proto-pasta',
    display_name: 'Proto-Pasta',
    platform: 'shopify',
    base_url: 'https://proto-pasta.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 358,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'prusament': {
    brand_slug: 'prusament',
    display_name: 'Prusament',
    platform: 'custom',
    base_url: 'https://www.prusa3d.com',
    regions: {},
    api_endpoint: '',
    scrape_method: 'direct_scraping',
    currency: 'USD',
    expected_filaments: 170,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'custom',
        url_pattern: 'https://www.prusa3d.com/product/prusament-petg-jet-black-2kg-nfc/',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: true
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'push-plastic': {
    brand_slug: 'push-plastic',
    display_name: 'Push Plastic',
    platform: 'shopify',
    base_url: 'https://www.pushplastic.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 1176,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'qidi': {
    brand_slug: 'qidi',
    display_name: 'QIDI',
    platform: 'shopify',
    base_url: 'https://us.qidi3d.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 175,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'recreus': {
    brand_slug: 'recreus',
    display_name: 'Recreus',
    platform: 'shopify',
    base_url: 'https://recreus.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 329,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'sainsmart': {
    brand_slug: 'sainsmart',
    display_name: 'SainSmart',
    platform: 'shopify',
    base_url: 'https://www.sainsmart.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 208,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'siraya-tech': {
    brand_slug: 'siraya-tech',
    display_name: 'Siraya Tech',
    platform: 'shopify',
    base_url: 'https://siraya.tech',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 72,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'sovol': {
    brand_slug: 'sovol',
    display_name: 'Sovol',
    platform: 'shopify',
    base_url: 'https://www.sovol3d.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 70,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'spectrum-filaments': {
    brand_slug: 'spectrum-filaments',
    display_name: 'Spectrum Filaments',
    platform: 'shopify',
    base_url: 'https://ca.spectrumfilaments.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 1295,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'sunlu': {
    brand_slug: 'sunlu',
    display_name: 'Sunlu',
    platform: 'shopify',
    base_url: 'https://store.sunlu.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 366,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'taulman3d': {
    brand_slug: 'taulman3d',
    display_name: 'Taulman3D',
    platform: 'shopify',
    base_url: 'https://3dmakerworld.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 56,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'treed-filaments': {
    brand_slug: 'treed-filaments',
    display_name: 'TreeD Filaments',
    platform: 'custom',
    base_url: 'https://treedfilaments.com',
    regions: {},
    api_endpoint: '',
    scrape_method: 'direct_scraping',
    currency: 'USD',
    expected_filaments: 209,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'custom',
        url_pattern: 'https://treedfilaments.com/shop/product/?sku=ULTRA+',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: true
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'ultimaker': {
    brand_slug: 'ultimaker',
    display_name: 'Ultimaker',
    platform: 'firecrawl',
    base_url: 'https://ultimaker.com',
    regions: {},
    api_endpoint: '',
    scrape_method: 'firecrawl',
    currency: 'USD',
    expected_filaments: 92,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'firecrawl',
        url_pattern: '{base_url}/products/{handle}',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: true
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'voxelpla': {
    brand_slug: 'voxelpla',
    display_name: 'VoxelPLA',
    platform: 'shopify',
    base_url: 'https://voxelpla.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 38,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'yousu': {
    brand_slug: 'yousu',
    display_name: 'Yousu',
    platform: 'custom',
    base_url: 'https://www.ysfilament.com',
    regions: {},
    api_endpoint: '',
    scrape_method: 'direct_scraping',
    currency: 'USD',
    expected_filaments: 37,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'custom',
        url_pattern: 'https://www.ysfilament.com/products/yousu-pla-3d-filament-175mm-285mm-1kg',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: true
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },

  'ziro': {
    brand_slug: 'ziro',
    display_name: 'Ziro',
    platform: 'shopify',
    base_url: 'https://ziro3d.com',
    regions: {},
    api_endpoint: '/products.json',
    scrape_method: 'shopify_json_api',
    currency: 'USD',
    expected_filaments: 266,
    quirks: [],
    active: true,
    field_extraction_rules: [
      { field: 'product_title', source: 'api', api_field: 'title', confidence: 1.0 },
      { field: 'variant_price', source: 'api', api_field: 'variants[0].price', confidence: 1.0 },
      { field: 'featured_image', source: 'api', api_field: 'images[0].src', confidence: 1.0 },
    ],
    data_sources: [
      {
        type: 'shopify_api',
        url_pattern: '{base_url}/products.json?limit=250',
        fields_extracted: ['product_title', 'variant_price', 'featured_image'],
        rate_limit: 2,
        requires_auth: false
      }
    ],
    rate_limits: {
      requests_per_second: 2,
      delay_between_requests_ms: 500,
      max_concurrent_requests: 2,
      retry_attempts: 2,
      retry_delay_ms: 1000
    },
    expected_field_coverage: {
      basic: 90,
      technical: 40,
      regional: 50,
      scoring: 30,
      overall: 50
    }
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get brand profile by slug
 */
export function getBrandProfile(brandSlug: string): BrandProfile {{
  return BRAND_PROFILES[brandSlug] || BRAND_PROFILES['default'];
}}

/**
 * Get all active brand profiles
 */
export function getActiveBrandProfiles(): BrandProfile[] {{
  return Object.values(BRAND_PROFILES).filter(profile => profile.active);
}}

/**
 * Get brand profiles by platform
 */
export function getBrandProfilesByPlatform(platform: string): BrandProfile[] {{
  return Object.values(BRAND_PROFILES).filter(profile => profile.platform === platform && profile.active);
}}

/**
 * Get brand profiles with Amazon affiliate tags
 */
export function getBrandProfilesWithAmazon(): BrandProfile[] {{
  return Object.values(BRAND_PROFILES).filter(profile => profile.amazon_tag && profile.active);
}}

console.log(`✅ Brand Profile System loaded: ${{Object.keys(BRAND_PROFILES).length}} profiles`);
console.log(`   With Amazon tags: ${{getBrandProfilesWithAmazon().length}}`);
console.log(`   Shopify brands: ${{getBrandProfilesByPlatform('shopify').length}}`);
console.log(`   WooCommerce brands: ${{getBrandProfilesByPlatform('woocommerce').length}}`);
console.log(`   Firecrawl brands: ${{getBrandProfilesByPlatform('firecrawl').length}}`);

/**
 * Price Import Types
 * 
 * Type definitions for the admin price import functionality.
 */

// =============================================
// Scraped Product Types
// =============================================

/**
 * Expected JSON format from local scraper
 */
export interface ScrapedProduct {
  brand: string;
  region: string;
  currency: string;
  shopify_product_id?: string;
  shopify_variant_id?: string;
  sku?: string;
  product_title: string;
  variant_title?: string;
  full_title: string;
  price: number;
  compare_at_price?: number;
  available: boolean;
  product_url: string;
  variant_url?: string;
  image_url?: string;
  scraped_at: string;
  source_type: string;
}

// =============================================
// Import Result Types
// =============================================

export interface ImportError {
  product: string;
  reason: string;
}

export interface ImportResult {
  total: number;
  created: number;
  updated: number;
  matched: number;
  skipped: number;
  errors: ImportError[];
}

export interface ImportProgress {
  current: number;
  total: number;
  status: 'idle' | 'processing' | 'completed' | 'error';
  message?: string;
}

// =============================================
// Parsed File Types
// =============================================

export interface ParsedFile {
  filename: string;
  fileSize: number;
  products: ScrapedProduct[];
  brands: string[];
  regions: string[];
  currencies: string[];
  isValid: boolean;
  parseError?: string;
}

// =============================================
// Import History Types
// =============================================

export interface ImportHistoryEntry {
  id: string;
  started_at: string;
  completed_at: string | null;
  sync_type: string;
  brand_slug: string;
  status: string;
  products_updated: number | null;
  products_failed: number | null;
  error_details: {
    errors?: ImportError[];
  } | null;
  success_details: {
    filename?: string;
    brands?: string[];
    regions?: string[];
    created?: number;
    updated?: number;
    skipped?: number;
  } | null;
}

// =============================================
// Validation Types
// =============================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const VALID_CURRENCIES = ['USD', 'CAD', 'EUR', 'GBP', 'AUD', 'JPY', 'CNY', 'CHF', 'SEK', 'KRW', 'INR', 'PLN', 'MXN', 'CZK'] as const;
export const VALID_REGIONS = ['US', 'CA', 'UK', 'EU', 'AU', 'JP', 'CN'] as const;

export type ValidCurrency = typeof VALID_CURRENCIES[number];
export type ValidRegion = typeof VALID_REGIONS[number];

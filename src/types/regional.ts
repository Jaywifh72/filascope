/**
 * Regional Store System - Type Definitions
 * 
 * Comprehensive types for multi-regional pricing, currency conversion,
 * and user region preferences.
 */

// =============================================
// Core Type Unions
// =============================================

export type RegionCode = 'US' | 'CA' | 'UK' | 'EU' | 'AU' | 'JP' | 'CN';

export type CurrencyCode = 
  | 'USD' | 'CAD' | 'EUR' | 'GBP' | 'AUD' | 'JPY' | 'CNY' 
  | 'CHF' | 'SEK' | 'KRW' | 'INR';

export type DetectionMethod = 'geolocation' | 'ip' | 'browser_locale' | 'manual';

// =============================================
// Database Row Interfaces
// =============================================

/**
 * Represents a brand's regional storefront configuration
 * Maps to: brand_regional_stores table
 */
export interface BrandRegionalStore {
  id: string;
  brand_id: string;
  region_code: RegionCode;
  store_name: string;
  base_url: string;
  product_url_pattern: string | null;
  currency_code: CurrencyCode;
  ships_from_country: string | null;
  free_shipping_threshold: number | null;
  estimated_shipping_days: number | null;
  is_primary: boolean;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Currency exchange rate from USD to target currency
 * Maps to: currency_exchange_rates table
 */
export interface CurrencyExchangeRate {
  id: string;
  base_currency: string;
  target_currency: CurrencyCode;
  rate: number;
  inverse_rate: number;
  source: string;
  fetched_at: string;
  created_at: string;
}

/**
 * User's region and currency preferences
 * Maps to: user_region_preferences table
 */
export interface UserRegionPreference {
  id: string;
  user_id: string | null;
  session_id: string | null;
  region_code: RegionCode;
  currency_code: CurrencyCode;
  detected_method: DetectionMethod;
  created_at: string;
  updated_at: string;
}

// =============================================
// Static Configuration Types
// =============================================

/**
 * Static metadata for a region
 */
export interface RegionConfig {
  code: RegionCode;
  name: string;
  flag: string;
  defaultCurrency: CurrencyCode;
  languages: string[];
}

/**
 * Static metadata for currency formatting
 */
export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  decimalPlaces: number;
  symbolPosition: 'before' | 'after';
}

// =============================================
// Runtime/Result Types
// =============================================

/**
 * Result of resolving a regional price for display
 */
export interface RegionalPriceResult {
  displayPrice: number;
  displayCurrency: CurrencyCode;
  formattedPrice: string;
  originalPrice: number;
  originalCurrency: CurrencyCode;
  isConverted: boolean;
  conversionRate: number | null;
  store: {
    id: string;
    name: string;
    url: string;
    regionCode: RegionCode;
    shipsFrom: string | null;
    freeShippingThreshold: number | null;
  } | null;
}

/**
 * Brand with its available regional stores
 */
export interface BrandWithRegionalStores {
  brandId: string;
  brandName: string;
  brandSlug: string;
  stores: BrandRegionalStore[];
  availableRegions: RegionCode[];
}

// =============================================
// Static Configuration Data
// =============================================

export const REGION_CONFIGS: Record<RegionCode, RegionConfig> = {
  US: {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    defaultCurrency: 'USD',
    languages: ['en-US'],
  },
  CA: {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    defaultCurrency: 'CAD',
    languages: ['en-CA', 'fr-CA'],
  },
  UK: {
    code: 'UK',
    name: 'United Kingdom',
    flag: '🇬🇧',
    defaultCurrency: 'GBP',
    languages: ['en-GB'],
  },
  EU: {
    code: 'EU',
    name: 'European Union',
    flag: '🇪🇺',
    defaultCurrency: 'EUR',
    languages: ['de', 'fr', 'es', 'it', 'nl'],
  },
  AU: {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    defaultCurrency: 'AUD',
    languages: ['en-AU'],
  },
  JP: {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    defaultCurrency: 'JPY',
    languages: ['ja'],
  },
  CN: {
    code: 'CN',
    name: 'China',
    flag: '🇨🇳',
    defaultCurrency: 'CNY',
    languages: ['zh-CN'],
  },
};

export const CURRENCY_CONFIGS: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimalPlaces: 2,
    symbolPosition: 'before',
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar',
    decimalPlaces: 2,
    symbolPosition: 'before',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimalPlaces: 2,
    symbolPosition: 'before',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimalPlaces: 2,
    symbolPosition: 'before',
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    decimalPlaces: 2,
    symbolPosition: 'before',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    decimalPlaces: 0,
    symbolPosition: 'before',
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan',
    decimalPlaces: 2,
    symbolPosition: 'before',
  },
  CHF: {
    code: 'CHF',
    symbol: 'CHF',
    name: 'Swiss Franc',
    decimalPlaces: 2,
    symbolPosition: 'before',
  },
  SEK: {
    code: 'SEK',
    symbol: 'kr',
    name: 'Swedish Krona',
    decimalPlaces: 2,
    symbolPosition: 'after',
  },
  KRW: {
    code: 'KRW',
    symbol: '₩',
    name: 'South Korean Won',
    decimalPlaces: 0,
    symbolPosition: 'before',
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    decimalPlaces: 2,
    symbolPosition: 'before',
  },
};

// =============================================
// Utility Functions
// =============================================

/**
 * Check if a string is a valid RegionCode
 */
export function isValidRegionCode(code: string): code is RegionCode {
  return ['US', 'CA', 'UK', 'EU', 'AU', 'JP', 'CN'].includes(code);
}

/**
 * Check if a string is a valid CurrencyCode
 */
export function isValidCurrencyCode(code: string): code is CurrencyCode {
  return ['USD', 'CAD', 'EUR', 'GBP', 'AUD', 'JPY', 'CNY', 'CHF', 'SEK', 'KRW', 'INR'].includes(code);
}

/**
 * Get the default currency for a region
 */
export function getDefaultCurrencyForRegion(region: RegionCode): CurrencyCode {
  return REGION_CONFIGS[region].defaultCurrency;
}

/**
 * Format a price with the appropriate currency symbol
 */
export function formatCurrencyPrice(
  amount: number,
  currencyCode: CurrencyCode
): string {
  const config = CURRENCY_CONFIGS[currencyCode];
  const formatted = amount.toFixed(config.decimalPlaces);
  
  if (config.symbolPosition === 'before') {
    return `${config.symbol}${formatted}`;
  } else {
    return `${formatted} ${config.symbol}`;
  }
}

/**
 * Map currency code to region code (primary region for that currency)
 */
export const CURRENCY_TO_PRIMARY_REGION: Record<CurrencyCode, RegionCode> = {
  USD: 'US',
  CAD: 'CA',
  EUR: 'EU',
  GBP: 'UK',
  AUD: 'AU',
  JPY: 'JP',
  CNY: 'CN',
  CHF: 'EU', // Switzerland often uses EU stores
  SEK: 'EU', // Sweden often uses EU stores
  KRW: 'JP', // Korea often falls back to JP stores
  INR: 'US', // India often falls back to US stores
};

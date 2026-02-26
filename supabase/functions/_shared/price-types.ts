/**
 * SHARED PRICE TYPES
 * Common interfaces and type definitions used across all price extraction edge functions.
 */

export type StockStatus = "in_stock" | "out_of_stock" | "low_stock" | "preorder" | "unknown";
export type ProductType = "filament" | "printer";

export interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  available: boolean;
  compare_at_price: string | null;
  grams?: number;
}

export interface ShopifyProduct {
  product: {
    id: number;
    title: string;
    variants: ShopifyVariant[];
  };
}

export interface PriceResponse {
  success: boolean;
  price: number | null;
  compareAtPrice: number | null;
  weightGrams?: number | null;
  diameterMm?: number | null;
  variantTitle?: string | null;
  currency: string;
  available: boolean;
  stockStatus?: StockStatus;
  source: "shopify" | "firecrawl" | "html" | "cached" | "woocommerce";
  fetchedAt: string;
  error?: string;
  is404?: boolean;
  notAvailableInRegion?: boolean;
  refreshedAt?: string;
  sourceUrl?: string;
  detectedCurrency?: string;
  currencyMismatch?: boolean;
  requestedCurrency?: string;
  status?: "ok" | "blocked" | "rate_limited" | "anomalous";
  method?: "wc_store_api" | "wc_store_api_variations" | "json_ld" | "cloudflare";
  price_alert?: boolean;
  rawSample?: string;
}

export interface BrandExtractionConfig {
  priceSectionAnchor?: string;
  pricePatterns?: string[];
  excludePatterns?: string[];
  priceRangeMin?: number;
  priceRangeMax?: number;
  currencyDetection?: string;
}

export interface BrandConfig {
  id: string;
  brand_slug: string;
  brand_name: string;
  base_url: string;
  extraction_method: string;
  price_extraction_config: BrandExtractionConfig;
  extraction_working: boolean;
  default_currency: string | null;
}

export interface RegionalStoreConfig {
  pattern: "subdomain" | "path" | "global";
  baseDomain: string;
  regions: Record<string, { subdomain?: string; pathPrefix?: string; domain?: string; currency: string }>;
  fallbackRegion?: string;
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

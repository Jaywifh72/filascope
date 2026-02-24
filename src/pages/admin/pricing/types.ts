import type { LucideIcon } from 'lucide-react';
import { Palette, Printer, Wrench } from 'lucide-react';

// =============================================
// Product Type Abstraction
// =============================================

export type ProductType = 'filament' | 'printer' | 'accessory';

export interface ProductTypeConfig {
  type: ProductType;
  label: string;
  pluralLabel: string;
  icon: LucideIcon;
  tableName: string;
  brandField: string;
  nameField: string;
  typeField: string | null;
  urlField: string;
  regionalUrlFields: Record<string, string>;
  priceField: string;
  compareAtPriceField: string;
  hasColorSwatches: boolean;
  colorHexField: string | null;
  handleField: string | null;
  groupByStrategy: 'product_line' | 'brand_model' | 'brand_name';
  selectColumns: string;
  searchPlaceholder: string;
}

export const PRODUCT_TYPE_CONFIGS: Record<ProductType, ProductTypeConfig> = {
  filament: {
    type: 'filament',
    label: 'Filament',
    pluralLabel: 'Filaments',
    icon: Palette,
    tableName: 'filaments',
    brandField: 'vendor',
    nameField: 'product_title',
    typeField: 'material',
    urlField: 'product_url',
    regionalUrlFields: {
      US: 'product_url', CA: 'product_url_ca', UK: 'product_url_uk',
      EU: 'product_url_eu', AU: 'product_url_au', JP: 'product_url_jp',
    },
    priceField: 'variant_price',
    compareAtPriceField: 'variant_compare_at_price',
    hasColorSwatches: true,
    colorHexField: 'color_hex',
    handleField: 'product_handle',
    groupByStrategy: 'product_line',
    selectColumns: 'id, product_line_id, product_title, vendor, material, variant_price, variant_compare_at_price, price_cad, price_eur, price_gbp, price_aud, price_jpy, product_url, product_url_ca, product_url_uk, product_url_eu, product_url_au, product_url_jp, last_scraped_at, price_confidence, net_weight_g, color_hex',
    searchPlaceholder: 'Search by name, brand, or material...',
  },
  printer: {
    type: 'printer',
    label: 'Printer',
    pluralLabel: 'Printers',
    icon: Printer,
    tableName: 'printers',
    brandField: 'brand_id',
    nameField: 'model_name',
    typeField: 'printer_technology',
    urlField: 'product_url',
    regionalUrlFields: {
      US: 'product_url', CA: 'product_url_ca', UK: 'product_url_uk',
      EU: 'product_url_eu', AU: 'product_url_au', JP: 'product_url_jp',
    },
    priceField: 'current_price_usd_store',
    compareAtPriceField: 'variant_compare_at_price',
    hasColorSwatches: false,
    colorHexField: null,
    handleField: 'slug',
    groupByStrategy: 'brand_model',
    selectColumns: 'id, brand_id, model_name, slug, variant_id, variant_title, variant_price, variant_compare_at_price, variant_available, product_url, product_url_ca, product_url_uk, product_url_eu, product_url_au, product_url_jp, official_store_url, official_product_url, official_store_url_ca, official_store_url_eu, official_store_url_uk, official_store_url_au, official_store_url_jp, current_price_usd_store, current_price_cad_store, current_price_eur_store, current_price_gbp_store, current_price_aud_store, current_price_jpy_store, msrp_usd, image_url, updated_at, printer_technology, is_discontinued, sku, series_name, price_requires_review',
    searchPlaceholder: 'Search by model, brand...',
  },
  accessory: {
    type: 'accessory',
    label: 'Accessory',
    pluralLabel: 'Accessories',
    icon: Wrench,
    tableName: 'accessories',
    brandField: 'brand',
    nameField: 'name',
    typeField: 'category',
    urlField: 'product_url',
    regionalUrlFields: {
      US: 'product_url', CA: 'product_url_ca', UK: 'product_url_uk',
      EU: 'product_url_eu', AU: 'product_url_au', JP: 'product_url_jp',
    },
    priceField: 'variant_price',
    compareAtPriceField: 'variant_compare_at_price',
    hasColorSwatches: false,
    colorHexField: null,
    handleField: 'slug',
    groupByStrategy: 'brand_name',
    selectColumns: 'id, brand, name, slug, category, subcategory, variant_id, variant_title, variant_price, variant_compare_at_price, variant_available, product_url, product_url_ca, product_url_uk, product_url_eu, product_url_au, product_url_jp, image_url, published_at, updated_at',
    searchPlaceholder: 'Search by name, brand, or category...',
  },
};

// =============================================
// Region field maps per product type
// =============================================

export const FILAMENT_REGION_FIELD_MAP: { region: string; priceField: string; urlField: string }[] = [
  { region: 'US', priceField: 'variant_price', urlField: 'product_url' },
  { region: 'CA', priceField: 'price_cad', urlField: 'product_url_ca' },
  { region: 'UK', priceField: 'price_gbp', urlField: 'product_url_uk' },
  { region: 'EU', priceField: 'price_eur', urlField: 'product_url_eu' },
  { region: 'AU', priceField: 'price_aud', urlField: 'product_url_au' },
  { region: 'JP', priceField: 'price_jpy', urlField: 'product_url_jp' },
];

/** For printers: each region has its own price column */
export const PRINTER_REGION_FIELD_MAP: { region: string; priceField: string; urlField: string }[] = [
  { region: 'US', priceField: 'current_price_usd_store', urlField: 'product_url' },
  { region: 'CA', priceField: 'current_price_cad_store', urlField: 'product_url_ca' },
  { region: 'UK', priceField: 'current_price_gbp_store', urlField: 'product_url_uk' },
  { region: 'EU', priceField: 'current_price_eur_store', urlField: 'product_url_eu' },
  { region: 'AU', priceField: 'current_price_aud_store', urlField: 'product_url_au' },
  { region: 'JP', priceField: 'current_price_jpy_store', urlField: 'product_url_jp' },
];

/** For accessories: all regions use variant_price (no per-currency columns) */
export const GENERIC_REGION_FIELD_MAP: { region: string; priceField: string; urlField: string }[] = [
  { region: 'US', priceField: 'variant_price', urlField: 'product_url' },
  { region: 'CA', priceField: 'variant_price', urlField: 'product_url_ca' },
  { region: 'UK', priceField: 'variant_price', urlField: 'product_url_uk' },
  { region: 'EU', priceField: 'variant_price', urlField: 'product_url_eu' },
  { region: 'AU', priceField: 'variant_price', urlField: 'product_url_au' },
  { region: 'JP', priceField: 'variant_price', urlField: 'product_url_jp' },
];

export function getRegionFieldMap(productType: ProductType) {
  if (productType === 'filament') return FILAMENT_REGION_FIELD_MAP;
  if (productType === 'printer') return PRINTER_REGION_FIELD_MAP;
  return GENERIC_REGION_FIELD_MAP;
}

// =============================================
// Shared Types
// =============================================

export type LinkStatus = 'active' | 'stale' | 'broken' | 'failed' | 'alert' | 'unknown' | 'not_in_region';

export interface TestResult {
  status: 'testing' | 'ok' | 'broken' | 'redirect' | 'timeout' | 'geo_restricted';
  statusCode?: number;
  latencyMs?: number;
  redirectUrl?: string | null;
  error?: string;
  fetchMethod?: 'direct' | 'spoofed' | 'redirected';
  isGeoRedirected?: boolean;
  isKnownGeoRedirect?: boolean;
}

export interface SyncResult {
  status: 'syncing' | 'success' | 'failed' | 'unchanged' | 'unavailable';
  oldPrice?: number;
  newPrice?: number;
  percentChange?: number;
  error?: string;
  source?: string;
  location?: string;
  currencyMismatch?: boolean;
  detectedCurrency?: string;
  requestedCurrency?: string;
}

/** One store entry (region) for a product group */
export interface StoreRow {
  storeKey: string;
  productLineId: string;
  representativeId: string;
  allProductIds: string[];
  region: string;
  regionFlag: string;
  storeName: string;
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  currencySymbol: string;
  productUrl: string | null;
  isDerived?: boolean;
  lastScrapedAt: string | null;
  linkStatus: LinkStatus;
  priceChange: { percent: number; direction: 'up' | 'down' | 'unchanged'; oldPrice?: number; newPrice?: number } | null;
  netWeightG: number | null;
}

/** Parent product group */
export interface ProductGroup {
  productLineId: string;
  representativeId: string;
  productTitle: string;
  cleanName: string;
  brand: string;
  productSubtype: string | null;
  variantCount: number;
  colorCount: number;
  colorHexes: string[];
  allProductIds: string[];
  stores: StoreRow[];
  minPrice: number | null;
  maxPrice: number | null;
  hasPriceRange: boolean;
  activeCount: number;
  staleCount: number;
  brokenCount: number;
  alertCount: number;
  notInRegionCount: number;
  /** True if any variant has price_requires_review flag set */
  hasAnomalyFlag?: boolean;
}

// =============================================
// Diagnosis types
// =============================================

export interface DiagnosisItem {
  pattern: string;
  count: number;
  severity: 'high' | 'medium' | 'low';
  diagnosis: string;
  suggestedFix: string;
  suggestedPrompt: string;
  affectedProducts: string[];
  isTransient: boolean;
  contextualPromptParts?: {
    errorPattern: string;
    edgeFunctionName: string;
    failureDetails: Array<{
      product: string;
      region: string;
      url: string;
      error: string;
      statusCode?: number;
      latencyMs?: number;
      brand: string;
    }>;
  };
}

export interface DiagnosisResult {
  summary: string;
  diagnoses: DiagnosisItem[];
  overallHealth: 'good' | 'fair' | 'poor';
}

// =============================================
// Stats type
// =============================================

export interface PricingStats {
  totalProducts: number;
  totalStores: number;
  active: number;
  stale: number;
  broken: number;
  alerts: number;
  multiRegion: number;
  stalePrices: number;
  totalVariants: number;
}

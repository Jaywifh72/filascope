// Shared utilities for building standardized sync responses with field coverage
// This ensures all sync functions return consistent data for the UI

export interface SyncProductResult {
  productId: string;
  title: string;
  action: 'created' | 'updated' | 'skipped' | 'error';
  reason?: string;
  fields: {
    image: boolean;
    price: boolean;
    tds: boolean;
    colorHex: boolean;
    mpn: boolean;
    specifications: boolean;
  };
  price?: number;
  compareAtPrice?: number;
}

export interface FieldCoverageResult {
  images: { count: number; percent: number };
  prices: { count: number; percent: number };
  tds: { count: number; percent: number };
  colors: { count: number; percent: number };
  mpn: { count: number; percent: number };
  specifications: { count: number; percent: number };
}

export interface RichSyncResponse {
  success: boolean;
  duration_ms: number;
  summary: {
    totalDiscovered: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  products: SyncProductResult[];
  fieldCoverage: FieldCoverageResult;
  results?: any[]; // Step-by-step results for debugging
}

/**
 * Query the database to calculate actual field coverage for a vendor
 */
export async function buildFieldCoverage(
  supabase: any,
  vendorName: string
): Promise<FieldCoverageResult> {
  console.log(`[FieldCoverage] Calculating coverage for ${vendorName}...`);
  
  // Get total count and field counts in one query
  const { data, error } = await supabase
    .from('filaments')
    .select('id, featured_image, variant_price, tds_url, color_hex, mpn, nozzle_temp_min_c')
    .ilike('vendor', vendorName);
  
  if (error) {
    console.error('[FieldCoverage] Error querying:', error.message);
    return {
      images: { count: 0, percent: 0 },
      prices: { count: 0, percent: 0 },
      tds: { count: 0, percent: 0 },
      colors: { count: 0, percent: 0 },
      mpn: { count: 0, percent: 0 },
      specifications: { count: 0, percent: 0 },
    };
  }
  
  const total = data?.length || 0;
  if (total === 0) {
    return {
      images: { count: 0, percent: 0 },
      prices: { count: 0, percent: 0 },
      tds: { count: 0, percent: 0 },
      colors: { count: 0, percent: 0 },
      mpn: { count: 0, percent: 0 },
      specifications: { count: 0, percent: 0 },
    };
  }
  
  const counts = {
    images: 0,
    prices: 0,
    tds: 0,
    colors: 0,
    mpn: 0,
    specifications: 0,
  };
  
  for (const row of data) {
    if (row.featured_image) counts.images++;
    if (row.variant_price) counts.prices++;
    if (row.tds_url) counts.tds++;
    if (row.color_hex) counts.colors++;
    if (row.mpn) counts.mpn++;
    if (row.nozzle_temp_min_c) counts.specifications++;
  }
  
  const result = {
    images: { count: counts.images, percent: Math.round((counts.images / total) * 100) },
    prices: { count: counts.prices, percent: Math.round((counts.prices / total) * 100) },
    tds: { count: counts.tds, percent: Math.round((counts.tds / total) * 100) },
    colors: { count: counts.colors, percent: Math.round((counts.colors / total) * 100) },
    mpn: { count: counts.mpn, percent: Math.round((counts.mpn / total) * 100) },
    specifications: { count: counts.specifications, percent: Math.round((counts.specifications / total) * 100) },
  };
  
  console.log(`[FieldCoverage] ${vendorName}: ${total} products, images=${result.images.percent}%, prices=${result.prices.percent}%, tds=${result.tds.percent}%, colors=${result.colors.percent}%`);
  
  return result;
}

/**
 * Create a product result entry for tracking what happened during sync
 */
export function createProductResult(
  productId: string,
  title: string,
  action: 'created' | 'updated' | 'skipped' | 'error',
  filamentData: {
    featured_image?: string | null;
    variant_price?: number | null;
    tds_url?: string | null;
    color_hex?: string | null;
    mpn?: string | null;
    nozzle_temp_min_c?: number | null;
  },
  reason?: string
): SyncProductResult {
  return {
    productId,
    title,
    action,
    reason,
    fields: {
      image: !!filamentData.featured_image,
      price: !!filamentData.variant_price,
      tds: !!filamentData.tds_url,
      colorHex: !!filamentData.color_hex,
      mpn: !!filamentData.mpn,
      specifications: !!filamentData.nozzle_temp_min_c,
    },
    price: filamentData.variant_price || undefined,
  };
}

/**
 * Build the final standardized sync response
 */
export function buildSyncResponse(
  success: boolean,
  durationMs: number,
  summary: {
    totalDiscovered: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  },
  products: SyncProductResult[],
  fieldCoverage: FieldCoverageResult,
  stepResults?: any[]
): RichSyncResponse {
  return {
    success,
    duration_ms: durationMs,
    summary,
    products,
    fieldCoverage,
    results: stepResults,
  };
}

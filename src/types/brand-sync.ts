// Types for enhanced brand sync system with comprehensive logging

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
  region?: string;
}

export interface RegionSyncResult {
  region: string;
  currency: string;
  productsFound: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  duration_ms: number;
}

export interface FieldCoverageResult {
  images: { count: number; percent: number };
  prices: { count: number; percent: number };
  tds: { count: number; percent: number };
  colors: { count: number; percent: number };
  mpn: { count: number; percent: number };
  specifications: { count: number; percent: number };
}

export interface BrandSyncProgress {
  stage: 'initializing' | 'fetching' | 'processing' | 'saving' | 'complete' | 'error' | string;
  currentRegion?: string;
  currentProduct?: string;
  productsProcessed: number;
  totalProducts: number;
  regionsProcessed?: number;
  totalRegions?: number;
  errors?: string[] | number;
  created?: number;
  updated?: number;
  isRealProgress?: boolean;
}

export interface BrandSyncResult {
  success: boolean;
  jobId: string;
  brandSlug: string;
  platform: string;
  dryRun: boolean;
  summary: {
    totalDiscovered: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  regionBreakdown?: RegionSyncResult[];
  products: SyncProductResult[];
  fieldCoverage: FieldCoverageResult;
  duration_ms: number;
  startedAt: string;
  completedAt: string;
}

export interface BrandSyncJob {
  id: string;
  brand_slug: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  sync_type: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  products_discovered: number | null;
  products_created: number | null;
  products_updated: number | null;
  products_failed: number | null;
  progress: BrandSyncProgress | null;
  products_processed: SyncProductResult[] | null;
  error_details: { error: string } | null;
  regions_synced?: string[] | null;
  regional_breakdown?: Record<string, {
    updated?: number;
    created?: number;
    skipped?: number;
    errors?: number;
    products_found?: number;
    duration_ms?: number;
    error_messages?: string[];
    reason?: string;
  }> | null;
}

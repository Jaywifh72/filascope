# FilaScope Engineering Review

> **Document Version**: 1.0  
> **Last Updated**: 2025-01-15  
> **Review Scope**: Full-stack architecture analysis  
> **Reviewer Focus**: Data modeling, API boundaries, state synchronization

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Database Schema Analysis](#database-schema-analysis)
3. [API Routes & Request/Response Models](#api-routes--requestresponse-models)
4. [Client State Management & Caching](#client-state-management--caching)
5. [Background Jobs & Webhooks](#background-jobs--webhooks)
6. [Authorization Model](#authorization-model)
7. [Production Risks & Bugs](#production-risks--bugs)
8. [Concrete Refactors](#concrete-refactors)
9. [Prioritized Fix List](#prioritized-fix-list)

---

## Executive Summary

### Architecture Overview

FilaScope is a React/Vite application with Supabase backend consisting of:
- **45+ database tables** with complex relationships
- **51 Edge Functions** handling scraping, data enrichment, and business logic
- **25+ React Query hooks** managing client state
- **Real-time features** via Supabase subscriptions

### Key Findings

| Category | Status | Critical Issues |
|----------|--------|-----------------|
| DB Schema | ⚠️ Warning | Missing indexes, constraint gaps |
| API Boundaries | ⚠️ Warning | Inconsistent DTOs, no validation layer |
| State Management | 🔴 Critical | Cache inconsistencies, staleTime drift |
| Background Jobs | ⚠️ Warning | No idempotency, retry storms possible |
| Authorization | ⚠️ Warning | Anonymous write risks, audit gaps |

### Risk Score: 6.5/10

Primary concerns are state synchronization issues and missing data validation layers.

---

## Database Schema Analysis

### Schema Statistics

```
Tables: 45+
Views: 6 (all_time_low_prices, price_trends_90d, recent_price_drops, v_brands_overview, v_active_brands, v_pending_discoveries)
Functions: 10+ (has_role, update_updated_at_column, etc.)
Triggers: 15+ (timestamp updates, profile creation)
```

### Table Categories

#### Core Data (High Traffic)
| Table | Rows Est. | Indexes | RLS | Issues |
|-------|-----------|---------|-----|--------|
| `filaments` | 5,000+ | 3 | ✅ | Missing composite indexes |
| `printers` | 500+ | 2 | ✅ | Missing brand+model index |
| `printer_accessories` | 1,000+ | 1 | ✅ | Missing type+brand index |
| `automated_brands` | 50+ | 2 | ✅ | OK |
| `price_history` | 100,000+ | 2 | ✅ | Missing filament_id+recorded_at |

#### User Data (Moderate Traffic)
| Table | Rows Est. | Indexes | RLS | Issues |
|-------|-----------|---------|-----|--------|
| `profiles` | 1,000+ | 1 | ✅ | No INSERT policy (trigger-managed) |
| `user_printers` | 2,000+ | 1 | ✅ | OK |
| `wishlist_items` | 5,000+ | 2 | ✅ | OK |
| `user_activity` | 50,000+ | 1 | ✅ | Missing session_id index |
| `user_settings_history` | 10,000+ | 1 | ✅ | OK |

#### Analytics/Logs (High Write)
| Table | Rows Est. | Indexes | RLS | Issues |
|-------|-----------|---------|-----|--------|
| `module_engagement_metrics` | 100,000+ | 0 | ✅ | **No indexes!** |
| `brand_sync_logs` | 10,000+ | 1 | ✅ | OK |
| `sync_logs` | 5,000+ | 1 | ✅ | OK |
| `admin_activity_log` | 1,000+ | 1 | ✅ | OK |

### Missing Indexes (Critical)

```sql
-- 1. module_engagement_metrics - No indexes, high write volume
CREATE INDEX idx_engagement_metrics_module_created 
ON module_engagement_metrics(module_name, created_at DESC);

CREATE INDEX idx_engagement_metrics_user_session 
ON module_engagement_metrics(user_id, session_id);

-- 2. price_history - Slow historical queries
CREATE INDEX idx_price_history_filament_recorded 
ON price_history(filament_id, recorded_at DESC);

CREATE INDEX idx_price_history_region_recorded 
ON price_history(region, recorded_at DESC);

-- 3. filaments - Finder page performance
CREATE INDEX idx_filaments_material_vendor 
ON filaments(material, vendor);

CREATE INDEX idx_filaments_vendor_price 
ON filaments(vendor, variant_price) WHERE variant_price IS NOT NULL;

CREATE INDEX idx_filaments_color_family 
ON filaments(color_family) WHERE color_family IS NOT NULL;

-- 4. user_activity - Analytics queries
CREATE INDEX idx_user_activity_session_created 
ON user_activity(session_id, created_at DESC);

CREATE INDEX idx_user_activity_entity 
ON user_activity(entity_type, entity_id);

-- 5. printers - Brand filtering
CREATE INDEX idx_printers_brand_model 
ON printers(brand, model);

CREATE INDEX idx_printers_active_brand 
ON printers(brand) WHERE is_active = true;

-- 6. printer_accessories - Type filtering
CREATE INDEX idx_accessories_type_brand 
ON printer_accessories(accessory_type, brand);
```

### Missing Constraints

```sql
-- 1. Price validation
ALTER TABLE filaments 
ADD CONSTRAINT chk_filaments_price_positive 
CHECK (variant_price IS NULL OR variant_price > 0);

ALTER TABLE price_history 
ADD CONSTRAINT chk_price_history_positive 
CHECK (price > 0);

-- 2. Diameter validation (industry standard values)
ALTER TABLE filaments 
ADD CONSTRAINT chk_filaments_diameter_valid 
CHECK (diameter_nominal_mm IS NULL OR diameter_nominal_mm IN (1.75, 2.85, 3.0));

-- 3. Temperature range validation
ALTER TABLE filaments 
ADD CONSTRAINT chk_filaments_nozzle_temp_range 
CHECK (
  nozzle_temp_min_c IS NULL OR 
  nozzle_temp_max_c IS NULL OR 
  (nozzle_temp_min_c >= 150 AND nozzle_temp_max_c <= 500 AND nozzle_temp_min_c < nozzle_temp_max_c)
);

-- 4. Color hex validation
ALTER TABLE filaments 
ADD CONSTRAINT chk_filaments_color_hex_format 
CHECK (color_hex IS NULL OR color_hex ~ '^#[0-9A-Fa-f]{6}$');

-- 5. URL validation pattern
ALTER TABLE filaments 
ADD CONSTRAINT chk_filaments_product_url_format 
CHECK (product_url IS NULL OR product_url ~ '^https?://');
```

### Schema Normalization Issues

#### Issue 1: Vendor Denormalization
```
Current: filaments.vendor (text) - freeform string
Problem: "Bambu Lab" vs "BambuLab" vs "Bambu" inconsistencies
Solution: Foreign key to automated_brands table
```

```sql
-- Proposed migration
ALTER TABLE filaments 
ADD COLUMN brand_id_normalized uuid REFERENCES automated_brands(id);

-- Backfill with fuzzy matching
UPDATE filaments f
SET brand_id_normalized = (
  SELECT id FROM automated_brands ab 
  WHERE LOWER(ab.brand_name) = LOWER(f.vendor)
  OR LOWER(ab.display_name) = LOWER(f.vendor)
  LIMIT 1
);
```

#### Issue 2: Price Currency Inconsistency
```
Current: variant_price (numeric) - assumed USD
Problem: Some scrapers store native currency without conversion
Solution: Explicit currency column or always convert to USD on write
```

#### Issue 3: Printer Hotend Types
```
Current: Hotend types stored as text array in specs
Problem: No normalization, inconsistent naming
Solution: Separate hotend_types reference table
```

---

## API Routes & Request/Response Models

### Edge Function Inventory

| Function | Method | Auth | Rate Limit | Issues |
|----------|--------|------|------------|--------|
| `scrape-brand-data` | POST | Admin | None | No request validation |
| `parse-filament-tds` | POST | Admin | None | No timeout handling |
| `update-global-prices` | POST | Admin | None | No idempotency |
| `enrich-printer-data` | POST | Admin | None | No batch limits |
| `scrape-accessory-images` | POST | Admin | None | Memory leaks possible |
| `cleanup-images` | POST | Admin | None | OK |
| `log-printer-prices` | POST | Admin | None | OK |
| `sync-3dxtech-products` | POST | Admin | None | No error recovery |

### Missing Request Validation

#### Current Pattern (Unsafe)
```typescript
// ❌ Current: No validation
Deno.serve(async (req) => {
  const { brandSlug, limit } = await req.json();
  // brandSlug could be anything - SQL injection risk with dynamic queries
  // limit could be -1 or 999999
});
```

#### Recommended Pattern
```typescript
// ✅ Recommended: Zod validation
import { z } from "npm:zod@3.22.4";

const ScrapeBrandRequestSchema = z.object({
  brandSlug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  limit: z.number().int().min(1).max(100).default(50),
  forceScrape: z.boolean().default(false),
  parseTds: z.boolean().default(false),
});

type ScrapeBrandRequest = z.infer<typeof ScrapeBrandRequestSchema>;

Deno.serve(async (req) => {
  const body = await req.json();
  const result = ScrapeBrandRequestSchema.safeParse(body);
  
  if (!result.success) {
    return new Response(JSON.stringify({
      error: 'Validation failed',
      details: result.error.flatten()
    }), { status: 400, headers: corsHeaders });
  }
  
  const { brandSlug, limit, forceScrape, parseTds } = result.data;
  // Safe to use
});
```

### Recommended DTOs

```typescript
// src/types/api/scraper.ts
export interface ScrapeBrandRequest {
  brandSlug: string;
  limit?: number;
  forceScrape?: boolean;
  parseTds?: boolean;
}

export interface ScrapeBrandResponse {
  success: boolean;
  brand: string;
  stats: {
    discovered: number;
    created: number;
    updated: number;
    failed: number;
    duration_seconds: number;
  };
  enrichment?: {
    imagesAdded: number;
    mpnsExtracted: number;
    barcodesAdded: number;
    colorHexCaptured: number;
    tempSpecsExtracted: number;
  };
  errors?: Array<{
    product: string;
    error: string;
  }>;
}

// src/types/api/prices.ts
export interface UpdatePricesRequest {
  brand?: string;
  regions?: string[];
  limit?: number;
}

export interface UpdatePricesResponse {
  success: boolean;
  results: Array<{
    printer_id: string;
    printer_name: string;
    region: string;
    price_found: number | null;
    source: 'store' | 'amazon';
    error?: string;
  }>;
  summary: {
    total_processed: number;
    successful: number;
    failed: number;
    skipped: number;
  };
}
```

### Response Shape Inconsistencies

```typescript
// ❌ Inconsistent error responses across functions
// Function A:
{ "error": "Something went wrong" }

// Function B:
{ "success": false, "message": "Something went wrong" }

// Function C:
{ "status": "error", "error": { "message": "Something went wrong" } }

// ✅ Standardized response envelope
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    duration_ms: number;
  };
}
```

---

## Client State Management & Caching

### TanStack Query Usage Analysis

| Hook | staleTime | gcTime | Issues |
|------|-----------|--------|--------|
| `useFilaments` | 5min | 10min | OK |
| `useFilament` (single) | 5min | 30min | OK |
| `usePrinters` | Infinity | 30min | **Stale data risk** |
| `usePrinter` (single) | 5min | 30min | OK |
| `useBrands` | 10min | 30min | OK |
| `useWishlist` | 1min | 5min | Too aggressive |
| `usePriceHistory` | 10min | 30min | OK |
| `useTrendingMaterials` | 5min | 30min | OK |
| `useDeals` | 2min | 10min | OK |
| `useSafetyAlerts` | 1min | 5min | Too aggressive |

### Critical Issues

#### Issue 1: Inconsistent staleTime Values
```typescript
// ❌ Current: Same data, different caching
// In Finder.tsx
useQuery({
  queryKey: ['filaments', filters],
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// In FilamentDetail.tsx
useQuery({
  queryKey: ['filament', id],
  staleTime: 5 * 60 * 1000, // 5 minutes - OK
});

// In Compare.tsx
useQuery({
  queryKey: ['filaments', ids],
  staleTime: 0, // Always refetch! Inconsistent
});
```

```typescript
// ✅ Recommended: Centralized cache config
// src/lib/queryConfig.ts
export const QUERY_CONFIG = {
  filaments: {
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes
  },
  printers: {
    staleTime: 10 * 60 * 1000, // 10 minutes (changes less often)
    gcTime: 60 * 60 * 1000,    // 1 hour
  },
  prices: {
    staleTime: 2 * 60 * 1000,  // 2 minutes (more volatile)
    gcTime: 10 * 60 * 1000,    // 10 minutes
  },
  userContent: {
    staleTime: 30 * 1000,      // 30 seconds (personalized)
    gcTime: 5 * 60 * 1000,     // 5 minutes
  },
  static: {
    staleTime: Infinity,       // Never stale (materials, etc.)
    gcTime: Infinity,
  },
} as const;
```

#### Issue 2: Missing Optimistic Updates
```typescript
// ❌ Current: Wait for server response
const addToWishlist = useMutation({
  mutationFn: async (filamentId: string) => {
    const { error } = await supabase
      .from('wishlist_items')
      .insert({ user_id: user.id, filament_id: filamentId });
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['wishlist'] });
  },
});

// ✅ Recommended: Optimistic update
const addToWishlist = useMutation({
  mutationFn: async (filamentId: string) => {
    const { error } = await supabase
      .from('wishlist_items')
      .insert({ user_id: user.id, filament_id: filamentId });
    if (error) throw error;
  },
  onMutate: async (filamentId) => {
    await queryClient.cancelQueries({ queryKey: ['wishlist'] });
    const previous = queryClient.getQueryData(['wishlist']);
    
    queryClient.setQueryData(['wishlist'], (old: WishlistItem[]) => [
      ...old,
      { filament_id: filamentId, created_at: new Date().toISOString() }
    ]);
    
    return { previous };
  },
  onError: (err, filamentId, context) => {
    queryClient.setQueryData(['wishlist'], context?.previous);
    toast.error('Failed to add to wishlist');
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['wishlist'] });
  },
});
```

#### Issue 3: N+1 Query Patterns
```typescript
// ❌ Current: Fetch filaments, then fetch brand for each
const { data: filaments } = useFilaments();
// Then in component:
filaments.map(f => <FilamentCard key={f.id} filament={f} brand={useBrand(f.vendor)} />);

// ✅ Recommended: Join at query level
const { data: filaments } = useQuery({
  queryKey: ['filaments-with-brands', filters],
  queryFn: async () => {
    const { data } = await supabase
      .from('filaments')
      .select(`
        *,
        brand:automated_brands!brand_id(
          display_name,
          logo_url,
          website_url
        )
      `)
      .match(filters);
    return data;
  },
});
```

#### Issue 4: Local vs Server State Conflicts
```typescript
// ❌ Current: Local state duplicates server state
const [selectedFilaments, setSelectedFilaments] = useState<string[]>([]);
const { data: wishlist } = useWishlist();

// Conflicts when wishlist updates from server
// User sees different state than what's in DB

// ✅ Recommended: Server state as source of truth
const { data: wishlist } = useWishlist();
const wishlistIds = useMemo(() => 
  wishlist?.map(w => w.filament_id) ?? [], 
  [wishlist]
);

const isInWishlist = useCallback((id: string) => 
  wishlistIds.includes(id), 
  [wishlistIds]
);
```

### Query Key Structure Issues

```typescript
// ❌ Current: Inconsistent key patterns
['filaments']
['filaments', 'list']
['filaments', { material: 'PLA' }]
['filament', id]
['filament-detail', id]

// ✅ Recommended: Consistent hierarchy
// src/lib/queryKeys.ts
export const queryKeys = {
  filaments: {
    all: ['filaments'] as const,
    lists: () => [...queryKeys.filaments.all, 'list'] as const,
    list: (filters: FilamentFilters) => [...queryKeys.filaments.lists(), filters] as const,
    details: () => [...queryKeys.filaments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.filaments.details(), id] as const,
  },
  printers: {
    all: ['printers'] as const,
    lists: () => [...queryKeys.printers.all, 'list'] as const,
    list: (filters: PrinterFilters) => [...queryKeys.printers.lists(), filters] as const,
    details: () => [...queryKeys.printers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.printers.details(), id] as const,
  },
  // ... etc
} as const;
```

---

## Background Jobs & Webhooks

### Current Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Admin UI       │────▶│  Edge Function   │────▶│  Supabase DB    │
│  (Manual Trigger)│     │  (scrape-brand)  │     │  (filaments)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  External APIs   │
                        │  (Shopify,       │
                        │   Firecrawl,     │
                        │   Amazon)        │
                        └──────────────────┘
```

### Issues Identified

#### Issue 1: No Idempotency
```typescript
// ❌ Current: Multiple clicks = multiple scrapes
async function scrapeBrand(brandSlug: string) {
  // No check if scrape is already running
  // No idempotency key
  await startScraping(brandSlug);
}

// ✅ Recommended: Idempotency with locking
async function scrapeBrand(brandSlug: string, idempotencyKey?: string) {
  // Check if same request already processed
  if (idempotencyKey) {
    const existing = await supabase
      .from('brand_sync_logs')
      .select('id, status')
      .eq('idempotency_key', idempotencyKey)
      .single();
    
    if (existing.data) {
      return { 
        status: 'duplicate', 
        existing_run_id: existing.data.id 
      };
    }
  }
  
  // Check if scrape already running for this brand
  const running = await supabase
    .from('brand_sync_logs')
    .select('id')
    .eq('brand_slug', brandSlug)
    .eq('status', 'running')
    .single();
  
  if (running.data) {
    return { 
      status: 'already_running', 
      run_id: running.data.id 
    };
  }
  
  // Proceed with scrape
  const logId = await createSyncLog(brandSlug, idempotencyKey);
  // ...
}
```

#### Issue 2: No Retry Backoff
```typescript
// ❌ Current: Fixed retry with no backoff
const MAX_RETRIES = 3;
for (let i = 0; i < MAX_RETRIES; i++) {
  try {
    await scrapeProduct(url);
    break;
  } catch (e) {
    // Immediate retry - can cause rate limit storms
  }
}

// ✅ Recommended: Exponential backoff
async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
  }
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < options.maxRetries - 1) {
        const delay = Math.min(
          options.baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
          options.maxDelay
        );
        await sleep(delay);
      }
    }
  }
  
  throw lastError!;
}
```

#### Issue 3: No Dead Letter Queue
```typescript
// ❌ Current: Failed items logged but not recoverable
products_failed: failedProducts.length,
// Lost forever unless manually re-run

// ✅ Recommended: Queue failed items for retry
interface FailedScrapeRecord {
  id: string;
  brand_slug: string;
  product_url: string;
  error_message: string;
  attempts: number;
  last_attempt_at: string;
  next_retry_at: string | null;
  status: 'pending' | 'retrying' | 'abandoned';
}

// On failure:
await supabase.from('scrape_failed_items').insert({
  brand_slug: brandSlug,
  product_url: url,
  error_message: error.message,
  attempts: 1,
  last_attempt_at: new Date().toISOString(),
  next_retry_at: calculateNextRetry(1), // 1 hour later
  status: 'pending',
});

// Separate retry job processes these
```

#### Issue 4: No Job Scheduling
```typescript
// ❌ Current: GitHub Actions cron + manual triggers
// No visibility into scheduled jobs
// No way to pause/resume jobs

// ✅ Recommended: Job metadata table
interface ScheduledJob {
  id: string;
  job_type: 'scrape_brand' | 'update_prices' | 'parse_tds';
  schedule_cron: string;
  is_enabled: boolean;
  last_run_at: string | null;
  next_run_at: string;
  config: Record<string, unknown>;
  created_at: string;
}

// Dashboard shows job status and allows enable/disable
```

### Webhook Security (If Implemented)

```typescript
// ✅ Recommended webhook verification
async function verifyWebhook(req: Request): Promise<boolean> {
  const signature = req.headers.get('x-webhook-signature');
  const timestamp = req.headers.get('x-webhook-timestamp');
  const body = await req.text();
  
  // Verify timestamp is recent (prevent replay attacks)
  const timestampAge = Date.now() - parseInt(timestamp || '0');
  if (timestampAge > 5 * 60 * 1000) { // 5 minutes
    return false;
  }
  
  // Verify signature
  const expectedSignature = await computeHmac(
    `${timestamp}.${body}`,
    Deno.env.get('WEBHOOK_SECRET')!
  );
  
  return signature === expectedSignature;
}
```

---

## Authorization Model

### RLS Policy Analysis

#### Public Tables (No Auth Required)
| Table | SELECT | INSERT | UPDATE | DELETE | Risk |
|-------|--------|--------|--------|--------|------|
| `filaments` | ✅ All | ❌ Admin | ❌ Admin | ❌ Admin | Low |
| `printers` | ✅ All | ❌ Admin | ❌ Admin | ❌ Admin | Low |
| `automated_brands` | ✅ Visible | ❌ Admin | ❌ Admin | ❌ Admin | Low |
| `price_history` | ✅ All | ❌ Admin | ❌ None | ❌ None | Low |

#### User Tables (Auth Required)
| Table | SELECT | INSERT | UPDATE | DELETE | Risk |
|-------|--------|--------|--------|--------|------|
| `profiles` | ✅ Own | ❌ Trigger | ✅ Own | ❌ None | Low |
| `wishlist_items` | ✅ Own | ✅ Own | ✅ Own | ✅ Own | Low |
| `user_printers` | ✅ Own+Anon | ✅ Own+Anon | ✅ Own+Anon | ✅ Own+Anon | **Medium** |
| `user_settings_history` | ✅ Own+Anon | ✅ Own+Anon | ❌ None | ✅ Own | Low |

#### Analytics Tables (Mixed)
| Table | SELECT | INSERT | UPDATE | DELETE | Risk |
|-------|--------|--------|--------|--------|------|
| `user_activity` | ✅ Own+Anon | ✅ Any | ❌ None | ❌ None | **High** |
| `module_engagement_metrics` | ✅ Admin | ✅ Any | ❌ None | ❌ None | **High** |
| `trend_upvotes` | ✅ All | ✅ Any | ❌ None | ❌ None | **Medium** |

### Critical Security Issues

#### Issue 1: Anonymous Write to user_activity
```sql
-- Current policy allows ANY insert
CREATE POLICY "Users can insert own activity" 
ON user_activity FOR INSERT 
WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL));

-- Risk: Anyone can flood table with fake activity data
-- Mitigation: Rate limiting + validation
```

```typescript
// ✅ Recommended: Rate limiting in edge function
const RATE_LIMIT = {
  maxRequestsPerMinute: 60,
  maxRequestsPerHour: 500,
};

async function trackActivity(sessionId: string, activity: Activity) {
  // Check rate limit
  const recentCount = await supabase
    .from('user_activity')
    .select('id', { count: 'exact' })
    .eq('session_id', sessionId)
    .gte('created_at', new Date(Date.now() - 60000).toISOString());
  
  if (recentCount.count >= RATE_LIMIT.maxRequestsPerMinute) {
    throw new Error('Rate limit exceeded');
  }
  
  // Validate activity data
  const validated = ActivitySchema.parse(activity);
  
  await supabase.from('user_activity').insert(validated);
}
```

#### Issue 2: module_engagement_metrics Open Insert
```sql
-- Current: Anyone can insert
CREATE POLICY "Anyone can insert engagement metrics" 
ON module_engagement_metrics FOR INSERT 
WITH CHECK (true);

-- Risk: Fake engagement data skews analytics
-- Mitigation: Server-side only insertion via edge function
```

#### Issue 3: No Audit Logging for Admin Actions
```typescript
// ❌ Current: Admin actions not logged
async function deleteFilament(id: string) {
  await supabase.from('filaments').delete().eq('id', id);
  // No record of who deleted what
}

// ✅ Recommended: Audit logging
async function deleteFilament(id: string, adminUserId: string) {
  // Get current state for audit
  const { data: current } = await supabase
    .from('filaments')
    .select('*')
    .eq('id', id)
    .single();
  
  // Delete
  await supabase.from('filaments').delete().eq('id', id);
  
  // Log action
  await supabase.from('admin_activity_log').insert({
    user_id: adminUserId,
    action_type: 'delete',
    entity_type: 'filament',
    entity_id: id,
    details: {
      deleted_data: current,
      reason: 'Admin deletion',
    },
  });
}
```

### Service Role Key Usage

```typescript
// ⚠️ Warning: Service role bypasses RLS
// Only use in edge functions with proper validation

// ❌ Dangerous: Service client exposed to frontend
const supabaseAdmin = createClient(url, serviceRoleKey);
// NEVER do this in frontend code

// ✅ Correct: Service client only in edge functions
// supabase/functions/admin-action/index.ts
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Always verify admin status first
const { data: { user } } = await supabase.auth.getUser(jwt);
const { data: isAdmin } = await supabase.rpc('has_role', { 
  _user_id: user.id, 
  _role: 'admin' 
});

if (!isAdmin) {
  return new Response('Unauthorized', { status: 403 });
}
```

---

## Production Risks & Bugs

### Critical (P0) - Fix Immediately

#### 1. Race Condition in Price Updates
```
Risk: Two concurrent scrapes update same filament
Impact: Data corruption, lost updates
Likelihood: High during bulk operations
```

```typescript
// ❌ Current: Read-modify-write without locking
const current = await getFilament(id);
const updated = { ...current, variant_price: newPrice };
await updateFilament(id, updated);

// ✅ Fix: Use database-level upsert with conflict handling
await supabase.from('filaments')
  .upsert({
    id: filamentId,
    variant_price: newPrice,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'id',
    ignoreDuplicates: false,
  });
```

#### 2. staleTime: Infinity on Printers
```
Risk: Users see outdated printer data until page refresh
Impact: Wrong prices, specs shown
Likelihood: High after price updates
```

```typescript
// Fix: Reasonable staleTime
const { data: printers } = useQuery({
  queryKey: ['printers'],
  staleTime: 10 * 60 * 1000, // 10 minutes, not Infinity
});
```

#### 3. No Input Validation on Edge Functions
```
Risk: SQL injection, DoS via malformed input
Impact: Data breach, service outage
Likelihood: Medium (requires malicious actor)
```

### High (P1) - Fix This Sprint

#### 4. N+1 Queries on Finder Page
```
Risk: Slow page loads with many filaments
Impact: Poor UX, increased DB load
Likelihood: High on every page load
```

#### 5. Missing Indexes on Analytics Tables
```
Risk: Slow admin dashboard, timeout on reports
Impact: Admin frustration, missed insights
Likelihood: Guaranteed as data grows
```

#### 6. No Retry Backoff on Scrapers
```
Risk: Rate limit storms, IP bans
Impact: Scraping failures, brand blocking
Likelihood: Medium during high volume
```

#### 7. Cache Invalidation Gaps
```
Risk: Stale data after mutations
Impact: User confusion, trust issues
Likelihood: High on wishlist/ratings changes
```

### Medium (P2) - Fix This Month

#### 8. Anonymous Analytics Abuse
```
Risk: Fake engagement data skews metrics
Impact: Wrong business decisions
Likelihood: Low unless targeted
```

#### 9. No Dead Letter Queue
```
Risk: Failed scrapes lost forever
Impact: Incomplete data coverage
Likelihood: Guaranteed for some products
```

#### 10. Inconsistent Error Responses
```
Risk: Frontend error handling fragile
Impact: Poor error UX, debugging difficulty
Likelihood: High during edge cases
```

### Low (P3) - Track for Later

#### 11. Vendor Denormalization
```
Risk: Inconsistent brand names
Impact: Filtering issues, duplicates
Likelihood: Ongoing data quality issue
```

#### 12. No Job Scheduling UI
```
Risk: Manual job management error-prone
Impact: Missed updates, admin overhead
Likelihood: Ongoing operational issue
```

#### 13. Missing Composite Indexes
```
Risk: Suboptimal query performance
Impact: Slow filters, increased costs
Likelihood: Increases with data volume
```

#### 14. Price Currency Ambiguity
```
Risk: Wrong prices displayed
Impact: User confusion, trust issues
Likelihood: Low (mostly USD)
```

#### 15. No Webhook Security
```
Risk: Forged webhook payloads
Impact: Data manipulation if webhooks added
Likelihood: Future risk if webhooks implemented
```

---

## Concrete Refactors

### 1. Service Layer Extraction

```
Current Structure:
src/
  hooks/
    useFilaments.ts      # Mixes query + mutation + business logic
    usePrinters.ts
    useWishlist.ts
  pages/
    Finder.tsx           # Contains filtering logic
    FilamentDetail.tsx   # Contains compatibility logic

Proposed Structure:
src/
  services/
    filament/
      filamentService.ts       # Pure business logic
      filamentQueries.ts       # Query functions
      filamentMutations.ts     # Mutation functions
      filamentTypes.ts         # TypeScript interfaces
    printer/
      printerService.ts
      printerQueries.ts
      printerMutations.ts
      printerTypes.ts
    compatibility/
      compatibilityService.ts  # Cross-entity logic
  hooks/
    useFilaments.ts            # Thin wrapper around queries
    usePrinters.ts
    useWishlist.ts
  lib/
    queryKeys.ts               # Centralized query keys
    queryConfig.ts             # Centralized cache config
```

### 2. DTO & Validation Layer

```typescript
// src/types/dto/filament.dto.ts
import { z } from 'zod';

export const FilamentFilterSchema = z.object({
  materials: z.array(z.string()).optional(),
  vendors: z.array(z.string()).optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  colorTolerance: z.number().min(0).max(100).optional(),
  inStock: z.boolean().optional(),
  sortBy: z.enum(['price', 'name', 'score', 'true_cost']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export type FilamentFilter = z.infer<typeof FilamentFilterSchema>;

export const FilamentResponseSchema = z.object({
  id: z.string().uuid(),
  product_title: z.string(),
  vendor: z.string(),
  material: z.string().nullable(),
  variant_price: z.number().nullable(),
  color_hex: z.string().nullable(),
  featured_image: z.string().url().nullable(),
  // ... other fields
});

export type FilamentResponse = z.infer<typeof FilamentResponseSchema>;
```

### 3. Query Key Factory

```typescript
// src/lib/queryKeys.ts
export const queryKeys = {
  // Filaments
  filaments: {
    all: ['filaments'] as const,
    lists: () => [...queryKeys.filaments.all, 'list'] as const,
    list: (filters: FilamentFilter) => 
      [...queryKeys.filaments.lists(), filters] as const,
    details: () => [...queryKeys.filaments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.filaments.details(), id] as const,
    compare: (ids: string[]) => 
      [...queryKeys.filaments.all, 'compare', ids.sort()] as const,
  },
  
  // Printers
  printers: {
    all: ['printers'] as const,
    lists: () => [...queryKeys.printers.all, 'list'] as const,
    list: (filters: PrinterFilter) => 
      [...queryKeys.printers.lists(), filters] as const,
    details: () => [...queryKeys.printers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.printers.details(), id] as const,
    compare: (ids: string[]) => 
      [...queryKeys.printers.all, 'compare', ids.sort()] as const,
  },
  
  // Prices
  prices: {
    all: ['prices'] as const,
    history: (entityType: string, entityId: string) => 
      [...queryKeys.prices.all, entityType, entityId] as const,
  },
  
  // User content
  user: {
    all: ['user'] as const,
    wishlist: () => [...queryKeys.user.all, 'wishlist'] as const,
    activity: () => [...queryKeys.user.all, 'activity'] as const,
    printers: () => [...queryKeys.user.all, 'printers'] as const,
  },
} as const;
```

### 4. Centralized Cache Config

```typescript
// src/lib/queryConfig.ts
export const QUERY_DEFAULTS = {
  // Data that changes frequently
  volatile: {
    staleTime: 2 * 60 * 1000,      // 2 minutes
    gcTime: 10 * 60 * 1000,        // 10 minutes
  },
  
  // Standard data
  standard: {
    staleTime: 5 * 60 * 1000,      // 5 minutes
    gcTime: 30 * 60 * 1000,        // 30 minutes
  },
  
  // Slowly changing data
  stable: {
    staleTime: 30 * 60 * 1000,     // 30 minutes
    gcTime: 60 * 60 * 1000,        // 1 hour
  },
  
  // Reference data (materials, categories)
  static: {
    staleTime: Infinity,
    gcTime: Infinity,
  },
  
  // User-specific content
  user: {
    staleTime: 30 * 1000,          // 30 seconds
    gcTime: 5 * 60 * 1000,         // 5 minutes
  },
} as const;

// Usage
const { data } = useQuery({
  queryKey: queryKeys.filaments.list(filters),
  queryFn: () => filamentQueries.list(filters),
  ...QUERY_DEFAULTS.standard,
});
```

### 5. Error Boundary Improvements

```typescript
// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';
import { captureException } from '@/lib/errorReporting';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    captureException(error, {
      componentStack: errorInfo.componentStack,
      tags: { boundary: true },
    });
    this.props.onError?.(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          <h3>Something went wrong</h3>
          <p className="text-sm">{this.state.error?.message}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 text-sm underline"
          >
            Try again
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

---

## Prioritized Fix List

### Quick Wins (1-2 days each)

| Priority | Task | Effort | Impact | Risk Addressed |
|----------|------|--------|--------|----------------|
| P0 | Fix staleTime: Infinity on printers | 1h | High | Stale data |
| P0 | Add missing indexes on engagement_metrics | 2h | High | Query performance |
| P1 | Standardize query keys | 4h | Medium | Cache coherence |
| P1 | Add Zod validation to scrape-brand-data | 4h | High | Input validation |
| P1 | Add composite indexes on price_history | 2h | High | Query performance |

### Medium Term (1-2 weeks)

| Priority | Task | Effort | Impact | Risk Addressed |
|----------|------|--------|--------|----------------|
| P1 | Implement optimistic updates for wishlist | 2d | Medium | UX responsiveness |
| P1 | Add exponential backoff to scrapers | 2d | High | Rate limiting |
| P1 | Create centralized cache config | 1d | Medium | Cache consistency |
| P2 | Implement idempotency for scrape jobs | 3d | Medium | Duplicate runs |
| P2 | Add rate limiting to analytics endpoints | 2d | Medium | Abuse prevention |

### Strategic Improvements (1+ month)

| Priority | Task | Effort | Impact | Risk Addressed |
|----------|------|--------|--------|----------------|
| P2 | Extract service layer | 2w | High | Code organization |
| P2 | Implement dead letter queue | 1w | Medium | Data recovery |
| P2 | Normalize vendor to brand_id FK | 1w | Medium | Data quality |
| P3 | Build job scheduling UI | 2w | Medium | Operations |
| P3 | Add comprehensive audit logging | 1w | Medium | Security |

### Implementation Order

```
Week 1:
├── Day 1-2: P0 fixes (staleTime, indexes)
├── Day 3-4: Zod validation on critical functions
└── Day 5: Query key standardization

Week 2:
├── Day 1-2: Optimistic updates
├── Day 3-4: Exponential backoff
└── Day 5: Centralized cache config

Week 3-4:
├── Idempotency implementation
├── Rate limiting
└── Service layer extraction (start)

Month 2:
├── Complete service layer
├── Dead letter queue
└── Vendor normalization
```

---

## Appendix: SQL Scripts

### A. Index Creation Script

```sql
-- Run in sequence, monitor for locking issues

-- High priority indexes
CREATE INDEX CONCURRENTLY idx_engagement_metrics_module_created 
ON module_engagement_metrics(module_name, created_at DESC);

CREATE INDEX CONCURRENTLY idx_price_history_filament_recorded 
ON price_history(filament_id, recorded_at DESC);

CREATE INDEX CONCURRENTLY idx_filaments_material_vendor 
ON filaments(material, vendor);

-- Medium priority indexes
CREATE INDEX CONCURRENTLY idx_user_activity_session_created 
ON user_activity(session_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_printers_brand_model 
ON printers(brand, model);

CREATE INDEX CONCURRENTLY idx_accessories_type_brand 
ON printer_accessories(accessory_type, brand);
```

### B. Constraint Addition Script

```sql
-- Add constraints (check data first)

-- Verify data before adding constraints
SELECT COUNT(*) FROM filaments WHERE variant_price <= 0;
SELECT COUNT(*) FROM filaments WHERE diameter_nominal_mm NOT IN (1.75, 2.85, 3.0);
SELECT COUNT(*) FROM filaments WHERE color_hex !~ '^#[0-9A-Fa-f]{6}$';

-- Add constraints if data is clean
ALTER TABLE filaments 
ADD CONSTRAINT chk_filaments_price_positive 
CHECK (variant_price IS NULL OR variant_price > 0);

-- etc.
```

---

**Document End**

*For questions or updates, contact the engineering team.*

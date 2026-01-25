

# Product Regional Slugs Mapping System

## Problem Statement

The same product may have different slugs across regional stores (e.g., `hyper-pla-cf` vs `hyper-pla-carbon-fibre`). Currently, the system blindly substitutes the primary slug into regional URL patterns, which can result in 404 errors when a regional store uses a different slug.

## Current State Analysis

### Existing Infrastructure
- **URL Pattern Interpolation**: `buildRegionalUrl()` in `useRegionalPricing.ts` replaces `{slug}` placeholders with the product's primary slug
- **URL Validation**: `validate-filament-urls` edge function checks if URLs return 200/404
- **No Slug Mapping**: There is currently no database table or logic to map product slugs across regions
- **Brand URL Fixes**: Some hardcoded fixes exist in `urlValidation.ts` for specific brands (Bambu Lab, Ultimaker)

### Data Model
- Products are stored in `filaments` table with `product_handle` as the primary slug
- Regional stores are in `brand_regional_stores` with `product_url_pattern` containing `{slug}` placeholder
- No relationship exists between a product and its region-specific slugs

## Recommended Approach: Hybrid Solution

Combining both approaches provides the best balance of accuracy and simplicity:

1. **New `product_regional_slugs` table** for storing verified regional slugs
2. **Smart fallback logic** for products without verified regional slugs
3. **Background verification service** to populate and validate regional slugs over time

## Implementation Plan

### Phase 1: Database Schema

Create a new table to store verified regional slug mappings:

```text
Table: product_regional_slugs
+-------------------+---------------+------------------------------------------+
| Column            | Type          | Description                              |
+-------------------+---------------+------------------------------------------+
| id                | UUID (PK)     | Primary key                              |
| filament_id       | UUID (FK)     | Reference to filaments.id                |
| region_code       | VARCHAR(2)    | Region code (US, CA, EU, UK, AU, etc.)   |
| slug              | VARCHAR(255)  | The verified slug for this region        |
| verified          | BOOLEAN       | Whether this slug has been validated     |
| http_status       | INTEGER       | Last HTTP status code when verified      |
| verified_at       | TIMESTAMP     | When the slug was last verified          |
| created_at        | TIMESTAMP     | Record creation timestamp                |
+-------------------+---------------+------------------------------------------+
Constraints: UNIQUE(filament_id, region_code)
```

### Phase 2: Slug Resolution Utility

Create a new utility function that resolves the correct slug for a region:

**File: `src/utils/regionalSlugResolver.ts`**

```text
Functions to implement:

1. getRegionalSlug(filamentId, regionCode, fallbackSlug)
   - Query product_regional_slugs for verified slug
   - If found and verified, return the regional slug
   - Otherwise, return the fallback (primary) slug

2. generateSlugVariants(primarySlug)
   - Generate common variations for fallback attempts:
     - Original: "hyper-pla-cf"
     - Expanded: "hyper-pla-carbon-fiber", "hyper-pla-carbon-fibre"
     - Hyphenated: variations with different hyphenation
   - Return array of slug candidates to try
```

### Phase 3: Update useRegionalPricing Hook

Modify the existing hook to use the slug resolver:

**File: `src/hooks/useRegionalPricing.ts`**

Changes:
1. Add a React Query call to fetch regional slug (if available)
2. Update `buildRegionalUrl()` to use resolved regional slug
3. Add `slugVerified` flag to the price result for UI indication

```text
Logic flow:

1. Fetch brand and regional stores (existing)
2. NEW: Query product_regional_slugs for matching filament + region
3. If verified slug exists → use it
4. If no verified slug → use primary product_handle
5. Build URL with resolved slug
6. Return result with verification status
```

### Phase 4: Background Verification Edge Function

Create an edge function to verify and populate regional slugs:

**File: `supabase/functions/verify-regional-slugs/index.ts`**

Responsibilities:
1. For each filament × region combination without a verified slug:
   - Build the regional URL using primary slug
   - Make HEAD request to check if URL returns 200
   - If 200: store slug as verified
   - If 404: try slug variants, store first working variant
   - If all fail: mark as "unverified" with null slug (will use fallback)

2. Rate limiting and batching for responsible scraping
3. Scheduled execution (e.g., nightly) to keep slugs current

### Phase 5: Fallback Behavior in UI

When displaying a product without a verified regional slug:

```text
Priority Order:
1. Verified regional slug → direct product URL
2. Primary slug → try URL (most brands use consistent slugs)
3. Brand store homepage → if product URL might fail

UI Indicators:
- Verified: No indicator needed (confident link)
- Unverified: Optional subtle indicator or tooltip
- Fallback to homepage: Show "Browse [Brand] Store" instead of "Buy Now"
```

## Technical Details

### Database Migration SQL

```sql
CREATE TABLE product_regional_slugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filament_id UUID NOT NULL REFERENCES filaments(id) ON DELETE CASCADE,
  region_code VARCHAR(5) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  verified BOOLEAN DEFAULT false,
  http_status INTEGER,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_filament_region UNIQUE (filament_id, region_code)
);

CREATE INDEX idx_regional_slugs_filament ON product_regional_slugs(filament_id);
CREATE INDEX idx_regional_slugs_verified ON product_regional_slugs(verified) WHERE verified = true;
```

### Hook Integration Changes

```text
useRegionalPricing.ts modifications:

// New query to fetch regional slug
const { data: regionalSlugData } = useQuery({
  queryKey: ['regional-slug', filamentId, region],
  queryFn: () => fetchRegionalSlug(filamentId, region),
  enabled: !!filamentId && !!region,
  staleTime: 30 * 60 * 1000, // 30 minutes
});

// Updated URL building
const effectiveSlug = regionalSlugData?.slug || primarySlug;
const storeUrl = buildRegionalUrl(
  matchedStore.product_url_pattern,
  matchedStore.base_url,
  effectiveSlug
);

// Add to result
priceResult.slugVerified = regionalSlugData?.verified ?? false;
```

### Edge Function Logic

```text
verify-regional-slugs/index.ts:

async function verifySlugForRegion(
  filamentId: string,
  regionCode: string,
  baseSlug: string,
  urlPattern: string,
  baseUrl: string
): Promise<{ slug: string; verified: boolean; httpStatus: number }> {
  
  // Try primary slug first
  const primaryUrl = buildUrl(urlPattern, baseUrl, baseSlug);
  const primaryResult = await testUrl(primaryUrl);
  
  if (primaryResult.ok) {
    return { slug: baseSlug, verified: true, httpStatus: primaryResult.status };
  }
  
  // Try slug variants if primary fails
  const variants = generateSlugVariants(baseSlug);
  for (const variant of variants) {
    const variantUrl = buildUrl(urlPattern, baseUrl, variant);
    const result = await testUrl(variantUrl);
    if (result.ok) {
      return { slug: variant, verified: true, httpStatus: result.status };
    }
  }
  
  // No working slug found
  return { slug: baseSlug, verified: false, httpStatus: primaryResult.status };
}
```

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/xxx_create_product_regional_slugs.sql` | Create | Database table migration |
| `src/utils/regionalSlugResolver.ts` | Create | Slug resolution utility functions |
| `src/hooks/useRegionalPricing.ts` | Modify | Integrate slug resolution into pricing hook |
| `supabase/functions/verify-regional-slugs/index.ts` | Create | Background verification edge function |
| `src/hooks/useRegionalSlug.ts` | Create | React hook for fetching regional slugs |
| `src/types/regional.ts` | Modify | Add regional slug types |

## Expected Outcomes

| Scenario | Before | After |
|----------|--------|-------|
| Product with same slug across regions | Works correctly | Works correctly (no change) |
| Product with different regional slug | 404 error | Correct product page loaded |
| New product without verified slug | Might 404 | Primary slug used, background verification scheduled |
| Discontinued regional product | 404 error | Falls back to brand store homepage |

## Benefits

1. **Accuracy**: Verified slugs ensure users reach correct product pages
2. **Graceful Degradation**: Multiple fallback levels prevent broken experiences
3. **Self-Healing**: Background verification keeps data current
4. **Minimal Overhead**: Slug lookups are cached, verification runs asynchronously
5. **Scalable**: Works for any brand/region combination without hardcoding


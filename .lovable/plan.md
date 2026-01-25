
# Admin Tool for Broken Product URL Detection and Fixing

## Overview

This plan extends the existing URL validation system to provide better detection of 404 errors during live price checks and integrate URL issue reporting into the user-facing product pages. The project already has robust infrastructure for URL validation—this enhancement focuses on:

1. **Integrating 404 detection into the live price fetch workflow** (user-facing)
2. **Adding a "Report broken URL" feature** for end users
3. **Enhancing the existing admin Broken Link Monitor** with the specific Creality use case

## Technical Context

The project already has:
- **`validate-url` Edge Function**: HEAD request validation with caching
- **`validate-filament-urls` Edge Function**: Batch validation of filament product URLs
- **`fix-filament-url` Edge Function**: URL repair with brand-specific mappings and Shopify discovery
- **`test-url` Edge Function**: Admin URL testing with SSRF protection
- **`url_validation_results` table**: Tracks broken links with manual verification support
- **`url_validation_cache` table**: 24-hour cache for URL validation results
- **`AdminBrokenLinks` page**: Full admin dashboard with tabs for categories

---

## Implementation Tasks

### 1. Add Creality URL Mappings to fix-filament-url

Update the existing Edge Function to handle Creality-specific URL patterns.

**File**: `supabase/functions/fix-filament-url/index.ts`

Add Creality to the brand configs and URL mappings:

```typescript
// Add to ACCESSORY_URL_MAPPINGS or create FILAMENT_URL_MAPPINGS
"Creality": {
  "hyper-series-pla-carbon-fiber-3d-printing-filament": "hyper-pla-cf",
  "hyper-series-pla-3d-printing-filament": "hyper-pla",
  // Add more as discovered
}

// Add to BRAND_URL_PATTERNS for domain handling
"Creality": {
  pathTransform: (path: string) => {
    // Creality sometimes changes product slugs
    // Map old patterns to new
    return path.replace('hyper-series-', 'hyper-');
  }
}
```

### 2. Enhance Live Price Fetch to Detect 404s

Update the `useLivePriceFetch` hook to surface 404 detection to the UI.

**File**: `src/hooks/useLivePriceFetch.ts`

```typescript
// Add new state to track 404 errors
export interface LivePriceFetchResult {
  // ... existing fields
  urlStatus?: 'ok' | 'not_found' | 'error';
  errorMessage?: string;
}

// Update fetchLivePrice to detect and return 404 status
const is404Error = data?.error?.includes('404') || 
                   data?.error?.includes('HTTP 404') ||
                   data?.error?.includes('not found');

if (is404Error) {
  return {
    price: null,
    urlStatus: 'not_found',
    errorMessage: 'Product page not found - URL may have changed',
    // ... other fields
  };
}
```

### 3. Add "Report Broken URL" UI Component

Create a reusable component for reporting broken URLs.

**New File**: `src/components/price/BrokenUrlReport.tsx`

```text
┌─────────────────────────────────────────────────┐
│  ⚠️ Product page not found                      │
│                                                 │
│  The URL for this product may have changed.     │
│                                                 │
│  [Report Broken URL]  [Go to Store Homepage →]  │
└─────────────────────────────────────────────────┘
```

**Functionality**:
- Shows when live price fetch returns 404
- "Report Broken URL" button inserts into `url_validation_results` with status `broken`
- "Go to Store Homepage" provides fallback navigation
- Uses toast to confirm report submitted

### 4. Integrate 404 UI into FilamentHeroPurchaseCard

**File**: `src/components/filament/hero/FilamentHeroPurchaseCard.tsx`

Add conditional rendering after the price check:

```typescript
// When manual price check fails with 404
{manualPriceError && manualLivePrice?.urlStatus === 'not_found' && (
  <BrokenUrlReport
    entityType="filament"
    entityId={filamentId}
    urlField="product_url"
    currentUrl={productUrl}
    productName={vendor}
    onReported={() => toast.success("URL reported - thank you!")}
  />
)}
```

### 5. Create Backend Function for User URL Reports

**New File**: `supabase/functions/report-broken-url/index.ts`

Simple function that:
- Accepts `entity_type`, `entity_id`, `url_field`, `url`
- Upserts into `url_validation_results` with status `broken`
- Does NOT require authentication (allows anonymous reports)
- Rate-limits by IP to prevent abuse

```typescript
Deno.serve(async (req) => {
  const { entityType, entityId, urlField, url } = await req.json();
  
  // Upsert broken URL report
  await supabase.from('url_validation_results').upsert({
    entity_type: entityType,
    entity_id: entityId,
    url_field: urlField,
    url: url,
    status: 'broken',
    status_code: 404,
    checked_at: new Date().toISOString(),
    // Mark as user-reported for admin review
  }, { onConflict: 'entity_type,entity_id,url_field' });
  
  return new Response(JSON.stringify({ success: true }));
});
```

### 6. Add User Report Filter to Admin Dashboard

Update the existing BrokenLinkSection to show user-reported URLs prominently.

**File**: `src/components/admin/BrokenLinkSection.tsx`

Add a "User Reported" tab that filters to:
- Status = 'broken'
- Recently added (last 7 days)
- Not yet manually verified

This helps admins prioritize user-discovered issues.

---

## Workflow Summary

```text
User visits product page
         │
         ▼
┌─────────────────────────┐
│ "Check Current Price"   │
│  button clicked         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ get-current-price       │
│ Edge Function called    │
└───────────┬─────────────┘
            │
     ┌──────┴──────┐
     │             │
     ▼             ▼
┌─────────┐  ┌──────────────┐
│ Success │  │ 404 Error    │
│ (price) │  │ detected     │
└────┬────┘  └──────┬───────┘
     │              │
     ▼              ▼
┌─────────────┐  ┌─────────────────────┐
│ Show live   │  │ Show "URL not found"│
│ price       │  │ + Report button     │
└─────────────┘  └──────────┬──────────┘
                            │
                    User clicks "Report"
                            │
                            ▼
                 ┌─────────────────────┐
                 │ report-broken-url   │
                 │ Edge Function       │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ url_validation_     │
                 │ results table       │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ Admin reviews in    │
                 │ Broken Link Monitor │
                 │ → Uses fix-filament │
                 │ -url to repair      │
                 └─────────────────────┘
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/price/BrokenUrlReport.tsx` | UI for reporting/displaying 404 errors |
| `supabase/functions/report-broken-url/index.ts` | Backend for user URL reports |

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/fix-filament-url/index.ts` | Add Creality URL mappings |
| `src/hooks/useLivePriceFetch.ts` | Add 404 detection and status in return type |
| `src/components/filament/hero/FilamentHeroPurchaseCard.tsx` | Integrate BrokenUrlReport component |
| `src/components/admin/BrokenLinkSection.tsx` | Add "User Reported" filter tab |

---

## Database Changes

No new tables needed. The existing `url_validation_results` table already supports all required fields. May optionally add a `reported_by` column to distinguish user reports from automated scans, but this can be inferred from the absence of a `verified_by` value.

---

## Benefits

1. **Proactive detection**: Users encountering 404s can report them immediately
2. **Faster fixes**: Admin dashboard surfaces user-reported issues for quick triage
3. **Creality support**: Specific URL patterns handled automatically
4. **No duplicate work**: Leverages existing `fix-filament-url` infrastructure for repairs
5. **Graceful degradation**: Users see helpful fallback options when URLs fail

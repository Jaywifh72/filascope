
# Configurable Brand-Specific Price Extraction System

## Overview

This plan transforms the hardcoded price extraction logic in `get-current-price` into a database-driven, configurable system. The key insight is that the `automated_brands` table **already has** the infrastructure for brand scraping configs (including `price_selectors`, `platform_type`, `default_currency`, success/failure tracking) - but the Edge Function doesn't use it yet.

## Current State Analysis

### What Already Exists

| Component | Description |
|-----------|-------------|
| `automated_brands` table | Contains 60+ brands with `price_selectors`, `platform_type`, `base_url`, `default_currency` columns |
| `brand_scraper_profiles` table | Brand-specific extraction rules (color, material patterns, etc.) |
| `scrape_job_logs` table | Logs scrape operations with levels and metadata |
| `get-current-price` Edge Function | 940 lines with 4 hardcoded extractors (Creality, Bambu Lab, OpenCart, Prusa) |

### The Problem

The Edge Function ignores the `automated_brands` config and relies on:
1. `detectCustomStorefront(url)` - Hardcoded domain matching
2. `extractCrealityPrice()`, `extractBambuLabPrice()`, etc. - Hardcoded per-brand logic
3. `shouldAlwaysUseFirecrawl()` - Hardcoded domain list

---

## Implementation Strategy

We will extend the existing `automated_brands` table with additional price extraction fields rather than creating a separate `brand_scraping_configs` table. This avoids data duplication and maintains the single source of truth.

### Phase 1: Database Schema Extension

Add new columns to `automated_brands` for configurable extraction:

```sql
ALTER TABLE automated_brands ADD COLUMN IF NOT EXISTS extraction_method text DEFAULT 'auto';
-- Values: 'shopify_json', 'firecrawl', 'custom', 'auto'

ALTER TABLE automated_brands ADD COLUMN IF NOT EXISTS price_extraction_config jsonb DEFAULT '{}'::jsonb;
-- Structure:
-- {
--   "priceSectionAnchor": "Add to Cart|Buy Now",
--   "pricePatterns": ["\\$([\\d,]+(?:\\.\\d{2})?)\\s*CAD"],
--   "excludePatterns": ["coupon|bundle|pack of \\d{2,}"],
--   "priceRangeMin": 3,
--   "priceRangeMax": 150,
--   "currencyDetection": "url|content|fixed:USD"
-- }

ALTER TABLE automated_brands ADD COLUMN IF NOT EXISTS test_product_url text;
ALTER TABLE automated_brands ADD COLUMN IF NOT EXISTS last_extraction_test_at timestamptz;
ALTER TABLE automated_brands ADD COLUMN IF NOT EXISTS extraction_working boolean DEFAULT true;
ALTER TABLE automated_brands ADD COLUMN IF NOT EXISTS extraction_success_rate numeric(5,2);
```

### Phase 2: Create Extraction Logging Table

Track individual extraction attempts for monitoring:

```sql
CREATE TABLE price_extraction_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES automated_brands(id),
  product_url text NOT NULL,
  extraction_method text NOT NULL,
  success boolean NOT NULL,
  extracted_price numeric,
  error_message text,
  raw_content_sample text, -- First 500 chars for debugging
  response_time_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Index for brand success rate queries
CREATE INDEX idx_extraction_logs_brand_success 
ON price_extraction_logs (brand_id, success, created_at DESC);
```

### Phase 3: Update get-current-price Edge Function

Refactor to use database config with fallback to legacy logic:

```text
                   ┌─────────────────────────────┐
                   │   get-current-price called  │
                   └─────────────┬───────────────┘
                                 │
                                 ▼
                   ┌─────────────────────────────┐
                   │ Extract domain from URL     │
                   │ Query automated_brands      │
                   └─────────────┬───────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
     ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
     │ Config found   │ │ No config      │ │ Config says    │
     │ extraction_    │ │ Fall back to   │ │ extraction_    │
     │ method set     │ │ legacy logic   │ │ working=false  │
     └───────┬────────┘ └───────┬────────┘ └───────┬────────┘
             │                  │                  │
             ▼                  ▼                  ▼
     ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
     │ Use configured │ │ detectCustom   │ │ Return early   │
     │ method +       │ │ Storefront()   │ │ with error     │
     │ patterns       │ │ (existing)     │ │ "Brand has     │
     └───────┬────────┘ └────────────────┘ │ extraction     │
             │                             │ issues"        │
             ▼                             └────────────────┘
     ┌────────────────┐
     │ Log to         │
     │ extraction_logs│
     └────────────────┘
```

Key changes to the function:
1. Query `automated_brands` by domain at request start
2. If config exists and `extraction_method` is set, use it
3. Apply `price_extraction_config` patterns for Firecrawl results
4. Log all extraction attempts to `price_extraction_logs`
5. Fall back to legacy hardcoded logic for unconfigured brands

### Phase 4: Create Admin UI Component

New file: `src/components/admin/BrandExtractionConfig.tsx`

```text
┌──────────────────────────────────────────────────────────────────┐
│ 🔧 Brand Price Extraction Config                                 │
├──────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🔍 Filter: [__________]  Status: [All ▼]  Method: [All ▼]  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Brand          │ Method    │ Success │ Last Test │ Status  │  │
│ ├────────────────┼───────────┼─────────┼───────────┼─────────┤  │
│ │ Bambu Lab      │ firecrawl │ 94.2%   │ 2h ago    │ ✅      │  │
│ │ Creality       │ firecrawl │ 87.1%   │ 4h ago    │ ⚠️      │  │
│ │ Prusa          │ firecrawl │ 98.0%   │ 1h ago    │ ✅      │  │
│ │ Polymaker      │ shopify   │ 99.1%   │ 30m ago   │ ✅      │  │
│ │ GEEETECH       │ firecrawl │ 72.3%   │ 12h ago   │ ❌      │  │
│ └────────────────┴───────────┴─────────┴───────────┴─────────┘  │
│                                                                  │
│ [Test All Configs]  [Export Report]                              │
└──────────────────────────────────────────────────────────────────┘
```

Clicking a row opens the config editor:

```text
┌──────────────────────────────────────────────────────────────────┐
│ Configure: Creality                                              │
├──────────────────────────────────────────────────────────────────┤
│ Extraction Method: [Firecrawl ▼]                                 │
│                                                                  │
│ ┌─ Price Patterns ───────────────────────────────────────────┐  │
│ │ Anchor Text: [Add to Cart|Buy Now       ]                  │  │
│ │ Price Regex: [\$(\d+(?:\.\d{2})?)        ]                 │  │
│ │ Exclude:     [coupon|bundle              ]                 │  │
│ │ Range:       [$3] to [$150]                                │  │
│ │ Currency:    [Fixed: USD ▼]                                │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ Test URL: [https://store.creality.com/products/hyper-pla    ]    │
│           [🧪 Test Extraction]                                   │
│                                                                  │
│ ┌─ Test Result ──────────────────────────────────────────────┐  │
│ │ ✅ Price: $18.99 USD                                       │  │
│ │ ⏱️ Response: 1.2s                                          │  │
│ │ 📍 Source: Firecrawl → Pattern Match                       │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ [Cancel]  [Save Configuration]                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Phase 5: Create Test Extraction Edge Function

New function: `supabase/functions/test-price-extraction/index.ts`

Purpose: Allow admins to test extraction config without affecting production.

```typescript
// Input
{ 
  brandId?: string,      // Test specific brand
  productUrl: string,    // URL to test
  config?: {...}         // Optional override config for testing
}

// Output
{
  success: boolean,
  price: number | null,
  method: 'shopify_json' | 'firecrawl' | 'custom',
  matchedPattern: string | null,
  rawSample: string,     // First 500 chars of content
  responseTimeMs: number,
  error?: string
}
```

### Phase 6: Success Rate Monitoring Dashboard

Add to the BrandExtractionConfig component:

```text
┌─ Extraction Health Overview ─────────────────────────────────────┐
│                                                                  │
│ Last 24 Hours                                                    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ Total Attempts: 1,247                                            │
│ Success Rate:   92.4%                                            │
│                                                                  │
│ ┌─ Brands Below 80% Threshold ────────────────────────────────┐ │
│ │ ⚠️ GEEETECH      72.3%   [View Logs] [Edit Config]          │ │
│ │ ⚠️ Creality      78.9%   [View Logs] [Edit Config]          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ [Run Health Check on All Brands]                                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/AdminBrandExtraction.tsx` | Admin page wrapper |
| `src/components/admin/BrandExtractionConfig.tsx` | Main config UI |
| `src/components/admin/BrandExtractionEditor.tsx` | Single brand editor dialog |
| `src/components/admin/ExtractionHealthOverview.tsx` | Success rate dashboard |
| `supabase/functions/test-price-extraction/index.ts` | Test extraction endpoint |

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/get-current-price/index.ts` | Query brand config, use patterns, log results |
| `src/App.tsx` | Add route for `/admin/brand-extraction` |
| `src/components/admin/AdminSidebar.tsx` | Add "Price Extraction" to Data Quality group |

---

## Migration Strategy

1. **Add columns** to `automated_brands` (non-breaking)
2. **Create logging table** `price_extraction_logs`
3. **Update Edge Function** with config lookup + logging (maintains legacy fallback)
4. **Seed configs** for known brands (Creality, Bambu Lab, GEEETECH, Prusa)
5. **Deploy admin UI** for monitoring and editing

The legacy hardcoded extraction logic remains as fallback, ensuring zero disruption during rollout.

---

## Technical Benefits

1. **Database-Driven**: Add new brands without code changes
2. **Testable**: Admin can test configs before saving
3. **Observable**: Extraction logs enable debugging and success rate tracking
4. **Maintainable**: Centralized config vs. scattered hardcoded functions
5. **Scalable**: Works for 60+ brands without Edge Function bloat

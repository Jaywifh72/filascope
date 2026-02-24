

# Creality Regional Pricing Fix Strategy

## Problem Summary

Creality's store (`store.creality.com`) uses path-based regional routing (e.g., `/ca/products/...`, `/eu/products/...`) but operates on a custom frontend that **blocks Shopify `.json` endpoints**. Currently, only US prices sync because no regional store URLs or templates are configured.

The underlying Shopify stores are accessible via `*.myshopify.com` domains, which can be used for handle discovery. JSON-LD structured data on the custom storefront pages works correctly for price extraction.

## Current State (from database investigation)

- `brand_sync_config` for Creality: `primary_extraction: json_ld`, `shopify_json_available: false`, all `store_url_*` fields are `null`
- No `brand_regional_stores` entries exist for Creality
- All Creality printers have `null` for `product_url_ca/uk/eu/au/jp`
- Only US prices are syncing (via JSON-LD from `store.creality.com/products/{handle}`)

## Implementation Plan

### Phase 1: Configure Regional Store URL Templates

**Update `brand_sync_config`** to add regional URL templates for Creality. Since Creality uses path-based routing with the same domain, the templates use the pattern `https://store.creality.com/{region}/products/{slug}`.

```text
store_url_ca: https://store.creality.com/ca/products/{slug}
store_url_uk: https://store.creality.com/uk/products/{slug}
store_url_eu: https://store.creality.com/eu/products/{slug}
store_url_au: https://store.creality.com/au/products/{slug}
store_url_jp: https://store.creality.com/jp/products/{slug}
```

This alone will cause the sync engine to attempt all 6 regions for each Creality printer, using JSON-LD extraction (the configured primary method).

### Phase 2: Handle Discovery via myshopify.com Backends

The critical problem: Creality uses **different product handles** across regional stores. The US handle `k2-combo-3d-printer` may not exist at `/ca/products/k2-combo-3d-printer`.

**Add a Creality-specific handle discovery mechanism** to `printer-price-extraction.ts`:

1. When JSON-LD extraction fails (404 or no price found) for a Creality regional URL, trigger handle discovery
2. Fetch the regional catalog from the corresponding myshopify.com backend:
   - US: `crealityusa.myshopify.com`
   - CA: `crealityca.myshopify.com`
   - UK: `crealityuk.myshopify.com`
   - EU: `crealityeu.myshopify.com`
   - AU: `crealityau.myshopify.com`
3. Search by normalized product title to find the regional handle
4. Build the corrected URL and retry JSON-LD extraction
5. Cache the discovered handle in `product_regional_slugs`

**Implementation approach**: Extend the existing `discoverHandleFromCatalog` function (or add a parallel `discoverCrealityHandle` function) that uses the myshopify.com domain instead of the store's own `/products.json` endpoint (which is blocked).

### Phase 3: Update the Extraction Orchestrator

In the `extractPrice` orchestrator function, add logic so that when:

1. The brand is Creality (detected via config or URL domain)
2. JSON-LD extraction fails for a regional URL
3. The system attempts handle discovery via myshopify.com
4. If a new handle is found, rebuilds the URL and retries JSON-LD
5. If no handle is found, marks as `not_in_region`

This fits naturally into the existing tier system -- it's essentially a "retry with corrected URL" step between Tier 2 (JSON-LD) and Tier 3 (meta tags).

### Phase 4: Store myshopify.com Domain Mapping

Add a new field or lookup for the myshopify.com discovery backends. Two options:

**Option A (simpler)**: Add a `discovery_store_url` field to `brand_sync_config`:
```text
discovery_store_url: crealityusa.myshopify.com
```
Plus a mapping for regional variants embedded in the sync function.

**Option B (database-driven)**: Create `brand_regional_stores` entries for Creality with the myshopify.com domains stored in a metadata field, keeping the primary URLs as `store.creality.com/{region}/...`.

Recommendation: **Option A** -- hardcode the myshopify.com mapping in the extraction function since it's Creality-specific and unlikely to change.

### Phase 5: Variant Selection for Creality

Creality product pages may list multiple offers in JSON-LD (e.g., the K2 page shows both `$599 CAD OutOfStock` and `$799 CAD InStock` for standalone vs. combo). The existing `extractFromJsonLd` function handles `offers` arrays, but currently takes the first offer's price.

Update the JSON-LD extraction to:
1. When multiple offers exist, apply the same combo-exclusion logic used for Shopify JSON variants
2. Prefer InStock offers over OutOfStock
3. Select the cheapest non-combo, in-stock variant

## Technical Details

### Files to modify:

1. **`supabase/functions/_shared/printer-price-extraction.ts`**
   - Add `discoverCrealityRegionalHandle()` function that fetches from myshopify.com
   - Update `extractPrice()` orchestrator to retry with discovered handle on Creality 404s
   - Update `extractFromJsonLd()` to handle multiple offers with availability filtering
   - Add myshopify.com domain mapping constant

2. **`supabase/functions/sync-printer-prices/index.ts`**
   - No structural changes needed -- once `brand_sync_config` has regional URL templates, the existing region loop will attempt all regions automatically

3. **Database migration**
   - Update `brand_sync_config` for Creality to populate `store_url_ca/uk/eu/au/jp`
   - Optionally create `brand_regional_stores` entries for Creality with `is_active: true` for CA/UK/EU/AU and metadata for JP (needs verification)

### Myshopify.com domain mapping:

```text
Region  myshopify.com domain
US      crealityusa.myshopify.com
CA      crealityca.myshopify.com
UK      crealityuk.myshopify.com
EU      crealityeu.myshopify.com
AU      crealityau.myshopify.com
JP      (needs discovery -- may not exist)
```

### Extraction flow for Creality regional pricing:

```text
1. Build URL: store.creality.com/{region}/products/{us-handle}
2. Check slug cache (product_regional_slugs) for known regional handle
   - If cached: use cached handle instead
3. Fetch HTML from regional URL
4. Try JSON-LD extraction
   - Success: return price, cache handle
   - 404 or no price:
5. Discover handle via crealityXX.myshopify.com/products.json
   - Match by normalized product title
   - If found: rebuild URL with discovered handle, retry JSON-LD
   - If not found: mark as not_in_region
6. Cache discovered handle in product_regional_slugs
```

### JSON-LD multi-offer handling:

When Creality JSON-LD contains multiple offers like:
```text
offers: [
  { price: 599, currency: "CAD", availability: "OutOfStock" },
  { price: 799, currency: "CAD", availability: "InStock" }
]
```

The extraction should:
- Filter to InStock offers first
- Among InStock offers, exclude those with combo/bundle keywords in the name
- Select the cheapest remaining offer
- If all are OutOfStock, still extract the cheapest price but flag `requires_review`

### Expected outcome after implementation:
- All 6 regions sync for Creality printers (where products exist)
- Handle differences are automatically discovered and cached
- Products not available in a region show "N/A" (not "Failed")
- JSON-LD provides accurate regional prices with correct currencies


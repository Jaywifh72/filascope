

# Fix Regional Price Sync System

## Problem Summary

Regional store rows (CA, UK, EU, AU) are invisible or non-functional because the database columns (`product_url_ca`, `product_url_uk`, etc.) are NULL for most multi-region brands. This cascades into three failures:

1. **No store rows created** -- line 506 skips regions where both URL and price are NULL
2. **No action buttons** -- lines 1463, 1481, 1497 gate Sync/Test/Link buttons behind `store.productUrl`
3. **Batch operations silently skip** -- `testBatch` (line 786) does `if (!s.productUrl) continue`

The edge function routing (Phases 3 in your request) is already correctly implemented with `shouldAlwaysUseFirecrawl` including Bambu Lab and the geo-redirect Firecrawl-first bypass.

## Solution

### Phase 1: Client-side URL derivation in PricingData.tsx

Add a `BRAND_REGIONAL_CONFIGS` map mirroring the edge function's `REGIONAL_STORE_CONFIGS`. When constructing store rows (line 488 loop), if a region's URL column is NULL but the US URL exists, derive the regional URL using subdomain transformation.

**New config (added near line 120):**
```typescript
const BRAND_REGIONAL_CONFIGS: Record<string, {
  pattern: 'subdomain';
  baseDomain: string;
  regions: Record<string, { subdomain?: string; domain?: string }>;
}> = {
  'Bambu Lab':    { pattern: 'subdomain', baseDomain: 'store.bambulab.com', regions: { CA: { subdomain: 'ca' }, UK: { subdomain: 'uk' }, EU: { subdomain: 'eu' }, AU: { subdomain: 'au' }, JP: { subdomain: 'jp' } } },
  'Polymaker':    { pattern: 'subdomain', baseDomain: 'polymaker.com', regions: { CA: { subdomain: 'ca' }, EU: { subdomain: 'eu' } } },
  'Elegoo':       { pattern: 'subdomain', baseDomain: 'elegoo.com', regions: { CA: { subdomain: 'ca' }, UK: { subdomain: 'uk' }, EU: { subdomain: 'eu' }, AU: { subdomain: 'au' } } },
  'Anycubic':     { pattern: 'subdomain', baseDomain: 'anycubic.com', regions: { CA: { subdomain: 'ca' }, UK: { subdomain: 'uk' }, EU: { subdomain: 'eu' }, AU: { domain: 'www.anycubic.au' } } },
};
```

**New derivation function:**
```typescript
function deriveRegionalUrl(usUrl: string, vendor: string, region: string): string | null {
  const config = BRAND_REGIONAL_CONFIGS[vendor];
  if (!config || !config.regions[region]) return null;
  try {
    const urlObj = new URL(usUrl);
    const regionConfig = config.regions[region];
    if (regionConfig.domain) {
      urlObj.hostname = regionConfig.domain;
    } else if (regionConfig.subdomain) {
      const parts = urlObj.hostname.split('.');
      if (parts.length >= 3) parts[0] = regionConfig.subdomain;
      else parts.unshift(regionConfig.subdomain);
      urlObj.hostname = parts.join('.');
    }
    return urlObj.toString().replace(/[?#].*$/, '');
  } catch { return null; }
}
```

**Modify the store row loop (line 488-535):**

- Track the US URL from the first iteration
- When `url` is NULL for a non-US region, attempt `deriveRegionalUrl(usUrl, vendor, region)`
- Remove the `if (!url && price == null) continue;` guard -- instead, only skip if there's no URL (database or derived) AND no price
- Add `isDerived?: boolean` to `StoreRow` interface to flag derived URLs

### Phase 2: Fix batch operations

**testBatch (line 786):** Replace silent skip with a count of skipped stores. After the loop, if any were skipped, show a toast: "X stores skipped (no URL available)".

**syncSinglePrice (line 821):** Already correctly early-returns for null URLs. With Phase 1 providing derived URLs, this will now work for all stores.

### Phase 3: UI for derived URLs

- Action buttons (lines 1462-1504): Already gated on `store.productUrl` -- with derived URLs populating this field, buttons will appear automatically
- Add a small "derived" badge (italic link icon or `🔗` next to the hostname tooltip) when `store.isDerived` is true, so admins know the URL was computed, not stored in the database
- Add a "Generate Regional URLs" button in the toolbar that calls `populate-regional-urls` to permanently write derived URLs to the database

### Phase 4: Edge function -- already done

The geo-redirect bypass and Bambu Lab Firecrawl-first routing are already correctly implemented:
- `shouldAlwaysUseFirecrawl` includes `store.bambulab.com` (line 1669)
- Geo-redirect + non-USD check at line 2597
- `transformToRegionalUrl` handles subdomain swapping (line 150)

No edge function changes needed.

## Technical Details

### Files Modified

1. **`src/pages/admin/PricingData.tsx`**
   - Add `isDerived?: boolean` to `StoreRow` interface (line 66)
   - Add `BRAND_REGIONAL_CONFIGS` constant (after line 120)
   - Add `deriveRegionalUrl()` function
   - Modify store row construction loop (lines 488-535): derive URLs when database column is NULL
   - Remove strict skip guard (line 506): allow rows with derived URLs
   - Update `testBatch` (line 786): count and report skipped stores instead of silent skip
   - Add derived URL indicator in store row tooltip (line 1404)
   - Add "Generate Regional URLs" button in toolbar

### No Database or Edge Function Changes

All changes are frontend-only. The edge function already handles URL transformation server-side via `transformToRegionalUrl`, so even if the client passes a US URL with a CAD currency, the edge function will transform it. However, deriving the correct regional URL client-side is preferable because:
- The admin sees the actual URL that will be fetched
- Test link calls go to the correct regional domain
- External link opens the correct regional store

### Expected Result

Before: Expanding "Bambu Lab ABS" shows 1 US row with action buttons, other regions missing.
After: Expanding shows US + CA + UK + EU + AU + JP rows, all with Sync/Test/Link buttons. Derived URLs shown with a `🔗` indicator. Batch "Test Selected (6)" tests all 6 regions.

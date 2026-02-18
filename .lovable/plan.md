
## Creality Regional Slug Discovery Fallback

### Problem

When syncing prices for non-US Creality regions (CA, UK, AU, EU), the system uses the same product slug as the US store. For example, `store.creality.com/products/hyper-series-pla-3d-printing-filament-1kg` becomes `store.creality.com/ca/products/hyper-series-pla-3d-printing-filament-1kg`. Creality's regional stores sometimes use a shorter slug (e.g., `hyper-series-pla`) or don't carry the product at all. This currently results in false 404s or soft-404s, causing syncs to mark valid products as unavailable.

### Solution Overview

Two-layer fix:

1. **Edge Function**: When a 404 or soft-404 is detected, try a series of slug variants before giving up. If a working slug is found, cache it in the existing `product_regional_slugs` table and return the price. If no slug works, return `notAvailableInRegion: true`.

2. **Edge Function**: Pass the `filamentId` from the caller so the function can query and write slug cache entries.

3. **PricingData.tsx**: Pass `filamentId` (the `representativeId`) alongside the existing sync body so the edge function can use it for slug caching.

---

### Technical Details

#### Change 1 — Pass `filamentId` in the sync invocation (PricingData.tsx)

In the `syncSingleStore` function at line ~1168, the edge function is called without a `filamentId`:

```ts
body: { productUrl: store.productUrl, currency: store.currency, forceRefresh: true, ... }
```

Add `filamentId: store.representativeId` to the body. The edge function's `serve` handler already accepts loose JSON, so no schema change is needed.

#### Change 2 — Accept `filamentId` in the edge function serve handler

In the `serve` handler (line ~3054), destructure `filamentId` from the request body alongside the existing fields.

#### Change 3 — New `attemptCrealitySlugDiscovery` helper function (edge function)

Add a new pure async function above `fetchCrealityPriceDirect` that implements the slug-variant trial loop:

```
function attemptCrealitySlugDiscovery(
  baseUrl: string,            // e.g. "https://store.creality.com/ca"
  originalSlug: string,       // e.g. "hyper-series-pla-3d-printing-filament-1kg"
  expectedCurrency: string,
  filamentId: string | null,
  regionCode: string,
): Promise<PriceResponse | null>
```

**Slug variant generation logic** (deterministic, no external calls):

1. Start with the raw slug from the URL path.
2. Strip weight/diameter suffixes: `-1kg`, `-1-75mm`, `-175mm`, `-500g`, `-3kg`.
3. Strip the trailing `-3d-printing-filament` phrase (and variants like `-3d-printing-filament-1kg`).
4. Add/remove the `creality-` prefix.
5. Combine the above to produce a small set of unique candidates (typically 4–8).
6. Always include the original slug first (already tried — skip it) and attempt others in order.

For each candidate slug, call a simplified inner fetch:

```ts
const testUrl = `${baseUrl}/products/${candidateSlug}`;
const response = await fetch(testUrl, { headers: browserHeaders, redirect: 'follow' });
```

- If HTTP 404 → skip.
- If HTTP 200 + soft-404 HTML → skip.
- If HTTP 200 + valid JSON-LD → success! Extract price and proceed to cache the slug.

**Slug caching** — on a successful discovery, upsert into `product_regional_slugs`:

```sql
INSERT INTO product_regional_slugs (filament_id, region_code, slug, verified, http_status, verified_at)
VALUES ($filamentId, $regionCode, $discoveredSlug, true, 200, now())
ON CONFLICT (filament_id, region_code) DO UPDATE
  SET slug = EXCLUDED.slug, verified = true, http_status = 200, verified_at = now(), updated_at = now();
```

The Supabase admin client (service role key from `SUPABASE_SERVICE_ROLE_KEY`) will be used for this write since edge functions run server-side.

**Slug cache lookup** — before the discovery loop, also check the `product_regional_slugs` table first (if `filamentId` is known). If a previously-verified slug is cached, attempt that URL before trying variants. This prevents re-running discovery on every sync once a slug has been found.

#### Change 4 — Wire discovery into `fetchCrealityPriceDirect`

Currently the function returns `notAvailableInRegion: true` immediately on a 404 or soft-404. Replace those early-return points with a call to `attemptCrealitySlugDiscovery`. Only if discovery also fails does the function return `notAvailableInRegion: true`.

The function signature gets two new optional parameters:

```ts
async function fetchCrealityPriceDirect(
  productUrl: string,
  expectedCurrency: string,
  filamentId?: string | null,   // new
  regionCode?: string | null,   // new
): Promise<PriceResponse>
```

`regionCode` is derived in the serve handler from the `currency` field (USD→US, CAD→CA, GBP→UK, EUR→EU, AUD→AU, JPY→JP) — the same mapping already exists in `update_filament_price_after_refresh`.

#### Change 5 — Pass new args at the call sites

In the serve handler, where `fetchCrealityPriceDirect(urlToFetch, expectedCurrency)` is called (two places around lines 3133 and 3143), pass the `filamentId` and derived `regionCode`.

---

### Data Flow (end-to-end)

```text
PricingData sync click
  → invoke get-current-price { productUrl, currency, filamentId, ... }
  → transformToRegionalUrl: /products/slug → /ca/products/slug
  → detectCustomStorefront → 'creality'
  → fetchCrealityPriceDirect(url, 'CAD', filamentId, 'CA')
    → fetch /ca/products/slug → HTTP 404 or soft-404
    → [NEW] attemptCrealitySlugDiscovery(baseUrl, slug, 'CAD', filamentId, 'CA')
      → check product_regional_slugs for cached slug → try it first if found
      → generate variants: slug without -1kg, without -3d-printing-filament, etc.
      → fetch each variant until one returns valid JSON-LD
      → if found: upsert into product_regional_slugs, return price
      → if not found: return { notAvailableInRegion: true }
  → PricingData UI shows ⊘ N/A  OR  price synced successfully
```

---

### Files Changed

| File | Change |
|---|---|
| `supabase/functions/get-current-price/index.ts` | Add `attemptCrealitySlugDiscovery`, update `fetchCrealityPriceDirect` signature + internal logic, accept `filamentId` in serve handler |
| `src/pages/admin/PricingData.tsx` | Add `filamentId: store.representativeId` to the sync invocation body |

No database migrations are needed — the `product_regional_slugs` table already exists with the right schema (`filament_id`, `region_code`, `slug`, `verified`, `http_status`, `verified_at`, `updated_at`).

---

### Edge Cases & Constraints

- **No `filamentId` available**: Discovery still runs (variants are tried), but no slug is cached afterward. Future syncs will re-run discovery. This is safe and acceptable.
- **Discovery adds a small delay**: Each variant attempt is a network fetch (~200–500ms). With ~4–8 variants, worst-case adds 1–4 seconds if all fail. Timeouts on individual attempts are set to 5s.
- **Race conditions on cache write**: The upsert uses `ON CONFLICT DO UPDATE` so concurrent writes are safe.
- **Slug cache lookup**: Only queries the DB if `filamentId` is provided; gracefully skips otherwise.
- **`product_regional_slugs` unique constraint**: Assumed to be `(filament_id, region_code)` — consistent with the existing `verify-regional-slugs` function usage seen in memory notes.

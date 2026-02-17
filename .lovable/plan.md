

# Add Intelligent Product Search Fallback to Smart URL Validator

## Summary

Add a multi-strategy product search fallback (Step 4b) to `smart-url-validator` that kicks in when slug variant checking fails. Three strategies are tried in order: Shopify catalog search, Shopify search suggest API, and HTML site search.

## Changes

### File: `supabase/functions/smart-url-validator/index.ts`

#### 1. Add `extractSearchTerms` helper (after `followRedirects`, ~line 165)

- Takes a product handle like `petg-translucent-3d-printer-filament-1kg`
- Splits by hyphens, removes generic suffixes: `filament`, `3d`, `printer`, `1kg`, `2kg`, `500g`, `1-75mm`, `2-85mm`, `printing`
- Smart material handling: only removes material words (pla, abs, petg, etc.) if they appear at the end, not if they are the primary identifier
- Returns `{ searchTerms: string, broadTerms: string }` -- broadTerms is a shorter fallback (material + key descriptor)

#### 2. Add `fuzzyProductMatch` helper

- Parameters: `(searchTerms: string, productTitle: string, originalHandle: string) => number`
- Normalizes both strings (lowercase, strip special chars)
- Scoring: word overlap (each shared word = 0.2, capped at 1.0), sequential word match bonus (+0.15), handle substring match (+0.1)
- Returns confidence score 0-1

#### 3. Add `searchStoreProducts` async function

Implements three strategies with a combined 20-second timeout guard:

**Strategy A -- Shopify `/products.json`:**
- Derives base URL from broken URL (e.g., `https://ca.anycubic.com`)
- Fetches `{baseUrl}/products.json?limit=250`, paginating up to 3 pages
- Fuzzy-matches each product's title against search terms using `fuzzyProductMatch`
- Also scores handle similarity to the original handle
- Best match with score >= 0.6 produces a candidate URL `{baseUrl}/products/{handle}`
- Validates candidate with `checkUrl()` before returning

**Strategy B -- Shopify search suggest:**
- Fetches `{baseUrl}/search/suggest.json?q={searchTerms}&resources[type]=product&resources[limit]=10`
- Parses suggestion results, checks each product URL with `checkUrl()`
- Returns first valid match

**Strategy C -- HTML site search:**
- Fetches `{baseUrl}/search?q={searchTerms}&type=product`
- Extracts product URLs via regex `/\/products\/([a-z0-9-]+)/g`
- Filters to relevant URLs (containing keywords from original product name)
- Checks up to 5 candidates with `checkUrl()`

All strategies use:
- 8-second per-fetch timeout
- `User-Agent: FilaScope URLValidator/2.0`
- 300ms delay between requests
- Graceful error handling (move to next strategy on failure)

Returns: `{ url, source, confidence, validated, searchQuery, candidatesFound } | null`

#### 4. Integrate into `diagnoseUrl` (after line ~301, before "No fix found")

After the existing slug variant loop and brand-specific domain fixes, call `searchStoreProducts(url, handle, region, brandName)`. If it returns a result, populate `suggested_url`, `suggestion_source`, `suggestion_confidence`, `suggestion_validated`, and add `search_method`, `search_query`, `candidates_found`, `match_score` to `diagnosis_details`.

#### 5. Handle unknown brands with Shopify-like URLs (after line ~303, before "No fix found")

If `identifyBrand()` returned null but the URL contains `/products/`, extract the handle and base URL manually, then call `searchStoreProducts()`. This ensures stores not in `BRAND_PATTERNS` still benefit from catalog search.

#### 6. Update `DiagnosisResult.diagnosis_details` documentation

The `diagnosis_details` record gains four optional keys: `search_method`, `search_query`, `candidates_found`, `match_score`. No interface change needed since it's already `Record<string, unknown>`.

## What stays unchanged

- All existing `BRAND_PATTERNS` definitions
- Slug variant logic (Steps 1-4)
- `scan` and `apply` action handlers
- `checkUrl`, `followRedirects`, `identifyBrand` functions

## Flow diagram

```text
Step 4: URL is 404/410
  |
  v
Brand identified? --yes--> Try slug variants
  |                           |
  no                     Found? --yes--> return
  |                           |
  |                          no
  |                           |
  |                     Brand domain fixes
  |                           |
  |                      Found? --yes--> return
  |                           |
  |                          no
  |                           v
  |<-------- URL has /products/? ------+
  |                                    |
  v                                    v
  Step 4b: searchStoreProducts()       skip
    |
    Strategy A: /products.json
    Strategy B: /search/suggest.json
    Strategy C: /search HTML
    |
    Found? --yes--> return with suggestion
    |
    no --> return "Could not auto-discover"
```


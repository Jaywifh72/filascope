

# Intelligent Search Resolution for Diagnosis Dialog and SmartUrlValidator

## Summary

Add search-and-fix capabilities to two admin UI components: the Sync Failure Diagnosis dialog in PricingData.tsx and the SmartUrlValidator repair queue. Admins can trigger intelligent store searches (individually or in bulk) for broken links and apply discovered fixes directly.

## Database

No changes needed -- `suggestion_source` column already exists in `url_repair_queue`.

## Changes

### File 1: `src/pages/admin/PricingData.tsx`

**New state variables** (near line ~500):
- `searchResults: Record<string, { loading: boolean; url?: string; confidence?: number; method?: string; query?: string; error?: boolean }>` -- per-product search state keyed by URL
- `bulkSearchProgress: { running: boolean; done: number; total: number; found: number } | null`

**Helper: `parseAffectedProduct`** -- extracts URL, region, and product name from `contextualPromptParts.failureDetails` entries (which already have structured `url`, `region`, `product`, `brand` fields)

**Helper: `REGION_URL_COLUMN_MAP`** -- maps region codes to filament table columns: `{ US: 'product_url', CA: 'product_url_ca', UK: 'product_url_uk', EU: 'product_url_eu', AU: 'product_url_au', JP: 'product_url_jp' }`

**Per-product "Search Store" button** (modify lines ~1777-1781 in the Collapsible affected products list):
- For diagnosis cards where `d.pattern` contains "404" or "Broken link", replace the plain `<p>` text with a row containing:
  - The existing product text (font-mono, text-[10px])
  - A compact "Search Store" button (size="sm", h-6) with Search icon
  - When clicked: call `supabase.functions.invoke('smart-url-validator', { body: { action: 'diagnose', url, region } })` using the URL and region from `contextualPromptParts.failureDetails[j]`
  - While loading: show Loader2 spinner
  - On success with `suggested_url`: show green CheckCircle2 + truncated URL + confidence badge + method label + ExternalLink icon to open URL + "Apply Fix" button
  - On success without match: show amber AlertTriangle + "No match" + "Manual Search" button (opens `{baseUrl}/search?q={searchTerms}`)
  - "Apply Fix": updates the correct `product_url_{region}` column in filaments table, then invalidates `['pricing-data']`

**"Search All Broken" bulk button** (add at line ~1755, inside the diagnosis card's button row, after "Copy Lovable Prompt"):
- Only shown on diagnosis cards where `d.pattern` includes "404" or "Broken link" AND `contextualPromptParts` exists
- Label: "Search All Broken" with Search icon
- On click: iterates through `d.contextualPromptParts.failureDetails` sequentially with 1-second delay
- Updates `bulkSearchProgress` state for progress display ("Searching 3/12...")
- After completion: shows summary toast ("Found fixes for 8/12 products")
- Populates `searchResults` map for inline display

**"Apply All Found Fixes" button** (appears after bulk search when fixes found):
- Only visible when `searchResults` has entries with valid URLs
- Label: "Apply {n} fixes" with Wrench icon
- Iterates through found fixes, updates each filament's regional URL column
- Shows progress toast and completion confirmation
- Invalidates `['pricing-data']` query key

### File 2: `src/components/admin/inventory/sync-status/SmartUrlValidator.tsx`

**New state** (near line ~48):
- `deepSearching: Record<string, boolean>` -- tracks per-item deep search loading state

**"Deep Search" button in Fix column** (modify lines ~380-382):
- When `item.suggested_url` is null AND `item.status === 'pending'`, show a "Deep Search" button (size="sm", h-6) next to "No fix found"
- On click: call `supabase.functions.invoke('smart-url-validator', { body: { action: 'diagnose', url: item.original_url, region: item.region } })`
- On success with match: update the repair queue row via `supabase.from('url_repair_queue').update(...)` with `suggested_url`, `suggestion_source`, `suggestion_confidence`, `suggestion_validated`, then invalidate `['url-repair-queue']`
- On failure: toast error
- While loading: show Loader2 spinner

**Search method badges in Fix column** (modify lines ~366-379):
- When `item.suggested_url` exists, add a Badge before the URL link:
  - Map `item.suggestion_source` to labels and colors:
    - `slug_variant` -> "Slug Match" (default variant)
    - `shopify_catalog` -> "Catalog Search" (`bg-emerald-500/20 text-emerald-400 border-emerald-500/30`)
    - `shopify_search` -> "Store Search" (`bg-emerald-500/20 text-emerald-400 border-emerald-500/30`)
    - `site_search` -> "Site Search" (`bg-amber-500/20 text-amber-400 border-amber-500/30`)
    - `cross_region_lookup` -> "Cross-Region" (`bg-purple-500/20 text-purple-400 border-purple-500/30`)
  - Confidence percentage is already shown; no change needed there

## What stays unchanged

- All existing diagnosis logic and pattern matching
- The `handleDiagnoseFailures` callback
- The `handleRetryTransient` callback
- The repair queue fetch query and all existing mutations
- The `smart-url-validator` Edge Function (no changes)
- Database schema (no migrations needed)


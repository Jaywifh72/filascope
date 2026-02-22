

## Create "intelligent-filament-search" Edge Function

### Overview
A new edge function that uses AI to parse natural-language filament queries into structured intent, then queries the database with spec-based filters, scores results by trait matching, and returns ranked results.

### Key Design Decision: AI Provider
The project does not have an `OPENAI_API_KEY` configured. Instead of asking you to provide one, the function will use **Lovable AI** (which is already configured via `LOVABLE_API_KEY`) to call `google/gemini-3-flash-preview` — a fast, capable model that handles structured JSON extraction well. The system prompt and behavior will be identical to what you described; only the API endpoint differs.

### Implementation Steps

**1. Create the edge function file**
`supabase/functions/intelligent-filament-search/index.ts`

The function will follow the existing pattern from `smart-search/index.ts` (CORS headers, Supabase client initialization, error handling).

**2. Request flow (7 steps as specified)**

- **STEP 1 — Intent Parsing**: Call Lovable AI Gateway with the system prompt you provided. Use tool calling to extract the structured JSON reliably. Model: `google/gemini-3-flash-preview`.

- **STEP 2 — Spec-Filtered Database Query**: Build a Supabase query joining `filaments` with `filament_properties`, `filament_trait_tags`, and `filament_use_cases`. Apply filters from parsed intent (material via `filaments.material`, heat resistance, enclosure, abrasive, food_safe, outdoor_suitable). Limit 60.

- **STEP 3 — Trait Scoring**: Score each filament (base 0.3) by checking trait matches (+0.25), use case matches (+0.35/+0.2), weakness penalties (-0.2), and heat resistance bonus (up to +0.3). Build `matchReasons` array.

- **STEP 4 — Sort and Return**: Sort by score descending, take top 15, return results with intent, query, and totalFound.

- **STEP 5 — Fallback**: If AI call fails, fall back to `product_title ILIKE` and `material ILIKE` text search (note: `filaments` has no `description` column, so we'll search `product_title`, `vendor`, and `material`).

- **STEP 6 — Logging**: Insert into `intelligent_search_logs` (query, parsed_intent, result_count, region).

- **STEP 7 — CORS**: Standard CORS headers matching existing edge function patterns.

**3. Update config.toml**
Add `[functions.intelligent-filament-search]` with `verify_jwt = false` (public search endpoint).

### Technical Notes

- The `filaments` table has no `name`, `slug`, or `description` columns. Results will use `product_title`, `product_handle`, `vendor`, and `material` from the filaments table directly.
- Brand data comes from `filaments.vendor` (no separate brands join needed for display).
- Regional pricing will use `filaments.variant_price` (USD) and the currency-specific columns (`price_cad`, `price_eur`, etc.) already on the filaments table, rather than a separate `filament_prices` table join.
- Material filtering will use `filaments.material ILIKE` against the parsed `material_types` array, since there is no separate `material_types` lookup table.
- Trait/use-case matching in Step 3 uses case-insensitive substring matching against `filament_trait_tags.trait` and `filament_use_cases.use_case`.


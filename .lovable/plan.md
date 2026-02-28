

## Update llms-full.txt Content

### Current State
The `llms-full.txt` is served dynamically via the `serve-robots` Edge Function (`supabase/functions/serve-robots/index.ts`), not as a static file. The `_worker.js` proxies `/llms-full.txt` requests to this edge function. Creating a static `public/llms-full.txt` would shadow the edge function due to CDN priority rules, which could cause inconsistent behavior across environments.

### Approach
Update the `LLMS_FULL_TXT` constant inside the edge function with the new comprehensive content. This keeps the existing architecture intact and ensures consistent serving across all environments.

### Changes

**File:** `supabase/functions/serve-robots/index.ts`

Replace the existing `LLMS_FULL_TXT` template literal (currently a shorter version with ~1,076 filaments) with the full user-provided content covering:
- Extended platform description and key data points
- Material type breakdowns (PLA, PETG, ABS, TPU, ASA, Nylon) with variant counts
- HueForge TD reference ranges
- Core pages, buying guides, and material comparison guide URLs
- Top brands with links
- 8 detailed FAQ entries
- Updated metadata (February 28, 2026)

No other files are modified. The edge function auto-deploys after the change.

### Verification
Visit `https://filascope.com/llms-full.txt` after deploy to confirm the updated markdown content is returned.


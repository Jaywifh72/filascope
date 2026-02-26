

# Diagnosis: Why ALL 240 Bambu Lab Stores Show Failed

## Root Cause (Single Point of Failure)

**File:** `supabase/functions/_shared/price-extract-bambulab.ts`, **line 14**

```
import { withTimeout } from './price-db.ts';
```

`withTimeout` does NOT exist in `price-db.ts`. It is exported from `price-timeout.ts`. This causes a **boot failure** for every edge function that imports `price-extract-bambulab.ts` -- including `get-current-price-v2`.

The edge function logs confirm this with hundreds of identical errors:
```
worker boot error: Uncaught SyntaxError: The requested module './price-db.ts'
does not provide an export named 'withTimeout'
```

Because `get-current-price-v2` crashes at boot, **no price extraction works at all** -- not just Bambu Lab, but potentially all brands routed through v2.

## The Fix (1 line change)

In `supabase/functions/_shared/price-extract-bambulab.ts`, change line 14 from:

```typescript
import { withTimeout } from './price-db.ts';
```

to:

```typescript
import { withTimeout } from './price-timeout.ts';
```

All other imports in the file are correct:
- `getRegionHeaders`, `getSpoofedHeaders`, `isGeoRedirectDomain` -- correctly from `./regional-fetch.ts`
- `logBrokenUrl` -- correctly from `./price-db.ts`
- `parseWeightFromTitle`, `parseDiameter` -- correctly from `./price-utils.ts`

## Verification of Other Components

| Component | Status | Notes |
|---|---|---|
| Platform detection (`price-platforms.ts`) | Correct | Matches `store.bambulab.com`, excludes JP |
| v2 router (`get-current-price-v2`) | Correct | Has `case "bambulab":` and correct import |
| JSON-LD parser | Correct | String-based parsing (Deno-safe), handles ProductGroup and Product |
| Variant scoring | Correct | 1kg+Refill (150) > 1kg+Spool (130) > first available |
| sync-regional-prices | Correct | Skips fetchShopifyProducts for non-JP Bambu Lab |
| Error handling | Correct | Returns `{ success: false }`, never throws |

## Why This Wasn't Caught Earlier

Previous audit messages confirmed the file "exists" and the logic is "correct" -- but never checked whether the **imports resolve** at runtime. The file compiles with `// @ts-nocheck` at the top, so TypeScript didn't flag the bad import either.

## After the Fix

Once redeployed, `get-current-price-v2` will boot successfully, and all Bambu Lab regions (US, CA, UK, EU, AU) will extract prices via JSON-LD. JP will continue routing through the Shopify extractor.


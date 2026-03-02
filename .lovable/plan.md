

# Fix: Affiliate Link System - CORS + Hardcoded Fallback

## Root Cause

The `get-affiliate-url` Edge Function has **outdated CORS headers**. The Supabase JS client (v2.86) sends additional headers (`x-supabase-client-platform`, `x-supabase-client-platform-version`, `x-supabase-client-runtime`, `x-supabase-client-runtime-version`) that the Edge Function's `Access-Control-Allow-Headers` does not permit. This causes the browser's CORS preflight (`OPTIONS`) request to fail, blocking every call to the function.

## Plan

### 1. Fix CORS headers in the Edge Function

**File:** `supabase/functions/get-affiliate-url/index.ts`

Update the `corsHeaders` to include all required Supabase client headers:

```text
Before:
  "authorization, x-client-info, apikey, content-type"

After:
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version"
```

No other changes to the Edge Function logic.

### 2. Add hardcoded fallback configs in `useAffiliateLinks.tsx`

**File:** `src/hooks/useAffiliateLinks.tsx`

Add a `FALLBACK_CONFIGS` constant containing affiliate parameters for all major retailers currently tracked. This ensures that if the Edge Function is temporarily unreachable (cold start, deploy, outage), links still get affiliate tracking.

The fallback will be sourced from the existing `affiliate_configs` and `affiliate_programs` tables. It will cover at minimum: Amazon, Bambu Lab, Anycubic, eSUN, Polymaker, Elegoo, Sunlu, Creality, Prusa/Prusament, Overture, FormFutura, 3D-Fuel, Geeetech, and any other active programs.

The `fetchConfigs()` function will be updated to return `FALLBACK_CONFIGS` instead of an empty array when the Edge Function call fails.

### 3. Improve error logging

**File:** `src/hooks/useAffiliateLinks.tsx`

Replace the generic `console.error` with categorized messages:
- `[AffiliateLinks] Edge Function unreachable — using fallback configs` (network/CORS failure)
- `[AffiliateLinks] Edge Function returned error: {status/message}` (function returned an error)  
- `[AffiliateLinks] Edge Function returned unexpected format` (missing `configs` key)

### What stays the same

- No UI/layout/styling changes
- All existing `target="_blank"` and `rel` attributes on buy links remain unchanged
- The `useAffiliateLink` hook (singular, used for `PrimaryBuyButton`) is unaffected -- it reads from `affiliate_programs` table directly
- The `transformUrlSync` logic is unchanged
- The `generate-affiliate-link` Edge Function (separate from `get-affiliate-url`) is unaffected




# Fix Link Testing and Price Sync for Geo-Redirect Domains

## Problem

When testing regional store URLs (e.g., `ca.store.bambulab.com`), the `test-url` Edge Function always ends up geo-redirected because Supabase Edge Functions run from a fixed location. The frontend then shows a purple "Geo-Restricted" badge, which is alarming but actually expected behavior for these domains. The URL IS valid -- it just can't be accessed from Edge Functions without Firecrawl.

## Changes

### 1. `supabase/functions/test-url/index.ts` -- Treat known geo-redirect domains as OK

After the fetch completes (line 125), add a check: if the domain is a known geo-redirector AND the fetch ended up redirected with a 200 status code, return `ok: true` with a new `isKnownGeoRedirect: true` flag.

```text
Current response logic (line 125-142):
  statusCode check -> isOk (200-299) -> isGeoRedirected -> return

New logic:
  statusCode check -> if isGeoRedirectDomain AND status=200 AND method='redirected':
    return ok: true, isKnownGeoRedirect: true
  else: existing logic unchanged
```

The `isGeoRedirectDomain` function is already imported from `_shared/regional-fetch.ts` (via the existing imports). We just need to use it.

Specific changes:
- After line 128, check `isGeoRedirectDomain(url)` (already available from the import of `regional-fetch.ts` -- we need to add it to the import)
- Update the import on line 2 to also import `isGeoRedirectDomain`
- When status is 200 and `isGeoRedirected` is true and the domain is a known geo-redirector, set `ok: true` and add `isKnownGeoRedirect: true` to the response
- This means the frontend will receive `ok: true` + `isKnownGeoRedirect: true` instead of `ok: true` + `isGeoRedirected: true`

### 2. `src/pages/admin/PricingData.tsx` -- Update test result handling

**a) Update `TestResult` interface (line 28):**
Add `isKnownGeoRedirect?: boolean` to the interface.

**b) Update test result processing (line 770-778):**
When `data.ok` is true and `data.isKnownGeoRedirect` is true, set status to `'ok'` (not `'geo_restricted'`), and store `isKnownGeoRedirect: true`.

Current code:
```typescript
if (data.ok) {
  result = { status: isGeoRedirected ? 'geo_restricted' : 'ok', ... };
}
```
New code:
```typescript
const isKnownGeoRedirect = !!data.isKnownGeoRedirect;
if (data.ok) {
  result = {
    status: 'ok',  // Always OK if data.ok is true
    ..., isGeoRedirected, isKnownGeoRedirect
  };
}
```

**c) Update `getTestResultBadge` (line 194) for the `'ok'` case:**
When `result.isKnownGeoRedirect` is true, show a green badge with a small globe icon:
- Badge text: `200 . {latencyMs}ms 🌐`
- Tooltip: "URL is valid. Geo-redirect detected (expected for this brand's regional stores). Price sync uses Firecrawl to access the correct region."

**d) Update toast message (line 800):**
When `isKnownGeoRedirect`, show success toast instead of warning: `"Link valid (geo-redirect expected) -- {latencyMs}ms"`

**e) Remove the `geo_restricted` status assignment for known domains:**
The `geo_restricted` status should now only apply to UNKNOWN geo-redirecting domains (domains not in the known list). For known domains, we get `ok` + `isKnownGeoRedirect`.

### 3. No Edge Function changes needed for `get-current-price`

Already verified in previous turns: `shouldAlwaysUseFirecrawl` includes `store.bambulab.com`, and the geo-redirect + non-USD Firecrawl-first bypass is implemented.

### 4. Add `qidi3d.com`, `flashforge.com`, `sovol3d.com` to `GEO_REDIRECT_DOMAINS` in `regional-fetch.ts`

The shared list (line 53-61) is missing some domains mentioned in the user's request. Add:
- `qidi3d.com`
- `flashforge.com`

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/test-url/index.ts` | Import `isGeoRedirectDomain`, return `ok: true` + `isKnownGeoRedirect` for known geo-redirect domains |
| `supabase/functions/_shared/regional-fetch.ts` | Add `qidi3d.com`, `flashforge.com` to `GEO_REDIRECT_DOMAINS` |
| `src/pages/admin/PricingData.tsx` | Add `isKnownGeoRedirect` to TestResult, show green badge with globe icon instead of purple "Geo-Restricted" for known domains |

## Expected Result

Before: Testing `ca.store.bambulab.com/products/abs` shows purple "Geo-Restricted" badge with warning language.

After: Shows green `200 . 150ms 🌐` badge with tooltip explaining geo-redirect is expected and Firecrawl handles price sync correctly.


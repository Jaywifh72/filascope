

# Fix: "Failed" Alerts on Bambu Lab ABS (US/CA) During Admin Sync

## Problem
When syncing Bambu Lab products on the admin pricing page, the first few stores (US, CA for ABS) show "Failed" alerts with "Rate limited" (HTTP 429). This happens because **two code paths** can still send `forceRefresh: true` to the price extraction endpoint, triggering the 1-per-URL-per-minute rate limiter:

1. **`usePricingActions.ts`** -- Already fixed to `forceRefresh: false` (the last diff).
2. **`useAdminPriceRefresh.ts`** -- Still sends `forceRefresh: true`. If an admin visits a product detail page and clicks "Refresh Price", then goes to the pricing-data page and syncs within 60 seconds, the rate limiter's DB record can interfere if the edge function receives `forceRefresh: true` from any remaining path.

Additionally, the edge function itself has no graceful handling when a 429 occurs during batch syncs -- the UI just shows a hard "Failed" with no distinction from real extraction failures.

## Solution

### 1. Remove `forceRefresh` from all admin bulk/batch code paths
Ensure that `useAdminPriceRefresh.ts` (the manual single-product refresh button) also uses `forceRefresh: false`. The rate limiter was designed to prevent public abuse, but admin callers should not be rate-limited since they are authenticated and intentional.

**File:** `src/hooks/useAdminPriceRefresh.ts`
- Change `forceRefresh: true` to `forceRefresh: false`

### 2. Add 429 retry logic in `syncSinglePrice`
As a safety net, if the edge function returns a 429, wait 2 seconds and retry once. This prevents transient rate-limit hits from showing as permanent failures in the UI.

**File:** `src/pages/admin/pricing/hooks/usePricingActions.ts`
- In the `syncSinglePrice` function (around line 460-488), detect 429 errors and retry once after a short delay before marking as failed.

### 3. Classify 429 errors distinctly in the UI
Instead of showing a generic "Failed" badge for rate-limit responses, show a more informative "Rate Limited - Retrying" or "Skipped (rate limit)" status so the admin understands it's not an extraction failure.

**File:** `src/pages/admin/pricing/hooks/usePricingActions.ts`
- Check if the error message contains "Rate limited" and set status to `'rate_limited'` or retry transparently.

## Technical Details

The changes are minimal and focused:

```text
useAdminPriceRefresh.ts:  forceRefresh: true  -->  forceRefresh: false
usePricingActions.ts:     Add retry-on-429 with 2s delay (single retry)
```

This ensures all admin-initiated sync operations bypass the rate limiter while still allowing the rate limiter to protect against public/automated abuse via the edge function's `forceRefresh` guard.


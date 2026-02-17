

# Extend Diagnosis System to Include Test Failures (Link Testing)

## Summary

Make the Diagnose button aware of both link test failures (`testResults`) and price sync failures (`syncResults`), presenting a unified diagnosis view.

## Changes

### 1. Frontend: `src/pages/admin/PricingData.tsx`

**Add `failedTestCount` memo** (after `failedSyncCount` at line 1342):
- Count entries in `testResults` where `status === 'broken'` or `status === 'timeout'`
- Add `totalFailureCount = failedSyncCount + failedTestCount`

**Update Diagnose button** (lines 1541-1554):
- Change visibility condition to use `totalFailureCount > 0` instead of `failedSyncCount > 0`
- Change disabled condition to use `totalFailureCount === 0`
- Update label to show `totalFailureCount`
- When `totalFailureCount > 0`, clicking calls `handleDiagnoseFailures`; otherwise shows last diagnosis

**Update `handleDiagnoseFailures`** (line 1348):
- After the existing `syncResults.forEach` block, add a new block iterating `testResults`
- For each broken/timeout test result, push a failure with error prefixed by `[LINK_TEST]` and `source: 'link_test'`
- Ensure `testResults` and `storeKeyMap` remain in the dependency array

**Auto-trigger diagnosis after test completion** (line 1021, after `toast.success` in `testBatch`):
- If `broken > 0`, call `handleDiagnoseFailures()` after a 500ms delay

### 2. Edge Function: `supabase/functions/diagnose-sync-failures/index.ts`

**Add link test error patterns** in `classifyError` (before the default catch-all at line 166):
- `[link_test]` + 404/not found -> "Broken link (404)", high severity, not transient
- `[link_test]` + timeout -> "Link timeout", medium severity, transient
- `[link_test]` + 301/302/redirect -> "Link redirect", medium severity, not transient
- `[link_test]` + geo/geo_restricted -> "Geo-restricted link", low severity, not transient
- `[link_test]` + 500/502/503 -> "Store server error", medium severity, transient
- `[link_test]` generic catch-all -> "Link test failure", medium severity, not transient

## Technical Details

### Failure Object for Test Results

```text
{
  product: entry.group.cleanName,
  region: entry.store.region,
  currency: entry.store.currency,
  url: entry.store.productUrl,
  error: "[LINK_TEST] <original error or status description>",
  brand: entry.group.vendor,
  extractedPrice: 0,
  source: "link_test",
  statusCode: result.statusCode,
  latencyMs: result.latencyMs,
  storeKey: entry.store.storeKey,
}
```

### Pattern Matching Strategy

The `[LINK_TEST]` prefix in the error string is the mechanism for the edge function to distinguish test failures from sync failures. The `classifyError` function checks `e.includes('[link_test]')` first, then sub-classifies by HTTP status code or error type.

### Auto-Trigger Behavior

After `testBatch` completes, if any broken links were found, `handleDiagnoseFailures` is called after a 500ms delay to let React state settle. This provides immediate diagnosis without requiring manual button clicks.

### Backward Compatibility

- Existing sync diagnosis remains unchanged -- all sync error patterns are checked before the new link test patterns
- If `testResults` is empty, behavior is identical to before
- The `contextualPromptParts` system from the previous enhancement works for link test failures too

### Files Modified

| File | Action |
|------|--------|
| `src/pages/admin/PricingData.tsx` | Add `failedTestCount`/`totalFailureCount` memos, update diagnose button conditions, extend `handleDiagnoseFailures` to include test failures, add auto-trigger in `testBatch` |
| `supabase/functions/diagnose-sync-failures/index.ts` | Add 6 new link test error patterns before the default catch-all |


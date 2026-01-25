
# Plan: Admin Tool for Broken Product URL Detection & Repair

## Current State Analysis

After thorough codebase exploration, I discovered that **the core infrastructure for detecting and fixing broken URLs already exists**. The system includes:

- **Edge Functions**: `validate-filament-urls`, `validate-url`, `fix-filament-url`, `report-broken-url`
- **Admin Dashboard**: `/admin/broken-links` with full monitoring capabilities
- **Database Tables**: `url_validation_results`, `url_validation_cache`, plus `url_validation_status` column in filaments
- **Frontend Integration**: `BrokenUrlReport` component shows when 404 detected, `useLivePriceFetch` detects 404 errors

The specific Creality URL mapping (`hyper-series-pla-carbon-fiber-3d-printing-filament` → `hyper-pla-cf`) is already defined in the `fix-filament-url` Edge Function.

---

## Implementation Plan

Since the infrastructure exists, the work focuses on **enhancements** and **filling gaps**:

### Phase 1: Enhance Redirect URL Detection

**File**: `supabase/functions/validate-filament-urls/index.ts`

**Changes**:
- When a URL redirects to a different product page (not homepage), capture and store the `finalUrl` as a suggested replacement
- Add logic to detect when a redirect goes to a valid product page vs a collection/homepage
- Update the database to store `suggested_url` alongside validation status

### Phase 2: Add "Apply Redirect as Fix" Feature

**File**: `src/components/admin/BrokenLinkSection.tsx`

**Changes**:
- For entries with status `redirect` and a valid `redirect_url`, show "Apply Redirect" button
- Add bulk action: "Apply All Valid Redirects" to automatically update product URLs when redirects point to valid product pages
- Show the redirect destination URL prominently in the UI

### Phase 3: Add URL Suggestion from Validation

**File**: `supabase/functions/fix-filament-url/index.ts`

**Verify/Add**:
- Confirm Creality mapping `hyper-series-*` → `hyper-*` is working
- Add any missing brand-specific URL patterns discovered from validation results
- Ensure the fixer attempts to validate the suggested URL before returning it

### Phase 4: Enhance Live Price 404 Workflow

**File**: `src/hooks/useLivePriceFetch.ts`

**Changes**:
- When 404 detected, check if there's a known redirect URL in `url_validation_cache`
- Automatically retry with the redirect URL before showing error
- If retry succeeds, suggest URL update in the UI

**File**: `src/components/filament/hero/FilamentHeroPurchaseCard.tsx`

**Changes**:
- When 404 detected and redirect exists, show "URL has moved" message with new URL
- Add "Update URL" action (for admins) inline

### Phase 5: Add Quick-Fix from Filament Page (Admin Only)

**File**: `src/components/price/BrokenUrlReport.tsx`

**Changes**:
- For admin users, add "Try Auto-Fix" button that calls `fix-filament-url` directly
- Show success message with new URL if fix found
- Auto-refresh price after successful fix

---

## Technical Details

### Database Changes
No schema changes required - existing tables support all needed functionality.

### New Component: Admin Quick-Fix
```text
BrokenUrlReport
├── Report Broken URL (existing)
├── Go to Store (existing)
├── [Admin Only] Try Auto-Fix (new)
│   ├── Calls fix-filament-url Edge Function
│   ├── If success: updates product_url in filaments table
│   └── Shows toast with result
└── [Admin Only] Edit URL (new)
    └── Opens inline editor for manual URL correction
```

### Edge Function Enhancement Flow
```text
validate-filament-urls
├── Fetch URL with redirect:follow
├── If redirected to valid product page:
│   └── Store redirect_url in url_validation_results
├── If 404 or redirected to homepage:
│   └── Mark as invalid, suggest calling fix-filament-url
└── Return results with suggested actions
```

### Apply Redirect Flow
```text
User clicks "Apply Redirect" in Admin UI
├── Verify redirect_url is accessible
├── Update filaments.product_url with new URL
├── Update url_validation_results status to 'valid'
└── Clear relevant cache entries
```

---

## Files to Create/Modify

### Modify Existing Files
1. `supabase/functions/validate-filament-urls/index.ts` - Store redirect URLs properly
2. `src/components/admin/BrokenLinkSection.tsx` - Add "Apply Redirect" actions
3. `src/components/price/BrokenUrlReport.tsx` - Add admin quick-fix capability
4. `src/hooks/useLivePriceFetch.ts` - Auto-retry with known redirect URLs

### No New Files Required
The existing infrastructure is comprehensive - enhancements can be made to existing components.

---

## Immediate Fix for Creality Hyper PLA CF

The URL mapping already exists in `fix-filament-url`:
```typescript
"Creality": {
  "hyper-series-pla-carbon-fiber-3d-printing-filament": "hyper-pla-cf",
  // ...
}
```

To apply this fix now:
1. Go to Admin → Broken Link Monitor
2. Find the Creality Hyper PLA CF entry
3. Click "Fix URL" - the existing function will apply the mapping
4. Alternatively, manually edit to: `https://store.creality.com/products/hyper-pla-cf`

---

## Summary

| Component | Status | Action |
|-----------|--------|--------|
| URL Validation Edge Function | Exists | Enhance redirect capture |
| URL Fixer Edge Function | Exists | Verify Creality mapping works |
| Admin Broken Links Dashboard | Exists | Add "Apply Redirect" bulk action |
| Broken URL Report Component | Exists | Add admin quick-fix button |
| Live Price Fetch Hook | Exists | Add redirect URL retry logic |
| Database Schema | Complete | No changes needed |

This plan leverages the existing robust infrastructure while adding targeted enhancements for a smoother admin workflow and better automatic recovery from URL changes.

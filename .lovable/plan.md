
# Fix: Filament Detail Page Redirect Loop

## Problem Summary
Clicking "View Details" on any filament card navigates to a UUID-based URL. The page shows "Redirecting..." text and then redirects to the homepage, never displaying the product details.

## Root Cause
The `useFilamentBySlug` hook has a redirect loop when:
1. A UUID URL is detected
2. The product has no `product_handle` stored (2,031 of 8,069 products)
3. The hook attempts to redirect to a generated SEO slug
4. The redirect causes the component to remount, but the slug lookup fails because the database still has no matching `product_handle`

## Technical Fix Strategy

### Change 1: Stop Automatic Redirects for UUID URLs
Instead of redirecting UUID URLs to slug URLs, **render the page directly** when fetching by UUID succeeds. This ensures the page always works, regardless of `product_handle` availability.

- Remove the automatic redirect logic when a UUID is detected
- Simply fetch by UUID and render the filament data
- Optionally update `product_handle` in the background for future SEO benefit, but don't redirect

### Change 2: Reset State When URL Parameter Changes  
Add a reset mechanism when `idOrSlug` changes to prevent stale `isRedirecting` state from persisting across navigations.

### Change 3: Add Timeout Protection for Redirect State
If `isRedirecting` is ever true, add a 3-second timeout that shows an error message instead of leaving users stuck on "Redirecting..." forever.

### Change 4: Improve Slug Lookup Fallback
When fetching by slug fails, the fallback component-based search should be more robust:
- Use case-insensitive matching
- Check if the filament was found by UUID in a previous request

## Files to Modify

### `src/hooks/useFilamentBySlug.ts`
- Remove redirect logic from UUID branch (lines 52-78)
- Keep filament data and set loading to false, don't navigate away
- Add state reset in useEffect when `idOrSlug` changes
- Optionally update `product_handle` in background without redirecting

### `src/pages/FilamentDetail.tsx`
- Add timeout protection for redirect state
- Show proper error message if redirect state persists beyond 3 seconds

## Implementation Details

**Before (broken):**
```typescript
if (isUuid(idOrSlug)) {
  // Fetch by UUID
  const { data } = await supabase.from('filaments').select('*').eq('id', idOrSlug);
  
  if (data?.product_handle) {
    setIsRedirecting(true);
    navigate(`/filament/${data.product_handle}`, { replace: true });
    return; // <-- Returns without setting filament!
  }
  
  // Generate slug and redirect
  const slug = generateFilamentSlug(...);
  setIsRedirecting(true);
  navigate(`/filament/${slug}`, { replace: true });
  return; // <-- Returns without setting filament!
}
```

**After (fixed):**
```typescript
if (isUuid(idOrSlug)) {
  // Fetch by UUID
  const { data } = await supabase.from('filaments').select('*').eq('id', idOrSlug);
  
  if (data) {
    // Always set the filament data - page will render
    setFilament(data);
    
    // Optionally update URL for SEO (without blocking render)
    if (data.product_handle) {
      // Use history.replaceState for clean URL without navigation
      const slug = data.product_handle;
      window.history.replaceState(null, '', `/filament/${slug}`);
    }
  }
}
```

## Expected Outcome
- UUID-based URLs will work immediately and show the filament detail page
- No redirect loop or "Redirecting..." message
- Clean SEO-friendly URLs in browser history via `replaceState`
- Fallback search will still work for slug-based URLs from external links

## Rollback Plan
If issues arise, revert `useFilamentBySlug.ts` changes. The fix is isolated to this single hook.


# Debug & Fix Plan: Frontend Routing and Data Fetching Issues

## Problem Summary
Based on thorough investigation, I identified the following issues:

| Issue | Status | Root Cause |
|-------|--------|------------|
| Home page "0 filaments" | **✅ FIXED** | Data loads successfully; 960 filaments display after regional filtering |
| Filament detail page `/filament/:slug` | **✅ FIXED** | Refactored to use `useFilamentBySlug` hook; fixed duplicate `product_handle` issue |
| Navigation between routes | **✅ Working** | All routes function correctly |
| Database connectivity | **✅ Working** | 8,069 filaments confirmed in database |

---

## Critical Fix: FilamentDetail Page SEO Slug Support

### Current Problem
The FilamentDetail.tsx component (line 296-300) directly queries filaments by UUID:
```typescript
const { data, error } = await supabase
  .from("filaments")
  .select("*")
  .eq("id", id)  // ← Expects UUID only
  .maybeSingle();
```

When accessing `/filament/pla-glow` (a slug), Supabase throws: `invalid input syntax for type uuid: "pla-glow"`

### The Solution
The codebase already has a proper hook `useFilamentBySlug` in `src/hooks/useFilamentBySlug.ts` that handles both UUIDs and product_handle slugs. It:
1. Detects if the URL parameter is a UUID or slug
2. Queries the appropriate field (`id` for UUIDs, `product_handle` for slugs)
3. Falls back to fuzzy matching if exact slug not found
4. Auto-redirects UUID URLs to SEO-friendly slug URLs

### Implementation Steps

**Step 1: Refactor FilamentDetail.tsx to use the slug-aware hook**

Replace the current inline `fetchFilament` logic with `useFilamentBySlug`:

```typescript
// Add import at top
import { useFilamentBySlug } from '@/hooks/useFilamentBySlug';

// Replace useState + fetchFilament with the hook
const { filament, loading, error, isRedirecting } = useFilamentBySlug(id);
```

**Step 2: Handle redirecting state**

Add early return for redirect state to prevent flash of content:

```typescript
if (isRedirecting) {
  return <PageLoadingSkeleton />;
}
```

**Step 3: Migrate existing callbacks**

The current FilamentDetail has several admin functions (`handleRescrapeImage`, `handleScrapeData`, etc.) that call `fetchFilament()` after mutations. These need to be adapted to work with the hook's data or trigger a refetch.

Options:
- A) Add a `refetch` function to `useFilamentBySlug`
- B) Use React Query in `useFilamentBySlug` for automatic cache invalidation
- C) Use `queryClient.invalidateQueries` after mutations

**Recommended: Option C** - Minimal changes, works with existing patterns.

**Step 4: Update error handling**

Replace toast-based error handling with the hook's error state:

```typescript
useEffect(() => {
  if (error && !loading) {
    toast({
      title: "Not Found",
      description: error,
      variant: "destructive",
    });
    navigate("/");
  }
}, [error, loading]);
```

---

## Secondary Issue: Home Page Initial Load Time

### Observations
- First load shows skeleton cards for 3-5 seconds
- Data successfully loads (960 filaments after regional filtering)
- No JavaScript errors in console
- Network requests complete successfully

### Potential Optimizations (Lower Priority)

1. **Query Optimization**: The Finder query is complex with multiple OR conditions. Consider:
   - Pre-computing popular filter combinations
   - Using a materialized view for common queries

2. **Initial Data Prefetching**: Consider prefetching first page of results during app initialization

3. **Pagination Tuning**: Current batch size is 1000 rows. For initial display, could fetch just first 50 for faster perceived load

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/FilamentDetail.tsx` | Replace inline fetch with `useFilamentBySlug` hook |
| `src/hooks/useFilamentBySlug.ts` | Add `refetch` capability or React Query integration |

---

## Testing Plan

After implementation:

1. **UUID URL Test**: Navigate to `/filament/[valid-uuid]` → Should redirect to slug URL
2. **Slug URL Test**: Navigate to `/filament/pla-glow` → Should load filament detail page
3. **Invalid Slug Test**: Navigate to `/filament/nonexistent-slug` → Should show error and redirect to home
4. **Admin Functions Test**: Test rescrape image/data buttons still work after refactor
5. **Regional Pricing Test**: Verify price display works with new hook integration

---

## Technical Considerations

### Database Coverage
- 8,069 total filaments in database
- Many filaments have `product_handle` populated (confirmed: "pla-glow" exists as `product_handle`)
- The `useFilamentBySlug` hook has fuzzy matching as fallback

### Existing Infrastructure
The codebase already has all necessary components:
- `isUuid()` utility function in `src/lib/seoSlugUtils.ts`
- `generateFilamentSlug()` for creating SEO slugs
- `product_handle` column in filaments table
- Route definition in App.tsx: `<Route path="/filament/:id" element={<FilamentDetail />} />`

This is primarily a wiring issue - connecting existing components together.

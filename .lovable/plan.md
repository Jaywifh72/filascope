

# Performance Optimization Plan

## Overview
This plan implements comprehensive performance optimizations to achieve Core Web Vitals targets (LCP < 2.5s, FID < 100ms, CLS < 0.1) across four phases: image optimization, list virtualization, code splitting, and caching improvements.

## Current Infrastructure Analysis
The project already has significant performance infrastructure in place:

| Component | Status | Location |
|-----------|--------|----------|
| `OptimizedImage` | Implemented | `src/components/ui/optimized-image.tsx` |
| `VirtualGrid` / `VirtualList` | Implemented but **not integrated** | `src/components/ui/virtual-grid.tsx` |
| Route Lazy Loading | Implemented | `src/App.tsx` (80+ routes) |
| Route Preloading | Partial | `src/lib/preloadRoutes.ts` |
| React Query Caching | Inconsistent | Various hooks with different `staleTime` |
| PWA Service Worker | Configured | `vite.config.ts` |
| Scroll Restoration | Implemented | `src/hooks/useScrollRestoration.ts` |
| URL Filter Sync | Implemented | `src/hooks/useURLFilterSync.ts` |
| Web Vitals Tracking | Implemented | `src/hooks/useWebVitals.ts` |

---

## Phase 1: Image Optimization Enhancements

### Current State
- `OptimizedImage` component already implements lazy loading, srcset, and skeleton placeholders
- Some components (e.g., `LabReadoutCard`) use plain `<img>` tags instead of `OptimizedImage`

### Tasks

1. **Add WebP Format Support with Fallbacks**
   - File: `src/components/ui/optimized-image.tsx`
   - Enhance `getOptimizedSrc` to request WebP format from CDNs
   - Add `<picture>` element with WebP source and fallback

2. **Implement Blur Placeholder Generation**
   - Create utility to generate low-quality image placeholders (LQIP)
   - Add `blurDataUrl` prop population for critical images
   - Implement CSS blur-up animation on load

3. **Enforce Explicit Dimensions**
   - Audit and update all `OptimizedImage` usages to include `width` and `height`
   - Add TypeScript enforcement for required dimensions on critical images

4. **Migrate Remaining `<img>` Tags**
   - Files: `src/components/LabReadoutCard.tsx`, `src/components/BentoGrid.tsx`
   - Replace plain `<img>` with `OptimizedImage` for brand logos and product images

---

## Phase 2: List Virtualization Integration

### Current State
- `VirtualGrid` and `VirtualList` components exist but are **not used** in any listing pages
- Finder page (974+ filaments), Printers (122), Deals (1064+) use standard CSS grids with "Load More" pagination

### Tasks

1. **Create Virtualized Listing Wrapper**
   - File: `src/components/VirtualizedProductGrid.tsx` (new)
   - Wrap `VirtualGrid` with responsive column calculation
   - Integrate `useResponsiveColumns` hook for breakpoint-aware layouts
   - Add infinite scroll callback for progressive loading

2. **Integrate with Finder Page**
   - File: `src/pages/Finder.tsx`
   - Replace standard grid with `VirtualizedProductGrid`
   - Preserve existing `LabReadoutCard` rendering
   - Maintain scroll restoration compatibility

3. **Integrate with Printers Page**
   - File: `src/pages/Printers.tsx`
   - Apply same virtualization pattern
   - Adapt for `MediumStandardPrinterCard` dimensions

4. **Integrate with Deals Page**
   - File: `src/pages/Deals.tsx`
   - Apply virtualization with `DealCard` rendering

5. **Add Virtualization Toggle**
   - Create `shouldUseVirtualization` check (threshold: 50+ items)
   - Fall back to standard grid for small lists to avoid overhead

---

## Phase 3: Code Splitting Enhancements

### Current State
- All 80+ routes use `React.lazy()` with dynamic imports
- Route preloader covers only 8 routes
- Heavy components (charts, wizards) are not split

### Tasks

1. **Expand Route Preloader Coverage**
   - File: `src/lib/preloadRoutes.ts`
   - Add missing routes: `/accessories`, `/learn/*`, `/reference/*`, `/settings`
   - Expand `navigationPatterns` with more granular predictions

2. **Split Heavy Components**
   - Create lazy-loaded versions:
     - `src/components/charts/LazyPriceChart.tsx` (wraps Recharts)
     - `src/components/LazyComparisonTable.tsx`
     - `src/components/LazyWizard.tsx` (Quick Match wizard)
   - Use dynamic import pattern:
     ```tsx
     const PriceChart = lazy(() => import('./charts/PriceChart'));
     ```

3. **Implement Predictive Preloading**
   - File: `src/hooks/usePreloadOnIdle.ts` (new)
   - Preload likely routes after initial page load using `requestIdleCallback`
   - Trigger preload on link hover/focus using `createPreloadHandler`

4. **Integrate Preloading with Navbar**
   - File: `src/components/Navbar.tsx`
   - Add hover preload handlers to main navigation links
   - Use existing `createPreloadHandler` utility

---

## Phase 4: Caching Strategy Standardization

### Current State
- React Query `staleTime` varies inconsistently (0 to 30 minutes)
- No centralized cache configuration
- PWA service worker caches API responses with NetworkFirst strategy

### Tasks

1. **Create Centralized Query Configuration**
   - File: `src/lib/queryConfig.ts` (new)
   - Define standardized cache tiers:
     ```typescript
     export const QUERY_CONFIG = {
       products: { staleTime: 5 * 60 * 1000, gcTime: 30 * 60 * 1000 },
       printers: { staleTime: 10 * 60 * 1000, gcTime: 60 * 60 * 1000 },
       prices: { staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000 },
       static: { staleTime: Infinity, gcTime: Infinity },
     };
     ```

2. **Apply Configuration to Hooks**
   - Update key hooks to use centralized config:
     - `src/pages/Finder.tsx` (filaments query)
     - `src/pages/Printers.tsx` (printers query)
     - `src/hooks/useDealsWithFilters.ts`
     - `src/hooks/useBrowseHistory.ts`

3. **Configure QueryClient Defaults**
   - File: `src/App.tsx`
   - Add sensible default options to `QueryClient`:
     ```typescript
     const queryClient = new QueryClient({
       defaultOptions: {
         queries: {
           staleTime: 1000 * 60 * 2, // 2 minutes default
           gcTime: 1000 * 60 * 10,   // 10 minutes
           refetchOnWindowFocus: false,
         },
       },
     });
     ```

4. **Enhance Recently Viewed Caching**
   - File: `src/hooks/usePWACache.ts`
   - Add image URL preloading for cached products
   - Implement cache warming on app startup

---

## Technical Details

### VirtualizedProductGrid Implementation

```tsx
// src/components/VirtualizedProductGrid.tsx
interface Props<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  getKey: (item: T) => string;
  minItemHeight?: number;
  gap?: number;
  onEndReached?: () => void;
}

export function VirtualizedProductGrid<T>({ 
  items, 
  renderItem, 
  getKey,
  minItemHeight = 420,
  gap = 24,
  onEndReached 
}: Props<T>) {
  const { columns, rowHeight, containerWidth } = useResponsiveColumns({
    cardBaseHeight: minItemHeight,
    gap,
  });
  
  const shouldVirtualize = items.length > 50;
  
  if (!shouldVirtualize) {
    // Standard grid for small lists
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item, idx) => (
          <div key={getKey(item)}>{renderItem(item, idx)}</div>
        ))}
      </div>
    );
  }
  
  return (
    <VirtualGrid
      items={items}
      renderItem={renderItem}
      getKey={getKey}
      columnCount={columns}
      rowHeight={rowHeight}
      gap={gap}
      onEndReached={onEndReached}
      className="min-h-[600px]"
    />
  );
}
```

### WebP Support Enhancement

```tsx
// Enhanced getOptimizedSrc in optimized-image.tsx
function getOptimizedSrc(src: string, width?: number, format?: 'webp' | 'auto'): string {
  if (!src || !width) return src;

  // Cloudinary with WebP
  if (src.includes("cloudinary.com")) {
    const formatParam = format === 'webp' ? 'f_webp' : 'f_auto';
    return src.replace("/upload/", `/upload/w_${width},q_auto,${formatParam}/`);
  }

  // Supabase Storage
  if (src.includes("supabase") && src.includes("/storage/v1/object/")) {
    const url = new URL(src);
    url.searchParams.set("width", String(width));
    url.searchParams.set("quality", "80");
    if (format === 'webp') url.searchParams.set("format", "webp");
    return url.toString();
  }

  return src;
}
```

---

## Files to Create
| File | Purpose |
|------|---------|
| `src/components/VirtualizedProductGrid.tsx` | Responsive virtualization wrapper |
| `src/lib/queryConfig.ts` | Centralized React Query cache tiers |
| `src/hooks/usePreloadOnIdle.ts` | Idle-time route preloading |
| `src/components/charts/LazyPriceChart.tsx` | Lazy-loaded Recharts wrapper |

## Files to Modify
| File | Changes |
|------|---------|
| `src/components/ui/optimized-image.tsx` | WebP support, picture element |
| `src/lib/preloadRoutes.ts` | Expand route coverage |
| `src/pages/Finder.tsx` | Integrate VirtualizedProductGrid |
| `src/pages/Printers.tsx` | Integrate VirtualizedProductGrid |
| `src/pages/Deals.tsx` | Integrate VirtualizedProductGrid |
| `src/components/Navbar.tsx` | Add preload handlers |
| `src/App.tsx` | Configure QueryClient defaults |
| `src/components/LabReadoutCard.tsx` | Use OptimizedImage for logos |

---

## Expected Outcomes

| Metric | Current | Target | Improvement Strategy |
|--------|---------|--------|---------------------|
| LCP | ~3-4s | < 2.5s | Image optimization, preloading |
| FID | ~50-150ms | < 100ms | Code splitting, reduced JS |
| CLS | ~0.1-0.2 | < 0.1 | Explicit dimensions, skeletons |
| Memory Usage | High on large lists | Reduced 60-80% | Virtualization |
| Initial Bundle | Large | Reduced 30-40% | Component splitting |


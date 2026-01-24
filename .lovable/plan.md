
# Performance Optimization Implementation Plan

## Summary
This plan implements comprehensive performance optimizations across four phases: image optimization, list virtualization, state persistence with scroll restoration, and code splitting enhancements. The codebase already has significant infrastructure in place, so this plan focuses on integration and gap-filling.

---

## Current State Analysis

### Already Implemented
- **OptimizedImage component** (`src/components/ui/optimized-image.tsx`) - Complete with lazy loading, srcset, skeleton placeholders
- **VirtualGrid/VirtualList components** (`src/components/ui/virtual-grid.tsx`) - Full virtualization ready
- **URL filter sync** (`src/hooks/useURLFilterSync.ts`) - Filter state to URL + localStorage
- **Code splitting** (`src/App.tsx`) - All 80+ routes already lazy loaded
- **Web Vitals tracking** (`src/hooks/useWebVitals.ts`) - FCP, LCP, CLS, FID, TTFB tracking

### Gaps to Fill
1. Product cards don't use `OptimizedImage` - still using raw `<img>` tags
2. `VirtualGrid` not integrated into main product listing pages
3. No scroll position restoration on back navigation
4. Heavy components (charts, wizards) could be split further
5. No preloading of likely navigation paths

---

## Phase 1: Image Optimization Integration

### Files to Modify

**1. `src/components/LabReadoutCard.tsx`**
- Replace brand logo `<img>` tag (line 307-315) with `OptimizedImage`
- Add blur placeholder with skeleton fallback
- Apply priority loading for first 4 cards

**2. `src/components/deals/DealCard.tsx`**
- Replace product image (line 79-87) with `OptimizedImage`
- Add aspect ratio constraint for consistent layout

**3. `src/components/printers/MediumStandardPrinterCard.tsx`**
- Integrate `OptimizedImage` for printer images
- Add WebP detection with fallback

**4. `src/components/ui/optimized-image.tsx`**
- Add `blurDataUrl` prop for blur-up placeholder effect
- Add WebP format detection and fallback
- Create `useBlurhash` hook for dynamic blur generation

### Technical Details
```typescript
// Enhanced OptimizedImage props
interface OptimizedImageProps {
  // ... existing props
  blurDataUrl?: string;        // Base64 blur placeholder
  preferWebP?: boolean;        // Enable WebP with fallback
}

// Blur-up effect implementation
{!isLoaded && blurDataUrl && (
  <img 
    src={blurDataUrl} 
    className="absolute inset-0 w-full h-full object-cover filter blur-md scale-105" 
  />
)}
```

---

## Phase 2: List Virtualization Integration

### Files to Modify

**1. `src/pages/Finder.tsx`**
- Replace grid rendering (lines 1784-1804) with `VirtualGrid`
- Add responsive column count detection
- Maintain "Load More" pattern as fallback for smaller lists

**2. `src/pages/Printers.tsx`**
- Integrate `VirtualGrid` for printer listing
- Calculate dynamic row height based on card dimensions

**3. `src/pages/Deals.tsx`**
- Add `VirtualGrid` for deals grid (lines 176-188)
- Enable `onEndReached` for potential infinite scroll

**4. Create `src/hooks/useResponsiveColumns.ts`**
- Detect optimal column count based on viewport
- Return: `{ columns: number, rowHeight: number }`

### Technical Details
```typescript
// Finder.tsx integration example
import { VirtualGrid } from "@/components/ui/virtual-grid";
import { useResponsiveColumns } from "@/hooks/useResponsiveColumns";

const { columns, rowHeight } = useResponsiveColumns({
  breakpoints: { sm: 1, md: 2, lg: 3, xl: 4 },
  cardBaseHeight: 420,
  gap: 24
});

// Only use virtualization for large lists (>50 items)
{displayedGroups.length > 50 ? (
  <VirtualGrid
    items={displayedGroups}
    renderItem={(group, index) => (
      <LabReadoutCard 
        key={group.representativeFilament.id}
        filament={group.representativeFilament}
        index={index}
        // ...props
      />
    )}
    getKey={(group) => group.representativeFilament.id}
    columnCount={columns}
    rowHeight={rowHeight}
    gap={24}
    className="min-h-[600px]"
  />
) : (
  // Existing grid for small lists
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {/* ... */}
  </div>
)}
```

---

## Phase 3: State Persistence & Scroll Restoration

### New Files to Create

**1. `src/hooks/useScrollRestoration.ts`**
```typescript
// Saves scroll position to sessionStorage keyed by route
// Restores on back/forward navigation
// Integrates with react-router's navigation state

export function useScrollRestoration(key: string) {
  const location = useLocation();
  const navigationType = useNavigationType();
  
  // Save position on scroll (debounced)
  // Restore on POP navigation type
  // Clear on new navigation
}
```

**2. `src/hooks/useFilterPersistence.ts`**
- Extend `useURLFilterSync` to include scroll position
- Add `scrollY` parameter to URL (optional, for deep links)

### Files to Modify

**1. `src/pages/Finder.tsx`**
- Integrate `useScrollRestoration('finder-scroll')`
- Save `displayCount` to sessionStorage for pagination state

**2. `src/pages/Printers.tsx`**
- Add scroll restoration hook
- Preserve `displayedCount` across navigations

**3. `src/hooks/useURLFilterSync.ts`**
- Add optional `scrollPosition` to state interface
- Include in shareable URL generation

### Technical Details
```typescript
// useScrollRestoration.ts
import { useLocation, useNavigationType } from 'react-router-dom';
import { useEffect, useRef, useCallback } from 'react';
import { useDebouncedCallback } from './usePerformance';

export function useScrollRestoration(key: string) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const storageKey = `scroll_${key}_${location.pathname}`;
  
  // Debounced scroll save
  const saveScrollPosition = useDebouncedCallback(() => {
    sessionStorage.setItem(storageKey, String(window.scrollY));
  }, 100);
  
  // Restore on POP (back/forward)
  useEffect(() => {
    if (navigationType === 'POP') {
      const savedY = sessionStorage.getItem(storageKey);
      if (savedY) {
        requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(savedY, 10));
        });
      }
    }
  }, [location.key, navigationType, storageKey]);
  
  // Listen for scroll events
  useEffect(() => {
    window.addEventListener('scroll', saveScrollPosition);
    return () => window.removeEventListener('scroll', saveScrollPosition);
  }, [saveScrollPosition]);
}
```

---

## Phase 4: Enhanced Code Splitting

### Already Complete
The `src/App.tsx` already implements comprehensive lazy loading for all 80+ routes using `React.lazy()`.

### Additional Optimizations

**1. Create `src/components/LazyChart.tsx`**
- Lazy load Recharts components
- Show skeleton while loading

**2. Create `src/lib/preloadRoutes.ts`**
- Preload likely next routes on hover/focus
- Use `requestIdleCallback` for non-blocking preload

**3. Modify `src/components/Navbar.tsx`**
- Add preload triggers on navigation link hover

### Technical Details
```typescript
// LazyChart.tsx - Split heavy charting library
const LazyLineChart = lazy(() => 
  import('recharts').then(m => ({ default: m.LineChart }))
);

export function LazyChart({ children, ...props }) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <LazyLineChart {...props}>{children}</LazyLineChart>
    </Suspense>
  );
}

// preloadRoutes.ts
const routePreloaders: Record<string, () => Promise<any>> = {
  '/finder': () => import('../pages/Finder'),
  '/printers': () => import('../pages/Printers'),
  '/deals': () => import('../pages/Deals'),
  '/wizard': () => import('../pages/Wizard'),
};

export function preloadRoute(path: string) {
  const preloader = routePreloaders[path];
  if (preloader && 'requestIdleCallback' in window) {
    requestIdleCallback(() => preloader());
  }
}
```

---

## Metrics Tracking Integration

### Files to Modify

**1. `src/App.tsx`**
- Add `useWebVitals()` hook at app root level
- Ensure metrics are captured on all pages

**2. `src/hooks/useWebVitals.ts`**
- Already tracks: FCP, LCP, CLS, FID, TTFB
- Add INP (Interaction to Next Paint) tracking
- Add custom timing for virtualization performance

### Dashboard Visibility
Metrics are already stored in `performance_metrics` table and can be viewed via existing admin analytics infrastructure.

---

## Implementation Order

| Phase | Priority | Effort | Impact |
|-------|----------|--------|--------|
| 1. Image Optimization | High | Medium | High - Reduces LCP significantly |
| 2. List Virtualization | High | High | Critical - 443+ products need windowing |
| 3. Scroll Restoration | Medium | Low | UX improvement for navigation |
| 4. Code Splitting | Low | Low | Already mostly complete |

---

## Files Summary

### New Files (4)
- `src/hooks/useScrollRestoration.ts`
- `src/hooks/useResponsiveColumns.ts`
- `src/components/LazyChart.tsx`
- `src/lib/preloadRoutes.ts`

### Modified Files (9)
- `src/components/LabReadoutCard.tsx` - Use OptimizedImage
- `src/components/deals/DealCard.tsx` - Use OptimizedImage
- `src/components/printers/MediumStandardPrinterCard.tsx` - Use OptimizedImage
- `src/components/ui/optimized-image.tsx` - Add blur-up, WebP
- `src/pages/Finder.tsx` - VirtualGrid + scroll restoration
- `src/pages/Printers.tsx` - VirtualGrid + scroll restoration
- `src/pages/Deals.tsx` - VirtualGrid integration
- `src/hooks/useWebVitals.ts` - Add INP tracking
- `src/components/Navbar.tsx` - Route preloading

---

## Expected Performance Gains

| Metric | Current (estimated) | Target | Improvement |
|--------|---------------------|--------|-------------|
| LCP | 3.5s | <2.5s | 30%+ |
| FCP | 1.8s | <1.5s | 15%+ |
| TTI | 4.0s | <3.0s | 25%+ |
| CLS | 0.15 | <0.1 | 33%+ |
| Memory (443 items) | ~200MB | ~50MB | 75%+ |


# Universal CDN Image Optimization

## Problem
Image optimization currently only works for `cdn.shopify.com`, `caz3d.com/cdn/`, and `store.bbl*` domains. Many other Shopify-hosted stores (Fillamentum, Atomic Filament, Push Plastic, Recreus, etc.) and several components (ProductGallery, ZoomImage, ViewHistorySection, compare trays, HardwareRecommendationCard) serve full-size images without width parameters.

Database analysis shows **13+ domains** with Shopify CDN patterns (`/cdn/shop/` in URL) that are not being optimized.

## Plan

### Step 1: Expand CDN detection in `src/utils/imageOptimization.ts`

Replace the narrow `isShopifyCdn()` check with a universal pattern: any URL containing `/cdn/shop/` or `/cdn/` paired with Shopify query param support. This catches all Shopify-hosted stores automatically (atomicfilament.com, pushplastic.com, recreus.com, shop.fillamentum.com, etc.) without maintaining a domain allowlist.

Updated detection:
- `/cdn/shop/` in URL path (universal Shopify indicator) -- covers all stores
- Keep explicit `cdn.shopify.com` and `caz3d.com/cdn/` checks for clarity
- Keep `store.bbl*` regex
- Add Supabase `/render/image/` URL support with dynamic width replacement

Also update the Supabase branch to handle URLs that already contain `width=` (replace instead of skip), enabling context-appropriate sizing.

### Step 2: Mirror changes in `src/components/ui/optimized-image.tsx`

Update `cdnSupportsWebP()` and `getOptimizedSrc()` in the OptimizedImage component to use the same expanded `/cdn/shop/` pattern, ensuring the `<picture>` element with WebP `<source>` works for all Shopify stores.

### Step 3: Add optimization to unoptimized components

These components currently render raw `<img src={url}>` without any width params:

| Component | Display size | Action |
|---|---|---|
| `ProductGallery` thumbnails (`product-gallery.tsx` line 229) | 64x64px | Add `getOptimizedImageUrl(url, 128)` |
| `ZoomImage` (`zoom-image.tsx` line 79) | ~400px hero | Add `getOptimizedImageUrl(src, 800)` for main, keep full URL for zoom background |
| `DigitalViewport` main image (line 84) | ~280px | Add `getOptimizedImageUrl(url, 560)` |
| `DigitalViewport` thumbnails (line 118) | ~60px | Add `getOptimizedImageUrl(url, 120)` |
| `ViewHistorySection` (line 62) | 56x56px | Add `getOptimizedImageUrl(image, 112)` |
| `HardwareRecommendationCard` (line 101) | 48x48px | Add `getOptimizedImageUrl(url, 96)` |
| Compare tray images (3 files) | 40-48px | Add `getOptimizedImageUrl(url, 96)` |
| `ProfileReviewsTab` (line 71) | ~200px | Add `getOptimizedImageUrl(image, 400)` |

### Step 4: Context-aware brand logo sizing

Update `src/lib/brandLogos.ts` to export a function that accepts a target width, so callers in small contexts (e.g., compare cards at 60px) can request `width=120` instead of always `width=384`.

Add a helper:
```
export function getBrandLogoUrl(vendor: string | null, displayWidth?: number): string | null
```

The default remains 384, but small-context callers can pass 120.

### Step 5: No regressions

- Homepage, deals page, recently viewed, continue browsing sections already use `getOptimizedImageUrl` -- these will automatically benefit from the expanded CDN detection
- The `getOptimizedImageUrl` function already handles null/undefined/empty strings
- URLs that already have `?width=` are skipped (no double-append)

## Technical Details

**Files to modify:**
1. `src/utils/imageOptimization.ts` -- expand `isShopifyCdn` to universal `/cdn/shop/` pattern
2. `src/components/ui/optimized-image.tsx` -- mirror CDN detection expansion
3. `src/components/ui/product-gallery.tsx` -- optimize thumbnail `<img>` tags
4. `src/components/ui/zoom-image.tsx` -- optimize hero image src (not zoom background)
5. `src/components/printer/DigitalViewport.tsx` -- optimize main + thumbnail images
6. `src/components/account/ViewHistorySection.tsx` -- optimize list thumbnails
7. `src/components/filament/print-settings/HardwareRecommendationCard.tsx` -- optimize card image
8. `src/components/compare/UnifiedCompareTray.tsx` -- optimize tray thumbnails
9. `src/components/compare/UnifiedMobileCompareTray.tsx` -- optimize tray thumbnails
10. `src/components/compare/UnifiedComparePill.tsx` -- optimize pill thumbnails
11. `src/components/profile/ProfileReviewsTab.tsx` -- optimize review card images
12. `src/lib/brandLogos.ts` -- add context-aware width parameter

**Estimated impact:** Based on the database, ~1,800+ filament images from non-Shopify-CDN Shopify stores will now be served at appropriate sizes instead of full resolution. Per-page savings of 2-10MB on image-heavy pages (brand detail, filament grid).

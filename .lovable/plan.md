

# Comprehensive Image Optimization Pass

## Summary

Several components bypass the existing `OptimizedImage` component and render raw `<img>` tags with full-resolution URLs and no srcset. This plan fixes each one.

---

## Task 1: Navbar Logo Optimization

**File:** `src/components/Navbar.tsx` (lines 234-244)

**Problem:** The logo is 1792x576px but displayed at ~112x36px (h-8/h-9). No srcset.

**Fix:** Since the logo is a bundled Vite asset (imported from `@/assets/logo-filascope.webp`), we can't resize it at build time without adding a build plugin. The practical fix:
- Add `width={224}` and `height={72}` attributes (2x retina target) to set explicit dimensions
- The image is already WebP and loaded eagerly with `fetchpriority="high"`, which is correct
- Add a CSS `max-height` constraint and let the browser handle downscaling
- **Best approach:** Generate a smaller version of the logo (224x72px) and replace the asset file. You would need to upload a resized version. Alternatively, add `style={{ maxWidth: '224px' }}` to prevent the browser from decoding the full 1792px image into memory

**Recommendation:** Upload a pre-optimized 224x72px version of the logo to replace `src/assets/logo-filascope.webp`. This is the only way to actually reduce the download size. The current file is likely ~30-50KB when it could be ~3KB.

---

## Task 2: Continue Browsing Thumbnails

**File:** `src/components/ContinueBrowsingSection.tsx` (lines 53-60)

**Problem:** Uses `getOptimizedImageUrl(image, 200)` which is good for Shopify CDN images, but:
- No srcset for retina displays
- Non-Shopify images still served at full resolution
- Display size is 40x40px, so target width should be 80px (2x retina), not 200px

**Fix:**
- Change `getOptimizedImageUrl(image, 80)` (was 200)
- Add `srcSet={getImageSrcSet(image, [80, 160]) || undefined}` for Shopify images
- Add `sizes="40px"` attribute

---

## Task 3: Recently Viewed Section

**File:** `src/components/RecentlyViewedSection.tsx` (lines 80-90)

**Problem:** Already uses `getOptimizedImageUrl(image, 400)` and `getImageSrcSet(image, [200, 400])` -- this was fixed in a previous pass. Display is 160px wide, so 400px target is fine (2x retina). This is already optimized.

**Status:** No changes needed.

---

## Task 4: Deals Page — DealCard Images

**File:** `src/components/deals/DealCard.tsx` (lines 110-121)

**Problem:** DealCard already uses `OptimizedImage` with `width={320}`, which handles srcset and lazy loading internally. The user report says "ALL 103 eager-loaded" which suggests the `OptimizedImage` component's lazy loading logic may not be working correctly, or the deals page is rendering all cards without virtualization.

**Investigation:** The `OptimizedImage` component uses IntersectionObserver for lazy loading (line 113-117 of optimized-image.tsx). It does NOT use the native `loading="lazy"` attribute -- it uses a custom observer. If all cards are within the 200px rootMargin on initial render, they'll all load eagerly.

**Fix:**
- In `OptimizedImage`, ensure the `priority` prop defaults to `false` (it does)
- The DealCard doesn't pass `priority={true}`, so lazy loading should work
- The real issue might be that all deal cards are rendered in the DOM at once. Consider adding `loading="lazy"` as a native fallback on the underlying `<img>` tag inside `OptimizedImage`
- Check if `OptimizedImage` sets `loading="lazy"` on its `<img>` -- if not, add it as a belt-and-suspenders approach

**File:** `src/components/ui/optimized-image.tsx`
- Add `loading={priority ? "eager" : "lazy"}` to the `<img>` element as a native fallback alongside the IntersectionObserver approach

---

## Task 5: Sidebar DealsModule Thumbnails

**File:** `src/components/sidebar/DealsModule.tsx` (lines 68-75)

**Problem:** Raw `<img>` with `src={deal.featured_image}` -- no optimization at all. Display size is 48x48px.

**Fix:**
- Import `getOptimizedImageUrl` from `@/utils/imageOptimization`
- Change `src={deal.featured_image}` to `src={getOptimizedImageUrl(deal.featured_image, 96)}`
- Add `srcSet` and `sizes="48px"` for Shopify images

---

## Task 6: SimilarFilamentCard Images

**File:** `src/components/filament/similar/SimilarFilamentCard.tsx` (lines 208-216)

**Problem:** Raw `<img src={filament.featured_image}>` with no optimization. Display is ~240px square.

**Fix:**
- Import `getOptimizedImageUrl` and `getImageSrcSet`
- Change to `src={getOptimizedImageUrl(filament.featured_image, 480)}`
- Add `srcSet={getImageSrcSet(filament.featured_image, [240, 480]) || undefined}`
- Add `sizes="240px"`

---

## Task 7: SimilarMaterialCard

**File:** `src/components/filament/similar/SimilarMaterialCard.tsx`

**Status:** This component does NOT render a product image -- it shows brand logo, title, scores, and price. No image optimization needed.

---

## Task 8: Printer Cards

**File:** `src/components/printers/MediumStandardPrinterCard.tsx`

**Status:** Already uses `OptimizedImage` component. No changes needed.

---

## Implementation Order

| Step | File | Change |
|------|------|--------|
| 1 | `ContinueBrowsingSection.tsx` | Reduce target width 200 to 80, add srcset |
| 2 | `DealsModule.tsx` | Add `getOptimizedImageUrl` to sidebar thumbnails |
| 3 | `SimilarFilamentCard.tsx` | Add `getOptimizedImageUrl` + srcset |
| 4 | `optimized-image.tsx` | Add native `loading="lazy"` fallback |
| 5 | `Navbar.tsx` | Add dimensional constraints to logo img |

Step 1-4 are code changes. The logo (Task 1) ideally requires uploading a resized asset file -- the code change alone won't reduce download size.

---

## Out of Scope (Deferred)

- **Logo asset replacement**: Requires you to upload a resized 224x72px WebP file
- **Deals page virtualization**: Would require react-window or similar for 100+ cards
- **Non-Shopify image optimization**: Images from caz3d.com and other non-CDN sources cannot be resized server-side without a proxy


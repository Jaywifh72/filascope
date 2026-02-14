

# Fix: Missing Alt Text Across the Site

## Summary

After auditing all `<img>` elements across the codebase, most public-facing images already have proper alt text. The issues fall into a few categories:

## Issues Found

### 1. Product Gallery Thumbnails (product-gallery.tsx, line 240-242)
**Impact: Medium** -- These are on every product detail page.
The thumbnail strip images have `alt=""` but should have descriptive alt text since they're meaningful product images, not decorative.

**Fix**: Change `alt=""` to `alt={img.alt || productTitle}` (the data is already available).

### 2. Project Log Photos (ProjectLog.tsx, lines 68-72, 147-151)
**Impact: Low** -- User-uploaded print photos in project logs.
Upload previews and saved photos both use `alt=""`.

**Fix**: Change to `alt="Print photo preview"` for previews and `alt="Print photo"` for saved photos.

### 3. Review Form Photo Previews (ReviewForm.tsx, line 493)
**Impact: Low** -- Upload previews in review form.
Uses `alt=""`.

**Fix**: Change to `alt="Review photo preview"`.

### 4. Share Print Dialog Photo Previews (SharePrintDialog.tsx, line 176)
**Impact: Low** -- Upload previews.

**Fix**: Change to `alt="Print photo preview"`.

### 5. Admin Pages (AdminImport, AdminAmazonLinks, AdminFeaturedContent)
**Impact: None for SEO** -- These are admin-only, not public-facing. No fix needed but can add alt for completeness.

### 6. Blur Placeholder in OptimizedImage (optimized-image.tsx, line 241-243)
**No fix needed** -- Already correctly uses `alt="" aria-hidden="true"` since it's a decorative blur effect.

## What's Already Correct
- BrandLogo component: `alt="{brandName} logo"` -- correct
- TrendingSection cards: `alt="{vendor} {name} {material} filament spool"` -- correct
- RecentlyViewedSection: `alt="{title} thumbnail"` -- correct
- ContinueBrowsingSection: `alt={title}` -- correct
- Printer cards: `alt="{brand} {model_name}"` -- correct
- OptimizedImage main image: passes through `alt` prop -- correct
- ZoomImage: passes through `alt` prop -- correct
- ImageLightbox: `alt={productTitle}` -- correct
- All filament sub-components (VideoThumbnail, HardwareRecommendationCard, etc.) -- correct

## Files to Modify

1. **src/components/ui/product-gallery.tsx** (line 242) -- Change thumbnail alt from `""` to descriptive text
2. **src/components/projects/ProjectLog.tsx** (lines 70, 149) -- Add "Print photo" alt text
3. **src/components/reviews/ReviewForm.tsx** (line 493) -- Add "Review photo preview" alt text
4. **src/components/community-photos/SharePrintDialog.tsx** (line 176) -- Add "Print photo preview" alt text

Total: 4 files, 5 img elements to fix. The remaining `alt=""` instances are either admin-only or correctly decorative.


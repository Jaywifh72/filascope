

# Fix Broken Brand Logo Images

## Root Cause

The `static-images/brands/` storage bucket contains 63 files, but most appear to be **corrupt uploads**. Out of 63 files, 62 have suspiciously similar file sizes (~133KB each), regardless of format (.webp, .png, .jpg). This strongly suggests they were bulk-uploaded with an error -- likely each file contains an HTML error page or placeholder, not an actual image. The browser sees the response body doesn't match the declared image MIME type and triggers `ERR_BLOCKED_BY_ORB` (Opaque Resource Blocking).

Only `3dhojor.png` (335KB) appears to be a legitimate image.

Additionally, the `automated_brands` table has `logo_url = NULL` for all brands, so the database-level logo references are empty and the app falls back to the hardcoded `brandLogos` map in `src/lib/brandLogos.ts`, which points to the corrupt bucket files.

## Fix Plan (Two Phases)

### Phase 1: Add Image Fallback Handling (Code Fix)

Create a reusable `BrandLogo` component that gracefully handles broken images site-wide.

**New file: `src/components/ui/BrandLogo.tsx`**

A component that:
- Renders the `<img>` tag with an `onError` handler
- On error, hides the image and shows the brand name as styled text (first letter in a circle, or full name)
- Accepts `src`, `brandName`, `className`, and `size` props

**Update 23 files** that use `getBrandLogo()` or display brand logos:
- `BrandCard.tsx` -- replace raw `<img>` with `<BrandLogo>`
- `FilamentCard.tsx`, `BentoGrid.tsx`, `FilamentHeroSection.tsx`, `SimilarFilamentCard.tsx`, `MobileCompareView.tsx`, `CompareFilamentColumn.tsx`, `WizardProductCard.tsx`, `AccessoryCard.tsx`, `BuildPlateList.tsx`, `BuildPlateDetail.tsx`, `BrandDetail.tsx`, `NozzleList.tsx`, `HotendList.tsx`, `PrinterDetailPage.tsx`, `PrinterCard.tsx`, and others

Each replacement is a simple swap:

```text
Before:
  {brandLogo && <img src={brandLogo} alt={name} ... />}

After:
  <BrandLogo src={brandLogo} brandName={name} ... />
```

### Phase 2: Re-upload Correct Brand Logo Files

The storage bucket needs valid images. This requires:

1. **Delete the 62 corrupt files** from the `static-images/brands/` bucket
2. **Re-upload actual brand logo images** in WebP format at 128x128px

This is a data/content task that needs to be done via an edge function or manual upload. The code fix in Phase 1 ensures the site looks clean even while logos are missing -- showing styled brand-name text instead of broken image icons.

### Priority and Sequencing

1. **Phase 1 first** (immediate) -- deploy the fallback component so the site looks professional regardless of image availability
2. **Phase 2 second** (follow-up) -- re-upload correct brand logos; once uploaded, the `BrandLogo` component will automatically start showing them

## Technical Details

### `BrandLogo` Component Specification

```typescript
interface BrandLogoProps {
  src: string | null;
  brandName: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}
```

- `sm`: 20x20px (inline in tables/lists)
- `md`: 40x40px (cards)
- `lg`: 80x160px (hero sections, brand detail page header)
- On `onError`, sets an internal `failed` state and renders a text fallback
- Text fallback: brand initial in a colored circle (color derived from brand name hash)

### Files to Modify (Phase 1)

| File | Change |
|------|--------|
| `src/components/ui/BrandLogo.tsx` | New reusable component |
| `src/components/brands/BrandCard.tsx` | Use `BrandLogo` in logo area |
| `src/components/FilamentCard.tsx` | Use `BrandLogo` for vendor logo |
| `src/components/filament/hero/FilamentHeroSection.tsx` | Use `BrandLogo` |
| `src/components/BentoGrid.tsx` | Use `BrandLogo` |
| `src/components/compare/MobileCompareView.tsx` | Use `BrandLogo` |
| `src/components/compare/CompareFilamentColumn.tsx` | Use `BrandLogo` |
| `src/components/filament/similar/SimilarFilamentCard.tsx` | Use `BrandLogo` |
| `src/components/wizard/WizardProductCard.tsx` | Use `BrandLogo` |
| `src/components/AccessoryCard.tsx` | Use `BrandLogo` |
| `src/components/BuildPlateList.tsx` | Use `BrandLogo` |
| `src/pages/BuildPlateDetail.tsx` | Use `BrandLogo` |
| `src/pages/BrandDetail.tsx` | Use `BrandLogo` |
| `src/components/NozzleList.tsx` | Use `BrandLogo` |
| `src/components/HotendList.tsx` | Use `BrandLogo` |
| `src/components/admin/inventory/sync-status/BrandHealthGrid.tsx` | Use `BrandLogo` |
| Additional files as found during implementation | Use `BrandLogo` |

### No Database Changes Required

The `automated_brands.logo_url` column already exists. Once valid images are re-uploaded to storage, the `logo_url` values can be populated to point directly to the correct URLs, bypassing the hardcoded `brandLogos` map entirely.


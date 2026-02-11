
# Fix: Printer Detail Page Image Loading

## Problem
The product image appears as an empty dark rectangle on initial load because the image display is gated behind an async validation step. The code flow is:
1. Printer data loads, `productImages` is set from `scraped_data`
2. An async `validateImages()` runs, loading each image in a hidden `Image()` element
3. Only after validation completes does `validImages` get populated
4. `displayImages = productImages.filter(img => validImages.has(img))` -- this is empty until step 3 finishes

So the gallery receives zero images until validation finishes, showing nothing.

## Solution

### 1. Show images immediately, validate in background (`src/pages/PrinterDetail.tsx`)
- Change `displayImages` logic: use `productImages` directly when `checkedImages` is empty (validation not yet complete), and only filter once validation has run
- This ensures images appear immediately on mount

```
const displayImages = checkedImages.size === 0
  ? productImages
  : productImages.filter(img => validImages.has(img));
```

### 2. Improve ZoomImage loading/error states (`src/components/ui/zoom-image.tsx`)
- Replace the generic Skeleton loader with a styled pulsing placeholder: `bg-gray-800 animate-pulse rounded-lg` matching the container dimensions
- Add a 10-second timeout: if the image hasn't loaded after 10 seconds, trigger the error state
- Replace the error state with a centered Printer icon (size 64, text-gray-600) and "Image not available" text (text-xs text-gray-500 font-mono mt-2)

### Technical Details

**File: `src/pages/PrinterDetail.tsx`** (line ~505)
- Change the `displayImages` computation to show images before validation completes

**File: `src/components/ui/zoom-image.tsx`**
- Add a `useEffect` with a 10-second `setTimeout` that sets `isError = true` if `isLoaded` is still false
- Replace Skeleton placeholder (lines 60-64) with `bg-gray-800 animate-pulse rounded-lg` div
- Replace error state (lines 126-130) with Printer icon + "Image not available" text

### What stays unchanged
- Image container dimensions
- Breadcrumb, brand name, title, subtitle
- Spec badges row (Build Volume, Speed, Nozzle Temp, Connectivity)
- Data Quality indicator
- Right sidebar panel
- `loading="eager"` and `fetchpriority="high"` already set on the img element

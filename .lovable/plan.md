

# Brand Logo Image Optimization

## Problem

49 brand logos in `/public/brands/` are served at full resolution (up to 1920x545px, 300KB each) but displayed at a maximum of 192x48px. The `/brands` page downloads ~2.14 MB of logo images when ~200 KB would suffice.

## Constraint

Lovable cannot run image processing scripts or resize files on disk. The actual `.png`/`.webp` files in `/public/brands/` must be replaced manually with optimized versions. However, code changes can reduce the impact and prepare the system for optimized assets.

## Plan

### Step 1: Add explicit dimensions to BrandLogo component

**File:** `src/components/ui/BrandLogo.tsx`

Add `width` and `height` attributes to the `<img>` tag for each size tier, plus `sizes` and `decoding="async"`. This prevents the browser from allocating a full-resolution decode buffer and helps with layout stability.

```
sm: width={60} height={20} sizes="60px"
md: width={100} height={32} sizes="100px"
lg: width={180} height={48} sizes="180px"
```

Also add `decoding="async"` to avoid blocking the main thread.

### Step 2: Upload optimized logos to Supabase Storage

Create a `brand-logos` storage bucket and upload 384px-wide WebP versions of each logo. Then update the `logo()` helper in `brandLogos.ts` to point to the storage CDN URL instead of `/brands/`.

The storage URL pattern:
```
{SUPABASE_URL}/storage/v1/object/public/brand-logos/{filename}
```

Update `brandLogos.ts`:
```ts
const STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/brand-logos`;
const logo = (filename: string) => `${STORAGE_BASE}/${filename}`;
```

All filenames stay the same (e.g., `eryone.png`, `bambulab.webp`). The `getBrandLogo()` function and all 32 consumer files remain unchanged.

### Step 3: Create a one-time edge function to process and upload logos

**New file:** `supabase/functions/optimize-brand-logos/index.ts`

This edge function:
1. Lists all files in `/public/brands/` (fetched from the live app URL)
2. For each logo, fetches the original image
3. Resizes to 384px wide using a WASM-based image library (`imagescript` for Deno)
4. Converts to WebP format
5. Uploads the result to the `brand-logos` storage bucket

This is a one-time admin utility -- call it once, then delete it. It avoids manually resizing 49 images.

If the WASM approach proves unreliable, the fallback is: upload pre-optimized files manually through Lovable Cloud storage UI, then just do Step 2 (point `brandLogos.ts` at the storage bucket).

### Step 4: Navbar logo optimization

**File:** `src/components/Navbar.tsx`

The site logo (`logo-filascope.webp`, 1792x576px) is already constrained with `width={224}` and `height={72}` from the previous pass. To actually reduce its download size, upload a 224px-wide version to the `brand-logos` bucket and update the import.

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/ui/BrandLogo.tsx` | Add `width`, `height`, `sizes`, `decoding="async"` to img tag |
| `src/lib/brandLogos.ts` | Point `logo()` helper at Supabase Storage bucket URL |
| `supabase/functions/optimize-brand-logos/index.ts` | New one-time edge function to resize and upload logos |
| Database migration | Create `brand-logos` public storage bucket |

## Expected Impact

- With optimized 384px WebP logos: ~3-8 KB each instead of 50-300 KB = total ~200 KB (down from 2.14 MB)
- Proper `width`/`height` attributes eliminate layout shift
- `decoding="async"` prevents main thread blocking
- No visual changes -- same display sizes, same positioning, same fallback chain


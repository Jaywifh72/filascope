

# Fix FilaScope Production White Screen - Move Images to Cloud Storage

## Problem

The site deploys ~156 files to Cloudflare R2 per publish, triggering a `429 Too Many Requests` rate limit. The JS bundles never reach production, resulting in a white page. The previous cleanup removed 87 unused files, but the remaining ~126 static files + ~30 build chunks still exceed the limit.

All remaining image files (111 total) are actively referenced in code -- they cannot simply be deleted.

## Solution: Move Images to Lovable Cloud Storage

Move all 111 images from `public/images/` to a public Lovable Cloud Storage bucket, then update all code references to use the storage URLs. This reduces the deployment payload from ~156 files to ~45 files (fonts, PWA icons, favicon, build output) -- well within R2 limits.

## File Count Impact

```text
BEFORE                          AFTER
public/images/brands/  63       0  (moved to storage)
public/images/cad/     20       0  (moved to storage)
public/images/slicers/ 19       0  (moved to storage)
public/images/repos/    8       0  (moved to storage)
public/images/retailers/1       0  (moved to storage)
public/fonts/           8       8  (stays)
public/pwa-icons/       2       2  (stays)
public/ root files      5       5  (stays)
Build output           ~30     ~30 (stays)
                      ----    ----
TOTAL                 ~156     ~45
```

A 71% reduction in deployment files.

## Execution Plan

### Phase 1: Create a Public Storage Bucket

Create a `static-images` storage bucket in Lovable Cloud with public read access. No RLS complexity needed -- these are public brand logos and reference images.

### Phase 2: Upload All Images to Storage

Write a one-time edge function that reads each image from the project's own public URL (preview environment) and uploads it to the storage bucket, preserving the folder structure:
- `brands/bambulab-long.webp`
- `cad/fusion360.png`
- `slicers/cura.png`
- `repos/makerworld.png`
- `retailers/amazon.png`

### Phase 3: Create a URL Helper

Create a simple utility function like `getImageUrl(path)` that returns the full Lovable Cloud Storage public URL for a given image path. This centralizes the URL pattern so if the storage location ever changes, only one file needs updating.

### Phase 4: Update All Code References

Update every file that references `/images/...` paths to use the new `getImageUrl()` helper:

- `src/lib/brandLogos.ts` -- brand logo mappings
- `src/pages/ReferenceSlicers.tsx` -- slicer logos
- `src/pages/ReferenceCAD.tsx` -- CAD software logos
- `src/pages/ReferenceRepos.tsx` -- repository logos
- `src/components/reference/CADCompareTray.tsx`
- `src/components/reference/CADRecommendationsSidebar.tsx`
- `src/components/reference/CADProfileAccordion.tsx`
- `src/components/reference/CADThreeTierComparison.tsx`
- Any other files referencing `/images/` paths

### Phase 5: Delete All Images from `public/images/`

Remove the entire `public/images/` directory (111 files) from the codebase.

### Phase 6: Verify and Publish

1. Confirm the preview loads correctly with all images pulling from storage
2. Wait at least 20 minutes from the last failed publish
3. Publish once -- do not retry rapidly
4. Verify `filascope.lovable.app` and `filascope.com` in incognito windows

## Technical Details

**Storage bucket configuration:**
- Bucket name: `static-images`
- Access: Public (read-only via public URL)
- No authentication required for reads

**URL pattern:**
Storage URLs follow this format:
`https://cfqfavmhdbyjzejipiwa.supabase.co/storage/v1/object/public/static-images/brands/bambulab-long.webp`

**Helper function (`src/lib/imageUrl.ts`):**
```typescript
const STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/static-images`;
export const getImageUrl = (path: string) => `${STORAGE_BASE}/${path}`;
```

**Code change pattern:**
```typescript
// Before
"/images/brands/bambulab-long.webp"

// After
getImageUrl("brands/bambulab-long.webp")
```

## Risk Assessment

- **Low risk**: Images are public, read-only assets. Moving them to storage is a standard pattern.
- **Rollback**: If storage fails, the images can be re-added to `public/` from git history.
- **Performance**: Storage URLs are CDN-backed, so load times should be equivalent or better.
- **No data loss**: All images are preserved in storage, just served from a different URL.

## Why This Fixes the Problem

The root cause is too many files in the R2 upload. By moving 111 images to cloud storage (which is already deployed and available), the publish payload drops from ~156 to ~45 files. This is well within Cloudflare R2's rate limits and should resolve the white screen permanently -- even as the project grows.



# Fix ALL Broken Brand Logos Site-Wide

## Summary

There are two root causes for broken logos: (1) seven components still use raw `<img>` tags instead of the `BrandLogo` fallback component, and (2) the `brandLogos.ts` mapping has gaps and case mismatches against the actual database brand names. This plan fixes both comprehensively.

---

## Part 1: Close Mapping Gaps in `brandLogos.ts`

**Brands in the database with no matching entry in the mapping:**

| Database Brand | Issue | Fix |
|---|---|---|
| `3DHOJOR` | No mapping, no local file | Add mapping with fallback (no logo file available -- relies on BrandLogo initial fallback) |
| `Paramount 3D` | No mapping, no local file | Same -- fallback to initial |
| `VoxelPLA` | DB uses "VoxelPLA", map has "Voxel PLA" | Add `"VoxelPLA"` alias |
| `Prusa` | automated_brands has "Prusa", map only has "Prusament" / "Prusa Research" | Add `"Prusa"` alias pointing to `prusament.png` |
| `Amazon Basics` | In automated_brands, no mapping | Add entry (no local file -- fallback) |
| `Artillery` | In automated_brands, no mapping | Add entry (fallback) |
| `Flashforge` | DB uses "Flashforge", map has "FlashForge" | Already handled by case-insensitive lookup, but add explicit alias for speed |
| `Jayo` | Mapped to `sunlu.png` | Already correct |
| `Yousu` | In automated_brands, no mapping | Add entry (fallback) |

**Clean up duplicate case entries** by removing redundant keys like `"ERYONE"`, `"SUNLU"`, `"HATCHBOX"`, `"FIBERLOGY"`, `"KINGROON"`, `"ZIRO"`, `"DURAMIC 3D"`, `"AZUREFILM"`, `"INLAND"`, `"NUMAKERS"`, `"JAYO"` -- the existing `getBrandLogo()` function already does case-insensitive matching, so these are unnecessary clutter.

---

## Part 2: Replace All Raw `<img>` Tags With `BrandLogo` Component

Seven files still render brand logos as raw `<img>` tags. Each will be updated to use the `BrandLogo` component with proper fallback.

| File | Current Pattern | Change |
|---|---|---|
| `src/components/AMSList.tsx` | `{brandLogo && <img src={brandLogo} .../>}` | Replace with `<BrandLogo src={brandLogo} brandName={brand} size="sm" />` |
| `src/components/brands/tabs/BrandOverviewTab.tsx` | Multiple raw `<img src={brandLogo} .../>` as background watermarks | Replace with `<BrandLogo>` at appropriate size |
| `src/components/brands/tabs/BrandProductsTab.tsx` | `{brandLogo && <img src={brandLogo} .../>}` as background | Replace with `<BrandLogo>` |
| `src/components/admin/inventory/sync-status/BrandRegionMatrix.tsx` | `{brand.logo_url && <img src={brand.logo_url} .../>}` | Replace with `<BrandLogo src={brand.logo_url} brandName={brand.display_name} size="sm" />` |
| `src/pages/AdminBrands.tsx` | `{brand.logo_url ? <img .../> : <div>icon</div>}` | Replace with `<BrandLogo src={brand.logo_url} brandName={brand.display_name} size="md" />` |
| `src/components/admin/regional-stores/BrandRegionalStoresTable.tsx` | `{brand.logo_url ? <img .../> : <div>initial</div>}` | Replace with `<BrandLogo>` |
| `src/components/admin/regional-stores/BrandCoverageOverview.tsx` | `{brand.logo_url ? <img .../> : <div>initial</div>}` | Replace with `<BrandLogo>` |

For admin pages that use `brand.logo_url` (Supabase storage URL), the fix chains through `getBrandLogo()` as a fallback so the local file is preferred over the potentially-broken storage URL.

---

## Part 3: Ensure `BrandLogo` Component Handles All Edge Cases

The existing `BrandLogo` component is already solid. No changes needed -- it already:
- Accepts `src` as `string | null | undefined`
- Has `onError` -> `setFailed(true)` -> renders colored initial circle
- Supports `sm`, `md`, `lg` sizes

---

## Files Modified (Total: 9)

1. **`src/lib/brandLogos.ts`** -- Add missing brand aliases, remove redundant case duplicates
2. **`src/components/AMSList.tsx`** -- Use `BrandLogo` component
3. **`src/components/brands/tabs/BrandOverviewTab.tsx`** -- Use `BrandLogo` component
4. **`src/components/brands/tabs/BrandProductsTab.tsx`** -- Use `BrandLogo` component
5. **`src/components/admin/inventory/sync-status/BrandRegionMatrix.tsx`** -- Use `BrandLogo` component
6. **`src/pages/AdminBrands.tsx`** -- Use `BrandLogo` component
7. **`src/components/admin/regional-stores/BrandRegionalStoresTable.tsx`** -- Use `BrandLogo` component
8. **`src/components/admin/regional-stores/BrandCoverageOverview.tsx`** -- Use `BrandLogo` component
9. **`src/components/printers/SmallDeemphasizedPrinterCard.tsx`** -- Already uses `getBrandLogo` with raw `<img>`, switch to `BrandLogo`

## No Database Changes Required

The `automated_brands.logo_url` column stays as-is. The code-level fallback chain ensures local files are used when storage URLs fail.

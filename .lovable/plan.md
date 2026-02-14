

## Fix Three Affiliate Integration Issues

### Issue 1: Region Fallback for CA-Only Programs

**File**: `src/hooks/useAffiliateLink.ts`

Update the program lookup query (Step 2, lines 50-68) to use a two-step approach:

1. First query with exact region match: `.ilike("brand_name", resolvedBrandName).eq("region_code", region).eq("is_active", true)`
2. If no result, run a second query without region filter: `.ilike("brand_name", resolvedBrandName).eq("is_active", true).limit(1)`

This ensures brands like Eryone (CA) and Anycubic (CA) are found for US users.

**File**: `src/components/brands/BrandHeroSection.tsx`

The brand hero also needs the same fallback -- the `useAffiliateLink` hook change covers this automatically since BrandHeroSection already uses the hook.

---

### Issue 2: Static href on Outbound Links

After auditing all components, most use `window.open()` in onClick handlers (DealCard, GroupedDealCard, RetailerCard, StorePricingDisplay, HonestPriceDisplay). These are safe since there's no `<a>` href to bypass.

The one component with an actual `<a>` tag using a raw URL is:

**File**: `src/components/filament/BestPricesSection.tsx` (line 188)

The `<a href={bestRetailer.url}>` uses whatever URL came from the candidates/listings data. This URL may or may not already be an affiliate URL (depends on whether the parent hook built it). Since BestPricesSection receives `candidates[].affiliateUrl` from the parent pricing hook, the `bestRetailer.url` is already set to `c.affiliateUrl || c.productUrl` (line 74). However, if `affiliateUrl` is null (no program found), the raw URL leaks through.

Fix: Add `rel="nofollow sponsored noopener noreferrer"` to this `<a>` tag. The URL is already the best available (affiliate if exists, raw if not), so the main fix here is the `rel` attribute.

**File**: `src/components/brands/BrandHeroSection.tsx` (line 152-162)

There's a secondary `<a>` tag at lines 152-162 that links directly to the brand website without going through the affiliate system. This is the small "Website" link next to location/founded info. It should also use `buildLink` and have `rel="nofollow sponsored noopener noreferrer"` when an affiliate program exists.

Also update the `rel` attribute on the main "Visit Website" button's click handler (line 217) to include "sponsored" -- though since it uses `window.open`, the `rel` is set via the third argument which is already `noopener,noreferrer`. The `sponsored` attribute only applies to `<a>` tags for SEO purposes.

---

### Issue 3: Fix Link Verification Test

**File**: `src/components/admin/affiliate-hub/brand-mapping/LinkVerificationTest.tsx`

The tool already tests all vendors and sorts matched first (line 121). The issue described ("shows 0 matched") is because the region-locked query (`.eq("region_code", regionCode)`) fails for CA-only brands when the admin's region is US.

Fix: Add the same region fallback to the `resolveAndTest` function (lines 50-58): try exact region first, then fall back to any active program for the brand. This will make Eryone and Anycubic show as green checks instead of red X's.

Also update the `regionCode` field in the result to show which region was actually matched (e.g., "CA (fallback)") so admins can see when a non-exact match was used.

---

### Technical Details

```text
Files to modify:
  1. src/hooks/useAffiliateLink.ts
     - Change program lookup queryFn to try exact region, then any region fallback
     
  2. src/components/filament/BestPricesSection.tsx
     - Update rel attribute on <a> tag (line 188) to "nofollow sponsored noopener noreferrer"
     
  3. src/components/brands/BrandHeroSection.tsx
     - Update small "Website" <a> tag (line 152) to use buildLink + proper rel attribute
     - Both outbound links should use affiliate tracking
     
  4. src/components/admin/affiliate-hub/brand-mapping/LinkVerificationTest.tsx
     - Add region fallback to resolveAndTest function
     - Show fallback indicator in results
```


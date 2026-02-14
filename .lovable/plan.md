

## Plan: Connect Affiliate Programs to Product Store Links

This plan bridges the gap between the affiliate program database (affiliate_programs table) and the actual product pages by fixing brand name matching, URL domain mapping, and ensuring all outbound link components use affiliate tracking.

---

### Phase 1: Database Changes

**A. Create `brand_affiliate_aliases` table (migration)**

A new lookup table mapping product vendor names to affiliate program brand names.

- Columns: `id` (uuid PK), `product_vendor_name` (text, unique), `affiliate_brand_name` (text), `created_at` (timestamptz)
- RLS: SELECT open to all, ALL operations open to admins via `has_role()`
- Seed with 8 initial mappings (eSun->eSUN, ELEGOO->Elegoo, etc.)

**B. Add `product_url_domains` column to `affiliate_programs` (migration)**

- `ALTER TABLE affiliate_programs ADD COLUMN IF NOT EXISTS product_url_domains text[] DEFAULT NULL;`
- UPDATE each brand with known domain arrays (e.g., eSUN gets `['esun3dstore.com', 'esun3d.com', 'www.esun3d.com']`)

---

### Phase 2: Update `useAffiliateLink` Hook

**File**: `src/hooks/useAffiliateLink.ts`

1. **Add alias lookup query** -- Before querying `affiliate_programs`, first check `brand_affiliate_aliases` where `product_vendor_name ILIKE brandName`. If found, use `affiliate_brand_name` for the program lookup. Cache with 10-minute staleTime.

2. **Change `.eq()` to `.ilike()`** -- The `affiliate_programs` query changes from `.eq("brand_name", brandName!)` to `.ilike("brand_name", resolvedBrandName!)` for case-insensitive fallback matching.

3. **Update `buildLink` to handle domain mismatches** -- The current `buildLink` extracts the path from the product URL and combines it with the program's `store_base_url`. This needs smarter handling per link generation method:
   - `url_parameter`: Extract path from source URL, combine with `store_base_url` + path + tracking params
   - `awin_redirect`: Use the FULL original product URL as the `ued` parameter (Awin handles the redirect regardless of domain)
   - `redirect_link`: Return `default_tracking_link` (no deep linking possible)

---

### Phase 3: Update `AffiliateProgram` TypeScript Type

**File**: `src/types/affiliate.ts`

Add `product_url_domains: string[] | null;` to the `AffiliateProgram` interface.

---

### Phase 4: Update Outbound Link Components

After Phase 2 fixes, many components will automatically benefit since they already use `useAffiliateLink` or receive `affiliateUrl` from parent hooks. Here's the audit:

**Already using `useAffiliateLink` (will auto-fix via alias + ilike):**
- `FilamentPurchaseSidebar.tsx` -- uses `useAffiliateLink(vendor)` with `trackAndOpen`
- `FilamentHeroPurchaseCard.tsx` -- uses `useAffiliateLink(vendor)` with `trackAndOpen`
- `DealCard.tsx` -- uses `useAffiliateLink(deal.vendor)` with `trackAndOpen`

**Receiving `affiliateUrl` from parent (no change needed):**
- `StickyBuyBar.tsx` -- receives pre-built `affiliateUrl` prop from `FilamentDetail.tsx`
- `FilamentMobileBottomBar.tsx` -- receives pre-built `affiliateUrl` prop from `FilamentDetail.tsx`
- `BestPricesSection.tsx` -- uses `candidates[].affiliateUrl` from `useFilamentDetailPricing`
- `StorePricingDisplay.tsx` -- receives `affiliateUrl` prop from parent sidebar

**Using legacy `useAffiliateLinks` (old system) -- no change, kept as fallback:**
- `PurchaseSection.tsx` -- uses `getAffiliateUrl()` from legacy hook
- `GroupedDealCard.tsx` -- uses `getAffiliateUrl()` from legacy hook
- `RetailerCard.tsx` -- uses `getAffiliateUrl()` / `getAmazonUrl()` from legacy hook
- `RetailerCompareGrid.tsx` -- uses legacy system

These legacy components will continue to work via the old `affiliate_configs` edge function. The new system takes priority wherever `useAffiliateLink` is used.

**Brand pages -- new integration needed:**
- `BrandHeroSection.tsx` -- "Visit Website" button at line 204 links directly to `website` prop. Will add `useAffiliateLink(brandName)` and wrap the URL through `buildLink()` when `hasAffiliate` is true. Add a subtle "Affiliate Partner" badge.
- `BrandAboutTab.tsx` -- Two "Visit Website" links (line 178 and line 270). Same treatment: wrap through `buildLink()` when affiliate program exists.

---

### Phase 5: Update `buildAffiliateLinkLocal` Utility

**File**: `src/utils/affiliateLinks.ts`

Update the `awin_redirect` branch to accept full product URLs (not just paths). When the `path` argument starts with `http`, use it as-is for the `ued` parameter instead of prepending `store_base_url`. This handles the case where `esun3dstore.com` product URLs are passed but the affiliate program's `store_base_url` is `esun3d.com`.

---

### Technical Details

```text
Files to create:
  - supabase migration (brand_affiliate_aliases table + product_url_domains column + seed data)

Files to modify:
  - src/types/affiliate.ts (add product_url_domains field)
  - src/hooks/useAffiliateLink.ts (alias lookup, ilike matching, smarter buildLink)
  - src/utils/affiliateLinks.ts (handle full URLs in awin_redirect)
  - src/components/brands/BrandHeroSection.tsx (affiliate-tracked "Visit Website")
  - src/components/brands/tabs/BrandAboutTab.tsx (affiliate-tracked "Visit Website")

Files unchanged (auto-benefit from hook fix):
  - FilamentPurchaseSidebar.tsx
  - FilamentHeroPurchaseCard.tsx  
  - DealCard.tsx
  - StickyBuyBar.tsx (receives URL from parent)
  - FilamentMobileBottomBar.tsx (receives URL from parent)
  - BestPricesSection.tsx (receives URL from parent)

Files unchanged (legacy system, kept as fallback):
  - PurchaseSection.tsx
  - GroupedDealCard.tsx
  - RetailerCard.tsx
  - RetailerCompareGrid.tsx
```




## Extend Affiliate UI for Siraya Tech (GLOBAL Program)

### Summary
The existing `useAffiliateLink` hook already falls back to any active program when no region-specific match exists (lines 77-89), so Siraya Tech's GLOBAL program will already be picked up automatically for any user region. The changes needed are primarily UI polish: GLOBAL-aware display labels, source tracking, and softer discount code messaging.

### 1. GLOBAL-aware display in useAffiliateLink

**File:** `src/hooks/useAffiliateLink.ts`

The fallback query (lines 77-89) already works but doesn't prioritize GLOBAL explicitly. Update:
- Change the fallback to prefer `region_code = 'GLOBAL'` over arbitrary matches
- Add `resolvedRegion` to the return value so consumers know if GLOBAL was used

New return field:
```typescript
resolvedRegion: string | null; // 'GLOBAL', 'AU', 'UK', etc.
```

### 2. GLOBAL display handling in FilamentPurchaseSidebar and FilamentHeroPurchaseCard

**Files:**
- `src/components/filament/sidebar/FilamentPurchaseSidebar.tsx`
- `src/components/filament/hero/FilamentHeroPurchaseCard.tsx`

When `program.region_code === 'GLOBAL'`:
- Buy button label: "Shop [Brand]" instead of "Buy at [Brand] [Region]"
- No flag emoji; optionally show a globe icon
- These components already use `useAffiliateLink`, so just read `program.region_code`

### 3. Source tracking prop

**File:** `src/hooks/useAffiliateLink.ts`

Update `trackAndOpen` to accept an optional `source` field in `ClickMetadata`. Default to `'filascope-web'`. Pass it to the edge function via `trackAffiliateClick` (update the utility to include the `source` field as `sca_source` appended to the URL before opening).

Since the edge function already supports `source`, add it to the client-side `buildAffiliateLinkLocal` in `src/utils/affiliateLinks.ts` as well, appending `&sca_source=filascope-web` for UpPromote programs (detected by checking if the link template contains `sca_ref`).

### 4. Softer discount code empty state

**File:** `src/components/affiliate/AffiliateDiscountBanner.tsx`

Add a `pendingCodeMessage` optional string prop. When provided and no active codes exist, show that message instead of the generic "No discount codes available" text. For Siraya Tech, pass: "Discount code coming soon -- check back for exclusive offers."

The caller determines the message based on brand/program context.

### 5. BrandAboutTab -- already works

**File:** `src/components/brands/tabs/BrandAboutTab.tsx`

This component already calls `useAffiliateLink(brandName)` and gates website links through the affiliate system. When a user visits the Siraya Tech brand page, it will automatically pick up the GLOBAL program and affiliate-tag the "Visit Website" link. No changes needed here beyond ensuring the buy button label adapts for GLOBAL programs.

### 6. No new components needed

The plan from the user mentions a `ResinBrandAffiliateBanner` -- this is unnecessary because:
- `BrandAboutTab` already renders affiliate links for the brand page
- `FilamentPurchaseSidebar` will show the affiliate panel on any Siraya Tech product (if resin products exist in the filaments table)
- If no Siraya Tech products exist yet, the brand page alone is sufficient

---

### Files to modify

| File | Change |
|------|--------|
| `src/hooks/useAffiliateLink.ts` | Add `resolvedRegion` return; prioritize GLOBAL fallback; add `source` to trackAndOpen |
| `src/utils/affiliateLinks.ts` | Add optional `source` param to `buildAffiliateLinkLocal`; append `sca_source` for UpPromote templates |
| `src/components/affiliate/AffiliateDiscountBanner.tsx` | Add `pendingCodeMessage` prop for softer empty state |
| `src/components/filament/sidebar/FilamentPurchaseSidebar.tsx` | Adapt buy button label for GLOBAL programs; pass source and pendingCodeMessage |
| `src/components/filament/hero/FilamentHeroPurchaseCard.tsx` | Same GLOBAL label adaptation |


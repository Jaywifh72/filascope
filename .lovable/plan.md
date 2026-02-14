

## Route All Outbound Buy Links Through affiliate_programs

This fix ensures that every outbound `<a>` tag uses the new `affiliate_programs` system for its `href`, so even right-click "Open in New Tab" goes to the correct affiliate-tracked URL.

---

### Change 1: PrimaryBuyButton.tsx -- Add affiliate link building

Add a `vendor` prop. When provided, call `useAffiliateLink(vendor)` to get `buildLink`, `trackAndOpen`, and `hasAffiliate`.

- Compute `builtUrl = useMemo(() => hasAffiliate ? buildLink(url) : url, [hasAffiliate, buildLink, url])`
- Set `href={builtUrl}` instead of `href={url}`
- Set `rel` to `"nofollow sponsored noopener noreferrer"` when `hasAffiliate`, otherwise `"noopener noreferrer"`
- On click: if `hasAffiliate`, call `e.preventDefault()` then `trackAndOpen(url, { productName: retailerName, sourceComponent: 'primary_buy_button' })`. Otherwise, call the existing `onClick` prop.

### Change 2: BestPricesSection.tsx -- Add affiliate link building

Add a `vendor` prop (optional string). When provided, call `useAffiliateLink(vendor)`.

- Compute `builtUrl` from `buildLink(bestRetailer.url)` when affiliate exists
- Update the "Buy Now" `<a>` tag's `href` to use `builtUrl`
- Add `onClick` handler with `e.preventDefault()` + `trackAndOpen()` for click tracking
- The `rel` attribute is already correct

### Change 3: PurchaseSection.tsx -- Pass vendor to PrimaryBuyButton

The component already has `filament.vendor`. Pass it as a prop:
```
<PrimaryBuyButton vendor={filament.vendor} ... />
```

### Change 4: OverviewTabContent.tsx -- Pass vendor to BestPricesSection

The component already has the `filament` object. Pass vendor:
```
<BestPricesSection vendor={filament.vendor} ... />
```

---

### Technical Details

```text
Files to modify:
  1. src/components/filament/PrimaryBuyButton.tsx
     - Add vendor prop, useAffiliateLink hook, useMemo for builtUrl
     - Update href, rel, and onClick handler
     
  2. src/components/filament/BestPricesSection.tsx
     - Add vendor prop, useAffiliateLink hook, useMemo for builtUrl
     - Update "Buy Now" <a> tag href and add onClick
     
  3. src/components/filament/PurchaseSection.tsx
     - Pass vendor={filament.vendor} to PrimaryBuyButton
     
  4. src/components/filament/tabs/OverviewTabContent.tsx
     - Pass vendor={filament.vendor} to BestPricesSection
```

No database changes needed. The `useAffiliateLink` hook already handles alias resolution, case-insensitive matching, and region fallback.

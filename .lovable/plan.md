
## Audit Result — Most Is Already Implemented

After a thorough audit of `PrinterDetail.tsx` and `ProductJsonLd.tsx`, the Product JSON-LD and BreadcrumbList are **already emitted** on every printer detail page. What the user is requesting is substantially already present.

### What Already Exists (No Changes Needed)

- `<ProductJsonLd>` at line 671 emits a complete `Product` schema with:
  - `name`, `description`, `image`, `brand`, `sku`, `mpn`, `url` (slug-based canonical)
  - `category` → resolves to `"3D Printer - {technology}"` (e.g., `"3D Printer - FDM"`)
  - `additionalProperty` array covering Build Volume, Max Print Speed, Enclosure, Wi-Fi, Multi-Material, Extruder Type, Drive Type, Auto Bed Leveling, Input Shaping, Compatible Materials, and physical dimensions
  - `offers` (single Offer with USD price, availability, shipping details, return policy)
  - `aggregateRating` from `printer.rating_community_overall` (community reviews)
  - Machine dimensions (`width`, `depth`, `height`, `weight`)
- `<DetailBreadcrumb>` at line 729 emits BreadcrumbList JSON-LD: **Home > Printers > [Brand] > [Printer Name]**

### The Two Real Gaps to Fix

**Gap 1 — Single `Offer` instead of `AggregateOffer` with regional pricing**

The printer record has multi-regional prices stored directly in columns (`current_price_usd_store`, `current_price_cad_store`, `current_price_eur_store`, `current_price_gbp_store`, `current_price_aud_store`, `current_price_jpy_store`) and also MSRP variants. These are not assembled into `regionalOffers`, so `ProductJsonLd` emits a single `Offer` with just the USD price instead of an `AggregateOffer` with `lowPrice`/`highPrice`.

The filament page does this correctly by passing `detailPricing.allCandidates` into `regionalOffers`. The printer page needs equivalent logic.

**Gap 2 — No FilaScore fallback for `aggregateRating`**

The printer page passes `ratingValue={printer.rating_community_overall}` directly. For printers with no community reviews (where `rating_community_overall` is null), `aggregateRating` is suppressed entirely. The filament page has a `filaScoreRating5` fallback that scales the internal score. Printers don't have a `filascope_score` column, but they do have `printer.rating_community_overall` — this is the correct primary source. If null, the schema correctly omits `aggregateRating` (the right behavior for printers since there's no internal scoring equivalent).

**Only Gap 1 needs fixing.** Gap 2 is acceptable behavior — printers without community reviews should not emit a fabricated rating.

---

## Implementation Plan

### File Changed: `src/pages/PrinterDetail.tsx`

**Change: Build `printerRegionalOffers` from known regional price columns and pass to `ProductJsonLd`**

After the `unifiedPricing` hook call (around line 207), add a `useMemo` that assembles the regional offers array from the printer's stored price columns. This mirrors the pattern from `FilamentDetail.tsx`.

```typescript
// Build regional offers from printer's stored regional prices for AggregateOffer JSON-LD
const printerRegionalOffers = useMemo(() => {
  if (!printer) return undefined;

  const offers: Array<{
    region: 'US' | 'CA' | 'UK' | 'EU' | 'AU' | 'JP';
    price: number;
    currency: 'USD' | 'CAD' | 'EUR' | 'GBP' | 'AUD' | 'JPY';
    url?: string;
    availability: boolean;
  }> = [];

  const storeUrl = printer.official_store_url || undefined;
  const available = !isDiscontinued;  // ← defined later, so use !(printer.discontinued === true)

  if (printer.current_price_usd_store && printer.current_price_usd_store > 0)
    offers.push({ region: 'US', price: printer.current_price_usd_store, currency: 'USD', url: storeUrl, availability: available });
  if ((printer as any).current_price_cad_store && (printer as any).current_price_cad_store > 0)
    offers.push({ region: 'CA', price: (printer as any).current_price_cad_store, currency: 'CAD', url: storeUrl, availability: available });
  if ((printer as any).current_price_eur_store && (printer as any).current_price_eur_store > 0)
    offers.push({ region: 'EU', price: (printer as any).current_price_eur_store, currency: 'EUR', url: storeUrl, availability: available });
  if ((printer as any).current_price_gbp_store && (printer as any).current_price_gbp_store > 0)
    offers.push({ region: 'UK', price: (printer as any).current_price_gbp_store, currency: 'GBP', url: storeUrl, availability: available });
  if ((printer as any).current_price_aud_store && (printer as any).current_price_aud_store > 0)
    offers.push({ region: 'AU', price: (printer as any).current_price_aud_store, currency: 'AUD', url: storeUrl, availability: available });
  if ((printer as any).current_price_jpy_store && (printer as any).current_price_jpy_store > 0)
    offers.push({ region: 'JP', price: (printer as any).current_price_jpy_store, currency: 'JPY', url: storeUrl, availability: available });

  return offers.length >= 2 ? offers : undefined; // Only emit AggregateOffer if 2+ prices exist
}, [printer]);
```

Note: `isDiscontinued` is computed at line 626, which is inside the render path after the early returns. The `useMemo` needs to be placed before the early returns use it, or replicate the logic inline as `printer?.discontinued === true`. The memo will be placed in the pre-return section (before line 540, where the loading/not-found early returns are) using `printer?.discontinued === true`.

Then update the `<ProductJsonLd>` call to add:
```tsx
regionalOffers={printerRegionalOffers}
```

This will cause `ProductJsonLd` to emit an `AggregateOffer` with:
```json
{
  "@type": "AggregateOffer",
  "priceCurrency": "USD",
  "lowPrice": "299.00",
  "highPrice": "999.00",
  "offerCount": 4,
  "availability": "https://schema.org/InStock",
  "offers": [...]
}
```

**Note on `priceCurrency` in `AggregateOffer`:** `ProductJsonLd` sets `priceCurrency` to the user's active regional currency. The individual child `Offer` objects each carry their own `priceCurrency` matching the regional currency. This is the same pattern already working on filament pages.

---

## Summary of Changes

| File | Change | Lines |
|---|---|---|
| `src/pages/PrinterDetail.tsx` | Add `printerRegionalOffers` useMemo | After line ~224 (post `useUnifiedRegionalPricing`) |
| `src/pages/PrinterDetail.tsx` | Pass `regionalOffers={printerRegionalOffers}` to `<ProductJsonLd>` | Line ~725 |

No changes needed to:
- `ProductJsonLd.tsx` — interface already has `regionalOffers`, `AggregateOffer` logic already handles it
- `DetailBreadcrumb` — BreadcrumbList JSON-LD already correct
- Any SEO component — all existing

The result will be: Google's Rich Results Test will show `Product` schema with `AggregateOffer` (price range) for printers that have multi-regional pricing data, enabling price range snippets in SERPs.

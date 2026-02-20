
## GA4 Enhanced E-commerce Event Tracking for the Affiliate Funnel

### Current State Assessment

The existing analytics infrastructure in `src/lib/analytics.ts` is mature but incomplete for GA4's built-in E-commerce reports. Here is exactly what already exists and what is missing:

**Already implemented:**
- `trackProductView()` → fires `view_item`, but uses `productId` (UUID) instead of the SEO slug, misses the `item_list_id` grouping, and uses a hardcoded `currency: 'USD'` instead of the user's actual currency
- `trackAffiliateClick()` → fires `affiliate_click` + `begin_checkout`, but `begin_checkout` is not the correct funnel event for "click affiliate buy button"
- `trackComparisonAdd()` → fires `comparison_add` (custom), but does NOT fire GA4's standard `add_to_cart` ecommerce event

**Missing:**
1. `view_item` is using `productId` (UUID) — GA4 E-commerce needs the canonical slug (e.g. `bambu-lab-pla-matte-charcoal`) as `item_id`
2. `add_to_cart` standard ecommerce event is never fired when items enter the compare tray
3. `select_item` standard ecommerce event is never fired when a user clicks a buy button

**Why this matters for GA4 reports:** GA4's built-in "Monetization > E-commerce purchases" funnel report only aggregates `view_item`, `add_to_cart`, `select_item`, and `purchase`. Without these standard event names, the funnel shows zero data in those built-in reports.

---

### Affected Files and Changes

#### File 1: `src/lib/analytics.ts`

**New function: `trackEcommerceViewItem()`**

Replace the existing `trackProductView()` call sites with a proper ecommerce-shaped `view_item`. The existing function fires the event, but we need to also add a new typed function that accepts the canonical slug for `item_id`.

Add three new exported functions below the existing ones:

```typescript
// New interface for ecommerce-compliant view_item
export interface EcommerceItem {
  item_id: string;        // canonical slug, e.g. "bambu-lab-pla-matte-charcoal"
  item_name: string;
  item_brand: string;
  item_category: string;  // material type
  price?: number;
  affiliation?: string;   // store name, for select_item
}

/** GA4 Enhanced E-commerce: view_item — fires on filament detail page load */
export function trackEcommerceViewItem(params: {
  slug: string;
  name: string;
  brand: string;
  material: string;
  price?: number;
  currency?: string;
}) {
  gtag('event', 'view_item', {
    currency: params.currency || 'USD',
    value: params.price ?? 0,
    items: [{
      item_id: params.slug,
      item_name: params.name,
      item_brand: params.brand,
      item_category: params.material,
      price: params.price ?? 0,
      quantity: 1,
    }],
  });
}

/** GA4 Enhanced E-commerce: add_to_cart — fires when item is added to compare tray */
export function trackEcommerceAddToCart(params: {
  slug: string;
  name: string;
  brand: string;
  material: string;
}) {
  gtag('event', 'add_to_cart', {
    items: [{
      item_id: params.slug,
      item_name: params.name,
      item_brand: params.brand,
      item_category: params.material,
      quantity: 1,
    }],
  });
}

/** GA4 Enhanced E-commerce: select_item — fires when user clicks an affiliate buy button */
export function trackEcommerceSelectItem(params: {
  slug: string;
  name: string;
  brand: string;
  material: string;
  storeName: string;
  price?: number;
  currency?: string;
}) {
  gtag('event', 'select_item', {
    items: [{
      item_id: params.slug,
      item_name: params.name,
      item_brand: params.brand,
      item_category: params.material,
      affiliation: params.storeName,
      price: params.price ?? 0,
      quantity: 1,
    }],
  });
}
```

---

#### File 2: `src/pages/FilamentDetail.tsx`

**Hook point: `view_item` on page load**

At line 385–393, the existing `trackGA4ProductView()` call is already there. We replace/supplement it with the new `trackEcommerceViewItem()` call, using `canonicalSlug` (which is already derived at line 114–126 from the filament object) instead of `filament.id`.

Current code:
```typescript
// GA4 product view
trackGA4ProductView({
  productId: filament.id,
  productName: filament.product_title || 'Unknown',
  brand: filament.vendor || 'Unknown',
  category: filament.material || undefined,
  price: filament.variant_price ?? undefined,
  currency: 'USD',
});
```

New code (add alongside, not replace, to preserve backward compat):
```typescript
// GA4 product view (legacy custom event — preserved for Explore reports)
trackGA4ProductView({ ... });  // keep as-is

// GA4 Enhanced E-commerce: view_item (feeds built-in Monetization reports)
trackEcommerceViewItem({
  slug: canonicalSlug,                           // SEO slug, not UUID
  name: filament.product_title || 'Unknown',
  brand: filament.vendor || 'Unknown',
  material: filament.material || 'Filament',
  price: detailPricing?.bestPrice?.spoolPrice ?? filament.variant_price ?? undefined,
  currency: userCurrency,                        // from REGIONS[currentRegionCode].defaultCurrency
});
```

The `userCurrency` variable is already defined at line 238: `const userCurrency = REGIONS[currentRegionCode as RegionCode]?.defaultCurrency || 'USD';`

The `canonicalSlug` is already defined at line 114.

One new import line: `import { trackProductView as trackGA4ProductView, trackEcommerceViewItem } from "@/lib/analytics";`

---

#### File 3: `src/hooks/useCompare.tsx`

**Hook point: `add_to_cart` when item enters compare tray**

At line 253–288, the `addItem()` function calls `trackComparisonAdd()` at line 271. We add `trackEcommerceAddToCart()` directly after it.

The `CompareItem` interface (line 5–15) already has `product_title`, `vendor`, `material` fields. The slug is not stored in `CompareItem`, so we use `product_title` as `item_name` and fall back gracefully.

Challenge: `CompareItem` does not have a `slug` field — only `id` (UUID) and `product_title`. We have two options:

**Option A (preferred):** Add an optional `slug?: string` field to `CompareItem`. All call sites that construct `CompareItem` in the compare-button handlers would pass the slug when available.

**Option B (simpler):** Use the `id` field as `item_id` in the ecommerce event. Not ideal for GA4 readability but works immediately without touching all call sites.

**Recommendation:** Use Option B for `add_to_cart` in `useCompare.tsx` (fires from many call sites across the app — 18 files use `addItem`). Then use the correct slug in `select_item` (only fired from buy-button components where slug is already in scope).

Changes inside `addItem` callback (line 253–288), after line 271:
```typescript
trackComparisonAdd(item.id, 'filament', item.product_title, newCount, item.vendor || undefined);

// GA4 Enhanced E-commerce: add_to_cart (feeds built-in funnel reports)
trackEcommerceAddToCart({
  slug: item.id,                        // using id — slug not carried in CompareItem
  name: item.product_title,
  brand: item.vendor || 'Unknown',
  material: item.material || 'Filament',
});
```

Import to add at line 2: `import { trackComparisonAdd, trackEcommerceAddToCart } from "@/lib/analytics";`

---

#### File 4: `src/hooks/useAffiliateLink.ts`

**Hook point: `select_item` when affiliate buy button is clicked**

The `trackAndOpen()` function at line 142–174 is the single centralised point where all affiliate clicks flow through (used by `PrimaryBuyButton`, `FilamentPurchaseSidebar`, `FilamentHeroPurchaseCard`, `QuickSummaryBar`, `BestPricesSection`, `FilamentMobileBottomBar`).

The `ClickMetadata` interface (line 9–16) already has `productName`, `productSlug`, `price`, `currency` fields. We extend it with the filament's material:

Add `material?: string` to `ClickMetadata`:
```typescript
export interface ClickMetadata {
  productName?: string;
  productSlug?: string;
  sourcePage?: string;
  sourceComponent?: string;
  price?: number;
  currency?: string;
  material?: string;  // ADD THIS for GA4 select_item item_category
}
```

In `trackAndOpen()` (line 142–174), after the `trackGA4AffiliateClick()` call at line 147:
```typescript
// GA4 Enhanced E-commerce: select_item (user clicked an affiliate buy button)
import { trackEcommerceSelectItem } from "@/lib/analytics";

trackEcommerceSelectItem({
  slug: metadata.productSlug || metadata.productName?.toLowerCase().replace(/\s+/g, '-') || '',
  name: metadata.productName || '',
  brand: program?.brand_name || brandName || '',
  material: metadata.material || 'Filament',
  storeName: program?.brand_name || brandName || 'Store',
  price: metadata.price,
  currency: metadata.currency,
});
```

---

#### File 5: Call-site updates (buy button components)

The `trackAndOpen()` metadata needs `productSlug` and `material` passed through. Currently, most call sites pass `productName` and `sourceComponent` but not `productSlug`. We update the four main buy-button components to pass these:

**`src/components/filament/PrimaryBuyButton.tsx`** — add `slug` and `material` props, pass them in `trackAndOpen()` metadata:
```typescript
// Current:
trackAndOpen(url, { productName: retailerName, sourcePage: ..., sourceComponent: 'primary_buy_button' });

// New:
trackAndOpen(url, { productName: retailerName, productSlug: slug, material: material, sourcePage: ..., sourceComponent: 'primary_buy_button' });
```

**`src/components/filament/sidebar/FilamentPurchaseSidebar.tsx`** — `productTitle` and `material` already exist as props. Add `productSlug` prop and pass it through:
```typescript
// Current:
trackAndOpen(affiliateUrl, { productName: productTitle || undefined, sourceComponent: 'sidebar_purchase' });

// New (productSlug prop added to interface):
trackAndOpen(affiliateUrl, { productName: productTitle || undefined, productSlug: productSlug, material: material || undefined, sourceComponent: 'sidebar_purchase' });
```

**`src/components/filament/hero/FilamentHeroPurchaseCard.tsx`** — already has `vendor` and `productTitle` in scope; add `slug` and `material` props.

**`src/components/filament/StickyBuyBar.tsx`** — this component fires `trackGA4AffiliateClick` directly (not via `trackAndOpen`). We add `trackEcommerceSelectItem` here directly, using `filament.id` as the slug fallback since it only has the filament object (not the canonical slug). The filament object would need a `product_handle` field which is already on the filament type.

---

### Summary of Changes

| File | Change |
|---|---|
| `src/lib/analytics.ts` | Add 3 new functions: `trackEcommerceViewItem`, `trackEcommerceAddToCart`, `trackEcommerceSelectItem` |
| `src/pages/FilamentDetail.tsx` | Upgrade `view_item` call to use canonical slug + user currency |
| `src/hooks/useCompare.tsx` | Fire `add_to_cart` inside `addItem()` |
| `src/hooks/useAffiliateLink.ts` | Fire `select_item` inside `trackAndOpen()`, extend `ClickMetadata` with `material` |
| `src/components/filament/PrimaryBuyButton.tsx` | Pass `productSlug` + `material` to `trackAndOpen()` metadata |
| `src/components/filament/sidebar/FilamentPurchaseSidebar.tsx` | Add `productSlug` prop, pass to `trackAndOpen()` metadata |
| `src/components/filament/hero/FilamentHeroPurchaseCard.tsx` | Add `productSlug` + `material` props, pass to `trackAndOpen()` metadata |
| `src/components/filament/StickyBuyBar.tsx` | Add direct `trackEcommerceSelectItem` call in `handleBuyClick()` |

### GA4 Funnel After This Change

```text
BROWSE (page_view)
    ↓
VIEW (view_item)        ← FilamentDetail.tsx on load, with canonical slug + live currency
    ↓
COMPARE (add_to_cart)  ← useCompare.tsx addItem(), from any compare button across the app
    ↓
CLICK (select_item)    ← useAffiliateLink.ts trackAndOpen() — single choke point for all buy buttons
    ↓
(external — user purchases on retailer site)
```

This maps directly to GA4's "Monetization → E-commerce purchases" funnel report, with no additional GA4 configuration needed because `view_item`, `add_to_cart`, and `select_item` are automatically recognised event names.

### What is intentionally NOT changed

- `trackProductView()` and `trackAffiliateClick()` in `analytics.ts` — kept for backward compat (custom Explore reports, Supabase `affiliate_clicks` table logging)
- `trackComparisonAdd()` in `useCompare.tsx` — kept alongside `add_to_cart` (powers the `comparison_add` custom dimension already in GA4 config)
- `begin_checkout` in `trackAffiliateClick()` — kept as-is; it fires on every affiliate click and is used for the existing revenue estimation in GA4 Explore
- No changes to the `PurchaseSection`, `QuickSummaryBar`, `BestPricesSection`, or `FilamentMobileBottomBar` buy buttons — these all route through `useAffiliateLink.trackAndOpen()` which will automatically get `select_item` from File 4's change

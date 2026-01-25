
# FilamentDetail & PricingTab Regional Integration

## Summary
Update the `FilamentDetail.tsx` and `PricingTabContent.tsx` components to dynamically use regional store data from the database via the newly created `regionalStoreUtils.ts`, ensuring prices and store links reflect the user's selected region.

## Current State Analysis

The codebase already has:
1. **`useRegionalPriceV2`** - Queries `brand_regional_stores` by `brandId`, finds best store using fallback logic
2. **`useRegionalPrice`** - Uses hardcoded column mappings (`price_cad`, `product_url_ca`) for regional data
3. **`PricingTabContent`** - Already integrates `useRegionalPriceV2` for the "Regional Stores" section
4. **`FilamentDetail`** - Uses both `useRegionalPrice` (old) and passes `brandId` to `PricingTabContent`

The main gap: `brandId` is not being passed to `PricingTabContent`, and the component doesn't have direct access to product-specific regional URLs from `brand_regional_stores`.

## Technical Changes

### 1. FilamentDetail.tsx Updates

**Add `brandId` prop to PricingTabContent call (line ~638-652)**

The `brandId` needs to be fetched or derived. Looking at the current code, there's no direct `brandId` available - filaments only have `vendor` (brand name).

**New approach**: Add a query to fetch `brandId` from `automated_brands` table based on `vendor` name.

```typescript
// Add state and effect to fetch brandId
const [brandId, setBrandId] = useState<string | null>(null);

useEffect(() => {
  const fetchBrandId = async () => {
    if (!filament?.vendor) return;
    const { data } = await supabase
      .from('automated_brands')
      .select('id')
      .ilike('brand_name', filament.vendor)
      .limit(1)
      .maybeSingle();
    setBrandId(data?.id || null);
  };
  fetchBrandId();
}, [filament?.vendor]);

// Then pass to PricingTabContent
<PricingTabContent
  ...
  brandId={brandId}
/>
```

### 2. PricingTabContent.tsx Updates

**Update interface (lines ~39-51)**

Add `brandId` to the existing props - it's already there but optional:
```typescript
interface PricingTabContentProps {
  // ... existing props
  brandId?: string | null;  // Already exists
}
```

**Regional Stores Section Improvements (lines ~351-478)**

The "Regional Stores" section already uses `useRegionalPriceV2`. Key improvements needed:

1. **Use product-specific URLs** - Currently showing `store.base_url`, should interpolate with product SKU/slug
2. **Accurate price display** - Currently using hardcoded `pricePerSpool`, should use store-specific prices if available
3. **Better conversion tooltips** - Add detailed tooltip showing original price and conversion rate

**Updated Store Card Logic:**
```typescript
import { interpolateProductUrl } from '@/utils/regionalStoreUtils';

// Inside the stores map:
{sortedStores.map((store) => {
  const isUserRegion = store.region_code === region;
  const storeRegion = REGIONS[store.region_code];
  const needsConversion = store.currency_code !== currency;
  
  // Get product-specific URL if pattern exists
  const productUrl = store.product_url_pattern && filament.variant_sku
    ? interpolateProductUrl(store.product_url_pattern, filament.variant_sku)
    : store.base_url;
  
  // Calculate proper conversion
  const rate = getConversionRate(store.currency_code, currency);
  const storeNativePrice = /* price from store's region or basePrice */;
  const convertedPrice = needsConversion ? storeNativePrice * rate : storeNativePrice;
  
  return (
    <div key={store.id} onClick={() => window.open(productUrl, '_blank')}>
      {/* Store display */}
      <Tooltip>
        <TooltipContent>
          {needsConversion && (
            <>
              <p>Original: {formatCurrencyPrice(storeNativePrice, store.currency_code)}</p>
              <p>Rate: 1 {store.currency_code} = {rate.toFixed(4)} {currency}</p>
            </>
          )}
        </TooltipContent>
      </Tooltip>
    </div>
  );
})}
```

### 3. Add Product SKU/Slug to Props

The `PricingTabContent` needs the product's SKU or slug to generate correct store URLs.

**Update PricingTabContentProps:**
```typescript
interface PricingTabContentProps {
  filament: Filament;
  retailers: Retailer[];
  pricePerKg: number | null;
  pricePerSpool: number | null;
  affiliateUrl: string | null;
  hasActualRegionalPrice: boolean;
  productUrl?: string | null;
  originalUsUrl?: string | null;
  onViewRetailers: () => void;
  onRetailerClick: (retailer: Retailer) => void;
  brandId?: string | null;
  productSku?: string | null;  // NEW
}
```

### 4. Enhanced Regional Price Display

**"Best Price Available" section improvements:**

```typescript
// Add loading state for regional data
{storesLoading || priceLoading ? (
  <div className="flex items-center gap-2">
    <Loader2 className="w-4 h-4 animate-spin" />
    <span className="text-sm text-muted-foreground">Loading regional prices...</span>
  </div>
) : (
  <div className="flex items-baseline gap-2">
    <span className="text-4xl font-bold text-white">
      {needsConversion ? '~' : ''}
      {formatDisplayPrice(displayPricePerKg) || 'N/A'}
    </span>
    <span className="text-lg text-muted-foreground">/kg</span>
    {needsConversion && (
      <Tooltip>
        <TooltipTrigger>
          <Info className="w-4 h-4 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent>
          <p>Original: {originalPriceFormatted}</p>
          <p>Rate: {rateInfo}</p>
        </TooltipContent>
      </Tooltip>
    )}
  </div>
)}
```

### 5. Store Attribution Updates

Ensure "Available Retailers" section shows regional badges:

```typescript
// In retailers.map()
<div className="font-medium flex items-center gap-2">
  {retailer.name}
  {retailer.region && (
    <Badge variant="outline" className="text-xs">
      {REGIONS[retailer.region]?.flag} {retailer.region}
    </Badge>
  )}
  {retailer.region === region && (
    <Badge className="bg-primary/20 text-primary text-xs">
      Local
    </Badge>
  )}
</div>
```

## File Modifications

### File 1: `src/pages/FilamentDetail.tsx`
- Add `brandId` state and fetch logic (~10 lines)
- Pass `brandId` and `productSku` to `PricingTabContent` (2 lines)

### File 2: `src/components/filament/tabs/PricingTabContent.tsx`
- Add import for `interpolateProductUrl` (1 line)
- Update props interface to include `productSku` (1 line)
- Update store URL generation logic (5-10 lines)
- Enhance price conversion tooltip display (15-20 lines)
- Add loading skeleton for regional data (5 lines)

## Implementation Flow

```text
┌─────────────────────────────────────────────────────┐
│                  FilamentDetail                      │
│                                                     │
│  1. Fetch filament data                             │
│  2. Derive brandId from vendor name                 │
│  3. Pass brandId + productSku to PricingTabContent  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│               PricingTabContent                      │
│                                                     │
│  1. useRegionalPriceV2(brandId) - fetch all stores  │
│  2. Sort stores by user's region                    │
│  3. For each store:                                 │
│     - Generate product URL via interpolation        │
│     - Calculate converted price with rate           │
│     - Show tooltip with original price              │
│  4. Display "Local" badge if store matches region   │
└─────────────────────────────────────────────────────┘
```

## Price Display Standards

| Scenario | Display Format | Tooltip |
|----------|----------------|---------|
| Native price (store currency = user currency) | `$12.00` | None |
| Converted price | `~$14.40` (muted) | "Original: C$12.00 CAD • Rate: 1 CAD = 1.20 USD" |
| No price available | "—" | None |

## Dependencies

No new dependencies required. Uses existing:
- `@/utils/regionalStoreUtils` (just created)
- `@/hooks/useRegionalPriceV2`
- `@/contexts/RegionContext`
- `@/config/regions`

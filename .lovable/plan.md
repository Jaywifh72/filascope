
# Comprehensive Regional Store & Pricing Audit Report

## Executive Summary

This audit covers the database state, URL construction logic, price display accuracy, and identifies gaps in the regional pricing system.

---

## TASK 1: DATABASE AUDIT

### 1.1 Complete Brand-Region Store Mapping

| Brand | Regions Covered | Ships From | Total Stores |
|-------|-----------------|------------|--------------|
| 3D-Fuel | US | US | 1 |
| 3DHOJOR | US | US | 1 |
| 3DXTech | US | US | 1 |
| Amazon Basics | AU, CA, EU, JP, UK, US | AU, CA, DE, JP, UK, US | 6 |
| Amolen | US | US | 1 |
| Anycubic | AU, CA, EU, UK, US | AU, CA, DE, UK, US | 5 |
| Atomic Filament | US | US | 1 |
| AzureFilm | EU, US | SI (Slovenia) | 2 |
| Bambu Lab | AU, CA, CN, EU, JP, UK, US | AU, CA, CN, DE, JP, UK, US | 7 |
| ColorFabb | EU, US | NL | 2 |
| Creality | AU, CA, EU, UK, US | AU, CA, DE, UK, US | 5 |
| Duramic 3D | US | US | 1 |
| Elegoo | AU, CA, EU, UK, US | AU, CA, DE, UK, US | 5 |
| Eryone | EU, US | CN, DE | 2 |
| eSun | EU, US | NL, US | 2 |
| Extrudr | EU, US | AT | 2 |
| Fiberlogy | EU, US | PL | 2 |
| Fillamentum | EU, US | CZ | 2 |
| FormFutura | EU, US | NL | 2 |
| Fusion Filaments | US | US | 1 |
| Geeetech | US | CN | 1 |
| Gizmo Dorks | US | US | 1 |
| Hatchbox | CA, UK, US | US | 3 |
| IC3D Printers | US | US | 1 |
| Kingroon | EU, US | CN, DE | 2 |
| Matter3D | CA, US | CA | 2 |
| NinjaTek | US | US | 1 |
| Numakers | US | US | 1 |
| Overture | CA, US | US | 2 |
| Paramount 3D | US | US | 1 |
| Polymaker | CA, EU, UK, US | CA, NL, UK, US | 4 |
| Proto-Pasta | US | US | 1 |
| Prusa | EU, US | CZ | 2 |
| Prusament | EU, US | CZ | 2 |
| Push Plastic | US | US | 1 |
| Recreus | EU, US | ES | 2 |
| Siraya Tech | US | US | 1 |
| Sovol | EU, US | DE, US | 2 |
| Spectrum Filaments | EU | PL | 1 |
| Sunlu | EU, UK, US | DE, UK, US | 3 |
| TreeD Filaments | EU | IT | 1 |
| Ultimaker | EU, US | NL, US | 2 |
| VoxelPLA | US | US | 1 |
| **Yousu** | **NONE** | **NONE** | **0** |
| Ziro | US | CN | 1 |

### 1.2 Brands with NO Regional Stores

| Brand | Status | Action Required |
|-------|--------|-----------------|
| Yousu | No stores defined | Add at least US store |

### 1.3 Potential Duplicate/Fake Stores Analysis

These stores have the same base_url as the US store but are marked as legitimate because they ship from different countries (EU warehouses):

| Brand | Region | Store Name | Base URL | Ships From | Status |
|-------|--------|------------|----------|------------|--------|
| AzureFilm | EU | AzureFilm | azurefilm.com | SI (Slovenia) | **VALID** - EU-based brand |
| ColorFabb | EU | ColorFabb | colorfabb.com | NL | **VALID** - EU warehouse |
| eSun | EU | eSun EU | esun3dstore.com | NL | **VALID** - NL warehouse |
| Extrudr | EU | Extrudr | extrudr.com | AT | **VALID** - EU-based brand |
| Fiberlogy | EU | Fiberlogy | fiberlogy.com | PL | **VALID** - EU-based brand |
| Fillamentum | EU | Fillamentum | fillamentum.com | CZ | **VALID** - EU-based brand |

**Result**: No fake stores detected. Previous cleanup successfully removed duplicates.

### 1.4 Regional Currency Data Coverage

| Metric | Count | Percentage |
|--------|-------|------------|
| Total products with USD price | 7,545 | 100% |
| Products with CAD price | 661 | 8.8% |
| Products with EUR price | 698 | 9.3% |
| Products with GBP price | 0 | 0% |
| Products with AUD price | 0 | 0% |

**Brands with Native CAD Pricing**:
- Polymaker: 561 products
- Elegoo: 100 products

**Brands with Native EUR Pricing**:
- Fiberlogy: 274 products
- Fillamentum: 194 products
- Extrudr: 131 products
- AzureFilm: 99 products

### 1.5 Exchange Rate Status

| Currency | Rate (USD→) | Source | Age |
|----------|-------------|--------|-----|
| AUD | 1.432478 | exchangerate-api.com | 1.5 hours |
| CAD | 1.357377 | exchangerate-api.com | 1.5 hours |
| CHF | 0.771093 | exchangerate-api.com | 1.5 hours |
| CNY | 6.964556 | exchangerate-api.com | 1.5 hours |
| CZK | 20.454948 | exchangerate-api.com | 1.5 hours |
| EUR | 0.841017 | exchangerate-api.com | 1.5 hours |
| GBP | 0.728755 | exchangerate-api.com | 1.5 hours |
| JPY | 154.382329 | exchangerate-api.com | 1.5 hours |
| KRW | 1444.326478 | exchangerate-api.com | 1.5 hours |
| PLN | 3.539545 | exchangerate-api.com | 1.5 hours |
| SEK | 8.876910 | exchangerate-api.com | 1.5 hours |
| INR | 83.12 | **manual** | **162.9 hours (stale)** |

**Issue Found**: INR rate is 6.8 days old (manual entry)

---

## TASK 2: CODE AUDIT - STORE URL LOGIC

### 2.1 useUnifiedRegionalPricing.ts (Lines 397-621)

**URL Construction Flow**:
```text
1. Brand name → fetchBrandByName() → brand_id
2. Brand ID → fetchRegionalStores() → BrandRegionalStoreRow[]
3. User region → findBestStore() → { store, isLocal }
4. Product slug + store.product_url_pattern → buildRegionalUrl() → final URL
```

**Key Functions**:

| Function | Line | Purpose |
|----------|------|---------|
| `resolveProductSlugFromData()` | 134-185 | Extract slug from product_handle, URL, or name |
| `findBestStore()` | 253-284 | Match region with fallback chain |
| `buildRegionalUrl()` | 226-248 | Apply pattern: `{slug}`, `{sku}`, `{product}`, `{handle}` |

**Fallback Logic** (Lines 268-274):
```typescript
const fallbacks = REGION_FALLBACK_ORDER[userRegion] || [];
for (const fallbackRegion of fallbacks) {
  const fallbackStore = stores.find(s => s.region_code === fallbackRegion);
  if (fallbackStore) {
    return { store: fallbackStore, isLocal: false };
  }
}
```

**Fallback Order** (from `config/regions.ts`):
- US → [CA, UK, EU, AU]
- CA → [US, UK, EU, AU]
- UK → [EU, US, CA, AU]
- EU → [UK, US, CA, AU]
- AU → [US, UK, EU, CA]
- JP → [US, CN, AU, EU]
- CN → [US, JP, EU, AU]

### 2.2 FilamentPurchaseSidebar.tsx (Lines 63-469)

**Price Priority** (Lines 175-185):
```typescript
// PRIORITY 1: Regional pricing from parent (already converted)
// PRIORITY 2: Live price (automatically converted by useCurrentPrice)
// PRIORITY 3: Fall back to passed-in pricePerSpool

const displayPrice = hasValidRegionalPrice 
  ? regionalPriceResult.displayPrice 
  : hasValidLivePrice 
    ? livePrice 
    : pricePerSpool;
```

**Buy Button URL** (Lines 122-132):
```typescript
const handleBuyClick = () => {
  if (!affiliateUrl) return;
  trackStoreClick({...});
  window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
};
```

**Issue**: `affiliateUrl` is passed as a prop - the URL is constructed upstream in `FilamentDetail.tsx`

### 2.3 PurchaseSidebar.tsx (Printers) (Lines 35-159)

**URL Construction** (Lines 47-49):
```typescript
const affiliateUrl = officialStoreUrl && getAffiliateUrl
  ? getAffiliateUrl(officialStoreUrl, brand)
  : officialStoreUrl;
```

**Regional Warning Display** (Lines 84-99):
```typescript
{!isLocalStore && storeRegion && (
  <div className="...text-amber-400...">
    <Globe className="w-3.5 h-3.5" />
    <div>
      <span>{REGIONS[storeRegion]?.flag} {REGIONS[storeRegion]?.name} store</span>
      {shipsFromCountry && <span>Ships from {shipsFromCountry}</span>}
    </div>
  </div>
)}
```

### 2.4 Product URL Pattern Analysis

From database query, patterns found:

| Brand | Pattern | Example |
|-------|---------|---------|
| 3D-Fuel | `https://3dfuel.com/products/{sku}` | Standard Shopify |
| Bambu Lab | `https://{region}.store.bambulab.com/products/{slug}` | Subdomain-based |
| Anycubic | `https://store.anycubic.com/en-{locale}/products/{slug}` | Locale path |
| Creality | `https://store.creality.com/{region}/products/{slug}` | Region path |
| Amazon Basics | `null` (no pattern) | **Issue**: No product-level URLs |

---

## TASK 3: PRICE DISPLAY LOGIC VERIFICATION

### 3.1 Scenario: Region Has Local Store

**Code Path** (useUnifiedRegionalPricing.ts, Lines 577-601):
```typescript
return {
  displayPrice,
  displayCurrency: currency,
  formattedPrice: formatPrice(displayPrice, currency, { showApproximate: needsConversion }),
  isLocalStore: isLocal,
  storeFlag,
  shipsFromCountry: matchedStore.ships_from_country,
  isConverted: needsConversion && basePrice != null,
  ...
};
```

**Verification**: Shows local price when `isLocal: true`, no tilde prefix.

### 3.2 Scenario: Region Has No Store (Fallback)

**Code Path** (Lines 504-537):
```typescript
if (!matchedStore) {
  const needsConversion = baseCurrency !== currency;
  const displayPrice = basePrice != null 
    ? (needsConversion ? convertPrice(basePrice, baseCurrency) : basePrice)
    : null;
  
  return {
    ...DEFAULT_RESULT,
    formattedPrice: displayPrice != null 
      ? formatPrice(displayPrice, currency, { showApproximate: needsConversion })
      : 'Price unavailable',
    isLocalStore: false,
    ...
  };
}
```

**Verification**: Converts price and shows `~` prefix for converted prices.

### 3.3 Currency Symbol Verification

**formatPrice()** from `config/currencies.ts` (Lines 85-112):
```typescript
export function formatPrice(amount, currencyCode, options) {
  const config = CURRENCIES[currencyCode];
  const prefix = options?.showApproximate ? '~' : '';
  
  if (config.symbolPosition === 'before') {
    return `${prefix}${config.symbol}${formatted}`;
  } else {
    return `${prefix}${formatted} ${config.symbol}`;
  }
}
```

**Currency Symbols**:
| Currency | Symbol | Position |
|----------|--------|----------|
| USD | $ | before |
| CAD | C$ | before |
| EUR | € | before |
| GBP | £ | before |
| AUD | A$ | before |
| JPY | ¥ | before |
| CNY | ¥ | before |
| SEK | kr | **after** |

### 3.4 "Ships From" Warning Display

**FilamentPurchaseSidebar.tsx** (Lines 299-314):
```typescript
{!isLocalStore && storeRegionCode && (
  <div className="...text-amber-400...">
    <Globe className="w-3.5 h-3.5" />
    <div className="flex flex-col">
      <span className="font-medium">
        {storeRegionFlag} {REGIONS[storeRegionCode]?.name} store
      </span>
      {regionalPriceResult?.store?.shipsFrom && (
        <span className="text-amber-400/80">
          Ships from {regionalPriceResult.store.shipsFrom}
        </span>
      )}
    </div>
  </div>
)}
```

**Verification**: Warning displays correctly when `isLocalStore: false`.

---

## TASK 4: IDENTIFIED GAPS

### 4.1 Brands with Missing Regional Coverage

**High Priority** (Popular brands needing expansion):

| Brand | Products | Current Regions | Missing Regions |
|-------|----------|-----------------|-----------------|
| eSun | 360 | EU, US | CA, UK, AU |
| Hatchbox | 174 | CA, UK, US | EU, AU |
| Overture | 180 | CA, US | EU, UK, AU |
| Sunlu | 88 | EU, UK, US | CA, AU |
| Proto-Pasta | 359 | US | CA, UK, EU, AU |
| Eryone | 318 | EU, US | CA, UK, AU |

**Medium Priority** (US-only brands):

| Brand | Products | Action |
|-------|----------|--------|
| 3D-Fuel | 244 | Add CA, EU (ships international) |
| 3DXTech | 174 | Add EU (engineering materials demand) |
| Atomic Filament | 164 | US specialty - OK as-is |
| Amolen | 276 | Amazon-heavy - add regional Amazon links |
| Gizmo Dorks | 132 | US specialty - OK as-is |
| Push Plastic | 155 | Add CA (ships to CA) |
| NinjaTek | varies | Add EU (Fenner Drives is global) |

### 4.2 Amazon Basics URL Issue

**Problem**: Amazon Basics has 6 regional stores configured but **NO product_url_pattern**.

```sql
-- Current state
brand_name: Amazon Basics
product_url_pattern: NULL (all regions)
base_url: https://www.amazon.com/stores/AmazonBasics
```

**Impact**: "Buy Now" links go to Amazon storefront, not specific products.

**Fix Required**: Amazon product URLs use ASIN format: `https://www.amazon.com/dp/{ASIN}`
- Need to store ASIN in `product_handle` column
- Add pattern: `https://www.amazon.{tld}/dp/{slug}`

### 4.3 Missing GBP and AUD Native Pricing

**Current State**:
- 0 products have native GBP prices
- 0 products have native AUD prices

**Impact**: All UK and AU users see converted prices (~£XX, ~A$XX).

**Brands that should have native UK/AU pricing**:
- Polymaker (has UK store, 573 products)
- Bambu Lab (has UK/AU stores, 227 products)
- Creality (has UK/AU stores, 122 products)
- Anycubic (has UK/AU stores, 685 products)
- Elegoo (has UK/AU stores, 100 products)

### 4.4 Yousu Brand - No Configuration

**Issue**: Brand "Yousu" exists in `automated_brands` but has zero stores.

**Action**: Either:
1. Add store configuration (likely Amazon/AliExpress)
2. Mark brand as inactive if products were removed

### 4.5 Stale Exchange Rate

**Issue**: INR (Indian Rupee) rate is 162.9 hours old (manual entry).

**Action**: Add INR to the `update-exchange-rates` Edge Function target currencies.

---

## IMPLEMENTATION RECOMMENDATIONS

### Priority 1: Critical Fixes
1. **Add Amazon ASIN support** - Fix Amazon Basics product URLs
2. **Update INR exchange rate** - Add to automated updater
3. **Configure Yousu brand** - Add store or mark inactive

### Priority 2: Coverage Expansion
1. **Add UK/AU native pricing** - Scrape prices from regional stores for major brands
2. **Expand eSun regional stores** - Add CA, UK, AU with appropriate fallback
3. **Expand Hatchbox** - Add EU, AU via Amazon links

### Priority 3: Data Quality
1. **Populate price_gbp/price_aud columns** - Via regional scraping
2. **Add product_url_pattern for Amazon** - Enable direct product links
3. **Regular duplicate store audits** - Prevent fake store re-creation

---

## DATABASE QUERIES FOR REFERENCE

**Find products by brand without regional pricing**:
```sql
SELECT vendor, COUNT(*) as count
FROM filaments 
WHERE variant_price IS NOT NULL 
  AND price_cad IS NULL 
  AND price_eur IS NULL
GROUP BY vendor 
ORDER BY count DESC;
```

**Find brands needing expansion**:
```sql
SELECT 
  ab.brand_name,
  (SELECT COUNT(*) FROM filaments f WHERE f.vendor ILIKE ab.brand_name) as product_count,
  ARRAY_AGG(brs.region_code) as regions
FROM automated_brands ab
LEFT JOIN brand_regional_stores brs ON brs.brand_id = ab.id AND brs.is_active = true
GROUP BY ab.id, ab.brand_name
HAVING COUNT(brs.id) < 3
ORDER BY product_count DESC;
```

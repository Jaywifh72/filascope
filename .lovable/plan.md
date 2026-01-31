
# Regional/Currency Admin Testing Dashboard

## Overview

Create a comprehensive admin-only dashboard at `/admin/region-test` for verifying regional pricing accuracy across all currencies and stores. This tool will help ensure price consistency between FilaScope's displayed prices and actual store prices.

---

## Features Summary

| Feature | Description |
|---------|-------------|
| Multi-Region Switcher | Test all 7 regions side-by-side (US, CA, EU, UK, AU, JP, CN) |
| Price Matrix | Compare FilaScope price vs Store price vs Conversion accuracy |
| Store-Region Audit | Map which stores serve which regions, flag missing coverage |
| Automated Spot-Check | Random 10 products per region with accuracy verification |
| Export Report | Download comprehensive CSV/JSON audit report |

---

## New Files to Create

### 1. Main Page: `src/pages/AdminRegionTest.tsx`

The main dashboard page with tabs for each feature:

```text
+----------------------------------------------------------+
|  🌍 Regional Pricing Test Dashboard                       |
|  Verify pricing accuracy across all regions and currencies |
+----------------------------------------------------------+
|  [Region Switcher] [Price Matrix] [Store Audit] [Spot Check] |
+----------------------------------------------------------+
```

**Tab Structure:**
- **Region Switcher** - Side-by-side currency comparison
- **Price Matrix** - Detailed price verification grid
- **Store Audit** - Brand-region-store mapping
- **Spot Check** - Automated random product verification

### 2. Components to Create in `src/components/admin/region-test/`:

| Component | Purpose |
|-----------|---------|
| `MultiRegionComparison.tsx` | Shows same product in all 7 currencies side-by-side |
| `PriceVerificationMatrix.tsx` | Grid of FilaScope vs Store price comparisons |
| `StoreRegionAuditTable.tsx` | Brand → Region → Store mapping with gap flags |
| `AutomatedSpotCheck.tsx` | Runs random product checks per region |
| `RegionTestExport.tsx` | Export report functionality |

---

## Technical Implementation

### File 1: `src/pages/AdminRegionTest.tsx`

```tsx
// Main admin page structure
- Uses AdminLayout (existing)
- Uses AdminPageHeader with Globe icon
- Tabs: Region Switcher | Price Matrix | Store Audit | Spot Check
- Export button in header actions
```

### File 2: `src/components/admin/region-test/MultiRegionComparison.tsx`

**Features:**
- Product search/selector to pick a filament
- 7-column grid showing price in each region's currency
- Shows store used, conversion source, and accuracy indicators
- Color-coded: green (local store), amber (converted), red (missing)

**Data Flow:**
```text
Select Product → useUnifiedRegionalPricing (×7 regions)
                      ↓
    Display: USD | CAD | EUR | GBP | AUD | JPY | CNY
              $24.99 | C$33.99 | €22.99 | £19.99 | A$38.99 | ¥3,749 | ¥179
             [local] [converted] [local] [fallback] ...
```

### File 3: `src/components/admin/region-test/PriceVerificationMatrix.tsx`

**Grid Structure:**

| Product | Region | FilaScope Price | Store Price | Match | Variance | Last Checked |
|---------|--------|-----------------|-------------|-------|----------|--------------|
| PolyTerra PLA | US | $21.99 | $21.99 | ✓ | 0% | 2h ago |
| PolyTerra PLA | CA | C$29.99 | C$29.99 | ✓ | 0% | 2h ago |
| PolyTerra PLA | EU | €23.49 | €22.99 | ⚠ | +2.2% | 5d ago |

**Data Sources:**
- FilaScope Price: From `filaments.variant_price` + currency conversion
- Store Price: Requires manual input or future scrape comparison
- Variance Calculation: `abs(filascope - store) / store * 100`

### File 4: `src/components/admin/region-test/StoreRegionAuditTable.tsx`

**Audit Matrix:**

| Brand | US | CA | EU | UK | AU | JP | CN |
|-------|----|----|----|----|----|----|-----|
| Polymaker | ✓ us.polymaker.com | ❌ | ✓ eu.polymaker.com | ✓ uk.polymaker.com | ❌ | ❌ | ❌ |
| eSUN | ✓ esun3dstore.com | ⚠ (fallback) | ✓ (NL warehouse) | ⚠ | ⚠ | ❌ | ❌ |
| Prusa | ✓ | ⚠ | ✓ prusament.com | ✓ | ⚠ | ❌ | ❌ |

**Legend:**
- ✓ = Local store configured with distinct URL
- ⚠ = Uses fallback (shows fallback region)
- ❌ = No store, no fallback

**Data Query:**
```sql
SELECT 
  ab.brand_name,
  ab.brand_slug,
  brs.region_code,
  brs.store_name,
  brs.base_url,
  brs.ships_from_country
FROM automated_brands ab
LEFT JOIN brand_regional_stores brs ON brs.brand_id = ab.id AND brs.is_active = true
ORDER BY ab.brand_name, brs.region_code;
```

### File 5: `src/components/admin/region-test/AutomatedSpotCheck.tsx`

**Spot Check Process:**
1. Select region to test (or "All Regions")
2. Click "Run Spot Check"
3. System randomly selects 10 products per region
4. For each product, verify:
   - Price displays correctly
   - Currency symbol matches region
   - Store URL is accessible (optional)
   - Conversion is within tolerance (±5%)

**Results Table:**

| Product | Region | Currency | Price | Store | Status | Notes |
|---------|--------|----------|-------|-------|--------|-------|
| eSUN PLA+ Black | CA | CAD | C$28.99 | esun3dstore.com | ⚠ Fallback | Ships from US |
| Polymaker PolyTerra | EU | EUR | €23.49 | eu.polymaker.com | ✓ OK | Local store |

**Random Selection Query:**
```sql
SELECT id, product_title, vendor, variant_price 
FROM filaments 
WHERE variant_price IS NOT NULL AND variant_available = true
ORDER BY RANDOM()
LIMIT 10;
```

### File 6: `src/components/admin/region-test/RegionTestExport.tsx`

**Export Options:**
- **CSV Report**: Full audit with all regions and products
- **JSON Report**: Structured data for further analysis
- **Summary PDF**: Executive summary with key metrics

**Export Fields:**
```json
{
  "timestamp": "2026-01-31T16:00:00Z",
  "summary": {
    "total_products_tested": 70,
    "pass_rate": 94.3,
    "issues_found": 4
  },
  "by_region": {
    "US": { "tested": 10, "passed": 10, "failed": 0 },
    "CA": { "tested": 10, "passed": 9, "failed": 1 },
    ...
  },
  "issues": [
    {
      "product": "eSUN PLA+ White",
      "region": "CA",
      "issue": "Fallback to US store, no local pricing",
      "severity": "warning"
    }
  ]
}
```

---

## Route Registration

Update `src/App.tsx`:

```tsx
const AdminRegionTest = lazy(() => import("./pages/AdminRegionTest"));

// In Routes:
<Route path="/admin/region-test" element={<AdminRegionTest />} />
```

---

## Dashboard Link

Add to `AdminDashboard.tsx` quickActions array:

```tsx
{ 
  to: "/admin/region-test", 
  icon: Globe, 
  title: "Region Testing", 
  desc: "Price accuracy verification", 
  color: "text-cyan-500" 
}
```

---

## Key Dependencies

| Dependency | Usage |
|------------|-------|
| `useUnifiedRegionalPricing` | Get regional pricing for products |
| `useRegion` | Access conversion rates |
| `REGIONS` / `CURRENCIES` | Config data |
| `brand_regional_stores` table | Store-region mapping |
| `filaments` table | Product data |
| `currency_exchange_rates` table | Conversion rates |

---

## UI Components Used

- `AdminLayout` - Page wrapper with sidebar
- `AdminPageHeader` - Standard header with actions
- `Tabs` / `TabsList` / `TabsContent` - Tab navigation
- `Table` components - Data display
- `Badge` - Status indicators
- `Button` - Actions
- `Card` - Stats cards
- `Select` - Region/product selectors
- `Input` - Search functionality

---

## Implementation Order

1. Create directory: `src/components/admin/region-test/`
2. Create `MultiRegionComparison.tsx` - Core comparison component
3. Create `StoreRegionAuditTable.tsx` - Store mapping audit
4. Create `AutomatedSpotCheck.tsx` - Random product verification
5. Create `PriceVerificationMatrix.tsx` - Detailed price grid
6. Create `RegionTestExport.tsx` - Export functionality
7. Create `AdminRegionTest.tsx` - Main page assembling all components
8. Register route in `App.tsx`
9. Add link in `AdminDashboard.tsx`

---

## Sample Data Queries

### Get Random Products for Spot Check
```sql
SELECT 
  f.id, f.product_title, f.vendor, f.variant_price,
  f.product_handle, f.product_url
FROM filaments f
JOIN automated_brands ab ON ab.brand_name ILIKE f.vendor
WHERE f.variant_price IS NOT NULL 
  AND f.variant_available = true
ORDER BY RANDOM()
LIMIT 10;
```

### Get Brand-Region Coverage Matrix
```sql
SELECT 
  ab.brand_name,
  ab.brand_slug,
  ARRAY_AGG(DISTINCT brs.region_code ORDER BY brs.region_code) as regions,
  COUNT(DISTINCT brs.id) as store_count
FROM automated_brands ab
LEFT JOIN brand_regional_stores brs ON brs.brand_id = ab.id AND brs.is_active = true
GROUP BY ab.id, ab.brand_name, ab.brand_slug
ORDER BY ab.brand_name;
```

### Get Exchange Rate Age
```sql
SELECT 
  target_currency,
  rate,
  fetched_at,
  NOW() - fetched_at as age
FROM currency_exchange_rates
ORDER BY fetched_at DESC;
```

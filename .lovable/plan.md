

# Admin Inventory Management - Part 2: Regional Page Structure

## Overview
This implementation adds regional awareness to the admin inventory management system, allowing administrators to view and manage products with region-specific data (URLs, prices, coverage) without affecting the user-facing region context.

## Pre-Check Results
- `product_regional_urls` table: Exists (empty, ready for data)
- `product_regional_prices` table: Exists (empty, ready for data)
- `filaments.primary_region` column: Exists

---

## Implementation Steps

### Step 1: Create AdminRegionContext

**File:** `src/contexts/AdminRegionContext.tsx`

A separate context specifically for admin region/currency viewing preferences, isolated from the user-facing `RegionContext`.

```text
AdminRegionContext
├── selectedRegion: RegionCode      (which region's data to display)
├── setSelectedRegion()             (change viewing region)
├── viewCurrency: CurrencyCode      (currency for price display)
├── setViewCurrency()               (override currency independently)
├── showAllRegions: boolean         (toggle to see all regional data at once)
├── setShowAllRegions()             
└── formatAdminPrice()              (format prices in the selected currency)
```

**Key Features:**
- Persists to localStorage under a separate key (`filascope_admin_region_prefs`)
- Does NOT sync to URL or affect user preferences
- Defaults to 'US' / 'USD'
- Provides utility for formatting prices in the admin view currency

---

### Step 2: Create AdminRegionSelector Component

**File:** `src/components/admin/inventory/AdminRegionSelector.tsx`

Dropdown selector for admin region viewing preference with flag icons.

**Props:**
```typescript
interface AdminRegionSelectorProps {
  value: RegionCode;
  onChange: (region: RegionCode) => void;
  showFlags?: boolean;        // default: true
  size?: 'sm' | 'default';
}
```

**Design:**
```text
┌───────────────────────┐
│ 🇺🇸 United States  ▼  │
└───────────────────────┘
       │
       ▼
┌───────────────────────┐
│ 🇺🇸 United States  ✓  │
│ 🇨🇦 Canada            │
│ 🇬🇧 United Kingdom    │
│ 🇪🇺 Europe            │
│ 🇦🇺 Australia         │
│ 🇯🇵 Japan             │
│ 🇨🇳 China             │
└───────────────────────┘
```

Uses the existing `DropdownMenu` component pattern from `RegionSelector.tsx`.

---

### Step 3: Create RegionalCoverageBadges Component

**File:** `src/components/admin/inventory/RegionalCoverageBadges.tsx`

Visual indicator showing which regions have configured URLs/prices.

**Props:**
```typescript
interface RegionalCoverageBadgesProps {
  availableRegions: RegionCode[];      // Regions with data
  allRegions?: RegionCode[];           // All possible regions (defaults to main 5)
  compact?: boolean;                   // Smaller badges for table cells
  showLabels?: boolean;                // Show region code text
}
```

**Display Modes:**

Full mode (for brand headers):
```text
🇺🇸 US ✓  🇨🇦 CA ✓  🇪🇺 EU ✓  🇬🇧 UK ✗  🇦🇺 AU ✗
```

Compact mode (for table cells):
```text
🇺🇸 🇨🇦 🇪🇺 (3/5)
```

**Styling:**
- Available regions: Green check, full opacity
- Missing regions: Gray X, reduced opacity (50%)
- Hover tooltip shows "Available in: US, CA, EU" or "Not configured: UK, AU"

---

### Step 4: Create RegionalFilters Component

**File:** `src/components/admin/inventory/RegionalFilters.tsx`

Filter controls for regional-specific product queries.

**Props:**
```typescript
interface RegionalFiltersProps {
  hasRegionalUrl: RegionCode | 'any' | null;
  onHasRegionalUrlChange: (value: RegionCode | 'any' | null) => void;
  missingRegionalUrls: boolean;
  onMissingRegionalUrlsChange: (value: boolean) => void;
  priceMismatch: boolean;
  onPriceMismatchChange: (value: boolean) => void;
  compact?: boolean;
}
```

**Filter Options:**
```text
┌─ Regional Filters ─────────────────────────────────┐
│ Has URL in: [All ▼] [US] [CA] [EU] [UK] [AU]       │
│ ☐ Missing Regional URLs   ☐ Price Mismatch >20%   │
└────────────────────────────────────────────────────┘
```

- "Has URL in [Region]": Show only products with a URL for that region
- "Missing Regional URLs": Products where `has_regional_urls = false` or missing entries
- "Price Mismatch": Products where regional prices differ by >20% from base

---

### Step 5: Update GlobalActionsBar

**File:** `src/components/admin/inventory/GlobalActionsBar.tsx`

Add regional controls to the actions bar.

**New Section Layout:**
```text
┌─────────────────────────────────────────────────────────────────────┐
│ [Add Filament] [Add Printer] [Sync All Filaments] [Sync All Printers]│
│                                                                      │
│ View: [🇺🇸 US ▼]   Currency: [USD ▼]   ☐ Show All Regions          │
│                                                   Last sync: 2h ago  │
└─────────────────────────────────────────────────────────────────────┘
```

**New Props:**
```typescript
interface GlobalActionsBarProps {
  // Existing props...
  
  // New regional props
  selectedRegion: RegionCode;
  onRegionChange: (region: RegionCode) => void;
  viewCurrency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  showAllRegions: boolean;
  onShowAllRegionsChange: (show: boolean) => void;
}
```

---

### Step 6: Update SearchAndFilterBar

**File:** `src/components/admin/inventory/SearchAndFilterBar.tsx`

Integrate regional filters into the existing filter bar.

**Updated Layout:**
```text
┌─────────────────────────────────────────────────────────────────────┐
│ 🔍 Search...           Brand: [All ▼]    Regional: [Has URL ▼]      │
│                                          ☐ Missing URLs             │
└─────────────────────────────────────────────────────────────────────┘
```

**New Props:**
```typescript
interface SearchAndFilterBarProps {
  // Existing props...
  
  // New regional filter props
  regionalUrlFilter: RegionCode | 'any' | null;
  onRegionalUrlFilterChange: (value: RegionCode | 'any' | null) => void;
  showMissingUrls: boolean;
  onShowMissingUrlsChange: (value: boolean) => void;
}
```

---

### Step 7: Update BrandSection Header

**File:** `src/components/admin/inventory/BrandSection.tsx`

Add regional coverage display and region-specific sync controls.

**Updated Layout:**
```text
┌─ Creality (24 products) ───────────────────────────────────────────┐
│ Coverage: 🇺🇸 ✓ 🇨🇦 ✓ 🇪🇺 ✓ 🇬🇧 ✗ 🇦🇺 ✗                            │
│                                     [Sync Brand] [Sync All Regions]│
└────────────────────────────────────────────────────────────────────┘
```

**New Props:**
```typescript
interface BrandSectionProps {
  // Existing props...
  
  regionalCoverage?: RegionCode[];      // Regions this brand has URLs for
  onSyncBrandAllRegions?: () => void;   // Sync all regions for brand
}
```

---

### Step 8: Update InventoryManagement Page

**File:** `src/pages/admin/InventoryManagement.tsx`

Wrap page content in `AdminRegionProvider` and pass regional state to children.

**Changes:**
1. Import and wrap with `AdminRegionProvider`
2. Add regional filter state variables
3. Pass regional props to `GlobalActionsBar` and `SearchAndFilterBar`
4. Pass selectedRegion to inventory tabs for data fetching

---

### Step 9: Update FilamentsInventoryTab

**File:** `src/components/admin/inventory/FilamentsInventoryTab.tsx`

Update data fetching to include regional information.

**Query Changes:**
```typescript
// Add to select clause:
.select(`
  id,
  product_title,
  display_name,
  // ... existing fields
  primary_region,
  has_regional_urls,
  available_regions
`)

// For regional coverage per brand, aggregate:
// COUNT products where has_regional_urls = true
```

**New Props:**
```typescript
interface FilamentsInventoryTabProps {
  searchTerm: string;
  selectedBrand: string;
  selectedRegion: RegionCode;        // From AdminRegionContext
  regionalUrlFilter: RegionCode | 'any' | null;
  showMissingUrls: boolean;
}
```

---

### Step 10: Update PrintersInventoryTab

**File:** `src/components/admin/inventory/PrintersInventoryTab.tsx`

Mirror changes from FilamentsInventoryTab for printer data.

---

## File Summary

| File | Action | Description |
|------|--------|-------------|
| `src/contexts/AdminRegionContext.tsx` | Create | Admin-specific region context |
| `src/components/admin/inventory/AdminRegionSelector.tsx` | Create | Region dropdown for admin |
| `src/components/admin/inventory/RegionalCoverageBadges.tsx` | Create | Visual coverage indicators |
| `src/components/admin/inventory/RegionalFilters.tsx` | Create | Filter controls for regional data |
| `src/components/admin/inventory/GlobalActionsBar.tsx` | Update | Add regional controls |
| `src/components/admin/inventory/SearchAndFilterBar.tsx` | Update | Add regional filter options |
| `src/components/admin/inventory/BrandSection.tsx` | Update | Add coverage badges and sync buttons |
| `src/pages/admin/InventoryManagement.tsx` | Update | Integrate AdminRegionContext |
| `src/components/admin/inventory/FilamentsInventoryTab.tsx` | Update | Add regional data fetching |
| `src/components/admin/inventory/PrintersInventoryTab.tsx` | Update | Add regional data fetching |

---

## Technical Details

### AdminRegionContext Implementation

```typescript
interface AdminRegionContextType {
  // Current viewing selections
  selectedRegion: RegionCode;
  viewCurrency: CurrencyCode;
  showAllRegions: boolean;
  
  // Setters
  setSelectedRegion: (r: RegionCode) => void;
  setViewCurrency: (c: CurrencyCode) => void;
  setShowAllRegions: (b: boolean) => void;
  
  // Utilities
  formatAdminPrice: (amount: number, sourceCurrency?: CurrencyCode) => string;
  regionConfig: RegionConfig;
}
```

**Storage Key:** `filascope_admin_region_prefs`

**Default Values:**
- `selectedRegion`: 'US'
- `viewCurrency`: 'USD'
- `showAllRegions`: false

### Regional Filter Logic

For "Has URL in [Region]" filter:
```sql
-- Query product_regional_urls for matching products
SELECT DISTINCT product_id 
FROM product_regional_urls 
WHERE product_type = 'filament' 
  AND region_code = 'CA'
  AND is_verified = true
```

For "Missing Regional URLs" filter:
```sql
-- Products where has_regional_urls is false or null
WHERE has_regional_urls IS NOT TRUE
```

### Coverage Calculation Per Brand

Query to get regional coverage for a brand:
```sql
SELECT 
  region_code,
  COUNT(DISTINCT product_id) as product_count
FROM product_regional_urls
WHERE product_type = 'filament'
  AND product_id IN (SELECT id FROM filaments WHERE vendor = 'Creality')
GROUP BY region_code
```

---

## Verification Checklist

After implementation:
- [ ] AdminRegionContext is created and provides region/currency state
- [ ] Region selector appears in GlobalActionsBar and persists selection
- [ ] Currency selector updates price display format
- [ ] "Show All Regions" toggle is functional
- [ ] Regional coverage badges appear on BrandSection headers
- [ ] Regional filter dropdown shows in SearchAndFilterBar
- [ ] "Missing Regional URLs" filter works correctly
- [ ] Region selection survives page refresh (localStorage)
- [ ] Tabs receive and respect selectedRegion prop


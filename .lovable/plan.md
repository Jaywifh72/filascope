
# Admin Interface for Regional Stores Management

## Overview

This plan creates a comprehensive admin interface at `/admin/regional-stores` for managing brand regional store configurations. The interface will allow administrators to view, add, edit, and manage regional store data without writing SQL.

## Database Context

The `brand_regional_stores` table already exists with the following structure:
- `id` (uuid, PK)
- `brand_id` (uuid, FK to automated_brands)
- `region_code` (text) - US, CA, UK, EU, AU, JP, CN
- `store_name` (text)
- `base_url` (text)
- `product_url_pattern` (text, nullable)
- `currency_code` (text)
- `ships_from_country` (text, nullable)
- `free_shipping_threshold` (numeric, nullable)
- `estimated_shipping_days` (integer, nullable)
- `is_primary` (boolean, default false)
- `is_active` (boolean, default true)
- `notes` (text, nullable)
- `created_at`, `updated_at` (timestamps)

The table already contains 69 regional store records across 39 brands.

---

## Files to Create

### 1. `src/pages/AdminRegionalStores.tsx`
Main admin page with:
- Header with page title and "Add Regional Store" button
- Statistics cards (total brands, brands with stores, brands missing stores, total regional stores)
- Search and region filter controls
- Tabbed interface:
  - **All Brands** - Full list with expandable regional store details
  - **Missing Stores** - Brands without any regional store configuration
  - **Coverage Overview** - Visual summary of regional coverage by region

### 2. `src/components/admin/regional-stores/BrandRegionalStoresTable.tsx`
Expandable table component displaying:
- Brand row with logo, name, slug
- Region coverage badges (US, CA, EU, UK, AU flags showing presence)
- Store count badge
- Coverage percentage with progress bar
- "Add Store" action button
- Expandable details showing individual stores with:
  - Store name, region flag, currency
  - Shipping info (from country, free shipping threshold)
  - Primary/Active status badges
  - Toggle switch for active status
  - Edit and Delete action buttons

### 3. `src/components/admin/regional-stores/AddRegionalStoreDialog.tsx`
Dialog for creating new regional stores:
- Brand selector dropdown (pre-selected if opened from brand row)
- Region selector with flags
- Store name input (auto-generated from brand + region)
- Store URL input
- Product URL pattern input with `{sku}` placeholder hint
- Currency selector (auto-set based on region)
- Ships from country input (2-letter code)
- Free shipping threshold input
- Estimated shipping days input
- Primary store toggle
- Active toggle
- Internal notes textarea

### 4. `src/components/admin/regional-stores/EditRegionalStoreDialog.tsx`
Dialog for editing existing stores:
- Pre-populated form with current values
- All same fields as Add dialog
- Disabled brand and region selection (cannot change)
- Update button with loading state

### 5. `src/components/admin/regional-stores/BrandCoverageOverview.tsx`
Visual overview card showing:
- Grid of regions (US, CA, EU, UK, AU, JP, CN)
- For each region: count of brands with stores, percentage coverage
- Color-coded based on coverage level (green >80%, yellow 50-80%, red <50%)
- Quick action to filter by region

---

## Routing Updates

### File: `src/App.tsx`

Add lazy import:
```typescript
const AdminRegionalStores = lazy(() => import("./pages/AdminRegionalStores"));
```

Add route after existing admin routes:
```typescript
<Route path="/admin/regional-stores" element={<AdminRegionalStores />} />
```

---

## Admin Dashboard Integration

### File: `src/pages/AdminDashboard.tsx`

Add new quick action to the `quickActions` array:
```typescript
{ 
  to: "/admin/regional-stores", 
  icon: Globe, 
  title: "Regional Stores", 
  desc: "Manage brand storefronts", 
  color: "text-teal-500" 
}
```

---

## Component Architecture

```text
AdminRegionalStores
├── Header (title + Add Store button)
├── Stats Cards (4 metrics)
├── Filters (Search + Region dropdown)
└── Tabs
    ├── All Brands Tab
    │   └── BrandRegionalStoresTable
    │       └── BrandRow (expandable)
    │           └── StoreDetailsList
    ├── Missing Stores Tab
    │   └── BrandRegionalStoresTable (filtered)
    └── Coverage Overview Tab
        └── BrandCoverageOverview

AddRegionalStoreDialog (modal)
EditRegionalStoreDialog (modal)
```

---

## Key Technical Details

### Data Fetching Strategy

1. **Main page query**: Fetch all brands from `automated_brands` with LEFT JOIN to `brand_regional_stores` for aggregate counts
2. **Expanded row query**: Fetch individual stores when a brand row is expanded (lazy loading)
3. **Mutations**: Create, update, delete operations with optimistic updates and toast notifications

### Query Keys
- `['admin-brands-regional-coverage']` - Main brands list with counts
- `['admin-brand-stores', brandId]` - Individual brand's stores (fetched on expand)

### Mutation Pattern
Following existing admin patterns with `useMutation`:
- `toggleActiveMutation` - Toggle store active status
- `deleteStoreMutation` - Delete store with confirmation dialog
- `createStoreMutation` - Create new store
- `updateStoreMutation` - Update existing store

### UI/UX Features
- Loading skeletons during data fetch
- Empty states with helpful messages
- Confirmation dialogs for destructive actions
- Toast notifications for success/error feedback
- Region flags from `REGIONS` config
- Currency symbols from `CURRENCIES` config

---

## Files Summary

| File | Action | Lines (est) |
|------|--------|-------------|
| `src/pages/AdminRegionalStores.tsx` | Create | ~200 |
| `src/components/admin/regional-stores/BrandRegionalStoresTable.tsx` | Create | ~350 |
| `src/components/admin/regional-stores/AddRegionalStoreDialog.tsx` | Create | ~280 |
| `src/components/admin/regional-stores/EditRegionalStoreDialog.tsx` | Create | ~260 |
| `src/components/admin/regional-stores/BrandCoverageOverview.tsx` | Create | ~120 |
| `src/App.tsx` | Modify | +3 lines |
| `src/pages/AdminDashboard.tsx` | Modify | +1 action |

---

## Existing Components to Reuse

- `@/components/ui/dialog` - Modal dialogs
- `@/components/ui/table` - Data tables
- `@/components/ui/tabs` - Tab navigation
- `@/components/ui/badge` - Status badges
- `@/components/ui/switch` - Toggle switches
- `@/components/ui/select` - Dropdowns
- `@/components/ui/collapsible` - Expandable rows
- `@/components/ui/alert-dialog` - Confirmation dialogs
- `@/hooks/use-toast` - Toast notifications

## Config to Leverage

- `src/config/regions.ts` - REGIONS, REGION_LIST for flags and names
- `src/config/currencies.ts` - CURRENCIES, CURRENCY_LIST for currency info

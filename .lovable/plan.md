
# Admin Price Verification Tool Implementation Plan

## Overview
Create a comprehensive admin tool for manually verifying and updating product prices across filaments and printers. This tool addresses the reality that automated price scraping is complex, may violate store ToS, and can produce unreliable data. The manual verification approach ensures honest, accurate pricing.

---

## Current Database Schema

The database already has the necessary columns for price freshness tracking:

**Filaments Table:**
- `variant_price` (numeric) - Current price
- `last_scraped_at` (timestamp) - When price was last verified
- `price_source` (varchar) - How price was obtained
- `price_confidence` (varchar) - Calculated confidence level

**Printers Table:**
- `base_price` (numeric) - Current price
- `prices_last_updated_at` (timestamp) - When price was last verified
- `price_source` (varchar) - How price was obtained
- `price_confidence` (varchar) - Calculated confidence level

**Price History Table:**
- `filament_id`, `price`, `recorded_at`, `region`, `currency`, `source`, `notes`

**Current Price Distribution:**
| Confidence | Count |
|------------|-------|
| low | 6,115 |
| medium | 1,968 |
| unknown | 167 |
| stale | 6 |

---

## Architecture Overview

```text
                     ┌─────────────────────────────────────────┐
                     │        AdminPriceVerification.tsx       │
                     │   (Main page with tabs and dashboard)   │
                     └────────────────────┬────────────────────┘
                                          │
          ┌───────────────┬───────────────┼───────────────┬───────────────┐
          ▼               ▼               ▼               ▼               ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │ Stats Cards  │ │ Product List │ │ Update Form  │ │ CSV Import   │ │ Price Chart  │
   │ (Dashboard)  │ │ (Filterable) │ │ (Dialog)     │ │ (Bulk)       │ │ (History)    │
   └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

---

## Implementation Steps

### Step 1: Create Main Page File

**File: `src/pages/AdminPriceVerification.tsx`**

The main page will include:

1. **Dashboard Stats Section**
   - Four cards showing counts by confidence level (High, Medium, Low, Stale/Unknown)
   - Color-coded (green, blue, amber, red)
   - Clickable to filter the product list

2. **Tabbed Interface**
   - **Needs Verification**: Products sorted by staleness (oldest first)
   - **All Products**: Full searchable/filterable list
   - **Bulk Import**: CSV upload interface
   - **Price History**: View historical data for a product

3. **Product Table with Inline Actions**
   - Product name, brand, current price, currency, last verified, confidence badge
   - "Update Price" button opens dialog
   - "View History" button shows price chart
   - Link to product detail page

4. **Search and Filter Controls**
   - Filter by product type (Filaments, Printers)
   - Filter by confidence level
   - Search by product name or brand
   - Sort by last verified date

### Step 2: Create Price Update Dialog Component

**File: `src/components/admin/PriceUpdateDialog.tsx`**

Dialog for manually updating a product's price:

- **Product Info Display**: Name, brand, current price
- **Form Fields**:
  - New price (number input, required)
  - Currency dropdown (USD, EUR, GBP, etc.)
  - Store URL (optional, for verification link)
  - Notes (optional text area for context)
  - Source dropdown (manual_verification, store_visit, email_confirmation)
- **Validation**:
  - Price must be positive
  - Warn if price change is > 50% from current
- **On Submit**:
  - Update `variant_price` / `base_price`
  - Set `last_scraped_at` / `prices_last_updated_at` to NOW()
  - Set `price_source` to selected source
  - Insert record into `price_history` table
  - Recalculate `price_confidence` (via existing DB trigger)

### Step 3: Create CSV Import Component

**File: `src/components/admin/PriceBulkImport.tsx`**

Bulk import interface for updating multiple prices at once:

- **CSV Format Expected**:
  ```
  product_id,price,currency,store_url,notes
  uuid-here,29.99,USD,https://store.com/product,Manual check
  ```

- **Upload Flow**:
  1. File input accepting `.csv`
  2. Parse CSV client-side (reuse existing manual parser pattern)
  3. Display preview table showing:
     - Product name (looked up from DB)
     - Current price vs New price
     - Highlight changes > 20%
  4. "Import" button to apply changes
  5. Progress indicator during bulk update
  6. Results summary (success count, error details)

- **Validation Rules**:
  - Product ID must exist
  - Price must be positive number
  - Currency must be valid code

### Step 4: Create Price History Viewer Component

**File: `src/components/admin/PriceHistoryViewer.tsx`**

Detailed price history view for a selected product:

- **Product Selector**: Search dropdown to select a product
- **Price Chart**: Reuse existing `PriceHistoryChart` component pattern
  - LineChart with date on X-axis, price on Y-axis
  - Time range selector (30d, 90d, 6mo, 1yr, All)
  - Show min/max reference lines
- **Price History Table**:
  - Date, Price, Source, Notes columns
  - Sortable by date
  - Export button (CSV download)

### Step 5: Add Route and Navigation

**Updates to `src/App.tsx`:**
- Add lazy import for `AdminPriceVerification`
- Add route: `<Route path="/admin/price-verification" element={<AdminPriceVerification />} />`

**Updates to `src/components/admin/AdminSidebar.tsx`:**
- Add navigation item under "Data Quality" section:
  ```
  { title: 'Price Verification', href: '/admin/price-verification', icon: DollarSign }
  ```

---

## Technical Details

### Database Queries

**Fetch Products Needing Verification:**
```sql
SELECT id, product_title, vendor, variant_price, last_scraped_at, price_confidence
FROM filaments
WHERE price_confidence IN ('low', 'stale', 'unknown')
   OR last_scraped_at < NOW() - INTERVAL '30 days'
   OR last_scraped_at IS NULL
ORDER BY last_scraped_at ASC NULLS FIRST
LIMIT 100
```

**Update Price with History:**
```sql
-- 1. Update filament
UPDATE filaments SET 
  variant_price = $1,
  last_scraped_at = NOW(),
  price_source = 'manual_verification'
WHERE id = $2;

-- 2. Insert history (handled by existing trigger: log_listing_price_change)
```

**Aggregate Stats Query:**
```sql
SELECT 
  price_confidence,
  COUNT(*) as count
FROM filaments
GROUP BY price_confidence
```

### Shared Components (Reuse)

| Component | From | Usage |
|-----------|------|-------|
| `AdminLayout` | `src/components/admin/AdminLayout.tsx` | Page wrapper |
| `AdminPageHeader` | `src/components/admin/AdminPageHeader.tsx` | Page title/actions |
| `Table` components | `src/components/ui/table.tsx` | Product list |
| `Badge` | `src/components/ui/badge.tsx` | Confidence indicators |
| `Dialog` | `src/components/ui/dialog.tsx` | Update form |
| `PriceHistoryChart` | `src/components/filament/PriceHistoryChart.tsx` | History visualization |
| `usePriceFreshness` | `src/hooks/usePriceFreshness.ts` | Confidence calculation |

### State Management

- Use React Query for data fetching with keys:
  - `['admin-price-verification-stats']`
  - `['admin-price-verification-products', filter, search, page]`
  - `['admin-price-history', productId]`
- Optimistic updates on price changes
- Invalidate queries on successful update

---

## UI/UX Considerations

1. **Clear Visual Hierarchy**
   - Red/amber badges for products needing attention
   - Green checkmarks for recently verified
   - Progress indicators during bulk operations

2. **Efficiency Features**
   - Keyboard shortcuts (Enter to submit dialog)
   - "Quick verify" button to confirm current price is accurate
   - Batch selection for bulk actions

3. **Safety Guardrails**
   - Confirmation dialog for large price changes (> 30%)
   - Undo capability (via price history)
   - Audit log of who made changes and when

4. **Mobile Responsiveness**
   - Responsive table that collapses on mobile
   - Dialog works on mobile screens

---

## File Changes Summary

### New Files

| File | Description |
|------|-------------|
| `src/pages/AdminPriceVerification.tsx` | Main admin page with dashboard, tabs, and product list |
| `src/components/admin/PriceUpdateDialog.tsx` | Modal form for updating single product price |
| `src/components/admin/PriceBulkImport.tsx` | CSV upload and bulk import interface |
| `src/components/admin/PriceHistoryViewer.tsx` | Price history chart and table for a product |

### Modified Files

| File | Change |
|------|--------|
| `src/App.tsx` | Add lazy import and route for `/admin/price-verification` |
| `src/components/admin/AdminSidebar.tsx` | Add navigation item for Price Verification |

---

## Future Enhancements (Not in This PR)

1. **Automated Verification Reminders**
   - Email/notification when products become stale
   - Weekly digest of products needing verification

2. **Browser Extension Integration**
   - Chrome extension to capture prices while browsing stores
   - One-click submit to database

3. **Price Alert Comparison**
   - Cross-reference manual prices with affiliate network data
   - Flag significant discrepancies for review

4. **User Contribution System**
   - Allow registered users to submit price updates
   - Admin approval workflow before publishing

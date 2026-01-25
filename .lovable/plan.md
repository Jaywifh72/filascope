
# Admin Broken URLs Page Implementation Plan

## Overview
Create a new admin page at `/admin/broken-urls` to view and manage products with broken URLs detected by the live price checker. This page will help admins quickly identify, fix, or dismiss broken product links.

## Architecture Summary

The `broken_product_urls` table tracks URLs that returned 404 errors during live price checks:
- `product_url` (unique) - The broken URL
- `store_domain` - Extracted hostname for grouping
- `error_type` - Currently `404_not_found`
- `detection_count` - How many times this URL failed
- `detected_at` / `last_detected_at` - Timestamps
- `resolved_at` / `new_url` / `notes` - Resolution tracking

The page will join with the `filaments` table via `product_url` to show product names.

---

## Implementation Steps

### 1. Create the Admin Page Component

**File:** `src/pages/AdminBrokenUrls.tsx`

Features:
- Uses `AdminLayout` wrapper for consistent sidebar navigation
- Header with icon, title, and refresh button
- Stats cards showing: Total Broken, Unresolved, Resolved, Top Store
- Store domain filter dropdown
- Sortable table with columns:
  - Product Name (from filaments join)
  - Store Domain
  - Broken URL (truncated, with copy button)
  - Detection Count
  - Last Detected
  - Actions (Update URL, Mark Fixed, Dismiss)
- Bulk actions for same-store fixes
- Empty state when no broken URLs exist

### 2. Create the Data Hook

**File:** `src/hooks/useBrokenProductUrls.ts`

```typescript
interface BrokenUrlWithProduct {
  id: string;
  product_url: string;
  store_domain: string;
  error_type: string;
  detection_count: number;
  detected_at: string;
  last_detected_at: string;
  resolved_at: string | null;
  new_url: string | null;
  notes: string | null;
  // Joined from filaments
  filament_id: string | null;
  product_title: string | null;
  vendor: string | null;
}
```

Hook functionality:
- `fetchBrokenUrls()` - Fetches all broken URLs with product info
- `updateProductUrl(id, newUrl)` - Updates filament URL and marks resolved
- `markResolved(id, notes?)` - Marks as resolved without URL change
- `dismissUrl(id)` - Deletes the tracking record
- `bulkUpdateStore(storeDomain, urlTransform)` - Bulk fix for a store

### 3. Update URL Resolution Dialog

**Component within page:**
- Modal dialog for entering new URL
- Test URL button (optional - calls get-current-price to verify)
- Apply button that:
  1. Updates the filament's `product_url`
  2. Sets `resolved_at` and `new_url` in broken_product_urls
  3. Refreshes the list

### 4. Add Route and Sidebar Link

**File changes:**

`src/App.tsx`:
- Add lazy import for AdminBrokenUrls
- Add route: `<Route path="/admin/broken-urls" element={<AdminBrokenUrls />} />`

`src/components/admin/AdminSidebar.tsx`:
- Add new nav item under "Data Quality" group:
  ```typescript
  { title: 'Product 404s', href: '/admin/broken-urls', icon: LinkOff }
  ```

### 5. Store Domain Stats Component

**Within the page:**
- Collapsible section showing breakdown by store
- Click on store to filter table
- Shows count of broken URLs per domain
- Highlights stores with most issues

---

## Component Structure

```
AdminBrokenUrls.tsx
├── AdminLayout
│   ├── AdminPageHeader (title, description, refresh action)
│   ├── Stats Cards Row
│   │   ├── Total Broken
│   │   ├── Unresolved
│   │   ├── Resolved Today
│   │   └── Most Affected Store
│   ├── Store Filter / Search Bar
│   ├── Data Table
│   │   ├── Columns: Product, Store, URL, Count, Detected, Actions
│   │   ├── Row actions: Update URL, Mark Fixed, Dismiss
│   │   └── Bulk selection checkbox
│   ├── Update URL Dialog
│   │   ├── Current URL display
│   │   ├── New URL input
│   │   ├── Test URL button
│   │   └── Apply / Cancel
│   └── Empty State (when no broken URLs)
```

---

## Database Queries

**Fetch broken URLs with product info:**
```typescript
// First get broken URLs
const { data: brokenUrls } = await supabase
  .from('broken_product_urls')
  .select('*')
  .order('last_detected_at', { ascending: false });

// Then match with filaments by URL
const { data: filaments } = await supabase
  .from('filaments')
  .select('id, product_url, product_title, vendor')
  .in('product_url', brokenUrls.map(b => b.product_url));

// Join in memory
```

**Update product URL:**
```typescript
// 1. Update filament
await supabase
  .from('filaments')
  .update({ product_url: newUrl })
  .eq('product_url', oldUrl);

// 2. Mark as resolved
await supabase
  .from('broken_product_urls')
  .update({ 
    resolved_at: new Date().toISOString(),
    new_url: newUrl 
  })
  .eq('id', brokenUrlId);
```

---

## UI/UX Details

**Table row appearance:**
- Unresolved rows have subtle red left border
- Resolved rows are grayed out (or hidden by default)
- High detection count (>5) shows warning badge

**Actions:**
- **Update URL**: Opens dialog to enter new working URL
- **Mark Fixed**: For cases where URL was fixed externally
- **Dismiss**: Remove from tracking (false positive)
- **Search Store**: Opens store search in new tab (like the user-facing button)

**Filters:**
- Toggle: Show Resolved / Hide Resolved
- Dropdown: Filter by store domain
- Search: Filter by product name

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/AdminBrokenUrls.tsx` | Create | Main admin page component |
| `src/hooks/useBrokenProductUrls.ts` | Create | Data fetching and mutation hook |
| `src/App.tsx` | Modify | Add lazy import and route |
| `src/components/admin/AdminSidebar.tsx` | Modify | Add sidebar navigation link |

---

## Technical Considerations

1. **No direct foreign key**: The `broken_product_urls` table uses `product_url` as the link to filaments, not a foreign key. This means:
   - Join must be done in application code
   - A broken URL might not match any filament (if product was deleted)
   - Multiple filaments could theoretically share the same URL

2. **URL matching**: Use exact match on `product_url` field between tables

3. **Pagination**: If the table grows large, implement cursor-based pagination

4. **Real-time updates**: Consider adding Supabase realtime subscription to auto-refresh when new 404s are detected

5. **Permissions**: Page is admin-only, using existing `useAuth` hook pattern

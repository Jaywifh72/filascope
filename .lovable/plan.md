
# Admin Inventory Management - Part 2: Page Structure & Navigation

## Overview

This implementation creates a unified inventory management page at `/admin/inventory` with tabbed navigation for Filaments, Printers, and Sync Status. The page follows existing admin patterns (AdminLayout, AdminPageHeader) and includes global action buttons, search, and brand filtering.

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/admin/InventoryManagement.tsx` | Main page component with tabs |
| `src/components/admin/inventory/GlobalActionsBar.tsx` | Bulk sync buttons and "Add" actions |
| `src/components/admin/inventory/SearchAndFilterBar.tsx` | Search input + brand dropdown |
| `src/components/admin/inventory/FilamentsInventoryTab.tsx` | Placeholder for filaments table |
| `src/components/admin/inventory/PrintersInventoryTab.tsx` | Placeholder for printers table |
| `src/components/admin/inventory/SyncStatusTab.tsx` | Placeholder for sync logs view |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add lazy import and route for `/admin/inventory` |
| `src/components/admin/AdminSidebar.tsx` | Add "Inventory" nav item with Package icon |

---

## Implementation Details

### 1. InventoryManagement.tsx (Main Page)

The main page follows the existing AdminDataHealth pattern:

```text
+--------------------------------------------------+
| AdminLayout wrapper                               |
|  +----------------------------------------------+ |
|  | AdminPageHeader: "Inventory Management"      | |
|  |   Icon: Package (cyan)                       | |
|  |   Description: "Manage filaments, printers..." |
|  +----------------------------------------------+ |
|  | GlobalActionsBar                             | |
|  |   [Sync All Filaments] [Sync All Printers]   | |
|  |   [Add Filament] [Add Printer]               | |
|  |   Last sync: 5 minutes ago                   | |
|  +----------------------------------------------+ |
|  | SearchAndFilterBar                           | |
|  |   [Search input...] [Brand dropdown ▼]       | |
|  +----------------------------------------------+ |
|  | Tabs                                         | |
|  | [Filaments] [Printers] [Sync Status]         | |
|  +----------------------------------------------+ |
|  | TabsContent (based on active tab)            | |
|  |   - FilamentsInventoryTab (placeholder)     | |
|  |   - PrintersInventoryTab (placeholder)      | |
|  |   - SyncStatusTab (placeholder)             | |
|  +----------------------------------------------+ |
+--------------------------------------------------+
```

Key features:
- Uses `AdminLayout` for consistent sidebar and auth protection
- Uses `AdminPageHeader` for consistent header styling
- Tab state stored in URL search params (like PrinterDetail)
- Search/filter state lifted to parent and passed to tabs

### 2. GlobalActionsBar.tsx

```text
+--------------------------------------------------------+
| [🔄 Sync All Filaments] [🔄 Sync All Printers]         |
| [+ Add Filament] [+ Add Printer]                        |
|                                          Last sync: ... |
+--------------------------------------------------------+
```

Props:
- `onSyncFilaments`: () => void (placeholder, shows toast)
- `onSyncPrinters`: () => void (placeholder, shows toast)
- `onAddFilament`: () => void (placeholder, shows toast)
- `onAddPrinter`: () => void (placeholder, shows toast)
- `lastSyncTime`: Date | null

### 3. SearchAndFilterBar.tsx

```text
+--------------------------------------------------------+
| 🔍 [Search name, vendor, URL...            ]           |
| Brand: [All Brands ▼]                                   |
+--------------------------------------------------------+
```

Props:
- `searchTerm`: string
- `onSearchChange`: (value: string) => void
- `selectedBrand`: string
- `onBrandChange`: (value: string) => void
- `brands`: string[] (fetched from automated_brands)

### 4. Tab Placeholder Components

Each tab component receives search/filter props and renders a placeholder:

```text
FilamentsInventoryTab / PrintersInventoryTab:
+--------------------------------------------------------+
| Card with placeholder message                           |
| "Filaments table coming in Part 3"                     |
| Shows current search term and brand filter for testing |
+--------------------------------------------------------+

SyncStatusTab:
+--------------------------------------------------------+
| Card with placeholder message                           |
| "Sync history and status coming in Part 3"             |
+--------------------------------------------------------+
```

---

## Routing Configuration

Add to `src/App.tsx`:

```typescript
// Add lazy import (line ~72, with other admin imports)
const AdminInventory = lazy(() => import("./pages/admin/InventoryManagement"));

// Add route (line ~192, after other admin routes)
<Route path="/admin/inventory" element={<AdminInventory />} />
```

---

## Sidebar Navigation

Add to `src/components/admin/AdminSidebar.tsx` in the "Content" group:

```typescript
// In navGroups, Content section (after "Deals")
{ title: 'Inventory', href: '/admin/inventory', icon: Package },
```

Position: Place after "Deals" in the Content section as it's a primary management feature.

---

## Auth Protection

The page uses `AdminLayout` which already enforces:
1. User must be authenticated
2. User must have admin role (checked via `useAuth().isAdmin`)
3. Redirects to `/auth` if either check fails

No additional auth code needed.

---

## Data Fetching

**Brands for dropdown** - Fetched once on mount:
```typescript
const { data: brands } = useQuery({
  queryKey: ['automated-brands-list'],
  queryFn: async () => {
    const { data } = await supabase
      .from('automated_brands')
      .select('brand_name, brand_slug')
      .eq('scraping_enabled', true)
      .order('brand_name');
    return data || [];
  }
});
```

---

## Component Hierarchy

```text
InventoryManagement (page)
├── AdminLayout (wrapper)
│   └── AdminSidebar (auto-included)
├── AdminPageHeader
├── GlobalActionsBar
├── SearchAndFilterBar
└── Tabs
    ├── TabsList
    │   ├── TabsTrigger "Filaments"
    │   ├── TabsTrigger "Printers"
    │   └── TabsTrigger "Sync Status"
    └── TabsContent
        ├── FilamentsInventoryTab
        ├── PrintersInventoryTab
        └── SyncStatusTab
```

---

## Styling Notes

Following the established design system:
- Background: Uses AdminLayout's `bg-background`
- Cards: `bg-card border-border` with hover states
- Tabs: Standard shadcn tabs with `TabsList` grid layout
- Buttons: Primary variant for sync actions, outline for add actions
- Search: Full-width input with Search icon prefix
- Spacing: 8px rhythm (gap-4, gap-6 for sections)

---

## Verification Steps

After implementation, verify:

1. **Navigation**: `/admin/inventory` loads without errors
2. **Tabs**: All three tabs are visible and switching works
3. **Sidebar**: "Inventory" link appears in admin sidebar under "Content"
4. **Auth**: Logging out and visiting `/admin/inventory` redirects to `/auth`
5. **Search**: Typing in search input updates the displayed search term in tab placeholders
6. **Brand filter**: Dropdown shows brands from database
7. **Buttons**: Global action buttons are visible (click shows "Coming soon" toast)

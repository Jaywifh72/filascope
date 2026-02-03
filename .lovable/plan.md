
# Plan: Admin Store Registry Page

## Summary

Build out the Store Registry admin page at `/admin/stores` with a full CRUD interface for managing stores across regions. This page will display all stores in a filterable, sortable table with inline active toggle and modal-based add/edit functionality.

---

## Current State

| Component | Status |
|-----------|--------|
| `AdminStores.tsx` | Placeholder with "Coming soon..." |
| `useStores.ts` | Complete with CRUD hooks |
| `stores` table | 17 stores seeded (Amazon regions + brand stores) |
| `Store` type | Defined in `src/types/regional.ts` |
| `REGIONS` config | Defined in `src/config/regions.ts` |

---

## Implementation Steps

### Step 1: Create Store Form Modal Component

**File**: `src/components/admin/stores/StoreFormModal.tsx`

A reusable modal for both Add and Edit operations:

**Form fields:**
- **Name** (text, required)
- **Slug** (text, auto-generated from name + region, editable)
- **Store Type** (select: marketplace, brand_direct, retailer)
- **Region** (select: US, CA, EU, UK, AU, JP, CN, GLOBAL)
- **Country Code** (select, filtered by region)
- **Currency** (auto-filled from region, editable)
- **Base URL** (text, required, URL validation)
- **Ships From** (multi-select country codes)
- **Ships To** (multi-select: region codes or "GLOBAL")
- **Active** (toggle, default on)

**Affiliate section (collapsible):**
- Affiliate Tag (text)
- Affiliate Network (text)
- Preview URL with affiliate params

**Behavior:**
- Auto-generate slug from name + region: `"Amazon Canada"` + `"CA"` → `"amazon-canada"`
- Auto-set currency when region changes
- Validate URL format
- Check unique constraint on submit

### Step 2: Create Store Table Component

**File**: `src/components/admin/stores/StoreTable.tsx`

A sortable, filterable data table:

**Columns:**
| Column | Content | Sortable |
|--------|---------|----------|
| Store | Name + logo (if available) | Yes |
| Type | Badge (marketplace/brand_direct/retailer) | Yes |
| Region | Flag emoji + code | Yes |
| Currency | Currency code | Yes |
| Ships From | Country badges | No |
| Active | Toggle switch (inline update) | Yes |
| Actions | Edit, Delete buttons | No |

**Filters (above table):**
- Search input (filters by name)
- Region dropdown (All, US, CA, EU, UK, AU, JP, CN, GLOBAL)
- Type dropdown (All, marketplace, brand_direct, retailer)

**Features:**
- Inline toggle for active status (immediate database update)
- Click row to expand with full details
- Sortable by any column header
- Empty state when no stores match filters

### Step 3: Create Delete Confirmation Dialog

**File**: `src/components/admin/stores/DeleteStoreDialog.tsx`

Alert dialog for confirming store deletion:
- Title: "Delete [Store Name]?"
- Warning: "This will also delete all price listings associated with this store. This action cannot be undone."
- Buttons: Cancel, Delete (destructive)

### Step 4: Update AdminStores Page

**File**: `src/pages/AdminStores.tsx`

Complete rewrite:

```text
Layout:
┌─────────────────────────────────────────────────────────────────┐
│  [Store] Store Registry                           [+ Add Store] │
│  Manage stores and retailers for regional pricing               │
├─────────────────────────────────────────────────────────────────┤
│  [Search...        ]  [Region ▼]  [Type ▼]      17 stores       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Store Name      │ Type       │ Region │ Currency │ Active │ ⋮ │
│  ─────────────────────────────────────────────────────────────  │
│  Amazon US       │ marketplace│ 🇺🇸 US  │ USD      │   ●    │ ⋮ │
│  Amazon Canada   │ marketplace│ 🇨🇦 CA  │ CAD      │   ●    │ ⋮ │
│  3DJake EU       │ retailer   │ 🇪🇺 EU  │ EUR      │   ●    │ ⋮ │
│  Bambu Lab       │ brand_direct│ 🌐 GLOBAL│ USD     │   ●    │ ⋮ │
│  ...                                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 5: Add Region/Country Configuration

**File**: `src/config/countries.ts` (new)

Country codes grouped by region for form dropdowns:

```typescript
export const REGION_COUNTRIES = {
  US: [{ code: 'US', name: 'United States' }],
  CA: [{ code: 'CA', name: 'Canada' }],
  EU: [
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'AT', name: 'Austria' },
    { code: 'BE', name: 'Belgium' },
    { code: 'PL', name: 'Poland' },
    { code: 'CZ', name: 'Czech Republic' },
  ],
  UK: [{ code: 'GB', name: 'United Kingdom' }],
  AU: [{ code: 'AU', name: 'Australia' }],
  JP: [{ code: 'JP', name: 'Japan' }],
  CN: [{ code: 'CN', name: 'China' }],
  GLOBAL: [], // No specific country
};
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/config/countries.ts` | Create | Country codes grouped by region |
| `src/components/admin/stores/StoreFormModal.tsx` | Create | Add/Edit store form modal |
| `src/components/admin/stores/StoreTable.tsx` | Create | Sortable/filterable store table |
| `src/components/admin/stores/DeleteStoreDialog.tsx` | Create | Delete confirmation dialog |
| `src/pages/AdminStores.tsx` | Modify | Complete page implementation |
| `src/hooks/useStores.ts` | Modify | Add `isActive: undefined` option to fetch all |

---

## Technical Details

### Store Type Badges

| Type | Badge Color | Label |
|------|-------------|-------|
| marketplace | blue | Marketplace |
| brand_direct | green | Brand Direct |
| retailer | purple | Retailer |

### Region Display

```typescript
const REGION_DISPLAY = {
  US: { flag: '🇺🇸', name: 'United States' },
  CA: { flag: '🇨🇦', name: 'Canada' },
  EU: { flag: '🇪🇺', name: 'European Union' },
  UK: { flag: '🇬🇧', name: 'United Kingdom' },
  AU: { flag: '🇦🇺', name: 'Australia' },
  JP: { flag: '🇯🇵', name: 'Japan' },
  CN: { flag: '🇨🇳', name: 'China' },
  GLOBAL: { flag: '🌐', name: 'Global' },
};
```

### Slug Generation

Auto-generate slug from name:
```typescript
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
```

### Inline Active Toggle

When toggling active status:
1. Optimistically update UI
2. Call `useUpdateStore` mutation
3. Rollback on error with toast

### useStores Hook Update

Modify to support fetching all stores (active and inactive):

```typescript
export function useStores(options: UseStoresOptions = {}) {
  const { region, storeType, isActive } = options; // Remove default true
  
  // If isActive is undefined, don't filter by is_active
  if (isActive !== undefined) {
    query = query.eq('is_active', isActive);
  }
}
```

---

## Form Validation

| Field | Validation |
|-------|------------|
| Name | Required, min 2 chars |
| Slug | Required, unique, lowercase alphanumeric + hyphens |
| Base URL | Required, valid URL format |
| Region | Required |
| Store Type | Required |
| Currency | Required (auto-set from region) |

---

## Component Structure

```text
AdminStores (page)
├── AdminLayout
│   └── Card
│       ├── CardHeader
│       │   ├── Title + Description
│       │   └── Add Store Button
│       └── CardContent
│           ├── Filters Row
│           │   ├── Input (search)
│           │   ├── Select (region)
│           │   └── Select (type)
│           └── StoreTable
│               ├── TableHeader (sortable)
│               └── TableBody
│                   └── StoreRow (for each store)
│                       ├── Name cell
│                       ├── Type badge
│                       ├── Region + flag
│                       ├── Currency
│                       ├── Active toggle
│                       └── Actions menu
│
├── StoreFormModal (dialog)
│   └── Form fields...
│
└── DeleteStoreDialog (alert dialog)
```

---

## Existing Hooks Usage

The hooks in `useStores.ts` are already complete and will be used:

```typescript
// Fetch all stores (no active filter)
const { data: stores, isLoading } = useStores({ isActive: undefined });

// Create new store
const createStore = useCreateStore();

// Update store (including toggle active)
const updateStore = useUpdateStore();

// Delete store
const deleteStore = useDeleteStore();
```

---

## No Database Changes Required

All needed tables and fields already exist:
- `stores` table with all required columns
- `useStores` hooks already implemented
- RLS policies already in place

The implementation is purely frontend component work.

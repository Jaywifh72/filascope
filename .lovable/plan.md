

# Admin TD Value Management Panel

## Overview

Create a full-featured admin page at `/admin/td-management` for managing HueForge TD values across all filaments. The page integrates with the existing `populate-td-values` edge function and the `td_reference_values` table. A new `td_population_log` table will track all TD value changes for auditing.

---

## Database Changes

### New Table: `td_population_log`

Tracks every TD value change (auto or manual) for auditing.

```text
td_population_log
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
  filament_id     uuid REFERENCES filaments(id) ON DELETE CASCADE
  td_value        numeric NOT NULL
  previous_value  numeric
  source          text NOT NULL      -- 'reference_table', 'page_scrape', 'manual', 'csv_import'
  confidence      text DEFAULT 'medium'
  status          text DEFAULT 'applied'  -- 'applied', 'skipped', 'error', 'dry-run'
  notes           text
  created_at      timestamptz DEFAULT now()
  created_by      uuid REFERENCES auth.users(id)
```

RLS: Read/write restricted to admin role via `has_role(auth.uid(), 'admin')`.

---

## New Files

### 1. `src/pages/admin/TdManagement.tsx` -- Main Page

Full-width admin page with four tabs:

**Tab: Overview (default)**
- Stats header cards: Total filaments, With TD, Without TD, Coverage %, fetched via aggregate queries
- Coverage by material: mini horizontal bar chart showing % with TD for each material type
- Coverage by brand: top 10 brands table with filament count and TD %

**Tab: Filaments**
- Searchable, filterable, paginated table of filaments showing: Vendor, Title, Material, Color Family, Color Hex swatch, TD Value (inline editable), Last Updated
- Filters: search input, material dropdown, brand dropdown, TD status (All/Has TD/Missing TD)
- Sort by vendor, material, TD value, color family
- Inline editing: click TD cell to toggle input, validate 0.1--15.0, update on Enter/blur, toast confirmation
- 50 rows per page with pagination controls

**Tab: Reference Values**
- CRUD table for `td_reference_values`
- Add dialog with form: Brand Name, Color Name, Material (dropdown), TD Value (number 0.1--15.0), Source (dropdown), Confidence, Notes
- Edit/Delete per row
- Bulk delete for selected rows

**Tab: Population Log**
- Read-only table from `td_population_log`
- Columns: Timestamp, Filament name (link), TD Value, Previous Value, Source, Confidence, Status
- Filters: status, source, date range

### 2. `src/components/admin/td-management/TdStatsHeader.tsx`

Stats cards component showing coverage metrics. Uses 4 Card components in a grid with count queries.

### 3. `src/components/admin/td-management/TdFilamentsTable.tsx`

The main filaments table with search, filters, inline editing, pagination. Uses Shadcn Table, Input, Select, Badge. Inline edit uses local state toggled per-row, validates on blur/Enter, calls `supabase.from('filaments').update()`, logs to `td_population_log`, and invalidates query cache.

### 4. `src/components/admin/td-management/TdReferenceTable.tsx`

CRUD table for `td_reference_values`. Add/Edit via Dialog with form fields. Delete with confirmation.

### 5. `src/components/admin/td-management/TdPopulationLog.tsx`

Read-only log viewer with filters for status and source.

### 6. `src/components/admin/td-management/TdActionToolbar.tsx`

Action buttons bar:
- **Run TD Discovery**: Button with dropdown for brand selection + dry-run toggle. Calls `supabase.functions.invoke('populate-td-values', { body: { mode, brand_slug, limit } })`. Shows results in a dialog/inline panel.
- **Bulk Import CSV**: Opens dialog with file upload, parses CSV client-side, shows preview table, on confirm inserts into `td_reference_values` and attempts matching updates to `filaments`.
- **Export Missing**: Downloads CSV of filaments where `transmission_distance IS NULL` using the existing `downloadCSV` utility from `src/lib/csvExport.ts`.

### 7. `src/hooks/useTdManagement.ts`

Custom hooks for TD management queries:
- `useTdStats()` -- aggregate counts
- `useTdFilaments(filters, page)` -- paginated filaments query
- `useTdReferenceValues()` -- reference table CRUD
- `useTdPopulationLog(filters)` -- log entries
- `useUpdateTdValue()` -- mutation for inline edit
- `useRunTdDiscovery()` -- mutation for edge function invocation

---

## Modified Files

### `src/App.tsx`
- Add lazy import: `const AdminTdManagement = lazy(() => import("./pages/admin/TdManagement"))`
- Add route: `<Route path="/admin/td-management" element={<AdminNewLayoutModule><AdminTdManagement /></AdminNewLayoutModule>} />`

### `src/components/admin/AdminNewSidebar.tsx`
- Add TD Management to the "Content" nav group:
  ```text
  { title: 'TD Management', href: '/admin/td-management', icon: Sun }
  ```
- Import `Sun` from lucide-react (already imported in other admin components)

---

## Files Summary

| Action | File |
|--------|------|
| DB Migration | Create `td_population_log` table with RLS |
| CREATE | `src/pages/admin/TdManagement.tsx` |
| CREATE | `src/components/admin/td-management/TdStatsHeader.tsx` |
| CREATE | `src/components/admin/td-management/TdFilamentsTable.tsx` |
| CREATE | `src/components/admin/td-management/TdReferenceTable.tsx` |
| CREATE | `src/components/admin/td-management/TdPopulationLog.tsx` |
| CREATE | `src/components/admin/td-management/TdActionToolbar.tsx` |
| CREATE | `src/hooks/useTdManagement.ts` |
| MODIFY | `src/App.tsx` -- lazy import + route |
| MODIFY | `src/components/admin/AdminNewSidebar.tsx` -- nav link |

No frontend display files (FilamentDetail, SpecificationsTab, HueForgeTDDatabase) are modified. No SEO elements touched.


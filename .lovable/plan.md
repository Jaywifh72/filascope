

## Plan: Brand Catalog Sync Admin Page

Replace the current FilamentOnboarding page with a new Brand Catalog Sync page, reusing the same route and creating new components in `src/components/admin/brand-sync/`.

### Files to Create (8)

**1. `src/pages/admin/BrandCatalogSync.tsx`** — Main page component
- Brand selector bar (Combobox with search, logo thumbnails, querying `automated_brands`)
- Default to SUNLU if found
- "Last synced" label from most recent `brand_sync_jobs` entry
- Sync button → calls `sync-brand-catalog` edge function
- Config gear icon → opens BrandConfigsSection dialog (reused from existing)
- Orchestrates all child components via state: `selectedBrandId`, `activeJobId`, `syncing`, `selectedItems`

**2. `src/components/admin/brand-sync/BrandSyncDashboard.tsx`** — 4 stat cards
- DB Coverage: count from `filaments` WHERE `brand_id = selected`
- Store Products: from `brand_sync_jobs.filament_products_found`
- New Available: count of `brand_sync_items` with status `new` for latest job
- Price Changes: count with status `price_changed`
- Uses React Query with brand_id dependency

**3. `src/components/admin/brand-sync/SyncResultsTabs.tsx`** — Tabbed container
- Tabs: New, Price Changes, Matched, Skipped, Errors — each with count badge
- Renders the appropriate sub-table per tab
- Skipped/Errors tabs render simple read-only tables inline (no separate component needed)

**4. `src/components/admin/brand-sync/NewFilamentsTable.tsx`** — Table for "New" tab
- Columns: Checkbox, Image, Color (with hex swatch), Material, Display Name, US$, EU€, CA$, AU$, SKU, Finish, Quality Score badge, Eye icon
- Quality score: circular badge (green ≥80, amber ≥50, red <50) — reuse `computeQualityScore` from existing OnboardingPreviewDialog
- Checkbox select/deselect all, per-row toggle
- Same StatusBadge pattern as ExtractionResultsTable (green=new)

**5. `src/components/admin/brand-sync/PriceChangesTable.tsx`** — Table for "Price Changes" tab
- Columns: Image, Display Name, Material, Region, Old Price, New Price, Diff (color-coded), Actions
- Parse `price_diff` JSONB for old/new values
- "Update Prices" bulk action button

**6. `src/components/admin/brand-sync/FilamentPreviewDialog.tsx`** — Detail view/edit dialog
- Port from existing `OnboardingPreviewDialog` but target `brand_sync_items` table
- Same fields: images, display name, material, color name/family/hex (with react-colorful picker), finish type, temps, prices, SKU, regions, URLs
- Saves to `admin_override_data` on `brand_sync_items`
- Quality score + warnings at bottom
- Skip / Save Changes footer

**7. `src/components/admin/brand-sync/ImportProgressCard.tsx`** — Import status
- Calls `import-synced-filaments` edge function
- Shows progress bar during import
- On completion: summary card with imported count, price history points, URL health, avg quality
- "View on Brand Page" link

**8. `src/components/admin/brand-sync/SyncHistoryTable.tsx`** — Past sync jobs
- Collapsible section at bottom
- Table: Date, Status badge, New/Changed/Imported counts, Duration
- Click row to reload that job's items into the results tabs

### Files to Edit (2)

**9. `src/App.tsx`** — Change lazy import from `FilamentOnboarding` to `BrandCatalogSync`
```
const AdminFilamentOnboarding = lazy(() => import("./pages/admin/BrandCatalogSync"));
```
Route path stays `/admin/filament-onboarding`.

**10. `src/components/admin/AdminNewSidebar.tsx`** — Rename label
```
{ title: 'Brand Catalog Sync', href: '/admin/filament-onboarding', icon: PackagePlus },
```

### State & Data Flow

- `selectedBrandId` → drives dashboard cards + config queries
- Click "Sync" → call edge function → poll `brand_sync_jobs` by job_id until status is `completed`/`failed` → then load `brand_sync_items` for that job_id
- Sync progress: poll job row every 2s during sync, show stage text from job status
- Items loaded via React Query: `brand_sync_items` WHERE `job_id = activeJobId`, ordered by `display_name`
- Selected items tracked in `Set<string>` for bulk actions
- Import bar: sticky bottom bar when items selected, with bulk material/finish/color-family popovers (reuse `BulkActionPopover` component)
- Import: calls `import-synced-filaments` with selected item IDs

### Styling Notes

- Dark theme, matches existing admin pages
- All Shadcn components (Tabs, Table, Card, Badge, Dialog, Select, Button, Progress, Checkbox)
- Desktop-only layout, no mobile responsiveness needed
- Old `filament-onboarding/` components preserved as-is


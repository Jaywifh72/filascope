

# Filament Onboarding Admin Page

## Overview
Create a new admin page at `/admin/filament-onboarding` with 5 sections: extraction form, results table, review/confirm bar, preview dialog, and job history. Uses the existing `AdminNewLayout` pattern with `AdminNewSidebar` navigation.

## Files to Create

### 1. `src/pages/admin/FilamentOnboarding.tsx` — Main page component
- Section 1: Horizontal form with brand combobox (loads from `brands`), URL input, Extract button
- Brand selector checks `brand_scraping_configs` for matching `adapter_key`; shows warning badge if none
- Extract button creates `filament_onboarding_jobs` row, invokes `extract-filament-data` edge function
- Section 2: Results summary bar + filter tabs (All/New/Duplicates/Errors) + data table
- Section 5: Job history table at bottom

### 2. `src/components/admin/filament-onboarding/ExtractionResultsTable.tsx`
- Selectable table with columns: checkbox, thumbnail, color, material, display name, regional prices, SKU, status badge, actions
- Duplicate rows get yellow tint, error rows get red tint
- Select all checkbox in header
- Filter by status tab

### 3. `src/components/admin/filament-onboarding/OnboardingPreviewDialog.tsx`
- Dialog showing large image, 2-column field layout
- Editable fields: display_name, color_family, color_hex (with `react-colorful`), material, temps, prices
- Save updates `admin_override_data` on the item
- Mark as Skip button

### 4. `src/components/admin/filament-onboarding/JobHistoryTable.tsx`
- Table of recent `filament_onboarding_jobs`: date, brand, URL (truncated), status badge, counts
- Clicking a row loads that job's items into the results section

### 5. `src/components/admin/filament-onboarding/ImportConfirmDialog.tsx`
- Confirmation dialog before bulk insert
- Progress display during insertion
- Inserts selected items into `filaments` table, updates item status + job counts
- Success toast with link to brand page

## Files to Edit

### 6. `src/components/admin/AdminNewSidebar.tsx`
- Add `PackagePlus` icon import
- Add `{ title: 'Filament Onboarding', href: '/admin/filament-onboarding', icon: PackagePlus }` to Content group after TD Management

### 7. `src/App.tsx`
- Add lazy import: `const AdminFilamentOnboarding = lazy(() => import("./pages/admin/FilamentOnboarding"));`
- Add route: `<Route path="/admin/filament-onboarding" element={<AdminNewLayoutModule><AdminFilamentOnboarding /></AdminNewLayoutModule>} />`

## Edge Function for Insert
The existing `extract-filament-data` handles extraction. For the insert step, the page will use direct Supabase client inserts (admin has RLS access via `has_role`). Each selected item's `extracted_data` (merged with `admin_override_data`) gets inserted into `filaments`, then the item's `status` and `inserted_filament_id` are updated.

## Key Technical Details
- Brand selector uses `supabase.from('brands').select('id, name, logo_url')` with search
- Config check: `supabase.from('brand_scraping_configs').select('adapter_key').eq('brand_id', selectedBrandId)`
- Extraction invoke: `supabase.functions.invoke('extract-filament-data', { body: { job_id, source_url, adapter_key } })`
- Job history: `supabase.from('filament_onboarding_jobs').select('*').order('created_at', { ascending: false }).limit(20)`
- Items load: `supabase.from('filament_onboarding_items').select('*').eq('job_id', jobId)`
- Sticky bottom bar with selection count + import button using `position: sticky; bottom: 0`


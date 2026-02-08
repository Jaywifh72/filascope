

# Projects Feature Rebuild: 3D Print Project Planner

## Overview

Transform the Projects feature from a simple name+description container into a full build planner where users can track materials, accessories, costs, progress logs, and optionally share projects publicly.

## Current State

- `projects` table has only: `id`, `user_id`, `name`, `description`, `created_at`, `updated_at`
- `project_filaments` is a simple join table: `id`, `project_id`, `filament_id`, `added_at`
- No project types, statuses, cover images, budgets, accessories, or log entries
- Zero existing project data in the database (safe to modify schema)
- RLS is already in place for owner-only access on both tables

## Database Changes

### 1. Alter `projects` table (add new columns)

Since there are zero rows, we can safely add columns:

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `project_type` | text | `'single_print'` | `single_print`, `multi_part`, `collection`, `custom` |
| `status` | text | `'planning'` | `planning`, `in_progress`, `completed`, `archived` |
| `cover_image_url` | text | null | Optional cover photo |
| `is_public` | boolean | false | Whether project is publicly discoverable |
| `printer_id` | uuid | null | FK to `printers(id)` -- optional |
| `budget` | numeric | null | Optional budget in user's currency |
| `budget_currency` | text | null | Currency code for the budget |
| `slug` | text | null | URL-friendly slug for public sharing |

### 2. Alter `project_filaments` table (rename + expand to `project_materials`)

Since zero rows exist, drop and recreate as `project_materials`:

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `id` | uuid | gen_random_uuid() | PK |
| `project_id` | uuid | -- | FK to projects |
| `filament_id` | uuid | -- | FK to filaments |
| `quantity_grams` | integer | null | Estimated grams needed |
| `quantity_spools` | numeric | 1 | Number of spools |
| `note` | text | '' | e.g. "for the body" |
| `sort_order` | integer | 0 | Drag-to-reorder |
| `purchase_status` | text | 'need_to_buy' | `need_to_buy`, `purchased`, `in_use`, `done` |
| `created_at` | timestamptz | now() | -- |

### 3. New `project_accessories` table

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `id` | uuid | gen_random_uuid() | PK |
| `project_id` | uuid | -- | FK to projects |
| `name` | text | -- | e.g. "0.4mm hardened nozzle" |
| `url` | text | null | Optional purchase link |
| `price` | numeric | null | Manual price entry |
| `currency` | text | 'USD' | Currency for the price |
| `purchase_status` | text | 'need_to_buy' | Same statuses as materials |
| `sort_order` | integer | 0 | Ordering |
| `created_at` | timestamptz | now() | -- |

### 4. New `project_log_entries` table

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `id` | uuid | gen_random_uuid() | PK |
| `project_id` | uuid | -- | FK to projects |
| `user_id` | uuid | -- | Author |
| `entry_text` | text | -- | Log content |
| `created_at` | timestamptz | now() | -- |

### 5. New `project_log_photos` table

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `id` | uuid | gen_random_uuid() | PK |
| `log_entry_id` | uuid | -- | FK to project_log_entries |
| `photo_url` | text | -- | Storage URL |
| `created_at` | timestamptz | now() | -- |

### 6. Storage bucket

- Create `project-images` bucket for cover images and log photos

### 7. RLS Policies

- **projects**: Keep existing owner-only policies; add a new SELECT policy for public projects (`is_public = true`) accessible to everyone
- **project_materials**: Owner-only via project ownership join (same pattern as current `project_filaments`)
- **project_accessories**: Same pattern as materials
- **project_log_entries**: Owner-only for private projects; public read for public projects
- **project_log_photos**: Same access as their parent log entry's project

### 8. updated_at trigger

Add trigger for `projects.updated_at` column auto-update.

## Component Architecture

```text
src/components/vault/VaultProjectsTab.tsx      (list view -- rewritten)
src/components/projects/ProjectCreateDialog.tsx (multi-step creation form)
src/components/projects/ProjectDetail.tsx       (full detail view)
src/components/projects/ProjectHeader.tsx       (cover + name + status + actions)
src/components/projects/ProjectMaterials.tsx    (filament list with costs)
src/components/projects/ProjectAccessories.tsx  (accessory list)
src/components/projects/ProjectLog.tsx          (build journal)
src/components/projects/ProjectCostSummary.tsx  (total cost breakdown)
src/components/projects/FilamentSearchDialog.tsx (search & add filaments)
src/hooks/useProject.ts                         (single project CRUD + data)
src/hooks/useProjectCost.ts                     (cost calculation with regional pricing)
```

## Detailed UI Design

### A. Projects List (VaultProjectsTab -- rewritten)

- "New Project" button opens multi-step creation dialog
- Project cards display: cover image (or gradient), name, type badge, status badge, material count, estimated cost
- Cards are clickable to open the detail view (rendered inline within the Vault, not a separate route)
- Filter bar: by status (Planning / In Progress / Completed / Archived)
- Sort: by date or name

### B. Project Creation Dialog (3 Steps)

**Step 1 -- Basics:**
- Project name (required, text input)
- Description (optional, textarea)
- Project type: radio group -- "Single Print" | "Multi-Part Build" | "Collection/Series" | "Custom"
- Cover image upload (optional, drag-and-drop or click)
- Visibility: radio -- "Private" | "Public"

**Step 2 -- Printer:**
- "What printer will you use?" -- searchable dropdown from the `printers` table (model_name)
- "Skip for now" button to proceed without selecting
- Selection shows printer model name + brand as confirmation

**Step 3 -- Materials (optional, can add later):**
- Prompt: "Add filaments you'll need (you can always add more later)"
- "Add Filament" button opens the FilamentSearchDialog
- Each added filament shows: color swatch, name, quantity input (grams/spools toggle), note input
- "Create Project" final submit button

### C. Project Detail View

Rendered inline within the Vault tab (not a new page route). The `VaultProjectsTab` manages state: list view vs. detail view for a selected project ID.

**Header Section:**
- Cover image (or generated gradient based on project type)
- Project name (editable inline)
- Type badge + Status selector dropdown (Planning -> In Progress -> Completed -> Archived)
- Action buttons: "Share" (copy link) | "Duplicate" | "Delete"
- Back arrow to return to project list

**Materials Section:**
- Card/table of all filaments in the project
- Each row: color swatch (from `color_hex`), product name (linked to `/filament/[handle]`), brand, quantity, unit price (from `resolveFilamentPrice`), total line cost, purchase status dropdown, remove button
- "Total Materials Cost" at bottom
- "Add Filament" button
- Drag handles for reordering (`sort_order`)

**Accessories Section:**
- Similar layout to materials but with free-text entries
- Each row: name, optional URL (shows as link), price input, currency, purchase status, remove
- "Total Accessories Cost" at bottom
- "Add Accessory" inline form

**Build Journal (Log):**
- Timestamped entries shown newest-first
- "Add Entry" form: textarea + optional photo upload (up to 3 per entry)
- Each entry shows: text, photos as thumbnail row, timestamp
- Edit and delete buttons on own entries

**Cost Summary Card:**
- Materials subtotal + Accessories subtotal = Total estimated cost
- All prices shown in user's regional currency via `useRegion()`
- Optional "Budget" field -- if set, shows progress bar (spent vs budget)
- Converted prices show approximate indicator

### D. Filament Search Dialog

- Modal with search input that queries `filaments` table by `product_title` (ilike)
- Results show: featured image thumbnail, product title, brand, material, color swatch, price
- Click to add -- then prompted for quantity and note
- Prevents duplicates (already-added filaments show "Added" badge)

### E. Public Sharing (deferred -- minimal v1)

For v1, public projects will be viewable at `/vault?tab=projects&project=[id]` when `is_public = true`. A dedicated `/projects/:user/:slug` route can be added later. The "Share" button copies the project URL to clipboard.

## Data Flow and Hooks

### `useProject(projectId)`

Fetches a single project with all related data:
- Project record with printer join
- Materials with filament joins (for pricing and display)
- Accessories
- Log entries with photos
- Provides mutations: updateProject, addMaterial, removeMaterial, updateMaterial, reorderMaterials, addAccessory, removeAccessory, addLogEntry, deleteLogEntry

### `useProjectCost(materials, accessories)`

Pure calculation hook:
- Takes materials (with filament pricing data) and accessories
- Uses `useRegion()` and `resolveFilamentPrice()` for each material
- Returns: materialsCost, accessoriesCost, totalCost, currency, itemizedCosts[]

## Implementation Sequence

1. **Database migration** -- Alter `projects`, drop/recreate `project_materials` (replacing `project_filaments`), create `project_accessories`, `project_log_entries`, `project_log_photos`, storage bucket, RLS policies
2. **Hooks** -- `useProject.ts` and `useProjectCost.ts`
3. **FilamentSearchDialog** -- Reusable filament picker component
4. **ProjectCreateDialog** -- Multi-step creation form (Steps 1-3)
5. **ProjectDetail** -- Header, Materials, Accessories, Log, Cost Summary sub-components
6. **VaultProjectsTab** -- Rewrite with list/detail view toggle, filters, and improved cards
7. **VaultDashboard** -- Update `ProjectsSummary` to show new fields (status badge, cost)
8. **Update references** -- Any code referencing `project_filaments` must switch to `project_materials`

## Migration Safety

- `projects` table: 0 rows -- safe to alter freely
- `project_filaments` table: 0 rows -- safe to drop and replace with `project_materials`
- The `VaultDashboard.tsx` `ProjectsSummary` component queries `project_filaments(id)` -- will be updated to `project_materials(id)`
- No other components reference `project_filaments` outside of `VaultProjectsTab` and `VaultDashboard`

## Edge Cases

- Filaments without pricing: show "Price unavailable" in cost column, exclude from total
- Deleted filaments: materials reference `filament_id` as FK -- if a filament is removed from the DB, the material row shows "Filament unavailable" gracefully
- Zero-quantity materials: treated as "1 spool" for cost calculation
- Budget currency mismatch: budget is stored with its own currency; displayed in user's currency via conversion


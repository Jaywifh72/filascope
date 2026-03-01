

# HueForge Project Planner

## Overview
A guided 4-step wizard at `/hueforge-project-planner` that walks users through configuring a HueForge project and outputs a complete filament shopping list with TD-verified recommendations.

## Architecture

```text
src/
  pages/
    HueForgeProjectPlanner.tsx              -- Main page, renders wizard
  components/
    hueforge/
      project-planner/
        useProjectPlannerState.ts           -- Reducer + localStorage persistence
        PlannerStepProjectType.tsx           -- Step 1: Pick project type
        PlannerStepColorCount.tsx            -- Step 2: Color count + palette structure
        PlannerStepPickFilaments.tsx         -- Step 3: Select filaments per slot
        PlannerStepReview.tsx               -- Step 4: Review + shopping list
        PlannerFilamentSlotPicker.tsx        -- Per-slot filtered filament selector
        PlannerPalettePreview.tsx            -- Running swatch strip
```

## State Management (`useProjectPlannerState.ts`)

Uses `useReducer` with localStorage persistence (key: `hfp-project-planner`).

**State shape:**
```text
{
  step: 1-4,
  projectType: string | null,
  colorCount: number,
  slots: Array<{
    role: string,
    targetTdMin: number,
    targetTdMax: number,
    targetColorFamily: string,
    selectedFilamentId: string | null
  }>,
  customRoles: boolean
}
```

**Actions:** SET_PROJECT_TYPE, SET_COLOR_COUNT, SET_SLOT_FILAMENT, SET_STEP, UPDATE_SLOT_ROLE, TOGGLE_CUSTOM_ROLES, RESET

Navigating back preserves all state. Step validation: Step 3 requires Step 1+2 data; Step 4 requires all slots filled.

## Step Details

### Step 1 -- Project Type
- 6 large clickable cards with emoji icons, title, description, and recommended color count
- Selecting a card auto-advances to Step 2 and sets recommended `colorCount`
- Reuses existing Card component with cyan border on selection

### Step 2 -- Color Count and Palette Direction
- Number stepper (1-8) pre-set from Step 1
- Dynamic palette structure preview based on count (auto-generates slot roles with target TD ranges)
- Slot role mapping:
  - Slot 1 (base): "Base Layer -- Opaque", TD 0.3-1.0, Black/Very Dark
  - Middle slots: distributed across TD 1.0-3.5 range
  - Last slot: "Highlights", TD 3.0+, White/Light
- "Customize Roles" toggle reveals editable TD range inputs and color family selectors per slot

### Step 3 -- Pick Filaments
- For each slot: header with role + target TD range, pre-filtered filament list using the existing `color-finder-filaments` TanStack Query (filtered to `transmission_distance IS NOT NULL` and within target TD range)
- Reuses `SubstituteFilamentPicker` combobox pattern for each slot
- Running `PlannerPalettePreview` strip at top showing selected swatches
- TD coverage score: simple calculation checking if selected filaments span the needed TD range without gaps
- "Next" enabled only when all slots have selections

### Step 4 -- Review and Shopping List
- Summary card: project type, color count, TD range coverage, estimated total cost
- Clean table with Layer, Role, Filament, Brand, TD, Color swatch, Suggested Layers, Price, Buy link
- Suggested layer counts derived from TD value:
  - TD < 1: 3-4 layers
  - TD 1-2: 2-3 layers  
  - TD 2-3: 1-2 layers
  - TD 3+: 1 layer
- Action buttons: Copy Shopping List, Share (URL with encoded selections), Open in Layer Preview (link with params)
- Print settings recommendations section

## Step Navigation
- Reuses existing `WizardStepIndicator` component from `src/components/admin/inventory/wizard/`
- Labels: "Project Type", "Colors", "Filaments", "Plan"
- Click-back to any completed step without losing data

## Database

New table `user_hueforge_plans` for authenticated users to save plans:
- Columns: id, user_id, name, project_type, filament_ids (uuid[]), layer_counts (integer[]), notes, created_at, updated_at
- RLS: users can only manage their own plans
- "Save Plan" button only shown to authenticated users

## Data Flow
- Reuses the existing `useColorFinderFilaments` hook (already cached via TanStack Query)
- Filters to filaments with `transmission_distance IS NOT NULL` client-side
- All wizard logic is client-side; DB only used for saving plans

## Integration Points

### Routing (App.tsx)
- Add lazy import + route: `/hueforge-project-planner` -> `HueForgeProjectPlanner`

### TD Database Page (HueForgeTDDatabase.tsx)
- Add "Plan a Project" button in hero section buttons row

### Footer (SiteFooter.tsx)
- Add "HueForge Project Planner" to toolLinks array

## Sharing
- "Share Plan" generates a URL with query params encoding selections: `?type=portrait&f1=uuid&f2=uuid&...`
- On page load, if URL params present, hydrate state from them

## Responsive Design
- Desktop: cards in 3x2 grid (Step 1), 2-column layout (Step 3)
- Mobile: single column, scrollable filament cards, stacked action buttons
- Step transitions use CSS `transition` for smooth left-to-right feel

## Implementation Sequence
1. Create `useProjectPlannerState.ts` (reducer + localStorage + palette generation logic)
2. Build Step 1 (PlannerStepProjectType) -- project type cards
3. Build Step 2 (PlannerStepColorCount) -- color count + slot role preview
4. Build Step 3 (PlannerStepPickFilaments + PlannerFilamentSlotPicker) -- filament selection per slot
5. Build Step 4 (PlannerStepReview) -- shopping list + actions
6. Build PlannerPalettePreview strip component
7. Create database migration for `user_hueforge_plans` table with RLS
8. Compose into HueForgeProjectPlanner.tsx page with SEO
9. Integrate: route in App.tsx, hero button on TD database page, footer link


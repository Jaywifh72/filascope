

# HueForge Layer Stacking Preview

## Overview
An interactive visualization tool that lets users select filaments, assign layer counts, and see a simulated stacking preview with light transmission calculations. Available as a full page at `/hueforge-layer-preview` and as a compact widget embedded on the TD database and filament detail pages.

## Architecture

```text
src/
  pages/
    HueForgeLayerPreview.tsx              -- Full page with SEO
  components/
    hueforge/
      layer-preview/
        LayerSlotSelector.tsx             -- Vertical stack of filament slots with combobox + layer count
        LayerStackVisualization.tsx        -- Main visual: stacked bands (backlit + ambient side-by-side)
        LayerMetricsTable.tsx             -- Table with per-layer opacity & cumulative transmission
        LayerPreviewPresets.tsx           -- Preset dropdown (Classic Portrait, High Contrast, Landscape)
        LayerPreviewTips.tsx              -- Collapsible tips sidebar
        LayerPreviewCompact.tsx           -- Compact 2-slot widget for embedding
      useLayerPreviewState.ts            -- State hook (reducer + localStorage + URL sync)
```

## Data Flow
- Reuses the existing `hueforge-td-database` TanStack Query for filaments with `transmission_distance IS NOT NULL`
- Reuses `SubstituteFilamentPicker` component (or a variant) for filament combobox selection
- All visualization is client-side using layered CSS divs with opacity
- No new database tables or migrations needed

## State Management (`useLayerPreviewState.ts`)
- `useReducer` with actions: ADD_LAYER, REMOVE_LAYER, SET_FILAMENT, SET_LAYER_COUNT, CLEAR, LOAD_PRESET
- Each layer: `{ filamentId: string | null, layerCount: number }`
- Persist to `localStorage` key `hfp-layer-preview`
- URL sync via params: `?l1=uuid,3&l2=uuid,2&l3=uuid,1` (filament_id,layer_count pairs)
- Default state: 2 empty slots with layer counts 3 and 1

## Components

### LayerSlotSelector
- Renders 2-6 vertical slots (bottom to top order)
- Each slot: `SubstituteFilamentPicker` combobox + number input (1-20) for layer count + clear button
- Labels: "Base Layer", "Layer 2", ..., "Top Layer" (dynamic based on position)
- "Add Layer" button (max 6), "x" remove on each slot (min 2)
- Slots display selected filament's color swatch, name, and TD value

### LayerStackVisualization
- Two side-by-side preview rectangles (each ~200px wide x 300px tall on desktop):
  - Left: White background ("Backlit View") -- simulates lithophane with light behind
  - Right: Black background ("Ambient View") -- simulates no backlight
- Each layer rendered as a horizontal div band:
  - Height proportional to layer count (e.g., 3 layers = 3x taller than 1 layer)
  - Background color = filament's `color_hex`
  - Opacity derived from TD and layer count: `opacity = 1 - Math.exp(-layerCount * 0.2 / tdValue)`, clamped to [0.1, 1.0]
- Layers stack bottom-to-top using flexbox column-reverse or absolute positioning
- 1px border between layers: `border-top: 1px solid rgba(255,255,255,0.1)`
- Below both previews: a "Composite" swatch showing the approximate blended result via iterative alpha compositing of all layers
- Disclaimer text below composite

### LayerMetricsTable
- Standard Shadcn Table with columns: Layer, Filament, TD, Layers, Effective Opacity, Cumulative Light Transmission
- Effective Opacity = `1 - Math.exp(-layerCount * 0.2 / tdValue)` (percentage)
- Cumulative Transmission calculated iteratively: start at 100%, multiply by `(1 - effectiveOpacity)` for each layer bottom-to-top
- Footer row: Total layers count + final transmission percentage

### LayerPreviewPresets
- A Select dropdown with 3 presets
- Each preset defines filament specs (color family + approximate TD); on load, find closest matching filaments from the dataset
- Presets: "Classic Portrait" (4 layers), "High Contrast Duo" (2 layers), "Landscape" (3 layers)

### LayerPreviewTips
- Collapsible section using Shadcn Accordion
- 5 bullet tips about HueForge layer strategy
- Link to HueForge guide page

### LayerPreviewCompact (embeddable widget)
- Simplified version: 2 filament slots + small 200x150px stacking preview
- No metrics table, no presets, no tips
- "Open full preview" link to `/hueforge-layer-preview`
- Accepts optional `initialFilamentId` prop to pre-populate slot 1

## Full Page (`HueForgeLayerPreview.tsx`)
- SEO: DocumentHead with title "HueForge Layer Stacking Preview" and meta description
- Breadcrumbs: Home > HueForge TD Database > Layer Preview
- BreadcrumbSchema structured data
- Layout: responsive grid -- on desktop, slots + tips on left (40%), visualization + metrics on right (60%); on mobile, stacked vertically
- Loads filaments via shared TanStack Query

## Integration Points

### TD Database Page (`HueForgeTDDatabase.tsx`)
- Add "Layer Preview" button in hero section buttons row (alongside "Find Filaments", "Find Substitutes", "Export CSV")
- Embed `LayerPreviewCompact` widget between the educational content section and the "Browse Filaments by TD Value" table

### Filament Detail Pages
- Add `LayerPreviewCompact` with `initialFilamentId={filament.id}` in the TD/specs section (only when filament has TD data)

### Routing (`App.tsx`)
- Add lazy import + route: `/hueforge-layer-preview` -> `HueForgeLayerPreview`

### Footer (`SiteFooter.tsx`)
- Add "Layer Stacking Preview" to `toolLinks` array

## Opacity & Transmission Model

The simplified physics model for visualization:

```text
For each layer i (bottom to top):
  effectiveOpacity_i = 1 - exp(-layerCount_i * 0.2 / td_i)
  clamped to [0.1, 1.0]

Cumulative transmission starts at 1.0 (100%):
  transmission *= (1 - effectiveOpacity_i)

Composite color (iterative alpha blending):
  Start with background (white for backlit, black for ambient)
  For each layer bottom to top:
    result = layer_color * opacity + result * (1 - opacity)
```

## Responsive Design
- Desktop: two-column layout (slots + tips | visualization + metrics)
- Mobile (< 768px): single column, everything stacked
- Compact widget: always single-column, minimal height

## Implementation Sequence
1. Create `useLayerPreviewState.ts` hook (reducer + localStorage + URL sync)
2. Build `LayerSlotSelector` (reusing `SubstituteFilamentPicker`)
3. Build `LayerStackVisualization` (CSS divs with opacity + composite calculation)
4. Build `LayerMetricsTable`
5. Build `LayerPreviewPresets` and `LayerPreviewTips`
6. Compose into `HueForgeLayerPreview.tsx` full page with SEO
7. Build `LayerPreviewCompact` widget
8. Integrate: add route to `App.tsx`, hero button + widget to `HueForgeTDDatabase.tsx`, footer link
9. Add compact widget to filament detail pages (where TD exists)




## Add "Search Intelligence" Tab to Admin Edit Modal

### Overview
Add a 4th tab to the existing `EditProductModal` for filament products only. This tab provides three collapsible sections for managing the data that powers intelligent search: Physical Specifications, Trait Tags, and Use Cases, plus an embedding status indicator.

### Architecture

The implementation will create one large new component and modify one existing file:

**New file:** `src/components/admin/inventory/SearchIntelligenceTab.tsx`
- A self-contained component that receives `filamentId: string` as a prop
- Manages its own data fetching, state, and mutations against three tables: `filament_properties`, `filament_trait_tags`, `filament_use_cases`, and reads from `filament_search_embeddings` and `trait_taxonomy`
- After each save/add/delete operation, automatically calls `supabase.functions.invoke('generate-filament-embedding', { body: { filament_id } })` to regenerate the search embedding

**Modified file:** `src/components/admin/inventory/EditProductModal.tsx`
- Change `TabsList` from `grid-cols-3` to `grid-cols-4` (only when editing a filament)
- Add a 4th `TabsTrigger` with value `"search-intelligence"` and label containing a search icon + "Search Intel"
- Add a `TabsContent` that renders `<SearchIntelligenceTab filamentId={product.id} />`
- The tab only appears when `type === 'filament'`

### Technical Details

#### SearchIntelligenceTab Component Structure

The component uses three `Collapsible` sections (from shadcn/ui):

**Section A - Physical Specifications:**
- On mount: `supabase.from('filament_properties').select('*').eq('filament_id', id).maybeSingle()`
- Local state holds all field values
- Fields organized in grouped 2-column grids:
  - Thermal: `heat_resistance_c`, `glass_transition_c`, `print_temp_min`, `print_temp_max`, `bed_temp_min`, `bed_temp_max` (number inputs)
  - Mechanical: `flexibility_score`, `layer_adhesion_score`, `impact_strength_score`, `uv_resistance_score`, `moisture_resistance_score` (Slider 1-10)
  - Categorical: `warping_risk`, `support_removal`, `translucency`, `surface_finish` (Select dropdowns)
  - Booleans: `food_safe`, `outdoor_suitable`, `biodegradable`, `enclosure_required`, `abrasive`, `drying_required` (Switch toggles)
- Save button upserts to `filament_properties` with `onConflict: 'filament_id'`, then calls `generate-filament-embedding`

**Section B - Trait Tags:**
- On mount: `supabase.from('filament_trait_tags').select('*').eq('filament_id', id)`
- Displays existing tags grouped by `trait_category` (strength, weakness, use_case, avoid_if) as colored chips with delete (X) buttons
- Add form: text input with autocomplete from `trait_taxonomy` table, category radio group, confidence 1-5 selector
- Insert into `filament_trait_tags`, then re-fetch and re-call embedding generation

**Section C - Use Cases:**
- On mount: `supabase.from('filament_use_cases').select('*').eq('filament_id', id)`
- Table display with suitability color badges
- Add form: use_case text, suitability select, notes textarea
- Insert into `filament_use_cases`, then re-fetch and re-call embedding generation

**Embedding Status (bottom):**
- Fetches `filament_search_embeddings` for this filament
- Shows green/yellow badge based on whether an embedding exists
- "Regenerate Embedding" button calls the edge function manually

#### EditProductModal Changes
- Line 358: TabsList grid changes from `grid-cols-3` to dynamic based on `isFilament`
- New TabsTrigger and TabsContent added before the closing `</Tabs>` tag
- Import of the new component

### No Database Changes Required
All tables (`filament_properties`, `filament_trait_tags`, `filament_use_cases`, `filament_search_embeddings`, `trait_taxonomy`) already exist with the correct schemas. No migrations needed.


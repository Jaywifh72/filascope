

# HueForge Palette Builder — Hardening Pass

## Issues Found

### Critical (Must fix before launch)

**C1. "Open All" button opens raw URLs without affiliate tracking**
The `OpenAllButton` component (PaletteShoppingList.tsx:257-263) opens `product_url` directly via `window.open()` without affiliate wrapping. This bypasses the monetization system entirely. The comment on line 256 even acknowledges the limitation. Fix: refactor to collect affiliate-wrapped URLs from the individual `ShoppingRow` components, or create a batch affiliate URL builder.

**C2. Cross-tool "Add to Palette" buttons missing `stopPropagation`**
In `ColorMatchResultCard.tsx` (line 84) and `SubstituteResultCard.tsx` (line 105), the "Add to Palette" button's `onClick` does not call `e.stopPropagation()`. If the parent card has a click handler (e.g., navigating to filament detail), clicking the palette button will also trigger the parent. The TD Database version correctly uses `stopPropagation`. Fix: add `e.stopPropagation()` to both.

**C3. `addFilament` called inside `setPalette` updater shows toast in render cycle**
In `usePaletteBuilder.ts` (lines 42-53), `toast()` is called inside the `setPalette` callback (a state updater function). React may batch or re-run state updaters, causing duplicate or misplaced toasts. This is especially problematic with React 18 concurrent features. Fix: separate the validation check from the state update, or use a ref-based approach to fire toasts after the state update.

**C4. Preset loading can produce duplicate filaments**
When loading a preset, if two slots match the same filament (e.g., both "gray" slots in the Monochrome preset could match the same filament), `loadPalette` doesn't deduplicate. This would show the same filament twice. Fix: filter out duplicates during preset loading by tracking already-selected filament IDs and excluding them from subsequent slot queries.

### Important (Should fix soon)

**I1. Search results don't exclude filaments already in palette**
`PaletteFilamentSearch.tsx` search results (line 77-88) show all matching filaments including those already in the palette. Users can click them and get the "already in your palette" toast, which is confusing UX. Fix: filter results to exclude IDs already in palette by passing palette filament IDs as a prop.

**I2. `PaletteFilamentSearch` missing `price` in `onAdd` payload**
In `PaletteFilamentSearch.tsx` (line 94-104), the `handleSelect` callback builds the `onAdd` payload but omits the `price` field (available as `f.variant_price`). This means filaments added via search won't have prices in the Shopping List until page reload. Fix: add `price: f.variant_price` to the payload.

**I3. Suggested filaments "Add" button doesn't track duplicate addition or fire analytics**
In `PaletteAnalysis.tsx` (lines 319-335), the suggested filament "Add" button calls `onAdd` directly but doesn't fire the `palette_builder_filament_added` analytics event with `source: 'suggestion'`. Fix: wrap with analytics tracking.

**I4. Suggested filaments can suggest filaments already in palette**
The gap-fill suggestions query (PaletteAnalysis.tsx:116-131) doesn't exclude filament IDs already in the palette. A suggested filament that's already added would show an "already in palette" toast when clicked. Fix: add a `.not('id', 'in', paletteIds)` filter to the query, or filter client-side.

**I5. `?p=` restore doesn't validate UUID format before querying**
In `HueForgePaletteBuilder.tsx` (lines 209-211), the `?p=` parameter segments are split and their IDs are sent directly to Supabase without UUID format validation. Garbage strings like `?p=abc,1|xyz,2` would cause a Supabase query error. Fix: validate each ID against a UUID regex before including in the query.

**I6. Layer preview `resolved` filter skips filaments with empty color string**
In `PaletteLayerPreview.tsx` (line 40), the filter `p.color && p.tdValue != null` will exclude filaments where `color` is an empty string `""` (which is falsy). Since `PaletteEntry.color` defaults to `''` when `color_hex` is null, these filaments silently vanish from the preview. Fix: use a fallback color (`#808080`) instead of filtering them out.

**I7. Mobile touch targets too small on palette row controls**
In `PaletteList.tsx`, the reorder buttons are `p-0.5` (lines 39, 49) and layer +/- buttons are `w-5 h-5` (lines 92, 100). These are well under the 44px minimum touch target. Fix: increase to at least `w-8 h-8` on mobile using responsive classes.

**I8. Shopping list "Shop" button crashes if `hasAffiliate` is true but `productUrl` is null**
In `PaletteShoppingList.tsx` (line 67), `trackAndOpen(productUrl!, meta)` uses a non-null assertion on `productUrl`. If `hasAffiliate` is true but `productUrl` is null (possible if the URL fetch hasn't completed yet), this will pass `null` to `trackAndOpen`. Fix: add a null guard.

**I9. `loadFromStorage` doesn't validate parsed JSON structure**
In `usePaletteBuilder.ts` (lines 20-26), `JSON.parse(raw)` is cast directly to `PaletteEntry[]` without validating the shape. If localStorage contains valid JSON but with a different schema (e.g., from a previous version), the app could crash later when accessing missing properties. Fix: add basic shape validation (check array, check each item has `filamentId`).

### Nice-to-have (Can defer)

**N1. Summary bar shows "TD: undefined -- undefined" when palette is empty**
In `HueForgePaletteBuilder.tsx` (line 391), when `tdMin`/`tdMax` are null, `toFixed(2)` is called on null via optional chaining producing `undefined`. The display shows "TD: undefined -- undefined". The empty check on line 387 catches `!hasPalette`, but the template string on line 392 still renders. This is cosmetic since the bar shows "TD range: --" via the early return, but worth verifying.

**N2. No skeleton/loading state during URL restore**
When `?p=` or `?add=` triggers a Supabase fetch on mount, there's no loading indicator. The palette appears empty momentarily, then populates. Fix: add a `isRestoringUrl` state that shows a skeleton in the palette card during restore.

**N3. Preset select doesn't reset after loading**
After selecting a preset, the Select component retains the selected value visually. If the user wants to reload the same preset, they can't re-select it. Fix: use a controlled value state that resets after loading.

**N4. No offline handling for search and presets**
If the user is offline, the search query and preset loading will fail silently or show generic errors. Fix: check `navigator.onLine` and show "You're offline" messages.

**N5. "Open in Layer Preview" navigates away from palette**
Clicking this button navigates the user away from the Palette Builder, losing their context. Consider opening in a new tab or adding a "back" affordance.

**N6. Gap suggestion queries fire sequentially (not batched)**
In `PaletteAnalysis.tsx` (lines 116-131), each gap range fires a separate sequential Supabase query in a `for` loop. With multiple gaps, this creates a waterfall. Fix: use `Promise.all` to parallelize.

## Implementation Plan

### Phase 1: Critical Fixes

1. **Fix "Open All" affiliate tracking** — Refactor `OpenAllButton` to accept pre-built affiliate URLs from the parent, or iterate through palette entries and use the affiliate link builder per brand (compute URLs eagerly in the parent component).

2. **Add `stopPropagation` to cross-tool buttons** — Add `e.stopPropagation()` to `onClick` handlers in `ColorMatchResultCard.tsx` and `SubstituteResultCard.tsx`.

3. **Fix toast-in-state-updater** — Move duplicate/max checks outside `setPalette` in `usePaletteBuilder.ts`. Check conditions first, then update state, then show toast.

4. **Deduplicate preset filaments** — Track selected IDs during preset loading loop and add `.not('id', 'in', alreadySelected)` to each slot's query.

### Phase 2: Important Fixes

5. **Add `price` to search `onAdd` payload** — Add `price: f.variant_price` in `PaletteFilamentSearch.tsx` `handleSelect`.

6. **Filter search results to exclude palette entries** — Pass `existingIds` prop to `PaletteFilamentSearch`, filter in `useMemo`.

7. **Validate UUID format for `?p=` and `?add=`** — Add a UUID regex check before querying Supabase.

8. **Fix layer preview empty-color handling** — Replace filter with fallback: use `p.color || '#808080'` and remove the `p.color` check from the filter condition.

9. **Guard null `productUrl` in Shopping List** — Add `if (!productUrl) return;` before the affiliate branch.

10. **Validate localStorage shape** — Add basic array/object validation in `loadFromStorage`.

11. **Increase mobile touch targets** — Use responsive sizing `w-5 h-5 sm:w-5 sm:h-5` -> `min-w-[44px] min-h-[44px] sm:min-w-0 sm:w-5 sm:h-5` pattern on interactive controls.

12. **Exclude palette IDs from gap suggestions** — Pass palette IDs into the suggestion query.

13. **Add analytics to suggestion "Add" button** — Fire `palette_builder_filament_added` with `source: 'suggestion'`.

### Phase 3: Nice-to-have

Defer N1-N6 to a follow-up iteration.


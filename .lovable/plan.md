
# Unify Slicer Logo Fallbacks

## Summary
Two components still use raw `<img>` tags with basic fallback divs instead of the shared `SlicerLogo` component. Replacing them ensures consistent styled fallbacks (gradient background + cyan initials) everywhere.

## Changes

### 1. ComparisonBuilderSidebar.tsx
Replace the manual `<img>` / fallback `<div>` block (lines 65-73) with:
```tsx
<SlicerLogo src={slicer.logo} name={slicer.name} className="w-8 h-8 rounded" />
```
Add the import for `SlicerLogo` from `./SlicerLogoFallback`.

### 2. ComparisonBuilderMobile.tsx
Replace the manual `<img>` / fallback `<div>` block (lines 26-38) with:
```tsx
<SlicerLogo
  key={slicer.id}
  src={slicer.logo}
  name={slicer.name}
  className="w-7 h-7 rounded-full border-2 border-background"
/>
```
Add the import for `SlicerLogo` from `./SlicerLogoFallback`.

### Already Correct (no changes needed)
- `SlicerLogoFallback.tsx` — the shared component already implements all requested styling
- `SlicerComparisonTray.tsx` — already uses `SlicerLogo`
- `SlicerSimplifiedTable.tsx` — already uses `SlicerLogo`
- `SlicerTopPickCard.tsx` — already uses `SlicerLogo`
- `SlicerPopularCard.tsx` — already uses `SlicerLogo`
- `SlicerComparisonModal.tsx` — already uses `SlicerLogo`
- `ReferenceSlicers.tsx` — already uses `SlicerLogo`

## Technical Details
- Only 2 files need edits, each a small swap of ~8 lines to ~1 line
- No new components or dependencies required
- The existing `SlicerLogo` component handles `onError` internally via state, showing a `bg-gradient-to-br from-slate-700 to-slate-800` div with 2-letter cyan initials

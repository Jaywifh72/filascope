

## Comparison Tray Enhancement Plan

### Current State

The project **already has a comprehensive CompareTray system** with:
- Desktop fixed-bottom tray (`CompareTray.tsx`) with thumbnails, remove buttons, expand/collapse/minimize, CTA, share, save, presets, keyboard shortcuts, swap modal, restoration toast, history
- Mobile bottom bar + Sheet (`MobileCompareTray.tsx`) with expandable drawer
- Pill mode for non-filament pages (`CompareTrayPill.tsx`)
- Route-aware visibility via `useCompareTrayMode` hook
- Full state management in `useCompare.tsx` (localStorage persistence, 6-item max, glow animations, drag reorder, multi-select)
- All rendered globally in `App.tsx`

### What's Missing vs. the Request

Only a few enhancements are needed on top of what exists:

1. **Segmented progress bar** -- Currently shows plain text "N/6 filaments selected". Add a visual 6-segment bar with filled/empty indicators using the cyan accent.

2. **Contextual micro-copy** -- Add count-based messaging below the progress bar:
   - 1 item: "Add 1 more to start comparing"
   - 2 items: "Ready to compare! Add more for deeper insights"
   - 3-5 items: "Great selection -- compare now or add more"
   - 6 items: "Maximum reached -- let's compare!"

3. **CTA glow pulse** -- When 2+ items selected, add a subtle repeating box-shadow glow on the "Compare Now" button (not `animate-pulse` on the button itself, just the shadow).

4. **`aria-live="polite"`** -- The tray currently has `role="region"`. Add `aria-live="polite"` so screen readers announce item additions/removals.

5. **Mobile progress** -- Add a compact "2/6" badge and the same contextual micro-copy to the mobile bottom bar.

### Technical Details

**File: `src/components/CompareTray.tsx`**

- In the CENTER section (line ~384), replace the plain text counter with a row of 6 small indicator dots/segments (`w-2.5 h-2.5 rounded-full`) -- filled ones use `bg-cyan-500`, empty use `bg-gray-700`.
- Below the segments, add the contextual micro-copy as `text-xs text-muted-foreground`.
- On the Compare Now button, add a conditional class when `canCompare`: `shadow-[0_0_12px_rgba(0,210,211,0.25)]` with a CSS animation that pulses the shadow opacity.
- Add `aria-live="polite"` to the tray container div.

**File: `src/components/compare/MobileCompareTray.tsx`**

- Add the same contextual micro-copy to the mobile bottom bar (replacing the static "Add N more to compare" text with the count-based messages).
- Add a small segmented indicator (dots) next to the count badge.

**File: `src/index.css`**

- Add a `@keyframes compare-glow-pulse` animation that cycles box-shadow opacity from 0.15 to 0.35 over 2s, and a corresponding `.compare-cta-glow` utility class.

No new files, no new dependencies, no database changes.


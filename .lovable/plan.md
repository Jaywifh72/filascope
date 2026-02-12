

# Enhanced Hover Interactions for FilamentCard

## Overview
Refine the card's interaction states (default, hover, active/press, focus, CTA glow) for a more tactile, engaging feel. These are CSS-only changes within `FilamentCard.tsx`.

## Changes (all in `src/components/FilamentCard.tsx`)

### 1. Default State
Update the base card classes (line 387):
- Change `bg-card/80 border border-border` to `bg-slate-800/80 border border-slate-700/50`

### 2. Hover State (replace existing hover classes, lines 389-391)
Replace `hover:scale-[1.02]` with `hover:-translate-y-0.5` (translateY(-2px)) for lift without text distortion. Keep shadow and border brightening:
- Normal cards: `hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 hover:border-slate-600/80`
- Out-of-stock cards: `hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 hover:border-muted-foreground/20`

### 3. Active/Press State
Add `active:scale-[0.99] active:duration-[50ms]` to the card's root `<div>` className. This gives a brief tactile "press" on mousedown before the Link inside navigates.

### 4. Focus State (keyboard navigation)
Update the existing `focus-within:ring-*` classes (line 392):
- Change to `focus-within:ring-2 focus-within:ring-cyan-500/50 focus-within:ring-offset-2 focus-within:ring-offset-slate-900` for a visible cyan outline per the spec.

### 5. CTA Button Glow (lines 908-926)
Add an independent hover glow to the "View Prices" button:
- Add `hover:shadow-[0_0_12px_rgba(6,182,212,0.3)]` to the button's className so when the cursor is directly on the button, a soft cyan glow appears beneath it.

### 6. Compare Icon Opacity
Already implemented as `opacity-60 group-hover:opacity-100` (line 938) -- no change needed.

## Technical Notes
- All changes are in a single className block in the card root div (lines 385-395) and the CTA button (lines 911-920)
- No new dependencies or files needed
- The `transition-all duration-200 ease-out` already on the card handles all property transitions smoothly
- `active:duration-[50ms]` uses Tailwind's arbitrary value syntax for the brief press feel


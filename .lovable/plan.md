

## Enhance Layer Stacking Preview Widget

### Overview
Make the compact Layer Stacking Preview widget on /hueforge-td-database more visually inviting with a gradient border, improved empty state, shimmer animation, pro tip, and a more prominent CTA button.

### Changes

#### 1. LayerPreviewCompact.tsx - Visual overhaul of the card wrapper
- Replace the plain `Card` border with a gradient top-border (cyan-to-purple) using a wrapper div with `bg-gradient-to-r from-cyan-500 to-purple-500` and a 2px top strip
- Update the subtitle to: "See how your HueForge layers will look when printed and backlit"
- Restyle the "Open Full Preview" button with: `bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg py-2.5`
- Add a small "PRO TIP" badge below the dropdowns: "Choose a dark base (TD < 1) and a light top (TD > 3) for maximum contrast"

#### 2. LayerStackVisualization.tsx - Empty state and transitions
- Enhance the empty state placeholder: replace `animate-pulse` with a custom shimmer sweep using a CSS gradient overlay (`background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.05) 50%, transparent 70%)` with a 3-second animation)
- Make the placeholder layer rectangles slightly more colorful (muted teal, slate, indigo tones instead of pure gray)
- Update empty state text to: "Select filaments below to preview how layers blend"
- Add `animate-fade-in` transition class to the rendered preview (non-empty state) for smooth appearance

#### 3. tailwind.config.ts - Add shimmer keyframe
- Add a `shimmer` keyframe animation that sweeps a subtle highlight diagonally across the element over 3 seconds, looping infinitely

### Files to modify
- `src/components/hueforge/layer-preview/LayerPreviewCompact.tsx`
- `src/components/hueforge/layer-preview/LayerStackVisualization.tsx`
- `tailwind.config.ts` (add shimmer animation)

### Technical details
- The gradient top-border is achieved with a parent `div` that has `rounded-lg overflow-hidden` with a gradient background, and the card inside with `rounded-t-none border-t-0`
- The shimmer animation uses `@keyframes shimmer { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }` on an absolute-positioned pseudo-element
- The pro tip uses a `Badge` with `variant="outline"` styled with amber/yellow tones for visibility
- No functional changes to filament selection, preview rendering, or navigation

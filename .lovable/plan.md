
## Add Decorative Hero Visual to Material Knowledge Base

### What Changes
A decorative geometric card will appear to the right of the hero text on desktop screens, matching the visual style used on other FilaScope pages (Brands, Printers).

### Visual Result
- Desktop: A 260x260px dark card with a rotated hexagon outline, floating dots, and radial cyan gradient appears beside the hero title
- Mobile: Hidden entirely to keep the layout clean
- Corner labels show "MATERIALS: 45+" and "CATEGORIES: 12" in mono text

### Technical Details

**File: `src/pages/Compare.tsx`**

1. Wrap the existing hero `<div className="mb-8">` (lines 424-458) content in a flex row container:
   - Parent div gets: `flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-8`
   - Left side: wrap badge, title, subtitle, and stats in a `<div className="flex-1 min-w-0">`
   - Right side: new `<div className="hidden lg:flex">` containing the decorative element

2. The decorative block structure:
   ```
   w-[260px] h-[260px] relative rounded-2xl border border-white/10
   overflow-hidden bg-gray-900/50 items-center justify-center
   ```
   Inner elements:
   - Radial gradient overlay div (full size, absolute)
   - Centered rotated square: `border-2 border-primary/20 w-24 h-24 rotate-45 rounded-lg`
   - 4 small floating dots at corners: `w-2 h-2 rounded-full bg-primary/40` with absolute positioning
   - Top-right label: "MATERIALS: 45+" in `font-mono text-[9px] uppercase tracking-wider text-primary/50`
   - Bottom-left label: "CATEGORIES: 12" in the same style

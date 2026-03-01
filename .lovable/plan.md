

# Filament Card Visual Enhancements

## Current State Assessment

The FilamentCard component (994 lines) already has many of the requested features implemented. This plan focuses only on the **delta changes** -- enhancing what exists and adding what's missing.

| Feature | Current State | Action |
|---------|--------------|--------|
| Color swatches | w-4 h-4 dots with HoverCard | Already good -- no change needed |
| Compare button | Hidden icon, hover-only | Enhance to pill-shaped text button |
| FilaScore bar | Horizontal bar with colored fill | Already matches spec -- no change needed |
| Price freshness | Colored dot with tooltip | Add visible text labels by confidence level |
| Deal badge | Inline crossed-out price + pill | Make absolute-positioned, add pulse animation |
| Hover state | translate-y + shadow | Add cyan border glow + image brightness |
| "Ships to you" | Shows "Local: price/kg" text | Add truck icon + "Ships to you" label |

---

## Changes (all in `src/components/FilamentCard.tsx`)

### 1. Compare Button -- Pill-shaped with text labels

Replace the current 8x8 icon-only button (lines 416-439) with a pill-shaped button:
- Default: `px-2.5 py-1 text-[11px] rounded-full` showing "Compare" text
- Selected: cyan background with checkmark + "Added" text
- Still hidden on mobile until hover, always visible when selected
- Add `transition-transform duration-150` with `scale-105` when toggling

### 2. Price Freshness -- Visible text labels

Enhance the freshness indicator section (lines 758-777):
- **High confidence**: green dot (existing) + always-visible "Updated today" text in `text-emerald-400 text-[11px]` with subtle `animate-pulse` on the dot
- **Medium confidence**: amber dot + "1-3d ago" in `text-amber-400 text-[11px]`
- **Low/stale**: gray dot + time text in `text-muted-foreground text-[11px]`
- Remove the hover-only behavior (`isHovered && compactTimeAgo`) -- always show the text

### 3. Deal Badge -- Prominent absolute-positioned overlay

When `isDeal && priceTrend < 0`:
- Add an absolute-positioned badge at `top-3 left-3 z-10` (replacing/alongside the existing TD badge position logic)
- Style: `bg-red-500 text-white font-bold px-2.5 py-1 rounded-lg text-sm shadow-lg`
- Content: `{Math.abs(Math.round(priceTrend))}% OFF`
- Animation: CSS class with `animate-pulse` for first 3 seconds using a state timer, then static
- The inline crossed-out price (lines 711-719) remains as-is for context

### 4. Hover State -- Cyan glow enhancement

Update the card's hover classes (lines 377-387):
- Change `hover:shadow-black/30` to `hover:shadow-cyan-500/10`
- Add `hover:border-cyan-500/30` transition
- The CTA button (lines 931-947): add `group-hover:shadow-md` for subtle lift on card hover

### 5. "Ships to You" Badge

Enhance the local price indicator area (lines 780-787):
- When `isLocalStore` is true, add a small badge row above or replacing the "Local: price/kg" text
- Icon: `MapPin` (already imported) or `Truck` icon, 12px
- Text: "Ships to you" in `text-emerald-400 text-[11px] font-medium`
- Keep the local price display underneath

### 6. Deal Pulse Animation Timer

Add a `useState` + `useEffect` to track whether the deal badge pulse should be active:
- `const [dealPulseActive, setDealPulseActive] = useState(true)`
- `useEffect` with 3-second timeout sets it to false
- Only used when `isDeal` is true
- Badge class conditionally includes `animate-pulse` based on this state

---

## What will NOT change

- Card layout structure (flex column, 4-column grid)
- Brand logo positioning and BrandLogo component
- Material type badge styling
- Product title rendering
- "View Prices" CTA text and destination
- Color swatch HoverCard (already well-implemented)
- FilaScore bar visualization (already matches the spec)
- No SEO elements touched (component is purely visual)
- No data fetching or API changes
- Existing `VariantIndicators` interface and data flow

## Files Modified

| File | Change |
|------|--------|
| `src/components/FilamentCard.tsx` | All 5 visual enhancements above |


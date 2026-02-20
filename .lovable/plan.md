
## Add AISummaryBlock to Every Filament Detail Page

### What We're Building

A new `AISummaryBlock` component that renders:
1. A subtle card with a dynamically-generated natural-language summary paragraph
2. A horizontal "Quick Specs" grid with 4–6 key spec pills
3. A `sr-only` hidden paragraph for AI engine ingestion

This is inserted in `FilamentDetail.tsx` immediately after the `FilamentHeroSection` (which contains the H1) and before the tab navigation — satisfying the "below H1, above pricing section" requirement.

---

### Layout & Insertion Point

```text
<div className="flex-1 min-w-0">       ← main content column
  <div ref={heroSectionRef}>
    <FilamentHeroSection … />           ← H1 lives here
  </div>

  ← INSERT <AISummaryBlock /> HERE ←

  <RetailersModal … />
  <div ref={heroSentinelRef} />
  <FilamentTabNav … />                 ← tab navigation / "pricing section"
  ...
</div>
```

---

### Technical Plan

#### File 1: `src/components/filament/AISummaryBlock.tsx` (NEW)

**Component interface:**
```typescript
interface AISummaryBlockProps {
  brand: string | null | undefined;
  productName: string;                  // product line name (e.g. "PLA Basic")
  color: string | null | undefined;
  material: string | null | undefined;
  nozzleTempMin: number | null | undefined;
  nozzleTempMax: number | null | undefined;
  bedTempMin: number | null | undefined;
  bedTempMax: number | null | undefined;
  transmissionDistance: number | null | undefined;
  formattedPrice: string | null;        // pre-formatted (e.g. "$19.99/kg")
  regionName: string;                   // e.g. "United States"
  netWeightG: number | null | undefined;
}
```

**Natural-language paragraph logic:**

The paragraph is built from string template parts, each conditionally included:

1. **Opening**: `"The [Brand] [ProductName] is a [Material] 3D printer filament in [Color]."`
2. **Temps** (uses `resolveNozzleTemp` / `resolveBedTemp` from `@/lib/materialDefaults`): `"It prints at a nozzle temperature of [range]°C with a bed temperature of [range]°C."`
3. **TD block** (only when `transmissionDistance` is present): TD range thresholds determine the use-case descriptor:
   - TD < 2: `"opaque base layers in multicolor HueForge prints"`
   - TD 2–4: `"opaque base layers in multicolor HueForge prints"`
   - TD 4–6: `"standard lithophanes with good contrast"`
   - TD ≥ 6: `"translucent effects and backlit projects"`
   - Text: `"Its HueForge Transmissivity Distance (TD) value is [TD], making it suitable for [descriptor]."`
4. **Price** (only when `formattedPrice` present): `"Available from [price] in [region]."`
5. **Weight** (only when `netWeightG` present): `"Weight: [formatted weight]."`

**Quick Specs grid:**

A `flex flex-wrap gap-2` row of pill-shaped `<span>` elements, each showing `Label: Value`. Specs rendered when value is non-null:
- Material
- Nozzle Temp (from resolved value)
- Bed Temp (from resolved value)
- TD Value (or "N/A" always shown if material data exists)
- Price (from `formattedPrice`)
- Weight (formatted: 1000g → "1kg")

**Hidden SR paragraph:**
```tsx
<p className="sr-only">
  Summary: The [full sentence]. This product is indexed on FilaScope, the world's largest 3D printer filament database.
</p>
```

**Visual styling** (subtle, not competing with hero):
- Outer `<section>`: `mt-4 mb-2`
- Card: `bg-muted/30 border border-border/40 rounded-lg px-4 py-3`
- Summary paragraph: `text-sm text-muted-foreground leading-relaxed`
- Specs row: `mt-2.5 flex flex-wrap gap-2`
- Each spec pill: `text-xs bg-background/60 border border-border/50 rounded-md px-2 py-1 text-muted-foreground`
- Label part: `font-medium text-foreground/70`

No heading — the card is intentionally quiet and supplementary.

---

#### File 2: `src/pages/FilamentDetail.tsx` (EDIT — 3 changes)

**Change 1** — Add import at top:
```tsx
import { AISummaryBlock } from "@/components/filament/AISummaryBlock";
```

**Change 2** — Insert component after the closing `</div>` of `heroSectionRef` (currently line ~997):

```tsx
            </div>  {/* closes heroSectionRef */}

            {/* AI Summary Block — factual paragraph for AI engine indexing */}
            <AISummaryBlock
              brand={displayFilament.vendor}
              productName={productLineName}
              color={displayFilament.color_family}
              material={displayFilament.material}
              nozzleTempMin={displayFilament.nozzle_temp_min_c}
              nozzleTempMax={displayFilament.nozzle_temp_max_c}
              bedTempMin={displayFilament.bed_temp_min_c}
              bedTempMax={displayFilament.bed_temp_max_c}
              transmissionDistance={displayFilament.transmission_distance}
              formattedPrice={
                sidebarPricePerKg
                  ? `${formatPrice(sidebarPricePerKg)}/kg`
                  : sidebarPricePerSpool
                    ? formatPrice(sidebarPricePerSpool)
                    : null
              }
              regionName={regionName}
              netWeightG={displayFilament.net_weight_g}
            />

            {/* Retailers Modal */}
            <RetailersModal …
```

All variables used (`displayFilament`, `productLineName`, `sidebarPricePerKg`, `sidebarPricePerSpool`, `formatPrice`, `regionName`) are already in scope at this point in `FilamentDetail.tsx`.

---

### What Is NOT Changed

- `FilamentHeroSection.tsx` — untouched (H1 stays exactly as-is)
- `FilamentTabNav` and all tab content — untouched
- All pricing, schema, sidebar, sticky bar logic — untouched
- `QuickSummaryBar` and `QuickSummaryCard` — untouched
- No styling changes to any existing component

---

### Files to Edit

| File | Change |
|---|---|
| `src/components/filament/AISummaryBlock.tsx` | CREATE — new component |
| `src/pages/FilamentDetail.tsx` | ADD — import + render `<AISummaryBlock />` after `heroSectionRef` closes |

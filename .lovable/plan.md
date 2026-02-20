
# Add FilaScore + `data-ai-summary` to AISummaryBlock

## What Already Works

The `AISummaryBlock` component already exists at `src/components/filament/AISummaryBlock.tsx` and is correctly placed in `FilamentDetail.tsx` — positioned between the hero section and the tab navigation, exactly where the requirements specify. It already:

- Generates the prose paragraph from brand, product name, material, color
- Includes nozzle/bed temperature sentences
- Includes the HueForge TD sentence when `transmissionDistance` is present
- Includes price and weight

## What Is Missing

Two things need to be added:

1. **`data-ai-summary="true"` attribute** — The outer container `<div>` inside the `<section>` does not have this attribute. The requirements call for it on the container div so AI crawlers can select the block directly.

2. **FilaScore sentence** — The requirements template ends with `"FilaScore: [Score]/10."` but `AISummaryBlock` has no `filaScopeScore` prop and the sentence is absent from both the visible paragraph and the quick-specs pills. The `filaScopeScore` is available at `displayFilament.filascope_score` in `FilamentDetail.tsx` (already passed to `ProductJsonLd`) but was never forwarded to `AISummaryBlock`.

---

## Files to Change

### 1. `src/components/filament/AISummaryBlock.tsx`

**Add prop** `filaScopeScore?: number | null` to the `AISummaryBlockProps` interface.

**Add sentence** to the paragraph-building logic, after the weight sentence:

```ts
if (filaScopeScore != null) {
  parts.push(`FilaScore: ${filaScopeScore.toFixed(1)}/10.`);
}
```

**Add pill** to the quick-specs pills, after the Weight pill:

```ts
if (filaScopeScore != null) {
  specs.push({ label: "FilaScore", value: `${filaScopeScore.toFixed(1)}/10` });
}
```

**Add `data-ai-summary="true"`** to the container `<div>`:

```tsx
<div
  className="bg-muted/30 border border-border/40 rounded-lg px-4 py-3"
  data-ai-summary="true"
>
```

### 2. `src/pages/FilamentDetail.tsx`

**Pass the new prop** to `<AISummaryBlock>`:

```tsx
<AISummaryBlock
  ...existing props...
  filaScopeScore={displayFilament.filascope_score}
/>
```

This is a one-line addition at line 1033 (after `netWeightG`).

---

## Result

After these changes, the rendered paragraph on a page like `/filament/geeetech-petg-black` will read:

> The Geeetech PETG is a PETG 3D printer filament in Black. It prints at a nozzle temperature of 230–250°C with a bed temperature of 70–80°C. Its HueForge Transmissivity Distance (TD) value is 5.2, making it suitable for standard lithophanes with good contrast. Available from $18.99/kg in United States. Weight: 1kg. FilaScore: 7.4/10.

The FilaScore pill will also appear in the quick-specs pill row at the end.

The container div will carry `data-ai-summary="true"` for AI-crawler selection.

---

## No Changes To

- Tab navigation, hero section, spec badges, pricing sidebar — untouched
- Product JSON-LD schema — untouched
- Any other component or page — untouched
- The `sr-only` hidden paragraph already present — it inherits the updated `summaryText` automatically since it reuses the same variable


## Goal

Add 4 dynamically-generated FAQ Q&A pairs — based on actual filament data — to **both** the visible FAQ accordion and the FAQPage JSON-LD schema on filament detail pages. The two must stay in sync.

---

## Current Architecture (How Things Work Today)

There are two entirely separate FAQ systems on `FilamentDetail.tsx`:

**System 1 — Visible FAQ Accordion** (`CollapsibleContentContainer` → `FAQContent`)
- Located inside the "Frequently Asked Questions" expandable panel in the Overview tab.
- Receives only `material` as a prop.
- Renders generic, material-specific tips (e.g. "Why is my PLA warping?", "Should I use retraction with TPU?").
- Has no awareness of the specific filament's brand, temperature range, price, or TD value.

**System 2 — JSON-LD Schema** (`FilamentFAQSchema`)
- Invisible SEO component rendered directly in `FilamentDetail.tsx`.
- Receives full filament data (brand, temps, TD, price, etc.) as props.
- Auto-generates questions like "What nozzle temperature should I use for [Brand] [Product]?" and "What is the TD value of...?".
- These questions appear in Google rich results but are **not shown to users in the UI**.

**The Problem**: The visible accordion and the JSON-LD are disconnected. The dynamic, product-specific Q&As only exist in the schema — not on the visible page.

---

## What Will Change

### Step 1 — Create a shared FAQ generation utility

Create a new file: **`src/lib/generateFilamentFAQs.ts`**

This utility exports a single function `generateDynamicFAQs(params)` that takes filament data and returns the 4 Q&A pairs specified in the request:

- **Temperature question** — only if `nozzleTempMin` AND `nozzleTempMax` are non-null. Includes bed temp in the answer if both bed temp values exist.
- **TD question** — always generated. Answer varies: if TD exists → opaque/balanced/translucent interpretation based on range; if no TD → points to the HueForge TD Database.
- **Beginner question** — always generated. Answer varies by material: PLA/PLA+ (easy), PETG (slightly advanced), ABS/ASA/Nylon/PC (requires experience), TPU (direct-drive needed), default fallback.
- **Price question** — only if `price` is non-null and > 0.

The function signature:
```ts
generateDynamicFAQs({
  brand, productName, material,
  nozzleTempMin, nozzleTempMax, bedTempMin, bedTempMax,
  transmissionDistance, price
}): { question: string; answer: string }[]
```

This shared utility is the single source of truth — both the visible accordion and the JSON-LD will call it.

---

### Step 2 — Update `FAQContent` to accept filament data and render dynamic FAQs

**File: `src/components/filament/sections/FAQContent.tsx`**

- Extend the `FAQContentProps` interface to accept the same filament fields the utility needs:
  ```ts
  brand?: string | null;
  productName?: string | null;
  nozzleTempMin?: number | null;
  nozzleTempMax?: number | null;
  bedTempMin?: number | null;
  bedTempMax?: number | null;
  transmissionDistance?: number | null;
  price?: number | null;
  ```
- Import and call `generateDynamicFAQs()` inside the component.
- Append the returned Q&As **after** the existing material-specific items (preserving all existing questions).
- No visual design changes — the new items use exactly the same accordion item markup as existing ones.

---

### Step 3 — Update `CollapsibleContentContainer` to pass filament data to `FAQContent`

**File: `src/components/filament/sections/CollapsibleContentContainer.tsx`**

- The component already has the full `filament` object available.
- Pass the required fields as props to `<FAQContent />`:
  ```tsx
  component: <FAQContent
    material={filament.material}
    brand={filament.vendor}
    productName={filament.product_title}
    nozzleTempMin={filament.nozzle_temp_min_c}
    nozzleTempMax={filament.nozzle_temp_max_c}
    bedTempMin={filament.bed_temp_min_c}
    bedTempMax={filament.bed_temp_max_c}
    transmissionDistance={(filament as any).transmission_distance}
    price={filament.variant_price}
  />
  ```

---

### Step 4 — Update `FilamentFAQSchema` to use the shared utility

**File: `src/components/seo/FilamentFAQSchema.tsx`**

- Import `generateDynamicFAQs` from the shared utility.
- **Replace** the inline temperature/beginner/TD/price question logic in the component with a call to `generateDynamicFAQs()`.
- **Keep** the existing questions that are unique to `FilamentFAQSchema` and are NOT part of the dynamic set: the compatible-printers Q&A and the FilaScope score Q&A. These only belong in the schema (they have no equivalent in `FAQContent`).
- The final schema `faqs` array = `generateDynamicFAQs(...)` + printers Q&A (if data exists) + FilaScore Q&A (if data exists).
- The HueForge-specific Q&As currently in `FilamentFAQSchema` (TD interpretation, "Is it good for HueForge?") will be consolidated into `generateDynamicFAQs`. The TD question in the spec covers the HueForge angle in the answer.

---

## Files Modified (summary)

| File | Change |
|---|---|
| `src/lib/generateFilamentFAQs.ts` | **New file** — shared FAQ generation utility |
| `src/components/filament/sections/FAQContent.tsx` | Accept new props; append dynamic FAQs after static ones |
| `src/components/filament/sections/CollapsibleContentContainer.tsx` | Pass filament fields to `FAQContent` |
| `src/components/seo/FilamentFAQSchema.tsx` | Use shared utility; retain schema-only Q&As |

No other files are touched. The page layout, pricing section, specifications section, existing accordion UI, and all other pages are unchanged.

---

## Technical Details

**TD interpretation ranges** (matching the exact logic requested):
- TD ≤ 2 → "very opaque, ideal for dark/base layers in HueForge prints"
- TD 2–4 → "balanced opacity, good for mid-tone layers in HueForge prints"  
- TD 4–6 → "moderately translucent, suitable for highlight layers in HueForge and lithophane printing"
- TD > 6 → "highly translucent, excellent for light-transmitting layers in lithophanes and HueForge projects"

**Price field**: `CollapsibleContentContainer` will pass `filament.variant_price` as the price; `FilamentFAQSchema` already receives `price` as a prop from `FilamentDetail.tsx` (which passes `sidebarPricePerKg`). The utility accepts a generic `price` parameter, so both contexts work correctly.

**`transmission_distance` type**: The filament DB type uses `(filament as any).transmission_distance` in several places in the codebase — the same pattern will be used in `CollapsibleContentContainer`.

**No duplicate questions**: The `FilamentFAQSchema` currently has a separate "What is the TD value for...?" question AND a "Is [product] good for HueForge?" question. After this change, the shared utility will produce a single combined TD/HueForge question. The schema will be cleaner and the visible accordion will also show it.


# Enhance Product JSON-LD Schema on Filament Detail Pages

## What Changes

Three additions to the Product JSON-LD schema on `/filament/:slug` pages — all schema-only, no UI changes:

1. **TD property name fix** — Update the existing `"HueForge Transmission Distance (TD)"` to `"HueForge Transmissivity Distance (TD)"` to match the exact terminology used in HueForge and the rest of the app. Also add `unitText: "mm"` alongside the existing `unitCode: 'MMT'`.

2. **`isRelatedTo` — compatible printers** — A new hook fetches up to 5 printers compatible with the filament (based on `max_nozzle_temp_c >= filament.nozzle_temp_max_c`), joined with `printer_brands`. The result is passed as a new prop to `ProductJsonLd` and emitted as an `isRelatedTo` array of nested `Product` objects.

3. **FilaScope editorial `review`** — A new optional editorial review object is added to the schema. It uses `"Organization"` as the author (not `"Person"` like community reviews) and uses the `seoDescription` string as the `reviewBody`. The `filaScopeScore` (0–10 scale, already a prop) is used directly as `ratingValue` with `bestRating: "10"`. This is merged alongside community reviews in the `review` array.

---

## Files to Change

### 1. `src/hooks/useCompatiblePrintersForSchema.ts` — New hook

A lightweight read-only hook that fetches compatible printers for schema purposes. It reuses the same query pattern as `CompatiblePrintersLinks.tsx` but also joins `printer_brands` to get the brand name:

```ts
export interface PrinterForSchema {
  modelName: string;
  brandName: string | null;
}

export function useCompatiblePrintersForSchema(
  nozzleTempMaxC: number | null | undefined,
  filamentId: string | undefined
): PrinterForSchema[]
```

Query:
```sql
SELECT p.model_name, p.display_name, pb.brand
FROM printers p
LEFT JOIN printer_brands pb ON pb.id = p.brand_id
WHERE p.max_nozzle_temp_c >= nozzleTempMaxC
ORDER BY p.model_name
LIMIT 5
```

Stale time: 30 minutes (same as `CompatiblePrintersLinks`). Only enabled when `filamentId` exists.

### 2. `src/components/seo/ProductJsonLd.tsx` — Extend interface + schema output

**New prop:**
```ts
compatiblePrinters?: Array<{ modelName: string; brandName: string | null }>;
editorialReviewBody?: string | null;
```

**TD property name fix (line 169):** Change `'HueForge Transmission Distance (TD)'` → `'HueForge Transmissivity Distance (TD)'` and add `unitText: 'mm'`.

**`isRelatedTo` block** (added to the `jsonLd` object after `additionalProperty`):
```ts
...(compatiblePrinters && compatiblePrinters.length > 0 && {
  isRelatedTo: compatiblePrinters.map(p => ({
    '@type': 'Product',
    name: p.modelName,
    category: '3D Printer',
    ...(p.brandName && { brand: { '@type': 'Brand', name: p.brandName } }),
  })),
}),
```

**Editorial review** — merged into the existing `review` field. The current code builds the review array from community reviews. The editorial review from FilaScope is prepended to that array when `editorialReviewBody` is provided and `filaScopeScore` is non-null:

```ts
// Build combined review array: editorial first, then community reviews
const allReviews: object[] = [];

if (editorialReviewBody && filaScopeScore != null) {
  allReviews.push({
    '@type': 'Review',
    author: { '@type': 'Organization', name: 'FilaScope' },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: filaScopeScore.toFixed(1),
      bestRating: '10',
      worstRating: '1',
    },
    reviewBody: editorialReviewBody,
  });
}

if (reviews && reviews.length > 0) {
  // existing community review mapping...
  allReviews.push(...reviews.map(r => ({ ... })));
}
```

Then in `jsonLd`: `...(allReviews.length > 0 && { review: allReviews })`.

**Important:** The existing `aggregateRating` block uses `bestRating`/`worstRating` passed in as props (currently `bestRating=5, worstRating=1` from FilamentDetail). That remains unchanged — it represents community star ratings. The new editorial review intentionally uses the 0–10 scale natively to match `filaScopeScore`.

### 3. `src/pages/FilamentDetail.tsx` — Wire in the new hook + pass new props

**Import** `useCompatiblePrintersForSchema`.

**Add hook call** near the other schema-related hooks (around line 157):
```ts
const compatiblePrintersForSchema = useCompatiblePrintersForSchema(
  filament?.nozzle_temp_max_c,
  filament?.id
);
```

**Pass two new props to `<ProductJsonLd>`**:
```tsx
compatiblePrinters={compatiblePrintersForSchema}
editorialReviewBody={seoDescription}
```

`seoDescription` is already computed at line 822 — it contains the TD value when present, temperature info, and pricing. This reuses existing data with zero duplication.

---

## What Does NOT Change

- Existing `additionalProperty` fields (Nozzle Temp, Bed Temp, Net Weight, Diameter, Color Hex, FilaScope score) — untouched
- Community user `review` entries — still emitted, unchanged, just appended after the editorial review
- `aggregateRating` — unchanged (still community-first, FilaScore fallback, on 1–5 scale)
- `ProductSEO` component — untouched
- `FilamentFAQSchema` — untouched
- All visual UI components — zero changes

---

## Technical Notes

- The printers query (`max_nozzle_temp_c >= filament.nozzle_temp_max_c`) mirrors the exact logic in `CompatiblePrintersLinks.tsx` and the `compatible-printer-count` query already in `FilamentDetail.tsx`.
- When `nozzle_temp_max_c` is null, the hook is disabled and no `isRelatedTo` is emitted (safe default).
- `printer_brands` join uses `pb.id = p.brand_id` — same foreign key used in `get_brand_region_coverage` DB function.
- The editorial review uses `"Organization"` author type per schema.org guidelines for institutional reviews vs. `"Person"` for user reviews — this distinction prevents Google from conflating the FilaScope rating with a user submission.

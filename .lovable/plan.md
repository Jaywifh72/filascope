
## Structured Data Audit — Five Page Fixes

### What's Wrong (Confirmed via Code Inspection)

**1. Material pages (`FilamentCategoryPage.tsx`) — Duplicate BreadcrumbList + Missing CollectionPage**
- `useCategorySchemas()` calls `useJsonLd(breadcrumbSchema)` → emits a `BreadcrumbList`
- The visible `<Breadcrumbs>` component (line 304) also calls `useJsonLd()` internally → emits a second `BreadcrumbList`
- There is no `CollectionPage` schema anywhere
- Fix: Remove the manually-built `breadcrumbSchema` and `useJsonLd(breadcrumbSchema)` from `useCategorySchemas()`. Wrap the existing `ItemList` inside a `CollectionPage` schema instead.

**2. Learn page (`LearningCenter.tsx`) — Only a BreadcrumbList, missing CollectionPage + ItemList**
- The page imports `BreadcrumbSchema` and renders it (lines 369-372)
- The visible `<Breadcrumbs>` component (line 376) adds a second BreadcrumbList (same duplicate issue)
- No `CollectionPage` or `ItemList` schema for the guide listing
- Fix: Remove the duplicate `BreadcrumbSchema` import/component (keep only the visible `<Breadcrumbs>`). Add a `CollectionPage` + nested `ItemList` representing the guide index.

**3. Colors page (`ColorFinder.tsx`) — Wrong URL in existing `WebApplicationSchema`**
- `WebApplicationSchema` already exists (line 75-80) ✅ — but the URL is `https://filascope.com/color-finder` (the old route)
- The actual route is `/colors` (confirmed in `App.tsx` line 314)
- The `BreadcrumbSchema` also uses `color-finder` URL (line 73)
- Fix: Update both schema URLs from `color-finder` to `colors`.

**4. Deals page (`Deals.tsx`) — Already has OfferCatalogSchema ✅**
- `OfferCatalogSchema` is already rendered (lines 180-187)
- `ItemListSchema` already rendered (lines 188-195)
- `BreadcrumbSchema` already rendered (lines 176-179)
- This page is actually COMPLETE — no changes needed here.

**5. Printers list (`Printers.tsx`) — PrinterListProductSchema fires 10 separate Product schemas alongside an ItemList**
- `ItemListSchema` wraps 50 printers (lines 625-633) ✅
- `PrinterListProductSchema` additionally fires up to 10 separate top-level `Product` schemas (line 634)
- The 10 Product schemas are not wrapped in a CollectionPage
- Fix: Add a `CollectionPage` schema that wraps the existing `ItemList` data. The `PrinterListProductSchema` stays for product-level signals, but should be contained within a `CollectionPage` context. A new `CollectionPageSchema` component handles this.

---

### New Component: `src/components/seo/CollectionPageSchema.tsx`

A reusable component (like `BrandOrganizationSchema.tsx` uses internally) that emits a `CollectionPage` JSON-LD block. Used by Printers and LearningCenter pages:

```typescript
// Props
interface CollectionPageSchemaProps {
  name: string;
  description: string;
  url: string;
  numberOfItems?: number;
  image?: string;
}
```

---

### Files to Modify

| File | Change |
|---|---|
| `src/components/seo/CollectionPageSchema.tsx` | **Create new** — reusable CollectionPage schema component |
| `src/components/seo/index.ts` | Export `CollectionPageSchema` |
| `src/pages/FilamentCategoryPage.tsx` | Remove duplicate BreadcrumbList from `useCategorySchemas()`. Change `useJsonLd(itemListSchema)` to emit a `CollectionPage` wrapping the ItemList instead |
| `src/pages/LearningCenter.tsx` | Remove duplicate `BreadcrumbSchema` component. Add `CollectionPageSchema` + `ItemListSchema` for guides |
| `src/pages/ColorFinder.tsx` | Fix URL in `WebApplicationSchema` and `BreadcrumbSchema` from `/color-finder` to `/colors` |
| `src/pages/Printers.tsx` | Add `CollectionPageSchema` wrapping the printer listing |

---

### Detailed Per-Page Changes

**FilamentCategoryPage.tsx**
- In `useCategorySchemas()`: delete the `breadcrumbSchema` const and the `useJsonLd(breadcrumbSchema)` call. The `<Breadcrumbs>` component already handles the breadcrumb schema.
- Change `useJsonLd(itemListSchema)` to `useJsonLd(collectionPageSchema)` where `collectionPageSchema` wraps the itemList as `mainEntity`.

**LearningCenter.tsx**
- Remove `BreadcrumbSchema` import and its JSX call (the `<Breadcrumbs>` component on line 376 already handles the breadcrumb schema).
- Add `CollectionPageSchema` with `name="3D Printing Guides & Learning Center"`, the existing meta description, `url="https://filascope.com/learn"`, `numberOfItems={GUIDES.length}`.
- Add `ItemListSchema` with the top 20 guides (by `publishedAt` date descending) as list items.

**ColorFinder.tsx**
- `BreadcrumbSchema` line 73: change `url: 'https://filascope.com/color-finder'` → `url: 'https://filascope.com/colors'`
- `WebApplicationSchema` line 77: change `url="https://filascope.com/color-finder"` → `url="https://filascope.com/colors"`

**Printers.tsx**
- After the existing `ItemListSchema` (line 633), add `<CollectionPageSchema>` with name, description, URL, and `numberOfItems` from the printer count.

---

### Schema Structure After Fix

**Material pages** (e.g. `/filaments/pla`):
```text
BreadcrumbList     ← from <Breadcrumbs> component (single, correct)
CollectionPage     ← NEW, wrapping ItemList as mainEntity
```

**Learn page** (`/learn`):
```text
BreadcrumbList     ← from <Breadcrumbs> component (was duplicate, now single)
CollectionPage     ← NEW
ItemList           ← NEW (top guides)
```

**Colors page** (`/colors`):
```text
BreadcrumbList     ← FIXED URL (was /color-finder, now /colors)
WebApplication     ← FIXED URL (was /color-finder, now /colors)
```

**Deals page** (`/deals`):
```text
BreadcrumbList     ← Already correct ✅
OfferCatalog       ← Already present ✅
ItemList           ← Already present ✅
```

**Printers page** (`/printers`):
```text
BreadcrumbList         ← Already correct ✅
CollectionPage         ← NEW
ItemList               ← Already present ✅
Product × 10           ← Already present (PrinterListProductSchema) ✅
FAQPage                ← Already present ✅
```

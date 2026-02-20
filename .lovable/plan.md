
## Adding HowTo JSON-LD to Remaining Guide Pages

### Current State Assessment

After reading all guide pages, here is exactly what exists and what's missing:

**Already implemented correctly — no changes needed:**
- `FilamentStorageGuide.tsx` — Has `HowToSchema` with 5 drying steps + supplies list + `PT8H` totalTime
- `FilamentTemperatureGuide.tsx` — Has `HowToSchema` with 5 temperature calibration steps + `PT30M` totalTime

**Genuinely missing HowTo schema — needs work:**
1. `GuideTroubleshooting.tsx` — Has 6 troubleshooting issues, each with a multi-action `quickFix`. No SEO schema at all (no Article, no Breadcrumb, no HowTo). The accordion format maps directly to HowTo steps for each troubleshooting process.
2. `GuideDetail.tsx` rendering `GuideTemperatureSettings` — The guide content has a literal `<ol>` titled "Steps to Print a Temperature Tower" (5 explicit steps). The `GuideDetail` wrapper adds `ArticleSchema` but no `HowToSchema`. Since `GuideDetail` renders different guide types, `HowToSchema` needs to be conditionally injected per-slug.

**Correctly kept as Article-only (not procedural):**
- `GuideChoosePrinterBudget` — Price tier comparison/informational content
- `GuideBestFilamentBeginners`, `GuidePLAvsPETGvsABS`, `GuideFunctionalParts` — Rankings and comparisons
- `BuyingGuideTemplate` guides — Already have `ArticleSchema + FAQSchema`, correct as-is
- `GuidePrintSettings.tsx` — "Coming Soon" stub with no real step content

---

### Implementation Plan

#### Change 1 — `GuideTroubleshooting.tsx`

This page has no schema at all. Add:
- `ArticleSchema` (required baseline for all guides)
- `BreadcrumbSchema` (Home > Guides > Troubleshooting Guide)
- `Breadcrumbs` visible component (currently missing)
- One `HowToSchema` for the page-level troubleshooting process

The 6 `COMMON_ISSUES` items each have an `id`, `title`, and multi-action `quickFix`. Each maps to one `HowToStep`:

```
name: issue.title  (e.g. "Fix Stringing / Oozing")
text: issue.quickFix  (the multi-step fix instructions)
```

The page-level HowTo wraps all 6 as steps in one schema:

```json
{
  "@type": "HowTo",
  "name": "How to Diagnose and Fix Common 3D Printing Problems",
  "description": "Step-by-step troubleshooting for the most common 3D printing issues including stringing, bed adhesion, warping, layer shifting, under-extrusion, and clogged nozzles.",
  "totalTime": "PT30M",
  "tool": [{ "@type": "HowToTool", "name": "3D Printer" }],
  "supply": [{ "@type": "HowToSupply", "name": "Filament" }],
  "step": [
    { "@type": "HowToStep", "position": 1, "name": "Fix Stringing / Oozing", "text": "..." },
    { "@type": "HowToStep", "position": 2, "name": "Fix Poor Bed Adhesion", "text": "..." },
    ...6 total steps
  ]
}
```

The imports to add: `ArticleSchema, BreadcrumbSchema, HowToSchema` from `@/components/seo` and `Breadcrumbs` from `@/components/seo/Breadcrumbs`.

---

#### Change 2 — `GuideDetail.tsx`

The `GuideDetail` wrapper handles 5 guide slugs. Of these, only one genuinely has step-by-step content suitable for HowTo:

- `understanding-filament-temperature-settings` — has 5 explicit ordered steps under "Steps to Print a Temperature Tower"

The approach: add a `GUIDE_HOW_TO_DATA` map keyed by slug inside `GuideDetail.tsx`. When the current slug has an entry, render `<HowToSchema>` alongside the existing `<ArticleSchema>`.

```typescript
const GUIDE_HOW_TO_DATA: Record<string, {
  name: string;
  description: string;
  totalTime: string;
  tool?: string[];
  supply?: string[];
  steps: { name: string; text: string }[];
}> = {
  'understanding-filament-temperature-settings': {
    name: 'How to Find the Perfect 3D Printing Temperature',
    description: 'A step-by-step process for calibrating nozzle and bed temperature for any filament using a temperature tower.',
    totalTime: 'PT30M',
    tool: ['3D Printer', 'Slicer Software'],
    supply: ['3D Printer Filament'],
    steps: [
      { name: 'Download a Temperature Tower Model', text: 'Search for "temperature tower STL" and download a model. These are available on Printables and Thingiverse.' },
      { name: 'Configure Temperature Changes in Your Slicer', text: 'Set up your slicer with temperature changes at each section of the tower. Most slicers have a temperature tower plugin to automate this.' },
      { name: 'Print the Temperature Tower', text: 'Print the tower using the mid-point of your filament\'s recommended temperature range as the starting point.' },
      { name: 'Evaluate Each Section', text: 'Examine each section for the best layer adhesion and minimal stringing. Avoid sections with gaps (too cold) or excessive oozing (too hot).' },
      { name: 'Set Your Optimal Temperature', text: 'Use the best-performing temperature as your baseline setting in your slicer profile for this filament.' },
    ],
  },
};
```

Then in the `GuideDetailContent` component, after `<ArticleSchema>`:

```tsx
const howToData = slug ? GUIDE_HOW_TO_DATA[slug] : null;

// In the JSX:
{howToData && <HowToSchema {...howToData} />}
```

Imports to add: `HowToSchema` from `@/components/seo/HowToSchema`.

---

### Files Changed

| File | Change |
|---|---|
| `src/pages/GuideTroubleshooting.tsx` | Add `ArticleSchema` + `BreadcrumbSchema` + `Breadcrumbs` + `HowToSchema` |
| `src/pages/GuideDetail.tsx` | Add `GUIDE_HOW_TO_DATA` map + conditional `HowToSchema` render |

### What is intentionally NOT changed

| File | Reason |
|---|---|
| `FilamentStorageGuide.tsx` | Already has complete HowTo schema |
| `FilamentTemperatureGuide.tsx` | Already has complete HowTo schema |
| `GuidePrintSettings.tsx` | "Coming Soon" stub — no step content exists yet |
| `BuyingGuideTemplate.tsx` | Ranking/comparison guides — Article + FAQ schema is correct |
| `GuideChoosePrinterBudget` | Price tier comparison — not a procedural how-to |
| `GuideBestFilamentBeginners` | Curated list — not a how-to process |
| `GuidePLAvsPETGvsABS` | Material comparison — Article schema is correct |
| `GuideFunctionalParts` | Top-picks list — not procedural |

### Technical Note on Schema Co-existence

All three schema types (`ArticleSchema`, `FAQSchema`, `HowToSchema`) use `useJsonLd` which injects separate `<script type="application/ld+json">` tags directly into `<head>`, bypassing Helmet's deduplication. Google accepts multiple JSON-LD blocks on one page — this is the correct approach for pages that qualify for both Article and HowTo rich results simultaneously.

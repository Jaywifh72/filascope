
## Fix /materials/compare to Read ?a= & ?b= Query Parameters

### Problem Diagnosis

The `/materials/compare?a=petg&b=abs` URL shows the "Reference" tab (default) instead of a comparison. There are two separate issues:

1. **Wrong default tab**: The `MaterialCompare` component defaults to `tab=reference`. When visiting with `?a=petg&b=abs`, no tab switching occurs.
2. **No param ingestion**: The `ComparisonContent` component reads from a localStorage store (`getMaterialCompareList`) but never reads `?a=` / `?b=` query params to pre-populate the comparison.
3. **No dedicated comparison routes**: The clean URLs `/petg-vs-abs`, `/asa-vs-abs`, etc. don't exist yet.

### Solution Overview

We'll fix `MaterialCompare.tsx` to:
- Detect `?a=` and `?b=` params and auto-switch to the "comparison" tab
- Pre-populate the material selector with the materials from those params
- Generate dynamic SEO metadata (`<title>`, description, JSON-LD) based on the selected materials
- Show a Verdict section and comparison-specific FAQs when exactly 2 materials are being compared

We'll also add new redirect routes in `App.tsx` for clean comparison URLs.

---

### Technical Plan

#### 1. Update `MaterialCompare.tsx`

**A. Read `?a=` and `?b=` params in the top-level `MaterialCompare` component**

In the `MaterialCompare` component (lines 1410–1502), read `a` and `b` from `useSearchParams()`. When they exist:
- Set `activeTab` to `"comparison"` by default (override the `tab` param default)
- Pass the resolved materials down to `ComparisonContent`

```typescript
const aParam = searchParams.get("a")?.toUpperCase() || null;
const bParam = searchParams.get("b")?.toUpperCase() || null;
const hasCompareParams = !!(aParam && bParam);

// Default tab: if ?a and ?b present, default to "comparison"
const activeTab = searchParams.get("tab") || (hasCompareParams ? "comparison" : "reference");
```

**B. Pass pre-selected materials to `ComparisonContent`**

`ComparisonContent` will accept an optional `initialMaterials?: string[]` prop. When provided (from URL params), it initializes `selectedMaterials` state with those values instead of (or merged with) the localStorage store.

The material name lookup will normalize the param (e.g., `"petg"` → `"PETG"`, `"abs"` → `"ABS"`) against `allMaterials` from `MATERIAL_CATEGORIES` to find the exact name used in the data.

**C. Dynamic SEO metadata in `MaterialCompare`**

When `?a=` and `?b=` are present, replace the generic `<DocumentHead>` with material-specific metadata:
```typescript
const matA = aParam ? normalizeMaterialName(aParam) : null;
const matB = bParam ? normalizeMaterialName(bParam) : null;

const title = matA && matB
  ? `${matA} vs ${matB} — 3D Filament Comparison | FilaScope`
  : "Material Knowledge Base — Filament Reference & Comparison | FilaScope";

const description = matA && matB
  ? `${matA} vs ${matB} compared: strength, flexibility, print settings, price & more. Data-driven comparison from FilaScope's database of 1,080+ filaments.`
  : "Compare 3D printing material properties side by side...";
```

**D. JSON-LD Schema for compare pages**

When `?a=` and `?b=` params are present with 2 materials, emit:
- `BreadcrumbList` schema: Home > Materials > `{A} vs {B}`
- `TechArticle` schema via the existing `ArticleSchema` component
- `FAQPage` schema via the existing `FAQSchema` component

**E. Verdict section (shown when exactly 2 materials are selected)**

Add a verdict card inside `ComparisonContent` (after the Use Cases card) that generates a brief paragraph based on the two materials' qualitative properties. The verdict logic will use the existing `weightedScores` to determine the overall winner and generate text like:

> "For most users, **PETG** is the better choice when you need a balance of strength and ease of print. **ABS** is preferred when heat resistance above 80°C or acetone smoothing is required."

This is generated client-side from the existing `MaterialInfo` and `MaterialReferenceInfo` data.

**F. Comparison-specific FAQs (shown when exactly 2 materials are selected)**

A new helper function `generateMaterialComparisonFAQs(materialA, materialB)` will produce 3–5 data-driven questions from the existing reference data. For example:
- "Is {A} stronger than {B}?" — answered using TDS tensile strength data
- "Which is easier to print, {A} or {B}?" — answered using printability ratings
- "What temperature does {A} vs {B} print at?" — from `printSettings`
- "When should I use {A} vs {B}?" — from `strengths.whyChooseThis`

This FAQ output is also fed into the `FAQSchema` for the JSON-LD.

---

#### 2. Add Clean URL Routes in `App.tsx`

Add these new `<Route>` entries before the catch-all `*` route:

```tsx
<Route path="/petg-vs-abs" element={<Navigate to="/materials/compare?a=petg&b=abs" replace />} />
<Route path="/pla-vs-abs" element={<Navigate to="/materials/compare?a=pla&b=abs" replace />} />
<Route path="/asa-vs-abs" element={<Navigate to="/materials/compare?a=asa&b=abs" replace />} />
<Route path="/tpu-vs-pla" element={<Navigate to="/materials/compare?a=tpu&b=pla" replace />} />
<Route path="/nylon-vs-petg" element={<Navigate to="/materials/compare?a=nylon&b=petg" replace />} />
```

Note: `/pla-vs-petg` already has its own dedicated page (`PLAVsPETG.tsx`) and must NOT be changed.

---

#### 3. Material Name Normalization Utility

A small helper added within `MaterialCompare.tsx`:

```typescript
function normalizeMaterialParam(param: string, allMaterials: {name: string}[]): string | null {
  const upper = param.toUpperCase();
  // Exact match first
  const exact = allMaterials.find(m => m.name.toUpperCase() === upper);
  if (exact) return exact.name;
  // Partial match (e.g., "nylon" matches "Nylon")
  const partial = allMaterials.find(m => m.name.toUpperCase().startsWith(upper));
  return partial?.name || null;
}
```

Special aliases: `"abs"` → `"ABS"`, `"petg"` → `"PETG"`, `"nylon"` → `"Nylon"` (or closest match in the hierarchy).

---

### Files to Edit

1. **`src/pages/MaterialCompare.tsx`** — Primary changes:
   - Read `?a=` / `?b=` params in `MaterialCompare` component
   - Auto-switch to "comparison" tab when params exist
   - Update `<DocumentHead>` to use dynamic title/description
   - Add `BreadcrumbSchema`, `ArticleSchema`, `FAQSchema` when comparing 2 materials
   - Pass `initialMaterials` prop to `ComparisonContent`
   - Update `ComparisonContent` to accept and use `initialMaterials`
   - Add Verdict section (after Use Cases card)
   - Add `generateMaterialComparisonFAQs()` helper and FAQ display

2. **`src/App.tsx`** — Add 5 new comparison redirect routes

---

### What Is NOT Changed

- `/pla-vs-petg` dedicated page (`PLAVsPETG.tsx`) — untouched
- `MaterialKnowledgeBase.tsx` — untouched
- All existing UI styling, layouts, and component designs
- The `/reference/materials` route behavior
- The localStorage compare store behavior

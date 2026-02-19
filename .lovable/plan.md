
## Create 4 New SEO Landing Pages + Prerender Support

### Overview

This plan creates 4 new React pages, registers their routes in `App.tsx`, adds full prerender support in the edge function, adds them to the sitemap, and adds a reusable `FAQSection` component (deferred from the previous approved plan that wasn't yet executed on the client side). The `FAQSection.tsx` component does not yet exist — it will be created now.

---

### Codebase Analysis

From reading the code:

- **Route pattern**: All routes are lazy-loaded in `App.tsx`. The catch-all `*` → `NotFound` must remain last.
- **`/filaments` is currently a redirect** to `/` (line 207 of `App.tsx`). The task wants `/filament-database` as a distinct page, so we create `/filament-database` as a new route without touching the existing redirect.
- **Page patterns**: All pages use `<DocumentHead />` for meta, `<BreadcrumbSchema />` + `<FAQSchema />` from `@/components/seo`. The `HueForgeFinder.tsx` page is the closest template to what we're building.
- **`FAQSection.tsx`** does not exist yet — the prior plan was approved but not executed. We create it now.
- **Prerender**: `getPageData()` in `supabase/functions/prerender/index.ts` dispatches to named handler functions. New pages each need a handler added both to the dispatch block (lines 214–249) and as a new function (similar to `hueforgeFinderPage()`, etc.).
- **Sitemap**: `STATIC_PAGES` array at line 694. New pages must be added with appropriate priority/changefreq.
- **`/best-filaments-for-hueforge`**: There is no existing route for this. The existing `/hueforge-filaments` already has a route (line 284) pointing to `HueForgeFinder`. The new page is a *separate, distinct* route.
- **`/pla-vs-petg`**: Currently exists only in `GUIDE_META` (line 56) as a buying guide at `/guides/pla-vs-petg`. We will create a richer dedicated page at `/pla-vs-petg` with live DB stats. The guides entry continues to exist — the new page is a distinct route.
- **`/best-white-filaments`**: No existing route.
- **`/filament-database`**: No existing route. The existing `/filaments → /` redirect stays untouched.

---

### Files to Create (4 new pages + 1 component)

| File | Description |
|---|---|
| `src/components/seo/FAQSection.tsx` | Reusable FAQ accordion + JSON-LD injector |
| `src/pages/BestFilamentsForHueForge.tsx` | `/best-filaments-for-hueforge` |
| `src/pages/PLAVsPETG.tsx` | `/pla-vs-petg` |
| `src/pages/BestWhiteFilaments.tsx` | `/best-white-filaments` |
| `src/pages/FilamentDatabase.tsx` | `/filament-database` |

### Files to Modify (4 existing files)

| File | Change |
|---|---|
| `src/App.tsx` | Add 4 lazy imports + 4 routes |
| `src/components/seo/index.ts` | Export `FAQSection` |
| `supabase/functions/prerender/index.ts` | Add 4 page handler functions + dispatch entries + STATIC_PAGES entries |

---

### Technical Implementation Details

#### 1. `FAQSection.tsx` (new component)

```tsx
import { FAQSchema } from './FAQSchema';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface FAQSectionProps {
  faqs: { question: string; answer: string }[];
  title?: string;
  className?: string;
}

export function FAQSection({ faqs, title = "Frequently Asked Questions", className }: FAQSectionProps) {
  if (!faqs?.length) return null;
  return (
    <section className={cn("mt-12 border-t border-border pt-8", className)}>
      <FAQSchema faqs={faqs} />
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-4">
            <AccordionTrigger className="text-left font-medium py-4">{faq.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground pb-4">{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
```

#### 2. `BestFilamentsForHueForge.tsx`

- Queries `filaments` where `transmission_distance IS NOT NULL`, ordered by `transmission_distance ASC`
- Displays top 10 filaments by TD value in a ranked card grid, with color swatch, TD badge (purple), price, brand
- Sections: intro, "What Makes a Good HueForge Filament?", "Top 10 by TD Value" (dynamic), "Best Budget Picks", "Best White Filaments" (links to `/best-white-filaments`), "How to Choose", FAQ
- Uses `<DocumentHead>`, `<BreadcrumbSchema>`, `<ItemListSchema>`, `<FAQSection>`
- Internal links to: `/hueforge-td-database`, `/compare`, `/guides/hueforge-filaments`, `/best-white-filaments`, individual `/filament/{slug}` pages

#### 3. `PLAVsPETG.tsx`

- Queries `filaments` for aggregate stats: count of PLA vs PETG products, avg price, TD range
- Static comparison table for properties (print temp, bed temp, strength, etc.)
- Dynamic "Best PLA" and "Best PETG" picks: queries top-rated filaments per material (ranked by `filascope_score DESC`)
- Sections: H1, intro, comparison table, "PLA vs PETG for HueForge" section, "Best PLA Filaments", "Best PETG Filaments", FAQ
- Schema: `ArticleSchema` + `FAQPage`
- Internal links to: `/filament-database?material=PLA`, `/filament-database?material=PETG`, `/wizard`, `/hueforge-td-database`

#### 4. `BestWhiteFilaments.tsx`

- Queries `filaments` where `color_family = 'White' OR color_family = 'Natural'` AND `transmission_distance IS NOT NULL`, ordered by `transmission_distance ASC`
- Falls back to `color` ILIKE `'%white%'` OR `'%natural%'` if color_family column is sparse
- Ranked list cards with position number, TD value, price, "Compare" button
- Sections: H1, intro, "Why White Filaments for HueForge?", ranked list, "Natural vs White", FAQ
- Schema: `ItemList`
- Internal links to: `/hueforge-td-database`, `/color-finder?hex=FFFFFF`, `/compare`

#### 5. `FilamentDatabase.tsx`

- **This is NOT just the Finder page** — it's a content-rich wrapper that embeds a simplified filament grid with SEO content above and below
- Above the grid: H1, intro paragraph explaining what the database contains (1,080+ products, 48+ brands, specs, TD values, prices)
- Reuses the `useFinderQuery` hook or a simpler query to display a paginated filament grid (or simply deep-links to the main catalog with a link back)
- **Simpler approach**: This page is primarily editorial/SEO content with a search input that redirects to `/` with the query applied, plus material category cards (PLA, PETG, ABS, TPU, ASA, etc.) and a brand directory grid
- Below the grid: FAQ section, material category links, brand directory
- Schema: `WebApplication` + `FAQ`

#### 6. Prerender Changes

Add 4 handler functions after `hueforgeFinderPage()` (around line 533):

```ts
function bestFilamentsForHueforgePage(): PageData { ... }
function plaVsPetgPage(): PageData { ... }
function bestWhiteFilamentsPage(): PageData { ... }
function filamentDatabasePage(): PageData { ... }
```

Add 4 dispatch entries in `getPageData()` (after line 239):

```ts
if (path === "/best-filaments-for-hueforge") return bestFilamentsForHueforgePage();
if (path === "/pla-vs-petg") return plaVsPetgPage();
if (path === "/best-white-filaments") return bestWhiteFilamentsPage();
if (path === "/filament-database") return filamentDatabasePage();
```

Add 4 entries to `STATIC_PAGES`:

```ts
{ path: "/best-filaments-for-hueforge", priority: 0.8, changefreq: "weekly" },
{ path: "/pla-vs-petg", priority: 0.8, changefreq: "monthly" },
{ path: "/best-white-filaments", priority: 0.8, changefreq: "weekly" },
{ path: "/filament-database", priority: 0.8, changefreq: "weekly" },
```

---

### Exact Prerender Metadata (verbatim from task spec)

**`/best-filaments-for-hueforge`**
- Title: `Best Filaments for HueForge 2026 — TD-Ranked | FilaScope` (53 chars ✓)
- Description: `Find the best filaments for HueForge lithophanes. TD-ranked picks across PLA, silk, and translucent materials. Compare TD values, prices & buy links.` (152 chars ✓)
- Schema: `FAQPage` + `ItemList`

**`/pla-vs-petg`**
- Title: `PLA vs PETG — 3D Filament Comparison Guide | FilaScope` (55 chars ✓)
- Description: `PLA vs PETG compared: strength, flexibility, print settings, price & HueForge TD values. Data-driven comparison from 1,080+ filaments on FilaScope.` (149 chars ✓)
- Schema: `FAQPage` + `Article`

**`/best-white-filaments`**
- Title: `Best White Filaments for 3D Printing & HueForge | FilaScope` (59 chars ✓)
- Description: `Compare white 3D printer filaments ranked by TD value, print quality & price. Find the perfect white PLA for HueForge lithophanes and general printing.` (152 chars ✓)
- Schema: `ItemList`

**`/filament-database`**
- Title: `3D Filament Database — Compare 1,080+ Products | FilaScope` (58 chars ✓)
- Description: `The most comprehensive 3D printer filament database. Compare PLA, PETG, ABS & more across 48+ brands. Filter by specs, price, TD value & compatibility.` (152 chars ✓)
- Schema: `WebApplication` + `FAQPage`

---

### Routes to Add in `App.tsx`

```tsx
const BestFilamentsForHueForge = lazy(() => import("./pages/BestFilamentsForHueForge"));
const PLAVsPETG = lazy(() => import("./pages/PLAVsPETG"));
const BestWhiteFilaments = lazy(() => import("./pages/BestWhiteFilaments"));
const FilamentDatabase = lazy(() => import("./pages/FilamentDatabase"));
```

```tsx
<Route path="/best-filaments-for-hueforge" element={<BestFilamentsForHueForge />} />
<Route path="/pla-vs-petg" element={<PLAVsPETG />} />
<Route path="/best-white-filaments" element={<BestWhiteFilaments />} />
<Route path="/filament-database" element={<FilamentDatabase />} />
```

These go above the catch-all `<Route path="*" element={<NotFound />} />`.

---

### FAQ Content for Each Page (used in both prerender + client)

**`/best-filaments-for-hueforge` FAQs (5):**
1. "What is the best TD value for HueForge?" → range 1.0–3.0 for lithophanes explanation
2. "Can I use any PLA for HueForge?" → recommends tested filaments, explains why white/black anchors matter
3. "How do I find TD values for my filament?" → FilaScope database, self-measurement method
4. "What is silk PLA's TD value?" → typically higher (5+), better for translucent/highlight layers
5. "Do I need special HueForge settings per filament?" → yes, each filament has its own TD and profile

**`/pla-vs-petg` FAQs (4):**
1. "Is PLA or PETG easier to print?" → PLA wins on ease, PETG needs higher temps
2. "Is PETG stronger than PLA?" → PETG more flexible/impact resistant, PLA more rigid
3. "Which is better for HueForge, PLA or PETG?" → PLA preferred (lower TD consistency), PETG more translucent
4. "Can I mix PLA and PETG in the same print?" → generally not recommended (temp incompatibility)

**`/best-white-filaments` FAQs (3):**
1. "Why do white filaments matter for HueForge?" → base layer for lithophanes, TD anchor
2. "What is the difference between white and natural filament?" → white is pigmented (lower TD), natural is unpigmented (higher TD, more translucent)
3. "What TD value should my white filament have?" → 1.5–4.0 for most uses, lower for detail

**`/filament-database` FAQs (3):**
1. "How many filaments are in the FilaScope database?" → 1,080+ across 48+ brands
2. "How do I filter filaments by material or brand?" → using the search/filter UI
3. "How often is FilaScope's filament data updated?" → automatically via scraping + manual verification

---

### Deployment Steps

1. Create `src/components/seo/FAQSection.tsx`
2. Update `src/components/seo/index.ts` to export it
3. Create 4 new page files
4. Update `src/App.tsx` with lazy imports + routes
5. Update `supabase/functions/prerender/index.ts` with 4 handler functions + dispatch entries + STATIC_PAGES entries
6. Deploy the prerender edge function

---

### What Will NOT Change

- The existing `/filaments → /` redirect in `App.tsx` — untouched
- The existing `/hueforge-filaments` → `HueForgeFinder` route — untouched
- The existing `/guides/pla-vs-petg` guide — untouched (both can coexist; the new page is richer)
- All existing page-building functions in prerender (`filamentPage`, `brandPage`, etc.) — untouched
- No database schema changes needed — all pages query existing `filaments` table columns

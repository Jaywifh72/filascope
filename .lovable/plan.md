
## SEO Overhaul: Filament Listing Page — Crawlable Category Pages, Filter URLs & Pagination

### Architecture Assessment

After a complete audit, the core problem is clear:

**What exists today:**
- `/` (Finder.tsx) — homepage with hero, trending, and the full catalog. Material filters only update client-side state via `useSessionFilters`. Zero URL updates.
- `/filaments` → redirects to `/` (App.tsx line 214). Dead end.
- `/materials/:slug` (MaterialHub.tsx) — static pages with top 5 + 24 products, no pagination, no full Finder integration.
- `FinderPaginationBar.tsx` — all `<button>` elements, no `<a>` tags, no `href` attributes.
- `SiteFooter.tsx` — material links all point to `/?material=PLA` etc. (broken from SEO standpoint).
- Prerender handles `/materials/:slug` but not `/filaments/:slug`.

**What needs to be built:**

The key architectural insight: we already have `MaterialHub.tsx` at `/materials/:slug` which is a real indexable page — but it's too sparse (only 24 products, no pagination, no full filter sidebar). The task asks for `/filaments/:slug` routes. Rather than duplicating MaterialHub, the plan creates **new `/filaments/:slug` routes** that are the full-featured Finder with the material pre-applied and crawlable pagination.

---

### What Will Be Built

**A. New `/filaments/:slug` route (FilamentCategoryPage)**

Create `src/pages/FilamentCategoryPage.tsx` — a new page that:
- Reads `:slug` from the URL and maps it to the `MATERIAL_SLUG_CONFIG` from `MaterialHub.tsx` (already has all material → DB name mappings)
- Fetches the material count from the DB for dynamic `{count}` in titles/descriptions
- Renders the full catalog with `useFinderQuery` (the same RPC that powers Finder), with `selectedMaterials` pre-set to the slug's material list
- Has a short intro paragraph specific to each material (2-3 sentences, as specified)
- Has breadcrumbs: `Home › Filaments › PLA`
- Has its own unique H1, meta title, meta description, and canonical
- Includes the full `TechnicalConsoleSidebar` filter panel (or a simplified sidebar) with the material pre-selected but still interactive
- Includes the paginated `FinderPaginationBar` with crawlable `<a>` tags instead of `<button>`
- Includes `rel="prev"` / `rel="next"` links in the `<head>` via `useDocumentHead`

**B. New Crawlable Pagination Component (`CrawlablePaginationBar`)**

Create `src/components/CrawlablePaginationBar.tsx` — a refactored version of `FinderPaginationBar` that:
- Renders page number links as `<a href="/filaments/pla?page=2">` instead of `<button onClick>`
- Accepts a `basePath` prop (e.g., `/filaments/pla`)
- Keeps all visual styling identical (same classes, same layout)
- Still calls `onPageChange` for client-side navigation (no full page reload)
- The `href` is for Googlebot crawlability; `onClick` handles the user interaction
- Renders prev/next as `<a>` tags too

**C. Routes Added to App.tsx**

```
/filaments                → FilamentCategoryPage (slug=undefined, "all" mode)
/filaments/pla            → FilamentCategoryPage (slug="pla")
/filaments/petg           → FilamentCategoryPage (slug="petg")
/filaments/abs            → FilamentCategoryPage (slug="abs")
/filaments/tpu            → FilamentCategoryPage (slug="tpu")
/filaments/asa            → FilamentCategoryPage (slug="asa")
/filaments/silk-pla       → FilamentCategoryPage (slug="silk-pla")
/filaments/nylon          → FilamentCategoryPage (slug="nylon")
/filaments/pla-plus       → FilamentCategoryPage (slug="pla-plus")
/filaments/high-speed-pla → FilamentCategoryPage (slug="high-speed-pla")
/filaments/polycarbonate  → FilamentCategoryPage (slug="pc")
/filaments/petg-cf        → FilamentCategoryPage (slug="petg-cf") [new in MATERIAL_SLUG_CONFIG]
```

One dynamic route: `<Route path="/filaments/:slug" element={<FilamentCategoryPage />} />`

The existing `/filaments` catch-all redirect to `/` will be replaced with the new component.

**D. Footer Links Updated**

`SiteFooter.tsx` material links updated from `/?material=PLA` to `/filaments/pla` etc.

**E. Prerender Handler for `/filaments/:slug`**

`supabase/functions/prerender/index.ts` — add a `filamentCategoryPage(slug, supabase)` handler that:
- Queries DB for count and top 50 products for that material
- Emits the correct title, description, H1, canonical
- Emits ItemList JSON-LD with up to 50 products (full Product nested schema)
- Emits BreadcrumbList JSON-LD
- Emits `rel="prev"` / `rel="next"` link tags if the slug has `?page=N` parameter

**F. `useDocumentHead` enhancement for `rel="prev"` / `rel="next"`**

Add `paginationPrev?: string` and `paginationNext?: string` to `DocumentHeadOptions` so FilamentCategoryPage can inject these `<link>` tags.

---

### Detailed File Changes

#### 1. `src/pages/FilamentCategoryPage.tsx` (NEW)

**Key logic:**
```tsx
const { slug } = useParams<{ slug: string }>();
const [searchParams, setSearchParams] = useSearchParams();
const currentPage = parseInt(searchParams.get("page") || "1", 10) - 1; // 0-indexed internally

// Map slug → materials
const config = slug ? MATERIAL_SLUG_CONFIG[slug] : null;
// null slug = "all filaments" mode

// Page metadata
const pageSize = 48;
const totalPages = Math.ceil(count / pageSize);
const basePath = slug ? `/filaments/${slug}` : '/filaments';

// For pagination navigation (client-side)
const handlePageChange = (page: number) => {
  if (page === 0) {
    searchParams.delete("page");
  } else {
    searchParams.set("page", String(page + 1));
  }
  setSearchParams(searchParams, { replace: true });
};

// rel="prev" and rel="next" for head
const prevUrl = currentPage > 0
  ? `${basePath}${currentPage === 1 ? '' : `?page=${currentPage}`}`
  : null;
const nextUrl = currentPage < totalPages - 1
  ? `${basePath}?page=${currentPage + 2}`
  : null;
```

**SEO title/description logic per slug:**
A `CATEGORY_META` map inside the page provides the title template, description template, H1, and intro text for each slug. Dynamic `{count}` is replaced with actual DB count.

**Page structure (no hero):**
```
<Breadcrumbs items={[{name:"Filaments",url:"/filaments"},{name:label,url:basePath}]} />
<h1>PLA Filaments</h1>
<p className="text-muted-foreground">{intro text with actual count}</p>
[Optional stats strip: product count, brand count]
[TechnicalConsoleSidebar — with material pre-selected and locked, or pre-selected but unlocked]
[CrawlablePaginationBar]
```

For the filter sidebar — the material will be pre-selected but NOT locked. Users can deselect and filter further. This matches the user's requirement of "filter sidebar with material pre-selected."

**`useFinderQuery` integration:**
Pass `selectedMaterials` as the material list from the config. This reuses the existing RPC without any DB changes.

**Unknown slug handling:**
If `slug` is not in `MATERIAL_SLUG_CONFIG`, return `<Navigate to="/" replace />`.

#### 2. `src/components/CrawlablePaginationBar.tsx` (NEW)

Same visual layout as `FinderPaginationBar`. Key difference — page number buttons become `<a>` tags:

```tsx
// BEFORE (button):
<button onClick={() => onPageChange(p)}>
  {p + 1}
</button>

// AFTER (anchor — crawlable, but also calls onPageChange to avoid full reload):
<a
  href={`${basePath}${p === 0 ? '' : `?page=${p + 1}`}`}
  onClick={(e) => {
    e.preventDefault(); // prevent full reload
    onPageChange(p);
  }}
  className={cn(...)}
  aria-current={p === currentPage ? "page" : undefined}
>
  {p + 1}
</a>
```

The `basePath` prop defaults to `/filaments` — can be passed from FilamentCategoryPage.

Prev/Next chevrons also become `<a>` tags with `rel="prev"` / `rel="next"` attributes on the anchor elements (different from the `<link>` tags in `<head>` — both are needed).

#### 3. `src/App.tsx`

Replace:
```tsx
<Route path="/filaments" element={<Navigate to="/" replace />} />
```

With:
```tsx
<Route path="/filaments" element={<FilamentCategoryPage />} />
<Route path="/filaments/:slug" element={<FilamentCategoryPage />} />
```

Add import for `FilamentCategoryPage`.

Also add 301-equivalent redirects for `/?material=PLA` etc. — this requires a small effect in `Finder.tsx` that detects the `material` query param on mount and does `navigate('/filaments/pla', { replace: true })`. This is the client-side redirect that handles inbound links that still use the old format.

#### 4. `src/components/SiteFooter.tsx`

Update `materialLinks` array:
```tsx
const materialLinks = [
  { name: "PLA Filaments", href: "/filaments/pla" },
  { name: "PETG Filaments", href: "/filaments/petg" },
  { name: "ABS Filaments", href: "/filaments/abs" },
  { name: "TPU Filaments", href: "/filaments/tpu" },
  { name: "ASA Filaments", href: "/filaments/asa" },
  { name: "Silk PLA Filaments", href: "/filaments/silk-pla" },
  { name: "High Speed PLA", href: "/filaments/high-speed-pla" },
  { name: "Nylon Filaments", href: "/filaments/nylon" },
  { name: "All Filaments →", href: "/filaments" },
];
```

#### 5. `src/hooks/useDocumentHead.ts`

Add two new optional props to `DocumentHeadOptions`:
```ts
paginationPrev?: string;  // full URL for rel="prev"
paginationNext?: string;  // full URL for rel="next"
```

In the `useEffect`, add:
```ts
if (opts.paginationPrev) {
  // upsert <link rel="prev" href="...">
  upsertLink('prev', opts.paginationPrev);
}
if (opts.paginationNext) {
  upsertLink('next', opts.paginationNext);
}
```

In cleanup:
```ts
if (opts.paginationPrev) document.head.querySelector('link[rel="prev"]')?.remove();
if (opts.paginationNext) document.head.querySelector('link[rel="next"]')?.remove();
```

#### 6. `supabase/functions/prerender/index.ts`

**Add route matching for `/filaments` and `/filaments/:slug`:**

In `getPageData()`:
```ts
// /filaments (all filaments listing)
if (path === "/filaments") return await filamentListingPage(supabase);

// /filaments/:slug (material category pages)
const flm = path.match(/^\/filaments\/([^\/]+)$/);
if (flm) return await filamentCategoryPage(flm[1], supabase);
```

**`filamentCategoryPage(slug, supabase)` handler:**

```ts
async function filamentCategoryPage(slug: string, supabase: SupabaseClient): Promise<PageData> {
  // Same MATERIAL_SLUG_CONFIG logic as the client
  // Query: count + top 50 filaments ordered by filascope_score
  // Build title, description, H1, intro text
  // Build ItemList JSON-LD with up to 50 Products (nested schema)
  // Build BreadcrumbList JSON-LD
  // Return canonical: /filaments/${slug}
}
```

**ItemList JSON-LD with nested Product (as specified in task §4):**
```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Best PLA Filaments",
  "numberOfItems": 50,
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "item": {
        "@type": "Product",
        "name": "Bambu Lab PLA Basic",
        "url": "https://filascope.com/filament/bambu-lab-pla-basic",
        "brand": { "@type": "Brand", "name": "Bambu Lab" },
        "category": "PLA 3D Printer Filament",
        "offers": {
          "@type": "Offer",
          "price": "25.99",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock"
        }
      }
    }
  ]
}
```

**`buildHtml` body links:** The prerender `buildHtml` currently only outputs `<h1>` and `<p>`. For the category pages, we need crawlable `<a>` links in the body. Add a `links?: {href:string; text:string}[]` field to `PageData` and emit them in `buildHtml`:
```html
<ul>
  <li><a href="/filament/bambu-lab-pla-basic">Bambu Lab PLA Basic</a></li>
  ...
</ul>
```
This gives Googlebot actual crawlable links to filament detail pages.

#### 7. `src/pages/Finder.tsx`

Add a redirect effect for legacy `?material=` URL params:
```tsx
useEffect(() => {
  const materialParam = searchParams.get("material");
  if (materialParam) {
    // Map material name to /filaments/:slug
    const slugMap: Record<string, string> = {
      PLA: "pla", PETG: "petg", ABS: "abs", TPU: "tpu", ASA: "asa",
      "Silk PLA": "silk-pla", "Silk+PLA": "silk-pla",
      "PA": "nylon", "Nylon": "nylon",
      "High+Speed+PLA": "high-speed-pla", "High Speed PLA": "high-speed-pla",
      "PLA+": "pla-plus",
    };
    const targetSlug = slugMap[materialParam] || slugMap[decodeURIComponent(materialParam)];
    if (targetSlug) {
      navigate(`/filaments/${targetSlug}`, { replace: true });
    }
  }
}, []); // Only on mount
```

This handles the 301-style client redirect for `/?material=PLA → /filaments/pla`.

---

### MATERIAL_SLUG_CONFIG additions needed

The existing config in `MaterialHub.tsx` needs these additions to cover all requested routes:
- `high-speed-pla` (maps to `["PLA-HS", "PLA High Speed Pro", "Premium PLA High Speed"]`)
- `polycarbonate` → alias for `pc` 
- `petg-cf` (maps to `["PETG-CF", "PETG Carbon Fiber"]`)

These will be added to `MaterialHub.tsx` so the config is used by both `MaterialHub` and `FilamentCategoryPage`.

---

### Intro Text Per Category

Will be stored in a `CATEGORY_INTRO` map in `FilamentCategoryPage.tsx`:

| Slug | Intro |
|---|---|
| `pla` | "PLA (Polylactic Acid) is the most popular 3D printing material — easy to print, biodegradable, and available in hundreds of colors. Compare {count} PLA filaments below with real-time pricing, HueForge TD values, and printer compatibility data." |
| `petg` | "PETG combines the printability of PLA with the strength of ABS. It's impact-resistant, food-safe options exist, and it handles higher temperatures. Compare {count} PETG filaments with real-time pricing and compatibility data." |
| `abs` | "ABS is a durable, heat-resistant engineering plastic ideal for functional parts. It requires an enclosed printer and heated bed. Compare {count} ABS filaments with specs, pricing, and compatibility data." |
| `tpu` | "TPU is a flexible filament with rubber-like properties, ideal for phone cases, gaskets, and wearables. Print slowly with a direct-drive extruder. Compare {count} TPU filaments with specs and pricing." |
| `asa` | "ASA offers superior UV and weather resistance compared to ABS, making it ideal for outdoor parts. It requires an enclosure. Compare {count} ASA filaments with specs, pricing, and compatibility data." |
| `silk-pla` | "Silk PLA produces stunning metallic-sheen prints with vibrant colors. It's particularly popular for HueForge lithophanes due to high TD values. Compare {count} Silk PLA filaments with color options and pricing." |
| `nylon` | "Nylon (PA) is a strong, flexible engineering material ideal for functional parts requiring fatigue resistance. It's highly hygroscopic — always dry before printing. Compare {count} Nylon filaments with specs and pricing." |
| `pla-plus` | "PLA+ offers improved impact resistance and reduced brittleness over standard PLA while maintaining easy printability. Compare {count} PLA+ filaments across brands with real-time pricing and specs." |
| `high-speed-pla` | "High-Speed PLA is formulated for printing at 200–600mm/s on modern printers like Bambu Lab and Creality K1. Compare {count} high-speed PLA filaments with compatible printers and pricing data." |
| `polycarbonate` | "Polycarbonate is one of the strongest 3D printing materials, with exceptional impact resistance and heat tolerance up to 130°C. Requires an all-metal hotend and enclosure. Compare {count} PC filaments." |
| (default/all) | "Browse all {count}+ 3D printer filaments from 48+ brands. Filter by material, brand, price range, and printer compatibility to find your perfect filament." |

---

### SEO Metadata Per Route

| Path | Title | H1 | Canonical |
|---|---|---|---|
| `/filaments` | `3D Printer Filaments — Compare {count}+ Filaments \| FilaScope` | `3D Printer Filament Database` | `https://filascope.com/filaments` |
| `/filaments/pla` | `PLA Filaments — Compare {count}+ Options \| FilaScope` | `PLA Filaments` | `https://filascope.com/filaments/pla` |
| `/filaments/petg` | `PETG Filaments — Compare {count}+ Options \| FilaScope` | `PETG Filaments` | `https://filascope.com/filaments/petg` |
| ... | (per spec in brief) | ... | ... |

All titles are capped at 60 characters; `{count}` is the live DB count pulled on page render.

---

### Pagination URL Strategy

The `?page=` parameter is used (not path-based):
- Page 1: `/filaments/pla` (no `?page=`)
- Page 2: `/filaments/pla?page=2`
- Page 3: `/filaments/pla?page=3`

`rel="prev"` for page 2 → `https://filascope.com/filaments/pla` (no param)
`rel="prev"` for page 3 → `https://filascope.com/filaments/pla?page=2`

The canonical URL for all pages is the base slug URL (no `?page=`), following the convention established for color variants.

---

### Prerender Pagination Support

The prerender function receives the full path including query string. When a bot hits `/filaments/pla?page=2`:
- It serves the correct page 2 content (50 filaments, offset 50)
- Emits the correct `rel="prev"` / `rel="next"` links in the HTML `<head>`
- Uses the same canonical (base slug URL, no `?page=`)

The `PageData` interface gets a new `paginationLinks?: { prev?: string; next?: string }` field, and `buildHtml` emits them:
```html
<link rel="prev" href="https://filascope.com/filaments/pla" />
<link rel="next" href="https://filascope.com/filaments/pla?page=3" />
```

---

### Files to Create / Modify

| File | Action | Summary |
|---|---|---|
| `src/pages/FilamentCategoryPage.tsx` | CREATE | New page for `/filaments` and `/filaments/:slug` routes |
| `src/components/CrawlablePaginationBar.tsx` | CREATE | Crawlable `<a>` tag pagination replacing `<button>` |
| `src/App.tsx` | MODIFY | Add `/filaments` and `/filaments/:slug` routes; import new page |
| `src/components/SiteFooter.tsx` | MODIFY | Update material links from `/?material=PLA` → `/filaments/pla` |
| `src/hooks/useDocumentHead.ts` | MODIFY | Add `paginationPrev` / `paginationNext` props + `upsertLink` calls |
| `src/pages/MaterialHub.tsx` | MODIFY | Add `petg-cf`, `polycarbonate`, `high-speed-pla` to `MATERIAL_SLUG_CONFIG`; export it |
| `src/pages/Finder.tsx` | MODIFY | Add `?material=` redirect effect to new `/filaments/:slug` URLs |
| `supabase/functions/prerender/index.ts` | MODIFY | Add `/filaments` and `/filaments/:slug` handlers with nested Product ItemList + pagination link tags |

---

### What Will NOT Change

- Homepage (`/`) visual design — no layout changes, hero, trending, or value props
- `/materials/:slug` (MaterialHub) — remains unchanged, no routes removed
- `FinderPaginationBar.tsx` — kept as-is (used by Finder/homepage); new `CrawlablePaginationBar` is additive
- All existing affiliate, pricing, compare functionality
- Database schema — zero DB migrations needed
- Admin panel

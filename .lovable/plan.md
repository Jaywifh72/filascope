
## SEO Overhaul: Printer Detail Pages — Complete Implementation Plan

### Current State Analysis

**`PrinterHeroSection.tsx` (H1 Issue):**
- Line 109: `<h1 className="text-3xl font-bold text-foreground leading-tight">{printer.model_name}</h1>`
- H1 is ONLY the model name (e.g., "P1S"), with brand rendered as a separate `<div>` above it
- Zero keyword context ("3D Printer" not in the H1)

**`PrinterDetail.tsx` (SEO/Schema Issues):**
- Line 634–638: One `BreadcrumbSchema` injected here (3-item: Home → Printers → Name)
- Line 674–681: `DetailBreadcrumb` injects a SECOND `BreadcrumbSchema` via `BreadcrumbSchema` component (3 items: Home → Printers → Brand → Model) — **TWO duplicate BreadcrumbList schemas confirmed**
- Line 639–649: `ProductSEO` title is just `printerName` (e.g., "Bambu Lab P1S") with description pattern that includes price and is under 140 chars
- Line 651–670: `ProductJsonLd` passes basic props only — no physical dimensions (weight/width/height/depth), no multi-material, enclosure, connectivity, extruder type, etc.
- Line 553–563: The 404 state shows `<h1 className="text-2xl font-bold mb-4">Printer not found</h1>` but no `noindex` meta tag and uses whatever meta ProductSEO renders for null printer (which falls through to parent layout defaults)
- Line 1001–1011: `FAQSection` component generates 20 dynamic FAQs, but **NO FAQPage JSON-LD schema** is emitted from it
- Lines 824–1041: Tab content is conditionally rendered with `{activeTab === "specifications" && ...}` — Googlebot only sees the Overview tab content

**`FAQSection.tsx` (Crawler Issues):**
- Line 170: `const visibleFAQs = showAll ? filteredFAQs : filteredFAQs.slice(0, 5)` — only 5 of 20 FAQ questions in DOM initially
- Line 278–286: "Show all 20 questions" is a `<button>` — answers hidden by JS state, not just CSS
- No `FAQPage` JSON-LD emitted anywhere

**`PrinterTabNav.tsx` (Crawlability):**
- Line 84: Tab buttons use `role="tab"` `<button>` elements — Googlebot cannot follow these
- Tab content only renders for the active tab — specifications/materials/connectivity/pricing are invisible to crawlers

**`DetailBreadcrumb.tsx`:**
- Line 77: Brand breadcrumb links to `/printers?brand=${toBrandSlug(printerBrand)}` — a query parameter, not the SEO category page `/printers/brand/bambu-lab` that was created in the previous plan

**`RecentlyViewedSection.tsx` (UUID URLs):**
- Line 44–45: The `href` for printers is `/printers/${item.product_id}` where `product_id` is the UUID from the browse history — this may serve UUID URLs

**`SpecificationsTabContent.tsx`:**
- Line 103: Section headers use `<h3 className="section-title">` — these are H3s with no H2 parent wrapper
- Categories like "Dimensions", "Print Performance" etc. are rendered as H3 labels inside a `SpecSection` component

**`PricingTabContent.tsx`:**
- Line 43: `<h3 className="section-title">{title}</h3>` — all section headings are H3

**`MaterialsTabContent.tsx`:**
- Line 200+: Uses similar H3 patterns for section headers

**Prerender Edge Function (`supabase/functions/prerender/index.ts`):**
- Lines 728–768: `printerPage()` function EXISTS and handles `/printers/:slug` — it queries by `printer_id` slug, falling back to UUID
- The function generates: title, description, Product schema, BreadcrumbList schema, h1 (just `full` name without "3D Printer" suffix), and bodyText
- **Major gap**: Title at line 748 is `${full} — Specs, Compatible Filaments & Price | FilaScope` — already reasonable but missing "3D Printer" keyword
- **Major gap**: Product schema at line 760–765 only has: name, description, brand, sku, category, url, offers — missing ALL additional specs (build volume, max speed, nozzle temp, bed temp, dimensions, connectivity, etc.)
- **Major gap**: Only ONE `BreadcrumbList` generated in prerender (correct) but the client React renders TWO
- **Category route gap**: The prerender `pm` match at line 450–451 does `path.match(/^\/printers\/(.+)$/)` — this will match `/printers/enclosed`, `/printers/brand/bambu-lab` etc. and call `printerPage()` with "enclosed" or "brand/bambu-lab" as the slug — these return `fallback()` because no printer has `printer_id = "enclosed"`

---

### Priority-Ordered Implementation Plan

#### Files to Modify

| File | Changes |
|---|---|
| `src/components/printer/PrinterHeroSection.tsx` | Fix H1 to include brand + model + "3D Printer" |
| `src/components/printer/FAQSection.tsx` | Render all FAQs in DOM (CSS hidden); add FAQPage JSON-LD |
| `src/components/printer/PrinterTabNav.tsx` | Convert tab `<button>` to `<a>` tags |
| `src/pages/PrinterDetail.tsx` | Remove duplicate BreadcrumbSchema; fix 404 noindex; enhance ProductJsonLd; fix brand breadcrumb URL; update meta title/description template |
| `src/components/seo/ProductJsonLd.tsx` | Accept new printer-specific props (dimensions, connectivity, materials list) |
| `src/components/printer/tabs/SpecificationsTabContent.tsx` | Change `<h3>` section titles to `<h2>` |
| `src/components/printer/tabs/MaterialsTabContent.tsx` | Change section `<h3>` to `<h2>`; make material badges into `<a>` links |
| `src/components/printer/tabs/PricingTabContent.tsx` | Change `<h3>` section titles to `<h2>` |
| `src/components/printer/tabs/ConnectivityTabContent.tsx` | Change `<h3>` section titles to `<h2>` |
| `src/components/printer/tabs/OverviewTabContent.tsx` | Change any `<h3>` top-level section titles to `<h2>` |
| `src/pages/PrinterDetail.tsx` | Render ALL tab content in DOM (CSS hidden for inactive tabs); add "About" SEO paragraph |
| `src/components/RecentlyViewedSection.tsx` | Fix UUID printer URLs to use slug |
| `supabase/functions/prerender/index.ts` | Enhance `printerPage()`: richer Product schema, "3D Printer" in h1/title, category page fallback handling, 404 noindex |

---

### Detailed Changes

#### 1. Fix H1 — `src/components/printer/PrinterHeroSection.tsx`

**Current (line 103–111):**
```tsx
<div className="text-sm text-gray-400 font-medium">
  {brand}
</div>
<div className="flex items-center gap-3">
  <h1 className="text-3xl font-bold text-foreground leading-tight">
    {printer.model_name}
  </h1>
```

**New — H1 contains full keyword phrase, visual display unchanged:**
```tsx
{/* SEO H1 — visually hidden brand prefix, prominent model name */}
<h1 className="text-3xl font-bold text-foreground leading-tight flex items-center gap-3">
  {/* Brand shown smaller as visual context but INSIDE h1 */}
  {brand && (
    <span className="block text-sm text-gray-400 font-medium mb-0.5 -mt-1 leading-none">
      {brand}
    </span>
  )}
  {/* Visually dominant model name */}
  <span className="block">{printer.model_name}</span>
  {/* Screen-reader / SEO only */}
  <span className="sr-only">3D Printer</span>
</h1>
```

Actually, `sr-only` won't work well for SEO. The simpler and SEO-cleanest approach:

```tsx
{/* H1 with full keyword phrase. Brand is styled smaller, model is bold. */}
<h1 className="leading-tight">
  {brand && (
    <span className="block text-sm text-gray-400 font-medium mb-1">{brand}</span>
  )}
  <span className="block text-3xl font-bold text-foreground">
    {printer.model_name}
  </span>
  <span className="block text-xs text-muted-foreground/60 font-normal mt-0.5">3D Printer</span>
</h1>
```

This puts the full "Bambu Lab P1S 3D Printer" text into the H1 element. Brand appears as a small label above the model name; "3D Printer" appears as a subtle label below — all within the single `<h1>`.

**Remove the old separate brand `<div>` and share button row.** Move the share button outside the `<h1>` tag.

#### 2. Fix Heading Hierarchy — Tab Content Files

**`SpecificationsTabContent.tsx` (line 103):**
Change `<h3 className="section-title">` → `<h2 className="section-title">` in `SpecSection`. The SubSection component (line 115) shows subcategory labels — change those to `<h3>`.

**`PricingTabContent.tsx` (line 43):**
Change `<h3 className="section-title">` → `<h2 className="section-title">` in `SectionHeader`.

**`MaterialsTabContent.tsx` (line ~200):**
Change the top-level `SectionHeader` `<h3>` → `<h2>`. Internal subsection labels (material category names like "Standard", "Engineering") → `<h3>`.

**`ConnectivityTabContent.tsx`:**
Same pattern — top-level section headers `<h3>` → `<h2>`.

**`OverviewTabContent.tsx`:**
Same pattern — top-level section headers (Quick Verdict, Advantage Cards, etc.) `<h3>` → `<h2>`.

**Heading hierarchy after changes:**
```
H1: Bambu Lab P1S 3D Printer
  H2: Overview (sr-only, implied by tab)
    H2: Quick Verdict  
    H2: Advantage Cards
  H2: Frequently Asked Questions
  H2: Specifications (via SpecSection)
    H3: Speed / Acceleration (SubSection)
    H3: Extruder / Hotend (SubSection)
  H2: Supported Materials (MaterialsTabContent SectionHeader)
    H3: Standard (category label)
    H3: Engineering (category label)
  H2: Pricing & Availability (PricingTabContent SectionHeader)
```

#### 3. Render All Tab Content in DOM (Crawlability)

**`src/pages/PrinterDetail.tsx` — Tab rendering (lines 824–1041):**

Change from conditional rendering to always-rendered with CSS visibility:

```tsx
{/* Tab Content — all panels rendered in DOM, active one shown */}
{/* Overview Tab */}
<div
  id="tabpanel-overview"
  role="tabpanel"
  hidden={activeTab !== "overview"}
  className={activeTab !== "overview" ? "sr-only" : ""}
>
  {/* ... overview content ... */}
</div>

{/* Specifications Tab */}
<div
  id="tabpanel-specifications"
  role="tabpanel"
  hidden={activeTab !== "specifications"}
  className={activeTab !== "specifications" ? "sr-only" : ""}
>
  <SpecificationsTabContent printer={printer} />
</div>

{/* Materials Tab */}
<div hidden={activeTab !== "materials"} className={activeTab !== "materials" ? "sr-only" : ""}>
  <MaterialsTabContent printer={printer} accessories={accessories || []} />
</div>
... etc
```

Using the HTML `hidden` attribute hides the content from visual users but it IS still in the DOM for crawlers. `sr-only` alternatively. We use `hidden` here since it's semantically correct for inactive tab panels and Googlebot reads hidden content.

**Important:** The `PrinterTabContent` component wraps the content — update it to NOT conditionally render children based on `activeTab`. Instead, the wrapper should always render and each panel decides its own visibility.

#### 4. Convert Tab Buttons to Links — `src/components/printer/PrinterTabNav.tsx`

**Current (lines 84–107):**
```tsx
<button
  key={tab.id}
  role="tab"
  ...
  onClick={() => handleTabClick(tab)}
>
```

**New:**
```tsx
<a
  key={tab.id}
  role="tab"
  href={tab.hash}
  aria-selected={activeTab === tab.id}
  onClick={(e) => {
    e.preventDefault();
    handleTabClick(tab);
  }}
  className={cn(...)}
>
```

This gives Googlebot real `href` links (`#overview`, `#specifications`, `#materials`, `#connectivity`, `#pricing`) to discover section anchors.

#### 5. Fix FAQPage Schema + All FAQs in DOM — `src/components/printer/FAQSection.tsx`

**Two changes:**

A) **Render ALL FAQs in DOM, use CSS for collapse, not JS conditional:**

Change `visibleFAQs` from a slice to the full `filteredFAQs`. The "Show more" button will scroll the section or be removed. Answers are ALWAYS in the DOM (currently they're in the DOM but hidden via `max-h-0 opacity-0` CSS — this is actually already accessible to crawlers!).

The real issue is `filteredFAQs.slice(0, 5)` which removes 15 items from the DOM entirely. Fix: render all but visually collapse extras with CSS.

B) **Add FAQPage JSON-LD** using `useJsonLd`:

```tsx
import { useJsonLd } from '@/components/seo/useJsonLd';

// In FAQSection component:
const faqs = generateFAQs(props);
useJsonLd({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      // Strip HTML tags for clean schema text
      text: faq.answer.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    },
  })),
});
```

#### 6. Fix Duplicate BreadcrumbList — `src/pages/PrinterDetail.tsx`

**Remove** lines 634–638 (the inline `BreadcrumbSchema` with 3 items).

**Keep** the `DetailBreadcrumb` component at line 674, but fix the brand href to link to the SEO category page instead of the query param:

```tsx
// Current (line 677):
{ label: printerBrand, href: `/printers?brand=${toBrandSlug(printerBrand)}` }

// New:
{ label: printerBrand, href: `/printers/brand/${toBrandSlug(printerBrand)}` }
```

This results in exactly ONE `BreadcrumbList` with the 4-item chain: Home → Printers → [Brand] → [Model].

#### 7. Enhance ProductJsonLd — `src/pages/PrinterDetail.tsx` + `ProductJsonLd.tsx`

**In `PrinterDetail.tsx`**, expand the `<ProductJsonLd>` call (lines 651–670) with additional props:

```tsx
<ProductJsonLd
  name={`${printerName} 3D Printer`}  {/* Include "3D Printer" in schema name */}
  description={seoDescription}
  image={seoImage}
  brand={printerBrand}
  sku={printer.printer_id}
  url={`https://filascope.com/printers/${printer.printer_id || printer.id}`}
  price={displayPrice}
  availability={!isDiscontinued}
  buildVolume={printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm ? {
    x: printer.build_volume_x_mm,
    y: printer.build_volume_y_mm,
    z: printer.build_volume_z_mm,
  } : null}
  maxPrintSpeed={printer.max_print_speed_mms}
  printerType={printer.printer_technology}
  nozzleTempMax={printer.max_nozzle_temp_c}
  bedTempMax={printer.bed_max_temp_c}
  // NEW props:
  printerWeightKg={(printer as any).machine_weight_kg}
  printerWidthMm={(printer as any).machine_width_mm}
  printerDepthMm={(printer as any).machine_depth_mm}
  printerHeightMm={(printer as any).machine_height_mm}
  hasEnclosure={printer.has_enclosure}
  hasWifi={printer.has_wifi}
  multiMaterialSupported={printer.multi_material_supported}
  multiMaterialMaxSpools={printer.multi_material_max_spools}
  extruderType={printer.extruder_type}
  directDrive={printer.direct_drive}
  autoBedLeveling={printer.auto_bed_leveling}
  inputShapingSupported={(printer as any).input_shaping_supported}
  supportedMaterials={printer.official_supported_materials}
  ratingValue={printer.rating_community_overall}
  ratingCount={printer.review_count_aggregated}
/>
```

**In `ProductJsonLd.tsx`**, add these new interface props and build the additional `additionalProperty` entries. Also add physical dimension fields to the top-level schema object using `Schema.org` standard:

```tsx
// New top-level fields in jsonLd:
...(printerWeightKg && {
  weight: { '@type': 'QuantitativeValue', value: printerWeightKg, unitCode: 'KGM' }
}),
...(printerWidthMm && {
  width: { '@type': 'QuantitativeValue', value: printerWidthMm, unitCode: 'MMT' }
}),
...(printerDepthMm && {
  depth: { '@type': 'QuantitativeValue', value: printerDepthMm, unitCode: 'MMT' }
}),
...(printerHeightMm && {
  height: { '@type': 'QuantitativeValue', value: printerHeightMm, unitCode: 'MMT' }
}),

// New additionalProperty entries:
if (hasEnclosure != null) additionalProperties.push({ '@type': 'PropertyValue', name: 'Enclosure', value: hasEnclosure ? 'Enclosed' : 'Open Frame' });
if (hasWifi != null) additionalProperties.push({ '@type': 'PropertyValue', name: 'Wi-Fi Connectivity', value: hasWifi ? 'Yes' : 'No' });
if (multiMaterialSupported) additionalProperties.push({ '@type': 'PropertyValue', name: 'Multi-Material Support', value: multiMaterialMaxSpools ? `Yes (${multiMaterialMaxSpools} colors)` : 'Yes' });
if (extruderType) additionalProperties.push({ '@type': 'PropertyValue', name: 'Extruder Type', value: extruderType });
if (directDrive != null) additionalProperties.push({ '@type': 'PropertyValue', name: 'Drive Type', value: directDrive ? 'Direct Drive' : 'Bowden' });
if (autoBedLeveling != null) additionalProperties.push({ '@type': 'PropertyValue', name: 'Auto Bed Leveling', value: autoBedLeveling ? 'Yes' : 'No' });
if (inputShapingSupported != null) additionalProperties.push({ '@type': 'PropertyValue', name: 'Input Shaping', value: inputShapingSupported ? 'Yes' : 'No' });
if (supportedMaterials) additionalProperties.push({ '@type': 'PropertyValue', name: 'Compatible Materials', value: supportedMaterials });
// isRelatedTo for compatible material types:
if (compatibleMaterials.length > 0) {
  jsonLd.isRelatedTo = compatibleMaterials.map(mat => ({
    '@type': 'Product',
    name: `${mat} Filament`,
    category: '3D Printer Filament',
    url: `https://filascope.com/materials/${mat.toLowerCase()}`,
  }));
}
```

#### 8. Optimize Meta Title and Description — `src/pages/PrinterDetail.tsx`

**Current title (via ProductSEO):** "Bambu Lab P1S | FilaScope" — 30 chars

**New template (lines 619–626):**

```tsx
// Build optimized SEO title — target 55-60 chars
const seoTitleBase = `${printerName} 3D Printer`;
const seoTitleFull = `${seoTitleBase} — Specs, Price & Filaments | FilaScope`;
const seoTitle = seoTitleFull.length <= 60 ? seoTitleFull
  : `${seoTitleBase} — Specs & Price | FilaScope`.length <= 60 ? `${seoTitleBase} — Specs & Price | FilaScope`
  : `${seoTitleBase} | FilaScope`;

// Build keyword-rich description
const materialList = printer.official_supported_materials 
  ? printer.official_supported_materials.split(',').slice(0, 5).map((m: string) => m.trim()).join(', ')
  : null;

const seoDescriptionParts = [
  `${printerName} 3D printer specs:`,
  buildVolumeDisplay ? ` ${buildVolumeDisplay} build volume,` : '',
  printer.max_print_speed_mms ? ` ${printer.max_print_speed_mms}mm/s max speed,` : '',
  printer.max_nozzle_temp_c ? ` ${printer.max_nozzle_temp_c}°C nozzle temp.` : '.',
  materialList ? ` Compatible with ${materialList}.` : '',
  ' Compare prices, view compatible filaments & detailed specifications on FilaScope.',
];
const seoDescription = seoDescriptionParts.join('').replace(/\s+/g, ' ').trim();
```

Pass `title={seoTitle}` to `ProductSEO` instead of `title={printerName}`.

#### 9. Fix 404 State — `src/pages/PrinterDetail.tsx`

**Current (lines 553–563):** Shows a bare "Printer not found" heading with no noindex.

**New:**
```tsx
if (!printer && !isLoading) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-8">
      <DocumentHead
        title="Printer Not Found | FilaScope"
        description="The printer you're looking for could not be found. Browse our database of 118+ 3D printers with detailed specs, pricing, and filament compatibility."
        noindex={true}
      />
      <div className="max-w-7xl mx-auto text-center pt-24">
        <h1 className="text-2xl font-bold mb-4">Printer Not Found</h1>
        <p className="text-muted-foreground mb-6">
          This printer doesn't exist in our database.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/printers"><Button>Browse All Printers</Button></Link>
          <Link to="/"><Button variant="outline">Search Filaments</Button></Link>
        </div>
      </div>
    </div>
  );
}
```

Check if `useDocumentHead` / `DocumentHead` supports a `noindex` prop — if not, add it. The `noindex` flag should inject `<meta name="robots" content="noindex,nofollow">`.

#### 10. Add "About This Printer" SEO Paragraph — `src/components/printer/PrinterHeroSection.tsx`

The `generatePrinterDescription()` function (line 142–147) already generates a description paragraph and displays it. This is good — it's the "About" content. However, it needs to be inside a proper `<section>` with `aria-label` and confirm it's keyword-rich. This is already implemented via `generatePrinterDescription` so verify it generates appropriate text.

#### 11. Add Material Internal Links — `src/components/printer/tabs/MaterialsTabContent.tsx`

**Material temperature hints (existing — lines 113–129)** render material names. Convert to `<Link>` or `<a>` tags:

```tsx
// Current: <span>{hint.material}</span>
// New:
<a href={`/materials/${hint.material.toLowerCase().replace('+', '-plus')}`}
   className="hover:text-primary hover:underline transition-colors"
   onClick={(e) => e.stopPropagation()}>
  {hint.material} ({hint.temp}°C)
</a>
```

**Material category badges** in `parseMaterials` results — wrap with links to material knowledge base:
```tsx
// Current badge:
<Badge>{mat}</Badge>
// New:
<Badge asChild>
  <a href={`/materials/${mat.toLowerCase().replace(/\+/g, '-plus').replace(/\s+/g, '-')}`}>
    {mat}
  </a>
</Badge>
```

#### 12. Fix UUID Links in Recently Viewed — `src/components/RecentlyViewedSection.tsx`

**Current (lines 43–45):**
```tsx
const href = isFilament
  ? `/filament/${item.product_id}`
  : `/printers/${item.product_id}`;
```

The `item.product_id` for printers is the UUID from browse history. Fix by using the `printer_id` slug if available:

```tsx
const href = isFilament
  ? `/filament/${item.product_id}`
  : `/printers/${item.printer?.printer_id || item.product_id}`;
```

Check the `BrowseHistoryItem` type to confirm `item.printer?.printer_id` is available — if not, add it to the query in `useBrowseHistory`.

#### 13. Fix Breadcrumb Brand URL — `src/pages/PrinterDetail.tsx`

**Current (line 677):**
```tsx
{ label: printerBrand, href: `/printers?brand=${toBrandSlug(printerBrand)}` }
```

**New:**
```tsx
{ label: printerBrand, href: `/printers/brand/${toBrandSlug(printerBrand)}` }
```

This ensures the breadcrumb link points to the new SEO category page created in the previous plan.

#### 14. Enhance Prerender Edge Function — `supabase/functions/prerender/index.ts`

**`printerPage()` function (lines 728–768):**

A) **H1 and title — add "3D Printer":**
```ts
// Current h1: full = "Bambu Lab P1S"
// New:
const h1 = `${full} 3D Printer`;
let title = `${full} 3D Printer — Specs, Price & Filaments | FilaScope`;
if (title.length > 60) title = `${full} 3D Printer — Specs & Price | FilaScope`;
if (title.length > 60) title = `${full} 3D Printer | FilaScope`;
if (title.length > 60) title = `${full} | FilaScope`;
```

B) **Expand the SELECT cols** to include more spec fields for richer Product schema:
```ts
const cols = `id, printer_id, model_name, display_name, brand_id, msrp_usd, 
  build_volume_x_mm, build_volume_y_mm, build_volume_z_mm,
  max_print_speed_mms, max_nozzle_temp_c, bed_max_temp_c,
  has_enclosure, has_wifi, multi_material_supported, multi_material_max_spools,
  official_supported_materials, printer_technology,
  machine_weight_kg, machine_width_mm, machine_depth_mm, machine_height_mm`;
```

C) **Build richer Product schema** in the prerender function to mirror the client-side schema.

D) **Better description template** matching the client's new template.

E) **Category page handling** — currently `/printers/enclosed` falls through `printerPage("enclosed")` and returns `fallback()`. Add detection for known category slugs to return a category listing page result instead:

```ts
const KNOWN_CATEGORIES = ["enclosed", "multi-color", "high-speed", "large-format", "corexy", "bed-slinger", "direct-drive", "under-300", "under-500", "under-1000"];

async function printerPage(slug: string, supabase: SupabaseClient): Promise<PageData> {
  // Check if it's a category slug first
  if (KNOWN_CATEGORIES.includes(slug)) {
    return await printerCategoryPage(slug, supabase);
  }
  // Check if it's a brand route: "brand/bambu-lab"
  const brandMatch = slug.match(/^brand\/(.+)$/);
  if (brandMatch) {
    return await printerBrandPage(brandMatch[1], supabase);
  }
  // ... rest of individual printer logic
}
```

F) **FAQPage schema in prerender** — add static FAQ Q&A pairs into the prerendered HTML for the printer page. Since the FAQs are dynamically generated on the client, add 5 generic static FAQ items in the prerender that will be replaced by the full 20-item client-side FAQPage schema when JS loads.

---

### What Will NOT Change

- Visual design of the printer detail page (all changes are semantic/structural)
- Pricing display logic, affiliate link structure, admin functionality
- The tab switching interactive behavior (SPA navigation via onClick)
- The `PrinterDetail.tsx` data fetching and all hooks
- The FAQSection visual design (accordion stays, just always-in-DOM)
- The `SimilarPrintersSection` or comparison functionality
- Any filament-side components

---

### Technical Considerations

**Tab content always-in-DOM performance:** Rendering all 4 tabs simultaneously means 4x the component tree. `SpecificationsTabContent` is compute-light (pure display). `MaterialsTabContent` is moderate. `ConnectivityTabContent` and `PricingTabContent` both call hooks (`useRegionalPriceV2`, etc.) — these will fire even for inactive tabs. Use `hidden` HTML attribute with `display:none` styling to prevent reflows.

**`sr-only` vs `hidden` for SEO:** Google crawls `display:none` content but may down-weight it. The `hidden` attribute (`display:none`) is acceptable for tab panels since this is a recognized UX pattern. Using `max-h-0 overflow-hidden` (already used in FAQSection for answers) is also crawlable. We'll use `hidden` attribute only for inactive tab panels to keep the pattern semantic and recognizable.

**Noindex prop on DocumentHead:** Check if `useDocumentHead` / the `DocumentHead` component already supports `noindex`. If not, add it by injecting `<meta name="robots" content="noindex,nofollow">` when the flag is true.

**BreadcrumbList deduplication:** After removing line 634–638's inline `BreadcrumbSchema`, there will be exactly one `BreadcrumbList` per printer page — injected by `DetailBreadcrumb`. The `useJsonLd` hook already handles cleanup on unmount.

**Prerender schema accuracy:** The prerender function serves static HTML. The FAQPage and expanded additionalProperty schemas it serves will be simpler than the full client-side version — this is acceptable since Google primarily uses the first-rendered content, and the client schema (via React hydration) will then be identical or richer.

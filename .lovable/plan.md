

## Create 5 New SEO Content Guide Pages

### Approach

The existing guide system is fully template-driven. Adding new guides requires **only one file change**: adding config entries to `src/components/guides/guideConfigs.ts`. The routing (`/guides/:slug`), template rendering (`BuyingGuideTemplate`), and SEO schemas (Article + FAQ + Breadcrumb) are already wired up.

### What Gets Created

| # | Slug | Title | Filter Strategy | Layout |
|---|------|-------|-----------------|--------|
| 1 | `best-filaments-for-hueforge-lithophanes` | Best Filaments for HueForge Lithophanes (2026) | `requireTD: true, sortBy: 'td', limit: 10` | ranked-list |
| 2 | `pla-plus-vs-pla-pro` | PLA+ vs PLA Pro: Which Should You Choose? | `materials: ['PLA+', 'PLA Pro'], limit: 10` | vs-comparison |
| 3 | `best-filament-for-bambu-lab-p1s` | Best Filaments for Bambu Lab P1S (2026) | `materials: ['PLA', 'PETG', 'ABS', 'TPU'], limit: 10` | ranked-list |
| 4 | `silk-pla-comparison` | Best Silk PLA Filaments Compared | `material: 'Silk PLA', limit: 10` | ranked-list |
| 5 | `asa-vs-abs-outdoor-printing` | ASA vs ABS: Which is Better for Outdoor Printing? | `materials: ['ASA', 'ABS'], limit: 10` | vs-comparison |

### Content for Each Guide

Each config entry includes:
- `seoTitle` and `seoDescription` (optimized, under 65/160 chars respectively)
- `editorialSections` with `position: 'before'` and `position: 'after'` containing the requested content sections as sanitized HTML
- `faqs` array with 3 questions each (renders FAQ accordion + FAQPage JSON-LD schema)
- `relatedSlugs` linking to other guides (renders "Related Guides" cards at the bottom)
- `keywords` array for meta keywords tag
- `publishedAt` and `updatedAt` set to `2026-02-14`

### What Already Works Automatically

Once configs are added, the template automatically provides:
- Article JSON-LD schema with author/publisher (via `ArticleSchema`)
- BreadcrumbList JSON-LD (Home > Guides > Guide Title)
- FAQPage JSON-LD (when FAQs are present)
- Quick Comparison Table at the top (for `ranked-list` layout)
- VS Comparison view (for `vs-comparison` layout)
- Product cards with scores, prices, and links to detail pages
- Related Guides section at the bottom
- Material Wizard CTA
- OG tags (title, description, type)

### File Changes

| File | Change |
|------|--------|
| `src/components/guides/guideConfigs.ts` | Add 5 new entries to `BUYING_GUIDE_CONFIGS` with full editorial content, FAQs, filters, and metadata |

### Cross-Linking Strategy

- **HueForge Lithophanes** guide links to existing `hueforge-filaments` guide, TD database page, and beginner's guide
- **PLA+ vs PLA Pro** links to `best-pla-filaments` and `beginners-guide`
- **Bambu Lab P1S** links to `best-pla-filaments`, `best-petg-filaments`, and `best-abs-filaments`
- **Silk PLA** links to `best-pla-filaments` and `pla-vs-petg`
- **ASA vs ABS** links to `best-abs-filaments` and `best-petg-filaments`

Existing guides' `relatedSlugs` arrays will also be updated where relevant to create bidirectional linking.

### Technical Notes

- The `useGuideFilaments` hook filters from the database using `ilike` material matching, so filters like `material: 'Silk PLA'` will match product titles/materials containing "Silk PLA"
- For PLA+ vs PLA Pro, the `materials` filter uses OR logic (`materials: ['PLA+', 'PLA Pro']`) which matches filaments with either material type
- The Bambu Lab P1S guide uses a broad multi-material filter since printer-specific compatibility data isn't directly queryable through the guide filter system -- editorial content handles the P1S-specific recommendations
- No new components, routes, or database changes needed




## Add Unique Meta Descriptions to All Page Types

Most pages already have Helmet tags with reasonably good titles and descriptions, but several can be improved to match the requested templates. One page (GuideDetail) is completely missing Helmet/SEO tags.

---

### Changes by Page

**1. Brands Listing (`src/pages/Brands.tsx`, lines 377-381)**

Current title: "Filament Brand Directory -- Trusted 3D Printing Brands | FilaScope"
Current description: Dynamic with count, already decent.

Update to match requested templates:
- Title: `"3D Filament Brands -- Compare {brandCount}+ Manufacturers | FilaScope"`
- Description: `"Compare {brandCount}+ 3D filament brands. Browse manufacturers like Bambu Lab, Polymaker, eSUN & more. Prices, material ranges, reviews & verified partner status."`
- Sync `og:title` with `<title>`

**2. Brand Detail (`src/components/seo/BrandSEO.tsx`)**

Already has good dynamic title/description logic. Minor improvement:
- Update the default description template to include price range if available from props. Currently builds descriptions from `productCount` and `materials` but doesn't include price range.
- Add `priceRange` as an optional prop (low/high string) and incorporate into the description template: `"Explore {count} {Brand} filaments across {materialCount} materials. Prices from {low}-{high}. Compare specs, check printer compatibility & find deals."`

**3. Printer Listing (`src/pages/Printers.tsx`, lines 641-644)**

Current title: "3D Printer Comparison -- Compare FDM & Resin Printers | FilaScope"
Current description: Dynamic with count.

Update:
- Title: `"3D Printer Database -- Specs, Filament Compatibility | FilaScope"`
- Description: `"Browse {count}+ 3D printers with detailed specs. Check filament compatibility, temperature ranges, build volumes & find the perfect printer for your materials."`
- Add `og:title` tag (currently only has `og:description`)

**4. Deals Page (`src/pages/Deals.tsx`, lines 169-174)**

Current title: "Today's Filament Deals -- Best Prices on 3D Printing Materials | FilaScope"
Current description: Already dynamic with deal count, discount %, brand count, and region.

Update title to include dynamic count:
- Title: `"3D Filament Deals & Discounts -- {totalDeals} Active Offers | FilaScope"`
- Description is already good, but refine to: `"Today's best 3D printer filament deals from {uniqueBrandCount}+ brands. PLA, PETG, ABS & specialty materials. Save up to {maxDiscount}%. Updated daily."`

**5. Learning Center (`src/pages/LearningCenter.tsx`, lines 289-294)**

Current title/description are already good and dynamic. Minor refinements:
- Title: `"3D Printing Guides & Tutorials -- Learn | FilaScope"`
- Description: `"Expert guides on 3D printing filaments. Material comparisons, buying guides, HueForge tutorials, troubleshooting tips & beginner resources. Free forever."`
- Keep the existing dynamic version as a comment for reference

**6. Compare Page (`src/pages/Compare.tsx`, lines 405-408)**

Current title: "Material Knowledge Base -- Filament Reference & Comparison | FilaScope"
Current description: Static, generic.

Update:
- Title: `"Compare 3D Filaments Side-by-Side | FilaScope"`
- Description: `"Compare 3D printer filaments side by side. Specs, prices, TD values, printer compatibility & material properties. Make data-driven filament choices."`
- Add `og:title` and `og:description` tags

**7. Color Finder (`src/pages/ColorFinder.tsx`, lines 64-67)**

Current title: "Find by Color | FilaScope"
Current description: Static but decent.

Update:
- Title: `"Find Filaments by Color -- Color Matching Tool | FilaScope"`
- Description: `"Match any color to real 3D printer filaments. Search by hex code, color name, or TD value. Perfect for HueForge lithophanes & color-matched prints."`
- Add `og:title` and `og:description` tags

**8. HueForge Finder (`src/pages/HueForgeFinder.tsx`, lines 135-143)**

Current title/description are already good and specific. Minor update:
- Title: `"HueForge Filament Finder -- TD Values & Color Match | FilaScope"`
- Description: Make dynamic with count: `"Find the best filaments for HueForge by TD value and color. The world's largest transmissivity database for lithophane printing. Search {count}+ filaments."`
- Add `og:title` and `og:description` tags

**9. Guide Detail (`src/pages/GuideDetail.tsx`)**

Currently has NO Helmet tags at all -- this is the biggest gap.

Add Helmet with:
- Title: `"{guide.title} | FilaScope"`
- Description: `guide.description` (truncated to 160 chars)
- `og:title`, `og:description`, `og:type` set to "article"
- Canonical URL: `https://filascope.com/learn/{slug}`
- Also import and add `ArticleSchema` component for JSON-LD structured data

---

### Technical Summary

```text
Files to modify (9 total):

1. src/pages/Brands.tsx          - Update title + description in Helmet (lines 377-381)
2. src/components/seo/BrandSEO.tsx - Minor description template improvement
3. src/pages/Printers.tsx        - Update title + description in Helmet (lines 641-644)
4. src/pages/Deals.tsx           - Update title to include dynamic count (lines 169-174)
5. src/pages/LearningCenter.tsx  - Refine title + description (lines 289-294)
6. src/pages/Compare.tsx         - Update title + description + add OG tags (lines 405-408)
7. src/pages/ColorFinder.tsx     - Update title + description + add OG tags (lines 64-67)
8. src/pages/HueForgeFinder.tsx  - Update title + make description dynamic (lines 135-143)
9. src/pages/GuideDetail.tsx     - Add Helmet + ArticleSchema (new, around line 200)

No new files created. No database changes needed.
All dynamic values (counts, prices) come from data already fetched by each page.
```

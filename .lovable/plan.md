

# Fix: Page-Specific SEO for Crawlers via Prerender Edge Function

## Problem

The CSR app (React Helmet) correctly renders page-specific titles in the browser. However, **Google crawlers** are served by the `prerender` edge function, which is missing route handlers for many pages. These pages fall through to the `fallback()` function, which returns a **404 "Page Not Found"** response to crawlers.

### Affected Routes (Missing from Prerender)

| Route | Current Crawler Response | Expected |
|---|---|---|
| `/color-finder` | 404 Page Not Found | Color Finder tool page |
| `/colors` | 404 Page Not Found | Color Finder (alias) |
| `/hueforge-td-database` | 404 Page Not Found | HueForge TD Database |
| `/hueforge-filaments` | 404 Page Not Found | HueForge Filament Finder |
| `/td-database` | 404 Page Not Found | TD Database |
| `/about` | 404 Page Not Found | About FilaScope |
| `/methodology` | 404 Page Not Found | Methodology |
| `/affiliate-disclosure` | 404 Page Not Found | Affiliate Disclosure |
| `/privacy` | 404 Page Not Found | Privacy Policy |
| `/terms` | 404 Page Not Found | Terms of Service |
| `/wizard` | 404 Page Not Found | Filament Wizard |
| `/diagnose` | 404 Page Not Found | Print Diagnose |
| `/accessories` | 404 Page Not Found | Accessories |
| `/brands/compare` | 404 Page Not Found | Brand Comparison |
| `/guides/print-settings` | 404 Page Not Found | Print Settings Guide |
| `/guides/troubleshooting` | 404 Page Not Found | Troubleshooting Guide |

### Routes That Work Correctly
`/`, `/filament/*`, `/brands/*`, `/brands`, `/printers/*`, `/printers`, `/deals`, `/guides/*` (6 known slugs), `/learn`, `/compare`

## Solution

### Step 1: Add Missing Route Handlers to Prerender Edge Function

Add static page handlers in `supabase/functions/prerender/index.ts` for all missing public-facing routes. Each handler returns proper `title`, `description`, `canonical`, `jsonLd`, and `breadcrumbs`.

New functions to add:
- `colorFinderPage()` -- handles `/color-finder` and `/colors`
- `hueforgeDbPage()` -- handles `/hueforge-td-database` and `/td-database`
- `hueforgeFinderPage()` -- handles `/hueforge-filaments`
- `aboutPage()` -- handles `/about`
- `methodologyPage()` -- handles `/methodology`
- `affiliateDisclosurePage()` -- handles `/affiliate-disclosure`
- `privacyPage()` -- handles `/privacy`
- `termsPage()` -- handles `/terms`
- `wizardPage()` -- handles `/wizard`
- `accessoriesPage()` -- handles `/accessories`
- `brandComparePage()` -- handles `/brands/compare`

### Step 2: Add Missing Guide Slugs to GUIDE_META

The `GUIDE_META` map in the prerender function is missing several guide slugs. Add entries for:
- `best-filaments-hueforge` (or the actual slug used in routes)
- `print-settings`
- `troubleshooting`
- `pla-plus-vs-pla-pro`
- `silk-pla-comparison`
- `best-filaments-for-hueforge-lithophanes`
- Any other guide slugs defined in `guideConfigs.ts`

### Step 3: Update Route Matching in `getPageData()`

Add route matching for all new pages before the `fallback()` call:

```text
getPageData() route matching order:
  /                        --> homepage()
  /filament/*              --> filamentPage()
  /brands/compare          --> brandComparePage()  [NEW - must be BEFORE /brands/:slug]
  /brands/*                --> brandPage()
  /brands                  --> brandsListing()
  /printers/*              --> printerPage()
  /printers                --> printersListing()
  /deals                   --> dealsPage()
  /guides/*                --> guidePage()
  /learn                   --> learnPage()
  /compare                 --> comparePage()
  /color-finder, /colors   --> colorFinderPage()   [NEW]
  /hueforge-td-database    --> hueforgeDbPage()    [NEW]
  /td-database             --> hueforgeDbPage()    [NEW]
  /hueforge-filaments      --> hueforgeFinderPage()[NEW]
  /about                   --> aboutPage()         [NEW]
  /methodology             --> methodologyPage()   [NEW]
  /affiliate-disclosure    --> affiliateDisclosurePage() [NEW]
  /privacy                 --> privacyPage()       [NEW]
  /terms                   --> termsPage()         [NEW]
  /wizard                  --> wizardPage()        [NEW]
  /accessories             --> accessoriesPage()   [NEW]
  /brands/compare          --> brandComparePage()  [NEW]
  *                        --> fallback() (404)
```

### Step 4: Add Missing Routes to Sitemap

Verify and add the new routes to the sitemap generation in the same edge function so crawlers can discover them.

### What This Does NOT Change
- No changes to React components or CSR Helmet tags (they already work correctly)
- No changes to `index.html` defaults
- No changes to `CanonicalLink` component
- The fix is entirely in the prerender edge function

### Impact
After this fix, every public page will return proper page-specific SEO metadata to crawlers instead of a 404 response. This is critical because Google indexes the prerender response, not the CSR JavaScript output.

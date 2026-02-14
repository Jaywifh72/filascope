

## Fix robots.txt Delivery and Dynamic Sitemap via Edge Functions

### Problem

1. `public/robots.txt` returns a 404 because the SPA's catch-all `<Route path="*">` serves the React NotFound page for all unmatched paths, including `/robots.txt`
2. The robots.txt references `sitemap.xml` which isn't accessible at the root domain
3. An existing `sitemap-xml` edge function generates a monolithic sitemap but isn't segmented and isn't discoverable

### Solution

Since the Lovable SPA hosting always serves `index.html` for unknown paths, static files like `robots.txt` cannot be served directly. The fix uses edge functions to serve both files, and updates the `prerender` function to also handle these special paths.

---

### Change 1: Extend `prerender` Edge Function to Serve robots.txt and sitemap.xml

**File**: `supabase/functions/prerender/index.ts`

Add handling at the top of the main request handler (before crawler detection) for two special paths:

- `?path=/robots.txt` -- Returns robots.txt content with `Content-Type: text/plain`
- `?path=/sitemap.xml` -- Returns the sitemap index XML
- `?path=/sitemap-pages.xml` -- Static pages sitemap
- `?path=/sitemap-filaments.xml` -- All filament URLs from database
- `?path=/sitemap-brands.xml` -- All brand URLs
- `?path=/sitemap-printers.xml` -- All printer URLs
- `?path=/sitemap-guides.xml` -- Guide URLs

These paths are served to ALL user agents (not just crawlers), since search engines and webmaster tools need direct access.

The sitemap logic reuses the existing patterns from the `sitemap-xml` function (batch queries, escapeXml, buildUrlEntry) but segments output into separate files per the sitemap index spec.

**robots.txt content** (served dynamically):
```
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /
Disallow: /admin
Disallow: /settings
Disallow: /maintenance
Disallow: /embed/
Crawl-delay: 1

Sitemap: https://filascope.com/sitemap.xml
```

**Sitemap index** at `/sitemap.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://filascope.com/sitemap-pages.xml</loc></sitemap>
  <sitemap><loc>https://filascope.com/sitemap-filaments.xml</loc></sitemap>
  <sitemap><loc>https://filascope.com/sitemap-brands.xml</loc></sitemap>
  <sitemap><loc>https://filascope.com/sitemap-printers.xml</loc></sitemap>
  <sitemap><loc>https://filascope.com/sitemap-guides.xml</loc></sitemap>
</sitemapindex>
```

Each sub-sitemap queries the database using the same batch pattern already in `sitemap-xml/index.ts`.

---

### Change 2: Update BASE_URL in prerender function

The current `prerender/index.ts` uses `BASE_URL = "https://filascope.lovable.app"` (line 21). This needs to be updated to `"https://filascope.com"` to match the production domain used in robots.txt and sitemaps.

---

### Change 3: No React Router Changes Needed

Since robots.txt and sitemap.xml are served via the prerender edge function (which is called by the external proxy/CDN layer that routes crawler traffic), no changes to `App.tsx` routes are needed. The proxy layer that forwards crawler requests to the prerender function will also forward `/robots.txt` and `/sitemap.xml` requests.

---

### Technical Details

```text
Files to modify:
  1. supabase/functions/prerender/index.ts
     - Fix BASE_URL from lovable.app to filascope.com
     - Add robots.txt handler (returns text/plain, served to all user agents)
     - Add sitemap index handler (returns application/xml)
     - Add 5 sub-sitemap handlers (pages, filaments, brands, printers, guides)
     - Sitemap handlers query database using batch pattern from sitemap-xml function
     - All sitemap responses cached: max-age=3600, s-maxage=86400
     - robots.txt cached: max-age=86400

No other files need changes. The existing sitemap-xml edge function remains
as-is (it still works independently if called directly).
```

### How It Works End-to-End

The external proxy (Cloudflare Worker or similar) that routes traffic to FilaScope will:
1. Check if path is `/robots.txt` or `/sitemap*.xml` -- forward to prerender edge function with `?path=/robots.txt`
2. Check if user agent is a crawler -- forward to prerender edge function with `?path=/the/page`
3. Otherwise -- serve the normal SPA

The prerender function handles all three cases: static SEO files, crawler HTML, and redirects for regular users.


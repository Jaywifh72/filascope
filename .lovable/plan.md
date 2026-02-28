

# Dynamic Sitemap System via _redirects Routing

## Summary
The dynamic sitemap system already exists and is fully implemented inside the `prerender` Edge Function (already deployed). It includes paginated DB queries for filaments (1,000+ rows), brands, printers, colors, and static/guide pages. The only missing piece is routing -- the `_redirects` file needs to send sitemap XML requests to the `prerender` function instead of serving the static fallback or the SPA.

## What Already Works (No Changes Needed)
The `prerender` function (lines 375-436) already handles:
- `/sitemap.xml` -- sitemap index referencing 6 sub-sitemaps
- `/sitemap-pages.xml` -- ~40 static/core pages
- `/sitemap-filaments.xml` -- all filaments with paginated queries (bypasses 1,000 row limit)
- `/sitemap-brands.xml` -- all visible brands with pagination
- `/sitemap-printers.xml` -- all printers with pagination
- `/sitemap-guides.xml` -- all guide pages with dates
- `/sitemap-colors.xml` -- all color family pages

All use proper `Content-Type: application/xml` and `Cache-Control` headers.

## Changes Required

### 1. Update `public/_redirects`
Add rewrite rules for all 7 sitemap paths, pointing them to the `prerender` Edge Function. These must appear BEFORE the SPA catch-all.

```text
# Sitemaps — served by prerender edge function
/sitemap.xml https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/prerender?path=/sitemap.xml 200
/sitemap-pages.xml https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/prerender?path=/sitemap-pages.xml 200
/sitemap-filaments.xml https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/prerender?path=/sitemap-filaments.xml 200
/sitemap-brands.xml https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/prerender?path=/sitemap-brands.xml 200
/sitemap-printers.xml https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/prerender?path=/sitemap-printers.xml 200
/sitemap-guides.xml https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/prerender?path=/sitemap-guides.xml 200
/sitemap-colors.xml https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/prerender?path=/sitemap-colors.xml 200

# SPA catch-all — MUST be last
/* /index.html 200
```

Using `200` (rewrite) instead of `302` (redirect) ensures Google sees `filascope.com/sitemap.xml` as the canonical URL, not the Edge Function URL.

### 2. Keep static `public/sitemap.xml` as fallback
The static file remains in the repo. The `_redirects` rewrite rule takes priority over static files, so crawlers get the dynamic version. If the Edge Function ever goes down, removing the redirect rule restores the static fallback.

### What Will NOT Change
- The `prerender` Edge Function code (already deployed and working)
- The `sitemap-xml` and `sitemap-generator` functions (kept as-is, not used by redirects)
- Static fallback files (`public/robots.txt`, `public/sitemap.xml`, `public/llms.txt`)
- No other pages or components

## Expected Result
After this change, visiting `https://filascope.com/sitemap.xml` will return a dynamic sitemap index, and each sub-sitemap will contain all URLs from the database -- approximately 1,300+ total URLs across all sub-sitemaps.


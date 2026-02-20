
## Root Cause

The `public/_redirects` file has two problems that together cause `filascope.com/sitemap.xml` to serve the React SPA 404 page instead of XML:

1. **Missing SPA catch-all rule.** The file contains only sitemap redirect rules with no `/* /index.html 200` at the bottom. On Cloudflare Pages (which Lovable uses), when a redirect rule silently fails, there is no fallback — the request falls through to Cloudflare's native 404, which the PWA service worker then intercepts and renders as the React app's 404 component.

2. **`301` status is not supported for cross-origin redirects on this host.** Cloudflare Pages `_redirects` only supports `301`/`302` for same-origin redirects. For external URLs (like `cfqfavmhdbyjzejipiwa.supabase.co`), the redirect must use `302`. The previous comment in `_redirects` even says "200 proxy rewrites are not supported on this host" — but `301` to external URLs is also silently ignored.

**Confirmed working:** `robots.txt` is ✅ fine — it's served directly from the `public/robots.txt` static file on the CDN before `_redirects` is consulted. The edge function itself is ✅ confirmed working and returns correct XML with `Content-Type: application/xml`.

---

## Fix: One File Change to `public/_redirects`

**Change `301` to `302` on all 7 sitemap redirect lines, and add the `/* /index.html 200` SPA catch-all at the end.**

```text
# Sitemap routes — 302 redirect to edge function
# (Cloudflare Pages does not support 301 for cross-origin external URLs)
/sitemap.xml           https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/prerender?path=/sitemap.xml           302
/sitemap-pages.xml     https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/prerender?path=/sitemap-pages.xml     302
/sitemap-filaments.xml https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/prerender?path=/sitemap-filaments.xml 302
/sitemap-brands.xml    https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/prerender?path=/sitemap-brands.xml    302
/sitemap-printers.xml  https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/prerender?path=/sitemap-printers.xml  302
/sitemap-guides.xml    https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/prerender?path=/sitemap-guides.xml    302
/sitemap-colors.xml    https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/prerender?path=/sitemap-colors.xml    302

# SPA catch-all — MUST be last
/* /index.html 200
```

---

## Why `302` Works for Google

Google Search Console and Google's crawler **follow 302 redirects**. The `sitemap.xml` will redirect to the Supabase edge function URL, which returns valid `application/xml`. Google will index the final XML content correctly. The sub-sitemaps already use `filascope.com` domain `<loc>` entries (confirmed via live edge function call), so Google's same-domain requirement is satisfied.

---

## No Other Changes Required

- `public/robots.txt` — ✅ Already correct, already live
- `supabase/functions/prerender/index.ts` — ✅ Already returns `Content-Type: application/xml` for sitemaps and `text/plain` for robots.txt
- `supabase/functions/sitemap-xml/index.ts` — ✅ Already uses `filascope.com` domain `<loc>` entries
- No database changes needed

---

## Technical Notes

- The `/* /index.html 200` rule is the standard Cloudflare Pages SPA catch-all. Its absence is the secondary bug — it means the SPA itself only loads because the PWA service worker intercepts unmatched routes, but direct navigation to `/sitemap.xml` on a cold load (no SW installed yet) would 404 natively anyway.
- `200` proxy rewrites to external URLs are not supported by Cloudflare Pages `_redirects` — only same-origin rewrites work with `200`. Since the edge function is on a different domain, `302` is the only option.
- Both Googlebot and Bingbot follow `302` redirects for sitemaps submitted via Search Console.


# Emergency Sitemap Fix — Minimal, Surgical Changes

## Root Cause Confirmed

Live testing the existing `sitemap-xml` edge function confirms:

```
HTTP/1.1 200 OK
Content-Type: application/xml; charset=utf-8
```

The edge function is already deployed, working perfectly, and serves 4,700+ URLs as valid XML without any JavaScript. **This is Option B — already built.**

The only problem is `robots.txt` tells Google/Bing to look at `https://filascope.com/sitemap.xml`, which hits the Lovable SPA and requires JavaScript to resolve. Sitemap crawlers never execute JavaScript — so they see a blank HTML page and report "Couldn't fetch."

## Exactly Two Files Change

### 1. `public/robots.txt` — Update Sitemap directive

**Before:**
```
Sitemap: https://filascope.com/sitemap.xml
```

**After:**
```
Sitemap: https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/sitemap-xml
```

This URL returns HTTP 200 + `application/xml` with no JavaScript involved. Verified live.

### 2. `public/_redirects` — Delete this file

The `_redirects` format is Netlify/Cloudflare-specific and has no effect on Lovable's hosting. Keeping it gives a false sense of security and the `/sitemap.xml` SPA fallback rule at the bottom may actually interfere. It should be removed.

## What Does NOT Change

- The `sitemap-xml` edge function (`supabase/functions/sitemap-xml/index.ts`) — already correct, already deployed, already serving valid XML
- `index.html` — the client-side JS redirect was already removed in the last fix
- Any database schema or migrations

## After Deploying

Submit the new sitemap URL directly to search consoles:

- **Google Search Console** → Sitemaps → Add: `https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/sitemap-xml`
- **Bing Webmaster Tools** → Sitemaps → Add same URL

You can verify immediately with:
```
curl -I https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/sitemap-xml
```
Expected: `HTTP/1.1 200 OK` + `Content-Type: application/xml`

## Technical Summary

```text
Before:
robots.txt → https://filascope.com/sitemap.xml
                      ↓
              Lovable SPA (needs JS) ← crawlers stop here

After:
robots.txt → https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/sitemap-xml
                      ↓
              Edge Function → HTTP 200 + application/xml ← crawlers succeed
```

The edge function is already live. This is a one-line fix in `robots.txt`.

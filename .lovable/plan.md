
# Root Cause: CONFIRMED AND FINAL

## What is actually happening (verified by live tests 2026-02-20)

Lovable's hosting platform generates `/robots.txt` at the **infrastructure/CDN level** — it is hardcoded and served before any static file in `public/` is considered.

**Proof:**
- `https://filascope.com/robots.txt` → Returns Lovable's default (`Googlebot`, `Bingbot` etc.) — NOT our `public/robots.txt`
- `https://filascope.lovable.app/robots.txt` → Same Lovable default  
- `https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/serve-robots` → Returns our correct content ✅
- `https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/prerender?path=/robots.txt` → Returns our correct content ✅

**What Lovable's default robots.txt contains (currently served live):**
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
Sitemap: https://filascope.com/sitemap.xml
```

## What does NOT work

| Approach | Why it fails |
|---|---|
| `public/robots.txt` | Lovable CDN ignores it — serves its own hardcoded version |
| `_redirects` 302 | Redirect fires AFTER CDN serves robots.txt — CDN intercepts first |
| `_worker.js` robots handler | Cloudflare Workers feature — not supported on Lovable hosting |
| `serve-robots` edge function | Only works when called directly, nothing routes to it on Lovable |

## Attempted fix: `_redirects` 200 proxy rewrite

Updated `_redirects` to use `200` status (transparent proxy rewrite) instead of `302`:
```
/robots.txt  https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/prerender?path=/robots.txt  200
```

This may work if Lovable's hosting layer processes `_redirects` before the CDN-level robots.txt override. Requires publish to test.

## Is the current situation actually a problem?

The Lovable default robots.txt has `User-agent: * Allow: /` which ALREADY allows all bots including AI bots. 
The only thing missing is the explicit per-bot directives (GPTBot, ClaudeBot etc.) and `Crawl-delay`.
Search engines and AI crawlers will still crawl the site correctly.

## Permanent fix options

1. **Contact Lovable support** — request ability to override `/robots.txt` via `public/robots.txt`
2. **Move to Cloudflare Pages hosting** — where `_worker.js` and `_redirects` work natively
3. **Accept current state** — `User-agent: * Allow: /` covers all bots, site is fully crawlable



# Fix: robots.txt and sitemap.xml Returning React 404 on Production

## Problem

Lovable hosting serves `index.html` for ALL routes (SPA catch-all), so requests to `filascope.com/robots.txt` and `filascope.com/sitemap.xml` return the React app which renders a 404 page. Google cannot read the robots.txt or discover the sitemap at the canonical URLs.

The prerender edge function already handles both correctly when called with `?path=/robots.txt` or `?path=/sitemap.xml`, but direct URL requests never reach it.

## Solution

A two-part fix that ensures both human and crawler access works:

### Part 1: Early redirect in index.html (before React loads)

Add a small inline script at the top of `<body>` in `index.html` that detects `/robots.txt`, `/sitemap.xml`, and `/sitemap-*.xml` URLs and redirects the browser to the prerender edge function. This runs before React or any JS bundle loads, so it's near-instant.

```text
if pathname is /robots.txt or /sitemap*.xml:
  redirect (301) to prerender edge function with ?path= parameter
```

This handles:
- Google/Bing crawlers hitting the canonical URL directly
- Webmaster tools checking robots.txt at the standard location
- Any sitemap validator checking sitemap.xml

### Part 2: Update robots.txt Sitemap directive

The `public/robots.txt` Sitemap directive currently points to the old `sitemap-xml` edge function. Update the prerender's `ROBOTS_TXT` constant to use the canonical URL (`https://filascope.com/sitemap.xml`) since the redirect from Part 1 will handle routing it to the edge function. This gives Google the clean canonical sitemap URL.

Also update the `public/robots.txt` file's Sitemap line to match (even though it won't be served directly, keeping it consistent avoids confusion).

### Part 3: Add sitemap discovery link to index.html head

Add a `<link rel="sitemap">` tag pointing to the canonical sitemap URL as a secondary discovery mechanism:
```
<link rel="sitemap" type="application/xml" href="https://filascope.com/sitemap.xml" />
```

## Technical Details

### Files to modify

1. **index.html** -- Add redirect script at top of `<body>` (before gtag), add `<link rel="sitemap">` to `<head>`
2. **supabase/functions/prerender/index.ts** -- Update `ROBOTS_TXT` Sitemap line to use canonical URL
3. **public/robots.txt** -- Update Sitemap line to canonical URL for consistency

### Redirect script (index.html)

```javascript
(function() {
  var p = window.location.pathname;
  if (p === '/robots.txt' || /^\/sitemap(-[\w-]+)?\.xml$/.test(p)) {
    window.location.replace(
      'https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/prerender?path=' +
      encodeURIComponent(p)
    );
  }
})();
```

This is a ~200 byte inline script that executes before any other JS. The redirect happens instantly with no visible flash.

### Why not other approaches

- **Vite build plugin**: Lovable hosting's SPA catch-all overrides static files in `dist/`, so even if robots.txt is in `dist/`, it won't be served.
- **React Router routes**: Cannot set Content-Type headers from a browser SPA. The response would still be `text/html`.
- **_redirects / netlify.toml**: Lovable hosting doesn't support these configuration files.


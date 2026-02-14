

# Fix: HreflangTags Not Rendering

## Root Cause

`react-helmet-async` deduplicates `<link>` tags using the `rel` + `href` combination as a unique key. Both hreflang tags share `rel="alternate"` and the same `href` value -- only `hrefLang` differs. Helmet treats them as duplicates and only keeps one (or drops both due to conflicting `hrefLang` values).

## Solution

Replace the Helmet-based approach with a direct DOM manipulation approach using `useEffect`. This bypasses Helmet's deduplication entirely and guarantees both tags appear in `<head>`.

## Technical Changes

### File: `src/components/seo/HreflangTags.tsx`

Rewrite to use `useEffect` instead of Helmet:

```typescript
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const EXCLUDED_PREFIXES = ['/admin', '/settings', '/auth', '/maintenance', '/old-admin'];
const BASE_URL = 'https://filascope.com';

export const HreflangTags = () => {
  const { pathname } = useLocation();
  const isExcluded = EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));
  const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  const href = `${BASE_URL}${cleanPath}`;

  useEffect(() => {
    if (isExcluded) return;

    const langs = [
      { hreflang: 'en', href },
      { hreflang: 'x-default', href },
    ];

    const elements = langs.map(({ hreflang, href }) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = hreflang;
      link.href = href;
      link.setAttribute('data-hreflang', 'true');
      document.head.appendChild(link);
      return link;
    });

    return () => {
      elements.forEach((el) => el.remove());
    };
  }, [href, isExcluded]);

  return null;
};
```

Key points:
- Tags are created directly in `document.head`, bypassing Helmet deduplication
- Cleanup function removes old tags on route change before inserting new ones
- `data-hreflang="true"` attribute added for easy identification/debugging
- No other files need changes -- the import/render in App.tsx line 184 stays the same

### Verification

After the fix, every public page will have these two tags in `<head>`:
- `<link rel="alternate" hreflang="en" href="https://filascope.com{path}" />`
- `<link rel="alternate" hreflang="x-default" href="https://filascope.com{path}" />`


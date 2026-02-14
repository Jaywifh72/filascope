

# Update index.html Verification Tags and Preconnect Hints

## Changes Required

### File: `index.html`

**1. Update placeholder text for verification meta tags (lines 7-8)**

Change:
```html
<meta name="google-site-verification" content="VERIFICATION_CODE_HERE" />
<meta name="msvalidate.01" content="BING_VERIFICATION_CODE_HERE" />
```
To:
```html
<meta name="google-site-verification" content="REPLACE_WITH_GOOGLE_CODE" />
<meta name="msvalidate.01" content="REPLACE_WITH_BING_CODE" />
```

**2. Add missing preconnect for images.unsplash.com (after line 54)**

Insert before the DNS prefetch comment block:
```html
<link rel="preconnect" href="https://images.unsplash.com" crossorigin />
```

**Already present (no changes needed):**
- `theme-color` meta tag
- `apple-mobile-web-app-title` meta tag
- Preconnect to `cdn.shopify.com`

Only `index.html` is modified. No React component changes.

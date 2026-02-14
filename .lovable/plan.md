

## Fix Homepage SEO Issues

### 1. H1 Missing Space Fix (HeroSection.tsx)

The H1 uses two `display: block` `<span>` elements. While they render on separate lines visually, crawlers and assistive technology concatenate inner text as "FIND YOUR PERFECTFILAMENT." -- missing the space. Fix by adding a space character or changing the text.

**File**: `src/components/HeroSection.tsx` (lines 239-248)
- Change to a single `<h1>` with proper spacing: "Find Your Perfect 3D Printing Filament"
- Or keep the current uppercase design but add an explicit space: put a space character after "PERFECT" or before "FILAMENT"

**Approach**: Keep the visual design (two-line uppercase) but ensure concatenated text reads correctly. Add a trailing space to the first span's text content.

### 2. Duplicate H2 Fix (Finder.tsx)

Two identical `<h2>Browse All Filaments</h2>` render on the homepage:
- Line 982 in Finder.tsx (bridge section)  
- Line 41 in ResultsHeader.tsx (catalog header)

**File**: `src/pages/Finder.tsx` (lines 980-987)
- Change the bridge section H2 to a different heading, e.g., "Explore the Filament Catalog" or remove it entirely since ResultsHeader already provides the H2 with count information

### 3. Title Priority (Already Working)

The Finder.tsx Helmet already sets `<title>FilaScope -- Compare 3D Printer Filaments, Specs & Prices</title>`. React Helmet overrides the index.html default title at runtime. This should already work for browser users visiting the SPA. If crawlers see the wrong title, it is because they are not executing JavaScript -- the prerender edge function handles that case separately.

No code change needed for the title.

### 4. Schemas (Already Working)

`WebSiteSchema` and `OrganizationSchema` are already rendered in Finder.tsx (lines 952-953). These generate JSON-LD script tags via Helmet. They work for browser users. Crawlers that don't execute JS rely on the prerender function.

No code change needed.

### 5. Canonical (Already Working)

The `CanonicalLink` component in App.tsx renders on every route including `/`, producing `https://filascope.com/`. 

No code change needed.

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/components/HeroSection.tsx` | Add space after "PERFECT" in the H1 to fix concatenated text |
| `src/pages/Finder.tsx` | Change or remove the duplicate "Browse All Filaments" H2 in the bridge section (lines 980-987) |

### Technical Notes

- The title, schemas, and canonical issues the user sees on the live site are caused by the latest code not being published to production yet, not by bugs in the code. Once published, browser visitors will see all the correct metadata.
- For crawlers that do not execute JavaScript, the prerender edge function must be routing correctly (separate concern from this fix).

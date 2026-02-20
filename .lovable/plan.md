
## Add Homepage FAQ Section with FAQPage JSON-LD Schema

### What We're Doing

Adding a visible "Frequently Asked Questions" accordion section between the existing `HomeSEOContent` ("What is FilaScope?" / "Popular Searches") block and the footer. The `FAQSchema` component will automatically inject the corresponding `FAQPage` JSON-LD `<script>` tag into `<head>` via the existing `useJsonLd` hook — no manual script tag needed.

### Current Homepage Bottom Structure

```text
<Finder.tsx>
  ...
  <MobileQuickMatchPrompt />
  <ScrollToTopButton />
  <HomeSEOContent />        ← "What is FilaScope?" + "Popular Searches"
</Finder.tsx>
<SiteFooter />              ← rendered in App.tsx
```

### Target Structure After Change

```text
<Finder.tsx>
  ...
  <MobileQuickMatchPrompt />
  <ScrollToTopButton />
  <HomeSEOContent />        ← unchanged
  <HomeFAQSection />        ← NEW: FAQ accordion + FAQPage schema
</Finder.tsx>
<SiteFooter />
```

---

### Technical Plan

#### File 1: `src/components/HomeFAQSection.tsx` (NEW)

Create a new self-contained component that:

- Defines the 8 FAQ items as a static array
- Renders a `<section>` wrapper with `max-w-7xl mx-auto` layout (matching `HomeSEOContent`)
- Uses `border-t border-border/50` to match the existing separator style
- Renders `<FAQSection>` from `src/components/seo/FAQSection.tsx` — this automatically:
  - Renders the `<h2>Frequently Asked Questions</h2>` heading
  - Renders the shadcn/ui `Accordion` with all 8 items
  - Renders `<FAQSchema>` which injects the `FAQPage` JSON-LD via `useJsonLd`

The 8 FAQs:
1. What is FilaScope?
2. What is HueForge Transmissivity Distance (TD)?
3. How does FilaScope track filament prices?
4. What filament types does FilaScope cover?
5. How do I find the best filament for my 3D printer?
6. What makes FilaScope different from other filament databases?
7. Is FilaScope free to use?
8. How often is FilaScope data updated?

```tsx
import { FAQSection } from '@/components/seo/FAQSection';

const HOME_FAQS = [
  { question: "What is FilaScope?", answer: "FilaScope is..." },
  // ...all 8 pairs
];

export function HomeFAQSection() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <FAQSection
        faqs={HOME_FAQS}
        className="border-border/50"  // match existing section border opacity
      />
    </div>
  );
}
```

#### File 2: `src/pages/Finder.tsx` (EDIT — 1 line change)

Add the import and render `<HomeFAQSection />` directly after `<HomeSEOContent />`:

```tsx
// Before (line 1648):
<HomeSEOContent />

// After:
<HomeSEOContent />
<HomeFAQSection />
```

---

### Why This Approach

- **Reuses existing components**: `FAQSection` and `FAQSchema` are already used on brand, filament, and guide pages — no new accordion or schema logic needed
- **JSON-LD is automatic**: `FAQSchema` uses `useJsonLd` which injects `<script type="application/ld+json">` directly into `<head>` without going through react-helmet (avoiding deduplication issues)
- **Zero styling changes**: The `FAQSection` component uses the site's existing dark-theme-compatible classes (`bg-card`, `border-border`, `text-muted-foreground`)
- **No changes to hero, catalog, trending, or feature cards**: Only the bottom of `Finder.tsx` is touched (one new element)

### Files to Edit

| File | Change |
|---|---|
| `src/components/HomeFAQSection.tsx` | CREATE — new component with 8 FAQs |
| `src/pages/Finder.tsx` | ADD — import + render `<HomeFAQSection />` after `<HomeSEOContent />` |

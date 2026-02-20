
# Enhance /about as a Comprehensive AI Entity Page

## What Changes

The existing `/about` page is rebuilt in-place using a new, dedicated `AboutPage` component that replaces the generic `LegalPageLayout` shell. The `OrganizationSchema` call is enhanced with additional fields (`slogan`, richer `knowsAbout`, `numberOfEmployees`). A `FAQSchema` is added for the about-page FAQs. No new routes are created.

---

## Section Layout (final DOM order)

```text
<h1> About FilaScope
─────────────────────────────────────
[ Entity Summary Block ]   ← data-ai-summary="true"
─────────────────────────────────────
<h2> What FilaScope Does
<h2> Our Data
<h2> HueForge TD Database
<h2> FilaScore Methodology
<h2> How We Collect Data
<h2> Frequently Asked Questions
     └─ Accordion FAQs (4 items)
─────────────────────────────────────
Back to FilaScope link
```

---

## Files to Change

### 1. `src/pages/About.tsx` — Full rewrite

The entire page is rebuilt in this single file. It imports `FAQSchema` and `OrganizationSchema` from the existing SEO barrel and uses `Accordion` from shadcn/ui for the FAQ section (same pattern as `FAQSection.tsx`).

**Entity Summary Block** — rendered immediately after the H1, before any H2:

```tsx
<div
  data-ai-summary="true"
  role="region"
  aria-label="FilaScope entity summary"
  className="rounded-lg border border-border bg-card/60 border-l-2 border-l-primary overflow-hidden mb-8"
>
  <div className="pl-4 pr-5 py-4">
    <p className="text-sm text-muted-foreground leading-relaxed">
      FilaScope is the world's most comprehensive 3D printer filament comparison
      platform. It indexes over 1,078 filaments from 48+ manufacturers with
      real-time pricing from 15+ retailers across 6 countries. FilaScope
      maintains the internet's largest verified HueForge Transmissivity Distance
      (TD) database.
    </p>
  </div>
</div>
```

This uses the identical left-accent-stripe card pattern from `AiSnippetZone.tsx` so it is visually consistent across the site.

**About FAQs (4 items):**

| # | Question | Answer |
|---|---|---|
| 1 | What is FilaScope? | FilaScope is a free 3D printer filament database and comparison tool... |
| 2 | Is FilaScope free to use? | Yes — FilaScope is completely free... |
| 3 | How often is pricing data updated? | Prices are checked regularly through automated scraping... |
| 4 | What is the HueForge TD database? | HueForge Transmissivity Distance (TD) is a value that describes how light travels through a filament... |
| 5 | What is the FilaScore? | FilaScore is FilaScope's own 0–10 rating that weighs price, documentation completeness, material quality... |

FAQs render as an `<Accordion>` (same style as `FAQSection.tsx`) and the `<FAQSchema>` component emits the `FAQPage` JSON-LD block automatically.

---

### 2. `src/components/seo/OrganizationSchema.tsx` — Add `slogan` prop support

The component accepts but does not currently output a `slogan` field. One line is added to the `useJsonLd` call:

```ts
...(slogan && { slogan }),
```

And the interface and destructuring are updated to include:

```ts
slogan?: string;
```

No other changes to this file.

---

### 3. `src/pages/About.tsx` — Enhanced `OrganizationSchema` call

The existing `OrganizationSchema` usage is updated with:

- `slogan="The 3D filament comparison engine for makers worldwide"`
- `numberOfEmployees={5}` (small team)
- Expanded `knowsAbout` array (20+ topics):

```ts
knowsAbout={[
  '3D printing filament',
  'HueForge transmissivity data',
  'HueForge TD values',
  'filament comparison',
  'lithophane printing',
  '3D printer compatibility',
  'filament pricing',
  'PLA filament',
  'PETG filament',
  'ABS filament',
  'TPU filament',
  'ASA filament',
  'Nylon filament',
  'multi-color 3D printing',
  'filament database',
  'print temperature settings',
  'spool weight comparison',
  'regional filament pricing',
  'FDM 3D printing materials',
  'FilaScore rating methodology',
]}
```

- Updated `description` to match the entity summary text exactly (so schema description = visible text = AI-extractable text — all three are identical, which is the strongest possible entity signal).

---

## What Does NOT Change

- `LegalPageLayout`, `LegalSection`, `LegalList` — untouched (still used by Privacy, Terms, etc.)
- All existing routes and navigation
- `FAQSchema`, `OrganizationSchema` component logic — only `slogan` prop is added to `OrganizationSchema`
- Any existing schema markup on other pages

---

## Technical Notes

- `FAQSchema` is already exported from `src/components/seo/index.ts` — no barrel changes needed.
- The `data-ai-summary="true"` attribute is consistent with `AISummaryBlock` (filament pages) and `AiSnippetZone` (guide pages), making the selector uniform across all three page types.
- Using `LegalPageLayout` is abandoned for this page only because it doesn't support injecting content between the H1 and the first H2 section — the entity block must come immediately after the H1. The page is rebuilt directly with the same Tailwind classes (`max-w-3xl mx-auto px-4`, `bg-gradient-to-b from-primary/5`, etc.) so the visual result is identical to the current layout.
- The `FAQSchema` component uses `useJsonLd` (direct DOM injection), so it coexists with the `OrganizationSchema` JSON-LD without Helmet deduplication issues.

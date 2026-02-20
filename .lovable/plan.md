
# Add AiSnippetZone to Guide Pages

## What Gets Added

A new "Quick Answer" block rendered between the guide subtitle and the Table of Contents on every guide page. It only appears when the guide config provides snippet data — all existing guides without snippet data are unaffected.

---

## Layout Position

```text
H1 title
subtitle (description paragraph)
──────────────────────────────────  ← INSERT HERE
[ Quick Answer block ]
──────────────────────────────────
[ In This Guide TOC ]
editorial sections / product list
FAQs / Related Guides
```

---

## Files to Create / Modify

### 1. `src/components/guides/AiSnippetZone.tsx` — New component

**Props interface:**
```ts
interface PickItem {
  name: string;
  brand: string;
  reason: string;
}

interface AiSnippetZoneProps {
  summaryText: string;
  topPick: PickItem;
  runnerUp: PickItem;
  budgetPick?: PickItem;
}
```

**Rendered structure:**
```
<div role="region" aria-label="Quick answer summary">
  <div [card container]>
    <header>
      <Zap icon />  "Quick Answer"  label
    </header>
    <p>{summaryText}</p>
    <ul>
      <li>🏆 Our top pick: <strong>name</strong> by <em>brand</em> — reason</li>
      <li>🥈 Runner-up: <strong>name</strong> by <em>brand</em> — reason</li>
      <li>💰 Budget pick: ... (conditional)</li>
    </ul>
  </div>
</div>
```

**Styling:** Uses the site's existing dark card pattern — `bg-card/60 border-border` with a cyan `border-l-2 border-l-primary` left accent stripe. Label uses `text-primary text-xs font-semibold uppercase tracking-wider`. Pick labels use distinct colored icon glyphs (gold/silver/green) rendered as `<span aria-hidden>` so screen readers skip the decorative emoji.

**Semantic HTML:** `<p>` for the summary, `<ul>/<li>` for the picks list, `<strong>` for product names, `<em>` for brand names. The outer wrapper carries `role="region"` and `aria-label="Quick answer summary"`.

### 2. `src/components/guides/guideConfigs.ts` — Extend `GuideConfig` interface

Add an optional `aiSnippet` field to the `GuideConfig` interface:
```ts
export interface AiSnippetData {
  summaryText: string;
  topPick: { name: string; brand: string; reason: string };
  runnerUp: { name: string; brand: string; reason: string };
  budgetPick?: { name: string; brand: string; reason: string };
}

export interface GuideConfig {
  // ... existing fields ...
  aiSnippet?: AiSnippetData;  // ← new optional field
}
```

Then add `aiSnippet` data to two representative guides (`best-pla-filaments` and `best-petg-filaments`) as examples. All other guides remain untouched and will simply not render the block.

**Example data for `best-pla-filaments`:**
```ts
aiSnippet: {
  summaryText: "PLA is the best filament for most beginners and casual users in 2026 — it's easy to print, low-odor, and available from dozens of reliable brands. Our top picks are ranked using FilaScope's data-driven scoring across quality, pricing, and documentation.",
  topPick: { name: "PolySonic PLA Pro", brand: "Polymaker", reason: "fastest print speed support with excellent surface quality" },
  runnerUp: { name: "PLA Basic", brand: "Bambu Lab", reason: "best consistency spool-to-spool at a competitive price" },
  budgetPick: { name: "PLA Filament", brand: "Hatchbox", reason: "proven reliability at under $20/kg" },
}
```

### 3. `src/components/guides/BuyingGuideTemplate.tsx` — Render the block

**Import** the new component:
```ts
import { AiSnippetZone } from './AiSnippetZone';
```

**Insert** between the closing `</p>` of the subtitle (line 187) and the `{/* Table of Contents */}` block (line 190), inside the hero `<div>`:

```tsx
{/* AI Snippet Zone — only if guide config provides snippet data */}
{config.aiSnippet && (
  <AiSnippetZone
    summaryText={config.aiSnippet.summaryText}
    topPick={config.aiSnippet.topPick}
    runnerUp={config.aiSnippet.runnerUp}
    budgetPick={config.aiSnippet.budgetPick}
  />
)}
```

This goes **after** the closing `</div>` of the hero block (line 188) and **before** the TOC `<nav>` (line 192), so it sits between the subtitle and the TOC — exactly as specified.

---

## What Does NOT Change

- Existing `GuideConfig` data for all guides (no existing guide has `aiSnippet` today — only the two example guides will get populated snippet data)
- The TOC structure, editorial sections, product lists, FAQ sections, related guides, or CTA
- All existing schema markup (Article, Breadcrumb, FAQ, ItemList schemas)
- Any other page or component

---

## Technical Notes

- `aiSnippet` is `optional` (`?`) on `GuideConfig`, so TypeScript enforces that all existing guide objects remain valid without it.
- The render is a simple conditional `{config.aiSnippet && <AiSnippetZone ... />}` — zero runtime cost for guides without snippet data.
- No new dependencies — uses only existing `lucide-react` icons and Tailwind classes already in the project.
- The `role="region"` + `aria-label` satisfies WCAG 2.1 landmark requirements for assistive technologies.
- The `data-ai-summary` attribute pattern used in `AISummaryBlock` on filament detail pages can optionally be added to the container for consistency with the AI crawler strategy documented in the memory notes.

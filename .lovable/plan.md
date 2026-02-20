
# Add "Related Questions" Expandable Section to Guide Pages

## Overview

This adds a `RelatedQuestionsSection` component that renders between the existing FAQ section and the Related Guides section on every guide page. It emits a **second, separate `FAQPage` JSON-LD block** (using the existing `useJsonLd` hook via direct DOM injection — no Helmet deduplication issues). The data model gets a new optional `relatedQuestions` field on `GuideConfig`, and three guides are seeded with sample data.

---

## Files to Create / Modify

### 1. NEW: `src/components/seo/RelatedQuestionsSection.tsx`

A self-contained component that:
- Accepts `questions: { question: string; answer: string }[]`
- Renders an `<Accordion>` (identical style to `FAQSection.tsx` — `border border-border rounded-lg px-4 bg-card`)
- Injects a second `FAQPage` JSON-LD block using the existing `useJsonLd` hook directly (not via `FAQSchema` — keeping schema injection isolated)
- Gracefully returns `null` when the array is empty or absent

```tsx
// src/components/seo/RelatedQuestionsSection.tsx
import { useJsonLd } from './useJsonLd';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

interface RelatedQuestion { question: string; answer: string; }

interface RelatedQuestionsSectionProps {
  questions: RelatedQuestion[];
  title?: string;
  className?: string;
}

export function RelatedQuestionsSection({ questions, title = 'People Also Ask', className }: RelatedQuestionsSectionProps) {
  // Second FAQPage schema block — distinct from the main FAQ schema,
  // injected directly into <head> by useJsonLd (bypasses Helmet deduplication)
  useJsonLd(
    questions?.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: questions.map(q => ({
            '@type': 'Question',
            name: q.question,
            acceptedAnswer: { '@type': 'Answer', text: q.answer },
          })),
        }
      : null,
  );

  if (!questions?.length) return null;

  return (
    <section className={cn('mt-12 border-t border-border pt-8', className)}>
      <h2 className="text-xl font-semibold mb-6">{title}</h2>
      <Accordion type="single" collapsible className="space-y-2">
        {questions.map((q, i) => (
          <AccordionItem
            key={i}
            value={`rq-${i}`}
            className="border border-border rounded-lg px-4 bg-card"
          >
            <AccordionTrigger className="text-left font-medium py-4 hover:no-underline">
              {q.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
              {q.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
```

The `value` prefix is `rq-` (vs `faq-` in `FAQSection`) to prevent any Radix accordion key collisions if both sections are ever rendered in the same Accordion group.

---

### 2. MODIFY: `src/components/seo/index.ts`

Add the new export at the bottom of the barrel file:

```ts
export { RelatedQuestionsSection } from './RelatedQuestionsSection';
```

---

### 3. MODIFY: `src/components/guides/guideConfigs.ts`

**a) Extend the `GuideConfig` interface** — add one optional field after `aiSnippet`:

```ts
export interface GuideConfig {
  // ... existing fields ...
  aiSnippet?: AiSnippetData;
  relatedQuestions?: FAQItem[];   // ← new optional field
}
```

`FAQItem` is already defined in this file (`{ question: string; answer: string }`), so no new type is needed.

**b) Seed `relatedQuestions` on three guides** — chosen because they have the highest long-tail query volume:

**`best-pla-filaments`** — 4 questions:
1. "What PLA filament has the best surface finish?" → Polymaker PolySonic / eSUN PLA+ recommendation
2. "Is 1kg enough PLA for a beginner?" → typical usage guidance
3. "What is the difference between PLA and PLA+?" → PLA+ modifier explanation
4. "Do I need a heated bed for PLA?" → no/optional, 50–60 °C recommendation

**`pla-vs-petg`** — 4 questions:
1. "Can I print PETG on a Creality Ender 3?" → yes with heated bed note
2. "Does PETG stick to a PEI sheet?" → yes, use textured plate
3. "Which is better for miniatures, PLA or PETG?" → PLA for detail
4. "Does PETG yellow over time?" → UV resistance note

**`beginners-guide`** — 4 questions:
1. "How long does a 1kg spool last?" → estimate for typical prints
2. "What happens if I print at the wrong temperature?" → under/over temp effects
3. "Can I mix filament brands?" → yes with same material type caveat
4. "What is nozzle clogging and how do I prevent it?" → brief preventive advice

---

### 4. MODIFY: `src/components/guides/BuyingGuideTemplate.tsx`

Three targeted changes:

**a) Add import** at the top (alongside the existing `FAQSchema` import):
```tsx
import { RelatedQuestionsSection } from '@/components/seo/RelatedQuestionsSection';
```

**b) Add ToC entry** in the `tocItems` array (line ~112), after the FAQ entry:
```ts
...(config.relatedQuestions?.length
  ? [{ label: 'People Also Ask', anchor: 'related-questions' }]
  : []),
```

**c) Add the section** in the JSX, between the FAQ block and the Related Filaments block (between lines ~300 and ~302):
```tsx
{/* Related Questions — People Also Ask */}
{config.relatedQuestions && config.relatedQuestions.length > 0 && (
  <section id="related-questions" className="mb-12 scroll-mt-24">
    <RelatedQuestionsSection
      questions={config.relatedQuestions}
      title="People Also Ask"
    />
  </section>
)}
```

The `RelatedQuestionsSection` already has its own `<section>` wrapper with border/padding internally, but wrapping it in a `<section id="...">` here keeps it consistent with the existing pattern used by all other sections in the template (id for anchor + scroll-mt-24).

> **Note:** The existing FAQ section in `BuyingGuideTemplate.tsx` uses plain `Card` components (not `FAQSection` from `seo/`), so `FAQSchema` for the main FAQs is already injected separately via the `{config.faqs.length > 0 && <FAQSchema faqs={config.faqs} />}` line at the top of the component (line 129). The new `RelatedQuestionsSection` injects its own independent `FAQPage` block, so both coexist safely.

---

## Visual Position in the Page

```text
FAQ Section            ← unchanged (Card-based, no accordion)
─────────────────────────────────────
Related Questions      ← NEW (accordion, "People Also Ask" H2)
  ↳ FAQPage JSON-LD #2 injected into <head>
─────────────────────────────────────
Related Filaments      ← unchanged
Related Guides         ← unchanged
CTA                    ← unchanged
```

---

## Technical Notes

- `useJsonLd` uses direct DOM injection (`document.head.appendChild`) and is **not** subject to Helmet deduplication. Two `<script type="application/ld+json">` tags with `@type: FAQPage` coexist cleanly — Google explicitly supports multiple `FAQPage` blocks on a single URL.
- The component is `null`-safe: if a guide config has no `relatedQuestions` field (i.e., undefined), both the section and the schema are silently omitted.
- Accordion `value` keys use the `rq-` prefix to avoid any string collision with the existing `faq-` keys in `FAQSection` if both are ever composed into a shared Accordion root.
- The ToC entry is only added when `relatedQuestions` is non-empty, keeping the ToC clean for guides without this data.
- No changes to `FAQSection.tsx`, `FAQSchema.tsx`, or any existing schema component.

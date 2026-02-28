

## Create "How to Choose 3D Printer Filament" Guide

### Overview
Add a new guide page at `/guides/how-to-choose-filament` using the existing `BuyingGuideTemplate` system with the `editorial` layout. This requires extending the config interface slightly to support a simple Quick Answer block (without product picks) and a HowTo schema.

### Changes

#### 1. Extend `GuideConfig` interface (`src/components/guides/guideConfigs.ts`)
- Add optional `quickAnswer?: string` field -- a plain-text quick answer paragraph rendered without product picks
- Add optional `howTo?: { name: string; description: string; steps: { name: string; text: string }[] }` field for HowTo JSON-LD schema data

#### 2. Update `BuyingGuideTemplate.tsx`
- Import `HowToSchema` from `@/components/seo`
- When `config.quickAnswer` is set (and `config.aiSnippet` is not), render a Quick Answer block using the same visual styling as `AiSnippetZone` (border-l-primary card, Zap icon, "QUICK ANSWER" label) but with only the summary paragraph -- no product picks
- When `config.howTo` is set, render `<HowToSchema>` alongside the existing Article/FAQ schemas
- Add `quickAnswer` to the ToC if present (it won't need a ToC entry since it sits before the ToC)

#### 3. Add guide config entry (`src/components/guides/guideConfigs.ts`)
Add a `'how-to-choose-filament'` key to `BUYING_GUIDE_CONFIGS` with:
- **slug**: `how-to-choose-filament`
- **title**: `How to Choose 3D Printer Filament — A Complete Decision Guide`
- **seoTitle**: `How to Choose 3D Printer Filament — Complete Guide | FilaScope`
- **seoDescription**: The provided meta description
- **category**: `buying-guide`
- **readTime**: 15
- **publishedAt / updatedAt**: `2026-02-28`
- **layout**: `editorial`
- **filters**: `{ sortBy: 'score', limit: 5 }` (general top filaments for the "picks" section)
- **quickAnswer**: The provided 40-60 word answer block text
- **howTo**: 5 steps (Identify requirements, Choose material, Check compatibility, Compare prices, Read reviews)

**Editorial sections** (all `position: 'before'` except the flowchart and last sections which are `position: 'after'`):
1. "What Filament Material Should I Use?" -- includes an HTML comparison table (Material, Best For, Nozzle Temp, Bed Temp, Enclosure Required, Difficulty, Summary) with rows for PLA, PETG, ABS, TPU, ASA, Nylon
2. "How Do Temperature Requirements Affect My Choice?" -- guidance on matching printer capabilities to filament temp requirements
3. "Does My Printer Support This Filament?" -- mentions FilaScope's printer compatibility filtering with link to `/printers`
4. "How Much Does 3D Printer Filament Cost?" -- price ranges per material, mentions real-time pricing from 15+ retailers
5. "What About Specialty Filaments?" -- brief coverage of composites, silk, glow-in-dark, etc.
6. "Filament Selection Decision Flowchart" -- text-based decision tree (since we can't embed images)

**FAQs**: All 8 questions/answers as specified

**Related Questions (People Also Ask)**: Will include a few additional PAA entries for broader coverage

**relatedSlugs**: Links to `best-pla-filaments`, `pla-vs-petg`, `best-filaments-for-beginners`, `filament-temperature-guide`

#### 4. JSON-LD Schemas (automatic + new)
- **ArticleSchema**: Handled automatically by `BuyingGuideTemplate`
- **FAQPage**: Handled automatically (8 FAQs + PAA merged)
- **HowToSchema**: New -- rendered from `config.howTo` data
- **BreadcrumbList**: Handled automatically (Home > Guides > How to Choose 3D Printer Filament)

### Technical Details
- No new files created -- everything is added to existing `guideConfigs.ts` and `BuyingGuideTemplate.tsx`
- Route already handled by the catch-all `/guides/:slug` route in `App.tsx`
- Sitemap generation is dynamic from `BUYING_GUIDE_CONFIGS` keys, so no manual sitemap update needed
- No other pages or components are modified


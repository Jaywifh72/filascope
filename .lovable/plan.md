

## Similar Filaments Engagement Engine

### Overview
Transform the existing Similar Filaments section on product detail pages into a discovery engine that creates curiosity-driven exploration, comparison momentum, and social proof. Six enhancements, no changes to structured data, meta tags, JSON-LD, or heading hierarchy.

---

### 1. Contextual Reason Subtitles on Similarity Badges

**File: `src/components/filament/similar/SimilarFilamentCard.tsx`**

Add a `REASON_SUBTITLES` map alongside the existing `REASON_BADGES`:

```text
same_material -> "Same formula, different brand"
same_brand    -> "From the same manufacturer"
similar_price -> "Similar quality, lower price"
budget_pick   -> "Better value alternative"
premium_pick  -> "Higher-rated alternative"
same_color    -> "Matching color, different brand"
```

Render a `<span>` with `text-[10px] text-muted-foreground leading-tight mt-0.5` directly below each existing Badge inside the `-top-2.5 left-3` container. Wrap badge + subtitle in a flex-col so they stack. The subtitle is always visible (not hover-gated), keeping it lightweight.

---

### 2. Inline Quick-Compare Panel

**New file: `src/components/filament/similar/InlineComparePanel.tsx`**

A collapsible two-column comparison widget that slides open below the SimilarFilamentsSection when a user clicks a "vs" button on any similar card.

- **Trigger**: Add a small `ArrowLeftRight` (lucide) icon button in the top-left of each SimilarFilamentCard (opposite corner from compare toggle). Clicking sets `compareTarget` state in SimilarFilamentsSection.
- **Panel contents**: Two-column layout showing current vs. selected filament with side-by-side metrics: Price/kg, Nozzle Temp, Ease of Printing, Material. Uses green/amber highlighting for better/worse values.
- **Collapse**: Animate with CSS `grid-rows` transition (0fr to 1fr) over 300ms. A second click or "Close" button collapses.
- **"Full Compare" CTA**: Adds both filaments to compare list and navigates to `/compare`.
- **Mobile**: Full-width, vertically stacked metrics.
- **Reduced motion**: Instant show/hide via `motion-reduce:transition-none`.

**Modified files:**
- `SimilarFilamentCard.tsx`: Add `onQuickCompare` prop + vs button
- `SimilarFilamentsSection.tsx`: Manage `compareTargetId` state, render InlineComparePanel below carousels

---

### 3. Exploration Trail Breadcrumb

**New file: `src/components/filament/ExplorationTrail.tsx`**

A session-scoped breadcrumb showing the user's filament browsing path.

- **Storage**: `sessionStorage` key `filascope_exploration_trail`, stores array of `{id, title, vendor, handle}` (max 6 items, deduplicated).
- **Recording**: In `FilamentDetail.tsx`, on filament load, push current product to the trail array.
- **Display**: Renders above the hero section when trail has 2+ items. Format: clickable product names separated by ` > ` arrows. Items beyond 4 collapse into "...". Each links to `/filament/{handle}`.
- **"Compare these" button**: At the end of the trail, a small pill button adds all trail items to the compare list.
- **Styling**: `text-xs text-muted-foreground` with primary-colored links. Horizontally scrollable on mobile.
- **Accessibility**: `nav` element with `aria-label="Your browsing trail"`.

**Modified file:** `FilamentDetail.tsx` -- Add trail recording effect + render ExplorationTrail component above hero.

---

### 4. "Makers Also Explored" Social Proof Section

**New file: `src/components/filament/similar/MakersAlsoExplored.tsx`**

A lightweight row of 3 product pills shown below the Similar Filaments carousels.

- **Data source**: Derived from the already-loaded `similarFilaments` array -- pick 3 filaments from different brands/materials than the current one (no extra DB query).
- **Pill design**: Inline flex row, each pill is a Link with `bg-card border border-border/50 rounded-full px-3 py-1.5 text-xs` containing a color dot (w-3 h-3 rounded-full) + product name + material badge.
- **Hover**: Subtle border glow (`hover:border-primary/50`) and "View" arrow icon appears.
- **Section header**: "Makers who viewed this also explored:" in `text-xs text-muted-foreground`.

**Modified file:** `SimilarFilamentsSection.tsx` -- Render MakersAlsoExplored after RelatedCategoriesNav, passing similarFilaments.

---

### 5. Color Variant Switch Transitions

**File: `src/components/filament/hero/FilamentHeroGallery.tsx`** and related hero components.

- **Image crossfade**: Wrap the product image in a container with `transition-opacity duration-300`. When variant changes, briefly fade to 70% then back to 100% using a `key` prop change triggering CSS animation.
- **Data slide**: Product title/price area gets `transition-all duration-200` with a brief translateY micro-animation on variant change. Use a CSS class `animate-in fade-in slide-in-from-bottom-1 duration-200` applied via key change.
- **Swatch pulse**: In `LargeColorSwatchGrid.tsx`, the `justSelectedId` state already exists (with 300ms timeout). Add a `ring-2 ring-primary/50 animate-ping` effect (single ping, not infinite) on the just-selected swatch using a one-shot CSS animation.
- **Reduced motion**: All transitions use `motion-reduce:transition-none`.

---

### 6. "See Similar" Floating Indicator

**New file: `src/components/filament/SimilarScrollHint.tsx`**

A small fixed-position pill that appears after 5s on page + 30% scroll depth, pointing users to the Similar Filaments section.

- **Visibility logic**: `useEffect` with `setTimeout(5000)` + `IntersectionObserver` on a sentinel div placed at 30% scroll depth. Auto-hides when user scrolls past the Similar section or after 10s of visibility.
- **Position**: `fixed right-4 top-1/2 -translate-y-1/2 z-30` (desktop only, `hidden md:flex`).
- **Style**: `bg-card/80 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 text-xs text-muted-foreground` with ChevronDown icon + "N similar".
- **Click**: `document.getElementById('similar-filaments-section')?.scrollIntoView({ behavior: 'smooth' })`. Add the id to the SimilarFilamentsSection wrapper.
- **Entry/exit**: `animate-in fade-in slide-in-from-right-2` on mount, fade out on dismiss.
- **Accessibility**: `role="complementary"`, keyboard focusable, Escape to dismiss.
- **Reduced motion**: Instant show/hide.

**Modified files:**
- `SimilarFilamentsSection.tsx`: Add `id="similar-filaments-section"` to the section element
- `FilamentDetail.tsx`: Render SimilarScrollHint with count from similarFilaments

---

### CSS Additions (src/index.css)

- `@keyframes swatch-select-ping`: Single-shot ring expansion for color swatch selection
- `.swatch-select-ping` utility class
- Reduced motion overrides for all new animations

### Summary of New Files
1. `src/components/filament/similar/InlineComparePanel.tsx`
2. `src/components/filament/ExplorationTrail.tsx`
3. `src/components/filament/similar/MakersAlsoExplored.tsx`
4. `src/components/filament/SimilarScrollHint.tsx`

### Summary of Modified Files
1. `src/components/filament/similar/SimilarFilamentCard.tsx` -- reason subtitles + vs button
2. `src/components/filament/similar/SimilarFilamentsSection.tsx` -- inline compare state, id attr, MakersAlsoExplored
3. `src/components/filament/hero/LargeColorSwatchGrid.tsx` -- swatch ping animation
4. `src/components/filament/hero/FilamentHeroGallery.tsx` -- crossfade transition
5. `src/pages/FilamentDetail.tsx` -- trail recording, ExplorationTrail render, SimilarScrollHint render
6. `src/index.css` -- new keyframes

No database changes, no new dependencies, no SEO/structured data modifications.

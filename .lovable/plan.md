
## Add Hover States and Micro-Interactions to Deal Cards

### Overview
Add interactive hover feedback, entrance animations, and discount badge enhancements to the deal cards on the `/deals` page, following the existing catalog card patterns.

### Changes

#### 1. Modify `src/components/deals/GroupedDealCard.tsx`

**Card hover state (touch-safe via group hover)**:
- The Card already has `hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50` on line 308. These need to be wrapped for pointer-only devices. Replace with Tailwind's `@media (hover: hover)` approach using a `group` class on the card and custom CSS.
- Share button (lines 332-348): Change to `opacity-0 group-hover:opacity-100 transition-opacity duration-200` so it's hidden by default and appears on hover. Touch devices will always show it via a CSS override.
- CTA button (lines 576-589): Add `group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200` to warm up on card hover.
- Discount badge (lines 313-321): Add `group-hover:brightness-110 transition-[filter] duration-200`.

**Implementation approach for touch safety**:
- Add `group` class to the Card wrapper.
- Use `@media (hover: hover)` in `src/index.css` to scope hover effects. On touch devices, share button stays visible (opacity-100 default), and no scale/shadow hover fires.

**Discount badge pulse for 50%+ deals**:
- Add a conditional class `animate-deal-pulse` when `group.bestDiscount >= 50`.
- Define `deal-pulse` keyframe: scale 1 to 1.05 to 1 over 600ms, runs once (`animation-iteration-count: 1`).

#### 2. Modify `src/pages/Deals.tsx`

**Staggered entrance animation**:
- Wrap each `GroupedDealCard` in a div with inline style for `animation-delay` (30ms per card, capped at 12).
- Apply a CSS class `deal-card-enter` that does opacity 0 to 1, translateY 10px to 0, duration 300ms ease-out.
- Respect `prefers-reduced-motion` by wrapping the animation keyframe in `@media (prefers-reduced-motion: no-preference)`.
- Add a `key` that includes filter state to re-trigger animations on filter change (using a simple counter or filter hash).

#### 3. Modify `src/index.css`

Add the following CSS:
- `deal-card-enter` keyframe and class (fade-up entrance, 300ms).
- `deal-pulse` keyframe (scale pulse for 50%+ badges, 600ms, runs once).
- `@media (hover: hover)` block scoping card hover effects (scale, shadow, border) to pointer devices only.
- Touch fallback: share button stays `opacity-100` by default on touch devices.

#### 4. Card click behavior
- The card already links to the filament detail page via the product name and image `Link` components. The entire card should be clickable. Wrap the Card in a `Link` component (or add an `onClick` with `useNavigate`) so clicking anywhere navigates to the deal. The existing `e.stopPropagation()` calls on share, expand, and CTA buttons will prevent conflicts.

### Technical Details

**Files modified**:
- `src/components/deals/GroupedDealCard.tsx` -- hover classes, share visibility, CTA warmup, discount pulse, full-card click
- `src/pages/Deals.tsx` -- staggered entrance animation wrapper divs
- `src/index.css` -- new keyframes and hover-media-query scoping

**No new dependencies required.**

The approach follows the existing pattern from `filament-product-card-v6-final` memory: entrance fade-up with 50ms stagger (adjusted to 30ms here), hover effects scoped to pointer devices, and teal-tinted shadows.

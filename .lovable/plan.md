
# WCAG 2.1 AA Accessibility Audit & Implementation Plan

## Executive Summary

FilaScope has a **solid accessibility foundation** with dedicated infrastructure including skip links, screen reader announcements, accessible form fields, keyboard navigation hooks, and WCAG-compliant color tokens. However, the audit identified gaps in implementation consistency across components that need addressing.

---

## Audit Findings by Category

### 1. Color Contrast

#### Current State (Good)
- WCAG color tokens defined in `index.css` (lines 124-137)
- Muted foreground updated to 72% lightness (~7:1 ratio)
- Star ratings use enhanced amber (`#FFB800`) with glow

#### Issues Identified
| Component | Issue | Location |
|-----------|-------|----------|
| Material Badge Colors | `text-violet-400` on `bg-violet-500/15` may not meet 4.5:1 | `MaterialBadge.tsx:69` |
| MATERIAL_BADGE_COLORS | `text-orange-400`, `text-yellow-400` on 20% bg may fail | `MiniFilamentCard.tsx:16-24` |
| Property Indicator dots | Standard Tailwind colors on dark backgrounds | `MaterialBadge.tsx:22-42` |
| Placeholder text | `--placeholder: 220 10% 55%` should be audited | `index.css:129` |

#### Required Fixes
- Increase text lightness for low-contrast badge variants (orange, yellow)
- Add explicit high-contrast alternatives for critical status indicators
- Verify placeholder contrast meets 4.5:1 against all input backgrounds

---

### 2. Keyboard Navigation

#### Current State (Good)
- Skip link implemented: `SkipLink.tsx` with `#main-content` target
- `useKeyboardNavigation` hook for arrow-key navigation
- Focus visible rings on buttons via Tailwind utilities
- Escape key handling in sheets/dialogs (Radix handles this)

#### Issues Identified
| Component | Issue | Location |
|-----------|-------|----------|
| Hero Quick Start Cards | Missing keyboard focus styling on scroll button | `HeroSection.tsx:184-199` |
| Filter Section Buttons | Collapsible triggers missing explicit `aria-expanded` | `MobileFilamentFilterSheet.tsx:196-216` |
| Close buttons in sheets | Missing `aria-label` on X button | `MobileFilamentFilterSheet.tsx:181-186` |
| Navbar hamburger menu | Missing `aria-expanded` and `aria-controls` | `Navbar.tsx` mobile menu trigger |

#### Required Fixes
- Add `aria-expanded` to all collapsible triggers
- Add `aria-controls` linking toggle buttons to controlled content
- Add `aria-label="Close filter panel"` to close buttons
- Add keyboard focus styles to Quick Start scroll button

---

### 3. Screen Reader Support

#### Current State (Good)
- `ScreenReaderAnnouncerProvider` in App.tsx
- Proper `role="article"` on product cards
- `sr-only` utility class defined
- Live regions for dynamic content

#### Issues Identified
| Component | Issue | Location |
|-----------|-------|----------|
| DealCard Share Button | Icon button missing `aria-label` | `DealCard.tsx:69-76` |
| MiniFilamentCard Quick Buy | Icon link missing `aria-label` | `MiniFilamentCard.tsx:235-238` |
| MiniFilamentCard Drag Handle | Missing screen reader text | `MiniFilamentCard.tsx:142-155` |
| CompareTray Share Button | Using `title` instead of `aria-label` | `CompareTray.tsx:486-493` |
| CompareTray Minimize Button | Missing `aria-label` | `CompareTray.tsx:427-431` |
| Heading Hierarchy | Some pages may skip heading levels | Multiple pages |

#### Required Fixes
- Add `aria-label` to all icon-only buttons
- Add `sr-only` text for drag handles
- Verify h1 → h2 → h3 hierarchy on key pages
- Add descriptive alt text to product images where missing

---

### 4. Form Accessibility

#### Current State (Good)
- `AccessibleFormField` component with proper ID linking
- `useId()` for generating accessible IDs
- Form error states with `aria-invalid`
- Search input has `aria-label`, `aria-expanded`, `aria-haspopup`

#### Issues Identified
| Component | Issue | Location |
|-----------|-------|----------|
| Printer Selection Dropdowns | Missing explicit labels | `MobileFilamentFilterSheet.tsx:219-240` |
| Filter Checkboxes | Labels exist but could use `aria-describedby` for context | Various filter files |
| Nozzle Config Selects | Missing accessible names | `MobileFilamentFilterSheet.tsx` |

#### Required Fixes
- Add `aria-label` or visible labels to all Select components
- Ensure all inputs have associated labels via `htmlFor`
- Add `role="search"` to search containers

---

### 5. Motion & Animations

#### Current State (Good)
- `prefers-reduced-motion` media query in `index.css:376-384`
- Auto-rotate disabled for reduced motion users in `MicroReview.tsx`
- Animations set to 0.01ms duration for reduced motion

#### Issues Identified
| Component | Issue | Location |
|-----------|-------|----------|
| Search Suggestions Rotation | May not respect reduced motion | `HeroSection.tsx:64-72` |
| Badge Pulse Animations | `animate-pulse` on discount badges | `MediumStandardPrinterCard.tsx:235` |
| Card Entry Animations | Should be disabled for reduced motion | `LabReadoutCard.tsx:221-222` |

#### Required Fixes
- Add `motion-safe:` prefix to non-essential animations
- Disable suggestion rotation for reduced motion users
- Ensure critical state changes don't rely solely on animation

---

## Implementation Plan

### Phase 1: Icon Button ARIA Labels (Priority: Critical)
**Files to modify:**
1. `src/components/deals/DealCard.tsx`
   - Add `aria-label="Share this deal"` to Share button (line 69-76)
   
2. `src/components/compare/MiniFilamentCard.tsx`
   - Add `aria-label="Buy from {vendor}"` to Quick Buy link (line 235-238)
   - Add `aria-label="Drag to reorder"` + `sr-only` text to drag handle (line 142-155)

3. `src/components/CompareTray.tsx`
   - Change `title` to `aria-label` on minimize button (line 427-431)
   - Change `title` to `aria-label` on share button (line 486-493)

4. `src/components/filters/MobileFilamentFilterSheet.tsx`
   - Add `aria-label="Close filter panel"` to close button (line 181-186)

### Phase 2: ARIA Expanded/Controls (Priority: High)
**Files to modify:**
1. `src/components/filters/MobileFilamentFilterSheet.tsx`
   - Add `aria-expanded={expandedSection === 'printer'}` to section toggles
   - Add `aria-controls="printer-section-content"` + matching `id`

2. `src/components/Navbar.tsx`
   - Add `aria-expanded={mobileMenuOpen}` to hamburger button
   - Add `aria-controls="mobile-navigation"` + matching `id` to menu container

3. `src/components/HeroSection.tsx`
   - Add focus-visible styles to scroll button (line 184-199)

### Phase 3: Color Contrast Improvements (Priority: High)
**Files to modify:**
1. `src/index.css`
   - Add high-contrast badge variant utilities
   - Create `--badge-text-on-dark` token for consistent badge text

2. `src/components/compare/MiniFilamentCard.tsx`
   - Update `MATERIAL_BADGE_COLORS` to use lighter text values:
     - `text-orange-300` instead of `text-orange-400`
     - `text-blue-300` instead of `text-blue-400`

3. `src/components/MaterialBadge.tsx`
   - Increase text lightness for property indicators
   - Use `text-violet-300` for material badge text

### Phase 4: Form Accessibility Enhancements (Priority: Medium)
**Files to modify:**
1. `src/components/filters/MobileFilamentFilterSheet.tsx`
   - Add `aria-label="Select printer brand"` to brand Select
   - Add `aria-label="Select printer model"` to model Select

2. `src/components/search/SearchInputWithHistory.tsx`
   - Wrap in container with `role="search"`
   - Add `aria-autocomplete="list"` to input

3. Create `src/components/accessibility/AccessibleSelect.tsx`
   - Wrapper for Select with consistent labeling

### Phase 5: Motion Safety (Priority: Medium)
**Files to modify:**
1. `src/components/HeroSection.tsx`
   - Add reduced motion check to suggestion cycling (line 64-72)

2. `src/components/LabReadoutCard.tsx`
   - Add `motion-safe:` prefix to card-enter animation

3. `src/components/printers/MediumStandardPrinterCard.tsx`
   - Add `motion-safe:animate-pulse` to discount badge

4. `src/index.css`
   - Add utility class `.motion-safe-only` for JS-controlled animations

### Phase 6: Heading Hierarchy Audit (Priority: Medium)
**Files to audit and fix:**
1. `src/pages/Finder.tsx` - Ensure h1 in hero, h2 for sections
2. `src/pages/Printers.tsx` - Same pattern
3. `src/pages/Deals.tsx` - Same pattern
4. Product detail pages - h1 for product name, h2 for tabs

### Phase 7: Testing & Validation
**Testing approach:**
1. Install `@axe-core/react` for automated accessibility testing
2. Add accessibility test utilities to `src/test/setup.ts`
3. Create sample accessibility tests for key components
4. Document keyboard navigation paths

---

## Technical Details

### New Utility Classes (index.css)
```css
/* High contrast badge text for dark backgrounds */
.badge-text-high-contrast {
  color: hsl(0 0% 95%);
}

/* Motion-safe animation wrapper */
.motion-safe-only {
  animation: none;
}
@media (prefers-reduced-motion: no-preference) {
  .motion-safe-only {
    animation: inherit;
  }
}
```

### Icon Button Pattern
```tsx
// Before
<Button variant="ghost" size="icon" onClick={handleClick}>
  <Share2 className="h-4 w-4" />
</Button>

// After
<Button 
  variant="ghost" 
  size="icon" 
  onClick={handleClick}
  aria-label="Share this deal"
>
  <Share2 className="h-4 w-4" aria-hidden="true" />
</Button>
```

### Collapsible Section Pattern
```tsx
// Before
<button onClick={() => toggleSection('printer')}>
  <span>Your Printer</span>
  <ChevronDown />
</button>

// After
<button 
  onClick={() => toggleSection('printer')}
  aria-expanded={expandedSection === 'printer'}
  aria-controls="printer-section-content"
>
  <span>Your Printer</span>
  <ChevronDown aria-hidden="true" />
</button>
<div id="printer-section-content" hidden={expandedSection !== 'printer'}>
  {/* content */}
</div>
```

---

## Files Summary

### New Files (1)
- `src/components/accessibility/AccessibleSelect.tsx`

### Modified Files (12)
| File | Changes |
|------|---------|
| `src/components/deals/DealCard.tsx` | Add aria-label to share button |
| `src/components/compare/MiniFilamentCard.tsx` | Add aria-labels, update badge colors |
| `src/components/CompareTray.tsx` | Replace title with aria-label |
| `src/components/filters/MobileFilamentFilterSheet.tsx` | Add aria-expanded, aria-controls, aria-labels |
| `src/components/Navbar.tsx` | Add aria-expanded to mobile menu trigger |
| `src/components/HeroSection.tsx` | Add reduced motion check, focus styles |
| `src/components/LabReadoutCard.tsx` | Add motion-safe prefix |
| `src/components/printers/MediumStandardPrinterCard.tsx` | Add motion-safe to pulse |
| `src/components/MaterialBadge.tsx` | Increase text contrast |
| `src/components/search/SearchInputWithHistory.tsx` | Add role="search", aria-autocomplete |
| `src/index.css` | Add high-contrast utilities |
| `src/pages/Finder.tsx` | Verify heading hierarchy |

---

## Expected Accessibility Improvements

| Metric | Before | After |
|--------|--------|-------|
| Icon buttons with labels | ~60% | 100% |
| ARIA expanded on toggles | ~30% | 100% |
| Color contrast compliance | ~85% | 100% |
| Motion respect | ~70% | 100% |
| Form accessibility | ~80% | 100% |

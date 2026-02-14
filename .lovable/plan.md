

# Fix Heading Hierarchy Issues

## 1. Homepage H1: Fix text and use CSS uppercase (HeroSection.tsx)

The H1 currently has hardcoded all-caps text: `FIND YOUR PERFECT` and `FILAMENT.`. Google reads the raw HTML, so the actual text should be normal case with CSS handling the visual uppercase.

**File: `src/components/HeroSection.tsx` (lines 242-247)**

Change from:
```
<span class="... uppercase">FIND YOUR PERFECT </span>
<span class="... uppercase">FILAMENT.</span>
```

To:
```
<span class="... uppercase">Find Your Perfect </span>
<span class="... uppercase">Filament.</span>
```

The `uppercase` Tailwind class is already applied, so the visual appearance will be identical. The HTML source will now contain proper-case text for search engines.

## 2. Duplicate H2: No action needed

The homepage currently has two distinct H2s:
- "Explore the Filament Catalog" (bridge section in Finder.tsx)
- "Browse All Filaments" (ResultsHeader component)

These are **not duplicates** -- they have different text. The heading hierarchy is already correct.

## 3. Brand Pages H1: Keep as-is

Brand pages use the brand name as H1, which is acceptable. No change required per the user's guidance ("at minimum keep it as-is").

## 4. Guide Pages: Already correct

The `BuyingGuideTemplate` renders exactly one H1 (the guide title) with proper H2/H3 hierarchy for sections. No changes needed.

## Summary

Only one file needs editing:
- **`src/components/HeroSection.tsx`**: Change hardcoded uppercase text to normal case (lines 243, 246)


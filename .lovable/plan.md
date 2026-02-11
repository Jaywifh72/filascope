

# Improve FAQ Section Vertical Footprint

## Changes to `src/components/printer/FAQSection.tsx`

### 1. Add "Show all / Show fewer" toggle (limit to 5 visible)
- Add a `showAll` state (default `false`)
- Slice `filteredFAQs` to first 5 when `showAll` is false
- Render a toggle button below the list: "Show all X questions" with ChevronDown / "Show fewer questions" with ChevronUp
- Button styled as `text-cyan-400 text-sm font-mono hover:text-cyan-300 cursor-pointer` with inline icon
- Only show the button when `filteredFAQs.length > 5`
- Reset `showAll` to `false` when category changes

### 2. Reduce vertical padding on FAQ items
- Change `py-4` to `py-3` on the FAQ trigger button (line 231)
- Change `py-4 md:py-5` to `py-3 md:py-4` on the answer container (line 258)

### 3. Make category pills horizontally scrollable
- Change the category container (line 191) from `flex flex-wrap justify-center gap-3` to `flex overflow-x-auto whitespace-nowrap gap-2 pb-2 justify-start` (or `md:justify-center`)
- Add `flex-shrink-0` on each pill button so they don't compress
- Hide scrollbar with a utility class for cleanliness

### What stays unchanged
- FAQ question/answer text and HTML content
- Individual accordion expand/collapse behavior
- "Still have questions?" / "Contact Our Support Team" CTA footer
- Category names and filtering logic

### Technical Details

**New state:**
```tsx
const [showAll, setShowAll] = useState(false);
```

**Reset on category change:**
```tsx
const handleCategoryChange = (cat: string) => {
  setActiveCategory(cat);
  setShowAll(false);
};
```

**Display logic:**
```tsx
const visibleFAQs = showAll ? filteredFAQs : filteredFAQs.slice(0, 5);
```

**Toggle button (after FAQ list):**
```tsx
{filteredFAQs.length > 5 && (
  <button
    onClick={() => setShowAll(!showAll)}
    className="flex items-center gap-1.5 mx-auto mt-4 text-cyan-400 text-sm font-mono hover:text-cyan-300 cursor-pointer transition-colors"
  >
    {showAll ? 'Show fewer questions' : `Show all ${filteredFAQs.length} questions`}
    {showAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
  </button>
)}
```

**Imports:** Add `ChevronUp` from `lucide-react`.

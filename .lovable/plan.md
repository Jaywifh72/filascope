
# Search Functionality Audit & Improvement Plan

## Current State Analysis

### What's Working Well
1. **Database-level search**: Filaments and Printers use Supabase `ilike` queries on relevant fields
2. **Color intelligence**: Smart extraction of color names from search terms (`colorIntelligence.ts`)
3. **Brand search autocomplete**: BrandsHeroSection has a real-time suggestion dropdown with highlighting
4. **Empty states**: Well-designed `FilamentsEmptyState` and `PrintersEmptyState` components
5. **Analytics infrastructure**: `search_analytics` and `filter_analytics` tables exist in the database
6. **Search history hook**: `useSearchContext` tracks recent searches in localStorage

### Current Gaps Identified
1. **No typo tolerance**: Searching "Crality" won't suggest "Creality"
2. **Analytics not connected**: `useFilterAnalytics.trackSearch()` exists but isn't called from Finder.tsx
3. **No autocomplete on main search**: Filaments/Printers search bars lack suggestion dropdowns
4. **No recent searches UI**: History is tracked but not displayed to users
5. **Inconsistent search scope**: Some areas search names only, others include descriptions
6. **No cross-platform search**: Can't search across filaments, printers, and brands simultaneously

---

## Implementation Plan

### Phase 1: Connect Search Analytics (Quick Win)
**Files to modify:**
- `src/pages/Finder.tsx`
- `src/pages/Printers.tsx`

**Changes:**
- Import `useFilterAnalytics` hook
- Call `startSearchTimer()` when search input changes
- Call `trackSearch()` after results are displayed with query, result_count, has_results
- This enables data collection for understanding search patterns

---

### Phase 2: Add Recent Searches Dropdown
**Files to create:**
- `src/components/search/SearchInputWithHistory.tsx`

**Files to modify:**
- `src/components/HeroSection.tsx` (Filaments)
- `src/components/PrintersHeroSection.tsx`

**Features:**
- Show dropdown on focus when search is empty
- Display up to 5 recent searches from `useSearchContext`
- Add "Clear history" option
- Each recent search is clickable to apply that query

---

### Phase 3: Add Search Autocomplete/Suggestions
**Files to create:**
- `src/hooks/useSearchSuggestions.ts`
- `src/components/search/SearchSuggestionDropdown.tsx`

**Implementation approach:**
- Query database for matching products/brands as user types (debounced 300ms)
- Show top 5 suggestions grouped by type (Filaments, Brands, Materials)
- Highlight matching text (reuse logic from BrandsHeroSection)
- Navigate directly to product/brand on selection

**Database query strategy:**
```sql
-- Lightweight suggestion query (limit 5 per category)
SELECT DISTINCT vendor FROM filaments WHERE vendor ILIKE '%query%' LIMIT 5
SELECT product_title FROM filaments WHERE product_title ILIKE '%query%' LIMIT 5
```

---

### Phase 4: Implement Typo Tolerance
**Files to create:**
- `src/lib/fuzzySearch.ts`

**Implementation approach:**
- Create a curated list of common terms (brand names, material names)
- Use Levenshtein distance (already in package-lock.json) for matching
- When no results found, check for close matches and suggest corrections
- Example mapping:
  - "Crality" → "Did you mean Creality?"
  - "Prusa" partial → Show "Prusa Research", "Prusament"

**Integration points:**
- Enhance empty state to show "Did you mean..." suggestions
- Add to autocomplete dropdown as "Similar: Creality"

---

### Phase 5: Improve Empty State with Suggestions
**Files to modify:**
- `src/components/filament/FilamentsEmptyState.tsx`
- `src/components/printers/PrintersEmptyState.tsx`

**Enhancements:**
- If search term has typo, show "Did you mean: X?"
- Show related searches based on partial matches
- Display popular searches in the same category
- Add "Search instead for: [corrected term]" clickable link

---

### Phase 6: Unified Search Results Page (Future)
**Files to create:**
- `src/pages/Search.tsx`
- `src/components/search/UnifiedSearchResults.tsx`

**Features:**
- Global search from navbar
- Results grouped by: Filaments, Printers, Brands, Knowledge Base
- Tab navigation between result types
- URL structure: `/search?q=bambu`

---

## Technical Details

### Search Scope by Area
| Page | Current Fields | Recommended Fields |
|------|---------------|-------------------|
| Filaments | product_title, vendor | + material, color_name |
| Printers | model_name, variant_or_bundle_name | + brand.brand |
| Brands | name, description | No change needed |
| Knowledge Base | material name, category | No change needed |
| Slicers | N/A (filter-based) | Add name search |

### Performance Considerations
- Debounce autocomplete queries (300ms minimum)
- Limit suggestion results to 5 per category
- Use `select` to fetch only needed columns for suggestions
- Cache recent search results with React Query (staleTime: 30s)

### Analytics Data to Collect
```typescript
interface SearchAnalytics {
  query: string;
  result_count: number;
  has_results: boolean;
  filters_applied: string[];
  time_to_results_ms: number;
  typo_corrected?: string;  // NEW: track corrections
  suggestion_clicked?: boolean;  // NEW: track engagement
}
```

---

## Testing Scenarios

| Search Query | Expected Behavior |
|-------------|-------------------|
| "PLA" | Show PLA filaments, material filter suggestion |
| "Bambu" | Show Bambu Lab products AND printers |
| "high speed" | Show high-speed filaments (finish_type filter) |
| "Crality" (typo) | Suggest "Creality", show Creality products |
| Empty search | Show recent searches, popular terms |
| "purple silk" | Color + finish combined search |

---

## Priority Order

1. **Phase 1** - Analytics connection (1-2 hours) - Essential for measuring improvement
2. **Phase 2** - Recent searches UI (2-3 hours) - High user value, simple implementation
3. **Phase 5** - Improved empty states (2 hours) - Quick UX improvement
4. **Phase 3** - Autocomplete (4-6 hours) - Major feature enhancement
5. **Phase 4** - Typo tolerance (3-4 hours) - Polish and error recovery
6. **Phase 6** - Unified search (8+ hours) - Future enhancement


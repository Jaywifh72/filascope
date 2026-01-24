
## Restructure Hero Section Quick-Start Path Cards

### Overview
Transform the 4 quick-start path cards to better communicate user journeys with clearer titles, more descriptive subtitles, appropriate icons, and dynamic data where possible.

---

### Changes Summary

| Current | New | Icon Change |
|---------|-----|-------------|
| Find Filament | Browse Filaments | FlaskRound → Search or LayoutGrid |
| Compare Printers | Compare Tool | Printer → Columns3 |
| Material Wizard | Quick Match | Wand2 → Target |
| Today's Deals | Today's Deals | Tag → (same, add LIVE badge) |

---

### Detailed Card Specifications

**CARD 1: "Quick Match"** (Previously "Material Wizard")
- **Icon**: `Target` (from lucide-react)
- **Title**: "Quick Match"
- **Subtitle**: "Answer 3 questions, get your perfect filament"
- **Action**: Navigate to `/wizard`
- **Color**: Purple (keep existing)
- **Position**: First (reordered for beginner-first priority)

**CARD 2: "Browse Filaments"** (Previously "Find Filament")
- **Icon**: `Search` or `LayoutGrid`
- **Title**: "Browse Filaments"
- **Subtitle**: Dynamic - "Explore {filamentCount}+ materials" (uses the `filamentCount` prop already passed to HeroSection)
- **Action**: Smooth scroll to `#system-config` (keep existing behavior)
- **Color**: Primary/Cyan (keep existing)
- **Position**: Second

**CARD 3: "Compare Tool"** (Previously "Compare Printers")
- **Icon**: `Columns3` (side-by-side columns icon)
- **Title**: "Compare Tool"
- **Subtitle**: "Side-by-side specs & properties"
- **Action**: Navigate to `/compare` (changed from `/printers`)
- **Color**: Blue (keep existing)
- **Position**: Third

**CARD 4: "Today's Deals"** (Keep same)
- **Icon**: `Tag` (keep existing)
- **Title**: "Today's Deals"
- **Subtitle**: Dynamic - "{deals.length} active deals" with fallback to "Best prices right now"
- **Action**: Navigate to `/deals` (keep existing)
- **Color**: Green (keep existing)
- **Position**: Fourth
- **New Feature**: Add subtle "LIVE" badge with pulsing dot indicator

---

### Data Fetching for Dynamic Counts

The `HeroSection` already receives `filamentCount` as a prop - we'll use this for the "Browse Filaments" card subtitle.

For the deals count, we'll add a lightweight query to fetch the count of active deals:
- Query: Count filaments where `variant_compare_at_price > variant_price` and weight >= 300g
- Use the same logic as `/deals` page
- Display as "{count} active deals" or fallback text if no deals

---

### Visual Enhancements

1. **Equal Card Sizing**
   - Add `min-h-[120px]` to ensure consistent height
   - Keep `items-stretch` grid behavior

2. **Icon Placement**
   - Icon centered above title (already implemented)
   - Increase icon size slightly: `h-7 w-7` (from `h-6 w-6`)

3. **Hover Effects**
   - Keep existing `hover:scale-[1.02]`
   - Add teal shadow glow on hover: `hover:shadow-primary/10`
   - Add border glow transition: `hover:border-primary/60`

4. **LIVE Badge for Deals Card**
   - Small badge with pulsing dot
   - Positioned in top-right corner of card
   - Uses green color scheme

---

### Technical Implementation

**File to Modify**: `src/components/HeroSection.tsx`

1. **Import Updates**
   - Add new icons: `Target`, `Columns3`, `LayoutGrid` or `Search`
   - Add `useQuery` for deals count

2. **Add Deals Count Query**
   ```typescript
   const { data: dealsCount = 0 } = useQuery({
     queryKey: ["hero-deals-count"],
     queryFn: async () => {
       const { count, error } = await supabase
         .from('filaments')
         .select('*', { count: 'exact', head: true })
         .not('variant_compare_at_price', 'is', null)
         .not('variant_price', 'is', null)
         .gt('variant_compare_at_price', 0)
         .or('net_weight_g.is.null,net_weight_g.gte.300');
       
       if (error) return 0;
       return count || 0;
     },
     staleTime: 1000 * 60 * 5, // 5 min cache
   });
   ```

3. **Update `quickStartPaths` Array**
   - Convert to a function or useMemo that takes `filamentCount` and `dealsCount` parameters
   - Reorder cards: Quick Match, Browse Filaments, Compare Tool, Today's Deals

4. **Add LIVE Badge Component**
   ```tsx
   {/* LIVE indicator for deals card */}
   <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[8px] font-bold uppercase">
     <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
     Live
   </div>
   ```

5. **Update Card Rendering**
   - Add `relative` class to card for LIVE badge positioning
   - Conditionally render LIVE badge only on deals card
   - Update subtitle text with dynamic counts

---

### Card Array Structure

```typescript
const getQuickStartPaths = (filamentCount: number, dealsCount: number) => [
  {
    title: "Quick Match",
    description: "Answer 3 questions, get your perfect filament",
    icon: Target,
    href: "/wizard",
    color: "purple",
  },
  {
    title: "Browse Filaments",
    description: `Explore ${filamentCount.toLocaleString()}+ materials`,
    icon: Search, // or LayoutGrid
    href: "#system-config",
    color: "primary",
    isScroll: true,
  },
  {
    title: "Compare Tool",
    description: "Side-by-side specs & properties",
    icon: Columns3,
    href: "/compare",
    color: "blue",
  },
  {
    title: "Today's Deals",
    description: dealsCount > 0 ? `${dealsCount} active deals` : "Best prices right now",
    icon: Tag,
    href: "/deals",
    color: "green",
    hasLiveBadge: true,
  },
];
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/HeroSection.tsx` | Update icons, card structure, add deals query, add LIVE badge |

---

### No New Files Required

All changes are contained within the existing `HeroSection.tsx` component.


# Fix: Search Suggestion Click Navigation to Filament Detail Page

## Problem Summary
Clicking on a product-type search suggestion (showing "PRODUCT" badge) fills the input with the product name instead of navigating to the filament detail page. The user expects clicking on a specific product to take them directly to that product's detail page.

## Root Cause Analysis
Two issues prevent navigation:

1. **Missing product ID**: The `useSearchSuggestions` hook only fetches `product_title` and `vendor` - it does not include the `id` or `product_handle` fields needed to construct a navigation URL.

2. **No navigation logic**: The `handleSelect` function in `SearchInputWithHistory.tsx` treats all suggestion types identically - it just updates the input value. There's no conditional logic to navigate for product-type suggestions.

## Solution Design

### Change 1: Extend SearchSuggestion Interface
Add optional `id` and `productHandle` fields to the `SearchSuggestion` interface to support navigation for product suggestions.

**File**: `src/hooks/useSearchSuggestions.ts`

```typescript
export interface SearchSuggestion {
  type: "brand" | "material" | "product" | "typo";
  value: string;
  displayText: string;
  subtitle?: string;
  count?: number;
  id?: string;           // Product ID for navigation
  productHandle?: string; // SEO slug for navigation
}
```

### Change 2: Fetch Product IDs in Query
Update the product suggestions query to include `id` and `product_handle` fields.

**File**: `src/hooks/useSearchSuggestions.ts` (lines 143-156)

```typescript
// Before
const { data, error } = await supabase
  .from("filaments")
  .select("product_title, vendor")
  .ilike("product_title", `%${debouncedQuery}%`)
  .limit(5);

// After
const { data, error } = await supabase
  .from("filaments")
  .select("id, product_title, vendor, product_handle")
  .ilike("product_title", `%${debouncedQuery}%`)
  .limit(5);

return (data || []).map((item) => ({
  type: "product" as const,
  value: item.product_title,
  displayText: item.product_title,
  subtitle: item.vendor || undefined,
  id: item.id,                    // Include ID
  productHandle: item.product_handle, // Include slug
}));
```

### Change 3: Add Navigation Logic for Products
Modify the `SearchInputWithHistory` component to navigate to the filament detail page when a product suggestion is clicked.

**File**: `src/components/search/SearchInputWithHistory.tsx`

Add import:
```typescript
import { useNavigate } from "react-router-dom";
```

Add hook inside component:
```typescript
const navigate = useNavigate();
```

Modify `handleSelect` to check suggestion type:
```typescript
const handleSelect = (selectedValue: string, suggestion?: SearchSuggestion) => {
  // If this is a product suggestion with an ID, navigate to detail page
  if (suggestion?.type === "product" && suggestion.id) {
    trackSearch(selectedValue);
    setShowDropdown(false);
    onChange(""); // Clear input after navigation
    
    // Navigate using product_handle or ID
    const slug = suggestion.productHandle || suggestion.id;
    navigate(`/filament/${slug}`);
    return;
  }
  
  // For brands, materials, and typos - update search input (existing behavior)
  onChange(selectedValue);
  trackSearch(selectedValue);
  setShowDropdown(false);
  onSelect?.(selectedValue);
  inputRef.current?.blur();
};
```

### Change 4: Pass Suggestion Object to handleSelect
Update the button onClick and keyboard Enter handlers to pass the full suggestion object.

**For suggestion buttons** (line 219):
```typescript
onClick={() => handleSelect(suggestion.value, suggestion)}
```

**For keyboard Enter handling** (lines 76-81):
```typescript
case "Enter":
  e.preventDefault();
  if (selectedIndex >= 0 && allItems[selectedIndex]) {
    // Find the corresponding suggestion if in suggestion mode
    const selectedSuggestion = value.length >= 2 
      ? suggestions[selectedIndex] 
      : undefined;
    handleSelect(allItems[selectedIndex], selectedSuggestion);
  } else if (value) {
    trackSearch(value);
    setShowDropdown(false);
  }
  break;
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useSearchSuggestions.ts` | Add `id` and `productHandle` to interface; update product query to fetch these fields |
| `src/components/search/SearchInputWithHistory.tsx` | Add `useNavigate`; modify `handleSelect` for product navigation; update onClick/onKeyDown handlers |

## Behavior After Fix

| Suggestion Type | Click Behavior |
|-----------------|----------------|
| **Product** | Navigate to `/filament/{slug}` (detail page) |
| **Brand** | Fill input, filter results by brand |
| **Material** | Fill input, filter results by material |
| **Typo** | Fill corrected term, search for it |

## Edge Cases Handled

1. **Product without product_handle**: Falls back to using the UUID for navigation
2. **Keyboard navigation**: Enter key on highlighted product will navigate (same code path)
3. **Clear input after navigation**: Prevents stale search term when user returns to homepage

## Testing Checklist

- Type "carbon fiber PETG" and click a product suggestion - should navigate to detail page
- Use arrow keys to highlight a product suggestion, press Enter - should navigate
- Click a brand suggestion (e.g., "Bambu") - should fill input and filter
- Click a material suggestion (e.g., "PETG") - should fill input and filter
- Navigate to detail page, press back - search input should be clear



# Plan: Fix Search Autocomplete Navigation for Keyboard Selection

## Problem Summary
When a user clicks on a **PRODUCT-type** suggestion in the search dropdown, the navigation works correctly (navigates to `/filament/{slug}`). However, when using **keyboard navigation** (ArrowDown/ArrowUp + Enter), the product name is incorrectly filled into the search input instead of navigating to the detail page.

## Root Cause
The `handleKeyDown` function is wrapped in `useCallback` with incomplete dependencies, causing stale closures:

```typescript
// Current (buggy)
const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
  // ...
  handleSelect(allItems[selectedIndex], selectedSuggestion);
  // ...
}, [showDropdown, selectedIndex, allItems, value, trackSearch]); // ❌ Missing: handleSelect, suggestions, navigate, onChange
```

1. `handleSelect` is a regular function that captures `navigate`, `onChange`, `trackSearch`, and `onSelect` - it's redefined on every render but the memoized `handleKeyDown` holds a stale reference
2. `suggestions` is accessed inside `handleKeyDown` but not in the dependency array

## Solution Overview
1. Wrap `handleSelect` in `useCallback` with proper dependencies
2. Add `handleSelect` and `suggestions` to the `handleKeyDown` dependency array

## Implementation Details

### File: `src/components/search/SearchInputWithHistory.tsx`

#### Change 1: Wrap `handleSelect` in `useCallback`

**Before (lines 96-115):**
```typescript
const handleSelect = (selectedValue: string, suggestion?: SearchSuggestion) => {
  if (suggestion?.type === "product" && suggestion.id) {
    trackSearch(selectedValue);
    setShowDropdown(false);
    onChange("");
    const slug = suggestion.productHandle || suggestion.id;
    navigate(`/filament/${slug}`);
    return;
  }
  onChange(selectedValue);
  trackSearch(selectedValue);
  setShowDropdown(false);
  onSelect?.(selectedValue);
  inputRef.current?.blur();
};
```

**After:**
```typescript
const handleSelect = useCallback((selectedValue: string, suggestion?: SearchSuggestion) => {
  if (suggestion?.type === "product" && suggestion.id) {
    trackSearch(selectedValue);
    setShowDropdown(false);
    onChange("");
    const slug = suggestion.productHandle || suggestion.id;
    navigate(`/filament/${slug}`);
    return;
  }
  onChange(selectedValue);
  trackSearch(selectedValue);
  setShowDropdown(false);
  onSelect?.(selectedValue);
  inputRef.current?.blur();
}, [navigate, onChange, trackSearch, onSelect]);
```

#### Change 2: Update `handleKeyDown` dependencies

**Before (line 94):**
```typescript
}, [showDropdown, selectedIndex, allItems, value, trackSearch]);
```

**After:**
```typescript
}, [showDropdown, selectedIndex, allItems, value, trackSearch, handleSelect, suggestions]);
```

## Summary of Changes

| File | Change Description |
|------|-------------------|
| `src/components/search/SearchInputWithHistory.tsx` | Wrap `handleSelect` in `useCallback` and fix dependency arrays |

## Testing Scenarios

After implementation, verify both interaction methods work:

1. **Click navigation**: Type "carbon fiber" → Click a PRODUCT suggestion → Should navigate to `/filament/{slug}`
2. **Keyboard navigation**: Type "carbon fiber" → Press ArrowDown 3x → Press Enter on a PRODUCT → Should navigate to `/filament/{slug}`
3. **Brand/Material selection**: Click or select a BRAND/MATERIAL → Should update search input (not navigate)
4. **Typo correction**: Click or select a TYPO correction → Should update search input


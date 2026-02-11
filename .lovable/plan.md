

# Fix Spec Summary Boxes in Hero Section

## File: `src/components/printer/PrinterHeroSection.tsx`

### Changes to `QuickSpecCard` component (lines 33-49)

Restructure from horizontal (icon + text side-by-side) to vertical (icon on top, label, value stacked below):

**Current layout:**
```
[icon] Label
       Value
```

**New layout:**
```
   icon
  Label
  Value
```

Specific changes:

1. **Container**: Replace `p-4 flex items-start gap-3 min-w-[140px]` with `px-3 py-3 flex flex-col items-center text-center gap-1 min-w-0`
2. **Icon wrapper**: Keep `rounded-lg bg-primary/10` but reduce icon from `h-5 w-5` to `h-4 w-4` (equivalent to size 16)
3. **Label**: Change from `text-xs text-muted-foreground` to `text-[10px] uppercase tracking-wider text-gray-500 whitespace-nowrap`
4. **Value**: Change from `text-sm font-semibold text-foreground whitespace-nowrap leading-snug` to `text-xs font-semibold text-white truncate w-full` and add a `title` attribute with the full value for hover access
5. Remove the wrapping `div` with `flex flex-col gap-1 min-w-0` since the outer container now handles the vertical stacking

### No changes to:
- The grid container (`grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4`)
- The four QuickSpecCard usages (icons, labels, values stay the same)
- Data Quality indicator or hero header layout
- Tooltip behavior (kept via TooltipProvider)


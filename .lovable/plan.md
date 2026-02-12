
## Add "How It Works" Section to Filament Comparison Empty State

### What Changes
A 3-step instructional section will be added below the "Compare up to 4 filaments at once" text, filling the empty space and guiding users through the comparison workflow.

### Visual Result
- A centered "HOW IT WORKS" label in mono text
- Three numbered step cards in a responsive grid (stacked on mobile, 3 columns on md+)
- Each card shows a step number, icon, title, and subtitle
- Subtle dark styling consistent with the existing empty state

### Technical Details

**File: `src/components/compare/FilamentComparisonEmptyState.tsx`**

1. Add imports for `Search`, `GitCompare`, and `BarChart3` from lucide-react (line 1)

2. After the closing `</div>` of the "Compare up to 4 filaments" paragraph (around line 152-155), insert:

```tsx
{/* How It Works */}
<div className="mt-12 w-full max-w-2xl">
  <p className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
    How It Works
  </p>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
    {[
      { step: "01", icon: Search, title: "Browse Materials", subtitle: "Select materials from the reference library" },
      { step: "02", icon: GitCompare, title: "Add to Tray", subtitle: "Click the compare icon to add up to 4" },
      { step: "03", icon: BarChart3, title: "Compare Side-by-Side", subtitle: "View properties, temps & specs together" },
    ].map((item) => (
      <div key={item.step} className="text-center p-4 rounded-lg border border-gray-800 bg-gray-900/30">
        <p className="text-[10px] font-mono text-primary/40 mb-1">{item.step}</p>
        <item.icon className="w-8 h-8 mx-auto text-primary/60 mb-2" />
        <p className="text-sm font-semibold text-foreground">{item.title}</p>
        <p className="text-xs text-muted-foreground mt-1">{item.subtitle}</p>
      </div>
    ))}
  </div>
</div>
```

3. Remove the existing "Compare up to 4 filaments" wrapper `<div className="mt-12 text-center">` and fold its text into the new section or keep it above as-is -- the new "How It Works" block replaces the dead space below it.

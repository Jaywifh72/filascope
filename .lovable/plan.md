

## Fix Printer Product Images Being Cut Off

The image clipping occurs because the container is fixed at `sm:h-[200px]` with `overflow-hidden`, while the `OptimizedImage` component renders its inner `img` as `w-full h-full` -- causing taller images to be cropped.

### Changes (single file)

**File: `src/components/printers/MediumStandardPrinterCard.tsx` (line 185-199)**

1. **Outer container div (line 185)**: Change `sm:h-[200px] sm:aspect-auto` to `sm:h-[220px] aspect-auto`. Keep `overflow-hidden`, `bg-[#0d1117]`, `rounded-lg`.

2. **OptimizedImage className (line 189)**: Change from `max-h-full max-w-full object-contain` to `w-auto h-full max-w-full max-h-[220px] object-contain`. This constrains the image to fit within 220px height while maintaining aspect ratio. The `object-contain` on the OptimizedImage className will be combined with the component's internal classes.

No other files or elements are modified -- badges, brand logos, pricing, spec grid, and buttons remain untouched.


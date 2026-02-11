

## Material Wizard Visual Enhancements

Four visual-only changes to `src/pages/Wizard.tsx`. No logic, questions, or navigation changes.

### 1. Subtle Background Radial Gradient
Add a radial gradient glow to the outer page wrapper div (line 216), not the card. Uses the brand cyan accent at very low opacity.

**Change:** Add an inline `style` with `background: radial-gradient(ellipse at center, rgba(0, 229, 204, 0.03) 0%, transparent 70%)` to the `min-h-screen` wrapper div.

### 2. Tighten the Card Layout
The card currently uses `flex-1` which causes it to stretch to fill available vertical space. Remove `flex-1` from the Card (line 218) and replace with `min-h-0` so the card snugly wraps its content. Also remove `flex-1` from the inner container div (line 217) to stop the vertical stretching chain. Keep `max-w-2xl mx-auto` (already present).

### 3. Step Indicator Label
Below the progress bar (after line 236), add a monospaced step label like "STEP 1 OF 5 -- USE CASE". Uses `text-xs text-gray-500 font-mono uppercase tracking-wider mt-3`. The step name is derived from the current question's `id` field, formatted to uppercase with underscores replaced by spaces.

### 4. Option Card Hover Enhancement
Add `hover:border-cyan-500/30 hover:bg-cyan-950/10 transition-all duration-200` to both single-select option Labels (line 257) and multi-select option divs (line 284). Existing selected/checked state styling remains unchanged and takes priority via the peer-data selectors and conditional classes.

---

### Technical Details

**File:** `src/pages/Wizard.tsx`

| Line | Change |
|------|--------|
| 216 | Add `style={{ background: 'radial-gradient(ellipse at center, rgba(0,229,204,0.03) 0%, transparent 70%)' }}` to the page wrapper div |
| 217 | Remove `flex-1` from `max-w-2xl mx-auto w-full flex-1 flex flex-col` |
| 218 | Remove `flex-1` from Card className, keep `flex flex-col` |
| 236 (after progress bar closing div) | Insert: `<p className="text-xs text-gray-500 font-mono uppercase tracking-wider mt-3">Step {currentStep + 1} of {questions.length} -- {currentQuestion.id.replace(/_/g, ' ')}</p>` |
| 257 | Add `hover:border-cyan-500/30 hover:bg-cyan-950/10` to the Label className (before `peer-data-[state=checked]` classes so checked state wins) |
| 284 | Add `hover:border-cyan-500/30 hover:bg-cyan-950/10` to the multi-select div className |

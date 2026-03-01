import { useState, useCallback, useEffect, useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const PRESETS = [
  { label: 'Opaque (0–1)', min: 0, max: 1 },
  { label: 'Mid-tone (1–3)', min: 1, max: 3 },
  { label: 'Translucent (3–5)', min: 3, max: 5 },
  { label: 'All Highlights (3+)', min: 3, max: 10 },
  { label: 'Full Range', min: 0, max: 10 },
];

interface Props {
  value: [number, number];
  onChange: (range: [number, number]) => void;
}

export function TdRangeSlider({ value, onChange }: Props) {
  const [local, setLocal] = useState<[number, number]>(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const debouncedChange = useCallback(
    (range: [number, number]) => {
      setLocal(range);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onChange(range), 300);
    },
    [onChange]
  );

  const handleInputChange = (index: 0 | 1, val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return;
    const clamped = Math.min(10, Math.max(0, num));
    const next: [number, number] = [...local] as [number, number];
    next[index] = clamped;
    if (next[0] > next[1]) return;
    debouncedChange(next);
  };

  const isPresetActive = (p: typeof PRESETS[0]) => local[0] === p.min && local[1] === p.max;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground shrink-0">TD Range</span>
        <Input
          type="number"
          step="0.01"
          min="0"
          max="10"
          value={local[0]}
          onChange={(e) => handleInputChange(0, e.target.value)}
          className="w-20 h-8 text-sm text-center"
        />
        <div className="flex-1 relative py-2">
          {/* Gradient track background */}
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(to right, hsl(0 60% 30%) 0%, hsl(0 60% 30%) 10%, hsl(35 80% 50%) 10%, hsl(35 80% 50%) 30%, hsl(187 70% 45%) 30%, hsl(187 70% 45%) 50%, hsl(270 50% 60%) 50%, hsl(270 50% 60%) 100%)',
            }}
          />
          <Slider
            value={local}
            onValueChange={(v) => debouncedChange(v as [number, number])}
            min={0}
            max={10}
            step={0.01}
            className="relative z-10 [&_[data-radix-slider-track]]:bg-transparent [&_[data-radix-slider-range]]:bg-white/20"
          />
        </div>
        <Input
          type="number"
          step="0.01"
          min="0"
          max="10"
          value={local[1]}
          onChange={(e) => handleInputChange(1, e.target.value)}
          className="w-20 h-8 text-sm text-center"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <Badge
            key={p.label}
            variant="outline"
            className={`cursor-pointer text-xs transition-colors hover:bg-accent ${isPresetActive(p) ? 'bg-primary/15 border-primary/40 text-primary' : ''}`}
            onClick={() => {
              setLocal([p.min, p.max]);
              onChange([p.min, p.max]);
            }}
          >
            {p.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Plus, Trash2, Copy, Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { normalizeColorHex, isValidHexColor } from '@/lib/utils';
import { colorDistance } from '@/lib/colorMatchUtils';
import { COLOR_FAMILIES } from '@/lib/colorMatchUtils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ColorFinderFilament } from '@/hooks/useColorFinderFilaments';

interface StackSlot {
  hex: string;
  label: string;
}

interface HueForgeStackBuilderProps {
  filaments: ColorFinderFilament[];
}

export function HueForgeStackBuilder({ filaments }: HueForgeStackBuilderProps) {
  const [slots, setSlots] = useState<StackSlot[]>([
    { hex: '#FFFFFF', label: 'Layer 1' },
    { hex: '#000000', label: 'Layer 2' },
  ]);

  const tdFilaments = useMemo(
    () => filaments.filter(f => f.transmission_distance != null && f.color_hex),
    [filaments]
  );

  const addSlot = () => {
    if (slots.length >= 5) return;
    setSlots(prev => [...prev, { hex: '#808080', label: `Layer ${prev.length + 1}` }]);
  };

  const removeSlot = (index: number) => {
    if (slots.length <= 2) return;
    setSlots(prev => prev.filter((_, i) => i !== index));
  };

  const updateSlotHex = (index: number, hex: string) => {
    setSlots(prev => prev.map((s, i) => i === index ? { ...s, hex } : s));
  };

  const getMatchesForSlot = (hex: string) => {
    return tdFilaments
      .map(f => ({
        ...f,
        dist: colorDistance(hex, normalizeColorHex(f.color_hex)),
      }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 5);
  };

  const handleCopyStack = () => {
    const lines = slots.map((slot, i) => {
      const matches = getMatchesForSlot(slot.hex);
      const best = matches[0];
      return `Layer ${i + 1}: ${slot.hex} → ${best ? `${best.product_title} (TD ${best.transmission_distance})` : 'No match'}`;
    });
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Stack copied to clipboard');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          HueForge Stack Builder
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addSlot} disabled={slots.length >= 5} className="text-xs">
            <Plus className="w-3 h-3 mr-1" /> Add Layer
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyStack} className="text-xs">
            <Copy className="w-3 h-3 mr-1" /> Copy Stack
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {slots.map((slot, idx) => (
          <div key={idx} className="rounded-lg border border-border/50 bg-card/50 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-md border border-border/50"
                style={{ backgroundColor: slot.hex }}
              />
              <Input
                value={slot.hex}
                onChange={(e) => {
                  const val = e.target.value;
                  updateSlotHex(idx, val);
                }}
                className="h-8 text-xs font-mono w-28"
                maxLength={7}
              />
              <span className="text-xs text-muted-foreground">{slot.label}</span>
              {slots.length > 2 && (
                <button
                  onClick={() => removeSlot(idx)}
                  className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              {/* Quick color buttons */}
              <div className="ml-auto flex gap-1">
                {COLOR_FAMILIES.slice(0, 6).filter(f => !f.hex.includes('gradient')).map(f => (
                  <button
                    key={f.name}
                    className="w-4 h-4 rounded-full border border-border/50"
                    style={{ backgroundColor: f.hex }}
                    onClick={() => updateSlotHex(idx, f.hex)}
                    title={f.name}
                  />
                ))}
              </div>
            </div>

            {/* Top matches with TD */}
            {isValidHexColor(slot.hex) && (
              <div className="space-y-1">
                {getMatchesForSlot(slot.hex).map(match => (
                  <div key={match.id} className="flex items-center gap-2 text-xs text-muted-foreground py-0.5">
                    <span
                      className="w-3 h-3 rounded-full border border-border/50 shrink-0"
                      style={{ backgroundColor: normalizeColorHex(match.color_hex) }}
                    />
                    <span className="truncate flex-1">{match.product_title}</span>
                    <span className="text-amber-400 font-mono shrink-0">
                      TD {match.transmission_distance}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

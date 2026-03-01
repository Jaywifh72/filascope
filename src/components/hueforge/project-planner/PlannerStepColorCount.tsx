import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Minus, Plus } from 'lucide-react';
import type { PlannerSlot } from './useProjectPlannerState';

interface Props {
  colorCount: number;
  slots: PlannerSlot[];
  customRoles: boolean;
  onCountChange: (count: number) => void;
  onToggleCustom: () => void;
  onSlotUpdate: (index: number, slot: Partial<PlannerSlot>) => void;
  onNext: () => void;
}

export function PlannerStepColorCount({ colorCount, slots, customRoles, onCountChange, onToggleCustom, onSlotUpdate, onNext }: Props) {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">How many colors in your print?</h2>
        <p className="text-muted-foreground">Adjust the number of filament layers for your project.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={() => onCountChange(colorCount - 1)} disabled={colorCount <= 1}>
          <Minus className="w-4 h-4" />
        </Button>
        <span className="text-4xl font-bold w-12 text-center">{colorCount}</span>
        <Button variant="outline" size="icon" onClick={() => onCountChange(colorCount + 1)} disabled={colorCount >= 8}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Slot preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Palette Structure</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Customize Roles</span>
            <Switch checked={customRoles} onCheckedChange={onToggleCustom} />
          </div>
        </div>
        <div className="space-y-2">
          {slots.map((slot, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
              <span className="text-sm font-mono text-muted-foreground w-6">{i + 1}</span>
              {customRoles ? (
                <>
                  <Input
                    value={slot.role}
                    onChange={(e) => onSlotUpdate(i, { role: e.target.value })}
                    className="flex-1 h-8 text-sm"
                  />
                  <Input
                    type="number"
                    value={slot.targetTdMin}
                    onChange={(e) => onSlotUpdate(i, { targetTdMin: parseFloat(e.target.value) || 0 })}
                    className="w-16 h-8 text-sm"
                    step="0.1"
                  />
                  <span className="text-muted-foreground text-xs">–</span>
                  <Input
                    type="number"
                    value={slot.targetTdMax}
                    onChange={(e) => onSlotUpdate(i, { targetTdMax: parseFloat(e.target.value) || 10 })}
                    className="w-16 h-8 text-sm"
                    step="0.1"
                  />
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium">{slot.role}</span>
                  <span className="text-xs text-muted-foreground">TD {slot.targetTdMin}–{slot.targetTdMax}</span>
                  <span className="text-xs text-muted-foreground/70">{slot.targetColorFamily}</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext}>Next: Pick Filaments →</Button>
      </div>
    </div>
  );
}

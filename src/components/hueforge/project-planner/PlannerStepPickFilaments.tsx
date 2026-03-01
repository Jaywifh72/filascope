import { Button } from '@/components/ui/button';
import type { ColorFinderFilament } from '@/hooks/useColorFinderFilaments';
import type { PlannerSlot } from './useProjectPlannerState';
import { PlannerFilamentSlotPicker } from './PlannerFilamentSlotPicker';
import { PlannerPalettePreview } from './PlannerPalettePreview';

interface Props {
  slots: PlannerSlot[];
  filaments: ColorFinderFilament[];
  allFilled: boolean;
  onSelectFilament: (index: number, filamentId: string | null) => void;
  onNext: () => void;
  onBack: () => void;
}

export function PlannerStepPickFilaments({ slots, filaments, allFilled, onSelectFilament, onNext, onBack }: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose a filament for each layer</h2>
        <p className="text-muted-foreground">Pick filaments matching each layer's target TD range.</p>
      </div>

      <PlannerPalettePreview slots={slots} filaments={filaments} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {slots.map((slot, i) => (
          <PlannerFilamentSlotPicker
            key={i}
            slot={slot}
            index={i}
            filaments={filaments}
            onSelect={(id) => onSelectFilament(i, id)}
          />
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <Button onClick={onNext} disabled={!allFilled}>
          Review Plan →
        </Button>
      </div>
    </div>
  );
}

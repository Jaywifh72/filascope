import type { ColorFinderFilament } from '@/hooks/useColorFinderFilaments';
import type { PlannerSlot } from './useProjectPlannerState';

interface Props {
  slots: PlannerSlot[];
  filaments: ColorFinderFilament[];
}

export function PlannerPalettePreview({ slots, filaments }: Props) {
  const filMap = new Map(filaments.map((f) => [f.id, f]));

  return (
    <div className="flex gap-1 p-3 rounded-lg border border-border bg-muted/30">
      <span className="text-xs text-muted-foreground mr-2 self-center shrink-0">Palette:</span>
      {slots.map((slot, i) => {
        const fil = slot.selectedFilamentId ? filMap.get(slot.selectedFilamentId) : null;
        return (
          <div
            key={i}
            className="flex-1 h-8 rounded border border-border/50 flex items-center justify-center text-[10px] text-muted-foreground"
            style={{ backgroundColor: fil?.color_hex || 'transparent' }}
            title={fil ? `${fil.vendor} ${fil.product_title} — TD ${fil.transmission_distance}` : `Layer ${i + 1}: Not selected`}
          >
            {!fil && (i + 1)}
          </div>
        );
      })}
    </div>
  );
}

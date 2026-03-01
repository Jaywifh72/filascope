import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TDFilament } from '../SubstituteFilamentPicker';
import type { LayerSlot } from '../useLayerPreviewState';

interface PresetDef {
  label: string;
  description: string;
  specs: { colorFamily: string; tdApprox: number; layerCount: number }[];
}

const PRESETS: PresetDef[] = [
  {
    label: 'Classic Portrait',
    description: '4 layers — Black base, Brown, Peach, White top',
    specs: [
      { colorFamily: 'Black', tdApprox: 0.55, layerCount: 3 },
      { colorFamily: 'Brown', tdApprox: 1.98, layerCount: 2 },
      { colorFamily: 'Orange', tdApprox: 2.95, layerCount: 1 },
      { colorFamily: 'White', tdApprox: 4.22, layerCount: 1 },
    ],
  },
  {
    label: 'High Contrast Duo',
    description: '2 layers — Black base, White top',
    specs: [
      { colorFamily: 'Black', tdApprox: 0.55, layerCount: 4 },
      { colorFamily: 'White', tdApprox: 4.22, layerCount: 2 },
    ],
  },
  {
    label: 'Landscape',
    description: '3 layers — Black base, Green, Blue top',
    specs: [
      { colorFamily: 'Black', tdApprox: 0.55, layerCount: 3 },
      { colorFamily: 'Green', tdApprox: 1.48, layerCount: 2 },
      { colorFamily: 'Blue', tdApprox: 1.55, layerCount: 1 },
    ],
  },
];

function findClosest(filaments: TDFilament[], colorFamily: string, tdTarget: number): TDFilament | null {
  const candidates = filaments.filter(
    (f) => f.color_family?.toLowerCase() === colorFamily.toLowerCase() && f.transmission_distance != null
  );
  if (!candidates.length) {
    // Fallback: any filament close to TD
    const all = filaments.filter((f) => f.transmission_distance != null);
    if (!all.length) return null;
    return all.reduce((best, f) =>
      Math.abs(f.transmission_distance! - tdTarget) < Math.abs(best.transmission_distance! - tdTarget) ? f : best
    );
  }
  return candidates.reduce((best, f) =>
    Math.abs(f.transmission_distance! - tdTarget) < Math.abs(best.transmission_distance! - tdTarget) ? f : best
  );
}

interface Props {
  filaments: TDFilament[];
  dispatch: React.Dispatch<any>;
}

export function LayerPreviewPresets({ filaments, dispatch }: Props) {
  const handlePreset = (value: string) => {
    const preset = PRESETS[parseInt(value)];
    if (!preset) return;
    const layers: LayerSlot[] = preset.specs.map((spec) => {
      const match = findClosest(filaments, spec.colorFamily, spec.tdApprox);
      return { filamentId: match?.id ?? null, layerCount: spec.layerCount };
    });
    dispatch({ type: 'LOAD_PRESET', layers });
  };

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">Load Preset</label>
      <Select onValueChange={handlePreset}>
        <SelectTrigger className="w-full h-9 text-sm">
          <SelectValue placeholder="Choose a preset..." />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((p, i) => (
            <SelectItem key={i} value={i.toString()}>
              <div>
                <span className="font-medium">{p.label}</span>
                <span className="text-muted-foreground ml-2 text-xs">{p.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

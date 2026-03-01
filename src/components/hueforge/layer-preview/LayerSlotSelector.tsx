import { Plus, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SubstituteFilamentPicker, type TDFilament } from '../SubstituteFilamentPicker';
import type { LayerSlot } from '../useLayerPreviewState';

interface Props {
  layers: LayerSlot[];
  filaments: TDFilament[];
  dispatch: React.Dispatch<any>;
}

function slotLabel(index: number, total: number): string {
  if (index === 0) return 'Base Layer';
  if (index === total - 1) return 'Top Layer';
  return `Layer ${index + 1}`;
}

function layerHint(index: number, total: number): string {
  if (index === 0) return 'recommended: 3–4 layers';
  if (index === total - 1) return 'recommended: 1–2 layers';
  return 'recommended: 1–3 layers';
}

export function LayerSlotSelector({ layers, filaments, dispatch }: Props) {
  const totalLayerCount = layers.reduce((s, l) => s + l.layerCount, 0);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">
        Layer Stack
      </h3>

      {totalLayerCount > 12 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Most HueForge prints use 8–12 layers total ({totalLayerCount} selected)
        </div>
      )}

      {/* Render top-to-bottom visually (reversed order) */}
      {[...layers].reverse().map((layer, ri) => {
        const index = layers.length - 1 - ri;
        const selected = filaments.find((f) => f.id === layer.filamentId) ?? null;
        return (
          <div key={index} className="flex items-center gap-2 p-3 rounded-lg border border-border/50 bg-muted/20">
            <div className="shrink-0 w-20">
              <span className="text-xs font-medium text-muted-foreground">
                {slotLabel(index, layers.length)}
              </span>
              <p className="text-[10px] text-muted-foreground/60">
                ({layerHint(index, layers.length)})
              </p>
            </div>
            <div className="flex-1 min-w-0">
              <SubstituteFilamentPicker
                filaments={filaments}
                selectedId={layer.filamentId}
                onSelect={(f) => dispatch({ type: 'SET_FILAMENT', index, filamentId: f?.id ?? null })}
              />
            </div>
            {selected && (
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs text-muted-foreground">×</span>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={layer.layerCount}
                  onChange={(e) =>
                    dispatch({ type: 'SET_LAYER_COUNT', index, count: parseInt(e.target.value) || 1 })
                  }
                  className="w-16 h-8 text-center text-sm"
                />
                <span className="text-xs text-muted-foreground">layers</span>
              </div>
            )}
            {layers.length > 2 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => dispatch({ type: 'REMOVE_LAYER', index })}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        );
      })}
      {layers.length < 6 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => dispatch({ type: 'ADD_LAYER' })}
        >
          <Plus className="w-4 h-4 mr-1" /> Add Layer
        </Button>
      )}
    </div>
  );
}

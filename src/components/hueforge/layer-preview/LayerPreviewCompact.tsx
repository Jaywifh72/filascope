import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { TDFilament } from '../SubstituteFilamentPicker';
import { useLayerPreviewState } from '../useLayerPreviewState';
import { LayerSlotSelector } from './LayerSlotSelector';
import { LayerStackVisualization } from './LayerStackVisualization';

interface Props {
  filaments: TDFilament[];
  initialFilamentId?: string;
}

export function LayerPreviewCompact({ filaments, initialFilamentId }: Props) {
  const { state, dispatch } = useLayerPreviewState(false);

  // Pre-populate slot 1 if provided
  useEffect(() => {
    if (initialFilamentId && !state.layers[0].filamentId) {
      dispatch({ type: 'SET_FILAMENT', index: 0, filamentId: initialFilamentId });
    }
  }, [initialFilamentId]);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Layer Stacking Preview</CardTitle>
        </div>
        <CardDescription>
          Visualize how filament layers stack based on TD values.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            {/* Only show first 2 slots in compact */}
            <div className="space-y-2">
              {state.layers.slice(0, 2).map((layer, i) => {
                const selected = filaments.find((f) => f.id === layer.filamentId) ?? null;
                return (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-xs text-muted-foreground w-12 shrink-0">
                      {i === 0 ? 'Base' : 'Top'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <select
                        className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                        value={layer.filamentId || ''}
                        onChange={(e) =>
                          dispatch({ type: 'SET_FILAMENT', index: i, filamentId: e.target.value || null })
                        }
                      >
                        <option value="">Select filament...</option>
                        {filaments.slice(0, 100).map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.vendor} {f.product_title} — TD {f.transmission_distance}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <LayerStackVisualization layers={state.layers.slice(0, 2)} filaments={filaments} compact />
        </div>
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to="/hueforge-layer-preview">
            Open Full Preview <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

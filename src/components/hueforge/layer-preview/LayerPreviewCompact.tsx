import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, ArrowRight, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    <div className="rounded-lg overflow-hidden bg-gradient-to-r from-cyan-500 to-purple-500 p-[2px]">
      <Card className="border-0 rounded-[calc(var(--radius)-2px)]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Layer Stacking Preview</CardTitle>
          </div>
          <CardDescription>
            See how your HueForge layers will look when printed and backlit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
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
              {/* Pro tip */}
              <div className="flex items-start gap-1.5 text-[11px] text-amber-400/80 bg-amber-500/5 border border-amber-500/10 rounded-md px-2.5 py-2">
                <Lightbulb className="w-3 h-3 mt-0.5 shrink-0" />
                <span><span className="font-semibold">Pro tip:</span> Choose a dark base (TD &lt; 1) and a light top (TD &gt; 3) for maximum contrast</span>
              </div>
            </div>
            <LayerStackVisualization layers={state.layers.slice(0, 2)} filaments={filaments} compact />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/30 rounded-lg py-2.5 transition-all duration-200"
            asChild
          >
            <Link to="/hueforge-layer-preview">
              Open Full Preview <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

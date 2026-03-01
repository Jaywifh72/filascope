import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Lightbulb, LightbulbOff } from 'lucide-react';
import type { TDFilament } from '../SubstituteFilamentPicker';
import type { LayerSlot } from '../useLayerPreviewState';
import { calcEffectiveOpacity, compositeColor } from '../useLayerPreviewState';

interface Props {
  layers: LayerSlot[];
  filaments: TDFilament[];
  compact?: boolean;
}

interface ResolvedLayer {
  hex: string;
  opacity: number;
  layerCount: number;
  name: string;
  td: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export function LayerStackVisualization({ layers, filaments, compact }: Props) {
  const [backlit, setBacklit] = useState(true);

  const resolved = useMemo<ResolvedLayer[]>(() => {
    return layers
      .map((l) => {
        if (!l.filamentId) return null;
        const f = filaments.find((fi) => fi.id === l.filamentId);
        if (!f || !f.color_hex || f.transmission_distance == null) return null;
        return {
          hex: f.color_hex,
          opacity: calcEffectiveOpacity(l.layerCount, f.transmission_distance),
          layerCount: l.layerCount,
          name: `${f.vendor} ${f.product_title}`,
          td: f.transmission_distance,
        };
      })
      .filter(Boolean) as ResolvedLayer[];
  }, [layers, filaments]);

  const totalLayers = resolved.reduce((s, l) => s + l.layerCount, 0);

  const backlitComposite = useMemo(() => {
    if (!resolved.length) return null;
    const [r, g, b] = compositeColor(
      resolved.map((l) => ({ hex: l.hex, opacity: l.opacity })),
      [255, 255, 255]
    );
    return rgbToHex(r, g, b);
  }, [resolved]);

  const ambientComposite = useMemo(() => {
    if (!resolved.length) return null;
    const [r, g, b] = compositeColor(
      resolved.map((l) => ({ hex: l.hex, opacity: l.opacity })),
      [0, 0, 0]
    );
    return rgbToHex(r, g, b);
  }, [resolved]);

  const w = compact ? 'w-[150px]' : 'w-[220px]';
  const h = compact ? 'h-[150px]' : 'h-[300px]';

  // Empty state
  if (!resolved.length) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/30 p-6 min-h-[300px] flex flex-col items-center justify-center gap-4">
        {/* Placeholder stack illustration */}
        <div className="flex flex-col items-center gap-1 animate-pulse opacity-60">
          {[0.15, 0.25, 0.35].map((op, i) => (
            <div
              key={i}
              className="rounded-md border border-border/30"
              style={{
                width: `${140 - i * 10}px`,
                height: '28px',
                background: `linear-gradient(135deg, hsl(var(--muted)) ${op * 100}%, transparent)`,
                opacity: 0.4 + op,
              }}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Your layer preview will appear here
        </p>
        <p className="text-xs text-muted-foreground/60 text-center max-w-[240px]">
          Select filaments in the layer stack to visualize how they blend
        </p>
      </div>
    );
  }

  const bgColor = backlit ? '#ffffff' : '#000000';
  const label = backlit ? 'Backlit' : 'Ambient';

  return (
    <div className="space-y-4">
      {/* Backlight toggle */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setBacklit(!backlit)}
          className="text-xs gap-1.5"
        >
          {backlit ? <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> : <LightbulbOff className="w-3.5 h-3.5" />}
          {backlit ? 'Backlight On' : 'Backlight Off'}
        </Button>
      </div>

      {/* Preview stack */}
      <div className="flex justify-center">
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <div className="relative">
            {/* Backlight glow */}
            {backlit && (
              <div
                className="absolute inset-0 rounded-lg blur-xl opacity-30 pointer-events-none -z-10"
                style={{ backgroundColor: '#fffbe6', transform: 'scale(1.15)' }}
              />
            )}
            <div
              className={`${w} ${h} rounded-lg border border-border/30 overflow-hidden flex flex-col-reverse shadow-inner`}
              style={{ backgroundColor: bgColor }}
            >
              {resolved.map((layer, i) => (
                <div
                  key={i}
                  className="w-full relative group"
                  style={{
                    flex: layer.layerCount,
                    backgroundColor: layer.hex,
                    opacity: layer.opacity,
                    borderTop: i > 0 ? '1px solid rgba(255,255,255,0.1)' : undefined,
                  }}
                >
                  {/* Layer label on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <span className="text-[10px] text-white font-medium px-1 truncate">
                      L{i + 1}: TD {layer.td.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Layer labels */}
      <div className="flex flex-col items-center gap-0.5">
        {[...resolved].reverse().map((layer, i) => (
          <p key={i} className="text-xs text-muted-foreground truncate max-w-[280px]">
            Layer {resolved.length - i}: {layer.name} (TD {layer.td.toFixed(2)})
          </p>
        ))}
      </div>

      {/* Composite swatches */}
      <div className="flex justify-center gap-4">
        {backlitComposite && (
          <div className="flex flex-col items-center gap-1">
            <div
              className="w-12 h-12 rounded-lg border border-border/50 shadow-sm"
              style={{ backgroundColor: backlitComposite }}
            />
            <span className="text-[10px] text-muted-foreground">Backlit</span>
          </div>
        )}
        {ambientComposite && !compact && (
          <div className="flex flex-col items-center gap-1">
            <div
              className="w-12 h-12 rounded-lg border border-border/50 shadow-sm"
              style={{ backgroundColor: ambientComposite }}
            />
            <span className="text-[10px] text-muted-foreground">Ambient</span>
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground text-center max-w-sm mx-auto leading-relaxed">
        Simplified visual preview. Actual results depend on slicer settings, layer height, and printer calibration.
      </p>
    </div>
  );
}

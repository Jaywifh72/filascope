import { useMemo } from 'react';
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
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export function LayerStackVisualization({ layers, filaments, compact }: Props) {
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

  const w = compact ? 'w-[150px]' : 'w-[200px]';
  const h = compact ? 'h-[150px]' : 'h-[300px]';

  if (!resolved.length) {
    return (
      <div className={`${compact ? '' : 'flex gap-6 justify-center'}`}>
        <div className={`${w} ${h} rounded-lg border border-border/50 bg-muted/10 flex items-center justify-center`}>
          <span className="text-xs text-muted-foreground text-center px-4">
            Select filaments to see preview
          </span>
        </div>
      </div>
    );
  }

  const renderStack = (bg: string, label: string) => (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div
        className={`${w} ${h} rounded-lg border border-border/30 overflow-hidden flex flex-col-reverse shadow-inner`}
        style={{ backgroundColor: bg }}
      >
        {resolved.map((layer, i) => (
          <div
            key={i}
            className="w-full"
            style={{
              flex: layer.layerCount,
              backgroundColor: layer.hex,
              opacity: layer.opacity,
              borderTop: i > 0 ? '1px solid rgba(255,255,255,0.1)' : undefined,
            }}
            title={`${layer.name} — ${layer.layerCount} layers, opacity ${(layer.opacity * 100).toFixed(0)}%`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className={`flex gap-4 ${compact ? 'justify-center' : 'justify-center gap-6'}`}>
        {renderStack('#ffffff', 'Backlit')}
        {!compact && renderStack('#000000', 'Ambient')}
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

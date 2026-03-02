import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, ExternalLink, Lightbulb, LightbulbOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableFooter,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  calcEffectiveOpacity,
  calcCumulativeTransmission,
  compositeColor,
} from '@/components/hueforge/useLayerPreviewState';
import { LayerPreviewTips } from '@/components/hueforge/layer-preview/LayerPreviewTips';
import type { PaletteEntry } from '@/hooks/usePaletteBuilder';

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

interface Props {
  palette: PaletteEntry[];
}

interface ResolvedLayer {
  hex: string;
  opacity: number;
  layerCount: number;
  name: string;
  td: number;
}

export function PaletteLayerPreview({ palette }: Props) {
  const [backlit, setBacklit] = useState(true);
  const navigate = useNavigate();

  const resolved = useMemo<ResolvedLayer[]>(
    () =>
      palette
        .filter((p) => p.color && p.tdValue != null)
        .map((p) => ({
          hex: p.color || '#808080',
          opacity: calcEffectiveOpacity(p.layers, p.tdValue),
          layerCount: p.layers,
          name: `${p.brand} ${p.filamentName}`,
          td: p.tdValue,
        })),
    [palette]
  );

  const totalLayers = resolved.reduce((s, l) => s + l.layerCount, 0);

  const transmissions = useMemo(
    () => calcCumulativeTransmission(resolved.map((r) => ({ opacity: r.opacity }))),
    [resolved]
  );

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

  const finalTransmission =
    transmissions.length > 0 ? transmissions[transmissions.length - 1] : 1;

  // Build URL params matching Layer Preview page format: ?l1=id,count&l2=id,count
  const openInLayerPreview = () => {
    const params = new URLSearchParams();
    palette.forEach((p, i) => {
      params.set(`l${i + 1}`, `${p.filamentId},${p.layers}`);
    });
    navigate(`/hueforge-layer-preview?${params.toString()}`);
  };

  if (!resolved.length) {
    return (
      <div className="min-h-[160px] flex flex-col items-center justify-center text-center">
        <Eye className="w-8 h-8 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">
          Add filaments to preview your layer stack
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Backlight toggle */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setBacklit(!backlit)}
          className="text-xs gap-1.5"
        >
          {backlit ? (
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <LightbulbOff className="w-3.5 h-3.5" />
          )}
          {backlit ? 'Backlight On' : 'Backlight Off'}
        </Button>
      </div>

      {/* Visual preview — two squares side by side */}
      <div className="flex justify-center gap-6">
        {/* Backlit preview */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative">
            {backlit && (
              <div
                className="absolute inset-0 rounded-lg blur-xl opacity-30 pointer-events-none -z-10"
                style={{ backgroundColor: '#fffbe6', transform: 'scale(1.15)' }}
              />
            )}
            <div
              className="w-[120px] h-[160px] sm:w-[150px] sm:h-[200px] rounded-lg border border-border/30 overflow-hidden flex flex-col-reverse shadow-inner"
              style={{ backgroundColor: '#ffffff' }}
            >
              {resolved.map((layer, i) => (
                <div
                  key={i}
                  className="w-full relative group"
                  style={{
                    flex: layer.layerCount,
                    backgroundColor: layer.hex,
                    opacity: layer.opacity,
                    borderTop:
                      i > 0 ? '1px solid rgba(255,255,255,0.1)' : undefined,
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <span className="text-[9px] text-white font-medium px-1 truncate">
                      TD {layer.td.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground">Backlit</span>
        </div>

        {/* Ambient preview */}
        <div className="flex flex-col items-center gap-1.5">
          <div
            className="w-[120px] h-[160px] sm:w-[150px] sm:h-[200px] rounded-lg border border-border/30 overflow-hidden flex flex-col-reverse shadow-inner"
            style={{ backgroundColor: '#000000' }}
          >
            {resolved.map((layer, i) => (
              <div
                key={i}
                className="w-full relative group"
                style={{
                  flex: layer.layerCount,
                  backgroundColor: layer.hex,
                  opacity: layer.opacity,
                  borderTop:
                    i > 0 ? '1px solid rgba(255,255,255,0.1)' : undefined,
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                  <span className="text-[9px] text-white font-medium px-1 truncate">
                    TD {layer.td.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">Ambient</span>
        </div>
      </div>

      {/* Composite swatches */}
      <div className="flex justify-center gap-4">
        {backlitComposite && (
          <div className="flex flex-col items-center gap-1">
            <div
              className="w-10 h-10 rounded-lg border border-border/50 shadow-sm"
              style={{ backgroundColor: backlitComposite }}
            />
            <span className="text-[10px] text-muted-foreground">Backlit</span>
          </div>
        )}
        {ambientComposite && (
          <div className="flex flex-col items-center gap-1">
            <div
              className="w-10 h-10 rounded-lg border border-border/50 shadow-sm"
              style={{ backgroundColor: ambientComposite }}
            />
            <span className="text-[10px] text-muted-foreground">Ambient</span>
          </div>
        )}
      </div>

      {/* Layer breakdown table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Layer</TableHead>
              <TableHead>Filament</TableHead>
              <TableHead className="text-right">TD</TableHead>
              <TableHead className="text-right">Layers</TableHead>
              <TableHead className="text-right">Eff. Opacity</TableHead>
              <TableHead className="text-right">Cum. Transmission</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resolved.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium text-sm">
                  {i === 0
                    ? 'Base'
                    : i === resolved.length - 1
                      ? 'Top'
                      : `Layer ${i + 1}`}
                </TableCell>
                <TableCell className="text-sm">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full border shrink-0 inline-block"
                      style={{ backgroundColor: r.hex }}
                    />
                    <span className="truncate max-w-[140px]">{r.name}</span>
                  </span>
                </TableCell>
                <TableCell className="text-right text-sm">
                  {r.td.toFixed(2)}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {r.layerCount}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {(r.opacity * 100).toFixed(1)}%
                </TableCell>
                <TableCell className="text-right text-sm">
                  {(transmissions[i] * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="font-medium">
                Total
              </TableCell>
              <TableCell className="text-right font-medium">
                {totalLayers}
              </TableCell>
              <TableCell />
              <TableCell className="text-right font-medium">
                {(finalTransmission * 100).toFixed(1)}%
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Open in full tool */}
      <div className="flex justify-center">
        <Button variant="outline" size="sm" onClick={openInLayerPreview} className="text-xs gap-1.5">
          <ExternalLink className="w-3.5 h-3.5" />
          Open in Layer Preview
        </Button>
      </div>

      {/* Tips */}
      <LayerPreviewTips />

      <p className="text-[10px] text-muted-foreground text-center max-w-sm mx-auto leading-relaxed">
        Simplified visual preview. Actual results depend on slicer settings,
        layer height, and printer calibration.
      </p>
    </div>
  );
}

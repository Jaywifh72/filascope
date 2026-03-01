import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { TDFilament } from '../SubstituteFilamentPicker';
import type { LayerSlot } from '../useLayerPreviewState';
import { calcEffectiveOpacity, calcCumulativeTransmission } from '../useLayerPreviewState';

interface Props {
  layers: LayerSlot[];
  filaments: TDFilament[];
}

export function LayerMetricsTable({ layers, filaments }: Props) {
  const resolved = layers.map((l) => {
    const f = l.filamentId ? filaments.find((fi) => fi.id === l.filamentId) : null;
    const td = f?.transmission_distance ?? null;
    const opacity = td != null ? calcEffectiveOpacity(l.layerCount, td) : 0;
    return { layer: l, filament: f, td, opacity };
  });

  const transmissions = calcCumulativeTransmission(resolved.map((r) => ({ opacity: r.opacity })));
  const totalLayers = resolved.reduce((s, r) => s + r.layer.layerCount, 0);
  const finalTransmission = transmissions.length > 0 ? transmissions[transmissions.length - 1] : 1;

  if (!resolved.some((r) => r.filament)) return null;

  return (
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
                {i === 0 ? 'Base' : i === resolved.length - 1 ? 'Top' : `Layer ${i + 1}`}
              </TableCell>
              <TableCell className="text-sm">
                {r.filament ? (
                  <span className="flex items-center gap-1.5">
                    {r.filament.color_hex && (
                      <span
                        className="w-3 h-3 rounded-full border shrink-0 inline-block"
                        style={{ backgroundColor: r.filament.color_hex }}
                      />
                    )}
                    <span className="truncate max-w-[150px]">
                      {r.filament.vendor} {r.filament.product_title}
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right text-sm">
                {r.td != null ? r.td.toFixed(2) : '—'}
              </TableCell>
              <TableCell className="text-right text-sm">{r.layer.layerCount}</TableCell>
              <TableCell className="text-right text-sm">
                {r.filament ? `${(r.opacity * 100).toFixed(1)}%` : '—'}
              </TableCell>
              <TableCell className="text-right text-sm">
                {r.filament ? `${(transmissions[i] * 100).toFixed(1)}%` : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className="font-medium">Total</TableCell>
            <TableCell className="text-right font-medium">{totalLayers}</TableCell>
            <TableCell />
            <TableCell className="text-right font-medium">
              {(finalTransmission * 100).toFixed(1)}%
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

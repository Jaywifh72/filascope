import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClipboardCopy, Share2, Eye, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import type { ColorFinderFilament } from '@/hooks/useColorFinderFilaments';
import type { PlannerSlot } from './useProjectPlannerState';
import { getSuggestedLayers } from './useProjectPlannerState';
import { PlannerPalettePreview } from './PlannerPalettePreview';
import { useCurrency } from '@/hooks/useCurrency';

interface Props {
  projectType: string | null;
  slots: PlannerSlot[];
  filaments: ColorFinderFilament[];
  onBack: () => void;
  onReset: () => void;
}

export function PlannerStepReview({ projectType, slots, filaments, onBack, onReset }: Props) {
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const filMap = new Map(filaments.map((f) => [f.id, f]));

  const selectedFilaments = slots.map((s) => (s.selectedFilamentId ? filMap.get(s.selectedFilamentId) ?? null : null));

  const totalCost = useMemo(() => {
    return selectedFilaments.reduce((sum, f) => sum + (f?.variant_price ?? 0), 0);
  }, [selectedFilaments]);

  const tdRange = useMemo(() => {
    const tds = selectedFilaments.filter(Boolean).map((f) => f!.transmission_distance!);
    return tds.length ? { min: Math.min(...tds), max: Math.max(...tds) } : null;
  }, [selectedFilaments]);

  const copyShoppingList = () => {
    const lines = slots.map((slot, i) => {
      const f = selectedFilaments[i];
      if (!f) return `${i + 1}. (not selected)`;
      return `${i + 1}. ${f.vendor} ${f.product_title} — TD ${f.transmission_distance} — ${formatPrice(f.variant_price)}`;
    });
    const text = `HueForge Project: ${projectType || 'Custom'} | ${slots.length} colors${tdRange ? ` | TD ${tdRange.min}–${tdRange.max}` : ''}\n\n${lines.join('\n')}`;
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Shopping list copied to clipboard.' });
  };

  const shareUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (projectType) params.set('type', projectType);
    selectedFilaments.forEach((f, i) => {
      if (f) params.set(`f${i + 1}`, f.id);
    });
    return `${window.location.origin}/hueforge-project-planner?${params.toString()}`;
  }, [projectType, selectedFilaments]);

  const sharePlan = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: 'Link copied!', description: 'Shareable plan URL copied to clipboard.' });
  };

  const layerPreviewUrl = useMemo(() => {
    const params = new URLSearchParams();
    selectedFilaments.forEach((f, i) => {
      if (f) {
        const td = f.transmission_distance ?? 2;
        const layers = td < 1 ? 4 : td < 2 ? 3 : td < 3 ? 2 : 1;
        params.set(`l${i + 1}`, `${f.id},${layers}`);
      }
    });
    return `/hueforge-layer-preview?${params.toString()}`;
  }, [selectedFilaments]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Your HueForge Filament Plan</h2>
      </div>

      <PlannerPalettePreview slots={slots} filaments={filaments} />

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{projectType || 'Custom'}</p>
            <p className="text-xs text-muted-foreground">Project Type</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{slots.length}</p>
            <p className="text-xs text-muted-foreground">Colors</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{tdRange ? `${tdRange.min}–${tdRange.max}` : '—'}</p>
            <p className="text-xs text-muted-foreground">TD Range</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{formatPrice(totalCost)}</p>
            <p className="text-xs text-muted-foreground">Est. Total</p>
          </div>
        </CardContent>
      </Card>

      {/* Shopping list table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Layer</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Filament</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>TD</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Layers</TableHead>
              <TableHead>Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slots.map((slot, i) => {
              const f = selectedFilaments[i];
              return (
                <TableRow key={i}>
                  <TableCell className="font-mono">{i + 1}</TableCell>
                  <TableCell className="text-sm">{slot.role}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {f ? (
                      <Link to={`/filament/${f.product_handle || f.id}`} className="hover:text-primary">
                        {f.product_title}
                      </Link>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-sm">{f?.vendor || '—'}</TableCell>
                  <TableCell className="text-sm font-mono">{f?.transmission_distance ?? '—'}</TableCell>
                  <TableCell>
                    {f?.color_hex && (
                      <span className="w-5 h-5 rounded-full border border-border/50 inline-block" style={{ backgroundColor: f.color_hex }} />
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{f ? getSuggestedLayers(f.transmission_distance!) : '—'}</TableCell>
                  <TableCell className="text-sm">{f ? formatPrice(f.variant_price) : '—'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button variant="outline" onClick={copyShoppingList}>
          <ClipboardCopy className="w-4 h-4 mr-2" />
          Copy Shopping List
        </Button>
        <Button variant="outline" onClick={sharePlan}>
          <Share2 className="w-4 h-4 mr-2" />
          Share Plan
        </Button>
        <Button variant="outline" asChild>
          <Link to={layerPreviewUrl}>
            <Eye className="w-4 h-4 mr-2" />
            Preview Layer Stack
          </Link>
        </Button>
        <Button variant="ghost" onClick={onReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Start Over
        </Button>
      </div>

      {/* Print recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Print Settings Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>Layer Height:</strong> 0.08mm (fine detail) or 0.12mm (standard quality)</p>
          <p>• <strong>Estimated total layers:</strong> {slots.reduce((sum, _, i) => {
            const f = selectedFilaments[i];
            if (!f) return sum;
            const td = f.transmission_distance ?? 2;
            return sum + (td < 1 ? 4 : td < 2 ? 3 : td < 3 ? 2 : 1);
          }, 0)}</p>
          <p>• Each additional color adds ~2–5 min for filament swap</p>
          <p>• <strong>Tip:</strong> Print a small test swatch (20×20mm) with your chosen filaments before committing to the full project</p>
        </CardContent>
      </Card>

      <div className="flex justify-start">
        <Button variant="outline" onClick={onBack}>← Back to Filament Selection</Button>
      </div>
    </div>
  );
}

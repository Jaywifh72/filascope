import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Download, AlertTriangle, Info } from 'lucide-react';
import { computePrinterQualityScore } from '@/lib/printer-sync-core';
import type { PrinterSyncItem } from '@/types/printer-sync';

interface Props {
  items: PrinterSyncItem[];
  selectedCount: number;
  importing: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PrinterImportProgressCard({ items, selectedCount, importing, error, onConfirm, onCancel }: Props) {
  // Compute printer-specific coverage stats
  const withPrice = items.filter(i =>
    (i.price_usd != null && i.price_usd > 0) ||
    (i.price_eur != null && i.price_eur > 0) ||
    (i.price_cad != null && i.price_cad > 0) ||
    (i.price_gbp != null && i.price_gbp > 0) ||
    (i.price_aud != null && i.price_aud > 0)
  ).length;
  const withBuildVolume = items.filter(i =>
    i.build_volume_x_mm != null && i.build_volume_y_mm != null && i.build_volume_z_mm != null
  ).length;
  const withImage = items.filter(i => i.image_url).length;
  const withConnectivity = items.filter(i => i.has_wifi != null).length;
  const avgQuality = items.length > 0
    ? Math.round(items.reduce((sum, i) => {
        const d = { ...i.extracted_data as Record<string, any>, ...i };
        return sum + computePrinterQualityScore(d);
      }, 0) / items.length)
    : 0;

  if (importing) {
    return (
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <div>
              <p className="text-sm font-medium">Importing {selectedCount} printers...</p>
              <p className="text-xs text-muted-foreground">
                Creating records, updating prices, validating data...
              </p>
            </div>
          </div>
          <Progress value={50} className="h-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="border-primary/30">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Download className="w-5 h-5 text-primary" />
            <h3 className="text-base font-semibold">Import Summary</h3>
          </div>

          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{selectedCount}</span> new printers will be created with the following data coverage:
          </p>

          {/* Coverage grid — printer-specific stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <CoverageStat label="Price" count={withPrice} total={selectedCount} tooltip="Printers with at least one regional price" />
            <CoverageStat label="Build Volume" count={withBuildVolume} total={selectedCount} tooltip="Printers with all 3 build volume dimensions" />
            <CoverageStat label="Image" count={withImage} total={selectedCount} tooltip="Printers with a product image URL" />
            <CoverageStat label="Connectivity" count={withConnectivity} total={selectedCount} tooltip="Printers with WiFi/connectivity data" />
            <div className="flex flex-col items-center justify-center rounded-md bg-muted/50 px-3 py-2">
              <span className="text-xs text-muted-foreground">Avg Quality</span>
              <span className={`text-lg font-bold ${avgQuality >= 70 ? 'text-green-500' : avgQuality >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                {avgQuality}%
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md border border-red-500/30 bg-red-500/5">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/50">
            <Info className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              Each printer will be inserted with all available specs, price records will be created for each region,
              and product URLs will be stored. This operation is safe to retry.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={onConfirm} className="gap-1.5">
              <Download className="w-4 h-4" />
              Confirm Import ({selectedCount})
            </Button>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

function CoverageStat({
  label,
  count,
  total,
  tooltip,
}: {
  label: string;
  count: number;
  total: number;
  tooltip: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const color = pct >= 90 ? 'text-green-500' : pct >= 60 ? 'text-amber-500' : 'text-red-500';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-col items-center justify-center rounded-md bg-muted/50 px-3 py-2 cursor-help">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className={`text-sm font-bold ${color}`}>
            {count}/{total}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

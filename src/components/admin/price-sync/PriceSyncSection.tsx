import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { usePrinterPriceSync } from '@/hooks/usePrinterPriceSync';
import { PriceSyncBrandSelector } from './PriceSyncBrandSelector';
import { PriceSyncSummaryCard } from './PriceSyncSummaryCard';
import { PriceSyncResultsTable } from './PriceSyncResultsTable';

export function PriceSyncSection() {
  const {
    phase,
    results,
    summary,
    error,
    syncing,
    syncBrandName,
    startSync,
    reset,
  } = usePrinterPriceSync();

  useEffect(() => {
    if (error) {
      toast({ title: 'Price Sync Error', description: error, variant: 'destructive' });
    }
  }, [error]);

  return (
    <div className="space-y-4">
      {/* Brand selector — visible when not syncing */}
      {phase === 'select' && (
        <PriceSyncBrandSelector onSyncStart={startSync} syncing={syncing} />
      )}

      {/* Syncing progress */}
      {phase === 'syncing' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="text-lg font-semibold">Syncing Prices</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Fetching current prices for {syncBrandName} from regional stores...
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  This may take a minute depending on the number of printers and regions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {phase === 'results' && (
        <>
          {/* Reset button */}
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              New Sync
            </Button>
          </div>

          {/* Summary */}
          {summary && (
            <PriceSyncSummaryCard summary={summary} brandName={syncBrandName} />
          )}

          {/* Error state */}
          {error && !summary && (
            <Card>
              <CardContent className="pt-6 text-center py-8">
                <p className="text-red-400 font-medium">Sync failed</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Results table */}
          {results.length > 0 && (
            <PriceSyncResultsTable results={results} />
          )}
        </>
      )}
    </div>
  );
}
